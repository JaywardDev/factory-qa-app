import { db } from './db';
import { componentSource } from './component-source';
import type { AccessComponentSourceRow } from './component-source';
import { deriveIdFromPanelCode, inferTypeFromGroupCode } from './panel-helpers';
import type { AccessQAMetadata, Panel, Project } from './types';

const uuid = () => crypto.randomUUID();

export async function seedIfEmpty() {
  await db.transaction('rw', db.projects, db.components, async () => {
    const projects = await db.projects.toArray();
    let project = projects[0];

    if (!project) {
      project = {
        project_id: uuid(),
        project_code: '230041',
        project_name: 'Schubert residence',
        status: 'active',
      } satisfies Project;
      await db.projects.add(project);
    } else if (projects.length > 1) {
      const duplicates = projects.slice(1).map((item) => item.project_id);
      if (duplicates.length) {
        await db.projects.bulkDelete(duplicates);
      }
    }

    if (!project) return;

    const existingComponentCount = await db.components
      .where('project_id')
      .equals(project.project_id)
      .count();

    if (existingComponentCount > 0) {
      return;
    }

    const normalizeString = (value: string | undefined | null) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    type GroupedRows = {
      wpGuid: string;
      rows: AccessComponentSourceRow[];
    };

    const grouped = new Map<string, GroupedRows>();

    for (const row of componentSource) {
      const wpGuid = normalizeString(row.WP_GUID?.toUpperCase());
      if (!wpGuid) {
        continue;
      }

      const entry = grouped.get(wpGuid);
      if (entry) {
        entry.rows.push(row);
      } else {
        grouped.set(wpGuid, {
          wpGuid: row.WP_GUID.trim(),
          rows: [row],
        });
      }
    }

    const accessRowToMetadata = (row: AccessComponentSourceRow): AccessQAMetadata => ({
      dbId: normalizeString(row.DBID),
      wpGuid: normalizeString(row.WP_GUID),
      activityGroup: normalizeString(row.ACTIVITYGROUP),
      title: normalizeString(row.TITLE),
      result: normalizeString(row.RESULT),
      photoTaken: normalizeString(row.PHOTO_TAKEN),
      signee: normalizeString(row.SIGNEE),
      timestamp: normalizeString(row.TIMESTAMP),
    });

    const rowsToComponent = ({ wpGuid, rows }: GroupedRows): Panel => {
      const groupSegments = wpGuid.split('_').filter(Boolean);
      const groupCode = groupSegments.length > 1 ? groupSegments.slice(0, -1).join('_') : wpGuid;
      const id = deriveIdFromPanelCode(wpGuid) ?? wpGuid;
      const templateRow = rows.find((row) => normalizeString(row.TEMPLATE));
      const templateId = normalizeString(templateRow?.TEMPLATE);

      return {
        type: inferTypeFromGroupCode(groupCode),
        project_id: project.project_id,
        group_code: groupCode,
        id,
        panel_id: wpGuid,
        template_id: templateId,
        metadata: rows.map(accessRowToMetadata),
      } satisfies Panel;
    };

    const components = Array.from(grouped.values()).map(rowsToComponent);

    if (components.length > 0) {
      await db.components.bulkAdd(components);
    }    
  });
}
