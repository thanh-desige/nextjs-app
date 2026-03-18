'use client';
// ============================================================
// SalesOrderList — Danh sách đơn bán hàng
// Table with status badges, search, filter
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiEye } from 'react-icons/fi';
import { useBanHangStore } from '../store/banHangStore';
import { SO_STATUS_LABELS, SO_STATUS_COLORS } from '../types';
import type { SalesOrderStatus } from '../types';

interface SalesOrderListProps {
  onView: (orderId: string) => void;
  onCreate: () => void;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function SalesOrderList({ onView, onCreate }: SalesOrderListProps): React.ReactElement {
  const orders = useBanHangStore(s => s.orders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(o =>
        o.orderCode.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        (o.quoteCode ?? '').toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, search, statusFilter]);

  const totalAmount = filtered.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = filtered.reduce((s, o) => s + o.paidAmount, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Đơn bán hàng</h2>
          <p style={{ color: '#6c7086', fontSize: 13, margin: '4px 0 0' }}>
            {filtered.length} đơn · Tổng: {formatCurrency(totalAmount)} · Đã thu: {formatCurrency(totalPaid)}
          </p>
        </div>
        <button onClick={onCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6,
          backgroundColor: '#89b4fa', color: '#1e1e2e', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
        }}>
          <FiPlus size={16} /> Tạo đơn hàng
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#6c7086' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo mã, khách hàng..."
            style={{ width: '100%', padding: '8px 8px 8px 30', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as SalesOrderStatus | 'all')}
          style={{ padding: '8px 12px', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4' }}>
          <option value="all">Tất cả trạng thái</option>
          {(Object.keys(SO_STATUS_LABELS) as SalesOrderStatus[]).map(s => (
            <option key={s} value={s}>{SO_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 8, border: '1px solid #313244', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#181825' }}>
              {['Mã ĐH', 'Mã BG', 'Khách hàng', 'Ngày tạo', 'Giao hàng', 'Tổng tiền', 'Đã thu', 'Trạng thái', ''].map((h, i, arr) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6c7086', borderBottom: '1px solid #313244', borderRight: i < arr.length - 1 ? '1px solid #313244' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#6c7086' }}>Không có đơn hàng nào</td></tr>
            ) : filtered.map(o => (
              <tr key={o.orderId} onClick={() => onView(o.orderId)} style={{ cursor: 'pointer', borderBottom: '1px solid #313244' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(137,180,250,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, fontSize: 13, borderRight: '1px solid #313244' }}>{o.orderCode}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{o.quoteCode ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, borderRight: '1px solid #313244' }}>{o.customerName}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{formatDate(o.createdAt)}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{o.deliveryDate ? formatDate(o.deliveryDate) : '—'}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, borderRight: '1px solid #313244' }}>{formatCurrency(o.totalAmount)}</td>
                <td style={{ padding: '10px 12px', color: o.paidAmount >= o.totalAmount ? '#a6e3a1' : '#f9e2af', fontSize: 13, borderRight: '1px solid #313244' }}>{formatCurrency(o.paidAmount)}</td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #313244' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: SO_STATUS_COLORS[o.status] + '20', color: SO_STATUS_COLORS[o.status] }}>
                    {SO_STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={e => { e.stopPropagation(); onView(o.orderId); }} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiEye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
