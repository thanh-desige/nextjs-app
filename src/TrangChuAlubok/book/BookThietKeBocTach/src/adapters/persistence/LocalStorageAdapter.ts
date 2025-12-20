/**
 * Local Storage Adapter
 * Persistence adapter using browser's localStorage
 */

import { CadDocument } from "../../core/document/CadDocument";

// ===== Storage Types =====
export interface StorageItem {
  key: string;
  data: unknown;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    size: number;
  };
}

export interface StorageOptions {
  prefix?: string; // Key prefix for namespacing
  version?: string; // Version for migration
  compress?: boolean; // Compress data (future)
  encrypt?: boolean; // Encrypt data (future)
}

export interface DocumentInfo {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
  thumbnail?: string;
}

// ===== Storage Adapter Interface =====
export interface IStorageAdapter {
  // === Document Operations ===
  saveDocument(id: string, document: CadDocument): Promise<void>;
  loadDocument(id: string): Promise<CadDocument | null>;
  deleteDocument(id: string): Promise<void>;
  listDocuments(): Promise<DocumentInfo[]>;

  // === Generic Data Operations ===
  save(key: string, data: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;

  // === Settings ===
  saveSettings(settings: Record<string, unknown>): Promise<void>;
  loadSettings(): Promise<Record<string, unknown>>;

  // === Storage Info ===
  getUsedSpace(): number;
  getAvailableSpace(): number;
}

// ===== LocalStorage Adapter Implementation =====
export class LocalStorageAdapter implements IStorageAdapter {
  private prefix: string;
  private version: string;

  private readonly DOCUMENTS_KEY = "documents";
  private readonly SETTINGS_KEY = "settings";
  private readonly METADATA_SUFFIX = "_meta";

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? "cad_";
    this.version = options.version ?? "1.0.0";
  }

  // === Key Management ===
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getDocumentKey(id: string): string {
    return this.getKey(`${this.DOCUMENTS_KEY}_${id}`);
  }

  // === Document Operations ===
  async saveDocument(id: string, document: CadDocument): Promise<void> {
    const key = this.getDocumentKey(id);
    const data = document.toJSON();
    const jsonString = JSON.stringify(data);

    const metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: this.version,
      size: jsonString.length,
    };

    try {
      localStorage.setItem(key, jsonString);
      localStorage.setItem(
        key + this.METADATA_SUFFIX,
        JSON.stringify(metadata)
      );

      // Update document index
      await this.updateDocumentIndex(id, document.metadata.title, metadata);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new Error(
          "Storage quota exceeded. Please delete some files to free up space."
        );
      }
      throw error;
    }
  }

  async loadDocument(id: string): Promise<CadDocument | null> {
    const key = this.getDocumentKey(id);
    const jsonString = localStorage.getItem(key);

    if (!jsonString) {
      return null;
    }

    try {
      const data = JSON.parse(jsonString);
      // Note: You would need to provide an entityFactory here
      // For now, we'll create a basic document and manually restore data
      const document = new CadDocument({ title: data.metadata?.title });
      // document would need proper restoration with entityFactory
      return document;
    } catch (error) {
      console.error("Failed to parse document:", error);
      return null;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    const key = this.getDocumentKey(id);
    localStorage.removeItem(key);
    localStorage.removeItem(key + this.METADATA_SUFFIX);

    // Update document index
    await this.removeFromDocumentIndex(id);
  }

  async listDocuments(): Promise<DocumentInfo[]> {
    const indexKey = this.getKey("document_index");
    const indexJson = localStorage.getItem(indexKey);

    if (!indexJson) {
      return [];
    }

    try {
      const index = JSON.parse(indexJson) as DocumentInfo[];
      return index.map((doc) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }));
    } catch {
      return [];
    }
  }

  private async updateDocumentIndex(
    id: string,
    name: string,
    metadata: { createdAt: string; updatedAt: string; size: number }
  ): Promise<void> {
    const indexKey = this.getKey("document_index");
    const indexJson = localStorage.getItem(indexKey);

    let index: DocumentInfo[] = [];
    if (indexJson) {
      try {
        index = JSON.parse(indexJson);
      } catch {
        index = [];
      }
    }

    // Find existing or add new
    const existingIndex = index.findIndex((doc) => doc.id === id);
    const docInfo: DocumentInfo = {
      id,
      name,
      createdAt:
        existingIndex >= 0
          ? index[existingIndex].createdAt
          : new Date(metadata.createdAt),
      updatedAt: new Date(metadata.updatedAt),
      size: metadata.size,
    };

    if (existingIndex >= 0) {
      index[existingIndex] = docInfo;
    } else {
      index.push(docInfo);
    }

    localStorage.setItem(indexKey, JSON.stringify(index));
  }

  private async removeFromDocumentIndex(id: string): Promise<void> {
    const indexKey = this.getKey("document_index");
    const indexJson = localStorage.getItem(indexKey);

    if (!indexJson) return;

    try {
      let index: DocumentInfo[] = JSON.parse(indexJson);
      index = index.filter((doc) => doc.id !== id);
      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch {
      // Ignore parse errors
    }
  }

  // === Generic Data Operations ===
  async save(key: string, data: unknown): Promise<void> {
    const fullKey = this.getKey(key);
    const jsonString = JSON.stringify(data);

    const metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: this.version,
      size: jsonString.length,
    };

    try {
      localStorage.setItem(fullKey, jsonString);
      localStorage.setItem(
        fullKey + this.METADATA_SUFFIX,
        JSON.stringify(metadata)
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new Error("Storage quota exceeded.");
      }
      throw error;
    }
  }

  async load<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const jsonString = localStorage.getItem(fullKey);

    if (!jsonString) {
      return null;
    }

    try {
      return JSON.parse(jsonString) as T;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    localStorage.removeItem(fullKey);
    localStorage.removeItem(fullKey + this.METADATA_SUFFIX);
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  async list(prefix?: string): Promise<string[]> {
    const keys: string[] = [];
    const searchPrefix = this.getKey(prefix ?? "");

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith(searchPrefix) &&
        !key.endsWith(this.METADATA_SUFFIX)
      ) {
        // Remove the adapter prefix to return clean keys
        keys.push(key.substring(this.prefix.length));
      }
    }

    return keys;
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  // === Settings ===
  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await this.save(this.SETTINGS_KEY, settings);
  }

  async loadSettings(): Promise<Record<string, unknown>> {
    const settings = await this.load<Record<string, unknown>>(
      this.SETTINGS_KEY
    );
    return settings ?? {};
  }

  // === Storage Info ===
  getUsedSpace(): number {
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key) ?? "";
        // Approximate: 2 bytes per character in UTF-16
        total += (key.length + value.length) * 2;
      }
    }

    return total;
  }

  getAvailableSpace(): number {
    // localStorage is typically 5-10MB, estimate 5MB
    const estimatedTotal = 5 * 1024 * 1024;
    return estimatedTotal - this.getUsedSpace();
  }

  // === Utility ===
  getMetadata(key: string): StorageItem["metadata"] | null {
    const metaKey = this.getKey(key) + this.METADATA_SUFFIX;
    const metaJson = localStorage.getItem(metaKey);

    if (!metaJson) return null;

    try {
      return JSON.parse(metaJson);
    } catch {
      return null;
    }
  }

  // === Export/Import ===
  async exportAll(): Promise<string> {
    const data: Record<string, unknown> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith(this.prefix) &&
        !key.endsWith(this.METADATA_SUFFIX)
      ) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }
    }

    return JSON.stringify(data, null, 2);
  }

  async importAll(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString) as Record<string, unknown>;

      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      throw new Error("Invalid import data format");
    }
  }
}
