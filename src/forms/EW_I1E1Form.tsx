import type { Component } from "../lib/types";

type EW_I1E1FormProps = {
  component: Component;
};

export default function EW_I1E1Form({ component }: EW_I1E1FormProps) {
  return (
    <form
      style={{
        padding: 12,
        background: "#fff",
        borderRadius: 8,
        display: "grid",
        gap: 12,
      }}
    >
      <h3 style={{ margin: 0 }}>EW_I1E1 External Wall QA</h3>
      <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
        Record inspection results for {component.label}. Placeholder fields
        illustrate the template specific layout.
      </p>

      <label style={{ display: "grid", gap: 4 }}>
        Panel Orientation
        <select
          defaultValue=""
          style={{ padding: 8, border: "1px solid #cbd5e1", borderRadius: 6 }}
        >
          <option value="" disabled>
            Select orientation
          </option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        Fixings Checked
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="radio" name="fixings" value="pass" /> Pass
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="radio" name="fixings" value="fail" /> Fail
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="radio" name="fixings" value="na" /> N/A
          </label>
        </div>
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        Notes
        <textarea
          rows={4}
          placeholder="Add inspection notes"
          style={{
            width: "100%",
            padding: 8,
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            resize: "vertical",
          }}
        />
      </label>

      <button
        type="submit"
        style={{
          justifySelf: "flex-start",
          padding: "8px 16px",
          borderRadius: 6,
          border: "none",
          background: "#0ea5e9",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Save Placeholder
      </button>
    </form>
  );
}