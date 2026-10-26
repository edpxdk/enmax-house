/* =========================================================
   ENMAX HOUSE - ADMIN DASHBOARD
   Supabase Auth, Bookings, Manual Booking, Camera Inventory
   + Supabase Realtime Booking Notifications
   + Booking Alert Sound
   ========================================================= */

const SUPABASE_URL = "https://egfuemmimojqzdqjsofg.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWiZEW8hb8rI91I4cu3Law_H9NCykz6";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

const loginPanel = $("loginPanel");
const dashboard = $("dashboard");
const logoutBtn = $("logoutBtn");

let currentUser = null;
let bookingsCache = [];

/* =========================================================
   BOOKING NOTIFICATIONS — STATE
   ========================================================= */

let bookingRealtimeChannel = null;
let notificationSessionUserId = null;
let realtimeStartToken = 0;

const bookingNotifications = [];
const seenNotificationIds = new Set();
const readNotificationIds = new Set();

const MAX_NOTIFICATIONS = 50;

/* =========================================================
   BOOKING ALERT SOUND — FIXED
   ========================================================= */

let bookingAudioContext = null;
let audioUnlocked = false;

async function unlockBookingAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Browser tidak mendukung Web Audio API.");
  }

  if (!bookingAudioContext) {
    bookingAudioContext = new AudioContextClass();
  }

  if (bookingAudioContext.state === "suspended") {
    await bookingAudioContext.resume();
  }

  audioUnlocked = bookingAudioContext.state === "running";

  return audioUnlocked;
}

async function playBookingAlert() {
  const unlocked = await unlockBookingAudio();

  if (!unlocked) {
    throw new Error(
      "Audio belum aktif. Klik halaman admin, lalu tes suaranya kembali.",
    );
  }

  const now = bookingAudioContext.currentTime;

  const oscillator = bookingAudioContext.createOscillator();
  const gain = bookingAudioContext.createGain();

  oscillator.type = "sine";

  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.setValueAtTime(1175, now + 0.14);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.025);
  gain.gain.setValueAtTime(0.2, now + 0.14);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

  oscillator.connect(gain);
  gain.connect(bookingAudioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.4);

  console.info("[Audio] Suara notifikasi booking diputar.");
}

/*
 * Aktifkan audio saat admin berinteraksi dengan halaman.
 * Browser umumnya mensyaratkan interaksi pengguna sebelum audio
 * dapat diputar secara otomatis.
 */
document.addEventListener(
  "click",
  () => {
    void unlockBookingAudio().catch((error) => {
      console.warn("[Audio] Aktivasi audio gagal:", error);
    });
  },
  { once: true },
);

/*
 * Fungsi tes harus berada di luar playBookingAlert().
 * Jalankan di Console browser:
 * testBookingSound()
 * atau:
 * window.testBookingSound()
 */
window.testBookingSound = async function () {
  try {
    await unlockBookingAudio();
    await playBookingAlert();

    console.info("[Audio] Tes suara berhasil.");
    return true;
  } catch (error) {
    console.error("[Audio] Tes suara gagal:", error);
    return false;
  }
};

/* =========================================================
   MESSAGES AND UI
   ========================================================= */

function showMessage(id, message, isError = false) {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#ff7373" : "#ff2aa6";
}

function showLogin() {
  stopBookingRealtime();

  currentUser = null;
  bookingsCache = [];

  loginPanel?.classList.remove("hidden");
  dashboard?.classList.add("hidden");
  logoutBtn?.classList.add("hidden");

  $("cameraList")?.replaceChildren();
  $("bookingList")?.replaceChildren();

  clearBookingNotifications();

  const manualCameraSelect = $("manualCameraId");

  if (manualCameraSelect) {
    manualCameraSelect.replaceChildren(new Option("Pilih kamera", ""));
  }

  const realtimeStatus = $("realtimeStatus");

  if (realtimeStatus) {
    realtimeStatus.textContent = "Notifikasi tidak terhubung.";
  }
}

function showDashboard(user) {
  currentUser = user;

  loginPanel?.classList.add("hidden");
  dashboard?.classList.remove("hidden");
  logoutBtn?.classList.remove("hidden");

  const emailElement = $("adminEmail");

  if (emailElement) {
    emailElement.textContent = user.email || "";
  }
}

/* =========================================================
   ADMIN AUTHORIZATION
   ========================================================= */

async function verifyAdmin(user) {
  if (!user || !user.id) {
    throw new Error("Sesi pengguna tidak valid.");
  }

  const { data, error } = await db
    .from("admin_profiles")
    .select("user_id, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memeriksa hak admin: " + error.message);
  }

  if (!data) {
    throw new Error("Akun ini tidak terdaftar sebagai admin aktif.");
  }

  return true;
}

async function handleSession(session) {
  if (!session) {
    showLogin();
    return;
  }

  try {
    await verifyAdmin(session.user);

    const { data: sessionResult, error: sessionError } =
      await db.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const activeSession = sessionResult?.session;

    if (!activeSession || activeSession.user.id !== session.user.id) {
      return;
    }

    showDashboard(session.user);

    startBookingRealtime();

    await Promise.all([
      loadCameras(),
      loadBookings(),
      loadManualBookingCameras(),
    ]);
  } catch (error) {
    console.error("handleSession error:", error);

    await db.auth.signOut();
    showLogin();

    showMessage(
      "loginMessage",
      error.message || "Gagal memverifikasi sesi admin.",
      true,
    );
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

$("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("loginBtn");
  if (!button) return;

  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Memeriksa akun...";

  const email = $("email").value.trim();
  const password = $("password").value;

  showMessage("loginMessage", "Memeriksa akun...");

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error("Login gagal: " + error.message);
    }

    await verifyAdmin(data.user);

    showMessage("loginMessage", "");

    await handleSession(data.session);
  } catch (error) {
    console.error("Login error:", error);

    await db.auth.signOut();
    showLogin();

    showMessage("loginMessage", error.message || "Login gagal.", true);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

/* =========================================================
   LOGOUT
   ========================================================= */

logoutBtn?.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  try {
    stopBookingRealtime();

    const { error } = await db.auth.signOut();

    if (error) {
      throw error;
    }

    showLogin();
    showMessage("loginMessage", "Kamu sudah logout.");
  } catch (error) {
    console.error("Logout error:", error);

    showMessage("cameraMessage", error.message || "Gagal logout.", true);
  } finally {
    logoutBtn.disabled = false;
  }
});

/* =========================================================
   HELPERS
   ========================================================= */

function escapeText(value) {
  return String(value ?? "");
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return (
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Makassar",
    }).format(date) + " WITA"
  );
}

function formatRupiah(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Disetujui",
    rejected: "Ditolak",
  };

  return labels[status] || status || "Tidak diketahui";
}

function makeTextElement(tag, text, className = "") {
  const element = document.createElement(tag);

  element.textContent = escapeText(text);

  if (className) {
    element.className = className;
  }

  return element;
}

/* =========================================================
   BOOKING NOTIFICATIONS — RENDER
   ========================================================= */

function updateNotificationBadge() {
  const badge = $("notificationBadge");
  if (!badge) return;

  const unreadCount = bookingNotifications.filter(
    (item) => !readNotificationIds.has(String(item.id)),
  ).length;

  badge.textContent = `${unreadCount} belum dibaca`;
}

function renderBookingNotifications() {
  const list = $("notificationList");
  if (!list) return;

  list.replaceChildren();

  if (bookingNotifications.length === 0) {
    list.appendChild(
      makeTextElement("p", "Belum ada notifikasi booking baru.", "muted"),
    );

    updateNotificationBadge();
    return;
  }

  for (const item of bookingNotifications) {
    const id = String(item.id);
    const isRead = readNotificationIds.has(id);

    const card = document.createElement("article");
    card.className = "booking notification-card";

    if (!isRead) {
      card.classList.add("unread");
    }

    card.appendChild(
      makeTextElement(
        "h3",
        isRead ? `Booking #${item.id}` : `🔔 Booking baru #${item.id}`,
      ),
    );

    card.appendChild(
      makeTextElement("p", `Customer: ${item.customer_name || "Customer"}`),
    );

    card.appendChild(
      makeTextElement(
        "p",
        `Kamera: ${item.camera_name || "Memuat data kamera..."}`,
      ),
    );

    card.appendChild(
      makeTextElement("p", `Jumlah unit: ${item.quantity ?? "-"}`),
    );

    card.appendChild(
      makeTextElement("p", `Pickup: ${formatDateTime(item.pickup_at)}`),
    );

    card.appendChild(
      makeTextElement("p", `Diterima: ${formatDateTime(item.created_at)}`),
    );

    card.appendChild(
      makeTextElement("p", `Status: ${statusLabel(item.status)}`),
    );

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.textContent = "Lihat booking";

    openButton.addEventListener("click", async () => {
      readNotificationIds.add(id);
      renderBookingNotifications();

      const statusFilter = $("bookingStatusFilter");

      if (statusFilter) {
        statusFilter.value = "all";
      }

      await loadBookings();

      const bookingList = $("bookingList");

      if (!bookingList) return;

      const bookingCard = Array.from(
        bookingList.querySelectorAll(".booking"),
      ).find((element) =>
        element.textContent.includes(`ID Booking: #${item.id}`),
      );

      (bookingCard || bookingList).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    card.appendChild(openButton);
    list.appendChild(card);
  }

  updateNotificationBadge();
}

/* =========================================================
   BOOKING NOTIFICATIONS — ADD
   ========================================================= */

function addBookingNotification(booking) {
  if (!booking || booking.id == null) {
    console.warn(
      "[Realtime] Booking tidak memiliki ID; notifikasi dilewati.",
      booking,
    );
    return;
  }

  const id = String(booking.id);

  if (seenNotificationIds.has(id)) {
    console.info(
      `[Realtime] Booking #${id} sudah pernah diterima; duplikat dilewati.`,
    );
    return;
  }

  seenNotificationIds.add(id);

  /*
   * Suara dicoba hanya untuk booking baru yang belum pernah
   * diterima sesi admin ini.
   */
  void playBookingAlert().catch((error) => {
    console.warn("[Audio] Notifikasi booking tidak berbunyi:", error);
  });

  bookingNotifications.unshift({
    id: booking.id,
    customer_name: booking.customer_name,
    camera_id: booking.camera_id,
    camera_name: null,
    quantity: booking.quantity,
    pickup_at: booking.pickup_at,
    status: booking.status,
    created_at: booking.created_at,
  });

  if (bookingNotifications.length > MAX_NOTIFICATIONS) {
    const removed = bookingNotifications.pop();

    if (removed) {
      readNotificationIds.delete(String(removed.id));
    }
  }

  renderBookingNotifications();

  console.info(
    `[Realtime] Notifikasi booking #${id} berhasil ditambahkan ke tampilan.`,
  );

  void loadNotificationCameraName(booking.camera_id, id);
}

async function loadNotificationCameraName(cameraId, notificationId) {
  if (!currentUser || cameraId == null) return;

  const requestedUserId = currentUser.id;

  const { data, error } = await db
    .from("cameras")
    .select("name")
    .eq("id", cameraId)
    .maybeSingle();

  if (error) {
    console.error("[Realtime] Gagal mengambil nama kamera notifikasi:", error);
    return;
  }

  if (!currentUser || currentUser.id !== requestedUserId) {
    return;
  }

  const notification = bookingNotifications.find(
    (item) => String(item.id) === notificationId,
  );

  if (notification && data) {
    notification.camera_name = data.name;
    renderBookingNotifications();
  }
}

function clearBookingNotifications() {
  bookingNotifications.length = 0;
  seenNotificationIds.clear();
  readNotificationIds.clear();

  renderBookingNotifications();
}

/* =========================================================
   BOOKING NOTIFICATIONS — REALTIME CONNECTION
   ========================================================= */

function stopBookingRealtime() {
  realtimeStartToken += 1;

  const channel = bookingRealtimeChannel;

  bookingRealtimeChannel = null;
  notificationSessionUserId = null;

  if (channel) {
    void db.removeChannel(channel).catch((error) => {
      console.error("[Realtime] Gagal melepas channel lama:", error);
    });
  }

  const status = $("realtimeStatus");

  if (status) {
    status.textContent = "Notifikasi tidak terhubung.";
  }
}

function startBookingRealtime() {
  if (!currentUser) {
    console.warn("[Realtime] Tidak bisa memulai listener: admin belum login.");
    return;
  }

  if (bookingRealtimeChannel && notificationSessionUserId === currentUser.id) {
    console.info("[Realtime] Listener untuk sesi admin ini sudah berjalan.");
    return;
  }

  stopBookingRealtime();

  const subscribedUserId = currentUser.id;
  const thisStartToken = realtimeStartToken;

  notificationSessionUserId = subscribedUserId;

  const status = $("realtimeStatus");

  if (status) {
    status.textContent = "Menghubungkan ke Supabase Realtime...";
  }

  console.info(
    "[Realtime] Memulai listener INSERT pada public.rental_bookings.",
    { adminUserId: subscribedUserId },
  );

  const channel = db
    .channel(`admin-bookings-${subscribedUserId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "rental_bookings",
      },
      (payload) => {
        console.info("[Realtime] Event postgres_changes diterima:", payload);

        if (
          thisStartToken !== realtimeStartToken ||
          !currentUser ||
          currentUser.id !== subscribedUserId ||
          notificationSessionUserId !== subscribedUserId
        ) {
          console.warn(
            "[Realtime] Event diabaikan karena sesi admin sudah berubah.",
          );
          return;
        }

        const booking = payload?.new;

        if (!booking || booking.id == null) {
          console.warn(
            "[Realtime] Payload tidak berisi data booking baru.",
            payload,
          );
          return;
        }

        console.info(
          `[Realtime] Booking baru diterima: #${booking.id}`,
          booking,
        );

        addBookingNotification(booking);

        void loadBookings();
      },
    )
    .subscribe((state, error) => {
      if (
        bookingRealtimeChannel !== channel ||
        thisStartToken !== realtimeStartToken ||
        notificationSessionUserId !== subscribedUserId
      ) {
        return;
      }

      console.info("[Realtime] Status channel:", state);

      if (error) {
        console.error("[Realtime] Detail error channel:", error);
      }

      if (status) {
        if (state === "SUBSCRIBED") {
          status.textContent = "● Realtime aktif — menunggu booking baru.";
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          status.textContent =
            "Realtime bermasalah. Periksa publikasi tabel, izin SELECT RLS, dan Console.";
        } else if (state === "CLOSED") {
          status.textContent = "Koneksi Realtime ditutup.";
        } else {
          status.textContent = `Status koneksi: ${state}`;
        }
      }
    });

  bookingRealtimeChannel = channel;
}

/* =========================================================
   NOTIFICATION BUTTONS
   ========================================================= */

$("markNotificationsReadBtn")?.addEventListener("click", () => {
  for (const item of bookingNotifications) {
    readNotificationIds.add(String(item.id));
  }

  renderBookingNotifications();
});

$("clearNotificationsBtn")?.addEventListener("click", () => {
  bookingNotifications.length = 0;
  readNotificationIds.clear();

  renderBookingNotifications();
});

/* =========================================================
   LOAD BOOKINGS
   ========================================================= */

async function loadBookings() {
  if (!currentUser) return;

  const requestedUserId = currentUser.id;

  showMessage("bookingMessage", "Memuat data booking...");
  $("bookingList")?.replaceChildren();

  try {
    const [bookingResult, cameraResult] = await Promise.all([
      db
        .from("rental_bookings")
        .select(
          "id, camera_id, customer_name, customer_email, customer_phone, pickup_at, return_at, quantity, source, status, notes, created_at",
        )
        .order("created_at", { ascending: false }),

      db.from("cameras").select("id, name, daily_price, quantity, active"),
    ]);

    if (bookingResult.error) {
      throw new Error(
        "Gagal mengambil booking: " + bookingResult.error.message,
      );
    }

    if (cameraResult.error) {
      throw new Error(
        "Gagal mengambil data kamera: " + cameraResult.error.message,
      );
    }

    if (!currentUser || currentUser.id !== requestedUserId) {
      return;
    }

    const cameraMap = new Map(
      (cameraResult.data || []).map((camera) => [String(camera.id), camera]),
    );

    bookingsCache = (bookingResult.data || []).map((booking) => ({
      ...booking,
      camera_name:
        cameraMap.get(String(booking.camera_id))?.name ||
        "Kamera tidak ditemukan",
    }));

    renderBookings();

    showMessage("bookingMessage", bookingsCache.length + " booking ditemukan.");
  } catch (error) {
    console.error("loadBookings error:", error);

    if (currentUser && currentUser.id === requestedUserId) {
      showMessage(
        "bookingMessage",
        error.message || "Gagal memuat booking.",
        true,
      );
    }
  }
}

/* =========================================================
   RENDER BOOKINGS
   ========================================================= */

function renderBookings() {
  const list = $("bookingList");
  if (!list) return;

  list.replaceChildren();

  const filter = $("bookingStatusFilter");
  const selectedStatus = filter?.value || "all";

  const filteredBookings =
    selectedStatus === "all"
      ? bookingsCache
      : bookingsCache.filter((booking) => booking.status === selectedStatus);

  if (filteredBookings.length === 0) {
    list.appendChild(
      makeTextElement(
        "p",
        "Tidak ada booking untuk filter status ini.",
        "muted",
      ),
    );
    return;
  }

  for (const booking of filteredBookings) {
    const card = document.createElement("article");
    card.className = "booking";

    card.appendChild(
      makeTextElement("h3", booking.customer_name || "Customer"),
    );

    card.appendChild(makeTextElement("p", "ID Booking: #" + booking.id));

    card.appendChild(makeTextElement("p", "Kamera: " + booking.camera_name));

    card.appendChild(makeTextElement("p", "Jumlah unit: " + booking.quantity));

    card.appendChild(
      makeTextElement("p", "Telepon: " + (booking.customer_phone || "-")),
    );

    if (booking.customer_email) {
      card.appendChild(
        makeTextElement("p", "Email: " + booking.customer_email),
      );
    }

    card.appendChild(
      makeTextElement("p", "Pickup: " + formatDateTime(booking.pickup_at)),
    );

    card.appendChild(
      makeTextElement("p", "Return: " + formatDateTime(booking.return_at)),
    );

    card.appendChild(
      makeTextElement("p", "Diterima: " + formatDateTime(booking.created_at)),
    );

    const sourceLabel = {
      website: "Website",
      manual: "Manual (Admin)",
      whatsapp: "WhatsApp",
    };

    card.appendChild(
      makeTextElement(
        "p",
        "Sumber: " + (sourceLabel[booking.source] || booking.source || "-"),
      ),
    );

    const statusRow = document.createElement("p");

    statusRow.appendChild(
      makeTextElement("span", statusLabel(booking.status), "status-badge"),
    );

    card.appendChild(statusRow);

    if (booking.notes) {
      card.appendChild(makeTextElement("p", "Catatan:"));
      card.appendChild(makeTextElement("div", booking.notes, "notes"));
    }

    const actions = document.createElement("div");
    actions.className = "booking-actions";

    if (booking.status === "pending") {
      const approveButton = document.createElement("button");
      approveButton.type = "button";
      approveButton.textContent = "Setujui";

      approveButton.addEventListener("click", () => {
        void updateBookingStatus(booking, "confirmed", approveButton);
      });

      const rejectButton = document.createElement("button");
      rejectButton.type = "button";
      rejectButton.textContent = "Tolak";
      rejectButton.className = "danger";

      rejectButton.addEventListener("click", () => {
        void updateBookingStatus(booking, "rejected", rejectButton);
      });

      actions.append(approveButton, rejectButton);
    } else {
      const resetButton = document.createElement("button");
      resetButton.type = "button";
      resetButton.textContent = "Kembalikan ke Pending";
      resetButton.className = "secondary";

      resetButton.addEventListener("click", () => {
        void updateBookingStatus(booking, "pending", resetButton);
      });

      actions.appendChild(resetButton);
    }

    card.appendChild(actions);
    list.appendChild(card);
  }
}

/* =========================================================
   UPDATE BOOKING STATUS
   ========================================================= */

async function updateBookingStatus(booking, newStatus, button) {
  if (!currentUser) {
    showMessage("bookingMessage", "Silakan login sebagai admin.", true);
    return;
  }

  const allowedStatuses = ["pending", "confirmed", "rejected"];

  if (!allowedStatuses.includes(newStatus)) {
    showMessage("bookingMessage", "Status tidak valid.", true);
    return;
  }

  const confirmationMessages = {
    pending: "Kembalikan booking ini ke status pending?",
    confirmed: "Setujui booking customer ini?",
    rejected: "Tolak booking customer ini?",
  };

  if (!window.confirm(confirmationMessages[newStatus])) {
    return;
  }

  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Menyimpan...";

  try {
    const { data, error } = await db
      .from("rental_bookings")
      .update({ status: newStatus })
      .eq("id", booking.id)
      .select("id, status")
      .maybeSingle();

    if (error) {
      throw new Error(
        "Gagal mengubah status. Periksa kebijakan RLS admin: " + error.message,
      );
    }

    if (!data) {
      throw new Error(
        "Status tidak berubah. Booking tidak ditemukan atau akses UPDATE ditolak oleh RLS.",
      );
    }

    showMessage(
      "bookingMessage",
      "Status booking #" +
        booking.id +
        " berhasil diubah menjadi " +
        statusLabel(newStatus) +
        ".",
    );

    await loadBookings();
  } catch (error) {
    console.error("updateBookingStatus error:", error);

    showMessage(
      "bookingMessage",
      error.message || "Gagal mengubah status booking.",
      true,
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

/* =========================================================
   CAMERA INVENTORY
   ========================================================= */

async function loadCameras() {
  if (!currentUser) return;

  const requestedUserId = currentUser.id;

  showMessage("cameraMessage", "Memuat kamera...");

  try {
    const { data, error } = await db
      .from("cameras")
      .select("id, name, quantity, daily_price, active")
      .order("id");

    if (error) {
      throw new Error("Gagal memuat kamera: " + error.message);
    }

    if (!currentUser || currentUser.id !== requestedUserId) {
      return;
    }

    const list = $("cameraList");
    if (!list) return;

    list.replaceChildren();

    for (const camera of data || []) {
      const card = document.createElement("article");
      card.className = "camera";

      card.appendChild(makeTextElement("h3", camera.name));

      card.appendChild(
        makeTextElement(
          "p",
          camera.active ? "Status: Aktif" : "Status: Nonaktif",
        ),
      );

      const quantityLabel = makeTextElement("label", "Jumlah unit");

      const quantity = document.createElement("input");
      quantity.type = "number";
      quantity.min = "0";
      quantity.step = "1";
      quantity.value = camera.quantity ?? 0;

      const priceLabel = makeTextElement("label", "Harga per hari (Rp)");

      const price = document.createElement("input");
      price.type = "number";
      price.min = "0";
      price.step = "1000";
      price.value = camera.daily_price ?? 0;

      const save = document.createElement("button");
      save.type = "button";
      save.textContent = "Simpan perubahan";

      save.addEventListener("click", async () => {
        if (!currentUser) return;

        const newQuantity = Number(quantity.value);
        const newPrice = Number(price.value);

        if (
          !Number.isSafeInteger(newQuantity) ||
          newQuantity < 0 ||
          !Number.isSafeInteger(newPrice) ||
          newPrice < 0
        ) {
          showMessage(
            "cameraMessage",
            "Jumlah dan harga harus berupa bilangan bulat nonnegatif.",
            true,
          );
          return;
        }

        save.disabled = true;
        save.textContent = "Menyimpan...";

        try {
          const { data: savedData, error: saveError } = await db
            .from("cameras")
            .update({
              quantity: newQuantity,
              daily_price: newPrice,
            })
            .eq("id", camera.id)
            .select("id")
            .maybeSingle();

          if (saveError) {
            throw new Error("Gagal menyimpan: " + saveError.message);
          }

          if (!savedData) {
            throw new Error(
              "Perubahan tidak tersimpan. Periksa izin UPDATE RLS.",
            );
          }

          showMessage(
            "cameraMessage",
            "Perubahan " + camera.name + " berhasil disimpan.",
          );

          await loadCameras();
          await loadManualBookingCameras();
        } catch (error) {
          console.error("Save camera error:", error);

          showMessage(
            "cameraMessage",
            error.message || "Gagal menyimpan kamera.",
            true,
          );
        } finally {
          save.disabled = false;
          save.textContent = "Simpan perubahan";
        }
      });

      card.append(
        quantityLabel,
        quantity,
        priceLabel,
        price,
        document.createElement("br"),
        document.createElement("br"),
        save,
      );

      list.appendChild(card);
    }

    showMessage(
      "cameraMessage",
      (data || []).length + " jenis kamera ditemukan.",
    );
  } catch (error) {
    console.error("loadCameras error:", error);

    showMessage("cameraMessage", error.message || "Gagal memuat kamera.", true);
  }
}

/* =========================================================
   ADD CAMERA
   ========================================================= */

$("addCameraForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const button = $("addCameraBtn");
  if (!button) return;

  const originalText = button.textContent;

  const name = $("cameraName").value.trim();
  const quantity = Number($("cameraQuantity").value);
  const price = Number($("cameraPrice").value);

  if (
    !name ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    !Number.isSafeInteger(price) ||
    price < 0
  ) {
    showMessage(
      "cameraMessage",
      "Periksa nama, jumlah, dan harga kamera.",
      true,
    );
    return;
  }

  button.disabled = true;
  button.textContent = "Menambahkan...";

  try {
    const { error } = await db.from("cameras").insert({
      name,
      quantity,
      daily_price: price,
      active: true,
    });

    if (error) {
      throw new Error("Gagal menambahkan kamera: " + error.message);
    }

    $("addCameraForm").reset();
    $("cameraQuantity").value = "1";
    $("cameraPrice").value = "0";

    showMessage("cameraMessage", "Kamera berhasil ditambahkan.");

    await loadCameras();
    await loadManualBookingCameras();
  } catch (error) {
    console.error("Add camera error:", error);

    showMessage(
      "cameraMessage",
      error.message || "Gagal menambahkan kamera.",
      true,
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

/* =========================================================
   MANUAL BOOKING — LOAD CAMERA OPTIONS
   ========================================================= */

async function loadManualBookingCameras() {
  const select = $("manualCameraId");

  if (!select || !currentUser) return;

  const requestedUserId = currentUser.id;

  select.replaceChildren(new Option("Memuat daftar kamera...", ""));

  try {
    const { data, error } = await db
      .from("cameras")
      .select("id, name, quantity, active")
      .eq("active", true)
      .order("name");

    if (error) {
      throw new Error(error.message);
    }

    if (!currentUser || currentUser.id !== requestedUserId) {
      return;
    }

    select.replaceChildren(new Option("Pilih kamera", ""));

    for (const camera of data || []) {
      const option = new Option(camera.name, String(camera.id));

      option.dataset.quantity = String(camera.quantity ?? 0);

      select.appendChild(option);
    }

    if (!data || data.length === 0) {
      select.replaceChildren(new Option("Belum ada kamera aktif", ""));
    }
  } catch (error) {
    console.error("loadManualBookingCameras error:", error);

    if (currentUser && currentUser.id === requestedUserId) {
      select.replaceChildren(new Option("Gagal memuat kamera", ""));

      showMessage(
        "manualBookingMessage",
        "Gagal memuat kamera: " + error.message,
        true,
      );
    }
  }
}

/* =========================================================
   MANUAL BOOKING — CAMERA QUANTITY
   ========================================================= */

$("manualCameraId")?.addEventListener("change", () => {
  const select = $("manualCameraId");
  const option = select.selectedOptions[0];
  const quantityInput = $("manualQuantity");

  if (!quantityInput) return;

  if (!option || !option.value) {
    quantityInput.removeAttribute("max");
    return;
  }

  const cameraQuantity = Number(option.dataset.quantity || 0);

  quantityInput.max = String(cameraQuantity);

  if (cameraQuantity > 0 && Number(quantityInput.value) > cameraQuantity) {
    quantityInput.value = String(cameraQuantity);
  }
});

/* =========================================================
   MANUAL BOOKING — SAVE
   ========================================================= */

$("manualBookingForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage(
      "manualBookingMessage",
      "Silakan login sebagai admin terlebih dahulu.",
      true,
    );
    return;
  }

  const button = $("manualBookingBtn");
  if (!button) return;

  const originalText = button.textContent;

  const customerName = $("manualCustomerName").value.trim();
  const customerPhone = $("manualCustomerPhone").value.trim();
  const cameraId = $("manualCameraId").value;
  const quantity = Number($("manualQuantity").value);

  const pickupValue = $("manualPickupAt").value;
  const returnValue = $("manualReturnAt").value;
  const notes = $("manualNotes").value.trim();

  const pickup = new Date(pickupValue);
  const returned = new Date(returnValue);

  const problems = [];

  if (!customerName) {
    problems.push("Nama customer belum diisi");
  }

  if (!customerPhone) {
    problems.push("Nomor WhatsApp belum diisi");
  }

  if (!cameraId) {
    problems.push("Kamera belum dipilih");
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    problems.push("Jumlah unit harus bilangan bulat minimal 1");
  }

  if (!pickupValue || Number.isNaN(pickup.getTime())) {
    problems.push("Waktu pickup tidak valid");
  }

  if (!returnValue || Number.isNaN(returned.getTime())) {
    problems.push("Waktu return tidak valid");
  }

  if (
    !Number.isNaN(pickup.getTime()) &&
    !Number.isNaN(returned.getTime()) &&
    returned <= pickup
  ) {
    problems.push("Waktu return harus setelah pickup");
  }

  if (problems.length > 0) {
    showMessage("manualBookingMessage", problems.join(". ") + ".", true);
    return;
  }

  const selectedOption = $("manualCameraId").selectedOptions[0];
  const cameraQuantity = Number(selectedOption?.dataset.quantity ?? 0);

  if (quantity > cameraQuantity) {
    showMessage(
      "manualBookingMessage",
      "Jumlah unit melebihi total inventaris kamera yang tercatat.",
      true,
    );
    return;
  }

  const confirmed = window.confirm(
    "Simpan booking manual ini sebagai booking yang sudah disetujui?",
  );

  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Menyimpan...";

  try {
    const bookingData = {
      camera_id: Number(cameraId),
      customer_name: customerName,
      customer_email: null,
      customer_phone: customerPhone,
      pickup_at: pickup.toISOString(),
      return_at: returned.toISOString(),
      quantity,
      source: "whatsapp",
      status: "confirmed",
      notes: notes || null,
    };

    const { data, error } = await db
      .from("rental_bookings")
      .insert([bookingData])
      .select("id")
      .single();

    if (error) {
      throw new Error(
        "Booking gagal disimpan. Periksa struktur tabel dan izin INSERT RLS admin: " +
          error.message,
      );
    }

    $("manualBookingForm").reset();
    $("manualQuantity").value = "1";

    showMessage(
      "manualBookingMessage",
      "Booking manual #" + data.id + " berhasil disimpan.",
    );

    await Promise.all([loadBookings(), loadManualBookingCameras()]);
  } catch (error) {
    console.error("Manual booking error:", error);

    showMessage(
      "manualBookingMessage",
      error.message || "Gagal menyimpan booking manual.",
      true,
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

$("refreshBtn")?.addEventListener("click", () => {
  void loadCameras();
});

$("refreshBookingsBtn")?.addEventListener("click", () => {
  void loadBookings();
});

$("bookingStatusFilter")?.addEventListener("change", renderBookings);

/* =========================================================
   SESSION RESTORE
   ========================================================= */

db.auth.onAuthStateChange((event, session) => {
  console.info("[Auth] Perubahan sesi:", event);

  if (event === "INITIAL_SESSION") {
    void handleSession(session);
  } else if (event === "SIGNED_IN" && session) {
    void handleSession(session);
  } else if (event === "SIGNED_OUT") {
    showLogin();
  }
});
