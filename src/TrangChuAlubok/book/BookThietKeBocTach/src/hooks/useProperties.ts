/**
 * useProperties - Hook for managing entity properties
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi entity phải đi qua Commands → History
 * ĐIỀU KIỆN 2: PropertySchema là "luật tối cao" cho mọi property operations
 * - Tất cả property changes phải được validate bởi PropertySchema
 * - Sử dụng PropertyApplier để validate
 * - Sử dụng EntityCommands để apply với Undo/Redo support
 */

"use client";

import { useCallback, useMemo } from "react";
import { useEngineStore } from "../store/engineStore";
import {
  IEntity,
  EntityStyle,
  EntityType,
} from "../core/entities/Entity.types";
import {
  propertySchema,
  ValidationResult,
  PropertyDefinition as SchemaPropertyDefinition,
} from "../core/properties/PropertySchema";
import {
  PropertyApplier,
  ApplyResult,
} from "../core/properties/PropertyApplier";
import {
  UpdateEntityPropertyCommand,
  UpdateEntityStyleCommand,
  UpdateEntityPropertiesCommand,
  BatchUpdateEntitiesCommand,
} from "../core/commands/entity/EntityCommands";

// ==================== Types ====================

export type PropertyValue = string | number | boolean | null;

export interface PropertyDefinition {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "color" | "select" | "readonly";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface PropertyGroup {
  name: string;
  properties: PropertyDefinition[];
}

export interface UsePropertiesReturn {
  // Selected entities
  selectedEntities: IEntity[];
  hasSelection: boolean;
  isSingleSelection: boolean;
  isMultiSelection: boolean;

  // Common properties (for multi-selection)
  commonProperties: Record<string, PropertyValue>;
  mixedProperties: Set<string>;

  // Property schema for current selection
  propertyGroups: PropertyGroup[];

  // Actions with validation (ĐIỀU KIỆN 2)
  setProperty: (
    key: string,
    value: PropertyValue
  ) => ApplyResult | ApplyResult[];
  setStyle: (style: Partial<EntityStyle>) => ApplyResult | ApplyResult[];
  setMultipleProperties: (
    properties: Record<string, PropertyValue>
  ) => ApplyResult | ApplyResult[];

  // Validation (ĐIỀU KIỆN 2)
  validateProperty: (
    entityType: EntityType,
    key: string,
    value: PropertyValue
  ) => ValidationResult;
  getPropertySchema: (entityType: EntityType) => PropertyDefinition[];

  // Queries
  getProperty: (key: string) => PropertyValue | undefined;
  isMixed: (key: string) => boolean;
}

// ==================== Property Schema ====================

const geometryProperties: PropertyDefinition[] = [
  { key: "x", label: "X", type: "number", step: 1 },
  { key: "y", label: "Y", type: "number", step: 1 },
  { key: "width", label: "Width", type: "number", min: 0, step: 1 },
  { key: "height", label: "Height", type: "number", min: 0, step: 1 },
  {
    key: "rotation",
    label: "Rotation",
    type: "number",
    min: 0,
    max: 360,
    step: 1,
  },
];

const styleProperties: PropertyDefinition[] = [
  { key: "strokeColor", label: "Stroke Color", type: "color" },
  {
    key: "strokeWidth",
    label: "Stroke Width",
    type: "number",
    min: 0.5,
    max: 10,
    step: 0.5,
  },
  {
    key: "strokeStyle",
    label: "Stroke Style",
    type: "select",
    options: [
      { value: "solid", label: "Solid" },
      { value: "dashed", label: "Dashed" },
      { value: "dotted", label: "Dotted" },
    ],
  },
  { key: "fillColor", label: "Fill Color", type: "color" },
  {
    key: "opacity",
    label: "Opacity",
    type: "number",
    min: 0,
    max: 1,
    step: 0.1,
  },
];

const generalProperties: PropertyDefinition[] = [
  { key: "id", label: "ID", type: "readonly" },
  { key: "type", label: "Type", type: "readonly" },
  { key: "name", label: "Name", type: "string" },
  { key: "layerId", label: "Layer", type: "string" },
];

// ==================== Hook Implementation ====================

export function useProperties(): UsePropertiesReturn {
  // Store selectors
  const selectedIds = useEngineStore((state) => state.selectedIds);
  const getEntity = useEngineStore((state) => state.getEntity);
  // ĐIỀU KIỆN 1: Use executeCommandObject for Undo/Redo support
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject
  );

  // Get selected entities
  const selectedEntities = useMemo(() => {
    return selectedIds
      .map((id) => getEntity(id))
      .filter((e): e is IEntity => e !== undefined);
  }, [selectedIds, getEntity]);

  const hasSelection = selectedEntities.length > 0;
  const isSingleSelection = selectedEntities.length === 1;
  const isMultiSelection = selectedEntities.length > 1;

  // Calculate common and mixed properties
  const { commonProperties, mixedProperties } = useMemo(() => {
    if (selectedEntities.length === 0) {
      return { commonProperties: {}, mixedProperties: new Set<string>() };
    }

    if (selectedEntities.length === 1) {
      const entity = selectedEntities[0];
      const props: Record<string, PropertyValue> = {
        id: entity.id,
        type: entity.type,
        name: entity.name ?? "",
        layerId: entity.layerId,
        strokeColor: entity.style.strokeColor,
        strokeWidth: entity.style.strokeWidth,
        strokeStyle: entity.style.strokeStyle,
        fillColor: entity.style.fillColor,
        opacity: entity.style.opacity,
      };
      return { commonProperties: props, mixedProperties: new Set<string>() };
    }

    // For multiple selection, find common values
    const common: Record<string, PropertyValue> = {};
    const mixed = new Set<string>();

    const propsToCheck = [
      "type",
      "layerId",
      "strokeColor",
      "strokeWidth",
      "strokeStyle",
      "fillColor",
      "opacity",
    ];

    for (const prop of propsToCheck) {
      const values = selectedEntities.map((e) => {
        if (prop in e)
          return (e as unknown as Record<string, unknown>)[
            prop
          ] as PropertyValue;
        if (prop in e.style)
          return (e.style as unknown as Record<string, unknown>)[
            prop
          ] as PropertyValue;
        return undefined;
      });

      const uniqueValues = [...new Set(values.filter((v) => v !== undefined))];
      if (uniqueValues.length === 1) {
        common[prop] = uniqueValues[0];
      } else if (uniqueValues.length > 1) {
        mixed.add(prop);
      }
    }

    return { commonProperties: common, mixedProperties: mixed };
  }, [selectedEntities]);

  // Property groups
  const propertyGroups = useMemo((): PropertyGroup[] => {
    if (!hasSelection) return [];

    return [
      { name: "General", properties: generalProperties },
      { name: "Geometry", properties: geometryProperties },
      { name: "Style", properties: styleProperties },
    ];
  }, [hasSelection]);

  // Set single property with validation (ĐIỀU KIỆN 1 + 2)
  const setProperty = useCallback(
    (key: string, value: PropertyValue): ApplyResult | ApplyResult[] => {
      const results: ApplyResult[] = [];

      for (const entity of selectedEntities) {
        // ĐIỀU KIỆN 2: Use PropertyApplier for validation
        const validationResult = PropertyApplier.applyProperty(
          entity,
          key,
          value
        );
        results.push(validationResult);

        if (validationResult.success) {
          // ĐIỀU KIỆN 1: Use Command for Undo/Redo support
          if (key in entity.style) {
            // Style property - use UpdateEntityStyleCommand
            const command = new UpdateEntityStyleCommand(entity.id, {
              [key]: value,
            } as Partial<EntityStyle>);
            executeCommandObject(command);
          } else {
            // Regular property - use UpdateEntityPropertyCommand
            const command = new UpdateEntityPropertyCommand(
              entity.id,
              key,
              value
            );
            executeCommandObject(command);
          }
        }
      }

      return results.length === 1 ? results[0] : results;
    },
    [selectedEntities, executeCommandObject]
  );

  // Set style with validation (ĐIỀU KIỆN 1 + 2)
  const setStyle = useCallback(
    (style: Partial<EntityStyle>): ApplyResult | ApplyResult[] => {
      const results: ApplyResult[] = [];

      for (const entity of selectedEntities) {
        // ĐIỀU KIỆN 2: Validate with PropertyApplier
        const validationResult = PropertyApplier.applyStyle(entity, style);
        results.push(validationResult);

        if (validationResult.success) {
          // ĐIỀU KIỆN 1: Use Command for Undo/Redo support
          const command = new UpdateEntityStyleCommand(entity.id, style);
          executeCommandObject(command);
        }
      }

      return results.length === 1 ? results[0] : results;
    },
    [selectedEntities, executeCommandObject]
  );

  // Set multiple properties with validation (ĐIỀU KIỆN 1 + 2)
  const setMultipleProperties = useCallback(
    (
      properties: Record<string, PropertyValue>
    ): ApplyResult | ApplyResult[] => {
      const results: ApplyResult[] = [];

      // For multi-selection with same properties, use BatchUpdateCommand
      if (selectedEntities.length > 1) {
        // Validate all entities first
        let allValid = true;
        for (const entity of selectedEntities) {
          const validationResult = PropertyApplier.applyProperties(
            entity,
            properties
          );
          results.push(validationResult);
          if (!validationResult.success) {
            allValid = false;
          }
        }

        if (allValid) {
          // ĐIỀU KIỆN 1: Use BatchUpdateCommand for single undo entry
          const entityIds = selectedEntities.map((e) => e.id);
          const command = new BatchUpdateEntitiesCommand(entityIds, properties);
          executeCommandObject(command);
        }

        return results;
      }

      // Single entity
      for (const entity of selectedEntities) {
        // ĐIỀU KIỆN 2: Validate with PropertyApplier
        const validationResult = PropertyApplier.applyProperties(
          entity,
          properties
        );
        results.push(validationResult);

        if (validationResult.success) {
          // ĐIỀU KIỆN 1: Use Command for Undo/Redo support
          const command = new UpdateEntityPropertiesCommand(
            entity.id,
            properties
          );
          executeCommandObject(command);
        }
      }

      return results.length === 1 ? results[0] : results;
    },
    [selectedEntities, executeCommandObject]
  );

  // Get property value
  const getProperty = useCallback(
    (key: string): PropertyValue | undefined => {
      if (mixedProperties.has(key)) return undefined;
      return commonProperties[key];
    },
    [commonProperties, mixedProperties]
  );

  // Check if property is mixed
  const isMixed = useCallback(
    (key: string): boolean => {
      return mixedProperties.has(key);
    },
    [mixedProperties]
  );

  // Validate property before applying (ĐIỀU KIỆN 2)
  const validateProperty = useCallback(
    (
      entityType: EntityType,
      key: string,
      value: PropertyValue
    ): ValidationResult => {
      return propertySchema.validateProperty(entityType, key, value);
    },
    []
  );

  // Get property schema for entity type (ĐIỀU KIỆN 2)
  const getPropertySchema = useCallback(
    (entityType: EntityType): PropertyDefinition[] => {
      const schema = propertySchema.getSchema(entityType);
      if (!schema) return [];

      // Map from SchemaPropertyDefinition to local PropertyDefinition
      return schema.properties.map((prop: SchemaPropertyDefinition) => ({
        key: prop.key,
        label: prop.label,
        type: prop.type as PropertyDefinition["type"],
        options: prop.options?.map((opt) => ({
          value: String(opt.value),
          label: opt.label,
        })),
        min: prop.min,
        max: prop.max,
        step: prop.step,
      }));
    },
    []
  );

  return {
    selectedEntities,
    hasSelection,
    isSingleSelection,
    isMultiSelection,
    commonProperties,
    mixedProperties,
    propertyGroups,
    setProperty,
    setStyle,
    setMultipleProperties,
    validateProperty,
    getPropertySchema,
    getProperty,
    isMixed,
  };
}

export default useProperties;
