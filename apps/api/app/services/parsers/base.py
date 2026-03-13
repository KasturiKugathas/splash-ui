from __future__ import annotations

from typing import Any, Protocol


class ParserAdapter(Protocol):
    name: str
    supported_extensions: tuple[str, ...]

    def parse(self, content: str) -> Any: ...

    def serialize(self, value: Any) -> str: ...
