import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export function SelectField({ label, value, options, onChange }: Props) {
  return (
    <div>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 10,
            color: 'var(--color-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 3,
          }}
        >
          {label}
        </label>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
