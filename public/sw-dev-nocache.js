// Development-only service worker: bypasses HTTP cache for Next.js chunks
// so that code changes are reflected immediately without browser cache issues.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/_next/static/chunks/")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
  }
});
