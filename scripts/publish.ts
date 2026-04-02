import { execSync } from 'node:child_process';
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

try {
  execSync(`pnpm publish ${join(packagesDir, tgzName)} --access public --no-git-checks`, {
    stdio: 'inherit',
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/EPUBLISHCONFLICT|You cannot publish over the previously published versions/u.test(message)) {
    console.log('Version already published, skipping');
  } else {
    throw error;
  }
}
