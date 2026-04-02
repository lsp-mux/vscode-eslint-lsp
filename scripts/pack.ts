import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = join(__dirname, '..');
const sourceDir = join(packageDir, 'dist', 'source');
const packagesDir = join(packageDir, 'dist', 'packages');

execSync(`pnpm pack --pack-destination ${packagesDir}`, {
  cwd: sourceDir,
  stdio: 'inherit',
});
