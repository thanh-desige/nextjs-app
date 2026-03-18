'use client';
// ============================================================
// ActivityTimeline — Vertical timeline of recent system events
//
// Aggregates ActivityEvents from all modules, sorted by timestamp desc.
// Used in: BookTongQuan dashboard, and potentially in each module.
// ============================================================

import React from 'react';
import type { ActivityEvent } from '../types/time.types';
import { toSemanticTime } from '../services/timeService';

const MODULE_ICONS: Record<string, string> = {
  BanHang: '🛒',
  MuaHang: '📋',
  TonKho: '📦',
  ThuChi: '💰',
  KeToan: '📊',
  SanXuatThiCong: '🏭',
  ThietKeBocTach: '✏️',
  ThietLap: '⚙️',
  DanhMuc: '📂',
  TongQuan: '📈',
};

const ACTION_COLORS: Record<string, string> = {
  create: '#a6e3a1',
  approve: '#89b4fa',
  reject: '#f38ba8',
  confirm: '#a6e3a1',
  complete: '#cba6f7',
  cancel: '#585b70',
  delete: '#f38ba8',
  update: '#f9e2af',
  send: '#89b4fa',
  receive: '#a6e3a1',
  pay: '#fab387',
  issue: '#cba6f7',
  transfer: '#f9e2af',
  close: '#6c7086',
  reopen: '#89b4fa',
};

interface ActivityTimelineProps {
  events: ActivityEvent[];
  maxItems?: number;
}

export default function ActivityTimeline({
  events,
  maxItems = 10,
}: ActivityTimelineProps): React.ReactElement {
  const sorted = [...events]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, maxItems);

  if (sorted.length === 0) {
    return (
      <div style={{
        backgroundColor: '#313244',
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          🕐 Hoạt động gần đây
        </h3>
        <div style={{ color: '#6c7086', fontSize: 14, textAlign: 'center', padding: 20 }}>
          Chưa có hoạt động nào
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#313244',
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
        🕐 Hoạt động gần đây
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sorted.map((event, idx) => {
          const semantic = toSemanticTime(event.timestamp);
          const icon = MODULE_ICONS[event.module] ?? '📌';
          const dotColor = ACTION_COLORS[event.action] ?? '#a6adc8';

          return (
            <div
              key={event.eventId}
              style={{
                display: 'flex',
                gap: 12,
                position: 'relative',
                paddingBottom: idx < sorted.length - 1 ? 16 : 0,
              }}
            >
              {/* Timeline line + dot */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 20,
                flexShrink: 0,
              }}>
                {/* Dot */}
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  flexShrink: 0,
                  marginTop: 5,
                }} />
                {/* Line */}
                {idx < sorted.length - 1 && (
                  <div style={{
                    width: 1,
                    flex: 1,
                    backgroundColor: '#45475a',
                    marginTop: 4,
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ color: '#cdd6f4', fontSize: 13, fontWeight: 500 }}>
                    {event.description}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                  <span style={{ color: '#6c7086', fontSize: 11 }}>{event.userName}</span>
                  <span style={{ color: semantic.color, fontSize: 11 }}>{semantic.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
