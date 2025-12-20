/**
 * DrawToolbar - Toolbar for drawing commands
 */

"use client";

import React from "react";

// ==================== Types ====================

export type DrawTool =
  | "select"
  | "line"
  | "rect"
  | "circle"
  | "arc"
  | "polygon"
  | "polyline"
  | "text"
  | "dimension";

export interface DrawToolbarProps {
  /** Currently active tool */
  activeTool: DrawTool;
  /** Tool change handler */
  onToolChange: (tool: DrawTool) => void;
  /** Whether toolbar is vertical */
  vertical?: boolean;
  /** Additional class name */
  className?: string;
}

interface ToolButtonProps {
  tool: DrawTool;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// ==================== Tool Icons ====================

const icons = {
  select: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L7 18z" />
    </svg>
  ),
  line: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  rect: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <rect x="4" y="4" width="16" height="16" rx="1" />
    </svg>
  ),
  circle: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  ),
  arc: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M4 20 A 16 16 0 0 1 20 4" />
    </svg>
  ),
  polygon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <polygon points="12,4 20,12 16,20 8,20 4,12" />
    </svg>
  ),
  polyline: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <polyline points="4,18 8,8 14,14 20,6" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M5 4v3h5.5v12h3V7H19V4z" />
    </svg>
  ),
  dimension: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="8" x2="4" y2="16" />
      <line x1="20" y1="8" x2="20" y2="16" />
      <path d="M6 12 L4 10 M6 12 L4 14" />
      <path d="M18 12 L20 10 M18 12 L20 14" />
    </svg>
  ),
};

// ==================== ToolButton Component ====================

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  icon,
  label,
  isActive,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={isActive}
    className={`
      flex items-center justify-center w-10 h-10 rounded-lg
      transition-all duration-150 ease-in-out
      ${
        isActive
          ? "bg-blue-600 text-white shadow-lg"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
      }
    `}
    data-tool={tool}
  >
    {icon}
  </button>
);

// ==================== DrawToolbar Component ====================

export const DrawToolbar: React.FC<DrawToolbarProps> = ({
  activeTool,
  onToolChange,
  vertical = true,
  className = "",
}) => {
  const tools: { tool: DrawTool; label: string }[] = [
    { tool: "select", label: "Select (V)" },
    { tool: "line", label: "Line (L)" },
    { tool: "rect", label: "Rectangle (R)" },
    { tool: "circle", label: "Circle (C)" },
    { tool: "arc", label: "Arc (A)" },
    { tool: "polygon", label: "Polygon (POL)" },
    { tool: "polyline", label: "Polyline (PL)" },
    { tool: "text", label: "Text (T)" },
    { tool: "dimension", label: "Dimension (D)" },
  ];

  return (
    <div
      className={`
        flex ${vertical ? "flex-col" : "flex-row"} gap-1 p-2
        bg-gray-800 rounded-xl shadow-xl
        ${className}
      `}
      role="toolbar"
      aria-label="Drawing Tools"
    >
      {tools.map(({ tool, label }) => (
        <ToolButton
          key={tool}
          tool={tool}
          icon={icons[tool]}
          label={label}
          isActive={activeTool === tool}
          onClick={() => onToolChange(tool)}
        />
      ))}
    </div>
  );
};

export default DrawToolbar;
