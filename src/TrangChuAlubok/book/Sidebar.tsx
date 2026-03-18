"use client";
import React, { useState } from "react";

// Icon Components
const IconTongQuan = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M33 32H11.6222C10.0043 32 9.19532 32 8.57736 31.6925C8.03377 31.4221 7.59183 30.9904 7.31487 30.4596C7 29.8562 7 29.0661 7 27.4861V6M11.6222 15.0264V27.9736M17.4889 21.5V27.9736M23.3556 18.2632V27.9736M29.2222 12.2632V27.9736"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconMuaHang = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M25.6753 15.1V11.2C25.6753 8.32812 23.1344 6 20 6C16.8656 6 14.3247 8.32812 14.3247 11.2V15.1M8.07047 16.8576L7.21918 25.1776C6.97714 27.5432 6.85611 28.7259 7.28451 29.6396C7.66086 30.4421 8.32036 31.1057 9.15732 31.5239C10.1101 32 11.4067 32 13.9998 32H26.0001C28.5933 32 29.8898 32 30.8426 31.5239C31.6795 31.1057 32.3391 30.4421 32.7154 29.6396C33.1439 28.7259 33.0229 27.5432 32.7808 25.1776L31.9295 16.8576C31.7251 14.86 31.6229 13.8612 31.1326 13.106C30.7008 12.441 30.0628 11.9086 29.2999 11.5768C28.4335 11.2 27.3386 11.2 25.1488 11.2H14.8511C12.6614 11.2 11.5665 11.2 10.7002 11.5768C9.93717 11.9086 9.29919 12.441 8.86737 13.106C8.37707 13.8612 8.27487 14.8599 8.07047 16.8576Z"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconBanHang = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M10.9131 21.6H28.0462C29.3672 21.6 30.0277 21.6 30.5535 21.3546C31.0168 21.1382 31.406 20.791 31.6727 20.3562C31.9755 19.8623 32.0485 19.208 32.1944 17.8994L32.9574 11.0549C33.002 10.6551 33.0242 10.4553 32.9598 10.3006C32.9032 10.1648 32.802 10.0521 32.6727 9.98096C32.5256 9.9 32.3238 9.9 31.9204 9.9H10.261M7 6H8.62835C8.9735 6 9.14607 6 9.28109 6.06542C9.39995 6.12302 9.49845 6.21524 9.56354 6.32989C9.63747 6.46012 9.64823 6.63179 9.66976 6.97513L10.8518 25.8249C10.8733 26.1682 10.8841 26.3399 10.958 26.4701C11.0231 26.5847 11.1216 26.677 11.2404 26.7346C11.3755 26.8 11.548 26.8 11.8932 26.8H29.1732M14.1737 31.35H14.1867M25.9125 31.35H25.9255M14.8258 31.35C14.8258 31.7089 14.5339 32 14.1737 32C13.8135 32 13.5215 31.7089 13.5215 31.35C13.5215 30.9911 13.8135 30.7 14.1737 30.7C14.5339 30.7 14.8258 30.9911 14.8258 31.35ZM26.5646 31.35C26.5646 31.7089 26.2726 32 25.9125 32C25.5524 32 25.2603 31.7089 25.2603 31.35C25.2603 30.9911 25.5524 30.7 25.9125 30.7C26.2726 30.7 26.5646 30.9911 26.5646 31.35Z"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconThietKeBocTach = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M11.0444 25.0223H29.1M11.0444 25.0223L14.8 20.2667M11.0444 25.0223L14.8 29.7778M29.1 25.0223L25.2 20.2667M29.1 25.0223L25.2 29.7778M33 32V25.0223V18.3542M7 32V25.1771V18.3542M20 6V18.6815M20 6H14.8M20 6H25.2"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconThuChi = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M25.7778 13.6623V8.72613C25.7778 7.55288 25.7778 6.96625 25.5247 6.60575C25.3036 6.29078 24.9611 6.0768 24.5757 6.01275C24.1344 5.93942 23.589 6.18525 22.4982 6.67691L9.68524 12.452C8.7124 12.8905 8.22597 13.1097 7.86971 13.4497C7.55475 13.7503 7.31434 14.1173 7.16683 14.5225C7 14.9809 7 15.5041 7 16.5504V23.5364M26.5 22.8311H26.5144M7 18.1762V27.4861C7 29.0661 7 29.8562 7.31487 30.4596C7.59183 30.9904 8.03377 31.4221 8.57736 31.6925C9.19532 32 10.0043 32 11.6222 32H28.3778C29.9957 32 30.8047 32 31.4227 31.6925C31.9662 31.4221 32.4082 30.9904 32.6851 30.4596C33 29.8562 33 29.0661 33 27.4861V18.1762C33 16.5962 33 15.8062 32.6851 15.2027C32.4082 14.6718 31.9662 14.2403 31.4227 13.9698C30.8047 13.6623 29.9957 13.6623 28.3778 13.6623H11.6222C10.0043 13.6623 9.19532 13.6623 8.57736 13.9698C8.03379 14.2403 7.59183 14.6718 7.31487 15.2027C7 15.8062 7 16.5962 7 18.1762ZM27.2222 22.8311C27.2222 23.2207 26.8988 23.5364 26.5 23.5364C26.1012 23.5364 25.7778 23.2207 25.7778 22.8311C25.7778 22.4417 26.1012 22.1258 26.5 22.1258C26.8988 22.1258 27.2222 22.4417 27.2222 22.8311Z"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTonKho = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M20.6842 7.36842H26.4316C28.7308 7.36842 29.8803 7.36842 30.7585 7.81587C31.531 8.20945 32.159 8.83748 32.5525 9.60994C33 10.4881 33 11.6377 33 13.9368V25.4316C33 27.7308 33 28.8803 32.5525 29.7585C32.159 30.531 31.531 31.159 30.7585 31.5525C29.8803 32 28.7308 32 26.4316 32H14.9368C12.6377 32 11.4881 32 10.6099 31.5525C9.83748 31.159 9.20945 30.531 8.81587 29.7585C8.36842 28.8803 8.36842 27.7308 8.36842 25.4316V19.6842M15.2105 21.0526V26.5263M26.1579 18.3158V26.5263M20.6842 12.8421V26.5263M11.1053 14.2105V6M7 10.1053H15.2105"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDanhMuc = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M10 10H22M10 16H30M10 22H26M10 28H18"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="28" cy="10" r="2" fill="black" />
  </svg>
);

const IconThietLap = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M20 24C22.7614 24 25 21.7614 25 19C25 16.2386 22.7614 14 20 14C17.2386 14 15 16.2386 15 19C15 21.7614 17.2386 24 20 24Z"
      stroke="black"
      strokeWidth="2"
    />
    <path
      d="M20 8V10M20 28V30M12 19H10M30 19H28M13.5 11.5L15 13M25 25L26.5 26.5M26.5 11.5L25 13M15 25L13.5 26.5"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconKeToan = () => (
  <svg
    width="40"
    height="38"
    viewBox="0 0 40 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H40V38H4C1.79086 38 0 36.2091 0 34V4Z"
      fill="#386D30"
    />
    <path
      d="M10 8H30V30H10V8Z"
      stroke="black"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M14 14H26M14 19H26M14 24H22"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 8L13 6H33V28L30 30"
      stroke="black"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

interface MenuItem {
  id: number;
  name: string;
  icon: React.ReactNode;
}

const MENU: MenuItem[] = [
  { id: 1, name: "Tổng quan", icon: <IconTongQuan /> },
  { id: 2, name: "Mua hàng", icon: <IconMuaHang /> },
  { id: 3, name: "Bán hàng", icon: <IconBanHang /> },
  { id: 4, name: "Thiết kế & bóc tách", icon: <IconThietKeBocTach /> },
  { id: 5, name: "Thu - chi", icon: <IconThuChi /> },
  { id: 6, name: "Tồn kho", icon: <IconTonKho /> },
  { id: 7, name: "Danh mục", icon: <IconDanhMuc /> },
  { id: 8, name: "Thiết lập", icon: <IconThietLap /> },
  { id: 9, name: "Kế toán", icon: <IconKeToan /> },
];

interface ArrowProps {
  collapsed: boolean;
}

const Arrow = ({ collapsed }: ArrowProps): React.ReactElement => (
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

interface SidebarProps {
  active: number;
  onSelect: (id: number) => void;
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({
  active,
  onSelect,
  onCollapse,
}: SidebarProps): React.ReactElement {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  return (
    <div
      style={{
        width: collapsed ? 47 : 180,
        minWidth: collapsed ? 47 : 180,
        height: "100%",
        background: "linear-gradient(180deg, #3a4238 0%, #2d3129 100%)",
        padding: "10px 6",
        boxSizing: "border-box",
        position: "relative",
        transition: "width 0.3s ease, min-width 0.3s ease",
        display: "flex",
        flexDirection: "column",
        boxShadow: "1px 0 10px rgba(0, 0, 0, 0.3)",
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* COLLAPSE BUTTON */}
      <div
        onClick={handleCollapse}
        style={{
          width: 16,
          height: 45,
          background: "rgba(250, 0, 167, 0.15)",
          backdropFilter: "blur(100px)",
          borderRadius: 4,
          position: "absolute",
          top: "calc(50%)",
          right: collapsed ? -8 : -8,
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: "0.8px solid rgba(250, 0, 167, 0.4)",
          boxShadow:
            "0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)",
          transition: "all 0.3s ease",
          zIndex: 999,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(250, 0, 167, 0.25)";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(250, 0, 167, 0.15)";
          e.currentTarget.style.transform = "translateY(-50%) scale(1)";
        }}
      >
        <Arrow collapsed={collapsed} />
      </div>

      {/* MENU ITEMS */}
      <div style={{ flex: 1, overflow: "auto", marginTop: "12mm" }}>
        {MENU.map((item) => {
          const isActive = active === item.id;
          const isHovered = hoveredId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0",
                marginBottom: 25,
                borderRadius: 0,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: isActive
                  ? "rgba(250, 0, 167, 0.15)"
                  : isHovered
                  ? "rgba(250, 0, 167, 0.08)"
                  : "transparent",
                borderLeft: isActive
                  ? "3px solid #fa00a7"
                  : isHovered
                  ? "3px solid rgba(250, 0, 167, 0.5)"
                  : "3px solid transparent",
                transform: isHovered ? "translateX(4px)" : "translateX(0)",
              }}
            >
              {/* ICON */}
              <div
                style={{
                  width: 40,
                  height: 38,
                  minWidth: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  filter: isActive
                    ? "brightness(1.3) drop-shadow(0 0 2px rgba(250, 0, 167, 0.5))"
                    : "brightness(1)",
                  transition: "all 0.2s ease",
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}
              >
                {item.icon}
              </div>

              {/* TEXT */}
              {!collapsed && (
                <span
                  style={{
                    flex: 1,
                    color: isActive ? "#fa00a7" : "rgba(255, 255, 255, 0.8)",
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 500,
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
