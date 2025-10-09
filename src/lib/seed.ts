import { db } from './db';
import type { Project, Deck, Component } from './types';

const uuid = () => crypto.randomUUID();

export async function seedIfEmpty() {
  // ensure a project
  let p = (await db.projects.toArray())[0];
  if (!p) {
    p = {
      project_id: uuid(),
      project_code: '230041',
      project_name: 'Alpine Homes',
      status: 'active',
      start_date: new Date().toISOString().slice(0,10),
    } satisfies Project;
    await db.projects.add(p);
  }

  // if no decks for this project, create them
  const deckCount = await db.decks.where({ project_id: p.project_id }).count();
  if (deckCount === 0) {
    const deck01: Deck = { id: uuid(), project_id: p.project_id, name: 'Deck 01' };
    const deck02: Deck = { id: uuid(), project_id: p.project_id, name: 'Deck 02' };

    const comps: Component[] = [
      { id: uuid(), deck_id: deck01.id, type: 'ew', label: 'EW_0001' },
      { id: uuid(), deck_id: deck01.id, type: 'ew', label: 'EW_0002' },
      { id: uuid(), deck_id: deck01.id, type: 'iw', label: 'IW_1004' },
      { id: uuid(), deck_id: deck02.id, type: 'mf', label: 'MF_0004' },
      { id: uuid(), deck_id: deck02.id, type: 'r',  label: 'R_0005'  },
    ];

    await db.transaction('rw', db.decks, db.components, async () => {
      await db.decks.bulkAdd([deck01, deck02]);
      await db.components.bulkAdd(comps);
    });
  }
}
