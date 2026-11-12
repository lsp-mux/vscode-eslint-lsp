import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import manifest from '../package.json' with { type: 'json' };

const packageDir = path.join(import.meta.dirname, '..');
const distDir = path.join(packageDir, 'dist');
const outDir = path.join(distDir, 'source');
const jsonIndent = 2;

mkdirSync(outDir, { recursive: true });

const version = readFileSync(path.join(distDir, 'version.txt'), 'utf8').trim();

/* JSON.stringify drops the keys set to undefined. Consumers never install
   devDependencies, and their `catalog:` specifiers resolve only inside this
   workspace, which dist/source is not. */
const published = {
  ...manifest,
  devDependencies: undefined,
  publishConfig: { ...manifest.publishConfig, directory: undefined },
  type: undefined,
  version,
};

writeFileSync(
  path.join(outDir, 'package.json'),
  `${JSON.stringify(published, undefined, jsonIndent)}\n`,
);
writeFileSync(path.join(outDir, '.npmignore'), '*.tsbuildinfo\n');
copyFileSync(path.join(packageDir, 'README.md'), path.join(outDir, 'README.md'));
