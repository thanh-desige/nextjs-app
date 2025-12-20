"use client";
import React, { useState } from "react";
import { FiSearch, FiBell, FiUser, FiArrowLeft } from "react-icons/fi";
import TongHop from "./categories/TongHop";
import NhomThanh from "./categories/NhomThanh";
import PhuKienNhom from "./categories/PhuKienNhom";
import Kinh from "./categories/Kinh";
import PhuKienKinh from "./categories/PhuKienKinh";
import InoxThanh from "./categories/InoxThanh";
import InoxTam from "./categories/InoxTam";

interface MuaHangPageProps {
  onBackClick: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.FC | string;
  isUrl: boolean;
}

// SVG Icon Components
const NhomThanhIcon: React.FC = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_303_1605)">
      <path
        d="M19.5263 13.25V16V18.75M19.5263 13.25V5.2C19.5263 5.08954 19.4368 5 19.3263 5H5.2C5.08954 5 5 5.08954 5 5.2V26.8C5 26.9105 5.08954 27 5.2 27H19.3263C19.4368 27 19.5263 26.9105 19.5263 26.8V18.75M19.5263 13.25H27.3C27.4105 13.25 27.5 13.3395 27.5 13.45V16V18.55C27.5 18.6605 27.4105 18.75 27.3 18.75H19.5263"
        stroke="currentColor"
        strokeWidth="2"
      />
    </g>
    <defs>
      <clipPath id="clip0_303_1605">
        <rect width="32" height="32" rx="4" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const PhuKienNhomIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.5 4V9M5.5 29V24M5.5 24V9M5.5 24L27 8M5.5 9L16.2157 15.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="5.5" cy="27.5" r="0.5" fill="currentColor" />
    <circle cx="5.5" cy="4.5" r="0.5" fill="currentColor" />
    <circle cx="5.5" cy="15.5" r="0.5" fill="currentColor" />
    <circle cx="26.5" cy="8.5" r="0.5" fill="currentColor" />
    <circle cx="16.5" cy="15.5" r="0.5" fill="currentColor" />
    <circle cx="7.5" cy="22.5" r="0.5" fill="currentColor" />
  </svg>
);

const KinhIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M25 28L28 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
    <path
      d="M22.5 28L25.5 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
    <path
      d="M20 28L23 5.5M17.5 28L20.5 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
    <path
      d="M15 28L18 7M12.5 28L15.5 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
    <path
      d="M13 10L7 28"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
    <path
      d="M4.5 28L10.5 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

const PhuKienKinhIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 25H11V7H15.5H20V25Z" fill="currentColor" />
    <path
      d="M11 3V7M11 29V25M20 3V7M20 29V25M11 25H20M11 25V7M20 25V7M11 7H15.5H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const InoxThanhIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="7" cy="11" r="2.5" fill="currentColor" stroke="currentColor" />
    <circle cx="20" cy="11" r="2.5" fill="currentColor" stroke="currentColor" />
    <circle cx="10" cy="6" r="2.5" fill="currentColor" stroke="currentColor" />
    <circle cx="23" cy="6" r="2.5" fill="currentColor" stroke="currentColor" />
    <circle cx="13" cy="11" r="2.5" fill="currentColor" stroke="currentColor" />
    <circle cx="26" cy="11" r="2.5" fill="currentColor" stroke="currentColor" />
    <rect
      x="15.5"
      y="22.5"
      width="2"
      height="6"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="15.5"
      y="17.5"
      width="2"
      height="3"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="19.5"
      y="22.5"
      width="4"
      height="6"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="19.5"
      y="17.5"
      width="4"
      height="3"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="9.5"
      y="22.5"
      width="4"
      height="6"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="10.5"
      y="17.5"
      width="3"
      height="3"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="25.5"
      y="22.5"
      width="3"
      height="6"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="25.5"
      y="17.5"
      width="3"
      height="3"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="4.5"
      y="22.5"
      width="3"
      height="6"
      fill="currentColor"
      stroke="currentColor"
    />
    <rect
      x="4.5"
      y="17.5"
      width="3"
      height="3"
      fill="currentColor"
      stroke="currentColor"
    />
  </svg>
);

const InoxTamIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 26H28M5 23.5H27M5.5 21H26.5M6.5 18.5H26M7 16H25.5M7.5 13.5H25M8 11H24M8.5 8.5H23.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
    <path
      d="M9 6H23"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

const TongHopIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_303_1602)">
      <path
        d="M12.5715 27.4284V18.4075C12.5715 17.7247 12.5715 17.3834 12.6961 17.1226C12.8057 16.8932 12.9805 16.7068 13.1955 16.5899C13.44 16.457 13.7601 16.457 14.4001 16.457H17.6001C18.2402 16.457 18.5602 16.457 18.8047 16.5899C19.0198 16.7068 19.1945 16.8932 19.3041 17.1226C19.4287 17.3834 19.4287 17.7247 19.4287 18.4075V27.4284M4.57153 13.4094L14.903 5.14424C15.2964 4.82949 15.4931 4.67211 15.7091 4.61144C15.8999 4.5579 16.1003 4.5579 16.2911 4.61146C16.5071 4.67211 16.7038 4.82949 17.0972 5.14424L27.4287 13.4094M6.85725 11.5808V23.5275C6.85725 24.8929 6.85725 25.5757 7.10638 26.0972C7.32552 26.556 7.67519 26.929 8.10527 27.1627C8.59422 27.4284 9.23428 27.4284 10.5144 27.4284H21.4858C22.7659 27.4284 23.406 27.4284 23.895 27.1627C24.325 26.929 24.6747 26.556 24.8938 26.0972C25.143 25.5757 25.143 24.8929 25.143 23.5275V11.5808L18.1944 6.02195C17.4075 5.39245 17.014 5.0777 16.5819 4.95637C16.2006 4.84928 15.7996 4.84928 15.4183 4.95637C14.9862 5.0777 14.5927 5.39245 13.8058 6.02195L6.85725 11.5808Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_303_1602">
        <rect width="32" height="32" rx="4" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const OrderHistoryIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 34 35"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.5 31L26 34L33 24M32.9762 17.8827C32.992 17.5913 33 17.298 33 17.0027C33 8.16466 25.8365 1 17 1C8.16344 1 1 8.16466 1 17.0027C1 25.7008 7.93842 32.7782 16.5816 33M17 6V17.0027L10 21M26 19.5V26M26 26L24 24.5M26 26L28 24.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShoppingCartIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1H3.06809C3.45762 1 3.65238 1 3.80912 1.07163C3.94725 1.13476 4.0643 1.23626 4.14632 1.36409C4.23939 1.5091 4.26694 1.70192 4.32202 2.08753L5.07143 7.33333M5.07143 7.33333L6.73692 19.5747C6.94828 21.1281 7.05395 21.9049 7.42533 22.4895C7.75257 23.0047 8.22171 23.4143 8.7763 23.6692C9.40569 23.9583 10.1896 23.9583 11.7573 23.9583H25.3073C26.7996 23.9583 27.5458 23.9583 28.1557 23.6898C28.6933 23.4531 29.1545 23.0714 29.4878 22.5875C29.8656 22.0387 30.0052 21.3058 30.2845 19.8398L32.3802 8.83701C32.4786 8.32103 32.5277 8.06304 32.4564 7.86138C32.394 7.68447 32.2707 7.53549 32.1085 7.44103C31.9238 7.33333 31.6613 7.33333 31.1359 7.33333H5.07143ZM13.6667 31.0833C13.6667 31.9578 12.9578 32.6667 12.0833 32.6667C11.2089 32.6667 10.5 31.9578 10.5 31.0833C10.5 30.2089 11.2089 29.5 12.0833 29.5C12.9578 29.5 13.6667 30.2089 13.6667 31.0833ZM26.3333 31.0833C26.3333 31.9578 25.6245 32.6667 24.75 32.6667C23.8755 32.6667 23.1667 31.9578 23.1667 31.0833C23.1667 30.2089 23.8755 29.5 24.75 29.5C25.6245 29.5 26.3333 30.2089 26.3333 31.0833Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.8333 11.833V19.833"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
    <path
      d="M13.8333 15.833H21.8333"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "Tổng hợp",
    label: "Tổng hợp",
    icon: TongHopIcon,
    isUrl: false,
  },
  { id: "Nhôm thanh", label: "Nhôm thanh", icon: NhomThanhIcon, isUrl: false },
  {
    id: "Phụ kiện nhôm",
    label: "Phụ kiện nhôm",
    icon: PhuKienNhomIcon,
    isUrl: false,
  },
  { id: "Kính", label: "Kính", icon: KinhIcon, isUrl: false },
  {
    id: "Phụ kiện kính",
    label: "Phụ kiện kính",
    icon: PhuKienKinhIcon,
    isUrl: false,
  },
  { id: "Inox thanh", label: "Inox thanh", icon: InoxThanhIcon, isUrl: false },
  { id: "Inox tấm", label: "Inox tấm", icon: InoxTamIcon, isUrl: false },
];

interface ArrowProps {
  collapsed: boolean;
}

const Arrow: React.FC<ArrowProps> = ({ collapsed }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
      transition: "0.3s ease",
    }}
  >
    <polyline points="8 4 16 12 8 20" />
  </svg>
);

// Map component names
const categoryComponents: Record<string, React.FC> = {
  "Tổng hợp": TongHop,
  "Nhôm thanh": NhomThanh,
  "Phụ kiện nhôm": PhuKienNhom,
  Kính: Kinh,
  "Phụ kiện kính": PhuKienKinh,
  "Inox thanh": InoxThanh,
  "Inox tấm": InoxTam,
};

export default function MuaHangPage({
  onBackClick,
}: MuaHangPageProps): React.ReactElement {
  const [activeSidebarItem, setActiveSidebarItem] =
    useState<string>("Tổng hợp");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const ActiveComponent = categoryComponents[activeSidebarItem];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          backgroundColor: "#34734E",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: "30px",
          paddingRight: "30px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        {/* LEFT - BACK ARROW */}
        <FiArrowLeft
          size={26}
          color="#1a3a2e"
          style={{ cursor: "pointer", position: "absolute", left: "30px" }}
          onClick={onBackClick}
        />

        {/* SEARCH BAR - CENTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#5a8e7e",
            padding: "6px 12px",
            borderRadius: "6px",
            width: "350px",
            height: "32px",
          }}
        >
          <FiSearch size={18} color="#ffffff" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm"
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#ffffff",
              fontSize: "16px",
              outline: "none",
              flex: 1,
            }}
          />
        </div>

        {/* RIGHT ICONS - ABSOLUTE POSITION */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            position: "absolute",
            right: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "4px",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ShoppingCartIcon />
            <span
              style={{ color: "#1a3a2e", fontSize: "14px", fontWeight: "500" }}
            >
              Đơn hàng đang mua
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "4px",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <OrderHistoryIcon />
            <span
              style={{ color: "#1a3a2e", fontSize: "14px", fontWeight: "500" }}
            >
              Lịch sử đơn hàng
            </span>
          </div>
          <FiBell size={18} color="#1a3a2e" style={{ cursor: "pointer" }} />
          <FiUser size={18} color="#1a3a2e" style={{ cursor: "pointer" }} />
        </div>
      </div>

      {/* MAIN CONTENT WITH SIDEBAR */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: collapsed ? 56 : 180,
            backgroundColor: "#6db895",
            padding: "38px 0px",
            boxSizing: "border-box",
            position: "relative",
            transition: "width 0.3s ease",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* COLLAPSE BUTTON */}
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 16,
              height: 58,
              background: "rgba(250, 0, 167, 0.15)",
              backdropFilter: "blur(100px)",
              borderRadius: 4,
              position: "absolute",
              top: "calc(50%)",
              right: collapsed ? -1 : -1,
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "0.8px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
              transition: "all 0.3s ease",
              zIndex: 999,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <Arrow collapsed={collapsed} />
          </div>

          {/* SIDEBAR HEADER */}
          {!collapsed && (
            <div
              style={{
                padding: "0px 15px",
                marginBottom: "12px",
                marginTop: "-15px",
                fontWeight: "600",
                color: "#ffffff",
                textAlign: "center",
                fontSize: "20px",
                borderRadius: "4px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Phân Mục
            </div>
          )}

          {/* SIDEBAR ITEMS */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeSidebarItem === item.id;
              const isHovered = hoveredId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveSidebarItem(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0px 0px",
                    height: "38px",
                    marginBottom: "21px",
                    cursor: "pointer",
                    backgroundColor: isActive
                      ? "rgba(255, 255, 255, 0.2)"
                      : isHovered
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
                    borderLeft: isActive
                      ? "4px solid #ff69b4"
                      : "4px solid transparent",
                    borderRadius: "0px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      backgroundColor: "#34734E",
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 38,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        minWidth: 38,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isActive ? "#ffffff" : "#1a3a2e",
                        filter: isActive
                          ? "brightness(1.3) drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))"
                          : "brightness(0.8)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {item.isUrl ? (
                        <img
                          src={item.icon as string}
                          alt={item.label}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        (() => {
                          const IconComponent = item.icon as React.FC;
                          return <IconComponent />;
                        })()
                      )}
                    </div>
                  </div>
                  {!collapsed && (
                    <span
                      style={{
                        color: isActive ? "#ffffff" : "#1a3a2e",
                        fontSize: "16px",
                        fontWeight: isActive ? "3600" : "400",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div
          style={{
            flex: 1,
            padding: "0px",
            overflowY: "auto",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0px",
              padding: "clamp(1px, 50vw, 1px)",
              boxShadow: "none",
              minHeight: "calc(100vh - 100px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              color: "#999",
            }}
          >
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
