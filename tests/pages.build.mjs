import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const base = new URL('https://akibako96.github.io/kaimono-app/');
const dist = new URL('../dist/', import.meta.url);
const read = (file) => readFile(new URL(file, dist), 'utf8');

test('built Pages app keeps HTML assets, manifest and precache in the project subdirectory', async () => {
  const html = await read('index.html');
  const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(([, path]) => path);
  assert.ok(paths.includes('/kaimono-app/manifest.webmanifest'));
  assert.ok(paths.includes('/kaimono-app/icons/apple-touch-icon.png'));
  assert.ok(paths.every((path) => path.startsWith(base.pathname)));

  const manifest = JSON.parse(await read('manifest.webmanifest'));
  const manifestUrl = new URL('manifest.webmanifest', base);
  assert.equal(new URL(manifest.start_url, manifestUrl).href, base.href);
  assert.equal(new URL(manifest.scope, manifestUrl).href, base.href);
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    assert.ok(new URL(icon.src, manifestUrl).href.startsWith(base.href));
    await readFile(new URL(icon.src, dist));
  }

  const script = paths.find((path) => path.endsWith('.js'));
  assert.ok(script);
  const bundle = await read(script.slice(base.pathname.length));
  assert.ok(bundle.includes('/kaimono-app/'));
  assert.match(bundle, /service-worker\.js/);

  const worker = await read('service-worker.js');
  const filesMatch = worker.match(/const SHELL_FILES = (\[.*?\])\.map/);
  assert.ok(filesMatch);
  const files = JSON.parse(filesMatch[1]);
  assert.ok(files.includes('index.html'));
  assert.ok(files.every((file) => new URL(file, base).href.startsWith(base.href)));
  for (const file of files) await readFile(new URL(file, dist));
});
