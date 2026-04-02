import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { open, type Entry } from 'yauzl';
import type { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = join(__dirname, '..');
const distDir = join(packageDir, 'dist');
const outDir = join(distDir, 'source');
const outFile = join(outDir, 'main.js');
const versionFile = join(distDir, 'version.txt');

if (existsSync(outFile)) {
  console.log('vscode-eslint-lsp: main.js already exists, skipping download');
  process.exit(0);
}

const zipPath = join(distDir, 'vscode-eslint.vsix');
const url = 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/dbaeumer/vsextensions/vscode-eslint/latest/vspackage';

await mkdir(outDir, { recursive: true });

console.log('vscode-eslint-lsp: downloading latest vscode-eslint...');

const response = await fetch(url);
if (!response.ok || !response.body) {
  throw new Error(`Download failed: ${String(response.status)} ${response.statusText}`);
}
await pipeline(response.body, createWriteStream(zipPath));

console.log('vscode-eslint-lsp: extracting...');

const serverData = await extractFileFromZip(zipPath, 'extension/server/out/eslintServer.js');
if (!serverData) throw new Error('eslintServer.js not found in VSIX');

const manifestData = await extractFileFromZip(zipPath, 'extension/package.json');
if (!manifestData) throw new Error('package.json not found in VSIX');

const { version } = JSON.parse(manifestData.toString()) as { version: string };

await writeFile(outFile, serverData);
await writeFile(versionFile, version);
await rm(zipPath, { force: true });

console.log(`vscode-eslint-lsp: extracted v${version}`);

function extractFileFromZip(zipFilePath: string, entryName: string): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    open(zipFilePath, { lazyEntries: true }, (err: Error | null, zipfile) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- zipfile is undefined on error
      if (err || !zipfile) {
        reject(err ?? new Error('Failed to open zip'));
        return;
      }

      zipfile.readEntry();

      zipfile.on('entry', (entry: Entry) => {
        if (entry.fileName !== entryName) {
          zipfile.readEntry();
          return;
        }
        zipfile.openReadStream(entry, (readErr: Error | null, stream: Readable | undefined) => {
          if (readErr || !stream) {
            reject(readErr ?? new Error('Failed to open entry'));
            return;
          }
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          stream.on('end', () => {
            resolve(Buffer.concat(chunks));
          });
        });
      });

      zipfile.on('end', () => {
        resolve(null);
      });
    });
  });
}
