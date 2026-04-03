import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = join(__dirname, '..');
const distDir = join(packageDir, 'dist');
const outDir = join(distDir, 'source');

mkdirSync(outDir, { recursive: true });

const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8'));
const version = readFileSync(join(distDir, 'version.txt'), 'utf-8').trim();

delete manifest.publishConfig.directory;
delete manifest.type;
manifest.version = version;

writeFileSync(join(outDir, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(outDir, '.npmignore'), '*.tsbuildinfo\n');
copyFileSync(join(packageDir, 'README.md'), join(outDir, 'README.md'));
