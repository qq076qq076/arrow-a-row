import { z } from 'zod';

const PreloadGroupSchema = z.enum(['shell', 'chapter-01', 'shared-character', 'shared-vfx']);

const GlbAssetSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('glb'),
  url: z.string().startsWith('/assets/'),
  preloadGroup: PreloadGroupSchema,
  sha256: z.string().min(8),
});

const ProceduralAssetSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('procedural'),
  renderer: z.enum(['primitive-kit']),
  preloadGroup: PreloadGroupSchema,
  version: z.string().min(1),
  sockets: z.array(z.string().min(1)),
});

export const ContentManifestSchema = z.object({
  contentVersion: z.string().min(1),
  assets: z.array(z.discriminatedUnion('kind', [GlbAssetSchema, ProceduralAssetSchema])).superRefine((assets, context) => {
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
