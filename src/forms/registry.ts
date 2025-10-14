import type { ComponentType } from "react";
import type { Panel } from "../lib/types";
import DefaultQAForm from "../forms/DefaultQAForm";
import EW_I1E1Form from "./EW_I1E1Form";

export type TemplateFormProps = {
  component: Panel;
};

export type TemplateFormComponent = ComponentType<TemplateFormProps>;

// Add new template specific forms by importing the component above and
// registering it on this object with the exact Access template_id.
export const TEMPLATE_FORM_REGISTRY: Record<string, TemplateFormComponent> = {
  EW_I1E1: EW_I1E1Form,
};

export const DEFAULT_TEMPLATE_FORM: TemplateFormComponent = DefaultQAForm;

const normalizeTemplateId = (templateId?: string) =>
  templateId?.trim().toUpperCase() ?? null;

export const resolveTemplateForm = (
  templateId?: string,
): TemplateFormComponent => {
  const normalized = normalizeTemplateId(templateId);
  if (!normalized) {
    return DEFAULT_TEMPLATE_FORM;
  }

  return TEMPLATE_FORM_REGISTRY[normalized] ?? DEFAULT_TEMPLATE_FORM;
};