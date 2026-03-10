/**
 * projectCollaborationOps.ts — Document, Note, Team & Milestone operations
 *
 * Extracted in STEP-5.15 from ProjectService.ts
 */

import { IProjectRepository } from "./ProjectRepository";
import {
  Project,
  ProjectEventType,
  ProjectDocument,
  ProjectNote,
  NoteType,
  TeamMember,
  TeamRole,
  Milestone,
  MilestoneStatus,
} from "./Project.types";

// ============================================================================
// Context
// ============================================================================

export interface CollabOpContext {
  repository: IProjectRepository;
  userId: string;
  userName: string;
}

// ============================================================================
// Result (structural match with ServiceResult)
// ============================================================================

interface OpResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ============================================================================
// Helper
// ============================================================================

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

// ============================================================================
// Document Operations
// ============================================================================

export async function addProjectDocument(
  ctx: CollabOpContext,
  projectId: string,
  document: Omit<
    ProjectDocument,
    "id" | "uploadedAt" | "uploadedBy" | "version"
  >
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    const newDoc: ProjectDocument = {
      ...document,
      id: generateId(),
      uploadedAt: new Date(),
      uploadedBy: ctx.userId,
      version: 1,
    };

    const documents = [...project.documents, newDoc];
    const updated = await ctx.repository.update(projectId, {
      documents,
      lastModifiedBy: ctx.userId,
    });

    await ctx.repository.addEvent(projectId, {
      type: ProjectEventType.DOCUMENT_UPLOADED,
      userId: ctx.userId,
      userName: ctx.userName,
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

export async function removeProjectDocument(
  ctx: CollabOpContext,
  projectId: string,
  documentId: string
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    const documents = project.documents.filter((d) => d.id !== documentId);
    const updated = await ctx.repository.update(projectId, {
      documents,
      lastModifiedBy: ctx.userId,
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

// ============================================================================
// Note Operations
// ============================================================================

export async function addProjectNote(
  ctx: CollabOpContext,
  projectId: string,
  content: string,
  type: NoteType = NoteType.GENERAL,
  isPrivate = false
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    const note: ProjectNote = {
      id: generateId(),
      content,
      type,
      createdAt: new Date(),
      createdBy: ctx.userId,
      isPrivate,
    };

    const notes = [...project.notes, note];
    const updated = await ctx.repository.update(projectId, {
      notes,
      lastModifiedBy: ctx.userId,
    });

    await ctx.repository.addEvent(projectId, {
      type: ProjectEventType.NOTE_ADDED,
      userId: ctx.userId,
      userName: ctx.userName,
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

// ============================================================================
// Team Operations
// ============================================================================

export async function addProjectTeamMember(
  ctx: CollabOpContext,
  projectId: string,
  member: Omit<TeamMember, "addedAt">
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
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
    const updated = await ctx.repository.update(projectId, {
      team,
      lastModifiedBy: ctx.userId,
    });

    await ctx.repository.addEvent(projectId, {
      type: ProjectEventType.TEAM_MEMBER_ADDED,
      userId: ctx.userId,
      userName: ctx.userName,
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

export async function removeProjectTeamMember(
  ctx: CollabOpContext,
  projectId: string,
  userId: string
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
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
    const updated = await ctx.repository.update(projectId, {
      team,
      lastModifiedBy: ctx.userId,
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

// ============================================================================
// Milestone Operations
// ============================================================================

export async function addProjectMilestone(
  ctx: CollabOpContext,
  projectId: string,
  milestone: Omit<Milestone, "id" | "status">
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    const newMilestone: Milestone = {
      ...milestone,
      id: generateId(),
      status: MilestoneStatus.PENDING,
    };

    const milestones = [...project.milestones, newMilestone];
    const updated = await ctx.repository.update(projectId, {
      milestones,
      lastModifiedBy: ctx.userId,
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

export async function completeProjectMilestone(
  ctx: CollabOpContext,
  projectId: string,
  milestoneId: string
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    const milestones = project.milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, status: MilestoneStatus.COMPLETED, completedAt: new Date() }
        : m
    );

    const updated = await ctx.repository.update(projectId, {
      milestones,
      lastModifiedBy: ctx.userId,
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
