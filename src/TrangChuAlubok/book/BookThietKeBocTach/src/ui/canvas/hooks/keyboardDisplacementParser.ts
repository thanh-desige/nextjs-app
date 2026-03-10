/**
 * keyboardDisplacementParser.ts - Displacement input parser for keyboard commands
 *
 * STEP-5.21 extraction from useKeyboardHandler.ts
 * Parses displacement input formats used by MOVE/COPY commands:
 * - @dx,dy (relative coordinates)
 * - distance<angle (polar coordinates)
 * - distance (in current mouse direction)
 */

// ==================== Displacement Input Parser ====================
// Parse @dx,dy (relative) or distance<angle (polar) format
// If just a number, use currentAngle to determine direction
export function parseDisplacementInput(
  input: string,
  currentAngle: number = 0, // angle in radians from basePoint to mouse
): { dx: number; dy: number } | null {
  if (!input || input.trim() === "") return null;

  const trimmed = input.trim().toUpperCase();

  // Format 1: @dx,dy (relative coordinates)
  // Examples: @100,50 or @-50,100 or 100,50
  const relativeMatch = trimmed.match(/^@?(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (relativeMatch) {
    const dx = parseFloat(relativeMatch[1]);
    const dy = parseFloat(relativeMatch[2]);
    if (!isNaN(dx) && !isNaN(dy)) {
      return { dx, dy };
    }
  }

  // Format 2: distance<angle (polar coordinates)
  // Examples: 100<45 or 50<90 or 200<-30
  const polarMatch = trimmed.match(/^(-?\d+\.?\d*)\s*<\s*(-?\d+\.?\d*)$/);
  if (polarMatch) {
    const distance = parseFloat(polarMatch[1]);
    const angleDeg = parseFloat(polarMatch[2]);
    if (!isNaN(distance) && !isNaN(angleDeg)) {
      const angleRad = (angleDeg * Math.PI) / 180;
      const dx = distance * Math.cos(angleRad);
      const dy = distance * Math.sin(angleRad);
      return { dx, dy };
    }
  }

  // Format 3: Just a number (distance in mouse direction)
  // Uses currentAngle to determine direction
  const distanceMatch = trimmed.match(/^(-?\d+\.?\d*)$/);
  if (distanceMatch) {
    const distance = parseFloat(distanceMatch[1]);
    if (!isNaN(distance)) {
      // Use currentAngle (from basePoint to mouse position)
      const dx = distance * Math.cos(currentAngle);
      const dy = distance * Math.sin(currentAngle);
      return { dx, dy };
    }
  }

  return null;
}
