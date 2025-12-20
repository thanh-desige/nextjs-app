/**
 * CadCanvas - Main CAD Canvas Component
 * React component wrapping Fabric.js canvas for CAD rendering
 */

"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FabricAdapter } from "../../adapters/canvas/FabricAdapter";
import { Vec2 } from "../../core/geometry/Vec2";
import type { IEntity } from "../../core/entities/Entity.types";
import type { ViewportState } from "../../core/engine/EngineState";
import type {
  CanvasPointerEvent,
  CanvasWheelEvent,
} from "../../adapters/canvas/CanvasAdapter";

// ==================== Types ====================

export interface CadCanvasProps {
  /** Width of canvas (default: 100%) */
  width?: number | string;
  /** Height of canvas (default: 100%) */
  height?: number | string;
  /** Background color */
  backgroundColor?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Grid spacing in world units */
  gridSpacing?: number;
  /** Grid major line every N lines */
  gridMajorEvery?: number;
  /** Initial viewport state */
  initialViewport?: Partial<ViewportState>;
  /** Entities to render */
  entities?: IEntity[];
  /** Selected entity IDs */
  selectedIds?: string[];
  /** Snap enabled */
  snapEnabled?: boolean;
  /** Snap tolerance in pixels */
  snapTolerance?: number;

  // Event handlers
  onPointerDown?: (event: CanvasPointerEvent) => void;
  onPointerMove?: (event: CanvasPointerEvent) => void;
  onPointerUp?: (event: CanvasPointerEvent) => void;
  onWheel?: (event: CanvasWheelEvent) => void;
  onViewportChange?: (viewport: ViewportState) => void;
  onEntityClick?: (entityId: string, event: CanvasPointerEvent) => void;
  onEntityDoubleClick?: (entityId: string, event: CanvasPointerEvent) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onCanvasReady?: (adapter: FabricAdapter) => void;
}

export interface CadCanvasRef {
  /** Get the canvas adapter */
  getAdapter(): FabricAdapter | null;
  /** Zoom to fit all entities */
  zoomToFit(padding?: number): void;
  /** Set zoom level */
  setZoom(zoom: number, center?: Vec2): void;
  /** Pan by delta */
  pan(delta: Vec2): void;
  /** Reset viewport */
  resetViewport(): void;
  /** Export as image */
  toDataURL(format?: "png" | "jpeg" | "webp", quality?: number): string;
  /** Export as SVG */
  toSVG(): string;
  /** Render entities */
  renderEntities(entities: IEntity[]): void;
  /** Clear all entities */
  clearEntities(): void;
  /** Highlight entity */
  highlightEntity(entityId: string, color?: string): void;
  /** Show crosshair at position */
  showCrosshair(position: Vec2): void;
  /** Hide crosshair */
  hideCrosshair(): void;
}

// ==================== Component ====================

export const CadCanvas = forwardRef<CadCanvasRef, CadCanvasProps>(
  function CadCanvas(
    {
      width = "100%",
      height = "100%",
      backgroundColor = "#1E1E1E",
      showGrid = true,
      gridSpacing = 10,
      gridMajorEvery = 10,
      initialViewport,
      entities = [],
      selectedIds = [],
      snapEnabled = true,
      snapTolerance = 10,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onWheel,
      onViewportChange,
      onEntityClick,
      onEntityDoubleClick,
      onSelectionChange,
      onCanvasReady,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const adapterRef = useRef<FabricAdapter | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Suppress unused variable warnings
    void snapEnabled;
    void snapTolerance;
    void onEntityClick;
    void onEntityDoubleClick;
    void onSelectionChange;

    // Initialize adapter
    useEffect(() => {
      if (!containerRef.current) return;

      const adapter = new FabricAdapter();
      adapter.initialize(containerRef.current);
      adapterRef.current = adapter;

      // Set initial viewport
      if (initialViewport) {
        const currentViewport = adapter.getViewport();
        adapter.setViewport({
          ...currentViewport,
          ...initialViewport,
        });
      }

      // Setup event handlers
      if (onPointerDown) {
        adapter.onPointerDown(onPointerDown);
      }
      if (onPointerMove) {
        adapter.onPointerMove(onPointerMove);
      }
      if (onPointerUp) {
        adapter.onPointerUp(onPointerUp);
      }
      if (onWheel) {
        adapter.onWheel(onWheel);
      }

      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setIsReady(true);
        onCanvasReady?.(adapter);
      });

      // Cleanup
      return () => {
        adapter.dispose();
        adapterRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle grid visibility
    useEffect(() => {
      if (!adapterRef.current || !isReady) return;

      if (showGrid) {
        adapterRef.current.showGrid(gridSpacing, gridMajorEvery);
      } else {
        adapterRef.current.hideGrid();
      }
    }, [showGrid, gridSpacing, gridMajorEvery, isReady]);

    // Handle entities rendering
    useEffect(() => {
      if (!adapterRef.current || !isReady) return;

      adapterRef.current.clearEntities();

      // Cast entities to the expected type
      const castEntities = entities as unknown as Parameters<
        FabricAdapter["renderEntities"]
      >[0];
      adapterRef.current.renderEntities(castEntities);

      // Highlight selected entities
      selectedIds.forEach((id) => {
        adapterRef.current?.highlightEntity(id, "#00ff00");
      });
    }, [entities, selectedIds, isReady]);

    // Handle resize
    useEffect(() => {
      if (!containerRef.current || !adapterRef.current || !isReady) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          adapterRef.current?.resize(w, h);
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [isReady]);

    // Viewport change callback
    const handleViewportChange = useCallback(() => {
      if (adapterRef.current && onViewportChange) {
        onViewportChange(adapterRef.current.getViewport());
      }
    }, [onViewportChange]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getAdapter() {
          return adapterRef.current;
        },

        zoomToFit(padding = 50) {
          adapterRef.current?.zoomToFit(padding);
          handleViewportChange();
        },

        setZoom(zoom: number, center?: Vec2) {
          if (!adapterRef.current) return;
          const currentZoom = adapterRef.current.getViewport().zoom;
          const factor = zoom / currentZoom;
          adapterRef.current.zoom(factor, center);
          handleViewportChange();
        },

        pan(delta: Vec2) {
          adapterRef.current?.pan(delta);
          handleViewportChange();
        },

        resetViewport() {
          adapterRef.current?.setViewport({
            center: new Vec2(0, 0),
            zoom: 1,
            rotation: 0,
            width: containerRef.current?.clientWidth ?? 800,
            height: containerRef.current?.clientHeight ?? 600,
          });
          handleViewportChange();
        },

        toDataURL(format = "png", quality = 1) {
          return adapterRef.current?.toDataURL(format, quality) ?? "";
        },

        toSVG() {
          return adapterRef.current?.toSVG() ?? "";
        },

        renderEntities(entities: IEntity[]) {
          if (!adapterRef.current) return;
          adapterRef.current.clearEntities();
          const castEntities = entities as unknown as Parameters<
            FabricAdapter["renderEntities"]
          >[0];
          adapterRef.current.renderEntities(castEntities);
        },

        clearEntities() {
          adapterRef.current?.clearEntities();
        },

        highlightEntity(entityId: string, color = "#00ff00") {
          adapterRef.current?.highlightEntity(entityId, color);
        },

        showCrosshair(position: Vec2) {
          adapterRef.current?.showCrosshair(position);
        },

        hideCrosshair() {
          adapterRef.current?.hideCrosshair();
        },
      }),
      [handleViewportChange]
    );

    return (
      <div
        ref={containerRef}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          backgroundColor,
          overflow: "hidden",
          position: "relative",
        }}
        data-testid="cad-canvas"
      />
    );
  }
);

export default CadCanvas;
