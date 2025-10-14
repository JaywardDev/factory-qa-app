import { db } from './db';
import type { Project, Panel } from './types';

const uuid = () => crypto.randomUUID();

const componentSource: Array<{ group_code: string; panel: string; template: string }> = [
  { group_code: 'MF_1', panel: 'Bal_001', template: 'EW_I1E1' },
  { group_code: 'MF_1', panel: 'Bal_002', template: 'EW_I1E1' },
  { group_code: 'MF_1', panel: 'Bal_003', template: 'EW_I1E1' },
  { group_code: 'MF_1', panel: 'Bal_004', template: 'EW_I1E1' },
  { group_code: 'MF_1', panel: 'Bal_005', template: 'EW_I1E1' },
  { group_code: 'MF_1', panel: 'Bal_006', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0001', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0002', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0003', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0004', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0005', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0006', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0007', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0008', template: 'EW_I1E1' },
  { group_code: 'EW_0', panel: 'EW_0009', template: 'EW_I1E1' },
  { group_code: 'EW_1', panel: 'EW_1001', template: 'EW_I1E1' },
  { group_code: 'EW_1', panel: 'EW_1002', template: 'EW_I1E1' },
  { group_code: 'EW_1', panel: 'EW_1003', template: 'EW_I1E1' },
  { group_code: 'EW_1', panel: 'EW_1004', template: 'EW_I1E1' },
  { group_code: 'EW_1', panel: 'EW_1005', template: 'EW_I1E1' },
  { group_code: 'EW_1', panel: 'EW_1006', template: 'EW_I1E1' },
  { group_code: 'EW_1', panel: 'EW_1007', template: 'EW_I1E1' },
  { group_code: 'Roof', panel: 'EW_2001', template: 'EW_I1E1' },
  { group_code: 'Roof', panel: 'EW_2002', template: 'EW_I1E1' },
  { group_code: 'Roof', panel: 'EW_2003', template: 'EW_I1E1' },
  { group_code: 'Roof', panel: 'EW_2004', template: 'EW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0001', template: 'IW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0002', template: 'IW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0003', template: 'IW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0004', template: 'IW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0005', template: 'IW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0006', template: 'IW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0007', template: 'IW_I1E1' },
  { group_code: 'IW_0', panel: 'IW_0008', template: 'IW_I1E1' },
  { group_code: 'IW_0_(unit-05)', panel: 'IW_0020', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-05)', panel: 'IW_0021', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-05)', panel: 'IW_0022', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-05)', panel: 'IW_0023', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-05)', panel: 'IW_0024', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_0040', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_0041', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_0042', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_0043', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_0044', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_0045', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_0046', template: 'IW_I0E0' },
  { group_code: 'IW_1', panel: 'IW_1001', template: 'IW_I1E1' },
  { group_code: 'IW_1', panel: 'IW_1002', template: 'IW_I1E1' },
  { group_code: 'IW_1', panel: 'IW_1003', template: 'IW_I1E1' },
  { group_code: 'IW_1', panel: 'IW_1004', template: 'IW_I1E1' },
  { group_code: 'IW_1', panel: 'IW_1005', template: 'IW_I1E1' },
  { group_code: 'IW_1', panel: 'IW_1006', template: 'IW_I1E1' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1020', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1021', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1022', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1023', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1024', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1025', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1026', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1027', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_1028', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-05)', panel: 'IW_BulkHd_A', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_BulkHd_A', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-05)', panel: 'IW_BulkHd_B', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-06)', panel: 'IW_BulkHd_B', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_BulkHd_C', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-08)', panel: 'IW_BulkHd_C', template: 'IW_I0E0' },
  { group_code: 'IW_0_(unit-07)', panel: 'IW_BulkHd_D', template: 'IW_I0E0' },
  { group_code: 'IW_1_(unit-08)', panel: 'IW_BulkHd_D', template: 'IW_I0E0' },
  { group_code: 'MF_1', panel: 'MF_0001', template: 'MF_T1B0' },
  { group_code: 'MF_1', panel: 'MF_0002', template: 'MF_T1B0' },
  { group_code: 'MF_1', panel: 'MF_0003', template: 'MF_T1B0' },
  { group_code: 'MF_1', panel: 'MF_0004', template: 'MF_T1B0' },
  { group_code: 'EW_1', panel: 'MF_1001', template: 'MF_T1B0' },
  { group_code: 'EW_1', panel: 'MF_1002', template: 'MF_T1B0' },
  { group_code: 'EW_1', panel: 'MF_1003', template: 'MF_T1B0' },
  { group_code: 'EW_1', panel: 'MF_1004', template: 'MF_T1B0' },
  { group_code: 'EW_1', panel: 'MF_1005', template: 'MF_T1B0' },
  { group_code: 'Roof', panel: 'R_0001', template: 'RO_I1E1_BI' },
  { group_code: 'Roof', panel: 'R_0002', template: 'RO_I1E1_BI' },
  { group_code: 'Roof', panel: 'R_0003', template: 'RO_I1E1_BI' },
  { group_code: 'Roof', panel: 'R_0004', template: 'RO_I1E1_BI' },
  { group_code: 'Roof', panel: 'R_0005', template: 'RO_I1E1_BI' },
  { group_code: 'Roof', panel: 'R_0006', template: 'RO_I1E1_BI' },
  { group_code: 'Roof', panel: 'R_0007', template: 'RO_I1E1_BI' },
  { group_code: 'Structure', panel: 'RB_01', template: 'STR_1' },
  { group_code: 'Structure', panel: 'RB_02', template: 'STR_1' },
  { group_code: 'Structure', panel: 'RB_03', template: 'STR_1' },
  { group_code: 'Structure', panel: 'RB_04', template: 'STR_1' },
  { group_code: 'Structure', panel: 'RB_05', template: 'STR_1' },
  { group_code: 'Structure', panel: 'RB_06', template: 'STR_1' },
];

const extractPanelSuffix = (panel: string, group_code: string): string => {
  const lastSegment = panel.split('_').pop() ?? panel;
  let candidate = lastSegment;

  if (!/^\d+$/.test(candidate)) {
    const trailingDigits = panel.match(/(\d+)(?!.*\d)/);
    if (trailingDigits) {
      candidate = trailingDigits[1];
    }
  }

  if (/^\d+$/.test(candidate)) {
    const groupDigitsMatch = group_code.match(/(\d+)$/);
    if (groupDigitsMatch) {
      const groupDigits = groupDigitsMatch[1];
      if (groupDigits && candidate.startsWith(groupDigits)) {
        const shortened = candidate.slice(groupDigits.length);
        if (shortened.length > 0) {
          candidate = shortened;
        }
      }
    }
    return candidate;
  }

  return candidate;
};

const inferTypeFromGroupCode = (group_code: string): Panel['type'] => {
  const normalized = group_code.toLowerCase();
  if (normalized.startsWith('ew')) return 'ew';
  if (normalized.startsWith('iw')) return 'iw';
  if (normalized.startsWith('mf')) return 'mf';
  if (normalized.startsWith('roof') || normalized === 'roof' || normalized.startsWith('r_')) {
    return 'r';
  }
  return 'sw';
};


export async function seedIfEmpty() {
  await db.transaction('rw', db.projects, db.components, async () => {
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

    if (!project) {
      return;
    }

    const componentCount = await db.components
      .where({ project_id: project.project_id })
      .count();

    if (componentCount === 0) {
      const seen = new Set<string>();
      const components: Panel[] = [];

      for (const { group_code, panel, template } of componentSource) {
        const id = extractPanelSuffix(panel, group_code);
        const dedupeKey = `${project!.project_id}::${group_code}::${id}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);

        components.push({
          project_id: project!.project_id,
          type: inferTypeFromGroupCode(group_code),
          group_code,
          id,
          panel_id: panel,
          template_id: template,
        });
      }
      await db.components.bulkAdd(components);
    }
  });
}
