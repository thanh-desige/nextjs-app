import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import type {
  Project,
  ProductionOrder,
  MaterialPlan,
  MaterialIssue,
  InstallationJob,
  AcceptanceRecord,
} from '../types';

// Reset store before each test
beforeEach(() => {
  useSanXuatThiCongStore.getState().resetAll();
});

describe('sanXuatThiCongStore', () => {
  // ── Initial state ─────────────────────────────────────────
  describe('initial state', () => {
    it('has 3 seed projects', () => {
      expect(useSanXuatThiCongStore.getState().projects).toHaveLength(3);
    });

    it('has 3 seed production orders', () => {
      expect(useSanXuatThiCongStore.getState().productionOrders).toHaveLength(3);
    });

    it('has 2 seed material plans', () => {
      expect(useSanXuatThiCongStore.getState().materialPlans).toHaveLength(2);
    });

    it('has 2 seed material issues', () => {
      expect(useSanXuatThiCongStore.getState().materialIssues).toHaveLength(2);
    });

    it('has 2 seed installations', () => {
      expect(useSanXuatThiCongStore.getState().installations).toHaveLength(2);
    });

    it('has 1 seed acceptance', () => {
      expect(useSanXuatThiCongStore.getState().acceptances).toHaveLength(1);
    });

    it('project CT-0001 is in_production', () => {
      const p = useSanXuatThiCongStore.getState().projects.find((p) => p.projectCode === 'CT-0001');
      expect(p).toBeDefined();
      expect(p!.status).toBe('in_production');
      expect(p!.customerName).toBe('Công ty ABC Construction');
    });

    it('PO LSX-0001 is processing with 2 items', () => {
      const o = useSanXuatThiCongStore.getState().productionOrders.find((o) => o.orderCode === 'LSX-0001');
      expect(o).toBeDefined();
      expect(o!.status).toBe('processing');
      expect(o!.items).toHaveLength(2);
      expect(o!.priority).toBe('high');
    });

    it('PO LSX-0002 has QC passed', () => {
      const o = useSanXuatThiCongStore.getState().productionOrders.find((o) => o.orderCode === 'LSX-0002');
      expect(o).toBeDefined();
      expect(o!.status).toBe('completed');
      expect(o!.qcPassedAt).toBeDefined();
    });

    it('material plan KHVT-0001 is partial with shortages', () => {
      const mp = useSanXuatThiCongStore.getState().materialPlans.find((p) => p.planCode === 'KHVT-0001');
      expect(mp).toBeDefined();
      expect(mp!.status).toBe('partial');
      const shortageItems = mp!.items.filter((i) => i.shortageQty > 0);
      expect(shortageItems.length).toBeGreaterThan(0);
    });

    it('installation LD-0001 is in_progress with check-in', () => {
      const j = useSanXuatThiCongStore.getState().installations.find((j) => j.jobCode === 'LD-0001');
      expect(j).toBeDefined();
      expect(j!.status).toBe('in_progress');
      expect(j!.checkInAt).toBeDefined();
    });

    it('acceptance NT-0001 is pending', () => {
      const r = useSanXuatThiCongStore.getState().acceptances.find((r) => r.recordCode === 'NT-0001');
      expect(r).toBeDefined();
      expect(r!.status).toBe('pending');
      expect(r!.type).toBe('partial');
    });
  });

  // ── Project CRUD ──────────────────────────────────────────
  describe('project CRUD', () => {
    it('addProject adds a new project', () => {
      const p: Project = {
        projectId: 'prj-new',
        projectCode: 'CT-9999',
        projectName: 'Test project',
        customerId: 'kh-new',
        customerName: 'Test',
        address: '123 Test',
        startDate: '2026-04-01',
        deadline: '2026-05-01',
        status: 'planning',
        createdBy: 'Test',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      };
      useSanXuatThiCongStore.getState().addProject(p);
      expect(useSanXuatThiCongStore.getState().projects).toHaveLength(4);
    });

    it('updateProject patches fields', () => {
      useSanXuatThiCongStore.getState().updateProject('prj-001', { status: 'completed' });
      const p = useSanXuatThiCongStore.getState().projects.find((p) => p.projectId === 'prj-001');
      expect(p!.status).toBe('completed');
    });

    it('deleteProject removes by id', () => {
      useSanXuatThiCongStore.getState().deleteProject('prj-003');
      expect(useSanXuatThiCongStore.getState().projects).toHaveLength(2);
      expect(useSanXuatThiCongStore.getState().projects.find((p) => p.projectId === 'prj-003')).toBeUndefined();
    });
  });

  // ── Production Order CRUD ─────────────────────────────────
  describe('production order CRUD', () => {
    it('addProductionOrder adds a new order', () => {
      const o: ProductionOrder = {
        orderId: 'po-new',
        orderCode: 'LSX-9999',
        projectId: 'prj-001',
        projectCode: 'CT-0001',
        items: [{ itemId: 'pi-new', description: 'Test', quantity: 1, unit: 'bộ', completedQty: 0, defectQty: 0 }],
        priority: 'normal',
        status: 'new',
        startDate: '2026-04-01',
        dueDate: '2026-04-15',
        createdBy: 'Test',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      };
      useSanXuatThiCongStore.getState().addProductionOrder(o);
      expect(useSanXuatThiCongStore.getState().productionOrders).toHaveLength(4);
    });

    it('updateProductionOrder patches fields', () => {
      useSanXuatThiCongStore.getState().updateProductionOrder('po-001', { status: 'qc' });
      const o = useSanXuatThiCongStore.getState().productionOrders.find((o) => o.orderId === 'po-001');
      expect(o!.status).toBe('qc');
    });

    it('deleteProductionOrder removes by id', () => {
      useSanXuatThiCongStore.getState().deleteProductionOrder('po-003');
      expect(useSanXuatThiCongStore.getState().productionOrders).toHaveLength(2);
    });
  });

  // ── Material Plan CRUD ────────────────────────────────────
  describe('material plan CRUD', () => {
    it('addMaterialPlan adds a new plan', () => {
      const mp: MaterialPlan = {
        planId: 'mp-new',
        planCode: 'KHVT-9999',
        productionOrderId: 'po-001',
        productionOrderCode: 'LSX-0001',
        items: [{ itemId: 'mi-new', materialName: 'Test', unit: 'cây', requiredQty: 10, stockQty: 5, issuedQty: 3, shortageQty: 7 }],
        status: 'pending',
        createdBy: 'Test',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      };
      useSanXuatThiCongStore.getState().addMaterialPlan(mp);
      expect(useSanXuatThiCongStore.getState().materialPlans).toHaveLength(3);
    });

    it('updateMaterialPlan patches fields', () => {
      useSanXuatThiCongStore.getState().updateMaterialPlan('mp-001', { status: 'fulfilled' });
      const mp = useSanXuatThiCongStore.getState().materialPlans.find((p) => p.planId === 'mp-001');
      expect(mp!.status).toBe('fulfilled');
    });

    it('deleteMaterialPlan removes by id', () => {
      useSanXuatThiCongStore.getState().deleteMaterialPlan('mp-002');
      expect(useSanXuatThiCongStore.getState().materialPlans).toHaveLength(1);
    });
  });

  // ── Material Issue CRUD ───────────────────────────────────
  describe('material issue CRUD', () => {
    it('addMaterialIssue adds a new issue', () => {
      const mi: MaterialIssue = {
        issueId: 'mi-new',
        issueCode: 'XD-9999',
        productionOrderId: 'po-001',
        productionOrderCode: 'LSX-0001',
        items: [{ itemId: 'mii-new', materialName: 'Test', unit: 'cây', requestedQty: 5, issuedQty: 5, wasteQty: 0 }],
        status: 'pending',
        createdBy: 'Test',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      };
      useSanXuatThiCongStore.getState().addMaterialIssue(mi);
      expect(useSanXuatThiCongStore.getState().materialIssues).toHaveLength(3);
    });

    it('updateMaterialIssue patches fields', () => {
      useSanXuatThiCongStore.getState().updateMaterialIssue('mi-001', { status: 'approved', approvedBy: 'Tester' });
      const mi = useSanXuatThiCongStore.getState().materialIssues.find((i) => i.issueId === 'mi-001');
      expect(mi!.status).toBe('approved');
      expect(mi!.approvedBy).toBe('Tester');
    });

    it('deleteMaterialIssue removes by id', () => {
      useSanXuatThiCongStore.getState().deleteMaterialIssue('mi-002');
      expect(useSanXuatThiCongStore.getState().materialIssues).toHaveLength(1);
    });
  });

  // ── Installation CRUD ─────────────────────────────────────
  describe('installation CRUD', () => {
    it('addInstallation adds a new job', () => {
      const j: InstallationJob = {
        jobId: 'ij-new',
        jobCode: 'LD-9999',
        projectId: 'prj-001',
        projectCode: 'CT-0001',
        teamName: 'Test Team',
        teamLeader: 'Test Leader',
        scheduledDate: '2026-04-01',
        address: '123 Test',
        status: 'scheduled',
        createdBy: 'Test',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      };
      useSanXuatThiCongStore.getState().addInstallation(j);
      expect(useSanXuatThiCongStore.getState().installations).toHaveLength(3);
    });

    it('updateInstallation patches fields', () => {
      useSanXuatThiCongStore.getState().updateInstallation('ij-001', { status: 'completed' });
      const j = useSanXuatThiCongStore.getState().installations.find((j) => j.jobId === 'ij-001');
      expect(j!.status).toBe('completed');
    });

    it('deleteInstallation removes by id', () => {
      useSanXuatThiCongStore.getState().deleteInstallation('ij-002');
      expect(useSanXuatThiCongStore.getState().installations).toHaveLength(1);
    });
  });

  // ── Acceptance CRUD ───────────────────────────────────────
  describe('acceptance CRUD', () => {
    it('addAcceptance adds a new record', () => {
      const r: AcceptanceRecord = {
        recordId: 'ar-new',
        recordCode: 'NT-9999',
        projectId: 'prj-001',
        projectCode: 'CT-0001',
        type: 'final',
        acceptanceDate: '2026-04-01',
        inspectedBy: 'Tester',
        status: 'pending',
        volumeDescription: 'Test acceptance',
        createdBy: 'Test',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      };
      useSanXuatThiCongStore.getState().addAcceptance(r);
      expect(useSanXuatThiCongStore.getState().acceptances).toHaveLength(2);
    });

    it('updateAcceptance patches fields', () => {
      useSanXuatThiCongStore.getState().updateAcceptance('ar-001', { status: 'approved', approvedBy: 'Tester' });
      const r = useSanXuatThiCongStore.getState().acceptances.find((r) => r.recordId === 'ar-001');
      expect(r!.status).toBe('approved');
      expect(r!.approvedBy).toBe('Tester');
    });

    it('deleteAcceptance removes by id', () => {
      useSanXuatThiCongStore.getState().deleteAcceptance('ar-001');
      expect(useSanXuatThiCongStore.getState().acceptances).toHaveLength(0);
    });
  });

  // ── resetAll ──────────────────────────────────────────────
  describe('resetAll', () => {
    it('restores seed data after modifications', () => {
      useSanXuatThiCongStore.getState().deleteProject('prj-001');
      useSanXuatThiCongStore.getState().deleteProductionOrder('po-001');
      useSanXuatThiCongStore.getState().deleteAcceptance('ar-001');
      expect(useSanXuatThiCongStore.getState().projects).toHaveLength(2);
      expect(useSanXuatThiCongStore.getState().productionOrders).toHaveLength(2);
      expect(useSanXuatThiCongStore.getState().acceptances).toHaveLength(0);

      useSanXuatThiCongStore.getState().resetAll();
      expect(useSanXuatThiCongStore.getState().projects).toHaveLength(3);
      expect(useSanXuatThiCongStore.getState().productionOrders).toHaveLength(3);
      expect(useSanXuatThiCongStore.getState().materialPlans).toHaveLength(2);
      expect(useSanXuatThiCongStore.getState().materialIssues).toHaveLength(2);
      expect(useSanXuatThiCongStore.getState().installations).toHaveLength(2);
      expect(useSanXuatThiCongStore.getState().acceptances).toHaveLength(1);
    });
  });
});
