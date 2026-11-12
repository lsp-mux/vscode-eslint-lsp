import { execSync } from 'node:child_process';
import path from 'node:path';

const distDir = path.join(import.meta.dirname, '..', 'dist');
const sourceDir = path.join(distDir, 'source');
const packagesDir = path.join(distDir, 'packages');

execSync(`pnpm pack --pack-destination ${packagesDir}`, {
  cwd: sourceDir,
  stdio: 'inherit',
});
