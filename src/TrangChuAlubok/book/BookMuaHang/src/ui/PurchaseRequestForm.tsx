'use client';
import React, { useState } from 'react';
import { useMuaHangStore } from '../store/muaHangStore';
import type { PurchaseRequestItem, PriorityLevel } from '../types';
import { PRIORITY_LABELS, calcRequestTotal } from '../types';

interface Props {
  editId: string | null;
  onBack: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makeEmptyItem(): PurchaseRequestItem {
  return { itemId: generateId(), description: '', unit: 'cái', quantity: 1, estimatedPrice: 0, estimatedAmount: 0 };
}

const INPUT: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#a6adc8', marginBottom: 4 };

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }

export default function PurchaseRequestForm({ editId, onBack }: Props): React.ReactElement {
  const { requests, addRequest, updateRequest } = useMuaHangStore();
  const existing = editId ? requests.find(r => r.requestId === editId) ?? null : null;

  const [requestedBy, setRequestedBy] = useState(existing?.requestedBy ?? '');
  const [department, setDepartment] = useState(existing?.department ?? '');
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [priority, setPriority] = useState<PriorityLevel>(existing?.priority ?? 'normal');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [items, setItems] = useState<PurchaseRequestItem[]>(existing?.items.length ? existing.items : [makeEmptyItem()]);
  const [saved, setSaved] = useState(false);

  const recalcItem = (idx: number, field: keyof PurchaseRequestItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      updated.estimatedAmount = updated.quantity * updated.estimatedPrice;
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, makeEmptyItem()]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const total = calcRequestTotal(items);

  const handleSave = () => {
    if (!requestedBy.trim() || !reason.trim()) return;
    const validItems = items.filter(it => it.description.trim());
    if (validItems.length === 0) return;
    const now = new Date().toISOString();
    const recalced = validItems.map(it => ({ ...it, estimatedAmount: it.quantity * it.estimatedPrice }));
    const totalEstimated = calcRequestTotal(recalced);

    if (existing) {
      updateRequest(existing.requestId, { requestedBy, department, reason, priority, notes, items: recalced, totalEstimated, updatedAt: now });
    } else {
      const code = `YCMH-${String(requests.length + 1).padStart(4, '0')}`;
      addRequest({ requestId: generateId(), requestCode: code, requestedBy, department, reason, items: recalced, totalEstimated, status: 'draft', priority, notes, createdAt: now, updatedAt: now });
    }
    setSaved(true);
    setTimeout(() => onBack(), 600);
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ padding: '6px 14px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 600, margin: 0 }}>{existing ? `Sửa ${existing.requestCode}` : 'Tạo yêu cầu mua hàng'}</h2>
        {saved && <span style={{ color: '#a6e3a1', fontSize: 13 }}>✓ Đã lưu</span>}
      </div>

      {/* Info section */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={LABEL}>Người yêu cầu *</label>
            <input value={requestedBy} onChange={e => setRequestedBy(e.target.value)} style={INPUT} placeholder="Tên người yêu cầu" />
          </div>
          <div>
            <label style={LABEL}>Bộ phận</label>
            <input value={department} onChange={e => setDepartment(e.target.value)} style={INPUT} placeholder="Bộ phận" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL}>Lý do *</label>
            <input value={reason} onChange={e => setReason(e.target.value)} style={INPUT} placeholder="Lý do yêu cầu mua hàng" />
          </div>
          <div>
            <label style={LABEL}>Mức ưu tiên</label>
            <select value={priority} onChange={e => setPriority(e.target.value as PriorityLevel)} style={INPUT}>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, margin: 0 }}>Danh sách vật tư</h3>
          <button onClick={addItem} style={{ padding: '6px 14px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#89b4fa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Thêm dòng</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #45475a' }}>
              {['Mô tả', 'ĐVT', 'SL', 'Đơn giá dự kiến', 'Thành tiền', ''].map(h => (
                <th key={h} style={{ padding: '8px 8px', textAlign: 'left', color: '#a6adc8', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '6px 4px' }}>
                  <input value={item.description} onChange={e => recalcItem(idx, 'description', e.target.value)} style={{ ...INPUT, minWidth: 200 }} placeholder="Mô tả vật tư" />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input value={item.unit} onChange={e => recalcItem(idx, 'unit', e.target.value)} style={{ ...INPUT, width: 70 }} />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input type="number" value={item.quantity} onChange={e => recalcItem(idx, 'quantity', Number(e.target.value))} style={{ ...INPUT, width: 70, textAlign: 'right' }} min={0} />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input type="number" value={item.estimatedPrice} onChange={e => recalcItem(idx, 'estimatedPrice', Number(e.target.value))} style={{ ...INPUT, width: 130, textAlign: 'right' }} min={0} />
                </td>
                <td style={{ padding: '6px 4px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {formatCurrency(item.quantity * item.estimatedPrice)}
                </td>
                <td style={{ padding: '6px 4px' }}>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} style={{ padding: '4px 8px', backgroundColor: 'transparent', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: 15 }}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, textAlign: 'right', color: '#cdd6f4', fontSize: 15, fontWeight: 600 }}>
          Tổng dự kiến: <span style={{ fontFamily: 'monospace' }}>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Notes + Actions */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <label style={LABEL}>Ghi chú</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...INPUT, resize: 'vertical' }} placeholder="Ghi chú thêm (nếu có)" />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onBack} style={{ padding: '10px 24px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>Hủy</button>
        <button onClick={handleSave} style={{ padding: '10px 24px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {existing ? 'Cập nhật' : 'Tạo yêu cầu'}
        </button>
      </div>
    </div>
  );
}
