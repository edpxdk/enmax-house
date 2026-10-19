/* =========================================================
   ENMAX HOUSE
   Camera Rental Website
   ========================================================= */

/* SUPABASE CONFIGURATION */

const SUPABASE_URL = "https://egfuemmimojqzdqjsofg.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWiZEW8hb8rI91I4cu3Law_H9NCykz6";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* CONFIGURATION */

const WHATSAPP_NUMBER = "6282145929947";

/* CAMERA DATA */

const cameras = [
  {
    id: "camera-01",
    name: "Canon G7X Mark II",
    category: "Effortless Aesthetic Short",
    description:
      "Compact camera with excellent image quality, perfect for travel, daily content, and casual photography.",
    price: "Rp 220.000 / day",
    image: "assets/cameras/camera-01.jpg",
    gallery: [
      "assets/cameras/camera-01.jpg",
      "assets/cameras/camera-01-1.jpg",
      "assets/cameras/camera-01-2.jpg",
      "assets/cameras/camera-01-3.jpg",
    ],
  },
  {
    id: "camera-02",
    name: "Canon SX740 HS",
    category: "Instantly Post Ready",
    description:
      "Powerful zoom in a compact body, made for travel and everyday moments.",
    price: "Rp 200.000 / day",
    image: "assets/cameras/camera-02.jpg",
    gallery: [
      "assets/cameras/camera-02.jpg",
      "assets/cameras/camera-02-1.jpg",
      "assets/cameras/camera-02-2.jpg",
      "assets/cameras/camera-02-3.jpg",
    ],
  },
  {
    id: "camera-03",
    name: "Panasonic Lumix TZ99",
    category: "Feel Leica Quality",
    description:
      "Versatile zoom and compact design for travel and everyday shooting.",
    price: "Rp 200.000 / day",
    image: "assets/cameras/camera-03.jpg",
    gallery: [
      "assets/cameras/camera-03.jpg",
      "assets/cameras/camera-03-1.jpg",
      "assets/cameras/camera-03-2.jpg",
      "assets/cameras/camera-03-3.jpg",
    ],
  },
  {
    id: "camera-04",
    name: "Leica D-Lux 6",
    category: "Luxury In Every Shot",
    description:
      "Premium compact camera with Leica character for street and lifestyle photography.",
    price: "Rp 140.000 / day",
    image: "assets/cameras/camera-04.jpg",
    gallery: [
      "assets/cameras/camera-04.jpg",
      "assets/cameras/camera-04-1.jpg",
      "assets/cameras/camera-04-2.jpg",
      "assets/cameras/camera-04-3.jpg",
    ],
  },
  {
    id: "camera-05",
    name: "Sony ZV-1",
    category: "Your Moment Your Content",
    description:
      "Creator-focused compact camera for vlogs, travel, and social content.",
    price: "Rp 150.000 / day",
    image: "assets/cameras/camera-05.jpg",
    gallery: [
      "assets/cameras/camera-05.jpg",
      "assets/cameras/camera-05-1.jpg",
      "assets/cameras/camera-05-2.jpg",
      "assets/cameras/camera-05-3.jpg",
    ],
  },
];

/* DOM ELEMENTS */

const $ = (id) => document.getElementById(id);

const navbar = $("navbar");
const navMenu = $("navMenu");
const menuToggle = $("menuToggle");

const cameraGrid = $("cameraGrid");
const cameraSelect = $("cameraSelect");

const cameraModal = $("cameraModal");
const modalOverlay = $("modalOverlay");
const modalClose = $("modalClose");

const modalCameraImage = $("modalCameraImage");
const galleryPrev = $("galleryPrev");
const galleryNext = $("galleryNext");
const galleryCounter = $("galleryCounter");

const modalCameraCategory = $("modalCameraCategory");
const modalCameraName = $("modalCameraName");
const modalCameraDescription = $("modalCameraDescription");
const modalCameraPrice = $("modalCameraPrice");
const modalBookButton = $("modalBookButton");

const bookingForm = $("bookingForm");

const startDate = $("startDate");
const endDate = $("endDate");
const startTime = $("startTime");
const endTime = $("endTime");
const cameraQuantity = $("cameraQuantity");

const summaryCamera = $("summaryCamera");
const summaryDuration = $("summaryDuration");
const summaryQuantity = $("summaryQuantity");

const agreement = $("agreement");
const agreementError = $("agreementError");

const commentForm = $("commentForm");
const commentsList = $("commentsList");
const currentYear = $("currentYear");

/* GLOBAL STATE */

let selectedCameraId = null;
let currentGalleryIndex = 0;
const phoneInputs = {};

/* INITIALIZATION */

document.addEventListener("DOMContentLoaded", () => {
  renderCameraCards();
  populateCameraSelect();
  setMinimumDates();
  setupNavbar();
  setupGalleryControls();
  setupPhoneInputs();
  setupBookingListeners();
  updateBookingSummary();
  loadComments();
  updateCurrentYear();
});

/* CAMERA CARDS */

function renderCameraCards() {
  if (!cameraGrid) return;

  cameraGrid.innerHTML = "";

  cameras.forEach((camera) => {
    const card = document.createElement("article");
    card.className = "camera-card";

    card.innerHTML = `
      <div class="camera-card-image">
        <img
          src="${camera.image}"
          alt="${escapeHTML(camera.name)}"
          loading="lazy"
        >
        <span class="camera-badge">Available</span>
      </div>

      <div class="camera-card-content">
        <span class="camera-category">
          ${escapeHTML(camera.category)}
        </span>

        <h3>${escapeHTML(camera.name)}</h3>

        <p>${escapeHTML(camera.description)}</p>

        <div class="camera-card-footer">
          <strong class="camera-price">
            ${escapeHTML(camera.price)}
          </strong>

          <button
            type="button"
            class="camera-view-button"
            data-camera-id="${camera.id}"
          >
            View Camera →
          </button>
        </div>
      </div>
    `;

    cameraGrid.appendChild(card);
  });

  document.querySelectorAll(".camera-view-button").forEach((button) => {
    button.addEventListener("click", () => {
      openCameraModal(button.dataset.cameraId);
    });
  });
}

/* CAMERA SELECT */

function populateCameraSelect() {
  if (!cameraSelect) return;

  cameraSelect.innerHTML = '<option value="">Select a camera</option>';

  cameras.forEach((camera) => {
    const option = document.createElement("option");
    option.value = camera.id;
    option.textContent = `${camera.name} — ${camera.price}`;
    cameraSelect.appendChild(option);
  });

  cameraSelect.addEventListener("change", () => {
    selectedCameraId = cameraSelect.value || null;
    updateBookingSummary();
  });
}

/* CAMERA MODAL */

function openCameraModal(cameraId) {
  const camera = cameras.find((item) => item.id === cameraId);

  if (!camera || !cameraModal) return;

  selectedCameraId = camera.id;
  currentGalleryIndex = 0;

  if (modalCameraCategory) {
    modalCameraCategory.textContent = camera.category;
  }

  if (modalCameraName) {
    modalCameraName.textContent = camera.name;
  }

  if (modalCameraDescription) {
    modalCameraDescription.textContent = camera.description;
  }

  if (modalCameraPrice) {
    modalCameraPrice.textContent = camera.price;
  }

  if (modalBookButton) {
    modalBookButton.dataset.cameraId = camera.id;
  }

  updateGalleryImage();

  cameraModal.classList.add("active");
  cameraModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  window.setTimeout(() => modalClose?.focus(), 100);
}

/* GALLERY */

function getCurrentGallery() {
  const camera = cameras.find((item) => item.id === selectedCameraId);

  if (!camera) return [];

  return Array.isArray(camera.gallery) && camera.gallery.length
    ? camera.gallery
    : [camera.image];
}

function updateGalleryImage() {
  if (!modalCameraImage) return;

  const camera = cameras.find((item) => item.id === selectedCameraId);

  const gallery = getCurrentGallery();

  if (!camera || !gallery.length) return;

  currentGalleryIndex = (currentGalleryIndex + gallery.length) % gallery.length;

  modalCameraImage.src = gallery[currentGalleryIndex];
  modalCameraImage.alt = `${camera.name} photo ${currentGalleryIndex + 1}`;

  if (galleryCounter) {
    galleryCounter.textContent = `${currentGalleryIndex + 1} / ${gallery.length}`;
  }

  const multipleImages = gallery.length > 1;

  if (galleryPrev) {
    galleryPrev.style.display = multipleImages ? "flex" : "none";
  }

  if (galleryNext) {
    galleryNext.style.display = multipleImages ? "flex" : "none";
  }
}

function moveGallery(direction) {
  const gallery = getCurrentGallery();

  if (!gallery.length) return;

  currentGalleryIndex += direction;
  updateGalleryImage();
}

function setupGalleryControls() {
  galleryPrev?.addEventListener("click", () => moveGallery(-1));
  galleryNext?.addEventListener("click", () => moveGallery(1));
}

/* CLOSE MODAL */

function closeCameraModal() {
  if (!cameraModal) return;

  cameraModal.classList.remove("active");
  cameraModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

modalClose?.addEventListener("click", closeCameraModal);
modalOverlay?.addEventListener("click", closeCameraModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cameraModal?.classList.contains("active")) {
    closeCameraModal();
  }

  if (!cameraModal?.classList.contains("active")) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveGallery(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveGallery(1);
  }
});

/* BOOK THIS CAMERA */

modalBookButton?.addEventListener("click", () => {
  const cameraId = modalBookButton.dataset.cameraId;

  if (!cameraId || !cameraSelect) return;

  cameraSelect.value = cameraId;
  selectedCameraId = cameraId;

  updateBookingSummary();
  closeCameraModal();

  $("booking")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

/* INTERNATIONAL PHONE INPUTS
   Load intl-tel-input CSS and JS in index.html
   before js/script.js. */

function setupPhoneInputs() {
  if (typeof window.intlTelInput !== "function") {
    console.warn(
      "intl-tel-input belum dimuat. Country code selector tidak aktif.",
    );
    return;
  }

  ["whatsapp", "emergencyContact"].forEach((id) => {
    const input = $(id);

    if (!input) return;

    phoneInputs[id] = window.intlTelInput(input, {
      initialCountry: "id",
      separateDialCode: true,
      nationalMode: true,
      formatOnDisplay: true,
      autoPlaceholder: "polite",
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/utils.js",
    });
  });
}

function getInternationalNumber(id) {
  const input = $(id);
  const phoneInput = phoneInputs[id];

  if (!input) return "";

  if (phoneInput && input.value.trim()) {
    try {
      return phoneInput.getNumber();
    } catch (error) {
      console.warn("Phone formatting failed:", error);
    }
  }

  return input.value.trim();
}

function isValidPhoneNumber(id) {
  const input = $(id);

  if (!input || !input.value.trim()) return false;

  const phoneInput = phoneInputs[id];

  if (phoneInput) {
    try {
      return phoneInput.isValidNumber();
    } catch (error) {
      console.warn("Phone validation failed:", error);
    }
  }

  return /^[0-9+\-\s()]{8,25}$/.test(input.value.trim());
}

/* DATE AND TIME */

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function setMinimumDates() {
  const today = getTodayString();

  if (startDate) startDate.min = today;
  if (endDate) endDate.min = today;
}

function getPickupDateTime() {
  if (!startDate?.value || !startTime?.value) return null;

  return new Date(`${startDate.value}T${startTime.value}:00`);
}

function getReturnDateTime() {
  if (!endDate?.value || !endTime?.value) return null;

  return new Date(`${endDate.value}T${endTime.value}:00`);
}

function calculateRentalDays() {
  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();

  if (!pickup || !returned || returned <= pickup) return null;

  return Math.max(
    1,
    Math.ceil((returned.getTime() - pickup.getTime()) / 86400000),
  );
}

function formatDateIndonesia(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTimeIndonesia(date) {
  if (!date || Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* BOOKING LISTENERS */

function setupBookingListeners() {
  [startDate, endDate, startTime, endTime, cameraQuantity].forEach((input) => {
    input?.addEventListener("change", () => {
      if (startDate?.value && endDate) {
        endDate.min = startDate.value;

        if (endDate.value && endDate.value < startDate.value) {
          endDate.value = startDate.value;
        }
      }

      updateBookingSummary();
    });

    input?.addEventListener("input", updateBookingSummary);
  });

  startDate?.addEventListener("change", () => {
    if (endDate && startDate.value) {
      endDate.min = startDate.value;
    }
  });
}

/* BOOKING SUMMARY */

function updateBookingSummary() {
  if (!cameraSelect) return;

  const camera = cameras.find((item) => item.id === cameraSelect.value);

  if (summaryCamera) {
    summaryCamera.textContent = camera ? camera.name : "-";
  }

  const duration = calculateRentalDays();

  if (summaryDuration) {
    summaryDuration.textContent = duration
      ? `${duration} day${duration > 1 ? "s" : ""}`
      : "-";
  }

  if (summaryQuantity) {
    const quantity = Math.max(1, Number(cameraQuantity?.value) || 1);

    summaryQuantity.textContent = String(quantity);
  }
}

/* FORM VALIDATION */

function clearValidation() {
  document.querySelectorAll(".error-message").forEach((error) => {
    error.textContent = "";
  });

  document.querySelectorAll(".input-error").forEach((input) => {
    input.classList.remove("input-error");
  });

  if (agreementError) {
    agreementError.textContent = "";
  }
}

function showFieldError(input, message) {
  if (!input) return;

  input.classList.add("input-error");

  const parent = input.closest(".form-group");
  const error = parent?.querySelector(".error-message");

  if (error) {
    error.textContent = message;
  }
}

function validateBookingForm() {
  clearValidation();

  let isValid = true;

  const requiredFields = [
    ["fullName", "Nama lengkap wajib diisi."],
    ["occupation", "Pekerjaan wajib diisi."],
    ["workplace", "Tempat kerja wajib diisi."],
    ["whatsapp", "Nomor WhatsApp wajib diisi."],
    ["emergencyContact", "Kontak darurat wajib diisi."],
    ["cameraSelect", "Silakan pilih kamera."],
    ["startDate", "Tanggal pickup wajib dipilih."],
    ["startTime", "Jam pickup wajib dipilih."],
    ["endDate", "Tanggal return wajib dipilih."],
    ["endTime", "Jam return wajib dipilih."],
    ["pickupLocation", "Tempat pengambilan wajib diisi."],
    ["returnLocation", "Tempat pengembalian wajib diisi."],
  ];

  requiredFields.forEach(([id, message]) => {
    const input = $(id);

    if (!input || !String(input.value || "").trim()) {
      showFieldError(input, message);
      isValid = false;
    }
  });

  /* DATE AND TIME VALIDATION */

  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();

  if (pickup && pickup.getTime() < Date.now()) {
    showFieldError(
      startTime || startDate,
      "Waktu pickup tidak boleh di masa lalu.",
    );

    isValid = false;
  }

  if (pickup && returned && returned <= pickup) {
    showFieldError(
      endTime || endDate,
      "Waktu return harus setelah waktu pickup.",
    );

    isValid = false;
  }

  /* PHONE VALIDATION */

  ["whatsapp", "emergencyContact"].forEach((id) => {
    const input = $(id);

    if (input?.value.trim() && !isValidPhoneNumber(id)) {
      showFieldError(input, "Masukkan nomor telepon yang valid.");
      isValid = false;
    }
  });

  /* QUANTITY VALIDATION */

  if (cameraQuantity) {
    const quantity = Number(cameraQuantity.value);

    if (!Number.isInteger(quantity) || quantity < 1) {
      showFieldError(cameraQuantity, "Jumlah kamera minimal 1 unit.");

      isValid = false;
    }
  }

  /* REQUIRED ID / PASSPORT */

  const ktpCheck = $("ktpCheck");

  if (ktpCheck && !ktpCheck.checked) {
    showFieldError(ktpCheck, "KTP / Passport wajib disiapkan.");

    isValid = false;
  }

  /* AGREEMENT */

  if (!agreement?.checked) {
    if (agreementError) {
      agreementError.textContent = "Kamu harus menyetujui ketentuan booking.";
    }

    isValid = false;
  }

  return isValid;
}

/* BOOKING FORM SUBMIT */

if (bookingForm) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const isValid = validateBookingForm();

    if (!isValid) {
      document.querySelector(".input-error")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    createWhatsAppMessage();
  });
}

/* WHATSAPP MESSAGE */

function createWhatsAppMessage() {
  const camera = cameras.find((item) => item.id === cameraSelect?.value);

  const fullName = $("fullName")?.value.trim() || "";
  const occupation = $("occupation")?.value.trim() || "";
  const workplace = $("workplace")?.value.trim() || "";

  const whatsapp = getInternationalNumber("whatsapp");
  const emergencyContact = getInternationalNumber("emergencyContact");

  const instagram = $("instagram")?.value.trim() || "";
  const pickupLocation = $("pickupLocation")?.value.trim() || "";
  const returnLocation = $("returnLocation")?.value.trim() || "";
  const comments = $("comments")?.value.trim() || "";

  const quantity = Math.max(1, Number(cameraQuantity?.value) || 1);

  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();
  const duration = calculateRentalDays();

  const ktpCheck = $("ktpCheck")?.checked;
  const hotelCheck = $("hotelCheck")?.checked;
  const flightCheck = $("flightCheck")?.checked;

  const documentStatus = `
KTP / Passport: ${ktpCheck ? "Wajib disiapkan dan dikirim via WhatsApp" : "Belum disiapkan"}
Bukti Booking Hotel: ${hotelCheck ? "Akan dikirim" : "-"}
Detail Penerbangan: ${flightCheck ? "Akan dikirim" : "-"}
  `.trim();

  const message = `
Halo Enmax House, saya ingin mengajukan booking kamera.

DETAIL RENTAL
Camera: ${camera ? camera.name : "-"}
Jumlah Unit: ${quantity}
Durasi: ${duration ? `${duration} hari` : "-"}
Pickup: ${formatDateTimeIndonesia(pickup)}
Return: ${formatDateTimeIndonesia(returned)}
Tempat Pengambilan: ${pickupLocation}
Tempat Pengembalian: ${returnLocation}

DATA PENYEWA
Nama: ${fullName}
Pekerjaan: ${occupation}
Tempat Kerja: ${workplace}
WhatsApp: ${whatsapp}
Kontak Darurat: ${emergencyContact}
Instagram: ${instagram || "-"}

DOKUMEN PENDUKUNG
${documentStatus}

CATATAN TAMBAHAN
${comments || "-"}

Saya memahami bahwa booking ini belum confirmed dan masih menunggu pengecekan serta konfirmasi dari Enmax House. Saya akan mengirim dokumen pendukung melalui WhatsApp.
  `.trim();

  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  const newWindow = window.open(whatsappURL, "_blank", "noopener,noreferrer");

  if (!newWindow) {
    window.location.href = whatsappURL;
  }
}

/* NAVBAR */

function setupNavbar() {
  if (!navbar || !navMenu || !menuToggle) return;

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* CUSTOMER COMMENTS — SUPABASE */

async function loadComments() {
  if (!commentsList) return;

  commentsList.innerHTML = `
    <div class="empty-comments">
      <p>Loading comments...</p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);

    commentsList.innerHTML = `
      <div class="empty-comments">
        <p>Unable to load comments.</p>
      </div>
    `;

    return;
  }

  commentsList.innerHTML = "";

  if (!data || data.length === 0) {
    commentsList.innerHTML = `
      <div class="empty-comments">
        <p>Belum ada komentar. Jadilah yang pertama.</p>
      </div>
    `;

    return;
  }

  data.forEach(renderComment);
}

/* RENDER COMMENT */

function renderComment(comment) {
  if (!commentsList) return;

  const article = document.createElement("article");
  article.className = "comment-card";

  const rating = Math.max(0, Math.min(5, Number(comment.rating) || 0));

  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  const date = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  article.innerHTML = `
    <div class="comment-header">
      <div>
        <strong class="comment-author">
          ${escapeHTML(comment.name)}
        </strong>
        <div class="comment-rating">${stars}</div>
      </div>
      <span class="comment-date">${escapeHTML(date)}</span>
    </div>

    <p>${escapeHTML(comment.comment || "")}</p>
  `;

  commentsList.appendChild(article);
}

/* COMMENT FORM */

if (commentForm) {
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = $("commentName");
    const ratingInput = $("commentRating");
    const textInput = $("commentText");

    const name = nameInput?.value.trim() || "";
    const rating = Number(ratingInput?.value);
    const comment = textInput?.value.trim() || "";

    if (!name) {
      alert("Please enter your name.");
      nameInput?.focus();
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      alert("Please select a valid rating.");
      ratingInput?.focus();
      return;
    }

    if (!comment) {
      alert("Please write your comment.");
      textInput?.focus();
      return;
    }

    const submitButton = commentForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      const { error } = await supabaseClient
        .from("reviews")
        .insert([{ name, rating, comment }]);

      if (error) throw error;

      alert("Thank you for your comment!");

      commentForm.reset();
      await loadComments();
    } catch (error) {
      console.error("Supabase error:", error);
      alert("Failed to submit your comment. Please try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Comment";
      }
    }
  });
}

/* HTML ESCAPE */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* FOOTER YEAR */

function updateCurrentYear() {
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }
}
