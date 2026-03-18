'use client';
import React, { useState, useEffect } from 'react';
import { useKeToanStore } from '../store/keToanStore';
import type { VoucherType, AccountEntry } from '../types';
import { VOUCHER_TYPE_LABELS, calcEntryTotals } from '../types';

interface VoucherFormProps {
  editId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

const VOUCHER_TYPES: VoucherType[] = ['receipt', 'payment', 'journal', 'adjustment'];

const emptyEntry = (): AccountEntry => ({
  entryId: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  accountCode: '',
  accountName: '',
  debitAmount: 0,
  creditAmount: 0,
  description: '',
});

export default function VoucherForm({ editId, onBack, onSaved }: VoucherFormProps) {
  const { vouchers, addVoucher, updateVoucher } = useKeToanStore();
  const existing = editId ? vouchers.find((v) => v.voucherId === editId) : null;

  const [voucherType, setVoucherType] = useState<VoucherType>(existing?.voucherType ?? 'journal');
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [entries, setEntries] = useState<AccountEntry[]>(existing?.entries ?? [emptyEntry(), emptyEntry()]);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    if (existing) {
      setVoucherType(existing.voucherType);
      setDate(existing.date);
      setDescription(existing.description);
      setEntries(existing.entries);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const updateEntry = (idx: number, patch: Partial<AccountEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const removeEntry = (idx: number) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const { totalDebit, totalCredit } = calcEntryTotals(entries);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  const handleSave = () => {
    if (!description.trim() || entries.length < 2 || !isBalanced) return;
    const now = new Date().toISOString();
    if (editId && existing) {
      updateVoucher(editId, {
        voucherType, date, description, entries, totalDebit, totalCredit, notes: notes || undefined, updatedAt: now,
      });
    } else {
      const code = `CT-${String(vouchers.length + 1).padStart(4, '0')}`;
      addVoucher({
        voucherId: `v-${Date.now()}`,
        voucherCode: code,
        voucherType, date, description, entries, totalDebit, totalCredit,
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
    <div style={{ padding: 24, maxWidth: 900 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', marginBottom: 16, fontSize: 14 }}>
        ← Quay lại
      </button>
      <h2 style={{ margin: '0 0 20px', color: '#cdd6f4', fontSize: 20 }}>
        {editId ? 'Sửa chứng từ' : 'Tạo chứng từ mới'}
      </h2>

      {/* Basic fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Loại chứng từ</label>
          <select value={voucherType} onChange={(e) => setVoucherType(e.target.value as VoucherType)} style={inputStyle}>
            {VOUCHER_TYPES.map((t) => <option key={t} value={t}>{VOUCHER_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Ngày</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ghi chú</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú (tùy chọn)" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Mô tả *</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nội dung chứng từ" style={inputStyle} />
      </div>

      {/* Entries table */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#cdd6f4', fontSize: 16 }}>Bút toán</h3>
        <button
          onClick={() => setEntries((prev) => [...prev, emptyEntry()])}
          style={{ padding: '6px 14px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          + Thêm dòng
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#181825' }}>
            {['TK', 'Tên TK', 'Nợ', 'Có', 'Diễn giải', ''].map((h) => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#a6adc8', fontSize: 12, borderBottom: '1px solid #313244', borderRight: '1px solid #313244' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={entry.entryId} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input value={entry.accountCode} onChange={(e) => updateEntry(idx, { accountCode: e.target.value })}
                  placeholder="111" style={{ ...inputStyle, width: 70 }} />
              </td>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input value={entry.accountName} onChange={(e) => updateEntry(idx, { accountName: e.target.value })}
                  placeholder="Tên tài khoản" style={{ ...inputStyle, width: 160 }} />
              </td>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input type="number" value={entry.debitAmount || ''} onChange={(e) => updateEntry(idx, { debitAmount: Number(e.target.value) || 0 })}
                  placeholder="0" style={{ ...inputStyle, width: 120, textAlign: 'right' }} />
              </td>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input type="number" value={entry.creditAmount || ''} onChange={(e) => updateEntry(idx, { creditAmount: Number(e.target.value) || 0 })}
                  placeholder="0" style={{ ...inputStyle, width: 120, textAlign: 'right' }} />
              </td>
              <td style={{ padding: 4, borderRight: '1px solid #313244' }}>
                <input value={entry.description} onChange={(e) => updateEntry(idx, { description: e.target.value })}
                  placeholder="Diễn giải" style={inputStyle} />
              </td>
              <td style={{ padding: 4, textAlign: 'center' }}>
                {entries.length > 2 && (
                  <button onClick={() => removeEntry(idx)}
                    style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: 16 }}>×</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#181825' }}>
            <td colSpan={2} style={{ padding: '8px 10px', color: '#a6adc8', fontWeight: 600, borderRight: '1px solid #313244' }}>Tổng cộng</td>
            <td style={{ padding: '8px 10px', color: '#a6e3a1', fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>
              {fmt(totalDebit)}
            </td>
            <td style={{ padding: '8px 10px', color: '#f38ba8', fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>
              {fmt(totalCredit)}
            </td>
            <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'center' }}>
              {isBalanced ? (
                <span style={{ color: '#a6e3a1', fontSize: 13 }}>✓ Cân bằng</span>
              ) : (
                <span style={{ color: '#f38ba8', fontSize: 13 }}>✗ Lệch {fmt(Math.abs(totalDebit - totalCredit))}</span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={!description.trim() || entries.length < 2 || !isBalanced}
          style={{
            padding: '10px 28px', background: isBalanced && description.trim() ? '#a6e3a1' : '#45475a',
            color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {editId ? 'Cập nhật' : 'Tạo chứng từ'}
        </button>
        <button onClick={onBack} style={{ padding: '10px 28px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Hủy
        </button>
      </div>
    </div>
  );
}
