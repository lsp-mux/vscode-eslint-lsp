import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, '..', 'dist', 'packages');

const tarballs = readdirSync(packagesDir).filter(f => f.endsWith('.tgz'));
const [tgzName] = tarballs;
if (tarballs.length !== 1 || !tgzName) {
  throw new Error(
    `Expected exactly 1 tarball in ${packagesDir}, found ${String(tarballs.length)}`,
  );
}

const isCI = Boolean(process.env['CI']);

const result = spawnSync(
  'pnpm',
  ['publish', join(packagesDir, tgzName), '--access', 'public', '--no-git-checks'],
  { stdio: isCI ? ['inherit', 'inherit', 'pipe'] : 'inherit' },
);

if (result.status === 0) {
  process.exit(0);
}

if (isCI) {
  const stderr = result.stderr?.toString() ?? '';
  process.stderr.write(stderr);
  if (/EPUBLISHCONFLICT|You cannot publish over the previously published versions/u.test(stderr)) {
    console.log('Version already published, skipping');
    process.exit(0);
  }
}

process.exit(result.status ?? 1);
