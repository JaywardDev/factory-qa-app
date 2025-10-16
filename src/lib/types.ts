export type UUID = string;

export type Project = {
  project_id: UUID;
  project_code: string;   // e.g., "230041"
  project_name?: string;  // e.g., "Alpine Homes"
  status?: 'planned'|'active'|'closed';
  start_date?: string;
  end_date?: string;
};

export type AccessQAMetadata = {
  dbId?: string;
  wpGuid?: string;
  activityGroup?: string;
  title?: string;
  result?: string;
  photoTaken?: string;
  signee?: string;
  timestamp?: string;
};

export type Panel = {
  type: 'ew' | 'iw' | 'mf' | 'r' | 'sw';
  project_id: UUID;
  group_code: string;     // e.g., "EW_0", "MF_1", "R_"
  id: string;              // panel identifier / Access sub group ("001", "004", ...)
  panel_id?: string;       // full Access identifier (e.g., "EW_0001") for display
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
