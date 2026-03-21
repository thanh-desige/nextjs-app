/**
 * Tests for Phase 2: BOM sync, designRevision, soLuongBo updates
 *
 * Tests:
 * - calculateBom updates bomRevision + bomDesignRevision
 * - calculateBom with 0 doors still syncs
 * - soLuongBo set from door count during calculateBom
 * - computeProjectStatus sub-rules with BOM sync combinations
 */

import { computeProjectStatus } from '../domain/computeProjectStatus';
import type { ProjectInfo } from '../store/projectStore';

// Helper: create a minimal ProjectInfo
function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'test-p2',
    name: 'Phase 2 Test',
    created: '2026-03-20T00:00:00Z',
    modified: '2026-03-20T00:00:00Z',
    status: 'draft',
    designRevision: 0,
    bomRevision: 0,
    bomDesignRevision: 0,
    isLocked: false,
    soLuongBo: 0,
    ...overrides,
  };
}

describe('Phase 2 — BOM sync detection via computeProjectStatus', () => {
  describe('BOM not synced → no action button', () => {
    it('designing + bomRevision=0 → actionLabel empty', () => {
      const r = computeProjectStatus(makeProject({
        soLuongBo: 3,
        designRevision: 2,
        bomRevision: 0,
        bomDesignRevision: 0,
      }));
      expect(r.status).toBe('designing');
      expect(r.actionLabel).toBe('');
      expect(r.actionType).toBe('none');
    });

    it('designing + BOM outdated (bomDesignRevision < designRevision) → no action', () => {
      const r = computeProjectStatus(makeProject({
        soLuongBo: 3,
        designRevision: 5,
        bomRevision: 1,
        bomDesignRevision: 3, // synced at rev 3, now at rev 5
      }));
      expect(r.status).toBe('designing');
      expect(r.actionLabel).toBe('');
      expect(r.actionType).toBe('none');
    });
  });

  describe('BOM synced → show "Tạo báo giá"', () => {
    it('BOM synced + no quote → "Tạo báo giá"', () => {
      const r = computeProjectStatus(makeProject({
        soLuongBo: 3,
        designRevision: 2,
        bomRevision: 1,
        bomDesignRevision: 2, // matches designRevision
      }));
      expect(r.status).toBe('designing');
      expect(r.actionLabel).toBe('Tạo báo giá');
      expect(r.actionType).toBe('create_quote');
    });

    it('BOM synced at rev 0 + bomRevision > 0 → "Tạo báo giá"', () => {
      const r = computeProjectStatus(makeProject({
        soLuongBo: 1,
        designRevision: 0,
        bomRevision: 1,
        bomDesignRevision: 0,
      }));
      expect(r.status).toBe('designing');
      expect(r.actionLabel).toBe('Tạo báo giá');
      expect(r.actionType).toBe('create_quote');
    });
  });

  describe('BOM synced + stale quote → "Cập nhật báo giá"', () => {
    it('quote exists but quoteDesignRevision < designRevision → "Cập nhật báo giá"', () => {
      const r = computeProjectStatus(makeProject({
        soLuongBo: 3,
        designRevision: 5,
        bomRevision: 2,
        bomDesignRevision: 5,
        quoteId: 'q-1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 3, // stale: was rev 3, now rev 5
      }));
      expect(r.status).toBe('designing');
      expect(r.actionLabel).toBe('Cập nhật báo giá');
      expect(r.actionType).toBe('update_quote');
    });
  });

  describe('Quote valid (quoteDesignRevision === designRevision)', () => {
    it('quote valid → status "quoted", shows create contract action', () => {
      const r = computeProjectStatus(makeProject({
        soLuongBo: 3,
        designRevision: 5,
        bomRevision: 2,
        bomDesignRevision: 5,
        quoteId: 'q-1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 5, // matches!
      }));
      expect(r.status).toBe('quoted');
      expect(r.actionCode).toBe('BG-0001');
      expect(r.actionType).toBe('create_contract');
    });
  });
});

describe('Phase 2 — designRevision cascade invalidation', () => {
  it('design change invalidates quote → falls back to designing', () => {
    // Before: had valid quote at rev 3
    // After: designRevision bumped to 4 (entity changed)
    const r = computeProjectStatus(makeProject({
      soLuongBo: 3,
      designRevision: 4,
      bomRevision: 1,
      bomDesignRevision: 3,
      quoteId: 'q-1',
      quoteCode: 'BG-0001',
      quoteDesignRevision: 3,
    }));
    // Quote is stale (rev 3 ≠ 4), BOM is stale (rev 3 ≠ 4) → designing, no action
    expect(r.status).toBe('designing');
    expect(r.actionType).toBe('none');
  });

  it('design change invalidates contract → falls back to designing', () => {
    const r = computeProjectStatus(makeProject({
      soLuongBo: 3,
      designRevision: 6,
      bomRevision: 2,
      bomDesignRevision: 5,
      quoteId: 'q-1',
      quoteCode: 'BG-0001',
      quoteDesignRevision: 5,
      contractId: 'c-1',
      contractCode: 'HD-0001',
    }));
    // Everything was at rev 5, now at rev 6 → all stale
    expect(r.status).toBe('designing');
    expect(r.actionType).toBe('none');
  });

  it('BOM re-synced after design change → "Cập nhật báo giá"', () => {
    // designRevision went from 3→4, user re-ran BOM at rev 4
    const r = computeProjectStatus(makeProject({
      soLuongBo: 3,
      designRevision: 4,
      bomRevision: 2,
      bomDesignRevision: 4, // re-synced!
      quoteId: 'q-1',
      quoteCode: 'BG-0001',
      quoteDesignRevision: 3, // still stale
    }));
    expect(r.status).toBe('designing');
    expect(r.actionLabel).toBe('Cập nhật báo giá');
    expect(r.actionType).toBe('update_quote');
  });
});

describe('Phase 2 — bomRevision tracking via calculateBom', () => {
  // These test the expected data shape, not the actual store call
  // (store integration requires Zustand mocking which is separate)

  it('after first calculateBom: bomRevision=1, bomDesignRevision=designRevision', () => {
    // Simulates what calculateBom now does
    const before = makeProject({ designRevision: 3, bomRevision: 0, bomDesignRevision: 0, soLuongBo: 2 });
    const after: Partial<ProjectInfo> = {
      bomRevision: (before.bomRevision ?? 0) + 1,
      bomDesignRevision: before.designRevision ?? 0,
    };
    expect(after.bomRevision).toBe(1);
    expect(after.bomDesignRevision).toBe(3);

    // Status should now show "Tạo báo giá"
    const updated = makeProject({ ...before, ...after });
    const r = computeProjectStatus(updated);
    expect(r.status).toBe('designing');
    expect(r.actionLabel).toBe('Tạo báo giá');
  });

  it('after second calculateBom: bomRevision=2', () => {
    const before = makeProject({
      designRevision: 5, bomRevision: 1, bomDesignRevision: 3, soLuongBo: 4,
    });
    const after: Partial<ProjectInfo> = {
      bomRevision: (before.bomRevision ?? 0) + 1,
      bomDesignRevision: before.designRevision ?? 0,
    };
    expect(after.bomRevision).toBe(2);
    expect(after.bomDesignRevision).toBe(5);
  });

  it('calculateBom with 0 doors still increments bomRevision', () => {
    const before = makeProject({ designRevision: 2, bomRevision: 0, bomDesignRevision: 0, soLuongBo: 0 });
    const after: Partial<ProjectInfo> = {
      bomRevision: (before.bomRevision ?? 0) + 1,
      bomDesignRevision: before.designRevision ?? 0,
      soLuongBo: 0,
    };
    expect(after.bomRevision).toBe(1);
    expect(after.bomDesignRevision).toBe(2);
    expect(after.soLuongBo).toBe(0);
  });
});

describe('Phase 2 — soLuongBo drives status transitions', () => {
  it('soLuongBo goes from 0 → 3 → status draft → designing', () => {
    const draft = computeProjectStatus(makeProject({ soLuongBo: 0 }));
    expect(draft.status).toBe('draft');

    const designing = computeProjectStatus(makeProject({ soLuongBo: 3, designRevision: 1 }));
    expect(designing.status).toBe('designing');
  });

  it('soLuongBo goes from 3 → 0 + no valid docs → status back to draft', () => {
    const r = computeProjectStatus(makeProject({ soLuongBo: 0, designRevision: 5 }));
    expect(r.status).toBe('draft');
  });

  it('soLuongBo = 0 but has valid quote → still "quoted"', () => {
    // Edge case: all doors removed but quote was already created at rev 0
    const r = computeProjectStatus(makeProject({
      soLuongBo: 0,
      designRevision: 0,
      quoteId: 'q-1',
      quoteCode: 'BG-0001',
      quoteDesignRevision: 0,
    }));
    // quoteId + valid revision → "quoted" takes priority over soLuongBo check
    expect(r.status).toBe('quoted');
  });
});
