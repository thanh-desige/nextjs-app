/**
 * Engine Events - Event system cho CAD Engine
 */

import { IVec2 } from "../geometry/Vec2";
import { IEntity } from "../entities/Entity.types";
import { ToolMode } from "./EngineState";

// ==================== Event Types ====================

export enum EngineEventType {
  // Document events
  DOCUMENT_NEW = "document:new",
  DOCUMENT_OPEN = "document:open",
  DOCUMENT_SAVE = "document:save",
  DOCUMENT_MODIFIED = "document:modified",

  // Entity events
  ENTITY_ADDED = "entity:added",
  ENTITY_REMOVED = "entity:removed",
  ENTITY_MODIFIED = "entity:modified",
  ENTITIES_CLEARED = "entities:cleared",

  // Selection events
  SELECTION_CHANGED = "selection:changed",
  SELECTION_CLEARED = "selection:cleared",
  HOVER_CHANGED = "hover:changed",

  // Tool/Mode events
  TOOL_CHANGED = "tool:changed",
  DRAWING_START = "drawing:start",
  DRAWING_UPDATE = "drawing:update",
  DRAWING_COMPLETE = "drawing:complete",
  DRAWING_CANCEL = "drawing:cancel",

  // Viewport events
  VIEWPORT_CHANGED = "viewport:changed",
  VIEWPORT_ZOOM = "viewport:zoom",
  VIEWPORT_PAN = "viewport:pan",

  // Input events
  MOUSE_MOVE = "mouse:move",
  MOUSE_DOWN = "mouse:down",
  MOUSE_UP = "mouse:up",
  MOUSE_CLICK = "mouse:click",
  MOUSE_DOUBLE_CLICK = "mouse:doubleClick",
  MOUSE_WHEEL = "mouse:wheel",
  KEY_DOWN = "key:down",
  KEY_UP = "key:up",

  // Snap events
  SNAP_POINT = "snap:point",
  SNAP_CHANGED = "snap:changed",

  // Command events
  COMMAND_EXECUTE = "command:execute",
  COMMAND_UNDO = "command:undo",
  COMMAND_REDO = "command:redo",

  // Layer events
  LAYER_ADDED = "layer:added",
  LAYER_REMOVED = "layer:removed",
  LAYER_MODIFIED = "layer:modified",
  LAYER_ACTIVE_CHANGED = "layer:activeChanged",

  // Render events
  RENDER_REQUEST = "render:request",
  RENDER_COMPLETE = "render:complete",

  // Error events
  ERROR = "error",
}

// ==================== Event Payloads ====================

export interface EntityEventPayload {
  entity: IEntity;
  entities?: IEntity[];
}

export interface SelectionEventPayload {
  selectedIds: string[];
  previousIds: string[];
  added: string[];
  removed: string[];
}

export interface HoverEventPayload {
  entityId: string | null;
  previousId: string | null;
}

export interface ToolEventPayload {
  tool: ToolMode;
  previousTool: ToolMode;
}

export interface ViewportEventPayload {
  center: IVec2;
  zoom: number;
  previousCenter?: IVec2;
  previousZoom?: number;
}

export interface MouseEventPayload {
  screenPos: IVec2;
  worldPos: IVec2;
  snappedPos: IVec2;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export interface WheelEventPayload extends MouseEventPayload {
  deltaY: number;
}

export interface KeyEventPayload {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export interface SnapEventPayload {
  point: IVec2;
  snapType: string;
  entityId?: string;
}

export interface DrawingEventPayload {
  points: IVec2[];
  preview: IEntity | null;
  tool: ToolMode;
}

export interface CommandEventPayload {
  commandName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export interface ErrorEventPayload {
  message: string;
  error?: Error;
}

// ==================== Event Map ====================

export interface EngineEventMap {
  [EngineEventType.DOCUMENT_NEW]: void;
  [EngineEventType.DOCUMENT_OPEN]: { filename: string };
  [EngineEventType.DOCUMENT_SAVE]: { filename: string };
  [EngineEventType.DOCUMENT_MODIFIED]: void;

  [EngineEventType.ENTITY_ADDED]: EntityEventPayload;
  [EngineEventType.ENTITY_REMOVED]: EntityEventPayload;
  [EngineEventType.ENTITY_MODIFIED]: EntityEventPayload;
  [EngineEventType.ENTITIES_CLEARED]: void;

  [EngineEventType.SELECTION_CHANGED]: SelectionEventPayload;
  [EngineEventType.SELECTION_CLEARED]: void;
  [EngineEventType.HOVER_CHANGED]: HoverEventPayload;

  [EngineEventType.TOOL_CHANGED]: ToolEventPayload;
  [EngineEventType.DRAWING_START]: DrawingEventPayload;
  [EngineEventType.DRAWING_UPDATE]: DrawingEventPayload;
  [EngineEventType.DRAWING_COMPLETE]: DrawingEventPayload;
  [EngineEventType.DRAWING_CANCEL]: void;

  [EngineEventType.VIEWPORT_CHANGED]: ViewportEventPayload;
  [EngineEventType.VIEWPORT_ZOOM]: ViewportEventPayload;
  [EngineEventType.VIEWPORT_PAN]: ViewportEventPayload;

  [EngineEventType.MOUSE_MOVE]: MouseEventPayload;
  [EngineEventType.MOUSE_DOWN]: MouseEventPayload;
  [EngineEventType.MOUSE_UP]: MouseEventPayload;
  [EngineEventType.MOUSE_CLICK]: MouseEventPayload;
  [EngineEventType.MOUSE_DOUBLE_CLICK]: MouseEventPayload;
  [EngineEventType.MOUSE_WHEEL]: WheelEventPayload;
  [EngineEventType.KEY_DOWN]: KeyEventPayload;
  [EngineEventType.KEY_UP]: KeyEventPayload;

  [EngineEventType.SNAP_POINT]: SnapEventPayload;
  [EngineEventType.SNAP_CHANGED]: { enabled: boolean };

  [EngineEventType.COMMAND_EXECUTE]: CommandEventPayload;
  [EngineEventType.COMMAND_UNDO]: CommandEventPayload;
  [EngineEventType.COMMAND_REDO]: CommandEventPayload;

  [EngineEventType.LAYER_ADDED]: { layerId: string; name: string };
  [EngineEventType.LAYER_REMOVED]: { layerId: string };
  [EngineEventType.LAYER_MODIFIED]: { layerId: string };
  [EngineEventType.LAYER_ACTIVE_CHANGED]: {
    layerId: string;
    previousId: string;
  };

  [EngineEventType.RENDER_REQUEST]: void;
  [EngineEventType.RENDER_COMPLETE]: { time: number };

  [EngineEventType.ERROR]: ErrorEventPayload;
}

// ==================== Event Listener Types ====================

export type EngineEventListener<T extends EngineEventType> = (
  payload: EngineEventMap[T]
) => void;

export type AnyEventListener = (payload: unknown) => void;

// ==================== Event Emitter ====================

export class EngineEventEmitter {
  private listeners: Map<EngineEventType, Set<AnyEventListener>> = new Map();
  private onceListeners: Map<EngineEventType, Set<AnyEventListener>> =
    new Map();

  /**
   * Đăng ký listener cho event
   */
  on<T extends EngineEventType>(
    event: T,
    listener: EngineEventListener<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as AnyEventListener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Đăng ký listener chỉ chạy 1 lần
   */
  once<T extends EngineEventType>(
    event: T,
    listener: EngineEventListener<T>
  ): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(listener as AnyEventListener);

    return () => {
      this.onceListeners.get(event)?.delete(listener as AnyEventListener);
    };
  }

  /**
   * Hủy đăng ký listener
   */
  off<T extends EngineEventType>(
    event: T,
    listener: EngineEventListener<T>
  ): void {
    this.listeners.get(event)?.delete(listener as AnyEventListener);
    this.onceListeners.get(event)?.delete(listener as AnyEventListener);
  }

  /**
   * Emit event
   */
  emit<T extends EngineEventType>(event: T, payload: EngineEventMap[T]): void {
    // Regular listeners
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }

    // Once listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      for (const listener of onceListeners) {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in once listener for ${event}:`, error);
        }
      }
      this.onceListeners.delete(event);
    }
  }

  /**
   * Xóa tất cả listeners của một event
   */
  removeAllListeners(event?: EngineEventType): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Đếm số listeners của một event
   */
  listenerCount(event: EngineEventType): number {
    return (
      (this.listeners.get(event)?.size ?? 0) +
      (this.onceListeners.get(event)?.size ?? 0)
    );
  }
}
