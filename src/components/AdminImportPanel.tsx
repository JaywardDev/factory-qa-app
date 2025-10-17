import { useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import {
  formatCounts,
  getBundledSeedUrl,
  getRemoteSeedUrl,
  importBundledSeed,
  importSeedFile,
  syncFromRemote,
} from '../lib/seed';
import type { ImportResult } from '../lib/seed';

const stackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const sectionStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '1rem',
  background: '#f8fafc',
};

type Props = {
  onClose: () => void;
  onImported: () => void;
};

function resolveDisplayUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (typeof window !== 'undefined') {
    return new URL(url, window.location.origin).toString();
  }
  return url;
}

export function AdminImportPanel({ onClose, onImported }: Props) {
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const bundledUrl = useMemo(() => resolveDisplayUrl(getBundledSeedUrl()), []);
  const remoteUrl = useMemo(() => resolveDisplayUrl(getRemoteSeedUrl()), []);

  const busy = status === 'loading';

  const runImport = async (task: () => Promise<ImportResult>) => {
    setStatus('loading');
    setMessage('Import in progress…');
    try {
      const result = await task();
      setLastResult(result);
      const countsText = formatCounts(result) || '0 records';
      setMessage(`Imported ${countsText}${result.source ? ` from ${result.source}` : ''}.`);
      setStatus('success');
      onImported();
    } catch (error) {
      setStatus('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Failed to import data.');
      }
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await runImport(() => importSeedFile(file, { clearExisting: replaceExisting }));
    event.target.value = '';
  };

  const handleBundledImport = async () => {
    await runImport(() => importBundledSeed({ clearExisting: replaceExisting }));
  };

  const handleRemoteSync = async () => {
    await runImport(() => syncFromRemote({ clearExisting: replaceExisting }));
  };

  return (
    <div style={stackStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>Data import &amp; sync</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>
            Populate the local IndexedDB with bundled samples or remote JSON snapshots.
          </p>
        </div>
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(event) => setReplaceExisting(event.target.checked)}
        />
        <span>Replace existing records before importing</span>
      </label>

      <div style={{ ...sectionStyle }}>
        <h3 style={{ marginTop: 0 }}>Import a JSON file</h3>
        <p style={{ marginTop: 0, color: '#475569' }}>
          Select a JSON backup exported from the app or generated offline. The importer accepts the
          same structure as the bundled <code>seed-data.json</code> file.
        </p>
        <input
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          disabled={busy}
        />
      </div>

      <div style={{ ...sectionStyle }}>
        <h3 style={{ marginTop: 0 }}>Reload the bundled seed</h3>
        <p style={{ marginTop: 0, color: '#475569' }}>
          Use this when you need to reset the demo database back to the packaged sample at
          <code style={{ marginLeft: 4 }}>{bundledUrl}</code>.
        </p>
        <button type="button" className="btn" onClick={handleBundledImport} disabled={busy}>
          Load bundled seed
        </button>
      </div>

      <div style={{ ...sectionStyle }}>
        <h3 style={{ marginTop: 0 }}>Sync from remote API</h3>
        <p style={{ marginTop: 0, color: '#475569' }}>
          Fetch the latest snapshot from <code>{remoteUrl}</code> while online. Configure a different
          endpoint with <code>VITE_REMOTE_SEED_URL</code>.
        </p>
        <button type="button" className="btn" onClick={handleRemoteSync} disabled={busy}>
          Sync now
        </button>
      </div>

      {status !== 'idle' && (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 12,
            background: status === 'error' ? '#fee2e2' : '#dcfce7',
            color: status === 'error' ? '#b91c1c' : '#166534',
          }}
        >
          {message}
          {lastResult && status === 'success' && lastResult.counts && (
            <div style={{ marginTop: '0.5rem', color: 'inherit' }}>
              Imported: {formatCounts(lastResult) || '0 records'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminImportPanel;