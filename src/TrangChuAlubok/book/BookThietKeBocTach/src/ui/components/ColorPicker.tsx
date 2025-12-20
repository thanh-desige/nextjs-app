/**
 * ColorPicker - Color selection component
 */

"use client";

import React, { useState, useRef, useEffect } from "react";

// ==================== Types ====================

export interface ColorPickerProps {
  /** Current color value (hex) */
  value: string;
  /** Change handler */
  onChange: (color: string) => void;
  /** Preset colors */
  presets?: string[];
  /** Label */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show alpha channel */
  showAlpha?: boolean;
  /** Additional class name */
  className?: string;
}

// ==================== Default Presets ====================

const defaultPresets = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#00ffff",
  "#ff00ff",
  "#808080",
  "#c0c0c0",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#008080",
  "#800080",
  "#ff6600",
  "#6600ff",
  "#00ff66",
  "#ff0066",
];

// ==================== Helper Functions ====================

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

// ==================== ColorPicker Component ====================

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  presets = defaultPresets,
  label,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate and update if valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to current value if invalid
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
    setInputValue(color);
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    onChange(color);
    setInputValue(color);
  };

  const rgb = hexToRgb(value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-gray-300">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Color swatch button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            relative w-10 h-10 rounded-lg border-2 border-gray-600
            overflow-hidden transition-colors
            hover:border-gray-500 focus:outline-none focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{ backgroundColor: value }}
          aria-label="Open color picker"
        >
          {/* Checkerboard pattern for transparency */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
        </button>

        {/* Hex input */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="w-24 px-2 py-2 text-sm font-mono bg-gray-700 text-white rounded-lg border border-gray-600 outline-none focus:border-blue-500 disabled:opacity-50"
          placeholder="#000000"
        />

        {/* Native color input (hidden) */}
        <input
          type="color"
          value={value}
          onChange={handleNativeColorChange}
          disabled={disabled}
          className="w-0 h-0 opacity-0 absolute"
          tabIndex={-1}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-64">
          {/* Native color picker button */}
          <div className="mb-3">
            <label className="relative flex items-center justify-center w-full h-10 bg-gray-700 rounded cursor-pointer hover:bg-gray-650 transition-colors">
              <span className="text-sm text-gray-300">Open Color Picker</span>
              <input
                type="color"
                value={value}
                onChange={handleNativeColorChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Preset colors */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Presets</p>
            <div className="grid grid-cols-10 gap-1">
              {presets.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handlePresetClick(color)}
                  className={`
                    w-5 h-5 rounded border transition-transform hover:scale-110
                    ${
                      color === value
                        ? "border-blue-500 ring-1 ring-blue-500"
                        : "border-gray-600"
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* RGB values */}
          {rgb && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-400">R</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) =>
                    onChange(
                      rgbToHex(parseInt(e.target.value) || 0, rgb.g, rgb.b)
                    )
                  }
                  className="w-12 px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600 outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-400">G</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) =>
                    onChange(
                      rgbToHex(rgb.r, parseInt(e.target.value) || 0, rgb.b)
                    )
                  }
                  className="w-12 px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600 outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-400">B</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) =>
                    onChange(
                      rgbToHex(rgb.r, rgb.g, parseInt(e.target.value) || 0)
                    )
                  }
                  className="w-12 px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
