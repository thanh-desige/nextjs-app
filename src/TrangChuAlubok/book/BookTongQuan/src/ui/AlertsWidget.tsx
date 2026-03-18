'use client';
// ============================================================
// AlertsWidget — Notifications and alerts panel
// Shows warnings, overdue items, pending actions
// ============================================================

import React from 'react';
import type { AlertItem } from '../types';
import { ALERT_LEVEL_COLORS } from '../types';

interface AlertsWidgetProps {
  alerts: AlertItem[];
}

export default function AlertsWidget({ alerts }: AlertsWidgetProps): React.ReactElement {
  if (alerts.length === 0) {
    return (
      <div style={{
        backgroundColor: '#313244',
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          🔔 Thông báo
        </h3>
        <div style={{ color: '#6c7086', fontSize: 14, textAlign: 'center', padding: 20 }}>
          Không có thông báo mới
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
        🔔 Thông báo ({alerts.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map(alert => {
          const bgColor = ALERT_LEVEL_COLORS[alert.level];
          return (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: `${bgColor}12`,
                borderLeft: `3px solid ${bgColor}`,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{alert.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600 }}>
                  {alert.title}
                </div>
                <div style={{ color: '#a6adc8', fontSize: 13, marginTop: 2 }}>
                  {alert.message}
                </div>
                <div style={{ color: '#6c7086', fontSize: 11, marginTop: 4 }}>
                  {alert.module}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
