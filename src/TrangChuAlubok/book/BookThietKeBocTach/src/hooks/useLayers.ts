/**
 * useLayers - Hook for managing CAD layers
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { LayerManager, Layer, DEFAULT_LAYERS } from "../core/layers";

export interface UseLayersReturn {
  layers: Layer[];
  currentLayerId: string;
  currentLayer: Layer | undefined;

  // Layer selection
  setCurrentLayer: (id: string) => boolean;

  // Layer CRUD
  createLayer: (name: string, options?: Partial<Layer>) => Layer;
  deleteLayer: (id: string) => boolean;
  renameLayer: (id: string, newName: string) => boolean;

  // Layer properties
  setLayerColor: (id: string, color: string) => boolean;
  setLayerLineWeight: (id: string, weight: number) => boolean;
  toggleLayerVisibility: (id: string) => boolean;
  toggleLayerLock: (id: string) => boolean;

  // Layer visibility
  getVisibleLayers: () => Layer[];
  isLayerEditable: (id: string) => boolean;

  // Layer order
  moveLayerUp: (id: string) => boolean;
  moveLayerDown: (id: string) => boolean;

  // Serialization
  exportLayers: () => string;
  importLayers: (json: string) => void;
}

export function useLayers(initialLayers?: Layer[]): UseLayersReturn {
  const [manager] = useState(
    () => new LayerManager(initialLayers || DEFAULT_LAYERS)
  );
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  // Layer selection
  const setCurrentLayer = useCallback(
    (id: string): boolean => {
      const result = manager.setCurrentLayer(id);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  // Layer CRUD
  const createLayer = useCallback(
    (name: string, options?: Partial<Layer>): Layer => {
      const layer = manager.createLayer(name, options);
      refresh();
      return layer;
    },
    [manager, refresh]
  );

  const deleteLayer = useCallback(
    (id: string): boolean => {
      const result = manager.deleteLayer(id);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  const renameLayer = useCallback(
    (id: string, newName: string): boolean => {
      const result = manager.renameLayer(id, newName);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  // Layer properties
  const setLayerColor = useCallback(
    (id: string, color: string): boolean => {
      const result = manager.setLayerColor(id, color);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  const setLayerLineWeight = useCallback(
    (id: string, weight: number): boolean => {
      const result = manager.setLayerLineWeight(id, weight);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  const toggleLayerVisibility = useCallback(
    (id: string): boolean => {
      const result = manager.toggleLayerVisibility(id);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  const toggleLayerLock = useCallback(
    (id: string): boolean => {
      const result = manager.toggleLayerLock(id);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  // Layer visibility
  const getVisibleLayers = useCallback((): Layer[] => {
    return manager.getVisibleLayers();
  }, [manager]);

  const isLayerEditable = useCallback(
    (id: string): boolean => {
      return manager.isLayerEditable(id);
    },
    [manager]
  );

  // Layer order
  const moveLayerUp = useCallback(
    (id: string): boolean => {
      const result = manager.moveLayerUp(id);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  const moveLayerDown = useCallback(
    (id: string): boolean => {
      const result = manager.moveLayerDown(id);
      if (result) refresh();
      return result;
    },
    [manager, refresh]
  );

  // Serialization
  const exportLayers = useCallback((): string => {
    return manager.toJSON();
  }, [manager]);

  const importLayers = useCallback(
    (json: string): void => {
      const state = JSON.parse(json);
      manager.loadState(state);
      refresh();
    },
    [manager, refresh]
  );

  // Memoized values
  const layers = useMemo(() => manager.getAllLayers(), [manager]);
  const currentLayerId = manager.getCurrentLayerId();
  const currentLayer = manager.getCurrentLayer();

  return {
    layers,
    currentLayerId,
    currentLayer,
    setCurrentLayer,
    createLayer,
    deleteLayer,
    renameLayer,
    setLayerColor,
    setLayerLineWeight,
    toggleLayerVisibility,
    toggleLayerLock,
    getVisibleLayers,
    isLayerEditable,
    moveLayerUp,
    moveLayerDown,
    exportLayers,
    importLayers,
  };
}

export default useLayers;
