'use client';
// ============================================================
// QuoteDetail — Chi tiết báo giá + approval workflow
// View quote info, items, totals. Actions: approve, reject, send, convert to SO
// ============================================================

import React, { useState } from 'react';
import { FiArrowLeft, FiEdit2, FiCheck, FiX, FiShoppingCart, FiCopy } from 'react-icons/fi';
import { useBanHangStore } from '../store/banHangStore';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '../types';
import type { SalesOrder, SalesOrderItem } from '../types';

interface QuoteDetailProps {
  quoteId: string;
  onBack: () => void;
  onEdit: (quoteId: string) => void;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function QuoteDetail({ quoteId, onBack, onEdit }: QuoteDetailProps): React.ReactElement {
  const { quotes, updateQuote, orders, addOrder } = useBanHangStore();
  const quote = quotes.find(q => q.quoteId === quoteId);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!quote) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer' }}>
          <FiArrowLeft size={20} />
        </button>
        <p style={{ color: '#f38ba8', marginTop: 12 }}>Không tìm thấy báo giá</p>
      </div>
    );
  }

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2000);
  };

  const handleApprove = () => {
    updateQuote(quote.quoteId, {
      status: 'approved', approvedBy: 'u1', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    showFeedback('Đã duyệt báo giá');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    updateQuote(quote.quoteId, {
      status: 'rejected', rejectedBy: 'u1', rejectedAt: new Date().toISOString(),
      rejectedReason: rejectReason, updatedAt: new Date().toISOString(),
    });
    setShowRejectModal(false);
    showFeedback('Đã từ chối báo giá');
  };

  const handleSubmitForApproval = () => {
    updateQuote(quote.quoteId, { status: 'pending', updatedAt: new Date().toISOString() });
    showFeedback('Đã gửi duyệt');
  };

  const handleConvertToOrder = () => {
    const existingOrder = orders.find(o => o.quoteId === quote.quoteId);
    if (existingOrder) {
      showFeedback('Đơn hàng đã tồn tại: ' + existingOrder.orderCode);
      return;
    }
    const now = new Date().toISOString();
    const soItems: SalesOrderItem[] = quote.items.map(qi => ({
      itemId: 'soi-' + qi.itemId,
      description: qi.description,
      unit: qi.unit,
      quantity: qi.quantity,
      unitPrice: qi.unitPrice,
      discountPercent: qi.discountPercent,
      amount: qi.amount,
      deliveredQty: 0,
    }));
    const order: SalesOrder = {
      orderId: `so-${quote.quoteId}`,
      orderCode: `DH-${String(orders.length + 1).padStart(4, '0')}`,
      quoteId: quote.quoteId,
      quoteCode: quote.quoteCode,
      customerId: quote.customerId,
      customerName: quote.customerName,
      items: soItems,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      totalDiscount: quote.totalDiscount,
      totalAmount: quote.totalAmount,
      paidAmount: 0,
      status: 'new',
      createdBy: 'u1',
      createdAt: now,
      updatedAt: now,
    };
    addOrder(order);
    updateQuote(quote.quoteId, { status: 'closed', updatedAt: now });
    showFeedback('Đã tạo đơn hàng ' + order.orderCode);
  };

  const canApprove = quote.status === 'pending';
  const canEdit = quote.status === 'draft' || quote.status === 'rejected';
  const canSubmit = quote.status === 'draft' || quote.status === 'rejected';
  const canConvert = quote.status === 'approved';

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}>
          <FiArrowLeft size={20} />
        </button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>{quote.quoteCode}</h2>
        <span style={{
          padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
          backgroundColor: QUOTE_STATUS_COLORS[quote.status] + '20', color: QUOTE_STATUS_COLORS[quote.status],
        }}>
          {QUOTE_STATUS_LABELS[quote.status]}
        </span>
        {feedback && <span style={{ color: '#a6e3a1', fontSize: 13, fontWeight: 600 }}>✓ {feedback}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {canEdit && <button onClick={() => onEdit(quote.quoteId)} style={actionBtnStyle('#89b4fa')}><FiEdit2 size={14} /> Sửa</button>}
        {canSubmit && <button onClick={handleSubmitForApproval} style={actionBtnStyle('#f9e2af')}><FiCopy size={14} /> Gửi duyệt</button>}
        {canApprove && <button onClick={handleApprove} style={actionBtnStyle('#a6e3a1')}><FiCheck size={14} /> Duyệt</button>}
        {canApprove && <button onClick={() => setShowRejectModal(true)} style={actionBtnStyle('#f38ba8')}><FiX size={14} /> Từ chối</button>}
        {canConvert && <button onClick={handleConvertToOrder} style={actionBtnStyle('#89b4fa')}><FiShoppingCart size={14} /> Tạo đơn hàng</button>}
      </div>

      {/* Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        {[
          ['Khách hàng', quote.customerName],
          ['Dự án', quote.projectName ?? '—'],
          ['Ngày tạo', formatDate(quote.createdAt)],
          ['Hiệu lực đến', formatDate(quote.validUntil)],
          ['Người tạo', quote.createdBy],
          ['Cập nhật', formatDateTime(quote.updatedAt)],
        ].map(([l, v]) => (
          <div key={l}>
            <span style={{ fontSize: 12, color: '#6c7086' }}>{l}</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#cdd6f4' }}>{v}</p>
          </div>
        ))}
        {quote.approvedBy && (
          <div>
            <span style={{ fontSize: 12, color: '#6c7086' }}>Duyệt bởi</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#a6e3a1' }}>{quote.approvedBy} · {formatDateTime(quote.approvedAt!)}</p>
          </div>
        )}
        {quote.rejectedBy && (
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 12, color: '#6c7086' }}>Từ chối bởi</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#f38ba8' }}>{quote.rejectedBy} · {formatDateTime(quote.rejectedAt!)}</p>
            {quote.rejectedReason && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#f38ba8', fontStyle: 'italic' }}>Lý do: {quote.rejectedReason}</p>}
          </div>
        )}
      </div>

      {/* Items table */}
      <div style={{ marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Hạng mục ({quote.items.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['STT', 'Mô tả', 'ĐVT', 'SL', 'Đơn giá', 'CK %', 'Thành tiền'].map((h, i) => (
                <th key={i} style={{ padding: '8px 6px', textAlign: i >= 3 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#6c7086' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, idx) => (
              <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '8px 6px', color: '#6c7086', fontSize: 12, textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: '8px 6px', color: '#a6adc8', fontSize: 13 }}>{item.unit}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ padding: '8px 6px', color: '#a6adc8', fontSize: 13, textAlign: 'right' }}>{item.discountPercent}%</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ maxWidth: 340, marginLeft: 'auto', backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
        {[
          ['Tạm tính', quote.subtotal],
          ['Chiết khấu', quote.totalDiscount],
          [`Thuế VAT (${quote.taxRate}%)`, quote.taxAmount],
        ].map(([label, val]) => (
          <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#a6adc8' }}>
            <span>{label as string}</span><span>{formatCurrency(val as number)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 8, borderTop: '1px solid #313244', fontSize: 16, fontWeight: 700, color: '#cdd6f4' }}>
          <span>Tổng cộng</span><span style={{ color: '#a6e3a1' }}>{formatCurrency(quote.totalAmount)}</span>
        </div>
      </div>

      {quote.notes && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
          <span style={{ fontSize: 12, color: '#6c7086' }}>Ghi chú</span>
          <p style={{ margin: '4px 0 0', color: '#a6adc8', fontSize: 13 }}>{quote.notes}</p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowRejectModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#1e1e2e', borderRadius: 12, padding: 24, width: 420, border: '1px solid #313244' }}>
            <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Từ chối báo giá</h3>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a6adc8', marginBottom: 4 }}>Lý do từ chối *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none', resize: 'vertical' }}
              placeholder="Nhập lý do từ chối..." />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)} style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'transparent', border: '1px solid #45475a', color: '#a6adc8', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: '#f38ba8', color: '#1e1e2e', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: rejectReason.trim() ? 1 : 0.5 }}>Từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6,
    backgroundColor: 'transparent', border: `1px solid ${color}`, color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}
