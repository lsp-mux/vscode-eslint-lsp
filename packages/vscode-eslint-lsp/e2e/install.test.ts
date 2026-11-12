import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { it as base, describe } from 'vitest';
import { type ProjectFixture, createProjectFixture } from './fixture.js';

/* eslint-disable-next-line vitest/consistent-test-it --
   False positive on .extend() factory:
   https://github.com/vitest-dev/eslint-plugin-vitest/issues/884 */
const it = base.extend<{ fixture: ProjectFixture }>({
  fixture: [
    async ({}, use) => {
      using fixture = createProjectFixture();
      await use(fixture);
    },
    { scope: 'file' },
  ],
});

describe('package installation', () => {
  it('resolves main entry point', ({ fixture, expect }) => {
    const require = createRequire(path.join(fixture.projectDir, 'index.js'));
    const resolved = require.resolve('@lsp-mux/vscode-eslint-lsp');

    expect(resolved).toContain('main.js');
    expect(existsSync(resolved)).toBe(true);
  });

  it('includes no devDependencies', ({ fixture, expect }) => {
    const yauzlPath = path.join(fixture.projectDir, 'node_modules', 'yauzl');

    expect(existsSync(yauzlPath)).toBe(false);
  });
});
