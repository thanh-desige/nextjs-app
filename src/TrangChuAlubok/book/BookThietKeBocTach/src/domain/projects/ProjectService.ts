/**
 * ProjectService.ts — Facade
 *
 * Business logic layer for project management.
 * Door ops → projectDoorOps.ts
 * BOM & Quotation → projectQuotationOps.ts
 * Docs/Notes/Team/Milestones → projectCollaborationOps.ts
 *
 * Extracted in STEP-5.15
 */

import {
  Project,
  ProjectSummary,
  ProjectStatus,
  ProjectPhase,
  ProjectCategory,
  ProjectFilter,
  ProjectSort,
  ProjectPagination,
  ProjectEvent,
  ProjectEventType,
  CustomerInfo,
  ProjectDocument,
  ProjectNote,
  NoteType,
  Milestone,
  TeamMember,
  ProjectPermission,
  createDefaultProject,
} from "./Project.types";
import {
  IProjectRepository,
  IndexedDBProjectRepository,
} from "./ProjectRepository";
import { DoorModelData } from "../door/DoorModel";
import { ProfileCatalog } from "../materials/ProfileCatalog";
import { GlassCatalog } from "../materials/GlassCatalog";
import { AccessoryCatalog } from "../materials/AccessoryCatalog";
import { PricingRules } from "../rules/PricingRules";

// Extracted modules
import {
  addDoorToProject,
  updateProjectDoor,
  removeDoorFromProject,
} from "./projectDoorOps";
import {
  calculateProjectBOM,
  generateProjectQuotation,
  type QuotationOpContext,
} from "./projectQuotationOps";
import {
  addProjectDocument,
  removeProjectDocument,
  addProjectNote,
  addProjectTeamMember,
  removeProjectTeamMember,
  addProjectMilestone,
  completeProjectMilestone,
} from "./projectCollaborationOps";

// ============================================================================
// Service Options
// ============================================================================

export interface ProjectServiceOptions {
  repository?: IProjectRepository;
  userId: string;
  userName: string;
}

// ============================================================================
// Service Results
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ============================================================================
// Project Service
// ============================================================================

export class ProjectService {
  private repository: IProjectRepository;
  private userId: string;
  private userName: string;

  // Catalogs & calculators
  private profileCatalog = new ProfileCatalog();
  private glassCatalog = new GlassCatalog();
  private accessoryCatalog = new AccessoryCatalog();
  private pricingRules = new PricingRules();

  constructor(options: ProjectServiceOptions) {
    this.repository = options.repository || new IndexedDBProjectRepository();
    this.userId = options.userId;
    this.userName = options.userName;
  }

  // --------------------------------------------------------------------------
  // Context helpers (for delegating to extracted modules)
  // --------------------------------------------------------------------------

  private get baseCtx() {
    return {
      repository: this.repository,
      userId: this.userId,
      userName: this.userName,
    };
  }

  private get quotationCtx(): QuotationOpContext {
    return {
      ...this.baseCtx,
      profileCatalog: this.profileCatalog,
      glassCatalog: this.glassCatalog,
      accessoryCatalog: this.accessoryCatalog,
      pricingRules: this.pricingRules,
    };
  }

  // --------------------------------------------------------------------------
  // Project CRUD
  // --------------------------------------------------------------------------

  async createProject(
    name: string,
    customer?: Partial<CustomerInfo>,
    category?: ProjectCategory
  ): Promise<ServiceResult<Project>> {
    try {
      const project = createDefaultProject(name, this.userId, customer);
      if (category) {
        project.category = category;
      }

      const created = await this.repository.create(project);
      return { success: true, data: created };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create project",
        code: "CREATE_FAILED",
      };
    }
  }

  async getProject(projectId: string): Promise<ServiceResult<Project>> {
    try {
      const project = await this.repository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
          code: "NOT_FOUND",
        };
      }
      return { success: true, data: project };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get project",
        code: "GET_FAILED",
      };
    }
  }

  async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<ServiceResult<Project>> {
    try {
      // Don't allow updating critical fields
      const safeUpdates = { ...updates };
      delete safeUpdates.id;
      delete safeUpdates.createdAt;
      delete safeUpdates.createdBy;

      safeUpdates.lastModifiedBy = this.userId;

      const updated = await this.repository.update(projectId, safeUpdates);
      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update project",
        code: "UPDATE_FAILED",
      };
    }
  }

  async deleteProject(projectId: string): Promise<ServiceResult<void>> {
    try {
      const project = await this.repository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
          code: "NOT_FOUND",
        };
      }

      // Check permission
      const canDelete = this.checkPermission(project, ProjectPermission.DELETE);
      if (!canDelete) {
        return {
          success: false,
          error: "Permission denied",
          code: "PERMISSION_DENIED",
        };
      }

      await this.repository.delete(projectId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete project",
        code: "DELETE_FAILED",
      };
    }
  }

  async archiveProject(projectId: string): Promise<ServiceResult<Project>> {
    return this.changeStatus(projectId, ProjectStatus.ARCHIVED);
  }

  // --------------------------------------------------------------------------
  // Project Queries
  // --------------------------------------------------------------------------

  async listProjects(
    filter?: ProjectFilter,
    sort?: ProjectSort,
    pagination?: ProjectPagination
  ): Promise<
    ServiceResult<{ projects: ProjectSummary[]; pagination: ProjectPagination }>
  > {
    try {
      const result = await this.repository.findAll(filter, sort, pagination);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list projects",
        code: "LIST_FAILED",
      };
    }
  }

  async searchProjects(
    query: string
  ): Promise<ServiceResult<ProjectSummary[]>> {
    try {
      const projects = await this.repository.search(query);
      return { success: true, data: projects };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Search failed",
        code: "SEARCH_FAILED",
      };
    }
  }

  async getProjectsByCustomer(
    customerId: string
  ): Promise<ServiceResult<ProjectSummary[]>> {
    try {
      const projects = await this.repository.findByCustomerId(customerId);
      return { success: true, data: projects };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get customer projects",
        code: "QUERY_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // Status & Phase Management
  // --------------------------------------------------------------------------

  async changeStatus(
    projectId: string,
    newStatus: ProjectStatus
  ): Promise<ServiceResult<Project>> {
    try {
      const project = await this.repository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
          code: "NOT_FOUND",
        };
      }

      // Validate status transition
      const isValid = this.validateStatusTransition(project.status, newStatus);
      if (!isValid) {
        return {
          success: false,
          error: `Cannot change status from ${project.status} to ${newStatus}`,
          code: "INVALID_TRANSITION",
        };
      }

      // Save version before status change
      await this.repository.saveVersion(project);

      const updated = await this.repository.update(projectId, {
        status: newStatus,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.STATUS_CHANGED,
        userId: this.userId,
        userName: this.userName,
        description: `Status changed from ${project.status} to ${newStatus}`,
        data: { from: project.status, to: newStatus },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to change status",
        code: "STATUS_CHANGE_FAILED",
      };
    }
  }

  async changePhase(
    projectId: string,
    newPhase: ProjectPhase
  ): Promise<ServiceResult<Project>> {
    try {
      const project = await this.repository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
          code: "NOT_FOUND",
        };
      }

      const updated = await this.repository.update(projectId, {
        phase: newPhase,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.PHASE_CHANGED,
        userId: this.userId,
        userName: this.userName,
        description: `Phase changed from ${project.phase} to ${newPhase}`,
        data: { from: project.phase, to: newPhase },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to change phase",
        code: "PHASE_CHANGE_FAILED",
      };
    }
  }

  private validateStatusTransition(
    from: ProjectStatus,
    to: ProjectStatus
  ): boolean {
    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.DRAFT]: [
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.CANCELLED,
      ],
      [ProjectStatus.IN_PROGRESS]: [
        ProjectStatus.PENDING_REVIEW,
        ProjectStatus.ON_HOLD,
        ProjectStatus.CANCELLED,
      ],
      [ProjectStatus.PENDING_REVIEW]: [
        ProjectStatus.APPROVED,
        ProjectStatus.IN_PROGRESS,
      ],
      [ProjectStatus.APPROVED]: [
        ProjectStatus.COMPLETED,
        ProjectStatus.ON_HOLD,
      ],
      [ProjectStatus.ON_HOLD]: [
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.CANCELLED,
      ],
      [ProjectStatus.CANCELLED]: [ProjectStatus.DRAFT],
      [ProjectStatus.COMPLETED]: [ProjectStatus.ARCHIVED],
      [ProjectStatus.ARCHIVED]: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  // --------------------------------------------------------------------------
  // Door Management → projectDoorOps.ts
  // --------------------------------------------------------------------------

  async addDoor(
    projectId: string,
    doorData: DoorModelData
  ): Promise<ServiceResult<Project>> {
    return addDoorToProject(this.baseCtx, projectId, doorData);
  }

  async updateDoor(
    projectId: string,
    doorId: string,
    updates: Partial<DoorModelData>
  ): Promise<ServiceResult<Project>> {
    return updateProjectDoor(this.baseCtx, projectId, doorId, updates);
  }

  async removeDoor(
    projectId: string,
    doorId: string
  ): Promise<ServiceResult<Project>> {
    return removeDoorFromProject(this.baseCtx, projectId, doorId);
  }

  // --------------------------------------------------------------------------
  // BOM & Quotation → projectQuotationOps.ts
  // --------------------------------------------------------------------------

  async calculateBOM(projectId: string): Promise<ServiceResult<Project>> {
    return calculateProjectBOM(this.quotationCtx, projectId);
  }

  async generateQuotation(
    projectId: string,
    options?: {
      validDays?: number;
      depositPercent?: number;
      notes?: string;
    }
  ): Promise<ServiceResult<Project>> {
    return generateProjectQuotation(this.quotationCtx, projectId, options);
  }

  // --------------------------------------------------------------------------
  // Documents → projectCollaborationOps.ts
  // --------------------------------------------------------------------------

  async addDocument(
    projectId: string,
    document: Omit<
      ProjectDocument,
      "id" | "uploadedAt" | "uploadedBy" | "version"
    >
  ): Promise<ServiceResult<Project>> {
    return addProjectDocument(this.baseCtx, projectId, document);
  }

  async removeDocument(
    projectId: string,
    documentId: string
  ): Promise<ServiceResult<Project>> {
    return removeProjectDocument(this.baseCtx, projectId, documentId);
  }

  // --------------------------------------------------------------------------
  // Notes → projectCollaborationOps.ts
  // --------------------------------------------------------------------------

  async addNote(
    projectId: string,
    content: string,
    type: NoteType = NoteType.GENERAL,
    isPrivate = false
  ): Promise<ServiceResult<Project>> {
    return addProjectNote(this.baseCtx, projectId, content, type, isPrivate);
  }

  // --------------------------------------------------------------------------
  // Team Management → projectCollaborationOps.ts
  // --------------------------------------------------------------------------

  async addTeamMember(
    projectId: string,
    member: Omit<TeamMember, "addedAt">
  ): Promise<ServiceResult<Project>> {
    return addProjectTeamMember(this.baseCtx, projectId, member);
  }

  async removeTeamMember(
    projectId: string,
    userId: string
  ): Promise<ServiceResult<Project>> {
    return removeProjectTeamMember(this.baseCtx, projectId, userId);
  }

  // --------------------------------------------------------------------------
  // Milestones → projectCollaborationOps.ts
  // --------------------------------------------------------------------------

  async addMilestone(
    projectId: string,
    milestone: Omit<Milestone, "id" | "status">
  ): Promise<ServiceResult<Project>> {
    return addProjectMilestone(this.baseCtx, projectId, milestone);
  }

  async completeMilestone(
    projectId: string,
    milestoneId: string
  ): Promise<ServiceResult<Project>> {
    return completeProjectMilestone(this.baseCtx, projectId, milestoneId);
  }

  // --------------------------------------------------------------------------
  // History
  // --------------------------------------------------------------------------

  async getProjectHistory(
    projectId: string,
    limit = 50
  ): Promise<ServiceResult<ProjectEvent[]>> {
    try {
      const events = await this.repository.getEvents(projectId, limit);
      return { success: true, data: events };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get history",
        code: "HISTORY_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // Versioning
  // --------------------------------------------------------------------------

  async saveVersion(projectId: string): Promise<ServiceResult<string>> {
    try {
      const project = await this.repository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
          code: "NOT_FOUND",
        };
      }

      const versionId = await this.repository.saveVersion(project);
      return { success: true, data: versionId };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save version",
        code: "VERSION_FAILED",
      };
    }
  }

  async restoreVersion(
    projectId: string,
    versionId: string
  ): Promise<ServiceResult<Project>> {
    try {
      const versionData = await this.repository.getVersion(
        projectId,
        versionId
      );
      if (!versionData) {
        return {
          success: false,
          error: "Version not found",
          code: "VERSION_NOT_FOUND",
        };
      }

      // Save current as new version first
      await this.saveVersion(projectId);

      // Restore
      const updated = await this.repository.update(projectId, {
        ...versionData,
        updatedAt: new Date(),
        lastModifiedBy: this.userId,
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to restore version",
        code: "RESTORE_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private checkPermission(
    project: Project,
    permission: ProjectPermission
  ): boolean {
    const member = project.team.find((m) => m.userId === this.userId);
    if (!member) return false;
    return member.permissions.includes(permission);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createProjectService(
  userId: string,
  userName: string
): ProjectService {
  return new ProjectService({ userId, userName });
}
