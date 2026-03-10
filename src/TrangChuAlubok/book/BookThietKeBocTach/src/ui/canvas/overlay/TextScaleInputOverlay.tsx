/**
 * TextScaleInputOverlay — STEP-5 extraction from CadDrawingCanvas JSX
 *
 * Modal dialog for scaling selected text entities by a factor.
 */

"use client";

import React from "react";
import type { CadEntity } from "../canvas.types";

// ==================== Interface ====================

export interface TextScaleInputState {
  active: boolean;
  value: string;
  targetIds: string[];
}

export interface TextScaleInputOverlayProps {
  /** Text scale input state */
  textScaleInput: TextScaleInputState;
  /** Setter for text scale state */
  setTextScaleInput: React.Dispatch<React.SetStateAction<TextScaleInputState>>;
  /** Ref to the scale input element */
  textScaleInputRef: React.RefObject<HTMLInputElement | null>;
  /** All entities (for finding text entities) */
  entities: CadEntity[];
  /** Whether component runs in controlled mode */
  isControlled: boolean;
  /** Controlled mode callbacks */
  onDeleteEntities?: (ids: string[]) => void;
  onAddEntity?: (entity: CadEntity) => void;
  onEntityUpdated?: (entity: CadEntity) => void;
  /** Uncontrolled mode: internal entities */
  internalEntities: CadEntity[];
  setInternalEntities: React.Dispatch<React.SetStateAction<CadEntity[]>>;
  /** Whether using external history */
  useExternalHistory: boolean;
  /** Save to history (uncontrolled mode) */
  saveToHistory: (entities: CadEntity[]) => void;
  /** Prompt callback */
  onPromptChange?: (msg: string) => void;
}

// ==================== Component ====================

export const TextScaleInputOverlay: React.FC<TextScaleInputOverlayProps> = ({
  textScaleInput,
  setTextScaleInput,
  textScaleInputRef,
  entities,
  isControlled,
  onDeleteEntities,
  onAddEntity,
  onEntityUpdated,
  internalEntities,
  setInternalEntities,
  useExternalHistory,
  saveToHistory,
  onPromptChange,
}) => {
  if (!textScaleInput.active) return null;

  const handleApplyScale = () => {
    const scaleFactor = parseFloat(textScaleInput.value);
    if (!isNaN(scaleFactor) && scaleFactor > 0) {
      if (isControlled) {
        textScaleInput.targetIds.forEach((id) => {
          const entity = entities.find((ent) => ent.id === id);
          if (entity && entity.type === "text") {
            const currentFontSize = entity.fontSize || 14;
            const newFontSize = currentFontSize * scaleFactor;
            const updatedEntity = { ...entity, fontSize: newFontSize };
            if (onDeleteEntities && onAddEntity) {
              onDeleteEntities([id]);
              onAddEntity(updatedEntity);
            }
            onEntityUpdated?.(updatedEntity);
          }
        });
      } else {
        if (!useExternalHistory) {
          saveToHistory(internalEntities);
        }
        setInternalEntities((prev) =>
          prev.map((entity) => {
            if (
              textScaleInput.targetIds.includes(entity.id) &&
              entity.type === "text"
            ) {
              const currentFontSize = entity.fontSize || 14;
              const newFontSize = currentFontSize * scaleFactor;
              const updated = { ...entity, fontSize: newFontSize };
              onEntityUpdated?.(updated);
              return updated;
            }
            return entity;
          }),
        );
      }
      onPromptChange?.(
        `Scaled ${textScaleInput.targetIds.length} text(s) by ${scaleFactor}x`,
      );
    }
    setTextScaleInput({ active: false, value: "", targetIds: [] });
  };

  const handleCancel = () => {
    setTextScaleInput({ active: false, value: "", targetIds: [] });
    onPromptChange?.("Scale cancelled");
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1002,
        background: "#1a1a2e",
        border: "2px solid #4a90d9",
        borderRadius: 8,
        padding: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ color: "#fff", marginBottom: 8, fontSize: 14 }}>
        Scale {textScaleInput.targetIds.length} text(s)
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={textScaleInputRef}
          type="number"
          step="0.1"
          min="0.1"
          max="10"
          value={textScaleInput.value}
          onChange={(e) =>
            setTextScaleInput((prev) => ({ ...prev, value: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApplyScale();
            } else if (e.key === "Escape") {
              handleCancel();
            }
            e.stopPropagation();
          }}
          onBlur={handleCancel}
          autoFocus
          style={{
            padding: "6px 10px",
            fontSize: 14,
            border: "1px solid #4a90d9",
            borderRadius: 4,
            background: "#2a2a3e",
            color: "#fff",
            outline: "none",
            width: 80,
          }}
        />
        <span style={{ color: "#888", fontSize: 12 }}>× (Enter to apply)</span>
      </div>
      <div style={{ color: "#666", fontSize: 11, marginTop: 8 }}>
        Esc to cancel
      </div>
    </div>
  );
};
