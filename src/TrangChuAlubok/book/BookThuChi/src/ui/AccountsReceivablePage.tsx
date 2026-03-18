'use client';
import React, { useState } from 'react';
import { useThuChiStore } from '../store/thuChiStore';
import { DEBT_STATUS_LABELS, DEBT_STATUS_COLORS } from '../types';
import type { DebtStatus } from '../types';

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

interface AccountsReceivablePageProps {
  selectedId: string | null;
  onBack: () => void;
  onSelect?: (id: string) => void;
}

export default function AccountsReceivablePage({ selectedId, onBack, onSelect }: AccountsReceivablePageProps): React.ReactElement {
  const receivables = useThuChiStore(s => s.receivables);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DebtStatus | ''>('');

  // Detail view
  if (selectedId) {
    const ar = receivables.find(a => a.arId === selectedId);
    if (!ar) {
      return (
        <div style={{ padding: 24 }}>
          <button onClick={onBack} style={{ padding: '6px 12px', backgroundColor: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
          <p style={{ color: '#f38ba8', marginTop: 16 }}>Không tìm thấy công nợ</p>
        </div>
      );
    }

    const infoStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, marginBottom: 6 };
    const labelStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 13 };
    const valueStyle: React.CSSProperties = { color: '#cdd6f4', fontSize: 13 };
    const paidPercent = ar.totalAmount > 0 ? Math.round((ar.paidAmount / ar.totalAmount) * 100) : 0;

    return (
      <div style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ padding: '6px 12px', backgroundColor: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
          <h2 style={{ margin: 0, fontSize: 18, color: '#cdd6f4' }}>Công nợ phải thu — {ar.customerName}</h2>
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: DEBT_STATUS_COLORS[ar.status] + '22', color: DEBT_STATUS_COLORS[ar.status] }}>{DEBT_STATUS_LABELS[ar.status]}</span>
        </div>

        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, border: '1px solid #313244' }}>
          <div style={infoStyle}><span style={labelStyle}>Khách hàng:</span><span style={valueStyle}>{ar.customerName}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Đơn bán:</span><span style={valueStyle}>{ar.soCode}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Tổng nợ:</span><span style={{ ...valueStyle, fontWeight: 600 }}>{formatCurrency(ar.totalAmount)}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Đã thu:</span><span style={{ ...valueStyle, color: '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ar.paidAmount)}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Còn lại:</span><span style={{ ...valueStyle, color: ar.remainingAmount > 0 ? '#f38ba8' : '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ar.remainingAmount)}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Tiến độ:</span><span style={valueStyle}>{paidPercent}%</span></div>

          {/* Progress bar */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <div style={{ width: '100%', height: 8, backgroundColor: '#313244', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${paidPercent}%`, height: '100%', backgroundColor: paidPercent >= 100 ? '#a6e3a1' : '#89b4fa', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>

          <div style={infoStyle}><span style={labelStyle}>Hạn thanh toán:</span><span style={{ ...valueStyle, color: ar.status === 'overdue' ? '#f38ba8' : '#cdd6f4' }}>{ar.dueDate}</span></div>
          {ar.lastPaymentDate && <div style={infoStyle}><span style={labelStyle}>Lần thu cuối:</span><span style={valueStyle}>{ar.lastPaymentDate}</span></div>}
          {ar.notes && <div style={infoStyle}><span style={labelStyle}>Ghi chú:</span><span style={valueStyle}>{ar.notes}</span></div>}
        </div>
      </div>
    );
  }

  // List view
  const filtered = receivables.filter(ar => {
    const matchSearch = !search || ar.customerName.toLowerCase().includes(search.toLowerCase()) || ar.soCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || ar.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRemaining = filtered.reduce((sum, ar) => sum + ar.remainingAmount, 0);

  const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', color: '#a6adc8', fontWeight: 600, fontSize: 13 };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', fontSize: 13 };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#cdd6f4' }}>Công nợ phải thu</h2>
        <span style={{ color: '#f38ba8', fontWeight: 600, fontSize: 14 }}>Tổng còn lại: {formatCurrency(totalRemaining)}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khách hàng, mã đơn..." style={{ flex: 1, padding: '8px 12px', backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DebtStatus | '')} style={{ padding: '8px 12px', backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }}>
          <option value="">Tất cả</option>
          <option value="open">Chưa thanh toán</option>
          <option value="partial">Một phần</option>
          <option value="paid">Đã thanh toán</option>
          <option value="overdue">Quá hạn</option>
        </select>
      </div>

      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #313244' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181825' }}>
          <thead>
            <tr style={{ backgroundColor: '#11111b' }}>
              <th style={thStyle}>Khách hàng</th>
              <th style={thStyle}>Đơn bán</th>
              <th style={thStyle}>Tổng nợ</th>
              <th style={thStyle}>Đã thu</th>
              <th style={thStyle}>Còn lại</th>
              <th style={thStyle}>Hạn TT</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#6c7086', borderRight: 'none' }}>Không có công nợ phải thu</td></tr>
            ) : filtered.map(ar => (
              <tr key={ar.arId} onClick={() => onSelect?.(ar.arId)} style={{ cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e1e2e')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{ar.customerName}</td>
                <td style={{ ...tdStyle, color: '#89b4fa' }}>{ar.soCode}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4', fontWeight: 600 }}>{formatCurrency(ar.totalAmount)}</td>
                <td style={{ ...tdStyle, color: '#a6e3a1' }}>{formatCurrency(ar.paidAmount)}</td>
                <td style={{ ...tdStyle, color: ar.remainingAmount > 0 ? '#f38ba8' : '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ar.remainingAmount)}</td>
                <td style={{ ...tdStyle, color: ar.status === 'overdue' ? '#f38ba8' : '#bac2de' }}>{ar.dueDate}</td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: DEBT_STATUS_COLORS[ar.status] + '22', color: DEBT_STATUS_COLORS[ar.status] }}>{DEBT_STATUS_LABELS[ar.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
