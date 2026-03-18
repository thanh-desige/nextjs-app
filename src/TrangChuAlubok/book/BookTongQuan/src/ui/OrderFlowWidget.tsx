'use client';
// ============================================================
// OrderFlowWidget — Visual pipeline flow
// Báo giá → Đơn hàng → Sản xuất → Lắp đặt → Nghiệm thu → Thu tiền
// ============================================================

import React from 'react';
import type { FlowStep } from '../types';

interface OrderFlowWidgetProps {
  steps: FlowStep[];
}

export default function OrderFlowWidget({ steps }: OrderFlowWidgetProps): React.ReactElement {
  return (
    <div style={{
      backgroundColor: '#313244',
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
        🔄 Quy trình đơn hàng
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
      }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            {/* Step card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              minWidth: 90,
              flex: 1,
            }}>
              {/* Circle with count */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: `${step.color}25`,
                border: `2px solid ${step.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step.color,
                fontSize: 20,
                fontWeight: 700,
              }}>
                {step.count}
              </div>
              <span style={{
                color: '#a6adc8',
                fontSize: 12,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>

            {/* Arrow between steps */}
            {idx < steps.length - 1 && (
              <div style={{
                flexShrink: 0,
                color: '#585b70',
                fontSize: 18,
                margin: '0 -4px',
                paddingBottom: 22,
              }}>
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
