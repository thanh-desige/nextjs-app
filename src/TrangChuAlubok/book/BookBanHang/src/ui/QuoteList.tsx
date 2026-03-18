'use client';
// ============================================================
// QuoteList — Danh sách báo giá
// Table with status badges, search, filter, actions
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiEye } from 'react-icons/fi';
import { useBanHangStore } from '../store/banHangStore';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '../types';
import type { QuoteStatus } from '../types';

interface QuoteListProps {
  onView: (quoteId: string) => void;
  onCreate: () => void;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      backgroundColor: QUOTE_STATUS_COLORS[status] + '20', color: QUOTE_STATUS_COLORS[status],
    }}>
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}

export default function QuoteList({ onView, onCreate }: QuoteListProps): React.ReactElement {
  const quotes = useBanHangStore(s => s.quotes);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let list = quotes;
    if (statusFilter !== 'all') list = list.filter(q => q.status === statusFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(q =>
        q.quoteCode.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        (q.projectName ?? '').toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [quotes, search, statusFilter]);

  const totalAmount = filtered.reduce((s, q) => s + q.totalAmount, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Báo giá</h2>
          <p style={{ color: '#6c7086', fontSize: 13, margin: '4px 0 0' }}>{filtered.length} báo giá · Tổng: {formatCurrency(totalAmount)}</p>
        </div>
        <button onClick={onCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6,
          backgroundColor: '#89b4fa', color: '#1e1e2e', fontWeight: 600, fontSize: 13,
          border: 'none', cursor: 'pointer',
        }}>
          <FiPlus size={16} /> Tạo báo giá
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#6c7086' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã, khách hàng, dự án..."
            style={{
              width: '100%', padding: '8px 8px 8px 30', borderRadius: 6, fontSize: 13,
              backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none',
            }}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value as QuoteStatus | 'all')}
          style={{
            padding: '8px 12px', borderRadius: 6, fontSize: 13,
            backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4',
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          {(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map(s => (
            <option key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 8, border: '1px solid #313244', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#181825' }}>
              {['Mã BG', 'Khách hàng', 'Dự án', 'Ngày tạo', 'Hiệu lực', 'Tổng tiền', 'Trạng thái', ''].map((h, i, arr) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6c7086', borderBottom: '1px solid #313244', borderRight: i < arr.length - 1 ? '1px solid #313244' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#6c7086' }}>Không có báo giá nào</td></tr>
            ) : filtered.map(q => (
              <tr
                key={q.quoteId}
                onClick={() => onView(q.quoteId)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #313244' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(137,180,250,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, fontSize: 13, borderRight: '1px solid #313244' }}>{q.quoteCode}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, borderRight: '1px solid #313244' }}>{q.customerName}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{q.projectName ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{formatDate(q.createdAt)}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{formatDate(q.validUntil)}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, borderRight: '1px solid #313244' }}>{formatCurrency(q.totalAmount)}</td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #313244' }}><StatusBadge status={q.status} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={e => { e.stopPropagation(); onView(q.quoteId); }} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiEye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
