'use client';
// ============================================================
// StockReceiptDetail — Chi tiết phiếu nhập kho + confirm/cancel
// ============================================================

import React, { useState } from 'react';
import { FiArrowLeft, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { useTonKhoStore } from '../store/tonKhoStore';
import { VOUCHER_STATUS_LABELS, VOUCHER_STATUS_COLORS } from '../types';

interface StockReceiptDetailProps {
  receiptId: string;
  onBack: () => void;
  onEdit: (receiptId: string) => void;
}

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('vi-VN'); }
function formatDateTime(iso: string): string { return new Date(iso).toLocaleString('vi-VN'); }

function actionBtnStyle(color: string): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, backgroundColor: 'transparent', border: `1px solid ${color}`, color, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
}

export default function StockReceiptDetail({ receiptId, onBack, onEdit }: StockReceiptDetailProps): React.ReactElement {
  const { receipts, updateReceipt } = useTonKhoStore();
  const receipt = receipts.find(r => r.receiptId === receiptId);
  const [feedback, setFeedback] = useState('');

  if (!receipt) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer' }}><FiArrowLeft size={20} /></button>
        <p style={{ color: '#f38ba8', marginTop: 12 }}>Không tìm thấy phiếu nhập</p>
      </div>
    );
  }

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 2000); };

  const handleConfirm = () => {
    updateReceipt(receipt.receiptId, { status: 'confirmed', confirmedBy: 'user', confirmedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    showFeedback('Đã xác nhận phiếu nhập');
  };

  const handleCancel = () => {
    updateReceipt(receipt.receiptId, { status: 'cancelled', updatedAt: new Date().toISOString() });
    showFeedback('Đã hủy phiếu nhập');
  };

  const canEdit = receipt.status === 'draft';
  const canConfirm = receipt.status === 'draft';
  const canCancel = receipt.status === 'draft';

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiArrowLeft size={20} /></button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>{receipt.receiptCode}</h2>
        <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: VOUCHER_STATUS_COLORS[receipt.status] + '20', color: VOUCHER_STATUS_COLORS[receipt.status] }}>
          {VOUCHER_STATUS_LABELS[receipt.status]}
        </span>
        {feedback && <span style={{ color: '#a6e3a1', fontSize: 13, fontWeight: 600 }}>✓ {feedback}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {canEdit && <button onClick={() => onEdit(receipt.receiptId)} style={actionBtnStyle('#89b4fa')}><FiEdit2 size={14} /> Sửa</button>}
        {canConfirm && <button onClick={handleConfirm} style={actionBtnStyle('#a6e3a1')}><FiCheck size={14} /> Xác nhận</button>}
        {canCancel && <button onClick={handleCancel} style={actionBtnStyle('#f38ba8')}><FiX size={14} /> Hủy phiếu</button>}
      </div>

      {/* Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        {[
          ['Kho nhập', receipt.warehouseName],
          ['Nhà cung cấp', receipt.supplierName ?? '—'],
          ['Mã đơn mua', receipt.poCode ?? '—'],
          ['Ngày tạo', formatDate(receipt.createdAt)],
          ['Người tạo', receipt.createdBy],
          ['Cập nhật', formatDateTime(receipt.updatedAt)],
        ].map(([l, v]) => (
          <div key={l}>
            <span style={{ fontSize: 12, color: '#6c7086' }}>{l}</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#cdd6f4' }}>{v}</p>
          </div>
        ))}
        {receipt.confirmedBy && (
          <div>
            <span style={{ fontSize: 12, color: '#6c7086' }}>Xác nhận bởi</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#a6e3a1' }}>{receipt.confirmedBy} · {formatDateTime(receipt.confirmedAt!)}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Hàng hóa ({receipt.items.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['STT', 'Mô tả', 'SKU', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền'].map((h, i) => (
                <th key={i} style={{ padding: '8px 6px', textAlign: i >= 4 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#6c7086' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, idx) => (
              <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '8px 6px', color: '#6c7086', fontSize: 12, textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: '8px 6px', color: '#a6adc8', fontSize: 13 }}>{item.sku ?? '—'}</td>
                <td style={{ padding: '8px 6px', color: '#a6adc8', fontSize: 13 }}>{item.unit}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ padding: '8px 6px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div style={{ maxWidth: 300, marginLeft: 'auto', backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#cdd6f4' }}>
          <span>Tổng cộng</span><span style={{ color: '#a6e3a1' }}>{formatCurrency(receipt.totalAmount)}</span>
        </div>
      </div>

      {receipt.notes && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
          <span style={{ fontSize: 12, color: '#6c7086' }}>Ghi chú</span>
          <p style={{ margin: '4px 0 0', color: '#a6adc8', fontSize: 13 }}>{receipt.notes}</p>
        </div>
      )}
    </div>
  );
}
