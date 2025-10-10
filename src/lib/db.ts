import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Project, QAForm, QAItem, Deck, Component } from './types';

class QAAppDB extends Dexie {
  projects!: Table<Project, string>;
  qa_forms!: Table<QAForm, string>;
  qa_items!: Table<QAItem, string>;
  decks!: Table<Deck, string>;          // ⬅ add
  components!: Table<Component, string>; // ⬅ add

  constructor() {
    super('qa_app_db');
    // v1 had projects, qa_forms, qa_items
    // v2 adds decks, components
    this.version(2).stores({
      projects: 'project_id, project_code, status',
      qa_forms: 'form_id, project_id, status, created_at',
      qa_items: 'item_id, form_id, result, timestamp',
      decks: 'id, project_id, name',
      components: 'id, deck_id, type, label'
    });
  }
}

export const db = new QAAppDB();
