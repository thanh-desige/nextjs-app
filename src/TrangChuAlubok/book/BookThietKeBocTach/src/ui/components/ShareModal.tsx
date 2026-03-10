"use client";

import React, { useState } from "react";
import type { DocumentData } from "../../core/document/CadDocument.types";
import {
  encodeShareSnapshot,
  buildShareUrl,
  type ShareTab,
  type SharePermission,
} from "../../core/share/shareSerializer";

// ==================== Types ====================

export type { ShareTab, SharePermission };
export type ShareLinkType = "snapshot" | "project";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle?: string;
  /** Callback to get current document data for snapshot. If not provided, link generation is disabled. */
  getDocumentData?: () => DocumentData | null;
}

// ==================== ShareModal Component ====================

export function ShareModal({
  isOpen,
  onClose,
  projectTitle = "Dự án",
  getDocumentData,
}: ShareModalProps) {
  const [selectedTab, setSelectedTab] = useState<ShareTab>("thiet-ke");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [linkType, setLinkType] = useState<ShareLinkType>("snapshot");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tabs: { id: ShareTab; label: string; icon: string }[] = [
    { id: "thiet-ke", label: "Thiết kế", icon: "📐" },
    { id: "boc-tach", label: "Bóc tách (BOM)", icon: "📋" },
    { id: "bao-gia", label: "Báo giá", icon: "💰" },
  ];

  const handleGenerateLink = () => {
    if (!getDocumentData) return;
    const docData = getDocumentData();
    if (!docData) return;

    const encoded = encodeShareSnapshot({
      v: 1,
      tab: selectedTab,
      perm: permission,
      title: projectTitle,
      doc: docData,
      ts: new Date().toISOString(),
    });

    setGeneratedLink(buildShareUrl(window.location.origin, encoded, selectedTab, permission));
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const handleShareZalo = () => {
    if (!generatedLink) return;
    const text = encodeURIComponent(
      `${projectTitle} — ${tabs.find((t) => t.id === selectedTab)?.label}\n${generatedLink}`,
    );
    window.open(`https://zalo.me/share?url=${encodeURIComponent(generatedLink)}&title=${text}`, "_blank");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#1e1e2e",
          border: "1px solid #444",
          borderRadius: 12,
          width: 440,
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          color: "#e0e0e0",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #333",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Chia sẻ — {projectTitle}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: 20,
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* A) Chọn phạm vi share */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#aaa" }}>
              A) Phạm vi chia sẻ
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setSelectedTab(tab.id); setGeneratedLink(null); }}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 8,
                    border: selectedTab === tab.id ? "2px solid #4a9eff" : "1px solid #444",
                    backgroundColor: selectedTab === tab.id ? "#2a3a5a" : "#252535",
                    color: selectedTab === tab.id ? "#4a9eff" : "#ccc",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {/* B) Quyền */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#aaa" }}>
              B) Quyền truy cập
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {([
                { id: "view" as const, label: "Chỉ xem", desc: "Người nhận xem được nhưng không sửa" },
                { id: "edit" as const, label: "Cho chỉnh sửa", desc: "Người nhận có thể sửa trực tiếp" },
              ]).map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 6,
                    backgroundColor: permission === opt.id ? "#2a3a5a" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="share-perm"
                    checked={permission === opt.id}
                    onChange={() => { setPermission(opt.id); setGeneratedLink(null); }}
                    style={{ accentColor: "#4a9eff" }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#777" }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* C) Loại link */}
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#aaa" }}>
              C) Loại link
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {([
                {
                  id: "snapshot" as const,
                  label: "Link snapshot",
                  desc: "Mở được ngay, không cần đăng nhập",
                  badge: "Khuyên dùng",
                  enabled: true,
                },
                {
                  id: "project" as const,
                  label: "Link dự án",
                  desc: "Cần backend/login — sắp ra mắt",
                  badge: "Sắp có",
                  enabled: false,
                },
              ]).map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 6,
                    backgroundColor: linkType === opt.id ? "#2a3a5a" : "transparent",
                    cursor: opt.enabled ? "pointer" : "not-allowed",
                    opacity: opt.enabled ? 1 : 0.5,
                    transition: "background 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="share-link-type"
                    checked={linkType === opt.id}
                    onChange={() => { if (opt.enabled) { setLinkType(opt.id); setGeneratedLink(null); } }}
                    disabled={!opt.enabled}
                    style={{ accentColor: "#4a9eff" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {opt.label}
                      {opt.badge && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor: opt.enabled ? "#2d5a2d" : "#5a5a2d",
                          color: opt.enabled ? "#4ae04a" : "#e0d04a",
                        }}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#777" }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Generated Link */}
          {generatedLink && (
            <div style={{
              padding: "10px 12px",
              backgroundColor: "#1a2a1a",
              border: "1px solid #3a5a3a",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{
                fontSize: 12,
                color: "#4ae04a",
                wordBreak: "break-all",
                fontFamily: "monospace",
              }}>
                {generatedLink}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleCopyLink}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid #4a9eff",
                    backgroundColor: copied ? "#2d5a2d" : "#2a3a5a",
                    color: copied ? "#4ae04a" : "#4a9eff",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {copied ? "Đã copy!" : "Copy link"}
                </button>
                <button
                  onClick={handleShareZalo}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid #0068ff",
                    backgroundColor: "#0068ff",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Gửi qua Zalo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "12px 20px",
            borderTop: "1px solid #333",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "1px solid #555",
              backgroundColor: "transparent",
              color: "#ccc",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Đóng
          </button>
          <button
            onClick={handleGenerateLink}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#4a9eff",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Tạo link
          </button>
        </div>
      </div>
    </div>
  );
}
