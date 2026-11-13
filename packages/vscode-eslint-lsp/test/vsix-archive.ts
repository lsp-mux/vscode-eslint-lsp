import { createWriteStream, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { ZipFile } from 'yazl';

/**
 * A file on disk for one test, removed when the test's scope ends.
 */
export interface TempFile extends Disposable {
  readonly path: string;
}

const tempFile = async (write: (file: string) => Promise<void>): Promise<TempFile> => {
  const dir = mkdtempSync(path.join(tmpdir(), 'vsix-test-'));
  const file = path.join(dir, 'test.vsix');
  const dispose = (): void => {
    rmSync(dir, { force: true, recursive: true });
  };

  try {
    await write(file);
  } catch (error) {
    dispose();
    throw error;
  }

  return { path: file, [Symbol.dispose]: dispose };
};

/**
 * Writes a zip archive holding the given entries.
 * @param entries - Entry path inside the archive, mapped to its contents
 * @returns The archive, removed on dispose
 */
export const createArchive = (entries: Readonly<Record<string, string>>): Promise<TempFile> =>
  tempFile(async (file) => {
    const zip = new ZipFile();
    for (const [name, contents] of Object.entries(entries)) {
      zip.addBuffer(Buffer.from(contents), name);
    }
    zip.end();
    await pipeline(zip.outputStream, createWriteStream(file));
  });

/**
 * Writes a file that is not a zip archive.
 * @returns The file, removed on dispose
 */
export const createNonArchive = (): Promise<TempFile> =>
  tempFile((file) => {
    writeFileSync(file, 'not a zip');

    return Promise.resolve();
  });
