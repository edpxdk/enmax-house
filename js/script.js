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
    price: "Rp 200.000",
    durations: [24],
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
    price: "Rp 125.000",
    durations: [6, 12, 24],
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
    price: "Rp 125.000",
    durations: [6, 12, 24],
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
    price: "Rp 125.000",
    durations: [24],
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
    price: "Rp 180.000",
    durations: [6, 12, 24],
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
const modalRentalDuration = $("modalRentalDuration");
const modalBookButton = $("modalBookButton");

const bookingForm = $("bookingForm");

const rentalDuration = $("rentalDuration");
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

/* PHOTO LIGHTBOX STATE */

let photoLightbox = null;
let lightboxImage = null;
let previousBodyOverflow = "";

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderCameraCards();
  populateCameraSelect();
  setupRentalDurationOptions();
  setMinimumDates();
  setupNavbar();
  setupGalleryControls();
  setupPhotoLightbox();
  setupPhoneInputs();
  setupBookingListeners();
  setupDurationSynchronization();
  updateBookingSummary();
  loadComments();
  updateCurrentYear();
});

/* =========================================================
   CAMERA CARDS
   ========================================================= */

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
      </div>

      <div class="camera-card-content">
        <span class="camera-category">
          ${escapeHTML(camera.category)}
        </span>

        <h3>${escapeHTML(camera.name)}</h3>

        <p>${escapeHTML(camera.description)}</p>

        <div class="camera-card-footer">
          <div class="camera-price-block">
            <span class="camera-price-label">Starting from</span>
            <strong class="camera-price">
              ${escapeHTML(camera.price)}
            </strong>
          </div>

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

  cameraGrid.querySelectorAll(".camera-view-button").forEach((button) => {
    button.addEventListener("click", () => {
      openCameraModal(button.dataset.cameraId);
    });
  });
}

/* =========================================================
   CAMERA SELECT
   ========================================================= */

function populateCameraSelect() {
  if (!cameraSelect) return;

  cameraSelect.innerHTML = `
    <option value="">Select a camera</option>
  `;

  cameras.forEach((camera) => {
    const option = document.createElement("option");

    option.value = camera.id;
    option.textContent = `${camera.name} — Starting from ${camera.price}`;

    cameraSelect.appendChild(option);
  });

  cameraSelect.addEventListener("change", () => {
    selectedCameraId = cameraSelect.value || null;

    setupRentalDurationOptions();

    syncReturnDateTime();
    updateBookingSummary();
  });
}

/* =========================================================
   RENTAL DURATION SYSTEM
   Options:
   - 6 Hours
   - 12 Hours
   - Daily Rental

   Daily rental:
   Chargeable days = ceiling(actual hours / 24).

   Examples:
   19 Oct 10:00 -> 20 Oct 09:00 = 1 day
   19 Oct 10:00 -> 20 Oct 10:00 = 1 day
   19 Oct 10:00 -> 20 Oct 11:00 = 2 days
   ========================================================= */

const RENTAL_MODE = {
  SIX_HOURS: "6",
  TWELVE_HOURS: "12",
  DAILY: "daily",
};

function createDailyReturnMessage() {
  return "Select your return date and time.";
}

function setupRentalDurationOptions() {
  setupOneDurationSelect(rentalDuration);
  setupOneDurationSelect(modalRentalDuration);
}

function setupOneDurationSelect(select) {
  if (!select) return;

  const previousValue = select.value;

  select.innerHTML = `
    <option value="6">6 Hours</option>
    <option value="12">12 Hours</option>
    <option value="daily">Daily Rental</option>
  `;

  // Default to daily rental.
  if (
    previousValue === RENTAL_MODE.SIX_HOURS ||
    previousValue === RENTAL_MODE.TWELVE_HOURS ||
    previousValue === RENTAL_MODE.DAILY
  ) {
    select.value = previousValue;
  } else {
    select.value = RENTAL_MODE.DAILY;
  }

  updateDurationFieldState(select);
}

function updateDurationFieldState(select) {
  if (!select) return;

  const isDaily = select.value === RENTAL_MODE.DAILY;

  // The main booking form allows manual return date/time
  // only for Daily Rental.
  if (select === rentalDuration) {
    if (endDate) {
      endDate.readOnly = !isDaily;
      endDate.title = isDaily
        ? "Choose your return date"
        : "Automatically calculated from pickup and duration";
    }

    if (endTime) {
      endTime.readOnly = !isDaily;
      endTime.title = isDaily
        ? "Choose your return time"
        : "Automatically calculated from pickup and duration";
    }
  }

  syncReturnDateTime();
}

/* GET SELECTED RENTAL MODE */

function getSelectedRentalMode() {
  return rentalDuration?.value || RENTAL_MODE.DAILY;
}

function getSelectedDurationHours() {
  const mode = getSelectedRentalMode();

  if (mode === RENTAL_MODE.SIX_HOURS) return 6;
  if (mode === RENTAL_MODE.TWELVE_HOURS) return 12;

  if (mode === RENTAL_MODE.DAILY) {
    return getRentalDurationDifference();
  }

  return null;
}

function formatDuration(hours) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "-";
  }

  if (hours === 6) return "6 Hours";
  if (hours === 12) return "12 Hours";

  const days = Math.ceil(hours / 24);

  return `${days} ${days === 1 ? "Day" : "Days"}`;
}

function getChargeableDays(hours) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return null;
  }

  return Math.ceil(hours / 24);
}

/* =========================================================
   CAMERA MODAL
   ========================================================= */

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

  setupOneDurationSelect(modalRentalDuration);

  if (rentalDuration && modalRentalDuration) {
    modalRentalDuration.value = rentalDuration.value;
  }

  updateDurationFieldState(modalRentalDuration);
  updateGalleryImage();

  cameraModal.classList.add("active");
  cameraModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  window.setTimeout(() => modalClose?.focus(), 100);
}

/* =========================================================
   GALLERY
   ========================================================= */

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

  currentGalleryIndex =
    ((currentGalleryIndex % gallery.length) + gallery.length) % gallery.length;

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

/* =========================================================
   PHOTO LIGHTBOX
   ========================================================= */

function setupPhotoLightbox() {
  if (photoLightbox) return;

  photoLightbox = document.createElement("div");

  photoLightbox.id = "photoLightbox";
  photoLightbox.setAttribute("aria-hidden", "true");
  photoLightbox.setAttribute("role", "dialog");
  photoLightbox.setAttribute("aria-modal", "true");
  photoLightbox.setAttribute("aria-label", "Enlarged camera photo");

  photoLightbox.innerHTML = `
    <button
      type="button"
      class="lightbox-close"
      aria-label="Close enlarged photo"
    >×</button>

    <img class="lightbox-image" src="" alt="">
  `;

  document.body.appendChild(photoLightbox);

  lightboxImage = photoLightbox.querySelector(".lightbox-image");

  const closeButton = photoLightbox.querySelector(".lightbox-close");

  const style = document.createElement("style");

  style.id = "photoLightboxStyles";

  style.textContent = `
    #photoLightbox {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 60px 24px 24px;
      background: rgba(0, 0, 0, 0.94);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.25s ease, visibility 0.25s ease;
      cursor: zoom-out;
    }

    #photoLightbox.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    #photoLightbox .lightbox-image {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 4px;
      cursor: default;
      user-select: none;
      -webkit-user-drag: none;
    }

    #photoLightbox .lightbox-close {
      position: absolute;
      top: 12px;
      right: 22px;
      z-index: 2;
      width: 46px;
      height: 46px;
      padding: 0;
      border: none;
      background: transparent;
      color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: 40px;
      font-weight: 300;
      line-height: 1;
      cursor: pointer;
    }

    #photoLightbox .lightbox-close:hover {
      color: #ff2aa6;
    }

    .camera-card-image img,
    #modalCameraImage {
      cursor: zoom-in;
    }

    @media (max-width: 600px) {
      #photoLightbox {
        padding: 58px 10px 16px;
      }

      #photoLightbox .lightbox-close {
        top: 8px;
        right: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #photoLightbox {
        transition: none;
      }
    }
  `;

  if (!$("photoLightboxStyles")) {
    document.head.appendChild(style);
  }

  cameraGrid?.addEventListener("click", (event) => {
    const image = event.target.closest(".camera-card-image img");

    if (!image || !cameraGrid.contains(image)) return;

    event.preventDefault();
    event.stopPropagation();

    openPhotoLightbox(image.src, image.alt);
  });

  modalCameraImage?.addEventListener("click", () => {
    if (!modalCameraImage.src) return;

    openPhotoLightbox(
      modalCameraImage.src,
      modalCameraImage.alt || "Camera sample photo",
    );
  });

  closeButton.addEventListener("click", closePhotoLightbox);

  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) {
      closePhotoLightbox();
    }
  });

  lightboxImage.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        photoLightbox?.classList.contains("active")
      ) {
        event.stopPropagation();
        closePhotoLightbox();
      }
    },
    true,
  );
}

function openPhotoLightbox(src, alt = "Camera sample photo") {
  if (!photoLightbox || !lightboxImage || !src) return;

  previousBodyOverflow = document.body.style.overflow;

  lightboxImage.src = src;
  lightboxImage.alt = alt;

  photoLightbox.classList.add("active");
  photoLightbox.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";

  photoLightbox.querySelector(".lightbox-close")?.focus();
}

function closePhotoLightbox() {
  if (!photoLightbox) return;

  photoLightbox.classList.remove("active");
  photoLightbox.setAttribute("aria-hidden", "true");

  if (lightboxImage) {
    lightboxImage.src = "";
    lightboxImage.alt = "";
  }

  document.body.style.overflow = previousBodyOverflow;
}

/* =========================================================
   CLOSE CAMERA MODAL
   ========================================================= */

function closeCameraModal() {
  if (!cameraModal) return;

  cameraModal.classList.remove("active");
  cameraModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

modalClose?.addEventListener("click", closeCameraModal);
modalOverlay?.addEventListener("click", closeCameraModal);

document.addEventListener("keydown", (event) => {
  if (photoLightbox?.classList.contains("active")) return;

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

/* =========================================================
   BOOK THIS CAMERA
   ========================================================= */

modalBookButton?.addEventListener("click", () => {
  const cameraId = modalBookButton.dataset.cameraId;

  if (!cameraId || !cameraSelect) return;

  const selectedMode = modalRentalDuration?.value || RENTAL_MODE.DAILY;

  cameraSelect.value = cameraId;
  selectedCameraId = cameraId;

  setupRentalDurationOptions();

  if (rentalDuration) {
    rentalDuration.value = selectedMode;
  }

  updateDurationFieldState(rentalDuration);
  syncReturnDateTime();
  updateBookingSummary();

  closeCameraModal();

  $("booking")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

/* =========================================================
   DATE AND TIME HELPERS
   ========================================================= */

function getTodayString() {
  const today = new Date();

  return toLocalDateString(today);
}

function setMinimumDates() {
  const today = getTodayString();

  if (startDate) {
    startDate.min = today;
  }

  if (endDate) {
    endDate.min = startDate?.value || today;
  }
}

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toLocalTimeString(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getPickupDateTime() {
  if (!startDate?.value || !startTime?.value) return null;

  const date = new Date(`${startDate.value}T${startTime.value}:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getReturnDateTime() {
  if (!endDate?.value || !endTime?.value) return null;

  const date = new Date(`${endDate.value}T${endTime.value}:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date;
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

/* =========================================================
   AUTOMATIC RETURN DATE AND TIME
   ========================================================= */

function syncReturnDateTime() {
  const pickup = getPickupDateTime();

  if (!pickup) {
    updateBookingSummary();
    return;
  }

  const mode = getSelectedRentalMode();

  // 6-hour and 12-hour rentals:
  // return is automatically calculated.
  if (mode === RENTAL_MODE.SIX_HOURS || mode === RENTAL_MODE.TWELVE_HOURS) {
    const hours = Number(mode);

    const returned = new Date(pickup.getTime() + hours * 60 * 60 * 1000);

    if (endDate) {
      endDate.value = toLocalDateString(returned);
      endDate.min = startDate?.value || getTodayString();
    }

    if (endTime) {
      endTime.value = toLocalTimeString(returned);
    }

    updateBookingSummary();
    return;
  }

  // Daily rental:
  // customer selects return date and time manually.
  // Do not overwrite their selection.
  if (mode === RENTAL_MODE.DAILY) {
    if (endDate) {
      endDate.min = startDate?.value || getTodayString();

      // If return date is before pickup date,
      // clear the invalid date.
      if (
        endDate.value &&
        startDate?.value &&
        endDate.value < startDate.value
      ) {
        endDate.value = "";
      }
    }

    updateBookingSummary();
  }
}

/* =========================================================
   DURATION SYNCHRONIZATION
   ========================================================= */

function setupDurationSynchronization() {
  rentalDuration?.addEventListener("change", () => {
    updateDurationFieldState(rentalDuration);
    syncReturnDateTime();
    updateBookingSummary();
  });

  modalRentalDuration?.addEventListener("change", () => {
    updateDurationFieldState(modalRentalDuration);
  });
}

/* =========================================================
   BOOKING LISTENERS
   ========================================================= */

function setupBookingListeners() {
  [startDate, startTime].forEach((input) => {
    input?.addEventListener("change", () => {
      syncReturnDateTime();
      updateBookingSummary();
    });

    input?.addEventListener("input", () => {
      syncReturnDateTime();
      updateBookingSummary();
    });
  });

  [endDate, endTime].forEach((input) => {
    input?.addEventListener("change", updateBookingSummary);
    input?.addEventListener("input", updateBookingSummary);
  });

  cameraQuantity?.addEventListener("change", updateBookingSummary);

  cameraQuantity?.addEventListener("input", updateBookingSummary);

  setMinimumDates();
}

/* =========================================================
   INTERNATIONAL PHONE INPUTS
   ========================================================= */

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

/* =========================================================
   BOOKING SUMMARY
   ========================================================= */

function updateBookingSummary() {
  if (summaryCamera && cameraSelect) {
    const camera = cameras.find((item) => item.id === cameraSelect.value);

    summaryCamera.textContent = camera ? camera.name : "-";
  }

  if (summaryDuration) {
    const mode = getSelectedRentalMode();

    if (mode === RENTAL_MODE.SIX_HOURS) {
      summaryDuration.textContent = "6 Hours";
    } else if (mode === RENTAL_MODE.TWELVE_HOURS) {
      summaryDuration.textContent = "12 Hours";
    } else {
      const hours = getRentalDurationDifference();
      const days = getChargeableDays(hours);

      if (!hours || !days) {
        summaryDuration.textContent = "Daily Rental — select return time";
      } else {
        summaryDuration.textContent = `${formatDuration(hours)} (${hours.toFixed(2)} hours actual)`;
      }
    }
  }

  if (summaryQuantity) {
    const quantity = Math.max(1, Number(cameraQuantity?.value) || 1);

    summaryQuantity.textContent = `${quantity} ${quantity === 1 ? "unit" : "units"}`;
  }
}

/* =========================================================
   ACTUAL RENTAL DURATION CALCULATION
   ========================================================= */

function getRentalDurationDifference() {
  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();

  if (!pickup || !returned || returned <= pickup) {
    return null;
  }

  return (returned.getTime() - pickup.getTime()) / (60 * 60 * 1000);
}

/* =========================================================
   FORM VALIDATION
   ========================================================= */

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
    ["fullName", "Full name is required."],
    ["occupation", "Occupation is required."],
    ["workplace", "Workplace is required."],
    ["whatsapp", "WhatsApp number is required."],
    ["emergencyContact", "Emergency contact is required."],
    ["instagram", "Instagram username is required."],
    ["cameraSelect", "Please select a camera."],
    ["rentalDuration", "Please select a rental duration."],
    ["startDate", "Pickup date is required."],
    ["startTime", "Pickup time is required."],
    ["endDate", "Return date is required."],
    ["endTime", "Return time is required."],
    ["pickupLocation", "Pickup location is required."],
    ["returnLocation", "Return location is required."],
  ];

  requiredFields.forEach(([id, message]) => {
    const input = $(id);

    if (!input || !String(input.value || "").trim()) {
      showFieldError(input, message);
      isValid = false;
    }
  });

  /* CAMERA VALIDATION */

  const selectedCamera = cameras.find(
    (item) => item.id === cameraSelect?.value,
  );

  if (!selectedCamera) {
    showFieldError(cameraSelect, "Please select a valid camera.");
    isValid = false;
  }

  /* PICKUP VALIDATION */

  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();

  if (!pickup) {
    showFieldError(
      startDate || startTime,
      "Please enter a valid pickup date and time.",
    );

    isValid = false;
  } else if (pickup.getTime() < Date.now()) {
    showFieldError(
      startTime || startDate,
      "Pickup time cannot be in the past.",
    );

    isValid = false;
  }

  /* RETURN VALIDATION */

  if (!returned) {
    showFieldError(
      endDate || endTime,
      "Please enter a valid return date and time.",
    );

    isValid = false;
  }

  if (pickup && returned) {
    if (returned <= pickup) {
      showFieldError(
        endTime || endDate,
        "Return time must be after pickup time.",
      );

      isValid = false;
    }

    // Fixed-duration rentals must match exactly.
    const mode = getSelectedRentalMode();

    if (mode === RENTAL_MODE.SIX_HOURS || mode === RENTAL_MODE.TWELVE_HOURS) {
      const expectedHours = Number(mode);

      const actualHours =
        (returned.getTime() - pickup.getTime()) / (60 * 60 * 1000);

      if (Math.abs(actualHours - expectedHours) > 0.001) {
        showFieldError(
          endTime || endDate,
          "Return time does not match the selected duration.",
        );

        isValid = false;
      }
    }

    // Daily rental is charged in 24-hour blocks.
    if (mode === RENTAL_MODE.DAILY && returned > pickup) {
      const actualHours =
        (returned.getTime() - pickup.getTime()) / (60 * 60 * 1000);

      const days = getChargeableDays(actualHours);

      if (!days || days < 1) {
        showFieldError(
          endTime || endDate,
          "Please choose a valid daily rental period.",
        );

        isValid = false;
      }
    }
  }

  /* PHONE VALIDATION */

  ["whatsapp", "emergencyContact"].forEach((id) => {
    const input = $(id);

    if (input?.value.trim() && !isValidPhoneNumber(id)) {
      showFieldError(input, "Please enter a valid phone number.");
      isValid = false;
    }
  });

  /* QUANTITY VALIDATION */

  if (cameraQuantity) {
    const quantity = Number(cameraQuantity.value);

    if (!Number.isInteger(quantity) || quantity < 1) {
      showFieldError(cameraQuantity, "Number of units must be at least 1.");

      isValid = false;
    }
  }

  /* REQUIRED ID / PASSPORT */

  const ktpCheck = $("ktpCheck");

  if (ktpCheck && !ktpCheck.checked) {
    showFieldError(ktpCheck, "A valid ID card or passport is required.");

    isValid = false;
  }

  /* AGREEMENT */

  if (!agreement?.checked) {
    if (agreementError) {
      agreementError.textContent = "You must agree to the booking terms.";
    }

    isValid = false;
  }

  return isValid;
}

/* =========================================================
   BOOKING FORM SUBMIT
   ========================================================= */

if (bookingForm) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    syncReturnDateTime();

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

/* =========================================================
   WHATSAPP MESSAGE
   ========================================================= */

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

  const mode = getSelectedRentalMode();

  const actualHours = getRentalDurationDifference();

  let rentalDurationText = "-";
  let chargeableDaysText = "-";

  if (mode === RENTAL_MODE.SIX_HOURS) {
    rentalDurationText = "6 Hours";
  } else if (mode === RENTAL_MODE.TWELVE_HOURS) {
    rentalDurationText = "12 Hours";
  } else if (actualHours && actualHours > 0) {
    const days = getChargeableDays(actualHours);

    rentalDurationText = `${days} ${days === 1 ? "Day" : "Days"}`;

    chargeableDaysText = `${days} ${days === 1 ? "day" : "days"}`;
  }

  const ktpCheck = $("ktpCheck")?.checked;
  const hotelCheck = $("hotelCheck")?.checked;
  const flightCheck = $("flightCheck")?.checked;

  const documentStatus = `
ID Card / Passport: ${
    ktpCheck
      ? "Required — to be presented or sent via WhatsApp"
      : "Not prepared"
  }
Hotel Booking Confirmation: ${hotelCheck ? "Will be provided" : "Not specified"}
Flight Details: ${flightCheck ? "Will be provided" : "Not specified"}
  `.trim();

  const message = `
Hello Enmax House, I would like to submit a camera booking request.

RENTAL DETAILS
Camera: ${camera ? camera.name : "-"}
Starting Price: ${camera ? camera.price : "-"}
Number of Units: ${quantity}
Rental Type: ${mode === RENTAL_MODE.DAILY ? "Daily Rental" : rentalDurationText}
Rental Duration: ${rentalDurationText}
Actual Rental Time: ${
    actualHours && actualHours > 0 ? `${actualHours.toFixed(2)} hours` : "-"
  }
Chargeable Days: ${mode === RENTAL_MODE.DAILY ? chargeableDaysText : "-"}
Pickup: ${formatDateTimeIndonesia(pickup)}
Return: ${formatDateTimeIndonesia(returned)}
Pickup Location: ${pickupLocation}
Return Location: ${returnLocation}

RENTER INFORMATION
Full Name: ${fullName}
Occupation: ${occupation}
Workplace: ${workplace}
WhatsApp: ${whatsapp}
Emergency Contact: ${emergencyContact}
Instagram: ${instagram || "-"}

SUPPORTING DOCUMENTS
${documentStatus}

ADDITIONAL NOTES
${comments || "-"}

I understand that this is a booking request, not a confirmed reservation. I will wait for Enmax House to review and confirm my booking.
  `.trim();

  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  const newWindow = window.open(whatsappURL, "_blank", "noopener,noreferrer");

  if (!newWindow) {
    window.location.href = whatsappURL;
  }
}

/* =========================================================
   NAVBAR
   ========================================================= */

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

/* =========================================================
   CUSTOMER COMMENTS — SUPABASE
   ========================================================= */

async function loadComments() {
  if (!commentsList) return;

  commentsList.innerHTML = `
    <div class="empty-comments">
      <p>Loading comments...</p>
    </div>
  `;

  try {
    const { data, error } = await supabaseClient
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

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
  } catch (error) {
    console.error("Supabase error:", error);

    commentsList.innerHTML = `
      <div class="empty-comments">
        <p>Unable to load comments.</p>
      </div>
    `;
  }
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

/* =========================================================
   COMMENT FORM
   ========================================================= */

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

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   FOOTER YEAR
   ========================================================= */

function updateCurrentYear() {
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }
}
