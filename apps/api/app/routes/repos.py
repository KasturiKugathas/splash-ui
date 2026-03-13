from fastapi import APIRouter, Query

from app.services.github_client import get_file_content, get_repo_tree, list_repos

router = APIRouter(tags=["repositories"])


@router.get("/repos")
def repos() -> list[dict[str, object]]:
    return list_repos()


@router.get("/tree")
def tree(repo: str = Query(..., min_length=1)) -> list[dict[str, object]]:
    return get_repo_tree(repo)


@router.get("/file")
def file_content(
    repo: str = Query(..., min_length=1),
    path: str = Query(..., min_length=1),
) -> dict[str, str]:
    return get_file_content(repo, path)
