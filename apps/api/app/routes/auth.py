from fastapi import APIRouter, Query, Response

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/email/request-link")
def request_email_link(email: str) -> dict[str, str]:
    return {
        "message": "Email login link requested (placeholder)",
        "email": email,
    }


@router.post("/email/verify")
def verify_email_link(token: str) -> dict[str, str]:
    return {
        "message": "Email token verified (placeholder)",
        "token": token,
    }


@router.get("/github/start")
def github_start() -> dict[str, str]:
    return {
        "redirect_url": "https://github.com/login/oauth/authorize?client_id=REPLACE_ME",
        "message": "GitHub OAuth start (placeholder)",
    }


@router.get("/github/callback")
def github_callback(code: str = Query(..., min_length=1)) -> dict[str, str]:
    return {
        "message": "GitHub OAuth callback received (placeholder)",
        "code": code,
    }


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("splash_ui_session")
    return {"message": "Logged out (placeholder)"}
