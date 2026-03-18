'use client';
// ============================================================
// SalesReport — Báo cáo bán hàng
// Summary stats: revenue, payment, delivery progress
// ============================================================

import React, { useMemo } from 'react';
import { useBanHangStore } from '../store/banHangStore';
import { SO_STATUS_LABELS, SO_STATUS_COLORS } from '../types';
import type { SalesOrderStatus } from '../types';

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }

export default function SalesReport(): React.ReactElement {
  const orders = useBanHangStore(s => s.orders);

  const stats = useMemo(() => {
    const byStatus: Record<SalesOrderStatus, number> = { new: 0, confirmed: 0, delivering: 0, completed: 0, cancelled: 0 };
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalDelivered = 0;
    let totalQty = 0;
    for (const o of orders) {
      byStatus[o.status]++;
      if (o.status !== 'cancelled') {
        totalRevenue += o.totalAmount;
        totalPaid += o.paidAmount;
        for (const item of o.items) {
          totalQty += item.quantity;
          totalDelivered += item.deliveredQty;
        }
      }
    }
    const paymentRate = totalRevenue > 0 ? Math.round(totalPaid / totalRevenue * 100) : 0;
    const deliveryRate = totalQty > 0 ? Math.round(totalDelivered / totalQty * 100) : 0;
    return { byStatus, totalRevenue, totalPaid, paymentRate, deliveryRate, total: orders.length, outstanding: totalRevenue - totalPaid };
  }, [orders]);

  const statuses = Object.entries(stats.byStatus).filter(([, v]) => v > 0) as [SalesOrderStatus, number][];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Báo cáo bán hàng</h2>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <Card label="Tổng đơn hàng" value={String(stats.total)} color="#89b4fa" />
        <Card label="Doanh thu" value={formatCurrency(stats.totalRevenue)} color="#cdd6f4" />
        <Card label="Đã thu" value={`${formatCurrency(stats.totalPaid)} (${stats.paymentRate}%)`} color="#a6e3a1" />
        <Card label="Công nợ" value={formatCurrency(stats.outstanding)} color={stats.outstanding > 0 ? '#f38ba8' : '#a6e3a1'} />
      </div>

      {/* Progress bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <ProgressCard label="Thanh toán" percent={stats.paymentRate} color="#a6e3a1" />
        <ProgressCard label="Giao hàng" percent={stats.deliveryRate} color="#fab387" />
      </div>

      {/* Status breakdown */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 20 }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Phân bố theo trạng thái</h3>
        {statuses.length === 0 ? (
          <p style={{ color: '#6c7086' }}>Chưa có dữ liệu</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {statuses.map(([status, count]) => {
              const pct = Math.round(count / stats.total * 100);
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: SO_STATUS_COLORS[status], fontWeight: 600 }}>{SO_STATUS_LABELS[status]}</span>
                    <span style={{ fontSize: 13, color: '#a6adc8' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: '#313244', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: SO_STATUS_COLORS[status], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
      <span style={{ fontSize: 12, color: '#6c7086' }}>{label}</span>
      <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function ProgressCard({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#cdd6f4', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>{percent}%</span>
      </div>
      <div style={{ height: 10, backgroundColor: '#313244', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, backgroundColor: color, borderRadius: 5 }} />
      </div>
    </div>
  );
}
