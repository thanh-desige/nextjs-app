/**
 * UI Store - Zustand store for UI state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================== Types ====================

export type ThemeMode = "dark" | "light" | "system";

export type PanelPosition = "left" | "right" | "bottom" | "floating";

export interface PanelState {
  id: string;
  visible: boolean;
  position: PanelPosition;
  width?: number;
  height?: number;
  collapsed?: boolean;
}

export interface ToolbarState {
  id: string;
  visible: boolean;
  position: "top" | "left" | "right" | "bottom" | "floating";
}

export interface UIStoreState {
  // Theme
  theme: ThemeMode;

  // Layout
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  bottomPanelHeight: number;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  bottomPanelVisible: boolean;

  // Panels
  panels: Record<string, PanelState>;
  activePanel: string | null;

  // Toolbars
  toolbars: Record<string, ToolbarState>;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown>;

  // Command palette
  commandPaletteOpen: boolean;

  // Context menu
  contextMenuOpen: boolean;
  contextMenuPosition: { x: number; y: number };
  contextMenuItems: ContextMenuItem[];

  // Notifications
  notifications: Notification[];

  // Loading states
  isLoading: boolean;
  loadingMessage: string;

  // Full screen
  isFullScreen: boolean;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
  children?: ContextMenuItem[];
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

export interface UIStoreActions {
  // Theme
  setTheme: (theme: ThemeMode) => void;

  // Layout
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;

  // Panels
  showPanel: (id: string) => void;
  hidePanel: (id: string) => void;
  togglePanel: (id: string) => void;
  setPanelPosition: (id: string, position: PanelPosition) => void;
  setActivePanel: (id: string | null) => void;

  // Toolbars
  showToolbar: (id: string) => void;
  hideToolbar: (id: string) => void;
  toggleToolbar: (id: string) => void;

  // Modals
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Command palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Context menu
  openContextMenu: (
    position: { x: number; y: number },
    items: ContextMenuItem[]
  ) => void;
  closeContextMenu: () => void;

  // Notifications
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Loading
  setLoading: (loading: boolean, message?: string) => void;

  // Full screen
  toggleFullScreen: () => void;
}

type UIStore = UIStoreState & UIStoreActions;

// ==================== Default Values ====================

const defaultPanels: Record<string, PanelState> = {
  properties: { id: "properties", visible: true, position: "right" },
  layers: { id: "layers", visible: true, position: "right" },
  doorLibrary: { id: "doorLibrary", visible: false, position: "left" },
  bom: { id: "bom", visible: false, position: "bottom" },
  quote: { id: "quote", visible: false, position: "bottom" },
  project: { id: "project", visible: false, position: "left" },
};

const defaultToolbars: Record<string, ToolbarState> = {
  draw: { id: "draw", visible: true, position: "left" },
  modify: { id: "modify", visible: true, position: "left" },
  view: { id: "view", visible: true, position: "top" },
  status: { id: "status", visible: true, position: "bottom" },
};

// ==================== Store Creation ====================

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: "dark",
      leftSidebarWidth: 280,
      rightSidebarWidth: 300,
      bottomPanelHeight: 200,
      leftSidebarVisible: true,
      rightSidebarVisible: true,
      bottomPanelVisible: false,
      panels: defaultPanels,
      activePanel: "properties",
      toolbars: defaultToolbars,
      activeModal: null,
      modalData: {},
      commandPaletteOpen: false,
      contextMenuOpen: false,
      contextMenuPosition: { x: 0, y: 0 },
      contextMenuItems: [],
      notifications: [],
      isLoading: false,
      loadingMessage: "",
      isFullScreen: false,

      // Theme
      setTheme: (theme) => set({ theme }),

      // Layout
      setLeftSidebarWidth: (width) =>
        set({ leftSidebarWidth: Math.max(200, Math.min(500, width)) }),
      setRightSidebarWidth: (width) =>
        set({ rightSidebarWidth: Math.max(200, Math.min(500, width)) }),
      setBottomPanelHeight: (height) =>
        set({ bottomPanelHeight: Math.max(100, Math.min(400, height)) }),

      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarVisible: !state.leftSidebarVisible })),
      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarVisible: !state.rightSidebarVisible })),
      toggleBottomPanel: () =>
        set((state) => ({ bottomPanelVisible: !state.bottomPanelVisible })),

      // Panels
      showPanel: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], visible: true },
          },
          activePanel: id,
        })),

      hidePanel: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], visible: false },
          },
          activePanel: state.activePanel === id ? null : state.activePanel,
        })),

      togglePanel: (id) => {
        const { panels } = get();
        const panel = panels[id];
        if (panel?.visible) {
          get().hidePanel(id);
        } else {
          get().showPanel(id);
        }
      },

      setPanelPosition: (id, position) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: { ...state.panels[id], position },
          },
        })),

      setActivePanel: (id) => set({ activePanel: id }),

      // Toolbars
      showToolbar: (id) =>
        set((state) => ({
          toolbars: {
            ...state.toolbars,
            [id]: { ...state.toolbars[id], visible: true },
          },
        })),

      hideToolbar: (id) =>
        set((state) => ({
          toolbars: {
            ...state.toolbars,
            [id]: { ...state.toolbars[id], visible: false },
          },
        })),

      toggleToolbar: (id) =>
        set((state) => ({
          toolbars: {
            ...state.toolbars,
            [id]: {
              ...state.toolbars[id],
              visible: !state.toolbars[id]?.visible,
            },
          },
        })),

      // Modals
      openModal: (id, data = {}) => set({ activeModal: id, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: {} }),

      // Command palette
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      // Context menu
      openContextMenu: (position, items) =>
        set({
          contextMenuOpen: true,
          contextMenuPosition: position,
          contextMenuItems: items,
        }),
      closeContextMenu: () =>
        set({ contextMenuOpen: false, contextMenuItems: [] }),

      // Notifications
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto remove after duration
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Loading
      setLoading: (loading, message = "") =>
        set({ isLoading: loading, loadingMessage: message }),

      // Full screen
      toggleFullScreen: () =>
        set((state) => ({ isFullScreen: !state.isFullScreen })),
    }),
    {
      name: "cad-ui-store",
      partialize: (state) => ({
        theme: state.theme,
        leftSidebarWidth: state.leftSidebarWidth,
        rightSidebarWidth: state.rightSidebarWidth,
        bottomPanelHeight: state.bottomPanelHeight,
        leftSidebarVisible: state.leftSidebarVisible,
        rightSidebarVisible: state.rightSidebarVisible,
        bottomPanelVisible: state.bottomPanelVisible,
        panels: state.panels,
        toolbars: state.toolbars,
      }),
    }
  )
);

// ==================== Selectors ====================

export const selectIsPanelVisible = (panelId: string) => (state: UIStore) =>
  state.panels[panelId]?.visible ?? false;

export const selectIsToolbarVisible = (toolbarId: string) => (state: UIStore) =>
  state.toolbars[toolbarId]?.visible ?? false;

export const selectHasNotifications = (state: UIStore) =>
  state.notifications.length > 0;
