import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/db";
import type { Project, Panel, PanelType} from "../lib/types";
import { TYPE_LABEL } from "../lib/types";

export default function CategoryBoard({
  project,
  onPickCategory,
  onBack,
}: {
  project: Project;
  onPickCategory: (t: PanelType) => void;
  onBack: () => void;
}) {
  const [comps, setComps] = useState<Panel[]>([]);

  useEffect(() => {
    (async () => {
      const all = await db.components.where({ project_id: project.project_id }).toArray();
      setComps(all);
    })();
  }, [project.project_id]);

  const counts = useMemo(() => {
    const base = Object.keys(TYPE_LABEL).reduce((acc, key) => {
      acc[key as PanelType] = 0;
      return acc;
    }, {} as Record<PanelType, number>);

    for (const panel of comps) {
      const type = panel.type as PanelType;
      if (type in base) {
        base[type] += 1;
      }
    }
    return base;
  }, [comps]);

  const cats = (Object.keys(counts) as PanelType[])
    .filter(t => counts[t] > 0);

  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
        <h2 style={{marginTop:0, marginBottom:0}}>
          {project.project_code} — {project.project_name ?? ''}
        </h2>
        {onBack && (
          <button type="button" className="btn" onClick={onBack}>
            ← Back
          </button>
        )}
      </div>
      <div className="deck-grid">
        {cats.map(t => (
          <button key={t} className="card btn"
            onClick={()=> onPickCategory(t)}
            style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:700}}>{TYPE_LABEL[t]}</div>
            <div className="chip">{counts[t]} items</div>
          </button>
        ))}
      </div>
    </div>
  );
}
