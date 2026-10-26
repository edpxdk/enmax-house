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

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      body: event.data?.text() || "Ada booking baru masuk.",
    };
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Booking Baru — Enmax House",
      {
        body:
          data.body ||
          "Ada booking baru masuk. Buka dashboard admin untuk melihat detail.",
        icon: "/favicon.ico",
        tag: data.tag || "enmax-house-booking",
        renotify: true,
        data: {
          url: data.url || "/",
        },
      },
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windows) => {
        const existingWindow = windows.find((client) =>
          client.url.startsWith(self.location.origin),
        );

        if (existingWindow) {
          return existingWindow.focus();
        }

        return clients.openWindow(targetUrl);
      }),
  );
});
