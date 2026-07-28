import { describe, expect, it } from 'vitest';
import { ContentManifestSchema } from './ContentSchema';

describe('ContentManifestSchema', () => {
  it('rejects duplicate asset IDs', () => {
    const result = ContentManifestSchema.safeParse({
      contentVersion: '0.1.0',
      assets: [
        { id: 'chr_seeker', url: '/assets/chr.glb', preloadGroup: 'shell', sha256: 'deadbeef' },
        { id: 'chr_seeker', url: '/assets/chr-2.glb', preloadGroup: 'shell', sha256: 'cafebabe' },
      ],
    });
    expect(result.success).toBe(false);
  });
});
