/**
 * useDoorHandlers - Door template overlay, config dialog, and drag/drop handlers
 * STEP-5.5: Extracted from BookThietKeBocTachPage.tsx
 *
 * ĐIỀU KIỆN 1 & R7: Mọi thay đổi Door phải đi qua Command + History
 */

import { useCallback, useMemo, useState } from "react";
import type { DoorTemplate } from "../ui/components/DoorTemplateOverlay";
import type { DoorVariant } from "../core/entities/DoorEntity";
import {
  AddDoorCommand,
  UpdateDoorCommand,
  MoveDoorCommand,
  type DoorCreateParams,
} from "../core/commands/door/DoorCommands";

// ==================== Types ====================

export interface UseDoorHandlersParams {
  executeCommandObject: (command: unknown) => void;
  addNotification: (notification: {
    type: "info" | "success" | "error" | "warning";
    title: string;
    message: string;
    duration?: number;
  }) => void;
  getDoor: (
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
}

export interface UseDoorHandlersReturn {
  // Template overlay
  templateOverlayOpen: boolean;
  templateOverlayCategory: "door" | "window" | null;
  templateOverlaySubCategory: string | undefined;
  handleOpenTemplateOverlay: (
    category: "door" | "window",
    subCategory: string,
  ) => void;
  handleCloseTemplateOverlay: () => void;
  handleSelectTemplate: (template: DoorTemplate) => void;
  handleTemplateDragStart: (
    template: DoorTemplate,
    event: React.DragEvent,
  ) => void;

  // Config dialog
  configDialogOpen: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configDialogDoor: any;
  configDialogDoorId: string | null;
  handleDoorDoubleClick: (doorId: string) => void;
  handleConfigDialogClose: () => void;
  handleConfigDialogConfirm: (updates: {
    width: number;
    height: number;
    systemId: string;
    displayName?: string;
  }) => void;

  // Drag & drop
  handleDoorDrop: (doorData: {
    variant: string;
    systemId: string;
    displayName: string;
    defaultSize: { width: number; height: number };
    position: { x: number; y: number };
    templateId?: string;
  }) => void;
  handleDoorMove: (doorIds: string[], dx: number, dy: number) => void;

  // State setters (for external access)
  setTemplateOverlayOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// ==================== Hook ====================

export function useDoorHandlers({
  executeCommandObject,
  addNotification,
  getDoor,
}: UseDoorHandlersParams): UseDoorHandlersReturn {
  // ===== Template Overlay State =====
  const [templateOverlayOpen, setTemplateOverlayOpen] = useState(false);
  const [templateOverlayCategory, setTemplateOverlayCategory] = useState<
    "door" | "window" | null
  >(null);
  const [templateOverlaySubCategory, setTemplateOverlaySubCategory] = useState<
    string | undefined
  >(undefined);

  // ===== Config Dialog State =====
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDialogDoorId, setConfigDialogDoorId] = useState<string | null>(
    null,
  );

  // ==================== TEMPLATE OVERLAY HANDLERS ====================

  /**
   * Mở overlay khi click subcategory từ SidebarLeft
   */
  const handleOpenTemplateOverlay = useCallback(
    (category: "door" | "window", subCategory: string) => {
      setTemplateOverlayCategory(category);
      setTemplateOverlaySubCategory(subCategory);
      setTemplateOverlayOpen(true);
    },
    [],
  );

  /**
   * Đóng overlay
   */
  const handleCloseTemplateOverlay = useCallback(() => {
    setTemplateOverlayOpen(false);
    setTemplateOverlayCategory(null);
    setTemplateOverlaySubCategory(undefined);
  }, []);

  /**
   * Khi click template trong overlay (optional - có thể chỉ dùng drag)
   */
  const handleSelectTemplate = useCallback(
    (template: DoorTemplate) => {
      console.log("Selected template:", template);
      addNotification({
        type: "info",
        title: "Chọn mẫu cửa",
        message: `Đã chọn ${template.name}. Kéo thả vào canvas để đặt cửa.`,
        duration: 3000,
      });
    },
    [addNotification],
  );

  /**
   * Khi drag start từ overlay
   */
  const handleTemplateDragStart = useCallback(
    (template: DoorTemplate, event: React.DragEvent) => {
      const dragData = {
        templateId: template.id,
        variant: template.variant,
        systemId: template.defaultSystemId,
        displayName: template.name,
        defaultSize: {
          width: template.defaultWidth,
          height: template.defaultHeight,
        },
      };
      event.dataTransfer.setData(
        "application/door-template",
        JSON.stringify(dragData),
      );
      event.dataTransfer.effectAllowed = "copy";

      // Custom drag image
      const dragImage = document.createElement("div");
      dragImage.textContent = `🚪 ${template.name}`;
      dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 16px;
      background: rgba(155, 89, 182, 0.95);
      color: white;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      white-space: nowrap;
    `;
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    },
    [],
  );

  // ==================== CONFIG DIALOG HANDLERS ====================

  /**
   * Mở config dialog khi double-click cửa trên canvas
   */
  const handleDoorDoubleClick = useCallback((doorId: string) => {
    setConfigDialogDoorId(doorId);
    setConfigDialogOpen(true);
  }, []);

  /**
   * Đóng config dialog
   */
  const handleConfigDialogClose = useCallback(() => {
    setConfigDialogOpen(false);
    setConfigDialogDoorId(null);
  }, []);

  /**
   * Xác nhận config dialog - cập nhật DoorEntity
   * ĐIỀU KIỆN 1 & R7: Dùng UpdateDoorCommand thay vì gọi store trực tiếp
   */
  const handleConfigDialogConfirm = useCallback(
    (updates: {
      width: number;
      height: number;
      systemId: string;
      displayName?: string;
    }) => {
      if (configDialogDoorId) {
        const currentDoor = getDoor(configDialogDoorId);
        if (currentDoor) {
          const command = new UpdateDoorCommand(configDialogDoorId, {
            doorInfo: {
              ...currentDoor.doorInfo,
              width: updates.width,
              height: updates.height,
              systemId: updates.systemId,
              displayName:
                updates.displayName || `Door ${configDialogDoorId.slice(0, 6)}`,
            },
          });
          executeCommandObject(command);

          addNotification({
            type: "success",
            title: "Cập nhật cửa",
            message: `Đã cập nhật cửa ${
              updates.displayName || configDialogDoorId.slice(0, 6)
            }`,
            duration: 2000,
          });
        }
      }
      handleConfigDialogClose();
    },
    [
      configDialogDoorId,
      getDoor,
      executeCommandObject,
      addNotification,
      handleConfigDialogClose,
    ],
  );

  /**
   * Get door by ID for config dialog
   */
  const configDialogDoor = useMemo(() => {
    if (!configDialogDoorId) return null;
    return getDoor(configDialogDoorId) || null;
  }, [configDialogDoorId, getDoor]);

  // ==================== DRAG & DROP HANDLERS ====================

  /**
   * Handle door drop from template overlay
   * ĐIỀU KIỆN 1 & R7: Dùng AddDoorCommand thay vì gọi store trực tiếp
   */
  const handleDoorDrop = useCallback(
    (doorData: {
      variant: string;
      systemId: string;
      displayName: string;
      defaultSize: { width: number; height: number };
      position: { x: number; y: number };
      templateId?: string;
    }) => {
      const params: DoorCreateParams = {
        variant: doorData.variant as DoorVariant,
        systemId: doorData.systemId,
        position: doorData.position,
        width: doorData.defaultSize.width,
        height: doorData.defaultSize.height,
        displayName: doorData.displayName,
        previewTemplateId: doorData.templateId,
      };

      const command = new AddDoorCommand(params);
      executeCommandObject(command);

      // Đóng template overlay sau khi drop thành công
      setTemplateOverlayOpen(false);

      addNotification({
        type: "success",
        title: "Thêm cửa",
        message: `${doorData.displayName} (${doorData.defaultSize.width}×${doorData.defaultSize.height}mm)`,
        duration: 2000,
      });
    },
    [executeCommandObject, addNotification],
  );

  /**
   * Handle door move via MoveDoorCommand
   * RULE 7: Mọi thay đổi Door phải đi qua Command + History
   */
  const handleDoorMove = useCallback(
    (doorIds: string[], dx: number, dy: number) => {
      if (doorIds.length === 0 || (dx === 0 && dy === 0)) return;

      // Di chuyển từng door bằng MoveDoorCommand
      doorIds.forEach((doorId) => {
        const door = getDoor(doorId);
        if (door) {
          const newPosition = {
            x: door.position.x + dx,
            y: door.position.y + dy,
          };
          const command = new MoveDoorCommand(doorId, newPosition);
          executeCommandObject(command);
        }
      });

      addNotification({
        type: "info",
        title: "Di chuyển cửa",
        message: `Đã di chuyển ${doorIds.length} cửa`,
        duration: 1500,
      });
    },
    [getDoor, executeCommandObject, addNotification],
  );

  return {
    // Template overlay
    templateOverlayOpen,
    templateOverlayCategory,
    templateOverlaySubCategory,
    handleOpenTemplateOverlay,
    handleCloseTemplateOverlay,
    handleSelectTemplate,
    handleTemplateDragStart,

    // Config dialog
    configDialogOpen,
    configDialogDoor,
    configDialogDoorId,
    handleDoorDoubleClick,
    handleConfigDialogClose,
    handleConfigDialogConfirm,

    // Drag & drop
    handleDoorDrop,
    handleDoorMove,

    // State setters
    setTemplateOverlayOpen,
  };
}
