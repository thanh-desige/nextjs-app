'use client';
import React, { useState, useEffect } from 'react';
import { useKeToanStore } from '../store/keToanStore';
import type { InvoiceItem } from '../types';
import { calcInvoiceTotal } from '../types';

interface InvoiceFormProps {
  editId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

const emptyItem = (): InvoiceItem => ({
  itemId: `ii-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

export default function InvoiceForm({ editId, onBack, onSaved }: InvoiceFormProps) {
  const { invoices, addInvoice, updateInvoice } = useKeToanStore();
  const existing = editId ? invoices.find((inv) => inv.invoiceId === editId) : null;

  const [customerName, setCustomerName] = useState(existing?.customerName ?? '');
  const [customerAddress, setCustomerAddress] = useState(existing?.customerAddress ?? '');
  const [customerTaxCode, setCustomerTaxCode] = useState(existing?.customerTaxCode ?? '');
  const [soCode, setSoCode] = useState(existing?.soCode ?? '');
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [vatRate, setVatRate] = useState(existing?.vatRate ?? 0.08);
  const [items, setItems] = useState<InvoiceItem[]>(existing?.items ?? [emptyItem()]);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    if (existing) {
      setCustomerName(existing.customerName);
      setCustomerAddress(existing.customerAddress ?? '');
      setCustomerTaxCode(existing.customerTaxCode ?? '');
      setSoCode(existing.soCode ?? '');
      setDate(existing.date);
      setVatRate(existing.vatRate);
      setItems(existing.items);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, ...patch };
        updated.amount = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const { subtotal, vatAmount, total } = calcInvoiceTotal(items, vatRate);
  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  const handleSave = () => {
    if (!customerName.trim() || items.length === 0 || subtotal === 0) return;
    const now = new Date().toISOString();
    if (editId && existing) {
      updateInvoice(editId, {
        customerName, customerAddress: customerAddress || undefined,
        customerTaxCode: customerTaxCode || undefined,
        soCode: soCode || undefined, date, vatRate, items, subtotal, vatAmount, total,
        notes: notes || undefined, updatedAt: now,
      });
    } else {
      const code = `HD-${String(invoices.length + 1).padStart(4, '0')}`;
      addInvoice({
        invoiceId: `inv-${Date.now()}`,
        invoiceCode: code,
        customerId: `kh-${Date.now()}`,
        customerName, customerAddress: customerAddress || undefined,
        customerTaxCode: customerTaxCode || undefined,
        soCode: soCode || undefined, date, items, subtotal, vatRate, vatAmount, total,
        status: 'draft',
        notes: notes || undefined,
        createdBy: 'Current User',
        createdAt: now,
        updatedAt: now,
      });
    }
    onSaved();
  };

  const labelStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 13, marginBottom: 4, display: 'block' };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', background: '#313244', color: '#cdd6f4',
    border: '1px solid #45475a', borderRadius: 6, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 24, maxWidth: 950 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', marginBottom: 16, fontSize: 14 }}>
        ← Quay lại
      </button>
      <h2 style={{ margin: '0 0 20px', color: '#cdd6f4', fontSize: 20 }}>
        {editId ? 'Sửa hóa đơn' : 'Tạo hóa đơn mới'}
      </h2>

      {/* Customer info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Khách hàng *</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Tên khách hàng" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Mã số thuế</label>
          <input value={customerTaxCode} onChange={(e) => setCustomerTaxCode(e.target.value)} placeholder="MST" style={inputStyle} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Địa chỉ</label>
          <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Địa chỉ" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Đơn hàng (SO)</label>
          <input value={soCode} onChange={(e) => setSoCode(e.target.value)} placeholder="SO-XXXX" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ngày</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Thuế suất VAT</label>
          <select value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} style={inputStyle}>
            <option value={0}>0%</option>
            <option value={0.05}>5%</option>
            <option value={0.08}>8%</option>
            <option value={0.1}>10%</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Ghi chú</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú" style={inputStyle} />
        </div>
      </div>

      {/* Items table */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#cdd6f4', fontSize: 16 }}>Hàng hóa / Dịch vụ</h3>
        <button
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
          style={{ padding: '6px 14px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          + Thêm dòng
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#181825' }}>
            {['Mô tả', 'SL', 'Đơn giá', 'Thành tiền', ''].map((h) => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#a6adc8', fontSize: 12, borderBottom: '1px solid #313244', borderRight: '1px solid #313244' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.itemId} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder="Mô tả hàng hóa" style={inputStyle} />
              </td>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 0 })}
                  style={{ ...inputStyle, width: 70, textAlign: 'right' }} />
              </td>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) || 0 })}
                  style={{ ...inputStyle, width: 140, textAlign: 'right' }} />
              </td>
              <td style={{ padding: '4px 10px', color: '#a6e3a1', fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>
                {fmt(item.quantity * item.unitPrice)}
              </td>
              <td style={{ padding: 4, textAlign: 'center' }}>
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)}
                    style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: 16 }}>×</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ width: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#cdd6f4' }}>
            <span>Tiền hàng:</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#fab387' }}>
            <span>VAT ({(vatRate * 100).toFixed(0)}%):</span><span>{fmt(vatAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#a6e3a1', fontWeight: 700, fontSize: 16, borderTop: '1px solid #313244' }}>
            <span>Tổng cộng:</span><span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={!customerName.trim() || subtotal === 0}
          style={{
            padding: '10px 28px', background: customerName.trim() && subtotal > 0 ? '#a6e3a1' : '#45475a',
            color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {editId ? 'Cập nhật' : 'Tạo hóa đơn'}
        </button>
        <button onClick={onBack} style={{ padding: '10px 28px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Hủy
        </button>
      </div>
    </div>
  );
}
