"use client";
import React, { useState, useEffect } from "react";

interface Header1Props {
  filename?: string;
  onFilenameChange?: (name: string) => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

export default function Header1({
  filename = "untitled",
  onFilenameChange,
  isSaving = false,
  lastSaved = null,
}: Header1Props): React.ReactElement {
  const [localFilename, setLocalFilename] = useState(filename);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setLocalFilename(filename);
  }, [filename]);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleBlur = () => {
    if (onFilenameChange && localFilename !== filename) {
      onFilenameChange(localFilename);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        height: isMobile ? 40 : 32,
        minHeight: isMobile ? 40 : 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 8px" : "0 12px",
        backgroundColor: "#1a1a2e",
        borderBottom: "1px solid #333",
        flexWrap: "wrap",
      }}
    >
      {/* Left: Logo + Filename */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 4 : 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 12 : 14,
            fontWeight: "bold",
            color: "#4a90d9",
            whiteSpace: "nowrap",
          }}
        >
          {isMobile ? "📐" : "📐 CAD"}
        </span>
        {!isMobile && <span style={{ color: "#555" }}>|</span>}
        <input
          type="text"
          value={localFilename}
          onChange={(e) => setLocalFilename(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          style={{
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: 4,
            padding: "2px 8px",
            color: "#ddd",
            fontSize: isMobile ? 12 : 13,
            outline: "none",
            minWidth: 0,
            flex: 1,
            maxWidth: isMobile ? 150 : 250,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#4a90d9";
            e.target.style.background = "#2a2a3e";
          }}
          onBlurCapture={(e) => {
            e.target.style.borderColor = "transparent";
            e.target.style.background = "transparent";
          }}
        />
      </div>

      {/* Right: Save Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: isMobile ? 10 : 11,
          color: "#888",
          flexShrink: 0,
        }}
      >
        {isSaving ? (
          <span style={{ color: "#fbbf24" }}>
            {isMobile ? "💾" : "💾 Saving..."}
          </span>
        ) : lastSaved ? (
          <span style={{ color: "#4ade80" }}>
            {isMobile ? "✓" : `✓ Saved ${formatTime(lastSaved)}`}
          </span>
        ) : (
          <span>{isMobile ? "–" : "Not saved"}</span>
        )}
      </div>
    </div>
  );
}
