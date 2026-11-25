const scope = new URL(self.registration.scope);
const CACHE_PREFIX = `kaimono-app-shell:${scope.pathname}:`;
const CACHE_NAME = CACHE_PREFIX + __BUILD_ID__;
const SHELL_FILES = __SHELL_FILES__.map((file) => new URL(file, scope).pathname);
const INDEX_PATH = new URL('index.html', scope).pathname;
const SHELL_PATHS = new Set(SHELL_FILES);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) =>
    cache.addAll(SHELL_FILES.map((path) => new Request(path, { cache: 'reload' }))),
  ));
});

// Activation waits until clients using the previous build have closed.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function shellResponse(path, request) {
  const cache = await caches.open(CACHE_NAME);
  return (await cache.match(path)) ?? fetch(request);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (SHELL_PATHS.has(url.pathname)) {
    event.respondWith(shellResponse(url.pathname, request));
  } else if (request.mode === 'navigate' && url.pathname === scope.pathname) {
    event.respondWith(shellResponse(INDEX_PATH, request));
  }
});
