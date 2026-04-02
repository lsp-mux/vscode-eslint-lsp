import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const locateTarball = (): string => {
  const outDir = join(process.cwd(), 'dist', 'packages');
  const tarballs = readdirSync(outDir).filter(f => f.endsWith('.tgz'));
  const [tgzName] = tarballs;
  if (tarballs.length !== 1 || !tgzName) {
    throw new Error(
      `Expected exactly 1 tarball in ${outDir}, found ${String(tarballs.length)}`,
    );
  }
  return join(outDir, tgzName);
};

export interface ProjectFixture {
  readonly projectDir: string;
  readonly [Symbol.dispose]: () => void;
}

export const createProjectFixture = (): ProjectFixture => {
  const tgz = locateTarball();
  const projectDir = mkdtempSync(join(tmpdir(), 'e2e-vscode-eslint-lsp-'));

  execSync(`npm init -y`, { cwd: projectDir, stdio: 'ignore' });
  execSync(`npm install ${tgz}`, { cwd: projectDir, stdio: 'ignore' });

  return {
    projectDir,
    [Symbol.dispose]() {
      rmSync(projectDir, { recursive: true, force: true });
    },
  };
};
