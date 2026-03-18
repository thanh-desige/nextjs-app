'use client';
import React from 'react';
import { useMuaHangStore } from '../store/muaHangStore';
import { PO_STATUS_LABELS, PO_STATUS_COLORS, PR_STATUS_LABELS, PR_STATUS_COLORS } from '../types';
import type { PurchaseOrderStatus, PurchaseRequestStatus } from '../types';

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }

export default function PurchaseReport(): React.ReactElement {
  const { orders, requests } = useMuaHangStore();

  const totalOrderValue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = orders.reduce((s, o) => s + o.paidAmount, 0);
  const totalRemaining = totalOrderValue - totalPaid;
  const paidPercent = totalOrderValue > 0 ? Math.round(totalPaid / totalOrderValue * 100) : 0;

  // Order status breakdown
  const orderByStatus: Record<string, number> = {};
  for (const o of orders) {
    orderByStatus[o.status] = (orderByStatus[o.status] ?? 0) + 1;
  }

  // Request status breakdown
  const requestByStatus: Record<string, number> = {};
  for (const r of requests) {
    requestByStatus[r.status] = (requestByStatus[r.status] ?? 0) + 1;
  }

  // Supplier breakdown
  const supplierMap = new Map<string, { count: number; total: number; paid: number }>();
  for (const o of orders) {
    const name = o.supplierName || '(Chưa có NCC)';
    const entry = supplierMap.get(name) ?? { count: 0, total: 0, paid: 0 };
    entry.count++;
    entry.total += o.totalAmount;
    entry.paid += o.paidAmount;
    supplierMap.set(name, entry);
  }

  // Delivery progress
  const totalQty = orders.reduce((s, o) => s + o.items.reduce((a, it) => a + it.quantity, 0), 0);
  const totalReceived = orders.reduce((s, o) => s + o.items.reduce((a, it) => a + it.receivedQty, 0), 0);
  const recvPercent = totalQty > 0 ? Math.round(totalReceived / totalQty * 100) : 0;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Báo cáo mua hàng</h2>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Tổng đơn mua', value: String(orders.length), sub: `${requests.length} yêu cầu`, color: '#89b4fa' },
          { label: 'Tổng giá trị', value: formatCurrency(totalOrderValue), sub: `${supplierMap.size} NCC`, color: '#cdd6f4' },
          { label: 'Đã thanh toán', value: `${paidPercent}%`, sub: formatCurrency(totalPaid), color: paidPercent >= 100 ? '#a6e3a1' : '#f9e2af' },
          { label: 'Nhận hàng', value: `${recvPercent}%`, sub: `${totalReceived}/${totalQty}`, color: recvPercent >= 100 ? '#a6e3a1' : '#fab387' },
        ].map(c => (
          <div key={c.label} style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: 'monospace' }}>{c.value}</div>
            <div style={{ fontSize: 11, color: '#6c7086', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Thanh toán', pct: paidPercent, color: paidPercent >= 100 ? '#a6e3a1' : '#f9e2af' },
          { label: 'Nhận hàng', pct: recvPercent, color: recvPercent >= 100 ? '#a6e3a1' : '#fab387' },
        ].map(b => (
          <div key={b.label} style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a6adc8', marginBottom: 6 }}>
              <span>{b.label}</span><span>{b.pct}%</span>
            </div>
            <div style={{ height: 8, backgroundColor: '#313244', borderRadius: 4 }}>
              <div style={{ height: '100%', width: `${Math.min(b.pct, 100)}%`, backgroundColor: b.color, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Order status */}
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Đơn mua theo trạng thái</h3>
          {Object.entries(PO_STATUS_LABELS).map(([k, v]) => {
            const count = orderByStatus[k] ?? 0;
            const pct = orders.length > 0 ? Math.round(count / orders.length * 100) : 0;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: '#1e1e2e', backgroundColor: PO_STATUS_COLORS[k as PurchaseOrderStatus], minWidth: 70, textAlign: 'center' }}>{v}</span>
                <div style={{ flex: 1, height: 6, backgroundColor: '#313244', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: PO_STATUS_COLORS[k as PurchaseOrderStatus], borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, color: '#a6adc8', minWidth: 24, textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Request status */}
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Yêu cầu theo trạng thái</h3>
          {Object.entries(PR_STATUS_LABELS).map(([k, v]) => {
            const count = requestByStatus[k] ?? 0;
            const pct = requests.length > 0 ? Math.round(count / requests.length * 100) : 0;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: '#1e1e2e', backgroundColor: PR_STATUS_COLORS[k as PurchaseRequestStatus], minWidth: 70, textAlign: 'center' }}>{v}</span>
                <div style={{ flex: 1, height: 6, backgroundColor: '#313244', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: PR_STATUS_COLORS[k as PurchaseRequestStatus], borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, color: '#a6adc8', minWidth: 24, textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supplier breakdown */}
      {supplierMap.size > 0 && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Theo nhà cung cấp</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #45475a' }}>
                {['Nhà cung cấp', 'Số đơn', 'Giá trị', 'Đã thanh toán', 'Còn lại'].map(h =>
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Nhà cung cấp' ? 'left' : 'right', color: '#a6adc8', fontWeight: 600, fontSize: 12 }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from(supplierMap.entries()).map(([name, data]) => (
                <tr key={name} style={{ borderBottom: '1px solid #313244' }}>
                  <td style={{ padding: '8px 10px', color: '#cdd6f4' }}>{name}</td>
                  <td style={{ padding: '8px 10px', color: '#a6adc8', textAlign: 'right' }}>{data.count}</td>
                  <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(data.total)}</td>
                  <td style={{ padding: '8px 10px', color: '#a6e3a1', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(data.paid)}</td>
                  <td style={{ padding: '8px 10px', color: '#f38ba8', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(data.total - data.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
