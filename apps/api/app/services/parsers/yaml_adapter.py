from __future__ import annotations

from typing import Any

import yaml

BOOLEAN_LIKE_VALUES = {"true", "false", "yes", "no", "on", "off", "null", "~"}


class SplashYamlDumper(yaml.SafeDumper):
    pass


def _should_double_quote(value: str) -> bool:
    lower_value = value.lower()
    if value == "" or lower_value in BOOLEAN_LIKE_VALUES:
        return True
    if value.startswith(("#", "-", "{", "}", "[", "]", "&", "*", "!", "|", ">", "@", "`")):
        return True
    if value.strip() != value or "\n" in value:
        return True
    if value.replace(".", "", 1).isdigit():
        return True
    if value[0].isdigit() and any(character.isalpha() for character in value):
        return True
    if ": " in value:
        return True
    return False


def _represent_string(dumper: yaml.SafeDumper, value: str) -> yaml.nodes.ScalarNode:
    style = '"' if _should_double_quote(value) else None
    return dumper.represent_scalar("tag:yaml.org,2002:str", value, style=style)


SplashYamlDumper.add_representer(str, _represent_string)


class YamlParserAdapter:
    name = "yaml"
    supported_extensions = (".yaml", ".yml")

    def parse(self, content: str) -> Any:
        return yaml.safe_load(content)

    def serialize(self, value: Any) -> str:
        return yaml.dump(value, Dumper=SplashYamlDumper, sort_keys=False)
