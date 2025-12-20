/**
 * useDoorTemplates - Hook for door template management
 */

"use client";

import { useCallback, useMemo, useState } from "react";
// import { useProjectStore } from '../store/projectStore';
import { useEngineStore } from "../store/engineStore";
import { EntityType } from "../core/entities/Entity.types";

// ==================== Types ====================

export interface DoorDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface DoorTemplate {
  id: string;
  name: string;
  type: "single" | "double" | "sliding" | "folding" | "pivot";
  description: string;
  thumbnail?: string;
  dimensions: DoorDimensions;
  glassType: "clear" | "tinted" | "frosted" | "tempered" | "laminated";
  frameType: "standard" | "slim" | "heavy-duty";
  openingDirection: "left" | "right" | "both";
  hasHandle: boolean;
  hasLock: boolean;
  metadata: Record<string, unknown>;
}

export interface UseDoorTemplatesReturn {
  // Templates
  templates: DoorTemplate[];
  selectedTemplate: DoorTemplate | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Selection
  selectTemplate: (id: string) => void;
  clearSelection: () => void;

  // CRUD
  addTemplate: (template: Omit<DoorTemplate, "id">) => string;
  updateTemplate: (id: string, updates: Partial<DoorTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => string;

  // Queries
  getTemplateById: (id: string) => DoorTemplate | undefined;
  getTemplatesByType: (type: DoorTemplate["type"]) => DoorTemplate[];
  searchTemplates: (query: string) => DoorTemplate[];

  // Actions
  insertTemplate: (
    templateId: string,
    position: { x: number; y: number }
  ) => void;
  exportTemplate: (id: string) => Promise<Blob>;
  importTemplates: (file: File) => Promise<void>;
  loadDefaultTemplates: () => Promise<void>;
}

// ==================== Default Templates ====================

const DEFAULT_DOOR_TEMPLATES: Omit<DoorTemplate, "id">[] = [
  {
    name: "Cửa đơn tiêu chuẩn",
    type: "single",
    description: "Cửa đơn nhôm kính tiêu chuẩn",
    dimensions: { width: 900, height: 2100, depth: 100 },
    glassType: "tempered",
    frameType: "standard",
    openingDirection: "left",
    hasHandle: true,
    hasLock: true,
    metadata: {},
  },
  {
    name: "Cửa đôi",
    type: "double",
    description: "Cửa đôi nhôm kính",
    dimensions: { width: 1800, height: 2100, depth: 100 },
    glassType: "tempered",
    frameType: "standard",
    openingDirection: "both",
    hasHandle: true,
    hasLock: true,
    metadata: {},
  },
  {
    name: "Cửa lùa",
    type: "sliding",
    description: "Cửa lùa nhôm kính 2 cánh",
    dimensions: { width: 2000, height: 2100, depth: 100 },
    glassType: "tempered",
    frameType: "slim",
    openingDirection: "right",
    hasHandle: true,
    hasLock: true,
    metadata: { panels: 2 },
  },
  {
    name: "Cửa gập",
    type: "folding",
    description: "Cửa gập nhôm kính 4 cánh",
    dimensions: { width: 3000, height: 2100, depth: 100 },
    glassType: "tempered",
    frameType: "slim",
    openingDirection: "left",
    hasHandle: true,
    hasLock: true,
    metadata: { panels: 4 },
  },
  {
    name: "Cửa bản lề sàn",
    type: "pivot",
    description: "Cửa bản lề sàn cao cấp",
    dimensions: { width: 1000, height: 2400, depth: 120 },
    glassType: "laminated",
    frameType: "heavy-duty",
    openingDirection: "left",
    hasHandle: true,
    hasLock: true,
    metadata: { pivotType: "floor" },
  },
];

// ==================== Hook Implementation ====================

export function useDoorTemplates(): UseDoorTemplatesReturn {
  // Local state
  const [templates, setTemplates] = useState<DoorTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store actions
  const addEntity = useEngineStore((state) => state.addEntity);

  // Selected template
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Generate unique ID
  const generateId = useCallback((): string => {
    return `door-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Select template
  const selectTemplate = useCallback((id: string) => {
    setSelectedTemplateId(id);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedTemplateId(null);
  }, []);

  // Add template
  const addTemplate = useCallback(
    (template: Omit<DoorTemplate, "id">): string => {
      const id = generateId();
      const newTemplate: DoorTemplate = { ...template, id };
      setTemplates((prev) => [...prev, newTemplate]);
      return id;
    },
    [generateId]
  );

  // Update template
  const updateTemplate = useCallback(
    (id: string, updates: Partial<DoorTemplate>) => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    []
  );

  // Delete template
  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplateId === id) {
        setSelectedTemplateId(null);
      }
    },
    [selectedTemplateId]
  );

  // Duplicate template
  const duplicateTemplate = useCallback(
    (id: string): string => {
      const template = templates.find((t) => t.id === id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      const newId = generateId();
      const duplicated: DoorTemplate = {
        ...template,
        id: newId,
        name: `${template.name} (copy)`,
      };
      setTemplates((prev) => [...prev, duplicated]);
      return newId;
    },
    [templates, generateId]
  );

  // Get template by ID
  const getTemplateById = useCallback(
    (id: string): DoorTemplate | undefined => {
      return templates.find((t) => t.id === id);
    },
    [templates]
  );

  // Get templates by type
  const getTemplatesByType = useCallback(
    (type: DoorTemplate["type"]): DoorTemplate[] => {
      return templates.filter((t) => t.type === type);
    },
    [templates]
  );

  // Search templates
  const searchTemplates = useCallback(
    (query: string): DoorTemplate[] => {
      const lowerQuery = query.toLowerCase();
      return templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.type.toLowerCase().includes(lowerQuery)
      );
    },
    [templates]
  );

  // Insert template into canvas
  const insertTemplate = useCallback(
    (templateId: string, position: { x: number; y: number }) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        setError(`Template not found: ${templateId}`);
        return;
      }

      // Create a rectangle entity representing the door
      // Note: The engine's addEntity will handle creating the proper RectEntity
      // We pass the basic properties needed
      addEntity({
        type: EntityType.RECT,
        style: {
          strokeColor: "#FFFFFF",
          strokeWidth: 2,
          strokeStyle: "solid",
          fillColor:
            template.glassType === "tinted" ? "#4A90D988" : "#87CEEB44",
          opacity: 1,
        },
        state: {
          visible: true,
          locked: false,
          selected: false,
          hovered: false,
        },
        layerId: "doors",
        metadata: {
          doorTemplate: template,
          doorType: template.type,
          doorName: template.name,
          origin: position,
          width: template.dimensions.width,
          height: template.dimensions.height,
        },
      } as Parameters<typeof addEntity>[0]);

      // Materials update would be done via project store if needed
    },
    [templates, addEntity]
  );

  // Export template
  const exportTemplate = useCallback(
    async (id: string): Promise<Blob> => {
      const template = templates.find((t) => t.id === id);
      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      const json = JSON.stringify(template, null, 2);
      return new Blob([json], { type: "application/json" });
    },
    [templates]
  );

  // Import templates
  const importTemplates = useCallback(
    async (file: File): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const imported: DoorTemplate[] = Array.isArray(data) ? data : [data];

        // Assign new IDs to imported templates
        const withNewIds = imported.map((t) => ({
          ...t,
          id: generateId(),
        }));

        setTemplates((prev) => [...prev, ...withNewIds]);
      } catch (err) {
        setError(`Failed to import templates: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [generateId]
  );

  // Load default templates
  const loadDefaultTemplates = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const defaultWithIds = DEFAULT_DOOR_TEMPLATES.map((t) => ({
        ...t,
        id: generateId(),
      }));

      setTemplates((prev) => {
        // Avoid duplicates
        const existingNames = new Set(prev.map((t) => t.name));
        const newTemplates = defaultWithIds.filter(
          (t) => !existingNames.has(t.name)
        );
        return [...prev, ...newTemplates];
      });
    } catch (err) {
      setError(`Failed to load default templates: ${err}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [generateId]);

  return {
    templates,
    selectedTemplate,
    isLoading,
    error,
    selectTemplate,
    clearSelection,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getTemplateById,
    getTemplatesByType,
    searchTemplates,
    insertTemplate,
    exportTemplate,
    importTemplates,
    loadDefaultTemplates,
  };
}

export default useDoorTemplates;
