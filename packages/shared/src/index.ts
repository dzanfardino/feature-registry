export const FEATURE_STATUSES = [
  'draft',
  'in_progress',
  'released',
  'deprecated',
  'retired',
] as const;
export type FeatureStatus = (typeof FEATURE_STATUSES)[number];

export const FLAG_STATUSES = ['active', 'to_be_removed', 'removed'] as const;
export type FlagStatus = (typeof FLAG_STATUSES)[number];

export const CHECKLIST_KINDS = ['training', 'stakeholder_communication', 'other'] as const;
export type ChecklistKind = (typeof CHECKLIST_KINDS)[number];

export const CHECKLIST_STATUSES = ['pending', 'done'] as const;
export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number];

export const ATTRIBUTE_DATA_TYPES = [
  'string',
  'text',
  'number',
  'boolean',
  'date',
  'enum',
  'url',
  'user',
] as const;
export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPES)[number];

export const ATTRIBUTE_ENTITY_TYPES = [
  'Feature',
  'FeatureFlag',
  'Dependency',
  'ReleaseChecklistItem',
] as const;
export type AttributeEntityType = (typeof ATTRIBUTE_ENTITY_TYPES)[number];

export const ATTRIBUTE_STATUSES = ['active', 'archived'] as const;
export type AttributeStatus = (typeof ATTRIBUTE_STATUSES)[number];

export const LINK_PROVIDERS = ['jira', 'confluence', 'generic'] as const;
export type LinkProvider = (typeof LINK_PROVIDERS)[number];

export const LINK_TYPES = ['epic', 'task', 'page', 'other'] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const ENTITY_ROUTE_MAP: Record<AttributeEntityType, string> = {
  Feature: 'features',
  FeatureFlag: 'flags',
  Dependency: 'dependencies',
  ReleaseChecklistItem: 'checklist-items',
};

export function entityTypeFromRoute(route: string): AttributeEntityType | undefined {
  const entry = Object.entries(ENTITY_ROUTE_MAP).find(([, value]) => value === route);
  return entry?.[0] as AttributeEntityType | undefined;
}

export interface AttributeValidationRules {
  min?: number | null;
  max?: number | null;
  regex?: string | null;
}

export interface CustomAttributeValues {
  [key: string]: unknown;
}
