'use client';
import React, { useState } from 'react';
import { useKeToanStore } from '../store/keToanStore';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  type InvoiceStatus,
} from '../types';

interface InvoiceListProps {
  onAdd: () => void;
  onSelect: (id: string) => void;
}

const STATUS_OPTIONS: InvoiceStatus[] = ['draft', 'approved', 'cancelled'];

export default function InvoiceList({ onAdd, onSelect }: InvoiceListProps) {
  const invoices = useKeToanStore((s) => s.invoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceCode.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#cdd6f4', fontSize: 20 }}>Hóa đơn</h2>
        <button
          onClick={onAdd}
          style={{
            padding: '8px 20px', background: '#a6e3a1', color: '#1e1e2e',
            border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Tạo hóa đơn
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Tìm mã HD, khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '8px 12px', background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 6, outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
          style={{
            padding: '8px 12px', background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 6, outline: 'none',
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#181825' }}>
              {['Mã HD', 'Khách hàng', 'MST', 'Đơn hàng', 'Ngày', 'Tiền hàng', 'VAT', 'Tổng cộng', 'Trạng thái'].map((h) => (
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
            {filtered.map((inv) => (
              <tr
                key={inv.invoiceId}
                onClick={() => onSelect(inv.invoiceId)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #313244' }}
                onMouseEnter={(e) => { (e.currentTarget.style.background = '#313244'); }}
                onMouseLeave={(e) => { (e.currentTarget.style.background = 'transparent'); }}
              >
                <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>
                  {inv.invoiceCode}
                </td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                  {inv.customerName}
                </td>
                <td style={{ padding: '10px 12px', color: '#9399b2', fontSize: 12, borderRight: '1px solid #313244' }}>
                  {inv.customerTaxCode ?? '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#9399b2', fontSize: 12, borderRight: '1px solid #313244' }}>
                  {inv.soCode ?? '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244', whiteSpace: 'nowrap' }}>
                  {inv.date}
                </td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>
                  {fmt(inv.subtotal)}
                </td>
                <td style={{ padding: '10px 12px', color: '#fab387', textAlign: 'right', borderRight: '1px solid #313244' }}>
                  {fmt(inv.vatAmount)}
                </td>
                <td style={{ padding: '10px 12px', color: '#a6e3a1', fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>
                  {fmt(inv.total)}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      color: '#1e1e2e', background: INVOICE_STATUS_COLORS[inv.status],
                    }}
                  >
                    {INVOICE_STATUS_LABELS[inv.status]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>
                  Không tìm thấy hóa đơn nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
