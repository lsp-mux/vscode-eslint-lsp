import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = join(__dirname, '..');
const distDir = join(packageDir, 'dist');
const packagesDir = join(distDir, 'packages');

const tarballs = readdirSync(packagesDir).filter(f => f.endsWith('.tgz'));
const [tgzName] = tarballs;
if (tarballs.length !== 1 || !tgzName) {
  throw new Error(
    `Expected exactly 1 tarball in ${packagesDir}, found ${String(tarballs.length)}`,
  );
}

const { name } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8')) as { name: string };
const version = readFileSync(join(distDir, 'version.txt'), 'utf-8').trim();

/* Most nightly runs find upstream unchanged. Asking the registry first keeps
   those from depending on how the package manager words a publish conflict.
   The registry expects the scope separator encoded, but not the leading `@`. */
const response = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`);
if (response.ok) {
  console.log(`${name}@${version} already published, skipping`);
  process.exit(0);
}
if (response.status !== 404) {
  throw new Error(
    `Registry lookup for ${name}@${version} failed: ${String(response.status)} ${response.statusText}`,
  );
}

const result = spawnSync(
  'pnpm',
  ['publish', join(packagesDir, tgzName), '--access', 'public', '--no-git-checks'],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
