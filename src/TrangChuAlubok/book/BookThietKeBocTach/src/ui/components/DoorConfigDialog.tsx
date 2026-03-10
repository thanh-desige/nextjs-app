/**
 * DoorConfigDialog - Dialog nhập W/H/Hãng/Hệ sau khi thả cửa
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Chỉ cập nhật DoorEntity params & previewBounds, KHÔNG gọi door-engine
 * - KHÔNG import door-engines, analysis
 * - Sử dụng ParametricPreview (UI-only) để hiển thị và nhập kích thước
 */

"use client";

import React, { useState, useCallback, memo, useRef } from "react";
import type { DoorEntity } from "../../core/entities/DoorEntity";
import { ParametricPreview, variantToOpenType } from "./DoorConfigDialog/index";
import type { OpenType, MullionPosition } from "./DoorConfigDialog/index";

// SVG Thumbnail mapping - templates vẽ từ CAD
const SVG_THUMBNAILS: Partial<Record<string, string>> = {
  "awning-1": "/door-templates/cua-so/cua-so-hat.svg",
  // Thêm các template khác khi vẽ xong
};

// ==================== CONSTANTS ====================
const MIN_SIZE = 100;
const MAX_SIZE = 10000;
const COLORS = {
  dimension: "#FF00FF",
  dimensionText: "#00FFFF",
};

// ==================== SVG Preview với Dimension Inputs ====================

interface DimensionInputProps {
  value: number;
  onChange: (value: number) => void;
  orientation: "horizontal" | "vertical";
  position: { x: number; y: number };
}

/**
 * Dimension Input - Input nhập kích thước trên đường dim
 */
const DimensionInput = memo(function DimensionInput({
  value,
  onChange,
  orientation,
  position,
}: DimensionInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value.toString());
    setTimeout(() => inputRef.current?.select(), 0);
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue) && newValue >= MIN_SIZE && newValue <= MAX_SIZE) {
      onChange(newValue);
    } else {
      setEditValue(value.toString());
    }
  }, [editValue, onChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBlur();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(value.toString());
      }
    },
    [handleBlur, value]
  );

  const isHorizontal = orientation === "horizontal";

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        // Horizontal: center-x, offset lên trên dim line
        // Vertical: center-y, offset sang trái dim line, rotate
        transform: isHorizontal
          ? "translate(-50%, -100%)"
          : "translate(-100%, -50%) rotate(-90deg)",
        transformOrigin: isHorizontal ? "center bottom" : "right center",
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={MIN_SIZE}
          max={MAX_SIZE}
          step={10}
          style={{
            width: 55,
            height: 20,
            backgroundColor: "#2a2a3e",
            border: `1px solid ${COLORS.dimension}`,
            borderRadius: 3,
            color: "#fff",
            fontSize: 11,
            textAlign: "center",
            outline: "none",
          }}
          autoFocus
        />
      ) : (
        <div
          onClick={handleClick}
          style={{
            padding: "1px 6px",
            backgroundColor: "#1e1e2e",
            borderRadius: 2,
            color: COLORS.dimensionText,
            fontSize: 11,
            fontWeight: "bold",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="Click để sửa"
        >
          {value}
        </div>
      )}
    </div>
  );
});

interface SVGPreviewWithDimensionsProps {
  svgUrl: string;
  width: number;
  height: number;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  displayName: string;
}

/**
 * SVG Preview với Dimension Inputs
 * Hiển thị SVG thumbnail + đường dim có thể nhập kích thước
 */
const SVGPreviewWithDimensions = memo(function SVGPreviewWithDimensions({
  svgUrl,
  width,
  height,
  onWidthChange,
  onHeightChange,
  displayName,
}: SVGPreviewWithDimensionsProps) {
  // Container size - tăng để SVG to hơn
  const containerWidth = 360;
  const containerHeight = 180;
  const dimOffset = 25; // Khoảng cách dim ra ngoài SVG
  const dimLineThickness = 15; // Độ dày vùng dim

  // Tính tỷ lệ để fit SVG vào container (trừ chỗ cho dim)
  const availableWidth = containerWidth - dimOffset - dimLineThickness - 20;
  const availableHeight = containerHeight - dimOffset - dimLineThickness - 10;
  const aspectRatio = width / height;

  let svgWidth: number, svgHeight: number;
  if (aspectRatio > availableWidth / availableHeight) {
    svgWidth = availableWidth;
    svgHeight = availableWidth / aspectRatio;
  } else {
    svgHeight = availableHeight;
    svgWidth = availableHeight * aspectRatio;
  }

  // Position SVG - căn trái-trên để chừa chỗ cho dim bên phải và dưới
  const svgX = 15;
  const svgY = 10;

  return (
    <div
      style={{
        position: "relative",
        width: containerWidth,
        height: containerHeight,
        backgroundColor: "#1e1e2e",
        borderRadius: 8,
        marginBottom: 16,
        border: "1px dashed #444",
        overflow: "hidden",
      }}
    >
      {/* SVG Thumbnail */}
      <div
        style={{
          position: "absolute",
          left: svgX,
          top: svgY,
          width: svgWidth,
          height: svgHeight,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={svgUrl}
          alt={displayName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>

      {/* Dimension Line - Width (dưới SVG) */}
      <svg
        style={{
          position: "absolute",
          left: svgX,
          top: svgY + svgHeight + 3,
          width: svgWidth,
          height: dimOffset,
          overflow: "visible",
        }}
      >
        {/* Extension lines */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={dimOffset - 5}
          stroke={COLORS.dimension}
          strokeWidth={0.5}
        />
        <line
          x1={svgWidth}
          y1={0}
          x2={svgWidth}
          y2={dimOffset - 5}
          stroke={COLORS.dimension}
          strokeWidth={0.5}
        />
        {/* Main line */}
        <line
          x1={0}
          y1={dimOffset - 8}
          x2={svgWidth}
          y2={dimOffset - 8}
          stroke={COLORS.dimension}
          strokeWidth={1}
        />
        {/* Arrows */}
        <polygon
          points={`0,${dimOffset - 8} 5,${dimOffset - 11} 5,${dimOffset - 5}`}
          fill={COLORS.dimension}
        />
        <polygon
          points={`${svgWidth},${dimOffset - 8} ${svgWidth - 5},${
            dimOffset - 11
          } ${svgWidth - 5},${dimOffset - 5}`}
          fill={COLORS.dimension}
        />
      </svg>

      {/* Width Input - nằm giữa dim line, lọt lòng */}
      <DimensionInput
        value={width}
        onChange={onWidthChange}
        orientation="horizontal"
        position={{
          x: svgX + svgWidth / 2,
          y: svgY + svgHeight + dimOffset - 8,
        }}
      />

      {/* Dimension Line - Height (phải SVG) */}
      <svg
        style={{
          position: "absolute",
          left: svgX + svgWidth + 3,
          top: svgY,
          width: dimOffset,
          height: svgHeight,
          overflow: "visible",
        }}
      >
        {/* Extension lines */}
        <line
          x1={0}
          y1={0}
          x2={dimOffset - 5}
          y2={0}
          stroke={COLORS.dimension}
          strokeWidth={0.5}
        />
        <line
          x1={0}
          y1={svgHeight}
          x2={dimOffset - 5}
          y2={svgHeight}
          stroke={COLORS.dimension}
          strokeWidth={0.5}
        />
        {/* Main line */}
        <line
          x1={dimOffset - 8}
          y1={0}
          x2={dimOffset - 8}
          y2={svgHeight}
          stroke={COLORS.dimension}
          strokeWidth={1}
        />
        {/* Arrows */}
        <polygon
          points={`${dimOffset - 8},0 ${dimOffset - 11},5 ${dimOffset - 5},5`}
          fill={COLORS.dimension}
        />
        <polygon
          points={`${dimOffset - 8},${svgHeight} ${dimOffset - 11},${
            svgHeight - 5
          } ${dimOffset - 5},${svgHeight - 5}`}
          fill={COLORS.dimension}
        />
      </svg>

      {/* Height Input - nằm giữa dim line, lọt lòng */}
      <DimensionInput
        value={height}
        onChange={onHeightChange}
        orientation="vertical"
        position={{
          x: svgX + svgWidth + dimOffset - 5,
          y: svgY + svgHeight / 2,
        }}
      />

      {/* Hint text */}
      <div
        style={{
          position: "absolute",
          bottom: 2,
          right: 8,
          fontSize: 9,
          color: "#555",
        }}
      >
        Click số để sửa
      </div>
    </div>
  );
});

/**
 * Danh sách hãng cửa
 */
const DOOR_BRANDS = [
  { id: "xingfa", name: "Xingfa" },
  { id: "pma", name: "PMA" },
  { id: "vietphap", name: "Việt Pháp" },
];

/**
 * Danh sách hệ theo hãng với supportedOpenTypes
 */
const DOOR_SYSTEMS: Record<
  string,
  { id: string; name: string; supportedOpenTypes: OpenType[] }[]
> = {
  xingfa: [
    {
      id: "xf55",
      name: "Xingfa 55",
      supportedOpenTypes: ["hinged", "fixed", "awning", "casement"],
    },
    {
      id: "xf93",
      name: "Xingfa 93 (Sliding)",
      supportedOpenTypes: ["sliding"],
    },
    {
      id: "xf65",
      name: "Xingfa 65",
      supportedOpenTypes: ["hinged", "fixed", "awning", "casement"],
    },
  ],
  pma: [
    {
      id: "pma55",
      name: "PMA 55",
      supportedOpenTypes: ["hinged", "fixed", "awning", "casement"],
    },
    { id: "pma65", name: "PMA 65 (Sliding)", supportedOpenTypes: ["sliding"] },
  ],
  vietphap: [
    {
      id: "vp4500",
      name: "Việt Pháp 4500",
      supportedOpenTypes: ["hinged", "fixed", "casement"],
    },
    {
      id: "vp5500",
      name: "Việt Pháp 5500 (Sliding)",
      supportedOpenTypes: ["sliding"],
    },
  ],
};

interface DoorConfigDialogProps {
  isOpen: boolean;
  door: DoorEntity | null;
  onClose: () => void;
  onConfirm: (updates: {
    width: number;
    height: number;
    systemId: string;
    displayName?: string;
    mullions?: MullionPosition[];
  }) => void;
}

/**
 * Door Config Dialog Component
 * Uses key prop from parent to reset state when door changes
 */
export const DoorConfigDialog = memo(function DoorConfigDialog({
  isOpen,
  door,
  onClose,
  onConfirm,
}: DoorConfigDialogProps) {
  // Find brand from systemId
  const findBrandFromSystemId = (sysId: string): string => {
    for (const [brand, systems] of Object.entries(DOOR_SYSTEMS)) {
      if (systems.some((s) => s.id === sysId)) {
        return brand;
      }
    }
    return "xingfa";
  };

  // Initialize state from door props directly
  // Parent should use key={door?.id} to reset this component
  const [width, setWidth] = useState(() => door?.doorInfo.width ?? 900);
  const [height, setHeight] = useState(() => door?.doorInfo.height ?? 2200);
  const [systemId, setSystemId] = useState(
    () => door?.doorInfo.systemId ?? "xf55"
  );
  const [brandId, setBrandId] = useState(() =>
    findBrandFromSystemId(door?.doorInfo.systemId ?? "xf55")
  );
  const [displayName, setDisplayName] = useState(
    () => door?.doorInfo.displayName ?? ""
  );

  // OpenType from door variant
  const [openType, setOpenType] = useState<OpenType>(() =>
    variantToOpenType(door?.doorInfo.variant ?? "hinged-single")
  );

  // Mullions state
  const [mullions, setMullions] = useState<MullionPosition[]>([]);

  // Brand change handler - filter by openType
  const handleBrandChange = useCallback(
    (newBrandId: string) => {
      setBrandId(newBrandId);
      const newSystems = DOOR_SYSTEMS[newBrandId] || [];
      // Filter systems that support current openType
      const compatibleSystems = newSystems.filter((s) =>
        s.supportedOpenTypes.includes(openType)
      );
      if (compatibleSystems.length > 0) {
        setSystemId(compatibleSystems[0].id);
      } else if (newSystems.length > 0) {
        setSystemId(newSystems[0].id);
      }
    },
    [openType]
  );

  // OpenType change handler - KHÔNG CÒN SỬ DỤNG vì đã khóa buttons
  // Giữ lại để tương lai nếu cần mở khóa
  const _handleOpenTypeChange = useCallback(
    (newOpenType: OpenType) => {
      setOpenType(newOpenType);
      // Filter current brand's systems by new openType
      const currentSystems = DOOR_SYSTEMS[brandId] || [];
      const compatibleSystems = currentSystems.filter((s) =>
        s.supportedOpenTypes.includes(newOpenType)
      );
      if (compatibleSystems.length > 0) {
        if (!compatibleSystems.some((s) => s.id === systemId)) {
          setSystemId(compatibleSystems[0].id);
        }
      }
    },
    [brandId, systemId]
  );
  void _handleOpenTypeChange; // Silence unused warning

  const handleConfirm = useCallback(() => {
    onConfirm({
      width,
      height,
      systemId,
      displayName: displayName || undefined,
      mullions: mullions.length > 0 ? mullions : undefined,
    });
    onClose();
  }, [width, height, systemId, displayName, mullions, onConfirm, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleConfirm();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [handleConfirm, onClose]
  );

  if (!isOpen || !door) return null;

  // Get systems filtered by openType
  const allSystems = DOOR_SYSTEMS[brandId] || [];
  const systems = allSystems.filter((s) =>
    s.supportedOpenTypes.includes(openType)
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          backgroundColor: "#1e1e2e",
          borderRadius: 12,
          padding: 24,
          minWidth: 400,
          maxWidth: 480,
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
          }}
        >
          <h2 style={{ margin: 0, color: "#fff", fontSize: 16 }}>
            🚪 Cấu hình cửa
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Parametric Preview hoặc SVG Thumbnail với Dimensions */}
        {door.previewTemplateId && SVG_THUMBNAILS[door.previewTemplateId] ? (
          <SVGPreviewWithDimensions
            svgUrl={SVG_THUMBNAILS[door.previewTemplateId]!}
            width={width}
            height={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
            displayName={door.doorInfo.displayName}
          />
        ) : (
          <ParametricPreview
            width={width}
            height={height}
            openType={openType}
            mullions={mullions}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
            onMullionsChange={setMullions}
            editable={true}
          />
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* OpenType selector - KHÓA vì user đã chọn từ sidebar */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                color: "#aaa",
                fontSize: 12,
              }}
            >
              Kiểu mở
              <span style={{ color: "#666", fontSize: 10, marginLeft: 8 }}>
                (đã chọn từ thư viện)
              </span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(
                [
                  { id: "hinged", label: "Mở quay" },
                  { id: "sliding", label: "Trượt" },
                  { id: "fixed", label: "Fix" },
                  { id: "awning", label: "Hất" },
                  { id: "casement", label: "Mở hất" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  disabled={true}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    backgroundColor:
                      openType === opt.id ? "#9b59b6" : "#2a2a3e",
                    border:
                      openType === opt.id
                        ? "1px solid #9b59b6"
                        : "1px solid #444",
                    borderRadius: 6,
                    color: openType === opt.id ? "#fff" : "#555",
                    fontSize: 11,
                    cursor: "not-allowed",
                    opacity: openType === opt.id ? 1 : 0.5,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                color: "#aaa",
                fontSize: 12,
              }}
            >
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={door.doorInfo.displayName}
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "#2a2a3e",
                border: "1px solid #444",
                borderRadius: 6,
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {/* Brand & System */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "#aaa",
                  fontSize: 12,
                }}
              >
                Hãng
              </label>
              <select
                value={brandId}
                onChange={(e) => handleBrandChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#2a2a3e",
                  border: "1px solid #444",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {DOOR_BRANDS.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "#aaa",
                  fontSize: 12,
                }}
              >
                Hệ
              </label>
              <select
                value={systemId}
                onChange={(e) => setSystemId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#2a2a3e",
                  border: "1px solid #444",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {systems.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview info */}
          <div
            style={{
              backgroundColor: "#2a2a3e",
              borderRadius: 6,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#888", fontSize: 12 }}>
              Kích thước: {width} × {height} mm
            </span>
            <span style={{ color: "#9b59b6", fontSize: 12 }}>
              {systems.find((s) => s.id === systemId)?.name || systemId}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "1px solid #444",
              borderRadius: 6,
              color: "#888",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "10px 24px",
              backgroundColor: "#9b59b6",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
});

export default DoorConfigDialog;
