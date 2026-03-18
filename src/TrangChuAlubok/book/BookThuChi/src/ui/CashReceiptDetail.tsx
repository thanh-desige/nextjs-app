'use client';
import React from 'react';
import { useThuChiStore } from '../store/thuChiStore';
import { FINANCE_STATUS_LABELS, FINANCE_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '../types';

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

interface CashReceiptDetailProps {
  receiptId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export default function CashReceiptDetail({ receiptId, onBack, onEdit }: CashReceiptDetailProps): React.ReactElement {
  const { receipts, updateReceipt } = useThuChiStore();
  const receipt = receipts.find(r => r.receiptId === receiptId);

  if (!receipt) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ padding: '6px 12px', backgroundColor: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
        <p style={{ color: '#f38ba8', marginTop: 16 }}>Không tìm thấy phiếu thu</p>
      </div>
    );
  }

  const handleConfirm = () => {
    updateReceipt(receiptId, { status: 'confirmed', confirmedBy: 'Current User', confirmedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  };
  const handleCancel = () => {
    updateReceipt(receiptId, { status: 'cancelled', updatedAt: new Date().toISOString() });
  };

  const infoStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, marginBottom: 6 };
  const labelStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 13 };
  const valueStyle: React.CSSProperties = { color: '#cdd6f4', fontSize: 13 };

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ padding: '6px 12px', backgroundColor: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
        <h2 style={{ margin: 0, fontSize: 18, color: '#cdd6f4' }}>Phiếu thu {receipt.receiptCode}</h2>
        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: FINANCE_STATUS_COLORS[receipt.status] + '22', color: FINANCE_STATUS_COLORS[receipt.status] }}>{FINANCE_STATUS_LABELS[receipt.status]}</span>
      </div>

      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, border: '1px solid #313244', marginBottom: 16 }}>
        <div style={infoStyle}><span style={labelStyle}>Mã phiếu:</span><span style={valueStyle}>{receipt.receiptCode}</span></div>
        <div style={infoStyle}><span style={labelStyle}>Khách hàng:</span><span style={valueStyle}>{receipt.customerName}</span></div>
        <div style={infoStyle}><span style={labelStyle}>Đơn bán:</span><span style={valueStyle}>{receipt.soCode || '—'}</span></div>
        <div style={infoStyle}><span style={labelStyle}>Số tiền:</span><span style={{ ...valueStyle, color: '#a6e3a1', fontWeight: 600 }}>{formatCurrency(receipt.amount)}</span></div>
        <div style={infoStyle}><span style={labelStyle}>Hình thức:</span><span style={valueStyle}>{PAYMENT_METHOD_LABELS[receipt.paymentMethod]}</span></div>
        {receipt.bankAccount && <div style={infoStyle}><span style={labelStyle}>TK ngân hàng:</span><span style={valueStyle}>{receipt.bankAccount}</span></div>}
        <div style={infoStyle}><span style={labelStyle}>Diễn giải:</span><span style={valueStyle}>{receipt.description}</span></div>
        {receipt.notes && <div style={infoStyle}><span style={labelStyle}>Ghi chú:</span><span style={valueStyle}>{receipt.notes}</span></div>}
        <div style={infoStyle}><span style={labelStyle}>Người tạo:</span><span style={valueStyle}>{receipt.createdBy}</span></div>
        <div style={infoStyle}><span style={labelStyle}>Ngày tạo:</span><span style={valueStyle}>{formatDate(receipt.createdAt)}</span></div>
        {receipt.confirmedBy && <div style={infoStyle}><span style={labelStyle}>Người duyệt:</span><span style={valueStyle}>{receipt.confirmedBy}</span></div>}
        {receipt.confirmedAt && <div style={infoStyle}><span style={labelStyle}>Ngày duyệt:</span><span style={valueStyle}>{formatDate(receipt.confirmedAt)}</span></div>}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {receipt.status === 'draft' && (
          <>
            <button onClick={handleConfirm} style={{ padding: '8px 16px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Xác nhận</button>
            <button onClick={() => onEdit(receiptId)} style={{ padding: '8px 16px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Sửa</button>
            <button onClick={handleCancel} style={{ padding: '8px 16px', backgroundColor: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Hủy phiếu</button>
          </>
        )}
      </div>
    </div>
  );
}
