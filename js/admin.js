/* =========================================================
   ENMAX HOUSE ADMIN
   Auth + Booking + Statistik + Tab Navigation
   Realtime Notifications + Push + Camera Inventory
   ========================================================= */

const SUPABASE_URL = "https://egfuemmimojqzdqjsofg.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWiZEW8hb8rI91I4cu3Law_H9NCykz6";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);

let currentUser = null;
let bookingsCache = [];
let bookingRealtimeChannel = null;
let notificationSessionUserId = null;
let realtimeStartToken = 0;

const bookingNotifications = [];
const seenNotificationIds = new Set();
const readNotificationIds = new Set();
const MAX_NOTIFICATIONS = 50;

let bookingAudioContext = null;
let audioUnlocked = false;

/* =========================================================
   TAB NAVIGATION
   ========================================================= */

function activateView(viewId) {
  const validViews = [
    "bookingsView",
    "notificationsView",
    "manualView",
    "camerasView",
  ];
  if (!validViews.includes(viewId)) return;

  validViews.forEach((id) => {
    $(id)?.classList.toggle("hidden", id !== viewId);
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    const active = button.dataset.viewTarget === viewId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () =>
    activateView(button.dataset.viewTarget),
  );
});

/* =========================================================
   AUDIO ALERT
   ========================================================= */

async function unlockBookingAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass)
    throw new Error("Browser tidak mendukung Web Audio API.");

  if (!bookingAudioContext) bookingAudioContext = new AudioContextClass();
  if (bookingAudioContext.state === "suspended")
    await bookingAudioContext.resume();

  audioUnlocked = bookingAudioContext.state === "running";
  return audioUnlocked;
}

async function playBookingAlert() {
  if (!(await unlockBookingAudio())) throw new Error("Audio belum aktif.");

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
}

document.addEventListener(
  "click",
  () => {
    void unlockBookingAudio().catch((error) => console.warn("[Audio]", error));
  },
  { once: true },
);

window.testBookingSound = async function () {
  try {
    await unlockBookingAudio();
    await playBookingAlert();
    console.info("Tes suara berhasil.");
    return true;
  } catch (error) {
    console.error("Tes suara gagal:", error);
    return false;
  }
};

/* =========================================================
   MESSAGES
   ========================================================= */

function showMessage(id, message, isError = false) {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#ff7373" : "#ff2aa6";
}

function makeTextElement(tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = String(text ?? "");
  if (className) element.className = className;
  return element;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

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
  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusLabel(status) {
  return (
    {
      pending: "Pending",
      confirmed: "Disetujui",
      rejected: "Ditolak",
    }[status] ||
    status ||
    "Tidak diketahui"
  );
}

/* =========================================================
   AUTHORIZATION AND SESSION
   ========================================================= */

async function verifyAdmin(user) {
  if (!user?.id) throw new Error("Sesi pengguna tidak valid.");

  const { data, error } = await db
    .from("admin_profiles")
    .select("user_id, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error("Gagal memeriksa hak admin: " + error.message);
  if (!data) throw new Error("Akun ini tidak terdaftar sebagai admin aktif.");

  return true;
}

function showLogin() {
  stopBookingRealtime();

  currentUser = null;
  bookingsCache = [];

  $("loginPanel")?.classList.remove("hidden");
  $("dashboard")?.classList.add("hidden");
  $("logoutBtn")?.classList.add("hidden");

  $("cameraList")?.replaceChildren();
  $("bookingList")?.replaceChildren();
  $("notificationList")?.replaceChildren();
  $("manualCameraId")?.replaceChildren(new Option("Pilih kamera", ""));

  clearBookingNotifications();
  updateBookingStats([]);

  if ($("realtimeStatus"))
    $("realtimeStatus").textContent = "Notifikasi tidak terhubung.";
}

function showDashboard(user) {
  currentUser = user;

  $("loginPanel")?.classList.add("hidden");
  $("dashboard")?.classList.remove("hidden");
  $("logoutBtn")?.classList.remove("hidden");

  if ($("adminEmail")) $("adminEmail").textContent = user.email || "";

  activateView("bookingsView");
}

async function handleSession(session) {
  if (!session) {
    showLogin();
    return;
  }

  try {
    await verifyAdmin(session.user);

    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    const activeSession = data?.session;
    if (!activeSession || activeSession.user.id !== session.user.id) return;

    showDashboard(session.user);
    startBookingRealtime();

    await Promise.all([
      loadCameras(),
      loadBookings(),
      loadManualBookingCameras(),
    ]);
  } catch (error) {
    console.error("handleSession:", error);
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
   LOGIN / LOGOUT
   ========================================================= */

$("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("loginBtn");
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Memeriksa akun...";

  showMessage("loginMessage", "Memeriksa akun...");

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value,
    });

    if (error) throw new Error("Login gagal: " + error.message);

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

$("logoutBtn")?.addEventListener("click", async () => {
  const button = $("logoutBtn");
  button.disabled = true;

  try {
    stopBookingRealtime();
    const { error } = await db.auth.signOut();
    if (error) throw error;

    showLogin();
    showMessage("loginMessage", "Kamu sudah logout.");
  } catch (error) {
    console.error("Logout error:", error);
    showMessage("cameraMessage", error.message || "Gagal logout.", true);
  } finally {
    button.disabled = false;
  }
});

/* =========================================================
   LIVE BOOKING STATISTICS
   ========================================================= */

function updateBookingStats(bookings) {
  const total = bookings.length;
  const pending = bookings.filter((item) => item.status === "pending").length;
  const confirmed = bookings.filter(
    (item) => item.status === "confirmed",
  ).length;
  const rejected = bookings.filter((item) => item.status === "rejected").length;

  if ($("statTotal")) $("statTotal").textContent = total;
  if ($("statPending")) $("statPending").textContent = pending;
  if ($("statConfirmed")) $("statConfirmed").textContent = confirmed;
  if ($("statRejected")) $("statRejected").textContent = rejected;
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function updateNotificationBadge() {
  const unread = bookingNotifications.filter(
    (item) => !readNotificationIds.has(String(item.id)),
  ).length;

  if ($("notificationBadge")) {
    $("notificationBadge").textContent = `${unread} belum dibaca`;
  }

  const navCount = $("navNotificationCount");
  if (navCount) {
    navCount.textContent = unread;
    navCount.classList.toggle("hidden", unread === 0);
  }
}

function renderBookingNotifications() {
  const list = $("notificationList");
  if (!list) return;

  list.replaceChildren();

  if (!bookingNotifications.length) {
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
    card.className = "booking notification-card" + (isRead ? "" : " unread");

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

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Lihat booking";

    button.addEventListener("click", async () => {
      readNotificationIds.add(id);
      renderBookingNotifications();
      $("bookingStatusFilter").value = "all";
      await loadBookings();
      activateView("bookingsView");

      const bookingCard = Array.from(
        document.querySelectorAll("#bookingList .booking"),
      ).find((element) =>
        element.textContent.includes(`ID Booking: #${item.id}`),
      );

      bookingCard?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    card.appendChild(button);
    list.appendChild(card);
  }

  updateNotificationBadge();
}

function addBookingNotification(booking) {
  if (!booking || booking.id == null) return;

  const id = String(booking.id);
  if (seenNotificationIds.has(id)) return;

  seenNotificationIds.add(id);
  void playBookingAlert().catch((error) => console.warn("[Audio]", error));

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
    if (removed) readNotificationIds.delete(String(removed.id));
  }

  renderBookingNotifications();
  void loadNotificationCameraName(booking.camera_id, id);
}

async function loadNotificationCameraName(cameraId, notificationId) {
  if (!currentUser || cameraId == null) return;

  const userId = currentUser.id;
  const { data, error } = await db
    .from("cameras")
    .select("name")
    .eq("id", cameraId)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil nama kamera notifikasi:", error);
    return;
  }

  if (!currentUser || currentUser.id !== userId) return;

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

$("markNotificationsReadBtn")?.addEventListener("click", () => {
  bookingNotifications.forEach((item) =>
    readNotificationIds.add(String(item.id)),
  );
  renderBookingNotifications();
});

$("clearNotificationsBtn")?.addEventListener("click", () => {
  bookingNotifications.length = 0;
  readNotificationIds.clear();
  renderBookingNotifications();
});

/* =========================================================
   REALTIME
   ========================================================= */

function stopBookingRealtime() {
  realtimeStartToken++;

  const channel = bookingRealtimeChannel;
  bookingRealtimeChannel = null;
  notificationSessionUserId = null;

  if (channel) {
    void db
      .removeChannel(channel)
      .catch((error) => console.error("Remove channel:", error));
  }

  if ($("realtimeStatus"))
    $("realtimeStatus").textContent = "Notifikasi tidak terhubung.";
}

function startBookingRealtime() {
  if (!currentUser) return;

  if (bookingRealtimeChannel && notificationSessionUserId === currentUser.id)
    return;

  stopBookingRealtime();

  const userId = currentUser.id;
  const token = realtimeStartToken;
  notificationSessionUserId = userId;

  if ($("realtimeStatus"))
    $("realtimeStatus").textContent = "Menghubungkan ke Supabase Realtime...";

  const channel = db
    .channel(`admin-bookings-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "rental_bookings",
      },
      (payload) => {
        if (
          token !== realtimeStartToken ||
          !currentUser ||
          currentUser.id !== userId ||
          notificationSessionUserId !== userId
        )
          return;

        const booking = payload?.new;
        if (!booking || booking.id == null) return;

        addBookingNotification(booking);
        void loadBookings();
      },
    )
    .subscribe((state, error) => {
      if (
        bookingRealtimeChannel !== channel ||
        token !== realtimeStartToken ||
        notificationSessionUserId !== userId
      )
        return;

      if (error) console.error("[Realtime]", error);

      if ($("realtimeStatus")) {
        if (state === "SUBSCRIBED") {
          $("realtimeStatus").textContent =
            "● Realtime aktif — menunggu booking baru.";
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          $("realtimeStatus").textContent =
            "Realtime bermasalah. Periksa konfigurasi Supabase.";
        } else if (state === "CLOSED") {
          $("realtimeStatus").textContent = "Koneksi Realtime ditutup.";
        } else {
          $("realtimeStatus").textContent = `Status koneksi: ${state}`;
        }
      }
    });

  bookingRealtimeChannel = channel;
}

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

    if (bookingResult.error)
      throw new Error(
        "Gagal mengambil booking: " + bookingResult.error.message,
      );
    if (cameraResult.error)
      throw new Error("Gagal mengambil kamera: " + cameraResult.error.message);
    if (!currentUser || currentUser.id !== requestedUserId) return;

    const cameraMap = new Map(
      (cameraResult.data || []).map((camera) => [String(camera.id), camera]),
    );

    bookingsCache = (bookingResult.data || []).map((booking) => ({
      ...booking,
      camera_name:
        cameraMap.get(String(booking.camera_id))?.name ||
        "Kamera tidak ditemukan",
    }));

    updateBookingStats(bookingsCache);
    renderBookings();
    showMessage("bookingMessage", `${bookingsCache.length} booking ditemukan.`);
  } catch (error) {
    console.error("loadBookings:", error);
    if (currentUser?.id === requestedUserId) {
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

  const selectedStatus = $("bookingStatusFilter")?.value || "all";
  const filtered =
    selectedStatus === "all"
      ? bookingsCache
      : bookingsCache.filter((booking) => booking.status === selectedStatus);

  if (!filtered.length) {
    list.appendChild(
      makeTextElement(
        "p",
        "Tidak ada booking untuk filter status ini.",
        "muted",
      ),
    );
    return;
  }

  const sourceLabels = {
    website: "Website",
    manual: "Manual (Admin)",
    whatsapp: "WhatsApp",
  };

  for (const booking of filtered) {
    const card = document.createElement("article");
    card.className = "booking";

    card.appendChild(
      makeTextElement("h3", booking.customer_name || "Customer"),
    );
    card.appendChild(makeTextElement("p", `ID Booking: #${booking.id}`));
    card.appendChild(makeTextElement("p", `Kamera: ${booking.camera_name}`));
    card.appendChild(makeTextElement("p", `Jumlah unit: ${booking.quantity}`));
    card.appendChild(
      makeTextElement("p", `Telepon: ${booking.customer_phone || "-"}`),
    );

    if (booking.customer_email) {
      card.appendChild(
        makeTextElement("p", `Email: ${booking.customer_email}`),
      );
    }

    card.appendChild(
      makeTextElement("p", `Pickup: ${formatDateTime(booking.pickup_at)}`),
    );
    card.appendChild(
      makeTextElement("p", `Return: ${formatDateTime(booking.return_at)}`),
    );
    card.appendChild(
      makeTextElement("p", `Diterima: ${formatDateTime(booking.created_at)}`),
    );
    card.appendChild(
      makeTextElement(
        "p",
        `Sumber: ${sourceLabels[booking.source] || booking.source || "-"}`,
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
      const approve = document.createElement("button");
      approve.type = "button";
      approve.textContent = "Setujui";
      approve.addEventListener(
        "click",
        () => void updateBookingStatus(booking, "confirmed", approve),
      );

      const reject = document.createElement("button");
      reject.type = "button";
      reject.className = "danger";
      reject.textContent = "Tolak";
      reject.addEventListener(
        "click",
        () => void updateBookingStatus(booking, "rejected", reject),
      );

      actions.append(approve, reject);
    } else {
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "secondary";
      reset.textContent = "Kembalikan ke Pending";
      reset.addEventListener(
        "click",
        () => void updateBookingStatus(booking, "pending", reset),
      );
      actions.appendChild(reset);
    }

    card.appendChild(actions);
    list.appendChild(card);
  }
}

async function updateBookingStatus(booking, newStatus, button) {
  if (!currentUser) {
    showMessage("bookingMessage", "Silakan login sebagai admin.", true);
    return;
  }

  if (!["pending", "confirmed", "rejected"].includes(newStatus)) {
    showMessage("bookingMessage", "Status tidak valid.", true);
    return;
  }

  const confirmations = {
    pending: "Kembalikan booking ini ke status pending?",
    confirmed: "Setujui booking customer ini?",
    rejected: "Tolak booking customer ini?",
  };

  if (!window.confirm(confirmations[newStatus])) return;

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

    if (error) throw new Error("Gagal mengubah status: " + error.message);
    if (!data)
      throw new Error("Status tidak berubah. Periksa izin UPDATE RLS.");

    showMessage(
      "bookingMessage",
      `Booking #${booking.id} sekarang ${statusLabel(newStatus)}.`,
    );
    await loadBookings();
  } catch (error) {
    console.error("updateBookingStatus:", error);
    showMessage(
      "bookingMessage",
      error.message || "Gagal mengubah status.",
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

  const userId = currentUser.id;
  showMessage("cameraMessage", "Memuat kamera...");

  try {
    const { data, error } = await db
      .from("cameras")
      .select("id, name, quantity, daily_price, active")
      .order("id");

    if (error) throw new Error("Gagal memuat kamera: " + error.message);
    if (!currentUser || currentUser.id !== userId) return;

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
            "Jumlah dan harga harus bilangan bulat nonnegatif.",
            true,
          );
          return;
        }

        save.disabled = true;
        save.textContent = "Menyimpan...";

        try {
          const { data: saved, error: saveError } = await db
            .from("cameras")
            .update({ quantity: newQuantity, daily_price: newPrice })
            .eq("id", camera.id)
            .select("id")
            .maybeSingle();

          if (saveError)
            throw new Error("Gagal menyimpan: " + saveError.message);
          if (!saved)
            throw new Error(
              "Perubahan tidak tersimpan. Periksa izin UPDATE RLS.",
            );

          showMessage(
            "cameraMessage",
            `Perubahan ${camera.name} berhasil disimpan.`,
          );
          await Promise.all([loadCameras(), loadManualBookingCameras()]);
        } catch (error) {
          console.error("Save camera:", error);
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

      card.append(quantityLabel, quantity, priceLabel, price, save);
      list.appendChild(card);
    }

    showMessage(
      "cameraMessage",
      `${(data || []).length} jenis kamera ditemukan.`,
    );
  } catch (error) {
    console.error("loadCameras:", error);
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

    if (error) throw new Error("Gagal menambahkan kamera: " + error.message);

    $("addCameraForm").reset();
    $("cameraQuantity").value = "1";
    $("cameraPrice").value = "0";

    showMessage("cameraMessage", "Kamera berhasil ditambahkan.");
    await Promise.all([loadCameras(), loadManualBookingCameras()]);
  } catch (error) {
    console.error("Add camera:", error);
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
   MANUAL BOOKING CAMERA OPTIONS
   ========================================================= */

async function loadManualBookingCameras() {
  const select = $("manualCameraId");
  if (!select || !currentUser) return;

  const userId = currentUser.id;
  select.replaceChildren(new Option("Memuat daftar kamera...", ""));

  try {
    const { data, error } = await db
      .from("cameras")
      .select("id, name, quantity, active")
      .eq("active", true)
      .order("name");

    if (error) throw error;
    if (!currentUser || currentUser.id !== userId) return;

    select.replaceChildren(new Option("Pilih kamera", ""));

    for (const camera of data || []) {
      const option = new Option(camera.name, String(camera.id));
      option.dataset.quantity = String(camera.quantity ?? 0);
      select.appendChild(option);
    }

    if (!data?.length) {
      select.replaceChildren(new Option("Belum ada kamera aktif", ""));
    }
  } catch (error) {
    console.error("loadManualBookingCameras:", error);

    if (currentUser?.id === userId) {
      select.replaceChildren(new Option("Gagal memuat kamera", ""));
      showMessage(
        "manualBookingMessage",
        "Gagal memuat kamera: " + error.message,
        true,
      );
    }
  }
}

$("manualCameraId")?.addEventListener("change", () => {
  const option = $("manualCameraId").selectedOptions[0];
  const input = $("manualQuantity");
  if (!input) return;

  if (!option?.value) {
    input.removeAttribute("max");
    return;
  }

  const availableQuantity = Number(option.dataset.quantity || 0);
  input.max = String(availableQuantity);

  if (availableQuantity > 0 && Number(input.value) > availableQuantity) {
    input.value = String(availableQuantity);
  }
});

/* =========================================================
   SAVE MANUAL BOOKING
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

  if (!customerName) problems.push("Nama customer belum diisi");
  if (!customerPhone) problems.push("Nomor WhatsApp belum diisi");
  if (!cameraId) problems.push("Kamera belum dipilih");
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    problems.push("Jumlah unit harus bilangan bulat minimal 1");
  if (!pickupValue || Number.isNaN(pickup.getTime()))
    problems.push("Waktu pickup tidak valid");
  if (!returnValue || Number.isNaN(returned.getTime()))
    problems.push("Waktu return tidak valid");
  if (
    !Number.isNaN(pickup.getTime()) &&
    !Number.isNaN(returned.getTime()) &&
    returned <= pickup
  ) {
    problems.push("Waktu return harus setelah pickup");
  }

  if (problems.length) {
    showMessage("manualBookingMessage", problems.join(". ") + ".", true);
    return;
  }

  const option = $("manualCameraId").selectedOptions[0];
  const cameraQuantity = Number(option?.dataset.quantity ?? 0);

  if (quantity > cameraQuantity) {
    showMessage(
      "manualBookingMessage",
      "Jumlah unit melebihi total inventaris kamera.",
      true,
    );
    return;
  }

  if (
    !window.confirm(
      "Simpan booking manual ini sebagai booking yang sudah disetujui?",
    )
  )
    return;

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
        "Booking gagal disimpan. Periksa struktur tabel dan izin INSERT RLS: " +
          error.message,
      );
    }

    $("manualBookingForm").reset();
    $("manualQuantity").value = "1";

    showMessage(
      "manualBookingMessage",
      `Booking manual #${data.id} berhasil disimpan.`,
    );
    await Promise.all([loadBookings(), loadManualBookingCameras()]);
    activateView("bookingsView");
  } catch (error) {
    console.error("Manual booking:", error);
    showMessage(
      "manualBookingMessage",
      error.message || "Gagal menyimpan booking.",
      true,
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

/* =========================================================
   REFRESH AND FILTER
   ========================================================= */

$("refreshBtn")?.addEventListener("click", () => void loadCameras());
$("refreshBookingsBtn")?.addEventListener("click", () => void loadBookings());
$("bookingStatusFilter")?.addEventListener("change", renderBookings);

/* =========================================================
   RESTORE AUTH SESSION
   ========================================================= */

db.auth.onAuthStateChange((event, session) => {
  console.info("[Auth] Perubahan sesi:", event);

  if (event === "INITIAL_SESSION" || (event === "SIGNED_IN" && session)) {
    void handleSession(session);
  } else if (event === "SIGNED_OUT") {
    showLogin();
  }
});

/* =========================================================
   ADMIN WEB PUSH
   ========================================================= */

(() => {
  const VAPID_PUBLIC_KEY =
    "BBZHL-Egcs_pxyLXqGD6tp8sKRf11SUoBYo6NBG1eWkp2iMtbRA0rRggl68EnbL10fz_J31fkfXMAB2Rc2qneXA";

  const SUPABASE_FUNCTION_URL =
    "https://egfuemmimojqzdqjsofg.supabase.co/functions/v1/admin-push";

  const SUPABASE_ANON_KEY = SUPABASE_KEY;

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from(raw, (character) => character.charCodeAt(0));
  }

  async function enableAdminPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Browser ini belum mendukung Web Push.");
    }

    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();
    const session = sessionData?.session;

    if (sessionError || !session?.access_token) {
      throw new Error("Login admin terlebih dahulu.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      throw new Error("Izin notifikasi belum diberikan.");

    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      { scope: "/" },
    );
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "subscribe",
        subscription: subscription.toJSON(),
      }),
    });

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Gagal menyimpan subscription.");

    alert("Notifikasi booking berhasil diaktifkan di perangkat ini!");
  }

  function addPushButton() {
    if ($("enmax-enable-push")) return;

    const button = document.createElement("button");
    button.id = "enmax-enable-push";
    button.type = "button";
    button.textContent = "🔔 Aktifkan Notifikasi";
    button.style.cssText = [
      "position:fixed",
      "right:14px",
      "bottom:14px",
      "z-index:99999",
      "padding:11px 14px",
      "border:0",
      "border-radius:10px",
      "background:#ff2aa6",
      "color:white",
      "font-weight:700",
      "box-shadow:0 4px 16px #0004",
    ].join(";");

    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Mengaktifkan...";

      try {
        await enableAdminPush();
      } catch (error) {
        console.error("Push setup:", error);
        alert("Gagal mengaktifkan notifikasi: " + error.message);
      } finally {
        button.disabled = false;
        button.textContent = "🔔 Aktifkan Notifikasi";
      }
    });

    document.body.appendChild(button);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addPushButton);
  } else {
    addPushButton();
  }
})();
