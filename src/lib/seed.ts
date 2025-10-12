import { db } from './db';
import type { Project, Deck, Component } from './types';

const uuid = () => crypto.randomUUID();

export async function seedIfEmpty() {
  await db.transaction('rw', db.projects, db.decks, db.components, async () => {
    const projects = await db.projects.toArray();
    let project = projects[0];

    if (!project) {
      project = {
        project_id: uuid(),
        project_code: '230041',
        project_name: 'Alpine Homes',
        status: 'active',
        start_date: new Date().toISOString().slice(0, 10),
      } satisfies Project;
      await db.projects.add(project);
    } else if (projects.length > 1) {
      const duplicates = projects.slice(1).map((item) => item.project_id);
      if (duplicates.length) {
        await db.projects.bulkDelete(duplicates);
      }
    }

    if (!project) {
      return;
    }

    const deckCount = await db.decks.where({ project_id: project.project_id }).count();
    if (deckCount === 0) {
      const deck01: Deck = { id: uuid(), project_id: project.project_id, name: 'Deck 01' };
      const deck02: Deck = { id: uuid(), project_id: project.project_id, name: 'Deck 02' };

      const comps: Component[] = [
      {
        id: uuid(),
        deck_id: deck01.id,
        type: 'ew',
        label: 'EW_0001',
        template_id: 'EW_I1E1',
      },
        { id: uuid(), deck_id: deck01.id, type: 'ew', label: 'EW_0002' },
        { id: uuid(), deck_id: deck01.id, type: 'iw', label: 'IW_1004' },
        { id: uuid(), deck_id: deck02.id, type: 'mf', label: 'MF_0004' },
        { id: uuid(), deck_id: deck02.id, type: 'r', label: 'R_0005' },
      ];


      await db.decks.bulkAdd([deck01, deck02]);
      await db.components.bulkAdd(comps);
    }
  });
}
