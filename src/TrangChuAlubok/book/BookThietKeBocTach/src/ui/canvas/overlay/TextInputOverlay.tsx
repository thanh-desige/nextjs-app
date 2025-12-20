/**
 * TextInputOverlay - Overlay for text input when using TEXT command
 *
 * Features:
 * - Floating input box at text position
 * - Real-time preview
 * - Support for multi-line text
 * - Font options toolbar
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface TextInputOverlayProps {
  /** Is text input active */
  isActive: boolean;
  /** Position in screen coordinates */
  position: { x: number; y: number } | null;
  /** Initial text value */
  initialValue?: string;
  /** Text options */
  options?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    textAlign?: "left" | "center" | "right";
  };
  /** Callback when text is submitted */
  onSubmit: (text: string) => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Callback when options change */
  onOptionsChange?: (options: {
    fontSize: number;
    fontFamily: string;
    fontWeight: "normal" | "bold";
    fontStyle: "normal" | "italic";
    textAlign: "left" | "center" | "right";
  }) => void;
}

export const TextInputOverlay: React.FC<TextInputOverlayProps> = ({
  isActive,
  position,
  initialValue = "",
  options = {},
  onSubmit,
  onCancel,
  onOptionsChange,
}) => {
  const [text, setText] = useState(initialValue);
  const [showOptions, setShowOptions] = useState(false);
  const [localOptions, setLocalOptions] = useState({
    fontSize: options.fontSize || 14,
    fontFamily: options.fontFamily || "Arial",
    fontWeight: options.fontWeight || "normal",
    fontStyle: options.fontStyle || "normal",
    textAlign: options.textAlign || "left",
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when activated
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isActive]);

  // Reset when activated
  useEffect(() => {
    if (isActive) {
      // Use startTransition to avoid React warning about setState in effect
      React.startTransition(() => {
        setText(initialValue);
      });
    }
  }, [isActive, initialValue]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(text);
      setText("");
      setShowOptions(false);
    }
  }, [text, onSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setText("");
    setShowOptions(false);
    onCancel();
  }, [onCancel]);

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSubmit, handleCancel]
  );

  // Handle option change
  const handleOptionChange = useCallback(
    (key: keyof typeof localOptions, value: string | number) => {
      const newOptions = { ...localOptions, [key]: value };
      setLocalOptions(newOptions);
      onOptionsChange?.(newOptions);
    },
    [localOptions, onOptionsChange]
  );

  // Toggle bold
  const toggleBold = useCallback(() => {
    const newWeight = localOptions.fontWeight === "bold" ? "normal" : "bold";
    handleOptionChange("fontWeight", newWeight);
  }, [localOptions.fontWeight, handleOptionChange]);

  // Toggle italic
  const toggleItalic = useCallback(() => {
    const newStyle = localOptions.fontStyle === "italic" ? "normal" : "italic";
    handleOptionChange("fontStyle", newStyle);
  }, [localOptions.fontStyle, handleOptionChange]);

  // Cycle alignment
  const cycleAlignment = useCallback(() => {
    const alignments: Array<"left" | "center" | "right"> = [
      "left",
      "center",
      "right",
    ];
    const currentIndex = alignments.indexOf(localOptions.textAlign);
    const nextAlign = alignments[(currentIndex + 1) % 3];
    handleOptionChange("textAlign", nextAlign);
  }, [localOptions.textAlign, handleOptionChange]);

  if (!isActive || !position) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Text Input */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3">
        {/* Options Toolbar */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
          {/* Font Size */}
          <select
            value={localOptions.fontSize}
            onChange={(e) =>
              handleOptionChange("fontSize", Number(e.target.value))
            }
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>

          {/* Font Family */}
          <select
            value={localOptions.fontFamily}
            onChange={(e) => handleOptionChange("fontFamily", e.target.value)}
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Helvetica">Helvetica</option>
          </select>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-600" />

          {/* Bold */}
          <button
            onClick={toggleBold}
            className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
              localOptions.fontWeight === "bold"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            title="Bold (Ctrl+B)"
          >
            B
          </button>

          {/* Italic */}
          <button
            onClick={toggleItalic}
            className={`px-2 py-1 rounded text-xs italic transition-colors ${
              localOptions.fontStyle === "italic"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            title="Italic (Ctrl+I)"
          >
            I
          </button>

          {/* Alignment */}
          <button
            onClick={cycleAlignment}
            className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            title={`Alignment: ${localOptions.textAlign}`}
          >
            {localOptions.textAlign === "left" && "⬅"}
            {localOptions.textAlign === "center" && "⬌"}
            {localOptions.textAlign === "right" && "➡"}
          </button>
        </div>

        {/* Text Area */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập văn bản..."
          className="bg-gray-800 text-white w-full min-w-[300px] min-h-[60px] max-h-[200px] p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 resize-vertical"
          style={{
            fontFamily: localOptions.fontFamily,
            fontSize: `${localOptions.fontSize}px`,
            fontWeight: localOptions.fontWeight,
            fontStyle: localOptions.fontStyle,
            textAlign: localOptions.textAlign,
          }}
        />

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            Enter: Xác nhận | Shift+Enter: Xuống dòng | Esc: Hủy
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
            >
              Tạo Text
            </button>
          </div>
        </div>
      </div>

      {/* Preview (optional - show preview near input) */}
      {text.trim() && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          Preview: {text.substring(0, 30)}
          {text.length > 30 ? "..." : ""}
        </div>
      )}
    </div>
  );
};

export default TextInputOverlay;
