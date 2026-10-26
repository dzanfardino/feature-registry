import type {
  AttributeDataType,
  AttributeEntityType,
  AttributeStatus,
  ChecklistKind,
  ChecklistStatus,
  FeatureStatus,
  FlagStatus,
  LinkProvider,
  LinkType,
} from '@feature-registry/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Application {
  id: string;
  name: string;
  description: string;
  slug: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  owner: string;
  team: string;
  applicationId: string;
  customAttributes: Record<string, unknown>;
  flags?: FeatureFlag[];
  outgoingDependencies?: Dependency[];
  checklistItems?: ReleaseChecklistItem[];
  links?: ExternalLink[];
  application?: Application;
}

export interface FeatureFlag {
  id: string;
  featureId: string;
  owner: string;
  expectedSunsetAt: string | null;
  issueUrl: string | null;
  status: FlagStatus;
  customAttributes: Record<string, unknown>;
  createdAt: string;
}

export interface Dependency {
  id: string;
  fromFeatureId: string;
  toFeatureId: string;
  fromTeam: string;
  toTeam: string;
  kind: string;
  notes: string;
  toFeature?: Feature;
  customAttributes: Record<string, unknown>;
}

export interface ReleaseChecklistItem {
  id: string;
  featureId: string;
  title: string;
  kind: ChecklistKind;
  status: ChecklistStatus;
  dueAt: string | null;
  customAttributes: Record<string, unknown>;
}

export interface ExternalLink {
  id: string;
  entityType: AttributeEntityType;
  entityId: string;
  provider: LinkProvider;
  type: LinkType;
  url: string;
  externalId: string | null;
  title: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AttributeDefinition {
  id: string;
  key: string;
  label: string;
  description: string | null;
  dataType: AttributeDataType;
  required: boolean;
  defaultValue: unknown;
  options: string[] | null;
  appliesTo: AttributeEntityType;
  validation: { min?: number | null; max?: number | null; regex?: string | null };
  sortOrder: number;
  status: AttributeStatus;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listApplications: () => request<Application[]>('/applications'),
  createApplication: (body: Partial<Application>) =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(body) }),
  listFeatures: (params: Record<string, string> = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    const suffix = search.toString() ? `?${search}` : '';
    return request<Feature[]>(`/features${suffix}`);
  },
  getFeature: (id: string) => request<Feature>(`/features/${id}`),
  createFeature: (body: Partial<Feature>) =>
    request<Feature>('/features', { method: 'POST', body: JSON.stringify(body) }),
  updateFeature: (id: string, body: Partial<Feature>) =>
    request<Feature>(`/features/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createFlag: (featureId: string, body: Partial<FeatureFlag>) =>
    request<FeatureFlag>(`/features/${featureId}/flags`, { method: 'POST', body: JSON.stringify(body) }),
  updateFlag: (id: string, body: Partial<FeatureFlag>) =>
    request<FeatureFlag>(`/flags/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createDependency: (featureId: string, body: Partial<Dependency>) =>
    request<Dependency>(`/features/${featureId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createChecklistItem: (featureId: string, body: Partial<ReleaseChecklistItem>) =>
    request<ReleaseChecklistItem>(`/features/${featureId}/checklist`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateChecklistItem: (id: string, body: Partial<ReleaseChecklistItem>) =>
    request<ReleaseChecklistItem>(`/checklist-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listDefinitions: (appliesTo?: AttributeEntityType, includeArchived = false) => {
    const search = new URLSearchParams();
    if (appliesTo) search.set('appliesTo', appliesTo);
    if (includeArchived) search.set('includeArchived', 'true');
    const suffix = search.toString() ? `?${search}` : '';
    return request<AttributeDefinition[]>(`/attribute-definitions${suffix}`);
  },
  createDefinition: (body: Partial<AttributeDefinition>) =>
    request<AttributeDefinition>('/attribute-definitions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateDefinition: (id: string, body: Partial<AttributeDefinition>) =>
    request<AttributeDefinition>(`/attribute-definitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  archiveDefinition: (id: string) =>
    request<AttributeDefinition>(`/attribute-definitions/${id}/archive`, { method: 'POST' }),
  setAttributes: (route: string, id: string, values: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/${route}/${id}/attributes`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    }),
  listLinks: (route: string, id: string) => request<ExternalLink[]>(`/${route}/${id}/links`),
  createLink: (route: string, id: string, body: Partial<ExternalLink>) =>
    request<ExternalLink>(`/${route}/${id}/links`, { method: 'POST', body: JSON.stringify(body) }),
  deleteLink: (id: string) => request<{ deleted: boolean }>(`/links/${id}`, { method: 'DELETE' }),
};
