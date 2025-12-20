/**
 * LayerPanel - UI Component for managing layers
 * Features:
 * - Layer list with visibility and lock toggles
 * - Add/delete layers
 * - Current layer selection
 * - Layer color and properties
 */

"use client";

import React, { useState, useCallback } from "react";
import styles from "./LayerPanel.module.css";

// ==================== Types ====================

export interface Layer {
  id: string;
  name: string;
  color: string;
  lineWeight: number;
  visible: boolean;
  locked: boolean;
  frozen: boolean;
  order: number;
}

export interface LayerPanelProps {
  layers: Layer[];
  currentLayerId: string;
  onLayerSelect: (layerId: string) => void;
  onLayerToggleVisible: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerAdd: (name: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerRename: (layerId: string, newName: string) => void;
  onLayerColorChange: (layerId: string, color: string) => void;
}

// ==================== Icons ====================

const EyeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ==================== Component ====================

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  currentLayerId,
  onLayerSelect,
  onLayerToggleVisible,
  onLayerToggleLock,
  onLayerAdd,
  onLayerDelete,
  onLayerRename,
  onLayerColorChange,
}) => {
  const [newLayerName, setNewLayerName] = useState("");
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAddLayer = useCallback(() => {
    if (newLayerName.trim()) {
      onLayerAdd(newLayerName.trim());
      setNewLayerName("");
    }
  }, [newLayerName, onLayerAdd]);

  const handleStartRename = useCallback((layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (editingLayerId && editingName.trim()) {
      onLayerRename(editingLayerId, editingName.trim());
    }
    setEditingLayerId(null);
    setEditingName("");
  }, [editingLayerId, editingName, onLayerRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (editingLayerId) {
          handleFinishRename();
        } else {
          handleAddLayer();
        }
      } else if (e.key === "Escape") {
        setEditingLayerId(null);
        setEditingName("");
      }
    },
    [editingLayerId, handleFinishRename, handleAddLayer]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Layers</span>
        <span className={styles.count}>{layers.length}</span>
      </div>

      {/* Add Layer Input */}
      <div className={styles.addLayer}>
        <input
          type="text"
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New layer name..."
          className={styles.input}
        />
        <button
          onClick={handleAddLayer}
          disabled={!newLayerName.trim()}
          className={styles.addButton}
          title="Add layer"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Layer List */}
      <div className={styles.layerList}>
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`${styles.layerItem} ${
              layer.id === currentLayerId ? styles.current : ""
            } ${layer.frozen ? styles.frozen : ""}`}
            onClick={() => onLayerSelect(layer.id)}
          >
            {/* Visibility Toggle */}
            <button
              className={`${styles.iconButton} ${
                layer.visible ? styles.active : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onLayerToggleVisible(layer.id);
              }}
              title={layer.visible ? "Hide layer" : "Show layer"}
            >
              {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
            </button>

            {/* Lock Toggle */}
            <button
              className={`${styles.iconButton} ${
                layer.locked ? styles.locked : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onLayerToggleLock(layer.id);
              }}
              title={layer.locked ? "Unlock layer" : "Lock layer"}
            >
              {layer.locked ? <LockIcon /> : <UnlockIcon />}
            </button>

            {/* Color Swatch */}
            <input
              type="color"
              value={layer.color}
              onChange={(e) => onLayerColorChange(layer.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={styles.colorSwatch}
              title="Layer color"
            />

            {/* Layer Name */}
            {editingLayerId === layer.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={handleKeyDown}
                autoFocus
                className={styles.nameInput}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={styles.layerName}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleStartRename(layer);
                }}
                title="Double-click to rename"
              >
                {layer.name}
              </span>
            )}

            {/* Delete Button */}
            {layer.id !== "layer-0" && (
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerDelete(layer.id);
                }}
                title="Delete layer"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Current Layer Info */}
      <div className={styles.footer}>
        <span className={styles.currentLabel}>Current:</span>
        <span className={styles.currentName}>
          {layers.find((l) => l.id === currentLayerId)?.name || "-"}
        </span>
      </div>
    </div>
  );
};

export default LayerPanel;
