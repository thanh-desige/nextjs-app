/**
 * ExportJSON — JSON export/import for CAD documents
 * Phase 5.1: Full project save/load with version control
 *
 * ĐIỀU KIỆN 1: Reads from CadDocument (source of truth)
 * Uses EntityRegistry serialization (serializeIEntity / deserializeIEntity)
 *
 * File format:
 * {
 *   formatVersion: "1.0.0",
 *   app: "alubok-cad",
 *   exportedAt: ISO string,
 *   document: DocumentData
 * }
 */

import { CadDocument } from "../document/CadDocument";
import type { DocumentData } from "../document/CadDocument.types";
import type { ExportResult } from "./ExportManager";

// ==================== File Format ====================

/** Version of the JSON file format. Bump on breaking changes. */
export const FORMAT_VERSION = "1.0.0";

/** App identifier embedded in exported files */
export const APP_ID = "alubok-cad";

/**
 * Top-level JSON file structure.
 * Wraps DocumentData with version/metadata for compatibility checks.
 */
export interface CadFileJSON {
  /** File format version (semver) */
  formatVersion: string;
  /** Application identifier */
  app: string;
  /** ISO timestamp of export */
  exportedAt: string;
  /** The actual document data */
  document: DocumentData;
}

// ==================== Export ====================

/**
 * Export a CadDocument to JSON string.
 *
 * @param document - The CadDocument to export
 * @param pretty - Whether to pretty-print (default: true)
 * @returns ExportResult with JSON string in `data`
 */
export function exportToJSON(
  document: CadDocument,
  pretty: boolean = true,
): ExportResult {
  try {
    const fileData: CadFileJSON = {
      formatVersion: FORMAT_VERSION,
      app: APP_ID,
      exportedAt: new Date().toISOString(),
      document: document.toJSON(),
    };

    const json = pretty
      ? JSON.stringify(fileData, null, 2)
      : JSON.stringify(fileData);

    const title = document.metadata.title || "untitled";

    return {
      success: true,
      data: json,
      filename: `${title}.cad.json`,
    };
  } catch (error) {
    return {
      success: false,
      error: `JSON export failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ==================== Import ====================

/**
 * Validate and extract CadFileJSON from a raw JSON string.
 * Returns the parsed structure or throws on invalid format.
 */
export function parseCadFileJSON(jsonString: string): CadFileJSON {
  const raw = JSON.parse(jsonString);

  // Validate top-level shape
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid JSON: expected object at root");
  }

  // Check for CadFileJSON wrapper (new format)
  if (raw.formatVersion && raw.document) {
    // Validate format version compatibility
    const major = parseInt(raw.formatVersion.split(".")[0], 10);
    const currentMajor = parseInt(FORMAT_VERSION.split(".")[0], 10);
    if (major > currentMajor) {
      throw new Error(
        `Incompatible file format version: ${raw.formatVersion} (current: ${FORMAT_VERSION}). ` +
        `Please update the application.`,
      );
    }
    return raw as CadFileJSON;
  }

  // Legacy format: raw DocumentData without wrapper
  // Wrap it in the new format for uniform handling
  if (raw.metadata && raw.entities) {
    return {
      formatVersion: "0.0.0", // Legacy marker
      app: "unknown",
      exportedAt: new Date().toISOString(),
      document: raw as DocumentData,
    };
  }

  throw new Error(
    "Invalid file format: missing 'formatVersion' + 'document' (new format) " +
    "or 'metadata' + 'entities' (legacy format)",
  );
}

/**
 * Import a CadDocument from a JSON string.
 *
 * Supports both:
 * - New format: CadFileJSON wrapper with formatVersion
 * - Legacy format: raw DocumentData
 *
 * @param jsonString - The JSON string to import
 * @returns The restored CadDocument
 */
export function importFromJSON(jsonString: string): CadDocument {
  const fileData = parseCadFileJSON(jsonString);
  // CadDocument.fromJSON now has a default entity factory
  return CadDocument.fromJSON(fileData.document);
}

/**
 * Import and return both the document and file metadata.
 */
export function importFromJSONFull(jsonString: string): {
  document: CadDocument;
  formatVersion: string;
  app: string;
  exportedAt: string;
} {
  const fileData = parseCadFileJSON(jsonString);
  const document = CadDocument.fromJSON(fileData.document);

  return {
    document,
    formatVersion: fileData.formatVersion,
    app: fileData.app,
    exportedAt: fileData.exportedAt,
  };
}

// ==================== Utilities ====================

/**
 * Validate a JSON string without fully importing.
 * Returns info about the file or an error message.
 */
export function validateCadJSON(jsonString: string): {
  valid: boolean;
  formatVersion?: string;
  entityCount?: number;
  title?: string;
  error?: string;
} {
  try {
    const fileData = parseCadFileJSON(jsonString);
    return {
      valid: true,
      formatVersion: fileData.formatVersion,
      entityCount: fileData.document.entities?.length ?? 0,
      title: fileData.document.metadata?.title,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
