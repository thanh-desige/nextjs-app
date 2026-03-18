'use client';
import React, { useState } from 'react';
import { useMuaHangStore } from '../store/muaHangStore';
import type { PurchaseOrderItem } from '../types';
import { calcLineAmount, calcTotals } from '../types';

interface Props {
  editId: string | null;
  onBack: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makeEmptyItem(): PurchaseOrderItem {
  return { itemId: generateId(), description: '', unit: 'cái', quantity: 1, unitPrice: 0, discountPercent: 0, amount: 0, receivedQty: 0 };
}

const INPUT: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#a6adc8', marginBottom: 4 };

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }

export default function PurchaseOrderForm({ editId, onBack }: Props): React.ReactElement {
  const { orders, addOrder, updateOrder } = useMuaHangStore();
  const existing = editId ? orders.find(o => o.orderId === editId) ?? null : null;

  const [supplierName, setSupplierName] = useState(existing?.supplierName ?? '');
  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? '');
  const [deliveryDate, setDeliveryDate] = useState(existing?.deliveryDate ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(existing?.deliveryAddress ?? '');
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? 10);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [items, setItems] = useState<PurchaseOrderItem[]>(existing?.items.length ? existing.items : [makeEmptyItem()]);
  const [saved, setSaved] = useState(false);

  const recalcItem = (idx: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      updated.amount = calcLineAmount(updated.quantity, updated.unitPrice, updated.discountPercent);
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, makeEmptyItem()]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totals = calcTotals(items, taxRate);

  const handleSave = () => {
    if (!supplierName.trim()) return;
    const validItems = items.filter(it => it.description.trim());
    if (validItems.length === 0) return;
    const now = new Date().toISOString();
    const recalced = validItems.map(it => ({ ...it, amount: calcLineAmount(it.quantity, it.unitPrice, it.discountPercent) }));
    const t = calcTotals(recalced, taxRate);

    if (existing) {
      updateOrder(existing.orderId, { supplierId, supplierName, deliveryDate, deliveryAddress, taxRate, notes, items: recalced, ...t, updatedAt: now });
    } else {
      const code = `DMH-${String(orders.length + 1).padStart(4, '0')}`;
      addOrder({
        orderId: generateId(), orderCode: code, supplierId, supplierName, items: recalced,
        ...t, taxRate, paidAmount: 0, status: 'new', deliveryDate, deliveryAddress, notes,
        createdBy: 'Admin', createdAt: now, updatedAt: now,
      });
    }
    setSaved(true);
    setTimeout(() => onBack(), 600);
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ padding: '6px 14px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 600, margin: 0 }}>{existing ? `Sửa ${existing.orderCode}` : 'Tạo đơn mua hàng'}</h2>
        {saved && <span style={{ color: '#a6e3a1', fontSize: 13 }}>✓ Đã lưu</span>}
      </div>

      {/* Supplier info */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={LABEL}>Nhà cung cấp *</label>
            <input value={supplierName} onChange={e => setSupplierName(e.target.value)} style={INPUT} placeholder="Tên nhà cung cấp" />
          </div>
          <div>
            <label style={LABEL}>Mã NCC</label>
            <input value={supplierId} onChange={e => setSupplierId(e.target.value)} style={INPUT} placeholder="Mã nhà cung cấp" />
          </div>
          <div>
            <label style={LABEL}>Ngày giao dự kiến</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={INPUT} />
          </div>
          <div>
            <label style={LABEL}>Thuế suất (%)</label>
            <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} style={{ ...INPUT, width: 100 }} min={0} max={100} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL}>Địa chỉ giao hàng</label>
            <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} style={INPUT} placeholder="Địa chỉ giao hàng" />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, margin: 0 }}>Danh sách hàng hóa</h3>
          <button onClick={addItem} style={{ padding: '6px 14px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#89b4fa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Thêm dòng</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #45475a' }}>
                {['Mô tả', 'ĐVT', 'SL', 'Đơn giá', 'CK%', 'Thành tiền', ''].map(h =>
                  <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: '#a6adc8', fontWeight: 600, fontSize: 12 }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
                  <td style={{ padding: '6px 4px' }}>
                    <input value={item.description} onChange={e => recalcItem(idx, 'description', e.target.value)} style={{ ...INPUT, minWidth: 180 }} placeholder="Mô tả hàng hóa" />
                  </td>
                  <td style={{ padding: '6px 4px' }}>
                    <input value={item.unit} onChange={e => recalcItem(idx, 'unit', e.target.value)} style={{ ...INPUT, width: 70 }} />
                  </td>
                  <td style={{ padding: '6px 4px' }}>
                    <input type="number" value={item.quantity} onChange={e => recalcItem(idx, 'quantity', Number(e.target.value))} style={{ ...INPUT, width: 70, textAlign: 'right' }} min={0} />
                  </td>
                  <td style={{ padding: '6px 4px' }}>
                    <input type="number" value={item.unitPrice} onChange={e => recalcItem(idx, 'unitPrice', Number(e.target.value))} style={{ ...INPUT, width: 120, textAlign: 'right' }} min={0} />
                  </td>
                  <td style={{ padding: '6px 4px' }}>
                    <input type="number" value={item.discountPercent} onChange={e => recalcItem(idx, 'discountPercent', Number(e.target.value))} style={{ ...INPUT, width: 60, textAlign: 'right' }} min={0} max={100} />
                  </td>
                  <td style={{ padding: '6px 4px', color: '#cdd6f4', textAlign: 'right', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {formatCurrency(calcLineAmount(item.quantity, item.unitPrice, item.discountPercent))}
                  </td>
                  <td style={{ padding: '6px 4px' }}>
                    {items.length > 1 && <button onClick={() => removeItem(idx)} style={{ padding: '4px 8px', backgroundColor: 'transparent', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: 15 }}>×</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 280, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#a6adc8' }}>
              <span>Tạm tính:</span><span style={{ fontFamily: 'monospace', color: '#cdd6f4' }}>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#a6adc8' }}>
              <span>Chiết khấu:</span><span style={{ fontFamily: 'monospace', color: '#f38ba8' }}>-{formatCurrency(totals.totalDiscount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#a6adc8' }}>
              <span>Thuế ({taxRate}%):</span><span style={{ fontFamily: 'monospace', color: '#cdd6f4' }}>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1px solid #45475a', fontWeight: 700, color: '#cdd6f4', fontSize: 15 }}>
              <span>Tổng cộng:</span><span style={{ fontFamily: 'monospace' }}>{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes + Actions */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <label style={LABEL}>Ghi chú</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...INPUT, resize: 'vertical' }} placeholder="Ghi chú (nếu có)" />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onBack} style={{ padding: '10px 24px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>Hủy</button>
        <button onClick={handleSave} style={{ padding: '10px 24px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {existing ? 'Cập nhật' : 'Tạo đơn mua'}
        </button>
      </div>
    </div>
  );
}
