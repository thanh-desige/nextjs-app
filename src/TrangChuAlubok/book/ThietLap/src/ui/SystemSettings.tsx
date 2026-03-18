'use client';
// ============================================================
// SystemSettings — D6: setting.system
// System configuration: number format, currency, date format, timezone
// ============================================================

import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { useThietLapStore } from '../store/thietLapStore';
import type { SystemSettings } from '../types';

const NUMBER_FORMATS = [
  { value: 'vi-VN', label: 'Việt Nam (1.234.567,89)' },
  { value: 'en-US', label: 'US (1,234,567.89)' },
] as const;

const CURRENCIES = [
  { value: 'VND', label: 'VND — Đồng Việt Nam' },
  { value: 'USD', label: 'USD — US Dollar' },
] as const;

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
] as const;

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
] as const;

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'America/New_York', label: 'America/New York (GMT-5)' },
];

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div>
      <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function SystemSettingsPage(): React.ReactElement {
  const { systemSettings, setSystemSettings } = useThietLapStore();
  const [draft, setDraft] = useState<SystemSettings>({ ...systemSettings });
  const [saved, setSaved] = useState(false);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(systemSettings);

  const handleSave = () => {
    setSystemSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', backgroundColor: '#1e1e2e' }}>
      <div style={{ padding: 20, maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: 0 }}>Cấu hình hệ thống</h2>
            <p style={{ color: '#6c7086', fontSize: 12, margin: '4px 0 0' }}>Định dạng hiển thị, ngôn ngữ, múi giờ</p>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6, border: 'none',
              backgroundColor: saved ? '#a6e3a1' : hasChanges ? '#89b4fa' : '#313244',
              color: saved ? '#1e1e2e' : hasChanges ? '#1e1e2e' : '#6c7086',
              cursor: hasChanges ? 'pointer' : 'default',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <FiSave size={14} />
            {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SelectField label="Định dạng số" value={draft.numberFormat} options={NUMBER_FORMATS}
            onChange={v => update('numberFormat', v as SystemSettings['numberFormat'])} />

          <SelectField label="Tiền tệ" value={draft.currency} options={CURRENCIES}
            onChange={v => update('currency', v as SystemSettings['currency'])} />

          <SelectField label="Ngôn ngữ" value={draft.language} options={LANGUAGES}
            onChange={v => update('language', v as SystemSettings['language'])} />

          <SelectField label="Định dạng ngày" value={draft.dateFormat} options={DATE_FORMATS}
            onChange={v => update('dateFormat', v as SystemSettings['dateFormat'])} />

          <SelectField label="Múi giờ" value={draft.timezone} options={TIMEZONES}
            onChange={v => update('timezone', v)} />

          <div>
            <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 6 }}>Tháng bắt đầu năm tài chính</label>
            <select
              value={draft.fiscalYearStart}
              onChange={e => update('fiscalYearStart', parseInt(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
