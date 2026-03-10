/**
 * DoorTemplateOverlay - Grid thumbnails để chọn mẫu cửa
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Chỉ hiển thị DoorTemplate (preview), KHÔNG tạo DoorEntity
 * - KHÔNG import door-engines, analysis, systems
 */

"use client";

import React, { useState, useCallback, memo } from "react";
import type { DoorVariant } from "../../core/entities/DoorEntity";

// SVG Thumbnail mapping - templates vẽ từ CAD
const SVG_THUMBNAILS: Partial<Record<string, string>> = {
  "awning-1": "/door-templates/cua-so/cua-so-hat.svg",
  // Thêm các template khác ở đây
};

/**
 * Door Template - Mẫu cửa trong thư viện
 */
export interface DoorTemplate {
  id: string;
  name: string;
  variant: DoorVariant;
  category: "door" | "window";
  subCategory: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultSystemId: string;
  thumbnail?: string; // URL ảnh thumbnail
  description?: string;
}

/**
 * Danh sách mẫu cửa mặc định
 */
export const DOOR_TEMPLATES: DoorTemplate[] = [
  // Cửa đi - Mở quay
  {
    id: "hinged-single-1",
    name: "Cửa đơn 1 cánh",
    variant: "hinged-single",
    category: "door",
    subCategory: "Cửa đi mở quay",
    defaultWidth: 900,
    defaultHeight: 2200,
    defaultSystemId: "xf55",
  },
  {
    id: "hinged-single-2",
    name: "Cửa đơn 1 cánh (kính lớn)",
    variant: "hinged-single",
    category: "door",
    subCategory: "Cửa đi mở quay",
    defaultWidth: 900,
    defaultHeight: 2200,
    defaultSystemId: "xf55",
  },
  {
    id: "hinged-double-1",
    name: "Cửa đôi 2 cánh",
    variant: "hinged-double",
    category: "door",
    subCategory: "Cửa đi mở quay",
    defaultWidth: 1800,
    defaultHeight: 2200,
    defaultSystemId: "xf55",
  },
  {
    id: "hinged-double-2",
    name: "Cửa đôi 2 cánh (vách trên)",
    variant: "hinged-double",
    category: "door",
    subCategory: "Cửa đi mở quay",
    defaultWidth: 1800,
    defaultHeight: 2600,
    defaultSystemId: "xf55",
  },
  // Cửa đi - Mở trượt
  {
    id: "sliding-2p-1",
    name: "Cửa trượt 2 cánh",
    variant: "sliding-2p",
    category: "door",
    subCategory: "Cửa đi mở trượt",
    defaultWidth: 2000,
    defaultHeight: 2200,
    defaultSystemId: "xf93",
  },
  {
    id: "sliding-4p-1",
    name: "Cửa trượt 4 cánh",
    variant: "sliding-4p",
    category: "door",
    subCategory: "Cửa đi mở trượt",
    defaultWidth: 4000,
    defaultHeight: 2200,
    defaultSystemId: "xf93",
  },
  // Cửa sổ - Mở quay
  {
    id: "casement-1",
    name: "Cửa sổ mở quay 1 cánh",
    variant: "casement",
    category: "window",
    subCategory: "Cửa sổ mở quay",
    defaultWidth: 600,
    defaultHeight: 1200,
    defaultSystemId: "xf55",
  },
  {
    id: "casement-2",
    name: "Cửa sổ mở quay 2 cánh",
    variant: "casement",
    category: "window",
    subCategory: "Cửa sổ mở quay",
    defaultWidth: 1200,
    defaultHeight: 1200,
    defaultSystemId: "xf55",
  },
  {
    id: "awning-1",
    name: "Cửa sổ hất",
    variant: "awning",
    category: "window",
    subCategory: "Cửa sổ mở quay",
    defaultWidth: 800,
    defaultHeight: 600,
    defaultSystemId: "xf55",
  },
  // Cửa sổ - Fix
  {
    id: "fixed-1",
    name: "Cửa sổ cố định",
    variant: "fixed",
    category: "window",
    subCategory: "Cửa sổ mở trượt",
    defaultWidth: 1200,
    defaultHeight: 1400,
    defaultSystemId: "xf55",
  },
];

interface DoorTemplateOverlayProps {
  isOpen: boolean;
  category: "door" | "window" | null;
  subCategory?: string;
  onClose: () => void;
  onSelectTemplate: (template: DoorTemplate) => void;
  onDragStart: (template: DoorTemplate, event: React.DragEvent) => void;
}

/**
 * Door Template Card
 */
const TemplateCard = memo(function TemplateCard({
  template,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  template: DoorTemplate;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      style={{
        width: 120,
        height: 150,
        backgroundColor: "#2a2a3e",
        border: "1px solid #444",
        borderRadius: 8,
        padding: 8,
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        transition: "all 0.2s",
        // NOTE: Do NOT use touchAction: "none" here - it blocks drag gesture
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#9b59b6";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#444";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Thumbnail placeholder */}
      <div
        style={{
          width: "100%",
          height: 90,
          backgroundColor: "#1e1e2e",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed #555",
          overflow: "hidden",
        }}
      >
        {SVG_THUMBNAILS[template.id] ? (
          <img
            src={SVG_THUMBNAILS[template.id]}
            alt={template.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            draggable={false}
          />
        ) : (
          <DoorPreviewSVG variant={template.variant} />
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 11,
          color: "#fff",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
        title={template.name}
      >
        {template.name}
      </div>

      {/* Size */}
      <div
        style={{
          fontSize: 10,
          color: "#888",
        }}
      >
        {template.defaultWidth}×{template.defaultHeight}
      </div>
    </div>
  );
});

/**
 * SVG Preview cho từng loại cửa trong Template Overlay
 * CHỈ hiển thị: Khung bao, Cánh, Đố ngang/dọc, Kính (đường chéo)
 * KHÔNG hiển thị: Dimensions, Hinges, Connectors, Handle
 */
function DoorPreviewSVG({ variant }: { variant: DoorVariant }) {
  const w = 60;
  const h = 80;

  // Độ dày khung (frame) và cánh (sash)
  const frameThickness = 3;
  const sashThickness = 2;

  // Màu sắc
  const frameColor = "#00CED1"; // Cyan cho khung
  const sashColor = "#4169E1"; // Xanh đậm cho cánh
  const glassColor = "#90EE90"; // Xanh lá nhạt cho kính

  // Vị trí bên trong frame
  const innerX = frameThickness;
  const innerY = frameThickness;
  const innerW = w - frameThickness * 2;
  const innerH = h - frameThickness * 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* ===== KHUNG BAO (FRAME) ===== */}
      <rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        fill="none"
        stroke={frameColor}
        strokeWidth={frameThickness}
      />

      {/* ===== NỘI DUNG THEO LOẠI CỬA ===== */}

      {/* Cửa đơn 1 cánh mở quay */}
      {variant === "hinged-single" && (
        <>
          {/* Cánh cửa */}
          <rect
            x={innerX + sashThickness}
            y={innerY + sashThickness}
            width={innerW - sashThickness * 2}
            height={innerH - sashThickness * 2}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Kính - đường chéo */}
          <line
            x1={innerX + 6}
            y1={innerY + 6}
            x2={innerX + innerW - 6}
            y2={innerY + innerH * 0.4}
            stroke={glassColor}
            strokeWidth={1}
          />
          <line
            x1={innerX + 6}
            y1={innerY + innerH * 0.25}
            x2={innerX + innerW - 6}
            y2={innerY + innerH * 0.65}
            stroke={glassColor}
            strokeWidth={1}
          />
          <line
            x1={innerX + 6}
            y1={innerY + innerH * 0.5}
            x2={innerX + innerW - 6}
            y2={innerY + innerH * 0.9}
            stroke={glassColor}
            strokeWidth={1}
          />
        </>
      )}

      {/* Cửa đôi 2 cánh mở quay */}
      {variant === "hinged-double" && (
        <>
          {/* Đố dọc giữa */}
          <line
            x1={w / 2}
            y1={innerY}
            x2={w / 2}
            y2={h - frameThickness}
            stroke={frameColor}
            strokeWidth={2}
          />
          {/* Cánh trái */}
          <rect
            x={innerX + sashThickness}
            y={innerY + sashThickness}
            width={innerW / 2 - sashThickness * 2}
            height={innerH - sashThickness * 2}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Cánh phải */}
          <rect
            x={w / 2 + sashThickness}
            y={innerY + sashThickness}
            width={innerW / 2 - sashThickness * 2}
            height={innerH - sashThickness * 2}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Kính trái */}
          <line
            x1={innerX + 6}
            y1={innerY + 8}
            x2={w / 2 - 6}
            y2={innerH * 0.5}
            stroke={glassColor}
            strokeWidth={1}
          />
          <line
            x1={innerX + 6}
            y1={innerH * 0.4}
            x2={w / 2 - 6}
            y2={innerH * 0.85}
            stroke={glassColor}
            strokeWidth={1}
          />
          {/* Kính phải */}
          <line
            x1={w / 2 + 6}
            y1={innerY + 8}
            x2={w - innerX - 6}
            y2={innerH * 0.5}
            stroke={glassColor}
            strokeWidth={1}
          />
          <line
            x1={w / 2 + 6}
            y1={innerH * 0.4}
            x2={w - innerX - 6}
            y2={innerH * 0.85}
            stroke={glassColor}
            strokeWidth={1}
          />
        </>
      )}

      {/* Cửa trượt 2 cánh */}
      {variant === "sliding-2p" && (
        <>
          {/* Đố dọc giữa */}
          <line
            x1={w / 2}
            y1={innerY}
            x2={w / 2}
            y2={h - frameThickness}
            stroke={frameColor}
            strokeWidth={2}
          />
          {/* Cánh trái */}
          <rect
            x={innerX + 2}
            y={innerY + 2}
            width={innerW / 2 - 3}
            height={innerH - 4}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Cánh phải */}
          <rect
            x={w / 2 + 1}
            y={innerY + 2}
            width={innerW / 2 - 3}
            height={innerH - 4}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Mũi tên trượt */}
          <line
            x1={12}
            y1={h / 2}
            x2={w - 12}
            y2={h / 2}
            stroke="#888"
            strokeWidth={1}
          />
          <polygon
            points={`${w - 14},${h / 2 - 3} ${w - 14},${h / 2 + 3} ${w - 10},${
              h / 2
            }`}
            fill="#888"
          />
          <polygon
            points={`14,${h / 2 - 3} 14,${h / 2 + 3} 10,${h / 2}`}
            fill="#888"
          />
        </>
      )}

      {/* Cửa trượt 4 cánh */}
      {variant === "sliding-4p" && (
        <>
          {/* Đố dọc */}
          <line
            x1={w * 0.25}
            y1={innerY}
            x2={w * 0.25}
            y2={h - frameThickness}
            stroke={frameColor}
            strokeWidth={1}
          />
          <line
            x1={w * 0.5}
            y1={innerY}
            x2={w * 0.5}
            y2={h - frameThickness}
            stroke={frameColor}
            strokeWidth={2}
          />
          <line
            x1={w * 0.75}
            y1={innerY}
            x2={w * 0.75}
            y2={h - frameThickness}
            stroke={frameColor}
            strokeWidth={1}
          />
          {/* 4 cánh */}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={innerX + i * (innerW / 4) + 2}
              y={innerY + 2}
              width={innerW / 4 - 4}
              height={innerH - 4}
              fill="none"
              stroke={sashColor}
              strokeWidth={1}
            />
          ))}
        </>
      )}

      {/* Cửa sổ fix (cố định) */}
      {variant === "fixed" && (
        <>
          {/* Khung kính cố định */}
          <rect
            x={innerX + 3}
            y={innerY + 3}
            width={innerW - 6}
            height={innerH - 6}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Dấu X thể hiện fix */}
          <line
            x1={innerX + 6}
            y1={innerY + 6}
            x2={w - innerX - 6}
            y2={h - innerY - 6}
            stroke={glassColor}
            strokeWidth={1}
          />
          <line
            x1={w - innerX - 6}
            y1={innerY + 6}
            x2={innerX + 6}
            y2={h - innerY - 6}
            stroke={glassColor}
            strokeWidth={1}
          />
        </>
      )}

      {/* Cửa sổ mở quay (casement) */}
      {variant === "casement" && (
        <>
          {/* Cánh cửa */}
          <rect
            x={innerX + sashThickness}
            y={innerY + sashThickness}
            width={innerW - sashThickness * 2}
            height={innerH - sashThickness * 2}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Kính - đường chéo */}
          <line
            x1={innerX + 6}
            y1={innerY + 8}
            x2={w - innerX - 6}
            y2={h * 0.5}
            stroke={glassColor}
            strokeWidth={1}
          />
          <line
            x1={innerX + 6}
            y1={h * 0.35}
            x2={w - innerX - 6}
            y2={h * 0.8}
            stroke={glassColor}
            strokeWidth={1}
          />
        </>
      )}

      {/* Cửa sổ hất (awning) */}
      {variant === "awning" && (
        <>
          {/* Cánh cửa */}
          <rect
            x={innerX + sashThickness}
            y={innerY + sashThickness}
            width={innerW - sashThickness * 2}
            height={innerH - sashThickness * 2}
            fill="none"
            stroke={sashColor}
            strokeWidth={sashThickness}
          />
          {/* Mũi tên hất lên */}
          <line
            x1={w / 2}
            y1={h - 15}
            x2={w / 2}
            y2={innerY + 10}
            stroke="#888"
            strokeWidth={1}
          />
          <polygon
            points={`${w / 2 - 4},${innerY + 14} ${w / 2 + 4},${innerY + 14} ${
              w / 2
            },${innerY + 8}`}
            fill="#888"
          />
        </>
      )}
    </svg>
  );
}

/**
 * Door Template Overlay Component
 */
export const DoorTemplateOverlay = memo(function DoorTemplateOverlay({
  isOpen,
  category,
  subCategory,
  onClose,
  onSelectTemplate,
  onDragStart,
}: DoorTemplateOverlayProps) {
  const [_hoveredId, _setHoveredId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter templates by category and subCategory
  const filteredTemplates = DOOR_TEMPLATES.filter((t) => {
    if (category && t.category !== category) return false;
    if (subCategory && t.subCategory !== subCategory) return false;
    return true;
  });

  // Group by subCategory
  const groupedTemplates = filteredTemplates.reduce((acc, t) => {
    if (!acc[t.subCategory]) {
      acc[t.subCategory] = [];
    }
    acc[t.subCategory].push(t);
    return acc;
  }, {} as Record<string, DoorTemplate[]>);

  const handleDragStart = useCallback(
    (template: DoorTemplate, e: React.DragEvent) => {
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

      e.dataTransfer.setData(
        "application/door-template",
        JSON.stringify(dragData)
      );
      e.dataTransfer.effectAllowed = "copy";

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
      `;
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);

      onDragStart(template, e);

      // Delay để drag có thời gian thiết lập trước khi overlay thành pointerEvents: none
      setTimeout(() => {
        setIsDragging(true);
      }, 50);
    },
    [onDragStart]
  );

  // Handle drag end - KHÔNG đóng overlay, chỉ reset isDragging
  // Overlay sẽ được đóng khi drop thành công (từ parent) hoặc user click backdrop
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDragging ? "transparent" : "rgba(0,0,0,0.5)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: isDragging ? "none" : "auto",
        transition: "background-color 0.15s ease",
      }}
      onClick={isDragging ? undefined : onClose}
    >
      <div
        style={{
          backgroundColor: "#1e1e2e",
          borderRadius: 12,
          padding: 20,
          minWidth: 500,
          maxWidth: 800,
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid #333",
          }}
        >
          <h2 style={{ margin: 0, color: "#fff", fontSize: 18 }}>
            DoorTemplateOverlay
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 8,
          }}
        >
          {Object.entries(groupedTemplates).map(([subCat, templates]) => (
            <div key={subCat} style={{ marginBottom: 20 }}>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  color: "#9b59b6",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {subCat}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template)}
                    onDragStart={(e) => handleDragStart(template, e)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid #333",
            color: "#888",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          💡 Kéo mẫu vào canvas hoặc click để chọn, sau đó bấm &quot;Đặt vào bản
          vẽ&quot;
        </div>
      </div>
    </div>
  );
});

export default DoorTemplateOverlay;
