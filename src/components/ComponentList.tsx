import { useEffect, useState } from "react";
import { db } from "../lib/db";
import type { Project, Component as Comp, ComponentType } from "../lib/types";

export default function ComponentList({
  project, type, onPickComponent, onBack
}: {
  project: Project;
  type: ComponentType;
  onPickComponent: (c: Comp)=>void;
  onBack: ()=>void;
}) {
  const [items, setItems] = useState<Comp[]>([]);

  useEffect(() => {
    (async () => {
      const decks = await db.decks.where({ project_id: project.project_id }).toArray();
      const all: Comp[] = [];
      for (const d of decks) {
        all.push(...await db.components.where({ deck_id: d.id }).toArray());
      }
      setItems(all.filter(x => x.type === type).sort((a,b)=> a.label.localeCompare(b.label)));
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
          <button key={c.id} className="btn" style={{textAlign:'left'}}
            onClick={()=> onPickComponent(c)}>
            {c.label}
          </button>
        ))}
        {items.length === 0 && <div style={{color:'#64748b'}}>No components.</div>}
      </div>
    </div>
  );
}
