/**
 * CadLayout - Main layout component for CAD application
 */

"use client";

import React, { useState, useCallback, useRef } from "react";

// ==================== Types ====================

export type PanelPosition = "left" | "right" | "bottom";

export interface PanelConfig {
  id: string;
  title: string;
  position: PanelPosition;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  visible: boolean;
  collapsible?: boolean;
}

export interface CadLayoutProps {
  /** Header content */
  header?: React.ReactNode;
  /** Left sidebar content */
  leftSidebar?: React.ReactNode;
  /** Right sidebar content */
  rightSidebar?: React.ReactNode;
  /** Bottom panel content */
  bottomPanel?: React.ReactNode;
  /** Main canvas content */
  children: React.ReactNode;
  /** Status bar content */
  statusBar?: React.ReactNode;
  /** Left sidebar width */
  leftSidebarWidth?: number;
  /** Right sidebar width */
  rightSidebarWidth?: number;
  /** Bottom panel height */
  bottomPanelHeight?: number;
  /** Left sidebar visible */
  leftSidebarVisible?: boolean;
  /** Right sidebar visible */
  rightSidebarVisible?: boolean;
  /** Bottom panel visible */
  bottomPanelVisible?: boolean;
  /** Resize handlers */
  onLeftSidebarResize?: (width: number) => void;
  onRightSidebarResize?: (width: number) => void;
  onBottomPanelResize?: (height: number) => void;
  /** Additional class name */
  className?: string;
}

// ==================== Resizer Component ====================

interface ResizerProps {
  direction: "horizontal" | "vertical";
  onResize: (delta: number) => void;
  className?: string;
}

const Resizer: React.FC<ResizerProps> = ({
  direction,
  onResize,
  className = "",
}) => {
  const isDragging = useRef(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = direction === "horizontal" ? e.clientX : e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const currentPos =
          direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos.current;
        startPos.current = currentPos;
        onResize(delta);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [direction, onResize]
  );

  return (
    <div
      className={`
        ${
          direction === "horizontal"
            ? "w-1 cursor-col-resize"
            : "h-1 cursor-row-resize"
        }
        bg-gray-700 hover:bg-blue-500 transition-colors
        ${className}
      `}
      onMouseDown={handleMouseDown}
    />
  );
};

// ==================== CadLayout Component ====================

export const CadLayout: React.FC<CadLayoutProps> = ({
  header,
  leftSidebar,
  rightSidebar,
  bottomPanel,
  children,
  statusBar,
  leftSidebarWidth = 280,
  rightSidebarWidth = 300,
  bottomPanelHeight = 200,
  leftSidebarVisible = true,
  rightSidebarVisible = true,
  bottomPanelVisible = false,
  onLeftSidebarResize,
  onRightSidebarResize,
  onBottomPanelResize,
  className = "",
}) => {
  const [localLeftWidth, setLocalLeftWidth] = useState(leftSidebarWidth);
  const [localRightWidth, setLocalRightWidth] = useState(rightSidebarWidth);
  const [localBottomHeight, setLocalBottomHeight] = useState(bottomPanelHeight);

  const handleLeftResize = useCallback(
    (delta: number) => {
      const newWidth = Math.max(200, Math.min(500, localLeftWidth + delta));
      setLocalLeftWidth(newWidth);
      onLeftSidebarResize?.(newWidth);
    },
    [localLeftWidth, onLeftSidebarResize]
  );

  const handleRightResize = useCallback(
    (delta: number) => {
      const newWidth = Math.max(200, Math.min(500, localRightWidth - delta));
      setLocalRightWidth(newWidth);
      onRightSidebarResize?.(newWidth);
    },
    [localRightWidth, onRightSidebarResize]
  );

  const handleBottomResize = useCallback(
    (delta: number) => {
      const newHeight = Math.max(100, Math.min(400, localBottomHeight - delta));
      setLocalBottomHeight(newHeight);
      onBottomPanelResize?.(newHeight);
    },
    [localBottomHeight, onBottomPanelResize]
  );

  return (
    <div className={`flex flex-col h-screen bg-gray-900 ${className}`}>
      {/* Header */}
      {header && (
        <header className="shrink-0 border-b border-gray-700">{header}</header>
      )}

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        {leftSidebar && leftSidebarVisible && (
          <>
            <aside
              className="shrink-0 bg-gray-900 border-r border-gray-700 overflow-hidden"
              style={{ width: localLeftWidth }}
            >
              {leftSidebar}
            </aside>
            <Resizer direction="horizontal" onResize={handleLeftResize} />
          </>
        )}

        {/* Center area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Canvas area */}
          <main className="flex-1 relative overflow-hidden">{children}</main>

          {/* Bottom panel */}
          {bottomPanel && bottomPanelVisible && (
            <>
              <Resizer direction="vertical" onResize={handleBottomResize} />
              <div
                className="shrink-0 bg-gray-900 border-t border-gray-700 overflow-hidden"
                style={{ height: localBottomHeight }}
              >
                {bottomPanel}
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        {rightSidebar && rightSidebarVisible && (
          <>
            <Resizer direction="horizontal" onResize={handleRightResize} />
            <aside
              className="shrink-0 bg-gray-900 border-l border-gray-700 overflow-hidden"
              style={{ width: localRightWidth }}
            >
              {rightSidebar}
            </aside>
          </>
        )}
      </div>

      {/* Status bar */}
      {statusBar && <footer className="shrink-0">{statusBar}</footer>}
    </div>
  );
};

export default CadLayout;
