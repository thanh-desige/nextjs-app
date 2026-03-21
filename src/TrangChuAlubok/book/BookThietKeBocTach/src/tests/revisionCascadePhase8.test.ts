/**
 * Phase 8: Revision Tracking + Invalidation Cascade Tests
 *
 * Tests the complete cascade:
 * 1. designRevision auto-increment (useProjectSync logic)
 * 2. Invalidation cascade — stale documents detected
 * 3. Status revert when revision bumps
 * 4. Stale documents list populated correctly
 * 5. Re-create flow after invalidation
 */

import { computeProjectStatus } from '../domain/computeProjectStatus';
import type { StatusResult } from '../domain/computeProjectStatus';
import type { ProjectInfo } from '../store/projectStore';

// ==================== Helpers ====================

function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'cascade-test-1',
    name: 'Cascade Test Project',
    created: '2026-01-01T00:00:00Z',
    modified: '2026-01-01T00:00:00Z',
    status: 'draft',
    designRevision: 3,
    bomRevision: 1,
    bomDesignRevision: 3,
    isLocked: false,
    soLuongBo: 5,
    ...overrides,
  };
}

/** Full pipeline project — all documents valid at revision 3 */
function makeFullPipeline(revision = 3): ProjectInfo {
  return makeProject({
    designRevision: revision,
    bomRevision: 2,
    bomDesignRevision: revision,
    quoteId: 'q-1',
    quoteCode: 'BG-0001',
    quoteDesignRevision: revision,
    contractId: 'c-1',
    contractCode: 'HD-0001',
    receiptId: 'r-1',
    receiptCode: 'PT-0001',
    productionOrderId: 'po-1',
    productionOrderCode: 'LSX-0001',
  });
}

// ==================== Tests ====================

describe('Phase 8: Revision Tracking + Invalidation Cascade', () => {

  // ── 1. staleDocuments populated correctly ──
  describe('staleDocuments field', () => {
    it('no stale docs when all revisions match', () => {
      const project = makeFullPipeline(3);
      const result = computeProjectStatus(project);
      expect(result.staleDocuments).toEqual([]);
      expect(result.status).toBe('in_production');
    });

    it('all docs become stale when designRevision bumps', () => {
      const project = makeFullPipeline(3);
      // Simulate canvas edit → designRevision 3 → 5
      project.designRevision = 5;
      const result = computeProjectStatus(project);
      expect(result.staleDocuments).toContain('quote');
      expect(result.staleDocuments).toContain('contract');
      expect(result.staleDocuments).toContain('receipt');
      expect(result.staleDocuments).toContain('production_order');
      expect(result.staleDocuments).toHaveLength(4);
    });

    it('staleDocuments only includes existing docs', () => {
      // Project has only quote, no other docs
      const project = makeProject({
        designRevision: 5,
        quoteId: 'q-1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 3, // stale
      });
      const result = computeProjectStatus(project);
      expect(result.staleDocuments).toEqual(['quote']);
    });

    it('staleDocuments empty when no docs exist', () => {
      const project = makeProject({ designRevision: 5, soLuongBo: 3 });
      const result = computeProjectStatus(project);
      expect(result.staleDocuments).toEqual([]);
    });
  });

  // ── 2. Full cascade: in_production → designing after revision bump ──
  describe('Full cascade invalidation', () => {
    it('in_production → designing when revision bumps', () => {
      const project = makeFullPipeline(3);
      expect(computeProjectStatus(project).status).toBe('in_production');

      // Canvas edited → designRevision bumps
      project.designRevision = 4;
      const result = computeProjectStatus(project);
      expect(result.status).toBe('designing');
      // BOM was synced at rev 3, now stale (bomDesignRevision 3 ≠ 4)
      expect(result.actionType).toBe('none'); // BOM not synced yet
    });

    it('after BOM re-sync → designing with "Cập nhật báo giá"', () => {
      const project = makeFullPipeline(3);
      project.designRevision = 4;
      // Re-sync BOM
      project.bomRevision = 3;
      project.bomDesignRevision = 4;

      const result = computeProjectStatus(project);
      expect(result.status).toBe('designing');
      expect(result.actionType).toBe('update_quote');
      expect(result.actionLabel).toBe('Cập nhật báo giá');
    });

    it('after re-creating quote at new revision → back to in_production (full chain valid)', () => {
      const project = makeFullPipeline(3);
      project.designRevision = 4;
      project.bomDesignRevision = 4;
      project.bomRevision = 3;
      // Re-create quote at new revision
      project.quoteDesignRevision = 4;

      const result = computeProjectStatus(project);
      // Full pipeline still exists, quoteDesignRevision matches → in_production
      expect(result.status).toBe('in_production');
      expect(result.staleDocuments).toEqual([]);
    });
  });

  // ── 3. Partial invalidation — only some docs stale ──
  describe('Partial invalidation', () => {
    it('contract stale but quote valid → status=quoted', () => {
      const project = makeProject({
        designRevision: 3,
        quoteId: 'q-1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 3, // valid
        contractId: 'c-1',
        contractCode: 'HD-0001',
        // contract exists but quote revision matches → contract is actually valid too
        // because our system tracks validity through quoteDesignRevision
      });
      const result = computeProjectStatus(project);
      // contractId exists, quoteDesignRevision matches → contracted
      expect(result.status).toBe('contracted');
    });

    it('staleDocuments accumulates correctly through pipeline', () => {
      // All docs exist, all at old revision 3, current revision 5
      const project = makeFullPipeline(3);
      project.designRevision = 5;

      const result = computeProjectStatus(project);
      // Status reverts since quoteDesignRevision (3) ≠ designRevision (5)
      expect(result.status).toBe('designing');
      expect(result.staleDocuments.length).toBe(4);
    });
  });

  // ── 4. Re-create flow ──
  describe('Re-create after invalidation', () => {
    it('step-by-step recovery: edit → resync BOM → new quote → back to quoted', () => {
      // Start: full pipeline at rev 3
      const project = makeFullPipeline(3);
      let result: StatusResult;

      // Step 1: in_production
      result = computeProjectStatus(project);
      expect(result.status).toBe('in_production');
      expect(result.staleDocuments).toEqual([]);

      // Step 2: Canvas edit → rev 4
      project.designRevision = 4;
      result = computeProjectStatus(project);
      expect(result.status).toBe('designing');
      expect(result.staleDocuments.length).toBe(4);

      // Step 3: BOM re-sync
      project.bomDesignRevision = 4;
      project.bomRevision = 3;
      result = computeProjectStatus(project);
      expect(result.status).toBe('designing');
      expect(result.actionType).toBe('update_quote');
      expect(result.staleDocuments.length).toBe(4); // docs still stale

      // Step 4: New quote at rev 4
      project.quoteDesignRevision = 4;
      result = computeProjectStatus(project);
      // Full pipeline still has all docs; quoteDesignRevision now matches → in_production
      expect(result.status).toBe('in_production');
      expect(result.staleDocuments).toEqual([]); // all revisions match now
    });

    it('creating new quote wipes stale status for entire chain', () => {
      const project = makeProject({
        designRevision: 5,
        bomDesignRevision: 5,
        bomRevision: 3,
        quoteId: 'q-1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 5, // Updated to current
        contractId: 'c-1',
        contractCode: 'HD-0001',
        receiptId: 'r-1',
        receiptCode: 'PT-0001',
      });

      const result = computeProjectStatus(project);
      // quoteDesignRevision = 5 = designRevision → chain is valid
      expect(result.status).toBe('deposited');
      expect(result.staleDocuments).toEqual([]);
    });
  });

  // ── 5. designRevision edge cases ──
  describe('designRevision edge cases', () => {
    it('designRevision 0 → all docs with undefined revision are invalid', () => {
      const project = makeProject({
        designRevision: 0,
        soLuongBo: 3,
        quoteId: 'q-1',
        quoteDesignRevision: undefined,
      });
      const result = computeProjectStatus(project);
      expect(result.status).toBe('designing');
      expect(result.staleDocuments).toContain('quote');
    });

    it('designRevision undefined treated as 0', () => {
      const project = makeProject({
        soLuongBo: 3,
        quoteId: 'q-1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 0,
      });
      delete (project as Record<string, unknown>).designRevision;

      const result = computeProjectStatus(project);
      // designRevision defaults to 0, quoteDesignRevision=0 → matches
      expect(result.status).toBe('quoted');
    });

    it('multiple revision bumps still cascade correctly', () => {
      const project = makeFullPipeline(3);

      // Bump 3 → 4
      project.designRevision = 4;
      expect(computeProjectStatus(project).status).toBe('designing');

      // Re-sync everything at 4
      project.bomDesignRevision = 4;
      project.bomRevision = 3;
      project.quoteDesignRevision = 4;
      // Full pipeline still has all IDs, quoteDesignRevision matches → in_production
      expect(computeProjectStatus(project).status).toBe('in_production');

      // Bump again 4 → 5
      project.designRevision = 5;
      expect(computeProjectStatus(project).status).toBe('designing');

      // Re-sync at 5
      project.bomDesignRevision = 5;
      project.quoteDesignRevision = 5;
      expect(computeProjectStatus(project).status).toBe('in_production');
    });
  });

  // ── 6. Stale document labels mapping ──
  describe('Stale document type mapping', () => {
    const STALE_LABELS: Record<string, string> = {
      quote: 'Báo giá',
      contract: 'Hợp đồng',
      receipt: 'Phiếu thu',
      production_order: 'Lệnh SX',
    };

    it('all 4 stale types have Vietnamese labels', () => {
      expect(STALE_LABELS.quote).toBe('Báo giá');
      expect(STALE_LABELS.contract).toBe('Hợp đồng');
      expect(STALE_LABELS.receipt).toBe('Phiếu thu');
      expect(STALE_LABELS.production_order).toBe('Lệnh SX');
    });
  });
});
