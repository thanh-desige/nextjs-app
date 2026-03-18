'use client';
import React, { useMemo } from 'react';
import { useThuChiStore } from '../store/thuChiStore';
import { PAYMENT_METHOD_LABELS } from '../types';

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }): React.ReactElement {
  return (
    <div style={{ flex: 1, backgroundColor: '#181825', borderRadius: 8, padding: 20, border: '1px solid #313244' }}>
      <div style={{ color: '#a6adc8', fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ color, fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function CashFlowReport(): React.ReactElement {
  const { receipts, payments } = useThuChiStore();

  const stats = useMemo(() => {
    const confirmedReceipts = receipts.filter(r => r.status === 'confirmed');
    const confirmedPayments = payments.filter(p => p.status === 'confirmed');
    const totalInflow = confirmedReceipts.reduce((s, r) => s + r.amount, 0);
    const totalOutflow = confirmedPayments.reduce((s, p) => s + p.amount, 0);
    const netCashFlow = totalInflow - totalOutflow;

    const draftReceipts = receipts.filter(r => r.status === 'draft');
    const draftPayments = payments.filter(p => p.status === 'draft');
    const pendingInflow = draftReceipts.reduce((s, r) => s + r.amount, 0);
    const pendingOutflow = draftPayments.reduce((s, p) => s + p.amount, 0);

    // By payment method
    const inflowByMethod: Record<string, number> = {};
    const outflowByMethod: Record<string, number> = {};
    for (const r of confirmedReceipts) {
      inflowByMethod[r.paymentMethod] = (inflowByMethod[r.paymentMethod] || 0) + r.amount;
    }
    for (const p of confirmedPayments) {
      outflowByMethod[p.paymentMethod] = (outflowByMethod[p.paymentMethod] || 0) + p.amount;
    }

    return { confirmedReceipts, confirmedPayments, totalInflow, totalOutflow, netCashFlow, draftReceipts, draftPayments, pendingInflow, pendingOutflow, inflowByMethod, outflowByMethod };
  }, [receipts, payments]);

  const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', color: '#a6adc8', fontWeight: 600, fontSize: 13 };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #313244', borderRight: '1px solid #313244', fontSize: 13 };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#cdd6f4' }}>Báo cáo dòng tiền</h2>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Tổng thu (xác nhận)" value={formatCurrency(stats.totalInflow)} color="#a6e3a1" />
        <StatCard label="Tổng chi (xác nhận)" value={formatCurrency(stats.totalOutflow)} color="#f38ba8" />
        <StatCard label="Dòng tiền ròng" value={formatCurrency(stats.netCashFlow)} color={stats.netCashFlow >= 0 ? '#a6e3a1' : '#f38ba8'} />
      </div>

      {/* Pending */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Thu chờ duyệt" value={`${stats.draftReceipts.length} phiếu — ${formatCurrency(stats.pendingInflow)}`} color="#f9e2af" />
        <StatCard label="Chi chờ duyệt" value={`${stats.draftPayments.length} phiếu — ${formatCurrency(stats.pendingOutflow)}`} color="#f9e2af" />
      </div>

      {/* Breakdown by method */}
      <h3 style={{ color: '#cdd6f4', fontSize: 15, marginBottom: 12 }}>Phân bổ theo hình thức thanh toán</h3>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #313244', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181825' }}>
          <thead>
            <tr style={{ backgroundColor: '#11111b' }}>
              <th style={thStyle}>Hình thức</th>
              <th style={thStyle}>Thu vào</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Chi ra</th>
            </tr>
          </thead>
          <tbody>
            {(['cash', 'bank_transfer', 'check', 'other'] as const).map(method => {
              const inflow = stats.inflowByMethod[method] || 0;
              const outflow = stats.outflowByMethod[method] || 0;
              if (inflow === 0 && outflow === 0) return null;
              return (
                <tr key={method}>
                  <td style={{ ...tdStyle, color: '#cdd6f4' }}>{PAYMENT_METHOD_LABELS[method]}</td>
                  <td style={{ ...tdStyle, color: '#a6e3a1', fontWeight: 600 }}>{formatCurrency(inflow)}</td>
                  <td style={{ ...tdStyle, color: '#f38ba8', fontWeight: 600, borderRight: 'none' }}>{formatCurrency(outflow)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent confirmed receipts */}
      <h3 style={{ color: '#cdd6f4', fontSize: 15, marginBottom: 12 }}>Phiếu thu đã xác nhận</h3>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #313244', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181825' }}>
          <thead>
            <tr style={{ backgroundColor: '#11111b' }}>
              <th style={thStyle}>Mã phiếu</th>
              <th style={thStyle}>Khách hàng</th>
              <th style={thStyle}>Số tiền</th>
              <th style={thStyle}>Hình thức</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {stats.confirmedReceipts.length === 0 ? (
              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#6c7086', borderRight: 'none' }}>Chưa có phiếu thu</td></tr>
            ) : stats.confirmedReceipts.map(r => (
              <tr key={r.receiptId}>
                <td style={{ ...tdStyle, color: '#89b4fa', fontWeight: 600 }}>{r.receiptCode}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{r.customerName}</td>
                <td style={{ ...tdStyle, color: '#a6e3a1', fontWeight: 600 }}>{formatCurrency(r.amount)}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{PAYMENT_METHOD_LABELS[r.paymentMethod]}</td>
                <td style={{ ...tdStyle, color: '#bac2de', borderRight: 'none' }}>{formatDate(r.confirmedAt!)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent confirmed payments */}
      <h3 style={{ color: '#cdd6f4', fontSize: 15, marginBottom: 12 }}>Phiếu chi đã xác nhận</h3>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #313244' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181825' }}>
          <thead>
            <tr style={{ backgroundColor: '#11111b' }}>
              <th style={thStyle}>Mã phiếu</th>
              <th style={thStyle}>Nhà cung cấp</th>
              <th style={thStyle}>Số tiền</th>
              <th style={thStyle}>Hình thức</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {stats.confirmedPayments.length === 0 ? (
              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#6c7086', borderRight: 'none' }}>Chưa có phiếu chi</td></tr>
            ) : stats.confirmedPayments.map(p => (
              <tr key={p.paymentId}>
                <td style={{ ...tdStyle, color: '#89b4fa', fontWeight: 600 }}>{p.paymentCode}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{p.supplierName}</td>
                <td style={{ ...tdStyle, color: '#f38ba8', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                <td style={{ ...tdStyle, color: '#cdd6f4' }}>{PAYMENT_METHOD_LABELS[p.paymentMethod]}</td>
                <td style={{ ...tdStyle, color: '#bac2de', borderRight: 'none' }}>{formatDate(p.confirmedAt!)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
