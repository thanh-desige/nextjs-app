/**
 * ProjectPanel - Panel for project management
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";

// ==================== Types ====================

export interface Project {
  id: string;
  name: string;
  description?: string;
  customer?: string;
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "in-progress" | "completed" | "archived";
  thumbnail?: string;
  doorCount: number;
  totalValue?: number;
}

export interface ProjectPanelProps {
  /** Available projects */
  projects: Project[];
  /** Currently active project */
  activeProjectId?: string;
  /** Open project handler */
  onOpen: (projectId: string) => void;
  /** Create new project handler */
  onCreate: () => void;
  /** Delete project handler */
  onDelete: (projectId: string) => void;
  /** Duplicate project handler */
  onDuplicate?: (projectId: string) => void;
  /** Export project handler */
  onExport?: (projectId: string) => void;
  /** Additional class name */
  className?: string;
}

// ==================== Helper Functions ====================

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;

  return date.toLocaleDateString("vi-VN");
};

const getStatusLabel = (status: Project["status"]): string => {
  const labels: Record<Project["status"], string> = {
    draft: "Nháp",
    "in-progress": "Đang thực hiện",
    completed: "Hoàn thành",
    archived: "Lưu trữ",
  };
  return labels[status];
};

const getStatusColor = (status: Project["status"]): string => {
  const colors: Record<Project["status"], string> = {
    draft: "bg-gray-500",
    "in-progress": "bg-blue-500",
    completed: "bg-green-500",
    archived: "bg-purple-500",
  };
  return colors[status];
};

// ==================== ProjectCard Component ====================

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  onOpen,
  onDelete,
  onDuplicate,
  onExport,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`
        relative bg-gray-800 rounded-lg overflow-hidden border transition-colors cursor-pointer
        ${
          isActive
            ? "border-blue-500 ring-2 ring-blue-500/30"
            : "border-gray-700 hover:border-gray-600"
        }
      `}
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-850 flex items-center justify-center relative">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.name}
            fill
            className="object-cover"
          />
        ) : (
          <svg
            className="w-12 h-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{project.name}</h4>
            {project.customer && (
              <p className="text-xs text-gray-500 truncate">
                {project.customer}
              </p>
            )}
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-700"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="16"
                height="16"
              >
                <circle cx="12" cy="6" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="18" r="2" />
              </svg>
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-gray-700 rounded shadow-lg py-1 z-10 min-w-32"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onOpen();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-600"
                >
                  Mở
                </button>
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-600"
                  >
                    Nhân bản
                  </button>
                )}
                {onExport && (
                  <button
                    type="button"
                    onClick={() => {
                      onExport();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-600"
                  >
                    Xuất file
                  </button>
                )}
                <hr className="my-1 border-gray-600" />
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-gray-600"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`px-1.5 py-0.5 rounded text-white ${getStatusColor(
                project.status
              )}`}
            >
              {getStatusLabel(project.status)}
            </span>
            <span className="text-gray-500">{project.doorCount} cửa</span>
          </div>
          <span className="text-gray-500">{formatDate(project.updatedAt)}</span>
        </div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
            Đang mở
          </span>
        </div>
      )}
    </div>
  );
};

// ==================== ProjectPanel Component ====================

export const ProjectPanel: React.FC<ProjectPanelProps> = ({
  projects,
  activeProjectId,
  onOpen,
  onCreate,
  onDelete,
  onDuplicate,
  onExport,
  className = "",
}) => {
  const [filter, setFilter] = useState<Project["status"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "status">("date");

  // Filter and sort projects
  const filteredProjects = React.useMemo(() => {
    let result = [...projects];

    // Filter by status
    if (filter !== "all") {
      result = result.filter((p) => p.status === filter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.customer?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, filter, searchQuery, sortBy]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">Dự Án</h3>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-700 bg-gray-850">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm dự án..."
          className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 outline-none focus:border-blue-500"
        />

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          <div className="flex rounded overflow-hidden border border-gray-700">
            {(["all", "draft", "in-progress", "completed"] as const).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 text-xs ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {status === "all" ? "Tất cả" : getStatusLabel(status)}
                </button>
              )
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="ml-auto bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded border border-gray-600 outline-none"
          >
            <option value="date">Mới nhất</option>
            <option value="name">Tên A-Z</option>
            <option value="status">Trạng thái</option>
          </select>
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="text-sm">Không có dự án nào</p>
            <button
              type="button"
              onClick={onCreate}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
            >
              Tạo dự án mới
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onOpen={() => onOpen(project.id)}
                onDelete={() => onDelete(project.id)}
                onDuplicate={
                  onDuplicate ? () => onDuplicate(project.id) : undefined
                }
                onExport={onExport ? () => onExport(project.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
        {filteredProjects.length} dự án
      </div>
    </div>
  );
};

export default ProjectPanel;
