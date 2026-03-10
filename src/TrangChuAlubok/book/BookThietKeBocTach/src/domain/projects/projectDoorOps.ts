/**
 * projectDoorOps.ts — Door management operations for ProjectService
 *
 * Extracted in STEP-5.15: addDoor, updateDoor, removeDoor
 */

import { IProjectRepository } from "./ProjectRepository";
import { Project, ProjectEventType } from "./Project.types";
import { DoorModelData } from "../door/DoorModel";

// ============================================================================
// Context
// ============================================================================

export interface ProjectOpContext {
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
// Door Operations
// ============================================================================

export async function addDoorToProject(
  ctx: ProjectOpContext,
  projectId: string,
  doorData: DoorModelData
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    const doors = [...project.doors, doorData];
    const updated = await ctx.repository.update(projectId, {
      doors,
      lastModifiedBy: ctx.userId,
    });

    await ctx.repository.addEvent(projectId, {
      type: ProjectEventType.DOOR_ADDED,
      userId: ctx.userId,
      userName: ctx.userName,
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

export async function updateProjectDoor(
  ctx: ProjectOpContext,
  projectId: string,
  doorId: string,
  updates: Partial<DoorModelData>
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
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

    const updated = await ctx.repository.update(projectId, {
      doors,
      lastModifiedBy: ctx.userId,
    });

    await ctx.repository.addEvent(projectId, {
      type: ProjectEventType.DOOR_UPDATED,
      userId: ctx.userId,
      userName: ctx.userName,
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

export async function removeDoorFromProject(
  ctx: ProjectOpContext,
  projectId: string,
  doorId: string
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    const doors = project.doors.filter((d) => d.id !== doorId);

    const updated = await ctx.repository.update(projectId, {
      doors,
      lastModifiedBy: ctx.userId,
    });

    await ctx.repository.addEvent(projectId, {
      type: ProjectEventType.DOOR_REMOVED,
      userId: ctx.userId,
      userName: ctx.userName,
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
