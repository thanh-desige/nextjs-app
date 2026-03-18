'use client';
import React, { useState } from 'react';
import { useMuaHangStore } from '../store/muaHangStore';
import { PR_STATUS_LABELS, PR_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../types';

interface Props {
  onView: (id: string) => void;
  onCreate: () => void;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function PurchaseRequestList({ onView, onCreate }: Props): React.ReactElement {
  const { requests } = useMuaHangStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = requests.filter(r => {
    const matchSearch = !search ||
      r.requestCode.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = filtered.reduce((s, r) => s + r.totalEstimated, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 600, margin: 0 }}>Yêu cầu mua hàng</h2>
        <button onClick={onCreate} style={{ padding: '8px 20px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          + Tạo yêu cầu
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm mã, người yêu cầu, lý do..."
          style={{ flex: 1, maxWidth: 350, padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(PR_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 8, border: '1px solid #313244', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#181825' }}>
              {['Mã YCMH', 'Người yêu cầu', 'Bộ phận', 'Lý do', 'Ưu tiên', 'Tổng dự kiến', 'Trạng thái', ''].map((h, i, arr) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6c7086', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #313244', borderRight: i < arr.length - 1 ? '1px solid #313244' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.requestId} onClick={() => onView(r.requestId)}
                style={{ borderBottom: '1px solid #313244', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(137,180,250,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>{r.requestCode}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{r.requestedBy}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', borderRight: '1px solid #313244' }}>{r.department ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '1px solid #313244' }}>{r.reason}</td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #313244' }}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#1e1e2e', backgroundColor: PRIORITY_COLORS[r.priority] }}>{PRIORITY_LABELS[r.priority]}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace', borderRight: '1px solid #313244' }}>{formatCurrency(r.totalEstimated)}</td>
                <td style={{ padding: '10px 12px', borderRight: '1px solid #313244' }}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#1e1e2e', backgroundColor: PR_STATUS_COLORS[r.status] }}>{PR_STATUS_LABELS[r.status]}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#6c7086' }}>▸</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ marginTop: 16, display: 'flex', gap: 24, color: '#a6adc8', fontSize: 13 }}>
        <span>{filtered.length} yêu cầu</span>
        <span>Tổng dự kiến: <b style={{ color: '#cdd6f4' }}>{formatCurrency(total)}</b></span>
      </div>
    </div>
  );
}
