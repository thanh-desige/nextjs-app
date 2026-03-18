'use client';
// ============================================================
// StockTransferForm — Tạo / Sửa phiếu chuyển kho
// ============================================================

import React, { useState, useCallback } from 'react';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { useTonKhoStore } from '../store/tonKhoStore';
import type { StockTransfer, StockItem } from '../types';
import { calcStockItemAmount, calcVoucherTotal } from '../types';

interface StockTransferFormProps {
  editId: string | null;
  onBack: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13,
  backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none',
};
const LABEL_STYLE: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#a6adc8', marginBottom: 4 };

function makeEmptyItem(): StockItem {
  return { itemId: generateId(), description: '', unit: 'cây', quantity: 1, unitPrice: 0, amount: 0 };
}

export default function StockTransferForm({ editId, onBack }: StockTransferFormProps): React.ReactElement {
  const { transfers, addTransfer, updateTransfer } = useTonKhoStore();
  const existing = editId ? transfers.find(t => t.transferId === editId) : null;

  const [fromWarehouseName, setFromWarehouseName] = useState(existing?.fromWarehouseName ?? '');
  const [fromWarehouseId] = useState(existing?.fromWarehouseId ?? 'wh-01');
  const [toWarehouseName, setToWarehouseName] = useState(existing?.toWarehouseName ?? '');
  const [toWarehouseId] = useState(existing?.toWarehouseId ?? 'wh-02');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [items, setItems] = useState<StockItem[]>(existing?.items ?? [makeEmptyItem()]);
  const [saved, setSaved] = useState(false);

  const recalcItem = useCallback((idx: number, field: string, value: string | number) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[idx] };
      if (field === 'description') item.description = value as string;
      else if (field === 'sku') item.sku = value as string;
      else if (field === 'unit') item.unit = value as string;
      else if (field === 'quantity') item.quantity = Number(value) || 0;
      else if (field === 'unitPrice') item.unitPrice = Number(value) || 0;
      item.amount = calcStockItemAmount(item.quantity, item.unitPrice);
      next[idx] = item;
      return next;
    });
  }, []);

  const addItem = () => setItems(prev => [...prev, makeEmptyItem()]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalAmount = calcVoucherTotal(items);

  const handleSave = () => {
    if (!fromWarehouseName.trim() || !toWarehouseName.trim()) return;
    if (items.length === 0 || items.every(i => !i.description.trim())) return;

    const now = new Date().toISOString();
    const finalItems = items.filter(i => i.description.trim()).map(i => ({ ...i, amount: calcStockItemAmount(i.quantity, i.unitPrice) }));
    const finalTotal = calcVoucherTotal(finalItems);

    if (existing) {
      updateTransfer(existing.transferId, {
        fromWarehouseName, fromWarehouseId,
        toWarehouseName, toWarehouseId,
        notes: notes || undefined,
        items: finalItems, totalAmount: finalTotal, updatedAt: now,
      });
    } else {
      const nextCode = `PCK-${String(transfers.length + 1).padStart(4, '0')}`;
      const t: StockTransfer = {
        transferId: generateId(), transferCode: nextCode,
        fromWarehouseId, fromWarehouseName,
        toWarehouseId, toWarehouseName,
        items: finalItems, totalAmount: finalTotal,
        notes: notes || undefined,
        status: 'draft', createdBy: 'user', createdAt: now, updatedAt: now,
      };
      addTransfer(t);
    }
    setSaved(true);
    setTimeout(() => onBack(), 600);
  };

  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiArrowLeft size={20} /></button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>
          {existing ? `Sửa ${existing.transferCode}` : 'Tạo phiếu chuyển kho'}
        </h2>
        {saved && <span style={{ color: '#a6e3a1', fontSize: 13, fontWeight: 600 }}>✓ Đã lưu</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <div>
          <label style={LABEL_STYLE}>Kho xuất *</label>
          <input value={fromWarehouseName} onChange={e => setFromWarehouseName(e.target.value)} placeholder="Tên kho xuất" style={INPUT_STYLE} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Kho nhận *</label>
          <input value={toWarehouseName} onChange={e => setToWarehouseName(e.target.value)} placeholder="Tên kho nhận" style={INPUT_STYLE} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={LABEL_STYLE}>Ghi chú</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ghi chú" style={INPUT_STYLE} />
        </div>
      </div>

      <div style={{ marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: 0 }}>Hàng hóa</h3>
          <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, backgroundColor: 'transparent', border: '1px solid #45475a', color: '#89b4fa', fontSize: 12, cursor: 'pointer' }}>
            <FiPlus size={14} /> Thêm dòng
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['STT', 'Mô tả *', 'SKU', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền', ''].map((h, i) => (
                <th key={i} style={{ padding: '8px 6px', textAlign: i >= 4 && i <= 6 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#6c7086' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '6px', color: '#6c7086', fontSize: 12, width: 36, textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '6px' }}><input value={item.description} onChange={e => recalcItem(idx, 'description', e.target.value)} placeholder="Mô tả" style={{ ...INPUT_STYLE, minWidth: 180 }} /></td>
                <td style={{ padding: '6px', width: 90 }}><input value={item.sku ?? ''} onChange={e => recalcItem(idx, 'sku', e.target.value)} placeholder="SKU" style={INPUT_STYLE} /></td>
                <td style={{ padding: '6px', width: 70 }}><input value={item.unit} onChange={e => recalcItem(idx, 'unit', e.target.value)} style={{ ...INPUT_STYLE, textAlign: 'center' }} /></td>
                <td style={{ padding: '6px', width: 70 }}><input type="number" value={item.quantity} onChange={e => recalcItem(idx, 'quantity', e.target.value)} min={0} style={{ ...INPUT_STYLE, textAlign: 'right' }} /></td>
                <td style={{ padding: '6px', width: 120 }}><input type="number" value={item.unitPrice} onChange={e => recalcItem(idx, 'unitPrice', e.target.value)} min={0} style={{ ...INPUT_STYLE, textAlign: 'right' }} /></td>
                <td style={{ padding: '6px', width: 130, textAlign: 'right', color: '#cdd6f4', fontSize: 13, fontWeight: 500 }}>{fmt(calcStockItemAmount(item.quantity, item.unitPrice))}</td>
                <td style={{ padding: '6px', width: 32 }}>
                  {items.length > 1 && <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', padding: 2 }}><FiTrash2 size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 6, backgroundColor: '#89b4fa', color: '#1e1e2e', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            <FiSave size={16} /> {existing ? 'Cập nhật' : 'Lưu phiếu chuyển'}
          </button>
          <button onClick={onBack} style={{ padding: '10px 24px', borderRadius: 6, backgroundColor: 'transparent', border: '1px solid #45475a', color: '#a6adc8', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
        </div>
        <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16, minWidth: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#cdd6f4' }}>
            <span>Tổng cộng</span><span style={{ color: '#a6e3a1' }}>{fmt(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
