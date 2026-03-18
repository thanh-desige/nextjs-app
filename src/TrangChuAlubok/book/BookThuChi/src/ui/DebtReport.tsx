'use client';
import React, { useMemo } from 'react';
import { useThuChiStore } from '../store/thuChiStore';
import { DEBT_STATUS_LABELS, DEBT_STATUS_COLORS } from '../types';

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }): React.ReactElement {
  return (
    <div style={{ flex: 1, backgroundColor: '#181825', borderRadius: 8, padding: 20, border: '1px solid #313244' }}>
      <div style={{ color: '#a6adc8', fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ color, fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function DebtReport(): React.ReactElement {
  const { receivables, payables } = useThuChiStore();

  const stats = useMemo(() => {
    const totalAR = receivables.reduce((s, ar) => s + ar.remainingAmount, 0);
    const totalAP = payables.reduce((s, ap) => s + ap.remainingAmount, 0);
    const overdueAR = receivables.filter(ar => ar.status === 'overdue');
    const overdueAP = payables.filter(ap => ap.status === 'overdue');
    const overdueARAmount = overdueAR.reduce((s, ar) => s + ar.remainingAmount, 0);
    const overdueAPAmount = overdueAP.reduce((s, ap) => s + ap.remainingAmount, 0);
    const netDebt = totalAR - totalAP;
    return { totalAR, totalAP, overdueAR, overdueAP, overdueARAmount, overdueAPAmount, netDebt };
  }, [receivables, payables]);

  const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', color: '#a6adc8', fontWeight: 600, fontSize: 13 };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', fontSize: 13 };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#cdd6f4' }}>Báo cáo công nợ</h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Phải thu còn lại" value={formatCurrency(stats.totalAR)} color="#89b4fa" />
        <StatCard label="Phải trả còn lại" value={formatCurrency(stats.totalAP)} color="#f38ba8" />
        <StatCard label="Chênh lệch (Thu - Trả)" value={formatCurrency(stats.netDebt)} color={stats.netDebt >= 0 ? '#a6e3a1' : '#f38ba8'} />
        <StatCard label="Quá hạn thu" value={`${stats.overdueAR.length} đơn — ${formatCurrency(stats.overdueARAmount)}`} color="#f9e2af" />
      </div>

      {/* AR Table */}
      <h3 style={{ color: '#cdd6f4', fontSize: 15, marginBottom: 12 }}>Chi tiết công nợ phải thu</h3>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #313244', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181825' }}>
          <thead>
            <tr style={{ backgroundColor: '#11111b' }}>
              <th style={thStyle}>Khách hàng</th>
              <th style={thStyle}>Đơn bán</th>
              <th style={thStyle}>Tổng nợ</th>
              <th style={thStyle}>Đã thu</th>
              <th style={thStyle}>Còn lại</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map(ar => (
              <tr key={ar.arId}>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{ar.customerName}</td>
                <td style={{ ...tdStyle, color: '#89b4fa' }}>{ar.soCode}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{formatCurrency(ar.totalAmount)}</td>
                <td style={{ ...tdStyle, color: '#a6e3a1' }}>{formatCurrency(ar.paidAmount)}</td>
                <td style={{ ...tdStyle, color: ar.remainingAmount > 0 ? '#f38ba8' : '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ar.remainingAmount)}</td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: DEBT_STATUS_COLORS[ar.status] + '22', color: DEBT_STATUS_COLORS[ar.status] }}>{DEBT_STATUS_LABELS[ar.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AP Table */}
      <h3 style={{ color: '#cdd6f4', fontSize: 15, marginBottom: 12 }}>Chi tiết công nợ phải trả</h3>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #313244' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181825' }}>
          <thead>
            <tr style={{ backgroundColor: '#11111b' }}>
              <th style={thStyle}>Nhà cung cấp</th>
              <th style={thStyle}>Đơn mua</th>
              <th style={thStyle}>Tổng nợ</th>
              <th style={thStyle}>Đã trả</th>
              <th style={thStyle}>Còn lại</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {payables.map(ap => (
              <tr key={ap.apId}>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{ap.supplierName}</td>
                <td style={{ ...tdStyle, color: '#89b4fa' }}>{ap.poCode}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{formatCurrency(ap.totalAmount)}</td>
                <td style={{ ...tdStyle, color: '#a6e3a1' }}>{formatCurrency(ap.paidAmount)}</td>
                <td style={{ ...tdStyle, color: ap.remainingAmount > 0 ? '#f38ba8' : '#a6e3a1', fontWeight: 600 }}>{formatCurrency(ap.remainingAmount)}</td>
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
