import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  ProductionOrder,
  MaterialPlan,
  MaterialIssue,
  InstallationJob,
  AcceptanceRecord,
} from '../types';
import { logActivityDirect } from '../../../shared/src/hooks/useLogActivity';

// ── Seed: Projects ──────────────────────────────────────────

const SEED_PROJECTS: Project[] = [
  {
    projectId: 'prj-001',
    projectCode: 'CT-0001',
    projectName: 'Cửa nhôm Vinhomes Grand Park — Block S5',
    customerId: 'kh-001',
    customerName: 'Công ty ABC Construction',
    salesOrderId: 'so-001',
    salesOrderCode: 'DH-0001',
    address: 'Block S5, Vinhomes Grand Park, Q.9, TP.HCM',
    startDate: '2026-03-05',
    deadline: '2026-04-15',
    status: 'in_production',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-05T08:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
  },
  {
    projectId: 'prj-002',
    projectCode: 'CT-0002',
    projectName: 'Vách kính showroom Hoàng Gia',
    customerId: 'kh-002',
    customerName: 'Công ty Hoàng Gia Windows',
    salesOrderId: 'so-003',
    salesOrderCode: 'DH-0003',
    address: '456 Lê Lợi, Q.3, TP.HCM',
    startDate: '2026-03-10',
    deadline: '2026-03-30',
    status: 'installing',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-17T14:00:00Z',
  },
  {
    projectId: 'prj-003',
    projectCode: 'CT-0003',
    projectName: 'Ban công căn hộ Anh Hùng — SaigonPearl',
    customerId: 'kh-003',
    customerName: 'Anh Hùng',
    address: '92 Nguyễn Hữu Cảnh, Bình Thạnh',
    startDate: '2026-03-15',
    deadline: '2026-03-25',
    status: 'planning',
    createdBy: 'Lê Thị C',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
  },
];

// ── Seed: Production Orders ─────────────────────────────────

const SEED_PRODUCTION_ORDERS: ProductionOrder[] = [
  {
    orderId: 'po-001',
    orderCode: 'LSX-0001',
    projectId: 'prj-001',
    projectCode: 'CT-0001',
    items: [
      { itemId: 'pi-001a', description: 'Cửa nhôm Xingfa 55 — 1200×2100', quantity: 10, unit: 'bộ', completedQty: 6, defectQty: 1 },
      { itemId: 'pi-001b', description: 'Cửa sổ mở hất — 600×800', quantity: 20, unit: 'bộ', completedQty: 20, defectQty: 0 },
    ],
    priority: 'high',
    status: 'processing',
    assignedTo: 'Tổ SX 1 — Anh Tuấn',
    startDate: '2026-03-06',
    dueDate: '2026-03-25',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-06T08:00:00Z',
    updatedAt: '2026-03-16T15:00:00Z',
  },
  {
    orderId: 'po-002',
    orderCode: 'LSX-0002',
    projectId: 'prj-002',
    projectCode: 'CT-0002',
    items: [
      { itemId: 'pi-002a', description: 'Vách kính cường lực 12mm — 3000×2400', quantity: 5, unit: 'tấm', completedQty: 5, defectQty: 0 },
    ],
    priority: 'urgent',
    status: 'completed',
    assignedTo: 'Tổ SX 2 — Anh Minh',
    startDate: '2026-03-11',
    dueDate: '2026-03-18',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-11T08:00:00Z',
    updatedAt: '2026-03-17T10:00:00Z',
    completedAt: '2026-03-17T10:00:00Z',
    qcPassedAt: '2026-03-17T11:00:00Z',
    qcNote: 'Đạt tiêu chuẩn — bề mặt OK, kích thước đúng',
  },
  {
    orderId: 'po-003',
    orderCode: 'LSX-0003',
    projectId: 'prj-001',
    projectCode: 'CT-0001',
    items: [
      { itemId: 'pi-003a', description: 'Khung bao cửa chính — 2400×2800', quantity: 2, unit: 'bộ', completedQty: 0, defectQty: 0 },
    ],
    priority: 'normal',
    status: 'new',
    startDate: '2026-03-18',
    dueDate: '2026-03-28',
    notes: 'Chờ vật tư nhôm hệ 93',
    createdBy: 'Lê Thị C',
    createdAt: '2026-03-18T08:00:00Z',
    updatedAt: '2026-03-18T08:00:00Z',
  },
];

// ── Seed: Material Plans ────────────────────────────────────

const SEED_MATERIAL_PLANS: MaterialPlan[] = [
  {
    planId: 'mp-001',
    planCode: 'KHVT-0001',
    productionOrderId: 'po-001',
    productionOrderCode: 'LSX-0001',
    items: [
      { itemId: 'mi-001a', materialName: 'Nhôm Xingfa 55 series', materialCode: 'NX-55', unit: 'cây 6m', requiredQty: 40, stockQty: 35, issuedQty: 30, shortageQty: 10 },
      { itemId: 'mi-001b', materialName: 'Kính cường lực 8mm', materialCode: 'KCL-8', unit: 'tấm', requiredQty: 30, stockQty: 50, issuedQty: 30, shortageQty: 0 },
      { itemId: 'mi-001c', materialName: 'Phụ kiện Hopo bản lề', materialCode: 'PK-BL', unit: 'bộ', requiredQty: 20, stockQty: 15, issuedQty: 15, shortageQty: 5 },
    ],
    status: 'partial',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-06T09:00:00Z',
    updatedAt: '2026-03-16T10:00:00Z',
  },
  {
    planId: 'mp-002',
    planCode: 'KHVT-0002',
    productionOrderId: 'po-002',
    productionOrderCode: 'LSX-0002',
    items: [
      { itemId: 'mi-002a', materialName: 'Kính cường lực 12mm', materialCode: 'KCL-12', unit: 'tấm', requiredQty: 5, stockQty: 8, issuedQty: 5, shortageQty: 0 },
      { itemId: 'mi-002b', materialName: 'Keo silicone cấu trúc', materialCode: 'KS-CT', unit: 'tuýp', requiredQty: 10, stockQty: 20, issuedQty: 10, shortageQty: 0 },
    ],
    status: 'fulfilled',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-11T09:00:00Z',
    updatedAt: '2026-03-14T10:00:00Z',
  },
];

// ── Seed: Material Issues ───────────────────────────────────

const SEED_MATERIAL_ISSUES: MaterialIssue[] = [
  {
    issueId: 'mi-001',
    issueCode: 'XD-0001',
    productionOrderId: 'po-001',
    productionOrderCode: 'LSX-0001',
    items: [
      { itemId: 'mii-001a', materialName: 'Nhôm Xingfa 55 series', materialCode: 'NX-55', unit: 'cây 6m', requestedQty: 30, issuedQty: 30, wasteQty: 2 },
      { itemId: 'mii-001b', materialName: 'Kính cường lực 8mm', materialCode: 'KCL-8', unit: 'tấm', requestedQty: 30, issuedQty: 30, wasteQty: 1 },
    ],
    status: 'issued',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-07T08:00:00Z',
    updatedAt: '2026-03-07T10:00:00Z',
    approvedBy: 'Trần Thị B',
    approvedAt: '2026-03-07T09:00:00Z',
  },
  {
    issueId: 'mi-002',
    issueCode: 'XD-0002',
    productionOrderId: 'po-002',
    productionOrderCode: 'LSX-0002',
    items: [
      { itemId: 'mii-002a', materialName: 'Kính cường lực 12mm', materialCode: 'KCL-12', unit: 'tấm', requestedQty: 5, issuedQty: 5, wasteQty: 0 },
    ],
    status: 'issued',
    createdBy: 'Lê Thị C',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
    approvedBy: 'Trần Thị B',
    approvedAt: '2026-03-12T09:00:00Z',
  },
];

// ── Seed: Installation Jobs ─────────────────────────────────

const SEED_INSTALLATIONS: InstallationJob[] = [
  {
    jobId: 'ij-001',
    jobCode: 'LD-0001',
    projectId: 'prj-002',
    projectCode: 'CT-0002',
    teamName: 'Đội thi công A',
    teamLeader: 'Anh Bảo',
    scheduledDate: '2026-03-17',
    scheduledEndDate: '2026-03-19',
    address: '456 Lê Lợi, Q.3, TP.HCM',
    status: 'in_progress',
    checkInAt: '2026-03-17T07:30:00Z',
    issues: ['Trần chưa xử lý xong, chờ 1 ngày'],
    notes: 'Vách kính showroom tầng 1',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-15T14:00:00Z',
    updatedAt: '2026-03-17T08:00:00Z',
  },
  {
    jobId: 'ij-002',
    jobCode: 'LD-0002',
    projectId: 'prj-001',
    projectCode: 'CT-0001',
    teamName: 'Đội thi công B',
    teamLeader: 'Anh Phong',
    scheduledDate: '2026-03-26',
    scheduledEndDate: '2026-03-30',
    address: 'Block S5, Vinhomes Grand Park, Q.9, TP.HCM',
    status: 'scheduled',
    notes: 'Chờ SX hoàn tất cửa nhôm — LSX-0001',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-16T09:00:00Z',
    updatedAt: '2026-03-16T09:00:00Z',
  },
];

// ── Seed: Acceptance Records ────────────────────────────────

const SEED_ACCEPTANCES: AcceptanceRecord[] = [
  {
    recordId: 'ar-001',
    recordCode: 'NT-0001',
    projectId: 'prj-002',
    projectCode: 'CT-0002',
    type: 'partial',
    acceptanceDate: '2026-03-19',
    inspectedBy: 'Trần Thị B',
    status: 'pending',
    volumeDescription: 'Vách kính tầng 1 showroom — 5 tấm kính cường lực 12mm',
    notes: 'Chờ hoàn tất lắp đặt để nghiệm thu',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-17T15:00:00Z',
    updatedAt: '2026-03-17T15:00:00Z',
  },
];

// ── Store Interface ─────────────────────────────────────────

interface SanXuatThiCongState {
  projects: Project[];
  productionOrders: ProductionOrder[];
  materialPlans: MaterialPlan[];
  materialIssues: MaterialIssue[];
  installations: InstallationJob[];
  acceptances: AcceptanceRecord[];

  // Project CRUD
  addProject: (p: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Production Order CRUD
  addProductionOrder: (o: ProductionOrder) => void;
  updateProductionOrder: (id: string, patch: Partial<ProductionOrder>) => void;
  deleteProductionOrder: (id: string) => void;

  // Material Plan CRUD
  addMaterialPlan: (p: MaterialPlan) => void;
  updateMaterialPlan: (id: string, patch: Partial<MaterialPlan>) => void;
  deleteMaterialPlan: (id: string) => void;

  // Material Issue CRUD
  addMaterialIssue: (i: MaterialIssue) => void;
  updateMaterialIssue: (id: string, patch: Partial<MaterialIssue>) => void;
  deleteMaterialIssue: (id: string) => void;

  // Installation CRUD
  addInstallation: (j: InstallationJob) => void;
  updateInstallation: (id: string, patch: Partial<InstallationJob>) => void;
  deleteInstallation: (id: string) => void;

  // Acceptance CRUD
  addAcceptance: (r: AcceptanceRecord) => void;
  updateAcceptance: (id: string, patch: Partial<AcceptanceRecord>) => void;
  deleteAcceptance: (id: string) => void;

  resetAll: () => void;
}

// ── Store ───────────────────────────────────────────────────

const initialState = {
  projects: SEED_PROJECTS,
  productionOrders: SEED_PRODUCTION_ORDERS,
  materialPlans: SEED_MATERIAL_PLANS,
  materialIssues: SEED_MATERIAL_ISSUES,
  installations: SEED_INSTALLATIONS,
  acceptances: SEED_ACCEPTANCES,
};

export const useSanXuatThiCongStore = create<SanXuatThiCongState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Project
      addProject: (p) => {
        set((s) => ({ projects: [...s.projects, p] }));
        logActivityDirect('SanXuatThiCong', 'create', 'project', p.projectId, p.projectCode, `Tạo dự án ${p.projectCode}`);
      },
      updateProject: (id, patch) => {
        const code = get().projects.find(p => p.projectId === id)?.projectCode ?? id;
        set((s) => ({ projects: s.projects.map((p) => (p.projectId === id ? { ...p, ...patch } : p)) }));
        logActivityDirect('SanXuatThiCong', 'update', 'project', id, code, `Cập nhật dự án ${code}`);
      },
      deleteProject: (id) => {
        const code = get().projects.find(p => p.projectId === id)?.projectCode ?? id;
        set((s) => ({ projects: s.projects.filter((p) => p.projectId !== id) }));
        logActivityDirect('SanXuatThiCong', 'delete', 'project', id, code, `Xóa dự án ${code}`);
      },

      // Production Order
      addProductionOrder: (o) => {
        set((s) => ({ productionOrders: [...s.productionOrders, o] }));
        logActivityDirect('SanXuatThiCong', 'create', 'productionOrder', o.orderId, o.orderCode, `Tạo lệnh SX ${o.orderCode}`);
      },
      updateProductionOrder: (id, patch) => {
        const code = get().productionOrders.find(o => o.orderId === id)?.orderCode ?? id;
        set((s) => ({
          productionOrders: s.productionOrders.map((o) => (o.orderId === id ? { ...o, ...patch } : o)),
        }));
        logActivityDirect('SanXuatThiCong', 'update', 'productionOrder', id, code, `Cập nhật LSX ${code}`);
      },
      deleteProductionOrder: (id) => {
        const code = get().productionOrders.find(o => o.orderId === id)?.orderCode ?? id;
        set((s) => ({ productionOrders: s.productionOrders.filter((o) => o.orderId !== id) }));
        logActivityDirect('SanXuatThiCong', 'delete', 'productionOrder', id, code, `Xóa LSX ${code}`);
      },

      // Material Plan
      addMaterialPlan: (p) => {
        set((s) => ({ materialPlans: [...s.materialPlans, p] }));
        logActivityDirect('SanXuatThiCong', 'create', 'materialPlan', p.planId, p.planCode, `Tạo KH vật tư ${p.planCode}`);
      },
      updateMaterialPlan: (id, patch) => {
        const code = get().materialPlans.find(p => p.planId === id)?.planCode ?? id;
        set((s) => ({
          materialPlans: s.materialPlans.map((p) => (p.planId === id ? { ...p, ...patch } : p)),
        }));
        logActivityDirect('SanXuatThiCong', 'update', 'materialPlan', id, code, `Cập nhật KHVT ${code}`);
      },
      deleteMaterialPlan: (id) => {
        const code = get().materialPlans.find(p => p.planId === id)?.planCode ?? id;
        set((s) => ({ materialPlans: s.materialPlans.filter((p) => p.planId !== id) }));
        logActivityDirect('SanXuatThiCong', 'delete', 'materialPlan', id, code, `Xóa KHVT ${code}`);
      },

      // Material Issue
      addMaterialIssue: (i) => {
        set((s) => ({ materialIssues: [...s.materialIssues, i] }));
        logActivityDirect('SanXuatThiCong', 'create', 'materialIssue', i.issueId, i.issueCode, `Tạo phiếu xuất VT ${i.issueCode}`);
      },
      updateMaterialIssue: (id, patch) => {
        const code = get().materialIssues.find(i => i.issueId === id)?.issueCode ?? id;
        set((s) => ({
          materialIssues: s.materialIssues.map((i) => (i.issueId === id ? { ...i, ...patch } : i)),
        }));
        logActivityDirect('SanXuatThiCong', 'update', 'materialIssue', id, code, `Cập nhật XDVT ${code}`);
      },
      deleteMaterialIssue: (id) => {
        const code = get().materialIssues.find(i => i.issueId === id)?.issueCode ?? id;
        set((s) => ({ materialIssues: s.materialIssues.filter((i) => i.issueId !== id) }));
        logActivityDirect('SanXuatThiCong', 'delete', 'materialIssue', id, code, `Xóa XDVT ${code}`);
      },

      // Installation
      addInstallation: (j) => {
        set((s) => ({ installations: [...s.installations, j] }));
        logActivityDirect('SanXuatThiCong', 'create', 'installation', j.jobId, j.jobCode, `Tạo lịch lắp đặt ${j.jobCode}`);
      },
      updateInstallation: (id, patch) => {
        const code = get().installations.find(j => j.jobId === id)?.jobCode ?? id;
        set((s) => ({
          installations: s.installations.map((j) => (j.jobId === id ? { ...j, ...patch } : j)),
        }));
        logActivityDirect('SanXuatThiCong', 'update', 'installation', id, code, `Cập nhật lắp đặt ${code}`);
      },
      deleteInstallation: (id) => {
        const code = get().installations.find(j => j.jobId === id)?.jobCode ?? id;
        set((s) => ({ installations: s.installations.filter((j) => j.jobId !== id) }));
        logActivityDirect('SanXuatThiCong', 'delete', 'installation', id, code, `Xóa lắp đặt ${code}`);
      },

      // Acceptance
      addAcceptance: (r) => {
        set((s) => ({ acceptances: [...s.acceptances, r] }));
        logActivityDirect('SanXuatThiCong', 'create', 'acceptance', r.recordId, r.recordCode, `Tạo nghiệm thu ${r.recordCode}`);
      },
      updateAcceptance: (id, patch) => {
        const code = get().acceptances.find(r => r.recordId === id)?.recordCode ?? id;
        set((s) => ({
          acceptances: s.acceptances.map((r) => (r.recordId === id ? { ...r, ...patch } : r)),
        }));
        logActivityDirect('SanXuatThiCong', 'update', 'acceptance', id, code, `Cập nhật nghiệm thu ${code}`);
      },
      deleteAcceptance: (id) => {
        const code = get().acceptances.find(r => r.recordId === id)?.recordCode ?? id;
        set((s) => ({ acceptances: s.acceptances.filter((r) => r.recordId !== id) }));
        logActivityDirect('SanXuatThiCong', 'delete', 'acceptance', id, code, `Xóa nghiệm thu ${code}`);
      },

      resetAll: () => set(initialState),
    }),
    { name: 'alubok-san-xuat-thi-cong' }
  )
);
