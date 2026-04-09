"use client";

import type { ConfigNode } from "../../lib/config-node";
import ConfigSection from "./config-section";
import KeyValueRow from "./key-value-row";

function updateNode(nodes: ConfigNode[], targetPath: string, nextValue: ConfigNode["value"]): ConfigNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return { ...node, value: nextValue };
    }

    if (node.children.length === 0) {
      return node;
    }

    return { ...node, children: updateNode(node.children, targetPath, nextValue) };
  });
}

function renderScalarNode(node: ConfigNode, onChange: (path: string, value: ConfigNode["value"]) => void) {
  if (node.kind === "string" || node.kind === "null") {
    return (
      <KeyValueRow key={node.path} hint={node.path} label={node.key}>
        <input
          className="field"
          onChange={(event) => onChange(node.path, event.target.value)}
          type="text"
          value={typeof node.value === "string" ? node.value : ""}
        />
      </KeyValueRow>
    );
  }

  if (node.kind === "number") {
    return (
      <KeyValueRow key={node.path} hint={node.path} label={node.key}>
        <input
          className="field"
          onChange={(event) => onChange(node.path, event.target.value === "" ? null : Number(event.target.value))}
          type="number"
          value={typeof node.value === "number" ? node.value : ""}
        />
      </KeyValueRow>
    );
  }

  if (node.kind === "boolean") {
    return (
      <KeyValueRow key={node.path} hint={node.path} label={node.key}>
        <label
          className="surface-muted"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
          }}
        >
          <input
            checked={Boolean(node.value)}
            onChange={(event) => onChange(node.path, event.target.checked)}
            type="checkbox"
          />
          <span>{node.value ? "Enabled" : "Disabled"}</span>
        </label>
      </KeyValueRow>
    );
  }

  return null;
}

function renderNode(node: ConfigNode, onChange: (path: string, value: ConfigNode["value"]) => void) {
  if (node.kind === "object") {
    return (
      <ConfigSection
        key={node.path}
        description={`${node.children.length} nested field${node.children.length === 1 ? "" : "s"}`}
        title={node.key}
      >
        {node.children.map((child) => renderNode(child, onChange))}
      </ConfigSection>
    );
  }

  if (node.kind === "array") {
    return (
      <ConfigSection
        key={node.path}
        description={`${node.children.length} item${node.children.length === 1 ? "" : "s"}`}
        title={node.key}
      >
        {node.children.length === 0 ? (
          <div className="empty-state">
            <strong>No items</strong>
            <span>No array values are currently present.</span>
          </div>
        ) : (
          node.children.map((child) => renderNode(child, onChange))
        )}
      </ConfigSection>
    );
  }

  return renderScalarNode(node, onChange);
}

export default function ConfigTreeRenderer({
  node,
  onNodeChange,
}: {
  node: ConfigNode;
  onNodeChange: (nextTree: ConfigNode) => void;
}) {
  const handleChange = (targetPath: string, nextValue: ConfigNode["value"]) => {
    onNodeChange({
      ...node,
      children: updateNode(node.children, targetPath, nextValue),
    });
  };

  return <div className="stack-lg">{node.children.map((child) => renderNode(child, handleChange))}</div>;
}
