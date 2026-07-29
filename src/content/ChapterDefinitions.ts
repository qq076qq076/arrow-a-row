export type ChapterId = 'ch01_meadow' | 'ch02_viaduct' | 'ch03_forge' | 'ch04_canopy' | 'ch05_archive' | 'ch06_horizon';

export interface ChapterDefinition {
  readonly id: ChapterId;
  readonly index: 1 | 2 | 3 | 4 | 5 | 6;
  readonly title: string;
  readonly enemyHpScale: number;
  readonly bossHp: number;
}

export const CHAPTER_DEFINITIONS: readonly ChapterDefinition[] = [
  { id: 'ch01_meadow', index: 1, title: '晨線草原', enemyHpScale: 1.1, bossHp: 36 },
  { id: 'ch02_viaduct', index: 2, title: '鏡潮高架', enemyHpScale: 1.54, bossHp: 50 },
  { id: 'ch03_forge', index: 3, title: '熾心熔庭', enemyHpScale: 2.156, bossHp: 71 },
  { id: 'ch04_canopy', index: 4, title: '霧冠林海', enemyHpScale: 3.014, bossHp: 99 },
  { id: 'ch05_archive', index: 5, title: '星圖遺庫', enemyHpScale: 4.224, bossHp: 138 },
  { id: 'ch06_horizon', index: 6, title: '裂光地平', enemyHpScale: 5.918, bossHp: 194 },
] as const;

export function getChapterDefinition(id: ChapterId): ChapterDefinition {
  const chapter = CHAPTER_DEFINITIONS.find((candidate) => candidate.id === id);
  if (chapter === undefined) throw new Error(`未知章節：${id}`);
  return chapter;
}

export function getNextChapterDefinition(id: ChapterId): ChapterDefinition | undefined {
  const index = CHAPTER_DEFINITIONS.findIndex((chapter) => chapter.id === id);
  return index < 0 ? undefined : CHAPTER_DEFINITIONS[index + 1];
}
