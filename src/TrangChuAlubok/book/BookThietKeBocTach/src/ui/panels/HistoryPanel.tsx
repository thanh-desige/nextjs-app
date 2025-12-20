/**
 * HistoryPanel - UI Component for Undo/Redo history
 * Shows history stack and allows navigation
 */

"use client";

import React from "react";
import styles from "./HistoryPanel.module.css";

// ==================== Types ====================

export interface HistoryItem {
  id: string;
  description: string;
  timestamp: number;
  type: string;
}

export interface HistoryPanelProps {
  history: HistoryItem[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

// ==================== Icons ====================

const UndoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
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

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  onUndo,
  onRedo,
  onClear,
}) => {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case "ADD_ENTITY":
        return "➕";
      case "DELETE_ENTITY":
        return "🗑️";
      case "UPDATE_ENTITY":
        return "✏️";
      case "MOVE_ENTITIES":
        return "↔️";
      case "COPY_ENTITIES":
        return "📋";
      case "CHANGE_LAYER":
        return "📁";
      case "CHANGE_PROPERTIES":
        return "🎨";
      default:
        return "⚡";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>History</span>
        <span className={styles.count}>{history.length}</span>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={onUndo}
          disabled={!canUndo}
          title={
            undoDescription ? `Undo: ${undoDescription}` : "Nothing to undo"
          }
        >
          <UndoIcon />
          <span>Undo</span>
        </button>
        <button
          className={styles.actionButton}
          onClick={onRedo}
          disabled={!canRedo}
          title={
            redoDescription ? `Redo: ${redoDescription}` : "Nothing to redo"
          }
        >
          <RedoIcon />
          <span>Redo</span>
        </button>
        <button
          className={`${styles.actionButton} ${styles.danger}`}
          onClick={onClear}
          disabled={history.length === 0}
          title="Clear history"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Current Action Info */}
      {(undoDescription || redoDescription) && (
        <div className={styles.currentAction}>
          {canUndo && undoDescription && (
            <div className={styles.actionInfo}>
              <span className={styles.actionLabel}>Undo:</span>
              <span className={styles.actionDesc}>{undoDescription}</span>
            </div>
          )}
          {canRedo && redoDescription && (
            <div className={styles.actionInfo}>
              <span className={styles.actionLabel}>Redo:</span>
              <span className={styles.actionDesc}>{redoDescription}</span>
            </div>
          )}
        </div>
      )}

      {/* History List */}
      <div className={styles.historyList}>
        {history.length === 0 ? (
          <div className={styles.empty}>No history</div>
        ) : (
          [...history].reverse().map((item, index) => {
            const actualIndex = history.length - 1 - index;
            const isCurrent = actualIndex === currentIndex;
            const isUndone = actualIndex > currentIndex;

            return (
              <div
                key={item.id}
                className={`${styles.historyItem} ${
                  isCurrent ? styles.current : ""
                } ${isUndone ? styles.undone : ""}`}
              >
                <span className={styles.typeIcon}>
                  {getTypeIcon(item.type)}
                </span>
                <div className={styles.itemInfo}>
                  <span className={styles.itemDesc}>{item.description}</span>
                  <span className={styles.itemTime}>
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                {isCurrent && <span className={styles.currentMarker}>●</span>}
              </div>
            );
          })
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className={styles.footer}>
        <span className={styles.shortcut}>Ctrl+Z: Undo</span>
        <span className={styles.shortcut}>Ctrl+Y: Redo</span>
      </div>
    </div>
  );
};

export default HistoryPanel;
