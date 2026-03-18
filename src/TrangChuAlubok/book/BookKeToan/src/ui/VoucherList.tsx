'use client';
import React, { useState } from 'react';
import { useKeToanStore } from '../store/keToanStore';
import {
  VOUCHER_STATUS_LABELS,
  VOUCHER_STATUS_COLORS,
  VOUCHER_TYPE_LABELS,
  type VoucherStatus,
} from '../types';

interface VoucherListProps {
  onAdd: () => void;
  onSelect: (id: string) => void;
}

const STATUS_OPTIONS: VoucherStatus[] = ['draft', 'approved', 'rejected', 'closed'];

export default function VoucherList({ onAdd, onSelect }: VoucherListProps) {
  const vouchers = useKeToanStore((s) => s.vouchers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | ''>('');

  const filtered = vouchers.filter((v) => {
    const matchSearch =
      v.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#cdd6f4', fontSize: 20 }}>Chứng từ kế toán</h2>
        <button
          onClick={onAdd}
          style={{
            padding: '8px 20px', background: '#a6e3a1', color: '#1e1e2e',
            border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Tạo chứng từ
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Tìm mã, mô tả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '8px 12px', background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 6, outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VoucherStatus | '')}
          style={{
            padding: '8px 12px', background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 6, outline: 'none',
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{VOUCHER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#181825' }}>
              {['Mã CT', 'Loại', 'Ngày', 'Mô tả', 'Nợ', 'Có', 'Nguồn', 'Trạng thái'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 12px', textAlign: 'left', color: '#a6adc8',
                    fontSize: 13, fontWeight: 600, borderBottom: '1px solid #313244',
                    borderRight: '1px solid #313244', whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr
                key={v.voucherId}
                onClick={() => onSelect(v.voucherId)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #313244' }}
                onMouseEnter={(e) => { (e.currentTarget.style.background = '#313244'); }}
                onMouseLeave={(e) => { (e.currentTarget.style.background = 'transparent'); }}
              >
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>
                  {v.voucherCode}
                </td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                  {VOUCHER_TYPE_LABELS[v.voucherType]}
                </td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244', whiteSpace: 'nowrap' }}>
                  {v.date}
                </td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.description}
                </td>
                <td style={{ padding: '10px 12px', color: '#a6e3a1', fontWeight: 600, borderRight: '1px solid #313244', textAlign: 'right' }}>
                  {fmt(v.totalDebit)}
                </td>
                <td style={{ padding: '10px 12px', color: '#f38ba8', fontWeight: 600, borderRight: '1px solid #313244', textAlign: 'right' }}>
                  {fmt(v.totalCredit)}
                </td>
                <td style={{ padding: '10px 12px', color: '#9399b2', borderRight: '1px solid #313244', fontSize: 12 }}>
                  {v.sourceCode ?? '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      color: '#1e1e2e', background: VOUCHER_STATUS_COLORS[v.status],
                    }}
                  >
                    {VOUCHER_STATUS_LABELS[v.status]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>
                  Không tìm thấy chứng từ nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
