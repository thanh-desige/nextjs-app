'use client';
import React from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import { INST_STATUS_LABELS, INST_STATUS_COLORS, type InstallationStatus } from '../types';

interface Props {
  jobId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export default function InstallationDetail({ jobId, onBack, onEdit }: Props) {
  const { installations, updateInstallation, deleteInstallation } = useSanXuatThiCongStore();
  const job = installations.find((j) => j.jobId === jobId);

  if (!job) {
    return (
      <div style={{ padding: 24, color: '#f38ba8' }}>
        Không tìm thấy lịch lắp đặt.{' '}
        <button onClick={onBack} style={{ color: '#89b4fa', background: 'none', border: 'none', cursor: 'pointer' }}>Quay lại</button>
      </div>
    );
  }

  const handleCheckIn = () => {
    updateInstallation(jobId, { status: 'in_progress', checkInAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  };

  const handleCheckOut = () => {
    updateInstallation(jobId, { checkOutAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  };

  const handleComplete = () => {
    updateInstallation(jobId, { status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  };

  const handlePause = () => {
    updateInstallation(jobId, { status: 'paused', updatedAt: new Date().toISOString() });
  };

  const handleResume = () => {
    updateInstallation(jobId, { status: 'in_progress', updatedAt: new Date().toISOString() });
  };

  const handleCancel = () => {
    updateInstallation(jobId, { status: 'cancelled', updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    deleteInstallation(jobId);
    onBack();
  };

  const infoStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 12, marginBottom: 2 };
  const valStyle: React.CSSProperties = { color: '#cdd6f4', fontSize: 14, marginBottom: 12 };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', fontSize: 14 }}>← Quay lại</button>
        <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 700, margin: 0 }}>{job.jobCode}</h2>
        <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#1e1e2e', backgroundColor: INST_STATUS_COLORS[job.status] }}>
          {INST_STATUS_LABELS[job.status]}
        </span>
      </div>

      {/* Info */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={infoStyle}>Công trình</div>
            <div style={valStyle}>{job.projectCode}</div>
          </div>
          <div>
            <div style={infoStyle}>Đội thi công</div>
            <div style={valStyle}>{job.teamName}</div>
          </div>
          <div>
            <div style={infoStyle}>Đội trưởng</div>
            <div style={valStyle}>{job.teamLeader}</div>
          </div>
          <div>
            <div style={infoStyle}>Ngày lắp đặt</div>
            <div style={valStyle}>{job.scheduledDate}{job.scheduledEndDate ? ` → ${job.scheduledEndDate}` : ''}</div>
          </div>
          <div>
            <div style={infoStyle}>Địa chỉ</div>
            <div style={valStyle}>{job.address}</div>
          </div>
          <div>
            <div style={infoStyle}>Check-in / Check-out</div>
            <div style={valStyle}>
              {job.checkInAt ? new Date(job.checkInAt).toLocaleString('vi-VN') : '—'}
              {' / '}
              {job.checkOutAt ? new Date(job.checkOutAt).toLocaleString('vi-VN') : '—'}
            </div>
          </div>
        </div>
        {job.notes && (
          <div style={{ marginTop: 8 }}>
            <div style={infoStyle}>Ghi chú</div>
            <div style={{ color: '#bac2de', fontSize: 13 }}>{job.notes}</div>
          </div>
        )}
      </div>

      {/* Issues list */}
      {job.issues && job.issues.length > 0 && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h3 style={{ color: '#f9e2af', fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>⚠️ Phát sinh hiện trường</h3>
          {job.issues.map((issue, idx) => (
            <div key={idx} style={{ color: '#bac2de', fontSize: 13, padding: '4px 0', borderBottom: idx < job.issues!.length - 1 ? '1px solid #313244' : 'none' }}>
              {idx + 1}. {issue}
            </div>
          ))}
        </div>
      )}

      {/* Audit */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ color: '#6c7086', fontSize: 12 }}>
          Tạo bởi: {job.createdBy} — {new Date(job.createdAt).toLocaleString('vi-VN')}
          {job.completedAt && <> | Hoàn tất: {new Date(job.completedAt).toLocaleString('vi-VN')}</>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {job.status === 'scheduled' && (
          <button onClick={handleCheckIn} style={{ padding: '8px 20px', backgroundColor: '#fab387', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Check-in công trình
          </button>
        )}
        {job.status === 'in_progress' && !job.checkOutAt && (
          <button onClick={handleCheckOut} style={{ padding: '8px 20px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Check-out
          </button>
        )}
        {job.status === 'in_progress' && (
          <>
            <button onClick={handleComplete} style={{ padding: '8px 20px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Hoàn tất lắp đặt
            </button>
            <button onClick={handlePause} style={{ padding: '8px 20px', backgroundColor: '#f9e2af', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Tạm dừng
            </button>
          </>
        )}
        {job.status === 'paused' && (
          <button onClick={handleResume} style={{ padding: '8px 20px', backgroundColor: '#fab387', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Tiếp tục
          </button>
        )}
        {job.status === 'scheduled' && (
          <>
            <button onClick={() => onEdit(jobId)} style={{ padding: '8px 20px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Sửa</button>
            <button onClick={handleCancel} style={{ padding: '8px 20px', backgroundColor: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Hủy</button>
            <button onClick={handleDelete} style={{ padding: '8px 16px', backgroundColor: '#45475a', color: '#f38ba8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Xóa</button>
          </>
        )}
      </div>
    </div>
  );
}
