/**
 * TextInputCommandOverlay - Text input for command-based TEXT tool
 * STEP-5: Extracted from CadDrawingCanvas.tsx
 *
 * Displays a textarea at the text entity position when the command-based
 * drawing system is waiting for text input.
 */

"use client";

import React from "react";
import type { Point } from "../types/CadEntity";

interface TextInputCommandOverlayProps {
  visible: boolean;
  commandDrawingPoints: Point[];
  textInputValue: string;
  setTextInput: React.Dispatch<
    React.SetStateAction<{
      active: boolean;
      value: string;
      position: Point;
      editingId?: string;
    }>
  >;
  textInputRef: React.RefObject<HTMLTextAreaElement | null>;
  textInputMountedRef: React.MutableRefObject<boolean>;
  onTextInputCommand: (text: string) => void;
  onEscape: () => void;
  canvasDimensions: { width: number; height: number };
  pan: Point;
  zoom: number;
}

const textareaStyle: React.CSSProperties = {
  padding: "8px",
  fontSize: 14,
  border: "2px solid #4a90d9",
  borderRadius: 4,
  background: "#1a1a2e",
  color: "#fff",
  outline: "none",
  minWidth: 200,
  minHeight: 60,
  resize: "both",
  fontFamily: "Arial, sans-serif",
};

export const TextInputCommandOverlay: React.FC<
  TextInputCommandOverlayProps
> = ({
  visible,
  commandDrawingPoints,
  textInputValue,
  setTextInput,
  textInputRef,
  textInputMountedRef,
  onTextInputCommand,
  onEscape,
  canvasDimensions,
  pan,
  zoom,
}) => {
  if (!visible) return null;

  const textPos = commandDrawingPoints[0] || { x: 0, y: 0 };
  const centerX = canvasDimensions.width / 2 + pan.x;
  const centerY = canvasDimensions.height / 2 + pan.y;
  const textScreenX = centerX + textPos.x * zoom;
  const textScreenY = centerY - textPos.y * zoom;

  const handleSaveText = () => {
    if (!textInputMountedRef.current) return;
    if (textInputValue.trim()) {
      textInputMountedRef.current = false;
      onTextInputCommand(textInputValue);
      setTextInput({ active: false, value: "", position: { x: 0, y: 0 } });
    }
    // If empty text, keep textarea open
  };

  return (
    <div
      style={{
        position: "absolute",
        left: textScreenX,
        top: textScreenY - 60,
        zIndex: 1001,
      }}
    >
      <textarea
        ref={textInputRef}
        value={textInputValue}
        onChange={(e) =>
          setTextInput((prev) => ({ ...prev, value: e.target.value }))
        }
        onFocus={() => {
          textInputMountedRef.current = true;
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") {
            onEscape();
            setTextInput({
              active: false,
              value: "",
              position: { x: 0, y: 0 },
            });
            textInputMountedRef.current = false;
          }
          // Enter inserts newline (default behavior)
        }}
        onBlur={handleSaveText}
        autoFocus
        rows={3}
        style={textareaStyle}
        placeholder="Enter text... (click outside to save)"
      />
    </div>
  );
};
