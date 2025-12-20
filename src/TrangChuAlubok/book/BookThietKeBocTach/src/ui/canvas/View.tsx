/**
 * View - Canvas display frame component
 * Manages the canvas element and provides rendering context
 * Can be extended to support SVG, Fabric.js, or WebGL backends
 */

"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";

export interface ViewProps {
  width?: number;
  height?: number;
  backgroundColor?: string;

  // Viewport state
  pan: { x: number; y: number };
  zoom: number;

  // Render callback - called each frame
  onRender?: (ctx: CanvasRenderingContext2D, viewport: ViewportInfo) => void;

  // Resize callback
  onResize?: (width: number, height: number) => void;

  // Canvas ref callback
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;

  // Children for overlays
  children?: React.ReactNode;
}

export interface ViewportInfo {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  pan: { x: number; y: number };
  zoom: number;
}

export const View: React.FC<ViewProps> = ({
  width,
  height,
  backgroundColor = "#1a1a2e",
  pan,
  zoom,
  onRender,
  onResize,
  onCanvasReady,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>(0);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const newWidth = width ?? container.clientWidth;
      const newHeight = height ?? container.clientHeight;

      if (newWidth !== dimensions.width || newHeight !== dimensions.height) {
        setDimensions({ width: newWidth, height: newHeight });
        onResize?.(newWidth, newHeight);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height, dimensions.width, dimensions.height, onResize]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    onCanvasReady?.(canvas);
  }, [dimensions.width, dimensions.height, onCanvasReady]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Create viewport info
    const viewport: ViewportInfo = {
      width: dimensions.width,
      height: dimensions.height,
      centerX: dimensions.width / 2 + pan.x,
      centerY: dimensions.height / 2 + pan.y,
      pan,
      zoom,
    };

    // Call render callback
    onRender?.(ctx, viewport);
  }, [
    backgroundColor,
    dimensions.width,
    dimensions.height,
    pan,
    zoom,
    onRender,
  ]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  return (
    <div
      ref={containerRef}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      {/* Overlay children */}
      {children}
    </div>
  );
};

export default View;
