export default function ExportButton() {
  return <button
    style={{padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc'}}
    onClick={() => alert('Export coming soon')}
  >
    Export ZIP
  </button>;
}
