import type { MouseEventHandler } from "react";

type Props = {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export default function ExportButton({ onClick }: Props) {
  return (
    <button className="btn accent" type="button" onClick={onClick}>
      <span className="btn-dot" aria-hidden="true" />
      Export ZIP
    </button>
  );
}
