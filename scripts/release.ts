import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const version = readFileSync(join(distDir, 'version.txt'), 'utf-8').trim();
const tag = `v${version}`;

try {
  execSync(`gh release view ${tag}`, { stdio: 'ignore' });
  console.log(`Release ${tag} already exists, skipping`);
} catch {
  execSync(`gh release create ${tag} --title ${tag} --generate-notes`, {
    stdio: 'inherit',
  });
}
