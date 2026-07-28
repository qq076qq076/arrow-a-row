import { describe, expect, it } from 'vitest';
import { ContentManifestSchema } from './ContentSchema';

describe('ContentManifestSchema', () => {
  it('rejects duplicate asset IDs', () => {
    const result = ContentManifestSchema.safeParse({
      contentVersion: '0.1.0',
      assets: [
        { id: 'chr_seeker', kind: 'glb', url: '/assets/chr.glb', preloadGroup: 'shell', sha256: 'deadbeef' },
        { id: 'chr_seeker', kind: 'glb', url: '/assets/chr-2.glb', preloadGroup: 'shell', sha256: 'cafebabe' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts the procedural mobile graybox kit', () => {
    const result = ContentManifestSchema.safeParse({
      contentVersion: '0.2.0',
      assets: [{
        id: 'bos_moss_crown_a',
        kind: 'procedural',
        renderer: 'primitive-kit',
        preloadGroup: 'chapter-01',
        version: 'm2-graybox-1',
        sockets: ['Root', 'HitPoint', 'Muzzle', 'SummonPoint'],
      }],
    });
    expect(result.success).toBe(true);
  });
});
