'use client';
import React from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import { ACC_STATUS_LABELS, ACC_STATUS_COLORS } from '../types';

interface Props {
  recordId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export default function AcceptanceDetail({ recordId, onBack, onEdit }: Props) {
  const { acceptances, projects, updateAcceptance, deleteAcceptance } = useSanXuatThiCongStore();
  const record = acceptances.find((r) => r.recordId === recordId);

  if (!record) {
    return (
      <div style={{ padding: 24, color: '#f38ba8' }}>
        Không tìm thấy biên bản nghiệm thu.{' '}
        <button onClick={onBack} style={{ color: '#89b4fa', background: 'none', border: 'none', cursor: 'pointer' }}>Quay lại</button>
      </div>
    );
  }

  const project = projects.find((p) => p.projectId === record.projectId);

  const handleApprove = () => {
    const now = new Date().toISOString();
    updateAcceptance(recordId, {
      status: 'approved',
      approvedBy: 'Người dùng',
      approvedAt: now,
      warrantyStartDate: record.acceptanceDate,
      updatedAt: now,
    });
  };

  const handleReject = () => {
    updateAcceptance(recordId, { status: 'rejected', updatedAt: new Date().toISOString() });
  };

  const handleConditional = () => {
    updateAcceptance(recordId, { status: 'conditional', updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    deleteAcceptance(recordId);
    onBack();
  };

  const infoStyle: React.CSSProperties = { color: '#a6adc8', fontSize: 12, marginBottom: 2 };
  const valStyle: React.CSSProperties = { color: '#cdd6f4', fontSize: 14, marginBottom: 12 };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer', fontSize: 14 }}>← Quay lại</button>
        <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 700, margin: 0 }}>{record.recordCode}</h2>
        <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#1e1e2e', backgroundColor: ACC_STATUS_COLORS[record.status] }}>
          {ACC_STATUS_LABELS[record.status]}
        </span>
      </div>

      {/* Info Section */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={infoStyle}>Công trình</div>
            <div style={valStyle}>{record.projectCode}</div>
            {project && <div style={{ color: '#6c7086', fontSize: 11, marginTop: -8 }}>{project.projectName}</div>}
          </div>
          <div>
            <div style={infoStyle}>Loại nghiệm thu</div>
            <div style={valStyle}>{record.type === 'partial' ? 'Từng phần' : 'Toàn bộ'}</div>
          </div>
          <div>
            <div style={infoStyle}>Ngày nghiệm thu</div>
            <div style={valStyle}>{record.acceptanceDate}</div>
          </div>
          <div>
            <div style={infoStyle}>Người nghiệm thu</div>
            <div style={valStyle}>{record.inspectedBy}</div>
          </div>
          <div>
            <div style={infoStyle}>Bảo hành</div>
            <div style={valStyle}>{record.warrantyMonths ? `${record.warrantyMonths} tháng` : '—'}</div>
          </div>
          <div>
            <div style={infoStyle}>Ngày bắt đầu BH</div>
            <div style={valStyle}>{record.warrantyStartDate ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Volume Description */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 8 }}>Mô tả khối lượng</div>
        <div style={{ color: '#cdd6f4', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{record.volumeDescription}</div>
      </div>

      {/* Defects */}
      {record.defects && record.defects.length > 0 && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ color: '#f38ba8', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Lỗi / Sai sót ({record.defects.length})
          </div>
          {record.defects.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < record.defects!.length - 1 ? '1px solid #313244' : 'none' }}>
              <span style={{ color: '#f38ba8', fontSize: 12 }}>●</span>
              <span style={{ color: '#bac2de', fontSize: 13 }}>{d}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 8 }}>Ghi chú</div>
          <div style={{ color: '#bac2de', fontSize: 13 }}>{record.notes}</div>
        </div>
      )}

      {/* Approval Info */}
      {record.approvedBy && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 8 }}>Thông tin phê duyệt</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={infoStyle}>Người phê duyệt</div>
              <div style={valStyle}>{record.approvedBy}</div>
            </div>
            <div>
              <div style={infoStyle}>Thời gian</div>
              <div style={valStyle}>{record.approvedAt ? new Date(record.approvedAt).toLocaleString('vi-VN') : '—'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Audit info */}
      <div style={{ fontSize: 11, color: '#585b70', marginBottom: 20 }}>
        Tạo bởi {record.createdBy} lúc {new Date(record.createdAt).toLocaleString('vi-VN')}
        {' · '}Cập nhật {new Date(record.updatedAt).toLocaleString('vi-VN')}
      </div>

      {/* Workflow Buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {record.status === 'pending' && (
          <>
            <button
              onClick={handleApprove}
              style={{ padding: '8px 20px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              ✓ Đạt (Approve)
            </button>
            <button
              onClick={handleConditional}
              style={{ padding: '8px 20px', backgroundColor: '#fab387', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              ⚠ Đạt có điều kiện
            </button>
            <button
              onClick={handleReject}
              style={{ padding: '8px 20px', backgroundColor: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              ✕ Không đạt
            </button>
          </>
        )}
        {record.status === 'conditional' && (
          <button
            onClick={handleApprove}
            style={{ padding: '8px 20px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            ✓ Chuyển sang Đạt
          </button>
        )}
        {(record.status === 'pending' || record.status === 'conditional') && (
          <button
            onClick={() => onEdit(recordId)}
            style={{ padding: '8px 20px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            Sửa
          </button>
        )}
        {record.status === 'pending' && (
          <button
            onClick={handleDelete}
            style={{ padding: '8px 20px', backgroundColor: '#45475a', color: '#f38ba8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );
}
