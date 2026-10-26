import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FEATURE_STATUSES } from '@feature-registry/shared';
import { api, Application, AttributeDefinition, Feature } from '../api';

export function FeaturesPage() {
  const [params, setParams] = useSearchParams();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [definitions, setDefinitions] = useState<AttributeDefinition[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    owner: '',
    team: '',
    applicationId: '',
    status: 'draft' as (typeof FEATURE_STATUSES)[number],
  });

  const filters = useMemo(() => {
    const next: Record<string, string> = {
      applicationId: params.get('applicationId') || '',
      status: params.get('status') || '',
      team: params.get('team') || '',
      owner: params.get('owner') || '',
    };
    for (const [key, value] of params.entries()) {
      if (key.startsWith('attr.')) next[key] = value;
    }
    return next;
  }, [params]);

  useEffect(() => {
    void api.listApplications().then(setApps);
    void api.listDefinitions('Feature').then(setDefinitions);
  }, []);

  useEffect(() => {
    void api.listFeatures(filters).then(setFeatures);
  }, [filters]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await api.createFeature(form);
    setForm({ ...form, name: '', description: '' });
    void api.listFeatures(filters).then(setFeatures);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Features</h1>
      <div className="grid gap-2 rounded-lg border bg-white p-4 md:grid-cols-4">
        <select className="rounded border px-2 py-1 text-sm" value={filters.applicationId} onChange={(e) => updateFilter('applicationId', e.target.value)}>
          <option value="">All applications</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
        <select className="rounded border px-2 py-1 text-sm" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {FEATURE_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input className="rounded border px-2 py-1 text-sm" placeholder="Team" value={filters.team} onChange={(e) => updateFilter('team', e.target.value)} />
        <input className="rounded border px-2 py-1 text-sm" placeholder="Owner" value={filters.owner} onChange={(e) => updateFilter('owner', e.target.value)} />
        {definitions.map((definition) => (
          <input
            key={definition.id}
            className="rounded border px-2 py-1 text-sm"
            placeholder={definition.label}
            value={filters[`attr.${definition.key}`] || ''}
            onChange={(e) => updateFilter(`attr.${definition.key}`, e.target.value)}
          />
        ))}
      </div>
      <form className="grid gap-2 rounded-lg border bg-white p-4 md:grid-cols-3" onSubmit={onSubmit}>
        <input className="rounded border px-2 py-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded border px-2 py-1" placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} required />
        <input className="rounded border px-2 py-1" placeholder="Team" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} required />
        <select className="rounded border px-2 py-1" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })} required>
          <option value="">Application</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
        <select className="rounded border px-2 py-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
          {FEATURE_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input className="rounded border px-2 py-1 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
          Create feature
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Team</th>
              {definitions.map((definition) => (
                <th key={definition.id} className="px-3 py-2">
                  {definition.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.id} className="border-t">
                <td className="px-3 py-2">
                  <Link className="text-indigo-700" to={`/features/${feature.id}`}>
                    {feature.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{feature.status}</td>
                <td className="px-3 py-2">{feature.owner}</td>
                <td className="px-3 py-2">{feature.team}</td>
                {definitions.map((definition) => (
                  <td key={definition.id} className="px-3 py-2">
                    {String(feature.customAttributes?.[definition.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
