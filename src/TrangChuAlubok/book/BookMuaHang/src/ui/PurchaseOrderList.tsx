'use client';
import React, { useState } from 'react';
import { useMuaHangStore } from '../store/muaHangStore';
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '../types';

interface Props {
  onView: (id: string) => void;
  onCreate: () => void;
}

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }

export default function PurchaseOrderList({ onView, onCreate }: Props): React.ReactElement {
  const { orders } = useMuaHangStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      (o.requestCode ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = filtered.reduce((s, o) => s + o.paidAmount, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 600, margin: 0 }}>Đơn mua hàng</h2>
        <button onClick={onCreate} style={{ padding: '8px 20px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          + Tạo đơn mua
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm mã đơn, NCC, mã YCMH..."
          style={{ flex: 1, maxWidth: 350, padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(PO_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 8, border: '1px solid #313244', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#181825' }}>
              {['Mã DMH', 'Mã YCMH', 'Nhà cung cấp', 'Tổng tiền', 'Đã thanh toán', 'Ngày giao', 'Trạng thái', ''].map((h, i, arr) =>
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6c7086', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #313244', borderRight: i < arr.length - 1 ? '1px solid #313244' : undefined }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.orderId} onClick={() => onView(o.orderId)}
                style={{ borderBottom: '1px solid #313244', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(137,180,250,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>{o.orderCode}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', borderRight: '1px solid #313244' }}>{o.requestCode ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{o.supplierName || '(Chưa có NCC)'}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace', borderRight: '1px solid #313244' }}>{formatCurrency(o.totalAmount)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: o.paidAmount >= o.totalAmount ? '#a6e3a1' : '#f9e2af', borderRight: '1px solid #313244' }}>{formatCurrency(o.paidAmount)}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', borderRight: '1px solid #313244' }}>{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : '—'}</td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #313244' }}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#1e1e2e', backgroundColor: PO_STATUS_COLORS[o.status] }}>{PO_STATUS_LABELS[o.status]}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#6c7086' }}>▸</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ marginTop: 16, display: 'flex', gap: 24, color: '#a6adc8', fontSize: 13 }}>
        <span>{filtered.length} đơn</span>
        <span>Tổng: <b style={{ color: '#cdd6f4' }}>{formatCurrency(totalAmount)}</b></span>
        <span>Đã TT: <b style={{ color: '#a6e3a1' }}>{formatCurrency(totalPaid)}</b></span>
      </div>
    </div>
  );
}
