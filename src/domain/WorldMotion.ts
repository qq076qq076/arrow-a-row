/** Shared forward speed for every object carried by the runner world. */
export const WORLD_SCROLL_SPEED = 4;

/**
 * Moves a repeating world object toward the player and wraps it back to the
 * far end without changing its apparent speed.
 */
export function getLoopedWorldZ(baseWorldZ: number, distanceMeters: number, loopStartZ: number, loopLength: number): number {
  const offset = baseWorldZ - distanceMeters - loopStartZ;
  return ((offset % loopLength) + loopLength) % loopLength + loopStartZ;
}
