// ============================================================
// Setting Types Tests — validate type constants and labels
// ============================================================

import {
  PERMISSION_GROUP_LABELS,
  RESOURCE_LABELS,
  ACTION_LABELS,
  DEFAULT_SYSTEM_SETTINGS,
} from '../types';
import { PERMISSION_CATALOG, PERMISSION_GROUPS } from '../../../shared/src/constants/permissionCatalog';

describe('setting.types', () => {
  describe('PERMISSION_GROUP_LABELS', () => {
    it('has labels for groups A-D', () => {
      expect(PERMISSION_GROUP_LABELS['A']).toBe('Danh mục (Master Data)');
      expect(PERMISSION_GROUP_LABELS['B']).toBe('Nghiệp vụ (Business)');
      expect(PERMISSION_GROUP_LABELS['C']).toBe('Báo cáo (Reports)');
      expect(PERMISSION_GROUP_LABELS['D']).toBe('Thiết lập (Settings)');
    });
  });

  describe('RESOURCE_LABELS', () => {
    it('has label for every resource in groups A-D', () => {
      const appResources = [
        ...PERMISSION_GROUPS.A,
        ...PERMISSION_GROUPS.B,
        ...PERMISSION_GROUPS.C,
        ...PERMISSION_GROUPS.D,
      ];
      for (const entry of appResources) {
        expect(RESOURCE_LABELS[entry.resource]).toBeDefined();
        expect(typeof RESOURCE_LABELS[entry.resource]).toBe('string');
      }
    });

    it('has correct count (51 app resources: A12 + B20 + C11 + D8)', () => {
      const appCount = PERMISSION_GROUPS.A.length + PERMISSION_GROUPS.B.length + PERMISSION_GROUPS.C.length + PERMISSION_GROUPS.D.length;
      expect(appCount).toBe(51);
      const labeledResources = Object.keys(RESOURCE_LABELS);
      expect(labeledResources.length).toBeGreaterThanOrEqual(appCount);
    });
  });

  describe('ACTION_LABELS', () => {
    it('has labels for all standard actions', () => {
      const allActions = new Set(PERMISSION_CATALOG.flatMap(e => [...e.actions]));
      for (const action of allActions) {
        expect(ACTION_LABELS[action]).toBeDefined();
      }
    });

    it('has Vietnamese translations', () => {
      expect(ACTION_LABELS['read']).toBe('Xem');
      expect(ACTION_LABELS['create']).toBe('Tạo');
      expect(ACTION_LABELS['delete']).toBe('Xóa');
      expect(ACTION_LABELS['approve']).toBe('Duyệt');
    });
  });

  describe('DEFAULT_SYSTEM_SETTINGS', () => {
    it('has Vietnamese defaults', () => {
      expect(DEFAULT_SYSTEM_SETTINGS.numberFormat).toBe('vi-VN');
      expect(DEFAULT_SYSTEM_SETTINGS.currency).toBe('VND');
      expect(DEFAULT_SYSTEM_SETTINGS.language).toBe('vi');
      expect(DEFAULT_SYSTEM_SETTINGS.dateFormat).toBe('DD/MM/YYYY');
      expect(DEFAULT_SYSTEM_SETTINGS.timezone).toBe('Asia/Ho_Chi_Minh');
    });

    it('fiscal year starts in January', () => {
      expect(DEFAULT_SYSTEM_SETTINGS.fiscalYearStart).toBe(1);
    });
  });
});
