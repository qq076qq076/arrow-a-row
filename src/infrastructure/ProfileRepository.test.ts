import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { ProfileRepository } from './ProfileRepository';

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('arrow-a-row');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
});

describe('ProfileRepository', () => {
  it('persists gold and permanent upgrade levels', async () => {
    const repository = new ProfileRepository();
    await repository.saveAsync({ gold: 30, healthLevel: 1, damageLevel: 0, fireRateLevel: 2, arrowSpeedLevel: 0, pierceLevel: 0, movementLevel: 0, unlockedChapterIndex: 3 });
    await expect(repository.loadAsync()).resolves.toEqual({ gold: 30, healthLevel: 1, damageLevel: 0, fireRateLevel: 2, arrowSpeedLevel: 0, pierceLevel: 0, movementLevel: 0, unlockedChapterIndex: 3 });
  });
});
