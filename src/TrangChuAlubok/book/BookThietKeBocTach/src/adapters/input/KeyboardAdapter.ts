/**
 * Keyboard Adapter
 * Handles keyboard input for CAD application with shortcut management
 */

// ===== Key State =====
export interface KeyState {
  key: string;
  code: string;
  isDown: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// ===== Keyboard Event =====
export interface KeyboardEvent {
  type: "keydown" | "keyup" | "keypress";
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
}

// ===== Shortcut Definition =====
export interface ShortcutDefinition {
  id: string;
  name: string;
  description?: string;
  key: string; // Primary key (e.g., 'L', 'Delete', 'Escape')
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  action: () => void;
  enabled?: boolean;
  category?: string;
}

// ===== Shortcut Match Result =====
export interface ShortcutMatch {
  shortcut: ShortcutDefinition;
  exact: boolean;
}

// ===== Event Handler Types =====
export type KeyboardEventHandler = (event: KeyboardEvent) => void;
export type ShortcutHandler = (shortcut: ShortcutDefinition) => void;

// ===== Keyboard Adapter Configuration =====
export interface KeyboardAdapterConfig {
  preventDefaultForShortcuts: boolean;
  allowRepeat: boolean;
  repeatDelay: number; // ms before repeat starts
  repeatInterval: number; // ms between repeats
}

const DEFAULT_CONFIG: KeyboardAdapterConfig = {
  preventDefaultForShortcuts: true,
  allowRepeat: false,
  repeatDelay: 500,
  repeatInterval: 50,
};

// ===== Keyboard Adapter Implementation =====
export class KeyboardAdapter {
  private element: HTMLElement | Document | null = null;
  private config: KeyboardAdapterConfig;

  // Active key states
  private activeKeys: Map<string, KeyState> = new Map();

  // Registered shortcuts
  private shortcuts: Map<string, ShortcutDefinition> = new Map();

  // Event handlers
  private keyDownHandlers: Set<KeyboardEventHandler> = new Set();
  private keyUpHandlers: Set<KeyboardEventHandler> = new Set();
  private shortcutHandlers: Set<ShortcutHandler> = new Set();

  // Input mode (for text input fields)
  private inputMode = false;

  // Command input buffer (for multi-key commands like CAD)
  private commandBuffer = "";
  private commandTimeout: ReturnType<typeof setTimeout> | null = null;
  private commandTimeoutDuration = 1000; // ms

  // Bound handlers for cleanup
  private boundKeyDown: (e: globalThis.KeyboardEvent) => void;
  private boundKeyUp: (e: globalThis.KeyboardEvent) => void;
  private boundBlur: () => void;

  constructor(config: Partial<KeyboardAdapterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundBlur = this.handleBlur.bind(this);
  }

  // === Initialization ===
  attach(element: HTMLElement | Document = document): void {
    this.element = element;

    element.addEventListener("keydown", this.boundKeyDown as EventListener);
    element.addEventListener("keyup", this.boundKeyUp as EventListener);

    // Clear keys on blur
    if (element instanceof HTMLElement) {
      element.addEventListener("blur", this.boundBlur);
    }
    window.addEventListener("blur", this.boundBlur);
  }

  detach(): void {
    if (this.element) {
      this.element.removeEventListener(
        "keydown",
        this.boundKeyDown as EventListener
      );
      this.element.removeEventListener(
        "keyup",
        this.boundKeyUp as EventListener
      );

      if (this.element instanceof HTMLElement) {
        this.element.removeEventListener("blur", this.boundBlur);
      }
    }
    window.removeEventListener("blur", this.boundBlur);

    this.activeKeys.clear();
    this.clearCommandBuffer();
    this.element = null;
  }

  // === Event Handlers ===
  private handleKeyDown(e: globalThis.KeyboardEvent): void {
    // Skip if in input mode and not a global shortcut
    if (this.inputMode && !this.isGlobalShortcut(e)) {
      return;
    }

    // Skip repeats if not allowed
    if (e.repeat && !this.config.allowRepeat) {
      return;
    }

    const keyState: KeyState = {
      key: e.key,
      code: e.code,
      isDown: true,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
    };

    this.activeKeys.set(e.code, keyState);

    const event: KeyboardEvent = {
      type: "keydown",
      key: e.key,
      code: e.code,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      repeat: e.repeat,
    };

    // Check for shortcuts
    const matchedShortcut = this.findMatchingShortcut(event);
    if (matchedShortcut) {
      if (this.config.preventDefaultForShortcuts) {
        e.preventDefault();
        e.stopPropagation();
      }

      this.executeShortcut(matchedShortcut);
      return;
    }

    // Handle command buffer for single-key commands (CAD style)
    if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
      this.appendToCommandBuffer(e.key.toUpperCase());
    }

    // Emit keydown event
    this.keyDownHandlers.forEach((handler) => handler(event));
  }

  private handleKeyUp(e: globalThis.KeyboardEvent): void {
    this.activeKeys.delete(e.code);

    const event: KeyboardEvent = {
      type: "keyup",
      key: e.key,
      code: e.code,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      repeat: false,
    };

    this.keyUpHandlers.forEach((handler) => handler(event));
  }

  private handleBlur(): void {
    // Clear all active keys when window loses focus
    this.activeKeys.clear();
  }

  // === Shortcut Management ===
  registerShortcut(shortcut: ShortcutDefinition): void {
    this.shortcuts.set(shortcut.id, {
      ...shortcut,
      enabled: shortcut.enabled ?? true,
    });
  }

  registerShortcuts(shortcuts: ShortcutDefinition[]): void {
    shortcuts.forEach((s) => this.registerShortcut(s));
  }

  unregisterShortcut(id: string): void {
    this.shortcuts.delete(id);
  }

  enableShortcut(id: string, enabled = true): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }

  disableShortcut(id: string): void {
    this.enableShortcut(id, false);
  }

  getShortcut(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id);
  }

  getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: string): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values()).filter(
      (s) => s.category === category
    );
  }

  private findMatchingShortcut(
    event: KeyboardEvent
  ): ShortcutDefinition | null {
    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue;

      if (this.matchesShortcut(event, shortcut)) {
        return shortcut;
      }
    }
    return null;
  }

  private matchesShortcut(
    event: KeyboardEvent,
    shortcut: ShortcutDefinition
  ): boolean {
    // Match key (case insensitive)
    const keyMatches =
      event.key.toUpperCase() === shortcut.key.toUpperCase() ||
      event.code === shortcut.key;

    if (!keyMatches) return false;

    // Match modifiers
    const mods = shortcut.modifiers ?? {};
    const ctrlMatch = (mods.ctrl ?? false) === event.ctrlKey;
    const shiftMatch = (mods.shift ?? false) === event.shiftKey;
    const altMatch = (mods.alt ?? false) === event.altKey;
    const metaMatch = (mods.meta ?? false) === event.metaKey;

    return ctrlMatch && shiftMatch && altMatch && metaMatch;
  }

  private executeShortcut(shortcut: ShortcutDefinition): void {
    // Notify handlers
    this.shortcutHandlers.forEach((handler) => handler(shortcut));

    // Execute action
    shortcut.action();
  }

  private isGlobalShortcut(e: globalThis.KeyboardEvent): boolean {
    // Escape and some Ctrl shortcuts are always global
    if (e.key === "Escape") return true;
    if (
      e.ctrlKey &&
      ["s", "z", "y", "c", "v", "x", "a"].includes(e.key.toLowerCase())
    ) {
      return true;
    }
    return false;
  }

  // === Command Buffer (CAD-style) ===
  private appendToCommandBuffer(char: string): void {
    this.commandBuffer += char;

    // Reset timeout
    if (this.commandTimeout) {
      clearTimeout(this.commandTimeout);
    }

    this.commandTimeout = setTimeout(() => {
      this.clearCommandBuffer();
    }, this.commandTimeoutDuration);
  }

  getCommandBuffer(): string {
    return this.commandBuffer;
  }

  clearCommandBuffer(): void {
    this.commandBuffer = "";
    if (this.commandTimeout) {
      clearTimeout(this.commandTimeout);
      this.commandTimeout = null;
    }
  }

  setCommandTimeoutDuration(ms: number): void {
    this.commandTimeoutDuration = ms;
  }

  // === Input Mode ===
  setInputMode(enabled: boolean): void {
    this.inputMode = enabled;
  }

  isInputModeEnabled(): boolean {
    return this.inputMode;
  }

  // === Event Subscription ===
  onKeyDown(handler: KeyboardEventHandler): void {
    this.keyDownHandlers.add(handler);
  }

  offKeyDown(handler: KeyboardEventHandler): void {
    this.keyDownHandlers.delete(handler);
  }

  onKeyUp(handler: KeyboardEventHandler): void {
    this.keyUpHandlers.add(handler);
  }

  offKeyUp(handler: KeyboardEventHandler): void {
    this.keyUpHandlers.delete(handler);
  }

  onShortcut(handler: ShortcutHandler): void {
    this.shortcutHandlers.add(handler);
  }

  offShortcut(handler: ShortcutHandler): void {
    this.shortcutHandlers.delete(handler);
  }

  // === State Query ===
  isKeyDown(keyOrCode: string): boolean {
    // Check by code first
    if (this.activeKeys.has(keyOrCode)) {
      return true;
    }

    // Check by key
    for (const state of this.activeKeys.values()) {
      if (state.key.toUpperCase() === keyOrCode.toUpperCase()) {
        return true;
      }
    }

    return false;
  }

  isModifierDown(modifier: "ctrl" | "shift" | "alt" | "meta"): boolean {
    for (const state of this.activeKeys.values()) {
      switch (modifier) {
        case "ctrl":
          if (state.ctrlKey) return true;
          break;
        case "shift":
          if (state.shiftKey) return true;
          break;
        case "alt":
          if (state.altKey) return true;
          break;
        case "meta":
          if (state.metaKey) return true;
          break;
      }
    }
    return false;
  }

  getActiveKeys(): string[] {
    return Array.from(this.activeKeys.keys());
  }

  getActiveKeyStates(): KeyState[] {
    return Array.from(this.activeKeys.values());
  }

  // === Configuration ===
  getConfig(): KeyboardAdapterConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<KeyboardAdapterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // === Utility: Shortcut String Formatting ===
  static formatShortcut(shortcut: ShortcutDefinition): string {
    const parts: string[] = [];
    const mods = shortcut.modifiers ?? {};

    if (mods.ctrl) parts.push("Ctrl");
    if (mods.shift) parts.push("Shift");
    if (mods.alt) parts.push("Alt");
    if (mods.meta) parts.push("⌘");

    parts.push(shortcut.key.toUpperCase());

    return parts.join("+");
  }

  static parseShortcut(shortcutString: string): Partial<ShortcutDefinition> {
    const parts = shortcutString.split("+").map((p) => p.trim().toLowerCase());

    const modifiers = {
      ctrl: parts.includes("ctrl"),
      shift: parts.includes("shift"),
      alt: parts.includes("alt"),
      meta:
        parts.includes("⌘") || parts.includes("cmd") || parts.includes("meta"),
    };

    // Last part that's not a modifier is the key
    const key =
      parts.find(
        (p) => !["ctrl", "shift", "alt", "⌘", "cmd", "meta"].includes(p)
      ) ?? "";

    return { key, modifiers };
  }
}

// ===== Default CAD Shortcuts =====
export const DEFAULT_CAD_SHORTCUTS: Omit<ShortcutDefinition, "action">[] = [
  // Drawing commands
  {
    id: "cmd_line",
    name: "Line",
    key: "L",
    category: "draw",
    description: "Draw a line",
  },
  {
    id: "cmd_rect",
    name: "Rectangle",
    key: "R",
    category: "draw",
    description: "Draw a rectangle",
  },
  {
    id: "cmd_circle",
    name: "Circle",
    key: "C",
    category: "draw",
    description: "Draw a circle",
  },
  {
    id: "cmd_arc",
    name: "Arc",
    key: "A",
    category: "draw",
    description: "Draw an arc",
  },
  {
    id: "cmd_polyline",
    name: "Polyline",
    key: "P",
    category: "draw",
    description: "Draw a polyline",
  },
  {
    id: "cmd_text",
    name: "Text",
    key: "T",
    category: "draw",
    description: "Add text",
  },

  // Modify commands
  {
    id: "cmd_move",
    name: "Move",
    key: "M",
    category: "modify",
    description: "Move selected objects",
  },
  {
    id: "cmd_copy",
    name: "Copy",
    key: "O",
    category: "modify",
    description: "Copy selected objects",
  },
  {
    id: "cmd_rotate",
    name: "Rotate",
    key: "RO",
    category: "modify",
    description: "Rotate selected objects",
  },
  {
    id: "cmd_scale",
    name: "Scale",
    key: "SC",
    category: "modify",
    description: "Scale selected objects",
  },
  {
    id: "cmd_mirror",
    name: "Mirror",
    key: "MI",
    category: "modify",
    description: "Mirror selected objects",
  },
  {
    id: "cmd_offset",
    name: "Offset",
    key: "OF",
    category: "modify",
    description: "Offset selected objects",
  },
  {
    id: "cmd_trim",
    name: "Trim",
    key: "TR",
    category: "modify",
    description: "Trim objects",
  },
  {
    id: "cmd_extend",
    name: "Extend",
    key: "EX",
    category: "modify",
    description: "Extend objects",
  },

  // Edit commands
  {
    id: "cmd_undo",
    name: "Undo",
    key: "Z",
    modifiers: { ctrl: true },
    category: "edit",
    description: "Undo last action",
  },
  {
    id: "cmd_redo",
    name: "Redo",
    key: "Y",
    modifiers: { ctrl: true },
    category: "edit",
    description: "Redo last undone action",
  },
  {
    id: "cmd_delete",
    name: "Delete",
    key: "Delete",
    category: "edit",
    description: "Delete selected objects",
  },
  {
    id: "cmd_select_all",
    name: "Select All",
    key: "A",
    modifiers: { ctrl: true },
    category: "edit",
    description: "Select all objects",
  },
  {
    id: "cmd_deselect",
    name: "Deselect",
    key: "Escape",
    category: "edit",
    description: "Deselect all and cancel command",
  },

  // View commands
  {
    id: "cmd_zoom_fit",
    name: "Zoom Fit",
    key: "F",
    category: "view",
    description: "Zoom to fit all objects",
  },
  {
    id: "cmd_zoom_in",
    name: "Zoom In",
    key: "+",
    category: "view",
    description: "Zoom in",
  },
  {
    id: "cmd_zoom_out",
    name: "Zoom Out",
    key: "-",
    category: "view",
    description: "Zoom out",
  },
  {
    id: "cmd_pan",
    name: "Pan",
    key: "H",
    category: "view",
    description: "Pan view",
  },

  // Osnap toggles
  {
    id: "cmd_osnap_endpoint",
    name: "Osnap Endpoint",
    key: "E",
    modifiers: { shift: true },
    category: "osnap",
  },
  {
    id: "cmd_osnap_midpoint",
    name: "Osnap Midpoint",
    key: "M",
    modifiers: { shift: true },
    category: "osnap",
  },
  {
    id: "cmd_osnap_center",
    name: "Osnap Center",
    key: "C",
    modifiers: { shift: true },
    category: "osnap",
  },
  {
    id: "cmd_osnap_intersection",
    name: "Osnap Intersection",
    key: "I",
    modifiers: { shift: true },
    category: "osnap",
  },
  {
    id: "cmd_osnap_toggle",
    name: "Toggle Osnap",
    key: "F3",
    category: "osnap",
  },

  // Grid
  {
    id: "cmd_grid_toggle",
    name: "Toggle Grid",
    key: "G",
    modifiers: { ctrl: true },
    category: "view",
  },
  { id: "cmd_snap_toggle", name: "Toggle Snap", key: "F9", category: "view" },

  // File
  {
    id: "cmd_save",
    name: "Save",
    key: "S",
    modifiers: { ctrl: true },
    category: "file",
  },
  {
    id: "cmd_open",
    name: "Open",
    key: "O",
    modifiers: { ctrl: true },
    category: "file",
  },
  {
    id: "cmd_new",
    name: "New",
    key: "N",
    modifiers: { ctrl: true },
    category: "file",
  },
  {
    id: "cmd_export",
    name: "Export",
    key: "E",
    modifiers: { ctrl: true },
    category: "file",
  },
];
