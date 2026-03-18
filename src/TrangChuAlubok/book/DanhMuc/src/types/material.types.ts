// ============================================================
// A4: Profile (Thanh nhôm)
// A5: Glass (Kính)
// A6: Accessory (Phụ kiện)
// A7: Material (Vật tư chung)
// ============================================================

import type { MasterEntityBase } from './base.types';

// --- A4: Profile (Thanh nhôm) ---

export type ProfileSystem = 'xingfa' | 'pma' | 'maxpro' | 'pmi' | 'hopo' | 'other';
export type ProfileSurface = 'anodized' | 'powder_coated' | 'electrophoresis' | 'wood_grain' | 'raw';

export interface Profile extends MasterEntityBase {
  system: ProfileSystem;
  surface: ProfileSurface;
  weight: number;            // kg/m
  length: number;            // mm (standard bar length)
  width: number;             // mm
  height: number;            // mm
  thickness: number;         // mm
  unitPrice: number;         // VNĐ/m or VNĐ/cây
  priceUnit: 'per_meter' | 'per_bar';
  supplierId: string;
  imageUrl: string;
  notes: string;
}

// --- A5: Glass (Kính) ---

export type GlassType = 'clear' | 'tempered' | 'laminated' | 'insulated' | 'low_e' | 'tinted' | 'reflective' | 'frosted';

export interface Glass extends MasterEntityBase {
  glassType: GlassType;
  thickness: number;         // mm
  color: string;
  unitPrice: number;         // VNĐ/m²
  maxWidth: number;          // mm
  maxHeight: number;         // mm
  supplierId: string;
  notes: string;
}

// --- A6: Accessory (Phụ kiện) ---

export type AccessoryCategory = 'handle' | 'lock' | 'hinge' | 'roller' | 'seal' | 'corner_joint' | 'screw' | 'other';

export interface Accessory extends MasterEntityBase {
  category: AccessoryCategory;
  brand: string;
  model: string;
  unitPrice: number;         // VNĐ/cái
  unit: string;              // cái, bộ, m...
  supplierId: string;
  imageUrl: string;
  notes: string;
}

// --- A7: Material (Vật tư chung) ---

export type MaterialCategory = 'sealant' | 'adhesive' | 'foam' | 'steel' | 'wood' | 'paint' | 'other';

export interface Material extends MasterEntityBase {
  category: MaterialCategory;
  unit: string;
  unitPrice: number;
  supplierId: string;
  minStock: number;
  notes: string;
}
