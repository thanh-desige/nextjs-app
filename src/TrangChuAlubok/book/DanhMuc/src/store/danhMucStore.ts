// ============================================================
// DanhMuc Store — Zustand store for all 12 master data entities
// In-memory for now; will connect to PostgreSQL via API later
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Customer, Supplier, Employee,
  Profile, Glass, Accessory, Material,
  Unit, Warehouse, PriceList, TaxRate,
  DoorTemplate,
} from '../types';

// ── State ───────────────────────────────────────────────────

export interface DanhMucStoreState {
  // A1-A3: People
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  // A4-A7: Materials
  profiles: Profile[];
  glasses: Glass[];
  accessories: Accessory[];
  materials: Material[];
  // A8-A11: Catalog
  units: Unit[];
  warehouses: Warehouse[];
  priceLists: PriceList[];
  taxRates: TaxRate[];
  // A12: Door Template
  doorTemplates: DoorTemplate[];
}

// ── Actions ─────────────────────────────────────────────────

export interface DanhMucStoreActions {
  // Generic setters for each entity type
  setCustomers: (items: Customer[]) => void;
  setSuppliers: (items: Supplier[]) => void;
  setEmployees: (items: Employee[]) => void;
  setProfiles: (items: Profile[]) => void;
  setGlasses: (items: Glass[]) => void;
  setAccessories: (items: Accessory[]) => void;
  setMaterials: (items: Material[]) => void;
  setUnits: (items: Unit[]) => void;
  setWarehouses: (items: Warehouse[]) => void;
  setPriceLists: (items: PriceList[]) => void;
  setTaxRates: (items: TaxRate[]) => void;
  setDoorTemplates: (items: DoorTemplate[]) => void;
  // Reset all
  resetAll: () => void;
}

type DanhMucStore = DanhMucStoreState & DanhMucStoreActions;

// ── Initial state ───────────────────────────────────────────

const initialState: DanhMucStoreState = {
  customers: [],
  suppliers: [],
  employees: [],
  profiles: [],
  glasses: [],
  accessories: [],
  materials: [],
  units: [],
  warehouses: [],
  priceLists: [],
  taxRates: [],
  doorTemplates: [],
};

// ── Store ───────────────────────────────────────────────────

export const useDanhMucStore = create<DanhMucStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCustomers:    (items) => set({ customers: items }),
      setSuppliers:    (items) => set({ suppliers: items }),
      setEmployees:    (items) => set({ employees: items }),
      setProfiles:     (items) => set({ profiles: items }),
      setGlasses:      (items) => set({ glasses: items }),
      setAccessories:  (items) => set({ accessories: items }),
      setMaterials:    (items) => set({ materials: items }),
      setUnits:        (items) => set({ units: items }),
      setWarehouses:   (items) => set({ warehouses: items }),
      setPriceLists:   (items) => set({ priceLists: items }),
      setTaxRates:     (items) => set({ taxRates: items }),
      setDoorTemplates:(items) => set({ doorTemplates: items }),

      resetAll: () => set(initialState),
    }),
    {
      name: 'alubok-danhmuc',
      version: 1,
    },
  ),
);
