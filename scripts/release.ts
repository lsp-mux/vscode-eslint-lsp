import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const distDir = path.join(import.meta.dirname, '..', 'dist');

const version = readFileSync(path.join(distDir, 'version.txt'), 'utf8').trim();
const tag = `v${version}`;

try {
  execSync(`gh release view ${tag}`, { stdio: 'ignore' });
  console.log(`Release ${tag} already exists, skipping`);
} catch {
  execSync(`gh release create ${tag} --title ${tag} --generate-notes`, {
    stdio: 'inherit',
  });
}
