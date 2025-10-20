import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Signatory } from "../lib/signatories";
import { resolveSignatory } from "../lib/signatories";

type Props = {
  actionLabel: string;
  onAuthorized: (signatory: Signatory) => void;
  onCancel: () => void;
  allowedRoles?: readonly string[];
};

export default function AuthorizationPrompt({
  actionLabel,
  onAuthorized,
  onCancel,
  allowedRoles = [],
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allowedRolesSet = useMemo(
    () => new Set(allowedRoles.map((role) => role.trim().toLowerCase())),
    [allowedRoles],
  );

  const allowedRolesLabel = useMemo(() => {
    if (allowedRoles.length === 0) {
      return "";
    }

    const uniqueRoles = [...new Set(allowedRoles.map((role) => role.trim()))].filter(
      (role) => role.length > 0,
    );
    if (uniqueRoles.length === 1) {
      return uniqueRoles[0];
    }

    const [last, ...rest] = uniqueRoles.slice().reverse();
    if (rest.length === 0) {
      return last ?? "";
    }

    const remaining = rest.slice().reverse();
    return `${remaining.join(", ")} or ${last}`;
  }, [allowedRoles]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPin = pin.trim();
    const signatory = resolveSignatory(trimmedPin);

    if (!signatory) {
      setError("Invalid PIN. Please try again.");
      return;
    }

    if (
      allowedRolesSet.size > 0 &&
      !allowedRolesSet.has(signatory.role.trim().toLowerCase())
    ) {
      setError(
        `Only ${allowedRolesLabel} ${
          allowedRolesSet.size > 1 ? "roles" : "role"
        } may authorize this action.`,
      );
      return;
    }

    setError(null);
    setPin("");
    onAuthorized(signatory);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: 360,
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>Authorization required</h2>
        <p style={{ margin: "0.25rem 0 0", color: "#475569" }}>
          Enter your 4-digit PIN to authorize access to {actionLabel}.
        </p>
        {allowedRoles.length > 0 && (
          <p style={{ margin: "0.25rem 0 0", color: "#1f2937" }}>
            Only {allowedRolesLabel} {allowedRolesSet.size > 1 ? "roles are" : "role is"} permitted
            to authorize this action.
          </p>
        )}
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span style={{ fontWeight: 600 }}>PIN</span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="••••"
          style={{
            fontSize: "1.25rem",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #cbd5f5",
            letterSpacing: "0.5ch",
            textAlign: "center",
          }}
          required
          minLength={4}
          maxLength={4}
        />
      </label>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          Authorize
        </button>
      </div>
    </form>
  );
}