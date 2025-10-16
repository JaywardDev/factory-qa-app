export type UUID = string;

export type Project = {
  project_id: UUID;
  project_code: string;   // e.g., "230041"
  project_name?: string;  // e.g., "Alpine Homes"
  status?: 'planned'|'active'|'closed';
  start_date?: string;
  end_date?: string;
};

export type AccessQAItem = {
  title: string;
  result: string;
  photoTaken: string;
  signee: string;
  timestamp: string;
};

export type AccessQAMetadata = {
  key: string;
  value: string;
  source?: string;
  timestamp?: string;
};

export type Panel = {
  type: 'ew' | 'iw' | 'mf' | 'r' | 'sw';
  project_id: UUID;
  group_code: string;     // e.g., "EW_0", "MF_1", "R_"
  id: string;              // panel identifier / Access sub group ("001", "004", ...)
  panel_id?: string;       // full Access identifier (e.g., "EW_0001") for display
  template_id?: string;   // Access template identifier (e.g., EW_I1E1)
  qaItems?: AccessQAItem[]; // Access QA entries associated with the component
  access_guid?: string;    // Access work package identifier (e.g., "42_IW_0006")
  metadata?: AccessQAMetadata[]; // Additional metadata entries from Access
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

export type PanelType = Panel['type'];

export type Component = Panel;
export type ComponentType = PanelType;

export const TYPE_LABEL: Record<PanelType,string> = {
  ew: 'External Walls',
  iw: 'Internal Walls',
  mf: 'Mid-floors',
  r: 'Roofs',
  sw: 'Structured Walls',
};
