import { type ChildProcess, spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import path from 'node:path';
import { it as base, describe } from 'vitest';
import { type ProjectFixture, createProjectFixture } from './fixture.js';

/* eslint-disable-next-line vitest/consistent-test-it --
   False positive on .extend() factory:
   https://github.com/vitest-dev/eslint-plugin-vitest/issues/884 */
const it = base.extend<{ fixture: ProjectFixture }>({
  fixture: [
    async ({}, use) => {
      using fixture = createProjectFixture();
      await use(fixture);
    },
    { scope: 'file' },
  ],
});

const encode = (message: object): string => {
  const body = JSON.stringify(message);
  return `Content-Length: ${String(Buffer.byteLength(body))}\r\n\r\n${body}`;
};

const readResponseById = (proc: ChildProcess, id: number): Promise<object> =>
  new Promise((resolve, reject) => {
    let buffer = '';

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();

      for (;;) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;

        const header = buffer.slice(0, headerEnd);
        const length = /Content-Length:\s*(?<length>\d+)/v.exec(header)?.groups?.['length'];
        if (length === undefined) return;

        const contentLength = Number(length);
        const bodyStart = headerEnd + 4;
        if (buffer.length < bodyStart + contentLength) return;

        const body = buffer.slice(bodyStart, bodyStart + contentLength);
        buffer = buffer.slice(bodyStart + contentLength);

        const message = JSON.parse(body) as Record<string, unknown>;
        if (message['id'] === id) {
          proc.stdout?.off('data', onData);
          resolve(message);
          return;
        }
      }
    };

    proc.stdout?.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => {
      reject(new Error('Timed out waiting for LSP response'));
    }, 10_000);
  });

describe('ESLint LSP server', () => {
  it('responds to initialize', async ({ fixture, expect }) => {
    const require = createRequire(path.join(fixture.projectDir, 'index.js'));
    const serverPath = require.resolve('@lsp-mux/vscode-eslint-lsp');

    const proc = spawn('node', [serverPath, '--stdio'], {
      cwd: fixture.projectDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    try {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          processId: process.pid,
          capabilities: {},
          rootUri: `file:///${fixture.projectDir.replaceAll('\\', '/')}`,
        },
      };

      proc.stdin.write(encode(initRequest));
      const response = readResponseById(proc, 1);

      await expect(response).resolves.toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
          capabilities: {},
        },
      });
    } finally {
      /* On Windows the server's cwd locks the project directory until the
         process is gone, so the fixture's cleanup must wait for the exit. */
      if (proc.exitCode === null && proc.signalCode === null) {
        const exited = once(proc, 'exit');
        proc.kill();
        await exited;
      }
    }
  });
});
