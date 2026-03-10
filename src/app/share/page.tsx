"use client";

import React, { useSyncExternalStore } from "react";
import {
  decodeShareSnapshot,
  type ShareSnapshot,
  type ShareTab,
  type SharePermission,
} from "../../TrangChuAlubok/book/BookThietKeBocTach/src/core/share/shareSerializer";
import type { LayerData } from "../../TrangChuAlubok/book/BookThietKeBocTach/src/core/document/Layer";

// ==================== Entity type helpers ====================

const ENTITY_TYPE_ALIASES: Record<string, string> = {
  line: "LINE",
  rect: "RECT",
  rectangle: "RECT",
  circle: "CIRCLE",
  arc: "ARC",
  ellipse: "ELLIPSE",
  polyline: "POLYLINE",
  text: "TEXT",
  dimension: "DIMENSION",
  block_ref: "BLOCK_REF",
  blockref: "BLOCK_REF",
  group: "GROUP",
  image: "IMAGE",
  hatch: "HATCH",
};

/**
 * Extract entity type from serialized entity JSON.
 * EntityRegistry serializes with key `entityType` (top-level)
 * and `geometry.type` (nested). Both hold the same value.
 */
function getEntityType(entity: Record<string, unknown>): string | null {
  // Primary: entityType (EntityRegistry output)
  if (typeof entity.entityType === "string") return entity.entityType;
  // Fallback: geometry.type
  const geo = entity.geometry as Record<string, unknown> | undefined;
  if (geo && typeof geo.type === "string") return geo.type;
  // Legacy fallback: type
  if (typeof entity.type === "string") return entity.type;
  return null;
}

function normalizeEntityType(raw: string | null): string {
  if (!raw) return "MISSING_TYPE";
  const lower = raw.toLowerCase();
  return ENTITY_TYPE_ALIASES[lower] ?? raw.toUpperCase();
}

// ==================== Types ====================

const VALID_TABS = new Set<ShareTab>(["thiet-ke", "boc-tach", "bao-gia"]);
const VALID_PERMS = new Set<SharePermission>(["view", "edit"]);

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; snapshot: ShareSnapshot };

// ==================== Share Page ====================

function parseShareUrl(): ViewState {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    return {
      kind: "error",
      message: "Không tìm thấy dữ liệu chia sẻ. Link có thể đã hết hạn hoặc không hợp lệ.",
    };
  }
  const snapshot = decodeShareSnapshot(hash);
  if (!snapshot) {
    return {
      kind: "error",
      message: "Không thể giải mã dữ liệu. Link có thể bị hỏng.",
    };
  }

  // Override tab/perm from query params if present (authoritative source)
  const params = new URLSearchParams(window.location.search);
  const qTab = params.get("tab");
  const qPerm = params.get("perm");
  if (qTab && VALID_TABS.has(qTab as ShareTab)) {
    snapshot.tab = qTab as ShareTab;
  }
  if (qPerm && VALID_PERMS.has(qPerm as SharePermission)) {
    snapshot.perm = qPerm as SharePermission;
  }

  return { kind: "ready", snapshot };
}

// Cache the parsed result — URL hash never changes during page lifecycle.
// useSyncExternalStore requires getSnapshot to return a stable reference.
const LOADING_STATE: ViewState = { kind: "loading" };
let cachedState: ViewState | null = null;

function getClientSnapshot(): ViewState {
  if (!cachedState) {
    cachedState = parseShareUrl();
  }
  return cachedState;
}

const noopSubscribe = () => () => {};

export default function SharePage() {
  const state = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,  // client: cached parse result
    () => LOADING_STATE, // server: always "loading"
  );

  if (state.kind === "loading") return <LoadingView />;
  if (state.kind === "error") return <ErrorView message={state.message} />;

  return <SnapshotViewer snapshot={state.snapshot} />;
}

// ==================== Loading ====================

function LoadingView() {
  return (
    <div style={styles.center}>
      <div style={{ fontSize: 18, color: "#aaa" }}>Đang tải dữ liệu...</div>
    </div>
  );
}

// ==================== Error ====================

function ErrorView({ message }: { message: string }) {
  return (
    <div style={styles.center}>
      <div style={styles.errorCard}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Lỗi chia sẻ
        </div>
        <div style={{ fontSize: 14, color: "#999", textAlign: "center" }}>
          {message}
        </div>
      </div>
    </div>
  );
}

// ==================== Snapshot Viewer ====================

const TAB_LABELS: Record<string, string> = {
  "thiet-ke": "Thiết kế",
  "boc-tach": "Bóc tách (BOM)",
  "bao-gia": "Báo giá",
};

const PERM_LABELS: Record<string, string> = {
  view: "Chỉ xem",
  edit: "Cho chỉnh sửa",
};

function SnapshotViewer({ snapshot }: { snapshot: ShareSnapshot }) {
  const { tab, perm, title, doc, ts } = snapshot;

  return (
    <div style={styles.page}>
      {/* Header bar */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📐</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {TAB_LABELS[tab] || tab} · {PERM_LABELS[perm] || perm} ·{" "}
              {new Date(ts).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 4,
            backgroundColor: "#2d5a2d",
            color: "#4ae04a",
          }}
        >
          Snapshot
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {tab === "thiet-ke" && <DesignTab doc={doc} />}
        {tab === "boc-tach" && <BomTab doc={doc} />}
        {tab === "bao-gia" && <QuoteTab doc={doc} />}
      </main>
    </div>
  );
}

// ==================== Design Tab ====================

function DesignTab({
  doc,
}: {
  doc: ShareSnapshot["doc"];
}) {
  const entityCount = doc.entities?.length ?? 0;
  const layerCount = doc.layers?.length ?? 0;
  const dimensionCount = doc.dimensions?.length ?? 0;
  const doorCount = doc.doors?.length ?? 0;

  // Count by entity type + collect warnings
  const typeCounts: Record<string, number> = {};
  const missingTypeIds: string[] = [];
  for (const e of doc.entities ?? []) {
    const raw = e as Record<string, unknown>;
    const normalized = normalizeEntityType(getEntityType(raw));
    if (normalized === "MISSING_TYPE") {
      missingTypeIds.push((raw.id as string) ?? "no-id");
    }
    typeCounts[normalized] = (typeCounts[normalized] || 0) + 1;
  }

  const stats = { entityCount, layerCount, dimensionCount, doorCount, typeCounts, missingTypeIds };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard icon="📦" label="Entities" value={stats.entityCount} />
        <StatCard icon="📏" label="Dimensions" value={stats.dimensionCount} />
        <StatCard icon="🔲" label="Layers" value={stats.layerCount} />
        <StatCard icon="🚪" label="Doors" value={stats.doorCount} />
      </div>

      {/* Entity breakdown */}
      {Object.keys(stats.typeCounts).length > 0 && (
        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Chi tiết entity</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(stats.typeCounts).map(([type, count]) => (
              <div
                key={type}
                style={{
                  ...styles.tag,
                  ...(type === "MISSING_TYPE" ? { backgroundColor: "#5a2d2d", color: "#ff6b6b" } : {}),
                }}
              >
                {type}: {String(count)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Missing type warning */}
      {stats.missingTypeIds.length > 0 && (
        <section style={{ ...styles.card, borderColor: "#5a3333", backgroundColor: "#2e1e1e" }}>
          <h3 style={{ ...styles.sectionTitle, color: "#ff6b6b" }}>Entity missing type</h3>
          <div style={{ fontSize: 12, color: "#cc8888", wordBreak: "break-all" }}>
            IDs: {stats.missingTypeIds.join(", ")}
          </div>
        </section>
      )}

      {/* Layers list */}
      {(doc.layers?.length ?? 0) > 0 && (
        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Layers</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tên</th>
                <th style={styles.th}>Màu</th>
                <th style={styles.th}>Hiển thị</th>
              </tr>
            </thead>
            <tbody>
              {doc.layers.map((layer: LayerData, i: number) => (
                <tr key={i}>
                  <td style={styles.td}>{layer.name}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: layer.color ?? "#fff",
                        border: "1px solid #555",
                        verticalAlign: "middle",
                        marginRight: 6,
                      }}
                    />
                    {layer.color}
                  </td>
                  <td style={styles.td}>
                    {layer.state?.visible !== false ? "✓" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Entities data (JSON preview) */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Dữ liệu (JSON)</h3>
        <pre style={styles.jsonPre}>
          {JSON.stringify(doc, null, 2).slice(0, 5000)}
          {JSON.stringify(doc, null, 2).length > 5000 && "\n... (truncated)"}
        </pre>
      </section>
    </div>
  );
}

// ==================== BOM Tab ====================

function BomTab({ doc }: { doc: ShareSnapshot["doc"] }) {
  const doorCount = doc.doors?.length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Bóc tách vật liệu (BOM)</h3>
        <p style={{ color: "#999", fontSize: 13 }}>
          Dự án có {doorCount} cửa. Dữ liệu entities và dimensions đã được đính kèm trong snapshot.
        </p>
      </div>

      {/* Doors list */}
      {doorCount > 0 && (
        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Danh sách cửa</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Loại</th>
              </tr>
            </thead>
            <tbody>
              {doc.doors.map((door, i) => {
                const d = door as unknown as Record<string, unknown>;
                return (
                  <tr key={i}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{(d.id as string) ?? "—"}</td>
                    <td style={styles.td}>{(d.type as string) ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <div style={styles.card}>
        <pre style={styles.jsonPre}>
          {JSON.stringify({ doors: doc.doors, entities: doc.entities?.length }, null, 2).slice(0, 3000)}
        </pre>
      </div>
    </div>
  );
}

// ==================== Quote Tab ====================

function QuoteTab({ doc }: { doc: ShareSnapshot["doc"] }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.sectionTitle}>Báo giá</h3>
      <p style={{ color: "#999", fontSize: 13 }}>
        Tính năng báo giá đang được phát triển. Dữ liệu thiết kế ({doc.entities?.length ?? 0} entities,{" "}
        {doc.doors?.length ?? 0} cửa) đã được đính kèm trong snapshot.
      </p>
    </div>
  );
}

// ==================== Stat Card ====================

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div style={styles.statCard}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
    </div>
  );
}

// ==================== Styles ====================

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#0e0e1a",
    color: "#e0e0e0",
  },
  errorCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#1e1e2e",
    border: "1px solid #444",
    borderRadius: 12,
    maxWidth: 400,
  },
  page: {
    minHeight: "100vh",
    backgroundColor: "#0e0e1a",
    color: "#e0e0e0",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    backgroundColor: "#1a1a2e",
    borderBottom: "1px solid #333",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  main: {
    padding: 24,
    maxWidth: 900,
    margin: "0 auto",
  },
  card: {
    backgroundColor: "#1e1e2e",
    border: "1px solid #333",
    borderRadius: 8,
    padding: 16,
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "16px 24px",
    backgroundColor: "#1e1e2e",
    border: "1px solid #333",
    borderRadius: 8,
    minWidth: 100,
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: 14,
    fontWeight: 600,
    color: "#ccc",
  },
  tag: {
    padding: "4px 10px",
    borderRadius: 4,
    backgroundColor: "#252540",
    fontSize: 12,
    color: "#aaa",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: "1px solid #444",
    color: "#888",
    fontWeight: 500,
    fontSize: 12,
  },
  td: {
    padding: "6px 12px",
    borderBottom: "1px solid #2a2a3a",
    color: "#ccc",
  },
  jsonPre: {
    margin: 0,
    padding: 12,
    backgroundColor: "#12121f",
    borderRadius: 6,
    fontSize: 11,
    color: "#8a8aaa",
    overflow: "auto",
    maxHeight: 300,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
  },
};
