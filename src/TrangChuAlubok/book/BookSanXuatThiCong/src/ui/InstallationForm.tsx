'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import type { InstallationJob } from '../types';

interface Props {
  editId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export default function InstallationForm({ editId, onBack, onSaved }: Props) {
  const { installations, projects, addInstallation, updateInstallation } =
    useSanXuatThiCongStore();
  const existing = editId ? installations.find((j) => j.jobId === editId) : null;

  const [projectId, setProjectId] = useState(existing?.projectId ?? '');
  const [teamName, setTeamName] = useState(existing?.teamName ?? '');
  const [teamLeader, setTeamLeader] = useState(existing?.teamLeader ?? '');
  const [scheduledDate, setScheduledDate] = useState(existing?.scheduledDate ?? new Date().toISOString().slice(0, 10));
  const [scheduledEndDate, setScheduledEndDate] = useState(existing?.scheduledEndDate ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const selectedProject = projects.find((p) => p.projectId === projectId);

  const handleSave = () => {
    if (!projectId || !teamName || !teamLeader || !scheduledDate) return;
    const now = new Date().toISOString();

    if (existing) {
      updateInstallation(existing.jobId, {
        projectId,
        projectCode: selectedProject?.projectCode ?? '',
        teamName,
        teamLeader,
        scheduledDate,
        scheduledEndDate: scheduledEndDate || undefined,
        address: selectedProject?.address ?? '',
        notes: notes || undefined,
        updatedAt: now,
      });
    } else {
      const code = `LD-${String(installations.length + 1).padStart(4, '0')}`;
      const newJob: InstallationJob = {
        jobId: `ij-${Date.now()}`,
        jobCode: code,
        projectId,
        projectCode: selectedProject?.projectCode ?? '',
        teamName,
        teamLeader,
        scheduledDate,
        scheduledEndDate: scheduledEndDate || undefined,
        address: selectedProject?.address ?? '',
        status: 'scheduled',
        notes: notes || undefined,
        createdBy: 'Người dùng',
        createdAt: now,
        updatedAt: now,
      };
      addInstallation(newJob);
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
          {existing ? `Sửa ${existing.jobCode}` : 'Tạo lịch lắp đặt'}
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
          <div style={labelStyle}>Đội thi công *</div>
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Đội thi công A" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Đội trưởng *</div>
          <input value={teamLeader} onChange={(e) => setTeamLeader(e.target.value)} placeholder="Anh Bảo" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Ngày bắt đầu *</div>
          <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Ngày kết thúc dự kiến</div>
          <input type="date" value={scheduledEndDate} onChange={(e) => setScheduledEndDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Địa chỉ</div>
          <input value={selectedProject?.address ?? ''} readOnly style={{ ...inputStyle, backgroundColor: '#262637', color: '#6c7086' }} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Ghi chú</div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleSave} style={{ padding: '10px 24px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {existing ? 'Cập nhật' : 'Tạo lịch'}
        </button>
        <button onClick={onBack} style={{ padding: '10px 24px', backgroundColor: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Hủy</button>
      </div>
    </div>
  );
}
