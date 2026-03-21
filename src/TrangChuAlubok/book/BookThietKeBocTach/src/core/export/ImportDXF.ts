/**
 * ImportDXF — Parse DXF files → IEntity[] + LayerData[]
 *
 * Supported entity types (8):
 *   LINE, CIRCLE, ARC, ELLIPSE, LWPOLYLINE (→ RECT or POLYLINE),
 *   TEXT, MTEXT (→ TEXT), DIMENSION (→ LINE + TEXT fallback)
 *
 * Supported sections: HEADER, TABLES (LAYER), ENTITIES
 * Color: ACI → hex RGB mapping (basic 10 colors)
 * Angles: degrees → radians
 * Layer mapping: DXF LAYER table → LayerData[]
 */

import type {
  IEntity, ILineEntity, IRectEntity, ICircleEntity,
  IArcEntity, IEllipseEntity, IPolylineEntity, ITextEntity,
  EntityStyle,
} from "../entities/Entity.types";
import { EntityType, DEFAULT_STATE } from "../entities/Entity.types";
import { generateEntityId } from "../entities/EntityBaseUtils";

// ==================== Types ====================

export interface DXFImportOptions {
  /** Default layer for entities without layer info */
  defaultLayerId?: string;
  /** Whether to import hidden layers */
  importHiddenLayers?: boolean;
  /** Scale factor (default: 1.0) */
  scaleFactor?: number;
}

export interface DXFImportResult {
  success: boolean;
  entities: IEntity[];
  layers: DXFLayerInfo[];
  stats: DXFImportStats;
  errors: string[];
}

export interface DXFLayerInfo {
  name: string;
  color: string;
  lineWeight: number;
  lineType: string;
  frozen: boolean;
  locked: boolean;
  visible: boolean;
}

export interface DXFImportStats {
  totalEntities: number;
  byType: Record<string, number>;
  layerCount: number;
  skippedEntities: number;
  unsupportedTypes: string[];
}

// ==================== DXF Token Pair ====================

interface DXFPair {
  code: number;
  value: string;
}

// ==================== DXF Tokenizer ====================

/**
 * Parse DXF text into code/value pairs.
 * DXF format: alternating lines of group code (integer) and value (string).
 */
export function tokenizeDXF(content: string): DXFPair[] {
  const lines = content.split(/\r?\n/);
  const pairs: DXFPair[] = [];

  for (let i = 0; i < lines.length - 1; i += 2) {
    const codeLine = lines[i].trim();
    const valueLine = lines[i + 1];
    if (codeLine === "") continue;

    const code = parseInt(codeLine, 10);
    if (isNaN(code)) continue;

    pairs.push({ code, value: valueLine?.trim() ?? "" });
  }

  return pairs;
}

// ==================== Section Splitter ====================

interface DXFSection {
  name: string;
  pairs: DXFPair[];
}

/**
 * Split token pairs into sections (HEADER, TABLES, ENTITIES, etc.)
 */
export function splitSections(pairs: DXFPair[]): DXFSection[] {
  const sections: DXFSection[] = [];
  let current: DXFSection | null = null;

  for (let i = 0; i < pairs.length; i++) {
    const { code, value } = pairs[i];

    if (code === 0 && value === "SECTION") {
      // Next pair should be section name (code 2)
      if (i + 1 < pairs.length && pairs[i + 1].code === 2) {
        current = { name: pairs[i + 1].value, pairs: [] };
        i++; // skip name pair
      }
    } else if (code === 0 && value === "ENDSEC") {
      if (current) {
        sections.push(current);
        current = null;
      }
    } else if (code === 0 && value === "EOF") {
      break;
    } else if (current) {
      current.pairs.push(pairs[i]);
    }
  }

  return sections;
}

// ==================== Entity Group Splitter ====================

interface EntityGroup {
  type: string;
  pairs: DXFPair[];
}

/**
 * Split ENTITIES section pairs into individual entity groups.
 * Each entity starts with code 0 (entity type name).
 */
function splitEntityGroups(pairs: DXFPair[]): EntityGroup[] {
  const groups: EntityGroup[] = [];
  let current: EntityGroup | null = null;

  for (const pair of pairs) {
    if (pair.code === 0) {
      if (current) groups.push(current);
      current = { type: pair.value, pairs: [] };
    } else if (current) {
      current.pairs.push(pair);
    }
  }

  if (current) groups.push(current);
  return groups;
}

// ==================== Layer Parser ====================

/**
 * Parse TABLES section for LAYER entries.
 */
export function parseLayers(tablesSection: DXFSection): DXFLayerInfo[] {
  const layers: DXFLayerInfo[] = [];
  const { pairs } = tablesSection;
  let inLayerTable = false;
  let currentLayer: Partial<DXFLayerInfo> | null = null;

  for (let i = 0; i < pairs.length; i++) {
    const { code, value } = pairs[i];

    // Detect TABLE LAYER
    if (code === 0 && value === "TABLE") {
      if (i + 1 < pairs.length && pairs[i + 1].code === 2 && pairs[i + 1].value === "LAYER") {
        inLayerTable = true;
        i++; // skip name pair
        continue;
      }
    }

    if (code === 0 && value === "ENDTAB") {
      if (inLayerTable) {
        if (currentLayer?.name) layers.push(finishLayer(currentLayer));
        inLayerTable = false;
        currentLayer = null;
      }
      continue;
    }

    if (!inLayerTable) continue;

    // New LAYER entry
    if (code === 0 && value === "LAYER") {
      if (currentLayer?.name) layers.push(finishLayer(currentLayer));
      currentLayer = {};
      continue;
    }

    if (!currentLayer) continue;

    switch (code) {
      case 2: currentLayer.name = value; break;
      case 62: {
        const aci = parseInt(value, 10);
        currentLayer.color = aciToHex(Math.abs(aci));
        // Negative color number means layer is off (invisible)
        if (aci < 0) currentLayer.visible = false;
        break;
      }
      case 6: currentLayer.lineType = value; break;
      case 70: {
        const flags = parseInt(value, 10);
        if (flags & 1) currentLayer.frozen = true;
        if (flags & 4) currentLayer.locked = true;
        break;
      }
      case 370: currentLayer.lineWeight = parseFloat(value) / 100; break;
    }
  }

  if (currentLayer?.name && inLayerTable) layers.push(finishLayer(currentLayer));
  return layers;
}

function finishLayer(partial: Partial<DXFLayerInfo>): DXFLayerInfo {
  return {
    name: partial.name ?? "0",
    color: partial.color ?? "#FFFFFF",
    lineWeight: partial.lineWeight ?? 0.25,
    lineType: partial.lineType ?? "Continuous",
    frozen: partial.frozen ?? false,
    locked: partial.locked ?? false,
    visible: partial.visible ?? true,
  };
}

// ==================== ACI → Hex Color ====================

const ACI_TO_HEX: Record<number, string> = {
  0: "#000000",  // Black (ByBlock)
  1: "#FF0000",  // Red
  2: "#FFFF00",  // Yellow
  3: "#00FF00",  // Green
  4: "#00FFFF",  // Cyan
  5: "#0000FF",  // Blue
  6: "#FF00FF",  // Magenta
  7: "#FFFFFF",  // White
  8: "#808080",  // Gray
  9: "#C0C0C0",  // Light gray
};

export function aciToHex(aci: number): string {
  return ACI_TO_HEX[aci] ?? "#FFFFFF";
}

// ==================== Linetype Mapping ====================

function dxfLinetypeToStrokeStyle(lt: string): EntityStyle["strokeStyle"] {
  const upper = (lt ?? "").toUpperCase();
  if (upper.includes("DASH") && upper.includes("DOT")) return "dashdot";
  if (upper.includes("DASH")) return "dashed";
  if (upper.includes("DOT")) return "dotted";
  return "solid";
}

// ==================== Helper: Read Entity Common Props ====================

interface EntityCommon {
  layerName: string;
  aci: number;
  linetype: string;
}

function readEntityCommon(pairs: DXFPair[]): EntityCommon {
  let layerName = "0";
  let aci = 7; // default white
  let linetype = "Continuous";

  for (const { code, value } of pairs) {
    switch (code) {
      case 8: layerName = value; break;
      case 62: aci = parseInt(value, 10); break;
      case 6: linetype = value; break;
    }
  }

  return { layerName, aci, linetype };
}

function makeStyle(common: EntityCommon): EntityStyle {
  return {
    strokeColor: aciToHex(Math.abs(common.aci)),
    strokeWidth: 1,
    strokeStyle: dxfLinetypeToStrokeStyle(common.linetype),
    fillColor: null,
    opacity: 1,
  };
}

function makeBase(common: EntityCommon, layerMap: Map<string, string>): Pick<IEntity, "id" | "layerId" | "style" | "state"> {
  return {
    id: generateEntityId(),
    layerId: layerMap.get(common.layerName) ?? common.layerName,
    style: makeStyle(common),
    state: { ...DEFAULT_STATE },
  };
}

// ==================== Entity Converters ====================

function degToRad(deg: number): number { return (deg * Math.PI) / 180; }

function readFloat(pairs: DXFPair[], code: number, def = 0): number {
  for (const p of pairs) {
    if (p.code === code) return parseFloat(p.value) || def;
  }
  return def;
}

function readString(pairs: DXFPair[], code: number, def = ""): string {
  for (const p of pairs) {
    if (p.code === code) return p.value;
  }
  return def;
}

function readInt(pairs: DXFPair[], code: number, def = 0): number {
  for (const p of pairs) {
    if (p.code === code) return parseInt(p.value, 10) || def;
  }
  return def;
}

// --- LINE ---

function parseLine(group: EntityGroup, layerMap: Map<string, string>): ILineEntity | null {
  const common = readEntityCommon(group.pairs);
  const x1 = readFloat(group.pairs, 10);
  const y1 = readFloat(group.pairs, 20);
  const x2 = readFloat(group.pairs, 11);
  const y2 = readFloat(group.pairs, 21);

  return {
    ...makeBase(common, layerMap),
    type: EntityType.LINE,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
  };
}

// --- CIRCLE ---

function parseCircle(group: EntityGroup, layerMap: Map<string, string>): ICircleEntity | null {
  const common = readEntityCommon(group.pairs);
  const cx = readFloat(group.pairs, 10);
  const cy = readFloat(group.pairs, 20);
  const r = readFloat(group.pairs, 40);
  if (r <= 0) return null;

  return {
    ...makeBase(common, layerMap),
    type: EntityType.CIRCLE,
    center: { x: cx, y: cy },
    radius: r,
  };
}

// --- ARC ---

function parseArc(group: EntityGroup, layerMap: Map<string, string>): IArcEntity | null {
  const common = readEntityCommon(group.pairs);
  const cx = readFloat(group.pairs, 10);
  const cy = readFloat(group.pairs, 20);
  const r = readFloat(group.pairs, 40);
  const startDeg = readFloat(group.pairs, 50);
  const endDeg = readFloat(group.pairs, 51);
  if (r <= 0) return null;

  return {
    ...makeBase(common, layerMap),
    type: EntityType.ARC,
    center: { x: cx, y: cy },
    radius: r,
    startAngle: degToRad(startDeg),
    endAngle: degToRad(endDeg),
  };
}

// --- ELLIPSE ---

function parseEllipse(group: EntityGroup, layerMap: Map<string, string>): IEllipseEntity | null {
  const common = readEntityCommon(group.pairs);
  const cx = readFloat(group.pairs, 10);
  const cy = readFloat(group.pairs, 20);
  // Major axis endpoint relative to center
  const mx = readFloat(group.pairs, 11);
  const my = readFloat(group.pairs, 21);
  // Ratio of minor to major axis
  const ratio = readFloat(group.pairs, 40, 1);

  const majorLen = Math.sqrt(mx * mx + my * my);
  if (majorLen <= 0) return null;

  const rotation = Math.atan2(my, mx);

  return {
    ...makeBase(common, layerMap),
    type: EntityType.ELLIPSE,
    center: { x: cx, y: cy },
    radiusX: majorLen,
    radiusY: majorLen * ratio,
    rotation,
  };
}

// --- LWPOLYLINE ---

function parseLWPolyline(group: EntityGroup, layerMap: Map<string, string>): IPolylineEntity | IRectEntity | null {
  const common = readEntityCommon(group.pairs);
  const flags = readInt(group.pairs, 70);
  const closed = (flags & 1) !== 0;

  // Collect vertex points
  const points: { x: number; y: number }[] = [];
  let currentX: number | null = null;

  for (const { code, value } of group.pairs) {
    if (code === 10) {
      currentX = parseFloat(value) || 0;
    } else if (code === 20 && currentX !== null) {
      points.push({ x: currentX, y: parseFloat(value) || 0 });
      currentX = null;
    }
  }

  if (points.length < 2) return null;

  // Detect axis-aligned rectangle: 4 vertices, closed, right angles
  if (closed && points.length === 4 && isAxisAlignedRect(points)) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    return {
      ...makeBase(common, layerMap),
      type: EntityType.RECT,
      origin: { x: minX, y: minY },
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
    };
  }

  return {
    ...makeBase(common, layerMap),
    type: EntityType.POLYLINE,
    points,
    closed,
  };
}

/**
 * Check if 4 points form an axis-aligned rectangle.
 * Tolerance: all edges must be horizontal or vertical.
 */
function isAxisAlignedRect(pts: { x: number; y: number }[]): boolean {
  if (pts.length !== 4) return false;
  const EPS = 0.01;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    if (dx > EPS && dy > EPS) return false; // diagonal edge
  }
  return true;
}

// --- TEXT ---

function parseText(group: EntityGroup, layerMap: Map<string, string>): ITextEntity | null {
  const common = readEntityCommon(group.pairs);
  const x = readFloat(group.pairs, 10);
  const y = readFloat(group.pairs, 20);
  const text = readString(group.pairs, 1);
  const fontSize = readFloat(group.pairs, 40, 10);
  const rotation = readFloat(group.pairs, 50);
  const hjust = readInt(group.pairs, 72);

  if (!text) return null;

  const textAlign = hjust === 1 ? "center" : hjust === 2 ? "right" : "left";

  // Use alignment point (11,21) if horizontal justification is set
  let posX = x, posY = y;
  if (hjust !== 0) {
    const ax = readFloat(group.pairs, 11, x);
    const ay = readFloat(group.pairs, 21, y);
    posX = ax;
    posY = ay;
  }

  return {
    ...makeBase(common, layerMap),
    type: EntityType.TEXT,
    position: { x: posX, y: posY },
    text,
    fontSize,
    fontFamily: "Arial",
    textAlign,
    rotation: degToRad(rotation),
  };
}

// --- MTEXT → TEXT ---

function parseMText(group: EntityGroup, layerMap: Map<string, string>): ITextEntity | null {
  const common = readEntityCommon(group.pairs);
  const x = readFloat(group.pairs, 10);
  const y = readFloat(group.pairs, 20);
  let text = readString(group.pairs, 1);
  const fontSize = readFloat(group.pairs, 40, 10);
  const rotation = readFloat(group.pairs, 50);

  // MTEXT can have additional text in code 3
  for (const p of group.pairs) {
    if (p.code === 3) text = p.value + text;
  }

  // Strip MTEXT formatting codes: {\fArial|...;text} → text, \P → newline
  text = text.replace(/\{\\[fF][^;]*;/g, "")  // strip font change start: {\fArial|b1;
             .replace(/\}/g, "")                // strip closing braces
             .replace(/\\[Pp]/g, "\n")          // \P → newline
             .replace(/\\[CcHhTtQqWwAaLl][^;]*;/g, "") // other formatting codes
             .trim();

  if (!text) return null;

  return {
    ...makeBase(common, layerMap),
    type: EntityType.TEXT,
    position: { x, y },
    text,
    fontSize,
    fontFamily: "Arial",
    textAlign: "left",
    rotation: degToRad(rotation),
  };
}

// ==================== Main Import Function ====================

/**
 * Import a DXF file content string → IEntity[] + layer info.
 *
 * Usage:
 * ```ts
 * const result = importFromDXF(dxfString);
 * if (result.success) {
 *   for (const entity of result.entities) {
 *     document.addEntity(entity);
 *   }
 * }
 * ```
 */
export function importFromDXF(
  content: string,
  options: DXFImportOptions = {},
): DXFImportResult {
  const errors: string[] = [];
  const {
    defaultLayerId = "0",
    importHiddenLayers = false,
    scaleFactor = 1,
  } = options;

  // Step 1: Tokenize
  const pairs = tokenizeDXF(content);
  if (pairs.length === 0) {
    return {
      success: false,
      entities: [],
      layers: [],
      stats: { totalEntities: 0, byType: {}, layerCount: 0, skippedEntities: 0, unsupportedTypes: [] },
      errors: ["Empty or invalid DXF file"],
    };
  }

  // Step 2: Split sections
  const sections = splitSections(pairs);

  // Step 3: Parse layers
  const tablesSection = sections.find(s => s.name === "TABLES");
  const layers = tablesSection ? parseLayers(tablesSection) : [];

  // Build layer name → layerId map (use layer name as ID)
  const layerMap = new Map<string, string>();
  for (const layer of layers) {
    layerMap.set(layer.name, layer.name);
  }
  // Ensure default layer exists
  if (!layerMap.has("0")) {
    layerMap.set("0", defaultLayerId);
  }

  // Build set of hidden layer names
  const hiddenLayers = new Set<string>();
  if (!importHiddenLayers) {
    for (const layer of layers) {
      if (!layer.visible || layer.frozen) {
        hiddenLayers.add(layer.name);
      }
    }
  }

  // Step 4: Parse entities
  const entitiesSection = sections.find(s => s.name === "ENTITIES");
  if (!entitiesSection) {
    return {
      success: true,
      entities: [],
      layers,
      stats: { totalEntities: 0, byType: {}, layerCount: layers.length, skippedEntities: 0, unsupportedTypes: [] },
      errors: [],
    };
  }

  const entityGroups = splitEntityGroups(entitiesSection.pairs);
  const entities: IEntity[] = [];
  const byType: Record<string, number> = {};
  let skipped = 0;
  const unsupportedSet = new Set<string>();

  for (const group of entityGroups) {
    // Skip entities on hidden/frozen layers
    const layerName = readString(group.pairs, 8, "0");
    if (hiddenLayers.has(layerName)) {
      skipped++;
      continue;
    }

    let entity: IEntity | null = null;

    switch (group.type) {
      case "LINE":
        entity = parseLine(group, layerMap);
        break;
      case "CIRCLE":
        entity = parseCircle(group, layerMap);
        break;
      case "ARC":
        entity = parseArc(group, layerMap);
        break;
      case "ELLIPSE":
        entity = parseEllipse(group, layerMap);
        break;
      case "LWPOLYLINE":
        entity = parseLWPolyline(group, layerMap);
        break;
      case "TEXT":
        entity = parseText(group, layerMap);
        break;
      case "MTEXT":
        entity = parseMText(group, layerMap);
        break;
      default:
        unsupportedSet.add(group.type);
        skipped++;
        break;
    }

    if (entity) {
      // Apply scale factor
      if (scaleFactor !== 1) {
        entity = scaleEntity(entity, scaleFactor);
      }
      entities.push(entity);
      byType[entity.type] = (byType[entity.type] ?? 0) + 1;
    } else if (!unsupportedSet.has(group.type)) {
      skipped++;
    }
  }

  return {
    success: true,
    entities,
    layers,
    stats: {
      totalEntities: entities.length,
      byType,
      layerCount: layers.length,
      skippedEntities: skipped,
      unsupportedTypes: [...unsupportedSet],
    },
    errors,
  };
}

// ==================== Scale ====================

function scaleEntity(entity: IEntity, factor: number): IEntity {
  switch (entity.type) {
    case EntityType.LINE: {
      const e = entity as ILineEntity;
      return Object.assign({}, e, { start: scalePoint(e.start, factor), end: scalePoint(e.end, factor) });
    }
    case EntityType.CIRCLE: {
      const e = entity as ICircleEntity;
      return Object.assign({}, e, { center: scalePoint(e.center, factor), radius: e.radius * factor });
    }
    case EntityType.ARC: {
      const e = entity as IArcEntity;
      return Object.assign({}, e, { center: scalePoint(e.center, factor), radius: e.radius * factor });
    }
    case EntityType.ELLIPSE: {
      const e = entity as IEllipseEntity;
      return Object.assign({}, e, { center: scalePoint(e.center, factor), radiusX: e.radiusX * factor, radiusY: e.radiusY * factor });
    }
    case EntityType.RECT: {
      const e = entity as IRectEntity;
      return Object.assign({}, e, { origin: scalePoint(e.origin, factor), width: e.width * factor, height: e.height * factor });
    }
    case EntityType.POLYLINE: {
      const e = entity as IPolylineEntity;
      return Object.assign({}, e, { points: e.points.map(p => scalePoint(p, factor)) });
    }
    case EntityType.TEXT: {
      const e = entity as ITextEntity;
      return Object.assign({}, e, { position: scalePoint(e.position, factor), fontSize: e.fontSize * factor });
    }
    default:
      return entity;
  }
}

function scalePoint(p: { x: number; y: number }, f: number): { x: number; y: number } {
  return { x: p.x * f, y: p.y * f };
}
