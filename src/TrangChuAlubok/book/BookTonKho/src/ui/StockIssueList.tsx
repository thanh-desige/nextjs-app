'use client';
// ============================================================
// StockIssueList — Danh sách phiếu xuất kho
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiEye } from 'react-icons/fi';
import { useTonKhoStore } from '../store/tonKhoStore';
import { VOUCHER_STATUS_LABELS, VOUCHER_STATUS_COLORS } from '../types';
import type { StockVoucherStatus } from '../types';

interface StockIssueListProps {
  onView: (issueId: string) => void;
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

export default function StockIssueList({ onView, onCreate }: StockIssueListProps): React.ReactElement {
  const issues = useTonKhoStore(s => s.issues);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockVoucherStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let list = issues;
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(i =>
        i.issueCode.toLowerCase().includes(term) ||
        i.warehouseName.toLowerCase().includes(term) ||
        (i.customerName ?? '').toLowerCase().includes(term) ||
        (i.soCode ?? '').toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [issues, search, statusFilter]);

  const totalAmount = filtered.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Phiếu xuất kho</h2>
          <p style={{ color: '#6c7086', fontSize: 13, margin: '4px 0 0' }}>{filtered.length} phiếu · Tổng: {formatCurrency(totalAmount)}</p>
        </div>
        <button onClick={onCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, backgroundColor: '#89b4fa', color: '#1e1e2e', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          <FiPlus size={16} /> Tạo phiếu xuất
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#6c7086' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo mã, kho, khách hàng, SO..."
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
              {['Mã PXK', 'Kho', 'Khách hàng', 'Mã SO', 'Ngày tạo', 'Tổng tiền', 'Trạng thái', ''].map((h, i, arr) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6c7086', borderBottom: '1px solid #313244', borderRight: i < arr.length - 1 ? '1px solid #313244' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#6c7086' }}>Không có phiếu xuất nào</td></tr>
            ) : filtered.map(i => (
              <tr key={i.issueId} onClick={() => onView(i.issueId)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #313244' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(137,180,250,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, fontSize: 13, borderRight: '1px solid #313244' }}>{i.issueCode}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, borderRight: '1px solid #313244' }}>{i.warehouseName}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{i.customerName ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{i.soCode ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{formatDate(i.createdAt)}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, borderRight: '1px solid #313244' }}>{formatCurrency(i.totalAmount)}</td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #313244' }}><StatusBadge status={i.status} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={e => { e.stopPropagation(); onView(i.issueId); }} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiEye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
