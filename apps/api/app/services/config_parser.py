from __future__ import annotations

from pathlib import PurePosixPath
from typing import Any

from app.services.config_types import ConfigNode
from app.services.github_client import FileContent, GitHubClientError
from app.services.parsers.resolver import resolve_parser


def parse_config(file_content: FileContent) -> Any:
    raw_content = file_content["content"]
    parser = resolve_parser(file_content["path"])

    try:
        return parser.parse(raw_content)
    except Exception as exc:
        raise GitHubClientError(
            f"Could not parse {file_content['path']}: {exc}",
            status_code=422,
        ) from exc


def build_config_tree(file_content: FileContent) -> ConfigNode:
    parsed = parse_config(file_content)
    return normalize_config(key=PurePosixPath(file_content["path"]).name, value=parsed, path="$")


def normalize_config(key: str, value: Any, path: str) -> ConfigNode:
    if isinstance(value, dict):
        children = [
            normalize_config(
                key=str(child_key),
                value=child_value,
                path=f"{path}.{child_key}" if path != "$" else f"$.{child_key}",
            )
            for child_key, child_value in value.items()
        ]
        return {
            "key": key,
            "path": path,
            "kind": "object",
            "value": None,
            "children": children,
        }

    if isinstance(value, list):
        children = [
            normalize_config(
                key=f"[{index}]",
                value=child_value,
                path=f"{path}[{index}]",
            )
            for index, child_value in enumerate(value)
        ]
        return {
            "key": key,
            "path": path,
            "kind": "array",
            "value": None,
            "children": children,
        }

    if isinstance(value, bool):
        return {"key": key, "path": path, "kind": "boolean", "value": value, "children": []}

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return {"key": key, "path": path, "kind": "number", "value": float(value), "children": []}

    if value is None:
        return {"key": key, "path": path, "kind": "null", "value": None, "children": []}

    return {"key": key, "path": path, "kind": "string", "value": str(value), "children": []}
