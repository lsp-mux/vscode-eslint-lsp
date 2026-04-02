import { type ChildProcess, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it as base } from 'vitest';
import { type ProjectFixture, createProjectFixture } from './fixture.js';

const it = base.extend<{ fixture: ProjectFixture }>({
  fixture: [
    // eslint-disable-next-line no-empty-pattern -- vitest requires destructuring
    async ({}, use) => {
      using fixture = createProjectFixture();
      await use(fixture);
    },
    { scope: 'file' },
  ],
});

const encode = (message: object): string => {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
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
        const match = /Content-Length:\s*(\d+)/u.exec(header);
        if (!match?.[1]) return;

        const contentLength = Number(match[1]);
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
    setTimeout(() => { reject(new Error('Timed out waiting for LSP response')); }, 10_000);
  });

describe('ESLint LSP server', () => {
  it('responds to initialize', async ({ fixture, expect }) => {
    const require = createRequire(join(fixture.projectDir, 'index.js'));
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
          rootUri: `file:///${fixture.projectDir.replace(/\\/gu, '/')}`,
        },
      };

      proc.stdin?.write(encode(initRequest));
      const response = readResponseById(proc, 1);

      await expect(response).resolves.toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
          capabilities: expect.any(Object),
        },
      });
    } finally {
      proc.kill();
    }
  });
});
