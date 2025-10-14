import { useEffect, useState } from "react";
import { db } from "../lib/db";
import type { Project, Panel, PanelType } from "../lib/types";

export default function ComponentList({
  project, type, onPickComponent, onBack
}: {
  project: Project;
  type: PanelType;
  onPickComponent: (c: Panel)=>void;
  onBack: ()=>void;
}) {
  const [items, setItems] = useState<Panel[]>([]);

  useEffect(() => {
    (async () => {
      const panels = await db.components
        .where({ project_id: project.project_id, type })
        .toArray();

      const sorted = panels.sort((a, b) => {
        const groupComparison = a.group_code.localeCompare(b.group_code);
        if (groupComparison !== 0) {
          return groupComparison;
        }
        return a.id.localeCompare(b.id);
      });

      setItems(sorted);
    })();
  }, [project.project_id, type]);

  return (
    <div className="card">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <h2 style={{margin:0}}>Components — {type.toUpperCase()}</h2>
        <button className="btn" onClick={onBack}>← Back</button>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {items.map(c => (
          <button
            key={`${c.group}-${c.panel_id}`}
            className="btn"
            style={{textAlign:'left'}}
            onClick={()=> onPickComponent(c)}>
            <div style={{fontWeight:600}}>{c.group}</div>
            <div style={{color:'#475569'}}>{c.panel_id}</div>
          </button>
        ))}
        {items.length === 0 && <div style={{color:'#64748b'}}>No components.</div>}
      </div>
    </div>
  );
}
