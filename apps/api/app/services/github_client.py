from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import Any, TypedDict
from urllib import error, parse, request


class GitHubClientError(RuntimeError):
    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.status_code = status_code


class Repository(TypedDict):
    id: str
    name: str
    owner: str
    full_name: str
    default_branch: str
    visibility: str
    description: str


class TreeNode(TypedDict):
    id: str
    name: str
    path: str
    type: str
    children: list["TreeNode"]


class FileContent(TypedDict):
    repository: str
    path: str
    encoding: str
    language: str
    content: str


SUPPORTED_EXTENSIONS = {".json", ".yaml", ".yml", ".xml"}


@dataclass(frozen=True)
class GitHubConfig:
    token: str
    api_base_url: str


def _get_config() -> GitHubConfig:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise GitHubClientError(
            "Set GITHUB_TOKEN before starting the API so Splash-UI can read your repositories.",
            status_code=500,
        )

    api_base_url = os.environ.get("GITHUB_API_BASE_URL", "https://api.github.com").rstrip("/")
    return GitHubConfig(token=token, api_base_url=api_base_url)


def _request_json(path: str, query: dict[str, str] | None = None) -> Any:
    config = _get_config()
    url = f"{config.api_base_url}{path}"
    if query:
        url = f"{url}?{parse.urlencode(query)}"

    req = request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {config.token}",
            "User-Agent": "splash-ui-local-dev",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            return json.load(response)
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        if exc.code == 401:
            raise GitHubClientError("GITHUB_TOKEN is invalid or expired.", status_code=401) from exc
        if exc.code == 403:
            raise GitHubClientError(
                "GitHub denied access. Check token scopes and repository permissions.",
                status_code=403,
            ) from exc
        if exc.code == 404:
            raise GitHubClientError("Requested repository or file was not found.", status_code=404) from exc
        raise GitHubClientError(
            f"GitHub API request failed with status {exc.code}: {detail}",
            status_code=exc.code,
        ) from exc
    except error.URLError as exc:
        raise GitHubClientError(f"Could not reach GitHub API: {exc.reason}", status_code=502) from exc


def _language_from_path(path: str) -> str:
    suffix = PurePosixPath(path).suffix.lower()
    if suffix == ".json":
        return "json"
    if suffix in {".yaml", ".yml"}:
        return "yaml"
    if suffix == ".xml":
        return "xml"
    return "text"


def _supported_path(path: str) -> bool:
    return PurePosixPath(path).suffix.lower() in SUPPORTED_EXTENSIONS


def list_repos() -> list[Repository]:
    payload = _request_json("/user/repos", {"per_page": "100", "sort": "updated"})
    repositories: list[Repository] = []

    for repo in payload:
        owner = repo.get("owner") or {}
        repositories.append(
            {
                "id": str(repo["id"]),
                "name": repo["name"],
                "owner": owner.get("login", ""),
                "full_name": repo["full_name"],
                "default_branch": repo.get("default_branch") or "main",
                "visibility": "private" if repo.get("private") else "public",
                "description": repo.get("description") or "No description provided.",
            }
        )

    return repositories


def get_repo_tree(repo_full_name: str) -> list[TreeNode]:
    owner, repo = repo_full_name.split("/", 1)
    repository = _request_json(f"/repos/{owner}/{repo}")
    branch = repository.get("default_branch") or "main"
    branch_payload = _request_json(f"/repos/{owner}/{repo}/branches/{parse.quote(branch, safe='')}")
    tree_sha = branch_payload["commit"]["commit"]["tree"]["sha"]
    tree_payload = _request_json(
        f"/repos/{owner}/{repo}/git/trees/{tree_sha}",
        {"recursive": "1"},
    )

    directories: dict[str, TreeNode] = {}
    root_nodes: list[TreeNode] = []

    def ensure_directory(path: str) -> TreeNode:
        existing = directories.get(path)
        if existing:
            return existing

        name = PurePosixPath(path).name if path else repo
        node: TreeNode = {
            "id": f"dir:{path or repo}",
            "name": name,
            "path": path,
            "type": "dir",
            "children": [],
        }
        directories[path] = node

        parent_path = str(PurePosixPath(path).parent)
        if path and parent_path != ".":
            ensure_directory(parent_path)["children"].append(node)
        elif path:
            root_nodes.append(node)

        return node

    for item in tree_payload.get("tree", []):
        item_path = item.get("path", "")
        item_type = item.get("type")

        if item_type == "tree":
            ensure_directory(item_path)
            continue

        if item_type != "blob" or not _supported_path(item_path):
            continue

        file_node: TreeNode = {
            "id": item.get("sha", f"file:{item_path}"),
            "name": PurePosixPath(item_path).name,
            "path": item_path,
            "type": "file",
            "children": [],
        }

        parent = str(PurePosixPath(item_path).parent)
        if parent == ".":
            root_nodes.append(file_node)
        else:
            ensure_directory(parent)["children"].append(file_node)

    def sort_nodes(nodes: list[TreeNode]) -> list[TreeNode]:
        ordered = sorted(nodes, key=lambda node: (node["type"] != "dir", node["name"].lower()))
        for node in ordered:
            if node["type"] == "dir":
                node["children"] = sort_nodes(node["children"])
        return ordered

    return sort_nodes(root_nodes)


def get_file_content(repo_full_name: str, path: str) -> FileContent:
    if not _supported_path(path):
        raise GitHubClientError("Only JSON, YAML, YML, and XML files are supported.", status_code=400)

    owner, repo = repo_full_name.split("/", 1)
    payload = _request_json(
        f"/repos/{owner}/{repo}/contents/{parse.quote(path, safe='/')}"
    )

    encoded_content = payload.get("content", "")
    encoding = payload.get("encoding", "base64")
    if encoding != "base64":
        raise GitHubClientError(f"Unsupported GitHub content encoding: {encoding}", status_code=500)

    content = base64.b64decode(encoded_content).decode("utf-8", errors="replace")
    return {
        "repository": repo_full_name,
        "path": path,
        "encoding": "utf-8",
        "language": _language_from_path(path),
        "content": content,
    }
