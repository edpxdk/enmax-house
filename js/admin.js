/* =========================================================
   ENMAX HOUSE - ADMIN DASHBOARD
   Supabase Auth, Bookings, and Camera Inventory
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
   MESSAGES AND UI
   ========================================================= */

function showMessage(id, message, isError = false) {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#ff7373" : "#ff2aa6";
}

function showLogin() {
  currentUser = null;
  bookingsCache = [];

  loginPanel.classList.remove("hidden");
  dashboard.classList.add("hidden");
  logoutBtn.classList.add("hidden");

  $("cameraList").replaceChildren();
  $("bookingList").replaceChildren();
}

function showDashboard(user) {
  currentUser = user;

  loginPanel.classList.add("hidden");
  dashboard.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  $("adminEmail").textContent = user.email || "";
}

/* =========================================================
   ADMIN AUTHORIZATION
   ========================================================= */

async function verifyAdmin(user) {
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
    throw new Error("Akun ini tidak terdaftar sebagai admin.");
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
    showDashboard(session.user);

    await Promise.all([loadCameras(), loadBookings()]);
  } catch (error) {
    await db.auth.signOut();
    showLogin();
    showMessage("loginMessage", error.message, true);
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("loginBtn");
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
    await db.auth.signOut();
    showLogin();
    showMessage("loginMessage", error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

/* =========================================================
   LOGOUT
   ========================================================= */

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  try {
    const { error } = await db.auth.signOut();

    if (error) {
      throw error;
    }

    showLogin();
  } catch (error) {
    showMessage("cameraMessage", error.message, true);
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
   LOAD BOOKINGS
   ========================================================= */

async function loadBookings() {
  if (!currentUser) return;

  showMessage("bookingMessage", "Memuat data booking...");
  $("bookingList").replaceChildren();

  try {
    /*
      Query bookings dan kamera secara terpisah.
      Ini tidak bergantung pada nama relasi foreign key Supabase.
    */

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
    showMessage("bookingMessage", error.message, true);
  }
}

/* =========================================================
   RENDER BOOKINGS
   ========================================================= */

function renderBookings() {
  const list = $("bookingList");
  list.replaceChildren();

  const selectedStatus = $("bookingStatusFilter").value;

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

    card.appendChild(
      makeTextElement("p", "Sumber: " + (booking.source || "-")),
    );

    const statusRow = document.createElement("p");
    statusRow.appendChild(
      makeTextElement("span", statusLabel(booking.status), "status-badge"),
    );
    card.appendChild(statusRow);

    if (booking.notes) {
      card.appendChild(makeTextElement("p", "Catatan customer:"));

      card.appendChild(makeTextElement("div", booking.notes, "notes"));
    }

    const actions = document.createElement("div");
    actions.className = "booking-actions";

    if (booking.status === "pending") {
      const approveButton = document.createElement("button");
      approveButton.textContent = "Setujui";
      approveButton.addEventListener("click", () => {
        updateBookingStatus(booking, "confirmed", approveButton);
      });

      const rejectButton = document.createElement("button");
      rejectButton.textContent = "Tolak";
      rejectButton.className = "danger";
      rejectButton.addEventListener("click", () => {
        updateBookingStatus(booking, "rejected", rejectButton);
      });

      actions.append(approveButton, rejectButton);
    } else {
      const resetButton = document.createElement("button");
      resetButton.textContent = "Kembalikan ke Pending";
      resetButton.className = "secondary";
      resetButton.addEventListener("click", () => {
        updateBookingStatus(booking, "pending", resetButton);
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
    /*
      Status hanya bisa berubah jika kebijakan RLS
      Supabase mengizinkan admin yang sedang login.
    */

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
    showMessage("bookingMessage", error.message, true);
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

  showMessage("cameraMessage", "Memuat kamera...");

  try {
    const { data, error } = await db
      .from("cameras")
      .select("id, name, quantity, daily_price, active")
      .order("id");

    if (error) {
      throw new Error("Gagal memuat kamera: " + error.message);
    }

    const list = $("cameraList");
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
          const { data, error } = await db
            .from("cameras")
            .update({
              quantity: newQuantity,
              daily_price: newPrice,
            })
            .eq("id", camera.id)
            .select("id")
            .maybeSingle();

          if (error) {
            throw new Error("Gagal menyimpan: " + error.message);
          }

          if (!data) {
            throw new Error(
              "Perubahan tidak tersimpan. Periksa izin UPDATE RLS.",
            );
          }

          showMessage(
            "cameraMessage",
            "Perubahan " + camera.name + " berhasil disimpan.",
          );

          await loadCameras();
        } catch (error) {
          showMessage("cameraMessage", error.message, true);
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
    showMessage("cameraMessage", error.message, true);
  }
}

/* =========================================================
   ADD CAMERA
   ========================================================= */

$("addCameraForm").addEventListener("submit", async (event) => {
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

    if (error) {
      throw new Error("Gagal menambahkan kamera: " + error.message);
    }

    $("addCameraForm").reset();
    $("cameraQuantity").value = "1";
    $("cameraPrice").value = "0";

    showMessage("cameraMessage", "Kamera berhasil ditambahkan.");

    await loadCameras();
  } catch (error) {
    showMessage("cameraMessage", error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

$("refreshBtn").addEventListener("click", loadCameras);
$("refreshBookingsBtn").addEventListener("click", loadBookings);

$("bookingStatusFilter").addEventListener("change", renderBookings);

/* =========================================================
   SESSION RESTORE
   ========================================================= */

db.auth.onAuthStateChange((event, session) => {
  if (event === "INITIAL_SESSION") {
    void handleSession(session);
  }
});
