'use client';
import React, { useState } from 'react';
import { useMuaHangStore } from '../store/muaHangStore';
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '../types';
import type { PurchaseOrderStatus } from '../types';

interface Props {
  orderId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('vi-VN'); }

const TRANSITIONS: Partial<Record<PurchaseOrderStatus, { next: PurchaseOrderStatus; label: string; color: string }>> = {
  new: { next: 'confirmed', label: 'Xác nhận đơn', color: '#f9e2af' },
  confirmed: { next: 'receiving', label: 'Bắt đầu nhận hàng', color: '#fab387' },
  receiving: { next: 'completed', label: 'Hoàn thành', color: '#a6e3a1' },
};

export default function PurchaseOrderDetail({ orderId, onBack, onEdit }: Props): React.ReactElement {
  const { orders, updateOrder } = useMuaHangStore();
  const order = orders.find(o => o.orderId === orderId);
  const [feedback, setFeedback] = useState('');

  if (!order) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#a6adc8' }}>
        <p>Không tìm thấy đơn mua hàng</p>
        <button onClick={onBack} style={{ padding: '8px 20px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
      </div>
    );
  }

  const transition = TRANSITIONS[order.status];
  const canEdit = order.status === 'new';
  const canCancel = order.status === 'new' || order.status === 'confirmed';

  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);
  const totalReceived = order.items.reduce((s, it) => s + it.receivedQty, 0);
  const paidPercent = order.totalAmount > 0 ? Math.round(order.paidAmount / order.totalAmount * 100) : 0;
  const receivedPercent = totalQty > 0 ? Math.round(totalReceived / totalQty * 100) : 0;

  const doTransition = () => {
    if (!transition) return;
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: transition.next, updatedAt: now };
    if (transition.next === 'confirmed') { patch.confirmedBy = 'Admin'; patch.confirmedAt = now; }
    updateOrder(orderId, patch);
    setFeedback(`Đã chuyển: ${PO_STATUS_LABELS[transition.next]}`);
  };

  const doCancel = () => {
    updateOrder(orderId, { status: 'cancelled', updatedAt: new Date().toISOString() });
    setFeedback('Đã hủy đơn');
  };

  const BTN: React.CSSProperties = { padding: '8px 18px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ padding: '6px 14px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 600, margin: 0 }}>{order.orderCode}</h2>
        <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#1e1e2e', backgroundColor: PO_STATUS_COLORS[order.status] }}>{PO_STATUS_LABELS[order.status]}</span>
        {feedback && <span style={{ color: '#a6e3a1', fontSize: 13 }}>✓ {feedback}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {canEdit && <button onClick={() => onEdit(orderId)} style={{ ...BTN, backgroundColor: '#313244', color: '#89b4fa', border: '1px solid #45475a' }}>✎ Sửa</button>}
        {transition && <button onClick={doTransition} style={{ ...BTN, backgroundColor: transition.color, color: '#1e1e2e' }}>{transition.label}</button>}
        {canCancel && <button onClick={doCancel} style={{ ...BTN, backgroundColor: '#45475a', color: '#cdd6f4' }}>Hủy đơn</button>}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tổng tiền', value: formatCurrency(order.totalAmount), color: '#cdd6f4' },
          { label: 'Đã thanh toán', value: `${formatCurrency(order.paidAmount)} (${paidPercent}%)`, color: paidPercent >= 100 ? '#a6e3a1' : '#f9e2af' },
          { label: 'Nhận hàng', value: `${totalReceived}/${totalQty} (${receivedPercent}%)`, color: receivedPercent >= 100 ? '#a6e3a1' : '#fab387' },
          { label: 'Còn lại', value: formatCurrency(order.totalAmount - order.paidAmount), color: '#f38ba8' },
        ].map(c => (
          <div key={c.label} style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#a6adc8', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: c.color, fontFamily: 'monospace' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Payment progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a6adc8', marginBottom: 4 }}>
          <span>Thanh toán</span><span>{paidPercent}%</span>
        </div>
        <div style={{ height: 6, backgroundColor: '#313244', borderRadius: 3 }}>
          <div style={{ height: '100%', width: `${Math.min(paidPercent, 100)}%`, backgroundColor: paidPercent >= 100 ? '#a6e3a1' : '#f9e2af', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
          <div><span style={{ color: '#a6adc8' }}>Nhà cung cấp:</span> <span style={{ color: '#cdd6f4', fontWeight: 600 }}>{order.supplierName || '(Chưa có)'}</span></div>
          <div><span style={{ color: '#a6adc8' }}>Mã NCC:</span> <span style={{ color: '#cdd6f4' }}>{order.supplierId || '—'}</span></div>
          {order.requestCode && <div><span style={{ color: '#a6adc8' }}>Từ YCMH:</span> <span style={{ color: '#89b4fa' }}>{order.requestCode}</span></div>}
          <div><span style={{ color: '#a6adc8' }}>Ngày tạo:</span> <span style={{ color: '#cdd6f4' }}>{formatDate(order.createdAt)}</span></div>
          {order.deliveryDate && <div><span style={{ color: '#a6adc8' }}>Ngày giao DK:</span> <span style={{ color: '#cdd6f4' }}>{new Date(order.deliveryDate).toLocaleDateString('vi-VN')}</span></div>}
          {order.deliveryAddress && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#a6adc8' }}>Địa chỉ giao:</span> <span style={{ color: '#cdd6f4' }}>{order.deliveryAddress}</span></div>}
          {order.confirmedBy && <div><span style={{ color: '#a6adc8' }}>Người xác nhận:</span> <span style={{ color: '#a6e3a1' }}>{order.confirmedBy} ({formatDate(order.confirmedAt!)})</span></div>}
          <div><span style={{ color: '#a6adc8' }}>Người tạo:</span> <span style={{ color: '#cdd6f4' }}>{order.createdBy}</span></div>
          {order.notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#a6adc8' }}>Ghi chú:</span> <span style={{ color: '#cdd6f4' }}>{order.notes}</span></div>}
        </div>
      </div>

      {/* Items table */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20 }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Hàng hóa ({order.items.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #45475a' }}>
                {['#', 'Mô tả', 'ĐVT', 'SL', 'Đơn giá', 'CK%', 'Thành tiền', 'Đã nhận'].map(h =>
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Mô tả' ? 'left' : 'right', color: '#a6adc8', fontWeight: 600, fontSize: 12 }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => (
                <tr key={it.itemId} style={{ borderBottom: '1px solid #313244' }}>
                  <td style={{ padding: '8px 10px', color: '#6c7086', textAlign: 'right' }}>{i + 1}</td>
                  <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'left' }}>{it.description}</td>
                  <td style={{ padding: '8px 10px', color: '#a6adc8', textAlign: 'right' }}>{it.unit}</td>
                  <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'right' }}>{it.quantity}</td>
                  <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(it.unitPrice)}</td>
                  <td style={{ padding: '8px 10px', color: it.discountPercent > 0 ? '#f38ba8' : '#6c7086', textAlign: 'right' }}>{it.discountPercent}%</td>
                  <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(it.amount)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: it.receivedQty >= it.quantity ? '#a6e3a1' : '#fab387' }}>{it.receivedQty}/{it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 280, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#a6adc8' }}>
              <span>Tạm tính:</span><span style={{ fontFamily: 'monospace', color: '#cdd6f4' }}>{formatCurrency(order.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#a6adc8' }}>
              <span>Chiết khấu:</span><span style={{ fontFamily: 'monospace', color: '#f38ba8' }}>-{formatCurrency(order.totalDiscount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#a6adc8' }}>
              <span>Thuế ({order.taxRate}%):</span><span style={{ fontFamily: 'monospace', color: '#cdd6f4' }}>{formatCurrency(order.taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1px solid #45475a', fontWeight: 700, color: '#cdd6f4', fontSize: 16 }}>
              <span>Tổng cộng:</span><span style={{ fontFamily: 'monospace' }}>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
