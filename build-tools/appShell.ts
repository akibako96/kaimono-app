import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const publicAssets = [
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
];

export function appShell(): Plugin {
  return {
    name: 'kaimono-app-shell',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        if (!bundle['index.html']) this.error('The app shell build must include index.html.');
        const buildFiles = Object.keys(bundle).filter((file) => !file.endsWith('.map')).sort();
        const worker = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8');
        const hash = createHash('sha256').update(worker);
        for (const file of buildFiles) {
          const output = bundle[file];
          hash.update(file).update(output.type === 'chunk' ? output.code : output.source);
        }
        for (const file of publicAssets) {
          hash.update(file).update(readFileSync(new URL(`../public/${file}`, import.meta.url)));
        }
        this.emitFile({
          type: 'asset',
          fileName: 'service-worker.js',
          source: worker
            .replace('__BUILD_ID__', JSON.stringify(hash.digest('hex').slice(0, 20)))
            .replace('__SHELL_FILES__', JSON.stringify([...buildFiles, ...publicAssets])),
        });
      },
    },
  };
}
