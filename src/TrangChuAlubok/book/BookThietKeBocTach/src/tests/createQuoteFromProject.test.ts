/**
 * Tests for Phase 3: createQuoteFromProject + updateQuoteFromProject
 *
 * Tests the BOM → Quote conversion logic, code generation,
 * and bidirectional linking (Quote ↔ ProjectInfo)
 */

import { createQuoteFromProject, updateQuoteFromProject } from '../domain/createQuoteFromProject';
import { useProjectStore } from '../store/projectStore';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import type { ProjectInfo, BomItem } from '../store/projectStore';

// Helper: minimal ProjectInfo
function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'proj-test-1',
    name: 'Dự án Test P3',
    created: '2026-03-20T00:00:00Z',
    modified: '2026-03-20T00:00:00Z',
    status: 'draft',
    designRevision: 3,
    bomRevision: 1,
    bomDesignRevision: 3,
    isLocked: false,
    soLuongBo: 2,
    projectCode: 'DA 99',
    investor: 'Nguyễn Văn Test',
    employee: 'NV Test',
    ...overrides,
  };
}

// Helper: sample BOM items
const SAMPLE_BOM: BomItem[] = [
  {
    id: 'bom-1',
    category: 'aluminum',
    code: 'FRAME-H-XF55',
    name: 'Thanh ngang cửa sổ',
    unit: 'thanh',
    quantity: 2,
    length: 1200,
    unitPrice: 54000,
    totalPrice: 108000,
    notes: '1200mm',
  },
  {
    id: 'bom-2',
    category: 'glass',
    code: 'GLASS-XF55',
    name: 'Kính cửa sổ',
    unit: 'm²',
    quantity: 1,
    length: 1100,
    height: 1300,
    unitPrice: 500500,
    totalPrice: 500500,
    notes: '1 tấm — 1100×1300mm',
  },
  {
    id: 'bom-3',
    category: 'accessory',
    code: 'ACC-hinged',
    name: 'Phụ kiện cửa sổ',
    unit: 'bộ',
    quantity: 5,
    unitPrice: 120000,
    totalPrice: 600000,
    notes: 'Bản lề, tay nắm, khóa',
  },
];

describe('Phase 3 — createQuoteFromProject', () => {
  beforeEach(() => {
    // Reset stores
    useBanHangStore.getState().resetAll();
    // Clear project store BOM items
    useProjectStore.setState({
      bomItems: SAMPLE_BOM,
      currentProject: makeProject(),
      recentProjects: [makeProject()],
    });
  });

  it('creates a quote with correct BG-xxxx code', () => {
    const project = makeProject();
    const result = createQuoteFromProject(project);

    expect(result.success).toBe(true);
    expect(result.quoteCode).toMatch(/^BG-\d{4}$/);
    expect(result.quoteId).toBeTruthy();
  });

  it('auto-increments quote code beyond existing', () => {
    // Store already has BG-0001, BG-0002, BG-0003 (seed data)
    const project = makeProject();
    const result = createQuoteFromProject(project);

    expect(result.success).toBe(true);
    expect(result.quoteCode).toBe('BG-0004'); // next after seed
  });

  it('converts BOM items to QuoteItems correctly', () => {
    const project = makeProject();
    createQuoteFromProject(project);

    const quotes = useBanHangStore.getState().quotes;
    const newQuote = quotes.find((q) => q.projectId === project.id);
    expect(newQuote).toBeTruthy();
    expect(newQuote!.items).toHaveLength(3);

    // First item: aluminum bar
    expect(newQuote!.items[0].description).toBe('Thanh ngang cửa sổ');
    expect(newQuote!.items[0].quantity).toBe(2);
    expect(newQuote!.items[0].unitPrice).toBe(54000);
    expect(newQuote!.items[0].amount).toBe(108000);
    expect(newQuote!.items[0].bomRef).toBe('bom-1');
  });

  it('sets projectId and designRevision on quote', () => {
    const project = makeProject({ designRevision: 7 });
    useProjectStore.setState({ bomItems: SAMPLE_BOM, currentProject: project, recentProjects: [project] });
    createQuoteFromProject(project);

    const quotes = useBanHangStore.getState().quotes;
    const newQuote = quotes.find((q) => q.projectId === project.id);
    expect(newQuote!.projectId).toBe(project.id);
    expect(newQuote!.designRevision).toBe(7);
    expect(newQuote!.projectRef).toBe('DA 99');
    expect(newQuote!.customerName).toBe('Nguyễn Văn Test');
  });

  it('links quote back to project (quoteId, quoteCode, quoteDesignRevision)', () => {
    const project = makeProject({ designRevision: 5 });
    useProjectStore.setState({ bomItems: SAMPLE_BOM, currentProject: project, recentProjects: [project] });
    const result = createQuoteFromProject(project);

    const updatedProject = useProjectStore.getState().currentProject;
    expect(updatedProject?.quoteId).toBe(result.quoteId);
    expect(updatedProject?.quoteCode).toBe(result.quoteCode);
    expect(updatedProject?.quoteDesignRevision).toBe(5);
  });

  it('calculates totals correctly (subtotal, tax, total)', () => {
    createQuoteFromProject(makeProject());

    const quotes = useBanHangStore.getState().quotes;
    const newQuote = quotes.find((q) => q.projectId === 'proj-test-1');
    // subtotal = 108000 + 500500 + 600000 = 1208500
    expect(newQuote!.subtotal).toBe(1208500);
    expect(newQuote!.taxRate).toBe(10);
    // tax = 1208500 * 0.1 = 120850
    expect(newQuote!.taxAmount).toBe(120850);
    // total = 1208500 + 120850 = 1329350
    expect(newQuote!.totalAmount).toBe(1329350);
  });

  it('fails when BOM is empty', () => {
    useProjectStore.setState({ bomItems: [] });
    const result = createQuoteFromProject(makeProject());
    expect(result.success).toBe(false);
    expect(result.error).toContain('BOM');
  });

  it('sets status to draft and validity to 30 days', () => {
    createQuoteFromProject(makeProject());

    const quotes = useBanHangStore.getState().quotes;
    const newQuote = quotes.find((q) => q.projectId === 'proj-test-1');
    expect(newQuote!.status).toBe('draft');
    // validUntil should be ~30 days from now
    const valid = new Date(newQuote!.validUntil);
    const now = new Date();
    const diffDays = (valid.getTime() - now.getTime()) / 86_400_000;
    expect(diffDays).toBeGreaterThan(28);
    expect(diffDays).toBeLessThan(32);
  });
});

describe('Phase 3 — updateQuoteFromProject', () => {
  beforeEach(() => {
    useBanHangStore.getState().resetAll();
    useProjectStore.setState({
      bomItems: SAMPLE_BOM,
      currentProject: makeProject({ quoteId: 'q3', quoteCode: 'BG-0003', quoteDesignRevision: 1 }),
      recentProjects: [makeProject({ quoteId: 'q3', quoteCode: 'BG-0003', quoteDesignRevision: 1 })],
    });
  });

  it('updates existing quote with new BOM data', () => {
    const project = makeProject({ quoteId: 'q3', quoteCode: 'BG-0003', designRevision: 5 });
    useProjectStore.setState({ currentProject: project, recentProjects: [project] });

    const result = updateQuoteFromProject(project);
    expect(result.success).toBe(true);
    expect(result.quoteCode).toBe('BG-0003');

    const updated = useBanHangStore.getState().quotes.find((q) => q.quoteId === 'q3');
    expect(updated!.items).toHaveLength(3); // our BOM items
    expect(updated!.designRevision).toBe(5);
    expect(updated!.status).toBe('draft'); // reset to draft
  });

  it('updates quoteDesignRevision on project', () => {
    const project = makeProject({ quoteId: 'q3', quoteCode: 'BG-0003', designRevision: 8 });
    useProjectStore.setState({ bomItems: SAMPLE_BOM, currentProject: project, recentProjects: [project] });

    updateQuoteFromProject(project);

    const updatedProject = useProjectStore.getState().currentProject;
    expect(updatedProject?.quoteDesignRevision).toBe(8);
  });

  it('fails when no quoteId on project', () => {
    const project = makeProject({ quoteId: undefined });
    useProjectStore.setState({ currentProject: project, recentProjects: [project] });

    const result = updateQuoteFromProject(project);
    expect(result.success).toBe(false);
    expect(result.error).toContain('chưa có báo giá');
  });

  it('fails when BOM is empty', () => {
    useProjectStore.setState({ bomItems: [] });
    const project = makeProject({ quoteId: 'q3' });
    const result = updateQuoteFromProject(project);
    expect(result.success).toBe(false);
    expect(result.error).toContain('BOM');
  });
});

describe('Phase 3 — Quote code generation', () => {
  beforeEach(() => {
    useBanHangStore.getState().resetAll();
    useProjectStore.setState({ bomItems: SAMPLE_BOM, currentProject: makeProject(), recentProjects: [makeProject()] });
  });

  it('generates sequential codes: BG-0004, BG-0005, BG-0006...', () => {
    // Seed has BG-0001, BG-0002, BG-0003
    const r1 = createQuoteFromProject(makeProject({ id: 'p1' }));
    expect(r1.quoteCode).toBe('BG-0004');

    useProjectStore.setState({ bomItems: SAMPLE_BOM, currentProject: makeProject({ id: 'p2' }), recentProjects: [makeProject({ id: 'p2' })] });
    const r2 = createQuoteFromProject(makeProject({ id: 'p2' }));
    expect(r2.quoteCode).toBe('BG-0005');
  });
});
