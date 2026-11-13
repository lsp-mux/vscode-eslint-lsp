import type { Readable } from 'node:stream';
import { type Entry, open } from 'yauzl';

/**
 * Reads one entry out of a VSIX archive.
 * @param zipPath - Path of the archive
 * @param entryName - Path of the entry inside the archive
 * @returns The entry's contents, or undefined when the archive has no such entry
 */
export const readVsixEntry = (zipPath: string, entryName: string): Promise<Buffer | undefined> =>
  new Promise((resolve, reject) => {
    open(zipPath, { lazyEntries: true }, (err: Error | null, zipfile) => {
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition --
         zipfile is undefined on error */
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
        resolve(undefined);
      });
    });
  });

/**
 * The marketplace download for one release of the VS Code ESLint extension.
 * @param version - The extension version to download
 * @returns The VSIX URL
 */
export const vsixUrl = (version: string): string =>
  `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/dbaeumer/vsextensions/vscode-eslint/${version}/vspackage`;

const versionOf = (manifest: string): string | undefined => {
  const parsed: unknown = JSON.parse(manifest);

  return typeof parsed === 'object' && parsed !== null && 'version' in parsed &&
    typeof parsed.version === 'string'
    ? parsed.version
    : undefined;
};

/**
 * Confirms the VSIX the marketplace served is the release that was asked for.
 * @param manifest - The VSIX's extension/package.json contents
 * @param expected - The version that was requested
 */
export const assertVsixVersion = (manifest: string, expected: string): void => {
  const served = versionOf(manifest);
  if (served !== expected) {
    throw new Error(`Marketplace served v${served ?? '(none)'} for v${expected}`);
  }
};
