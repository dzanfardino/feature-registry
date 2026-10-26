import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CHECKLIST_KINDS, FEATURE_STATUSES, FLAG_STATUSES } from '@feature-registry/shared';
import { api, AttributeDefinition, Feature } from '../api';
import { AttributeInput } from '../components/AttributeInput';
import { CustomAttributesEditor } from '../components/CustomAttributesEditor';
import { ExternalLinksPanel } from '../components/ExternalLinksPanel';

export function FeatureDetailPage() {
  const { id } = useParams();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [definitions, setDefinitions] = useState<AttributeDefinition[]>([]);
  const [flagDefinitions, setFlagDefinitions] = useState<AttributeDefinition[]>([]);
  const [depDefinitions, setDepDefinitions] = useState<AttributeDefinition[]>([]);
  const [itemDefinitions, setItemDefinitions] = useState<AttributeDefinition[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [flag, setFlag] = useState({
    owner: '',
    expectedSunsetAt: '',
    issueUrl: '',
    status: 'active' as (typeof FLAG_STATUSES)[number],
  });
  const [dep, setDep] = useState({ toFeatureId: '', fromTeam: '', toTeam: '', notes: '' });
  const [item, setItem] = useState({ title: '', kind: 'training' as (typeof CHECKLIST_KINDS)[number] });
  const [error, setError] = useState('');

  const load = () => {
    if (!id) return;
    void api.getFeature(id).then((data) => {
      setFeature(data);
      setValues(data.customAttributes || {});
    });
  };

  useEffect(() => {
    void api.listDefinitions('Feature').then(setDefinitions);
    void api.listDefinitions('FeatureFlag').then(setFlagDefinitions);
    void api.listDefinitions('Dependency').then(setDepDefinitions);
    void api.listDefinitions('ReleaseChecklistItem').then(setItemDefinitions);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id || !feature) return <p>Loading…</p>;
  const featureId = id;
  const current = feature;

  async function saveCore(event: FormEvent) {
    event.preventDefault();
    await api.updateFeature(featureId, {
      name: current.name,
      description: current.description,
      status: current.status,
      owner: current.owner,
      team: current.team,
    });
    if (definitions.length) {
      await api.setAttributes('features', featureId, values);
    }
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{feature.name}</h1>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2" onSubmit={saveCore}>
        <input className="rounded border px-2 py-1" value={feature.name} onChange={(e) => setFeature({ ...feature, name: e.target.value })} />
        <select className="rounded border px-2 py-1" value={feature.status} onChange={(e) => setFeature({ ...feature, status: e.target.value as typeof feature.status })}>
          {FEATURE_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input className="rounded border px-2 py-1" value={feature.owner} onChange={(e) => setFeature({ ...feature, owner: e.target.value })} />
        <input className="rounded border px-2 py-1" value={feature.team} onChange={(e) => setFeature({ ...feature, team: e.target.value })} />
        <textarea className="rounded border px-2 py-1 md:col-span-2" value={feature.description} onChange={(e) => setFeature({ ...feature, description: e.target.value })} />
        {definitions.map((definition) => (
          <AttributeInput
            key={definition.id}
            definition={definition}
            value={values[definition.key]}
            onChange={(key, value) => setValues({ ...values, [key]: value })}
          />
        ))}
        <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
          Save feature
        </button>
      </form>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Feature flags</h2>
        <ul className="mb-3 space-y-2 text-sm">
          {(feature.flags ?? []).map((entry) => (
            <li key={entry.id} className="space-y-2 rounded border border-slate-100 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {entry.owner} · {entry.status} · sunset {entry.expectedSunsetAt?.slice(0, 10) ?? 'n/a'}
                  {entry.issueUrl ? (
                    <>
                      {' '}
                      ·{' '}
                      <a className="text-indigo-700" href={entry.issueUrl} target="_blank" rel="noreferrer">
                        issue
                      </a>
                    </>
                  ) : null}
                </span>
                <select
                  className="rounded border px-2 py-1"
                  value={entry.status}
                  onChange={(e) =>
                    api.updateFlag(entry.id, { status: e.target.value as typeof entry.status }).then(load)
                  }
                >
                  {FLAG_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
              <CustomAttributesEditor
                entityRoute="flags"
                entityId={entry.id}
                definitions={flagDefinitions}
                values={entry.customAttributes || {}}
                onSaved={load}
              />
              <ExternalLinksPanel entityRoute="flags" entityId={entry.id} />
            </li>
          ))}
        </ul>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            api
              .createFlag(featureId, {
                owner: flag.owner,
                status: flag.status,
                issueUrl: flag.issueUrl || undefined,
                expectedSunsetAt: flag.expectedSunsetAt
                  ? `${flag.expectedSunsetAt}T00:00:00.000Z`
                  : undefined,
              })
              .then(() => {
                setFlag({ owner: '', expectedSunsetAt: '', issueUrl: '', status: 'active' });
                load();
              });
          }}
        >
          <input className="rounded border px-2 py-1" placeholder="Owner" value={flag.owner} onChange={(e) => setFlag({ ...flag, owner: e.target.value })} required />
          <input
            className="rounded border px-2 py-1"
            type="date"
            value={flag.expectedSunsetAt}
            onChange={(e) => setFlag({ ...flag, expectedSunsetAt: e.target.value })}
          />
          <input
            className="rounded border px-2 py-1"
            placeholder="Issue URL"
            value={flag.issueUrl}
            onChange={(e) => setFlag({ ...flag, issueUrl: e.target.value })}
          />
          <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
            Add flag
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Dependencies</h2>
        <ul className="mb-3 space-y-2 text-sm">
          {(feature.outgoingDependencies ?? []).map((entry) => (
            <li key={entry.id} className="space-y-2 rounded border border-slate-100 p-2">
              <div>
                {entry.fromTeam} → {entry.toTeam} ({entry.kind}){' '}
                {entry.toFeature?.name ? `· ${entry.toFeature.name}` : ''}
              </div>
              <CustomAttributesEditor
                entityRoute="dependencies"
                entityId={entry.id}
                definitions={depDefinitions}
                values={entry.customAttributes || {}}
                onSaved={load}
              />
              <ExternalLinksPanel entityRoute="dependencies" entityId={entry.id} />
            </li>
          ))}
        </ul>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError('');
            api.createDependency(featureId, dep).catch((err) => setError(String(err))).then(load);
          }}
        >
          <input className="rounded border px-2 py-1" placeholder="Target feature UUID" value={dep.toFeatureId} onChange={(e) => setDep({ ...dep, toFeatureId: e.target.value })} required />
          <input className="rounded border px-2 py-1" placeholder="From team" value={dep.fromTeam} onChange={(e) => setDep({ ...dep, fromTeam: e.target.value })} required />
          <input className="rounded border px-2 py-1" placeholder="To team" value={dep.toTeam} onChange={(e) => setDep({ ...dep, toTeam: e.target.value })} required />
          <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
            Add dependency
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Release checklist</h2>
        <ul className="mb-3 space-y-2 text-sm">
          {(feature.checklistItems ?? []).map((entry) => (
            <li key={entry.id} className="space-y-2 rounded border border-slate-100 p-2">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {entry.title} · {entry.kind} · {entry.status}
                </span>
                {entry.status === 'pending' ? (
                  <button
                    className="text-indigo-700"
                    type="button"
                    onClick={() => api.updateChecklistItem(entry.id, { status: 'done' }).then(load)}
                  >
                    Mark done
                  </button>
                ) : null}
              </div>
              <CustomAttributesEditor
                entityRoute="checklist-items"
                entityId={entry.id}
                definitions={itemDefinitions}
                values={entry.customAttributes || {}}
                onSaved={load}
              />
              <ExternalLinksPanel entityRoute="checklist-items" entityId={entry.id} />
            </li>
          ))}
        </ul>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            api.createChecklistItem(featureId, item).then(() => {
              setItem({ title: '', kind: 'training' });
              load();
            });
          }}
        >
          <input className="rounded border px-2 py-1" placeholder="Prerequisite" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} required />
          <select className="rounded border px-2 py-1" value={item.kind} onChange={(e) => setItem({ ...item, kind: e.target.value as typeof item.kind })}>
            {CHECKLIST_KINDS.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
          <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
            Add item
          </button>
        </form>
      </section>

      <ExternalLinksPanel entityRoute="features" entityId={id} />
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
