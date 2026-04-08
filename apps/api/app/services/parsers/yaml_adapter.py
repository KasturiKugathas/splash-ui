from __future__ import annotations

from typing import Any

import yaml


class YamlParserAdapter:
    name = "yaml"
    supported_extensions = (".yaml", ".yml")

    def parse(self, content: str) -> Any:
        return yaml.safe_load(content)

    def serialize(self, value: Any) -> str:
        return yaml.safe_dump(value, sort_keys=False)
