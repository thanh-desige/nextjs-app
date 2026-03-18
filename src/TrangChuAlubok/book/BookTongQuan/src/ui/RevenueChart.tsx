'use client';
// ============================================================
// RevenueChart — CSS-based horizontal bar chart
// Shows financial overview by module
// ============================================================

import React from 'react';
import type { ChartBar } from '../types';
import { formatCurrency, getMaxBarValue } from '../helpers/dashboardHelpers';

interface RevenueChartProps {
  bars: ChartBar[];
}

export default function RevenueChart({ bars }: RevenueChartProps): React.ReactElement {
  const maxVal = getMaxBarValue(bars);

  return (
    <div style={{
      backgroundColor: '#313244',
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
        📊 Tổng quan tài chính
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {bars.map(bar => {
          const pct = maxVal > 0 ? (bar.value / maxVal) * 100 : 0;
          return (
            <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Label */}
              <div style={{
                width: 80,
                color: '#a6adc8',
                fontSize: 13,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {bar.label}
              </div>

              {/* Bar */}
              <div style={{
                flex: 1,
                height: 24,
                backgroundColor: '#45475a',
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${Math.max(pct, 2)}%`,
                  height: '100%',
                  backgroundColor: bar.color,
                  borderRadius: 6,
                  transition: 'width 0.6s ease',
                  opacity: 0.85,
                }} />
              </div>

              {/* Value */}
              <div style={{
                width: 70,
                color: bar.color,
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {formatCurrency(bar.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
