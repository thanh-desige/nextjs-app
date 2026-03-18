'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import type { AcceptanceRecord } from '../types';

interface Props {
  editId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export default function AcceptanceForm({ editId, onBack, onSaved }: Props) {
  const { acceptances, projects, addAcceptance, updateAcceptance } = useSanXuatThiCongStore();
  const existing = editId ? acceptances.find((r) => r.recordId === editId) : null;

  const [projectId, setProjectId] = useState(existing?.projectId ?? '');
  const [type, setType] = useState<'partial' | 'final'>(existing?.type ?? 'partial');
  const [acceptanceDate, setAcceptanceDate] = useState(existing?.acceptanceDate ?? new Date().toISOString().slice(0, 10));
  const [inspectedBy, setInspectedBy] = useState(existing?.inspectedBy ?? '');
  const [volumeDescription, setVolumeDescription] = useState(existing?.volumeDescription ?? '');
  const [defects, setDefects] = useState<string[]>(existing?.defects ?? []);
  const [newDefect, setNewDefect] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(existing?.warrantyMonths ?? 12);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const selectedProject = projects.find((p) => p.projectId === projectId);

  const handleAddDefect = () => {
    const trimmed = newDefect.trim();
    if (trimmed) {
      setDefects((prev) => [...prev, trimmed]);
      setNewDefect('');
    }
  };

  const handleRemoveDefect = (idx: number) => {
    setDefects((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!projectId || !inspectedBy || !volumeDescription || !acceptanceDate) return;
    const now = new Date().toISOString();

    if (existing) {
      updateAcceptance(existing.recordId, {
        projectId,
        projectCode: selectedProject?.projectCode ?? '',
        type,
        acceptanceDate,
        inspectedBy,
        volumeDescription,
        defects: defects.length > 0 ? defects : undefined,
        warrantyMonths,
        notes: notes || undefined,
        updatedAt: now,
      });
    } else {
      const code = `NT-${String(acceptances.length + 1).padStart(4, '0')}`;
      const record: AcceptanceRecord = {
        recordId: `ar-${Date.now()}`,
        recordCode: code,
        projectId,
        projectCode: selectedProject?.projectCode ?? '',
        type,
        acceptanceDate,
        inspectedBy,
        status: 'pending',
        volumeDescription,
        defects: defects.length > 0 ? defects : undefined,
        warrantyMonths,
        notes: notes || undefined,
        createdBy: 'Người dùng',
        createdAt: now,
        updatedAt: now,
      };
      addAcceptance(record);
    }
    onSaved();
  };

  const labelStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 12, marginBottom: 4 };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', backgroundColor: '#313244',
    border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13,
  };

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', fontSize: 14 }}>← Quay lại</button>
        <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 700, margin: 0 }}>
          {existing ? `Sửa ${existing.recordCode}` : 'Tạo biên bản nghiệm thu'}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={labelStyle}>Công trình *</div>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle}>
            <option value="">-- Chọn công trình --</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.projectCode} — {p.projectName}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Loại nghiệm thu *</div>
          <select value={type} onChange={(e) => setType(e.target.value as 'partial' | 'final')} style={inputStyle}>
            <option value="partial">Từng phần</option>
            <option value="final">Toàn bộ</option>
          </select>
        </div>
        <div>
          <div style={labelStyle}>Ngày nghiệm thu *</div>
          <input type="date" value={acceptanceDate} onChange={(e) => setAcceptanceDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Người nghiệm thu *</div>
          <input value={inspectedBy} onChange={(e) => setInspectedBy(e.target.value)} placeholder="Trần Thị B" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Bảo hành (tháng)</div>
          <input type="number" value={warrantyMonths} onChange={(e) => setWarrantyMonths(Number(e.target.value))} min={0} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Mô tả khối lượng *</div>
        <textarea
          value={volumeDescription}
          onChange={(e) => setVolumeDescription(e.target.value)}
          placeholder="Mô tả khối lượng nghiệm thu..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Defects list */}
      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Danh sách lỗi / sai sót</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={newDefect}
            onChange={(e) => setNewDefect(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDefect()}
            placeholder="Nhập lỗi, nhấn Enter..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleAddDefect}
            style={{ padding: '8px 16px', backgroundColor: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            Thêm
          </button>
        </div>
        {defects.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <span style={{ color: '#f38ba8', fontSize: 12 }}>●</span>
            <span style={{ color: '#bac2de', fontSize: 13, flex: 1 }}>{d}</span>
            <button
              onClick={() => handleRemoveDefect(i)}
              style={{ background: 'none', border: 'none', color: '#585b70', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Ghi chú</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ghi chú thêm..."
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleSave}
          style={{ padding: '10px 28px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          {existing ? 'Cập nhật' : 'Tạo biên bản'}
        </button>
        <button
          onClick={onBack}
          style={{ padding: '10px 20px', backgroundColor: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
