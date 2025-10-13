export type UUID = string;

export type Project = {
  project_id: UUID;
  project_code: string;   // e.g., "230041"
  project_name?: string;  // e.g., "Alpine Homes"
  status?: 'planned'|'active'|'closed';
  start_date?: string;
  end_date?: string;
};

export type Component = {
  id: UUID;
  project_id: UUID;
  type: 'ew' | 'iw' | 'mf' | 'r' | 'other';  // ew=External Wall, iw=Internal Wall, mf=Mid-floor, r=Roof
  group_code: string;     // e.g., "EW_0", "MF_1", "Roof"
  panel_id: string;       // panel identifier / Access sub group ("EW_0001", "IW_1004", ...)
  template_id?: string;   // Access template identifier (e.g., EW_I1E1)
};

export type QAForm = {
  form_id: UUID;
  project_id: UUID;
  status?: 'draft' | 'submitted' | 'exported';
  created_at?: string;
};

export type QAItem = {
  item_id: UUID;
  form_id: UUID;
  result?: string;
  timestamp?: string;
};

export type ComponentType = Component['type'];

export const TYPE_LABEL: Record<ComponentType,string> = {
  ew: 'External Walls',
  iw: 'Internal Walls',
  mf: 'Mid-floors',
  r: 'Roofs',
  other: 'Structures & Other',
};
