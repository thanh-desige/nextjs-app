// ============================================================
// A12: DoorTemplate (Mẫu cửa)
// ============================================================

import type { MasterEntityBase } from './base.types';

export type DoorCategory = 'window' | 'door' | 'sliding_door' | 'folding_door' | 'fixed_panel' | 'curtain_wall';
export type DoorMaterial = 'aluminum' | 'upvc' | 'steel' | 'wood_composite';

export interface DoorTemplate extends MasterEntityBase {
  category: DoorCategory;
  material: DoorMaterial;
  profileSystem: string;
  defaultWidth: number;      // mm
  defaultHeight: number;     // mm
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  glassLayers: number;
  svgPath: string;           // path to SVG template
  thumbnailUrl: string;
  description: string;
  tags: string[];
}
