import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Application } from '../api';

export function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = () => api.listApplications().then(setItems);

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await api.createApplication({ name, description });
    setName('');
    setDescription('');
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Applications</h1>
      <form className="flex flex-wrap gap-2 rounded-lg border bg-white p-4" onSubmit={onSubmit}>
        <input className="rounded border px-2 py-1" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="min-w-64 flex-1 rounded border px-2 py-1" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
          Add
        </button>
      </form>
      <ul className="divide-y rounded-lg border bg-white">
        {items.map((item) => (
          <li key={item.id} className="p-4">
            <Link className="font-medium text-indigo-700" to={`/features?applicationId=${item.id}`}>
              {item.name}
            </Link>
            <p className="text-sm text-slate-600">{item.description}</p>
          </li>
        ))}
        {items.length === 0 ? <li className="p-4 text-slate-500">No applications yet.</li> : null}
      </ul>
    </div>
  );
}
