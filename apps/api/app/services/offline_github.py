"""In-process GitHub response fixtures for the loopback development API."""

import base64
from pathlib import Path
from urllib.parse import unquote

from app.services.github_client import GitHubClientError

_REPOSITORY = "splash-demo/inventory-service"
_REPO_PATH = f"/repos/{_REPOSITORY}"
_FIXTURE_ROOT = Path(__file__).resolve().parents[1] / "fixtures" / "sample-repository"
_FILES = ("config/service.json", "config/worker.yaml")
_REPO = {
    "id": 1,
    "name": "inventory-service",
    "owner": {"login": "splash-demo"},
    "full_name": _REPOSITORY,
    "default_branch": "main",
    "description": "Sample inventory service with JSON and YAML settings for offline development.",
}


def fixture_response(path: str, method: str) -> object:
    if method != "GET":
        raise GitHubClientError("GitHub writes are unavailable in offline development mode.", status_code=403)

    if path == "/user/repos":
        return [_REPO]
    if path == _REPO_PATH:
        return _REPO
    if path == f"{_REPO_PATH}/branches/main":
        return {"commit": {"commit": {"tree": {"sha": "sample-tree"}}}}
    if path == f"{_REPO_PATH}/git/trees/sample-tree":
        return {"tree": [{"path": name, "type": "blob"} for name in _FILES]}

    content_prefix = f"{_REPO_PATH}/contents/"
    if path.startswith(content_prefix):
        filename = unquote(path[len(content_prefix):])
        if filename in _FILES:
            content = (_FIXTURE_ROOT / filename).read_bytes()
            return {"content": base64.b64encode(content).decode("ascii"), "encoding": "base64"}

    raise GitHubClientError("Sample repository or file not found.", status_code=404)
