/**
 * ViewToolbar - Toolbar for view/navigation commands
 */

"use client";

import React from "react";

// ==================== Types ====================

export type ViewAction =
  | "zoomIn"
  | "zoomOut"
  | "zoomFit"
  | "zoomWindow"
  | "pan"
  | "resetView"
  | "toggleGrid"
  | "toggleSnap"
  | "toggleOrtho";

export interface ViewToolbarProps {
  /** Execute view action */
  onAction: (action: ViewAction) => void;
  /** Current state */
  state?: {
    gridEnabled?: boolean;
    snapEnabled?: boolean;
    orthoEnabled?: boolean;
  };
  /** Whether toolbar is vertical */
  vertical?: boolean;
  /** Additional class name */
  className?: string;
}

interface ActionButtonProps {
  action: ViewAction;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

// ==================== Action Icons ====================

const icons = {
  zoomIn: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  zoomOut: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  zoomFit: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  ),
  zoomWindow: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  pan: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.4L3.2 16a2 2 0 0 1 3-2.6l1.8 2" />
    </svg>
  ),
  resetView: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  toggleGrid: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  toggleSnap: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  toggleOrtho: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M3 12h18M12 3v18" />
      <rect x="8" y="8" width="8" height="8" strokeDasharray="2 2" />
    </svg>
  ),
};

// ==================== ActionButton Component ====================

const ActionButton: React.FC<ActionButtonProps> = ({
  action,
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
          ? "bg-green-600 text-white shadow-lg"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
      }
    `}
    data-action={action}
  >
    {icon}
  </button>
);

// ==================== ViewToolbar Component ====================

export const ViewToolbar: React.FC<ViewToolbarProps> = ({
  onAction,
  state = {},
  vertical = false,
  className = "",
}) => {
  const {
    gridEnabled = true,
    snapEnabled = true,
    orthoEnabled = false,
  } = state;

  const actions: { action: ViewAction; label: string; isToggle?: boolean }[] = [
    { action: "zoomIn", label: "Zoom In (+)" },
    { action: "zoomOut", label: "Zoom Out (-)" },
    { action: "zoomFit", label: "Zoom Fit (F)" },
    { action: "zoomWindow", label: "Zoom Window (Z)" },
    { action: "pan", label: "Pan (P)" },
    { action: "resetView", label: "Reset View (Home)" },
    { action: "toggleGrid", label: "Toggle Grid (G)", isToggle: true },
    { action: "toggleSnap", label: "Toggle Snap (S)", isToggle: true },
    { action: "toggleOrtho", label: "Toggle Ortho (O)", isToggle: true },
  ];

  const getActiveState = (action: ViewAction): boolean => {
    switch (action) {
      case "toggleGrid":
        return gridEnabled;
      case "toggleSnap":
        return snapEnabled;
      case "toggleOrtho":
        return orthoEnabled;
      default:
        return false;
    }
  };

  return (
    <div
      className={`
        flex ${vertical ? "flex-col" : "flex-row"} gap-1 p-2
        bg-gray-800 rounded-xl shadow-xl
        ${className}
      `}
      role="toolbar"
      aria-label="View Tools"
    >
      {actions.map(({ action, label, isToggle }) => (
        <ActionButton
          key={action}
          action={action}
          icon={icons[action]}
          label={label}
          isActive={isToggle ? getActiveState(action) : undefined}
          onClick={() => onAction(action)}
        />
      ))}
    </div>
  );
};

export default ViewToolbar;
