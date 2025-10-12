export type ProjectAccess = {
  ProjectNumber: string;
  ProjectName: string;
  BuildingName?: string | null;
};

export type PanelAccess = {
  ProjectNumber: string;
  BuildingName?: string | null;
  Group: string;
  SubGroup: string;
  QATemplateID: string;
};

export type TemplateItemAccess = {
  Type: string;
  Name: string;
  Values?: string | string[] | null;
  Photos?: string | number | boolean | null;
};

export type TemplateAccess = {
  QATemplateID: string;
  TemplateName: string;
  Items?: TemplateItemAccess[] | null;
};