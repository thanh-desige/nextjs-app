'use client';
import React, { useState } from 'react';
import { useThuChiStore } from '../store/thuChiStore';
import { DEBT_STATUS_LABELS, DEBT_STATUS_COLORS } from '../types';
import type { DebtStatus } from '../types';

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

interface AccountsPayablePageProps {
  selectedId: string | null;
  onBack: () => void;
  onSelect?: (id: string) => void;
}

export default function AccountsPayablePage({ selectedId, onBack, onSelect }: AccountsPayablePageProps): React.ReactElement {
  const payables = useThuChiStore(s => s.payables);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DebtStatus | ''>('');

  // Detail view
  if (selectedId) {
    const ap = payables.find(a => a.apId === selectedId);
    if (!ap) {
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
    const paidPercent = ap.totalAmount > 0 ? Math.round((ap.paidAmount / ap.totalAmount) * 100) : 0;

    return (
      <div style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ padding: '6px 12px', backgroundColor: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
          <h2 style={{ margin: 0, fontSize: 18, color: '#cdd6f4' }}>Công nợ phải trả — {ap.supplierName}</h2>
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: DEBT_STATUS_COLORS[ap.status] + '22', color: DEBT_STATUS_COLORS[ap.status] }}>{DEBT_STATUS_LABELS[ap.status]}</span>
        </div>

        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, border: '1px solid #313244' }}>
          <div style={infoStyle}><span style={labelStyle}>Nhà cung cấp:</span><span style={valueStyle}>{ap.supplierName}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Đơn mua:</span><span style={valueStyle}>{ap.poCode}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Tổng nợ:</span><span style={{ ...valueStyle, fontWeight: 600 }}>{formatCurrency(ap.totalAmount)}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Đã trả:</span><span style={{ ...valueStyle, color: '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ap.paidAmount)}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Còn lại:</span><span style={{ ...valueStyle, color: ap.remainingAmount > 0 ? '#f38ba8' : '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ap.remainingAmount)}</span></div>
          <div style={infoStyle}><span style={labelStyle}>Tiến độ:</span><span style={valueStyle}>{paidPercent}%</span></div>

          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <div style={{ width: '100%', height: 8, backgroundColor: '#313244', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${paidPercent}%`, height: '100%', backgroundColor: paidPercent >= 100 ? '#a6e3a1' : '#f9e2af', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>

          <div style={infoStyle}><span style={labelStyle}>Hạn thanh toán:</span><span style={{ ...valueStyle, color: ap.status === 'overdue' ? '#f38ba8' : '#cdd6f4' }}>{ap.dueDate}</span></div>
          {ap.lastPaymentDate && <div style={infoStyle}><span style={labelStyle}>Lần trả cuối:</span><span style={valueStyle}>{ap.lastPaymentDate}</span></div>}
          {ap.notes && <div style={infoStyle}><span style={labelStyle}>Ghi chú:</span><span style={valueStyle}>{ap.notes}</span></div>}
        </div>
      </div>
    );
  }

  // List view
  const filtered = payables.filter(ap => {
    const matchSearch = !search || ap.supplierName.toLowerCase().includes(search.toLowerCase()) || ap.poCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || ap.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRemaining = filtered.reduce((sum, ap) => sum + ap.remainingAmount, 0);

  const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', color: '#a6adc8', fontWeight: 600, fontSize: 13 };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', fontSize: 13 };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#cdd6f4' }}>Công nợ phải trả</h2>
        <span style={{ color: '#f38ba8', fontWeight: 600, fontSize: 14 }}>Tổng còn lại: {formatCurrency(totalRemaining)}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhà cung cấp, mã đơn..." style={{ flex: 1, padding: '8px 12px', backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }} />
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
              <th style={thStyle}>Nhà cung cấp</th>
              <th style={thStyle}>Đơn mua</th>
              <th style={thStyle}>Tổng nợ</th>
              <th style={thStyle}>Đã trả</th>
              <th style={thStyle}>Còn lại</th>
              <th style={thStyle}>Hạn TT</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#6c7086', borderRight: 'none' }}>Không có công nợ phải trả</td></tr>
            ) : filtered.map(ap => (
              <tr key={ap.apId} onClick={() => onSelect?.(ap.apId)} style={{ cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e1e2e')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{ap.supplierName}</td>
                <td style={{ ...tdStyle, color: '#89b4fa' }}>{ap.poCode}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4', fontWeight: 600 }}>{formatCurrency(ap.totalAmount)}</td>
                <td style={{ ...tdStyle, color: '#a6e3a1' }}>{formatCurrency(ap.paidAmount)}</td>
                <td style={{ ...tdStyle, color: ap.remainingAmount > 0 ? '#f38ba8' : '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ap.remainingAmount)}</td>
                <td style={{ ...tdStyle, color: ap.status === 'overdue' ? '#f38ba8' : '#bac2de' }}>{ap.dueDate}</td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: DEBT_STATUS_COLORS[ap.status] + '22', color: DEBT_STATUS_COLORS[ap.status] }}>{DEBT_STATUS_LABELS[ap.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
