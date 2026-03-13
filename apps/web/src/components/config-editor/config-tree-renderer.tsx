"use client";

import ConfigSection from "./config-section";
import KeyValueRow from "./key-value-row";
import type { ConfigNode } from "../../lib/config-node";

function inputStyle() {
  return {
    width: "100%",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--line)",
    padding: "10px 12px",
    background: "var(--panel-strong)",
  };
}

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
      <KeyValueRow key={node.path} label={node.key} hint={node.path}>
        <input
          onChange={(event) => onChange(node.path, event.target.value)}
          style={inputStyle()}
          type="text"
          value={typeof node.value === "string" ? node.value : ""}
        />
      </KeyValueRow>
    );
  }

  if (node.kind === "number") {
    return (
      <KeyValueRow key={node.path} label={node.key} hint={node.path}>
        <input
          onChange={(event) => onChange(node.path, event.target.value === "" ? null : Number(event.target.value))}
          style={inputStyle()}
          type="number"
          value={typeof node.value === "number" ? node.value : ""}
        />
      </KeyValueRow>
    );
  }

  if (node.kind === "boolean") {
    return (
      <KeyValueRow key={node.path} label={node.key} hint={node.path}>
        <label style={toggleStyles.shell}>
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
        title={node.key}
        description={`${node.children.length} nested field${node.children.length === 1 ? "" : "s"}`}
      >
        {node.children.map((child) => renderNode(child, onChange))}
      </ConfigSection>
    );
  }

  if (node.kind === "array") {
    return (
      <ConfigSection
        key={node.path}
        title={node.key}
        description={`${node.children.length} item${node.children.length === 1 ? "" : "s"}`}
      >
        {node.children.length === 0 ? (
          <div style={emptyStyles}>No array items available.</div>
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

  return <div style={styles.root}>{node.children.map((child) => renderNode(child, handleChange))}</div>;
}

const styles = {
  root: {
    display: "grid",
    gap: 14,
  },
};

const toggleStyles = {
  shell: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--line)",
    background: "var(--panel-strong)",
  },
};

const emptyStyles = {
  padding: "10px 12px",
  color: "var(--muted)",
  border: "1px dashed var(--line)",
  borderRadius: "var(--radius-md)",
};
