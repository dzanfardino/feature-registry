import type { AttributeDefinition } from '../api';

interface Props {
  definition: AttributeDefinition;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

export function AttributeInput({ definition, value, onChange }: Props) {
  const common = 'mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm';

  if (definition.dataType === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(definition.key, event.target.checked)}
        />
        {definition.label}
      </label>
    );
  }

  if (definition.dataType === 'enum') {
    return (
      <label className="block text-sm">
        {definition.label}
        <select
          className={common}
          value={String(value ?? '')}
          onChange={(event) => onChange(definition.key, event.target.value)}
        >
          <option value="">Select…</option>
          {(definition.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (definition.dataType === 'text') {
    return (
      <label className="block text-sm">
        {definition.label}
        <textarea
          className={common}
          value={String(value ?? '')}
          onChange={(event) => onChange(definition.key, event.target.value)}
        />
      </label>
    );
  }

  const inputType =
    definition.dataType === 'number'
      ? 'number'
      : definition.dataType === 'date'
        ? 'date'
        : definition.dataType === 'url'
          ? 'url'
          : 'text';

  return (
    <label className="block text-sm">
      {definition.label}
      <input
        type={inputType}
        className={common}
        value={String(value ?? '')}
        onChange={(event) =>
          onChange(
            definition.key,
            definition.dataType === 'number' ? event.target.valueAsNumber : event.target.value,
          )
        }
      />
    </label>
  );
}
