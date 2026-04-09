from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.auth import AuthSession, require_auth_session
from app.services.github_client import (
    GitHubClientError,
    get_file_content,
    get_repo_tree,
    list_repos,
)

router = APIRouter(tags=["repositories"])


@router.get("/repos")
def repos(session: AuthSession = Depends(require_auth_session)) -> list[dict[str, object]]:
    try:
        return list_repos(token=session.access_token)
    except GitHubClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/tree")
def tree(
    repo: str = Query(..., min_length=1),
    session: AuthSession = Depends(require_auth_session),
) -> list[dict[str, object]]:
    try:
        return get_repo_tree(repo, token=session.access_token)
    except GitHubClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/file")
def file_content(
    repo: str = Query(..., min_length=1),
    path: str = Query(..., min_length=1),
    session: AuthSession = Depends(require_auth_session),
) -> dict[str, str]:
    try:
        return get_file_content(repo, path, token=session.access_token)
    except GitHubClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
