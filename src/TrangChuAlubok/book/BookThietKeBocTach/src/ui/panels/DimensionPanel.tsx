/**
 * DimensionPanel.tsx
 *
 * Panel công cụ dimension/kích thước trên bản vẽ CAD
 */

import React from "react";
import {
  DimensionType,
  DimensionStyle,
} from "../../core/dimensions/DimensionManager";
import { DimensionToolState } from "../../hooks/useDimensions";
import styles from "./DimensionPanel.module.css";

interface DimensionPanelProps {
  toolState: DimensionToolState;
  style: DimensionStyle;
  onStartTool: (type: DimensionType) => void;
  onCancel: () => void;
  onStyleChange: (style: Partial<DimensionStyle>) => void;
}

const DIMENSION_TOOLS: { type: DimensionType; icon: string; label: string }[] =
  [
    { type: "linear", icon: "↔️", label: "Linear" },
    { type: "aligned", icon: "↗️", label: "Aligned" },
    { type: "angular", icon: "📐", label: "Angular" },
    { type: "radius", icon: "⭕", label: "Radius" },
    { type: "diameter", icon: "◎", label: "Diameter" },
  ];

const STEP_MESSAGES: Record<DimensionType, string[]> = {
  linear: [
    "Chọn điểm đầu",
    "Chọn điểm cuối",
    "Di chuột để đặt vị trí, click để xác nhận",
  ],
  horizontal: [
    "Chọn điểm đầu",
    "Chọn điểm cuối",
    "Di chuột để đặt vị trí, click để xác nhận",
  ],
  vertical: [
    "Chọn điểm đầu",
    "Chọn điểm cuối",
    "Di chuột để đặt vị trí, click để xác nhận",
  ],
  aligned: [
    "Chọn điểm đầu",
    "Chọn điểm cuối",
    "Di chuột để đặt vị trí, click để xác nhận",
  ],
  angular: [
    "Chọn tâm góc",
    "Chọn điểm trên cạnh thứ 1",
    "Chọn điểm trên cạnh thứ 2",
    "Click để xác nhận",
  ],
  radius: ["Chọn tâm đường tròn", "Chọn điểm trên đường tròn"],
  diameter: ["Chọn tâm đường tròn", "Chọn điểm trên đường tròn"],
  arc: ["Chọn cung tròn"],
  ordinate: ["Chọn điểm"],
  continue: ["Chọn dimension trước đó", "Chọn điểm tiếp theo"],
  baseline: ["Chọn dimension gốc", "Chọn điểm tiếp theo"],
  qdim: ["Chọn các điểm cần đo", "Enter để hoàn thành"],
};

export function DimensionPanel({
  toolState,
  style,
  onStartTool,
  onCancel,
  onStyleChange,
}: DimensionPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>📏 Dimension</span>
      </div>

      {/* Tool buttons */}
      <div className={styles.toolGrid}>
        {DIMENSION_TOOLS.map((tool) => (
          <button
            key={tool.type}
            className={`${styles.toolButton} ${
              toolState.isActive && toolState.dimensionType === tool.type
                ? styles.active
                : ""
            }`}
            onClick={() => onStartTool(tool.type)}
            title={tool.label}
          >
            <span className={styles.toolIcon}>{tool.icon}</span>
            <span className={styles.toolLabel}>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Active tool status */}
      {toolState.isActive && (
        <div className={styles.status}>
          <div className={styles.statusHeader}>
            <span>
              {
                DIMENSION_TOOLS.find((t) => t.type === toolState.dimensionType)
                  ?.icon
              }{" "}
              {
                DIMENSION_TOOLS.find((t) => t.type === toolState.dimensionType)
                  ?.label
              }
            </span>
            <button
              className={styles.cancelButton}
              onClick={onCancel}
              title="Hủy (ESC)"
            >
              ✕
            </button>
          </div>
          <p className={styles.instruction}>
            {STEP_MESSAGES[toolState.dimensionType]?.[toolState.step] ||
              "Click để tiếp tục"}
          </p>
          <div className={styles.progress}>
            {STEP_MESSAGES[toolState.dimensionType]?.map((_, idx) => (
              <div
                key={idx}
                className={`${styles.progressDot} ${
                  idx < toolState.step
                    ? styles.completed
                    : idx === toolState.step
                    ? styles.current
                    : ""
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Style options */}
      <div className={styles.styleSection}>
        <div className={styles.styleHeader}>Tùy chọn</div>

        <div className={styles.styleRow}>
          <label>Màu:</label>
          <input
            type="color"
            value={style.lineColor}
            onChange={(e) =>
              onStyleChange({
                lineColor: e.target.value,
                textColor: e.target.value,
              })
            }
            className={styles.colorInput}
          />
        </div>

        <div className={styles.styleRow}>
          <label>Font size:</label>
          <input
            type="number"
            value={style.textHeight}
            onChange={(e) =>
              onStyleChange({ textHeight: Number(e.target.value) })
            }
            min={8}
            max={32}
            className={styles.numberInput}
          />
        </div>

        <div className={styles.styleRow}>
          <label>Precision:</label>
          <select
            value={style.precision}
            onChange={(e) =>
              onStyleChange({ precision: Number(e.target.value) })
            }
            className={styles.selectInput}
          >
            <option value={0}>0</option>
            <option value={1}>0.0</option>
            <option value={2}>0.00</option>
            <option value={3}>0.000</option>
          </select>
        </div>

        <div className={styles.styleRow}>
          <label>Đơn vị:</label>
          <select
            value={style.unit}
            onChange={(e) =>
              onStyleChange({
                unit: e.target.value as "mm" | "cm" | "m" | "inch",
              })
            }
            className={styles.selectInput}
          >
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
            <option value="inch">inch</option>
          </select>
        </div>

        <div className={styles.styleRow}>
          <label>
            <input
              type="checkbox"
              checked={style.showUnit}
              onChange={(e) => onStyleChange({ showUnit: e.target.checked })}
              className={styles.checkbox}
            />
            Hiện đơn vị
          </label>
        </div>
      </div>
    </div>
  );
}

export default DimensionPanel;
