from __future__ import annotations

import json
from typing import Any


class JsonParserAdapter:
    name = "json"
    supported_extensions = (".json",)

    def parse(self, content: str) -> Any:
        return json.loads(content)

    def serialize(self, value: Any) -> str:
        return json.dumps(value, indent=2, ensure_ascii=True)
