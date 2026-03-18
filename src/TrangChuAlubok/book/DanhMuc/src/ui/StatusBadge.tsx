'use client';
// ============================================================
// StatusBadge — Reusable active/inactive badge
// ============================================================

import React from 'react';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:   { bg: '#a6e3a11a', text: '#a6e3a1' },
  inactive: { bg: '#f38ba81a', text: '#f38ba8' },
  working:  { bg: '#a6e3a11a', text: '#a6e3a1' },
  resigned: { bg: '#f38ba81a', text: '#f38ba8' },
  on_leave: { bg: '#fab3871a', text: '#fab387' },
};

export function StatusBadge({ status }: { status: string }): React.ReactElement {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.active;
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: colors.bg,
      color: colors.text,
    }}>
      {status === 'active' || status === 'working' ? 'Hoạt động'
        : status === 'inactive' ? 'Ngừng'
        : status === 'resigned' ? 'Đã nghỉ'
        : status === 'on_leave' ? 'Nghỉ phép'
        : status}
    </span>
  );
}
