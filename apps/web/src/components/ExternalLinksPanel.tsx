import { FormEvent, useEffect, useState } from 'react';
import { LINK_PROVIDERS, LINK_TYPES } from '@feature-registry/shared';
import { api, ExternalLink } from '../api';

const LABELS: Record<string, string> = {
  'jira:epic': 'Jira epic',
  'jira:task': 'Jira task',
  'confluence:page': 'Confluence page',
  'generic:other': 'Link',
};

interface Props {
  entityRoute: string;
  entityId: string;
}

export function ExternalLinksPanel({ entityRoute, entityId }: Props) {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<(typeof LINK_PROVIDERS)[number]>('generic');
  const [type, setType] = useState<(typeof LINK_TYPES)[number]>('other');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const load = () => api.listLinks(entityRoute, entityId).then(setLinks).catch((err) => setError(String(err)));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityRoute, entityId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api.createLink(entityRoute, entityId, { url, provider, type, title: title || undefined });
      setUrl('');
      setTitle('');
      await load();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold">External links</h3>
      <ul className="mb-4 space-y-2">
        {links.map((link) => {
          const key = `${link.provider}:${link.type}`;
          const metaStatus = link.metadata?.status ? String(link.metadata.status) : null;
          const metaTitle = link.metadata?.title ? String(link.metadata.title) : null;
          return (
            <li key={link.id} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">
                  {LABELS[key] ?? `${link.provider} ${link.type}`}
                </span>
                <a className="text-indigo-700 underline" href={link.url} target="_blank" rel="noreferrer">
                  {link.title || metaTitle || link.url}
                </a>
                {metaStatus ? <span className="ml-2 text-slate-500">{metaStatus}</span> : null}
              </div>
              <button
                className="text-xs text-rose-700"
                onClick={() => api.deleteLink(link.id).then(load)}
                type="button"
              >
                Remove
              </button>
            </li>
          );
        })}
        {links.length === 0 ? <li className="text-sm text-slate-500">No links yet.</li> : null}
      </ul>
      <form className="grid gap-2 md:grid-cols-4" onSubmit={onSubmit}>
        <select className="rounded border px-2 py-1 text-sm" value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}>
          {LINK_PROVIDERS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select className="rounded border px-2 py-1 text-sm" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {LINK_TYPES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <input className="rounded border px-2 py-1 text-sm md:col-span-2" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <input className="rounded border px-2 py-1 text-sm md:col-span-3" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white" type="submit">
          Add link
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
