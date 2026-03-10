/**
 * CadLayout - Main layout component for CAD interface
 * TODO: Implement full layout structure
 */

import React from "react";

// ==================== Type Exports ====================

export type PanelPosition = "left" | "right" | "top" | "bottom" | "center";

export interface PanelConfig {
  id: string;
  position: PanelPosition;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  title?: string;
}

export interface CadLayoutProps {
  children?: React.ReactNode;
  panels?: PanelConfig[];
  className?: string;
}

// ==================== Component ====================

export const CadLayout: React.FC<CadLayoutProps> = ({
  children,
  className,
}) => {
  return <div className={`cad-layout ${className || ""}`}>{children}</div>;
};

export default CadLayout;
