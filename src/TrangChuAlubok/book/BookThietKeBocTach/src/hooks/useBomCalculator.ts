/**
 * useBomCalculator - Hook for BOM calculation and management
 */

"use client";

import { useCallback, useMemo } from "react";
import { useProjectStore, BomItem } from "../store/projectStore";
import { useEngineStore } from "../store/engineStore";
import { EntityType } from "../core/entities/Entity.types";

// ==================== Types ====================

export interface BomSummary {
  totalItems: number;
  totalCost: number;
  byCategory: {
    aluminum: { count: number; cost: number };
    glass: { count: number; cost: number };
    accessory: { count: number; cost: number };
    service: { count: number; cost: number };
  };
}

export interface UseBomCalculatorReturn {
  // BOM items
  bomItems: BomItem[];
  bomSummary: BomSummary;

  // State
  lastCalculated: string | null;
  isCalculating: boolean;

  // Actions
  calculateBom: () => void;
  addItem: (item: Omit<BomItem, "id" | "totalPrice">) => void;
  updateItem: (id: string, updates: Partial<BomItem>) => void;
  removeItem: (id: string) => void;
  clearBom: () => void;

  // Queries
  getItemsByCategory: (category: BomItem["category"]) => BomItem[];
  getItemsByEntityId: (entityId: string) => BomItem[];
  getTotalByCategory: (category: BomItem["category"]) => number;

  // Export
  exportBom: (format: "excel" | "pdf" | "json") => Promise<Blob>;
}

// ==================== Hook Implementation ====================

export function useBomCalculator(): UseBomCalculatorReturn {
  // Store selectors
  const bomItems = useProjectStore((state) => state.bomItems);
  const bomLastCalculated = useProjectStore((state) => state.bomLastCalculated);
  const isCalculating = useProjectStore((state) => state.isCalculating);

  // Store actions
  const storeCalculateBom = useProjectStore((state) => state.calculateBom);
  const storeAddBomItem = useProjectStore((state) => state.addBomItem);
  const storeUpdateBomItem = useProjectStore((state) => state.updateBomItem);
  const storeRemoveBomItem = useProjectStore((state) => state.removeBomItem);
  const storeClearBom = useProjectStore((state) => state.clearBom);
  const storeExportBom = useProjectStore((state) => state.exportBom);

  // Engine store for entities
  const getAllEntities = useEngineStore((state) => state.getAllEntities);

  // Calculate BOM summary
  const bomSummary = useMemo((): BomSummary => {
    const summary: BomSummary = {
      totalItems: bomItems.length,
      totalCost: 0,
      byCategory: {
        aluminum: { count: 0, cost: 0 },
        glass: { count: 0, cost: 0 },
        accessory: { count: 0, cost: 0 },
        service: { count: 0, cost: 0 },
      },
    };

    for (const item of bomItems) {
      summary.totalCost += item.totalPrice;
      summary.byCategory[item.category].count++;
      summary.byCategory[item.category].cost += item.totalPrice;
    }

    return summary;
  }, [bomItems]);

  // Calculate BOM from entities
  const calculateBom = useCallback(() => {
    storeCalculateBom();

    // In a real implementation, this would:
    // 1. Get all door entities from CAD
    // 2. Extract dimensions and types
    // 3. Calculate aluminum lengths based on door frame dimensions
    // 4. Calculate glass areas
    // 5. Count accessories based on door type

    const entities = getAllEntities();

    // Example: Calculate based on entities
    // This is a placeholder - real implementation would use domain/bom logic
    entities.forEach((entity) => {
      if (
        entity.type === EntityType.RECT ||
        entity.type === EntityType.POLYLINE
      ) {
        // Add aluminum frame items based on entity dimensions
        // Add glass based on entity type
        // Add accessories based on entity metadata
      }
    });
  }, [storeCalculateBom, getAllEntities]);

  // Add item
  const addItem = useCallback(
    (item: Omit<BomItem, "id" | "totalPrice">) => {
      storeAddBomItem(item);
    },
    [storeAddBomItem]
  );

  // Update item
  const updateItem = useCallback(
    (id: string, updates: Partial<BomItem>) => {
      storeUpdateBomItem(id, updates);
    },
    [storeUpdateBomItem]
  );

  // Remove item
  const removeItem = useCallback(
    (id: string) => {
      storeRemoveBomItem(id);
    },
    [storeRemoveBomItem]
  );

  // Clear BOM
  const clearBom = useCallback(() => {
    storeClearBom();
  }, [storeClearBom]);

  // Get items by category
  const getItemsByCategory = useCallback(
    (category: BomItem["category"]): BomItem[] => {
      return bomItems.filter((item) => item.category === category);
    },
    [bomItems]
  );

  // Get items by entity ID
  const getItemsByEntityId = useCallback(
    (entityId: string): BomItem[] => {
      return bomItems.filter((item) => item.entityIds?.includes(entityId));
    },
    [bomItems]
  );

  // Get total by category
  const getTotalByCategory = useCallback(
    (category: BomItem["category"]): number => {
      return bomItems
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.totalPrice, 0);
    },
    [bomItems]
  );

  // Export BOM
  const exportBom = useCallback(
    async (format: "excel" | "pdf" | "json"): Promise<Blob> => {
      return storeExportBom(format);
    },
    [storeExportBom]
  );

  return {
    bomItems,
    bomSummary,
    lastCalculated: bomLastCalculated,
    isCalculating,
    calculateBom,
    addItem,
    updateItem,
    removeItem,
    clearBom,
    getItemsByCategory,
    getItemsByEntityId,
    getTotalByCategory,
    exportBom,
  };
}

export default useBomCalculator;
