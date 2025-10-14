import type { Panel } from "../lib/types";

export type DefaultQAFormProps = {
  component: Panel;
};

export default function DefaultQAForm({ component }: DefaultQAFormProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        padding: 16,
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        maxWidth: 520,
      }}
    >
      <h3 style={{ margin: 0 }}>QA template coming soon</h3>
      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
        {component.group} • {component.panel_id} is not yet linked to a
        specific QA template in the system. You can close this dialog and select
        another component, or add the template mapping in the registry when it
        becomes available.
      </p>
      {component.template_id && (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#64748b",
            fontFamily: "monospace",
          }}
        >
          Template ID: {component.template_id}
        </p>
      )}
    </div>
  );
}