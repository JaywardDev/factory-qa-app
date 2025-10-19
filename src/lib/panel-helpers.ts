import type { Panel } from './types';

export const inferTypeFromGroupCode = (group_code: string): Panel['type'] => {
  const normalized = group_code.toLowerCase();
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean);

  const matchToken = (predicate: (token: string) => boolean) =>
    tokens.some(predicate) || predicate(normalized);

  if (matchToken((token) => token.startsWith('ew'))) return 'ew';
  if (matchToken((token) => token.startsWith('iw'))) return 'iw';
  if (matchToken((token) => token.startsWith('mf'))) return 'mf';
  if (
    matchToken(
      (token) => token === 'roof' || token.startsWith('roof') || token === 'r' || token.startsWith('r_'),
    )
  ) {
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