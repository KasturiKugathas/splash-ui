from __future__ import annotations

import xml.etree.ElementTree as ET
from io import StringIO
from typing import Any


class XmlParserAdapter:
    name = "xml"
    supported_extensions = (".xml",)

    def parse(self, content: str) -> Any:
        element = ET.parse(StringIO(content)).getroot()
        return {element.tag: self._element_to_object(element)}

    def serialize(self, value: Any) -> str:
        return "<!-- XML serialize stub: persistence is not wired yet -->"

    def _element_to_object(self, element: ET.Element) -> Any:
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
            grouped_children.setdefault(child.tag, []).append(self._element_to_object(child))

        normalized_children: dict[str, Any] = {}
        for child_tag, values in grouped_children.items():
            normalized_children[child_tag] = values[0] if len(values) == 1 else values

        text = (element.text or "").strip()
        if text:
            normalized_children["#text"] = text

        return {**attributes, **normalized_children}
