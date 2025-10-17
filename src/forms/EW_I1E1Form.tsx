import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import type { Panel } from "../lib/types";
import { resolveSignatory, type Signatory } from "../lib/signatories";
import {
  createSessionId,
  loadQASessionData,
  saveQASessionData,
} from "../lib/qa-sessions";

type EW_I1E1FormProps = {
  component: Panel;
};

type SignOffRecord = {
  pin: string;
  signatory: Signatory;
};

type ResponseValue = string | string[];

type SessionState = {
  currentStep: number;
  responses: Record<string, ResponseValue>;
  signOffPins: string[];
  signOffRecords: (SignOffRecord | null)[];
  photos: string[][];
};

const STEP_COUNT = 6;

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

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

const clampStep = (step: number) => Math.max(0, Math.min(step, STEP_COUNT - 1));

function ensureLength<T>(value: T[] | undefined, filler: T): T[] {
  const base = Array.isArray(value) ? value.slice(0, STEP_COUNT) : [];
  const result: T[] = [];

  for (let index = 0; index < STEP_COUNT; index += 1) {
    if (index < base.length && base[index] !== undefined) {
      result.push(base[index] as T);
    } else {
      result.push(filler);
    }
  }

  return result;
}

const createEmptySession = (): SessionState => ({
  currentStep: 0,
  responses: {},
  signOffPins: Array(STEP_COUNT).fill(""),
  signOffRecords: Array(STEP_COUNT).fill(null),
  photos: Array.from({ length: STEP_COUNT }, () => [] as string[]),
});

const normalizePhotos = (value: unknown): string[][] => {
  if (!Array.isArray(value)) {
    return Array.from({ length: STEP_COUNT }, () => [] as string[]);
  }

  const normalized: string[][] = [];

  for (let index = 0; index < STEP_COUNT; index += 1) {
    const entry = value[index];

    if (Array.isArray(entry)) {
      normalized.push(entry.filter((item): item is string => typeof item === "string"));
      continue;
    }

    if (typeof entry === "string" && entry) {
      normalized.push([entry]);
      continue;
    }

    normalized.push([]);
  }

  return normalized;
};

function normalizeSession(session: Partial<SessionState> | null | undefined): SessionState {
  if (!session) {
    return createEmptySession();
  }

  return {
    currentStep: clampStep(session.currentStep ?? 0),
    responses: session.responses ?? {},
    signOffPins: ensureLength(session.signOffPins, ""),
    signOffRecords: ensureLength(session.signOffRecords, null),
    photos: normalizePhotos(session.photos),
  };
}

type StepConfig = {
  title: string;
  render: () => ReactElement;
  signOffLabel: string;
};

function renderRadioGroup(
  name: string,
  options: { value: string; label: string }[],
  currentValue: string,
  onChange: (value: string) => void,
) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {options.map((option) => (
        <label key={option.value} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={currentValue === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function renderMultiSelect(
  name: string,
  options: string[],
  selectedValues: string[],
  onChange: (values: string[]) => void,
) {
  return (
    <select
      name={name}
      multiple
      value={selectedValues}
      onChange={(event) => {
        const values = Array.from(event.target.selectedOptions).map((option) => option.value);
        onChange(values);
      }}
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

export default function EW_I1E1Form({ component }: EW_I1E1FormProps) {
  const [session, setSession] = useState<SessionState>(() => createEmptySession());
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [signOffErrors, setSignOffErrors] = useState<(string | null)[]>(() =>
    Array(STEP_COUNT).fill(null),
  );
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const pendingPhotoReplacementRef = useRef<
    { stepIndex: number; photoIndex: number } | null
  >(null);

  const sessionComponent = useMemo(
    () => ({
      project_id: component.project_id,
      group_code: component.group_code,
      id: component.id,
      template_id: component.template_id,
    }),
    [component.project_id, component.group_code, component.id, component.template_id],
  );

  const sessionKey = useMemo(
    () => createSessionId(sessionComponent),
    [sessionComponent],
  );

  useEffect(() => {
    let cancelled = false;

    setSession(createEmptySession());
    setSignOffErrors(Array(STEP_COUNT).fill(null));
    setSessionLoaded(false);

    (async () => {
      try {
        const stored = await loadQASessionData<SessionState>(sessionComponent);
        if (cancelled) {
          return;
        }
        setSession(normalizeSession(stored));
      } catch (error) {
        console.error("Failed to load QA session", error);
      } finally {
        if (!cancelled) {
          setSessionLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionComponent, sessionKey]);

  useEffect(() => {
    if (!sessionLoaded) {
      return;
    }

    void saveQASessionData(sessionComponent, session).catch((error: unknown) => {
      console.error("Failed to persist QA session", error);
    });
  }, [sessionComponent, session, sessionLoaded, sessionKey]);

  const updateSession = useCallback(
    (updater: (prev: SessionState) => SessionState) => {
      setSession((prev) => updater(prev));
    },
    [],
  );

  const { currentStep, responses, signOffPins, signOffRecords, photos } = session;

  useEffect(() => {
    pendingPhotoReplacementRef.current = null;
  }, [currentStep]);

  const setCurrentStep = useCallback(
    (nextStep: number) => {
      updateSession((prev) => ({
        ...prev,
        currentStep: clampStep(nextStep),
      }));
    },
    [updateSession],
  );

  const handleResponseChange = useCallback(
    (name: string, value: ResponseValue) => {
      updateSession((prev) => ({
        ...prev,
        responses: {
          ...prev.responses,
          [name]: value,
        },
      }));
    },
    [updateSession],
  );

  const getSingleValue = useCallback(
    (name: string) => {
      const value = responses[name];
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value)) {
        return value[0] ?? "";
      }
      return "";
    },
    [responses],
  );

  const getMultiValue = useCallback(
    (name: string) => {
      const value = responses[name];
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "string" && value) {
        return [value];
      }
      return [];
    },
    [responses],
  );

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
            ].map((label, index) => {
              const name = `step1-check-${index}`;
              return (
                <label key={label} style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  {renderRadioGroup(
                    name,
                    yesNoOptions,
                    getSingleValue(name),
                    (value) => handleResponseChange(name, value),
                  )}
                </label>
              );
            })} 
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
              {renderMultiSelect(
                "internal-components",
                internalLining,
                getMultiValue("internal-components"),
                (values) => handleResponseChange("internal-components", values),
              )}
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>Fixings</span>
              {renderMultiSelect(
                "internal-fixings",
                fixingTreatment,
                getMultiValue("internal-fixings"),
                (values) => handleResponseChange("internal-fixings", values),
              )}
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>Fixing Type</span>
              {renderMultiSelect(
                "internal-fixing-types",
                fixingTypes,
                getMultiValue("internal-fixing-types"),
                (values) => handleResponseChange("internal-fixing-types", values),
              )}
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
            ].map((label, index) => {
              const name = `step3-check-${index}`;
              return (
                <label key={label} style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  {renderRadioGroup(
                    name,
                    yesNoOptions,
                    getSingleValue(name),
                    (value) => handleResponseChange(name, value),
                  )}
                </label>
              );
            })}
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
              {renderRadioGroup(
                "step4-insulation",
                yesNoOptions,
                getSingleValue("step4-insulation"),
                (value) => handleResponseChange("step4-insulation", value),
              )}
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
              {renderMultiSelect(
                "external-components",
                externalLining,
                getMultiValue("external-components"),
                (values) => handleResponseChange("external-components", values),
              )}
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>External Fixings</span>
              {renderMultiSelect(
                "external-fixings",
                externalFixings,
                getMultiValue("external-fixings"),
                (values) => handleResponseChange("external-fixings", values),
              )}
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>Services – final fix</span>
                  {renderRadioGroup(
                "step5-services",
                yesNoOptions,
                getSingleValue("step5-services"),
                (value) => handleResponseChange("step5-services", value),
              )}
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>Membranes as per specification</span>
              {renderMultiSelect(
                "membranes",
                membraneOptions,
                getMultiValue("membranes"),
                (values) => handleResponseChange("membranes", values),
              )}
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
                value={getSingleValue("comments")}
                onChange={(event) => handleResponseChange("comments", event.target.value)}
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
        signOffLabel: "Final sign-off (Shift Leader or Production Manager)",
      },
    ],
    [getMultiValue, getSingleValue, handleResponseChange],
  );

  const currentConfig = steps[currentStep];
  const currentPhotos = photos[currentStep] ?? [];

  const handleNextStep = () => {
    if (!signOffRecords[currentStep]?.signatory) {
      setSignOffErrors((prev) => {
        const next = [...prev];
        next[currentStep] = "A valid 4-digit PIN is required before continuing.";
        return next;
      });
      return;
    }

    setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const finalStepAllowedRoles = useMemo(
    () => new Set(["Shift Leader", "Production Manager"]),
    [],
  );

  const handleSignOffPinChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 4);
    
    const signatory =
      sanitized.length === 4 ? resolveSignatory(sanitized) ?? null : null;

    const isFinalStep = currentStep === steps.length - 1;
    const roleNotAllowed =
      isFinalStep && signatory && !finalStepAllowedRoles.has(signatory.role);

    const signOffRecord =
      signatory && !roleNotAllowed ? { pin: sanitized, signatory } : null;
      
    updateSession((prev) => {
      const nextPins = [...prev.signOffPins];
      nextPins[currentStep] = sanitized;

      const nextRecords = [...prev.signOffRecords];
      nextRecords[currentStep] = signOffRecord;

      return {
        ...prev,
        signOffPins: nextPins,
        signOffRecords: nextRecords,
      };
    });

    setSignOffErrors((prev) => {
      const next = [...prev];
      if (sanitized.length === 4 && !signatory) {
        next[currentStep] = "PIN not recognized. Please check and try again.";
      } else if (roleNotAllowed) {
        next[currentStep] =
          "Final sign-off must be completed by a Shift Leader or Production Manager.";
      } else {
        next[currentStep] = null;
      }
      return next;
    });
  };

  const handlePhotoInput = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      pendingPhotoReplacementRef.current = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      const replacement = pendingPhotoReplacementRef.current;

      if (!result) {
        pendingPhotoReplacementRef.current = null;
        return;
      }

      updateSession((prev) => {
        const nextPhotos = prev.photos.map((photoList, photoIndex) => {
          if (photoIndex !== index) {
            return photoList;
          }

          const existing = [...photoList];

          if (
            replacement &&
            replacement.stepIndex === index &&
            replacement.photoIndex >= 0 &&
            replacement.photoIndex < existing.length
          ) {
            const updated = [...existing];
            updated[replacement.photoIndex] = result;
            return updated;
          }

          return [...existing, result];
        });

        return {
          ...prev,
          photos: nextPhotos,
        };
      });

      pendingPhotoReplacementRef.current = null;
    };
    reader.readAsDataURL(file);
    
    event.target.value = "";
  };

  const clearPhotos = (index: number) => {
    pendingPhotoReplacementRef.current = null;
    updateSession((prev) => {
      const next = prev.photos.map((photoList, photoIndex) =>
        photoIndex === index ? [] : photoList,
      );
      return {
        ...prev,
        photos: next,
      };
    });
  };

  const removePhotoAt = (stepIndex: number, photoIndex: number) => {
    pendingPhotoReplacementRef.current = null;
    updateSession((prev) => {
      const next = prev.photos.map((photoList, index) => {
        if (index !== stepIndex) {
          return photoList;
        }

        if (photoIndex < 0 || photoIndex >= photoList.length) {
          return photoList;
        }

        return photoList.filter((_, idx) => idx !== photoIndex);
      });
      return {
        ...prev,
        photos: next,
      };
    });
  };

  const openPhotoPicker = (index: number) => {
    setTimeout(() => {
      fileInputRefs.current[index]?.click();
    }, 0);
  };

  const takeAnotherPhoto = (index: number) => {
    pendingPhotoReplacementRef.current = null;
    openPhotoPicker(index);
  };

  const replacePhotoAt = (stepIndex: number, photoIndex: number) => {
    pendingPhotoReplacementRef.current = {
      stepIndex,
      photoIndex,
    };

    openPhotoPicker(stepIndex);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!signOffRecords[steps.length - 1]?.signatory) {
      event.preventDefault();
      setSignOffErrors((prev) => {
        const next = [...prev];
        next[steps.length - 1] =
          "Final approval requires a valid 4-digit PIN.";
        return next;
      });
    }
  };

  const completedSignatures = signOffRecords
    .map((record, index) => (record ? { record, index } : null))
    .filter(
      (
        entry,
      ): entry is { record: SignOffRecord; index: number } => entry !== null,
    );
    
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
  <div style={{ display: "grid", gap: 16 }}>
    {currentConfig.render()}

    <div style={{ display: "grid", gap: 12 }}>
      {currentPhotos.length > 0 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "block", gap: 12 }}>
            {currentPhotos.map((photo, photoIndex) => (
              <div
                key={`${currentStep}-photo-${photoIndex}`}
                style={{ display: "grid", gap: 6, maxWidth: 320 }}
              >
                <img
                  src={photo}
                  alt={`Step ${currentStep + 1} photo ${photoIndex + 1}`}
                  style={{ width: "100%", borderRadius: 8, objectFit: "cover" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => replacePhotoAt(currentStep, photoIndex)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhotoAt(currentStep, photoIndex)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #fca5a5",
                      background: "#fff5f5",
                      cursor: "pointer",
                      color: "#dc2626",
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => takeAnotherPhoto(currentStep)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: "#0ea5e9",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Take Another Photo
            </button>
            <button
              type="button"
              onClick={() => clearPhotos(currentStep)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #fca5a5",
                background: "#fff5f5",
                cursor: "pointer",
                color: "#dc2626",
                fontWeight: 600,
              }}
            >
              Remove All Photos
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => openPhotoPicker(currentStep)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0ea5e9",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add Photo
          </button>
        </div>
      )}

      <input
        ref={(el) => {
          fileInputRefs.current[currentStep] = el;
        }}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handlePhotoInput(currentStep, e)}
      />
    </div>

    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontWeight: 500 }}>{currentConfig.signOffLabel}</span>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        name={`step-${currentStep + 1}-signoff-pin`}
        value={signOffPins[currentStep]}
        onChange={(event) => handleSignOffPinChange(event.target.value)}
        placeholder="Enter 4-digit PIN"
        autoComplete="one-time-code"
        maxLength={4}
        style={{
          width: "100%",
          padding: 8,
          border: "1px solid #cbd5e1",
          borderRadius: 6,
          letterSpacing: 4,
        }}
      />
    </label>

    {signOffRecords[currentStep]?.signatory && (
      <span style={{ color: "#0f172a", fontSize: 14 }}>
        Signed by {signOffRecords[currentStep]!.signatory.name} (
        {signOffRecords[currentStep]!.signatory.role})
      </span>
    )}
    {signOffErrors[currentStep] && (
      <span style={{ color: "#dc2626", fontSize: 13 }}>
        {signOffErrors[currentStep]}
      </span>
    )}
  </div>
</section>
 
      {completedSignatures.length > 0 && (
        <section
          aria-label="QA sign-off log"
          style={{
            display: "grid",
            gap: 12,
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 16,
            background: "#f8fafc",
          }}
        >
          <h4 style={{ margin: 0, color: "#0f172a" }}>QA sign-off log</h4>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: 8,
            }}
          >
            {completedSignatures.map(({ record, index }) => (
              <li
                key={`signoff-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {steps[index]!.signOffLabel}
                </span>
                <span style={{ color: "#0f172a" }}>
                  {record.signatory.name} • {record.signatory.role}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
            }}
          >
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
            }}
          >
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
            }}
          >
            Save QA Record
          </button>
        )}
        </div>
    </form>
  );
}            