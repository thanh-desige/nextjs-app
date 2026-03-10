"use client";

import React, { useRef, useState, useEffect } from "react";

// ==================== COLORS ====================
const COLORS = {
  border: "#3a3a3a",
  hoverBg: "rgba(155, 89, 182, 0.3)",
  categoryText: "#ffffff",
  subCategoryText: "#cccccc",
};

// ==================== INTERFACES ====================
interface LibrarySubCategory {
  id: string;
  name: string;
  category: "door" | "window";
  icon?: string;
}

interface LibraryCategory {
  id: string;
  name: string;
  icon: string;
  subCategories: LibrarySubCategory[];
}

interface SidebarLeftProps {
  onToggle?: () => void;
  onOpenTemplateOverlay?: (
    category: "door" | "window",
    subCategory: string
  ) => void;
}

// ==================== COMPONENT ====================
export default function SidebarLeft({
  onToggle,
  onOpenTemplateOverlay,
}: SidebarLeftProps) {
  // ==================== STATE ====================
  const [width, setWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "doors"
  );
  const sidebarRef = useRef<HTMLDivElement>(null);

  // ==================== RESIZE LOGIC ====================
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(48, Math.min(400, e.clientX));
      setWidth(newWidth);
      setCollapsed(newWidth < 120);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // ==================== CATEGORIES DATA ====================
  const categories: LibraryCategory[] = [
    {
      id: "doors",
      name: "Cửa đi",
      icon: "🚪",
      subCategories: [
        {
          id: "door-hinged",
          name: "Cửa mở quay",
          category: "door",
          icon: "↩️",
        },
        {
          id: "door-sliding",
          name: "Cửa mở trượt",
          category: "door",
          icon: "↔️",
        },
        { id: "door-folding", name: "Cửa gấp", category: "door", icon: "📖" },
      ],
    },
    {
      id: "windows",
      name: "Cửa sổ",
      icon: "🪟",
      subCategories: [
        {
          id: "window-casement",
          name: "Cửa sổ mở quay",
          category: "window",
          icon: "↩️",
        },
        {
          id: "window-sliding",
          name: "Cửa sổ mở trượt",
          category: "window",
          icon: "↔️",
        },
        {
          id: "window-awning",
          name: "Cửa sổ hất",
          category: "window",
          icon: "⬆️",
        },
        {
          id: "window-fixed",
          name: "Cửa sổ cố định",
          category: "window",
          icon: "🔲",
        },
      ],
    },
    {
      id: "walls",
      name: "Vách kính",
      icon: "▥",
      subCategories: [],
    },
    {
      id: "accessories",
      name: "Phụ kiện",
      icon: "🔧",
      subCategories: [],
    },
  ];

  // ==================== CLICK HANDLER ====================
  const handleSubCategoryClick = (subCat: LibrarySubCategory) => {
    if (onOpenTemplateOverlay) {
      onOpenTemplateOverlay(subCat.category, subCat.name);
    }
  };

  // ==================== RENDER ====================
  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${width}px`,
        height: "100%",
        backgroundColor: "#252526",
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        transition: isResizing ? "none" : "width 0.3s ease",
        userSelect: "none",
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "6px",
          height: "100%",
          cursor: "col-resize",
          backgroundColor: isResizing ? "rgba(255, 0, 0, 0.3)" : "transparent",
          transition: "background-color 0.2s",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          if (!isResizing)
            e.currentTarget.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          if (!isResizing)
            e.currentTarget.style.backgroundColor = "transparent";
        }}
      />

      {/* Collapse Button */}
      <div
        onClick={() => {
          setCollapsed(!collapsed);
          setWidth(collapsed ? 250 : 48);
        }}
        style={{
          width: "24px",
          height: "24px",
          backgroundColor: "#1e1e2e",
          borderRadius: "50%",
          position: "absolute",
          top: "50%",
          right: "-12px",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: `1px solid #444`,
          transition: "all 0.2s ease",
          zIndex: 999,
          boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2a2a3e";
          e.currentTarget.style.borderColor = "#666";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#1e1e2e";
          e.currentTarget.style.borderColor = "#444";
        }}
      >
        <span style={{ color: "#888", fontSize: "10px" }}>
          {collapsed ? "▶" : "◀"}
        </span>
      </div>

      {/* ==================== EXPANDED VIEW ==================== */}
      {!collapsed && (
        <>
          {/* Header */}
          <div
            style={{
              padding: "12px",
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#BA00AE",
              fontWeight: 500,
              fontSize: "18px",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              📋 Thư viện
            </span>
            {onToggle && (
              <button
                onClick={onToggle}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {categories.map((category) => (
              <div key={category.id}>
                {/* Category Header */}
                <button
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor:
                      expandedCategory === category.id
                        ? "rgba(155, 89, 182, 0.15)"
                        : "transparent",
                    border: "none",
                    color: COLORS.categoryText,
                    textAlign: "left",
                    cursor: "pointer",
                    borderBottom: `1px solid rgba(0,0,0,0.1)`,
                    fontSize: "15px",
                    fontWeight: 500,
                    transition: "background-color 0.2s",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(155, 89, 182, 0.2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      expandedCategory === category.id
                        ? "rgba(155, 89, 182, 0.15)"
                        : "transparent")
                  }
                >
                  <span
                    style={{
                      transform:
                        expandedCategory === category.id
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                      display: "inline-block",
                      fontSize: "10px",
                    }}
                  >
                    ▶
                  </span>
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  {category.subCategories.length > 0 && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "11px",
                        color: "#666",
                        backgroundColor: "rgba(0,0,0,0.2)",
                        padding: "2px 6px",
                        borderRadius: "10px",
                      }}
                    >
                      {category.subCategories.length}
                    </span>
                  )}
                </button>

                {/* SubCategories - CLICKABLE */}
                {expandedCategory === category.id && (
                  <div style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
                    {category.subCategories.map((subCat) => (
                      <div
                        key={subCat.id}
                        onClick={() => handleSubCategoryClick(subCat)}
                        style={{
                          padding: "10px 16px 10px 36px",
                          color: COLORS.subCategoryText,
                          fontSize: "13px",
                          cursor: "pointer",
                          borderBottom: `1px solid rgba(0,0,0,0.05)`,
                          transition: "all 0.15s ease",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.hoverBg;
                          e.currentTarget.style.paddingLeft = "40px";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.paddingLeft = "36px";
                          e.currentTarget.style.color = COLORS.subCategoryText;
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>
                          {subCat.icon || "📁"}
                        </span>
                        <span>{subCat.name}</span>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "11px",
                            color: "#666",
                          }}
                        >
                          → Xem mẫu
                        </span>
                      </div>
                    ))}
                    {category.subCategories.length === 0 && (
                      <div
                        style={{
                          padding: "12px 36px",
                          color: "#555",
                          fontSize: "12px",
                          fontStyle: "italic",
                        }}
                      >
                        Chưa có mẫu
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: `1px solid ${COLORS.border}`,
              fontSize: "11px",
              color: "#666",
              textAlign: "center",
            }}
          >
            💡 Click danh mục để xem mẫu
          </div>
        </>
      )}

      {/* ==================== COLLAPSED VIEW ==================== */}
      {collapsed && (
        <>
          {/* Header Icon */}
          <div
            style={{
              padding: "12px",
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "20px",
              minHeight: "45px",
              flexShrink: 0,
            }}
            title="Thư viện"
          >
            📋
          </div>

          {/* Category Icons */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "12px",
              gap: "8px",
              overflowY: "auto",
            }}
          >
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => {
                  // Expand sidebar and show category
                  setCollapsed(false);
                  setWidth(250);
                  setExpandedCategory(category.id);
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor:
                    expandedCategory === category.id
                      ? "rgba(155, 89, 182, 0.3)"
                      : "transparent",
                  transition: "all 0.2s",
                  fontSize: "18px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.hoverBg;
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    expandedCategory === category.id
                      ? "rgba(155, 89, 182, 0.3)"
                      : "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title={category.name}
              >
                {category.icon}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
