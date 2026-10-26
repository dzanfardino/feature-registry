import { FormEvent, useEffect, useState } from 'react';
import { api, AttributeDefinition } from '../api';
import { AttributeInput } from './AttributeInput';

interface Props {
  entityRoute: string;
  entityId: string;
  definitions: AttributeDefinition[];
  values: Record<string, unknown>;
  onSaved?: () => void;
}

export function CustomAttributesEditor({
  entityRoute,
  entityId,
  definitions,
  values,
  onSaved,
}: Props) {
  const [local, setLocal] = useState(values);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocal(values);
  }, [values]);

  if (!definitions.length) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api.setAttributes(entityRoute, entityId, local);
      onSaved?.();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <form className="grid gap-2 rounded border border-slate-100 bg-slate-50 p-3" onSubmit={onSubmit}>
      {definitions.map((definition) => (
        <AttributeInput
          key={definition.id}
          definition={definition}
          value={local[definition.key]}
          onChange={(key, value) => setLocal({ ...local, [key]: value })}
        />
      ))}
      <button className="w-fit rounded bg-slate-800 px-3 py-1 text-xs text-white" type="submit">
        Save attributes
      </button>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}
