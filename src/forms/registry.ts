import type { ComponentType } from "react";
import type { Component } from "../lib/types";
import DefaultQAForm from "./DefaultQAForm";
import EW_I1E1Form from "./EW_I1E1Form";

export type TemplateFormProps = {
  component: Component;
};

export type TemplateFormComponent = ComponentType<TemplateFormProps>;

// Add new template specific forms by importing the component above and
// registering it on this object with the exact Access template_id.
export const TEMPLATE_FORM_REGISTRY: Record<string, TemplateFormComponent> = {
  EW_I1E1: EW_I1E1Form,
};

export const DEFAULT_TEMPLATE_FORM: TemplateFormComponent = DefaultQAForm;