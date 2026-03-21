/**
 * Tests for Phase 4: createContractFromQuote
 *
 * Tests the Quote → Contract conversion, code generation,
 * and bidirectional linking (Contract ↔ ProjectInfo)
 */

import { createContractFromQuote } from '../domain/createContractFromQuote';
import { createQuoteFromProject } from '../domain/createQuoteFromProject';
import { useProjectStore } from '../store/projectStore';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import type { ProjectInfo, BomItem } from '../store/projectStore';

/** Helper: minimal ProjectInfo */
function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'proj-p4-1',
    name: 'Dự án Test P4',
    created: '2026-03-20T00:00:00Z',
    modified: '2026-03-20T00:00:00Z',
    status: 'draft',
    designRevision: 3,
    bomRevision: 1,
    bomDesignRevision: 3,
    isLocked: false,
    soLuongBo: 2,
    projectCode: 'DA 100',
    investor: 'Nguyễn Văn P4',
    employee: 'NV P4',
    ...overrides,
  };
}

const SAMPLE_BOM: BomItem[] = [
  {
    id: 'bom-p4-1',
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
    id: 'bom-p4-2',
    category: 'glass',
    code: 'GLASS-XF55',
    name: 'Kính cường lực',
    unit: 'm²',
    quantity: 2,
    unitPrice: 500000,
    totalPrice: 1000000,
  },
];

/** Setup: reset stores, create a quote first, then test contract */
function setupWithQuote(projectOverrides: Partial<ProjectInfo> = {}) {
  useBanHangStore.getState().resetAll();
  const project = makeProject(projectOverrides);
  useProjectStore.setState({
    bomItems: SAMPLE_BOM,
    currentProject: project,
    recentProjects: [project],
  });

  // Create quote via Phase 3 service
  const quoteResult = createQuoteFromProject(project);
  // Update project with quote link
  const updatedProject = useProjectStore.getState().currentProject!;
  return { project: updatedProject, quoteResult };
}

describe('Phase 4 — createContractFromQuote', () => {
  it('creates a contract with correct HD-xxxx code', () => {
    const { project } = setupWithQuote();
    const result = createContractFromQuote(project);

    expect(result.success).toBe(true);
    expect(result.contractCode).toMatch(/^HD-\d{4}$/);
    expect(result.contractCode).toBe('HD-0001');
    expect(result.contractId).toBeTruthy();
  });

  it('auto-increments contract code', () => {
    const { project: p1 } = setupWithQuote({ id: 'p4-a' });
    const r1 = createContractFromQuote(p1);
    expect(r1.contractCode).toBe('HD-0001');

    // Create second project with quote
    const p2 = makeProject({ id: 'p4-b' });
    useProjectStore.setState({
      bomItems: SAMPLE_BOM,
      currentProject: p2,
      recentProjects: [p1, p2],
    });
    createQuoteFromProject(p2);
    const p2Updated = useProjectStore.getState().currentProject!;
    const r2 = createContractFromQuote(p2Updated);
    expect(r2.contractCode).toBe('HD-0002');
  });

  it('copies items from quote to contract', () => {
    const { project } = setupWithQuote();
    createContractFromQuote(project);

    const contracts = useBanHangStore.getState().contracts;
    const contract = contracts[contracts.length - 1];
    expect(contract.items).toHaveLength(2);
    expect(contract.items[0].description).toBe('Thanh ngang');
    expect(contract.items[1].description).toBe('Kính cường lực');
  });

  it('copies totals from quote', () => {
    const { project } = setupWithQuote();
    createContractFromQuote(project);

    const contracts = useBanHangStore.getState().contracts;
    const contract = contracts[contracts.length - 1];
    expect(contract.subtotal).toBeGreaterThan(0);
    expect(contract.taxRate).toBe(10);
    expect(contract.totalAmount).toBeGreaterThan(0);
  });

  it('sets deposit to 30% of totalAmount', () => {
    const { project } = setupWithQuote();
    createContractFromQuote(project);

    const contracts = useBanHangStore.getState().contracts;
    const contract = contracts[contracts.length - 1];
    expect(contract.depositPercent).toBe(30);
    expect(contract.depositAmount).toBe(Math.round(contract.totalAmount * 0.3));
  });

  it('links contract to quote (quoteId, quoteCode)', () => {
    const { project, quoteResult } = setupWithQuote();
    createContractFromQuote(project);

    const contracts = useBanHangStore.getState().contracts;
    const contract = contracts[contracts.length - 1];
    expect(contract.quoteId).toBe(quoteResult.quoteId);
    expect(contract.quoteCode).toBe(quoteResult.quoteCode);
    expect(contract.projectId).toBe(project.id);
  });

  it('sets designRevision and customer info from project', () => {
    const { project } = setupWithQuote({ designRevision: 7 });
    createContractFromQuote(project);

    const contracts = useBanHangStore.getState().contracts;
    const contract = contracts[contracts.length - 1];
    expect(contract.designRevision).toBe(7);
    expect(contract.customerName).toBe('Nguyễn Văn P4');
  });

  it('links contract back to project (contractId, contractCode)', () => {
    const { project } = setupWithQuote();
    const result = createContractFromQuote(project);

    const updatedProject = useProjectStore.getState().currentProject;
    expect(updatedProject?.contractId).toBe(result.contractId);
    expect(updatedProject?.contractCode).toBe(result.contractCode);
  });

  it('sets status to signed', () => {
    const { project } = setupWithQuote();
    createContractFromQuote(project);

    const contracts = useBanHangStore.getState().contracts;
    const contract = contracts[contracts.length - 1];
    expect(contract.status).toBe('signed');
    expect(contract.signedAt).toBeTruthy();
  });

  it('fails when project has no quoteId', () => {
    useBanHangStore.getState().resetAll();
    const project = makeProject({ quoteId: undefined });
    useProjectStore.setState({ currentProject: project, recentProjects: [project] });

    const result = createContractFromQuote(project);
    expect(result.success).toBe(false);
    expect(result.error).toContain('chưa có báo giá');
  });

  it('fails when quote not found in store', () => {
    useBanHangStore.getState().resetAll();
    const project = makeProject({ quoteId: 'nonexistent-quote' });
    useProjectStore.setState({ currentProject: project, recentProjects: [project] });

    const result = createContractFromQuote(project);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Không tìm thấy');
  });
});

describe('Phase 4 — computeProjectStatus with contract', () => {
  it('returns create_contract action when project is quoted', () => {
    // This is tested in computeProjectStatus.test.ts
    // Verify the flow: quote created → status becomes quoted → action = create_contract
    const { project } = setupWithQuote();

    // Import and check
    const { computeProjectStatus } = require('../domain/computeProjectStatus');
    const result = computeProjectStatus(project);
    expect(result.status).toBe('quoted');
    expect(result.actionType).toBe('create_contract');
    expect(result.actionLabel).toBe('Tạo hợp đồng');
  });

  it('returns contracted status after contract is created', () => {
    const { project } = setupWithQuote();
    createContractFromQuote(project);

    const updatedProject = useProjectStore.getState().currentProject!;
    const { computeProjectStatus } = require('../domain/computeProjectStatus');
    const result = computeProjectStatus(updatedProject);
    expect(result.status).toBe('contracted');
    expect(result.actionType).toBe('create_receipt');
    expect(result.actionCode).toMatch(/^HD-\d{4}$/);
  });
});
