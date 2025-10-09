import { useEffect, useState } from "react";
import { db } from "../lib/db";
import type { Project, Deck, Component as Comp } from "../lib/types";

export default function ProjectHome({
  onPickComponent,
}: {
  onPickComponent: (c: Comp) => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [componentsByDeck, setCBD] = useState<Record<string, Comp[]>>({});

  useEffect(() => {
    (async () => {
      const p = (await db.projects.toArray())[0] ?? null;
      setProject(p);
      if (!p) return;
      const ds = await db.decks.where({ project_id: p.project_id }).toArray();
      setDecks(ds);

      const map: Record<string, Comp[]> = {};
      for (const d of ds) {
        map[d.id] = await db.components.where({ deck_id: d.id }).toArray();
      }
      setCBD(map);
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
        {decks.map((d) => (
          <div key={d.id} className="card">
            <h3>{d.name}</h3>
            <div className="chips">
              {(componentsByDeck[d.id] ?? []).map((c) => (
                <button
                  key={c.id}
                  className="chip"
                  title={`${c.type.toUpperCase()} ${c.label}`}
                  onClick={() => onPickComponent(c)}
                >
                  {c.type.toUpperCase()} {c.label}
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
