import * as XLSX from 'xlsx';
import type { SeedPayload } from './seed';
import type { AccessQAItem, Panel, PanelType } from './types';

const VALID_PANEL_TYPES: PanelType[] = ['ew', 'iw', 'mf', 'r', 'sw'];
const VALID_PANEL_TYPE_SET = new Set(VALID_PANEL_TYPES);

type Row = Record<string, unknown> | undefined | null;

const normalizeKey = (key: string | number | null | undefined) =>
  String(key ?? '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();

const getColumnValue = (row: Row, ...candidates: string[]): unknown => {
  if (!row) return undefined;

  const normalizedCandidates = candidates.map((candidate) => normalizeKey(candidate));

  for (const [key, value] of Object.entries(row)) {
    if (normalizedCandidates.includes(normalizeKey(key))) {
      return value;
    }
  }

  return undefined;
};

const normalizeString = (value: unknown): string => String(value ?? '').trim();

const asPanelType = (value: string): PanelType | null => {
  const candidate = value.toLowerCase() as PanelType;
  if (VALID_PANEL_TYPE_SET.has(candidate)) {
    return candidate;
  }
  return null;
};

const createUuid = (): string => {
  if (typeof globalThis.crypto !== 'undefined') {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
      return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
        .slice(6, 8)
        .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return Math.floor(value).toString(16);
  });
};

const buildSeedFromRows = (rows: Record<string, unknown>[]): SeedPayload => {
  const data: SeedPayload = {
    projects: [],
    components: [],
    qa_forms: [],
    qa_items: [],
    qa_sessions: [],
  };

  const projects = (data.projects ??= []);
  const components = (data.components ??= []);

  rows.forEach((row) => {
    const rowData = row ?? {};
    const wp = normalizeString(
      getColumnValue(rowData, 'WP_GUID', 'WP GUID', 'WP', 'ACCESS_GUID'),
    );
    if (!wp) return;

    const match = wp.match(/^(?:(\d+)[_-]?)?([A-Za-z]+)[_-]?(\d+)$/) ?? [];
    const projectCodeFromWp = match[1] ?? '';
    const letters = match[2] ?? '';
    const digits = match[3] ?? '';

    const guid =
      normalizeString(getColumnValue(rowData, 'GUID')) ||
      normalizeString(getColumnValue(rowData, 'PROJECT_GUID')) ||
      createUuid();

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
    const panelId = panelIdParts.join('_') || undefined;

    const type = asPanelType(letters);
    if (!type) {
      return;
    }

    const projectName = normalizeString(
      getColumnValue(rowData, 'PROJECT_NAME', 'PROJECT NAME'),
    );
    const projectCode =
      normalizeString(getColumnValue(rowData, 'PROJECT_CODE', 'PROJECT CODE')) ||
      projectCodeFromWp;

    if (!projects.find((project) => project.project_id === guid)) {
      projects.push({
        project_id: guid,
        project_code: projectCode,
        project_name: projectName || undefined,
        status: 'active',
      });
    }

    let component = components.find(
      (existing) => existing.panel_id === panelId && existing.project_id === guid,
    );

    if (!component) {
      component = {
        type,
        project_id: guid,
        group_code: groupCode,
        id,
        panel_id: panelId,
        template_id: normalizeString(getColumnValue(rowData, 'TEMPLATE')) || undefined,
        qaItems: [],
        access_guid: wp,
      } satisfies Panel;
      components.push(component);
    }

    component.access_guid = component.access_guid || wp;
    if (!component.qaItems) {
      component.qaItems = [];
    }

    const qaItem: AccessQAItem = {
      title: normalizeString(getColumnValue(rowData, 'TITLE')),
      result: normalizeString(getColumnValue(rowData, 'RESULT')), 
      photoTaken: normalizeString(getColumnValue(rowData, 'PHOTO_TAKEN', 'PHOTO TAKEN')),
      signee: normalizeString(getColumnValue(rowData, 'SIGNEE')),
      timestamp: normalizeString(getColumnValue(rowData, 'TIMESTAMP')),
    };

    component.qaItems.push(qaItem);
  });

  return data;
};

export async function convertExcelFileToSeed(file: File): Promise<SeedPayload> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  return buildSeedFromRows(rows);
}