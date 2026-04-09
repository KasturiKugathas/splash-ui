from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from dataclasses import asdict, dataclass
from typing import TypedDict
from urllib import error, parse, request

from fastapi import HTTPException, Request, Response

from app.services.github_client import GitHubClientError, get_authenticated_user

SESSION_COOKIE = "splash_ui_session"
STATE_COOKIE = "splash_ui_oauth_state"
NEXT_COOKIE = "splash_ui_post_login_next"


class AuthConfigError(RuntimeError):
    pass


class AuthenticatedUser(TypedDict):
    login: str
    name: str
    avatar_url: str
    html_url: str


@dataclass(frozen=True)
class AuthConfig:
    github_client_id: str
    github_client_secret: str
    session_secret: str
    github_api_base_url: str
    web_base_url: str
    api_base_url: str
    github_scopes: str


@dataclass
class AuthSession:
    session_id: str
    access_token: str
    user: AuthenticatedUser


SESSIONS: dict[str, AuthSession] = {}


def get_auth_config() -> AuthConfig:
    github_client_id = os.environ.get("GITHUB_OAUTH_CLIENT_ID", "").strip()
    github_client_secret = os.environ.get("GITHUB_OAUTH_CLIENT_SECRET", "").strip()
    session_secret = os.environ.get("SPLASH_UI_SESSION_SECRET", "").strip()

    missing = [
        name
        for name, value in (
            ("GITHUB_OAUTH_CLIENT_ID", github_client_id),
            ("GITHUB_OAUTH_CLIENT_SECRET", github_client_secret),
            ("SPLASH_UI_SESSION_SECRET", session_secret),
        )
        if not value
    ]
    if missing:
        raise AuthConfigError(f"Missing auth environment variables: {', '.join(missing)}")

    return AuthConfig(
        github_client_id=github_client_id,
        github_client_secret=github_client_secret,
        session_secret=session_secret,
        github_api_base_url=os.environ.get("GITHUB_API_BASE_URL", "https://api.github.com").rstrip("/"),
        web_base_url=os.environ.get("SPLASH_UI_WEB_BASE_URL", "http://localhost:3000").rstrip("/"),
        api_base_url=os.environ.get("SPLASH_UI_API_BASE_URL", "http://localhost:8000").rstrip("/"),
        github_scopes=os.environ.get("GITHUB_OAUTH_SCOPES", "repo read:user").strip() or "repo read:user",
    )


def _is_secure_base_url(url: str) -> bool:
    return parse.urlparse(url).scheme == "https"


def _sign_value(secret: str, value: str) -> str:
    return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


def _normalize_next_path(next_path: str | None) -> str:
    if not next_path:
        return "/app"
    if not next_path.startswith("/") or next_path.startswith("//"):
        return "/app"
    return next_path


def build_github_redirect(next_path: str | None = None) -> tuple[str, str, AuthConfig]:
    config = get_auth_config()
    nonce = secrets.token_urlsafe(24)
    redirect_uri = f"{config.api_base_url}/auth/github/callback"
    authorize_url = (
        "https://github.com/login/oauth/authorize?"
        + parse.urlencode(
            {
                "client_id": config.github_client_id,
                "redirect_uri": redirect_uri,
                "scope": config.github_scopes,
                "state": nonce,
            }
        )
    )
    return authorize_url, nonce, config


def set_login_state_cookies(response: Response, state: str, config: AuthConfig, next_path: str | None) -> None:
    secure = _is_secure_base_url(config.api_base_url)
    response.set_cookie(
        key=STATE_COOKIE,
        value=f"{state}.{_sign_value(config.session_secret, state)}",
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
        max_age=600,
    )
    response.set_cookie(
        key=NEXT_COOKIE,
        value=_normalize_next_path(next_path),
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
        max_age=600,
    )


def exchange_github_code(code: str) -> str:
    config = get_auth_config()
    payload = parse.urlencode(
        {
            "client_id": config.github_client_id,
            "client_secret": config.github_client_secret,
            "code": code,
            "redirect_uri": f"{config.api_base_url}/auth/github/callback",
        }
    ).encode("utf-8")
    req = request.Request(
        "https://github.com/login/oauth/access_token",
        data=payload,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "splash-ui-local-dev",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            data = response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise GitHubClientError(
            f"GitHub token exchange failed with status {exc.code}: {detail}",
            status_code=exc.code,
        ) from exc
    except error.URLError as exc:
        raise GitHubClientError(f"Could not reach GitHub OAuth endpoint: {exc.reason}", status_code=502) from exc

    parsed = parse.parse_qs(data)
    if "access_token" in parsed:
        return parsed["access_token"][0]
    if "error_description" in parsed:
        raise GitHubClientError(parsed["error_description"][0], status_code=400)
    raise GitHubClientError("GitHub OAuth response did not include an access token.", status_code=502)


def create_session(access_token: str) -> AuthSession:
    user = get_authenticated_user(access_token)
    session = AuthSession(
        session_id=secrets.token_urlsafe(32),
        access_token=access_token,
        user=user,
    )
    SESSIONS[session.session_id] = session
    return session


def set_session_cookie(response: Response, session: AuthSession) -> None:
    config = get_auth_config()
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session.session_id,
        httponly=True,
        samesite="lax",
        secure=_is_secure_base_url(config.api_base_url),
        path="/",
        max_age=60 * 60 * 24 * 7,
    )


def clear_auth_cookies(response: Response) -> None:
    for cookie_name in (SESSION_COOKIE, STATE_COOKIE, NEXT_COOKIE):
        response.delete_cookie(cookie_name, path="/")


def pop_session(request: Request) -> None:
    session_id = request.cookies.get(SESSION_COOKIE)
    if session_id:
        SESSIONS.pop(session_id, None)


def require_auth_session(request: Request) -> AuthSession:
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        raise HTTPException(status_code=401, detail="Sign in with GitHub to continue.")

    session = SESSIONS.get(session_id)
    if session is None:
        raise HTTPException(status_code=401, detail="Your session expired. Sign in again.")

    return session


def get_auth_status(request: Request) -> dict[str, object]:
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        return {"authenticated": False, "user": None}

    session = SESSIONS.get(session_id)
    if session is None:
        return {"authenticated": False, "user": None}

    return {"authenticated": True, "user": asdict(session)["user"]}


def validate_oauth_state(request: Request, state: str) -> str:
    config = get_auth_config()
    raw_cookie = request.cookies.get(STATE_COOKIE, "")
    if "." not in raw_cookie:
        raise HTTPException(status_code=400, detail="Missing OAuth state.")

    expected_state, signature = raw_cookie.split(".", 1)
    expected_signature = _sign_value(config.session_secret, expected_state)
    if not hmac.compare_digest(signature, expected_signature) or state != expected_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state.")

    return _normalize_next_path(request.cookies.get(NEXT_COOKIE))
