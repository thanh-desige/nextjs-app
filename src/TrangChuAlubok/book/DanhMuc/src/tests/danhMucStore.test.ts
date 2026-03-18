// ============================================================
// danhMucStore tests — Zustand store for master data
// ============================================================

import { useDanhMucStore } from '../store/danhMucStore';
import type { Customer, Supplier, Unit } from '../types';

// Direct access to store (non-hook) for testing
const { getState, setState } = useDanhMucStore;

beforeEach(() => {
  getState().resetAll();
});

describe('useDanhMucStore', () => {
  it('starts with empty arrays', () => {
    const s = getState();
    expect(s.customers).toEqual([]);
    expect(s.suppliers).toEqual([]);
    expect(s.employees).toEqual([]);
    expect(s.profiles).toEqual([]);
    expect(s.glasses).toEqual([]);
    expect(s.accessories).toEqual([]);
    expect(s.materials).toEqual([]);
    expect(s.units).toEqual([]);
    expect(s.warehouses).toEqual([]);
    expect(s.priceLists).toEqual([]);
    expect(s.taxRates).toEqual([]);
    expect(s.doorTemplates).toEqual([]);
  });

  it('setCustomers updates the customers array', () => {
    const customers: Customer[] = [
      {
        id: '1', code: 'KH-001', name: 'Test Customer', type: 'company',
        isActive: true, createdAt: '', updatedAt: '', createdBy: '', orgId: 'org-1',
        phone: '0123456789', email: 'test@test.com', taxCode: '', address: '', city: '',
        notes: '', debtLimit: 50000000, contactPerson: '',
      },
    ];
    getState().setCustomers(customers);
    expect(getState().customers).toHaveLength(1);
    expect(getState().customers[0].name).toBe('Test Customer');
  });

  it('setSuppliers updates the suppliers array', () => {
    const suppliers: Supplier[] = [
      {
        id: '2', code: 'NCC-001', name: 'Test Supplier', category: 'aluminum',
        isActive: true, createdAt: '', updatedAt: '', createdBy: '', orgId: 'org-1',
        contactPerson: '', phone: '', email: '', taxCode: '', address: '', city: '',
        bankAccount: '', bankName: '', paymentTermDays: 30, notes: '',
      },
    ];
    getState().setSuppliers(suppliers);
    expect(getState().suppliers).toHaveLength(1);
    expect(getState().suppliers[0].category).toBe('aluminum');
  });

  it('setUnits updates the units array', () => {
    const units: Unit[] = [
      {
        id: '3', code: 'DVT-001', name: 'Mét', abbreviation: 'm', description: 'mét dài',
        isActive: true, createdAt: '', updatedAt: '', createdBy: '', orgId: 'org-1',
      },
    ];
    getState().setUnits(units);
    expect(getState().units).toHaveLength(1);
    expect(getState().units[0].abbreviation).toBe('m');
  });

  it('resetAll clears everything', () => {
    getState().setCustomers([
      { id: '1', code: 'X', name: 'X', type: 'individual', isActive: true, createdAt: '', updatedAt: '', createdBy: '', orgId: 'o', phone: '', email: '', taxCode: '', address: '', city: '', notes: '', debtLimit: 0, contactPerson: '' },
    ]);
    getState().setUnits([
      { id: '2', code: 'Y', name: 'Y', abbreviation: 'y', description: '', isActive: true, createdAt: '', updatedAt: '', createdBy: '', orgId: 'o' },
    ]);
    expect(getState().customers).toHaveLength(1);
    expect(getState().units).toHaveLength(1);

    getState().resetAll();
    expect(getState().customers).toEqual([]);
    expect(getState().units).toEqual([]);
  });

  it('multiple setters are independent', () => {
    getState().setCustomers([
      { id: '1', code: 'A', name: 'A', type: 'individual', isActive: true, createdAt: '', updatedAt: '', createdBy: '', orgId: 'o', phone: '', email: '', taxCode: '', address: '', city: '', notes: '', debtLimit: 0, contactPerson: '' },
    ]);
    getState().setSuppliers([
      { id: '2', code: 'B', name: 'B', category: 'glass', isActive: true, createdAt: '', updatedAt: '', createdBy: '', orgId: 'o', contactPerson: '', phone: '', email: '', taxCode: '', address: '', city: '', bankAccount: '', bankName: '', paymentTermDays: 15, notes: '' },
    ]);
    expect(getState().customers).toHaveLength(1);
    expect(getState().suppliers).toHaveLength(1);
    expect(getState().employees).toEqual([]);
  });
});
