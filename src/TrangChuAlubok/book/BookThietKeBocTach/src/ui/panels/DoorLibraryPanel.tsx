/**
 * DoorLibraryPanel - Panel for door templates library
 */

"use client";

import React, { useState, useMemo } from "react";

// ==================== Local Types ====================

export type DoorType =
  | "sliding"
  | "swing"
  | "folding"
  | "fixed"
  | "casement"
  | "awning"
  | "pivot"
  | "louver";

export interface DoorTemplate {
  id: string;
  name: string;
  type: DoorType;
  description?: string;
  width: number;
  height: number;
  thumbnail?: string;
}

// ==================== Types ====================

export interface DoorLibraryPanelProps {
  /** Available door templates */
  templates: DoorTemplate[];
  /** Template selection handler */
  onSelect: (template: DoorTemplate) => void;
  /** Insert template handler */
  onInsert: (template: DoorTemplate) => void;
  /** Edit template handler */
  onEdit?: (template: DoorTemplate) => void;
  /** Delete template handler */
  onDelete?: (templateId: string) => void;
  /** Create new template handler */
  onCreate?: () => void;
  /** Additional class name */
  className?: string;
}

// ==================== Helper Functions ====================

const getDoorTypeLabel = (type: DoorType): string => {
  const labels: Record<DoorType, string> = {
    sliding: "Cửa lùa",
    swing: "Cửa mở quay",
    folding: "Cửa gấp",
    fixed: "Cửa cố định",
    casement: "Cửa mở hất",
    awning: "Cửa mở trên",
    pivot: "Cửa xoay",
    louver: "Cửa lam",
  };
  return labels[type] || type;
};

const getDoorTypeIcon = (type: DoorType): React.ReactNode => {
  const iconMap: Record<DoorType, React.ReactNode> = {
    sliding: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <line x1="24" y1="8" x2="24" y2="40" strokeDasharray="2 2" />
        <path d="M12 24 L20 24 M20 22 L24 24 L20 26" />
      </svg>
    ),
    swing: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <path d="M4 8 Q24 8 44 24" strokeDasharray="4 2" />
        <circle cx="8" cy="24" r="2" fill="currentColor" />
      </svg>
    ),
    folding: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <path d="M4 8 L16 40 M16 8 L28 40 M28 8 L40 40" strokeDasharray="3 2" />
      </svg>
    ),
    fixed: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <line x1="4" y1="24" x2="44" y2="24" />
        <line x1="24" y1="8" x2="24" y2="40" />
      </svg>
    ),
    casement: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <line x1="24" y1="8" x2="24" y2="40" />
        <path d="M4 8 L4 40 Q14 24 4 8" fill="currentColor" opacity="0.2" />
      </svg>
    ),
    awning: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <path d="M4 8 L44 8 Q24 24 4 8" strokeDasharray="4 2" />
      </svg>
    ),
    pivot: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <path d="M24 8 L24 40" strokeDasharray="3 2" />
      </svg>
    ),
    louver: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="100%"
        height="100%"
      >
        <rect x="4" y="8" width="40" height="32" rx="1" />
        <line x1="4" y1="14" x2="44" y2="14" />
        <line x1="4" y1="20" x2="44" y2="20" />
        <line x1="4" y1="26" x2="44" y2="26" />
        <line x1="4" y1="32" x2="44" y2="32" />
      </svg>
    ),
  };
  return iconMap[type];
};

// ==================== TemplateCard Component ====================

interface TemplateCardProps {
  template: DoorTemplate;
  onSelect: () => void;
  onInsert: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onInsert,
  onEdit,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer group"
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Preview */}
      <div className="aspect-square p-4 bg-gray-850 flex items-center justify-center text-gray-500">
        {getDoorTypeIcon(template.type)}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-white text-sm font-medium truncate">
          {template.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {getDoorTypeLabel(template.type)}
          </span>
          <span className="text-xs text-gray-400">
            {template.width}x{template.height}
          </span>
        </div>
      </div>

      {/* Actions overlay */}
      {showActions && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInsert();
            }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
          >
            Chèn
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-500"
            >
              Sửa
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-500"
            >
              Xóa
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== DoorLibraryPanel Component ====================

export const DoorLibraryPanel: React.FC<DoorLibraryPanelProps> = ({
  templates,
  onSelect,
  onInsert,
  onEdit,
  onDelete,
  onCreate,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<DoorType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (
          !t.name.toLowerCase().includes(query) &&
          !t.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [templates, filterType, searchQuery]);

  // Group by type
  const groupedTemplates = useMemo(() => {
    if (filterType !== "all") return null;

    const groups: Record<DoorType, DoorTemplate[]> = {} as Record<
      DoorType,
      DoorTemplate[]
    >;
    filteredTemplates.forEach((t) => {
      if (!groups[t.type]) groups[t.type] = [];
      groups[t.type].push(t);
    });
    return groups;
  }, [filteredTemplates, filterType]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">Thư Viện Cửa</h3>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded overflow-hidden border border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="16"
                height="16"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="16"
                height="16"
              >
                <rect x="3" y="4" width="18" height="4" />
                <rect x="3" y="10" width="18" height="4" />
                <rect x="3" y="16" width="18" height="4" />
              </svg>
            </button>
          </div>

          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700"
              title="Tạo mẫu mới"
            >
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
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700 bg-gray-850">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm..."
          className="flex-1 bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 outline-none focus:border-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as DoorType | "all")}
          className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 outline-none focus:border-blue-500"
        >
          <option value="all">Tất cả loại</option>
          <option value="sliding">Cửa lùa</option>
          <option value="swing">Cửa mở quay</option>
          <option value="folding">Cửa gấp</option>
          <option value="fixed">Cửa cố định</option>
          <option value="casement">Cửa mở hất</option>
          <option value="awning">Cửa mở trên</option>
          <option value="pivot">Cửa xoay</option>
          <option value="louver">Cửa lam</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-sm">Không tìm thấy mẫu cửa</p>
          </div>
        ) : groupedTemplates ? (
          // Grouped view
          Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
            <div key={type} className="mb-6 last:mb-0">
              <h4 className="text-gray-400 text-sm font-medium mb-3">
                {getDoorTypeLabel(type as DoorType)} ({typeTemplates.length})
              </h4>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-3"
                    : "flex flex-col gap-2"
                }
              >
                {typeTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelect(template)}
                    onInsert={() => onInsert(template)}
                    onEdit={onEdit ? () => onEdit(template) : undefined}
                    onDelete={
                      onDelete ? () => onDelete(template.id) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat view
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 gap-3"
                : "flex flex-col gap-2"
            }
          >
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelect(template)}
                onInsert={() => onInsert(template)}
                onEdit={onEdit ? () => onEdit(template) : undefined}
                onDelete={onDelete ? () => onDelete(template.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
        {filteredTemplates.length} mẫu cửa
      </div>
    </div>
  );
};

export default DoorLibraryPanel;
