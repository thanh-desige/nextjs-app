/**
 * PropertiesPanel - Panel for editing entity properties
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";

// ==================== Local Entity Interface ====================

export interface EntityStyle {
  color?: string;
  lineWidth?: number;
  lineStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  fillColor?: string;
  fillOpacity?: number;
}

export interface BoundingBox {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

export interface IEntity {
  id: string;
  type: string;
  layer: string;
  visible: boolean;
  locked: boolean;
  style?: EntityStyle;
  getBoundingBox(): BoundingBox | null;
}

// ==================== Types ====================

export interface PropertyValue {
  value: string | number | boolean;
  type: "string" | "number" | "boolean" | "color" | "select" | "readonly";
  options?: string[]; // For select type
  min?: number;
  max?: number;
  step?: number;
}

export interface PropertyGroup {
  name: string;
  expanded?: boolean;
  properties: Record<string, PropertyValue>;
}

export interface PropertiesPanelProps {
  /** Selected entities */
  entities: IEntity[];
  /** Property change handler */
  onChange: (
    entityId: string,
    property: string,
    value: PropertyValue["value"]
  ) => void;
  /** Panel title */
  title?: string;
  /** Additional class name */
  className?: string;
}

// ==================== Helper Components ====================

interface PropertyRowProps {
  name: string;
  value: PropertyValue;
  onChange: (value: PropertyValue["value"]) => void;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ name, value, onChange }) => {
  const formatLabel = (str: string): string => {
    return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  };

  const renderInput = () => {
    switch (value.type) {
      case "readonly":
        return (
          <span className="text-gray-400 text-sm">{String(value.value)}</span>
        );

      case "boolean":
        return (
          <input
            type="checkbox"
            checked={value.value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
        );

      case "color":
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(value.value)}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-6 border border-gray-600 rounded cursor-pointer"
            />
            <span className="text-xs text-gray-400 font-mono">
              {String(value.value).toUpperCase()}
            </span>
          </div>
        );

      case "select":
        return (
          <select
            value={String(value.value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 outline-none focus:border-blue-500"
          >
            {value.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            value={value.value as number}
            min={value.min}
            max={value.max}
            step={value.step ?? 1}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 outline-none focus:border-blue-500"
          />
        );

      case "string":
      default:
        return (
          <input
            type="text"
            value={String(value.value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 outline-none focus:border-blue-500"
          />
        );
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-750">
      <label className="text-gray-300 text-sm shrink-0 w-24">
        {formatLabel(name)}
      </label>
      <div className="flex-1 ml-2">{renderInput()}</div>
    </div>
  );
};

interface PropertyGroupViewProps {
  group: PropertyGroup;
  onToggle: () => void;
  onChange: (property: string, value: PropertyValue["value"]) => void;
}

const PropertyGroupView: React.FC<PropertyGroupViewProps> = ({
  group,
  onToggle,
  onChange,
}) => {
  return (
    <div className="border-b border-gray-700 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-750 transition-colors"
      >
        <span className="text-white text-sm font-medium">{group.name}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            group.expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {group.expanded && (
        <div className="bg-gray-850 py-1">
          {Object.entries(group.properties).map(([propName, propValue]) => (
            <PropertyRow
              key={propName}
              name={propName}
              value={propValue}
              onChange={(val) => onChange(propName, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== PropertiesPanel Component ====================

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  entities,
  onChange,
  title = "Properties",
  className = "",
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      General: true,
      Style: true,
      Geometry: true,
      "Common Style": true,
    }
  );

  // Build property groups from selected entities using useMemo
  const groups = useMemo((): PropertyGroup[] => {
    if (entities.length === 0) {
      return [];
    }

    if (entities.length === 1) {
      const entity = entities[0];

      // General group
      const general: PropertyGroup = {
        name: "General",
        expanded: expandedGroups["General"] ?? true,
        properties: {
          id: { value: entity.id, type: "readonly" },
          type: { value: entity.type, type: "readonly" },
          layer: { value: entity.layer, type: "string" },
          visible: { value: entity.visible, type: "boolean" },
          locked: { value: entity.locked, type: "boolean" },
        },
      };

      // Style group
      const style: PropertyGroup = {
        name: "Style",
        expanded: expandedGroups["Style"] ?? true,
        properties: {
          color: { value: entity.style?.color ?? "#ffffff", type: "color" },
          lineWidth: {
            value: entity.style?.lineWidth ?? 1,
            type: "number",
            min: 0.1,
            max: 10,
            step: 0.5,
          },
          lineStyle: {
            value: entity.style?.lineStyle ?? "solid",
            type: "select",
            options: ["solid", "dashed", "dotted", "dashdot"],
          },
        },
      };

      // Geometry group - extract position from bounding box or specific properties
      const geometry: PropertyGroup = {
        name: "Geometry",
        expanded: expandedGroups["Geometry"] ?? true,
        properties: {},
      };

      // Add type-specific geometry properties
      const bbox = entity.getBoundingBox();
      if (bbox) {
        geometry.properties["width"] = {
          value: bbox.max.x - bbox.min.x,
          type: "readonly",
        };
        geometry.properties["height"] = {
          value: bbox.max.y - bbox.min.y,
          type: "readonly",
        };
        geometry.properties["centerX"] = {
          value: (bbox.min.x + bbox.max.x) / 2,
          type: "readonly",
        };
        geometry.properties["centerY"] = {
          value: (bbox.min.y + bbox.max.y) / 2,
          type: "readonly",
        };
      }

      return [general, style, geometry];
    } else {
      // Multiple selection - show common properties
      const multiSelect: PropertyGroup = {
        name: `${entities.length} Objects Selected`,
        expanded: true,
        properties: {
          count: { value: entities.length, type: "readonly" },
          types: {
            value: [...new Set(entities.map((e) => e.type))].join(", "),
            type: "readonly",
          },
        },
      };

      // Common style properties
      const commonStyle: PropertyGroup = {
        name: "Common Style",
        expanded: expandedGroups["Common Style"] ?? true,
        properties: {
          color: { value: "#ffffff", type: "color" },
          lineWidth: { value: 1, type: "number", min: 0.1, max: 10, step: 0.5 },
        },
      };

      return [multiSelect, commonStyle];
    }
  }, [entities, expandedGroups]);

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  }, []);

  const handlePropertyChange = useCallback(
    (entityId: string, property: string, value: PropertyValue["value"]) => {
      onChange(entityId, property, value);
    },
    [onChange]
  );

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ backgroundColor: "#252526" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">{title}</h3>
        {entities.length > 0 && (
          <span className="text-xs text-gray-500">
            {entities.length} selected
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <svg
              className="w-12 h-12 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">No selection</p>
            <p className="text-xs text-gray-600 mt-1">
              Select an object to view properties
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <PropertyGroupView
              key={group.name}
              group={group}
              onToggle={() => toggleGroup(group.name)}
              onChange={(prop, val) => {
                if (entities.length === 1) {
                  handlePropertyChange(entities[0].id, prop, val);
                } else {
                  // Apply to all selected entities
                  entities.forEach((e) =>
                    handlePropertyChange(e.id, prop, val)
                  );
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
