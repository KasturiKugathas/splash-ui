# Config Parser Interface

Phase 3 standardizes the config parsing layer behind a parse/serialize contract so the editor can work against a consistent normalized tree.

## Contract

Each parser adapter implements:

- `name`: human-readable parser id
- `supported_extensions`: tuple of file extensions handled by the adapter
- `parse(content: str) -> Any`: convert raw file content into a Python object graph
- `serialize(value: Any) -> str`: convert an object graph back into a file string

## Current Adapters

- `JsonParserAdapter`: parses and serializes `.json`
- `YamlParserAdapter`: parses and serializes `.yaml` / `.yml`
- `XmlParserAdapter`: parses `.xml` and exposes a serialize stub until persistence is wired

## Resolver

`resolve_parser(path)` maps a file extension to the correct adapter and rejects unsupported formats before config normalization starts.

## Normalized Node Shape

The editor consumes a normalized tree with this shape:

```ts
type ConfigNode = {
  key: string;
  path: string;
  kind: "string" | "number" | "boolean" | "object" | "array" | "null";
  value: string | number | boolean | null;
  children: ConfigNode[];
};
```

This shape is language-agnostic and stable across parser implementations.
