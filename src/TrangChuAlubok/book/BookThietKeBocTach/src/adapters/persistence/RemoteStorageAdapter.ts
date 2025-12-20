/**
 * Remote Storage Adapter
 * Persistence adapter for remote API storage
 */

import { CadDocument } from "../../core/document/CadDocument";
import {
  IStorageAdapter,
  DocumentInfo,
  StorageOptions,
} from "./LocalStorageAdapter";

// ===== API Configuration =====
export interface RemoteStorageConfig extends StorageOptions {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

export interface RemoteDocumentInfo extends DocumentInfo {
  ownerId: string;
  isShared: boolean;
  permissions: string[];
  version: number;
  tags: string[];
}

// ===== Request Options =====
export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

// ===== RemoteStorage Adapter Implementation =====
export class RemoteStorageAdapter implements IStorageAdapter {
  private config: Required<RemoteStorageConfig>;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: RemoteStorageConfig) {
    this.config = {
      prefix: config.prefix ?? "cad_",
      version: config.version ?? "1.0.0",
      compress: config.compress ?? false,
      encrypt: config.encrypt ?? false,
      baseUrl: config.baseUrl.replace(/\/$/, ""), // Remove trailing slash
      authToken: config.authToken ?? "",
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      headers: config.headers ?? {},
    };
  }

  // === Configuration ===
  setAuthToken(token: string): void {
    this.config.authToken = token;
  }

  getConfig(): Readonly<Required<RemoteStorageConfig>> {
    return { ...this.config };
  }

  // === HTTP Request Helper ===
  private async request<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const requestId = this.generateRequestId();

    // Create abort controller for timeout
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout ?? this.config.timeout);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...this.config.headers,
        ...options.headers,
      };

      if (this.config.authToken) {
        headers["Authorization"] = `Bearer ${this.config.authToken}`;
      }

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorData.message ?? response.statusText,
          },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            error: { code: "TIMEOUT", message: "Request timed out" },
          };
        }
        return {
          success: false,
          error: { code: "NETWORK_ERROR", message: error.message },
        };
      }

      return {
        success: false,
        error: { code: "UNKNOWN_ERROR", message: "An unknown error occurred" },
      };
    }
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    let lastError: ApiResponse<T> | null = null;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      const result = await this.request<T>(endpoint, options);

      if (result.success) {
        return result;
      }

      // Don't retry certain errors
      const noRetryErrors = [
        "UNAUTHORIZED",
        "FORBIDDEN",
        "NOT_FOUND",
        "VALIDATION_ERROR",
      ];
      if (result.error && noRetryErrors.includes(result.error.code)) {
        return result;
      }

      lastError = result;

      // Exponential backoff
      if (attempt < this.config.retries - 1) {
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return lastError!;
  }

  // === Document Operations ===
  async saveDocument(id: string, document: CadDocument): Promise<void> {
    const response = await this.requestWithRetry<{ id: string }>("/documents", {
      method: "PUT",
      body: {
        id,
        name: document.metadata.title,
        content: document.toJSON(),
        version: this.config.version,
      },
    });

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to save document");
    }
  }

  async loadDocument(id: string): Promise<CadDocument | null> {
    const response = await this.requestWithRetry<{
      id: string;
      name: string;
      content: unknown;
    }>(`/documents/${id}`, { method: "GET" });

    if (!response.success) {
      if (response.error?.code === "HTTP_404") {
        return null;
      }
      throw new Error(response.error?.message ?? "Failed to load document");
    }

    if (!response.data) {
      return null;
    }

    // Note: Would need entityFactory for proper restoration
    const document = new CadDocument({ title: response.data.name });
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await this.requestWithRetry<void>(`/documents/${id}`, {
      method: "DELETE",
    });

    if (!response.success && response.error?.code !== "HTTP_404") {
      throw new Error(response.error?.message ?? "Failed to delete document");
    }
  }

  async listDocuments(): Promise<DocumentInfo[]> {
    const response = await this.requestWithRetry<RemoteDocumentInfo[]>(
      "/documents",
      {
        method: "GET",
      }
    );

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to list documents");
    }

    return (response.data ?? []).map((doc) => ({
      id: doc.id,
      name: doc.name,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      size: doc.size,
      thumbnail: doc.thumbnail,
    }));
  }

  // === Generic Data Operations ===
  async save(key: string, data: unknown): Promise<void> {
    const response = await this.requestWithRetry<void>("/data", {
      method: "PUT",
      body: {
        key: `${this.config.prefix}${key}`,
        data,
        version: this.config.version,
      },
    });

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to save data");
    }
  }

  async load<T>(key: string): Promise<T | null> {
    const response = await this.requestWithRetry<{ key: string; data: T }>(
      `/data/${this.config.prefix}${key}`,
      { method: "GET" }
    );

    if (!response.success) {
      if (response.error?.code === "HTTP_404") {
        return null;
      }
      throw new Error(response.error?.message ?? "Failed to load data");
    }

    return response.data?.data ?? null;
  }

  async delete(key: string): Promise<void> {
    const response = await this.requestWithRetry<void>(
      `/data/${this.config.prefix}${key}`,
      { method: "DELETE" }
    );

    if (!response.success && response.error?.code !== "HTTP_404") {
      throw new Error(response.error?.message ?? "Failed to delete data");
    }
  }

  async exists(key: string): Promise<boolean> {
    const response = await this.request<void>(
      `/data/${this.config.prefix}${key}`,
      { method: "GET" }
    );

    return response.success;
  }

  async list(prefix?: string): Promise<string[]> {
    const fullPrefix = `${this.config.prefix}${prefix ?? ""}`;
    const response = await this.requestWithRetry<{ keys: string[] }>(
      `/data?prefix=${encodeURIComponent(fullPrefix)}`,
      { method: "GET" }
    );

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to list keys");
    }

    // Remove prefix from returned keys
    return (response.data?.keys ?? []).map((key) =>
      key.startsWith(this.config.prefix)
        ? key.substring(this.config.prefix.length)
        : key
    );
  }

  async clear(): Promise<void> {
    const response = await this.requestWithRetry<void>(
      `/data?prefix=${encodeURIComponent(this.config.prefix)}`,
      { method: "DELETE" }
    );

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to clear data");
    }
  }

  // === Settings ===
  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await this.save("settings", settings);
  }

  async loadSettings(): Promise<Record<string, unknown>> {
    return (await this.load<Record<string, unknown>>("settings")) ?? {};
  }

  // === Storage Info ===
  getUsedSpace(): number {
    // Would need to query API for this
    return 0;
  }

  getAvailableSpace(): number {
    // Would need to query API for this
    return Infinity;
  }

  // === Collaboration Features ===
  async shareDocument(
    id: string,
    userIds: string[],
    permissions: string[]
  ): Promise<void> {
    const response = await this.requestWithRetry<void>(
      `/documents/${id}/share`,
      {
        method: "POST",
        body: { userIds, permissions },
      }
    );

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to share document");
    }
  }

  async unshareDocument(id: string, userIds: string[]): Promise<void> {
    const response = await this.requestWithRetry<void>(
      `/documents/${id}/unshare`,
      {
        method: "POST",
        body: { userIds },
      }
    );

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to unshare document");
    }
  }

  async getSharedDocuments(): Promise<RemoteDocumentInfo[]> {
    const response = await this.requestWithRetry<RemoteDocumentInfo[]>(
      "/documents/shared",
      {
        method: "GET",
      }
    );

    if (!response.success) {
      throw new Error(
        response.error?.message ?? "Failed to get shared documents"
      );
    }

    return response.data ?? [];
  }

  // === Version Control ===
  async getDocumentVersions(
    id: string
  ): Promise<{ version: number; timestamp: Date; userId: string }[]> {
    const response = await this.requestWithRetry<
      { version: number; timestamp: string; userId: string }[]
    >(`/documents/${id}/versions`, { method: "GET" });

    if (!response.success) {
      throw new Error(response.error?.message ?? "Failed to get versions");
    }

    return (response.data ?? []).map((v) => ({
      ...v,
      timestamp: new Date(v.timestamp),
    }));
  }

  async loadDocumentVersion(
    id: string,
    version: number
  ): Promise<CadDocument | null> {
    const response = await this.requestWithRetry<{
      id: string;
      name: string;
      content: unknown;
    }>(`/documents/${id}/versions/${version}`, { method: "GET" });

    if (!response.success) {
      return null;
    }

    if (!response.data) {
      return null;
    }

    // Note: Would need entityFactory for proper restoration
    const document = new CadDocument({ title: response.data.name });
    return document;
  }

  // === Utility ===
  private generateRequestId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cancelAllRequests(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  // === Health Check ===
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.request<{ status: string }>("/health", {
        method: "GET",
        timeout: 5000,
      });
      return response.success;
    } catch {
      return false;
    }
  }
}
