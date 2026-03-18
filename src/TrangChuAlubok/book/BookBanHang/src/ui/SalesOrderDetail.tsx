'use client';
// ============================================================
// SalesOrderDetail — Chi tiết đơn bán hàng + status tracking
// View order, items, delivery progress, status transitions
// ============================================================

import React, { useState } from 'react';
import { FiArrowLeft, FiEdit2, FiCheck, FiTruck, FiX } from 'react-icons/fi';
import { useBanHangStore } from '../store/banHangStore';
import { SO_STATUS_LABELS, SO_STATUS_COLORS } from '../types';
import type { SalesOrderStatus } from '../types';

interface SalesOrderDetailProps {
  orderId: string;
  onBack: () => void;
  onEdit: (orderId: string) => void;
}

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('vi-VN'); }
function formatDateTime(iso: string): string { return new Date(iso).toLocaleString('vi-VN'); }

// Status transition rules
const TRANSITIONS: Record<SalesOrderStatus, { next: SalesOrderStatus; label: string; color: string; icon: React.ReactNode }[]> = {
  new: [
    { next: 'confirmed', label: 'Xác nhận', color: '#a6e3a1', icon: <FiCheck size={14} /> },
    { next: 'cancelled', label: 'Hủy', color: '#f38ba8', icon: <FiX size={14} /> },
  ],
  confirmed: [
    { next: 'delivering', label: 'Giao hàng', color: '#fab387', icon: <FiTruck size={14} /> },
    { next: 'cancelled', label: 'Hủy', color: '#f38ba8', icon: <FiX size={14} /> },
  ],
  delivering: [
    { next: 'completed', label: 'Hoàn thành', color: '#a6e3a1', icon: <FiCheck size={14} /> },
  ],
  completed: [],
  cancelled: [],
};

export default function SalesOrderDetail({ orderId, onBack, onEdit }: SalesOrderDetailProps): React.ReactElement {
  const { orders, updateOrder } = useBanHangStore();
  const order = orders.find(o => o.orderId === orderId);
  const [feedback, setFeedback] = useState('');

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer' }}><FiArrowLeft size={20} /></button>
        <p style={{ color: '#f38ba8', marginTop: 12 }}>Không tìm thấy đơn hàng</p>
      </div>
    );
  }

  const handleTransition = (nextStatus: SalesOrderStatus) => {
    const now = new Date().toISOString();
    const patch: Partial<typeof order> = { status: nextStatus, updatedAt: now };
    if (nextStatus === 'confirmed') {
      patch.confirmedBy = 'u1';
      patch.confirmedAt = now;
    }
    updateOrder(order.orderId, patch);
    setFeedback(`Đã chuyển sang "${SO_STATUS_LABELS[nextStatus]}"`);
    setTimeout(() => setFeedback(''), 2000);
  };

  const canEdit = order.status === 'new';
  const transitions = TRANSITIONS[order.status];
  const deliveryProgress = order.items.reduce((s, i) => s + i.deliveredQty, 0);
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const paymentPercent = order.totalAmount > 0 ? Math.round(order.paidAmount / order.totalAmount * 100) : 0;

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiArrowLeft size={20} /></button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>{order.orderCode}</h2>
        <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: SO_STATUS_COLORS[order.status] + '20', color: SO_STATUS_COLORS[order.status] }}>
          {SO_STATUS_LABELS[order.status]}
        </span>
        {order.quoteCode && <span style={{ fontSize: 12, color: '#6c7086' }}>từ {order.quoteCode}</span>}
        {feedback && <span style={{ color: '#a6e3a1', fontSize: 13, fontWeight: 600 }}>✓ {feedback}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {canEdit && <button onClick={() => onEdit(order.orderId)} style={actionBtn('#89b4fa')}><FiEdit2 size={14} /> Sửa</button>}
        {transitions.map(t => (
          <button key={t.next} onClick={() => handleTransition(t.next)} style={actionBtn(t.color)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <SummaryCard label="Tổng tiền" value={formatCurrency(order.totalAmount)} color="#cdd6f4" />
        <SummaryCard label="Đã thanh toán" value={`${formatCurrency(order.paidAmount)} (${paymentPercent}%)`} color={paymentPercent >= 100 ? '#a6e3a1' : '#f9e2af'} />
        <SummaryCard label="Tiến độ giao" value={`${deliveryProgress}/${totalQty}`} color={deliveryProgress >= totalQty ? '#a6e3a1' : '#fab387'} />
      </div>

      {/* Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        {[
          ['Khách hàng', order.customerName],
          ['Ngày tạo', formatDate(order.createdAt)],
          ['Ngày giao dự kiến', order.deliveryDate ? formatDate(order.deliveryDate) : '—'],
          ['Cập nhật', formatDateTime(order.updatedAt)],
        ].map(([l, v]) => (
          <div key={l}>
            <span style={{ fontSize: 12, color: '#6c7086' }}>{l}</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#cdd6f4' }}>{v}</p>
          </div>
        ))}
        {order.deliveryAddress && (
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 12, color: '#6c7086' }}>Địa chỉ giao hàng</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#cdd6f4' }}>{order.deliveryAddress}</p>
          </div>
        )}
        {order.confirmedBy && (
          <div>
            <span style={{ fontSize: 12, color: '#6c7086' }}>Xác nhận bởi</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#a6e3a1' }}>{order.confirmedBy} · {formatDateTime(order.confirmedAt!)}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Hạng mục ({order.items.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['STT', 'Mô tả', 'ĐVT', 'SL', 'Đã giao', 'Đơn giá', 'Thành tiền'].map((h, i) => (
                <th key={i} style={{ padding: '8px 6px', textAlign: i >= 3 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#6c7086' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '8px 6px', color: '#6c7086', fontSize: 12, textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: '8px 6px', color: '#a6adc8', fontSize: 13 }}>{item.unit}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: 13, color: item.deliveredQty >= item.quantity ? '#a6e3a1' : '#f9e2af', fontWeight: 600 }}>{item.deliveredQty}/{item.quantity}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ maxWidth: 340, marginLeft: 'auto', backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
        {[['Tạm tính', order.subtotal], ['Chiết khấu', order.totalDiscount], [`Thuế VAT (${order.taxRate}%)`, order.taxAmount]].map(([l, v]) => (
          <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#a6adc8' }}>
            <span>{l as string}</span><span>{formatCurrency(v as number)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 8, borderTop: '1px solid #313244', fontSize: 16, fontWeight: 700, color: '#cdd6f4' }}>
          <span>Tổng cộng</span><span style={{ color: '#a6e3a1' }}>{formatCurrency(order.totalAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#f9e2af' }}>
          <span>Đã thanh toán</span><span>{formatCurrency(order.paidAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, fontWeight: 600, color: order.paidAmount >= order.totalAmount ? '#a6e3a1' : '#f38ba8' }}>
          <span>Còn lại</span><span>{formatCurrency(order.totalAmount - order.paidAmount)}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
      <span style={{ fontSize: 12, color: '#6c7086' }}>{label}</span>
      <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6,
    backgroundColor: 'transparent', border: `1px solid ${color}`, color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}
