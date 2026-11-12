import { execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const locateTarball = (): string => {
  const outDir = path.join(process.cwd(), 'dist', 'packages');
  const tarballs = readdirSync(outDir).filter(file => file.endsWith('.tgz'));
  const [tgzName] = tarballs;
  if (!tgzName || tarballs.length !== 1) {
    throw new Error(
      `Expected exactly 1 tarball in ${outDir}, found ${String(tarballs.length)}`,
    );
  }
  return path.join(outDir, tgzName);
};

export interface ProjectFixture {
  readonly projectDir: string;
  readonly [Symbol.dispose]: () => void;
}

export const createProjectFixture = (): ProjectFixture => {
  const tgz = locateTarball();
  const projectDir = mkdtempSync(path.join(tmpdir(), 'e2e-vscode-eslint-lsp-'));

  execSync('npm init -y', { cwd: projectDir, stdio: 'ignore' });
  execSync(`npm install ${tgz}`, { cwd: projectDir, stdio: 'ignore' });

  return {
    projectDir,
    [Symbol.dispose]() {
      rmSync(projectDir, { recursive: true, force: true });
    },
  };
};
