/**
 * useStyleHandlers - Style change handlers for stroke, fill, opacity, etc.
 * STEP-5.5: Extracted from BookThietKeBocTachPage.tsx
 *
 * Handles both selected entity style editing and default style changes.
 */

import { useCallback, useMemo } from "react";

// ==================== Types ====================

interface StyleState {
  strokeColor: string;
  fillColor: string | null;
  opacity: number;
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot";
  strokeWidth: number;
}

interface DocumentEntity {
  id: string;
  color?: string;
  fillColor?: string | null;
  opacity?: number;
  strokeStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  lineWidth?: number;
  [key: string]: unknown;
}

export interface UseStyleHandlersParams {
  documentSelectedEntities: DocumentEntity[];
  currentStyle: StyleState;
  setCurrentStyle: (style: Partial<StyleState>) => void;
  updateDocumentEntity: (id: string, updates: Record<string, unknown>) => void;
  addNotification: (notification: {
    type: "info" | "success" | "error" | "warning";
    title: string;
    message: string;
    duration?: number;
  }) => void;
  colorPickerTarget: "stroke" | "fill";
  setShowColorPicker: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentColor: React.Dispatch<React.SetStateAction<string>>;
  setShowExportDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UseStyleHandlersReturn {
  displayStyle: StyleState;
  hasSelectedEntity: boolean;
  handleStrokeColorChange: (color: string) => void;
  handleFillColorChange: (color: string | null) => void;
  handleOpacityChange: (opacity: number) => void;
  handleStrokeStyleChange: (
    strokeStyle: "solid" | "dashed" | "dotted" | "dashdot",
  ) => void;
  handleStrokeWidthChange: (strokeWidth: number) => void;
  handleExport: (format: string) => Promise<void>;
  handleColorChange: (color: string) => void;
}

// ==================== Hook ====================

export function useStyleHandlers({
  documentSelectedEntities,
  currentStyle,
  setCurrentStyle,
  updateDocumentEntity,
  addNotification,
  colorPickerTarget,
  setShowColorPicker,
  setCurrentColor,
  setShowExportDialog,
}: UseStyleHandlersParams): UseStyleHandlersReturn {
  const hasSelectedEntity = documentSelectedEntities.length > 0;
  const firstSelectedEntity = documentSelectedEntities[0];

  // Computed style: from selected entity or default currentStyle
  const displayStyle = useMemo(() => {
    if (hasSelectedEntity && firstSelectedEntity) {
      return {
        strokeColor: firstSelectedEntity.color || currentStyle.strokeColor,
        fillColor: firstSelectedEntity.fillColor ?? currentStyle.fillColor,
        opacity: firstSelectedEntity.opacity ?? currentStyle.opacity,
        strokeStyle:
          firstSelectedEntity.strokeStyle || currentStyle.strokeStyle,
        strokeWidth: firstSelectedEntity.lineWidth || currentStyle.strokeWidth,
      };
    }
    return currentStyle;
  }, [hasSelectedEntity, firstSelectedEntity, currentStyle]);

  // Handle stroke color change from Header2
  // If entity is selected, update it; otherwise update default style
  const handleStrokeColorChange = useCallback(
    (color: string) => {
      if (hasSelectedEntity) {
        documentSelectedEntities.forEach((entity) => {
          updateDocumentEntity(entity.id, { color, useLayerStyle: false });
        });
      } else {
        setCurrentStyle({ strokeColor: color });
      }
    },
    [
      hasSelectedEntity,
      documentSelectedEntities,
      updateDocumentEntity,
      setCurrentStyle,
    ],
  );

  // Handle fill color change from Header2
  const handleFillColorChange = useCallback(
    (color: string | null) => {
      if (hasSelectedEntity) {
        documentSelectedEntities.forEach((entity) => {
          updateDocumentEntity(entity.id, {
            fillColor: color,
            useLayerStyle: false,
          });
        });
      } else {
        setCurrentStyle({ fillColor: color });
      }
    },
    [
      hasSelectedEntity,
      documentSelectedEntities,
      updateDocumentEntity,
      setCurrentStyle,
    ],
  );

  // Handle opacity change from Header2
  const handleOpacityChange = useCallback(
    (opacity: number) => {
      if (hasSelectedEntity) {
        documentSelectedEntities.forEach((entity) => {
          updateDocumentEntity(entity.id, { opacity, useLayerStyle: false });
        });
      } else {
        setCurrentStyle({ opacity });
      }
    },
    [
      hasSelectedEntity,
      documentSelectedEntities,
      updateDocumentEntity,
      setCurrentStyle,
    ],
  );

  // Handle stroke style change from Header2
  const handleStrokeStyleChange = useCallback(
    (strokeStyle: "solid" | "dashed" | "dotted" | "dashdot") => {
      if (hasSelectedEntity) {
        documentSelectedEntities.forEach((entity) => {
          updateDocumentEntity(entity.id, {
            strokeStyle,
            useLayerStyle: false,
          });
        });
      } else {
        setCurrentStyle({ strokeStyle });
      }
    },
    [
      hasSelectedEntity,
      documentSelectedEntities,
      updateDocumentEntity,
      setCurrentStyle,
    ],
  );

  // Handle stroke width change from Header2
  const handleStrokeWidthChange = useCallback(
    (strokeWidth: number) => {
      if (hasSelectedEntity) {
        documentSelectedEntities.forEach((entity) => {
          updateDocumentEntity(entity.id, {
            lineWidth: strokeWidth,
            useLayerStyle: false,
          });
        });
      } else {
        setCurrentStyle({ strokeWidth });
      }
    },
    [
      hasSelectedEntity,
      documentSelectedEntities,
      updateDocumentEntity,
      setCurrentStyle,
    ],
  );

  // Handle export
  const handleExport = useCallback(
    async (format: string) => {
      try {
        addNotification({
          type: "info",
          title: "Export",
          message: `Đang xuất file ${format.toUpperCase()}...`,
          duration: 2000,
        });

        setShowExportDialog(false);

        addNotification({
          type: "success",
          title: "Export",
          message: `Xuất ${format.toUpperCase()} thành công!`,
          duration: 3000,
        });
      } catch (error) {
        addNotification({
          type: "error",
          title: "Export Error",
          message: `Lỗi khi xuất file: ${error}`,
          duration: 5000,
        });
      }
    },
    [addNotification, setShowExportDialog],
  );

  // Handle color change (from color picker modal)
  const handleColorChange = useCallback(
    (color: string) => {
      setCurrentColor(color);

      if (colorPickerTarget === "stroke") {
        setCurrentStyle({ strokeColor: color });
      } else {
        setCurrentStyle({ fillColor: color });
      }

      setShowColorPicker(false);
    },
    [colorPickerTarget, setCurrentStyle, setCurrentColor, setShowColorPicker],
  );

  return {
    displayStyle,
    hasSelectedEntity,
    handleStrokeColorChange,
    handleFillColorChange,
    handleOpacityChange,
    handleStrokeStyleChange,
    handleStrokeWidthChange,
    handleExport,
    handleColorChange,
  };
}
