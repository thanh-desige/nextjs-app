/**
 * Core Module - Export tất cả core components
 * Đây là module chính của CAD Engine
 */

// Geometry - exports: Vec2, IVec2, Matrix3, Transform2D, GeometryUtils, BoundingBox, Point2D (from Vec2)
export * from "./geometry";

// Entities - exports many, but skip duplicate Point2D/BoundingBox
// Note: entities/index.ts should exclude Point2D and BoundingBox that are already in geometry
export {
  // From UnifiedEntity (excluding Point2D as it conflicts with geometry)
  UnifiedEntityType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
  isLineEntity,
  isPolylineEntity,
  isRectEntity,
  isCircleEntity,
  isArcEntity,
  isEllipseEntity,
  isTextEntity,
} from "./entities/UnifiedEntity";

export type {
  LineGeometry,
  PolylineGeometry,
  RectGeometry,
  CircleGeometry,
  ArcGeometry,
  EllipseGeometry,
  TextGeometry,
  EntityGeometry,
  EntityStyle,
  EntityState,
  UnifiedEntity,
} from "./entities/UnifiedEntity";

// Legacy Entity Types (excluding duplicates)
export { EntityType, GripType } from "./entities/Entity.types";
export type {
  IEntity,
  ILineEntity,
  IRectEntity,
  ICircleEntity,
  IArcEntity,
  IEllipseEntity,
  IPolylineEntity,
  ITextEntity,
  IDimensionEntity,
  EntityJSON,
  IEntityFactory,
  GripPoint,
  SelectionBox,
  HitTestResult,
} from "./entities/Entity.types";

// Entity Utils and Adapter
export * from "./entities/EntityUtils";
export * from "./entities/EntityAdapter";
export * from "./entities/BaseEntity";
export * from "./entities/Line";
export * from "./entities/Rect";
export * from "./entities/Circle";
export * from "./entities/Arc";
export * from "./entities/Ellipse";
export * from "./entities/Polyline";
export * from "./entities/Text";
export * from "./entities/Dimension";
export { EntityFactory, entityFactory } from "./entities";

// Engine
export * from "./engine";

// Commands
export * from "./commands";

// Document
export * from "./document";

// Osnap
export * from "./osnap";

// Constraints
export * from "./constraints";
