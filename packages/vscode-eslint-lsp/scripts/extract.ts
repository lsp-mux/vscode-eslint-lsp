import { createWriteStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import manifest from '../package.json' with { type: 'json' };
import { assertVsixVersion, readVsixEntry, vsixUrl } from './vsix.ts';

/* This package republishes the extension's server under the extension's own
   version, so the manifest's version names the release to download. Renovate
   bumps it from upstream's GitHub releases. */
const { version } = manifest;

const distDir = path.join(import.meta.dirname, '..', 'dist');
const outDir = path.join(distDir, 'source');
// The server is CommonJS, and the package is an ES module.
const outFile = path.join(outDir, 'main.cjs');
const zipPath = path.join(distDir, 'vscode-eslint.vsix');

await mkdir(outDir, { recursive: true });

console.log(`vscode-eslint-lsp: downloading vscode-eslint v${version}...`);

const response = await fetch(vsixUrl(version));
if (!response.ok || !response.body) {
  throw new Error(`Download failed: ${String(response.status)} ${response.statusText}`);
}
await pipeline(response.body, createWriteStream(zipPath));

console.log('vscode-eslint-lsp: extracting...');

const serverData = await readVsixEntry(zipPath, 'extension/server/out/eslintServer.js');
if (!serverData) throw new Error('eslintServer.js not found in VSIX');

const manifestData = await readVsixEntry(zipPath, 'extension/package.json');
if (!manifestData) throw new Error('package.json not found in VSIX');

assertVsixVersion(manifestData.toString(), version);

await writeFile(outFile, serverData);
await rm(zipPath, { force: true });

console.log(`vscode-eslint-lsp: extracted v${version}`);
