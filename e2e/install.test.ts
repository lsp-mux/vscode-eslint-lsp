import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it as base } from 'vitest';
import { type ProjectFixture, createProjectFixture } from './fixture.js';

const it = base.extend<{ fixture: ProjectFixture }>({
  fixture: [
    // eslint-disable-next-line no-empty-pattern -- vitest requires destructuring
    async ({}, use) => {
      using fixture = createProjectFixture();
      await use(fixture);
    },
    { scope: 'file' },
  ],
});

describe('package installation', () => {
  it('resolves main entry point', ({ fixture, expect }) => {
    const require = createRequire(join(fixture.projectDir, 'index.js'));
    const resolved = require.resolve('@lsp-mux/vscode-eslint-lsp');

    expect(resolved).toContain('main.js');
    expect(existsSync(resolved)).toBe(true);
  });

  it('includes no devDependencies', ({ fixture, expect }) => {
    const yauzlPath = join(fixture.projectDir, 'node_modules', 'yauzl');

    expect(existsSync(yauzlPath)).toBe(false);
  });
});
