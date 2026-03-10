/**
 * shareSerializer — Serialize/deserialize share snapshots via lz-string
 *
 * Encodes CadDocument data into a URL-safe compressed string for sharing.
 * Decodes compressed hash back into snapshot data for the /share page.
 */

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { DocumentData } from "../document/CadDocument.types";

// ==================== Types ====================

export type ShareTab = "thiet-ke" | "boc-tach" | "bao-gia";
export type SharePermission = "view" | "edit";

export interface ShareSnapshot {
  /** Format version for forward compatibility */
  v: 1;
  /** Which tab to display */
  tab: ShareTab;
  /** Permission level */
  perm: SharePermission;
  /** Project title */
  title: string;
  /** Serialized document data from CadDocument.toJSON() */
  doc: DocumentData;
  /** ISO timestamp of snapshot creation */
  ts: string;
}

// ==================== Encode / Decode ====================

/**
 * Encode a share snapshot into a URL-safe compressed string.
 * Use this as the URL hash fragment: `/share#<encoded>`
 */
export function encodeShareSnapshot(snapshot: ShareSnapshot): string {
  const json = JSON.stringify(snapshot);
  return compressToEncodedURIComponent(json);
}

/**
 * Decode a compressed string back into a ShareSnapshot.
 * Returns null if decompression or parsing fails.
 */
export function decodeShareSnapshot(encoded: string): ShareSnapshot | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed || parsed.v !== 1 || !parsed.tab || !parsed.doc) return null;
    return parsed as ShareSnapshot;
  } catch {
    return null;
  }
}

/**
 * Build a full share URL from origin + encoded snapshot.
 * Query params (tab, perm, type) are included for readability & routing.
 * Hash contains the compressed payload.
 */
export function buildShareUrl(
  origin: string,
  encoded: string,
  tab: ShareTab,
  perm: SharePermission,
): string {
  const params = new URLSearchParams({ tab, perm, type: "snapshot" });
  return `${origin}/share?${params.toString()}#${encoded}`;
}
