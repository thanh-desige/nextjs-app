"use client";
/**
 * LayerPanelConnected - Layer Panel kết nối trực tiếp với engineStore
 *
 * Features:
 * - CẤP 1 COLLAPSED: [👁][🔒][■] Layer Name [▼]
 * - CẤP 2 EXPANDED: Chi tiết linetype, lineweight, opacity, delete
 * - Double-click để rename
 * - Preset layers (Walls, Doors, Glass, Accessories)
 * - ByLayer style default
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEngineStore } from "../../store/engineStore";
import { LayerData } from "../../core/document/Layer";

// ==================== Line Type & Weight Options ====================

const LINE_TYPES = [
  { value: "Continuous", label: "━━━━", title: "Nét liền" },
  { value: "Dashed", label: "╌╌╌╌", title: "Nét đứt" },
  { value: "Dotted", label: "····", title: "Nét chấm" },
  { value: "DashDot", label: "─·─·", title: "Gạch chấm" },
];

const LINE_WEIGHTS = [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

// ==================== LayerItem Component ====================

interface LayerItemProps {
  layer: LayerData;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onUpdate: (updates: Partial<LayerData>) => void;
  onDelete: () => void;
  onSetCurrent: () => void;
}

function LayerItem({
  layer,
  isActive,
  isExpanded,
  onToggleExpand,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onUpdate,
  onDelete,
  onSetCurrent,
}: LayerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(layer.name);
    setIsEditing(true);
  };

  const handleSaveName = () => {
    if (editName.trim() && editName !== layer.name) {
      onUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveName();
    else if (e.key === "Escape") {
      setEditName(layer.name);
      setIsEditing(false);
    }
  };

  const isVisible = layer.state?.visible !== false;
  const isLocked = layer.state?.locked === true;
  const isDefaultLayer = layer.id === "0";

  return (
    <div style={{ marginBottom: "2px" }}>
      {/* === CẤP 1: COLLAPSED ROW === */}
      <div
        onClick={onSelect}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          padding: "5px 6px",
          backgroundColor: isActive
            ? "rgba(186, 0, 174, 0.25)"
            : "rgba(255,255,255,0.03)",
          borderRadius: isExpanded ? "4px 4px 0 0" : "4px",
          borderLeft: `3px solid ${layer.color}`,
          cursor: "pointer",
          outline: isActive ? "1px solid #BA00AE" : "none",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!isActive)
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          if (!isActive)
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
        }}
      >
        {/* 👁 Visibility */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            padding: "2px",
            opacity: isVisible ? 1 : 0.3,
            filter: isVisible ? "none" : "grayscale(1)",
          }}
          title={isVisible ? "Ẩn" : "Hiện"}
        >
          👁
        </button>

        {/* 🔒 Lock */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            padding: "2px",
            opacity: isLocked ? 1 : 0.3,
          }}
          title={isLocked ? "Mở khóa" : "Khóa"}
        >
          {isLocked ? "🔒" : "🔓"}
        </button>

        {/* ■ Color */}
        <input
          type="color"
          value={layer.color}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ color: e.target.value })}
          style={{
            width: "14px",
            height: "14px",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "2px",
            cursor: "pointer",
            padding: 0,
          }}
          title="Màu"
        />

        {/* Layer Name */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid #BA00AE",
              borderRadius: "2px",
              color: "#fff",
              fontSize: "11px",
              padding: "1px 4px",
              outline: "none",
              minWidth: 0,
            }}
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            style={{
              flex: 1,
              color: isVisible ? "#ddd" : "#666",
              fontSize: "11px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: !isVisible ? "line-through" : "none",
            }}
            title="Double-click để đổi tên"
          >
            {layer.name}
            {isActive && (
              <span
                style={{ color: "#BA00AE", marginLeft: "3px", fontSize: "8px" }}
              >
                ●
              </span>
            )}
          </span>
        )}

        {/* LineType indicator */}
        <span
          style={{
            fontSize: "9px",
            color: "#666",
            fontFamily: "monospace",
            minWidth: "28px",
            textAlign: "center",
          }}
          title={`${layer.lineType}`}
        >
          {LINE_TYPES.find((lt) => lt.value === layer.lineType)?.label || "━━"}
        </span>

        {/* ▼ Expand */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "8px",
            color: "#666",
            padding: "2px",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
          title="Chi tiết"
        >
          ▼
        </button>
      </div>

      {/* === CẤP 2: EXPANDED PANEL === */}
      {isExpanded && (
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: "0 0 4px 4px",
            borderLeft: `3px solid ${layer.color}`,
            padding: "8px",
            marginTop: "-1px",
          }}
        >
          {/* State Toggles */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "8px",
              fontSize: "10px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleVisibility()}
                style={{
                  width: "11px",
                  height: "11px",
                  accentColor: "#BA00AE",
                }}
              />
              Visible
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isLocked}
                onChange={() => onToggleLock()}
                style={{
                  width: "11px",
                  height: "11px",
                  accentColor: "#BA00AE",
                }}
              />
              Locked
            </label>
          </div>

          {/* Style Section - Visual Preset (entity can override ByObject) */}
          <div
            style={{
              fontSize: "9px",
              color: "#555",
              marginBottom: "6px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "6px",
            }}
          >
            ── Style (ByLayer) ──
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "55px 1fr",
              gap: "5px",
              alignItems: "center",
              fontSize: "10px",
            }}
          >
            {/* Stroke Color */}
            <span style={{ color: "#888" }}>Stroke:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="color"
                value={layer.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                style={{
                  width: "18px",
                  height: "18px",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  color: "#bbb",
                  fontFamily: "monospace",
                  fontSize: "9px",
                }}
              >
                {layer.color.toUpperCase()}
              </span>
            </div>

            {/* Fill Color */}
            <span style={{ color: "#888" }}>Fill:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="color"
                value={layer.fillColor || "#000000"}
                onChange={(e) => onUpdate({ fillColor: e.target.value })}
                style={{
                  width: "18px",
                  height: "18px",
                  border: layer.fillColor
                    ? "none"
                    : "1px dashed rgba(255,255,255,0.3)",
                  borderRadius: "2px",
                  cursor: "pointer",
                  opacity: layer.fillColor ? 1 : 0.5,
                }}
              />
              <button
                onClick={() =>
                  onUpdate({ fillColor: layer.fillColor ? null : "#ffffff" })
                }
                style={{
                  padding: "1px 4px",
                  fontSize: "8px",
                  backgroundColor: layer.fillColor
                    ? "rgba(186, 0, 174, 0.3)"
                    : "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "2px",
                  color: layer.fillColor ? "#BA00AE" : "#666",
                  cursor: "pointer",
                }}
                title={layer.fillColor ? "Remove fill" : "Add fill"}
              >
                {layer.fillColor ? "ON" : "OFF"}
              </button>
            </div>

            {/* Opacity */}
            <span style={{ color: "#888" }}>Opacity:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={layer.opacity ?? 1}
                onChange={(e) =>
                  onUpdate({ opacity: parseFloat(e.target.value) })
                }
                style={{
                  flex: 1,
                  height: "4px",
                  accentColor: "#BA00AE",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  color: "#bbb",
                  fontSize: "9px",
                  minWidth: "28px",
                  textAlign: "right",
                }}
              >
                {Math.round((layer.opacity ?? 1) * 100)}%
              </span>
            </div>

            {/* LineType */}
            <span style={{ color: "#888" }}>LineType:</span>
            <select
              value={layer.lineType}
              onChange={(e) => onUpdate({ lineType: e.target.value })}
              style={{
                backgroundColor: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "3px",
                color: "#ccc",
                fontSize: "10px",
                padding: "2px 4px",
                cursor: "pointer",
              }}
            >
              {LINE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label} {lt.title}
                </option>
              ))}
            </select>

            {/* LineWeight */}
            <span style={{ color: "#888" }}>LineWeight:</span>
            <select
              value={layer.lineWeight}
              onChange={(e) =>
                onUpdate({ lineWeight: parseFloat(e.target.value) })
              }
              style={{
                backgroundColor: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "3px",
                color: "#ccc",
                fontSize: "10px",
                padding: "2px 4px",
                cursor: "pointer",
              }}
            >
              {LINE_WEIGHTS.map((w) => (
                <option key={w} value={w}>
                  {w}px
                </option>
              ))}
            </select>
          </div>

          {/* Visual Preset Note */}
          <div
            style={{
              fontSize: "8px",
              color: "#555",
              marginTop: "6px",
              fontStyle: "italic",
              padding: "4px",
              backgroundColor: "rgba(186, 0, 174, 0.05)",
              borderRadius: "2px",
            }}
          >
            🔐 Visual preset only. Entity can override (ByObject).
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "10px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "8px",
            }}
          >
            {!isActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCurrent();
                }}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  backgroundColor: "#BA00AE",
                  border: "none",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                ✓ Set as Current
              </button>
            ) : (
              <span
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  backgroundColor: "rgba(186, 0, 174, 0.3)",
                  borderRadius: "3px",
                  color: "#BA00AE",
                  fontSize: "10px",
                  textAlign: "center",
                }}
              >
                ● Current Layer
              </span>
            )}
            {!isDefaultLayer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Xóa layer "${layer.name}"?`)) onDelete();
                }}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "rgba(255, 80, 80, 0.15)",
                  border: "1px solid rgba(255, 80, 80, 0.4)",
                  borderRadius: "3px",
                  color: "#ff6666",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
                title="Xóa layer"
              >
                🗑
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== LayerPanelConnected Component ====================

export default function LayerPanelConnected() {
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null);

  // Store hooks
  const layers = useEngineStore((state) => state.layers);
  const activeLayerId = useEngineStore((state) => state.activeLayerId);
  const useByLayer = useEngineStore((state) => state.useByLayer);
  const toggleLayerVisibility = useEngineStore(
    (state) => state.toggleLayerVisibility
  );
  const toggleLayerLock = useEngineStore((state) => state.toggleLayerLock);
  const updateLayer = useEngineStore((state) => state.updateLayer);
  const addLayer = useEngineStore((state) => state.addLayer);
  const deleteLayer = useEngineStore((state) => state.deleteLayer);
  const setActiveLayer = useEngineStore((state) => state.setActiveLayer);
  const refreshLayers = useEngineStore((state) => state.refreshLayers);
  const toggleByLayer = useEngineStore((state) => state.toggleByLayer);

  useEffect(() => {
    refreshLayers();
  }, [refreshLayers]);

  const handleAddLayer = useCallback(() => {
    const newName = `Layer ${layers.length}`;
    addLayer(newName, {
      color: "#FFFFFF",
      lineWeight: 1,
      lineType: "Continuous",
    });
  }, [layers.length, addLayer]);

  const handleToggleExpand = useCallback((layerId: string) => {
    setExpandedLayerId((prev) => (prev === layerId ? null : layerId));
  }, []);

  return (
    <div>
      {/* Header with Toggle */}
      <div
        style={{
          marginBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* ByLayer Toggle Switch */}
          <button
            onClick={toggleByLayer}
            style={{
              width: "28px",
              height: "14px",
              borderRadius: "7px",
              border: "none",
              backgroundColor: useByLayer ? "#BA00AE" : "rgba(255,255,255,0.2)",
              position: "relative",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            title={
              useByLayer
                ? "ByLayer ON - Entities inherit layer style"
                : "ByLayer OFF - Entities use custom style"
            }
          >
            <span
              style={{
                position: "absolute",
                top: "2px",
                left: useByLayer ? "14px" : "2px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
          <span style={{ color: "#BA00AE", fontWeight: 600, fontSize: "12px" }}>
            📑 Layers
          </span>
        </div>
        <button
          onClick={handleAddLayer}
          style={{
            padding: "2px 6px",
            backgroundColor: "#BA00AE",
            border: "none",
            borderRadius: "3px",
            color: "#fff",
            fontSize: "10px",
            cursor: "pointer",
          }}
          title="Thêm layer"
        >
          + Add
        </button>
      </div>

      {/* Layer List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "350px",
          overflowY: "auto",
        }}
      >
        {layers.map((layer) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayerId}
            isExpanded={expandedLayerId === layer.id}
            onToggleExpand={() => handleToggleExpand(layer.id)}
            onSelect={() => setActiveLayer(layer.id)}
            onToggleVisibility={() => toggleLayerVisibility(layer.id)}
            onToggleLock={() => toggleLayerLock(layer.id)}
            onUpdate={(updates) => updateLayer(layer.id, updates)}
            onDelete={() => deleteLayer(layer.id)}
            onSetCurrent={() => setActiveLayer(layer.id)}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "6px",
          padding: "5px 6px",
          backgroundColor: "rgba(186, 0, 174, 0.08)",
          borderRadius: "3px",
          fontSize: "9px",
          color: "#888",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Layers:</span>
          <span style={{ color: "#aaa" }}>{layers.length}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "2px",
          }}
        >
          <span>Current:</span>
          <span style={{ color: "#BA00AE", fontWeight: 500 }}>
            {layers.find((l) => l.id === activeLayerId)?.name || "—"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "2px",
          }}
        >
          <span>Mode:</span>
          <span
            style={{ color: useByLayer ? "#BA00AE" : "#888", fontWeight: 500 }}
          >
            {useByLayer ? "ByLayer" : "Custom"}
          </span>
        </div>
      </div>
    </div>
  );
}
