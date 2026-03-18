'use client';
// ============================================================
// DueBadge — Shows due/overdue status badge for deadlines
//
// Usage: <DueBadge dueDate="2026-03-20" />
// → Shows colored badge "Còn 2 ngày" or "Quá hạn 3 ngày"
// ============================================================

import React from 'react';
import { calcDueInfo } from '../services/timeService';

interface DueBadgeProps {
  dueDate: string;
  style?: React.CSSProperties;
}

export default function DueBadge({ dueDate, style }: DueBadgeProps): React.ReactElement {
  if (!dueDate) {
    return <span style={{ color: '#6c7086', ...style }}>—</span>;
  }

  const info = calcDueInfo(dueDate);

  return (
    <span
      title={dueDate}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        color: '#1e1e2e',
        backgroundColor: info.color,
        ...style,
      }}
    >
      {info.label}
    </span>
  );
}
