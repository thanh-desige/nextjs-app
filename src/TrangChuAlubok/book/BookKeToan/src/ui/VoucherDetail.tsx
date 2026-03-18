'use client';
import React from 'react';
import { useKeToanStore } from '../store/keToanStore';
import {
  VOUCHER_STATUS_LABELS,
  VOUCHER_STATUS_COLORS,
  VOUCHER_TYPE_LABELS,
} from '../types';

interface VoucherDetailProps {
  voucherId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export default function VoucherDetail({ voucherId, onBack, onEdit }: VoucherDetailProps) {
  const { vouchers, updateVoucher, deleteVoucher } = useKeToanStore();
  const voucher = vouchers.find((v) => v.voucherId === voucherId);
  if (!voucher) return <div style={{ padding: 24, color: '#f38ba8' }}>Không tìm thấy chứng từ</div>;

  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
  const now = new Date().toISOString();

  const handleApprove = () => {
    updateVoucher(voucherId, { status: 'approved', approvedBy: 'Current User', approvedAt: now, updatedAt: now });
  };
  const handleReject = () => {
    updateVoucher(voucherId, { status: 'rejected', rejectedBy: 'Current User', rejectedAt: now, updatedAt: now });
  };
  const handleClose = () => {
    updateVoucher(voucherId, { status: 'closed', closedBy: 'Current User', closedAt: now, updatedAt: now });
  };
  const handleDelete = () => {
    deleteVoucher(voucherId);
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
          <h2 style={{ margin: 0, color: '#cdd6f4', fontSize: 20 }}>{voucher.voucherCode}</h2>
          <span style={{ color: '#a6adc8', fontSize: 13 }}>{VOUCHER_TYPE_LABELS[voucher.voucherType]}</span>
        </div>
        <span
          style={{
            padding: '5px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            color: '#1e1e2e', background: VOUCHER_STATUS_COLORS[voucher.status],
          }}
        >
          {VOUCHER_STATUS_LABELS[voucher.status]}
        </span>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        <div style={infoStyle}>
          <div style={labelStyle}>Ngày</div>
          <div style={valueStyle}>{voucher.date}</div>
        </div>
        <div style={infoStyle}>
          <div style={labelStyle}>Tổng Nợ</div>
          <div style={{ ...valueStyle, color: '#a6e3a1' }}>{fmt(voucher.totalDebit)}</div>
        </div>
        <div style={infoStyle}>
          <div style={labelStyle}>Tổng Có</div>
          <div style={{ ...valueStyle, color: '#f38ba8' }}>{fmt(voucher.totalCredit)}</div>
        </div>
        {voucher.sourceCode && (
          <div style={infoStyle}>
            <div style={labelStyle}>Nguồn</div>
            <div style={valueStyle}>{voucher.sourceModule} — {voucher.sourceCode}</div>
          </div>
        )}
        <div style={{ ...infoStyle, gridColumn: voucher.sourceCode ? 'span 2' : 'span 3' }}>
          <div style={labelStyle}>Mô tả</div>
          <div style={valueStyle}>{voucher.description}</div>
        </div>
      </div>

      {/* Entries table */}
      <h3 style={{ color: '#cdd6f4', fontSize: 16, marginBottom: 12 }}>Chi tiết bút toán</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <thead>
          <tr style={{ background: '#181825' }}>
            {['TK', 'Tên tài khoản', 'Nợ', 'Có', 'Diễn giải'].map((h) => (
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
          {voucher.entries.map((e) => (
            <tr key={e.entryId} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>
                {e.accountCode}
              </td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                {e.accountName}
              </td>
              <td style={{ padding: '10px 12px', color: e.debitAmount > 0 ? '#a6e3a1' : '#6c7086', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #313244' }}>
                {e.debitAmount > 0 ? fmt(e.debitAmount) : '—'}
              </td>
              <td style={{ padding: '10px 12px', color: e.creditAmount > 0 ? '#f38ba8' : '#6c7086', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #313244' }}>
                {e.creditAmount > 0 ? fmt(e.creditAmount) : '—'}
              </td>
              <td style={{ padding: '10px 12px', color: '#9399b2' }}>{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Audit info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        <div style={infoStyle}>
          <div style={labelStyle}>Người tạo</div>
          <div style={valueStyle}>{voucher.createdBy} — {new Date(voucher.createdAt).toLocaleString('vi-VN')}</div>
        </div>
        {voucher.approvedBy && (
          <div style={infoStyle}>
            <div style={labelStyle}>Người duyệt</div>
            <div style={valueStyle}>{voucher.approvedBy} — {new Date(voucher.approvedAt!).toLocaleString('vi-VN')}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        {voucher.status === 'draft' && (
          <>
            <button onClick={handleApprove} style={{ padding: '10px 24px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              ✓ Duyệt
            </button>
            <button onClick={handleReject} style={{ padding: '10px 24px', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              ✗ Từ chối
            </button>
            <button onClick={() => onEdit(voucherId)} style={{ padding: '10px 24px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              Sửa
            </button>
            <button onClick={handleDelete} style={{ padding: '10px 24px', background: '#45475a', color: '#f38ba8', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              Xóa
            </button>
          </>
        )}
        {voucher.status === 'approved' && (
          <button onClick={handleClose} style={{ padding: '10px 24px', background: '#6c7086', color: '#cdd6f4', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            🔒 Khóa sổ
          </button>
        )}
      </div>
    </div>
  );
}
