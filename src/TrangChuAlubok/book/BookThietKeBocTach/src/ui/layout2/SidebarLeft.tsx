"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";

interface LibraryItem {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface SidebarLeftProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onItemSelect?: (item: LibraryItem) => void;
}

const libraryCategories = [
  {
    id: "doors",
    label: "🚪 Cửa",
    items: [
      { id: "door-single", name: "Cửa đơn", icon: "🚪", category: "doors" },
      { id: "door-double", name: "Cửa đôi", icon: "🚪", category: "doors" },
      { id: "door-sliding", name: "Cửa trượt", icon: "🚪", category: "doors" },
    ],
  },
  {
    id: "windows",
    label: "🪟 Cửa sổ",
    items: [
      {
        id: "window-fixed",
        name: "Cửa sổ cố định",
        icon: "🪟",
        category: "windows",
      },
      {
        id: "window-casement",
        name: "Cửa sổ mở",
        icon: "🪟",
        category: "windows",
      },
    ],
  },
  {
    id: "frames",
    label: "📐 Khung",
    items: [
      {
        id: "frame-aluminum",
        name: "Khung nhôm",
        icon: "📐",
        category: "frames",
      },
      { id: "frame-steel", name: "Khung thép", icon: "📐", category: "frames" },
    ],
  },
  {
    id: "glass",
    label: "🔲 Kính",
    items: [
      { id: "glass-clear", name: "Kính trong", icon: "🔲", category: "glass" },
      { id: "glass-tinted", name: "Kính màu", icon: "🔲", category: "glass" },
      {
        id: "glass-tempered",
        name: "Kính cường lực",
        icon: "🔲",
        category: "glass",
      },
    ],
  },
];

export default function SidebarLeft({
  isCollapsed = false,
  onToggle,
  onItemSelect,
}: SidebarLeftProps): React.ReactElement {
  const [width, setWidth] = useState(200);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "doors",
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isCollapsedRef = useRef(isCollapsed);
  const onToggleRef = useRef(onToggle);

  // Keep refs in sync
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
    onToggleRef.current = onToggle;
  }, [isCollapsed, onToggle]);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto collapse on mobile
      if (mobile && !isCollapsedRef.current) {
        onToggleRef.current?.();
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleMouseDown = () => {
    if (!isMobile) setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newWidth = Math.min(Math.max(e.clientX, 48), 300);
    setWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Collapsed state
  if (isCollapsed) {
    return (
      <div
        style={{
          width: isMobile ? 40 : 32,
          backgroundColor: "#1e1e2e",
          borderRight: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 8,
          zIndex: 100,
          position: "relative",
        }}
      >
        {/* Expand button at middle right edge */}
        {!isMobile && onToggle && (
          <button
            onClick={onToggle}
            style={{
              position: "absolute",
              right: -12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#1e1e2e",
              border: "1px solid #444",
              color: "#888",
              cursor: "pointer",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
              boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
            }}
            title="Expand Library"
          >
            ▶
          </button>
        )}

        {/* Mobile expand button */}
        {isMobile && (
          <button
            onClick={onToggle}
            style={{
              width: 32,
              height: 32,
              background: "transparent",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: 16,
            }}
            title="Expand Library"
          >
            ▶
          </button>
        )}
        {/* Quick access icons on mobile */}
        {isMobile && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {libraryCategories.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onToggle?.();
                  setExpandedCategories([cat.id]);
                }}
                style={{
                  width: 32,
                  height: 32,
                  background: "transparent",
                  border: "none",
                  fontSize: 16,
                  cursor: "pointer",
                }}
                title={cat.label}
              >
                {cat.label.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Expanded state
  const actualWidth = isMobile ? "100%" : width;
  const maxWidthValue = isMobile ? "80vw" : 300;

  return (
    <div
      style={{
        width: actualWidth,
        minWidth: isMobile ? 200 : 48,
        maxWidth: maxWidthValue,
        backgroundColor: "#1e1e2e",
        borderRight: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        position: isMobile ? "absolute" : "relative",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: isMobile ? 1000 : 10,
        boxShadow: isMobile ? "4px 0 20px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {/* Mobile overlay backdrop */}
      {isMobile && (
        <div
          onClick={onToggle}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: -1,
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          padding: isMobile ? "12px 16px" : "8px 12px",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 14 : 12,
            fontWeight: "bold",
            color: "#ddd",
          }}
        >
          📚 Library
        </span>
        <button
          onClick={onToggle}
          style={{
            width: isMobile ? 28 : 20,
            height: isMobile ? 28 : 20,
            background: "transparent",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: isMobile ? 14 : 10,
          }}
          title="Collapse"
        >
          ✕
        </button>
      </div>

      {/* Categories */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 12 : 8 }}>
        {libraryCategories.map((category) => (
          <div key={category.id} style={{ marginBottom: isMobile ? 12 : 8 }}>
            <button
              onClick={() => toggleCategory(category.id)}
              style={{
                width: "100%",
                padding: isMobile ? "10px 12px" : "6px 8px",
                background: "#252535",
                border: "none",
                borderRadius: 4,
                color: "#ddd",
                fontSize: isMobile ? 13 : 11,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{category.label}</span>
              <span>
                {expandedCategories.includes(category.id) ? "▼" : "▶"}
              </span>
            </button>
            {expandedCategories.includes(category.id) && (
              <div
                style={{
                  paddingLeft: isMobile ? 12 : 8,
                  marginTop: isMobile ? 8 : 4,
                }}
              >
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onItemSelect?.(item);
                      if (isMobile) onToggle?.();
                    }}
                    style={{
                      padding: isMobile ? "8px 12px" : "4px 8px",
                      marginBottom: isMobile ? 4 : 2,
                      borderRadius: 3,
                      cursor: "pointer",
                      fontSize: isMobile ? 12 : 10,
                      color: "#aaa",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? 10 : 6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#333";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span style={{ fontSize: isMobile ? 16 : 12 }}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resize Handle - only on desktop */}
      {!isMobile && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 4,
            cursor: "ew-resize",
            background: isDragging ? "#4a90d9" : "transparent",
          }}
        />
      )}

      {/* Collapse button - positioned at middle right edge */}
      {!isMobile && onToggle && (
        <button
          onClick={onToggle}
          style={{
            position: "absolute",
            right: -12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#1e1e2e",
            border: "1px solid #444",
            color: "#888",
            cursor: "pointer",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
          }}
          title="Collapse Library"
        >
          ◀
        </button>
      )}
    </div>
  );
}
