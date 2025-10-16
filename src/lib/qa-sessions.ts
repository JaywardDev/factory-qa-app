import { db } from "./db";
import type { Panel, QASessionRecord } from "./types";

type SessionComponent = Pick<Panel, "project_id" | "group_code" | "id" | "template_id">;

const DEFAULT_TEMPLATE_ID = "DEFAULT";

const table = () => {
  const t = (db as any).qa_sessions;
  if (!t) throw new Error('qa_sessions table missing.');
  return t as typeof db.qa_sessions;
};

const normalizeTemplateId = (templateId?: string | null) => {
  const normalized = templateId?.trim().toUpperCase();
  return normalized && normalized.length > 0 ? normalized : null;
};

export const createComponentKey = (component: SessionComponent) =>
  `${component.group_code}::${component.id}`;

export const createSessionId = (component: SessionComponent) => {
  const templateId = normalizeTemplateId(component.template_id) ?? DEFAULT_TEMPLATE_ID;
  return `${component.project_id}::${createComponentKey(component)}::${templateId}`;
};

export async function loadQASessionData<T>(component: SessionComponent): Promise<T | null> {
  const record = await db.qa_sessions.get(createSessionId(component));
  return (record?.data as T | undefined) ?? null;
}

export async function saveQASessionData<T>(
  component: SessionComponent,
  data: T,
): Promise<void> {
  const record: QASessionRecord<T> = {
    session_id: createSessionId(component),
    project_id: component.project_id,
    component_key: createComponentKey(component),
    template_id: normalizeTemplateId(component.template_id),
    data,
    updated_at: new Date().toISOString(),
  };

  await db.qa_sessions.put(record);
}

export async function clearQASession(component: SessionComponent): Promise<void> {
  await db.qa_sessions.delete(createSessionId(component));
}