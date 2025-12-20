/**
 * ModifyToolbar - Toolbar for modify commands
 */

"use client";

import React from "react";

// ==================== Types ====================

export type ModifyTool =
  | "move"
  | "copy"
  | "rotate"
  | "scale"
  | "mirror"
  | "offset"
  | "trim"
  | "extend"
  | "delete";

export interface ModifyToolbarProps {
  /** Execute modify command */
  onExecute: (tool: ModifyTool) => void;
  /** Disabled tools */
  disabledTools?: ModifyTool[];
  /** Whether toolbar is vertical */
  vertical?: boolean;
  /** Additional class name */
  className?: string;
}

interface ToolButtonProps {
  tool: ModifyTool;
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}

// ==================== Tool Icons ====================

const icons = {
  move: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" />
    </svg>
  ),
  copy: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <rect x="8" y="8" width="12" height="12" rx="1" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  ),
  rotate: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M21 12a9 9 0 1 1-9-9" />
      <path d="M21 3v9h-9" />
    </svg>
  ),
  scale: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <rect x="4" y="4" width="6" height="6" />
      <rect x="10" y="10" width="10" height="10" />
    </svg>
  ),
  mirror: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M12 3v18" strokeDasharray="2 2" />
      <polygon points="6,8 6,16 3,12" />
      <polygon points="18,8 18,16 21,12" />
    </svg>
  ),
  offset: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <rect x="3" y="3" width="12" height="12" rx="1" strokeDasharray="2 2" />
    </svg>
  ),
  trim: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  extend: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <line x1="4" y1="12" x2="16" y2="12" />
      <path d="M12 8l4 4-4 4" />
      <line x1="20" y1="4" x2="20" y2="20" />
    </svg>
  ),
  delete: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
};

// ==================== ToolButton Component ====================

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  icon,
  label,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={`
      flex items-center justify-center w-10 h-10 rounded-lg
      transition-all duration-150 ease-in-out
      ${
        disabled
          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
          : "bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white"
      }
    `}
    data-tool={tool}
  >
    {icon}
  </button>
);

// ==================== ModifyToolbar Component ====================

export const ModifyToolbar: React.FC<ModifyToolbarProps> = ({
  onExecute,
  disabledTools = [],
  vertical = true,
  className = "",
}) => {
  const tools: { tool: ModifyTool; label: string }[] = [
    { tool: "move", label: "Move (M)" },
    { tool: "copy", label: "Copy (CO)" },
    { tool: "rotate", label: "Rotate (RO)" },
    { tool: "scale", label: "Scale (SC)" },
    { tool: "mirror", label: "Mirror (MI)" },
    { tool: "offset", label: "Offset (O)" },
    { tool: "trim", label: "Trim (TR)" },
    { tool: "extend", label: "Extend (EX)" },
    { tool: "delete", label: "Delete (DEL)" },
  ];

  return (
    <div
      className={`
        flex ${vertical ? "flex-col" : "flex-row"} gap-1 p-2
        bg-gray-800 rounded-xl shadow-xl
        ${className}
      `}
      role="toolbar"
      aria-label="Modify Tools"
    >
      {tools.map(({ tool, label }) => (
        <ToolButton
          key={tool}
          tool={tool}
          icon={icons[tool]}
          label={label}
          disabled={disabledTools.includes(tool)}
          onClick={() => onExecute(tool)}
        />
      ))}
    </div>
  );
};

export default ModifyToolbar;
