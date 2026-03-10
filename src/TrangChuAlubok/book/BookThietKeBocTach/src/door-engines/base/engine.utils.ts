/**
 * Engine Utilities - Helper functions cho door engines
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: các door engines
 * - KHÔNG được import từ: domain, UI, store, canvas, analysis, systems
 */

/**
 * Sinh ID duy nhất cho engine output
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `eng_${timestamp}_${random}`;
}

/**
 * Làm tròn đến 0.5mm
 */
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Làm tròn đến 1mm
 */
export function roundToMm(value: number): number {
  return Math.round(value);
}

/**
 * Convert mm sang m
 */
export function mmToM(mm: number): number {
  return mm / 1000;
}

/**
 * Convert mm² sang m²
 */
export function mm2ToM2(mm2: number): number {
  return mm2 / 1_000_000;
}

/**
 * Tính chu vi hình chữ nhật (mm)
 */
export function calculatePerimeter(width: number, height: number): number {
  return (width + height) * 2;
}

/**
 * Tính diện tích hình chữ nhật (m²)
 */
export function calculateArea(width: number, height: number): number {
  return mm2ToM2(width * height);
}

/**
 * Format số với đơn vị
 */
export function formatWithUnit(
  value: number,
  unit: string,
  decimals: number = 2
): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Tính góc từ 2 điểm (radians)
 */
export function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Tính khoảng cách 2 điểm
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Tạo điểm offset
 */
export function offsetPoint(
  point: { x: number; y: number },
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  return {
    x: point.x + offsetX,
    y: point.y + offsetY,
  };
}

/**
 * Clone object sâu
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge options với defaults
 */
export function mergeOptions<T extends object>(
  defaults: T,
  options?: Partial<T>
): T {
  return { ...defaults, ...options };
}
