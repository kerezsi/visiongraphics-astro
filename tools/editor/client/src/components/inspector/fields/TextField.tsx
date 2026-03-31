import React from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextField({ label, value, onChange, placeholder }: Props) {
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
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%' }}
      />
    </div>
  );
}
