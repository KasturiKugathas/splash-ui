from __future__ import annotations

from pathlib import PurePosixPath

from app.services.github_client import GitHubClientError
from app.services.parsers.base import ParserAdapter
from app.services.parsers.json_adapter import JsonParserAdapter
from app.services.parsers.xml_adapter import XmlParserAdapter
from app.services.parsers.yaml_adapter import YamlParserAdapter

ADAPTERS: tuple[ParserAdapter, ...] = (
    JsonParserAdapter(),
    YamlParserAdapter(),
    XmlParserAdapter(),
)


def resolve_parser(path: str) -> ParserAdapter:
    suffix = PurePosixPath(path).suffix.lower()
    for adapter in ADAPTERS:
        if suffix in adapter.supported_extensions:
            return adapter

    raise GitHubClientError(f"Unsupported config format for {path}.", status_code=400)
