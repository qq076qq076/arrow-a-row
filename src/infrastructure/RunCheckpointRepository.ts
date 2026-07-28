import { z } from 'zod';

const RunCheckpointSchema = z.object({
  runId: z.string().min(1),
  contentVersion: z.string().min(1),
  savedAtMs: z.number().int().nonnegative(),
  simulationTick: z.number().int().nonnegative(),
  payload: z.unknown(),
});

export type RunCheckpoint = z.infer<typeof RunCheckpointSchema>;

const DATABASE_NAME = 'arrow-a-row';
const DATABASE_VERSION = 1;
const RUN_STORE = 'runCheckpoint';
const ACTIVE_RUN_KEY = 'active';

export class RunCheckpointRepository {
  public async loadAsync(signal?: AbortSignal): Promise<RunCheckpoint | undefined> {
    const database = await this.openDatabaseAsync(signal);
    try {
      const rawValue = await this.readAsync(database, signal);
      return rawValue === undefined ? undefined : RunCheckpointSchema.parse(rawValue);
    } finally {
      database.close();
    }
  }

  public async saveAsync(checkpoint: RunCheckpoint, signal?: AbortSignal): Promise<void> {
    const validCheckpoint = RunCheckpointSchema.parse(checkpoint);
    const database = await this.openDatabaseAsync(signal);
    try {
      await this.writeAsync(database, 'put', validCheckpoint, signal);
    } finally {
      database.close();
    }
  }

  public async clearAsync(signal?: AbortSignal): Promise<void> {
    const database = await this.openDatabaseAsync(signal);
    try {
      await this.writeAsync(database, 'delete', undefined, signal);
    } finally {
      database.close();
    }
  }

  private async openDatabaseAsync(signal?: AbortSignal): Promise<IDBDatabase> {
    this.throwIfAborted(signal);
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(RUN_STORE)) request.result.createObjectStore(RUN_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('無法開啟 IndexedDB。'));
      signal?.addEventListener('abort', () => reject(new DOMException('操作已取消。', 'AbortError')), { once: true });
    });
  }

  private async readAsync(database: IDBDatabase, signal?: AbortSignal): Promise<unknown | undefined> {
    this.throwIfAborted(signal);
    return new Promise<unknown | undefined>((resolve, reject) => {
      const request = database.transaction(RUN_STORE, 'readonly').objectStore(RUN_STORE).get(ACTIVE_RUN_KEY);
      request.onsuccess = () => resolve(request.result as unknown | undefined);
      request.onerror = () => reject(request.error ?? new Error('無法讀取 Run checkpoint。'));
    });
  }

  private async writeAsync(
    database: IDBDatabase,
    operation: 'put' | 'delete',
    value: RunCheckpoint | undefined,
    signal?: AbortSignal,
  ): Promise<void> {
    this.throwIfAborted(signal);
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(RUN_STORE, 'readwrite');
      const store = transaction.objectStore(RUN_STORE);
      if (operation === 'put' && value !== undefined) store.put(value, ACTIVE_RUN_KEY);
      if (operation === 'delete') store.delete(ACTIVE_RUN_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Run checkpoint 寫入失敗。'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Run checkpoint 交易已取消。'));
    });
  }

  private throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) throw new DOMException('操作已取消。', 'AbortError');
  }
}
