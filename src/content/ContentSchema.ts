import { z } from 'zod';

export const ContentManifestSchema = z.object({
  contentVersion: z.string().min(1),
  assets: z.array(z.object({
    id: z.string().min(1),
    url: z.string().startsWith('/assets/'),
    preloadGroup: z.enum(['shell', 'chapter-01', 'shared-character', 'shared-vfx']),
    sha256: z.string().min(8),
  })).superRefine((assets, context) => {
    const seenIds = new Set<string>();
    for (const [index, asset] of assets.entries()) {
      if (seenIds.has(asset.id)) {
        context.addIssue({ code: 'custom', message: `重複 asset id：${asset.id}`, path: [index, 'id'] });
      }
      seenIds.add(asset.id);
    }
  }),
});

export type ContentManifest = z.infer<typeof ContentManifestSchema>;
