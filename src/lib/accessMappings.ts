import type { Component, ComponentType, Project } from './types';
import type {
  PanelAccess,
  ProjectAccess,
  TemplateAccess,
  TemplateItemAccess,
} from './types.access';

export type NormalizedTemplateItem = {
  type: string;
  name: string;
  values: string[];
  photos: boolean;
};

export type NormalizedTemplate = {
  id: string;
  name: string;
  items: NormalizedTemplateItem[];
};

const GROUP_PREFIX_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
  EW: 'ew',
  IW: 'iw',
  MF: 'mf',
  R: 'r',
};

export function mapProject(source: ProjectAccess): Project {
  const projectCode = source.ProjectNumber.trim();

  return {
    project_id: projectCode,
    project_code: projectCode,
    project_name: source.ProjectName?.trim() || undefined,
  };
}

export function mapPanelToComponent(source: PanelAccess, deckId: string): Component {
  const groupPrefix = extractGroupPrefix(source.Group);
  const type = GROUP_PREFIX_TO_COMPONENT_TYPE[groupPrefix] ?? 'other';

  const label = source.SubGroup?.trim() || source.Group?.trim() || source.ProjectNumber;

  return {
    id: label,
    deck_id: deckId,
    type,
    label,
  };
}

export function mapTemplate(source: TemplateAccess): NormalizedTemplate {
  return {
    id: source.QATemplateID,
    name: source.TemplateName?.trim() || source.QATemplateID,
    items: (source.Items ?? []).map(normalizeTemplateItem),
  };
}

function extractGroupPrefix(group: string): string {
  if (!group) {
    return '';
  }

  const trimmed = group.trim();
  if (!trimmed) {
    return '';
  }

  const match = trimmed.match(/^[A-Za-z]+/);
  return match ? match[0].toUpperCase() : trimmed.slice(0, 2).toUpperCase();
}

function normalizeTemplateItem(item: TemplateItemAccess): NormalizedTemplateItem {
  return {
    type: item.Type?.trim() || 'other',
    name: item.Name?.trim() || '',
    values: normalizeValues(item.Values),
    photos: coerceBoolean(item.Photos),
  };
}

function normalizeValues(values: TemplateItemAccess['Values']): string[] {
  if (values == null) {
    return [];
  }

  if (Array.isArray(values)) {
    return values
      .map(value => value?.toString().trim())
      .filter((value): value is string => Boolean(value));
  }

  const normalized = values.toString().trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/[\r\n,;]+/)
    .map(value => value.trim())
    .filter(Boolean);
}

function coerceBoolean(value: TemplateItemAccess['Photos']): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return ['1', 'true', 'yes', 'y'].includes(normalized);
  }

  return false;
}