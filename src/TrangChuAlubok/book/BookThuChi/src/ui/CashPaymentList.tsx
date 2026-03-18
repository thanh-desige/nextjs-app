'use client';
import React, { useState } from 'react';
import { useThuChiStore } from '../store/thuChiStore';
import { FINANCE_STATUS_LABELS, FINANCE_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '../types';
import type { FinanceVoucherStatus } from '../types';

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

interface CashPaymentListProps {
  onView: (id: string) => void;
  onCreate: () => void;
}

export default function CashPaymentList({ onView, onCreate }: CashPaymentListProps): React.ReactElement {
  const payments = useThuChiStore(s => s.payments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FinanceVoucherStatus | ''>('');

  const filtered = payments.filter(p => {
    const matchSearch = !search || p.paymentCode.toLowerCase().includes(search.toLowerCase()) || p.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', color: '#a6adc8', fontWeight: 600, fontSize: 13 };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', fontSize: 13 };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#cdd6f4' }}>Phiếu chi</h2>
        <button onClick={onCreate} style={{ padding: '8px 16px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Tạo phiếu chi</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã phiếu, nhà cung cấp..." style={{ flex: 1, padding: '8px 12px', backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FinanceVoucherStatus | '')} style={{ padding: '8px 12px', backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="cancelled">Hủy</option>
        </select>
      </div>

      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #313244' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181825' }}>
          <thead>
            <tr style={{ backgroundColor: '#11111b' }}>
              <th style={thStyle}>Mã phiếu</th>
              <th style={thStyle}>Nhà cung cấp</th>
              <th style={thStyle}>Đơn mua</th>
              <th style={thStyle}>Số tiền</th>
              <th style={thStyle}>Hình thức</th>
              <th style={thStyle}>Ngày tạo</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#6c7086', borderRight: 'none' }}>Không có phiếu chi nào</td></tr>
            ) : filtered.map(p => (
              <tr key={p.paymentId} onClick={() => onView(p.paymentId)} style={{ cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e1e2e')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ ...tdStyle, color: '#89b4fa', fontWeight: 600 }}>{p.paymentCode}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{p.supplierName}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{p.poCode || '—'}</td>
                <td style={{ ...tdStyle, color: '#f38ba8', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{PAYMENT_METHOD_LABELS[p.paymentMethod]}</td>
                <td style={{ ...tdStyle, color: '#bac2de' }}>{formatDate(p.createdAt)}</td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: FINANCE_STATUS_COLORS[p.status] + '22', color: FINANCE_STATUS_COLORS[p.status] }}>{FINANCE_STATUS_LABELS[p.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
