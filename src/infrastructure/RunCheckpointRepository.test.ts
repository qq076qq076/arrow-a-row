import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { RunCheckpointRepository } from './RunCheckpointRepository';

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('arrow-a-row');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
});

describe('RunCheckpointRepository', () => {
  it('persists and restores an active run checkpoint', async () => {
    const repository = new RunCheckpointRepository();
    const checkpoint = { runId: 'run-001', contentVersion: '0.1.0', savedAtMs: 1, simulationTick: 30, payload: { hp: 100 } };
    await repository.saveAsync(checkpoint);
    await expect(repository.loadAsync()).resolves.toEqual(checkpoint);
  });
});
