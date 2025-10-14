import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Project, Panel } from './types';

class QAAppDB extends Dexie {
  projects!: Table<Project, string>;
  components!: Table<Panel, [string, string, string]>; // ⬅ add

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
  }
}

export const db = new QAAppDB();
