from urllib import parse

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse

from app.services.auth import (
    AuthConfigError,
    build_github_redirect,
    clear_auth_cookies,
    create_session,
    exchange_github_code,
    get_auth_status,
    get_auth_config,
    pop_session,
    set_login_state_cookies,
    set_session_cookie,
    validate_oauth_state,
)
from app.services.github_client import GitHubClientError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/session")
def auth_session(request: Request) -> dict[str, object]:
    return get_auth_status(request)


@router.get("/github/start")
def github_start(next: str | None = Query(default=None)) -> RedirectResponse:
    try:
        redirect_url, state, config = build_github_redirect(next)
    except AuthConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    response = RedirectResponse(url=redirect_url, status_code=302)
    set_login_state_cookies(response, state, config, next)
    return response


@router.get("/github/callback")
def github_callback(
    request: Request,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> RedirectResponse:
    try:
        config = get_auth_config()
        next_path = validate_oauth_state(request, state or "")
        if error:
            raise HTTPException(status_code=400, detail=f"GitHub login failed: {error}")
        if not code:
            raise HTTPException(status_code=400, detail="GitHub callback did not include an authorization code.")

        access_token = exchange_github_code(code)
        session = create_session(access_token)
    except (AuthConfigError, GitHubClientError, HTTPException) as exc:
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        try:
            fallback_config = get_auth_config()
            login_url = f"{fallback_config.web_base_url}/login?error={parse.quote(detail)}"
        except AuthConfigError:
            login_url = f"http://localhost:3000/login?error={parse.quote(detail)}"

        response = RedirectResponse(url=login_url, status_code=302)
        clear_auth_cookies(response)
        return response

    response = RedirectResponse(url=f"{config.web_base_url}{next_path}", status_code=302)
    clear_auth_cookies(response)
    set_session_cookie(response, session)
    return response


@router.post("/logout")
def logout(request: Request) -> JSONResponse:
    pop_session(request)
    response = JSONResponse({"message": "Logged out"})
    clear_auth_cookies(response)
    return response
