/**
 * Tests for Phase 6: createProductionOrderFromReceipt
 *
 * Tests the Receipt → ProductionOrder conversion, code generation,
 * BOM→items mapping, and bidirectional linking (PO ↔ ProjectInfo)
 */

import { createProductionOrderFromReceipt } from '../domain/createProductionOrderFromReceipt';
import { createReceiptFromContract } from '../domain/createReceiptFromContract';
import { createContractFromQuote } from '../domain/createContractFromQuote';
import { createQuoteFromProject } from '../domain/createQuoteFromProject';
import { useProjectStore } from '../store/projectStore';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import { useThuChiStore } from '../../../BookThuChi/src/store/thuChiStore';
import { useSanXuatThiCongStore } from '../../../BookSanXuatThiCong/src/store/sanXuatThiCongStore';
import type { ProjectInfo, BomItem } from '../store/projectStore';

/** Helper: minimal ProjectInfo */
function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'proj-p6-1',
    name: 'Dự án Test P6',
    created: '2026-03-21T00:00:00Z',
    modified: '2026-03-21T00:00:00Z',
    status: 'draft',
    designRevision: 3,
    bomRevision: 1,
    bomDesignRevision: 3,
    isLocked: false,
    soLuongBo: 2,
    projectCode: 'DA 300',
    investor: 'Nguyễn Văn P6',
    employee: 'NV P6',
    ...overrides,
  };
}

const SAMPLE_BOM: BomItem[] = [
  {
    id: 'bom-p6-1',
    category: 'aluminum',
    code: 'FRAME-H-XF55',
    name: 'Thanh ngang',
    unit: 'thanh',
    quantity: 4,
    length: 1200,
    unitPrice: 54000,
    totalPrice: 216000,
  },
  {
    id: 'bom-p6-2',
    category: 'glass',
    code: 'GLASS-XF55',
    name: 'Kính cường lực',
    unit: 'm²',
    quantity: 2,
    unitPrice: 500000,
    totalPrice: 1000000,
  },
];

/** Setup: reset stores, create quote + contract + receipt, return project for PO creation */
function setupWithReceipt(projectOverrides: Partial<ProjectInfo> = {}) {
  useBanHangStore.getState().resetAll();
  useThuChiStore.getState().resetAll();
  useSanXuatThiCongStore.getState().resetAll();

  const project = makeProject(projectOverrides);
  useProjectStore.setState({
    bomItems: SAMPLE_BOM,
    currentProject: project,
    recentProjects: [project],
  });

  // Phase 3: Create quote
  createQuoteFromProject(project);
  // Phase 4: Create contract
  const projectAfterQuote = useProjectStore.getState().currentProject!;
  createContractFromQuote(projectAfterQuote);
  // Phase 5: Create receipt
  const projectAfterContract = useProjectStore.getState().currentProject!;
  createReceiptFromContract(projectAfterContract);

  const updatedProject = useProjectStore.getState().currentProject!;
  return { project: updatedProject };
}

describe('Phase 6 — createProductionOrderFromReceipt', () => {
  it('creates a production order with correct LSX-xxxx code', () => {
    const { project } = setupWithReceipt();
    const result = createProductionOrderFromReceipt(project);

    expect(result.success).toBe(true);
    expect(result.productionOrderCode).toMatch(/^LSX-\d{4}$/);
    expect(result.productionOrderId).toBeTruthy();
  });

  it('auto-increments after seed data (LSX-0001 to LSX-0003)', () => {
    const { project } = setupWithReceipt();
    const result = createProductionOrderFromReceipt(project);
    // Seed has LSX-0001, LSX-0002, LSX-0003 → next = LSX-0004
    expect(result.productionOrderCode).toBe('LSX-0004');
  });

  it('creates items from BOM', () => {
    const { project } = setupWithReceipt();
    createProductionOrderFromReceipt(project);

    const orders = useSanXuatThiCongStore.getState().productionOrders;
    const order = orders[orders.length - 1];
    expect(order.items).toHaveLength(2);
    expect(order.items[0].description).toBe('Thanh ngang');
    expect(order.items[0].quantity).toBe(4);
    expect(order.items[0].bomRef).toBe('FRAME-H-XF55');
    expect(order.items[1].description).toBe('Kính cường lực');
    expect(order.items[1].quantity).toBe(2);
  });

  it('sets completedQty and defectQty to 0', () => {
    const { project } = setupWithReceipt();
    createProductionOrderFromReceipt(project);

    const orders = useSanXuatThiCongStore.getState().productionOrders;
    const order = orders[orders.length - 1];
    for (const item of order.items) {
      expect(item.completedQty).toBe(0);
      expect(item.defectQty).toBe(0);
    }
  });

  it('links PO to project (projectId, projectCode)', () => {
    const { project } = setupWithReceipt();
    createProductionOrderFromReceipt(project);

    const orders = useSanXuatThiCongStore.getState().productionOrders;
    const order = orders[orders.length - 1];
    expect(order.projectId).toBe(project.id);
    expect(order.projectCode).toBe('DA 300');
  });

  it('sets status to new and priority to normal', () => {
    const { project } = setupWithReceipt();
    createProductionOrderFromReceipt(project);

    const orders = useSanXuatThiCongStore.getState().productionOrders;
    const order = orders[orders.length - 1];
    expect(order.status).toBe('new');
    expect(order.priority).toBe('normal');
    expect(order.assignedTo).toBe('NV P6');
  });

  it('links PO back to project (productionOrderId, productionOrderCode)', () => {
    const { project } = setupWithReceipt();
    const result = createProductionOrderFromReceipt(project);

    const updatedProject = useProjectStore.getState().currentProject;
    expect(updatedProject?.productionOrderId).toBe(result.productionOrderId);
    expect(updatedProject?.productionOrderCode).toBe(result.productionOrderCode);
  });

  it('fails when project has no receiptId', () => {
    useSanXuatThiCongStore.getState().resetAll();
    const project = makeProject({ receiptId: undefined });
    useProjectStore.setState({ currentProject: project, recentProjects: [project] });

    const result = createProductionOrderFromReceipt(project);
    expect(result.success).toBe(false);
    expect(result.error).toContain('chưa có phiếu thu');
  });
});

describe('Phase 6 — computeProjectStatus with production order', () => {
  it('returns create_production_order action when project is deposited', () => {
    const { project } = setupWithReceipt();

    const { computeProjectStatus } = require('../domain/computeProjectStatus');
    const result = computeProjectStatus(project);
    expect(result.status).toBe('deposited');
    expect(result.actionType).toBe('create_production_order');
    expect(result.actionLabel).toBe('Tạo lệnh SX');
  });

  it('returns in_production status after PO is created', () => {
    const { project } = setupWithReceipt();
    createProductionOrderFromReceipt(project);

    const updatedProject = useProjectStore.getState().currentProject!;
    const { computeProjectStatus } = require('../domain/computeProjectStatus');
    const result = computeProjectStatus(updatedProject);
    expect(result.status).toBe('in_production');
    expect(result.actionType).toBe('view_production_order');
    expect(result.actionCode).toMatch(/^LSX-\d{4}$/);
  });
});
