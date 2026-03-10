/**
 * Project Store - Zustand store for project & BOM state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================== Types ====================

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  // Thông tin chủ đầu tư
  investor?: string; // Chủ đầu tư
  investorPhone?: string;
  investorEmail?: string;
  // Địa chỉ công trình
  houseNumber?: string; // Số nhà
  street?: string; // Tên đường
  ward?: string; // Phường/Xã
  district?: string; // Quận/Huyện
  city?: string; // Thành phố/Tỉnh
  // Thông tin liên hệ (khác chủ đầu tư)
  customer?: string;
  address?: string;
  phone?: string;
  email?: string;
  // Thông tin dự án
  projectType?: string; // Loại công trình (nhà ở, văn phòng, etc.)
  area?: number; // Diện tích (m2)
  startDate?: string; // Ngày bắt đầu
  expectedEndDate?: string; // Ngày dự kiến hoàn thành
  // Metadata
  created: string;
  modified: string;
  status: "draft" | "active" | "completed" | "archived";
  thumbnail?: string;
  tags?: string[];
  notes?: string; // Ghi chú thêm
}

export interface BomItem {
  id: string;
  category: "aluminum" | "glass" | "accessory" | "service";
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  entityIds?: string[]; // References to CAD entities
}

export interface MaterialEntry {
  id: string;
  type: "profile" | "glass" | "accessory";
  code: string;
  name: string;
  unit: string;
  unitWeight?: number;
  unitPrice: number;
  supplier?: string;
  stock?: number;
}

export interface QuoteSettings {
  laborRate: number; // per hour or per m2
  laborUnit: "hour" | "m2" | "item";
  profitMargin: number; // percentage
  discountPercent: number;
  taxRate: number;
  validityDays: number;
  currency: string;
}

export interface QuoteSummary {
  materialCost: number;
  laborCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface ProjectStoreState {
  // Current project
  currentProject: ProjectInfo | null;

  // Recent projects
  recentProjects: ProjectInfo[];

  // BOM
  bomItems: BomItem[];
  bomLastCalculated: string | null;

  // Materials catalog (cached)
  materials: MaterialEntry[];

  // Quote settings
  quoteSettings: QuoteSettings;

  // Quote summary
  quoteSummary: QuoteSummary | null;

  // Loading states
  isSaving: boolean;
  isCalculating: boolean;
}

export interface ProjectStoreActions {
  // Project management
  createProject: (
    info: Omit<ProjectInfo, "id" | "created" | "modified">
  ) => ProjectInfo;
  updateProject: (updates: Partial<ProjectInfo>) => void;
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  closeProject: () => void;
  deleteProject: (id: string) => void;

  // Recent projects
  addToRecent: (project: ProjectInfo) => void;
  clearRecent: () => void;

  // BOM management
  calculateBom: () => void;
  addBomItem: (item: Omit<BomItem, "id" | "totalPrice">) => void;
  updateBomItem: (id: string, updates: Partial<BomItem>) => void;
  removeBomItem: (id: string) => void;
  clearBom: () => void;

  // Materials
  loadMaterials: () => Promise<void>;
  addMaterial: (material: Omit<MaterialEntry, "id">) => void;
  updateMaterial: (id: string, updates: Partial<MaterialEntry>) => void;
  removeMaterial: (id: string) => void;

  // Quote
  setQuoteSettings: (settings: Partial<QuoteSettings>) => void;
  calculateQuote: () => void;

  // Export
  exportBom: (format: "excel" | "pdf" | "json") => Promise<Blob>;
  exportQuote: (format: "pdf" | "html") => Promise<Blob>;
}

type ProjectStore = ProjectStoreState & ProjectStoreActions;

// ==================== Helpers ====================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== Default Values ====================

const defaultQuoteSettings: QuoteSettings = {
  laborRate: 150000, // VND per m2
  laborUnit: "m2",
  profitMargin: 20,
  discountPercent: 0,
  taxRate: 10,
  validityDays: 30,
  currency: "VND",
};

// ==================== Store Creation ====================

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      recentProjects: [],
      bomItems: [],
      bomLastCalculated: null,
      materials: [],
      quoteSettings: defaultQuoteSettings,
      quoteSummary: null,
      isSaving: false,
      isCalculating: false,

      // Project management
      createProject: (info) => {
        const now = new Date().toISOString();
        const project: ProjectInfo = {
          ...info,
          id: generateId(),
          created: now,
          modified: now,
          status: info.status ?? "draft",
        };

        set({ currentProject: project });
        get().addToRecent(project);

        return project;
      },

      updateProject: (updates) =>
        set((state) => {
          if (!state.currentProject) return state;
          const updated = {
            ...state.currentProject,
            ...updates,
            modified: new Date().toISOString(),
          };
          return { currentProject: updated };
        }),

      loadProject: async (id) => {
        // In real app, load from storage/API
        const { recentProjects } = get();
        const project = recentProjects.find((p) => p.id === id);
        if (project) {
          set({ currentProject: project });
        }
      },

      saveProject: async () => {
        set({ isSaving: true });
        try {
          const { currentProject } = get();
          if (currentProject) {
            // In real app, save to storage/API
            get().updateProject({ modified: new Date().toISOString() });
            get().addToRecent(currentProject);
          }
        } finally {
          set({ isSaving: false });
        }
      },

      closeProject: () =>
        set({
          currentProject: null,
          bomItems: [],
          bomLastCalculated: null,
          quoteSummary: null,
        }),

      deleteProject: (id) =>
        set((state) => ({
          recentProjects: state.recentProjects.filter((p) => p.id !== id),
          currentProject:
            state.currentProject?.id === id ? null : state.currentProject,
        })),

      // Recent projects
      addToRecent: (project) =>
        set((state) => {
          const filtered = state.recentProjects.filter(
            (p) => p.id !== project.id
          );
          return {
            recentProjects: [project, ...filtered].slice(0, 10),
          };
        }),

      clearRecent: () => set({ recentProjects: [] }),

      // BOM management
      calculateBom: () => {
        set({ isCalculating: true });
        try {
          // In real app, calculate from CAD entities and door models
          // This is a placeholder that would integrate with domain/bom
          set({ bomLastCalculated: new Date().toISOString() });
          get().calculateQuote();
        } finally {
          set({ isCalculating: false });
        }
      },

      addBomItem: (item) =>
        set((state) => {
          const newItem: BomItem = {
            ...item,
            id: generateId(),
            totalPrice: item.quantity * item.unitPrice,
          };
          return { bomItems: [...state.bomItems, newItem] };
        }),

      updateBomItem: (id, updates) =>
        set((state) => ({
          bomItems: state.bomItems.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            updated.totalPrice = updated.quantity * updated.unitPrice;
            return updated;
          }),
        })),

      removeBomItem: (id) =>
        set((state) => ({
          bomItems: state.bomItems.filter((item) => item.id !== id),
        })),

      clearBom: () =>
        set({ bomItems: [], bomLastCalculated: null, quoteSummary: null }),

      // Materials
      loadMaterials: async () => {
        // In real app, load from API or local storage
        // Placeholder with sample materials
        const sampleMaterials: MaterialEntry[] = [
          {
            id: "1",
            type: "profile",
            code: "XF-55A",
            name: "Thanh nhôm XingFa 55",
            unit: "m",
            unitWeight: 0.8,
            unitPrice: 85000,
          },
          {
            id: "2",
            type: "profile",
            code: "XF-55B",
            name: "Thanh nhôm XingFa cố định",
            unit: "m",
            unitWeight: 0.65,
            unitPrice: 75000,
          },
          {
            id: "3",
            type: "glass",
            code: "GL-5CL",
            name: "Kính 5mm trong",
            unit: "m2",
            unitPrice: 120000,
          },
          {
            id: "4",
            type: "glass",
            code: "GL-8TM",
            name: "Kính 8mm tempered",
            unit: "m2",
            unitPrice: 280000,
          },
          {
            id: "5",
            type: "accessory",
            code: "HN-001",
            name: "Bản lề 4D",
            unit: "bộ",
            unitPrice: 85000,
          },
          {
            id: "6",
            type: "accessory",
            code: "LK-001",
            name: "Khóa cửa đi",
            unit: "bộ",
            unitPrice: 350000,
          },
        ];
        set({ materials: sampleMaterials });
      },

      addMaterial: (material) =>
        set((state) => ({
          materials: [...state.materials, { ...material, id: generateId() }],
        })),

      updateMaterial: (id, updates) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),

      // Quote
      setQuoteSettings: (settings) =>
        set((state) => ({
          quoteSettings: { ...state.quoteSettings, ...settings },
        })),

      calculateQuote: () => {
        const { bomItems, quoteSettings } = get();

        // Calculate material cost by category
        const materialCost = bomItems
          .filter((item) => item.category !== "service")
          .reduce((sum, item) => sum + item.totalPrice, 0);

        // Calculate labor cost
        const laborCost = bomItems
          .filter((item) => item.category === "service")
          .reduce((sum, item) => sum + item.totalPrice, 0);

        // Calculate totals
        const subtotal = materialCost + laborCost;
        const profitAmount = subtotal * (quoteSettings.profitMargin / 100);
        const afterProfit = subtotal + profitAmount;
        const discount = afterProfit * (quoteSettings.discountPercent / 100);
        const afterDiscount = afterProfit - discount;
        const tax = afterDiscount * (quoteSettings.taxRate / 100);
        const total = afterDiscount + tax;

        set({
          quoteSummary: {
            materialCost,
            laborCost,
            subtotal,
            discount,
            tax,
            total,
          },
        });
      },

      // Export
      exportBom: async (format) => {
        const { bomItems, currentProject } = get();

        if (format === "json") {
          const data = JSON.stringify(
            { project: currentProject, items: bomItems },
            null,
            2
          );
          return new Blob([data], { type: "application/json" });
        }

        // For PDF/Excel, would use proper libraries
        // Placeholder implementation
        const csvContent = [
          "Code,Name,Unit,Quantity,Unit Price,Total Price",
          ...bomItems.map(
            (item) =>
              `${item.code},${item.name},${item.unit},${item.quantity},${item.unitPrice},${item.totalPrice}`
          ),
        ].join("\n");

        return new Blob([csvContent], { type: "text/csv" });
      },

      exportQuote: async (format) => {
        const { currentProject, bomItems, quoteSummary, quoteSettings } = get();

        const html = `
          <!DOCTYPE html>
          <html>
          <head><title>Quote - ${
            currentProject?.name ?? "Untitled"
          }</title></head>
          <body>
            <h1>Báo Giá</h1>
            <p>Khách hàng: ${currentProject?.customer ?? "N/A"}</p>
            <p>Ngày: ${new Date().toLocaleDateString("vi-VN")}</p>
            <table border="1">
              <tr><th>STT</th><th>Mã</th><th>Tên</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
              ${bomItems
                .map(
                  (item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.code}</td>
                  <td>${item.name}</td>
                  <td>${item.unit}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice.toLocaleString()}</td>
                  <td>${item.totalPrice.toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            <p>Tổng vật tư: ${quoteSummary?.materialCost.toLocaleString()} ${
          quoteSettings.currency
        }</p>
            <p>Tổng nhân công: ${quoteSummary?.laborCost.toLocaleString()} ${
          quoteSettings.currency
        }</p>
            <p>Chiết khấu: ${quoteSummary?.discount.toLocaleString()} ${
          quoteSettings.currency
        }</p>
            <p>Thuế: ${quoteSummary?.tax.toLocaleString()} ${
          quoteSettings.currency
        }</p>
            <p><strong>TỔNG CỘNG: ${quoteSummary?.total.toLocaleString()} ${
          quoteSettings.currency
        }</strong></p>
          </body>
          </html>
        `;

        return new Blob([html], {
          type: format === "html" ? "text/html" : "application/pdf",
        });
      },
    }),
    {
      name: "cad-project-store",
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        quoteSettings: state.quoteSettings,
        materials: state.materials,
      }),
    }
  )
);

// ==================== Selectors ====================

export const selectBomByCategory =
  (category: BomItem["category"]) => (state: ProjectStore) =>
    state.bomItems.filter((item) => item.category === category);

export const selectTotalBomCost = (state: ProjectStore) =>
  state.bomItems.reduce((sum, item) => sum + item.totalPrice, 0);

export const selectHasProject = (state: ProjectStore) =>
  state.currentProject !== null;

export const selectProjectStatus = (state: ProjectStore) =>
  state.currentProject?.status ?? null;
