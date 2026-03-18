'use client';
import React, { useState } from 'react';
import type { SanXuatSection } from '../types';

interface SectionItem {
  key: SanXuatSection;
  label: string;
  icon: string;
}

const SECTIONS: SectionItem[] = [
  { key: 'overview', label: 'Tổng quan tiến độ', icon: '📊' },
  { key: 'production-orders', label: 'Lệnh sản xuất', icon: '🏭' },
  { key: 'material-plans', label: 'Kế hoạch vật tư', icon: '📋' },
  { key: 'material-issues', label: 'Xuất dùng SX', icon: '📦' },
  { key: 'installations', label: 'Thi công / Lắp đặt', icon: '🔧' },
  { key: 'acceptances', label: 'Nghiệm thu / Bàn giao', icon: '✅' },
  { key: 'reports', label: 'Báo cáo', icon: '📈' },
];

interface SubSidebarProps {
  activeSection: SanXuatSection;
  onSectionChange: (section: SanXuatSection) => void;
}

export default function SubSidebar({ activeSection, onSectionChange }: SubSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        width: collapsed ? 48 : 210,
        minWidth: collapsed ? 48 : 210,
        backgroundColor: '#181825',
        borderRight: '1px solid #313244',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 8,
        overflowY: 'auto',
        position: 'relative',
        transition: 'width 0.2s ease, min-width 0.2s ease',
      }}
    >
      {/* Collapse button */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: 16,
          height: 40,
          background: 'rgba(137, 180, 250, 0.12)',
          borderRadius: 4,
          position: 'absolute',
          top: '50%',
          right: -8,
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid rgba(137, 180, 250, 0.25)',
          zIndex: 10,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(137, 180, 250, 0.25)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(137, 180, 250, 0.12)'; }}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="#89b4fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="8 4 16 12 8 20" />
        </svg>
      </div>

      {SECTIONS.map((s) => {
        const isActive = s.key === activeSection;
        return (
          <button
            key={s.key}
            onClick={() => onSectionChange(s.key)}
            title={collapsed ? s.label : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: collapsed ? '10px 0' : '10px 14px',
              margin: '2px 6px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#cdd6f4' : '#a6adc8',
              backgroundColor: isActive ? '#313244' : 'transparent',
              textAlign: 'left',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background-color 0.15s, color 0.15s, padding 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = '#262637';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
            {!collapsed && <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
