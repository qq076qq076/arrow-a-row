import { describe, expect, it } from 'vitest';
import { getLoopedWorldZ, WORLD_SCROLL_SPEED } from './WorldMotion';

describe('WorldMotion', () => {
  it('moves repeating floor and scenery positions by the shared world distance', () => {
    expect(WORLD_SCROLL_SPEED).toBe(4);
    expect(getLoopedWorldZ(20, 0, -8, 72)).toBe(20);
    expect(getLoopedWorldZ(20, 1.25, -8, 72)).toBe(18.75);
  });

  it('wraps at the loop boundary without changing direction or speed', () => {
    expect(getLoopedWorldZ(0, 7, -8, 72)).toBe(-7);
    expect(getLoopedWorldZ(0, 9, -8, 72)).toBe(63);
    expect(getLoopedWorldZ(0, 10, -8, 72)).toBe(62);
  });
});
