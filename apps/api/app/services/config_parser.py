from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from io import StringIO
from pathlib import PurePosixPath
from typing import Any, Literal, TypedDict

import yaml

from app.services.github_client import FileContent, GitHubClientError

ConfigNodeKind = Literal["string", "number", "boolean", "object", "array", "null"]


class ConfigNode(TypedDict):
    key: str
    path: str
    kind: ConfigNodeKind
    value: str | float | bool | None
    children: list["ConfigNode"]


def parse_config(file_content: FileContent) -> Any:
    suffix = PurePosixPath(file_content["path"]).suffix.lower()
    raw_content = file_content["content"]

    try:
        if suffix == ".json":
            return json.loads(raw_content)
        if suffix in {".yaml", ".yml"}:
            return yaml.safe_load(raw_content)
        if suffix == ".xml":
            element = ET.parse(StringIO(raw_content)).getroot()
            return {element.tag: _xml_to_object(element)}
    except (json.JSONDecodeError, yaml.YAMLError, ET.ParseError) as exc:
        raise GitHubClientError(
            f"Could not parse {file_content['path']}: {exc}",
            status_code=422,
        ) from exc

    raise GitHubClientError(
        f"Unsupported config format for {file_content['path']}.",
        status_code=400,
    )


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


def _xml_to_object(element: ET.Element) -> Any:
    attributes = {f"@{key}": value for key, value in element.attrib.items()}
    child_elements = list(element)

    if not child_elements:
        text = (element.text or "").strip()
        if attributes and text:
            return {**attributes, "#text": text}
        if attributes:
            return attributes
        return text

    grouped_children: dict[str, list[Any]] = {}
    for child in child_elements:
        grouped_children.setdefault(child.tag, []).append(_xml_to_object(child))

    normalized_children: dict[str, Any] = {}
    for child_tag, values in grouped_children.items():
        normalized_children[child_tag] = values[0] if len(values) == 1 else values

    text = (element.text or "").strip()
    if text:
        normalized_children["#text"] = text

    return {**attributes, **normalized_children}
