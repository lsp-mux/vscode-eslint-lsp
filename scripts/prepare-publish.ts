import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = join(__dirname, '..');
const outDir = join(packageDir, 'dist', 'source');

mkdirSync(outDir, { recursive: true });

const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8'));
delete manifest.publishConfig.directory;
delete manifest.type;
writeFileSync(join(outDir, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(outDir, '.npmignore'), '*.tsbuildinfo\n');
