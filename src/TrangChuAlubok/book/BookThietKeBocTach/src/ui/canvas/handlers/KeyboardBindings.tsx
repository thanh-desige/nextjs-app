/**
 * KeyboardBindings - Binds keyboard events to engine actions
 * Translates key presses to commands and shortcuts
 */

"use client";

import React, { useCallback, useEffect } from "react";

export interface KeyboardBindingsProps {
  children: React.ReactNode;
  disabled?: boolean;

  // Key handlers
  onKeyDown?: (key: string, modifiers: KeyModifiers, e: KeyboardEvent) => void;
  onKeyUp?: (key: string, modifiers: KeyModifiers, e: KeyboardEvent) => void;

  // Common shortcuts - convenience props
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;

  // Arrow key movement
  onArrowMove?: (dx: number, dy: number, shift: boolean) => void;
}

export interface KeyModifiers {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export const KeyboardBindings: React.FC<KeyboardBindingsProps> = ({
  children,
  disabled = false,
  onKeyDown,
  onKeyUp,
  onUndo,
  onRedo,
  onDelete,
  onEscape,
  onEnter,
  onSpace,
  onCopy,
  onPaste,
  onSelectAll,
  onArrowMove,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const modifiers: KeyModifiers = {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      };

      // Handle common shortcuts
      const key = e.key.toLowerCase();

      // Ctrl+Z - Undo
      if (modifiers.ctrl && key === "z" && !modifiers.shift) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if (
        (modifiers.ctrl && key === "y") ||
        (modifiers.ctrl && modifiers.shift && key === "z")
      ) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Delete/Backspace - Delete
      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Escape - Cancel
      if (key === "escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }

      // Enter - Confirm
      if (key === "enter") {
        e.preventDefault();
        onEnter?.();
        return;
      }

      // Space - Special action (e.g., repeat command in AutoCAD)
      if (key === " ") {
        e.preventDefault();
        onSpace?.();
        return;
      }

      // Ctrl+C - Copy
      if (modifiers.ctrl && key === "c") {
        e.preventDefault();
        onCopy?.();
        return;
      }

      // Ctrl+V - Paste
      if (modifiers.ctrl && key === "v") {
        e.preventDefault();
        onPaste?.();
        return;
      }

      // Ctrl+A - Select All
      if (modifiers.ctrl && key === "a") {
        e.preventDefault();
        onSelectAll?.();
        return;
      }

      // Arrow keys - Move
      if (onArrowMove) {
        const moveStep = modifiers.shift ? 10 : 1;
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            onArrowMove(-moveStep, 0, modifiers.shift);
            return;
          case "ArrowRight":
            e.preventDefault();
            onArrowMove(moveStep, 0, modifiers.shift);
            return;
          case "ArrowUp":
            e.preventDefault();
            onArrowMove(0, moveStep, modifiers.shift);
            return;
          case "ArrowDown":
            e.preventDefault();
            onArrowMove(0, -moveStep, modifiers.shift);
            return;
        }
      }

      // Generic key handler
      onKeyDown?.(e.key, modifiers, e);
    },
    [
      disabled,
      onKeyDown,
      onUndo,
      onRedo,
      onDelete,
      onEscape,
      onEnter,
      onSpace,
      onCopy,
      onPaste,
      onSelectAll,
      onArrowMove,
    ]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const modifiers: KeyModifiers = {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      };

      onKeyUp?.(e.key, modifiers, e);
    },
    [disabled, onKeyUp]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return <>{children}</>;
};

export default KeyboardBindings;
