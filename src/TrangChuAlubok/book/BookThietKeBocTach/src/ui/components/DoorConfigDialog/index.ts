/**
 * DoorConfigDialog Components - Re-export
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: UI components
 * - KHÔNG import door-engines, analysis
 */

export { ParametricPreview } from "./ParametricPreview";
export type {
  OpenType,
  MullionPosition,
  DoorConfigFormState,
  ParametricPreviewProps,
} from "./types";
export {
  createMullion,
  createMullionId,
  createDefaultFormState,
  variantToOpenType,
} from "./types";
