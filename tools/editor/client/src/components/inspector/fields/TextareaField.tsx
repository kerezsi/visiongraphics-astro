import React from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
}

export function TextareaField({ label, value, onChange, rows = 4, mono = false, placeholder }: Props) {
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
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%',
          resize: 'vertical',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize: mono ? 11 : 12,
        }}
      />
    </div>
  );
}
