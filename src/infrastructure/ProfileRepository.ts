import { z } from 'zod';
import { PROFILE_STORE } from './RunCheckpointRepository';

const ProfileSchema = z.object({ gold: z.number().int().nonnegative(), healthLevel: z.number().int().min(0).max(5), damageLevel: z.number().int().min(0).max(5), fireRateLevel: z.number().int().min(0).max(5), arrowSpeedLevel: z.number().int().min(0).max(5).default(0), pierceLevel: z.number().int().min(0).max(5).default(0), movementLevel: z.number().int().min(0).max(5).default(0), unlockedChapterIndex: z.number().int().min(1).max(6).default(1), achievementIds: z.array(z.string()).default([]), qualityMode: z.enum(['low', 'standard']).default('standard') });
export type Profile = z.infer<typeof ProfileSchema>;
export const DEFAULT_PROFILE: Profile = { gold: 0, healthLevel: 0, damageLevel: 0, fireRateLevel: 0, arrowSpeedLevel: 0, pierceLevel: 0, movementLevel: 0, unlockedChapterIndex: 1, achievementIds: [], qualityMode: 'standard' };
const DATABASE_NAME = 'arrow-a-row'; const DATABASE_VERSION = 2; const PROFILE_KEY = 'active';

export class ProfileRepository {
  public async loadAsync(): Promise<Profile> { const db = await this.openAsync(); try { const raw = await this.getAsync(db); return raw === undefined ? DEFAULT_PROFILE : ProfileSchema.parse(raw); } finally { db.close(); } }
  public async saveAsync(profile: Profile): Promise<void> { const valid = ProfileSchema.parse(profile); const db = await this.openAsync(); try { await new Promise<void>((resolve, reject) => { const transaction = db.transaction(PROFILE_STORE, 'readwrite'); transaction.objectStore(PROFILE_STORE).put(valid, PROFILE_KEY); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error ?? new Error('Profile 寫入失敗。')); }); } finally { db.close(); } }
  private async openAsync(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION); request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(PROFILE_STORE)) request.result.createObjectStore(PROFILE_STORE); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error ?? new Error('無法開啟 Profile。')); }); }
  private async getAsync(db: IDBDatabase): Promise<unknown | undefined> { return new Promise((resolve, reject) => { const request = db.transaction(PROFILE_STORE, 'readonly').objectStore(PROFILE_STORE).get(PROFILE_KEY); request.onsuccess = () => resolve(request.result as unknown | undefined); request.onerror = () => reject(request.error ?? new Error('無法讀取 Profile。')); }); }
}
