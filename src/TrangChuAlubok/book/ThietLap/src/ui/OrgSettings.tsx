'use client';
// ============================================================
// OrgSettings — D4: setting.org + D5: setting.branch
// Organization info form + Branches list
// ============================================================

import React, { useState } from 'react';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import { useThietLapStore } from '../store/thietLapStore';
import type { OrgBranch } from '../../../shared/src/types/org.types';

// ────────────────────────────────────────────────────────────
// Branch Modal
// ────────────────────────────────────────────────────────────
function BranchModal({ branch, onClose, onSave }: {
  branch: OrgBranch | null;
  onClose: () => void;
  onSave: (data: { branchName: string; address: string; status: 'active' | 'inactive' }, branchId: string | null) => void;
}) {
  const [branchName, setBranchName] = useState(branch?.branchName ?? '');
  const [address, setAddress] = useState(branch?.address ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(branch?.status ?? 'active');

  const handleSubmit = () => {
    if (!branchName.trim()) return;
    onSave({ branchName: branchName.trim(), address: address.trim(), status }, branch?.branchId ?? null);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #313244', borderRadius: 8, padding: 24, width: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: 0 }}>{branch ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}</h3>
          <FiX size={18} style={{ cursor: 'pointer', color: '#6c7086' }} onClick={onClose} />
        </div>

        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Tên chi nhánh *</label>
        <input value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="VD: Chi nhánh Đà Nẵng"
          style={{ width: '100%', padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />

        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Địa chỉ</label>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Số nhà, đường, quận/huyện..."
          style={{ width: '100%', padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />

        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Trạng thái</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              border: status === s ? '1px solid #89b4fa' : '1px solid #45475a',
              backgroundColor: status === s ? 'rgba(137,180,250,0.15)' : '#313244',
              color: status === s ? '#89b4fa' : '#cdd6f4',
            }}>
              {s === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #45475a', backgroundColor: '#313244', color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>Hủy</button>
          <button onClick={handleSubmit} disabled={!branchName.trim()} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: !branchName.trim() ? 0.5 : 1,
          }}>Lưu</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Org Info section
// ────────────────────────────────────────────────────────────
function OrgInfoSection(): React.ReactElement {
  const { org, setOrg } = useThietLapStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(org.orgName);

  const handleSave = () => {
    if (!name.trim()) return;
    setOrg({ ...org, orgName: name.trim() });
    setEditing(false);
  };

  const planLabels: Record<string, string> = { free: 'Miễn phí', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: '0 0 20px' }}>Thông tin tổ chức</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
        <div>
          <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 4 }}>Tên tổ chức</label>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={name} onChange={e => setName(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }} />
              <button onClick={handleSave} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', backgroundColor: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Lưu</button>
              <button onClick={() => { setEditing(false); setName(org.orgName); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #45475a', backgroundColor: '#313244', color: '#cdd6f4', cursor: 'pointer', fontSize: 12 }}>Hủy</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#cdd6f4', fontSize: 14 }}>{org.orgName}</span>
              <FiEdit2 size={14} style={{ color: '#6c7086', cursor: 'pointer' }} onClick={() => setEditing(true)} />
            </div>
          )}
        </div>
        <div>
          <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 4 }}>Slug</label>
          <span style={{ color: '#6c7086', fontSize: 14 }}>{org.orgSlug}</span>
        </div>
        <div>
          <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 4 }}>Gói dịch vụ</label>
          <span style={{ padding: '2px 10px', borderRadius: 4, backgroundColor: 'rgba(137,180,250,0.12)', color: '#89b4fa', fontSize: 12, fontWeight: 600 }}>
            {planLabels[org.subscriptionPlan] ?? org.subscriptionPlan}
          </span>
        </div>
        <div>
          <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 4 }}>Hạn sử dụng</label>
          <span style={{ color: '#cdd6f4', fontSize: 14 }}>{org.subscriptionExpiry ? new Date(org.subscriptionExpiry).toLocaleDateString('vi-VN') : '—'}</span>
        </div>
        <div>
          <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 4 }}>Giới hạn người dùng</label>
          <span style={{ color: '#cdd6f4', fontSize: 14 }}>{org.maxUsers}</span>
        </div>
        <div>
          <label style={{ color: '#a6adc8', fontSize: 12, display: 'block', marginBottom: 4 }}>Giới hạn chi nhánh</label>
          <span style={{ color: '#cdd6f4', fontSize: 14 }}>{org.maxBranches}</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Branches section
// ────────────────────────────────────────────────────────────
function BranchesSection(): React.ReactElement {
  const { branches, setBranches } = useThietLapStore();
  const [editingBranch, setEditingBranch] = useState<OrgBranch | null | undefined>(undefined);

  const handleSave = (data: { branchName: string; address: string; status: 'active' | 'inactive' }, branchId: string | null) => {
    if (branchId) {
      setBranches(branches.map(b => b.branchId === branchId ? { ...b, ...data } : b));
    } else {
      setBranches([...branches, { branchId: `b${Date.now()}`, orgId: 'org1', ...data }]);
    }
  };

  const handleDelete = (branchId: string) => {
    setBranches(branches.filter(b => b.branchId !== branchId));
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: 0 }}>Chi nhánh</h2>
        <button onClick={() => setEditingBranch(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: 'none', backgroundColor: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <FiPlus size={14} /> Thêm
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {branches.map(b => (
          <div key={b.branchId} style={{ backgroundColor: '#181825', border: '1px solid #313244', borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiMapPin size={16} style={{ color: '#89b4fa' }} />
              <div>
                <div style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 500 }}>{b.branchName}</div>
                <div style={{ color: '#6c7086', fontSize: 12 }}>{b.address || 'Chưa có địa chỉ'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                backgroundColor: b.status === 'active' ? 'rgba(166,227,161,0.15)' : 'rgba(243,139,168,0.15)',
                color: b.status === 'active' ? '#a6e3a1' : '#f38ba8',
              }}>
                {b.status === 'active' ? 'Hoạt động' : 'Ngừng'}
              </span>
              <button onClick={() => setEditingBranch(b)} style={{ padding: 4, borderRadius: 4, border: '1px solid #45475a', backgroundColor: 'transparent', cursor: 'pointer', color: '#a6adc8' }}>
                <FiEdit2 size={13} />
              </button>
              <button onClick={() => handleDelete(b.branchId)} style={{ padding: 4, borderRadius: 4, border: '1px solid #45475a', backgroundColor: 'transparent', cursor: 'pointer', color: '#f38ba8' }}>
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {editingBranch !== undefined && (
        <BranchModal branch={editingBranch} onClose={() => setEditingBranch(undefined)} onSave={handleSave} />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main component: switches between org info and branches
// ────────────────────────────────────────────────────────────
export default function OrgSettings({ section }: { section: 'org' | 'branches' }): React.ReactElement {
  return (
    <div style={{ height: '100%', overflow: 'auto', backgroundColor: '#1e1e2e' }}>
      {section === 'org' ? <OrgInfoSection /> : <BranchesSection />}
    </div>
  );
}
