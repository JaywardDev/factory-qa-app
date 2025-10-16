import type { AccessComponentSourceRow } from './component-source';
import type { AccessQAMetadata } from './types';

export type TransformedAccessComponent = {
  WP_GUID: string;
  panel_id?: string;
  metadata: AccessQAMetadata[];
};

export function normalizeAccessString(value?: string | null): string {
  return (value ?? '').trim();
}

const PANEL_SEGMENT_SEPARATOR = '_';

export function deriveGroupCodeAndComponentId(panelCode?: string | null): {
  groupCode: string;
  componentId: string | null;
  panelId: string;
} {
  const normalized = normalizeAccessString(panelCode);
  if (!normalized) {
    return { groupCode: '', componentId: null, panelId: '' };
  }

  const rawSegments = normalized
    .split(PANEL_SEGMENT_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean);

  // Access exports sometimes include a numeric prefix before the actual panel
  // identifier (e.g. "42_IW_0006"). Strip leading numeric segments while we
  // still have other information to work with.
  const segments = [...rawSegments];
  while (segments.length > 1 && /^\d+$/.test(segments[0]!)) {
    segments.shift();
  }

  if (segments.length === 0) {
    return { groupCode: normalized, componentId: null, panelId: normalized };
  }

  const componentId = segments.length > 1 ? segments[segments.length - 1]! : null;
  const groupSegments = segments.length > 1 ? segments.slice(0, -1) : segments;
  const groupCode = groupSegments.join(PANEL_SEGMENT_SEPARATOR);
  const panelId = segments.join(PANEL_SEGMENT_SEPARATOR);

  return { groupCode, componentId, panelId };
}

export function transformAccessComponentSource(
  rows: AccessComponentSourceRow[],
): TransformedAccessComponent[] {
  const grouped = new Map<string, TransformedAccessComponent>();

  for (const row of rows) {
    const wpGuid = normalizeAccessString(row.WP_GUID).toUpperCase();
    if (!wpGuid) continue;

    const existing = grouped.get(wpGuid);
    const { panelId } = deriveGroupCodeAndComponentId(wpGuid);

    const metadataEntry: AccessQAMetadata = {};
    const dbId = normalizeAccessString(row.DBID);
    if (dbId) metadataEntry.dbId = dbId;
    if (wpGuid) metadataEntry.wpGuid = wpGuid;
    const activityGroup = normalizeAccessString(row.ACTIVITYGROUP);
    if (activityGroup) metadataEntry.activityGroup = activityGroup;
    const title = normalizeAccessString(row.TITLE);
    if (title) metadataEntry.title = title;
    const result = normalizeAccessString(row.RESULT);
    if (result) metadataEntry.result = result;
    const photoTaken = normalizeAccessString(row.PHOTO_TAKEN);
    if (photoTaken) metadataEntry.photoTaken = photoTaken;
    const signee = normalizeAccessString(row.SIGNEE);
    if (signee) metadataEntry.signee = signee;
    const timestamp = normalizeAccessString(row.TIMESTAMP);
    if (timestamp) metadataEntry.timestamp = timestamp;

    const hasMetadata = Object.keys(metadataEntry).length > 0;

    if (existing) {
      if (hasMetadata) {
        existing.metadata.push(metadataEntry);
      }
    } else {
      grouped.set(wpGuid, {
        WP_GUID: wpGuid,
        panel_id: panelId || undefined,
        metadata: hasMetadata ? [metadataEntry] : [],
      });
    }
  }

  return Array.from(grouped.values());
}