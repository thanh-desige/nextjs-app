'use client';
import React from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import {
  PO_STATUS_LABELS, PO_STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  type ProductionOrderStatus,
} from '../types';

const fmt = (n: number) => n.toLocaleString('vi-VN');

interface Props {
  orderId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export default function ProductionOrderDetail({ orderId, onBack, onEdit }: Props) {
  const { productionOrders, updateProductionOrder, deleteProductionOrder } =
    useSanXuatThiCongStore();
  const order = productionOrders.find((o) => o.orderId === orderId);

  if (!order) {
    return (
      <div style={{ padding: 24, color: '#f38ba8' }}>
        Không tìm thấy lệnh sản xuất.{' '}
        <button onClick={onBack} style={{ color: '#89b4fa', background: 'none', border: 'none', cursor: 'pointer' }}>
          Quay lại
        </button>
      </div>
    );
  }

  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const completedQty = order.items.reduce((s, i) => s + i.completedQty, 0);
  const defectQty = order.items.reduce((s, i) => s + i.defectQty, 0);
  const pct = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;

  const nextStatus: Partial<Record<ProductionOrderStatus, ProductionOrderStatus>> = {
    new: 'cutting',
    cutting: 'processing',
    processing: 'qc',
    qc: 'completed',
  };

  const handleAdvance = () => {
    const next = nextStatus[order.status];
    if (!next) return;
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: next, updatedAt: now };
    if (next === 'completed') {
      patch.completedAt = now;
      patch.qcPassedAt = now;
    }
    updateProductionOrder(orderId, patch);
  };

  const handleDefect = () => {
    updateProductionOrder(orderId, { status: 'defect', updatedAt: new Date().toISOString() });
  };

  const handleCancel = () => {
    updateProductionOrder(orderId, { status: 'cancelled', updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    deleteProductionOrder(orderId);
    onBack();
  };

  const infoStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 12, marginBottom: 2 };
  const valStyle: React.CSSProperties = { color: '#cdd6f4', fontSize: 14, marginBottom: 12 };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', fontSize: 14 }}>
          ← Quay lại
        </button>
        <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 700, margin: 0 }}>
          {order.orderCode}
        </h2>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            color: '#1e1e2e',
            backgroundColor: PO_STATUS_COLORS[order.status],
          }}
        >
          {PO_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Info grid */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={infoStyle}>Công trình</div>
            <div style={valStyle}>{order.projectCode}</div>
          </div>
          <div>
            <div style={infoStyle}>Ưu tiên</div>
            <div style={{ ...valStyle, color: PRIORITY_COLORS[order.priority], fontWeight: 600 }}>
              {PRIORITY_LABELS[order.priority]}
            </div>
          </div>
          <div>
            <div style={infoStyle}>Phân công</div>
            <div style={valStyle}>{order.assignedTo || '—'}</div>
          </div>
          <div>
            <div style={infoStyle}>Ngày bắt đầu</div>
            <div style={valStyle}>{order.startDate}</div>
          </div>
          <div>
            <div style={infoStyle}>Hạn hoàn thành</div>
            <div style={valStyle}>{order.dueDate}</div>
          </div>
          <div>
            <div style={infoStyle}>Tiến độ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 8, backgroundColor: '#313244', borderRadius: 4 }}>
                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? '#a6e3a1' : '#f9e2af', borderRadius: 4 }} />
              </div>
              <span style={{ color: '#cdd6f4', fontWeight: 600 }}>{pct}%</span>
            </div>
          </div>
        </div>
        {order.notes && (
          <div style={{ marginTop: 12 }}>
            <div style={infoStyle}>Ghi chú</div>
            <div style={{ color: '#bac2de', fontSize: 13 }}>{order.notes}</div>
          </div>
        )}
      </div>

      {/* Items table */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
          Hạng mục sản xuất
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['#', 'Mô tả', 'SL cần', 'Hoàn tất', 'Lỗi', 'ĐVT'].map((h) => (
                <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#a6adc8', fontWeight: 600, borderRight: '1px solid #313244' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, idx) => (
              <tr key={it.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '8px', color: '#6c7086', borderRight: '1px solid #313244' }}>{idx + 1}</td>
                <td style={{ padding: '8px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{it.description}</td>
                <td style={{ padding: '8px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>{it.quantity}</td>
                <td style={{ padding: '8px', color: '#a6e3a1', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #313244' }}>{it.completedQty}</td>
                <td style={{ padding: '8px', color: it.defectQty > 0 ? '#f38ba8' : '#6c7086', textAlign: 'right', borderRight: '1px solid #313244' }}>{it.defectQty}</td>
                <td style={{ padding: '8px', color: '#bac2de' }}>{it.unit}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 600, borderTop: '2px solid #45475a' }}>
              <td colSpan={2} style={{ padding: '8px', color: '#a6adc8', borderRight: '1px solid #313244' }}>Tổng</td>
              <td style={{ padding: '8px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>{totalQty}</td>
              <td style={{ padding: '8px', color: '#a6e3a1', textAlign: 'right', borderRight: '1px solid #313244' }}>{completedQty}</td>
              <td style={{ padding: '8px', color: defectQty > 0 ? '#f38ba8' : '#6c7086', textAlign: 'right', borderRight: '1px solid #313244' }}>{defectQty}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* QC Info */}
      {order.qcPassedAt && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h3 style={{ color: '#a6e3a1', fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>✓ QC Đạt</h3>
          <div style={{ color: '#bac2de', fontSize: 13 }}>
            Thời gian: {new Date(order.qcPassedAt).toLocaleString('vi-VN')}
          </div>
          {order.qcNote && <div style={{ color: '#bac2de', fontSize: 13, marginTop: 4 }}>{order.qcNote}</div>}
        </div>
      )}

      {/* Audit */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ color: '#6c7086', fontSize: 12 }}>
          Tạo bởi: {order.createdBy} — {new Date(order.createdAt).toLocaleString('vi-VN')}
          {order.completedAt && <> | Hoàn tất: {new Date(order.completedAt).toLocaleString('vi-VN')}</>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {nextStatus[order.status] && (
          <button
            onClick={handleAdvance}
            style={{ padding: '8px 20px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            Chuyển → {PO_STATUS_LABELS[nextStatus[order.status]!]}
          </button>
        )}
        {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'defect' && (
          <button
            onClick={handleDefect}
            style={{ padding: '8px 20px', backgroundColor: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            Báo lỗi
          </button>
        )}
        {order.status === 'new' && (
          <>
            <button
              onClick={() => onEdit(orderId)}
              style={{ padding: '8px 20px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              Sửa
            </button>
            <button
              onClick={handleCancel}
              style={{ padding: '8px 20px', backgroundColor: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
              Hủy lệnh
            </button>
            <button
              onClick={handleDelete}
              style={{ padding: '8px 16px', backgroundColor: '#45475a', color: '#f38ba8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
              Xóa
            </button>
          </>
        )}
      </div>
    </div>
  );
}
