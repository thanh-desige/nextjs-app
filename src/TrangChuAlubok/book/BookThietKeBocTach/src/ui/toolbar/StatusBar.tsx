/**
 * StatusBar - Bottom status bar showing current state and coordinates
 */

"use client";

import React from "react";
import type { Vec2 } from "../../core/geometry/Vec2";

// ==================== Types ====================

export interface StatusBarProps {
  /** Current mouse position in world coordinates */
  position?: Vec2;
  /** Current zoom level */
  zoom?: number;
  /** Current active command */
  activeCommand?: string;
  /** Command prompt message */
  prompt?: string;
  /** Grid status */
  gridEnabled?: boolean;
  /** Snap status */
  snapEnabled?: boolean;
  /** Ortho status */
  orthoEnabled?: boolean;
  /** Selection count */
  selectionCount?: number;
  /** Unit display */
  unit?: string;
  /** Additional class name */
  className?: string;
  /** Toggle handlers */
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
  onToggleOrtho?: () => void;
}

// ==================== Helper Components ====================

interface StatusItemProps {
  label: string;
  value: string | number;
  className?: string;
}

const StatusItem: React.FC<StatusItemProps> = ({
  label,
  value,
  className = "",
}) => (
  <div className={`flex items-center gap-1 px-2 ${className}`}>
    <span className="text-gray-500 text-xs">{label}:</span>
    <span className="text-white text-xs font-mono">{value}</span>
  </div>
);

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  isActive,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      px-2 py-1 text-xs font-medium rounded
      transition-colors duration-150
      ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-700 text-gray-400 hover:text-white"
      }
    `}
  >
    {label}
  </button>
);

// ==================== StatusBar Component ====================

export const StatusBar: React.FC<StatusBarProps> = ({
  position,
  zoom = 1,
  activeCommand,
  prompt,
  gridEnabled = true,
  snapEnabled = true,
  orthoEnabled = false,
  selectionCount = 0,
  unit = "mm",
  className = "",
  onToggleGrid,
  onToggleSnap,
  onToggleOrtho,
}) => {
  const formatCoord = (value: number): string => {
    return value.toFixed(2);
  };

  const formatZoom = (z: number): string => {
    return `${Math.round(z * 100)}%`;
  };

  return (
    <div
      className={`
        flex items-center justify-between h-8 px-2
        bg-gray-900 border-t border-gray-700
        ${className}
      `}
      role="status"
      aria-label="Status Bar"
    >
      {/* Left Section - Prompt and Command */}
      <div className="flex items-center gap-4 flex-1">
        {activeCommand && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500 text-xs font-medium">
              {activeCommand}
            </span>
          </div>
        )}
        {prompt && (
          <div className="text-gray-300 text-xs truncate max-w-md">
            {prompt}
          </div>
        )}
      </div>

      {/* Center Section - Coordinates */}
      <div className="flex items-center gap-2 border-l border-r border-gray-700 px-4">
        <StatusItem
          label="X"
          value={position ? formatCoord(position.x) : "0.00"}
        />
        <StatusItem
          label="Y"
          value={position ? formatCoord(position.y) : "0.00"}
        />
        <span className="text-gray-500 text-xs">{unit}</span>
      </div>

      {/* Right Section - Status Toggles */}
      <div className="flex items-center gap-2 pl-4">
        <StatusItem label="Zoom" value={formatZoom(zoom)} />

        {selectionCount > 0 && (
          <StatusItem
            label="Selected"
            value={selectionCount}
            className="text-blue-400"
          />
        )}

        <div className="flex items-center gap-1 ml-4">
          <ToggleButton
            label="GRID"
            isActive={gridEnabled}
            onClick={onToggleGrid}
          />
          <ToggleButton
            label="SNAP"
            isActive={snapEnabled}
            onClick={onToggleSnap}
          />
          <ToggleButton
            label="ORTHO"
            isActive={orthoEnabled}
            onClick={onToggleOrtho}
          />
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
