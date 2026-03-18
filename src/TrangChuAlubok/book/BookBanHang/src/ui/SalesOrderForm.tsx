'use client';
// ============================================================
// SalesOrderForm — Create / Edit đơn bán hàng
// Line items, customer, delivery, totals
// ============================================================

import React, { useState, useCallback } from 'react';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { useBanHangStore } from '../store/banHangStore';
import type { SalesOrder, SalesOrderItem } from '../types';
import { calcLineAmount, calcTotals } from '../types';

interface SalesOrderFormProps {
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

function makeEmptyItem(): SalesOrderItem {
  return { itemId: generateId(), description: '', unit: 'bộ', quantity: 1, unitPrice: 0, discountPercent: 0, amount: 0, deliveredQty: 0 };
}

export default function SalesOrderForm({ editId, onBack }: SalesOrderFormProps): React.ReactElement {
  const { orders, addOrder, updateOrder } = useBanHangStore();
  const existing = editId ? orders.find(o => o.orderId === editId) : null;

  const [customerName, setCustomerName] = useState(existing?.customerName ?? '');
  const [customerId] = useState(existing?.customerId ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? 10);
  const [deliveryDate, setDeliveryDate] = useState(existing?.deliveryDate ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(existing?.deliveryAddress ?? '');
  const [items, setItems] = useState<SalesOrderItem[]>(existing?.items ?? [makeEmptyItem()]);
  const [saved, setSaved] = useState(false);

  const recalcItem = useCallback((idx: number, field: string, value: string | number) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[idx] };
      if (field === 'description') item.description = value as string;
      else if (field === 'unit') item.unit = value as string;
      else if (field === 'quantity') item.quantity = Number(value) || 0;
      else if (field === 'unitPrice') item.unitPrice = Number(value) || 0;
      else if (field === 'discountPercent') item.discountPercent = Math.min(100, Math.max(0, Number(value) || 0));
      item.amount = calcLineAmount(item.quantity, item.unitPrice, item.discountPercent);
      next[idx] = item;
      return next;
    });
  }, []);

  const addItem = () => setItems(prev => [...prev, makeEmptyItem()]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totals = calcTotals(
    items.map(i => ({ ...i, notes: undefined, bomRef: undefined })),
    taxRate,
  );

  const handleSave = () => {
    if (!customerName.trim()) return;
    if (items.length === 0 || items.every(i => !i.description.trim())) return;

    const now = new Date().toISOString();
    const finalItems = items.filter(i => i.description.trim()).map(i => ({
      ...i, amount: calcLineAmount(i.quantity, i.unitPrice, i.discountPercent),
    }));
    const finalTotals = calcTotals(
      finalItems.map(i => ({ ...i, notes: undefined, bomRef: undefined })),
      taxRate,
    );

    if (existing) {
      updateOrder(existing.orderId, {
        customerName, notes: notes || undefined,
        items: finalItems, taxRate,
        deliveryDate: deliveryDate || undefined,
        deliveryAddress: deliveryAddress || undefined,
        ...finalTotals, updatedAt: now,
      });
    } else {
      const nextCode = `DH-${String(orders.length + 1).padStart(4, '0')}`;
      const order: SalesOrder = {
        orderId: generateId(), orderCode: nextCode,
        customerId: customerId || 'cust-new', customerName,
        items: finalItems, ...finalTotals, taxRate,
        paidAmount: 0,
        deliveryDate: deliveryDate || undefined,
        deliveryAddress: deliveryAddress || undefined,
        status: 'new', createdBy: 'u1', createdAt: now, updatedAt: now,
      };
      addOrder(order);
    }
    setSaved(true);
    setTimeout(() => onBack(), 600);
  };

  const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', padding: 4 }}><FiArrowLeft size={20} /></button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>{existing ? `Sửa ${existing.orderCode}` : 'Tạo đơn hàng mới'}</h2>
        {saved && <span style={{ color: '#a6e3a1', fontSize: 13, fontWeight: 600 }}>✓ Đã lưu</span>}
      </div>

      {/* Customer + Delivery */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <div>
          <label style={LABEL_STYLE}>Khách hàng *</label>
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Tên khách hàng" style={INPUT_STYLE} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Ngày giao hàng</label>
          <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={INPUT_STYLE} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={LABEL_STYLE}>Địa chỉ giao hàng</label>
          <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Địa chỉ giao hàng" style={INPUT_STYLE} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Thuế VAT (%)</label>
          <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value) || 0)} min={0} max={100} style={INPUT_STYLE} />
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: 24, padding: 20, backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: 0 }}>Hạng mục</h3>
          <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, backgroundColor: 'transparent', border: '1px solid #45475a', color: '#89b4fa', fontSize: 12, cursor: 'pointer' }}>
            <FiPlus size={14} /> Thêm dòng
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['STT', 'Mô tả *', 'ĐVT', 'SL', 'Đơn giá', 'CK %', 'Thành tiền', ''].map((h, i) => (
                <th key={i} style={{ padding: '8px 6px', textAlign: i >= 3 && i <= 6 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#6c7086' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '6px', color: '#6c7086', fontSize: 12, width: 36, textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '6px' }}><input value={item.description} onChange={e => recalcItem(idx, 'description', e.target.value)} placeholder="Mô tả" style={{ ...INPUT_STYLE, minWidth: 200 }} /></td>
                <td style={{ padding: '6px', width: 70 }}><input value={item.unit} onChange={e => recalcItem(idx, 'unit', e.target.value)} style={{ ...INPUT_STYLE, textAlign: 'center' }} /></td>
                <td style={{ padding: '6px', width: 70 }}><input type="number" value={item.quantity} onChange={e => recalcItem(idx, 'quantity', e.target.value)} min={0} style={{ ...INPUT_STYLE, textAlign: 'right' }} /></td>
                <td style={{ padding: '6px', width: 120 }}><input type="number" value={item.unitPrice} onChange={e => recalcItem(idx, 'unitPrice', e.target.value)} min={0} style={{ ...INPUT_STYLE, textAlign: 'right' }} /></td>
                <td style={{ padding: '6px', width: 60 }}><input type="number" value={item.discountPercent} onChange={e => recalcItem(idx, 'discountPercent', e.target.value)} min={0} max={100} style={{ ...INPUT_STYLE, textAlign: 'right' }} /></td>
                <td style={{ padding: '6px', width: 130, textAlign: 'right', color: '#cdd6f4', fontSize: 13, fontWeight: 500 }}>{formatCurrency(calcLineAmount(item.quantity, item.unitPrice, item.discountPercent))}</td>
                <td style={{ padding: '6px', width: 32 }}>{items.length > 1 && <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', padding: 2 }}><FiTrash2 size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }}>
        <div>
          <label style={LABEL_STYLE}>Ghi chú</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Ghi chú..." style={{ ...INPUT_STYLE, resize: 'vertical' }} />
        </div>
        <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 16 }}>
          {[['Tạm tính', totals.subtotal], ['Chiết khấu', totals.totalDiscount], [`Thuế VAT (${taxRate}%)`, totals.taxAmount]].map(([l, v]) => (
            <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#a6adc8' }}>
              <span>{l as string}</span><span>{formatCurrency(v as number)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 8, borderTop: '1px solid #313244', fontSize: 15, fontWeight: 700, color: '#cdd6f4' }}>
            <span>Tổng cộng</span><span style={{ color: '#a6e3a1' }}>{formatCurrency(totals.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 6, backgroundColor: '#89b4fa', color: '#1e1e2e', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          <FiSave size={16} /> {existing ? 'Cập nhật' : 'Lưu đơn hàng'}
        </button>
        <button onClick={onBack} style={{ padding: '10px 24px', borderRadius: 6, backgroundColor: 'transparent', border: '1px solid #45475a', color: '#a6adc8', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
      </div>
    </div>
  );
}
