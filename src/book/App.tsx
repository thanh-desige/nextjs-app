"use client";
import React, { useState } from "react";
import {
  FiMenu,
  FiSettings,
  FiBell,
  FiUser,
  FiArrowLeft,
} from "react-icons/fi";
import Sidebar from "../TrangChuAlubok/book/Sidebar";
import TrangChuAlubok from "../TrangChuAlubok/TrangChuAlubok";
import MuaHangPage from "../TrangChuAlubok/MuaHangPage/MuaHangPage";

import BookTongQuan from "../TrangChuAlubok/book/BookTongQuan";
import BookMuaHang from "../TrangChuAlubok/book/BookMuaHang";
import BookBanHang from "../TrangChuAlubok/book/BookBanHang";
import BookThietKeBocTach from "../TrangChuAlubok/book/BookThietKeBocTach";
import BookThuChi from "../TrangChuAlubok/book/BookThuChi";
import BookTonKho from "../TrangChuAlubok/book/BookTonKho";

export default function App() {
  const [page, setPage] = useState(0);
  const [isInDashboard, setIsInDashboard] = useState(false);

  const goToDashboard = (pageNum: number) => {
    setIsInDashboard(true);
    setPage(pageNum);
  };

  const goToMuaHang = () => {
    setIsInDashboard(false);
    setPage(99);
  };

  const goToHome = () => {
    setIsInDashboard(false);
    setPage(0);
  };

  // Nếu đang ở trang Mua hàng, hiển thị fullscreen
  if (page === 99) {
    return <MuaHangPage onBackClick={goToHome} />;
  }

  // Nếu chưa vào dashboard, hiển thị TrangChuAlubok fullscreen
  if (!isInDashboard) {
    return (
      <TrangChuAlubok
        onBookClick={() => goToDashboard(1)}
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
        width: "100vw",
        height: "100vh",
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
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar active={page} onSelect={setPage} />
        <div style={{ flex: 1, overflow: "auto", height: "100%" }}>
          {page === 1 && <BookTongQuan />}
          {page === 2 && <BookMuaHang />}
          {page === 3 && <BookBanHang />}
          {page === 4 && <BookThietKeBocTach />}
          {page === 5 && <BookThuChi />}
          {page === 6 && <BookTonKho />}
        </div>
      </div>
    </div>
  );
}
