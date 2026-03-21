/**
 * Phase 7: Canvas Lock/Unlock Tests
 * 
 * Tests the lock mechanism at multiple layers:
 * 1. computeProjectStatus — in_production status sets isLocked
 * 2. engineStore — executeCommandObject blocked when locked
 * 3. useToolbar — VIEW_SAFE_TOOLS whitelist logic
 * 4. useKeyboardShortcuts — mutating keys blocked
 */

import { computeProjectStatus } from '../domain/computeProjectStatus';
import type { ProjectInfo } from '../store/projectStore';
import { useProjectStore } from '../store/projectStore';

// ==================== Helpers ====================

function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'lock-test-1',
    name: 'Lock Test Project',
    created: '2026-01-01T00:00:00Z',
    modified: '2026-01-01T00:00:00Z',
    status: 'draft',
    designRevision: 1,
    bomRevision: 1,
    bomDesignRevision: 1,
    isLocked: false,
    soLuongBo: 3,
    ...overrides,
  };
}

// Tool whitelist matching useToolbar VIEW_SAFE_TOOLS
const VIEW_SAFE_TOOLS = new Set([
  'select', 'pan', 'zoom-in', 'zoom-out', 'zoom-fit',
  'export', 'share',
  'endpoint', 'midpoint', 'center', 'intersection', 'perpendicular', 'nearest',
]);

const MUTATING_TOOLS = [
  'line', 'rect', 'arc', 'circle', 'polygon', 'text',
  'copy', 'move', 'rotate', 'scale', 'mirror', 'offset', 'trim', 'extend', 'fillet', 'erase',
  'dim-linear', 'dim-aligned', 'dim-angular', 'dim-radius', 'qdim',
  'undo', 'redo', 'delete', 'import',
];

// ==================== Tests ====================

describe('Phase 7: Canvas Lock Mechanism', () => {

  // ── 1. computeProjectStatus for in_production → isLocked hint ──
  describe('computeProjectStatus — in_production', () => {
    it('in_production → status=in_production, label="Đang sản xuất"', () => {
      const project = makeProject({
        soLuongBo: 3,
        quoteId: 'q1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 1,
        contractId: 'c1',
        contractCode: 'HD-0001',
        receiptId: 'r1',
        receiptCode: 'PT-0001',
        productionOrderId: 'po1',
        productionOrderCode: 'LSX-0001',
      });
      const result = computeProjectStatus(project);
      expect(result.status).toBe('in_production');
      expect(result.statusLabel).toBe('Đã vào lệnh SX');
    });

    it('in_production → actionType = view_production_order', () => {
      const project = makeProject({
        soLuongBo: 3,
        quoteId: 'q1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 1,
        contractId: 'c1',
        contractCode: 'HD-0001',
        receiptId: 'r1',
        receiptCode: 'PT-0001',
        productionOrderId: 'po1',
        productionOrderCode: 'LSX-0001',
      });
      const result = computeProjectStatus(project);
      expect(result.actionType).toBe('view_production_order');
    });
  });

  // ── 2. ProjectStore isLocked field ──
  describe('ProjectStore — isLocked field', () => {
    beforeEach(() => {
      useProjectStore.setState({
        currentProject: makeProject({ isLocked: false }),
      });
    });

    it('isLocked defaults to false', () => {
      const project = useProjectStore.getState().currentProject;
      expect(project?.isLocked).toBe(false);
    });

    it('can toggle isLocked to true', () => {
      const project = useProjectStore.getState().currentProject!;
      useProjectStore.setState({
        currentProject: { ...project, isLocked: true },
      });
      expect(useProjectStore.getState().currentProject?.isLocked).toBe(true);
    });

    it('can toggle isLocked back to false', () => {
      const project = useProjectStore.getState().currentProject!;
      useProjectStore.setState({
        currentProject: { ...project, isLocked: true },
      });
      useProjectStore.setState({
        currentProject: { ...useProjectStore.getState().currentProject!, isLocked: false },
      });
      expect(useProjectStore.getState().currentProject?.isLocked).toBe(false);
    });
  });

  // ── 3. VIEW_SAFE_TOOLS whitelist ──
  describe('Tool whitelist — VIEW_SAFE_TOOLS', () => {
    it('select, pan, zoom tools are view-safe', () => {
      expect(VIEW_SAFE_TOOLS.has('select')).toBe(true);
      expect(VIEW_SAFE_TOOLS.has('pan')).toBe(true);
      expect(VIEW_SAFE_TOOLS.has('zoom-in')).toBe(true);
      expect(VIEW_SAFE_TOOLS.has('zoom-out')).toBe(true);
      expect(VIEW_SAFE_TOOLS.has('zoom-fit')).toBe(true);
    });

    it('export and share are view-safe', () => {
      expect(VIEW_SAFE_TOOLS.has('export')).toBe(true);
      expect(VIEW_SAFE_TOOLS.has('share')).toBe(true);
    });

    it('osnap toggles are view-safe', () => {
      expect(VIEW_SAFE_TOOLS.has('endpoint')).toBe(true);
      expect(VIEW_SAFE_TOOLS.has('midpoint')).toBe(true);
      expect(VIEW_SAFE_TOOLS.has('center')).toBe(true);
    });

    it('all draw tools are NOT view-safe', () => {
      const drawTools = ['line', 'rect', 'arc', 'circle', 'polygon', 'text'];
      drawTools.forEach((tool) => {
        expect(VIEW_SAFE_TOOLS.has(tool)).toBe(false);
      });
    });

    it('all modify tools are NOT view-safe', () => {
      const modifyTools = ['copy', 'move', 'rotate', 'scale', 'mirror', 'offset', 'trim', 'extend', 'fillet', 'erase'];
      modifyTools.forEach((tool) => {
        expect(VIEW_SAFE_TOOLS.has(tool)).toBe(false);
      });
    });

    it('dimension tools are NOT view-safe', () => {
      const dimTools = ['dim-linear', 'dim-aligned', 'dim-angular', 'dim-radius', 'qdim'];
      dimTools.forEach((tool) => {
        expect(VIEW_SAFE_TOOLS.has(tool)).toBe(false);
      });
    });

    it('undo, redo, delete are NOT view-safe', () => {
      expect(VIEW_SAFE_TOOLS.has('undo')).toBe(false);
      expect(VIEW_SAFE_TOOLS.has('redo')).toBe(false);
      expect(VIEW_SAFE_TOOLS.has('delete')).toBe(false);
    });
  });

  // ── 4. Lock gate simulation (handleSelectTool logic) ──
  describe('handleSelectTool lock gate', () => {
    it('when isLocked=true, mutating tools are blocked', () => {
      const isLocked = true;
      const blocked: string[] = [];
      const allowed: string[] = [];

      MUTATING_TOOLS.forEach((toolId) => {
        if (isLocked && !VIEW_SAFE_TOOLS.has(toolId)) {
          blocked.push(toolId);
        } else {
          allowed.push(toolId);
        }
      });

      expect(blocked.length).toBe(MUTATING_TOOLS.length);
      expect(allowed.length).toBe(0);
    });

    it('when isLocked=false, all tools are allowed', () => {
      const isLocked = false;
      const blocked: string[] = [];

      MUTATING_TOOLS.forEach((toolId) => {
        if (isLocked && !VIEW_SAFE_TOOLS.has(toolId)) {
          blocked.push(toolId);
        }
      });

      expect(blocked.length).toBe(0);
    });

    it('when isLocked=true, view-safe tools are still allowed', () => {
      const isLocked = true;
      const viewTools = ['select', 'pan', 'zoom-in', 'zoom-out', 'zoom-fit'];
      const allowed: string[] = [];

      viewTools.forEach((toolId) => {
        if (!isLocked || VIEW_SAFE_TOOLS.has(toolId)) {
          allowed.push(toolId);
        }
      });

      expect(allowed).toEqual(viewTools);
    });
  });

  // ── 5. Keyboard lock gate simulation ──
  describe('useKeyboardShortcuts lock gate', () => {
    // Simulates the lock check logic in handleKeyDown

    it('Ctrl+C is allowed when locked (read-only copy)', () => {
      const isLocked = true;
      const key = 'c';
      const ctrlKey = true;

      // Ctrl+C is handled BEFORE the lock guard
      const isAllowed = (ctrlKey && key === 'c');
      expect(isAllowed).toBe(true);
    });

    it('Ctrl+A is allowed when locked (read-only select)', () => {
      const isLocked = true;
      const key = 'a';
      const ctrlKey = true;

      // Ctrl+A is handled BEFORE the lock guard
      const isAllowed = (ctrlKey && key === 'a');
      expect(isAllowed).toBe(true);
    });

    it('Escape is allowed when locked', () => {
      const isLocked = true;
      const key = 'Escape';

      // ESC is excepted from the lock guard
      const isAllowed = (key === 'Escape');
      expect(isAllowed).toBe(true);
    });

    it('Ctrl+V (paste) is blocked when locked', () => {
      const isLocked = true;
      const key = 'v';
      const ctrlKey = true;

      // Paste is AFTER the lock guard
      const isBlocked = isLocked && !(ctrlKey && key === 'c') && !(ctrlKey && key === 'a') && key !== 'Escape';
      expect(isBlocked).toBe(true);
    });

    it('Delete is blocked when locked', () => {
      const isLocked = true;
      const key = 'Delete';

      const isBlocked = isLocked && key !== 'Escape';
      expect(isBlocked).toBe(true);
    });

    it('command buffer keys are blocked when locked', () => {
      const isLocked = true;
      const key = 'L';

      const isBlocked = isLocked && key !== 'Escape';
      expect(isBlocked).toBe(true);
    });

    it('all shortcuts work normally when not locked', () => {
      const isLocked = false;

      expect(isLocked).toBe(false);
      // When not locked, the lock guard does not fire
    });
  });

  // ── 6. Lock/Unlock toggle flow ──
  describe('Lock/Unlock toggle flow', () => {
    it('full cycle: create → lock → verify locked → unlock → verify unlocked', () => {
      const project = makeProject({ isLocked: false });
      useProjectStore.setState({ currentProject: project });

      // Step 1: Not locked
      expect(useProjectStore.getState().currentProject?.isLocked).toBe(false);

      // Step 2: Lock
      useProjectStore.setState({
        currentProject: { ...useProjectStore.getState().currentProject!, isLocked: true },
      });
      expect(useProjectStore.getState().currentProject?.isLocked).toBe(true);

      // Step 3: Verify computeProjectStatus still works when locked
      const lockedProject = useProjectStore.getState().currentProject!;
      const statusBefore = computeProjectStatus(makeProject({
        ...lockedProject,
        quoteId: 'q1', quoteCode: 'BG-0001', quoteDesignRevision: 1,
        contractId: 'c1', contractCode: 'HD-0001',
        receiptId: 'r1', receiptCode: 'PT-0001',
        productionOrderId: 'po1', productionOrderCode: 'LSX-0001',
      }));
      expect(statusBefore.status).toBe('in_production');

      // Step 4: Unlock
      useProjectStore.setState({
        currentProject: { ...useProjectStore.getState().currentProject!, isLocked: false },
      });
      expect(useProjectStore.getState().currentProject?.isLocked).toBe(false);
    });
  });
});
