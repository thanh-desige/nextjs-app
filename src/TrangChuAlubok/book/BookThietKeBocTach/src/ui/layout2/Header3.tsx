"use client";
import React, { useState, useRef, useEffect } from "react";
import { useUIStore } from "../../store/uiStore";

interface Header3Props {
  mouseX?: number;
  mouseY?: number;
  zoom?: number;
  onCommand?: (command: string) => void;
  // Sync với commandBuffer từ parent
  commandBuffer?: string;
  onCommandBufferChange?: (value: string) => void;
  activeTool?: string;
  activePrompt?: string;
}

export default function Header3({
  mouseX = 0,
  mouseY = 0,
  zoom = 100,
  onCommand,
  commandBuffer = "",
  onCommandBufferChange,
  activeTool,
  activePrompt,
}: Header3Props): React.ReactElement {
  // Use commandBuffer from parent if provided, otherwise use local state
  const [localCommand, setLocalCommand] = useState("");
  const command = onCommandBufferChange ? commandBuffer : localCommand;
  const setCommand = onCommandBufferChange
    ? onCommandBufferChange
    : setLocalCommand;

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [showCoords, setShowCoords] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get notifications from store
  const notifications = useUIStore((state) => state.notifications);
  const latestNotification = notifications[notifications.length - 1];

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setShowCoords(width >= 480);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter or Space = execute command
    if ((e.key === "Enter" || e.key === " ") && command.trim()) {
      e.preventDefault();
      onCommand?.(command.trim());
      setHistory((prev) => [...prev, command.trim()]);
      setHistoryIndex(-1);
      setCommand("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex =
          historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCommand(history[newIndex]);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCommand("");
      setHistoryIndex(-1);
      inputRef.current?.blur(); // Blur input on Escape
    }
  };

  return (
    <div
      style={{
        height: isMobile ? 36 : 28,
        minHeight: isMobile ? 36 : 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 8px" : "0 12px",
        backgroundColor: "#1a1a2e",
        borderTop: "1px solid #333",
        gap: isMobile ? 8 : 16,
        flexWrap: "wrap",
      }}
    >
      {/* Left: Command Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        {!isMobile && (
          <span style={{ fontSize: 11, color: "#4a90d9", flexShrink: 0 }}>
            Command:
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder={isMobile ? "Cmd..." : "Enter command..."}
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: isMobile ? "100%" : 300,
            background: "#252535",
            border: "1px solid #444",
            borderRadius: 3,
            padding: isMobile ? "4px 8px" : "3px 8px",
            color: "#fff",
            fontSize: isMobile ? 12 : 11,
            outline: "none",
            fontFamily: "monospace",
          }}
        />
        {latestNotification && !isMobile && (
          <span
            style={{
              fontSize: 10,
              color:
                latestNotification.type === "error"
                  ? "#ff6b6b"
                  : latestNotification.type === "success"
                  ? "#4ade80"
                  : "#fbbf24",
              marginLeft: 8,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 200,
            }}
          >
            {latestNotification.message}
          </span>
        )}
      </div>

      {/* Right: Coordinates & Zoom */}
      {showCoords && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 16,
            fontSize: isMobile ? 10 : 11,
            color: "#888",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          <span>
            X:{" "}
            <span style={{ color: "#ddd" }}>
              {mouseX.toFixed(isMobile ? 0 : 2)}
            </span>
          </span>
          <span>
            Y:{" "}
            <span style={{ color: "#ddd" }}>
              {mouseY.toFixed(isMobile ? 0 : 2)}
            </span>
          </span>
          <span>
            {isMobile ? "" : "Zoom: "}
            <span style={{ color: "#ddd" }}>{zoom.toFixed(0)}%</span>
          </span>
        </div>
      )}
    </div>
  );
}
