const CACHE_NAME = "enmax-admin-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("enmax-admin-shell-"))
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );

      await self.clients.claim();
    })(),
  );
});

// Tidak melakukan caching terhadap request.
// Halaman admin, login, data booking, dan Supabase
// tetap mengambil data secara normal dari jaringan.
self.addEventListener("fetch", () => {});
