"use client";
import React from "react";
import { FiSettings, FiUser } from "react-icons/fi";

interface TrangChuAlubokProps {
  onBookClick: () => void;
  onBuyClick: () => void;
}

export default function TrangChuAlubok({
  onBookClick,
  onBuyClick,
}: TrangChuAlubokProps): React.ReactElement {
  return (
    <div className="w-full h-full bg-white overflow-auto">
      {/* TOP BAR */}
      <div
        style={{
          backgroundColor: "#5fc5a3",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: "30px",
          gap: "20px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FiSettings size={20} color="#1a4d3e" style={{ cursor: "pointer" }} />
        <FiUser size={20} color="#1a4d3e" style={{ cursor: "pointer" }} />
      </div>

      {/* HERO SECTION */}
      <div
        style={{
          background: "linear-gradient(135deg, #5a3f6a 0%, #4a2f5a 100%)",
          minHeight: "55vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          textAlign: "center",
          gap: "50px",
        }}
      >
        <div>
          <h1
            style={{
              color: "#ffffff",
              fontSize: "clamp(32px, 6vw, 56px)",
              fontWeight: "700",
              margin: "0 0 15px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Ứng dụng của tôi
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "clamp(14px, 2vw, 18px)",
              margin: "0",
              fontWeight: "400",
            }}
          >
            Khám phá những tính năng tuyệt vời
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "25px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onBookClick}
            style={{
              padding: "16px 50px",
              backgroundColor: "#d946a6",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 6px 20px rgba(217, 70, 166, 0.35)",
              letterSpacing: "0.5px",
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = "#e85bb8";
              target.style.transform = "translateY(-3px)";
              target.style.boxShadow = "0 8px 25px rgba(217, 70, 166, 0.45)";
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = "#d946a6";
              target.style.transform = "translateY(0)";
              target.style.boxShadow = "0 6px 20px rgba(217, 70, 166, 0.35)";
            }}
          >
            Book
          </button>

          <button
            onClick={onBuyClick}
            style={{
              padding: "16px 50px",
              backgroundColor: "#d946a6",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 6px 20px rgba(217, 70, 166, 0.35)",
              letterSpacing: "0.5px",
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = "#e85bb8";
              target.style.transform = "translateY(-3px)";
              target.style.boxShadow = "0 8px 25px rgba(217, 70, 166, 0.45)";
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = "#d946a6";
              target.style.transform = "translateY(0)";
              target.style.boxShadow = "0 6px 20px rgba(217, 70, 166, 0.35)";
            }}
          >
            Mua hàng
          </button>
        </div>
      </div>

      {/* COMMUNITY SECTION */}
      <div
        style={{
          backgroundColor: "#5fc5a3",
          minHeight: "45vh",
          padding: "80px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "30px",
        }}
      >
        <h2
          style={{
            color: "#1a4d3e",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: "700",
            margin: "0",
            letterSpacing: "-0.5px",
          }}
        >
          Cộng đồng
        </h2>
        <p
          style={{
            color: "#2d5d50",
            fontSize: "clamp(14px, 2vw, 18px)",
            margin: "0",
            maxWidth: "600px",
            lineHeight: "1.6",
            fontWeight: "400",
          }}
        >
          Tham gia cộng đồng của chúng tôi để kết nối, chia sẻ và học hỏi từ
          những người cùng quan tâm
        </p>
      </div>
    </div>
  );
}
