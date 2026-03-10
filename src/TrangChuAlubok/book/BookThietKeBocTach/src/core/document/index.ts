/**
 * Document Module - Export tất cả document components
 */

export * from "./Layer";
export * from "./Block";
// Re-export History with alias to avoid conflict with commands/HistoryEntry
export {
  History,
  type HistoryEntry as DocumentHistoryEntry,
  type HistoryEventType,
  type HistoryEvent,
  type HistoryListener,
} from "./History";
export * from "./CadDocument";
export * from "./CadDocument.types";
export { DimensionDocumentService } from "./DimensionDocumentService";
export type { DimensionDocumentContext } from "./DimensionDocumentService";
