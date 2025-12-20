/**
 * useDrawingCommands - Hook để quản lý interactive drawing commands
 *
 * ĐIỀU KIỆN 1: Canvas chỉ thu thập input, hook này thực thi Commands qua CadEngine
 *
 * Flow: UI (click) → useDrawingCommands → Command.execute() → CadEngine → Document → History
 */

"use client";

import { useCallback, useState, useRef } from "react";
import { useEngineStore } from "../store/engineStore";
import { ToolMode } from "../core/engine/EngineState";
import { IVec2 } from "../core/geometry/Vec2";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
} from "../core/commands/Command.types";
import { IEntity } from "../core/entities/Entity.types";

// Import Commands
import { LineCommand } from "../core/commands/draw/LINE";
import { RectCommand } from "../core/commands/draw/RECT";
import { CircleCommand } from "../core/commands/draw/CIRCLE";
import { ArcCommand } from "../core/commands/draw/ARC";
import { EllipseCommand } from "../core/commands/draw/ELLIPSE";
import { TextCommand } from "../core/commands/draw/TEXT";
import { PolygonCommand } from "../core/commands/draw/POLYGON";

// ==================== Types ====================

export interface DrawingState {
  isActive: boolean;
  command: IInteractiveCommand | null;
  points: IVec2[];
  prompt: string;
  previewEntity: IEntity | null;
}

export interface UseDrawingCommandsReturn {
  // State
  drawingState: DrawingState;

  // Actions
  startDrawing: (tool: ToolMode) => void;
  addPoint: (point: IVec2) => void;
  updatePreview: (currentPoint: IVec2) => void;
  finishDrawing: () => CommandResult;
  cancelDrawing: () => void;
  handleOption: (option: string) => void;

  // For TEXT command
  setTextContent: (text: string) => void;

  // Helpers
  canFinish: () => boolean;
  getPrompt: () => string;
  getOptions: () => { key: string; label: string }[];
}

// ==================== Command Factory ====================

function createCommandForTool(tool: ToolMode): IInteractiveCommand | null {
  switch (tool) {
    case ToolMode.DRAW_LINE:
      return new LineCommand();
    case ToolMode.DRAW_RECT:
      return new RectCommand();
    case ToolMode.DRAW_CIRCLE:
      return new CircleCommand();
    case ToolMode.DRAW_ARC:
      return new ArcCommand();
    case ToolMode.DRAW_ELLIPSE:
      return new EllipseCommand();
    case ToolMode.DRAW_TEXT:
      return new TextCommand();
    case ToolMode.DRAW_POLYGON:
      return new PolygonCommand();
    default:
      return null;
  }
}

// ==================== Hook Implementation ====================

export function useDrawingCommands(): UseDrawingCommandsReturn {
  // Store selectors
  const engine = useEngineStore((state) => state.engine);
  const currentStyle = useEngineStore((state) => state.currentStyle);

  // Local state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isActive: false,
    command: null,
    points: [],
    prompt: "Ready",
    previewEntity: null,
  });

  // Ref to keep track of current points (avoid stale closure)
  const pointsRef = useRef<IVec2[]>([]);
  const commandRef = useRef<IInteractiveCommand | null>(null);

  // Create command context
  const createContext = useCallback((): CommandContext | null => {
    if (!engine) return null;

    return {
      engine,
      points: [...pointsRef.current],
      options: {},
      style: currentStyle || {
        strokeColor: "#FFFFFF",
        strokeWidth: 1,
        strokeStyle: "solid",
        fillColor: null,
        opacity: 1,
      },
      layerId: "default",
    };
  }, [engine, currentStyle]);

  // Start drawing with a tool
  const startDrawing = useCallback((tool: ToolMode) => {
    const command = createCommandForTool(tool);
    if (!command) {
      console.warn(`No command for tool: ${tool}`);
      return;
    }

    commandRef.current = command;
    pointsRef.current = [];

    setDrawingState({
      isActive: true,
      command,
      points: [],
      prompt: command.getPrompt(0),
      previewEntity: null,
    });
  }, []);

  // Add a point to the drawing
  const addPoint = useCallback((point: IVec2) => {
    if (!commandRef.current) return;

    const newPoints = [...pointsRef.current, point];
    pointsRef.current = newPoints;

    const prompt = commandRef.current.getPrompt(newPoints.length);

    setDrawingState((prev) => ({
      ...prev,
      points: newPoints,
      prompt,
    }));
  }, []);

  // Update preview entity based on current mouse position
  const updatePreview = useCallback(
    (currentPoint: IVec2) => {
      const command = commandRef.current;
      if (!command) return;

      const context = createContext();
      if (!context) return;

      // Update context with current points
      context.points = [...pointsRef.current];

      const previewEntity = command.createPreview(context, currentPoint);

      setDrawingState((prev) => ({
        ...prev,
        previewEntity: previewEntity as IEntity | null,
      }));
    },
    [createContext]
  );

  // Finish drawing and execute command
  const finishDrawing = useCallback((): CommandResult => {
    const command = commandRef.current;
    if (!command) {
      return { success: false, message: "No active command" };
    }

    const context = createContext();
    if (!context) {
      return { success: false, message: "Engine not ready" };
    }

    // Execute the command
    const result = command.execute(context);

    if (result.success) {
      // Reset state
      commandRef.current = null;
      pointsRef.current = [];

      setDrawingState({
        isActive: false,
        command: null,
        points: [],
        prompt: "Ready",
        previewEntity: null,
      });
    }

    return result;
  }, [createContext]);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    commandRef.current = null;
    pointsRef.current = [];

    setDrawingState({
      isActive: false,
      command: null,
      points: [],
      prompt: "Ready",
      previewEntity: null,
    });
  }, []);

  // Handle command option
  const handleOption = useCallback(
    (option: string) => {
      const command = commandRef.current;
      if (!command || !command.handleOption) return;

      const context = createContext();
      if (!context) return;

      // Update context with current points ref for modification
      context.points = pointsRef.current;

      command.handleOption(option, context);

      // Points might have been modified by handleOption (e.g., Undo)
      const newPoints = [...context.points];
      pointsRef.current = newPoints;

      const prompt = command.getPrompt(newPoints.length);

      setDrawingState((prev) => ({
        ...prev,
        points: newPoints,
        prompt,
      }));
    },
    [createContext]
  );

  // Set text content for TEXT command
  const setTextContent = useCallback((text: string) => {
    const command = commandRef.current;
    if (command && command instanceof TextCommand) {
      command.setTextContent(text);
    }
  }, []);

  // Check if can finish drawing
  const canFinish = useCallback((): boolean => {
    const command = commandRef.current;
    if (!command) return false;
    return command.canComplete(pointsRef.current.length);
  }, []);

  // Get current prompt
  const getPrompt = useCallback((): string => {
    return drawingState.prompt;
  }, [drawingState.prompt]);

  // Get current options
  const getOptions = useCallback((): { key: string; label: string }[] => {
    const command = commandRef.current;
    if (!command) return [];
    return command.getOptions(pointsRef.current.length);
  }, []);

  return {
    drawingState,
    startDrawing,
    addPoint,
    updatePreview,
    finishDrawing,
    cancelDrawing,
    handleOption,
    setTextContent,
    canFinish,
    getPrompt,
    getOptions,
  };
}

export default useDrawingCommands;
