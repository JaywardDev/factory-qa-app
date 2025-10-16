import { db } from './db';
import type { Project } from './types';

const uuid = () => crypto.randomUUID();

export async function seedIfEmpty() {
  await db.transaction('rw', db.projects, async () => {
    const projects = await db.projects.toArray();
    let project = projects[0];

    if (!project) {
      project = {
        project_id: uuid(),
        project_code: '230041',
        project_name: 'Alpine Residences Jacks Point — Alpine Block 4B (PS114)',
        status: 'active',
      } satisfies Project;
      await db.projects.add(project);
    } else if (projects.length > 1) {
      const duplicates = projects.slice(1).map((item) => item.project_id);
      if (duplicates.length) {
        await db.projects.bulkDelete(duplicates);
      }
    }
  });
}
