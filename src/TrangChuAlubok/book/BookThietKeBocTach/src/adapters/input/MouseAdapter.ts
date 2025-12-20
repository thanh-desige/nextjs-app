/**
 * Mouse Adapter
 * Handles mouse input for CAD application
 */

import { Vec2 } from "../../core/geometry/Vec2";

// ===== Mouse Button Types =====
export type MouseButton = "left" | "middle" | "right";

// ===== Mouse Event Types =====
export interface MouseState {
  position: Vec2;
  worldPosition: Vec2;
  isDown: boolean;
  button: MouseButton | null;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  isDragging: boolean;
  dragStart: Vec2 | null;
  dragDelta: Vec2 | null;
}

export interface MouseEvent {
  type:
    | "down"
    | "up"
    | "move"
    | "click"
    | "dblclick"
    | "wheel"
    | "contextmenu"
    | "dragstart"
    | "drag"
    | "dragend";
  position: Vec2;
  worldPosition: Vec2;
  button: MouseButton | null;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  deltaY?: number; // For wheel events
  dragStart?: Vec2;
  dragDelta?: Vec2;
  clickCount?: number;
}

// ===== Mouse Event Handler =====
export type MouseEventHandler = (event: MouseEvent) => void;

// ===== Mouse Adapter Configuration =====
export interface MouseAdapterConfig {
  dragThreshold: number; // Pixels to move before drag starts
  doubleClickTime: number; // Ms between clicks for double-click
  wheelZoomFactor: number; // Zoom multiplier per wheel tick
  panButton: MouseButton; // Button for panning
  selectButton: MouseButton; // Button for selection
  contextButton: MouseButton; // Button for context menu
  invertWheelZoom: boolean; // Invert wheel zoom direction
}

const DEFAULT_CONFIG: MouseAdapterConfig = {
  dragThreshold: 5,
  doubleClickTime: 300,
  wheelZoomFactor: 0.1,
  panButton: "middle",
  selectButton: "left",
  contextButton: "right",
  invertWheelZoom: false,
};

// ===== World Position Converter =====
export type ScreenToWorldConverter = (screenPos: Vec2) => Vec2;

// ===== Mouse Adapter Implementation =====
export class MouseAdapter {
  private element: HTMLElement | null = null;
  private config: MouseAdapterConfig;
  private state: MouseState = {
    position: new Vec2(0, 0),
    worldPosition: new Vec2(0, 0),
    isDown: false,
    button: null,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    isDragging: false,
    dragStart: null,
    dragDelta: null,
  };

  private handlers: Map<MouseEvent["type"], Set<MouseEventHandler>> = new Map();
  private lastClickTime = 0;
  private lastClickPosition = new Vec2(0, 0);
  private clickCount = 0;
  private screenToWorld: ScreenToWorldConverter = (pos) => pos;

  // Bound event handlers for cleanup
  private boundHandlers: {
    mousedown: (e: globalThis.MouseEvent) => void;
    mouseup: (e: globalThis.MouseEvent) => void;
    mousemove: (e: globalThis.MouseEvent) => void;
    wheel: (e: WheelEvent) => void;
    contextmenu: (e: globalThis.MouseEvent) => void;
    dblclick: (e: globalThis.MouseEvent) => void;
  };

  constructor(config: Partial<MouseAdapterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Bind handlers
    this.boundHandlers = {
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),
      mousemove: this.handleMouseMove.bind(this),
      wheel: this.handleWheel.bind(this),
      contextmenu: this.handleContextMenu.bind(this),
      dblclick: this.handleDoubleClick.bind(this),
    };

    // Initialize handler sets
    const eventTypes: MouseEvent["type"][] = [
      "down",
      "up",
      "move",
      "click",
      "dblclick",
      "wheel",
      "contextmenu",
      "dragstart",
      "drag",
      "dragend",
    ];
    eventTypes.forEach((type) => this.handlers.set(type, new Set()));
  }

  // === Initialization ===
  attach(element: HTMLElement, screenToWorld?: ScreenToWorldConverter): void {
    this.element = element;
    if (screenToWorld) {
      this.screenToWorld = screenToWorld;
    }

    element.addEventListener("mousedown", this.boundHandlers.mousedown);
    element.addEventListener("mouseup", this.boundHandlers.mouseup);
    element.addEventListener("mousemove", this.boundHandlers.mousemove);
    element.addEventListener("wheel", this.boundHandlers.wheel, {
      passive: false,
    });
    element.addEventListener("contextmenu", this.boundHandlers.contextmenu);
    element.addEventListener("dblclick", this.boundHandlers.dblclick);

    // Also listen on document for mouseup (in case mouse leaves element)
    document.addEventListener("mouseup", this.boundHandlers.mouseup);
    document.addEventListener("mousemove", this.boundHandlers.mousemove);
  }

  detach(): void {
    if (this.element) {
      this.element.removeEventListener(
        "mousedown",
        this.boundHandlers.mousedown
      );
      this.element.removeEventListener("mouseup", this.boundHandlers.mouseup);
      this.element.removeEventListener(
        "mousemove",
        this.boundHandlers.mousemove
      );
      this.element.removeEventListener("wheel", this.boundHandlers.wheel);
      this.element.removeEventListener(
        "contextmenu",
        this.boundHandlers.contextmenu
      );
      this.element.removeEventListener("dblclick", this.boundHandlers.dblclick);
    }

    document.removeEventListener("mouseup", this.boundHandlers.mouseup);
    document.removeEventListener("mousemove", this.boundHandlers.mousemove);

    this.element = null;
  }

  setScreenToWorldConverter(converter: ScreenToWorldConverter): void {
    this.screenToWorld = converter;
  }

  // === Event Handlers ===
  private handleMouseDown(e: globalThis.MouseEvent): void {
    const screenPos = this.getScreenPosition(e);
    const worldPos = this.screenToWorld(screenPos);
    const button = this.getButton(e);

    this.state = {
      ...this.state,
      position: screenPos,
      worldPosition: worldPos,
      isDown: true,
      button,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      dragStart: screenPos,
      isDragging: false,
    };

    // Handle click counting for double-click
    const now = Date.now();
    const distance = screenPos.distanceTo(this.lastClickPosition);

    if (
      now - this.lastClickTime < this.config.doubleClickTime &&
      distance < this.config.dragThreshold
    ) {
      this.clickCount++;
    } else {
      this.clickCount = 1;
    }

    this.lastClickTime = now;
    this.lastClickPosition = screenPos;

    this.emit("down", {
      type: "down",
      position: screenPos,
      worldPosition: worldPos,
      button,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      clickCount: this.clickCount,
    });
  }

  private handleMouseUp(e: globalThis.MouseEvent): void {
    const screenPos = this.getScreenPosition(e);
    const worldPos = this.screenToWorld(screenPos);
    const button = this.getButton(e);

    const wasDown = this.state.isDown;
    const wasDragging = this.state.isDragging;
    const dragStart = this.state.dragStart;

    // End dragging
    if (wasDragging && dragStart) {
      this.emit("dragend", {
        type: "dragend",
        position: screenPos,
        worldPosition: worldPos,
        button: this.state.button,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        dragStart,
        dragDelta: screenPos.sub(dragStart),
      });
    }

    // Emit click if was down and not dragging
    if (wasDown && !wasDragging) {
      this.emit("click", {
        type: "click",
        position: screenPos,
        worldPosition: worldPos,
        button,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        clickCount: this.clickCount,
      });
    }

    this.state = {
      ...this.state,
      position: screenPos,
      worldPosition: worldPos,
      isDown: false,
      button: null,
      isDragging: false,
      dragStart: null,
      dragDelta: null,
    };

    this.emit("up", {
      type: "up",
      position: screenPos,
      worldPosition: worldPos,
      button,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
    });
  }

  private handleMouseMove(e: globalThis.MouseEvent): void {
    const screenPos = this.getScreenPosition(e);
    const worldPos = this.screenToWorld(screenPos);

    const dragStart = this.state.dragStart;
    let isDragging = this.state.isDragging;
    let dragDelta: Vec2 | null = null;

    // Check if drag should start
    if (this.state.isDown && dragStart && !isDragging) {
      const distance = screenPos.distanceTo(dragStart);
      if (distance >= this.config.dragThreshold) {
        isDragging = true;

        this.emit("dragstart", {
          type: "dragstart",
          position: screenPos,
          worldPosition: worldPos,
          button: this.state.button,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          dragStart,
        });
      }
    }

    // Calculate drag delta
    if (isDragging && dragStart) {
      dragDelta = screenPos.sub(dragStart);

      this.emit("drag", {
        type: "drag",
        position: screenPos,
        worldPosition: worldPos,
        button: this.state.button,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        dragStart,
        dragDelta,
      });
    }

    this.state = {
      ...this.state,
      position: screenPos,
      worldPosition: worldPos,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      isDragging,
      dragDelta,
    };

    this.emit("move", {
      type: "move",
      position: screenPos,
      worldPosition: worldPos,
      button: this.state.isDown ? this.state.button : null,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
    });
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const screenPos = this.getScreenPosition(e);
    const worldPos = this.screenToWorld(screenPos);

    let deltaY = e.deltaY;
    if (this.config.invertWheelZoom) {
      deltaY = -deltaY;
    }

    this.emit("wheel", {
      type: "wheel",
      position: screenPos,
      worldPosition: worldPos,
      button: null,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      deltaY,
    });
  }

  private handleContextMenu(e: globalThis.MouseEvent): void {
    e.preventDefault();

    const screenPos = this.getScreenPosition(e);
    const worldPos = this.screenToWorld(screenPos);

    this.emit("contextmenu", {
      type: "contextmenu",
      position: screenPos,
      worldPosition: worldPos,
      button: "right",
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
    });
  }

  private handleDoubleClick(e: globalThis.MouseEvent): void {
    const screenPos = this.getScreenPosition(e);
    const worldPos = this.screenToWorld(screenPos);
    const button = this.getButton(e);

    this.emit("dblclick", {
      type: "dblclick",
      position: screenPos,
      worldPosition: worldPos,
      button,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      clickCount: 2,
    });
  }

  // === Utility Methods ===
  private getScreenPosition(e: globalThis.MouseEvent): Vec2 {
    if (!this.element) return new Vec2(e.clientX, e.clientY);

    const rect = this.element.getBoundingClientRect();
    return new Vec2(e.clientX - rect.left, e.clientY - rect.top);
  }

  private getButton(e: globalThis.MouseEvent): MouseButton {
    switch (e.button) {
      case 0:
        return "left";
      case 1:
        return "middle";
      case 2:
        return "right";
      default:
        return "left";
    }
  }

  private emit(type: MouseEvent["type"], event: MouseEvent): void {
    const handlerSet = this.handlers.get(type);
    if (handlerSet) {
      handlerSet.forEach((handler) => handler(event));
    }
  }

  // === Event Subscription ===
  on(type: MouseEvent["type"], handler: MouseEventHandler): void {
    const handlerSet = this.handlers.get(type);
    if (handlerSet) {
      handlerSet.add(handler);
    }
  }

  off(type: MouseEvent["type"], handler: MouseEventHandler): void {
    const handlerSet = this.handlers.get(type);
    if (handlerSet) {
      handlerSet.delete(handler);
    }
  }

  once(type: MouseEvent["type"], handler: MouseEventHandler): void {
    const wrappedHandler: MouseEventHandler = (event) => {
      this.off(type, wrappedHandler);
      handler(event);
    };
    this.on(type, wrappedHandler);
  }

  // === State Getters ===
  getState(): MouseState {
    return { ...this.state };
  }

  getPosition(): Vec2 {
    return this.state.position.clone();
  }

  getWorldPosition(): Vec2 {
    return this.state.worldPosition.clone();
  }

  isButtonDown(button?: MouseButton): boolean {
    if (button) {
      return this.state.isDown && this.state.button === button;
    }
    return this.state.isDown;
  }

  isDragging(): boolean {
    return this.state.isDragging;
  }

  // === Configuration ===
  getConfig(): MouseAdapterConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<MouseAdapterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // === Utility ===
  isPanning(): boolean {
    return this.state.isDown && this.state.button === this.config.panButton;
  }

  isSelecting(): boolean {
    return this.state.isDown && this.state.button === this.config.selectButton;
  }
}
