const CACHE_VERSION = "8";
const CACHE_NAME = `foci-v${CACHE_VERSION}`;
const APP_SHELL = "/app";
const STATIC_ASSETS = ["/", APP_SHELL, "/manifest.json", "/stats"];
const NAV_TIMEOUT_MS = 2500;
const MATCH_OPTS = { ignoreSearch: true, ignoreVary: true };

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShellAndAssets().then(() => self.skipWaiting()));
});

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
  if (path.includes("turbopack") || path.includes("hmr-client")) return true;
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

function isRscRequest(request, url) {
  if (url.searchParams.has("_rsc")) return true;
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.get("Next-Router-State-Tree")) return true;
  return false;
}

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function assetUrlsFromHtml(html, base) {
  const urls = new Set();
  const re = /(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/g;
  let match;
  while ((match = re.exec(html))) {
    try {
      urls.add(new URL(match[1], base).href);
    } catch {
      /* ignore malformed */
    }
  }
  return [...urls];
}

async function cacheUrl(cache, url) {
  try {
    const res = await fetch(url, { cache: "reload", credentials: "same-origin" });
    if (res.ok) await cache.put(url, res.clone());
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function cacheHtmlAssets(cache, htmlResponse, base) {
  const html = await htmlResponse.clone().text();
  const urls = assetUrlsFromHtml(html, base);
  await Promise.all(urls.map((href) => cacheUrl(cache, href)));
}

async function cacheShellAndAssets() {
  const cache = await caches.open(CACHE_NAME);
  for (const url of STATIC_ASSETS) {
    const res = await cacheUrl(cache, url);
    if (!res) continue;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      await cacheHtmlAssets(cache, res, self.location.origin);
    }
  }
}

async function putDocumentAndAssets(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("text/html")) {
    await cacheHtmlAssets(cache, response, request.url);
  }
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

async function htmlAssetsAreCached(htmlResponse) {
  const html = await htmlResponse.clone().text();
  const urls = assetUrlsFromHtml(html, self.location.origin);
  if (urls.length === 0) return false;
  for (const href of urls) {
    const hit = await caches.match(href, MATCH_OPTS);
    if (!hit) return false;
  }
  return true;
}

function offlineTaskShell() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Foci</title>
<style>
html,body{margin:0;min-height:100%;font-family:-apple-system,system-ui,sans-serif}
body{background:#e8eef6;color:#0f172a;padding:calc(20px + env(safe-area-inset-top)) 18px 28px}
html.dark body{background:#070b16;color:#e2e8f0}
h1{font-size:1.5rem;margin:0 0 .35rem;letter-spacing:-.02em}
.note{color:#64748b;font-size:.875rem;margin:0 0 1.1rem;line-height:1.4}
html.dark .note{color:#94a3b8}
ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
li{background:#fff;border-radius:14px;padding:12px 14px;font-size:.95rem;line-height:1.35;
  box-shadow:0 1px 2px rgba(15,23,42,.06)}
html.dark li{background:#132037;box-shadow:none}
li.done{opacity:.55;text-decoration:line-through}
.empty{color:#64748b}
</style>
</head>
<body>
<h1>Foci</h1>
<p class="note">You're offline. Showing tasks from the last time this device loaded.</p>
<ul id="tasks"></ul>
<script>
(function(){
  try{
    var t=localStorage.getItem("foci_theme")||localStorage.getItem("tempo_theme");
    var dark=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);
    if(dark)document.documentElement.classList.add("dark");
  }catch(e){}
  function read(key){
    try{var v=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(v)?v:null}
    catch(e){return null}
  }
  function esc(s){
    return String(s).replace(/[&<>"']/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  var tasks=read("foci_cache_tasks")||read("foci_tasks")||read("tempo_tasks")||[];
  var list=document.getElementById("tasks");
  var open=tasks.filter(function(x){return x&&!x.completed&&!x.archivedAt});
  var done=tasks.filter(function(x){return x&&x.completed&&!x.archivedAt}).slice(0,8);
  if(!tasks.length){
    list.innerHTML='<li class="empty">No saved tasks on this phone yet. Open Foci once with internet, then you can use it offline.</li>';
    return;
  }
  list.innerHTML=open.map(function(x){return "<li>"+esc(x.title||"Untitled")+"</li>"}).join("")
    +done.map(function(x){return '<li class="done">'+esc(x.title||"Untitled")+"</li>"}).join("");
})();
</script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function cacheFirst(request) {
  return caches.match(request, MATCH_OPTS).then((cached) => {
    if (cached) return cached;
    return fetch(request)
      .then((response) => {
        putInCache(request, response);
        return response;
      })
      .catch(() => caches.match(request, MATCH_OPTS).then((c) => c || Response.error()));
  });
}

async function networkFirstNavigation(event, request) {
  try {
    const response = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    event.waitUntil(putDocumentAndAssets(request, response.clone()));
    return response;
  } catch {
    if (isRscRequest(request, new URL(request.url))) {
      return new Response("", { status: 503, statusText: "Offline" });
    }
    const url = new URL(request.url);
    const cached = await matchFromCaches(request);
    if (cached && (await htmlAssetsAreCached(cached))) {
      return cached;
    }
    if (isWorkspacePath(url.pathname) || request.mode === "navigate") {
      return offlineTaskShell();
    }
    return cached || offlineTaskShell();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (isDevHost(url.hostname) || shouldBypassCache(url)) return;

  if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/api")) {
    return;
  }

  if (isRscRequest(request, url)) {
    event.respondWith(
      fetchWithTimeout(request, NAV_TIMEOUT_MS).catch(
        () => new Response("", { status: 503, statusText: "Offline" })
      )
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirstNavigation(event, request));
});
