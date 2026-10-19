import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: process.platform !== 'win32',
  },
});

await server.listen();
server.printUrls();

if (process.platform === 'win32') {
  const chromePaths = [
    join(process.env.PROGRAMFILES ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  const chromePath = chromePaths.find(existsSync);
  const url = server.resolvedUrls.local[0];
  const browser = chromePath
    ? spawn(chromePath, [url], { detached: true, stdio: 'ignore' })
    : spawn('cmd', ['/c', 'start', '', 'chrome', url], { detached: true, stdio: 'ignore' });

  browser.unref();
}