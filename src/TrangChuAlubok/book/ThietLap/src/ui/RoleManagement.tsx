'use client';
// ============================================================
// RoleManagement — D2: setting.role
// List roles + CRUD modal + permission count display
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiSearch, FiPlus, FiX, FiEdit2, FiTrash2, FiShield } from 'react-icons/fi';
import { useThietLapStore } from '../store/thietLapStore';
import type { ManagedRole, RolePayload } from '../types';

// ────────────────────────────────────────────────────────────
// Role Edit Modal
// ────────────────────────────────────────────────────────────
function RoleModal({ role, onClose, onSave }: {
  role: ManagedRole | null;
  onClose: () => void;
  onSave: (payload: RolePayload, roleId: string | null) => void;
}) {
  const [roleName, setRoleName] = useState(role?.role.roleName ?? '');
  const [description, setDescription] = useState(role?.role.description ?? '');
  const isEdit = role !== null;
  const isSystem = role?.role.roleType === 'system';

  const handleSubmit = () => {
    if (!roleName.trim()) return;
    onSave(
      { roleName: roleName.trim(), description: description.trim(), permissions: role?.permissions ?? [] },
      isEdit ? role!.role.roleId : null
    );
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #313244', borderRadius: 8, padding: 24, width: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: 0 }}>{isEdit ? 'Sửa vai trò' : 'Tạo vai trò mới'}</h3>
          <FiX size={18} style={{ cursor: 'pointer', color: '#6c7086' }} onClick={onClose} />
        </div>

        {isSystem && (
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(249,226,175,0.1)', border: '1px solid rgba(249,226,175,0.3)', borderRadius: 6, marginBottom: 16, color: '#f9e2af', fontSize: 12 }}>
            Vai trò hệ thống — chỉ sửa mô tả, không đổi tên.
          </div>
        )}

        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Tên vai trò *</label>
        <input
          value={roleName}
          onChange={e => setRoleName(e.target.value)}
          disabled={isSystem}
          placeholder="VD: MANAGER"
          style={{ width: '100%', padding: '8px 12px', backgroundColor: isSystem ? '#181825' : '#313244', border: '1px solid #45475a', borderRadius: 6, color: isSystem ? '#6c7086' : '#cdd6f4', fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
        />

        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Mô tả</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Mô tả ngắn về vai trò..."
          style={{ width: '100%', padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, marginBottom: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />

        {isEdit && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: '#6c7086', fontSize: 12 }}>Quyền hạn: </span>
            <span style={{ color: '#89b4fa', fontSize: 12, fontWeight: 600 }}>
              {role!.permissions.length === 1 && role!.permissions[0] === '*:*' ? 'Toàn quyền' : `${role!.permissions.length} quyền`}
            </span>
            <span style={{ color: '#6c7086', fontSize: 11, marginLeft: 8 }}>(Chỉnh sửa chi tiết tại tab &ldquo;Ma trận quyền&rdquo;)</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #45475a', backgroundColor: '#313244', color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={!roleName.trim()} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: !roleName.trim() ? 0.5 : 1,
          }}>
            {isEdit ? 'Lưu' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
export default function RoleManagement(): React.ReactElement {
  const { roles, setRoles } = useThietLapStore();
  const [search, setSearch] = useState('');
  const [editingRole, setEditingRole] = useState<ManagedRole | null | undefined>(undefined); // undefined=closed, null=new, ManagedRole=edit

  const filtered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(r =>
      r.role.roleName.toLowerCase().includes(q) ||
      r.role.description.toLowerCase().includes(q)
    );
  }, [roles, search]);

  const handleSave = (payload: RolePayload, roleId: string | null) => {
    if (roleId) {
      // Edit
      setRoles(roles.map(r =>
        r.role.roleId === roleId
          ? { ...r, role: { ...r.role, roleName: payload.roleName, description: payload.description }, permissions: payload.permissions }
          : r
      ));
    } else {
      // Create
      const newRole: ManagedRole = {
        role: { roleId: `r${Date.now()}`, orgId: 'org1', roleName: payload.roleName, roleType: 'custom', description: payload.description, createdAt: new Date().toISOString() },
        permissions: payload.permissions,
        memberCount: 0,
      };
      setRoles([...roles, newRole]);
    }
  };

  const handleDelete = (roleId: string) => {
    const role = roles.find(r => r.role.roleId === roleId);
    if (role?.role.roleType === 'system') return;
    setRoles(roles.filter(r => r.role.roleId !== roleId));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e2e' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: 0 }}>Vai trò quyền hạn</h2>
          <p style={{ color: '#6c7086', fontSize: 12, margin: '4px 0 0' }}>{roles.length} vai trò ({roles.filter(r => r.role.roleType === 'system').length} hệ thống, {roles.filter(r => r.role.roleType === 'custom').length} tùy chỉnh)</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6c7086' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{ padding: '7px 12px 7px 32px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none', width: 200 }}
            />
          </div>
          <button onClick={() => setEditingRole(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: 'none', backgroundColor: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <FiPlus size={14} /> Tạo
          </button>
        </div>
      </div>

      {/* Role cards */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map(r => (
            <div key={r.role.roleId} style={{
              backgroundColor: '#181825',
              border: '1px solid #313244',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiShield size={18} style={{ color: r.role.roleType === 'system' ? '#f9e2af' : '#89b4fa' }} />
                  <span style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600 }}>{r.role.roleName}</span>
                  {r.role.roleType === 'system' && (
                    <span style={{ padding: '1px 6px', borderRadius: 3, backgroundColor: 'rgba(249,226,175,0.12)', color: '#f9e2af', fontSize: 10, fontWeight: 600 }}>HỆ THỐNG</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setEditingRole(r)} style={{ padding: 4, borderRadius: 4, border: '1px solid #45475a', backgroundColor: 'transparent', cursor: 'pointer', color: '#a6adc8' }}>
                    <FiEdit2 size={13} />
                  </button>
                  {r.role.roleType !== 'system' && (
                    <button onClick={() => handleDelete(r.role.roleId)} style={{ padding: 4, borderRadius: 4, border: '1px solid #45475a', backgroundColor: 'transparent', cursor: 'pointer', color: '#f38ba8' }}>
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: '#a6adc8', fontSize: 12, margin: 0 }}>{r.role.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#6c7086', fontSize: 11 }}>
                  {r.permissions.length === 1 && r.permissions[0] === '*:*' ? '✦ Toàn quyền' : `${r.permissions.length} quyền`}
                </span>
                <span style={{ color: '#6c7086', fontSize: 11 }}>
                  {r.memberCount} thành viên
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {editingRole !== undefined && (
        <RoleModal
          role={editingRole}
          onClose={() => setEditingRole(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
