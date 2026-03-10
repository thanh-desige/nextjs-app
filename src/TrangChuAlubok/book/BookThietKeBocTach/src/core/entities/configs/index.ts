/**
 * Entity Configs — Barrel export + auto-register all built-in entity types.
 *
 * STEP-3.1: LINE registered.
 * STEP-3.2–3.8: All 8 built-in entity types registered.
 *
 * Import this file to ensure all built-in types are registered
 * with the global entityRegistry singleton.
 */

import { entityRegistry } from "../EntityRegistry";
import { lineConfig } from "./lineConfig";
import { rectConfig } from "./rectConfig";
import { circleConfig } from "./circleConfig";
import { arcConfig } from "./arcConfig";
import { ellipseConfig } from "./ellipseConfig";
import { polylineConfig } from "./polylineConfig";
import { textConfig } from "./textConfig";
import { dimensionConfig } from "./dimensionConfig";

// ==================== Register Built-in Types ====================

entityRegistry.register(lineConfig);
entityRegistry.register(rectConfig);
entityRegistry.register(circleConfig);
entityRegistry.register(arcConfig);
entityRegistry.register(ellipseConfig);
entityRegistry.register(polylineConfig);
entityRegistry.register(textConfig);
entityRegistry.register(dimensionConfig);

// ==================== Re-exports ====================

export { lineConfig } from "./lineConfig";
export { rectConfig } from "./rectConfig";
export { circleConfig } from "./circleConfig";
export { arcConfig } from "./arcConfig";
export { ellipseConfig } from "./ellipseConfig";
export { polylineConfig } from "./polylineConfig";
export { textConfig } from "./textConfig";
export { dimensionConfig } from "./dimensionConfig";
export { entityRegistry } from "../EntityRegistry";
