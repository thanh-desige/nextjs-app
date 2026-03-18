'use client';
import React from 'react';
import { useKeToanStore } from '../store/keToanStore';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '../types';

interface InvoiceDetailProps {
  invoiceId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export default function InvoiceDetail({ invoiceId, onBack, onEdit }: InvoiceDetailProps) {
  const { invoices, updateInvoice, deleteInvoice } = useKeToanStore();
  const invoice = invoices.find((inv) => inv.invoiceId === invoiceId);
  if (!invoice) return <div style={{ padding: 24, color: '#f38ba8' }}>Không tìm thấy hóa đơn</div>;

  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
  const now = new Date().toISOString();

  const handleApprove = () => {
    updateInvoice(invoiceId, { status: 'approved', approvedBy: 'Current User', approvedAt: now, updatedAt: now });
  };
  const handleCancel = () => {
    updateInvoice(invoiceId, { status: 'cancelled', cancelledBy: 'Current User', cancelledAt: now, updatedAt: now });
  };
  const handleDelete = () => {
    deleteInvoice(invoiceId);
    onBack();
  };

  const infoStyle: React.CSSProperties = { padding: '10px 16px', background: '#181825', borderRadius: 6, marginBottom: 8 };
  const labelStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 12, marginBottom: 2 };
  const valueStyle: React.CSSProperties = { color: '#cdd6f4', fontSize: 14, fontWeight: 500 };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', marginBottom: 16, fontSize: 14 }}>
        ← Quay lại
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#cdd6f4', fontSize: 20 }}>{invoice.invoiceCode}</h2>
          <span style={{ color: '#a6adc8', fontSize: 13 }}>Hóa đơn GTGT</span>
        </div>
        <span
          style={{
            padding: '5px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            color: '#1e1e2e', background: INVOICE_STATUS_COLORS[invoice.status],
          }}
        >
          {INVOICE_STATUS_LABELS[invoice.status]}
        </span>
      </div>

      {/* Customer info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        <div style={infoStyle}>
          <div style={labelStyle}>Khách hàng</div>
          <div style={valueStyle}>{invoice.customerName}</div>
        </div>
        <div style={infoStyle}>
          <div style={labelStyle}>Mã số thuế</div>
          <div style={valueStyle}>{invoice.customerTaxCode ?? '—'}</div>
        </div>
        {invoice.customerAddress && (
          <div style={{ ...infoStyle, gridColumn: 'span 2' }}>
            <div style={labelStyle}>Địa chỉ</div>
            <div style={valueStyle}>{invoice.customerAddress}</div>
          </div>
        )}
        <div style={infoStyle}>
          <div style={labelStyle}>Ngày</div>
          <div style={valueStyle}>{invoice.date}</div>
        </div>
        <div style={infoStyle}>
          <div style={labelStyle}>Đơn hàng</div>
          <div style={valueStyle}>{invoice.soCode ?? '—'}</div>
        </div>
      </div>

      {/* Items table */}
      <h3 style={{ color: '#cdd6f4', fontSize: 16, marginBottom: 12 }}>Chi tiết hàng hóa</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#181825' }}>
            {['#', 'Mô tả', 'SL', 'Đơn giá', 'Thành tiền'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 12px', textAlign: 'left', color: '#a6adc8',
                  fontSize: 13, fontWeight: 600, borderBottom: '1px solid #313244',
                  borderRight: '1px solid #313244',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: '10px 12px', color: '#6c7086', borderRight: '1px solid #313244', width: 40 }}>
                {idx + 1}
              </td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                {item.description}
              </td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>
                {fmt(item.unitPrice)}
              </td>
              <td style={{ padding: '10px 12px', color: '#a6e3a1', fontWeight: 600, textAlign: 'right' }}>
                {fmt(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ width: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#cdd6f4' }}>
            <span>Tiền hàng:</span><span>{fmt(invoice.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#fab387' }}>
            <span>VAT ({(invoice.vatRate * 100).toFixed(0)}%):</span><span>{fmt(invoice.vatAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#a6e3a1', fontWeight: 700, fontSize: 16, borderTop: '1px solid #313244' }}>
            <span>Tổng cộng:</span><span>{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Audit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        <div style={infoStyle}>
          <div style={labelStyle}>Người tạo</div>
          <div style={valueStyle}>{invoice.createdBy} — {new Date(invoice.createdAt).toLocaleString('vi-VN')}</div>
        </div>
        {invoice.approvedBy && (
          <div style={infoStyle}>
            <div style={labelStyle}>Người duyệt</div>
            <div style={valueStyle}>{invoice.approvedBy} — {new Date(invoice.approvedAt!).toLocaleString('vi-VN')}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        {invoice.status === 'draft' && (
          <>
            <button onClick={handleApprove} style={{ padding: '10px 24px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              ✓ Duyệt
            </button>
            <button onClick={handleCancel} style={{ padding: '10px 24px', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              ✗ Hủy hóa đơn
            </button>
            <button onClick={() => onEdit(invoiceId)} style={{ padding: '10px 24px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              Sửa
            </button>
            <button onClick={handleDelete} style={{ padding: '10px 24px', background: '#45475a', color: '#f38ba8', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              Xóa
            </button>
          </>
        )}
      </div>
    </div>
  );
}
