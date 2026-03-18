'use client';
/**
 * ProjectListView — Tab "Dự án" trong BookThietKeBocTach
 * Layout: Sidebar trái (lọc theo projectStatus) + Bảng danh sách dự án
 * Click link "Thiết kế/BOM/Danh sách cắt" → mở Canvas sub-route
 * Click tên dự án → mở form chi tiết/chỉnh sửa
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useProjectStore } from '../../store';
import type { ProjectInfo } from '../../store/projectStore';

type ViewMode = 'list' | 'create' | 'detail';
type SidebarFilter = 'all' | 'draft' | 'designing' | 'quoted' | 'done' | 'locked';

type ProjectStatus = NonNullable<ProjectInfo['projectStatus']>;

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  designing: 'Đang thiết kế',
  quoted: 'Đã xuất báo giá',
  done: 'Đã hoàn thành',
  locked: 'Đã khóa',
};

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  designing: '#3b82f6',
  quoted: '#f59e0b',
  done: '#22c55e',
  locked: '#ef4444',
};

const SIDEBAR_ITEMS: { key: SidebarFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'draft', label: 'Nháp' },
  { key: 'designing', label: 'Đang thiết kế' },
  { key: 'quoted', label: 'Đã xuất báo giá' },
  { key: 'done', label: 'Đã hoàn thành' },
  { key: 'locked', label: 'Đã khóa' },
];

type CanvasTab = 'thietke' | 'filebom' | 'filebaogia';

interface ProjectListViewProps {
  onOpenCanvas: (projectId: string, initialTab?: CanvasTab) => void;
}

// ── Blank form data ──
function blankForm(): Omit<ProjectInfo, 'id' | 'created' | 'modified'> {
  return {
    name: '', status: 'draft',
    projectType: '', investor: '', investorPhone: '', investorEmail: '',
    houseNumber: '', street: '', ward: '', district: '', city: '',
    customer: '', address: '', employee: '',
    startDate: '', expectedEndDate: '', notes: '',
  };
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
}

export default function ProjectListView({ onOpenCanvas }: ProjectListViewProps): React.ReactElement {
  const recentProjects = useProjectStore((s) => s.recentProjects);
  const createProject = useProjectStore((s) => s.createProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const loadProject = useProjectStore((s) => s.loadProject);

  const [search, setSearch] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProject, setEditingProject] = useState<ProjectInfo | null>(null);
  const [form, setForm] = useState(blankForm());

  const filtered = useMemo(() => {
    let list = recentProjects;
    if (sidebarFilter === 'draft') {
      list = list.filter((p) => !p.projectStatus || p.status === 'draft');
    } else if (sidebarFilter !== 'all') {
      list = list.filter((p) => p.projectStatus === sidebarFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.projectCode ?? '').toLowerCase().includes(q) ||
        (p.investor ?? '').toLowerCase().includes(q) ||
        (p.employee ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [recentProjects, sidebarFilter, search]);

  // Count per filter
  const counts = useMemo(() => {
    const c = { all: recentProjects.length, draft: 0, designing: 0, quoted: 0, done: 0, locked: 0 };
    for (const p of recentProjects) {
      if (!p.projectStatus || p.status === 'draft') c.draft++;
      if (p.projectStatus === 'designing') c.designing++;
      if (p.projectStatus === 'quoted') c.quoted++;
      if (p.projectStatus === 'done') c.done++;
      if (p.projectStatus === 'locked') c.locked++;
    }
    return c;
  }, [recentProjects]);

  const setField = useCallback(<K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  }, []);

  const getFullAddress = useCallback(() => {
    const parts = [form.houseNumber, form.street, form.ward, form.district, form.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }, [form.houseNumber, form.street, form.ward, form.district, form.city]);

  const handleStartCreate = () => {
    setForm(blankForm());
    setEditingProject(null);
    setViewMode('create');
  };

  const handleOpenDetail = (project: ProjectInfo) => {
    setEditingProject(project);
    setForm({
      name: project.name, status: project.status,
      projectType: project.projectType ?? '', investor: project.investor ?? '',
      investorPhone: project.investorPhone ?? '', investorEmail: project.investorEmail ?? '',
      houseNumber: project.houseNumber ?? '', street: project.street ?? '',
      ward: project.ward ?? '', district: project.district ?? '', city: project.city ?? '',
      customer: project.customer ?? '', address: project.address ?? '', employee: project.employee ?? '',
      startDate: project.startDate ?? '', expectedEndDate: project.expectedEndDate ?? '',
      notes: project.notes ?? '',
    });
    setViewMode('detail');
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const fullAddr = getFullAddress();
    const data = { ...form, address: fullAddr || form.address };

    if (editingProject) {
      loadProject(editingProject.id);
      updateProject(data);
    } else {
      const project = createProject(data);
      loadProject(project.id);
      onOpenCanvas(project.id, 'thietke');
    }
    setViewMode('list');
  };

  const handleOpenCanvas = () => {
    if (!editingProject) return;
    const fullAddr = getFullAddress();
    loadProject(editingProject.id);
    updateProject({ ...form, address: fullAddr || form.address });
    onOpenCanvas(editingProject.id, 'thietke');
  };

  const handleCancel = () => { setViewMode('list'); setEditingProject(null); };

  const handleStatusChange = (project: ProjectInfo, newStatus: ProjectStatus) => {
    loadProject(project.id);
    updateProject({ projectStatus: newStatus });
  };

  // ── Detail/Create Form ──
  if (viewMode === 'create' || viewMode === 'detail') {
    const isCreate = viewMode === 'create';
    return (
      <div style={{ height: '100%', backgroundColor: '#1e1e2e', color: '#ddd', overflow: 'auto' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleCancel} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #444', backgroundColor: 'transparent', color: '#cdd6f4', fontSize: 12, cursor: 'pointer' }}>
            ← Quay lại
          </button>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {isCreate ? 'Tạo dự án mới' : (editingProject?.projectCode ? `${editingProject.projectCode} — ` : '') + (form.name || 'Chi tiết dự án')}
          </span>
          {!isCreate && editingProject && (
            <button onClick={handleOpenCanvas} style={{ marginLeft: 'auto', padding: '6px 18px', borderRadius: 6, border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Mở thiết kế →
            </button>
          )}
        </div>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 24px 60px' }}>
          <SectionTitle label="Thông tin dự án" />
          <FormField label="Tên dự án *" value={form.name} onChange={(v) => setField('name', v)} placeholder="Nhập tên dự án..." />
          <FormField label="Nhân viên phụ trách" value={form.employee ?? ''} onChange={(v) => setField('employee', v)} placeholder="Tên nhân viên..." />
          <FormField label="Loại công trình" value={form.projectType ?? ''} onChange={(v) => setField('projectType', v)} placeholder="Nhà ở, văn phòng, showroom..." />
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#888', fontSize: 11, display: 'block', marginBottom: 4 }}>Diện tích (m²) — tự động tính từ bản vẽ</label>
            <div style={{ padding: '6px 10px', borderRadius: 4, backgroundColor: '#1a1a2e', border: '1px solid #333', color: '#888', fontSize: 12 }}>
              {editingProject?.area ? `${editingProject.area} m²` : 'Chưa có bản vẽ'}
            </div>
          </div>
          <SectionTitle label="Chủ đầu tư" />
          <FormField label="Tên chủ đầu tư" value={form.investor ?? ''} onChange={(v) => setField('investor', v)} placeholder="Nhập tên chủ đầu tư..." />
          <FormField label="Số điện thoại" value={form.investorPhone ?? ''} onChange={(v) => setField('investorPhone', v)} placeholder="0xxx xxx xxx" />
          <FormField label="Email" value={form.investorEmail ?? ''} onChange={(v) => setField('investorEmail', v)} placeholder="email@example.com" />
          <SectionTitle label="Địa chỉ công trình" />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><FormField label="Số nhà" value={form.houseNumber ?? ''} onChange={(v) => setField('houseNumber', v)} placeholder="123" /></div>
            <div style={{ flex: 2 }}><FormField label="Tên đường" value={form.street ?? ''} onChange={(v) => setField('street', v)} placeholder="Nguyễn Văn A" /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><FormField label="Phường/Xã" value={form.ward ?? ''} onChange={(v) => setField('ward', v)} placeholder="Phường 1" /></div>
            <div style={{ flex: 1 }}><FormField label="Quận/Huyện" value={form.district ?? ''} onChange={(v) => setField('district', v)} placeholder="Quận 1" /></div>
          </div>
          <FormField label="Thành phố/Tỉnh" value={form.city ?? ''} onChange={(v) => setField('city', v)} placeholder="TP. Hồ Chí Minh" />
          {getFullAddress() && (
            <div style={{ backgroundColor: '#252535', padding: 8, borderRadius: 4, marginBottom: 12 }}>
              <span style={{ color: '#888', fontSize: 11 }}>Địa chỉ: </span>
              <span style={{ color: '#ddd', fontSize: 12 }}>{getFullAddress()}</span>
            </div>
          )}
          <SectionTitle label="Thời gian" />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><FormField label="Ngày bắt đầu" value={form.startDate ?? ''} onChange={(v) => setField('startDate', v)} type="date" /></div>
            <div style={{ flex: 1 }}><FormField label="Ngày hoàn thành (dự kiến)" value={form.expectedEndDate ?? ''} onChange={(v) => setField('expectedEndDate', v)} type="date" /></div>
          </div>
          <SectionTitle label="Ghi chú" />
          <div style={{ marginBottom: 12 }}>
            <textarea value={form.notes ?? ''} onChange={(e) => setField('notes', e.target.value)} placeholder="Thông tin bổ sung..."
              style={{ width: '100%', minHeight: 60, backgroundColor: '#252535', border: '1px solid #444', borderRadius: 4, padding: 8, color: '#ddd', fontSize: 12, outline: 'none', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={handleCancel} style={{ padding: '8px 20px', borderRadius: 4, border: '1px solid #555', backgroundColor: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} style={{ padding: '8px 20px', borderRadius: 4, border: 'none', backgroundColor: '#22c55e', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {isCreate ? 'Tạo dự án' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main List View: Sidebar + Table ──
  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: '#1e1e2e', color: '#ddd' }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: 180, minWidth: 180, borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e' }}>
        <div style={{ padding: '12px 12px 8px', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Lọc dự án
        </div>
        {SIDEBAR_ITEMS.map((item) => {
          const active = sidebarFilter === item.key;
          const count = counts[item.key];
          return (
            <button key={item.key} onClick={() => setSidebarFilter(item.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
                backgroundColor: active ? '#2a2a3e' : 'transparent',
                color: active ? '#fff' : '#aaa', borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
              <span>{item.label}</span>
              <span style={{ fontSize: 10, color: '#666', backgroundColor: '#252535', borderRadius: 8, padding: '1px 6px', minWidth: 20, textAlign: 'center' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Right Content: Toolbar + Table ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="text" placeholder="Tìm dự án, mã DA, nhân viên..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #444', backgroundColor: '#2a2a3e', color: '#ddd', fontSize: 12, width: 260, outline: 'none' }} />
          <span style={{ fontSize: 11, color: '#666' }}>{filtered.length} dự án</span>
          <button onClick={handleStartCreate}
            style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 4, border: 'none', backgroundColor: '#9b59b6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            + Tạo dự án mới
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#252535', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Ngày tạo', 'Ngày sửa', 'Nhân viên', 'Mã DA', 'Tên dự án', 'Thiết kế', 'BOM', 'DS cắt', 'Chức năng', ''].map((h, i) => (
                  <th key={i} style={{ padding: '8px 10px', textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #333', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                  {recentProjects.length === 0 ? 'Chưa có dự án nào. Nhấn "+ Tạo dự án mới" để bắt đầu.' : 'Không tìm thấy dự án phù hợp.'}
                </td></tr>
              )}
              {filtered.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onOpenDetail={() => handleOpenDetail(project)}
                  onOpenDesign={() => { loadProject(project.id); onOpenCanvas(project.id, 'thietke'); }}
                  onOpenBom={() => { loadProject(project.id); onOpenCanvas(project.id, 'filebom'); }}
                  onOpenCutList={() => { loadProject(project.id); onOpenCanvas(project.id, 'filebom'); }}
                  onDelete={() => deleteProject(project.id)}
                  onStatusChange={(s) => handleStatusChange(project, s)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── ProjectRow ──────────────────────────────────────

function ProjectRow({ project, onOpenDetail, onOpenDesign, onOpenBom, onOpenCutList, onDelete, onStatusChange }: {
  project: ProjectInfo;
  onOpenDetail: () => void;
  onOpenDesign: () => void;
  onOpenBom: () => void;
  onOpenCutList: () => void;
  onDelete: () => void;
  onStatusChange: (s: ProjectStatus) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cellStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #2a2a3e', whiteSpace: 'nowrap', verticalAlign: 'middle' };
  const linkStyle: React.CSSProperties = { color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 };

  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? '#252535' : 'transparent', transition: 'background-color 0.1s' }}>
      <td style={cellStyle}>{fmtDate(project.created)}</td>
      <td style={cellStyle}>{fmtDate(project.modified)}</td>
      <td style={cellStyle}>{project.employee || '—'}</td>
      <td style={{ ...cellStyle, color: '#888', fontFamily: 'monospace' }}>{project.projectCode || '—'}</td>
      <td style={{ ...cellStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span onClick={onOpenDetail} style={{ cursor: 'pointer', color: '#cdd6f4', fontWeight: 500 }}>{project.name}</span>
      </td>
      <td style={cellStyle}><span onClick={onOpenDesign} style={linkStyle}>Mở</span></td>
      <td style={cellStyle}><span onClick={onOpenBom} style={linkStyle}>Mở</span></td>
      <td style={cellStyle}><span onClick={onOpenCutList} style={linkStyle}>Mở</span></td>
      <td style={cellStyle}><StatusDropdown value={project.projectStatus ?? 'designing'} onChange={onStatusChange} /></td>
      <td style={cellStyle}>
        {hovered && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: '0 4px' }} title="Xóa">
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}

// ── StatusDropdown ──────────────────────────────────

function StatusDropdown({ value, onChange }: { value: ProjectStatus; onChange: (s: ProjectStatus) => void }) {
  const color = PROJECT_STATUS_COLORS[value] ?? '#888';
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as ProjectStatus)}
      style={{
        padding: '3px 6px', borderRadius: 4, border: `1px solid ${color}44`,
        backgroundColor: `${color}15`, color, fontSize: 11, fontWeight: 500,
        cursor: 'pointer', outline: 'none',
      }}>
      {Object.entries(PROJECT_STATUS_LABELS).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  );
}

// ── FormField ──────────────────────────────────────

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ color: '#888', fontSize: 11, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', backgroundColor: '#252535', border: '1px solid #444', borderRadius: 4, padding: '6px 10px', color: '#ddd', fontSize: 12, outline: 'none' }}
        onFocus={(e) => { e.target.style.borderColor = '#4a90d9'; }}
        onBlur={(e) => { e.target.style.borderColor = '#444'; }}
      />
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 12px 0' }}>
      <span style={{ color: '#4a90d9', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
    </div>
  );
}
