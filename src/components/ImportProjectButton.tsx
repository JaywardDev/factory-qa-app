import { useMemo, useState, type ChangeEventHandler } from 'react';
import Modal from './Modal';
import {
    analyzeImportFile,
    commitImport,
    type ImportAnalysis,
    type ImportCommitResult,
} from '../lib/importer';

const formatStatus = (status?: string | null) => {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const IssueList = ({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: ImportAnalysis['errors'];
  tone: 'error' | 'warning';
}) => {
  if (!issues.length) return null;
  return (
    <div className={`import-issues import-issues--${tone}`}>
      <h4>{title}</h4>
      <ul>
        {issues.map((issue, idx) => (
          <li key={`${tone}-${idx}`}>
            <strong>{issue.path ?? '—'}:</strong> {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function ImportProjectButton() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);

  const fileName = selectedFile?.name ?? 'No file chosen';

  const previewComponents = useMemo(
    () => analysis?.normalizedComponents.slice(0, 5) ?? [],
    [analysis?.normalizedComponents],
  );

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setAnalysis(null);
    setValidateError(null);
    setCommitError(null);
    setCommitResult(null);
    setDryRun(true);
  };

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setAnalysis(null);
    setCommitResult(null);
    setValidateError(null);
    setCommitError(null);
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      setValidateError('Please choose a .json file to validate.');
      return;
    }

    setIsValidating(true);
    setCommitResult(null);
    setCommitError(null);

    try {
      const content = await selectedFile.text();
      const result = analyzeImportFile(content);
      setAnalysis(result);
      setValidateError(null);
      setDryRun(true);
    } catch (error) {
      setAnalysis(null);
      setValidateError(
        error instanceof Error ? error.message : 'Failed to read selected file.',
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!analysis || analysis.errors.length > 0 || !analysis.normalizedProject) {
      return;
    }

    setIsCommitting(true);
    setCommitError(null);

    try {
      const result = await commitImport(analysis);
      setCommitResult(result);
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : 'Failed to import project.');
    } finally {
      setIsCommitting(false);
    }
  };

  const canConfirm =
    !!analysis &&
    analysis.errors.length === 0 &&
    !!analysis.normalizedProject &&
    !dryRun &&
    !isCommitting;

  const projectSummary = analysis?.normalizedProject;

  return (
    <>
      <button className="btn ghost" onClick={() => setOpen(true)}>
        Import Project
      </button>
      <Modal open={open} onClose={handleClose}>
        <div className="import-modal">
          <div className="modal-head">
            <h2 style={{ margin: 0 }}>Import Project</h2>
            <button className="btn" onClick={handleClose}>
              ✕ Close
            </button>
          </div>

          <div className="import-section">
            <label className="import-file-picker">
              <span>Select a .json file</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
              />
            </label>
            <p className="import-file-name" aria-live="polite">
              {fileName}
            </p>
            <div className="import-actions">
              <button className="btn" onClick={handleValidate} disabled={isValidating}>
                {isValidating ? 'Validating…' : 'Validate'}
              </button>
              <label className="import-dry-run">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />
                Dry-run (no data written)
              </label>
            </div>
            {validateError && <p className="import-error">{validateError}</p>}
          </div>

          {analysis && (
            <div className="import-preview">
              <div className="import-summary card">
                <h3>Project Summary</h3>
                {projectSummary ? (
                  <dl>
                    <div>
                      <dt>Project Code</dt>
                      <dd>{projectSummary.project_code}</dd>
                    </div>
                    <div>
                      <dt>Name</dt>
                      <dd>{projectSummary.project_name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{formatStatus(projectSummary.status)}</dd>
                    </div>
                    <div>
                      <dt>Project ID</dt>
                      <dd>{projectSummary.project_id}</dd>
                    </div>
                  </dl>
                ) : (
                  <p>No valid project found in file.</p>
                )}
              </div>

              <div className="import-summary card">
                <h3>Component Overview</h3>
                <p>
                  {analysis.stats.uniqueComponents} component(s) ready to import, {analysis.stats.duplicateComponents}{' '}
                  duplicate(s) skipped from file, {analysis.stats.totalComponents} total in source.
                </p>
                {previewComponents.length > 0 ? (
                  <table className="import-preview-table">
                    <thead>
                      <tr>
                        <th>Group</th>
                        <th>Panel ID</th>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Template</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewComponents.map((component, idx) => (
                        <tr key={`${component.group_code}-${component.id}-${idx}`}>
                          <td>{component.group_code}</td>
                          <td>{component.panel_id ?? '—'}</td>
                          <td>{component.id}</td>
                          <td>{component.type.toUpperCase()}</td>
                          <td>{component.template_id ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No components available to preview.</p>
                )}
              </div>

              <div className="import-issues-grid">
                <IssueList title="Errors" tone="error" issues={analysis.errors} />
                <IssueList title="Warnings" tone="warning" issues={analysis.warnings} />
              </div>
            </div>
          )}

          <div className="import-footer">
            {commitError && <p className="import-error">{commitError}</p>}
            {commitResult && (
              <div className="import-result" role="status">
                <strong>Import complete.</strong>
                <p>
                  {commitResult.projectInserted
                    ? 'Project created. '
                    : commitResult.projectUpdated
                    ? 'Project updated. '
                    : ''}
                  Inserted {commitResult.insertedComponents} component(s), skipped {commitResult.skippedComponents} duplicate(s).
                </p>
              </div>
            )}
            <div className="import-footer-actions">
              <button className="btn ghost" onClick={handleClose} disabled={isCommitting}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={handleConfirm}
                disabled={!canConfirm}
              >
                {isCommitting ? 'Importing…' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}