'use client';
// ============================================================
// QuickAccess — Quick action buttons grid
// Shortcuts to common operations across modules
// ============================================================

import React from 'react';
import type { QuickAction } from '../types';

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'q1', label: 'Tạo báo giá', icon: '📝', description: 'Tạo báo giá mới', page: 3, tab: 'quotes' },
  { id: 'q2', label: 'Đơn bán hàng', icon: '🛒', description: 'Quản lý đơn bán', page: 3, tab: 'orders' },
  { id: 'q3', label: 'Yêu cầu mua', icon: '📋', description: 'Tạo yêu cầu mua', page: 2, tab: 'requests' },
  { id: 'q4', label: 'Nhập kho', icon: '📥', description: 'Nhập kho hàng hóa', page: 6, tab: 'receipts' },
  { id: 'q5', label: 'Xuất kho', icon: '📤', description: 'Xuất kho vật tư', page: 6, tab: 'issues' },
  { id: 'q6', label: 'Thu tiền', icon: '💵', description: 'Lập phiếu thu', page: 5, tab: 'receipts' },
  { id: 'q7', label: 'Chi tiền', icon: '💸', description: 'Lập phiếu chi', page: 5, tab: 'payments' },
  { id: 'q8', label: 'Lệnh SX', icon: '🏭', description: 'Lệnh sản xuất', page: 10 },
];

interface QuickAccessProps {
  onNavigate?: (page: number, tab?: string) => void;
}

export default function QuickAccess({ onNavigate }: QuickAccessProps): React.ReactElement {
  return (
    <div style={{
      backgroundColor: '#313244',
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
        ⚡ Truy cập nhanh
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => onNavigate?.(action.page, action.tab)}
            style={{
              background: '#45475a',
              border: 'none',
              borderRadius: 10,
              padding: '14px 8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#585b70'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#45475a'; }}
            title={action.description}
          >
            <span style={{ fontSize: 24 }}>{action.icon}</span>
            <span style={{ color: '#cdd6f4', fontSize: 12, textAlign: 'center' }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
