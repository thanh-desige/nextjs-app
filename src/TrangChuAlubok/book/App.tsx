"use client";
import React, { useState } from "react";
import {
  FiSettings,
  FiBell,
  FiUser,
  FiArrowLeft,
} from "react-icons/fi";
import Sidebar from "./Sidebar";
import TrangChuAlubok from "../TrangChuAlubok";
import MuaHangPage from "../MuaHangPage/MuaHangPage";
import DanhMucPage from "./DanhMuc/src/ui/DanhMucPage";
import ThietLapPage from "./ThietLap/src/ui/ThietLapPage";

import BookTongQuanPage from "./BookTongQuan/src/ui/BookTongQuanPage";
import BookMuaHangPage from "./BookMuaHang/src/ui/BookMuaHangPage";
import BookBanHangPage from "./BookBanHang/src/ui/BookBanHangPage";
import BookThietKeBocTach from "./BookThietKeBocTach";
import BookThuChiPage from "./BookThuChi/src/ui/BookThuChiPage";
import BookTonKhoPage from "./BookTonKho/src/ui/BookTonKhoPage";
import BookKeToanPage from "./BookKeToan/src/ui/BookKeToanPage";
import BookSanXuatThiCongPage from "./BookSanXuatThiCong/src/ui/BookSanXuatThiCongPage";
import { useRouteSync } from "./navigation";

export default function App(): React.ReactElement {
  const { page, tab, isInDashboard, navigateToPage, navigateToTab, navigateToHome } = useRouteSync();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Fullscreen shop khi vào từ trang chủ (TrangChuAlubok)
  const [isMuaHangShop, setIsMuaHangShop] = useState(false);

  const goToMuaHang = (): void => {
    setIsMuaHangShop(true);
  };

  const goToHome = (): void => {
    setIsMuaHangShop(false);
    navigateToHome();
  };

  // Nếu đang ở trang Mua hàng shop fullscreen (từ trang chủ)
  if (isMuaHangShop) {
    return <MuaHangPage onBackClick={goToHome} />;
  }

  // Nếu chưa vào dashboard, hiển thị TrangChuAlubok fullscreen
  if (!isInDashboard) {
    return (
      <TrangChuAlubok
        onBookClick={() => navigateToPage(1)}
        onBuyClick={goToMuaHang}
      />
    );
  }

  // Nếu đã vào dashboard, hiển thị header + sidebar + content
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
      <header
        style={{
          width: "100%",
          height: "38px",
          backgroundColor: "#2d3129",
          borderBottom: "1px solid rgba(250, 0, 167, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "8px",
          paddingRight: "20px",
          boxSizing: "border-box",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
          gap: "15px",
        }}
      >
        {/* LEFT - BACK ARROW */}
        <FiArrowLeft
          size={22}
          color="#000000"
          style={{ cursor: "pointer", marginRight: "auto" }}
          onClick={goToHome}
        />

        {/* RIGHT ICONS */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {/* SETTINGS ICON */}
          <FiSettings size={22} color="#000000" style={{ cursor: "pointer" }} />

          {/* BELL ICON */}
          <FiBell size={22} color="#000000" style={{ cursor: "pointer" }} />

          {/* USER ICON */}
          <FiUser size={22} color="#000000" style={{ cursor: "pointer" }} />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Sidebar
          active={page}
          onSelect={navigateToPage}
          onCollapse={setSidebarCollapsed}
        />
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: page === 1 || page === 2 || page === 3 || page === 4 || page === 5 || page === 6 || page === 7 || page === 8 || page === 9 || page === 10 ? "hidden" : "auto",
          }}
        >
          {page === 1 && <BookTongQuanPage onNavigate={(p, t) => { navigateToPage(p); if (t) navigateToTab(t); }} />}
          {page === 2 && <BookMuaHangPage activeTab={tab ?? 'orders'} onTabChange={navigateToTab} />}
          {page === 3 && <BookBanHangPage activeTab={tab ?? 'quotes'} onTabChange={navigateToTab} />}
          {page === 4 && (
            <BookThietKeBocTach sidebarCollapsed={sidebarCollapsed} />
          )}
          {page === 5 && <BookThuChiPage activeTab={tab ?? 'receipts'} onTabChange={navigateToTab} />}
          {page === 6 && <BookTonKhoPage activeTab={tab ?? 'receipts'} onTabChange={navigateToTab} />}
          {page === 7 && <DanhMucPage activeTab={tab ?? 'customer'} onTabChange={navigateToTab} />}
          {page === 8 && <ThietLapPage activeTab={tab ?? 'users'} onTabChange={navigateToTab} />}
          {page === 9 && <BookKeToanPage activeTab={tab ?? 'vouchers'} onTabChange={navigateToTab} />}
          {page === 10 && <BookSanXuatThiCongPage />}
        </div>
      </div>
    </div>
  );
}
