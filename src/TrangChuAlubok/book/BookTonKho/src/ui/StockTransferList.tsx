'use client';
// ============================================================
// StockTransferList — Danh sách phiếu chuyển kho
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiEye } from 'react-icons/fi';
import { useTonKhoStore } from '../store/tonKhoStore';
import { VOUCHER_STATUS_LABELS, VOUCHER_STATUS_COLORS } from '../types';
import type { StockVoucherStatus } from '../types';

interface StockTransferListProps {
  onView: (transferId: string) => void;
  onCreate: () => void;
}

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('vi-VN'); }

function StatusBadge({ status }: { status: StockVoucherStatus }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      backgroundColor: VOUCHER_STATUS_COLORS[status] + '20', color: VOUCHER_STATUS_COLORS[status],
    }}>
      {VOUCHER_STATUS_LABELS[status]}
    </span>
  );
}

export default function StockTransferList({ onView, onCreate }: StockTransferListProps): React.ReactElement {
  const transfers = useTonKhoStore(s => s.transfers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockVoucherStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let list = transfers;
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(t =>
        t.transferCode.toLowerCase().includes(term) ||
        t.fromWarehouseName.toLowerCase().includes(term) ||
        t.toWarehouseName.toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [transfers, search, statusFilter]);

  const totalAmount = filtered.reduce((s, t) => s + t.totalAmount, 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Phiếu chuyển kho</h2>
          <p style={{ color: '#6c7086', fontSize: 13, margin: '4px 0 0' }}>{filtered.length} phiếu · Tổng: {formatCurrency(totalAmount)}</p>
        </div>
        <button onClick={onCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, backgroundColor: '#89b4fa', color: '#1e1e2e', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          <FiPlus size={16} /> Tạo phiếu chuyển
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#6c7086' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo mã, kho..."
            style={{ width: '100%', padding: '8px 8px 8px 30', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StockVoucherStatus | 'all')}
          style={{ padding: '8px 12px', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4' }}>
          <option value="all">Tất cả trạng thái</option>
          {(Object.keys(VOUCHER_STATUS_LABELS) as StockVoucherStatus[]).map(s => (
            <option key={s} value={s}>{VOUCHER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div style={{ borderRadius: 8, border: '1px solid #313244', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#181825' }}>
              {['Mã PCK', 'Kho xuất', 'Kho nhận', 'Ngày tạo', 'Tổng tiền', 'Trạng thái', ''].map((h, i, arr) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6c7086', borderBottom: '1px solid #313244', borderRight: i < arr.length - 1 ? '1px solid #313244' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#6c7086' }}>Không có phiếu chuyển nào</td></tr>
            ) : filtered.map(t => (
              <tr key={t.transferId} onClick={() => onView(t.transferId)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #313244' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(137,180,250,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, fontSize: 13, borderRight: '1px solid #313244' }}>{t.transferCode}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, borderRight: '1px solid #313244' }}>{t.fromWarehouseName}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, borderRight: '1px solid #313244' }}>{t.toWarehouseName}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{formatDate(t.createdAt)}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, borderRight: '1px solid #313244' }}>{formatCurrency(t.totalAmount)}</td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #313244' }}><StatusBadge status={t.status} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={e => { e.stopPropagation(); onView(t.transferId); }} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiEye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
