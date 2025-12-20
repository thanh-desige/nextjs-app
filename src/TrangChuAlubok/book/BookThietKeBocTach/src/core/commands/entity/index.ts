/**
 * Entity Commands - Index
 *
 * Export all entity-related commands for history support
 */

export {
  UpdateEntityPropertyCommand,
  UpdateEntityStyleCommand,
  UpdateEntityPropertiesCommand,
  BatchUpdateEntitiesCommand,
  // Aliases
  UpdatePropertyCommand,
  UpdateStyleCommand,
  UpdatePropertiesCommand,
  BatchUpdateCommand,
  // Types
  type EntityCommandContext,
  type PropertyChange,
  type StyleChange,
  type UpdatePropertyData,
  type UpdateStyleData,
  type UpdatePropertiesData,
  type BatchUpdateData,
} from "./EntityCommands";
