/**
 * Dimension Commands Index
 *
 * Export tất cả các lệnh dimension
 */

export { DimLinearCommand } from "./dimlinear";
export { DimAlignedCommand } from "./dimaligned";
export { DimAngularCommand } from "./dimangular";
export { DimRadiusCommand } from "./dimradius";
export { DimArcCommand } from "./dimarc";
export { DimContinueCommand } from "./dimcontinue";
export { QdimCommand } from "./qdim";

// Dimension Commands for History (ĐIỀU KIỆN 1)
export {
  AddDimensionCommand,
  UpdateDimensionCommand,
  DeleteDimensionCommand,
  BatchAddDimensionCommand,
  BatchDeleteDimensionCommand,
} from "./DimensionCommands";
export type { DimensionCommandContext } from "./DimensionCommands";

// Types
export type DimensionCommandType =
  | "linear"
  | "aligned"
  | "angular"
  | "radius"
  | "arc"
  | "continue"
  | "qdim";

// Command registry for dimension commands
import { DimLinearCommand } from "./dimlinear";
import { DimAlignedCommand } from "./dimaligned";
import { DimAngularCommand } from "./dimangular";
import { DimRadiusCommand } from "./dimradius";
import { DimArcCommand } from "./dimarc";
import { DimContinueCommand } from "./dimcontinue";
import { QdimCommand } from "./qdim";

export const DimensionCommands = {
  DIMLINEAR: DimLinearCommand,
  DLI: DimLinearCommand,
  DIMALIGNED: DimAlignedCommand,
  DAL: DimAlignedCommand,
  DIMANGULAR: DimAngularCommand,
  DAN: DimAngularCommand,
  DIMRADIUS: DimRadiusCommand,
  DRA: DimRadiusCommand,
  DIMARC: DimArcCommand,
  DAR: DimArcCommand,
  DIMCONTINUE: DimContinueCommand,
  DCO: DimContinueCommand,
  QDIM: QdimCommand,
  QD: QdimCommand,
};

export function createDimensionCommand(name: string) {
  const CommandClass =
    DimensionCommands[name.toUpperCase() as keyof typeof DimensionCommands];
  if (CommandClass) {
    return new CommandClass();
  }
  return null;
}
