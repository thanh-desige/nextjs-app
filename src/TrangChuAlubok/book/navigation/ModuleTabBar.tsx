// ============================================================
// ModuleTabBar — Horizontal contextual tab bar for modules
// Replaces level-2 sidebar navigation
// Renders at the top of content area with group separators
// ============================================================

'use client';
import React, { useState } from 'react';
import type { TabConfig } from './routeConfig';

interface ModuleTabBarProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

export default function ModuleTabBar({ tabs, activeTab, onTabChange }: ModuleTabBarProps): React.ReactElement {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      backgroundColor: '#181825',
      borderBottom: '1px solid #313244',
      paddingLeft: 12,
      height: 40,
      minHeight: 40,
      gap: 0,
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.key;
        const isHovered = hoveredKey === tab.key;
        const prevGroup = idx > 0 ? tabs[idx - 1].group : null;
        const showSeparator = idx > 0 && tab.group && prevGroup && tab.group !== prevGroup;

        return (
          <React.Fragment key={tab.key}>
            {showSeparator && (
              <div style={{
                width: 1,
                height: 20,
                backgroundColor: '#45475a',
                alignSelf: 'center',
                flexShrink: 0,
                margin: '0 4px',
              }} />
            )}
            <button
              onClick={() => onTabChange(tab.key)}
              onMouseEnter={() => setHoveredKey(tab.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                padding: '0 16px',
                height: '100%',
                border: 'none',
                borderBottom: isActive ? '2px solid #89b4fa' : '2px solid transparent',
                backgroundColor: isActive
                  ? 'rgba(137,180,250,0.08)'
                  : isHovered ? 'rgba(137,180,250,0.04)' : 'transparent',
                color: isActive ? '#89b4fa' : isHovered ? '#cdd6f4' : '#a6adc8',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
