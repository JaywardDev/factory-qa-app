export default function ExportButton() {
  return (
    <button className="btn accent" onClick={() => alert('Export coming soon')}>
      <span className="btn-dot" aria-hidden="true" />
      Export ZIP
    </button>
  );
}
