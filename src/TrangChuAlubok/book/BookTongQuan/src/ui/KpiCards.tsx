'use client';
// ============================================================
// KpiCards — 6 KPI metric cards in a 3×2 grid
// ============================================================

import React from 'react';
import type { KpiCard } from '../types';

interface KpiCardsProps {
  kpis: KpiCard[];
}

export default function KpiCards({ kpis }: KpiCardsProps): React.ReactElement {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
    }}>
      {kpis.map(kpi => (
        <div
          key={kpi.key}
          style={{
            backgroundColor: '#313244',
            borderRadius: 12,
            padding: '20px 24px',
            borderLeft: `4px solid ${kpi.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Icon */}
          <div style={{
            fontSize: 32,
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: `${kpi.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {kpi.icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#a6adc8',
              fontSize: 13,
              marginBottom: 4,
            }}>
              {kpi.label}
            </div>
            <div style={{
              color: kpi.color,
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.2,
            }}>
              {kpi.formattedValue}
            </div>
            {kpi.subtitle && (
              <div style={{
                color: '#6c7086',
                fontSize: 12,
                marginTop: 4,
              }}>
                {kpi.subtitle}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
