'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import {
  PO_STATUS_LABELS, PO_STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  type ProductionOrderStatus,
} from '../types';

const fmt = (n: number) => n.toLocaleString('vi-VN');

interface Props {
  onAdd: () => void;
  onSelect: (id: string) => void;
}

export default function ProductionOrderList({ onAdd, onSelect }: Props) {
  const { productionOrders, projects } = useSanXuatThiCongStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductionOrderStatus | ''>('');

  const filtered = productionOrders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.projectCode.toLowerCase().includes(q) ||
        o.items.some((i) => i.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Lệnh sản xuất</h2>
        <button
          onClick={onAdd}
          style={{
            padding: '8px 20px',
            backgroundColor: '#a6e3a1',
            color: '#1e1e2e',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + Tạo lệnh SX
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã lệnh, công trình..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            color: '#cdd6f4',
            fontSize: 13,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProductionOrderStatus | '')}
          style={{
            padding: '8px 12px',
            backgroundColor: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            color: '#cdd6f4',
            fontSize: 13,
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(PO_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #313244' }}>
            {['Mã lệnh', 'Công trình', 'Hạng mục', 'Ưu tiên', 'Hạn', 'Tiến độ', 'Trạng thái'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  color: '#a6adc8',
                  fontWeight: 600,
                  borderRight: '1px solid #313244',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((o) => {
            const totalQty = o.items.reduce((s, i) => s + i.quantity, 0);
            const completedQty = o.items.reduce((s, i) => s + i.completedQty, 0);
            const pct = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = o.status !== 'completed' && o.status !== 'cancelled' && o.dueDate < today;

            return (
              <tr
                key={o.orderId}
                onClick={() => onSelect(o.orderId)}
                style={{ borderBottom: '1px solid #313244', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262637')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '10px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>
                  {o.orderCode}
                </td>
                <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>
                  {o.projectCode}
                </td>
                <td style={{ padding: '10px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                  {o.items.map((i) => i.description).join(', ').slice(0, 50)}
                  {o.items.map((i) => i.description).join(', ').length > 50 ? '...' : ''}
                </td>
                <td style={{ padding: '10px', borderRight: '1px solid #313244' }}>
                  <span style={{ color: PRIORITY_COLORS[o.priority], fontWeight: 600, fontSize: 12 }}>
                    {PRIORITY_LABELS[o.priority]}
                  </span>
                </td>
                <td style={{ padding: '10px', color: isOverdue ? '#f38ba8' : '#bac2de', fontWeight: isOverdue ? 600 : 400, borderRight: '1px solid #313244' }}>
                  {o.dueDate}
                  {isOverdue && ' ⚠️'}
                </td>
                <td style={{ padding: '10px', borderRight: '1px solid #313244' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 6, backgroundColor: '#313244', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: pct === 100 ? '#a6e3a1' : '#f9e2af',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span style={{ color: '#a6adc8', fontSize: 11, minWidth: 32, textAlign: 'right' }}>
                      {pct}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#1e1e2e',
                      backgroundColor: PO_STATUS_COLORS[o.status],
                    }}
                  >
                    {PO_STATUS_LABELS[o.status]}
                  </span>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>
                Không tìm thấy lệnh sản xuất nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
