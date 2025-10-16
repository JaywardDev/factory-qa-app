import { db } from './db';
import { componentSource } from './component-source';
import { deriveGroupCodeAndComponentId, normalizeAccessString, transformAccessComponentSource } from './access-components';
import { deriveIdFromPanelCode, inferTypeFromGroupCode } from './panel-helpers';
import type { Panel, Project, AccessQAMetadata } from './types';

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

    const templates = new Map<string, string>();
    for (const row of componentSource) {
      const wpGuid = normalizeAccessString(row.WP_GUID).toUpperCase();
      const templateId = normalizeAccessString(row.TEMPLATE);
      if (wpGuid && templateId) {
        templates.set(wpGuid, templateId);
      }
    }

    const aggregated = transformAccessComponentSource(componentSource);

    interface AggregatedItem {
      panel_id?: string | null;
      WP_GUID: string;
      metadata?: unknown;
      [key: string]: unknown;
    }

    interface DerivedGroupAndComponent {
      groupCode: string;
      componentId?: string | undefined;
    }

    const components: Panel[] = (aggregated as AggregatedItem[]).map((item: AggregatedItem) => {
      const panelId: string = (item.panel_id || item.WP_GUID) as string;
      const { groupCode, componentId } = deriveGroupCodeAndComponentId(panelId) as DerivedGroupAndComponent;
      const inferredId: string = (componentId || deriveIdFromPanelCode(panelId) || deriveIdFromPanelCode(item.WP_GUID) || panelId) as string;
      const templateId: string | undefined = templates.get(item.WP_GUID);

      return {
      type: inferTypeFromGroupCode(groupCode),
      project_id: project.project_id,
      group_code: groupCode,
      id: inferredId,
      panel_id: panelId,
      template_id: templateId,
      metadata: Array.isArray(item.metadata) ? (item.metadata as AccessQAMetadata[]) : undefined,
      access_guid: item.WP_GUID,
      } satisfies Panel;
    });

    if (components.length > 0) {
      await db.components.bulkAdd(components);
    }    
  });
}
