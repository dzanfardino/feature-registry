import { FormEvent, useEffect, useState } from 'react';
import { ATTRIBUTE_DATA_TYPES, ATTRIBUTE_ENTITY_TYPES } from '@feature-registry/shared';
import { api, AttributeDefinition } from '../api';

const emptyForm = {
  key: '',
  label: '',
  description: '',
  dataType: 'string' as (typeof ATTRIBUTE_DATA_TYPES)[number],
  appliesTo: 'Feature' as (typeof ATTRIBUTE_ENTITY_TYPES)[number],
  required: false,
  options: '',
  sortOrder: 0,
  min: '',
  max: '',
  regex: '',
};

export function AdminAttributesPage() {
  const [items, setItems] = useState<AttributeDefinition[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => api.listDefinitions(undefined, true).then(setItems);

  useEffect(() => {
    void load();
  }, []);

  function startEdit(item: AttributeDefinition) {
    setEditingId(item.id);
    setForm({
      key: item.key,
      label: item.label,
      description: item.description || '',
      dataType: item.dataType,
      appliesTo: item.appliesTo,
      required: item.required,
      options: (item.options ?? []).join(', '),
      sortOrder: item.sortOrder,
      min: item.validation?.min != null ? String(item.validation.min) : '',
      max: item.validation?.max != null ? String(item.validation.max) : '',
      regex: item.validation?.regex || '',
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      label: form.label,
      description: form.description || undefined,
      dataType: form.dataType,
      required: form.required,
      options: form.dataType === 'enum' ? form.options.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
      sortOrder: Number(form.sortOrder),
      validation: {
        min: form.min === '' ? null : Number(form.min),
        max: form.max === '' ? null : Number(form.max),
        regex: form.regex || null,
      },
    };
    if (editingId) {
      await api.updateDefinition(editingId, payload);
    } else {
      await api.createDefinition({
        ...payload,
        key: form.key,
        appliesTo: form.appliesTo,
      });
    }
    setEditingId(null);
    setForm(emptyForm);
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Attribute definitions</h1>
      <p className="text-sm text-slate-600">
        Configure extra fields at runtime. Core fields stay first-class; these definitions drive forms, list columns, and
        filters.
      </p>
      <form className="grid gap-2 rounded-lg border bg-white p-4 md:grid-cols-2" onSubmit={onSubmit}>
        <input
          className="rounded border px-2 py-1"
          placeholder="key"
          value={form.key}
          onChange={(e) => setForm({ ...form, key: e.target.value })}
          required
          disabled={Boolean(editingId)}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Label"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          required
        />
        <select
          className="rounded border px-2 py-1"
          value={form.dataType}
          onChange={(e) => setForm({ ...form, dataType: e.target.value as typeof form.dataType })}
        >
          {ATTRIBUTE_DATA_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-1"
          value={form.appliesTo}
          onChange={(e) => setForm({ ...form, appliesTo: e.target.value as typeof form.appliesTo })}
          disabled={Boolean(editingId)}
        >
          {ATTRIBUTE_ENTITY_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <input
          className="rounded border px-2 py-1 md:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {form.dataType === 'enum' ? (
          <input
            className="rounded border px-2 py-1 md:col-span-2"
            placeholder="Options (comma-separated)"
            value={form.options}
            onChange={(e) => setForm({ ...form, options: e.target.value })}
          />
        ) : null}
        <input
          className="rounded border px-2 py-1"
          placeholder="Min (optional)"
          value={form.min}
          onChange={(e) => setForm({ ...form, min: e.target.value })}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Max (optional)"
          value={form.max}
          onChange={(e) => setForm({ ...form, max: e.target.value })}
        />
        <input
          className="rounded border px-2 py-1 md:col-span-2"
          placeholder="Regex (optional)"
          value={form.regex}
          onChange={(e) => setForm({ ...form, regex: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm({ ...form, required: e.target.checked })}
          />
          Required
        </label>
        <div className="flex gap-2">
          <button className="rounded bg-slate-900 px-3 py-1 text-white" type="submit">
            {editingId ? 'Save definition' : 'Create definition'}
          </button>
          {editingId ? (
            <button
              className="rounded border px-3 py-1"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
      <ul className="divide-y rounded-lg border bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <div className="font-medium">
                {item.label} <span className="text-slate-500">({item.key})</span>
              </div>
              <div className="text-slate-600">
                {item.appliesTo} · {item.dataType} · {item.status}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="text-indigo-700" type="button" onClick={() => startEdit(item)}>
                Edit
              </button>
              {item.status === 'active' ? (
                <button className="text-rose-700" type="button" onClick={() => api.archiveDefinition(item.id).then(load)}>
                  Archive
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
