/**
 * ProjectRepository.ts
 * Data access layer for project persistence
 */

import {
  Project,
  ProjectSummary,
  ProjectFilter,
  ProjectSort,
  ProjectPagination,
  ProjectEvent,
  ProjectEventType,
  createProjectSummary,
} from "./Project.types";

// ============================================================================
// Repository Interface
// ============================================================================

export interface IProjectRepository {
  // CRUD
  create(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  update(id: string, updates: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;

  // Queries
  findAll(
    filter?: ProjectFilter,
    sort?: ProjectSort,
    pagination?: ProjectPagination
  ): Promise<{
    projects: ProjectSummary[];
    pagination: ProjectPagination;
  }>;
  findByCustomerId(customerId: string): Promise<ProjectSummary[]>;
  search(query: string): Promise<ProjectSummary[]>;

  // Events
  addEvent(
    projectId: string,
    event: Omit<ProjectEvent, "id" | "projectId" | "timestamp">
  ): Promise<void>;
  getEvents(projectId: string, limit?: number): Promise<ProjectEvent[]>;

  // Versioning
  saveVersion(project: Project): Promise<string>;
  getVersion(projectId: string, versionId: string): Promise<Project | null>;
  listVersions(
    projectId: string
  ): Promise<{ id: string; version: string; timestamp: Date }[]>;
}

// ============================================================================
// IndexedDB Storage Keys
// ============================================================================

const DB_NAME = "AluBookCAD";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const STORE_EVENTS = "project_events";
const STORE_VERSIONS = "project_versions";

// ============================================================================
// IndexedDB Project Repository
// ============================================================================

export class IndexedDBProjectRepository implements IProjectRepository {
  private db: IDBDatabase | null = null;

  // --------------------------------------------------------------------------
  // Database Initialization
  // --------------------------------------------------------------------------

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Projects store
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const projectStore = db.createObjectStore(STORE_PROJECTS, {
            keyPath: "id",
          });
          projectStore.createIndex("status", "status", { unique: false });
          projectStore.createIndex("phase", "phase", { unique: false });
          projectStore.createIndex("customerId", "customer.id", {
            unique: false,
          });
          projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        // Events store
        if (!db.objectStoreNames.contains(STORE_EVENTS)) {
          const eventStore = db.createObjectStore(STORE_EVENTS, {
            keyPath: "id",
          });
          eventStore.createIndex("projectId", "projectId", { unique: false });
          eventStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // Versions store
        if (!db.objectStoreNames.contains(STORE_VERSIONS)) {
          const versionStore = db.createObjectStore(STORE_VERSIONS, {
            keyPath: "id",
          });
          versionStore.createIndex("projectId", "projectId", { unique: false });
          versionStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  async create(project: Project): Promise<Project> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], "readwrite");
      const store = transaction.objectStore(STORE_PROJECTS);

      const request = store.add(this.serializeProject(project));

      request.onsuccess = () => {
        this.addEvent(project.id, {
          type: ProjectEventType.CREATED,
          userId: project.createdBy,
          userName: project.createdBy,
          description: `Project "${project.name}" created`,
        });
        resolve(project);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async findById(id: string): Promise<Project | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], "readonly");
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? this.deserializeProject(data) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Project ${id} not found`);
    }

    const updated: Project = {
      ...existing,
      ...updates,
      id, // Ensure ID isn't changed
      updatedAt: new Date(),
    };

    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], "readwrite");
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.put(this.serializeProject(updated));

      request.onsuccess = () => {
        this.addEvent(id, {
          type: ProjectEventType.UPDATED,
          userId: updated.lastModifiedBy,
          userName: updated.lastModifiedBy,
          description: `Project updated`,
          data: { fields: Object.keys(updates) },
        });
        resolve(updated);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], "readwrite");
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  async findAll(
    filter?: ProjectFilter,
    sort?: ProjectSort,
    pagination?: ProjectPagination
  ): Promise<{ projects: ProjectSummary[]; pagination: ProjectPagination }> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], "readonly");
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.getAll();

      request.onsuccess = () => {
        let projects = (request.result as Project[]).map((p) =>
          this.deserializeProject(p)
        );

        // Apply filters
        if (filter) {
          projects = this.applyFilter(projects, filter);
        }

        // Apply sort
        if (sort) {
          projects = this.applySort(projects, sort);
        }

        // Get total before pagination
        const total = projects.length;

        // Apply pagination
        const page = pagination?.page || 1;
        const pageSize = pagination?.pageSize || 20;
        const start = (page - 1) * pageSize;
        projects = projects.slice(start, start + pageSize);

        // Create summaries
        const summaries = projects.map(createProjectSummary);

        resolve({
          projects: summaries,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async findByCustomerId(customerId: string): Promise<ProjectSummary[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], "readonly");
      const store = transaction.objectStore(STORE_PROJECTS);
      const index = store.index("customerId");
      const request = index.getAll(customerId);

      request.onsuccess = () => {
        const projects = (request.result as Project[])
          .map((p) => this.deserializeProject(p))
          .map(createProjectSummary);
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async search(query: string): Promise<ProjectSummary[]> {
    const db = await this.getDB();
    const searchTerm = query.toLowerCase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS], "readonly");
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = (request.result as Project[])
          .map((p) => this.deserializeProject(p))
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchTerm) ||
              p.description.toLowerCase().includes(searchTerm) ||
              p.customer.name.toLowerCase().includes(searchTerm) ||
              p.location.address.city.toLowerCase().includes(searchTerm) ||
              p.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
          )
          .map(createProjectSummary);
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------

  async addEvent(
    projectId: string,
    event: Omit<ProjectEvent, "id" | "projectId" | "timestamp">
  ): Promise<void> {
    const db = await this.getDB();

    const fullEvent: ProjectEvent = {
      ...event,
      id: this.generateEventId(),
      projectId,
      timestamp: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], "readwrite");
      const store = transaction.objectStore(STORE_EVENTS);
      const request = store.add(this.serializeEvent(fullEvent));

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEvents(projectId: string, limit = 50): Promise<ProjectEvent[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], "readonly");
      const store = transaction.objectStore(STORE_EVENTS);
      const index = store.index("projectId");
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const events = (request.result as ProjectEvent[])
          .map((e) => this.deserializeEvent(e))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // Versioning
  // --------------------------------------------------------------------------

  async saveVersion(project: Project): Promise<string> {
    const db = await this.getDB();

    const versionId = this.generateVersionId();
    const versionData = {
      id: versionId,
      projectId: project.id,
      version: project.version,
      timestamp: new Date(),
      data: this.serializeProject(project),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_VERSIONS], "readwrite");
      const store = transaction.objectStore(STORE_VERSIONS);
      const request = store.add(versionData);

      request.onsuccess = () => resolve(versionId);
      request.onerror = () => reject(request.error);
    });
  }

  async getVersion(
    projectId: string,
    versionId: string
  ): Promise<Project | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_VERSIONS], "readonly");
      const store = transaction.objectStore(STORE_VERSIONS);
      const request = store.get(versionId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.projectId === projectId) {
          resolve(this.deserializeProject(result.data));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async listVersions(
    projectId: string
  ): Promise<{ id: string; version: string; timestamp: Date }[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_VERSIONS], "readonly");
      const store = transaction.objectStore(STORE_VERSIONS);
      const index = store.index("projectId");
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const versions = (
          request.result as { id: string; version: string; timestamp: string }[]
        )
          .map((v) => ({
            id: v.id,
            version: v.version,
            timestamp: new Date(v.timestamp),
          }))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        resolve(versions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // Filter & Sort Helpers
  // --------------------------------------------------------------------------

  private applyFilter(projects: Project[], filter: ProjectFilter): Project[] {
    return projects.filter((project) => {
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesSearch =
          project.name.toLowerCase().includes(searchTerm) ||
          project.description.toLowerCase().includes(searchTerm) ||
          project.customer.name.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      if (filter.status?.length && !filter.status.includes(project.status)) {
        return false;
      }

      if (filter.phase?.length && !filter.phase.includes(project.phase)) {
        return false;
      }

      if (
        filter.category?.length &&
        !filter.category.includes(project.category)
      ) {
        return false;
      }

      if (filter.dateRange) {
        const projectDate = new Date(project.createdAt);
        if (
          projectDate < filter.dateRange.start ||
          projectDate > filter.dateRange.end
        ) {
          return false;
        }
      }

      if (filter.customerId && project.customer.id !== filter.customerId) {
        return false;
      }

      if (filter.tags?.length) {
        const hasAllTags = filter.tags.every((tag) =>
          project.tags.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      if (
        filter.minValue !== undefined &&
        (project.quotation?.total || 0) < filter.minValue
      ) {
        return false;
      }

      if (
        filter.maxValue !== undefined &&
        (project.quotation?.total || 0) > filter.maxValue
      ) {
        return false;
      }

      return true;
    });
  }

  private applySort(projects: Project[], sort: ProjectSort): Project[] {
    return [...projects].sort((projA, projB) => {
      let valueA: unknown;
      let valueB: unknown;

      switch (sort.field) {
        case "name":
          valueA = projA.name.toLowerCase();
          valueB = projB.name.toLowerCase();
          break;
        case "createdAt":
          valueA = new Date(projA.createdAt).getTime();
          valueB = new Date(projB.createdAt).getTime();
          break;
        case "updatedAt":
          valueA = new Date(projA.updatedAt).getTime();
          valueB = new Date(projB.updatedAt).getTime();
          break;
        case "status":
          valueA = projA.status;
          valueB = projB.status;
          break;
        case "quotationTotal":
          valueA = projA.quotation?.total || 0;
          valueB = projB.quotation?.total || 0;
          break;
        default:
          return 0;
      }

      const compA = valueA as string | number;
      const compB = valueB as string | number;
      if (compA < compB) return sort.direction === "asc" ? -1 : 1;
      if (compA > compB) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // --------------------------------------------------------------------------
  // Serialization Helpers
  // --------------------------------------------------------------------------

  private serializeProject(project: Project): Record<string, unknown> {
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private deserializeProject(data: Project | Record<string, unknown>): Project {
    const raw = data as Record<string, unknown>;
    return {
      ...raw,
      createdAt: new Date(raw.createdAt as string),
      updatedAt: new Date(raw.updatedAt as string),
    } as Project;
  }

  private serializeEvent(event: ProjectEvent): Record<string, unknown> {
    return {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };
  }

  private deserializeEvent(
    data: ProjectEvent | Record<string, unknown>
  ): ProjectEvent {
    const raw = data as Record<string, unknown>;
    return {
      ...raw,
      timestamp: new Date(raw.timestamp as string),
    } as ProjectEvent;
  }

  // --------------------------------------------------------------------------
  // ID Generators
  // --------------------------------------------------------------------------

  private generateEventId(): string {
    return `EVT-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }

  private generateVersionId(): string {
    return `VER-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }
}

// ============================================================================
// Memory Repository (for testing)
// ============================================================================

export class InMemoryProjectRepository implements IProjectRepository {
  private projects = new Map<string, Project>();
  private events = new Map<string, ProjectEvent[]>();
  private versions = new Map<
    string,
    { id: string; version: string; timestamp: Date; data: Project }[]
  >();

  async create(project: Project): Promise<Project> {
    this.projects.set(project.id, project);
    await this.addEvent(project.id, {
      type: ProjectEventType.CREATED,
      userId: project.createdBy,
      userName: project.createdBy,
      description: `Project "${project.name}" created`,
    });
    return project;
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) throw new Error(`Project ${id} not found`);

    const updated = { ...existing, ...updates, id, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
    this.events.delete(id);
    this.versions.delete(id);
  }

  async findAll(
    filter?: ProjectFilter,
    sort?: ProjectSort,
    pagination?: ProjectPagination
  ): Promise<{ projects: ProjectSummary[]; pagination: ProjectPagination }> {
    let projects = Array.from(this.projects.values());

    // Simple filter implementation
    if (filter?.status?.length) {
      projects = projects.filter((p) => filter.status!.includes(p.status));
    }

    // Simple sort
    if (sort) {
      projects.sort((a, b) => {
        const aVal = a[sort.field as keyof Project];
        const bVal = b[sort.field as keyof Project];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    const total = projects.length;
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const start = (page - 1) * pageSize;
    projects = projects.slice(start, start + pageSize);

    return {
      projects: projects.map(createProjectSummary),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findByCustomerId(customerId: string): Promise<ProjectSummary[]> {
    return Array.from(this.projects.values())
      .filter((p) => p.customer.id === customerId)
      .map(createProjectSummary);
  }

  async search(query: string): Promise<ProjectSummary[]> {
    const term = query.toLowerCase();
    return Array.from(this.projects.values())
      .filter((p) => p.name.toLowerCase().includes(term))
      .map(createProjectSummary);
  }

  async addEvent(
    projectId: string,
    event: Omit<ProjectEvent, "id" | "projectId" | "timestamp">
  ): Promise<void> {
    const events = this.events.get(projectId) || [];
    events.push({
      ...event,
      id: `EVT-${Date.now()}`,
      projectId,
      timestamp: new Date(),
    });
    this.events.set(projectId, events);
  }

  async getEvents(projectId: string, limit = 50): Promise<ProjectEvent[]> {
    return (this.events.get(projectId) || [])
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async saveVersion(project: Project): Promise<string> {
    const versions = this.versions.get(project.id) || [];
    const versionId = `VER-${Date.now()}`;
    versions.push({
      id: versionId,
      version: project.version,
      timestamp: new Date(),
      data: { ...project },
    });
    this.versions.set(project.id, versions);
    return versionId;
  }

  async getVersion(
    projectId: string,
    versionId: string
  ): Promise<Project | null> {
    const versions = this.versions.get(projectId) || [];
    const version = versions.find((v) => v.id === versionId);
    return version?.data || null;
  }

  async listVersions(
    projectId: string
  ): Promise<{ id: string; version: string; timestamp: Date }[]> {
    return (this.versions.get(projectId) || []).map((v) => ({
      id: v.id,
      version: v.version,
      timestamp: v.timestamp,
    }));
  }
}
