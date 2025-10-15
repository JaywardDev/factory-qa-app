import Dexie from 'dexie';
import { db } from './db';
import { deriveIdFromPanelCode, inferTypeFromGroupCode } from './panel-helpers';
import type { AccessQAMetadata, Panel, Project } from './types';

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

const toOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
};

const extractField = (
  source: Record<string, unknown>,
  key: string,
  fallbackKey?: string,
): string | undefined => {
  const primary = key in source ? source[key] : undefined;
  const normalizedPrimary = toOptionalString(primary);
  if (normalizedPrimary !== undefined) {
    return normalizedPrimary;
  }

  if (fallbackKey === undefined) {
    return undefined;
  }

  const fallback = source[fallbackKey];
  return toOptionalString(fallback);
};

const derivePanelIdFromWpGuid = (wpGuid: string): string | null => {
  const normalized = wpGuid.trim();
  if (!normalized) {
    return null;
  }

  const numericPrefixMatch = normalized.match(/^(\d+[_-]+)(.+)$/);
  if (numericPrefixMatch?.[2]) {
    return numericPrefixMatch[2];
  }

  return normalized;
};

const isWpGuidKey = (key: string): boolean => key.toLowerCase() === 'wp_guid';

const extractProjectCodeFromWpGuid = (wpGuid: string): string | null => {
  const normalized = wpGuid.trim();
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^(\d{3,})[-_].+$/);
  return match?.[1] ?? null;
};

type DerivedProjectInfo = {
  projectCode: string;
  projectId: string;
  conflictingCodes: string[];
};

const formatProjectCodes = (info: DerivedProjectInfo): string =>
  [info.projectCode, ...info.conflictingCodes].join(', ');

const deriveProjectInfoFromWpGuids = (wpGuids: string[]): DerivedProjectInfo | null => {
  if (wpGuids.length === 0) {
    return null;
  }

  const codes = Array.from(
    new Set(
      wpGuids
        .map(extractProjectCodeFromWpGuid)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (codes.length === 0) {
    return null;
  }

  const [projectCode, ...conflictingCodes] = codes;

  return {
    projectCode,
    projectId: `derived-${projectCode}`,
    conflictingCodes,
  } satisfies DerivedProjectInfo;
};

const discoverWpGuids = (input: unknown): string[] => {
  if (!input) {
    return [];
  }

  const discovered = new Set<string>();
  const stack: unknown[] = [input];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || typeof current !== 'object') {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        stack.push(item);
      }
      continue;
    }

    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (isWpGuidKey(key)) {
        const candidate = toOptionalString(value);
        if (candidate) {
          discovered.add(candidate);
        }
      }

      if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }

  return Array.from(discovered);
};

const deriveGroupCodeFromPanelId = (panelId: string): string => {
  const normalized = panelId.trim();
  if (!normalized) {
    return 'unknown';
  }

  if (!normalized.includes('_')) {
    const withoutDigits = normalized.replace(/(\d+)(?!.*\d)/, '').replace(/[_-]+$/, '');
    return withoutDigits || normalized;
  }

  const segments = normalized.split('_');
  if (segments.length <= 1) {
    return normalized;
  }

  const prefix = segments.slice(0, -1).join('_');
  return prefix || normalized;
};

const generateComponentsFromWpGuids = (
  wpGuids: string[],
  project_id: string,
  warnings: ImportIssue[],
): NormalizedComponent[] => {
  if (wpGuids.length === 0) {
    return [];
  }

  const normalizedGuids = Array.from(new Set(wpGuids.map((value) => value.trim()).filter(Boolean)));
  const dedupe = new Set<string>();
  const components: NormalizedComponent[] = [];

  for (const wpGuid of normalizedGuids) {
    const panel_id = derivePanelIdFromWpGuid(wpGuid);
    if (!panel_id) {
      warnings.push(
        toImportIssue(
          `Unable to derive panel identifier from WP_GUID value "${wpGuid}".`,
          'components',
        ),
      );
      continue;
    }

    const id = deriveIdFromPanelCode(panel_id) ?? panel_id;
    const group_code = deriveGroupCodeFromPanelId(panel_id);
    const dedupeKey = `${project_id}::${group_code}::${id}`;
    if (dedupe.has(dedupeKey)) {
      continue;
    }

    dedupe.add(dedupeKey);
    components.push({
      project_id,
      group_code,
      id,
      panel_id,
      type: inferTypeFromGroupCode(group_code),
      qaMetadata: { wpGuid },
    });
  }

  if (components.length > 0) {
    warnings.push(
      toImportIssue(
        'Derived component list from WP_GUID values because the components array was missing.',
        'components',
      ),
    );
  }

  return components;
};

const extractQAMetadata = (
  source: Record<string, unknown>,
): AccessQAMetadata | undefined => {
  const metadata: AccessQAMetadata = {
    dbId: extractField(source, 'DBID', 'dbid'),
    wpGuid: extractField(source, 'WP_GUID', 'wp_guid'),
    activityGroup: extractField(source, 'ACTIVITYGROUP', 'activity_group'),
    title: extractField(source, 'TITLE', 'title'),
    result: extractField(source, 'RESULT', 'result'),
    photoTaken: extractField(source, 'PHOTO_TAKEN', 'photo_taken'),
    signee: extractField(source, 'SIGNEE', 'signee'),
    timestamp: extractField(source, 'TIMESTAMP', 'timestamp'),
  };

  return Object.values(metadata).some((value) => value !== undefined)
    ? metadata
    : undefined;
};

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
  warnings: ImportIssue[],
  derivedInfo: DerivedProjectInfo | null,  
): Project | null => {
  if (!raw) {
    if (!derivedInfo) {
      errors.push(toImportIssue('Missing "project" object in import file.', 'project'));
      return null;
    }

    if (derivedInfo.conflictingCodes.length > 0) {
      warnings.push(
        toImportIssue(
          `Multiple project codes discovered from WP_GUID values (${formatProjectCodes(derivedInfo)}); using ${derivedInfo.projectCode}.`,
          'project',
        ),
      );
    }

    warnings.push(
      toImportIssue(
        'Derived project metadata from WP_GUID values because the project object was missing.',
        'project',
      ),
    );

    return {
      project_id: derivedInfo.projectId,
      project_code: derivedInfo.projectCode,
    } satisfies Project;
  }

  const project_codeRaw = raw.project_code?.toString().trim();
  const project_code = project_codeRaw || derivedInfo?.projectCode;
  if (!project_code) {
    errors.push(toImportIssue('Missing project_code for project.', 'project.project_code'));
  }

  const hasExplicitProjectId = raw.project_id !== undefined && raw.project_id !== null && raw.project_id !== '';
  const project_id = hasExplicitProjectId
    ? String(raw.project_id)
    : derivedInfo?.projectId ?? crypto.randomUUID();

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

  if (!project_codeRaw && derivedInfo?.projectCode) {
    warnings.push(
      toImportIssue(
        'Derived project_code from WP_GUID values because it was missing in the project object.',
        'project.project_code',
      ),
    );
  }

  if (!hasExplicitProjectId && derivedInfo?.projectId) {
    warnings.push(
      toImportIssue(
        'Derived project_id from WP_GUID values because it was missing in the project object.',
        'project.project_id',
      ),
    );
  }

  if (derivedInfo?.conflictingCodes.length) {
    warnings.push(
      toImportIssue(
        `Multiple project codes discovered from WP_GUID values (${formatProjectCodes(derivedInfo)}); using ${derivedInfo.projectCode}.`,
        'project',
      ),
    );
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

  const record = raw as Record<string, unknown>;
  const qaMetadata = extractQAMetadata(record);

  const group_codeRaw = extractField(record, 'group_code', 'GROUP_CODE');
  if (!group_codeRaw) {
    errors.push(toImportIssue('Missing group_code for component.', `${path}.group_code`));
    return null;
  }

  const idRaw = extractField(record, 'id', 'ID');
  let id = idRaw;
  const wpGuid = qaMetadata?.wpGuid;
  let panel_id = extractField(record, 'panel_id', 'PANEL_ID');

  if (!panel_id && wpGuid) {
    const derivedPanelId = derivePanelIdFromWpGuid(wpGuid);
    if (derivedPanelId) {
      panel_id = derivedPanelId;
      warnings.push(
        toImportIssue(
          'Derived panel_id from WP_GUID because it was missing in the import file.',
          `${path}.panel_id`,
        ),
      );
    }
  }

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

  const typeRaw = extractField(record, 'type', 'TYPE');
  const normalizedType = typeRaw
    ? (typeRaw.toLowerCase() as Panel['type'])
    : inferTypeFromGroupCode(group_codeRaw);

  if (!typeRaw) {
    warnings.push(
      toImportIssue('Inferred component type from group_code.', `${path}.type`),
    );
  }

  const template_id = extractField(record, 'template_id', 'TEMPLATE_ID');

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
    ...(qaMetadata ? { qaMetadata } : {}),    
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

  const discoveredWpGuids = discoverWpGuids(schema);
  const derivedProjectInfo = deriveProjectInfoFromWpGuids(discoveredWpGuids);

  if (discoveredWpGuids.length > 0 && !derivedProjectInfo) {
    warnings.push(
      toImportIssue(
        'Discovered WP_GUID values but none contained a recognizable project code.',
        'project',
      ),
    );
  }

  const project = normalizeProject(schema.project, errors, warnings, derivedProjectInfo);

  const componentsRaw = Array.isArray(schema.components) ? schema.components : null;

  const normalizedComponents: NormalizedComponent[] = [];
  let duplicateComponents = 0;

  if (project) {
    if (componentsRaw) {
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
    } else {
      const derivedComponents = generateComponentsFromWpGuids(
        discoveredWpGuids,
        project.project_id,
        warnings,
      );

      if (derivedComponents.length === 0) {
        errors.push(toImportIssue('Missing "components" array in import file.', 'components'));
      } else {
        normalizedComponents.push(...derivedComponents);
      }
    }
  } else if (!componentsRaw) {
    errors.push(toImportIssue('Missing "components" array in import file.', 'components'));
  }

  const totalComponents = componentsRaw ? componentsRaw.length : normalizedComponents.length;

  const stats = {
    totalComponents,
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