const CACHE_NAME = "enmax-admin-shell-v1";
const ADMIN_URL = "https://enmaxhouse.my.id/admin.html";

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

// Menampilkan notifikasi push dari server.
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
          // Selalu arahkan notifikasi ke dashboard admin.
          url: ADMIN_URL,
        },
      },
    ),
  );
});

// Saat notifikasi diklik, buka dashboard admin.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Jika website sudah terbuka, arahkan tab tersebut
      // ke dashboard admin lalu fokuskan tab-nya.
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          try {
            await client.navigate(ADMIN_URL);
            return await client.focus();
          } catch (error) {
            // Jika tab yang ada gagal dinavigasi,
            // lanjutkan dengan membuka tab dashboard baru.
            break;
          }
        }
      }

      // Jika belum ada tab website yang bisa digunakan,
      // buka dashboard admin di tab baru.
      return self.clients.openWindow(ADMIN_URL);
    })(),
  );
});
