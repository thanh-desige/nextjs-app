/**
 * useKeyboard - Hook for keyboard shortcuts and input handling
 *
 * STEP-1.3: Selection actions via useCanvasEntities (Commands)
 */

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useEngineStore } from "../store/engineStore";
import { useUIStore } from "../store/uiStore";
import { useCanvasEntities } from "./useCanvasEntities";
import { ToolMode } from "../core/engine/EngineState";

// ==================== Types ====================

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
  category?: "draw" | "modify" | "view" | "edit" | "file" | "tools";
}

export interface UseKeyboardOptions {
  enabled?: boolean;
  customShortcuts?: KeyboardShortcut[];
}

export interface UseKeyboardReturn {
  // Current key state
  ctrlPressed: boolean;
  shiftPressed: boolean;
  altPressed: boolean;

  // Registration
  registerShortcut: (shortcut: KeyboardShortcut) => () => void;
  unregisterShortcut: (
    key: string,
    modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean },
  ) => void;

  // Queries
  getShortcuts: () => KeyboardShortcut[];
  getShortcutDescription: (key: string) => string | undefined;
}

// ==================== Default Shortcuts ====================

function createDefaultShortcuts(
  setActiveTool: (tool: ToolMode) => void,
  executeCommand: (cmd: string) => void,
  undo: () => void,
  redo: () => void,
  clearSelection: () => void,
  selectAll: () => void,
  toggleCommandPalette: () => void,
  toggleGrid: () => void,
  toggleOsnap: () => void,
  toggleOrtho: () => void,
  zoomFit: () => void,
): KeyboardShortcut[] {
  return [
    // Draw tools
    {
      key: "l",
      action: () => executeCommand("LINE"),
      description: "Draw Line",
      category: "draw",
    },
    {
      key: "r",
      action: () => executeCommand("RECTANGLE"),
      description: "Draw Rectangle",
      category: "draw",
    },
    {
      key: "c",
      action: () => executeCommand("CIRCLE"),
      description: "Draw Circle",
      category: "draw",
    },
    {
      key: "a",
      action: () => executeCommand("ARC"),
      description: "Draw Arc",
      category: "draw",
    },
    {
      key: "p",
      action: () => executeCommand("POLYLINE"),
      description: "Draw Polyline",
      category: "draw",
    },
    {
      key: "t",
      action: () => executeCommand("TEXT"),
      description: "Add Text",
      category: "draw",
    },
    {
      key: "d",
      action: () => executeCommand("DIMENSION"),
      description: "Add Dimension",
      category: "draw",
    },

    // Modify tools
    {
      key: "m",
      action: () => executeCommand("MOVE"),
      description: "Move",
      category: "modify",
    },
    {
      key: "o",
      action: () => executeCommand("OFFSET"),
      description: "Offset",
      category: "modify",
    },
    {
      key: "x",
      action: () => executeCommand("MIRROR"),
      description: "Mirror",
      category: "modify",
    },
    {
      key: "Delete",
      action: () => executeCommand("DELETE"),
      description: "Delete",
      category: "modify",
    },
    {
      key: "Backspace",
      action: () => executeCommand("DELETE"),
      description: "Delete",
      category: "modify",
    },

    // Edit
    {
      key: "z",
      ctrl: true,
      action: undo,
      description: "Undo",
      category: "edit",
    },
    {
      key: "y",
      ctrl: true,
      action: redo,
      description: "Redo",
      category: "edit",
    },
    {
      key: "z",
      ctrl: true,
      shift: true,
      action: redo,
      description: "Redo",
      category: "edit",
    },
    {
      key: "a",
      ctrl: true,
      action: selectAll,
      description: "Select All",
      category: "edit",
    },
    {
      key: "Escape",
      action: () => {
        clearSelection();
        executeCommand("CANCEL");
      },
      description: "Cancel/Deselect",
      category: "edit",
    },

    // View
    { key: "f", action: zoomFit, description: "Zoom Fit", category: "view" },
    {
      key: "g",
      action: toggleGrid,
      description: "Toggle Grid",
      category: "view",
    },
    {
      key: "s",
      action: toggleOsnap,
      description: "Toggle Snap",
      category: "view",
    },
    {
      key: "F8",
      action: toggleOrtho,
      description: "Toggle Ortho",
      category: "view",
    },

    // Tools
    {
      key: " ",
      action: toggleCommandPalette,
      description: "Command Palette",
      category: "tools",
    },
    {
      key: "k",
      ctrl: true,
      action: toggleCommandPalette,
      description: "Command Palette",
      category: "tools",
    },

    // Selection tool
    {
      key: "v",
      action: () => setActiveTool(ToolMode.SELECT),
      description: "Select Tool",
      category: "tools",
    },
  ];
}

// ==================== Hook Implementation ====================

export function useKeyboard(
  options: UseKeyboardOptions = {},
): UseKeyboardReturn {
  const { enabled = true, customShortcuts = [] } = options;

  // Modifier key state - using useState since we want to expose these
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);

  // Custom shortcuts storage
  const customShortcutsRef = useRef<KeyboardShortcut[]>(customShortcuts);

  // Store actions
  const setActiveTool = useEngineStore((state) => state.setActiveTool);
  const executeCommand = useEngineStore((state) => state.executeCommand);
  const undo = useEngineStore((state) => state.undo);
  const redo = useEngineStore((state) => state.redo);
  // STEP-1.3: Selection via useCanvasEntities (Commands)
  const {
    clearSelection,
    selectEntities: canvasSelectEntities,
    entities: allCanvasEntities,
  } = useCanvasEntities();
  const selectAll = useCallback(() => {
    const allIds = allCanvasEntities.map((e) => e.id);
    canvasSelectEntities(allIds, false);
  }, [allCanvasEntities, canvasSelectEntities]);
  const toggleGrid = useEngineStore((state) => state.toggleGrid);
  const toggleOsnap = useEngineStore((state) => state.toggleOsnap);
  const toggleOrtho = useEngineStore((state) => state.toggleOrtho);
  const zoomFit = useEngineStore((state) => state.zoomFit);
  const toggleCommandPalette = useUIStore(
    (state) => state.toggleCommandPalette,
  );

  // Get all shortcuts
  const getShortcuts = useCallback((): KeyboardShortcut[] => {
    const defaults = createDefaultShortcuts(
      setActiveTool,
      executeCommand,
      undo,
      redo,
      clearSelection,
      selectAll,
      toggleCommandPalette,
      toggleGrid,
      toggleOsnap,
      toggleOrtho,
      zoomFit,
    );
    return [...defaults, ...customShortcutsRef.current];
  }, [
    setActiveTool,
    executeCommand,
    undo,
    redo,
    clearSelection,
    selectAll,
    toggleCommandPalette,
    toggleGrid,
    toggleOsnap,
    toggleOrtho,
    zoomFit,
  ]);

  // Find matching shortcut
  const findShortcut = useCallback(
    (e: KeyboardEvent): KeyboardShortcut | undefined => {
      const shortcuts = getShortcuts();
      return shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = (s.ctrl ?? false) === (e.ctrlKey || e.metaKey);
        const shiftMatch = (s.shift ?? false) === e.shiftKey;
        const altMatch = (s.alt ?? false) === e.altKey;
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });
    },
    [getShortcuts],
  );

  // Key down handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Update modifier state
      setCtrlPressed(e.ctrlKey || e.metaKey);
      setShiftPressed(e.shiftKey);
      setAltPressed(e.altKey);

      // Skip if input element is focused
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape in input fields
        if (e.key !== "Escape") return;
      }

      // Find and execute matching shortcut
      const shortcut = findShortcut(e);
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    },
    [enabled, findShortcut],
  );

  // Key up handler
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setCtrlPressed(e.ctrlKey || e.metaKey);
    setShiftPressed(e.shiftKey);
    setAltPressed(e.altKey);
  }, []);

  // Register event listeners
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  // Register custom shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    customShortcutsRef.current = [...customShortcutsRef.current, shortcut];

    // Return unregister function
    return () => {
      customShortcutsRef.current = customShortcutsRef.current.filter(
        (s) => s !== shortcut,
      );
    };
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback(
    (
      key: string,
      modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean },
    ) => {
      customShortcutsRef.current = customShortcutsRef.current.filter((s) => {
        const keyMatch = s.key.toLowerCase() === key.toLowerCase();
        const ctrlMatch =
          modifiers?.ctrl === undefined || s.ctrl === modifiers.ctrl;
        const shiftMatch =
          modifiers?.shift === undefined || s.shift === modifiers.shift;
        const altMatch =
          modifiers?.alt === undefined || s.alt === modifiers.alt;
        return !(keyMatch && ctrlMatch && shiftMatch && altMatch);
      });
    },
    [],
  );

  // Get shortcut description
  const getShortcutDescription = useCallback(
    (key: string): string | undefined => {
      const shortcuts = getShortcuts();
      return shortcuts.find((s) => s.key.toLowerCase() === key.toLowerCase())
        ?.description;
    },
    [getShortcuts],
  );

  return {
    ctrlPressed,
    shiftPressed,
    altPressed,
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    getShortcutDescription,
  };
}

export default useKeyboard;
