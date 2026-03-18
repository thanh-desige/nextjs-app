// ============================================================
// categoryConfigs tests — Verify all 12 categories are configured
// ============================================================

import { CATEGORY_CONFIGS } from '../ui/categoryConfigs';

describe('CATEGORY_CONFIGS', () => {
  it('has exactly 12 category configurations', () => {
    expect(CATEGORY_CONFIGS).toHaveLength(12);
  });

  it('each config has required properties', () => {
    for (const cfg of CATEGORY_CONFIGS) {
      expect(cfg.key).toBeTruthy();
      expect(cfg.label).toBeTruthy();
      expect(cfg.resource).toBeTruthy();
      expect(cfg.columns.length).toBeGreaterThan(0);
      expect(cfg.fields.length).toBeGreaterThan(0);
      expect(cfg.storeKey).toBeTruthy();
      expect(cfg.setterKey).toBeTruthy();
    }
  });

  it('has unique keys', () => {
    const keys = CATEGORY_CONFIGS.map(c => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  const expectedKeys = [
    'customer', 'supplier', 'employee',
    'profile', 'glass', 'accessory', 'material',
    'unit', 'warehouse', 'pricelist', 'taxrate', 'doortemplate',
  ];

  it.each(expectedKeys)('contains category: %s', (key) => {
    const found = CATEGORY_CONFIGS.find(c => c.key === key);
    expect(found).toBeDefined();
  });

  it('all columns have key and label', () => {
    for (const cfg of CATEGORY_CONFIGS) {
      for (const col of cfg.columns) {
        expect(col.key).toBeTruthy();
        expect(col.label).toBeTruthy();
      }
    }
  });

  it('all fields have key, label, and type', () => {
    for (const cfg of CATEGORY_CONFIGS) {
      for (const field of cfg.fields) {
        expect(field.key).toBeTruthy();
        expect(field.label).toBeTruthy();
        expect(field.type).toBeTruthy();
      }
    }
  });

  it('each category has at least one required field', () => {
    for (const cfg of CATEGORY_CONFIGS) {
      const hasRequired = cfg.fields.some(f => f.required);
      expect(hasRequired).toBe(true);
    }
  });

  it('store keys match the DanhMuc store shape', () => {
    const validStoreKeys = [
      'customers', 'suppliers', 'employees',
      'profiles', 'glasses', 'accessories', 'materials',
      'units', 'warehouses', 'priceLists', 'taxRates', 'doorTemplates',
    ];
    for (const cfg of CATEGORY_CONFIGS) {
      expect(validStoreKeys).toContain(cfg.storeKey);
    }
  });
});
