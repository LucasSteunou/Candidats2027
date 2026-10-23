const CACHE_NAME = "culture365-v2";

function scoped(path) {
  if (/^https?:\/\//.test(path)) return path;
  const scope = new URL(self.registration.scope);
  const scopePath = scope.pathname.endsWith("/") ? scope.pathname : `${scope.pathname}/`;
  if (path.startsWith("/") && path.startsWith(scopePath)) {
    return `${scope.origin}${path}`;
  }
  return new URL(path.replace(/^\/+/, ""), self.registration.scope).toString();
}

const APP_SHELL = [scoped(""), scoped("manifest.webmanifest"), scoped("icon.svg")];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await cacheBuildAssets(cache);
      try {
        const response = await fetch(scoped("offline-assets.json"));
        if (!response.ok) return;
        const assets = await response.json();
        await cache.addAll(assets.map(scoped));
      } catch {
        // Offline export is optional in backend development mode.
      }
    }),
  );
  self.skipWaiting();
});

async function cacheBuildAssets(cache) {
  try {
    const response = await fetch(scoped(""));
    const html = await response.text();
    const paths = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map((match) => match[1]);
    if (paths.length) {
      await cache.addAll(paths.map(scoped));
    }
  } catch {
    // The app shell is still useful without eagerly cached build assets.
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        if (request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            new Response("Cette leçon n'est pas disponible hors ligne.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            }),
        ),
      ),
  );
});
