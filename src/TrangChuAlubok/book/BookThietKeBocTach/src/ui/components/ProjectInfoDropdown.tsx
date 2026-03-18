"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

export interface ProjectInfoData {
  name: string;
  investor?: string;
  investorPhone?: string;
  investorEmail?: string;
  houseNumber?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  projectType?: string;
  area?: number;
  startDate?: string;
  expectedEndDate?: string;
  notes?: string;
}

interface ProjectInfoDropdownProps {
  projectInfo: ProjectInfoData;
  onProjectInfoChange: (info: Partial<ProjectInfoData>) => void;
  sidebarLeftWidth?: number;
}

export default function ProjectInfoDropdown({
  projectInfo,
  onProjectInfoChange,
  sidebarLeftWidth = 250,
}: ProjectInfoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localInfo, setLocalInfo] = useState<ProjectInfoData>(projectInfo);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with external changes
  useEffect(() => {
    setLocalInfo(projectInfo);
  }, [projectInfo]);

  const handleSave = useCallback(() => {
    onProjectInfoChange(localInfo);
    setIsOpen(false);
  }, [localInfo, onProjectInfoChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          handleSave();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleSave]);

  const handleFieldChange = (
    field: keyof ProjectInfoData,
    value: string | number
  ) => {
    setLocalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const getFullAddress = () => {
    const parts = [
      localInfo.houseNumber,
      localInfo.street,
      localInfo.ward,
      localInfo.district,
      localInfo.city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Chưa có địa chỉ";
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: 8,
        left: sidebarLeftWidth + 12, // SidebarLeft width + margin
        zIndex: 50,
        transition: "left 0.1s ease",
      }}
    >
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "#1e1e2e",
          border: "1px solid #444",
          borderRadius: 4,
          padding: "6px 12px",
          cursor: "pointer",
          minWidth: 200,
        }}
      >
        <span style={{ color: "#888", fontSize: 12 }}>Tên dự án:</span>
        <span style={{ color: "#ddd", fontSize: 13, flex: 1 }}>
          {localInfo.name || "Untitle Project"}
        </span>
        <span
          style={{
            color: "#888",
            fontSize: 10,
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            backgroundColor: "#1e1e2e",
            border: "1px solid #444",
            borderRadius: 6,
            padding: 16,
            minWidth: 380,
            maxHeight: "55vh",
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <h3
            style={{
              color: "#4a90d9",
              fontSize: 14,
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            📋 Thông tin dự án
          </h3>

          {/* Tên dự án */}
          <FormField
            label="Tên dự án *"
            value={localInfo.name}
            onChange={(v) => handleFieldChange("name", v)}
            placeholder="Nhập tên dự án..."
          />

          {/* Loại công trình */}
          <FormField
            label="Loại công trình"
            value={localInfo.projectType || ""}
            onChange={(v) => handleFieldChange("projectType", v)}
            placeholder="Nhà ở, văn phòng, showroom..."
          />

          {/* Diện tích — read-only, auto-calculated from CAD entities */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#888', fontSize: 11, display: 'block', marginBottom: 4 }}>
              Diện tích (m²) — tự động tính từ bản vẽ
            </label>
            <div style={{
              width: '100%', backgroundColor: '#1a1a2e', border: '1px solid #333',
              borderRadius: 4, padding: '6px 10px', color: '#888', fontSize: 12,
            }}>
              {localInfo.area ? `${localInfo.area} m²` : 'Chưa có dữ liệu'}
            </div>
          </div>

          <Divider label="Chủ đầu tư" />

          {/* Chủ đầu tư */}
          <FormField
            label="Tên chủ đầu tư"
            value={localInfo.investor || ""}
            onChange={(v) => handleFieldChange("investor", v)}
            placeholder="Nhập tên chủ đầu tư..."
          />

          {/* SĐT Chủ đầu tư */}
          <FormField
            label="Số điện thoại"
            value={localInfo.investorPhone || ""}
            onChange={(v) => handleFieldChange("investorPhone", v)}
            placeholder="0xxx xxx xxx"
          />

          {/* Email Chủ đầu tư */}
          <FormField
            label="Email"
            value={localInfo.investorEmail || ""}
            onChange={(v) => handleFieldChange("investorEmail", v)}
            placeholder="email@example.com"
          />

          <Divider label="Địa chỉ công trình" />

          {/* Số nhà */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <FormField
                label="Số nhà"
                value={localInfo.houseNumber || ""}
                onChange={(v) => handleFieldChange("houseNumber", v)}
                placeholder="123"
              />
            </div>
            <div style={{ flex: 2 }}>
              <FormField
                label="Tên đường"
                value={localInfo.street || ""}
                onChange={(v) => handleFieldChange("street", v)}
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          {/* Phường/Quận */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <FormField
                label="Phường/Xã"
                value={localInfo.ward || ""}
                onChange={(v) => handleFieldChange("ward", v)}
                placeholder="Phường 1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <FormField
                label="Quận/Huyện"
                value={localInfo.district || ""}
                onChange={(v) => handleFieldChange("district", v)}
                placeholder="Quận 1"
              />
            </div>
          </div>

          {/* Thành phố */}
          <FormField
            label="Thành phố/Tỉnh"
            value={localInfo.city || ""}
            onChange={(v) => handleFieldChange("city", v)}
            placeholder="TP. Hồ Chí Minh"
          />

          {/* Preview địa chỉ */}
          <div
            style={{
              backgroundColor: "#252535",
              padding: 8,
              borderRadius: 4,
              marginTop: 8,
              marginBottom: 12,
            }}
          >
            <span style={{ color: "#888", fontSize: 11 }}>Địa chỉ: </span>
            <span style={{ color: "#ddd", fontSize: 12 }}>
              {getFullAddress()}
            </span>
          </div>

          <Divider label="Thời gian" />

          {/* Ngày bắt đầu / kết thúc */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <FormField
                label="Ngày bắt đầu"
                value={localInfo.startDate || ""}
                onChange={(v) => handleFieldChange("startDate", v)}
                type="date"
              />
            </div>
            <div style={{ flex: 1 }}>
              <FormField
                label="Ngày hoàn thành (dự kiến)"
                value={localInfo.expectedEndDate || ""}
                onChange={(v) => handleFieldChange("expectedEndDate", v)}
                type="date"
              />
            </div>
          </div>

          <Divider label="Ghi chú" />

          {/* Ghi chú */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                color: "#888",
                fontSize: 11,
                display: "block",
                marginBottom: 4,
              }}
            >
              Ghi chú thêm
            </label>
            <textarea
              value={localInfo.notes || ""}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Thông tin bổ sung về dự án..."
              style={{
                width: "100%",
                minHeight: 60,
                backgroundColor: "#252535",
                border: "1px solid #444",
                borderRadius: 4,
                padding: 8,
                color: "#ddd",
                fontSize: 12,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              onClick={() => {
                setLocalInfo(projectInfo);
                setIsOpen(false);
              }}
              style={{
                padding: "6px 16px",
                backgroundColor: "transparent",
                border: "1px solid #555",
                borderRadius: 4,
                color: "#888",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "6px 16px",
                backgroundColor: "#4a90d9",
                border: "none",
                borderRadius: 4,
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Lưu thông tin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          color: "#888",
          fontSize: 11,
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          backgroundColor: "#252535",
          border: "1px solid #444",
          borderRadius: 4,
          padding: "6px 10px",
          color: "#ddd",
          fontSize: 12,
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#4a90d9")}
        onBlur={(e) => (e.target.style.borderColor = "#444")}
      />
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "16px 0 12px 0",
      }}
    >
      <span
        style={{
          color: "#4a90d9",
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: "#333" }} />
    </div>
  );
}
