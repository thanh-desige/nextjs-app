'use client';
import React, { useState } from 'react';
import { useMuaHangStore } from '../store/muaHangStore';
import { PR_STATUS_LABELS, PR_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../types';
import type { PurchaseOrderItem } from '../types';

interface Props {
  requestId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('vi-VN'); }

export default function PurchaseRequestDetail({ requestId, onBack, onEdit }: Props): React.ReactElement {
  const { requests, updateRequest, orders, addOrder } = useMuaHangStore();
  const req = requests.find(r => r.requestId === requestId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState('');

  if (!req) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#a6adc8' }}>
        <p>Không tìm thấy yêu cầu</p>
        <button onClick={onBack} style={{ padding: '8px 20px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
      </div>
    );
  }

  const canEdit = req.status === 'draft' || req.status === 'rejected';
  const canSubmit = req.status === 'draft' || req.status === 'rejected';
  const canApprove = req.status === 'pending';
  const canConvert = req.status === 'approved';

  const doAction = (action: string) => {
    const now = new Date().toISOString();
    switch (action) {
      case 'submit':
        updateRequest(requestId, { status: 'pending', updatedAt: now });
        setFeedback('Đã gửi duyệt');
        break;
      case 'approve':
        updateRequest(requestId, { status: 'approved', approvedBy: 'Admin', approvedAt: now, updatedAt: now });
        setFeedback('Đã duyệt');
        break;
      case 'reject':
        if (!rejectReason.trim()) return;
        updateRequest(requestId, { status: 'rejected', rejectedBy: 'Admin', rejectedAt: now, rejectedReason: rejectReason, updatedAt: now });
        setRejectOpen(false);
        setRejectReason('');
        setFeedback('Đã từ chối');
        break;
      case 'cancel':
        updateRequest(requestId, { status: 'cancelled', updatedAt: now });
        setFeedback('Đã hủy');
        break;
      case 'convert': {
        const poItems: PurchaseOrderItem[] = req.items.map(it => ({
          itemId: generateId(),
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.estimatedPrice,
          discountPercent: 0,
          amount: it.quantity * it.estimatedPrice,
          receivedQty: 0,
        }));
        const subtotal = poItems.reduce((s, it) => s + it.amount, 0);
        const taxRate = 10;
        const taxAmount = subtotal * taxRate / 100;
        const code = `DMH-${String(orders.length + 1).padStart(4, '0')}`;
        addOrder({
          orderId: generateId(), orderCode: code, requestId: req.requestId, requestCode: req.requestCode,
          supplierId: '', supplierName: '', items: poItems,
          subtotal, taxRate, taxAmount, totalDiscount: 0, totalAmount: subtotal + taxAmount,
          paidAmount: 0, status: 'new', createdBy: 'Admin', createdAt: now, updatedAt: now,
        });
        updateRequest(requestId, { status: 'closed', updatedAt: now });
        setFeedback(`Đã tạo đơn mua ${code}`);
        break;
      }
    }
  };

  const BTN: React.CSSProperties = { padding: '8px 18px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ padding: '6px 14px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 600, margin: 0 }}>{req.requestCode}</h2>
        <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#1e1e2e', backgroundColor: PR_STATUS_COLORS[req.status] }}>{PR_STATUS_LABELS[req.status]}</span>
        {feedback && <span style={{ color: '#a6e3a1', fontSize: 13 }}>✓ {feedback}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {canEdit && <button onClick={() => onEdit(requestId)} style={{ ...BTN, backgroundColor: '#313244', color: '#89b4fa', border: '1px solid #45475a' }}>✎ Sửa</button>}
        {canSubmit && <button onClick={() => doAction('submit')} style={{ ...BTN, backgroundColor: '#f9e2af', color: '#1e1e2e' }}>Gửi duyệt</button>}
        {canApprove && <button onClick={() => doAction('approve')} style={{ ...BTN, backgroundColor: '#a6e3a1', color: '#1e1e2e' }}>Duyệt</button>}
        {canApprove && <button onClick={() => setRejectOpen(true)} style={{ ...BTN, backgroundColor: '#f38ba8', color: '#1e1e2e' }}>Từ chối</button>}
        {canConvert && <button onClick={() => doAction('convert')} style={{ ...BTN, backgroundColor: '#89b4fa', color: '#1e1e2e' }}>Tạo đơn mua hàng</button>}
        {(req.status === 'draft' || req.status === 'pending') && <button onClick={() => doAction('cancel')} style={{ ...BTN, backgroundColor: '#45475a', color: '#cdd6f4' }}>Hủy</button>}
      </div>

      {/* Reject modal */}
      {rejectOpen && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #f38ba8' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f38ba8', marginBottom: 8 }}>Lý do từ chối *</label>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none', resize: 'vertical' }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={() => doAction('reject')} style={{ ...BTN, backgroundColor: '#f38ba8', color: '#1e1e2e' }}>Xác nhận từ chối</button>
            <button onClick={() => setRejectOpen(false)} style={{ ...BTN, backgroundColor: '#313244', color: '#cdd6f4', border: '1px solid #45475a' }}>Hủy</button>
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
          <div><span style={{ color: '#a6adc8' }}>Người yêu cầu:</span> <span style={{ color: '#cdd6f4', fontWeight: 600 }}>{req.requestedBy}</span></div>
          <div><span style={{ color: '#a6adc8' }}>Bộ phận:</span> <span style={{ color: '#cdd6f4' }}>{req.department ?? '—'}</span></div>
          <div><span style={{ color: '#a6adc8' }}>Ưu tiên:</span> <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#1e1e2e', backgroundColor: PRIORITY_COLORS[req.priority] }}>{PRIORITY_LABELS[req.priority]}</span></div>
          <div><span style={{ color: '#a6adc8' }}>Ngày tạo:</span> <span style={{ color: '#cdd6f4' }}>{formatDate(req.createdAt)}</span></div>
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#a6adc8' }}>Lý do:</span> <span style={{ color: '#cdd6f4' }}>{req.reason}</span></div>
          {req.approvedBy && <div><span style={{ color: '#a6adc8' }}>Người duyệt:</span> <span style={{ color: '#a6e3a1' }}>{req.approvedBy} ({formatDate(req.approvedAt!)})</span></div>}
          {req.rejectedReason && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#a6adc8' }}>Lý do từ chối:</span> <span style={{ color: '#f38ba8' }}>{req.rejectedReason}</span></div>}
          {req.notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#a6adc8' }}>Ghi chú:</span> <span style={{ color: '#cdd6f4' }}>{req.notes}</span></div>}
        </div>
      </div>

      {/* Items */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20 }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Danh sách vật tư ({req.items.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #45475a' }}>
              {['#', 'Mô tả', 'ĐVT', 'Số lượng', 'Đơn giá DK', 'Thành tiền'].map(h =>
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Mô tả' ? 'left' : 'right', color: '#a6adc8', fontWeight: 600, fontSize: 12 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {req.items.map((it, i) => (
              <tr key={it.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '8px 10px', color: '#6c7086', textAlign: 'right' }}>{i + 1}</td>
                <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'left' }}>{it.description}</td>
                <td style={{ padding: '8px 10px', color: '#a6adc8', textAlign: 'right' }}>{it.unit}</td>
                <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'right' }}>{it.quantity}</td>
                <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(it.estimatedPrice)}</td>
                <td style={{ padding: '8px 10px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(it.estimatedAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, textAlign: 'right', fontSize: 16, fontWeight: 700, color: '#cdd6f4' }}>
          Tổng dự kiến: <span style={{ fontFamily: 'monospace' }}>{formatCurrency(req.totalEstimated)}</span>
        </div>
      </div>
    </div>
  );
}
