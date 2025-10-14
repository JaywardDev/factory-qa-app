import Dexie from 'dexie';
import { db } from './db';
import { deriveIdFromPanelCode, inferTypeFromGroupCode } from './panel-helpers';
import type { Panel, Project } from './types';

type ImportSchema = {
  schema_version?: unknown;
  project?: Partial<Project> & {
    project_id?: string | null;
    project_code?: string | null;
  } & Record<string, unknown>;
  components?: Array<
    Partial<Panel> & {
      group_code?: string | null;
      id?: string | null;
      panel_id?: string | null;
      type?: Panel['type'] | string | null;
    } & Record<string, unknown>
  >;
};

export type ImportIssue = {
  message: string;
  path?: string;
};

export type NormalizedComponent = Panel;

export type ImportAnalysis = {
  normalizedProject: Project | null;
  normalizedComponents: NormalizedComponent[];
  warnings: ImportIssue[];
  errors: ImportIssue[];
  effectiveSchemaVersion: number | null;
  stats: {
    totalComponents: number;
    uniqueComponents: number;
    duplicateComponents: number;
  };
};

export type ImportCommitResult = {
  projectInserted: boolean;
  projectUpdated: boolean;
  insertedComponents: number;
  skippedComponents: number;
};

const SUPPORTED_SCHEMA_VERSION = 1;

const toImportIssue = (message: string, path?: string): ImportIssue => ({ message, path });

const readSchema = (content: string, errors: ImportIssue[]): ImportSchema | null => {
  try {
    const parsed = JSON.parse(content) as ImportSchema;
    return parsed;
  } catch {
    errors.push(toImportIssue('Invalid JSON file. Unable to parse.', 'file'));
    return null;
  }
};

const normalizeProject = (
  raw: ImportSchema['project'],
  errors: ImportIssue[],
): Project | null => {
  if (!raw) {
    errors.push(toImportIssue('Missing "project" object in import file.', 'project'));
    return null;
  }

  const project_code = raw.project_code?.toString().trim();
  if (!project_code) {
    errors.push(toImportIssue('Missing project_code for project.', 'project.project_code'));
  }

  const project_id = (raw.project_id ?? undefined) && raw.project_id !== ''
    ? String(raw.project_id)
    : crypto.randomUUID();

  const project: Project = {
    project_id,
    project_code: project_code ?? '',
    project_name: raw.project_name ? String(raw.project_name) : undefined,
    status: raw.status ? (String(raw.status) as Project['status']) : undefined,
    start_date: raw.start_date ? String(raw.start_date) : undefined,
    end_date: raw.end_date ? String(raw.end_date) : undefined,
  };

  if (!project.project_code) {
    return null;
  }

  return project;
};

const normalizeComponent = (
  raw: NonNullable<ImportSchema['components']>[number],
  project_id: string,
  index: number,
  warnings: ImportIssue[],
  errors: ImportIssue[],
): Panel | null => {
  const path = `components[${index}]`;

  const group_codeRaw = raw.group_code?.toString().trim();
  if (!group_codeRaw) {
    errors.push(toImportIssue('Missing group_code for component.', `${path}.group_code`));
    return null;
  }

  const idRaw = raw.id?.toString().trim();
  let id = idRaw;
  const panel_id = raw.panel_id?.toString().trim();

  if (!id) {
    const derived = panel_id ? deriveIdFromPanelCode(panel_id) : null;
    if (derived) {
      id = derived;
      warnings.push(
        toImportIssue(
          'Derived id from panel_id because it was missing in the import file.',
          `${path}.id`,
        ),
      );
    }
  }

  if (!id) {
    errors.push(toImportIssue('Missing id for component.', `${path}.id`));
    return null;
  }

  const normalizedType = raw.type
    ? (String(raw.type).toLowerCase() as Panel['type'])
    : inferTypeFromGroupCode(group_codeRaw);

  if (!raw.type) {
    warnings.push(
      toImportIssue('Inferred component type from group_code.', `${path}.type`),
    );
  }

  const template_id = raw.template_id ? String(raw.template_id) : undefined;

  if (template_id) {
    const expectedPrefix = normalizedType.toUpperCase();
    const templatePrefix = template_id.split('_')[0]?.toUpperCase();
    if (templatePrefix && !templatePrefix.startsWith(expectedPrefix)) {
      warnings.push(
        toImportIssue(
          `Template (${template_id}) may not match inferred type (${normalizedType}).`,
          `${path}.template_id`,
        ),
      );
    }
  }

  return {
    project_id,
    group_code: group_codeRaw,
    id,
    panel_id: panel_id || undefined,
    type: normalizedType,
    template_id,
  } satisfies Panel;
};

export const analyzeImportFile = (content: string): ImportAnalysis => {
  const warnings: ImportIssue[] = [];
  const errors: ImportIssue[] = [];
  const schema = readSchema(content, errors);

  if (!schema) {
    return {
      normalizedProject: null,
      normalizedComponents: [],
      warnings,
      errors,
      effectiveSchemaVersion: null,
      stats: { totalComponents: 0, uniqueComponents: 0, duplicateComponents: 0 },
    };
  }

  let effectiveSchemaVersion: number | null = null;
  const rawSchemaVersion = schema.schema_version;

  if (rawSchemaVersion === undefined || rawSchemaVersion === null) {
    effectiveSchemaVersion = SUPPORTED_SCHEMA_VERSION;
    warnings.push(
      toImportIssue('schema_version missing; assuming 1.', 'schema_version'),
    );
  } else if (typeof rawSchemaVersion === 'number') {
    effectiveSchemaVersion = rawSchemaVersion;
  } else if (typeof rawSchemaVersion === 'string') {
    const parsed = Number(rawSchemaVersion.trim());
    if (Number.isFinite(parsed)) {
      effectiveSchemaVersion = parsed;
      warnings.push(
        toImportIssue(
          `schema_version was a string; treated as number ${parsed}.`,
          'schema_version',
        ),
      );
    } else {
      errors.push(
        toImportIssue(
          'Invalid schema_version value in import file. Expected a numeric value.',
          'schema_version',
        ),
      );
    }
  } else {
    errors.push(
      toImportIssue(
        'Invalid schema_version value in import file. Expected a numeric value.',
        'schema_version',
      ),
    );
  }

  if (
    effectiveSchemaVersion !== null &&
    effectiveSchemaVersion !== SUPPORTED_SCHEMA_VERSION
  ) {
    errors.push(
      toImportIssue(
        `Unsupported schema_version ${effectiveSchemaVersion}. Expected ${SUPPORTED_SCHEMA_VERSION}.`,
        'schema_version',
      ),
    );
  }

  const project = normalizeProject(schema.project, errors);

  const componentsRaw = Array.isArray(schema.components) ? schema.components : null;
  if (!componentsRaw) {
    errors.push(toImportIssue('Missing "components" array in import file.', 'components'));
  }

  const normalizedComponents: NormalizedComponent[] = [];
  let duplicateComponents = 0;

  if (project && componentsRaw) {
    const seen = new Set<string>();

    componentsRaw.forEach((component, index) => {
      const normalized = normalizeComponent(component, project.project_id, index, warnings, errors);
      if (!normalized) {
        return;
      }
      const dedupeKey = `${normalized.project_id}::${normalized.group_code}::${normalized.id}`;
      if (seen.has(dedupeKey)) {
        duplicateComponents += 1;
        warnings.push(
          toImportIssue(
            'Duplicate component encountered in file. Skipping subsequent entries.',
            `components[${index}]`,
          ),
        );
        return;
      }
      seen.add(dedupeKey);
      normalizedComponents.push(normalized);
    });
  }

  const stats = {
    totalComponents: componentsRaw?.length ?? 0,
    uniqueComponents: normalizedComponents.length,
    duplicateComponents,
  };

  return {
    normalizedProject: project,
    normalizedComponents,
    warnings,
    errors,
    effectiveSchemaVersion,
    stats,
  };
};

export const commitImport = async (
  analysis: ImportAnalysis,
): Promise<ImportCommitResult> => {
  if (!analysis.normalizedProject) {
    throw new Error('Cannot commit import without a normalized project.');
  }

  if (analysis.errors.length > 0) {
    throw new Error('Cannot commit import while there are validation errors.');
  }

  const { normalizedProject, normalizedComponents } = analysis;

  let insertedComponents = 0;
  let skippedComponents = 0;
  let projectInserted = false;
  let projectUpdated = false;

  await db.transaction('rw', db.projects, db.components, async () => {
    const existing = await db.projects.get(normalizedProject.project_id);
    if (existing) {
      const { project_code, project_name, status, start_date, end_date } = normalizedProject;
      await db.projects.update(normalizedProject.project_id, {
        project_code,
        project_name,
        status,
        start_date,
        end_date,
      });
      projectUpdated = true;
    } else {
      await db.projects.add(normalizedProject);
      projectInserted = true;
    }

    if (normalizedComponents.length === 0) {
      return;
    }

    try {
      await db.components.bulkAdd(normalizedComponents);
      insertedComponents = normalizedComponents.length;
    } catch (error) {
      if (error instanceof Dexie.BulkError) {
        insertedComponents = normalizedComponents.length - error.failures.length;
        skippedComponents = error.failures.length;
      } else {
        throw error;
      }
    }
  });

  return {
    projectInserted,
    projectUpdated,
    insertedComponents,
    skippedComponents,
  };
};