'use client';
import React, { useState, useEffect } from 'react';
import { useThuChiStore } from '../store/thuChiStore';
import type { CashPayment, PaymentMethod } from '../types';

interface CashPaymentFormProps {
  editId: string | null;
  onBack: () => void;
}

export default function CashPaymentForm({ editId, onBack }: CashPaymentFormProps): React.ReactElement {
  const { payments, addPayment, updatePayment } = useThuChiStore();
  const existing = editId ? payments.find(p => p.paymentId === editId) : null;

  const [supplierName, setSupplierName] = useState(existing?.supplierName ?? '');
  const [poCode, setPoCode] = useState(existing?.poCode ?? '');
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existing?.paymentMethod ?? 'bank_transfer');
  const [bankAccount, setBankAccount] = useState(existing?.bankAccount ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    if (existing) {
      setSupplierName(existing.supplierName);
      setPoCode(existing.poCode ?? '');
      setAmount(existing.amount);
      setPaymentMethod(existing.paymentMethod);
      setBankAccount(existing.bankAccount ?? '');
      setDescription(existing.description);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSave = () => {
    if (!supplierName.trim() || !description.trim()) return;

    const now = new Date().toISOString();
    if (existing) {
      updatePayment(existing.paymentId, {
        supplierName: supplierName.trim(),
        poCode: poCode.trim() || undefined,
        amount,
        paymentMethod,
        bankAccount: bankAccount.trim() || undefined,
        description: description.trim(),
        notes: notes.trim() || undefined,
        updatedAt: now,
      });
    } else {
      const code = `PC-${String(payments.length + 1).padStart(4, '0')}`;
      const newPayment: CashPayment = {
        paymentId: `cp-${Date.now()}`,
        paymentCode: code,
        supplierId: `sup-new-${Date.now()}`,
        supplierName: supplierName.trim(),
        poCode: poCode.trim() || undefined,
        amount,
        paymentMethod,
        bankAccount: bankAccount.trim() || undefined,
        description: description.trim(),
        notes: notes.trim() || undefined,
        status: 'draft',
        createdBy: 'Current User',
        createdAt: now,
        updatedAt: now,
      };
      addPayment(newPayment);
    }
    onBack();
  };

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 4, color: '#a6adc8', fontSize: 13, fontWeight: 500 };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 6, color: '#cdd6f4', fontSize: 13, boxSizing: 'border-box' };

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ padding: '6px 12px', backgroundColor: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Quay lại</button>
        <h2 style={{ margin: 0, fontSize: 18, color: '#cdd6f4' }}>{editId ? 'Sửa phiếu chi' : 'Tạo phiếu chi mới'}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nhà cung cấp *</label>
          <input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Tên nhà cung cấp" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Mã đơn mua</label>
          <input value={poCode} onChange={e => setPoCode(e.target.value)} placeholder="DMH-XXXX (tùy chọn)" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Số tiền *</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Hình thức thanh toán</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} style={inputStyle}>
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="check">Séc</option>
            <option value="other">Khác</option>
          </select>
        </div>

        {paymentMethod === 'bank_transfer' && (
          <div>
            <label style={labelStyle}>Tài khoản ngân hàng</label>
            <input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="VD: BIDV - 3101001234567" style={inputStyle} />
          </div>
        )}

        <div>
          <label style={labelStyle}>Diễn giải *</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Nội dung chi tiền" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Ghi chú</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Ghi chú thêm..." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={handleSave} style={{ padding: '8px 20px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {editId ? 'Cập nhật' : 'Tạo phiếu chi'}
        </button>
        <button onClick={onBack} style={{ padding: '8px 20px', backgroundColor: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Hủy</button>
      </div>
    </div>
  );
}
