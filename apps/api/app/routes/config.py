from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.auth import AuthSession, require_auth_session
from app.services.config_parser import build_config_tree
from app.services.github_client import GitHubClientError, get_file_content

router = APIRouter(tags=["config"])


@router.get("/config-tree")
def config_tree(
    repo: str = Query(..., min_length=1),
    path: str = Query(..., min_length=1),
    session: AuthSession = Depends(require_auth_session),
) -> dict[str, object]:
    try:
        file_content = get_file_content(repo, path, token=session.access_token)
        return {
            "repository": repo,
            "path": path,
            "tree": build_config_tree(file_content),
        }
    except GitHubClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
