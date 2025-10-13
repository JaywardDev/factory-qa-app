import { useEffect, useState } from "react";
import { db } from "../lib/db";
import type { Project, Component as Comp } from "../lib/types";

export default function ProjectHome({
  onPickComponent,
}: {
  onPickComponent: (c: Comp) => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [componentsByGroup, setCBG] = useState<Record<string, Comp[]>>({});

  useEffect(() => {
    (async () => {
      const p = (await db.projects.toArray())[0] ?? null;
      setProject(p);
      if (!p) return;
      const comps = await db.components.where({ project_id: p.project_id }).toArray();
      const grouped: Record<string, Comp[]> = {};
      for (const comp of comps) {
        if (!grouped[comp.group_code]) {
          grouped[comp.group_code] = [];
        }
        grouped[comp.group_code].push(comp);
      }
      setCBG(grouped);
    })();
  }, []);

  if (!project) return <div>Loading project…</div>;

return (
  <div className="card">
    <h2 style={{marginTop:0}}>
      Project: {project.project_code} — {project.project_name ?? ""}
    </h2>

    <div className="section">
      <div className="deck-grid">
        {Object.entries(componentsByGroup)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, comps]) => (
            <div key={group} className="card">
              <h3>{group}</h3>
              <div className="chips">
                {comps
                  .sort((a, b) => a.panel_id.localeCompare(b.panel_id))
                  .map((c) => (
                    <button
                      key={c.id}
                      className="chip"
                      title={`${c.type.toUpperCase()} ${c.panel_id}`}
                      onClick={() => onPickComponent(c)}
                    >
                      {c.type.toUpperCase()} {c.panel_id}
                    </button>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);
}
