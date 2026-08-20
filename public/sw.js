const CACHE_VERSION = "7";
const CACHE_NAME = `foci-v${CACHE_VERSION}`;
const APP_SHELL = "/app";
const STATIC_ASSETS = ["/", APP_SHELL, "/manifest.json", "/stats"];
const NAV_TIMEOUT_MS = 3000;

// Install: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
      self.clients.claim(),
    ])
  );
});

// Notification click: focus or open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/app") && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow("/app");
    })
  );
});

function isDevHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

function shouldBypassCache(url) {
  const path = url.pathname;
  // Never intercept Turbopack / HMR — hashes change every compile
  if (path.includes("turbopack") || path.includes("hmr-client")) return true;
  // /_next/static/* is hashed and immutable; cache it so iPhone PWAs can boot offline.
  // Bypass other /_next paths (image optimizer, data, webpack-hmr).
  if (path.startsWith("/_next/") && !path.startsWith("/_next/static/")) return true;
  return false;
}

function isImmutableAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return Boolean(url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot)$/));
}

function isWorkspacePath(pathname) {
  return (
    pathname === APP_SHELL ||
    pathname.startsWith("/app/") ||
    pathname === "/stats" ||
    pathname.startsWith("/stats/")
  );
}

const MATCH_OPTS = { ignoreSearch: true, ignoreVary: true };

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function putInCache(request, response) {
  if (!response || !response.ok) return;
  const clone = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
}

async function matchFromCaches(request) {
  const exact = await caches.match(request, MATCH_OPTS);
  if (exact) return exact;
  const url = new URL(request.url);
  if (!isWorkspacePath(url.pathname)) return null;
  const app = await caches.match(APP_SHELL, MATCH_OPTS);
  if (app) return app;
  return caches.match("/", MATCH_OPTS);
}

function offlinePage() {
  return new Response(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Foci</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#030712;color:#e2e8f0;text-align:center}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#94a3b8;font-size:.875rem}button{margin-top:1rem;padding:.5rem 1.25rem;border:1px solid #334155;border-radius:.5rem;background:transparent;color:#e2e8f0;cursor:pointer}</style></head><body><div><h1>You\'re offline</h1><p>Check your connection and try again.</p><button onclick="location.reload()">Retry</button></div></body></html>',
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      putInCache(request, response);
      return response;
    });
  });
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    putInCache(request, response);
    return response;
  } catch {
    const cached = await matchFromCaches(request);
    return cached || offlinePage();
  }
}

// Fetch: network-first for pages, cache-first for hashed Next.js assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests entirely (e.g. Google avatars, GTM, SoundCloud)
  if (url.origin !== self.location.origin) return;

  // Dev / HMR: let the browser talk to Next.js directly
  if (isDevHost(url.hostname) || shouldBypassCache(url)) return;

  // Network-only for auth and API calls
  if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/api")) {
    return;
  }

  // Cache-first for hashed bundles, fonts, and static files — required for
  // iPhone home-screen launches with no network (HTML alone cannot hydrate).
  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for pages; fall back to last cached /app shell when offline
  event.respondWith(networkFirstNavigation(request));
});
