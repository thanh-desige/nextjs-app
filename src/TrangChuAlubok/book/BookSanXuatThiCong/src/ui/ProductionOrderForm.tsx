'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import type { ProductionOrder, ProductionOrderItem, ProductionOrderStatus } from '../types';
import { PO_STATUS_LABELS, PRIORITY_LABELS } from '../types';

interface Props {
  editId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export default function ProductionOrderForm({ editId, onBack, onSaved }: Props) {
  const { productionOrders, projects, addProductionOrder, updateProductionOrder } =
    useSanXuatThiCongStore();
  const existing = editId ? productionOrders.find((o) => o.orderId === editId) : null;

  const [projectId, setProjectId] = useState(existing?.projectId ?? '');
  const [priority, setPriority] = useState<ProductionOrder['priority']>(existing?.priority ?? 'normal');
  const [startDate, setStartDate] = useState(existing?.startDate ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '');
  const [assignedTo, setAssignedTo] = useState(existing?.assignedTo ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [items, setItems] = useState<ProductionOrderItem[]>(
    existing?.items ?? [
      { itemId: `pi-${Date.now()}`, description: '', quantity: 1, unit: 'bộ', completedQty: 0, defectQty: 0 },
    ]
  );

  const addItem = () => {
    setItems([
      ...items,
      { itemId: `pi-${Date.now()}-${items.length}`, description: '', quantity: 1, unit: 'bộ', completedQty: 0, defectQty: 0 },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<ProductionOrderItem>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const selectedProject = projects.find((p) => p.projectId === projectId);

  const handleSave = () => {
    if (!projectId || !dueDate || items.some((i) => !i.description)) return;
    const now = new Date().toISOString();
    if (existing) {
      updateProductionOrder(existing.orderId, {
        projectId,
        projectCode: selectedProject?.projectCode ?? '',
        items,
        priority,
        startDate,
        dueDate,
        assignedTo: assignedTo || undefined,
        notes: notes || undefined,
        updatedAt: now,
      });
    } else {
      const code = `LSX-${String(productionOrders.length + 1).padStart(4, '0')}`;
      const newOrder: ProductionOrder = {
        orderId: `po-${Date.now()}`,
        orderCode: code,
        projectId,
        projectCode: selectedProject?.projectCode ?? '',
        items,
        priority,
        status: 'new',
        assignedTo: assignedTo || undefined,
        startDate,
        dueDate,
        notes: notes || undefined,
        createdBy: 'Người dùng',
        createdAt: now,
        updatedAt: now,
      };
      addProductionOrder(newOrder);
    }
    onSaved();
  };

  const labelStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 12, marginBottom: 4 };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: 6,
    color: '#cdd6f4',
    fontSize: 13,
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', fontSize: 14 }}>
          ← Quay lại
        </button>
        <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 700, margin: 0 }}>
          {existing ? `Sửa ${existing.orderCode}` : 'Tạo lệnh sản xuất'}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={labelStyle}>Công trình *</div>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle}>
            <option value="">-- Chọn công trình --</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectCode} — {p.projectName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Ưu tiên</div>
          <select value={priority} onChange={(e) => setPriority(e.target.value as ProductionOrder['priority'])} style={inputStyle}>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Ngày bắt đầu</div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Hạn hoàn thành *</div>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Phân công cho</div>
          <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Tổ SX 1 — Anh Tuấn" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Ghi chú</div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú..." style={inputStyle} />
        </div>
      </div>

      {/* Items table */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600 }}>Hạng mục sản xuất</div>
          <button onClick={addItem} style={{ background: 'none', border: '1px solid #89b4fa', color: '#89b4fa', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
            + Thêm
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['#', 'Mô tả *', 'SL', 'ĐVT', ''].map((h) => (
                <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#a6adc8', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '6px 8px', color: '#6c7086', width: 30 }}>{idx + 1}</td>
                <td style={{ padding: '6px 8px' }}>
                  <input
                    value={it.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    placeholder="Cửa nhôm Xingfa 55 — 1200×2100"
                    style={{ ...inputStyle, padding: '6px 8px' }}
                  />
                </td>
                <td style={{ padding: '6px 8px', width: 80 }}>
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 1 })}
                    style={{ ...inputStyle, padding: '6px 8px', width: 60 }}
                  />
                </td>
                <td style={{ padding: '6px 8px', width: 80 }}>
                  <input
                    value={it.unit}
                    onChange={(e) => updateItem(idx, { unit: e.target.value })}
                    style={{ ...inputStyle, padding: '6px 8px', width: 60 }}
                  />
                </td>
                <td style={{ padding: '6px 8px', width: 40 }}>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: 16 }}>
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleSave} style={{ padding: '10px 24px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {existing ? 'Cập nhật' : 'Tạo lệnh'}
        </button>
        <button onClick={onBack} style={{ padding: '10px 24px', backgroundColor: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          Hủy
        </button>
      </div>
    </div>
  );
}
