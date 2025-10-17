import { db } from './db';
import type {
  Panel,
  Project,
  QAForm,
  QAItem,
  QASessionRecord,
} from './types';

export type SeedPayload = {
  projects?: Project[];
  components?: Panel[];
  qa_forms?: QAForm[];
  qa_items?: QAItem[];
  qa_sessions?: QASessionRecord[];
};

export type ImportCounts = {
  projects: number;
  components: number;
  qa_forms: number;
  qa_items: number;
  qa_sessions: number;
};

export type ImportResult = {
  counts: ImportCounts;
  cleared: boolean;
  source?: string;
};

export type ImportOptions = {
  clearExisting?: boolean;
};

const BUNDLED_SEED_PATH = 'seed-data.json';
const DEFAULT_REMOTE_SEED_PATH = '/api/seed.json';

const EMPTY_COUNTS: ImportCounts = {
  projects: 0,
  components: 0,
  qa_forms: 0,
  qa_items: 0,
  qa_sessions: 0,
};

function withBasePath(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  if (typeof window !== 'undefined' && window.location) {
    const baseUrl = new URL(normalizedBase, window.location.origin);
    return new URL(normalizedPath, baseUrl).toString();
  }

  const absoluteBase = normalizedBase.startsWith('.') ? '/' : normalizedBase;
  return `${absoluteBase}${normalizedPath}`;
}

export function getBundledSeedUrl(): string {
  return withBasePath(BUNDLED_SEED_PATH);
}

export function getRemoteSeedUrl(): string {
  const configured = (import.meta.env.VITE_REMOTE_SEED_URL as string | undefined)?.trim();
  if (configured) {
    return configured;
  }
  return DEFAULT_REMOTE_SEED_PATH;
}

function assertSeedPayload(value: unknown): asserts value is SeedPayload {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Seed payload is not an object.');
  }
}

async function fetchSeedPayload(url: string): Promise<SeedPayload> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch seed data from ${url} (${response.status})`);
  }
  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text) as unknown;
  } catch (error) {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ').trim();
    const snippet = preview.length < text.length ? `${preview}…` : preview;
    throw new Error(
      `Seed payload from ${url} is not valid JSON${
        response.headers.get('content-type')
          ? ` (content-type: ${response.headers.get('content-type')})`
          : ''
      }. Received: ${snippet || '[empty response]'}`,
    );
  }
  assertSeedPayload(payload);
  return payload;
}

function asArray<T>(value: unknown): T[] | undefined {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return undefined;
}

export async function importSeedPayload(
  payload: SeedPayload,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const { clearExisting = false } = options;
  const rows = {
    projects: asArray<Project>(payload.projects) ?? [],
    components: asArray<Panel>(payload.components) ?? [],
    qa_forms: asArray<QAForm>(payload.qa_forms) ?? [],
    qa_items: asArray<QAItem>(payload.qa_items) ?? [],
    qa_sessions: asArray<QASessionRecord>(payload.qa_sessions) ?? [],
  } satisfies Record<keyof ImportCounts, unknown[]>;

  const counts: ImportCounts = {
    projects: rows.projects.length,
    components: rows.components.length,
    qa_forms: rows.qa_forms.length,
    qa_items: rows.qa_items.length,
    qa_sessions: rows.qa_sessions.length,
  };

  await db.transaction(
    'rw',
    [db.projects, db.components, db.qa_forms, db.qa_items, db.qa_sessions],
    async () => {
      if (clearExisting) {
        await db.projects.clear();
        await db.components.clear();
        await db.qa_forms.clear();
        await db.qa_items.clear();
        await db.qa_sessions.clear();
      }
      
      if (rows.projects.length > 0) {
        await db.projects.bulkPut(rows.projects);
      }
      if (rows.components.length > 0) {
        await db.components.bulkPut(rows.components);
      }
      if (rows.qa_forms.length > 0) {
        await db.qa_forms.bulkPut(rows.qa_forms);
      }
      if (rows.qa_items.length > 0) {
        await db.qa_items.bulkPut(rows.qa_items);
      }
      if (rows.qa_sessions.length > 0) {
        await db.qa_sessions.bulkPut(rows.qa_sessions);
      }
    },
  );    
  
  return { counts, cleared: clearExisting };
}

export async function seedIfEmpty(): Promise<boolean> {
  const [projects, components, forms, items, sessions] = await Promise.all([
    db.projects.count(),
    db.components.count(),
    db.qa_forms.count(),
    db.qa_items.count(),
    db.qa_sessions.count(),
  ]);

  const hasData = [projects, components, forms, items, sessions].some((count) => count > 0);
  if (hasData) {
    return false;
  }

  const url = getBundledSeedUrl();
  const payload = await fetchSeedPayload(url);
  await importSeedPayload(payload, { clearExisting: true });
  return true;
}

export async function importBundledSeed(options: ImportOptions = {}): Promise<ImportResult> {
  const url = getBundledSeedUrl();
  const payload = await fetchSeedPayload(url);
  const result = await importSeedPayload(payload, options);
  return { ...result, source: url };
}

export type SyncOptions = ImportOptions & {
  url?: string;
};

export async function syncFromRemote(options: SyncOptions = {}): Promise<ImportResult> {
  const { url, ...importOptions } = options;
  const endpoint = url ?? getRemoteSeedUrl();
  const payload = await fetchSeedPayload(endpoint);
  const result = await importSeedPayload(payload, importOptions);
  return { ...result, source: endpoint };
}

export async function importSeedFile(
  file: File,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const text = await file.text();
  let payload: SeedPayload;
  try {
    payload = JSON.parse(text) as SeedPayload;
  } catch (error) {
    throw new Error('The selected file does not contain valid JSON.');
  }
  const result = await importSeedPayload(payload, options);
  return { ...result, source: file.name };
}

export function formatCounts(result?: ImportResult | null): string {
  if (!result) {
    return '';
  }
  const parts: string[] = [];
  (Object.keys(EMPTY_COUNTS) as (keyof ImportCounts)[]).forEach((key) => {
    const count = result.counts[key];
    if (count > 0) {
      parts.push(`${key.replace('_', ' ')}: ${count}`);
    }
  });
  return parts.join(', ');
}  