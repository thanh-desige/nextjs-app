/**
 * TextInputLegacyOverlay - Text input for legacy TEXT tool mode
 * STEP-5: Extracted from CadDrawingCanvas.tsx
 *
 * Handles both creating new text entities and editing existing ones.
 * Supports both controlled and uncontrolled entity management modes.
 */

"use client";

import React from "react";
import type { Point, CadEntity } from "../types/CadEntity";
import type { DrawingState } from "../canvas.types";

interface TextInputLegacyOverlayProps {
  textInput: {
    active: boolean;
    value: string;
    position: Point;
    editingId?: string;
  };
  setTextInput: React.Dispatch<
    React.SetStateAction<{
      active: boolean;
      value: string;
      position: Point;
      editingId?: string;
    }>
  >;
  textInputRef: React.RefObject<HTMLTextAreaElement | null>;
  textInputMountedRef: React.MutableRefObject<boolean>;
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  canvasDimensions: { width: number; height: number };
  pan: Point;
  zoom: number;
  // Entity management
  entities: CadEntity[];
  isControlled: boolean;
  currentLayerId: string;
  useExternalHistory: boolean;
  saveToHistory: (entities: CadEntity[]) => void;
  internalEntities: CadEntity[];
  setInternalEntities: React.Dispatch<React.SetStateAction<CadEntity[]>>;
  // Callbacks
  onAddEntity?: (entity: CadEntity) => void;
  onDeleteEntities?: (ids: string[]) => void;
  onEntityUpdated?: (entity: CadEntity) => void;
  onEntitiesChange?: (entities: CadEntity[]) => void;
  onPromptChange?: (prompt: string) => void;
  // Command drawing integration (for fallback text creation)
  commandDrawingPoints: Point[];
  commandHandleTextInput: (text: string) => boolean;
}

const textareaStyle: React.CSSProperties = {
  padding: "8px",
  fontSize: 14,
  border: "2px solid #4a90d9",
  borderRadius: 4,
  background: "#1a1a2e",
  color: "#fff",
  outline: "none",
  minWidth: 200,
  minHeight: 60,
  resize: "both",
  fontFamily: "Arial, sans-serif",
};

export const TextInputLegacyOverlay: React.FC<TextInputLegacyOverlayProps> = ({
  textInput,
  setTextInput,
  textInputRef,
  textInputMountedRef,
  setDrawState,
  canvasDimensions,
  pan,
  zoom,
  entities,
  isControlled,
  currentLayerId,
  useExternalHistory,
  saveToHistory,
  internalEntities,
  setInternalEntities,
  onAddEntity,
  onDeleteEntities,
  onEntityUpdated,
  onEntitiesChange,
  onPromptChange,
  commandDrawingPoints,
  commandHandleTextInput,
}) => {
  if (!textInput.active) return null;

  const centerX = canvasDimensions.width / 2 + pan.x;
  const centerY = canvasDimensions.height / 2 + pan.y;
  const textScreenX = centerX + textInput.position.x * zoom;
  const textScreenY = centerY - textInput.position.y * zoom;

  const handleSaveText = () => {
    if (!textInputMountedRef.current) return;
    textInputMountedRef.current = false;

    if (!textInput.value.trim()) {
      setTextInput({
        active: false,
        value: "",
        position: { x: 0, y: 0 },
        editingId: undefined,
      });
      setDrawState({ mode: "idle" });
      onPromptChange?.("TEXT: Cancelled");
      return;
    }

    if (textInput.editingId) {
      // Update existing text entity
      if (isControlled) {
        const entityToUpdate = entities.find(
          (e) => e.id === textInput.editingId,
        );
        if (entityToUpdate && onAddEntity) {
          const updatedEntity = { ...entityToUpdate, text: textInput.value };
          if (onDeleteEntities) {
            onDeleteEntities([textInput.editingId]);
          }
          onAddEntity(updatedEntity);
          onEntityUpdated?.(updatedEntity);
        }
      } else {
        if (!useExternalHistory) {
          saveToHistory(internalEntities);
        }
        setInternalEntities((prev) => {
          const newEntities = prev.map((entity) => {
            if (entity.id === textInput.editingId) {
              const updated = { ...entity, text: textInput.value };
              setTimeout(() => {
                onEntityUpdated?.(updated);
                onEntitiesChange?.(newEntities);
              }, 0);
              return updated;
            }
            return entity;
          });
          return newEntities;
        });
      }
      onPromptChange?.("TEXT: Text updated");
    } else {
      // Create new text entity
      if (
        commandDrawingPoints.length > 0 &&
        commandHandleTextInput(textInput.value)
      ) {
        // Command handled it
      } else if (textInput.position) {
        if (isControlled && onAddEntity) {
          onAddEntity({
            id: `text-${Date.now()}`,
            type: "text",
            points: [textInput.position],
            text: textInput.value,
            fontSize: 24,
            fontFamily: "Arial",
            color: "#ffffff",
            lineWidth: 1,
            layer: currentLayerId,
          });
        } else {
          setInternalEntities((prev) => [
            ...prev,
            {
              id: `text-${Date.now()}`,
              type: "text" as const,
              points: [textInput.position],
              text: textInput.value,
              fontSize: 24,
              fontFamily: "Arial",
              color: "#ffffff",
              lineWidth: 1,
              layer: currentLayerId,
            },
          ]);
        }
      }
      onPromptChange?.("TEXT: Text created");
    }

    setTextInput({
      active: false,
      value: "",
      position: { x: 0, y: 0 },
      editingId: undefined,
    });
    setDrawState({ mode: "idle" });
  };

  return (
    <div
      style={{
        position: "absolute",
        left: textScreenX,
        top: textScreenY - 60,
        zIndex: 1001,
      }}
    >
      <textarea
        ref={textInputRef}
        value={textInput.value}
        onChange={(e) =>
          setTextInput((prev) => ({ ...prev, value: e.target.value }))
        }
        onFocus={() => {
          textInputMountedRef.current = true;
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") {
            setTextInput({
              active: false,
              value: "",
              position: { x: 0, y: 0 },
            });
            setDrawState({ mode: "idle" });
            onPromptChange?.("TEXT: Cancelled");
            textInputMountedRef.current = false;
          }
          // Enter inserts newline (default behavior for textarea)
        }}
        onBlur={handleSaveText}
        rows={3}
        style={textareaStyle}
        placeholder="Enter text... (click outside to save)"
      />
    </div>
  );
};
