/**
 * File System Adapter
 * Persistence adapter using File System Access API (modern browsers)
 * Falls back to download/upload for unsupported browsers
 */

import { CadDocument } from "../../core/document/CadDocument";
import {
  IStorageAdapter,
  DocumentInfo,
  StorageOptions,
} from "./LocalStorageAdapter";

// ===== File Types =====
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
  handle?: FileSystemFileHandle;
}

export interface FileFilter {
  description: string;
  accept: Record<string, string[]>;
}

// ===== Default File Types =====
export const CAD_FILE_TYPES: FileFilter[] = [
  {
    description: "CAD Document",
    accept: { "application/json": [".cad", ".json"] },
  },
  {
    description: "DXF File",
    accept: { "application/dxf": [".dxf"] },
  },
  {
    description: "SVG File",
    accept: { "image/svg+xml": [".svg"] },
  },
];

// ===== FileSystem Adapter Implementation =====
export class FileSystemAdapter implements IStorageAdapter {
  private currentHandle: FileSystemFileHandle | null = null;
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private version: string;

  constructor(options: StorageOptions = {}) {
    this.version = options.version ?? "1.0.0";
  }

  // === Feature Detection ===
  static isSupported(): boolean {
    return "showOpenFilePicker" in window && "showSaveFilePicker" in window;
  }

  // === File Picker Operations ===
  async openFile(
    filters: FileFilter[] = CAD_FILE_TYPES
  ): Promise<FileInfo | null> {
    if (!FileSystemAdapter.isSupported()) {
      return this.openFileFallback(filters);
    }

    try {
      const [handle] = await (
        window as unknown as {
          showOpenFilePicker: (
            options: unknown
          ) => Promise<FileSystemFileHandle[]>;
        }
      ).showOpenFilePicker({
        types: filters,
        multiple: false,
      });

      this.currentHandle = handle;
      const file = await handle.getFile();

      return {
        name: file.name,
        path: handle.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        handle,
      };
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return null; // User cancelled
      }
      throw error;
    }
  }

  async saveFile(
    data: string | Blob,
    suggestedName = "document.cad",
    filters: FileFilter[] = CAD_FILE_TYPES
  ): Promise<FileInfo | null> {
    if (!FileSystemAdapter.isSupported()) {
      this.saveFileFallback(data, suggestedName);
      return null;
    }

    try {
      const handle = await (
        window as unknown as {
          showSaveFilePicker: (
            options: unknown
          ) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        types: filters,
        suggestedName,
      });

      this.currentHandle = handle;
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();

      const file = await handle.getFile();
      return {
        name: file.name,
        path: handle.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        handle,
      };
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return null;
      }
      throw error;
    }
  }

  async saveToCurrentFile(data: string | Blob): Promise<boolean> {
    if (!this.currentHandle) {
      return false;
    }

    try {
      const writable = await this.currentHandle.createWritable();
      await writable.write(data);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  // === Fallback for unsupported browsers ===
  private async openFileFallback(
    filters: FileFilter[]
  ): Promise<FileInfo | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";

      // Convert filters to accept attribute
      const accept = filters
        .flatMap((f) => Object.values(f.accept).flat())
        .join(",");
      input.accept = accept;

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        resolve({
          name: file.name,
          path: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified),
        });
      };

      input.click();
    });
  }

  private saveFileFallback(data: string | Blob, filename: string): void {
    const blob =
      typeof data === "string"
        ? new Blob([data], { type: "application/json" })
        : data;
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // === Read File Content ===
  async readFile(fileInfo: FileInfo): Promise<string> {
    if (fileInfo.handle) {
      const file = await fileInfo.handle.getFile();
      return file.text();
    }

    // For fallback files, we need to use FileReader
    throw new Error(
      "Cannot read file without handle. Use readFileFromInput for fallback."
    );
  }

  async readFileFromInput(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  // === Directory Operations ===
  async openDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!("showDirectoryPicker" in window)) {
      throw new Error("Directory picker not supported");
    }

    try {
      this.directoryHandle = await (
        window as unknown as {
          showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker();
      return this.directoryHandle;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return null;
      }
      throw error;
    }
  }

  async listDirectoryFiles(): Promise<FileInfo[]> {
    if (!this.directoryHandle) {
      throw new Error("No directory selected");
    }

    const files: FileInfo[] = [];

    for await (const entry of this.directoryHandle as unknown as AsyncIterable<
      FileSystemFileHandle | FileSystemDirectoryHandle
    >) {
      if ("getFile" in entry) {
        const file = await (entry as FileSystemFileHandle).getFile();
        files.push({
          name: file.name,
          path: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified),
          handle: entry as FileSystemFileHandle,
        });
      }
    }

    return files;
  }

  // === IStorageAdapter Implementation ===
  async saveDocument(id: string, document: CadDocument): Promise<void> {
    const data = JSON.stringify(
      {
        version: this.version,
        id,
        ...document.toJSON(),
      },
      null,
      2
    );

    await this.saveFile(data, `${document.metadata.title || id}.cad`);
  }

  async loadDocument(_id: string): Promise<CadDocument | null> {
    void _id; // File system uses file picker, not id
    const fileInfo = await this.openFile();
    if (!fileInfo) return null;

    try {
      const content = await this.readFile(fileInfo);
      const data = JSON.parse(content);

      // Note: Would need entityFactory for proper restoration
      const document = new CadDocument({ title: data.metadata?.title });
      return document;
    } catch (error) {
      console.error("Failed to load document:", error);
      return null;
    }
  }

  async deleteDocument(_id: string): Promise<void> {
    void _id; // File system doesn't support delete through web API
    throw new Error(
      "Delete not supported for file system. Use OS file manager."
    );
  }

  async listDocuments(): Promise<DocumentInfo[]> {
    if (!this.directoryHandle) {
      return [];
    }

    const files = await this.listDirectoryFiles();
    return files
      .filter((f) => f.name.endsWith(".cad") || f.name.endsWith(".json"))
      .map((f) => ({
        id: f.name,
        name: f.name.replace(/\.(cad|json)$/, ""),
        createdAt: f.lastModified,
        updatedAt: f.lastModified,
        size: f.size,
      }));
  }

  async save(key: string, data: unknown): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await this.saveFile(jsonString, `${key}.json`);
  }

  async load<T>(_key: string): Promise<T | null> {
    void _key; // File system uses file picker
    const fileInfo = await this.openFile([
      { description: "JSON File", accept: { "application/json": [".json"] } },
    ]);

    if (!fileInfo) return null;

    try {
      const content = await this.readFile(fileInfo);
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async delete(_key: string): Promise<void> {
    void _key;
    throw new Error("Delete not supported for file system.");
  }

  async exists(_key: string): Promise<boolean> {
    void _key; // Cannot check file existence through web API
    return false;
  }

  async list(_prefix?: string): Promise<string[]> {
    void _prefix; // File system lists all files in directory
    if (!this.directoryHandle) {
      return [];
    }

    const files = await this.listDirectoryFiles();
    return files.map((f) => f.name);
  }

  async clear(): Promise<void> {
    throw new Error("Clear not supported for file system.");
  }

  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await this.save("settings", settings);
  }

  async loadSettings(): Promise<Record<string, unknown>> {
    return (await this.load<Record<string, unknown>>("settings")) ?? {};
  }

  getUsedSpace(): number {
    return 0; // Not applicable for file system
  }

  getAvailableSpace(): number {
    return Infinity; // File system space managed by OS
  }

  // === Current File Info ===
  getCurrentFileHandle(): FileSystemFileHandle | null {
    return this.currentHandle;
  }

  getCurrentFileName(): string | null {
    return this.currentHandle?.name ?? null;
  }

  hasUnsavedChanges(): boolean {
    // Track in application state
    return false;
  }

  // === Export Utilities ===
  async exportToBlob(document: CadDocument): Promise<Blob> {
    const data = JSON.stringify(document.toJSON(), null, 2);
    return new Blob([data], { type: "application/json" });
  }

  async exportToSVG(
    svgContent: string,
    filename: string = "export.svg"
  ): Promise<void> {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    await this.saveFile(blob, filename, [
      { description: "SVG File", accept: { "image/svg+xml": [".svg"] } },
    ]);
  }

  async exportToPNG(
    dataUrl: string,
    filename: string = "export.png"
  ): Promise<void> {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    await this.saveFile(blob, filename, [
      { description: "PNG Image", accept: { "image/png": [".png"] } },
    ]);
  }

  async exportToJSON(
    data: unknown,
    filename: string = "export.json"
  ): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await this.saveFile(jsonString, filename, [
      { description: "JSON File", accept: { "application/json": [".json"] } },
    ]);
  }
}
