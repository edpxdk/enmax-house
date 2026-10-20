
const SUPABASE_URL = "https://egfuemmimojqzdqjsofg.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWiZEW8hb8rI91I4cu3Law_H9NCykz6";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);

const loginPanel = $("loginPanel");
const dashboard = $("dashboard");
const logoutBtn = $("logoutBtn");

let currentUser = null;

function showMessage(id, message, isError = false) {
  const element = $(id);
  element.textContent = message;
  element.style.color = isError ? "#ff7373" : "#ff2aa6";
}

function showLogin() {
  currentUser = null;
  loginPanel.classList.remove("hidden");
  dashboard.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

function showDashboard(user) {
  currentUser = user;
  loginPanel.classList.add("hidden");
  dashboard.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  $("adminEmail").textContent = user.email || "";
}

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
    await loadCameras();
  } catch (error) {
    showLogin();
    showMessage("loginMessage", error.message, true);
  }
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  showMessage("loginMessage", "Memeriksa akun...");

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(
      "loginMessage",
      "Login gagal: " + error.message,
      true
    );
    return;
  }

  try {
    await verifyAdmin(data.user);
    showMessage("loginMessage", "");
    await handleSession(data.session);
  } catch (error) {
    await db.auth.signOut();
    showLogin();
    showMessage("loginMessage", error.message, true);
  }
});

logoutBtn.addEventListener("click", async () => {
  const { error } = await db.auth.signOut();

  if (error) {
    showMessage("cameraMessage", error.message, true);
    return;
  }

  showLogin();
});

async function loadCameras() {
  if (!currentUser) return;

  showMessage("cameraMessage", "Memuat kamera...");

  const { data, error } = await db
    .from("cameras")
    .select("id, name, quantity, daily_price, active")
    .order("id");

  if (error) {
    showMessage(
      "cameraMessage",
      "Gagal memuat kamera: " + error.message,
      true
    );
    return;
  }

  const list = $("cameraList");
  list.replaceChildren();

  for (const camera of data) {
    const card = document.createElement("article");
    card.className = "camera";

    const title = document.createElement("h3");
    title.textContent = camera.name;

    const status = document.createElement("p");
    status.textContent = camera.active ? "Aktif" : "Nonaktif";

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Jumlah unit";

    const quantity = document.createElement("input");
    quantity.type = "number";
    quantity.min = "0";
    quantity.step = "1";
    quantity.value = camera.quantity;

    const priceLabel = document.createElement("label");
    priceLabel.textContent = "Harga per hari (Rp)";

    const price = document.createElement("input");
    price.type = "number";
    price.min = "0";
    price.step = "1000";
    price.value = camera.daily_price;

    const save = document.createElement("button");
    save.textContent = "Simpan perubahan";

    save.addEventListener("click", async () => {
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
          true
        );
        return;
      }

      save.disabled = true;

      const { error } = await db
        .from("cameras")
        .update({
          quantity: newQuantity,
          daily_price: newPrice
        })
        .eq("id", camera.id);

      save.disabled = false;

      if (error) {
        showMessage(
          "cameraMessage",
          "Gagal menyimpan: " + error.message,
          true
        );
        return;
      }

      showMessage(
        "cameraMessage",
        "Perubahan " + camera.name + " berhasil disimpan."
      );

      await loadCameras();
    });

    card.append(
      title,
      status,
      quantityLabel,
      quantity,
      priceLabel,
      price,
      document.createElement("br"),
      document.createElement("br"),
      save
    );

    list.appendChild(card);
  }

  showMessage("cameraMessage", data.length + " jenis kamera ditemukan.");
}

$("refreshBtn").addEventListener("click", loadCameras);

$("addCameraForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

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
      true
    );
    return;
  }

  const { error } = await db
    .from("cameras")
    .insert({
      name,
      quantity,
      daily_price: price,
      active: true
    });

  if (error) {
    showMessage(
      "cameraMessage",
      "Gagal menambahkan kamera: " + error.message,
      true
    );
    return;
  }

  $("addCameraForm").reset();
  $("cameraQuantity").value = "1";
  $("cameraPrice").value = "0";

  showMessage("cameraMessage", "Kamera berhasil ditambahkan.");
  await loadCameras();
});

db.auth.onAuthStateChange((event, session) => {
  if (event === "INITIAL_SESSION") {
    void handleSession(session);
  }
});
