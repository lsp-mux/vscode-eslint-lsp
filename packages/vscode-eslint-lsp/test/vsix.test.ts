import { describe, it } from 'vitest';
import { assertVsixVersion, readVsixEntry, vsixUrl } from '../scripts/vsix.ts';
import { createArchive, createNonArchive } from './vsix-archive.ts';

describe(readVsixEntry, () => {
  it('returns the named entry among others', async ({ expect }) => {
    using archive = await createArchive({
      'extension/package.json': '{"version":"3.0.34"}',
      'extension/server/out/eslintServer.js': 'server',
    });

    const entry = await readVsixEntry(archive.path, 'extension/server/out/eslintServer.js');

    expect(entry?.toString()).toBe('server');
  });

  it('returns undefined for a missing entry', async ({ expect }) => {
    using archive = await createArchive({ 'extension/package.json': '{}' });

    await expect(readVsixEntry(archive.path, 'extension/server/out/eslintServer.js'))
      .resolves.toBeUndefined();
  });

  it('rejects a file that is not an archive', async ({ expect }) => {
    using file = await createNonArchive();

    await expect(readVsixEntry(file.path, 'extension/package.json'))
      .rejects.toThrow('Either not a zip file, or file is truncated');
  });
});

describe(vsixUrl, () => {
  it('points at the marketplace download for that version', ({ expect }) => {
    expect(vsixUrl('3.0.34')).toBe(
      'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/dbaeumer/vsextensions/vscode-eslint/3.0.34/vspackage',
    );
  });
});

describe(assertVsixVersion, () => {
  it('accepts the requested version', ({ expect }) => {
    expect(() => {
      assertVsixVersion('{"name":"vscode-eslint","version":"3.0.34"}', '3.0.34');
    }).not.toThrow();
  });

  it('rejects a different version', ({ expect }) => {
    expect(() => {
      assertVsixVersion('{"name":"vscode-eslint","version":"3.0.36"}', '3.0.34');
    }).toThrow('Marketplace served v3.0.36 for v3.0.34');
  });

  it('rejects a manifest without a version', ({ expect }) => {
    expect(() => {
      assertVsixVersion('{"name":"vscode-eslint"}', '3.0.34');
    }).toThrow('Marketplace served v(none) for v3.0.34');
  });
});
