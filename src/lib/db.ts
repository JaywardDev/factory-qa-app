import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Project, Panel } from './types';

class QAAppDB extends Dexie {
  projects!: Table<Project, string>;
  components!: Table<Panel, [string, string, string]>; // ⬅ add

  constructor() {
    super('qa_app_db');
    // v1 only tracked projects
    // v2 added decks + components
    // v3 removes decks and moves components under projects with Access-style grouping
    this.version(2).stores({
      projects: 'project_id, project_code, status',
      decks: 'id, project_id, name',
      components: 'id, deck_id, type, label'
    });

    this.version(3)
      .stores({
        projects: 'project_id, project_code, status',
        qa_forms: 'form_id, project_id, status, created_at',
        qa_items: 'item_id, form_id, result, timestamp',
        decks: null,
        components: 'id, project_id, type, group_code, panel_id'
      })
      .upgrade(async (tx) => {
        // Clear incompatible v2 component data; new seed will repopulate
        await tx.table('components').clear();
      });

    this.version(4)
      .stores({
        projects: 'project_id, project_code, status',
        qa_forms: 'form_id, project_id, status, created_at',
        qa_items: 'item_id, form_id, result, timestamp',
        components: '[project_id+group_code+id], project_id, group_code, id, type, template_id'
      })
      .upgrade(async (tx) => {
        await tx.table('components').clear();
      });
  }
}

export const db = new QAAppDB();
