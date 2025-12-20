/**
 * ProjectService.ts
 * Business logic layer for project management
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
  Quotation,
  QuotationStatus,
  QuotationItem,
  Milestone,
  MilestoneStatus,
  TeamMember,
  TeamRole,
  ProjectPermission,
  createDefaultProject,
} from "./Project.types";
import {
  IProjectRepository,
  IndexedDBProjectRepository,
} from "./ProjectRepository";
import { DoorModel, DoorModelData } from "../door/DoorModel";
import { BomCalculator } from "../bom/BomCalculator";
import { ProfileCatalog } from "../materials/ProfileCatalog";
import { GlassCatalog } from "../materials/GlassCatalog";
import { AccessoryCatalog } from "../materials/AccessoryCatalog";
import { PricingRules, CustomerTier } from "../rules/PricingRules";

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
  // Door Management
  // --------------------------------------------------------------------------

  async addDoor(
    projectId: string,
    doorData: DoorModelData
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

      const doors = [...project.doors, doorData];
      const updated = await this.repository.update(projectId, {
        doors,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.DOOR_ADDED,
        userId: this.userId,
        userName: this.userName,
        description: `Door added: ${doorData.name || doorData.id}`,
        data: { doorId: doorData.id },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add door",
        code: "ADD_DOOR_FAILED",
      };
    }
  }

  async updateDoor(
    projectId: string,
    doorId: string,
    updates: Partial<DoorModelData>
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

      const doorIndex = project.doors.findIndex((d) => d.id === doorId);
      if (doorIndex === -1) {
        return {
          success: false,
          error: "Door not found",
          code: "DOOR_NOT_FOUND",
        };
      }

      const doors = [...project.doors];
      doors[doorIndex] = { ...doors[doorIndex], ...updates, id: doorId };

      const updated = await this.repository.update(projectId, {
        doors,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.DOOR_UPDATED,
        userId: this.userId,
        userName: this.userName,
        description: `Door updated: ${doorId}`,
        data: { doorId, fields: Object.keys(updates) },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update door",
        code: "UPDATE_DOOR_FAILED",
      };
    }
  }

  async removeDoor(
    projectId: string,
    doorId: string
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

      const doors = project.doors.filter((d) => d.id !== doorId);

      const updated = await this.repository.update(projectId, {
        doors,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.DOOR_REMOVED,
        userId: this.userId,
        userName: this.userName,
        description: `Door removed: ${doorId}`,
        data: { doorId },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove door",
        code: "REMOVE_DOOR_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // BOM & Quotation
  // --------------------------------------------------------------------------

  async calculateBOM(projectId: string): Promise<ServiceResult<Project>> {
    try {
      const project = await this.repository.findById(projectId);
      if (!project) {
        return {
          success: false,
          error: "Project not found",
          code: "NOT_FOUND",
        };
      }

      if (project.doors.length === 0) {
        return {
          success: false,
          error: "No doors in project",
          code: "NO_DOORS",
        };
      }

      // Calculate BOM for all doors
      const bomCalculator = new BomCalculator(
        this.profileCatalog,
        this.glassCatalog,
        this.accessoryCatalog
      );

      // Calculate BOM for all doors - using first door's BOM as main
      // In practice, we'd merge multiple door BOMs
      if (project.doors.length > 0) {
        const firstDoor = project.doors[0];
        const door = this.doorDataToModel(firstDoor);
        const bom = bomCalculator.calculateBom(
          door,
          project.id,
          project.name,
          this.userId
        );

        // Add items from other doors
        for (let i = 1; i < project.doors.length; i++) {
          const additionalDoor = this.doorDataToModel(project.doors[i]);
          const additionalBom = bomCalculator.calculateBom(
            additionalDoor,
            project.id,
            project.name,
            this.userId
          );
          bom.items.push(...additionalBom.items);
        }

        const updated = await this.repository.update(projectId, {
          bom,
          lastModifiedBy: this.userId,
        });

        return { success: true, data: updated };
      }

      return {
        success: false,
        error: "No doors to calculate",
        code: "NO_DOORS",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to calculate BOM",
        code: "BOM_FAILED",
      };
    }
  }

  async generateQuotation(
    projectId: string,
    options?: {
      validDays?: number;
      depositPercent?: number;
      notes?: string;
    }
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

      if (project.doors.length === 0) {
        return {
          success: false,
          error: "No doors in project",
          code: "NO_DOORS",
        };
      }

      // Calculate prices for each door
      const items: QuotationItem[] = [];
      let subtotal = 0;

      for (const doorData of project.doors) {
        const door = this.doorDataToModel(doorData);
        const pricing = this.pricingRules.calculatePrice(door, {
          profileSystem: project.settings.defaultProfileSystem,
          customerTier: project.customer.tier as CustomerTier,
          quantity: project.doors.length,
        });

        items.push({
          id: this.generateId(),
          doorId: doorData.id,
          description: `${doorData.name || door.type} - ${
            door.dimensions.width
          }x${door.dimensions.height}mm`,
          specifications: {
            type: door.type,
            width: door.dimensions.width,
            height: door.dimensions.height,
            profileSystem: project.settings.defaultProfileSystem,
            glassType: door.glassType,
            frameType: door.frameType,
          },
          quantity: 1,
          unitPrice: pricing.finalPrice,
          amount: pricing.finalPrice,
        });

        subtotal += pricing.finalPrice;
      }

      // Calculate totals
      const discounts: import("./Project.types").QuotationDiscount[] = [];
      let discountTotal = 0;

      // Volume discount
      if (project.doors.length >= 3) {
        const volumeDiscount =
          subtotal *
          (project.doors.length >= 10
            ? 0.08
            : project.doors.length >= 5
            ? 0.05
            : 0.03);
        discounts.push({
          description: `Chiết khấu số lượng (${project.doors.length} bộ)`,
          type: "percent",
          value:
            project.doors.length >= 10 ? 8 : project.doors.length >= 5 ? 5 : 3,
          amount: volumeDiscount,
        });
        discountTotal += volumeDiscount;
      }

      const afterDiscount = subtotal - discountTotal;
      const taxRate = project.settings.taxRate;
      const taxAmount = afterDiscount * (taxRate / 100);
      const total = afterDiscount + taxAmount;

      const now = new Date();
      const validDays = options?.validDays || 30;

      const quotation: Quotation = {
        id: this.generateId(),
        projectId,
        version: (project.quotation?.version || 0) + 1,
        quotationNumber: this.generateQuotationNumber(),
        issueDate: now,
        validUntil: new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000),
        items,
        subtotal,
        discounts,
        discountTotal,
        taxRate,
        taxAmount,
        total,
        currency: project.settings.currency,
        paymentTerms: {
          depositPercent: options?.depositPercent || 50,
          progressPayments: [{ percent: 30, milestone: "Hoàn thành sản xuất" }],
          finalPaymentPercent: 20,
          paymentMethods: ["Chuyển khoản", "Tiền mặt"],
        },
        deliveryTerms:
          "Giao hàng tại công trình trong vòng 15-20 ngày làm việc",
        warranty: "Bảo hành 24 tháng cho khung nhôm, 12 tháng cho phụ kiện",
        notes: options?.notes || "",
        status: QuotationStatus.DRAFT,
      };

      const updated = await this.repository.update(projectId, {
        quotation,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.QUOTATION_CREATED,
        userId: this.userId,
        userName: this.userName,
        description: `Quotation ${quotation.quotationNumber} created`,
        data: { quotationId: quotation.id, total },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate quotation",
        code: "QUOTATION_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // Documents
  // --------------------------------------------------------------------------

  async addDocument(
    projectId: string,
    document: Omit<
      ProjectDocument,
      "id" | "uploadedAt" | "uploadedBy" | "version"
    >
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

      const newDoc: ProjectDocument = {
        ...document,
        id: this.generateId(),
        uploadedAt: new Date(),
        uploadedBy: this.userId,
        version: 1,
      };

      const documents = [...project.documents, newDoc];
      const updated = await this.repository.update(projectId, {
        documents,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.DOCUMENT_UPLOADED,
        userId: this.userId,
        userName: this.userName,
        description: `Document uploaded: ${document.name}`,
        data: { documentId: newDoc.id, type: document.type },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to add document",
        code: "ADD_DOC_FAILED",
      };
    }
  }

  async removeDocument(
    projectId: string,
    documentId: string
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

      const documents = project.documents.filter((d) => d.id !== documentId);
      const updated = await this.repository.update(projectId, {
        documents,
        lastModifiedBy: this.userId,
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to remove document",
        code: "REMOVE_DOC_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // Notes
  // --------------------------------------------------------------------------

  async addNote(
    projectId: string,
    content: string,
    type: NoteType = NoteType.GENERAL,
    isPrivate = false
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

      const note: ProjectNote = {
        id: this.generateId(),
        content,
        type,
        createdAt: new Date(),
        createdBy: this.userId,
        isPrivate,
      };

      const notes = [...project.notes, note];
      const updated = await this.repository.update(projectId, {
        notes,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.NOTE_ADDED,
        userId: this.userId,
        userName: this.userName,
        description: `Note added`,
        data: { noteId: note.id, type },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add note",
        code: "ADD_NOTE_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // Team Management
  // --------------------------------------------------------------------------

  async addTeamMember(
    projectId: string,
    member: Omit<TeamMember, "addedAt">
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

      // Check if user already in team
      if (project.team.some((m) => m.userId === member.userId)) {
        return {
          success: false,
          error: "User already in team",
          code: "DUPLICATE_MEMBER",
        };
      }

      const newMember: TeamMember = {
        ...member,
        addedAt: new Date(),
      };

      const team = [...project.team, newMember];
      const updated = await this.repository.update(projectId, {
        team,
        lastModifiedBy: this.userId,
      });

      await this.repository.addEvent(projectId, {
        type: ProjectEventType.TEAM_MEMBER_ADDED,
        userId: this.userId,
        userName: this.userName,
        description: `Team member added: ${member.name}`,
        data: { memberId: member.userId, role: member.role },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to add team member",
        code: "ADD_MEMBER_FAILED",
      };
    }
  }

  async removeTeamMember(
    projectId: string,
    userId: string
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

      // Cannot remove owner
      const member = project.team.find((m) => m.userId === userId);
      if (member?.role === TeamRole.OWNER) {
        return {
          success: false,
          error: "Cannot remove project owner",
          code: "CANNOT_REMOVE_OWNER",
        };
      }

      const team = project.team.filter((m) => m.userId !== userId);
      const updated = await this.repository.update(projectId, {
        team,
        lastModifiedBy: this.userId,
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove team member",
        code: "REMOVE_MEMBER_FAILED",
      };
    }
  }

  // --------------------------------------------------------------------------
  // Milestones
  // --------------------------------------------------------------------------

  async addMilestone(
    projectId: string,
    milestone: Omit<Milestone, "id" | "status">
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

      const newMilestone: Milestone = {
        ...milestone,
        id: this.generateId(),
        status: MilestoneStatus.PENDING,
      };

      const milestones = [...project.milestones, newMilestone];
      const updated = await this.repository.update(projectId, {
        milestones,
        lastModifiedBy: this.userId,
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to add milestone",
        code: "ADD_MILESTONE_FAILED",
      };
    }
  }

  async completeMilestone(
    projectId: string,
    milestoneId: string
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

      const milestones = project.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, status: MilestoneStatus.COMPLETED, completedAt: new Date() }
          : m
      );

      const updated = await this.repository.update(projectId, {
        milestones,
        lastModifiedBy: this.userId,
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete milestone",
        code: "COMPLETE_MILESTONE_FAILED",
      };
    }
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

  private doorDataToModel(data: DoorModelData): DoorModel {
    // Simple conversion - DoorModel is basically DoorModelData with methods
    return data as unknown as DoorModel;
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }

  private generateQuotationNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `QT${year}${month}-${random}`;
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
