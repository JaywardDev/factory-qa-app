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

    // Build an array of key/value metadata entries (AccessQAMetadata assumed shape: { key: string; value: string })
    const metadataEntries: AccessQAMetadata[] = [];
    const dbId = normalizeAccessString(row.DBID);
    if (dbId) metadataEntries.push({ key: 'dbId', value: dbId });
    if (wpGuid) metadataEntries.push({ key: 'wpGuid', value: wpGuid });
    const activityGroup = normalizeAccessString(row.ACTIVITYGROUP);
    if (activityGroup) metadataEntries.push({ key: 'activityGroup', value: activityGroup });
    const title = normalizeAccessString(row.TITLE);
    if (title) metadataEntries.push({ key: 'title', value: title });
    const result = normalizeAccessString(row.RESULT);
    if (result) metadataEntries.push({ key: 'result', value: result });
    const photoTaken = normalizeAccessString(row.PHOTO_TAKEN);
    if (photoTaken) metadataEntries.push({ key: 'photoTaken', value: photoTaken });
    const signee = normalizeAccessString(row.SIGNEE);
    if (signee) metadataEntries.push({ key: 'signee', value: signee });
    const timestamp = normalizeAccessString(row.TIMESTAMP);
    if (timestamp) metadataEntries.push({ key: 'timestamp', value: timestamp });

    const hasMetadata = metadataEntries.length > 0;

    if (existing) {
      if (hasMetadata) {
        existing.metadata.push(...metadataEntries);
      }
    } else {
      grouped.set(wpGuid, {
        WP_GUID: wpGuid,
        panel_id: panelId || undefined,
        metadata: hasMetadata ? metadataEntries : [],
      });
    }
  }

  return Array.from(grouped.values());
}