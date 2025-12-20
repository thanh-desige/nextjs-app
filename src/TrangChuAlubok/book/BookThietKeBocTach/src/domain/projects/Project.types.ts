/**
 * Project.types.ts
 * Type definitions for project management
 */

import {
  DoorModelData,
  DoorType,
  GlassType,
  FrameType,
} from "../door/DoorModel";
import { ProfileSystem } from "../materials/Material.types";
import { BomDocument } from "../bom/BomItem";
import { CustomerTier } from "../rules/PricingRules";

// ============================================================================
// Project Core Types
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  version: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;

  // Status
  status: ProjectStatus;
  phase: ProjectPhase;

  // Customer Info
  customer: CustomerInfo;

  // Location
  location: ProjectLocation;

  // Design Data
  doors: DoorModelData[];

  // Documents
  documents: ProjectDocument[];

  // BOM & Pricing
  bom?: BomDocument;
  quotation?: Quotation;

  // Tags & Categories
  tags: string[];
  category: ProjectCategory;

  // Collaborators
  team: TeamMember[];

  // Timeline
  milestones: Milestone[];

  // Notes
  notes: ProjectNote[];

  // Settings
  settings: ProjectSettings;
}

// ============================================================================
// Status & Phase
// ============================================================================

export enum ProjectStatus {
  DRAFT = "draft",
  IN_PROGRESS = "in_progress",
  PENDING_REVIEW = "pending_review",
  APPROVED = "approved",
  ON_HOLD = "on_hold",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export enum ProjectPhase {
  INQUIRY = "inquiry",
  CONSULTATION = "consultation",
  DESIGN = "design",
  QUOTATION = "quotation",
  NEGOTIATION = "negotiation",
  ORDER = "order",
  PRODUCTION = "production",
  DELIVERY = "delivery",
  INSTALLATION = "installation",
  WARRANTY = "warranty",
}

export enum ProjectCategory {
  RESIDENTIAL = "residential",
  COMMERCIAL = "commercial",
  INDUSTRIAL = "industrial",
  HOSPITALITY = "hospitality",
  HEALTHCARE = "healthcare",
  EDUCATION = "education",
  GOVERNMENT = "government",
  MIXED_USE = "mixed_use",
}

// ============================================================================
// Customer Information
// ============================================================================

export interface CustomerInfo {
  id: string;
  type: CustomerType;

  // Personal/Company
  name: string;
  companyName?: string;
  taxId?: string;

  // Contact
  phone: string;
  email?: string;
  address: Address;

  // Relationship
  tier: CustomerTier;
  totalOrders: number;
  totalValue: number;

  // Preferences
  preferredContact: "phone" | "email" | "zalo" | "messenger";
  notes: string;
}

export enum CustomerType {
  INDIVIDUAL = "individual",
  CONTRACTOR = "contractor",
  ARCHITECT = "architect",
  DEVELOPER = "developer",
  RESELLER = "reseller",
}

export interface Address {
  street: string;
  ward?: string;
  district: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
}

// ============================================================================
// Location
// ============================================================================

export interface ProjectLocation {
  address: Address;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  floorLevel?: number;
  buildingName?: string;
  accessNotes?: string;
}

// ============================================================================
// Documents
// ============================================================================

export interface ProjectDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  version: number;
  tags: string[];
}

export enum DocumentType {
  DRAWING = "drawing",
  PHOTO = "photo",
  QUOTATION = "quotation",
  CONTRACT = "contract",
  INVOICE = "invoice",
  RECEIPT = "receipt",
  SPECIFICATION = "specification",
  APPROVAL = "approval",
  WARRANTY = "warranty",
  OTHER = "other",
}

// ============================================================================
// Quotation
// ============================================================================

export interface Quotation {
  id: string;
  projectId: string;
  version: number;

  // Header
  quotationNumber: string;
  issueDate: Date;
  validUntil: Date;

  // Items
  items: QuotationItem[];

  // Pricing
  subtotal: number;
  discounts: QuotationDiscount[];
  discountTotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;

  // Terms
  paymentTerms: PaymentTerms;
  deliveryTerms: string;
  warranty: string;
  notes: string;

  // Status
  status: QuotationStatus;

  // Approval
  approvedBy?: string;
  approvedAt?: Date;
  customerSignature?: string;
  signedAt?: Date;
}

export interface QuotationItem {
  id: string;
  doorId: string;
  description: string;
  specifications: {
    type: DoorType;
    width: number;
    height: number;
    profileSystem: ProfileSystem;
    glassType: GlassType;
    frameType: FrameType;
  };
  quantity: number;
  unitPrice: number;
  amount: number;
  notes?: string;
}

export interface QuotationDiscount {
  description: string;
  type: "percent" | "fixed";
  value: number;
  amount: number;
}

export interface PaymentTerms {
  depositPercent: number;
  depositDueDate?: Date;
  progressPayments: {
    percent: number;
    milestone: string;
    dueDate?: Date;
  }[];
  finalPaymentPercent: number;
  paymentMethods: string[];
}

export enum QuotationStatus {
  DRAFT = "draft",
  SENT = "sent",
  VIEWED = "viewed",
  NEGOTIATING = "negotiating",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
  SUPERSEDED = "superseded",
}

// ============================================================================
// Team & Collaboration
// ============================================================================

export interface TeamMember {
  userId: string;
  name: string;
  role: TeamRole;
  email: string;
  permissions: ProjectPermission[];
  addedAt: Date;
}

export enum TeamRole {
  OWNER = "owner",
  MANAGER = "manager",
  DESIGNER = "designer",
  SALES = "sales",
  INSTALLER = "installer",
  VIEWER = "viewer",
}

export enum ProjectPermission {
  VIEW = "view",
  EDIT = "edit",
  DELETE = "delete",
  SHARE = "share",
  EXPORT = "export",
  MANAGE_TEAM = "manage_team",
  APPROVE = "approve",
}

// ============================================================================
// Timeline & Milestones
// ============================================================================

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  completedAt?: Date;
  status: MilestoneStatus;
  dependencies: string[];
  assignee?: string;
}

export enum MilestoneStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
}

// ============================================================================
// Notes & Comments
// ============================================================================

export interface ProjectNote {
  id: string;
  content: string;
  type: NoteType;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  isPrivate: boolean;
  attachments?: string[];
  mentions?: string[];
}

export enum NoteType {
  GENERAL = "general",
  DESIGN = "design",
  CUSTOMER_FEEDBACK = "customer_feedback",
  INTERNAL = "internal",
  ISSUE = "issue",
  RESOLUTION = "resolution",
}

// ============================================================================
// Settings
// ============================================================================

export interface ProjectSettings {
  // Default preferences
  defaultProfileSystem: ProfileSystem;
  defaultGlassType: GlassType;
  defaultFrameType: FrameType;

  // Pricing
  currency: string;
  taxRate: number;
  marginPercent: number;

  // Units
  measurementUnit: "mm" | "cm" | "m";

  // Notifications
  notifyOnChange: boolean;
  notifyOnComment: boolean;

  // Sharing
  isPublicLink: boolean;
  publicLinkExpiry?: Date;

  // Export
  defaultExportFormat: "pdf" | "dwg" | "dxf" | "json";
}

// ============================================================================
// Project Summary (for lists)
// ============================================================================

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  phase: ProjectPhase;
  customerName: string;
  location: string;
  doorCount: number;
  totalArea: number;
  quotationTotal?: number;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}

// ============================================================================
// Project Filters
// ============================================================================

export interface ProjectFilter {
  search?: string;
  status?: ProjectStatus[];
  phase?: ProjectPhase[];
  category?: ProjectCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customerId?: string;
  assigneeId?: string;
  tags?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface ProjectSort {
  field: "name" | "createdAt" | "updatedAt" | "status" | "quotationTotal";
  direction: "asc" | "desc";
}

export interface ProjectPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// Project Events (for history/audit)
// ============================================================================

export interface ProjectEvent {
  id: string;
  projectId: string;
  type: ProjectEventType;
  timestamp: Date;
  userId: string;
  userName: string;
  description: string;
  data?: Record<string, unknown>;
}

export enum ProjectEventType {
  CREATED = "created",
  UPDATED = "updated",
  STATUS_CHANGED = "status_changed",
  PHASE_CHANGED = "phase_changed",
  DOOR_ADDED = "door_added",
  DOOR_UPDATED = "door_updated",
  DOOR_REMOVED = "door_removed",
  QUOTATION_CREATED = "quotation_created",
  QUOTATION_SENT = "quotation_sent",
  QUOTATION_ACCEPTED = "quotation_accepted",
  DOCUMENT_UPLOADED = "document_uploaded",
  TEAM_MEMBER_ADDED = "team_member_added",
  NOTE_ADDED = "note_added",
  EXPORTED = "exported",
  ARCHIVED = "archived",
}

// ============================================================================
// Project Template
// ============================================================================

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  defaultSettings: ProjectSettings;
  defaultDoors: Partial<DoorModelData>[];
  defaultMilestones: Partial<Milestone>[];
  createdBy: string;
  isPublic: boolean;
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDefaultProject(
  name: string,
  createdBy: string,
  customer?: Partial<CustomerInfo>
): Project {
  const now = new Date();

  return {
    id: generateProjectId(),
    name,
    description: "",
    version: "1.0.0",

    createdAt: now,
    updatedAt: now,
    createdBy,
    lastModifiedBy: createdBy,

    status: ProjectStatus.DRAFT,
    phase: ProjectPhase.INQUIRY,

    customer: {
      id: "",
      type: CustomerType.INDIVIDUAL,
      name: "",
      phone: "",
      address: {
        street: "",
        district: "",
        city: "",
        province: "",
        country: "Việt Nam",
      },
      tier: "standard" as CustomerTier,
      totalOrders: 0,
      totalValue: 0,
      preferredContact: "phone",
      notes: "",
      ...customer,
    },

    location: {
      address: {
        street: "",
        district: "",
        city: "",
        province: "",
        country: "Việt Nam",
      },
    },

    doors: [],
    documents: [],
    tags: [],
    category: ProjectCategory.RESIDENTIAL,
    team: [
      {
        userId: createdBy,
        name: createdBy,
        role: TeamRole.OWNER,
        email: "",
        permissions: Object.values(ProjectPermission),
        addedAt: now,
      },
    ],
    milestones: [],
    notes: [],

    settings: {
      defaultProfileSystem: ProfileSystem.XINGFA,
      defaultGlassType: GlassType.SINGLE,
      defaultFrameType: FrameType.STANDARD,
      currency: "VND",
      taxRate: 10,
      marginPercent: 30,
      measurementUnit: "mm",
      notifyOnChange: true,
      notifyOnComment: true,
      isPublicLink: false,
      defaultExportFormat: "pdf",
    },
  };
}

export function createProjectSummary(project: Project): ProjectSummary {
  const totalArea = project.doors.reduce((sum, door) => {
    return sum + (door.dimensions.width * door.dimensions.height) / 1000000;
  }, 0);

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    phase: project.phase,
    customerName: project.customer.name,
    location: `${project.location.address.district}, ${project.location.address.city}`,
    doorCount: project.doors.length,
    totalArea,
    quotationTotal: project.quotation?.total,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function generateProjectId(): string {
  const prefix = "PRJ";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
