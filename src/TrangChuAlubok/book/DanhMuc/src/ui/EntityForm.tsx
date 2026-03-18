'use client';
// ============================================================
// EntityForm — Generic reusable form (add/edit) with field definitions
// Dark theme, modal-style overlay
// ============================================================

import React, { useState, useCallback } from 'react';

export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'email' | 'tel';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  width?: string;         // '50%' | '100%' default
}

export interface EntityFormProps {
  title: string;
  fields: FieldDef[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const STYLES = {
  overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#1e1e2e', borderRadius: 12, width: 600, maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' as const, border: '1px solid #313244' },
  header: { padding: '16px 20px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 600, color: '#cdd6f4' },
  body: { padding: 20, overflow: 'auto', flex: 1 },
  fieldRow: { display: 'flex', gap: 12, marginBottom: 14 },
  fieldGroup: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  label: { fontSize: 12, fontWeight: 500, color: '#a6adc8' },
  input: { padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none', width: '100%' },
  select: { padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none', width: '100%' },
  textarea: { padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none', width: '100%', resize: 'vertical' as const, minHeight: 60 },
  footer: { padding: '12px 20px', borderTop: '1px solid #313244', display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: '8px 20px', backgroundColor: 'transparent', border: '1px solid #45475a', borderRadius: 6, color: '#a6adc8', cursor: 'pointer', fontSize: 13 },
  submitBtn: { padding: '8px 20px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  required: { color: '#f38ba8' },
  closeBtn: { background: 'none', border: 'none', color: '#6c7086', cursor: 'pointer', fontSize: 18, padding: 4 },
};

export function EntityForm({
  title, fields, initialValues = {}, onSubmit, onCancel, submitLabel = 'Lưu',
}: EntityFormProps): React.ReactElement {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    for (const f of fields) {
      v[f.key] = initialValues[f.key] ?? (f.type === 'checkbox' ? false : f.type === 'number' ? 0 : '');
    }
    return v;
  });

  const setValue = useCallback((key: string, val: unknown) => {
    setValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  // Group fields into rows (2 per row if width=50%, else full row)
  const rows: FieldDef[][] = [];
  let currentRow: FieldDef[] = [];
  for (const f of fields) {
    if (f.width === '50%') {
      currentRow.push(f);
      if (currentRow.length === 2) { rows.push(currentRow); currentRow = []; }
    } else {
      if (currentRow.length > 0) { rows.push(currentRow); currentRow = []; }
      rows.push([f]);
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return (
    <div style={STYLES.overlay} onClick={onCancel}>
      <form style={STYLES.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        {/* Header */}
        <div style={STYLES.header}>
          <span style={STYLES.title}>{title}</span>
          <button type="button" onClick={onCancel} style={STYLES.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={STYLES.body}>
          {rows.map((row, ri) => (
            <div key={ri} style={STYLES.fieldRow}>
              {row.map(field => (
                <div key={field.key} style={{ ...STYLES.fieldGroup, flex: field.width === '50%' ? 1 : undefined, width: field.width !== '50%' ? '100%' : undefined }}>
                  <label style={STYLES.label}>
                    {field.label} {field.required && <span style={STYLES.required}>*</span>}
                  </label>
                  {renderField(field, values[field.key], (v) => setValue(field.key, v))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={STYLES.footer}>
          <button type="button" onClick={onCancel} style={STYLES.cancelBtn}>Hủy</button>
          <button type="submit" style={STYLES.submitBtn}>{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

function renderField(
  field: FieldDef,
  value: unknown,
  onChange: (v: unknown) => void,
): React.ReactElement {
  switch (field.type) {
    case 'select':
      return (
        <select
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          style={STYLES.select}
          required={field.required}
        >
          <option value="">-- Chọn --</option>
          {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'textarea':
      return (
        <textarea
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={STYLES.textarea}
          required={field.required}
        />
      );
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          style={{ accentColor: '#89b4fa', width: 16, height: 16, marginTop: 4 }}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={value as number}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          style={STYLES.input}
          required={field.required}
          min={field.min}
          max={field.max}
        />
      );
    default:
      return (
        <input
          type={field.type}
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={STYLES.input}
          required={field.required}
        />
      );
  }
}
