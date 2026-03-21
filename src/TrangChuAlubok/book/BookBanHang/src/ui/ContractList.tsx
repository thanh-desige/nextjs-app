'use client';
// ============================================================
// ContractList — Danh sách hợp đồng
// Table with status badges, search, filter
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiSearch, FiEye } from 'react-icons/fi';
import { useBanHangStore } from '../store/banHangStore';
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '../types';
import type { ContractStatus } from '../types';

interface ContractListProps {
  onView: (contractId: string) => void;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function StatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      backgroundColor: CONTRACT_STATUS_COLORS[status] + '20', color: CONTRACT_STATUS_COLORS[status],
    }}>
      {CONTRACT_STATUS_LABELS[status]}
    </span>
  );
}

export default function ContractList({ onView }: ContractListProps): React.ReactElement {
  const contracts = useBanHangStore(s => s.contracts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let list = contracts;
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(c =>
        c.contractCode.toLowerCase().includes(term) ||
        c.customerName.toLowerCase().includes(term) ||
        (c.projectName ?? '').toLowerCase().includes(term) ||
        c.quoteCode.toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [contracts, search, statusFilter]);

  const totalAmount = filtered.reduce((s, c) => s + c.totalAmount, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#cdd6f4' }}>Hợp đồng</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#a6adc8' }}>Tổng: {formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: 9, color: '#6c7086' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã HĐ, khách hàng, dự án..."
            style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: 6, border: '1px solid #45475a', backgroundColor: '#313244', color: '#cdd6f4', fontSize: 13, outline: 'none' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ContractStatus | 'all')}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #45475a', backgroundColor: '#313244', color: '#cdd6f4', fontSize: 13 }}>
          <option value="all">Tất cả</option>
          {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(st => (
            <option key={st} value={st}>{CONTRACT_STATUS_LABELS[st]}</option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#6c7086' }}>
          <p style={{ fontSize: 14, margin: 0 }}>Chưa có hợp đồng nào.</p>
          <p style={{ fontSize: 12, margin: '8px 0 0', color: '#585b70' }}>Hợp đồng sẽ được tạo tự động khi bạn click "Tạo hợp đồng" từ bảng dự án.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #45475a' }}>
              {['Mã HĐ', 'Mã BG', 'Khách hàng', 'Dự án', 'Tổng tiền', 'Tạm ứng', 'Ngày ký', 'Trạng thái', ''].map(h => (
                <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: '#a6adc8', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.contractId} style={{ borderBottom: '1px solid #313244' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#313244')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '10px 6px', fontFamily: 'monospace', color: '#89b4fa' }}>{c.contractCode}</td>
                <td style={{ padding: '10px 6px', fontFamily: 'monospace', color: '#6c7086' }}>{c.quoteCode}</td>
                <td style={{ padding: '10px 6px', color: '#cdd6f4' }}>{c.customerName}</td>
                <td style={{ padding: '10px 6px', color: '#a6adc8' }}>{c.projectName ?? '—'}</td>
                <td style={{ padding: '10px 6px', fontFamily: 'monospace', color: '#cdd6f4' }}>{formatCurrency(c.totalAmount)}</td>
                <td style={{ padding: '10px 6px', fontFamily: 'monospace', color: '#f9e2af' }}>{formatCurrency(c.depositAmount)}</td>
                <td style={{ padding: '10px 6px', color: '#a6adc8' }}>{c.signedDate ? formatDate(c.signedDate) : '—'}</td>
                <td style={{ padding: '10px 6px' }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: '10px 6px' }}>
                  <button onClick={() => onView(c.contractId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#89b4fa', padding: 4 }}
                    title="Xem chi tiết">
                    <FiEye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Summary */}
      {filtered.length > 0 && (
        <div style={{ marginTop: 12, padding: 12, backgroundColor: '#313244', borderRadius: 8, display: 'flex', gap: 24, fontSize: 12, color: '#a6adc8' }}>
          <span>Tổng: <b style={{ color: '#cdd6f4' }}>{filtered.length}</b> hợp đồng</span>
          <span>Giá trị: <b style={{ color: '#a6e3a1' }}>{formatCurrency(totalAmount)}</b></span>
          <span>Đã ký: <b style={{ color: '#a6e3a1' }}>{filtered.filter(c => c.status === 'signed').length}</b></span>
        </div>
      )}
    </div>
  );
}
