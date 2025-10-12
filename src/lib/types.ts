export type UUID = string;

export type Project = {
  project_id: UUID;
  project_code: string;   // e.g., "230041"
  project_name?: string;  // e.g., "Alpine Homes"
  status?: 'planned'|'active'|'closed';
  start_date?: string;
  end_date?: string;
};

export type Deck = {
  id: UUID;
  project_id: UUID;
  name: string;          // "Deck 01", "Deck 02"
};

export type Component = {
  id: UUID;
  deck_id: UUID;
  type: 'ew' | 'iw' | 'mf' | 'r' | 'other';  // ew=External Wall, iw=Internal Wall, mf=Mid-floor, r=Roof
  label: string;         // "EW_0001", "IW_1004", "MF_0004", "R_0005"
  qr_code?: string;      // optional; could be just the component id/label
  template_id?: string;  // Access template identifier (e.g., EW_I1E1)
};

export type ComponentType = Component['type'];

export const TYPE_LABEL: Record<ComponentType,string> = {
  ew: 'External Walls',
  iw: 'Internal Walls',
  mf: 'Mid-floors',
  r: 'Roofs',
  other: 'Structures',
};
