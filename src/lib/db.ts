import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Project, QAForm, QAItem } from './types';

class QAAppDB extends Dexie {
  projects!: Table<Project, string>;
  qa_forms!: Table<QAForm, string>;
  qa_items!: Table<QAItem, string>;

  constructor() {
    super('qa_app_db');
    this.version(1).stores({
      projects: 'project_id, project_code, status',
      qa_forms: 'form_id, project_id, status, created_at',
      qa_items: 'item_id, form_id, result, timestamp',
    });
  }
}

export const db = new QAAppDB();
