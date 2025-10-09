import { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/db';
import type { Project, QAForm, QAItem } from '../lib/types';

const uuid = () => crypto.randomUUID();

export default function QAFormEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [forms, setForms] = useState<QAForm[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [checkpoint, setCheckpoint] = useState<string>('');
  const [items, setItems] = useState<QAItem[]>([]);

  // load data on mount
  useEffect(() => {
    (async () => {
      const [p, f] = await Promise.all([db.projects.toArray(), db.qa_forms.toArray()]);
      setProjects(p);
      setForms(f.sort((a,b)=> a.created_at < b.created_at ? 1 : -1));
      if (p[0]) setProjectId(p[0].project_id);
    })();
  }, []);

  const addItem = () => {
    if (!checkpoint.trim()) return;
    setItems(prev => [
      ...prev,
      {
        item_id: uuid(),
        form_id: 'temp',
        checkpoint_text: checkpoint.trim(),
        result: 'na',
        timestamp: new Date().toISOString(),
      }
    ]);
    setCheckpoint('');
  };

  const canSave = useMemo(() => projectId && items.length > 0, [projectId, items]);

  const saveDraft = async () => {
    if (!canSave) return;

    const form: QAForm = {
      form_id: uuid(),
      project_id: projectId,
      created_at: new Date().toISOString(),
      status: 'draft',
    };

    const payload = items.map(i => ({ ...i, form_id: form.form_id }));

    await db.transaction('rw', db.qa_forms, db.qa_items, async () => {
      await db.qa_forms.add(form);
      await db.qa_items.bulkAdd(payload);
    });

    // refresh UI
    const f = await db.qa_forms.toArray();
    setForms(f.sort((a,b)=> a.created_at < b.created_at ? 1 : -1));
    setItems([]);
    alert('Draft saved locally ✅');
  };

  return (
    <div style={{padding: 12, background: '#fff', borderRadius: 8}}>
      <h2 style={{marginTop: 0}}>New QA Form</h2>

      <label style={{display:'block', fontSize:12, color:'#475569'}}>Project</label>
      <select
        value={projectId}
        onChange={e=> setProjectId(e.target.value)}
        style={{padding:8, border:'1px solid #cbd5e1', borderRadius:6, marginBottom:12}}
      >
        {projects.map(p => (
          <option key={p.project_id} value={p.project_id}>
            {p.project_code} {p.project_name ? `— ${p.project_name}` : ''}
          </option>
        ))}
      </select>

      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <input
          placeholder="Add checkpoint text (e.g., Dimensions within tolerance)"
          value={checkpoint}
          onChange={e=> setCheckpoint(e.target.value)}
          style={{flex:1, padding:8, border:'1px solid #cbd5e1', borderRadius:6}}
        />
        <button onClick={addItem} style={{padding:'8px 12px', border:'1px solid #cbd5e1', borderRadius:6}}>
          + Add
        </button>
      </div>

      {items.length > 0 && (
        <ul style={{margin:'8px 0 12px', paddingLeft:18}}>
          {items.map(i => (
            <li key={i.item_id}>
              {i.checkpoint_text} <em style={{color:'#64748b'}}>({i.result.toUpperCase()})</em>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={saveDraft}
        disabled={!canSave}
        style={{
          padding:'8px 12px',
          borderRadius:6,
          background: canSave ? '#0284c7' : '#94a3b8',
          color:'#fff',
          border:'none',
          cursor: canSave ? 'pointer' : 'not-allowed'
        }}
      >
        Save Draft
      </button>

      {!canSave && (
        <div style={{color:'#64748b', fontSize:12, marginTop:6}}>
            Select a project and add at least one checkpoint to enable Save Draft.
        </div>
      )}

      <hr style={{margin:'16px 0'}} />

      <h3 style={{margin:'8px 0'}}>Recent Forms</h3>
      {forms.length === 0 ? (
        <div style={{color:'#64748b'}}>No forms yet.</div>
      ) : (
        <ul style={{paddingLeft:18}}>
          {forms.map(f => (
            <li key={f.form_id}>
              Form {f.form_id.slice(0,8)} — {new Date(f.created_at).toLocaleString()} — <strong>{f.status}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
