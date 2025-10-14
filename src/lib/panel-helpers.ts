import type { Panel } from './types';

export const inferTypeFromGroupCode = (group_code: string): Panel['type'] => {
  const normalized = group_code.toLowerCase();
  if (normalized.startsWith('ew')) return 'ew';
  if (normalized.startsWith('iw')) return 'iw';
  if (normalized.startsWith('mf')) return 'mf';
  if (normalized.startsWith('roof') || normalized === 'roof' || normalized.startsWith('r_')) {
    return 'r';
  }
  return 'sw';
};

export const deriveIdFromPanelCode = (panelCode: string): string | null => {
  if (!panelCode) return null;
  const lastSegment = panelCode.includes('_')
    ? panelCode.slice(panelCode.lastIndexOf('_') + 1)
    : panelCode;

  if (/^\d+$/.test(lastSegment)) {
    return lastSegment;
  }

  const trailingDigits = panelCode.match(/(\d+)(?!.*\d)/);
  if (trailingDigits) {
    return trailingDigits[1];
  }

  return null;
};