'use client';
// ============================================================
// DateRangeFilter — Shared preset selector for time filtering
//
// === E. KIẾN TRÚC FRONTEND ===
// Dùng trong MỌI module list/report screen.
// Gửi preset → backend resolve range → filter data.
// Frontend KHÔNG tự tính start/end.
// ============================================================

import React, { useState } from 'react';
import type { TimePreset, TimeRangeQuery } from '../types/time.types';
import { TIME_PRESET_LABELS } from '../types/time.types';

interface DateRangeFilterProps {
  value: TimeRangeQuery;
  onChange: (query: TimeRangeQuery) => void;
  /** Optional: restrict available presets */
  allowedPresets?: TimePreset[];
}

const ALL_PRESETS: TimePreset[] = [
  'today', 'yesterday', 'last7days', 'thisWeek', 'lastWeek',
  'last30days', 'thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', 'custom',
];

export default function DateRangeFilter({
  value,
  onChange,
  allowedPresets,
}: DateRangeFilterProps): React.ReactElement {
  const presets = allowedPresets ?? ALL_PRESETS;
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  function handlePresetChange(preset: TimePreset) {
    if (preset === 'custom') {
      setShowCustom(true);
      onChange({ preset: 'custom', customStart: value.customStart, customEnd: value.customEnd });
    } else {
      setShowCustom(false);
      onChange({ preset });
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {/* Preset dropdown */}
      <select
        value={value.preset}
        onChange={e => handlePresetChange(e.target.value as TimePreset)}
        style={{
          backgroundColor: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 13,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {presets.map(p => (
          <option key={p} value={p}>{TIME_PRESET_LABELS[p]}</option>
        ))}
      </select>

      {/* Custom date inputs */}
      {showCustom && (
        <>
          <input
            type="date"
            value={value.customStart ?? ''}
            onChange={e => onChange({ ...value, preset: 'custom', customStart: e.target.value })}
            style={{
              backgroundColor: '#313244',
              color: '#cdd6f4',
              border: '1px solid #45475a',
              borderRadius: 6,
              padding: '5px 8px',
              fontSize: 13,
            }}
          />
          <span style={{ color: '#6c7086', fontSize: 13 }}>→</span>
          <input
            type="date"
            value={value.customEnd ?? ''}
            onChange={e => onChange({ ...value, preset: 'custom', customEnd: e.target.value })}
            style={{
              backgroundColor: '#313244',
              color: '#cdd6f4',
              border: '1px solid #45475a',
              borderRadius: 6,
              padding: '5px 8px',
              fontSize: 13,
            }}
          />
        </>
      )}
    </div>
  );
}
