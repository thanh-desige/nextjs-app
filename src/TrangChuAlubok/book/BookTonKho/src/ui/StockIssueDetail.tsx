'use client';
// ============================================================
// StockIssueDetail — Chi tiết phiếu xuất kho + confirm/cancel
// ============================================================

import React, { useState } from 'react';
import { FiArrowLeft, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { useTonKhoStore } from '../store/tonKhoStore';
import { VOUCHER_STATUS_LABELS, VOUCHER_STATUS_COLORS } from '../types';

interface StockIssueDetailProps {
  issueId: string;
  onBack: () => void;
  onEdit: (issueId: string) => void;
}

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('vi-VN'); }
function formatDateTime(iso: string): string { return new Date(iso).toLocaleString('vi-VN'); }

function actionBtnStyle(color: string): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, backgroundColor: 'transparent', border: `1px solid ${color}`, color, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
}

export default function StockIssueDetail({ issueId, onBack, onEdit }: StockIssueDetailProps): React.ReactElement {
  const { issues, updateIssue } = useTonKhoStore();
  const issue = issues.find(i => i.issueId === issueId);
  const [feedback, setFeedback] = useState('');

  if (!issue) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer' }}><FiArrowLeft size={20} /></button>
        <p style={{ color: '#f38ba8', marginTop: 12 }}>Không tìm thấy phiếu xuất</p>
      </div>
    );
  }

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 2000); };

  const handleConfirm = () => {
    updateIssue(issue.issueId, { status: 'confirmed', confirmedBy: 'user', confirmedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    showFeedback('Đã xác nhận phiếu xuất');
  };

  const handleCancel = () => {
    updateIssue(issue.issueId, { status: 'cancelled', updatedAt: new Date().toISOString() });
    showFeedback('Đã hủy phiếu xuất');
  };

  const canEdit = issue.status === 'draft';
  const canConfirm = issue.status === 'draft';
  const canCancel = issue.status === 'draft';

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiArrowLeft size={20} /></button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>{issue.issueCode}</h2>
        <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: VOUCHER_STATUS_COLORS[issue.status] + '20', color: VOUCHER_STATUS_COLORS[issue.status] }}>
          {VOUCHER_STATUS_LABELS[issue.status]}
        </span>
        {feedback && <span style={{ color: '#a6e3a1', fontSize: 13, fontWeight: 600 }}>✓ {feedback}</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {canEdit && <button onClick={() => onEdit(issue.issueId)} style={actionBtnStyle('#89b4fa')}><FiEdit2 size={14} /> Sửa</button>}
        {canConfirm && <button onClick={handleConfirm} style={actionBtnStyle('#a6e3a1')}><FiCheck size={14} /> Xác nhận</button>}
        {canCancel && <button onClick={handleCancel} style={actionBtnStyle('#f38ba8')}><FiX size={14} /> Hủy phiếu</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        {[
          ['Kho xuất', issue.warehouseName],
          ['Khách hàng', issue.customerName ?? '—'],
          ['Mã đơn bán', issue.soCode ?? '—'],
          ['Ngày tạo', formatDate(issue.createdAt)],
          ['Người tạo', issue.createdBy],
          ['Cập nhật', formatDateTime(issue.updatedAt)],
        ].map(([l, v]) => (
          <div key={l}>
            <span style={{ fontSize: 12, color: '#6c7086' }}>{l}</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#cdd6f4' }}>{v}</p>
          </div>
        ))}
        {issue.confirmedBy && (
          <div>
            <span style={{ fontSize: 12, color: '#6c7086' }}>Xác nhận bởi</span>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#a6e3a1' }}>{issue.confirmedBy} · {formatDateTime(issue.confirmedAt!)}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Hàng hóa ({issue.items.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['STT', 'Mô tả', 'SKU', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền'].map((h, i) => (
                <th key={i} style={{ padding: '8px 6px', textAlign: i >= 4 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#6c7086' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issue.items.map((item, idx) => (
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

      <div style={{ maxWidth: 300, marginLeft: 'auto', backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#cdd6f4' }}>
          <span>Tổng cộng</span><span style={{ color: '#a6e3a1' }}>{formatCurrency(issue.totalAmount)}</span>
        </div>
      </div>

      {issue.notes && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
          <span style={{ fontSize: 12, color: '#6c7086' }}>Ghi chú</span>
          <p style={{ margin: '4px 0 0', color: '#a6adc8', fontSize: 13 }}>{issue.notes}</p>
        </div>
      )}
    </div>
  );
}
