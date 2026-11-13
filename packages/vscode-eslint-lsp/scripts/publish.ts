import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import manifest from '../package.json' with { type: 'json' };

const { name, version } = manifest;

const distDir = path.join(import.meta.dirname, '..', 'dist');
const packagesDir = path.join(distDir, 'packages', 'npm');

const tarballs = readdirSync(packagesDir).filter(file => file.endsWith('.tgz'));
const [tgzName] = tarballs;
if (!tgzName || tarballs.length !== 1) {
  throw new Error(
    `Expected exactly 1 tarball in ${packagesDir}, found ${String(tarballs.length)}`,
  );
}

/* Most pushes to main leave the version alone. Asking the registry first keeps
   those from depending on how the package manager words a publish conflict.
   The registry expects the scope separator encoded, but not the leading `@`. */
const registryUrl = `https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`;
const response = await fetch(registryUrl);
if (response.ok) {
  console.log(`${name}@${version} already published, skipping`);
  process.exit(0);
}

const notFound = 404;
if (response.status !== notFound) {
  const status = `${String(response.status)} ${response.statusText}`;
  throw new Error(`Registry lookup for ${name}@${version} failed: ${status}`);
}

const result = spawnSync(
  'pnpm',
  ['publish', path.join(packagesDir, tgzName), '--access', 'public', '--no-git-checks'],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
