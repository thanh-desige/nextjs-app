'use client';
/**
 * BookThietKeBocTachModule — Wrapper quản lý tab-level routing
 * Tab: Dự án (danh sách dạng bảng + sidebar lọc)
 * Canvas (CAD) = sub-route mở từ link "Thiết kế" trong bảng
 * BOM + Danh sách cắt = sub-route trong Canvas (sẽ bổ sung sau)
 */

import React, { useState } from 'react';
import BookThietKeBocTachPage from './BookThietKeBocTach/src/BookThietKeBocTachPage';
import ProjectListView from './BookThietKeBocTach/src/ui/views/ProjectListView';

interface BookThietKeBocTachModuleProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  sidebarCollapsed?: boolean;
  onNavigateToBanHang?: () => void;
}

export default function BookThietKeBocTachModule({
  activeTab,
  onTabChange,
  sidebarCollapsed = false,
  onNavigateToBanHang,
}: BookThietKeBocTachModuleProps): React.ReactElement {
  // Canvas sub-route: khi mở dự án sẽ chuyển sang CAD editor
  const [canvasProjectId, setCanvasProjectId] = useState<string | null>(null);
  const [canvasInitialTab, setCanvasInitialTab] = useState<'thietke' | 'filebom' | 'filebaogia'>('thietke');

  const handleOpenCanvas = (projectId: string, initialTab?: 'thietke' | 'filebom' | 'filebaogia'): void => {
    setCanvasProjectId(projectId);
    setCanvasInitialTab(initialTab ?? 'thietke');
  };

  const handleBackFromCanvas = (): void => {
    setCanvasProjectId(null);
  };

  // Nếu đang trong Canvas mode → render CAD editor fullscreen
  if (canvasProjectId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Back bar */}
        <div style={{
          height: 36, minHeight: 36, backgroundColor: '#181825',
          borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center',
          paddingLeft: 12, gap: 8, flexShrink: 0,
        }}>
          <button
            onClick={handleBackFromCanvas}
            style={{
              padding: '4px 12px', borderRadius: 4, border: '1px solid #444',
              backgroundColor: 'transparent', color: '#cdd6f4', fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ← Quay lại dự án
          </button>
          <span style={{ fontSize: 12, color: '#666' }}>
            Đang thiết kế: {canvasProjectId}
          </span>
        </div>
        {/* CAD editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BookThietKeBocTachPage mainSidebarCollapsed={sidebarCollapsed} initialTab={canvasInitialTab} />
        </div>
      </div>
    );
  }

  // Project list (no tab bar — only 1 tab)
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ProjectListView onOpenCanvas={handleOpenCanvas} onNavigateToBanHang={onNavigateToBanHang ? () => onNavigateToBanHang() : undefined} />
      </div>
    </div>
  );
}
