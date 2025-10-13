import type { Component } from "../lib/types";

type EW_I1E1FormProps = {
  component: Component;
};

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function renderRadioGroup(
  name: string,
  options: { value: string; label: string }[],
) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {options.map((option) => (
        <label
          key={option.value}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <input type="radio" name={name} value={option.value} />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function renderMultiSelect(name: string, options: string[]) {
  return (
    <select
      name={name}
      multiple
      style={{
        padding: 8,
        border: "1px solid #cbd5e1",
        borderRadius: 6,
        minHeight: 120,
      }}
    >
      {options.map((option) => (
        <option key={option} value={option.toLowerCase().replace(/\s+/g, "-")}>
          {option}
        </option>
      ))}
    </select>
  );
}

const internalLining = [
  "OSB15",
  "OSB22",
  "Ply UT 15",
  "Ply H3 15",
  "GIB10",
  "GIB13",
  "GIB16",
  "Other",
  "Not applicable",
];

const externalLining = [
  "Membrane",
  "Ply H3 15",
  "Ply H3 17",
  "Ply H3 19", 
  "WEATHERLINE10",
  "WEATHERLINE13",
  "GIB13",
  "GIB16",
  "Not applicable",
]

const fixingTreatment = [
  "Galvanised",
  "Stainless",
  "Ceramic Coated",
  "Other",
  "None",
];

const fixingTypes = [
  "Nails",
  "Screws",
  "Staples45",
  "Staples65",
  "None",
];

const externalFixings = [
  "OSB15/12 - Nails",
  "OSB15/12 - Screws",
  "OSB15/12 - Staples",
  "Other - Screws",
  "Other - Staples",
  "Other - Nail plates",
  "Other - Adhesives",
];

const membraneOptions = [
  "GBM Vapour barrier",
  "ProctorWrap",
  "Sisalation",
  "Sarking",
  "Blue board base",
  "Marshall tase",
  "Other",
];

export default function EW_I1E1Form({ component }: EW_I1E1FormProps) {
  return (
    <form
      style={{
        padding: 16,
        background: "#fff",
        borderRadius: 12,
        display: "grid",
        gap: 20,
      }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <h3 style={{ margin: 0 }}>EW_I1E1 External Wall QA</h3>
        <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
          Record inspection results for {component.label}. Complete the checks
          for the internal and external layers in sequence.
        </p>
      </header>

      <section style={{ display: "grid", gap: 16 }}>
        <h4 style={{ margin: 0, color: "#0f172a" }}>
          Step 1 – Framing and inside layers
        </h4>
        {[ 
          "Framing check for square",
          "Structural fixing in frame as per drawings",
          "Slings installed as per drawings",
        ].map((label, index) => (
          <label key={label} style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 500 }}>{label}</span>
            {renderRadioGroup(`step1-${index}`, yesNoOptions)}
          </label>
        ))}`
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <h4 style={{ margin: 0, color: "#0f172a" }}>
          Step 2 – Internal lining
        </h4>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Lining Type</span>
          {renderMultiSelect("internal-components", internalLining)}
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Fixings</span>
          {renderMultiSelect("internal-fixings", fixingTreatment)}
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Fixing Type</span>
          {renderMultiSelect("internal-fixing-types", fixingTypes)}
        </label>
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <h4 style={{ margin: 0, color: "#0f172a" }}>
          Step 3 – Services
        </h4>
        {[
          "Fire rated wall, use fire rated flush boxes. Do not alter flush box position without approval",
          "Conduits terminated and run to best practice as per drawings",
          "Airtightness - penetrations are sealed",
          "Fire rated wall, all penetrations treated as per drawings (i.e. gib lined or so)",
        ].map((label, index) => (
          <label key={label} style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 500 }}>{label}</span>
            {renderRadioGroup(`step2-${index}`, yesNoOptions)}
          </label>
        ))}        
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <h4 style={{ margin: 0, color: "#0f172a" }}>
          Step 4 – Insulation
        </h4>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>
            Insulation as per drawings. Tight fit, No gaps, No compression
          </span>
          {renderRadioGroup("step4-insulation", yesNoOptions)}
        </label>
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <h4 style={{ margin: 0, color: "#0f172a" }}>Step 5 – Final stage QA</h4>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>External Lining</span>
          {renderMultiSelect("external-components", externalLining)}
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>External Fixings</span>
          {renderMultiSelect("external-fixings", externalFixings)}
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Services – final fix</span>
          {renderRadioGroup("step3-services", yesNoOptions)}
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Membranes as per specification</span>
          {renderMultiSelect("membranes", membraneOptions)}
        </label>        
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>
            Deviation from standard method, team or manufacturer specification
          </span>
          <textarea
            name="deviation-notes"
            rows={3}
            placeholder="Describe any deviations"
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              resize: "vertical",
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Comments</span>
          <textarea
            name="comments"
            rows={3}
            placeholder="Add additional comments"
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              resize: "vertical",
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Sign off from Shift Leader</span>
          <input
            type="text"
            name="shift-leader-signoff"
            placeholder="Enter name or signature reference"
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
            }}
          />
        </label>
      </section>

      <button
        type="submit"
        style={{
          justifySelf: "flex-start",
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: "#0ea5e9",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Save QA Record
      </button>
    </form>
  );
}