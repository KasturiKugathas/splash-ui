from __future__ import annotations

from io import StringIO
from typing import Any

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap, CommentedSeq
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

    def serialize_round_trip(self, original_content: str, value: Any) -> str:
        yaml_rt = YAML()
        yaml_rt.preserve_quotes = True
        yaml_rt.width = 4096
        document = yaml_rt.load(original_content)
        merged_document = _merge_value(document, value)

        stream = StringIO()
        yaml_rt.dump(merged_document, stream)
        return stream.getvalue()


def _merge_value(original: Any, updated: Any) -> Any:
    if isinstance(original, CommentedMap) and isinstance(updated, dict):
        for key, updated_value in updated.items():
            if key in original:
                original[key] = _merge_value(original[key], updated_value)
            else:
                original[key] = updated_value
        return original

    if isinstance(original, CommentedSeq) and isinstance(updated, list):
        for index, updated_value in enumerate(updated):
            if index < len(original):
                original[index] = _merge_value(original[index], updated_value)
            else:
                original.append(updated_value)
        return original

    if isinstance(updated, str) and isinstance(original, str):
        return type(original)(updated)

    return updated
