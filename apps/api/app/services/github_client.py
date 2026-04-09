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


class AuthenticatedGitHubUser(TypedDict):
    login: str
    name: str
    avatar_url: str
    html_url: str


SUPPORTED_EXTENSIONS = {".json", ".yaml", ".yml", ".xml"}


@dataclass(frozen=True)
class GitHubConfig:
    api_base_url: str


def _get_config() -> GitHubConfig:
    api_base_url = os.environ.get("GITHUB_API_BASE_URL", "https://api.github.com").rstrip("/")
    return GitHubConfig(api_base_url=api_base_url)


def _resolve_token(token: str | None) -> str:
    resolved_token = (token or "").strip()
    if resolved_token:
        return resolved_token

    raise GitHubClientError(
        "Sign in with GitHub to continue.",
        status_code=401,
    )


def _request_json(
    path: str,
    query: dict[str, str] | None = None,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
    token: str | None = None,
) -> Any:
    config = _get_config()
    resolved_token = _resolve_token(token)
    url = f"{config.api_base_url}{path}"
    if query:
        url = f"{url}?{parse.urlencode(query)}"

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {resolved_token}",
            "Content-Type": "application/json",
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
            raise GitHubClientError("Your GitHub session is invalid or expired. Sign in again.", status_code=401) from exc
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


def list_repos(token: str | None = None) -> list[Repository]:
    payload = _request_json("/user/repos", {"per_page": "100", "sort": "updated"}, token=token)
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


def get_repo_tree(repo_full_name: str, token: str | None = None) -> list[TreeNode]:
    owner, repo = repo_full_name.split("/", 1)
    repository = _request_json(f"/repos/{owner}/{repo}", token=token)
    branch = repository.get("default_branch") or "main"
    branch_payload = _request_json(
        f"/repos/{owner}/{repo}/branches/{parse.quote(branch, safe='')}",
        token=token,
    )
    tree_sha = branch_payload["commit"]["commit"]["tree"]["sha"]
    tree_payload = _request_json(
        f"/repos/{owner}/{repo}/git/trees/{tree_sha}",
        {"recursive": "1"},
        token=token,
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


def get_file_content(repo_full_name: str, path: str, token: str | None = None) -> FileContent:
    if not _supported_path(path):
        raise GitHubClientError("Only JSON, YAML, YML, and XML files are supported.", status_code=400)

    owner, repo = repo_full_name.split("/", 1)
    payload = _request_json(
        f"/repos/{owner}/{repo}/contents/{parse.quote(path, safe='/')}",
        token=token,
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


def get_default_branch(repo_full_name: str, token: str | None = None) -> str:
    owner, repo = repo_full_name.split("/", 1)
    repository = _request_json(f"/repos/{owner}/{repo}", token=token)
    return repository.get("default_branch") or "main"


def create_branch(
    repo_full_name: str,
    branch_name: str,
    base_branch: str | None = None,
    token: str | None = None,
) -> dict[str, str]:
    owner, repo = repo_full_name.split("/", 1)
    source_branch = base_branch or get_default_branch(repo_full_name, token=token)
    ref_payload = _request_json(
        f"/repos/{owner}/{repo}/git/ref/heads/{parse.quote(source_branch, safe='')}",
        token=token,
    )
    source_sha = ref_payload["object"]["sha"]

    try:
        created_ref = _request_json(
            f"/repos/{owner}/{repo}/git/refs",
            method="POST",
            payload={
                "ref": f"refs/heads/{branch_name}",
                "sha": source_sha,
            },
            token=token,
        )
    except GitHubClientError as exc:
        if "Reference already exists" not in str(exc):
            raise
        existing_ref = _request_json(
            f"/repos/{owner}/{repo}/git/ref/heads/{parse.quote(branch_name, safe='')}",
            token=token,
        )
        return {"name": branch_name, "sha": existing_ref["object"]["sha"]}

    return {"name": branch_name, "sha": created_ref["object"]["sha"]}


def commit_file(
    repo_full_name: str,
    path: str,
    branch_name: str,
    content: str,
    message: str,
    token: str | None = None,
) -> dict[str, str]:
    owner, repo = repo_full_name.split("/", 1)
    current_file = _request_json(
        f"/repos/{owner}/{repo}/contents/{parse.quote(path, safe='/')}",
        {"ref": branch_name},
        token=token,
    )
    response = _request_json(
        f"/repos/{owner}/{repo}/contents/{parse.quote(path, safe='/')}",
        method="PUT",
        payload={
            "message": message,
            "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
            "sha": current_file["sha"],
            "branch": branch_name,
        },
        token=token,
    )
    return {
        "commit_sha": response["commit"]["sha"],
        "content_sha": response["content"]["sha"],
    }


def create_pull_request(
    repo_full_name: str,
    branch_name: str,
    base_branch: str,
    title: str,
    body: str,
    token: str | None = None,
) -> dict[str, str]:
    owner, repo = repo_full_name.split("/", 1)
    response = _request_json(
        f"/repos/{owner}/{repo}/pulls",
        method="POST",
        payload={
            "title": title,
            "head": branch_name,
            "base": base_branch,
            "body": body,
        },
        token=token,
    )
    return {
        "number": str(response["number"]),
        "url": response["html_url"],
        "state": response["state"],
    }


def get_authenticated_user(token: str) -> AuthenticatedGitHubUser:
    payload = _request_json("/user", token=token)
    return {
        "login": payload.get("login") or "",
        "name": payload.get("name") or payload.get("login") or "",
        "avatar_url": payload.get("avatar_url") or "",
        "html_url": payload.get("html_url") or "",
    }
