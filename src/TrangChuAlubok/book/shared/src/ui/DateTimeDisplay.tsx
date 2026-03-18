'use client';
// ============================================================
// DateTimeDisplay — Renders timestamp with semantic relative time
//
// Usage: <DateTimeDisplay value="2026-03-18T10:30:00Z" />
// → Shows "2 giờ trước" with tooltip showing full datetime
// ============================================================

import React from 'react';
import { toSemanticTime, formatDateTime } from '../services/timeService';

interface DateTimeDisplayProps {
  value: string;
  /** Show absolute date instead of relative */
  absolute?: boolean;
  /** Custom timezone (default: Asia/Ho_Chi_Minh) */
  timezone?: string;
  /** Date format */
  format?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  style?: React.CSSProperties;
}

export default function DateTimeDisplay({
  value,
  absolute = false,
  timezone = 'Asia/Ho_Chi_Minh',
  format = 'DD/MM/YYYY',
  style,
}: DateTimeDisplayProps): React.ReactElement {
  if (!value) {
    return <span style={{ color: '#6c7086', ...style }}>—</span>;
  }

  const fullText = formatDateTime(value, format, timezone);

  if (absolute) {
    return <span style={{ color: '#cdd6f4', fontSize: 13, ...style }}>{fullText}</span>;
  }

  const semantic = toSemanticTime(value);

  return (
    <span
      title={fullText}
      style={{ color: semantic.color, fontSize: 13, cursor: 'default', ...style }}
    >
      {semantic.label}
    </span>
  );
}
