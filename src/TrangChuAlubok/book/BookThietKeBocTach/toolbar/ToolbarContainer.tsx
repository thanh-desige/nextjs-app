"use client";
import React from "react";
import { IconType } from "react-icons";
import {
  FiEdit3,
  FiMove,
  FiType,
  FiCrosshair,
  FiSave,
  FiSettings,
} from "react-icons/fi";
import { COLORS } from "../constants/colors";

interface Tool {
  icon: IconType;
  label: string;
}

interface ToolGroup {
  name: string;
  tools: Tool[];
}

const toolGroups: ToolGroup[] = [
  {
    name: "Draw",
    tools: [
      { icon: FiEdit3, label: "Line" },
      { icon: FiEdit3, label: "Rect" },
      { icon: FiEdit3, label: "Circle" },
    ],
  },
  {
    name: "Modify",
    tools: [
      { icon: FiMove, label: "Move" },
      { icon: FiMove, label: "Rotate" },
      { icon: FiMove, label: "Scale" },
    ],
  },
  {
    name: "Dimension",
    tools: [
      { icon: FiType, label: "Linear" },
      { icon: FiType, label: "Aligned" },
    ],
  },
  {
    name: "Osnap",
    tools: [
      { icon: FiCrosshair, label: "End" },
      { icon: FiCrosshair, label: "Mid" },
      { icon: FiCrosshair, label: "Center" },
    ],
  },
  {
    name: "Optional",
    tools: [{ icon: FiSettings, label: "Settings" }],
  },
  {
    name: "File",
    tools: [
      { icon: FiSave, label: "Save" },
      { icon: FiSave, label: "Export" },
    ],
  },
];

export default function ToolbarContainer(): React.ReactElement {
  return (
    <div
      style={{
        height: "40px",
        backgroundColor: COLORS.header,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        gap: "16px",
        overflowX: "auto",
      }}
    >
      {toolGroups.map((group) => (
        <div
          key={group.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0 8px",
            borderRight: `1px solid ${COLORS.border}`,
          }}
        >
          {group.tools.map((tool, idx) => (
            <button
              key={idx}
              title={tool.label}
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                color: COLORS.mutedText,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.border;
                e.currentTarget.style.color = COLORS.text;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.mutedText;
              }}
            >
              <tool.icon size={16} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
