'use client';
/**
 * ProjectListView — Tab "Dự án" trong BookThietKeBocTach
 * Layout: Sidebar trái "Quy trình" + Bảng danh sách dự án
 * Hiện trạng tự động suy ra từ dữ liệu (computeProjectStatus)
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useProjectStore } from '../../store';
import type { ProjectInfo } from '../../store/projectStore';
import { useThietLapStore } from '../../../../ThietLap/src/store/thietLapStore';
import { computeProjectStatus, STATUS_COLORS } from '../../domain/computeProjectStatus';
import type { StatusResult } from '../../domain/computeProjectStatus';
import { createQuoteFromProject, updateQuoteFromProject } from '../../domain/createQuoteFromProject';
import { createContractFromQuote } from '../../domain/createContractFromQuote';
import { createReceiptFromContract } from '../../domain/createReceiptFromContract';
import { createProductionOrderFromReceipt } from '../../domain/createProductionOrderFromReceipt';

type ViewMode = 'list' | 'create' | 'detail';
type SidebarFilter = 'all' | 'draft' | 'designing' | 'quoted' | 'contracted' | 'deposited' | 'in_production' | 'locked';

const SIDEBAR_ITEMS: { key: SidebarFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'draft', label: 'Nháp' },
  { key: 'designing', label: 'Đang thiết kế' },
  { key: 'quoted', label: 'Đã báo giá' },
  { key: 'contracted', label: 'Đã ký hợp đồng' },
  { key: 'deposited', label: 'Đã tạm ứng' },
  { key: 'in_production', label: 'Đã vào lệnh SX' },
  { key: 'locked', label: 'Đã khóa' },
];

type CanvasTab = 'thietke' | 'filebom' | 'filebaogia';

interface ProjectListViewProps {
  onOpenCanvas: (projectId: string, initialTab?: CanvasTab) => void;
  onNavigateToBanHang?: (quoteId?: string) => void;
  onNavigateToThuChi?: (receiptId?: string) => void;
  onNavigateToSanXuat?: (orderId?: string) => void;
}

// ── Blank form data ──
function blankForm(): Omit<ProjectInfo, 'id' | 'created' | 'modified'> {
  return {
    name: '', status: 'draft',
    projectType: '', investor: '', investorPhone: '', investorEmail: '',
    houseNumber: '', street: '', ward: '', district: '', city: '',
    customer: '', address: '', employee: '',
    startDate: '', expectedEndDate: '', notes: '',
    designRevision: 0, bomRevision: 0, bomDesignRevision: 0,
    isLocked: false, soLuongBo: 0,
  };
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
}

export default function ProjectListView({ onOpenCanvas, onNavigateToBanHang, onNavigateToThuChi, onNavigateToSanXuat }: ProjectListViewProps): React.ReactElement {
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Permission: only owner/admin can delete
  const thietLapUsers = useThietLapStore((s) => s.users);
  const canDelete = useMemo(() => {
    const currentUser = thietLapUsers.find((u) => u.membership.status === 'active');
    if (!currentUser) return false;
    return currentUser.roleNames.some((r) => ['OWNER', 'ADMIN'].includes(r));
  }, [thietLapUsers]);

  // Compute status for each project
  const projectsWithStatus = useMemo(() =>
    recentProjects.map((p) => ({ project: p, statusResult: computeProjectStatus(p) })),
    [recentProjects],
  );

  const filtered = useMemo(() => {
    let list = projectsWithStatus;
    if (sidebarFilter === 'locked') {
      list = list.filter(({ project }) => project.isLocked === true);
    } else if (sidebarFilter !== 'all') {
      list = list.filter(({ statusResult }) => statusResult.status === sidebarFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ project: p }) =>
        p.name.toLowerCase().includes(q) ||
        (p.projectCode ?? '').toLowerCase().includes(q) ||
        (p.investor ?? '').toLowerCase().includes(q) ||
        (p.employee ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [projectsWithStatus, sidebarFilter, search]);

  // Count per filter
  const counts = useMemo(() => {
    const c: Record<SidebarFilter, number> = { all: projectsWithStatus.length, draft: 0, designing: 0, quoted: 0, contracted: 0, deposited: 0, in_production: 0, locked: 0 };
    for (const { project, statusResult } of projectsWithStatus) {
      const s = statusResult.status as SidebarFilter;
      if (s in c) c[s]++;
      if (project.isLocked) c.locked++;
    }
    return c;
  }, [projectsWithStatus]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length && filtered.length > 0) return new Set();
      return new Set(filtered.map(({ project }) => project.id));
    });
  }, [filtered]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0 || !canDelete) return;
    const count = selectedIds.size;
    if (!window.confirm(`Bạn có chắc muốn xóa ${count} dự án đã chọn?`)) return;
    for (const id of selectedIds) deleteProject(id);
    setSelectedIds(new Set());
  }, [selectedIds, canDelete, deleteProject]);

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
      designRevision: project.designRevision ?? 0,
      bomRevision: project.bomRevision ?? 0,
      bomDesignRevision: project.bomDesignRevision ?? 0,
      isLocked: project.isLocked ?? false,
      soLuongBo: project.soLuongBo ?? 0,
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

  const handleToggleLock = (project: ProjectInfo) => {
    loadProject(project.id);
    updateProject({ isLocked: !project.isLocked });
  };

  // ── Quote actions (Phase 3) ──
  const handleCreateQuote = useCallback((project: ProjectInfo) => {
    // Load project first so BOM data is available
    loadProject(project.id);
    const result = createQuoteFromProject(project);
    if (result.success) {
      onNavigateToBanHang?.(result.quoteId);
    } else {
      alert(result.error || 'Không thể tạo báo giá.');
    }
  }, [loadProject, onNavigateToBanHang]);

  const handleUpdateQuote = useCallback((project: ProjectInfo) => {
    loadProject(project.id);
    const result = updateQuoteFromProject(project);
    if (result.success) {
      onNavigateToBanHang?.(result.quoteId);
    } else {
      alert(result.error || 'Không thể cập nhật báo giá.');
    }
  }, [loadProject, onNavigateToBanHang]);

  const handleViewQuote = useCallback((project: ProjectInfo) => {
    onNavigateToBanHang?.(project.quoteId);
  }, [onNavigateToBanHang]);

  // ── Contract actions (Phase 4) ──
  const handleCreateContract = useCallback((project: ProjectInfo) => {
    const result = createContractFromQuote(project);
    if (result.success) {
      onNavigateToBanHang?.(); // Navigate to contracts tab
    } else {
      alert(result.error || 'Không thể tạo hợp đồng.');
    }
  }, [onNavigateToBanHang]);

  const handleViewContract = useCallback((project: ProjectInfo) => {
    onNavigateToBanHang?.(); // Navigate to contracts tab
  }, [onNavigateToBanHang]);

  // ── Receipt actions (Phase 5) ──
  const handleCreateReceipt = useCallback((project: ProjectInfo) => {
    const result = createReceiptFromContract(project);
    if (result.success) {
      onNavigateToThuChi?.(result.receiptId);
    } else {
      alert(result.error || 'Không thể tạo phiếu thu.');
    }
  }, [onNavigateToThuChi]);

  const handleViewReceipt = useCallback((project: ProjectInfo) => {
    onNavigateToThuChi?.(project.receiptId);
  }, [onNavigateToThuChi]);

  // ── Production Order actions (Phase 6) ──
  const handleCreateProductionOrder = useCallback((project: ProjectInfo) => {
    loadProject(project.id);
    const result = createProductionOrderFromReceipt(project);
    if (result.success) {
      onNavigateToSanXuat?.(result.productionOrderId);
    } else {
      alert(result.error || 'Không thể tạo lệnh SX.');
    }
  }, [loadProject, onNavigateToSanXuat]);

  const handleViewProductionOrder = useCallback((project: ProjectInfo) => {
    onNavigateToSanXuat?.(project.productionOrderId);
  }, [onNavigateToSanXuat]);

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
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#888', fontSize: 11, display: 'block', marginBottom: 4 }}>Mã dự án</label>
            <div style={{ padding: '6px 10px', borderRadius: 4, backgroundColor: '#1a1a2e', border: '1px solid #333', color: '#f59e0b', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
              {isCreate ? 'Tự động tạo khi lưu' : (editingProject?.projectCode || '—')}
            </div>
          </div>
          <FormField label="Tên dự án *" value={form.name} onChange={(v) => setField('name', v)} placeholder="Nhập tên dự án..." />
          <EmployeeSelect value={form.employee ?? ''} onChange={(v) => setField('employee', v)} />
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
      {/* ── Left Sidebar: Quy trình ── */}
      <div style={{ width: 200, minWidth: 200, borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e' }}>
        <div style={{ padding: '12px 12px 8px', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Quy trình
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
          {selectedIds.size > 0 && canDelete && (
            <button onClick={handleBulkDelete}
              style={{ padding: '5px 14px', borderRadius: 4, border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              🗑 Xóa {selectedIds.size} dự án
            </button>
          )}
          {selectedIds.size > 0 && !canDelete && (
            <span style={{ fontSize: 11, color: '#ef4444' }}>Bạn không có quyền xóa</span>
          )}
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
                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #333', width: 36 }}>
                  <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#3b82f6' }} title="Chọn tất cả" />
                </th>
                {['Ngày tạo', 'Ngày sửa', 'Nhân viên', 'Mã DA', 'Tên dự án', 'SL', 'Thiết kế', 'BOM', 'DS cắt', 'Hiện trạng', 'Liên kết', '🔒'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 10px', textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #333', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={13} style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                  {recentProjects.length === 0 ? 'Chưa có dự án nào. Nhấn "+ Tạo dự án mới" để bắt đầu.' : 'Không tìm thấy dự án phù hợp.'}
                </td></tr>
              )}
              {filtered.map(({ project, statusResult }) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  statusResult={statusResult}
                  selected={selectedIds.has(project.id)}
                  onToggleSelect={() => toggleSelect(project.id)}
                  onOpenDetail={() => handleOpenDetail(project)}
                  onOpenDesign={() => { loadProject(project.id); onOpenCanvas(project.id, 'thietke'); }}
                  onOpenBom={() => { loadProject(project.id); onOpenCanvas(project.id, 'filebom'); }}
                  onOpenCutList={() => { loadProject(project.id); onOpenCanvas(project.id, 'filebaogia'); }}
                  onToggleLock={() => handleToggleLock(project)}
                  onCreateQuote={() => handleCreateQuote(project)}
                  onUpdateQuote={() => handleUpdateQuote(project)}
                  onViewQuote={() => handleViewQuote(project)}
                  onCreateContract={() => handleCreateContract(project)}
                  onViewContract={() => handleViewContract(project)}
                  onCreateReceipt={() => handleCreateReceipt(project)}
                  onViewReceipt={() => handleViewReceipt(project)}
                  onCreateProductionOrder={() => handleCreateProductionOrder(project)}
                  onViewProductionOrder={() => handleViewProductionOrder(project)}
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

function ProjectRow({ project, statusResult, selected, onToggleSelect, onOpenDetail, onOpenDesign, onOpenBom, onOpenCutList, onToggleLock, onCreateQuote, onUpdateQuote, onViewQuote, onCreateContract, onViewContract, onCreateReceipt, onViewReceipt, onCreateProductionOrder, onViewProductionOrder }: {
  project: ProjectInfo;
  statusResult: StatusResult;
  selected: boolean;
  onToggleSelect: () => void;
  onOpenDetail: () => void;
  onOpenDesign: () => void;
  onOpenBom: () => void;
  onOpenCutList: () => void;
  onToggleLock: () => void;
  onCreateQuote: () => void;
  onUpdateQuote: () => void;
  onViewQuote: () => void;
  onCreateContract: () => void;
  onViewContract: () => void;
  onCreateReceipt: () => void;
  onViewReceipt: () => void;
  onCreateProductionOrder: () => void;
  onViewProductionOrder: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cellStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #2a2a3e', whiteSpace: 'nowrap', verticalAlign: 'middle' };
  const linkStyle: React.CSSProperties = { color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 };

  const statusColor = STATUS_COLORS[statusResult.status] ?? '#888';
  const hasProductionOrder = !!project.productionOrderId;

  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: selected ? '#1e3a5f' : hovered ? '#252535' : 'transparent', transition: 'background-color 0.1s' }}>
      <td style={{ ...cellStyle, textAlign: 'center', width: 36 }}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect}
          style={{ cursor: 'pointer', accentColor: '#3b82f6' }} />
      </td>
      <td style={cellStyle}>{fmtDate(project.created)}</td>
      <td style={cellStyle}>{fmtDate(project.modified)}</td>
      <td style={cellStyle}>{project.employee || '—'}</td>
      <td style={{ ...cellStyle, color: '#888', fontFamily: 'monospace' }}>{project.projectCode || '—'}</td>
      <td style={{ ...cellStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span onClick={onOpenDetail} style={{ cursor: 'pointer', color: '#cdd6f4', fontWeight: 500 }}>{project.name}</span>
      </td>
      {/* Số lượng bộ cửa */}
      <td style={{ ...cellStyle, textAlign: 'center' }}>{project.soLuongBo ?? 0}</td>
      <td style={cellStyle}><span onClick={onOpenDesign} style={linkStyle}>Mở</span></td>
      <td style={cellStyle}><span onClick={onOpenBom} style={linkStyle}>Mở</span></td>
      <td style={cellStyle}><span onClick={onOpenCutList} style={linkStyle}>Mở</span></td>
      {/* Hiện trạng — badge chỉ đọc */}
      <td style={cellStyle}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 10,
          backgroundColor: `${statusColor}20`, border: `1px solid ${statusColor}44`,
          color: statusColor, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          {statusResult.statusLabel}
        </span>
      </td>
      {/* Liên kết / Hành động */}
      <td style={cellStyle}>
        <ActionCell statusResult={statusResult} onCreateQuote={onCreateQuote} onUpdateQuote={onUpdateQuote} onViewQuote={onViewQuote} onCreateContract={onCreateContract} onViewContract={onViewContract} onCreateReceipt={onCreateReceipt} onViewReceipt={onViewReceipt} onCreateProductionOrder={onCreateProductionOrder} onViewProductionOrder={onViewProductionOrder} />
        {statusResult.staleDocuments.length > 0 && (
          <StaleBadge staleDocuments={statusResult.staleDocuments} />
        )}
      </td>
      {/* Khóa — chỉ hiện khi đã có LSX */}
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        {hasProductionOrder && (
          <span onClick={onToggleLock}
            style={{ cursor: 'pointer', fontSize: 16, userSelect: 'none' }}
            title={project.isLocked ? 'Nhấn để mở khóa' : 'Nhấn để khóa'}>
            {project.isLocked ? '🔒' : '🔓'}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── ActionCell ──────────────────────────────────────

function ActionCell({ statusResult, onCreateQuote, onUpdateQuote, onViewQuote, onCreateContract, onViewContract, onCreateReceipt, onViewReceipt, onCreateProductionOrder, onViewProductionOrder }: {
  statusResult: StatusResult;
  onCreateQuote: () => void;
  onUpdateQuote: () => void;
  onViewQuote: () => void;
  onCreateContract: () => void;
  onViewContract: () => void;
  onCreateReceipt: () => void;
  onViewReceipt: () => void;
  onCreateProductionOrder: () => void;
  onViewProductionOrder: () => void;
}) {
  if (!statusResult.actionLabel) return null;

  const { actionType, actionLabel, actionCode } = statusResult;

  // Mã chứng từ — click mở
  if (actionType === 'view_quote') {
    return (
      <span onClick={onViewQuote}
        style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontFamily: 'monospace' }}
        title={`Mở ${actionCode}`}>
        {actionCode || actionLabel}
      </span>
    );
  }

  if (actionType === 'view_contract') {
    return (
      <span onClick={onViewContract}
        style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontFamily: 'monospace' }}
        title={`Mở ${actionCode}`}>
        {actionCode || actionLabel}
      </span>
    );
  }

  if (actionType === 'view_receipt') {
    return (
      <span onClick={onViewReceipt}
        style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontFamily: 'monospace' }}
        title={`Mở ${actionCode}`}>
        {actionCode || actionLabel}
      </span>
    );
  }

  if (actionType === 'view_production_order') {
    return (
      <span onClick={onViewProductionOrder}
        style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontFamily: 'monospace' }}
        title={`Mở ${actionCode}`}>
        {actionCode || actionLabel}
      </span>
    );
  }

  // Tạo / Cập nhật báo giá
  if (actionType === 'create_quote') {
    return (
      <span onClick={onCreateQuote}
        style={{ color: '#22c55e', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontWeight: 500 }}>
        {actionLabel}
      </span>
    );
  }

  if (actionType === 'update_quote') {
    return (
      <span onClick={onUpdateQuote}
        style={{ color: '#f59e0b', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontWeight: 500 }}>
        {actionLabel}
      </span>
    );
  }

  // Tạo hợp đồng
  if (actionType === 'create_contract') {
    return (
      <span onClick={onCreateContract}
        style={{ color: '#22c55e', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontWeight: 500 }}>
        {actionLabel}
      </span>
    );
  }

  // Tạo phiếu thu
  if (actionType === 'create_receipt') {
    return (
      <span onClick={onCreateReceipt}
        style={{ color: '#a855f7', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontWeight: 500 }}>
        {actionLabel}
      </span>
    );
  }

  // Tạo lệnh SX
  if (actionType === 'create_production_order') {
    return (
      <span onClick={onCreateProductionOrder}
        style={{ color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontWeight: 500 }}>
        {actionLabel}
      </span>
    );
  }

  return null;
}

// ── StaleBadge (Phase 8) ──────────────────────────────────────

const STALE_LABELS: Record<string, string> = {
  quote: 'Báo giá',
  contract: 'Hợp đồng',
  receipt: 'Phiếu thu',
  production_order: 'Lệnh SX',
};

function StaleBadge({ staleDocuments }: { staleDocuments: string[] }) {
  const names = staleDocuments.map((d) => STALE_LABELS[d] || d).join(', ');
  return (
    <span
      title={`Phiên bản cũ: ${names}`}
      style={{
        display: 'inline-block',
        marginLeft: 4,
        padding: '1px 6px',
        borderRadius: 4,
        backgroundColor: '#f59e0b22',
        border: '1px solid #f59e0b44',
        color: '#f59e0b',
        fontSize: 10,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      ⚠ Phiên bản cũ
    </span>
  );
}

// ── EmployeeSelect ──────────────────────────────────────

function EmployeeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const users = useThietLapStore((s) => s.users);
  const [open, setOpen] = useState(false);

  const activeUsers = users.filter((u) => u.membership.status === 'active');

  return (
    <div style={{ marginBottom: 10, position: 'relative' }}>
      <label style={{ color: '#888', fontSize: 11, display: 'block', marginBottom: 4 }}>Nhân viên phụ trách</label>
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', backgroundColor: '#252535', border: '1px solid #444', borderRadius: 4,
          padding: '6px 10px', color: value ? '#ddd' : '#888', fontSize: 12, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{value || 'Chọn nhân viên...'}</span>
        <span style={{ fontSize: 10, color: '#666' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          backgroundColor: '#252535', border: '1px solid #444', borderRadius: 4,
          maxHeight: 200, overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <div
            onClick={() => { onChange(''); setOpen(false); }}
            style={{ padding: '8px 12px', fontSize: 12, color: '#888', cursor: 'pointer', borderBottom: '1px solid #333' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2a2a3e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            — Không chọn —
          </div>
          {activeUsers.map((u) => (
            <div
              key={u.user.userId}
              onClick={() => { onChange(u.user.displayName); setOpen(false); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                backgroundColor: value === u.user.displayName ? '#2a2a3e' : 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2a2a3e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = value === u.user.displayName ? '#2a2a3e' : 'transparent'; }}
            >
              <span style={{ color: '#ddd' }}>{u.user.displayName}</span>
              <span style={{ fontSize: 10, color: '#666', marginLeft: 8 }}>
                {u.roleNames.join(', ') || 'Chưa gán vai trò'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
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
