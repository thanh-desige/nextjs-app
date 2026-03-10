/**
 * useTextHandlers.ts - Text-specific handlers for useCommandDrawing
 * STEP-5.7: Extracted from useCommandDrawing.ts
 *
 * Handles: handleTextOption, handleTextInput, isWaitingForTextInput
 */

"use client";

import { useCallback } from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import { TextCommand } from "../../../core/commands/draw/TEXT";
import { TextEntity } from "../../../core/entities/Text";
import type { CadEntity } from "../types/CadEntity";
import type { CommandDrawingInternals } from "./commandDrawing.types";
import { restartDrawingCommand } from "./commandDrawingHelpers";

export interface TextHandlers {
  handleTextOption: (option: string) => boolean;
  handleTextInput: (text: string) => boolean;
  isWaitingForTextInput: () => boolean;
}

export function useTextHandlers(
  internals: CommandDrawingInternals
): TextHandlers {
  const {
    commandRef,
    pointsRef,
    onPromptChangeRef,
    onEntityAddedRef,
    activeTool,
    engine,
    currentLayerId,
    effectiveLayerId,
    getSnapshotStyle,
    setPrompt,
    points,
  } = internals;

  // Handle text option: H (Height), J (Justify), S (Style), R (Rotation), SC (Scale), B (Bold), I (Italic)
  const handleTextOption = useCallback(
    (option: string): boolean => {
      if (activeTool !== ToolMode.DRAW_TEXT) {
        return false;
      }

      const cmd = commandRef.current;
      if (
        !cmd ||
        !("handleOption" in cmd) ||
        typeof cmd.handleOption !== "function"
      ) {
        return false;
      }
      const command = cmd as TextCommand;

      const opt = option.toUpperCase();

      const styleSnapshot = getSnapshotStyle();
      const context = {
        points: pointsRef.current,
        style: styleSnapshot,
        layerId: effectiveLayerId,
        engine: engine!,
        options: {} as Record<string, unknown>,
      };

      command.handleOption(opt, context);

      const newPrompt = command.getPrompt(pointsRef.current.length);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);

      return true;
    },
    [
      activeTool,
      commandRef,
      pointsRef,
      onPromptChangeRef,
      engine,
      effectiveLayerId,
      getSnapshotStyle,
      setPrompt,
    ]
  );

  // Check if waiting for text input (TEXT command clicked position, need text content)
  // Uses points state (not ref) to trigger re-render when points change
  const isWaitingForTextInput = useCallback((): boolean => {
    return activeTool === ToolMode.DRAW_TEXT && points.length === 1;
  }, [activeTool, points.length]);

  // Handle text input - create TEXT entity with content
  const handleTextInput = useCallback(
    (text: string): boolean => {
      if (activeTool !== ToolMode.DRAW_TEXT) {
        return false;
      }

      if (pointsRef.current.length < 1) {
        onPromptChangeRef.current?.("Click a position first");
        return false;
      }

      if (!text.trim()) {
        onPromptChangeRef.current?.("Text cannot be empty");
        return false;
      }

      if (engine) {
        const position = pointsRef.current[0];

        // Get text options from TextCommand if available
        const cmd = commandRef.current as TextCommand | null;
        let textOptions = {
          fontSize: 14,
          fontFamily: "Arial",
          textAlign: "left" as "left" | "center" | "right",
          fontWeight: "normal" as "normal" | "bold",
          fontStyle: "normal" as "normal" | "italic",
          textBaseline: "middle" as "top" | "middle" | "bottom",
        };
        let scale = 1;

        if (
          cmd &&
          "getTextOptions" in cmd &&
          typeof cmd.getTextOptions === "function"
        ) {
          const opts = cmd.getTextOptions();
          textOptions = {
            fontSize: opts.fontSize || 14,
            fontFamily: opts.fontFamily || "Arial",
            textAlign: opts.textAlign || "left",
            fontWeight: opts.fontWeight || "normal",
            fontStyle: opts.fontStyle || "normal",
            textBaseline: opts.textBaseline || "middle",
          };
          scale = opts.scale || 1;
        }

        // Apply scale to fontSize
        const scaledFontSize = textOptions.fontSize * scale;
        const styleSnapshot = getSnapshotStyle();

        const textEntity = TextEntity.create(position, text, styleSnapshot, {
          fontSize: scaledFontSize,
          fontFamily: textOptions.fontFamily,
          fontWeight: textOptions.fontWeight,
          fontStyle: textOptions.fontStyle,
          textAlign: textOptions.textAlign,
          textBaseline: textOptions.textBaseline,
        });
        textEntity.layerId = currentLayerId;

        // ĐIỀU KIỆN 1: Thêm entity qua engine
        engine.addEntity(textEntity);

        // Notify CadDrawingCanvas - IMPORTANT: Include text content!
        const cadEntity: CadEntity = {
          id: textEntity.id,
          type: "text",
          points: [{ x: position.x, y: position.y }],
          color: textEntity.style?.strokeColor || "#FFFFFF",
          lineWidth: 1,
          layer: effectiveLayerId,
          text: text, // CRITICAL: Must include text content!
          fontSize: scaledFontSize,
          fontFamily: textOptions.fontFamily,
          strokeStyle:
            (styleSnapshot.strokeStyle as
              | "solid"
              | "dashed"
              | "dotted"
              | "dashdot") || "solid",
        };
        onEntityAddedRef.current?.(cadEntity);

        onPromptChangeRef.current?.(
          `Created text: "${text}" (size: ${scaledFontSize}px)`
        );
      }

      // Restart command
      restartDrawingCommand(internals);

      return true;
    },
    [
      activeTool,
      commandRef,
      pointsRef,
      onPromptChangeRef,
      onEntityAddedRef,
      engine,
      currentLayerId,
      effectiveLayerId,
      getSnapshotStyle,
      internals,
    ]
  );

  return {
    handleTextOption,
    handleTextInput,
    isWaitingForTextInput,
  };
}
