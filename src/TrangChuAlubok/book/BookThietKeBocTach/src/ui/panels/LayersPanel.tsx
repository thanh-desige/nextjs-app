/**
 * LayersPanel - Panel for managing document layers
 */

"use client";

import React, { useState, useCallback } from "react";

// ==================== Types ====================

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  lineWidth: number;
  entityCount: number;
}

export interface LayersPanelProps {
  /** Available layers */
  layers: Layer[];
  /** Currently active layer */
  activeLayerId: string;
  /** Layer selection handler */
  onSelectLayer: (layerId: string) => void;
  /** Layer visibility toggle */
  onToggleVisibility: (layerId: string) => void;
  /** Layer lock toggle */
  onToggleLock: (layerId: string) => void;
  /** Create new layer */
  onCreateLayer: (name: string) => void;
  /** Delete layer */
  onDeleteLayer: (layerId: string) => void;
  /** Rename layer */
  onRenameLayer: (layerId: string, newName: string) => void;
  /** Change layer color */
  onChangeColor: (layerId: string, color: string) => void;
  /** Additional class name */
  className?: string;
}

// ==================== Icons ====================

const icons = {
  visible: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  hidden: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  locked: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  unlocked: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  ),
  add: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  delete: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

// ==================== LayerRow Component ====================

interface LayerRowProps {
  layer: Layer;
  isActive: boolean;
  isEditing: boolean;
  editName: string;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onStartEdit: () => void;
  onEditChange: (name: string) => void;
  onFinishEdit: () => void;
  onChangeColor: (color: string) => void;
  onDelete: () => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  isActive,
  isEditing,
  editName,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onStartEdit,
  onEditChange,
  onFinishEdit,
  onChangeColor,
  onDelete,
}) => {
  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 cursor-pointer
        ${
          isActive
            ? "bg-blue-600/30 border-l-2 border-blue-500"
            : "hover:bg-gray-750 border-l-2 border-transparent"
        }
      `}
      onClick={onSelect}
    >
      {/* Visibility toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className={`p-1 rounded hover:bg-gray-600 ${
          layer.visible ? "text-green-400" : "text-gray-600"
        }`}
        title={layer.visible ? "Hide layer" : "Show layer"}
      >
        {layer.visible ? icons.visible : icons.hidden}
      </button>

      {/* Lock toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock();
        }}
        className={`p-1 rounded hover:bg-gray-600 ${
          layer.locked ? "text-yellow-400" : "text-gray-600"
        }`}
        title={layer.locked ? "Unlock layer" : "Lock layer"}
      >
        {layer.locked ? icons.locked : icons.unlocked}
      </button>

      {/* Color indicator */}
      <input
        type="color"
        value={layer.color}
        onChange={(e) => onChangeColor(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="w-5 h-5 border border-gray-600 rounded cursor-pointer"
        title="Layer color"
      />

      {/* Layer name */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onFinishEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onFinishEdit();
            if (e.key === "Escape") onFinishEdit();
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-gray-700 text-white text-sm px-2 py-0.5 rounded outline-none"
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-white text-sm truncate"
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          title="Double-click to rename"
        >
          {layer.name}
        </span>
      )}

      {/* Entity count */}
      <span className="text-xs text-gray-500 min-w-6 text-right">
        {layer.entityCount}
      </span>

      {/* Delete button */}
      {layer.id !== "0" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-600 opacity-0 group-hover:opacity-100"
          title="Delete layer"
        >
          {icons.delete}
        </button>
      )}
    </div>
  );
};

// ==================== LayersPanel Component ====================

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onCreateLayer,
  onDeleteLayer,
  onRenameLayer,
  onChangeColor,
  className = "",
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showNewLayerInput, setShowNewLayerInput] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");

  const handleStartEdit = useCallback((layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditName(layer.name);
  }, []);

  const handleFinishEdit = useCallback(() => {
    if (editingLayerId && editName.trim()) {
      onRenameLayer(editingLayerId, editName.trim());
    }
    setEditingLayerId(null);
    setEditName("");
  }, [editingLayerId, editName, onRenameLayer]);

  const handleCreateLayer = useCallback(() => {
    if (newLayerName.trim()) {
      onCreateLayer(newLayerName.trim());
      setNewLayerName("");
      setShowNewLayerInput(false);
    }
  }, [newLayerName, onCreateLayer]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">Layers</h3>
        <button
          type="button"
          onClick={() => setShowNewLayerInput(true)}
          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700"
          title="Add new layer"
        >
          {icons.add}
        </button>
      </div>

      {/* New layer input */}
      {showNewLayerInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateLayer();
              if (e.key === "Escape") {
                setShowNewLayerInput(false);
                setNewLayerName("");
              }
            }}
            placeholder="Layer name..."
            className="flex-1 bg-gray-700 text-white text-sm px-2 py-1 rounded outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateLayer}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Create
          </button>
        </div>
      )}

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <p className="text-sm">No layers</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {layers.map((layer) => (
              <div key={layer.id} className="group">
                <LayerRow
                  layer={layer}
                  isActive={layer.id === activeLayerId}
                  isEditing={editingLayerId === layer.id}
                  editName={editName}
                  onSelect={() => onSelectLayer(layer.id)}
                  onToggleVisibility={() => onToggleVisibility(layer.id)}
                  onToggleLock={() => onToggleLock(layer.id)}
                  onStartEdit={() => handleStartEdit(layer)}
                  onEditChange={setEditName}
                  onFinishEdit={handleFinishEdit}
                  onChangeColor={(color) => onChangeColor(layer.id, color)}
                  onDelete={() => onDeleteLayer(layer.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700 text-xs text-gray-500">
        {layers.length} layer{layers.length !== 1 ? "s" : ""} •{" "}
        {layers.reduce((sum, l) => sum + l.entityCount, 0)} objects
      </div>
    </div>
  );
};

export default LayersPanel;
