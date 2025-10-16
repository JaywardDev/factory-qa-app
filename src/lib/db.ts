import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Project, Panel, QASessionRecord } from './types';

class QAAppDB extends Dexie {
  projects!: Table<Project, string>;
  components!: Table<Panel, [string, string, string]>;
  qa_sessions!: Table<QASessionRecord, string>;

  constructor() {
    super('qa_app_db');
    this.version(1)
      .stores({
        projects: 'project_id, project_code, status',
        qa_forms: 'form_id, project_id, status, created_at',
        qa_items: 'item_id, form_id, result, timestamp',
        components:
          '[project_id+group_code+id], project_id, group_code, id, type, template_id, [project_id+type], panel_id',
      })
      .upgrade(async (tx) => {
        await tx.table('components').clear();
      });

    this.version(2).stores({
      projects: 'project_id, project_code, status',
      qa_forms: 'form_id, project_id, status, created_at',
      qa_items: 'item_id, form_id, result, timestamp',
      components:
        '[project_id+group_code+id], project_id, group_code, id, type, template_id, [project_id+type], panel_id',
      qa_sessions:
        'session_id, project_id, component_key, template_id, updated_at, [project_id+component_key]',
    });
  }
}

//----*diagnostic purpose *-------/
// SSR guard (if you have any SSR or prerendering in your toolchain)
export const db =
  typeof window !== 'undefined'
    ? new QAAppDB()
    : ({} as unknown as QAAppDB);

// Runtime assert to catch duplicates / stale bundles fast
if (typeof window !== 'undefined') {
  // Helpful diagnostics in your console
  // @ts-ignore
  const names = (db as any).tables?.map((t: any) => t.name);
  console.log('[Dexie] tables:', names);
  // @ts-ignore
  if (!names?.includes('qa_sessions')) {
    throw new Error(
      '[Dexie] qa_sessions table missing. Ensure v3 schema is bundled, no duplicate db modules, and hard-reload/clear IDB.',
    );
  }
  // Optional: see if duplicate module paths exist
  // eslint-disable-next-line no-undef
  // @ts-ignore
  console.log('[Dexie] db module url:', import.meta?.url);
}    
