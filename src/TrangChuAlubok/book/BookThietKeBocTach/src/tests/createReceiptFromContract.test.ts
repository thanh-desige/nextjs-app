/**
 * Tests for Phase 5: createReceiptFromContract
 *
 * Tests the Contract → CashReceipt conversion, code generation,
 * and bidirectional linking (Receipt ↔ ProjectInfo)
 */

import { createReceiptFromContract } from '../domain/createReceiptFromContract';
import { createContractFromQuote } from '../domain/createContractFromQuote';
import { createQuoteFromProject } from '../domain/createQuoteFromProject';
import { useProjectStore } from '../store/projectStore';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import { useThuChiStore } from '../../../BookThuChi/src/store/thuChiStore';
import type { ProjectInfo, BomItem } from '../store/projectStore';

/** Helper: minimal ProjectInfo */
function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'proj-p5-1',
    name: 'Dự án Test P5',
    created: '2026-03-20T00:00:00Z',
    modified: '2026-03-20T00:00:00Z',
    status: 'draft',
    designRevision: 3,
    bomRevision: 1,
    bomDesignRevision: 3,
    isLocked: false,
    soLuongBo: 2,
    projectCode: 'DA 200',
    investor: 'Nguyễn Văn P5',
    employee: 'NV P5',
    ...overrides,
  };
}

const SAMPLE_BOM: BomItem[] = [
  {
    id: 'bom-p5-1',
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
    id: 'bom-p5-2',
    category: 'glass',
    code: 'GLASS-XF55',
    name: 'Kính cường lực',
    unit: 'm²',
    quantity: 2,
    unitPrice: 500000,
    totalPrice: 1000000,
  },
];

/** Setup: reset stores, create quote + contract, then return project for receipt creation */
function setupWithContract(projectOverrides: Partial<ProjectInfo> = {}) {
  useBanHangStore.getState().resetAll();
  useThuChiStore.getState().resetAll();

  const project = makeProject(projectOverrides);
  useProjectStore.setState({
    bomItems: SAMPLE_BOM,
    currentProject: project,
    recentProjects: [project],
  });

  // Phase 3: Create quote
  const quoteResult = createQuoteFromProject(project);

  // Phase 4: Create contract
  const projectAfterQuote = useProjectStore.getState().currentProject!;
  const contractResult = createContractFromQuote(projectAfterQuote);

  // Get latest project state
  const updatedProject = useProjectStore.getState().currentProject!;
  return { project: updatedProject, quoteResult, contractResult };
}

describe('Phase 5 — createReceiptFromContract', () => {
  it('creates a receipt with correct PT-xxxx code', () => {
    const { project } = setupWithContract();
    const result = createReceiptFromContract(project);

    expect(result.success).toBe(true);
    expect(result.receiptCode).toMatch(/^PT-\d{4}$/);
    expect(result.receiptId).toBeTruthy();
  });

  it('auto-increments receipt code after seed data', () => {
    // Seed data has PT-0001 to PT-0003, so next = PT-0004
    const { project } = setupWithContract();
    const result = createReceiptFromContract(project);
    expect(result.receiptCode).toBe('PT-0004');
  });

  it('sets receipt amount to contract depositAmount', () => {
    const { project } = setupWithContract();
    createReceiptFromContract(project);

    const receipts = useThuChiStore.getState().receipts;
    const receipt = receipts[receipts.length - 1];
    const contracts = useBanHangStore.getState().contracts;
    const contract = contracts[contracts.length - 1];

    expect(receipt.amount).toBe(contract.depositAmount);
    expect(receipt.amount).toBe(Math.round(contract.totalAmount * 0.3));
  });

  it('links receipt to project and contract', () => {
    const { project, contractResult } = setupWithContract();
    createReceiptFromContract(project);

    const receipts = useThuChiStore.getState().receipts;
    const receipt = receipts[receipts.length - 1];

    expect(receipt.projectId).toBe(project.id);
    expect(receipt.contractId).toBe(contractResult.contractId);
    expect(receipt.contractCode).toBe(contractResult.contractCode);
  });

  it('copies customer info from contract', () => {
    const { project } = setupWithContract();
    createReceiptFromContract(project);

    const receipts = useThuChiStore.getState().receipts;
    const receipt = receipts[receipts.length - 1];

    expect(receipt.customerName).toBe('Nguyễn Văn P5');
    expect(receipt.customerId).toBeDefined();
  });

  it('sets status to confirmed', () => {
    const { project } = setupWithContract();
    createReceiptFromContract(project);

    const receipts = useThuChiStore.getState().receipts;
    const receipt = receipts[receipts.length - 1];

    expect(receipt.status).toBe('confirmed');
    expect(receipt.confirmedAt).toBeTruthy();
    expect(receipt.confirmedBy).toBe('NV P5');
  });

  it('sets description with contract info', () => {
    const { project } = setupWithContract();
    createReceiptFromContract(project);

    const receipts = useThuChiStore.getState().receipts;
    const receipt = receipts[receipts.length - 1];

    expect(receipt.description).toContain('30%');
    expect(receipt.description).toContain('HD-');
  });

  it('links receipt back to project (receiptId, receiptCode)', () => {
    const { project } = setupWithContract();
    const result = createReceiptFromContract(project);

    const updatedProject = useProjectStore.getState().currentProject;
    expect(updatedProject?.receiptId).toBe(result.receiptId);
    expect(updatedProject?.receiptCode).toBe(result.receiptCode);
  });

  it('fails when project has no contractId', () => {
    useBanHangStore.getState().resetAll();
    useThuChiStore.getState().resetAll();
    const project = makeProject({ contractId: undefined });
    useProjectStore.setState({ currentProject: project, recentProjects: [project] });

    const result = createReceiptFromContract(project);
    expect(result.success).toBe(false);
    expect(result.error).toContain('chưa có hợp đồng');
  });

  it('fails when contract not found in store', () => {
    useBanHangStore.getState().resetAll();
    useThuChiStore.getState().resetAll();
    const project = makeProject({ contractId: 'nonexistent-contract' });
    useProjectStore.setState({ currentProject: project, recentProjects: [project] });

    const result = createReceiptFromContract(project);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Không tìm thấy');
  });
});

describe('Phase 5 — computeProjectStatus with receipt', () => {
  it('returns create_receipt action when project is contracted', () => {
    const { project } = setupWithContract();

    const { computeProjectStatus } = require('../domain/computeProjectStatus');
    const result = computeProjectStatus(project);
    expect(result.status).toBe('contracted');
    expect(result.actionType).toBe('create_receipt');
    expect(result.actionLabel).toBe('Tạo phiếu thu');
  });

  it('returns deposited status after receipt is created', () => {
    const { project } = setupWithContract();
    createReceiptFromContract(project);

    const updatedProject = useProjectStore.getState().currentProject!;
    const { computeProjectStatus } = require('../domain/computeProjectStatus');
    const result = computeProjectStatus(updatedProject);
    expect(result.status).toBe('deposited');
    expect(result.actionType).toBe('create_production_order');
    expect(result.actionCode).toMatch(/^PT-\d{4}$/);
  });
});
