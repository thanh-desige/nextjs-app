/**
 * ImportDXFDialog — File picker + DXF import UI
 * Reads .dxf file → importFromDXF() → adds entities to CadDocument
 */

"use client";

import React, { useRef, useState, useCallback } from "react";
import { importFromDXF } from "../../core/export/ImportDXF";
import type { DXFImportResult } from "../../core/export/ImportDXF";
import type { CadEngine } from "../../core/engine/CadEngine";

interface ImportDXFDialogProps {
  onClose: () => void;
  getEngine: () => CadEngine | null;
  zoomFit: () => void;
}

export function ImportDXFDialog({
  onClose,
  getEngine,
  zoomFit,
}: ImportDXFDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<DXFImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    if (!file.name.toLowerCase().endsWith(".dxf")) {
      setError("Chỉ hỗ trợ file .dxf");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const content = await file.text();
      const importResult = importFromDXF(content);
      setResult(importResult);

      if (!importResult.success) {
        setError(importResult.errors.join(", ") || "Không thể đọc file DXF");
      }
    } catch (err) {
      setError(`Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = useCallback(() => {
    if (!result?.success || result.entities.length === 0) return;

    const engine = getEngine();
    if (!engine) {
      setError("Không tìm thấy engine. Vui lòng mở bản vẽ trước.");
      return;
    }

    const doc = engine.getDocument();

    // Add layers from DXF (if LayerManager exists)
    const layerManager = doc.layers;
    if (layerManager) {
      for (const layer of result.layers) {
        if (layer.name !== "0" && !layerManager.getLayer(layer.name)) {
          layerManager.createLayer(layer.name, {
            color: layer.color,
            lineWeight: layer.lineWeight,
          });
        }
      }
    }

    // Add entities via engine (syncs engine cache + CanvasEntity + triggers render)
    engine.addEntities(result.entities);

    // Zoom to fit all entities (including imported)
    setTimeout(() => zoomFit(), 50);

    setImported(true);
  }, [result, getEngine, zoomFit]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#1e1e2e",
          border: "1px solid #444",
          borderRadius: 12,
          padding: "24px",
          width: 480,
          color: "#e0e0e0",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Import file DXF</h3>

        {/* File Picker */}
        {!imported && (
          <>
            <div
              style={{
                border: "2px dashed #555",
                borderRadius: 8,
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 16,
                transition: "border-color 0.2s",
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#888")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#555")}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
              <div style={{ color: "#aaa", fontSize: 13 }}>
                {loading ? "Đang đọc file..." : "Nhấn để chọn file .dxf hoặc kéo thả"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".dxf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "8px 12px",
            backgroundColor: "rgba(220,38,38,0.15)",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 6,
            color: "#f87171",
            fontSize: 13,
            marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        {/* Preview Stats */}
        {result?.success && !imported && (
          <div style={{
            padding: "12px",
            backgroundColor: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#4ade80" }}>
              Đọc file thành công
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
              <span style={{ color: "#aaa" }}>Entities:</span>
              <span>{result.stats.totalEntities}</span>
              <span style={{ color: "#aaa" }}>Layers:</span>
              <span>{result.stats.layerCount}</span>
              {Object.entries(result.stats.byType).map(([type, count]) => (
                <React.Fragment key={type}>
                  <span style={{ color: "#aaa", paddingLeft: 8 }}>{type}:</span>
                  <span>{count as number}</span>
                </React.Fragment>
              ))}
              {result.stats.skippedEntities > 0 && (
                <>
                  <span style={{ color: "#f59e0b" }}>Bỏ qua:</span>
                  <span style={{ color: "#f59e0b" }}>{result.stats.skippedEntities}</span>
                </>
              )}
              {result.stats.unsupportedTypes.length > 0 && (
                <>
                  <span style={{ color: "#888", paddingLeft: 8 }}>Không hỗ trợ:</span>
                  <span style={{ color: "#888" }}>{result.stats.unsupportedTypes.join(", ")}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {imported && result && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 8,
            textAlign: "center",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
            <div style={{ color: "#4ade80", fontWeight: 600 }}>
              Import thành công {result.stats.totalEntities} entities
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "1px solid #555",
              backgroundColor: "transparent",
              color: "#ccc",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {imported ? "Đóng" : "Hủy"}
          </button>
          {result?.success && !imported && result.entities.length > 0 && (
            <button
              onClick={handleImport}
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "#3b82f6",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Import {result.stats.totalEntities} entities
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
