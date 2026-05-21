import React from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
  /** Stretch to fill parent height. Parent must be a flex column with a definite height. */
  fill?: boolean;
}

export function TextareaField({ label, value, onChange, rows = 4, mono = false, placeholder, fill = false }: Props) {
  const wrapperStyle: React.CSSProperties = fill
    ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }
    : {};
  const textareaStyle: React.CSSProperties = fill
    ? {
        width: '100%',
        flex: 1,
        minHeight: 0,
        resize: 'none',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        fontSize: mono ? 11 : 12,
      }
    : {
        width: '100%',
        resize: 'vertical',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        fontSize: mono ? 11 : 12,
      };
  return (
    <div style={wrapperStyle}>
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
        rows={fill ? undefined : rows}
        placeholder={placeholder}
        style={textareaStyle}
      />
    </div>
  );
}
