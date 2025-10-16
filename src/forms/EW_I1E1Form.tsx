import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import type { Panel } from "../lib/types";

type EW_I1E1FormProps = {
  component: Panel;
};

type StepConfig = {
  title: string;
  render: () => ReactNode;
  signOffLabel: string;
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
          style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
      }}>
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
  const steps = useMemo<StepConfig[]>(
    () => [
      {
        title: "Step 1 – Framing and inside layers",
        render: () => (
          <div style={{ display: "grid", gap: 16 }}>
            {[
              "Framing check for square",
              "Structural fixing in frame as per drawings",
              "Slings installed as per drawings",
            ].map((label, index) => (
              <label key={label} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                {renderRadioGroup(`step1-check-${index}`, yesNoOptions)}
              </label>
            ))}
          </div>
        ),
        signOffLabel: "Step 1 completed by",
      },
      {
        title: "Step 2 – Internal lining",
        render: () => (
          <div style={{ display: "grid", gap: 16 }}>
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
          </div>
        ),
        signOffLabel: "Step 2 completed by",
      },
      {
        title: "Step 3 – Services",
        render: () => (
          <div style={{ display: "grid", gap: 16 }}>
            {[
              "Fire rated wall, use fire rated flush boxes. Do not alter flush box position without approval",
              "Conduits terminated and run to best practice as per drawings",
              "Airtightness - penetrations are sealed",
              "Fire rated wall, all penetrations treated as per drawings (i.e. gib lined or so)",
            ].map((label, index) => (
              <label key={label} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                {renderRadioGroup(`step3-check-${index}`, yesNoOptions)}
              </label>
            ))}
          </div>
        ),
        signOffLabel: "Step 3 completed by",
      },
      {
        title: "Step 4 – Insulation",
        render: () => (
          <div style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>
                Insulation as per drawings. Tight fit, No gaps, No compression
              </span>
              {renderRadioGroup("step4-insulation", yesNoOptions)}
            </label>
          </div>
        ),
        signOffLabel: "Step 4 completed by",
      },
      {
        title: "Step 5 – Final stage QA",
        render: () => (
          <div style={{ display: "grid", gap: 16 }}>
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
              {renderRadioGroup("step5-services", yesNoOptions)}
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>Membranes as per specification</span>
              {renderMultiSelect("membranes", membraneOptions)}
            </label>
          </div>
        ),
        signOffLabel: "Step 5 completed by",
      },
      {
        title: "Step 6 – Sign-off",
        render: () => (
          <div style={{ display: "grid", gap: 16 }}>
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
          </div>
        ),
        signOffLabel: "Final sign-off (Shift Leader)",
      },
    ],
    [],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [signOffs, setSignOffs] = useState<string[]>(
    () => Array(steps.length).fill(""),
  );
  const [signOffErrors, setSignOffErrors] = useState<boolean[]>(
    () => Array(steps.length).fill(false),
  );
  const [photos, setPhotos] = useState<(string | null)[]>(
    () => Array(steps.length).fill(null),
  );
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentConfig = steps[currentStep];

  const handleNextStep = () => {
    if (!signOffs[currentStep]?.trim()) {
      setSignOffErrors((prev) => {
        const next = [...prev];
        next[currentStep] = true;
        return next;
      });
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSignOffChange = (value: string) => {
    setSignOffs((prev) => {
      const next = [...prev];
      next[currentStep] = value;
      return next;
    });
    setSignOffErrors((prev) => {
      const next = [...prev];
      next[currentStep] = false;
      return next;
    });
  };

  const handlePhotoInput = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = typeof reader.result === "string" ? reader.result : null;
        return next;
      });
    };
    reader.readAsDataURL(file);

    // reset input so the same file can be selected again if needed
    event.target.value = "";
  };

  const clearPhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!signOffs[steps.length - 1]?.trim()) {
      event.preventDefault();
      setSignOffErrors((prev) => {
        const next = [...prev];
        next[steps.length - 1] = true;
        return next;
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 16,
        background: "#fff",
        borderRadius: 12,
        display: "grid",
        gap: 24,
      }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <h3 style={{ margin: 0 }}>{component.panel_id ?? component.id} QA</h3>
        <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
          Record inspection results for {component.panel_id ?? component.id}.
          Complete the checks for the internal and external layers in sequence.
        </p>
        <p style={{ margin: 0, color: "#0f172a", fontWeight: 500 }}>
          Step {currentStep + 1} of {steps.length}
        </p>
      </header>

      <section style={{ display: "grid", gap: 20 }}>
        <h4 style={{ margin: 0, color: "#0f172a" }}>{currentConfig.title}</h4>
        {currentConfig.render()}
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <input
              ref={(element) => {
                fileInputRefs.current[currentStep] = element;
              }}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => handlePhotoInput(currentStep, event)}
              style={{ display: "none" }}
            />
            <div style={{ display: "grid", gap: 8 }}>
              <button
                type="button"
                onClick={() => fileInputRefs.current[currentStep]?.click()}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #0ea5e9",
                  background: "#e0f2fe",
                  color: "#0369a1",
                  fontWeight: 600,
                  cursor: "pointer",
                  justifySelf: "start",
                }}
              >
                {photos[currentStep] ? "Retake photo" : "Take photo"}
              </button>
              {photos[currentStep] && (
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: 12,
                    background: "#f8fafc",
                  }}
                >
                  <img
                    src={photos[currentStep] ?? undefined}
                    alt={`Step ${currentStep + 1} capture`}
                    style={{
                      width: "100%",
                      maxHeight: 200,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => clearPhoto(currentStep)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#0f172a",
                      cursor: "pointer",
                      justifySelf: "start",
                    }}
                  >
                    Remove photo
                  </button>
                </div>
              )}
            </div>
          </div>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 500 }}>{currentConfig.signOffLabel}</span>
            <input
              type="text"
              name={`step-${currentStep + 1}-signoff`}
              value={signOffs[currentStep]}
              onChange={(event) => handleSignOffChange(event.target.value)}
              placeholder="Enter name or signature reference"
              style={{
                width: "100%",
                padding: 8,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
              }}
            />
          </label>
          {signOffErrors[currentStep] && (
            <span style={{ color: "#dc2626", fontSize: 13 }}>
              Sign-off is required before continuing.
            </span>
          )}
        </div>      
      </section>

      <div style={{ display: "flex", gap: 12 }}>         

        {currentStep > 0 && (
          <button
            type="button"
            onClick={handlePreviousStep}
            style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 600,
                cursor: "pointer",
            }}>
            Previous   
            </button>
        )}

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNextStep}
            style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#0ea5e9",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
            }}>
            Next Step
          </button>
        ) : (
            <button
              type="submit"
              style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#0ea5e9",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
              }}>
              Save QA Record
            </button>
        )}
        </div>
    </form>
  );
}