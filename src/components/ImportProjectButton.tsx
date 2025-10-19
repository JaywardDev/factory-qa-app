type Props = {
  onClick: () => void;
};

export default function ImportProjectButton({ onClick }: Props) {
  return (
    <button className="btn ghost" type="button" onClick={onClick}>
      Import / Sync
    </button>
  );
}