export type ConfigNodeKind = "string" | "number" | "boolean" | "object" | "array" | "null";

export type ConfigNode = {
  key: string;
  path: string;
  kind: ConfigNodeKind;
  value: string | number | boolean | null;
  children: ConfigNode[];
};
