import type { Panel, Project, QAItem, QAForm, QASessionRecord } from './types';

export type ExcelSeedPayload = {
  projects: Project[];
  components: Panel[];
  qa_forms: QAForm[];
  qa_items: QAItem[];
  qa_sessions: QASessionRecord[];
};

function normalizeKey(key: unknown): string {
  return String(key ?? '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
}

function normalizeString(value: unknown): string {
  return String(value ?? '').trim();
}

function pickColumn<T>(row: Record<string, unknown>, ...candidates: string[]): T | undefined {
  const normalizedCandidates = candidates.map(normalizeKey);

  for (const [key, value] of Object.entries(row)) {
    if (normalizedCandidates.includes(normalizeKey(key))) {
      return value as T;
    }
  }

  return undefined;
}

function ensureUUID(): string {
  const globalCrypto = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }

  // Simple fallback that mimics UUID v4 format; adequate for offline seeds.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function convertRowsToSeedPayload(rows: Array<Record<string, unknown>>): ExcelSeedPayload {
  const payload: ExcelSeedPayload = {
    projects: [],
    components: [],
    qa_forms: [],
    qa_items: [],
    qa_sessions: [],
  };

  rows.forEach((row) => {
    const workPackage = normalizeString(pickColumn<string>(row, 'WP_GUID', 'WP GUID', 'WP'));
    if (!workPackage) {
      return;
    }

    const match = workPackage.match(/^(?:(\d+)[_-]?)?([A-Za-z]+)[_-]?(\d+)$/) ?? [];
    const projectCode = match[1] ?? '';
    const letters = match[2] ?? '';
    const digits = match[3] ?? '';

    const guid = normalizeString(pickColumn<string>(row, 'GUID')) || ensureUUID();
    const lettersUpper = letters.toUpperCase();
    const hasDigits = digits.length > 0;

    const groupCodeParts: string[] = [];
    if (lettersUpper) groupCodeParts.push(lettersUpper);
    if (hasDigits) groupCodeParts.push(digits[0]);
    const groupCode = groupCodeParts.join('_');

    const id = hasDigits ? digits.slice(-3).padStart(3, '0') : '';
    const panelDigits = hasDigits ? digits.padStart(4, '0') : '';
    const panelIdParts: string[] = [];
    if (lettersUpper) panelIdParts.push(lettersUpper);
    if (panelDigits) panelIdParts.push(panelDigits);
    const panelId = panelIdParts.join('_');
    const type = letters.toLowerCase();

    if (!payload.projects.find((project) => project.project_id === guid)) {
      payload.projects.push({
        project_id: guid,
        project_code: projectCode,
        project_name: normalizeString(pickColumn<string>(row, 'PROJECT_NAME', 'PROJECT NAME')),
        status: 'active',
      });
    }

    let component = payload.components.find((existing) => existing.panel_id === panelId);
    if (!component) {
      component = {
        type: type as Panel['type'],
        project_id: guid,
        group_code: groupCode,
        id,
        panel_id: panelId,
        template_id: normalizeString(pickColumn<string>(row, 'TEMPLATE')),
        qaItems: [],
      };
      payload.components.push(component);
    }

    component.qaItems = component.qaItems ?? [];
    component.qaItems.push({
      title: normalizeString(pickColumn<string>(row, 'TITLE')),
      result: '',
      photoTaken: '',
      signee: '',
      timestamp: '',
    });
  });

  return payload;
}