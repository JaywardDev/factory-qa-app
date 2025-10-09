import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/db";
import type { Project, Component as Comp, ComponentType } from "../lib/types";
import { TYPE_LABEL } from "../lib/types";

export default function CategoryBoard({
  project, onPickCategory
}: {
  project: Project;
  onPickCategory: (t: ComponentType) => void;
}) {
  const [comps, setComps] = useState<Comp[]>([]);

  useEffect(() => {
    (async () => {
      // fetch all components for this project via its decks
      const decks = await db.decks.where({ project_id: project.project_id }).toArray();
      const all: Comp[] = [];
      for (const d of decks) {
        all.push(...await db.components.where({ deck_id: d.id }).toArray());
      }
      setComps(all);
    })();
  }, [project.project_id]);

  const counts = useMemo(() => {
    const c: Record<ComponentType, number> = { ew:0, iw:0, mf:0, r:0, other:0 };
    for (const x of comps) c[(x.type as ComponentType) ?? 'other']++;
    return c;
  }, [comps]);

  const cats = (Object.keys(counts) as ComponentType[])
    .filter(t => counts[t] > 0);

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>
        {project.project_code} — {project.project_name ?? ''}
      </h2>
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
