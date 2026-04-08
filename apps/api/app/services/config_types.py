from __future__ import annotations

from typing import Literal, TypedDict

ConfigNodeKind = Literal["string", "number", "boolean", "object", "array", "null"]


class ConfigNode(TypedDict):
    key: str
    path: str
    kind: ConfigNodeKind
    value: str | float | bool | None
    children: list["ConfigNode"]
