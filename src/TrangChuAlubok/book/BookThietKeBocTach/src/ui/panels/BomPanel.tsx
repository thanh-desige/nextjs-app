/**
 * BomPanel - Bill of Materials display panel
 */

"use client";

import React, { useMemo, useState } from "react";

// ==================== Local Types ====================

export type MaterialType =
  | "aluminum_frame"
  | "aluminum_bar"
  | "glass"
  | "hardware"
  | "accessory"
  | "sealant"
  | "other";

export interface BomEntry {
  material: string;
  type: MaterialType;
  quantity: number;
  unit: string;
  unitPrice?: number;
  description?: string;
}

export interface PriceBreakdown {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
}

// ==================== Types ====================

export interface BomPanelProps {
  /** BOM entries */
  entries: BomEntry[];
  /** Price breakdown */
  pricing?: PriceBreakdown;
  /** Currency symbol */
  currency?: string;
  /** Export handler */
  onExport?: (format: "csv" | "excel" | "pdf") => void;
  /** Print handler */
  onPrint?: () => void;
  /** Additional class name */
  className?: string;
}

type SortField = "material" | "type" | "quantity" | "unit" | "price";
type SortDirection = "asc" | "desc";

// ==================== Helper Functions ====================

const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatCurrency = (num: number, currency = "₫"): string => {
  return `${formatNumber(num, 0)} ${currency}`;
};

const getMaterialTypeLabel = (type: MaterialType): string => {
  const labels: Record<MaterialType, string> = {
    aluminum_frame: "Khung nhôm",
    aluminum_bar: "Thanh nhôm",
    glass: "Kính",
    hardware: "Phụ kiện",
    accessory: "Linh kiện",
    sealant: "Keo/Gioăng",
    other: "Khác",
  };
  return labels[type] || type;
};

// ==================== Icons ====================

// ==================== Sort Icon Component ====================

const SortIcon: React.FC<{
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}> = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return null;
  return sortDirection === "asc" ? (
    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <path d="M7 14l5-5 5 5H7z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
};

// ==================== Icons ====================

const icons = {
  export: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  print: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  sortAsc: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <path d="M7 14l5-5 5 5H7z" />
    </svg>
  ),
  sortDesc: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  ),
};

// ==================== BomPanel Component ====================

export const BomPanel: React.FC<BomPanelProps> = ({
  entries,
  pricing,
  currency = "₫",
  onExport,
  onPrint,
  className = "",
}) => {
  const [sortField, setSortField] = useState<SortField>("material");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterType, setFilterType] = useState<MaterialType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort entries
  const processedEntries = useMemo(() => {
    let result = [...entries];

    // Filter by type
    if (filterType !== "all") {
      result = result.filter((e) => e.type === filterType);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.material.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "material":
          comparison = a.material.localeCompare(b.material);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "unit":
          comparison = a.unit.localeCompare(b.unit);
          break;
        case "price":
          comparison = (a.unitPrice ?? 0) - (b.unitPrice ?? 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [entries, filterType, searchQuery, sortField, sortDirection]);

  // Group entries by type for summary
  const typeSummary = useMemo(() => {
    const summary: Record<MaterialType, { count: number; total: number }> =
      {} as Record<MaterialType, { count: number; total: number }>;
    entries.forEach((entry) => {
      if (!summary[entry.type]) {
        summary[entry.type] = { count: 0, total: 0 };
      }
      summary[entry.type].count++;
      summary[entry.type].total += entry.quantity * (entry.unitPrice ?? 0);
    });
    return summary;
  }, [entries]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <SortIcon
        field={field}
        sortField={sortField}
        sortDirection={sortDirection}
      />
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">Bảng Bóc Tách Vật Tư</h3>
        <div className="flex items-center gap-2">
          {onExport && (
            <div className="relative group">
              <button
                type="button"
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700"
                title="Export"
              >
                {icons.export}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  type="button"
                  onClick={() => onExport("csv")}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => onExport("excel")}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700"
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => onExport("pdf")}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700"
                >
                  Export PDF
                </button>
              </div>
            </div>
          )}
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700"
              title="Print"
            >
              {icons.print}
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
          className="flex-1 max-w-xs bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 outline-none focus:border-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as MaterialType | "all")
          }
          className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 outline-none focus:border-blue-500"
        >
          <option value="all">Tất cả loại</option>
          <option value="aluminum_frame">Khung nhôm</option>
          <option value="aluminum_bar">Thanh nhôm</option>
          <option value="glass">Kính</option>
          <option value="hardware">Phụ kiện</option>
          <option value="accessory">Linh kiện</option>
          <option value="sealant">Keo/Gioăng</option>
          <option value="other">Khác</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th
                className="px-3 py-2 text-left text-gray-300 font-medium cursor-pointer hover:bg-gray-750"
                onClick={() => handleSort("material")}
              >
                <div className="flex items-center gap-1">
                  Vật tư {renderSortIcon("material")}
                </div>
              </th>
              <th
                className="px-3 py-2 text-left text-gray-300 font-medium cursor-pointer hover:bg-gray-750"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Loại {renderSortIcon("type")}
                </div>
              </th>
              <th
                className="px-3 py-2 text-right text-gray-300 font-medium cursor-pointer hover:bg-gray-750"
                onClick={() => handleSort("quantity")}
              >
                <div className="flex items-center justify-end gap-1">
                  SL {renderSortIcon("quantity")}
                </div>
              </th>
              <th
                className="px-3 py-2 text-center text-gray-300 font-medium cursor-pointer hover:bg-gray-750"
                onClick={() => handleSort("unit")}
              >
                <div className="flex items-center justify-center gap-1">
                  ĐVT {renderSortIcon("unit")}
                </div>
              </th>
              <th
                className="px-3 py-2 text-right text-gray-300 font-medium cursor-pointer hover:bg-gray-750"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center justify-end gap-1">
                  Đơn giá {renderSortIcon("price")}
                </div>
              </th>
              <th className="px-3 py-2 text-right text-gray-300 font-medium">
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {processedEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  Không có vật tư nào
                </td>
              </tr>
            ) : (
              processedEntries.map((entry, index) => (
                <tr
                  key={`${entry.material}-${index}`}
                  className="hover:bg-gray-850"
                >
                  <td className="px-3 py-2 text-white">
                    <div>{entry.material}</div>
                    {entry.description && (
                      <div className="text-xs text-gray-500">
                        {entry.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {getMaterialTypeLabel(entry.type)}
                  </td>
                  <td className="px-3 py-2 text-right text-white font-mono">
                    {formatNumber(entry.quantity)}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-400">
                    {entry.unit}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300 font-mono">
                    {entry.unitPrice
                      ? formatCurrency(entry.unitPrice, currency)
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-green-400 font-mono">
                    {entry.unitPrice
                      ? formatCurrency(
                          entry.quantity * entry.unitPrice,
                          currency
                        )
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {pricing && (
        <div className="border-t border-gray-700 bg-gray-850">
          {/* Type breakdown */}
          <div className="px-4 py-2 border-b border-gray-700">
            <div className="flex flex-wrap gap-4 text-xs">
              {Object.entries(typeSummary).map(([type, data]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {getMaterialTypeLabel(type as MaterialType)}:
                  </span>
                  <span className="text-white font-medium">
                    {data.count} mục
                  </span>
                  <span className="text-green-400">
                    {formatCurrency(data.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-gray-400">
              <span className="text-sm">Tổng cộng: </span>
              <span className="text-white font-medium">
                {processedEntries.length} mục
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Tổng tiền vật tư</div>
              <div className="text-xl font-bold text-green-400">
                {formatCurrency(pricing.materialCost, currency)}
              </div>
              {pricing.laborCost > 0 && (
                <div className="text-xs text-gray-400">
                  + Nhân công: {formatCurrency(pricing.laborCost, currency)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BomPanel;
