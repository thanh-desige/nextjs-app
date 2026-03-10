/**
 * ExportDXF — R2000 (AC1015) DXF export matching AutoCAD 2013 format
 *
 * Key compatibility features (from AutoCAD 2013 reference file):
 *  - Group code padding (right-justified to 3 chars: "  0", " 70", "100")
 *  - Integer value padding (16-bit → 6 chars, 32-bit → 9 chars)
 *  - Handle system with unique hex handles (group 5) on every object
 *  - Owner handles (group 330) forming proper ownership chain
 *  - Subclass markers (group 100) on every table record and entity
 *  - 9 tables: VPORT, LTYPE, LAYER, STYLE, VIEW, UCS, APPID, DIMSTYLE, BLOCK_RECORD
 *  - CLASSES section (empty for R2000 minimal)
 *  - BLOCKS section (*Model_Space + *Paper_Space)
 *  - OBJECTS section: root dict → ACAD_LAYOUT → LAYOUT objects
 *  - BLOCK_RECORD ↔ LAYOUT two-way references (340 ↔ 330)
 *  - $MEASUREMENT=1 (metric) + $INSUNITS=4 (mm) for SketchUp compat
 *
 * DXF entity mapping:
 *   LINE → AcDbLine | RECT → AcDbPolyline (LWPOLYLINE closed)
 *   CIRCLE → AcDbCircle | ARC → AcDbCircle+AcDbArc (degrees)
 *   ELLIPSE → AcDbEllipse | POLYLINE → AcDbPolyline (LWPOLYLINE)
 *   TEXT → AcDbText (×2) | DIMENSION → LINE+TEXT (simplified)
 */

import { CadEntity } from "../../ui/canvas/CadDrawingCanvas";
import { Layer as LegacyLayer } from "../layers/LayerManager";
import type { ExportOptions, ExportResult } from "./ExportManager";
import type { CadDocument } from "../document/CadDocument";
import { Layer as DocLayer } from "../document/Layer";
import type {
  IEntity, ILineEntity, IRectEntity, ICircleEntity,
  IArcEntity, IEllipseEntity, IPolylineEntity, ITextEntity,
  IDimensionEntity,
} from "../entities/Entity.types";
import { EntityType } from "../entities/Entity.types";

// ==================== Types ====================

export interface DXFExportOptions {
  title?: string;
  includeFrozenLayers?: boolean;
  includeHiddenEntities?: boolean;
  acadVersion?: string;
}

// ==================== DXF Formatting (AutoCAD-compatible) ====================

/** DXF pair with proper padding: group code right-justified to 3 chars */
function p(code: number, val: string | number): string {
  const c = String(code).padStart(3);
  if (typeof val === "number") {
    if (isIntCode(code)) {
      const w = code >= 90 && code <= 99 ? 9 : 6;
      return `${c}\n${String(val).padStart(w)}\n`;
    }
    // Float: ensure decimal point
    const fs = Number.isInteger(val) ? val.toFixed(1) : String(val);
    return `${c}\n${fs}\n`;
  }
  return `${c}\n${val}\n`;
}

/** 16-bit integer group codes: 60-79, 170-179, 270-299, 370-389, 400-409 */
function isIntCode(c: number): boolean {
  return (
    (c >= 60 && c <= 79) || (c >= 90 && c <= 99) ||
    (c >= 170 && c <= 179) || (c >= 270 && c <= 299) ||
    (c >= 370 && c <= 389) || (c >= 400 && c <= 409) ||
    (c >= 420 && c <= 429) || (c >= 440 && c <= 449)
  );
}

// ==================== Handle System ====================

let _hc = 0;

/** Next unique hex handle */
function nh(): string { return (++_hc).toString(16).toUpperCase(); }

/** HANDSEED: must be > all handles in file */
function handseed(): string { return (_hc + 10).toString(16).toUpperCase(); }

/** Pre-allocated handles for cross-referenced objects */
interface HMap {
  vportT: string; ltypeT: string; layerT: string; styleT: string;
  viewT: string; ucsT: string; appidT: string; dimstyleT: string; brecT: string;
  rootDict: string; acadGroup: string; acadLayoutDict: string;
  mspaceBrec: string; pspaceBrec: string;
  mspaceBlock: string; mspaceEndblk: string;
  pspaceBlock: string; pspaceEndblk: string;
  modelLayout: string; pspaceLayout: string;
}

let H: HMap;

function initHandles(): void {
  _hc = 0;
  H = {
    vportT: nh(), ltypeT: nh(), layerT: nh(), styleT: nh(),
    viewT: nh(), ucsT: nh(), appidT: nh(), dimstyleT: nh(), brecT: nh(),
    rootDict: nh(), acadGroup: nh(), acadLayoutDict: nh(),
    mspaceBrec: nh(), pspaceBrec: nh(),
    mspaceBlock: nh(), mspaceEndblk: nh(),
    pspaceBlock: nh(), pspaceEndblk: nh(),
    modelLayout: nh(), pspaceLayout: nh(),
  };
}

// ==================== Main Export ====================

export function exportDocumentToDXF(
  document: CadDocument,
  options?: DXFExportOptions,
): ExportResult {
  try {
    initHandles();
    const opts = {
      title: options?.title ?? document.metadata.title ?? "drawing",
      includeFrozenLayers: options?.includeFrozenLayers ?? false,
      includeHiddenEntities: options?.includeHiddenEntities ?? false,
      acadVersion: options?.acadVersion ?? "AC1015",
    };

    const layers = document.layers.getAllLayers();
    const entities = document.getAllEntities();
    const exportLayers = opts.includeFrozenLayers
      ? layers : layers.filter((l) => !l.state.frozen);
    const exportEntities = entities.filter((e) => {
      if (!opts.includeHiddenEntities && e.state?.visible === false) return false;
      const eLayer = layers.find((l) => l.id === e.layerId);
      if (eLayer) {
        if (eLayer.state.frozen && !opts.includeFrozenLayers) return false;
        if (!eLayer.isVisible() && !opts.includeHiddenEntities) return false;
      }
      return true;
    });

    const layerNameMap = new Map<string, string>();
    for (const l of layers) layerNameMap.set(l.id, l.name);

    // Build ALL sections that allocate handles FIRST, header LAST ($HANDSEED)
    const classesDxf = buildClasses();
    const tablesDxf = buildTables(exportLayers);
    const blocksDxf = buildBlocks();
    const entitiesDxf = buildEntitiesSection(exportEntities, layerNameMap);
    const objectsDxf = buildObjects();
    const headerDxf = buildHeader(opts.acadVersion);

    const dxf = headerDxf + classesDxf + tablesDxf + blocksDxf
      + entitiesDxf + objectsDxf + p(0, "EOF");

    return { success: true, data: dxf, filename: `${opts.title}.dxf` };
  } catch (error) {
    return {
      success: false,
      error: `DXF export failed: ${error instanceof Error ? error.message : error}`,
    };
  }
}

// ==================== HEADER ====================

function buildHeader(acadVersion: string): string {
  let s = p(0, "SECTION") + p(2, "HEADER");
  s += p(9, "$ACADVER") + p(1, acadVersion);
  s += p(9, "$HANDSEED") + p(5, handseed());
  s += p(9, "$MEASUREMENT") + p(70, 1);
  s += p(9, "$INSUNITS") + p(70, 4);
  s += p(9, "$LUNITS") + p(70, 2);
  s += p(9, "$LUPREC") + p(70, 4);
  s += p(9, "$CLAYER") + p(8, "0");
  s += p(9, "$CELTYPE") + p(6, "ByLayer");
  s += p(9, "$CECOLOR") + p(62, 256);
  s += p(0, "ENDSEC");
  return s;
}

// ==================== CLASSES (empty for R2000 minimal) ====================

function buildClasses(): string {
  return p(0, "SECTION") + p(2, "CLASSES") + p(0, "ENDSEC");
}

// ==================== TABLES ====================

function buildTables(layers: DocLayer[]): string {
  let s = p(0, "SECTION") + p(2, "TABLES");
  s += buildVportTable();
  s += buildLtypeTable();
  s += buildLayerTable(layers);
  s += buildStyleTable();
  s += buildViewTable();
  s += buildUcsTable();
  s += buildAppidTable();
  s += buildDimstyleTable();
  s += buildBlockRecordTable();
  s += p(0, "ENDSEC");
  return s;
}

function buildVportTable(): string {
  const hRec = nh();
  let s = p(0, "TABLE") + p(2, "VPORT") + p(5, H.vportT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 1);
  s += p(0, "VPORT") + p(5, hRec)
    + p(330, H.vportT) + p(100, "AcDbSymbolTableRecord")
    + p(100, "AcDbViewportTableRecord")
    + p(2, "*Active") + p(70, 0)
    + p(10, 0.0) + p(20, 0.0) + p(11, 1.0) + p(21, 1.0)
    + p(12, 0.0) + p(22, 0.0)
    + p(13, 0.0) + p(23, 0.0) + p(14, 10.0) + p(24, 10.0)
    + p(15, 10.0) + p(25, 10.0)
    + p(16, 0.0) + p(26, 0.0) + p(36, 1.0)
    + p(17, 0.0) + p(27, 0.0) + p(37, 0.0)
    + p(40, 1000.0) + p(41, 1.0) + p(42, 50.0)
    + p(43, 0.0) + p(44, 0.0)
    + p(50, 0.0) + p(51, 0.0)
    + p(71, 0) + p(72, 1000) + p(73, 1) + p(74, 3)
    + p(75, 0) + p(76, 0) + p(77, 0) + p(78, 0);
  s += p(0, "ENDTAB");
  return s;
}

function buildLtypeTable(): string {
  let s = p(0, "TABLE") + p(2, "LTYPE") + p(5, H.ltypeT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 6);
  const ltypeRec = (name: string, desc: string, elems: string) => {
    return p(0, "LTYPE") + p(5, nh()) + p(330, H.ltypeT)
      + p(100, "AcDbSymbolTableRecord") + p(100, "AcDbLinetypeTableRecord")
      + p(2, name) + p(70, 0) + p(3, desc) + p(72, 65) + elems;
  };
  s += ltypeRec("ByBlock", "", p(73, 0) + p(40, 0.0));
  s += ltypeRec("ByLayer", "", p(73, 0) + p(40, 0.0));
  s += ltypeRec("Continuous", "Solid line", p(73, 0) + p(40, 0.0));
  s += ltypeRec("DASHED", "Dashed line",
    p(73, 2) + p(40, 10.0) + p(49, 6.0) + p(74, 0) + p(49, -4.0) + p(74, 0));
  s += ltypeRec("DOT", "Dotted line",
    p(73, 2) + p(40, 2.0) + p(49, 0.5) + p(74, 0) + p(49, -1.5) + p(74, 0));
  s += ltypeRec("DASHDOT", "Dash dot",
    p(73, 4) + p(40, 14.0)
    + p(49, 6.0) + p(74, 0) + p(49, -2.0) + p(74, 0)
    + p(49, 0.5) + p(74, 0) + p(49, -2.0) + p(74, 0));
  s += p(0, "ENDTAB");
  return s;
}

function buildLayerTable(layers: DocLayer[]): string {
  const hasLayer0 = layers.some((l) => l.name === "0" || l.name === "Layer 0");
  const totalCount = hasLayer0 ? layers.length : layers.length + 1;

  let s = p(0, "TABLE") + p(2, "LAYER") + p(5, H.layerT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, totalCount);

  const layerRec = (name: string, flags: number, color: number) => {
    return p(0, "LAYER") + p(5, nh()) + p(330, H.layerT)
      + p(100, "AcDbSymbolTableRecord") + p(100, "AcDbLayerTableRecord")
      + p(2, name) + p(70, flags) + p(62, color)
      + p(6, "Continuous") + p(370, -3);
  };

  if (!hasLayer0) s += layerRec("0", 0, 7);

  for (const layer of layers) {
    const name = layer.name === "Layer 0" ? "0" : layer.name;
    const aci = rgbToAciColor(layer.color);
    const color = layer.state.visible ? aci : -aci;
    s += layerRec(name, layer.state.frozen ? 1 : 0, color);
  }

  s += p(0, "ENDTAB");
  return s;
}

function buildStyleTable(): string {
  let s = p(0, "TABLE") + p(2, "STYLE") + p(5, H.styleT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 1);
  s += p(0, "STYLE") + p(5, nh()) + p(330, H.styleT)
    + p(100, "AcDbSymbolTableRecord") + p(100, "AcDbTextStyleTableRecord")
    + p(2, "Standard") + p(70, 0)
    + p(40, 0.0) + p(41, 1.0) + p(50, 0.0) + p(71, 0) + p(42, 2.5)
    + p(3, "txt") + p(4, "");
  s += p(0, "ENDTAB");
  return s;
}

function buildViewTable(): string {
  return p(0, "TABLE") + p(2, "VIEW") + p(5, H.viewT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 0)
    + p(0, "ENDTAB");
}

function buildUcsTable(): string {
  return p(0, "TABLE") + p(2, "UCS") + p(5, H.ucsT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 0)
    + p(0, "ENDTAB");
}

function buildAppidTable(): string {
  let s = p(0, "TABLE") + p(2, "APPID") + p(5, H.appidT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 1);
  s += p(0, "APPID") + p(5, nh()) + p(330, H.appidT)
    + p(100, "AcDbSymbolTableRecord") + p(100, "AcDbRegAppTableRecord")
    + p(2, "ACAD") + p(70, 0);
  s += p(0, "ENDTAB");
  return s;
}

function buildDimstyleTable(): string {
  let s = p(0, "TABLE") + p(2, "DIMSTYLE") + p(5, H.dimstyleT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 1)
    + p(100, "AcDbDimStyleTable") + p(71, 1);
  s += p(0, "DIMSTYLE") + p(105, nh()) + p(330, H.dimstyleT)
    + p(100, "AcDbSymbolTableRecord") + p(100, "AcDbDimStyleTableRecord")
    + p(2, "Standard") + p(70, 0)
    + p(41, 2.5) + p(42, 0.625) + p(43, 3.75) + p(44, 1.25)
    + p(140, 2.5) + p(141, 2.5)
    + p(77, 1) + p(78, 8) + p(271, 2) + p(272, 2);
  s += p(0, "ENDTAB");
  return s;
}

function buildBlockRecordTable(): string {
  let s = p(0, "TABLE") + p(2, "BLOCK_RECORD") + p(5, H.brecT)
    + p(330, "0") + p(100, "AcDbSymbolTable") + p(70, 2);
  // *Model_Space → 340 points to Model layout
  s += p(0, "BLOCK_RECORD") + p(5, H.mspaceBrec) + p(330, H.brecT)
    + p(100, "AcDbSymbolTableRecord") + p(100, "AcDbBlockTableRecord")
    + p(2, "*Model_Space") + p(340, H.modelLayout)
    + p(70, 0) + p(280, 1) + p(281, 0);
  // *Paper_Space → 340 points to Paper layout
  s += p(0, "BLOCK_RECORD") + p(5, H.pspaceBrec) + p(330, H.brecT)
    + p(100, "AcDbSymbolTableRecord") + p(100, "AcDbBlockTableRecord")
    + p(2, "*Paper_Space") + p(340, H.pspaceLayout)
    + p(70, 0) + p(280, 1) + p(281, 0);
  s += p(0, "ENDTAB");
  return s;
}

// ==================== BLOCKS ====================

function buildBlocks(): string {
  let s = p(0, "SECTION") + p(2, "BLOCKS");
  // *Model_Space
  s += p(0, "BLOCK") + p(5, H.mspaceBlock) + p(330, H.mspaceBrec)
    + p(100, "AcDbEntity") + p(8, "0") + p(100, "AcDbBlockBegin")
    + p(2, "*Model_Space") + p(70, 0)
    + p(10, 0.0) + p(20, 0.0) + p(30, 0.0)
    + p(3, "*Model_Space") + p(1, "");
  s += p(0, "ENDBLK") + p(5, H.mspaceEndblk) + p(330, H.mspaceBrec)
    + p(100, "AcDbEntity") + p(8, "0") + p(100, "AcDbBlockEnd");
  // *Paper_Space
  s += p(0, "BLOCK") + p(5, H.pspaceBlock) + p(330, H.pspaceBrec)
    + p(100, "AcDbEntity") + p(67, 1) + p(8, "0") + p(100, "AcDbBlockBegin")
    + p(2, "*Paper_Space") + p(70, 0)
    + p(10, 0.0) + p(20, 0.0) + p(30, 0.0)
    + p(3, "*Paper_Space") + p(1, "");
  s += p(0, "ENDBLK") + p(5, H.pspaceEndblk) + p(330, H.pspaceBrec)
    + p(100, "AcDbEntity") + p(67, 1) + p(8, "0") + p(100, "AcDbBlockEnd");
  s += p(0, "ENDSEC");
  return s;
}

// ==================== ENTITIES ====================

function buildEntitiesSection(
  entities: IEntity[], layerNameMap: Map<string, string>,
): string {
  let s = p(0, "SECTION") + p(2, "ENTITIES");
  for (const e of entities) {
    const layerName = layerNameMap.get(e.layerId) ?? "0";
    s += iEntityToDXF(e, layerName);
  }
  s += p(0, "ENDSEC");
  return s;
}

// ==================== OBJECTS ====================

function buildObjects(): string {
  let s = p(0, "SECTION") + p(2, "OBJECTS");

  // Root dictionary
  s += p(0, "DICTIONARY") + p(5, H.rootDict) + p(330, "0")
    + p(100, "AcDbDictionary") + p(281, 1)
    + p(3, "ACAD_GROUP") + p(350, H.acadGroup)
    + p(3, "ACAD_LAYOUT") + p(350, H.acadLayoutDict);

  // ACAD_GROUP dictionary (empty)
  s += p(0, "DICTIONARY") + p(5, H.acadGroup) + p(330, H.rootDict)
    + p(100, "AcDbDictionary") + p(281, 1);

  // ACAD_LAYOUT dictionary
  s += p(0, "DICTIONARY") + p(5, H.acadLayoutDict) + p(330, H.rootDict)
    + p(100, "AcDbDictionary") + p(281, 1)
    + p(3, "Model") + p(350, H.modelLayout)
    + p(3, "Layout1") + p(350, H.pspaceLayout);

  // Model layout
  s += buildLayout(H.modelLayout, H.acadLayoutDict, "Model", 0, H.mspaceBrec);
  // Paper_Space layout
  s += buildLayout(H.pspaceLayout, H.acadLayoutDict, "Layout1", 1, H.pspaceBrec);

  s += p(0, "ENDSEC");
  return s;
}

function buildLayout(
  handle: string, owner: string, name: string,
  tabOrder: number, blockRecHandle: string,
): string {
  let s = p(0, "LAYOUT") + p(5, handle) + p(330, owner);
  // AcDbPlotSettings (minimal defaults)
  s += p(100, "AcDbPlotSettings")
    + p(1, "") + p(2, "") + p(4, "") + p(6, "")
    + p(40, 0.0) + p(41, 0.0) + p(42, 0.0) + p(43, 0.0)
    + p(44, 0.0) + p(45, 0.0) + p(46, 0.0) + p(47, 0.0)
    + p(48, 0.0) + p(49, 0.0)
    + p(140, 0.0) + p(141, 0.0) + p(142, 1.0) + p(143, 1.0)
    + p(70, 0) + p(72, 0) + p(73, 0) + p(74, 0)
    + p(7, "") + p(75, 0) + p(147, 1.0) + p(76, 0)
    + p(77, 2) + p(78, 300) + p(148, 0.0) + p(149, 0.0);
  // AcDbLayout
  s += p(100, "AcDbLayout") + p(1, name) + p(70, 1) + p(71, tabOrder)
    + p(10, 0.0) + p(20, 0.0) + p(11, 12.0) + p(21, 9.0)
    + p(12, 0.0) + p(22, 0.0) + p(32, 0.0)
    + p(14, 0.0) + p(24, 0.0) + p(34, 0.0)
    + p(15, 0.0) + p(25, 0.0) + p(35, 0.0)
    + p(146, 0.0)
    + p(13, 0.0) + p(23, 0.0) + p(33, 0.0)
    + p(16, 1.0) + p(26, 0.0) + p(36, 0.0)
    + p(17, 0.0) + p(27, 1.0) + p(37, 0.0)
    + p(76, 0) + p(330, blockRecHandle);
  return s;
}

// ==================== Entity Header ====================

function entityHdr(
  type: string, layer: string, aci: number, lt: string,
): string {
  return p(0, type) + p(5, nh()) + p(330, H.mspaceBrec)
    + p(100, "AcDbEntity") + p(8, layer) + p(62, aci) + p(6, lt);
}

// ==================== IEntity → DXF ====================

export function iEntityToDXF(entity: IEntity, layerName = "0"): string {
  if (!H) initHandles();
  const aci = rgbToAciColor(entity.style?.strokeColor ?? "#FFFFFF");
  const lt = strokeStyleToLinetype(entity.style?.strokeStyle ?? "solid");
  switch (entity.type) {
    case EntityType.LINE:
      return lineToDXF(entity as ILineEntity, layerName, aci, lt);
    case EntityType.RECT:
      return rectToDXF(entity as IRectEntity, layerName, aci, lt);
    case EntityType.CIRCLE:
      return circleToDXF(entity as ICircleEntity, layerName, aci, lt);
    case EntityType.ARC:
      return arcToDXF(entity as IArcEntity, layerName, aci, lt);
    case EntityType.ELLIPSE:
      return ellipseToDXF(entity as IEllipseEntity, layerName, aci, lt);
    case EntityType.POLYLINE:
      return polylineToDXF(entity as IPolylineEntity, layerName, aci, lt);
    case EntityType.TEXT:
      return textToDXF(entity as ITextEntity, layerName, aci);
    case EntityType.DIMENSION:
      return dimensionToDXF(entity as IDimensionEntity, layerName, aci);
    default:
      return p(999, `Unsupported entity type: ${entity.type}`);
  }
}

// ==================== Entity Generators ====================

function lineToDXF(e: ILineEntity, l: string, c: number, lt: string): string {
  return entityHdr("LINE", l, c, lt) + p(100, "AcDbLine")
    + p(10, e.start.x) + p(20, e.start.y) + p(30, 0.0)
    + p(11, e.end.x) + p(21, e.end.y) + p(31, 0.0);
}

function rectToDXF(e: IRectEntity, l: string, c: number, lt: string): string {
  const corners = [
    { x: e.origin.x, y: e.origin.y },
    { x: e.origin.x + e.width, y: e.origin.y },
    { x: e.origin.x + e.width, y: e.origin.y + e.height },
    { x: e.origin.x, y: e.origin.y + e.height },
  ];
  const pts = e.rotation
    ? corners.map((pt) => rotatePoint(pt, e.rotation, e.origin))
    : corners;
  let s = entityHdr("LWPOLYLINE", l, c, lt)
    + p(100, "AcDbPolyline") + p(90, 4) + p(70, 1) + p(43, 0.0);
  for (const pt of pts) s += p(10, pt.x) + p(20, pt.y);
  return s;
}

function circleToDXF(e: ICircleEntity, l: string, c: number, lt: string): string {
  return entityHdr("CIRCLE", l, c, lt) + p(100, "AcDbCircle")
    + p(10, e.center.x) + p(20, e.center.y) + p(30, 0.0) + p(40, e.radius);
}

function arcToDXF(e: IArcEntity, l: string, c: number, lt: string): string {
  return entityHdr("ARC", l, c, lt) + p(100, "AcDbCircle")
    + p(10, e.center.x) + p(20, e.center.y) + p(30, 0.0) + p(40, e.radius)
    + p(100, "AcDbArc")
    + p(50, radToDeg(e.startAngle)) + p(51, radToDeg(e.endAngle));
}

function ellipseToDXF(e: IEllipseEntity, l: string, c: number, lt: string): string {
  const cos = Math.cos(e.rotation), sin = Math.sin(e.rotation);
  return entityHdr("ELLIPSE", l, c, lt) + p(100, "AcDbEllipse")
    + p(10, e.center.x) + p(20, e.center.y) + p(30, 0.0)
    + p(11, e.radiusX * cos) + p(21, e.radiusX * sin) + p(31, 0.0)
    + p(40, e.radiusY / e.radiusX) + p(41, 0.0) + p(42, Math.PI * 2);
}

function polylineToDXF(e: IPolylineEntity, l: string, c: number, lt: string): string {
  if (e.points.length < 2) return "";
  let s = entityHdr("LWPOLYLINE", l, c, lt)
    + p(100, "AcDbPolyline") + p(90, e.points.length)
    + p(70, e.closed ? 1 : 0) + p(43, 0.0);
  for (const pt of e.points) s += p(10, pt.x) + p(20, pt.y);
  return s;
}

function textToDXF(e: ITextEntity, l: string, c: number): string {
  const hjust = e.textAlign === "center" ? 1 : e.textAlign === "right" ? 2 : 0;
  let s = entityHdr("TEXT", l, c, "CONTINUOUS") + p(100, "AcDbText")
    + p(10, e.position.x) + p(20, e.position.y) + p(30, 0.0)
    + p(40, e.fontSize) + p(1, e.text)
    + p(50, radToDeg(e.rotation)) + p(72, hjust);
  if (hjust !== 0) {
    s += p(11, e.position.x) + p(21, e.position.y) + p(31, 0.0);
  }
  s += p(100, "AcDbText");
  return s;
}

function dimensionToDXF(e: IDimensionEntity, l: string, c: number): string {
  const dist = Math.sqrt(
    (e.endPoint.x - e.startPoint.x) ** 2 + (e.endPoint.y - e.startPoint.y) ** 2,
  );
  const txt = e.value != null
    ? `${e.value}${e.suffix ?? ""}` : `${dist.toFixed(1)}${e.suffix ?? ""}`;

  let s = entityHdr("LINE", l, c, "CONTINUOUS") + p(100, "AcDbLine")
    + p(10, e.startPoint.x) + p(20, e.startPoint.y) + p(30, 0.0)
    + p(11, e.endPoint.x) + p(21, e.endPoint.y) + p(31, 0.0);

  const tx = e.textPosition?.x ?? (e.startPoint.x + e.endPoint.x) / 2;
  const ty = e.textPosition?.y ?? (e.startPoint.y + e.endPoint.y) / 2;
  s += entityHdr("TEXT", l, c, "CONTINUOUS") + p(100, "AcDbText")
    + p(10, tx) + p(20, ty) + p(30, 0.0)
    + p(40, Math.max(8, dist * 0.05)) + p(1, txt) + p(72, 1)
    + p(11, tx) + p(21, ty) + p(31, 0.0)
    + p(100, "AcDbText");
  return s;
}

// ==================== Utilities ====================

function rotatePoint(
  pt: { x: number; y: number }, angle: number, center: { x: number; y: number },
): { x: number; y: number } {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const dx = pt.x - center.x, dy = pt.y - center.y;
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

function radToDeg(rad: number): number { return (rad * 180) / Math.PI; }

function strokeStyleToLinetype(style: string): string {
  switch (style) {
    case "dashed": return "DASHED";
    case "dotted": return "DOT";
    case "dashdot": return "DASHDOT";
    default: return "CONTINUOUS";
  }
}

// ==================== Legacy CadEntity Export ====================

export function exportToDXF(
  entities: CadEntity[], layers: LegacyLayer[], options: ExportOptions,
): ExportResult {
  try {
    initHandles();
    const entDxf = buildLegacyEntities(entities);
    const tablesDxf = buildTables(wrapLegacyLayers(layers));
    const blocksDxf = buildBlocks();
    const objectsDxf = buildObjects();
    const classesDxf = buildClasses();
    const headerDxf = buildHeader("AC1015");

    const dxf = headerDxf + classesDxf + tablesDxf + blocksDxf
      + (p(0, "SECTION") + p(2, "ENTITIES") + entDxf + p(0, "ENDSEC"))
      + objectsDxf + p(0, "EOF");

    return { success: true, data: dxf, filename: `${options.title || "drawing"}.dxf` };
  } catch (error) {
    return { success: false, error: `DXF export failed: ${error}` };
  }
}

function wrapLegacyLayers(layers: LegacyLayer[]): DocLayer[] {
  return layers.map((l) => ({
    id: l.name, name: l.name, color: l.color, lineWeight: 0.25,
    state: { visible: l.visible, locked: l.locked, frozen: l.frozen },
    isVisible: () => l.visible,
  })) as unknown as DocLayer[];
}

function buildLegacyEntities(entities: CadEntity[]): string {
  let s = "";
  for (const e of entities) {
    if (e.visible === false) continue;
    s += legacyEntityToDXF(e);
  }
  return s;
}

function legacyEntityToDXF(e: CadEntity): string {
  const layer = e.layer || "0";
  const ci = rgbToAciColor(e.color);
  switch (e.type) {
    case "line":
      if (e.points.length < 2) return "";
      return entityHdr("LINE", layer, ci, "CONTINUOUS") + p(100, "AcDbLine")
        + p(10, e.points[0].x) + p(20, e.points[0].y) + p(30, 0.0)
        + p(11, e.points[1].x) + p(21, e.points[1].y) + p(31, 0.0);
    case "polyline":
      if (e.points.length < 2) return "";
      {
        let ps = entityHdr("LWPOLYLINE", layer, ci, "CONTINUOUS")
          + p(100, "AcDbPolyline") + p(90, e.points.length) + p(70, 0) + p(43, 0.0);
        for (const pt of e.points) ps += p(10, pt.x) + p(20, pt.y);
        return ps;
      }
    case "rect":
      if (e.points.length < 2) return "";
      {
        const [p1, p2] = e.points;
        let rs = entityHdr("LWPOLYLINE", layer, ci, "CONTINUOUS")
          + p(100, "AcDbPolyline") + p(90, 4) + p(70, 1) + p(43, 0.0);
        rs += p(10, p1.x) + p(20, p1.y) + p(10, p2.x) + p(20, p1.y)
          + p(10, p2.x) + p(20, p2.y) + p(10, p1.x) + p(20, p2.y);
        return rs;
      }
    case "circle":
      if (e.points.length < 2) return "";
      return entityHdr("CIRCLE", layer, ci, "CONTINUOUS") + p(100, "AcDbCircle")
        + p(10, e.points[0].x) + p(20, e.points[0].y) + p(30, 0.0)
        + p(40, e.points[1].x);
    default:
      return "";
  }
}

// ==================== Color Mapping ====================

export function rgbToAciColor(hex: string): number {
  if (!hex) return 7;
  const colorMap: Record<string, number> = {
    "#FF0000": 1, "#FFFF00": 2, "#00FF00": 3, "#00FFFF": 4,
    "#0000FF": 5, "#FF00FF": 6, "#FFFFFF": 7, "#000000": 0,
    "#808080": 8, "#C0C0C0": 9,
  };
  return colorMap[hex.toUpperCase()] ?? 7;
}
