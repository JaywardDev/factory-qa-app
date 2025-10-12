import { useEffect, useState } from "react";
import { db } from "../lib/db";
import type { Project } from "../lib/types";

type Props = {
  onPick: (project: Project) => void;
  ready: boolean;
};

export default function ProjectList({ onPick, ready }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const rows = await db.projects.toArray();
      if (!active) return;
      setProjects(rows);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Projects</h2>
      {loading ? (
        <div>Loading projects…</div>
      ) : projects.length === 0 ? (
        <div>No projects found.</div>
      ) : (
        <div className="deck-grid">
          {projects.map((project) => (
            <button
              key={project.project_id}
              className="card btn"
              onClick={() => onPick(project)}
              style={{ textAlign: "left" }}
            >
              <div style={{ fontWeight: 700 }}>{project.project_code}</div>
              {project.project_name && (
                <div style={{ color: "#64748b" }}>{project.project_name}</div>
              )}
              {project.status && (
                <div className="chip" style={{ marginTop: 12, display: "inline-block" }}>
                  {project.status}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}