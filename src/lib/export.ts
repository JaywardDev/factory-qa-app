import { db } from "./db";
import type { Panel, Project } from "./types";

export type ExportPayload = {
  projects: Project[];
  components: Panel[];
};

function cloneProject(project: Project): Project {
  return { ...project };
}

function cloneComponent(component: Panel): Panel {
  const { qaItems, metadata, ...rest } = component;
  const cloned: Panel = { ...rest };

  cloned.qaItems = (qaItems ?? []).map((item) => ({ ...item }));

  if (metadata) {
    cloned.metadata = metadata.map((item) => ({ ...item }));
  }

  return cloned;
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export async function buildExportPayload(): Promise<ExportPayload> {
  if (typeof window === "undefined") {
    throw new Error("Export is only available in the browser.");
  }

  if (!db.projects || !db.components) {
    throw new Error("The database is not ready for export.");
  }

  const [projects, components] = await Promise.all([
    db.projects.toArray(),
    db.components.toArray(),
  ]);

  return {
    projects: projects.map(cloneProject),
    components: components.map(cloneComponent),
  };
}

export async function createExportBlob(): Promise<{
  blob: Blob;
  filename: string;
  payload: ExportPayload;
}> {
  const payload = await buildExportPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const filename = `factory-qa-export-${formatTimestamp(new Date())}.json`;

  return { blob, filename, payload };
}

export async function downloadExportFile(): Promise<{
  filename: string;
  payload: ExportPayload;
}> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Export is only available in the browser.");
  }

  const { blob, filename, payload } = await createExportBlob();
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }

  return { filename, payload };
}