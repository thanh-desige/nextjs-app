'use client';
/**
 * BomView — Tab "BOM" trong BookThietKeBocTach
 * Hiển thị BOM từ projectStore, wrap BomPanel component
 * Có nút "Tạo báo giá →" chuyển sang BookBanHang
 */

import React from 'react';
import { useProjectStore } from '../../store';
import BomPanel from '../panels/BomPanel';
import type { BomEntry, MaterialType } from '../panels/BomPanel';

interface BomViewProps {
  onNavigateToBanHang?: () => void;
}

/** Map BomItem category → BomPanel MaterialType */
function mapCategory(cat: string): MaterialType {
  switch (cat) {
    case 'aluminum': return 'aluminum_frame';
    case 'glass': return 'glass';
    case 'accessory': return 'accessory';
    case 'service': return 'other';
    default: return 'other';
  }
}

export default function BomView({ onNavigateToBanHang }: BomViewProps): React.ReactElement {
  const bomItems = useProjectStore((s) => s.bomItems);
  const currentProject = useProjectStore((s) => s.currentProject);
  const calculateBom = useProjectStore((s) => s.calculateBom);
  const isCalculating = useProjectStore((s) => s.isCalculating);

  // Convert store BomItem → BomPanel BomEntry
  const entries: BomEntry[] = bomItems.map((item) => ({
    material: item.name,
    type: mapCategory(item.category),
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    description: item.notes,
  }));

  const pricing = {
    materialCost: bomItems.reduce((s, i) => s + i.totalPrice, 0),
    laborCost: 0,
    overheadCost: 0,
    totalCost: bomItems.reduce((s, i) => s + i.totalPrice, 0),
  };

  return (
    <div style={{ height: '100%', backgroundColor: '#1e1e2e', color: '#ddd', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          BOM — {currentProject?.name ?? 'Chưa chọn dự án'}
        </span>
        <button
          onClick={calculateBom}
          disabled={isCalculating}
          style={{
            padding: '5px 14px', borderRadius: 4, border: '1px solid #444',
            backgroundColor: '#2a2a3e', color: '#ddd', fontSize: 12, cursor: 'pointer',
          }}
        >
          {isCalculating ? 'Đang tính...' : '🔄 Tính lại BOM'}
        </button>
        {onNavigateToBanHang && (
          <button
            onClick={onNavigateToBanHang}
            style={{
              marginLeft: 'auto', padding: '5px 16px', borderRadius: 4,
              border: 'none', backgroundColor: '#3b82f6', color: '#fff',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Tạo báo giá →
          </button>
        )}
      </div>

      {/* BOM content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {!currentProject ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
            Vui lòng chọn dự án ở tab &ldquo;Dự án&rdquo; trước khi xem BOM.
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
            Chưa có dữ liệu BOM. Nhấn &ldquo;🔄 Tính lại BOM&rdquo; hoặc thiết kế bản vẽ trước.
          </div>
        ) : (
          <BomPanel entries={entries} pricing={pricing} currency="đ" />
        )}
      </div>
    </div>
  );
}
