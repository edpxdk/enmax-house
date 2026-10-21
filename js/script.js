/* =========================================================
   ENMAX HOUSE — CAMERA RENTAL WEBSITE
   ========================================================= */

/* SUPABASE CONFIGURATION */

const SUPABASE_URL = "https://egfuemmimojqzdqjsofg.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWiZEW8hb8rI91I4cu3Law_H9NCykz6";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const WHATSAPP_NUMBER = "6282145929947";

/* CAMERA DATA — LOCAL METADATA / FALLBACK */

let cameras = [
  {
    id: "camera-01",
    name: "Canon G7X Mark II",
    category: "Effortless Aesthetic Short",
    description:
      "Compact camera with excellent image quality, perfect for travel, daily content, and casual photography.",
    price: "Rp 200.000",
    dailyPrice: 200000,
    durations: ["daily"],
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
    price: "Rp 100.000",
    dailyPrice: 180000,
    rentalRates: { 6: 100000, 12: 150000, 24: 180000 },
    durations: [6, 12, 24, "daily"],
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
    price: "Rp 100.000",
    dailyPrice: 180000,
    rentalRates: { 6: 100000, 12: 150000, 24: 180000 },
    durations: [6, 12, 24, "daily"],
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
    dailyPrice: 125000,
    durations: ["daily"],
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
    dailyPrice: 180000,
    durations: ["daily"],
    image: "assets/cameras/camera-05.jpg",
    gallery: [
      "assets/cameras/camera-05.jpg",
      "assets/cameras/camera-05-1.jpg",
      "assets/cameras/camera-05-2.jpg",
      "assets/cameras/camera-05-3.jpg",
    ],
  },
];

/* DOM HELPERS AND ELEMENTS */

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

let selectedCameraId = null;
let currentGalleryIndex = 0;
const phoneInputs = {};
let photoLightbox = null;
let lightboxImage = null;
let previousBodyOverflow = "";
let availabilityTimer = null;
let availabilityRequestId = 0;

/* RENTAL MODES */

const RENTAL_MODE = {
  SIX_HOURS: "6",
  TWELVE_HOURS: "12",
  DAILY: "daily",
};

/* INITIALIZATION */

document.addEventListener("DOMContentLoaded", async () => {
  await loadCamerasFromSupabase();

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
  setupAvailabilityChecker();
  setupAvailabilityCalendar();
  updateBookingSummary();
  loadComments();
  updateCurrentYear();
});

/* =========================================================
   PRICE HELPERS
   ========================================================= */

function isFlexiblePriceCamera(camera) {
  return Boolean(camera?.rentalRates);
}

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u00a0/g, " ");
}

function getCameraDailyPrice(camera) {
  return Number(camera?.dailyPrice) || 0;
}

function getSelectedCamera() {
  return cameras.find(
    (camera) => camera.id === (cameraSelect?.value || selectedCameraId),
  );
}

function getPriceForRental(camera, mode, actualHours = null) {
  if (!camera) return { amount: 0, description: "-", days: 0 };

  if (isFlexiblePriceCamera(camera)) {
    if (mode === RENTAL_MODE.SIX_HOURS) {
      return {
        amount: Number(camera.rentalRates[6]) || 0,
        description: "6 Hours",
        days: 0,
      };
    }

    if (mode === RENTAL_MODE.TWELVE_HOURS) {
      return {
        amount: Number(camera.rentalRates[12]) || 0,
        description: "12 Hours",
        days: 0,
      };
    }
  }

  if (mode === RENTAL_MODE.DAILY) {
    const days = getChargeableDays(actualHours);
    if (!days) return { amount: 0, description: "Daily Rental", days: 0 };

    return {
      amount: days * getCameraDailyPrice(camera),
      description: `${days} ${days === 1 ? "Day" : "Days"}`,
      days,
    };
  }

  return {
    amount: getCameraDailyPrice(camera),
    description: "Daily Rental",
    days: 1,
  };
}

function getCameraStartingPrice(camera) {
  if (!camera) return "-";
  if (isFlexiblePriceCamera(camera)) return formatRupiah(camera.rentalRates[6]);
  return formatRupiah(getCameraDailyPrice(camera));
}

function getCameraPriceLabel(camera) {
  return isFlexiblePriceCamera(camera) ? "Starting from" : "Per day";
}

/* =========================================================
   LOAD CAMERA CATALOG FROM SUPABASE
   ========================================================= */

async function loadCamerasFromSupabase() {
  const localCameras = cameras.map((camera) => ({
    ...camera,
    gallery: [...(camera.gallery || [])],
    rentalRates: camera.rentalRates ? { ...camera.rentalRates } : undefined,
  }));

  try {
    const { data, error } = await supabaseClient
      .from("cameras")
      .select("id, name, quantity, daily_price, active")
      .eq("active", true)
      .order("id", { ascending: true });

    if (error) throw error;

    if (!data?.length) {
      cameras = localCameras;
      console.warn("No active cameras found in Supabase. Using local catalog.");
      return;
    }

    cameras = data.map((row) => {
      const existing = localCameras.find(
        (camera) =>
          camera.name.trim().toLowerCase() ===
          String(row.name || "")
            .trim()
            .toLowerCase(),
      );

      const dailyPrice = Number(row.daily_price) || 0;

      return {
        ...(existing || {}),
        id: String(row.id),
        name: row.name,
        quantity: Number(row.quantity) || 0,
        dailyPrice,
        price: formatRupiah(dailyPrice),
        active: row.active,
        category: existing?.category || "Camera Rental",
        description:
          existing?.description || "Contact Enmax House for camera details.",
        image: existing?.image || "",
        gallery: existing?.gallery?.length
          ? [...existing.gallery]
          : existing?.image
            ? [existing.image]
            : [],
        durations: existing?.durations || ["daily"],
        rentalRates: existing?.rentalRates
          ? { ...existing.rentalRates }
          : undefined,
      };
    });

    console.log("Camera catalog loaded:", cameras);
  } catch (error) {
    console.error("Failed to load camera catalog:", error);
    cameras = localCameras;
  }
}

/* =========================================================
   CAMERA CARDS
   ========================================================= */

function renderCameraCards() {
  if (!cameraGrid) return;
  cameraGrid.innerHTML = "";

  if (!cameras.length) {
    cameraGrid.innerHTML = `<div class="empty-comments"><p>No cameras are currently available.</p></div>`;
    return;
  }

  cameras.forEach((camera) => {
    const card = document.createElement("article");
    card.className = "camera-card";

    card.innerHTML = `
      <div class="camera-card-image">
        <img src="${escapeHTML(camera.image || "")}"
          alt="${escapeHTML(camera.name)}" loading="lazy">
      </div>
      <div class="camera-card-content">
        <span class="camera-category">${escapeHTML(camera.category)}</span>
        <h3>${escapeHTML(camera.name)}</h3>
        <p>${escapeHTML(camera.description)}</p>
        <div class="camera-card-footer">
          <div class="camera-price-block">
            <span class="camera-price-label">${escapeHTML(getCameraPriceLabel(camera))}</span>
            <strong class="camera-price">${escapeHTML(getCameraStartingPrice(camera))}</strong>
          </div>
          <button type="button" class="camera-view-button"
            data-camera-id="${escapeHTML(camera.id)}">View Camera →</button>
        </div>
      </div>
    `;

    cameraGrid.appendChild(card);
  });

  cameraGrid.querySelectorAll(".camera-view-button").forEach((button) => {
    button.addEventListener("click", () =>
      openCameraModal(button.dataset.cameraId),
    );
  });
}

/* =========================================================
   CAMERA SELECT
   ========================================================= */

function populateCameraSelect() {
  if (!cameraSelect) return;

  cameraSelect.innerHTML = `<option value="">Select a camera</option>`;

  cameras.forEach((camera) => {
    const option = document.createElement("option");
    option.value = camera.id;
    option.textContent = isFlexiblePriceCamera(camera)
      ? `${camera.name} — Starting from ${getCameraStartingPrice(camera)}`
      : `${camera.name} — ${getCameraStartingPrice(camera)} per day`;
    cameraSelect.appendChild(option);
  });

  cameraSelect.addEventListener("change", () => {
    selectedCameraId = cameraSelect.value || null;
    setupRentalDurationOptions();
    syncReturnDateTime();
    updateBookingSummary();
    syncCalendarCameraFromBooking();
    scheduleAvailabilityCheck();
  });
}

/* =========================================================
   RENTAL DURATION
   ========================================================= */

function setupRentalDurationOptions() {
  setupOneDurationSelect(rentalDuration);
  setupOneDurationSelect(modalRentalDuration);
}

function setupOneDurationSelect(select) {
  if (!select) return;

  const previousValue = select.value;
  const camera = getSelectedCamera();

  if (isFlexiblePriceCamera(camera)) {
    select.innerHTML = `
      <option value="6">6 Hours — ${formatRupiah(camera.rentalRates[6])}</option>
      <option value="12">12 Hours — ${formatRupiah(camera.rentalRates[12])}</option>
      <option value="daily">Daily Rental — ${formatRupiah(camera.dailyPrice)} / day</option>
    `;

    select.value = ["6", "12", "daily"].includes(previousValue)
      ? previousValue
      : "daily";
  } else {
    select.innerHTML = `
      <option value="daily">Daily Rental — ${
        camera ? formatRupiah(camera.dailyPrice) + " / day" : "Select a camera"
      }</option>
    `;
    select.value = "daily";
  }

  updateDurationFieldState(select);
}

function updateDurationFieldState(select) {
  if (!select) return;
  const isDaily = select.value === RENTAL_MODE.DAILY;

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

function getSelectedRentalMode() {
  return rentalDuration?.value || RENTAL_MODE.DAILY;
}

function getSelectedDurationHours() {
  const mode = getSelectedRentalMode();
  if (mode === RENTAL_MODE.SIX_HOURS) return 6;
  if (mode === RENTAL_MODE.TWELVE_HOURS) return 12;
  if (mode === RENTAL_MODE.DAILY) return getRentalDurationDifference();
  return null;
}

function formatDuration(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return "-";
  if (hours === 6) return "6 Hours";
  if (hours === 12) return "12 Hours";
  const days = Math.ceil(hours / 24);
  return `${days} ${days === 1 ? "Day" : "Days"}`;
}

function getChargeableDays(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return null;
  return Math.ceil(hours / 24);
}

/* =========================================================
   CAMERA MODAL AND GALLERY
   ========================================================= */

function openCameraModal(cameraId) {
  const camera = cameras.find((item) => item.id === String(cameraId));
  if (!camera || !cameraModal) return;

  selectedCameraId = camera.id;
  if (cameraSelect) {
    cameraSelect.value = camera.id;
    cameraSelect.dispatchEvent(new Event("change"));
  }

  currentGalleryIndex = 0;
  if (modalCameraCategory) modalCameraCategory.textContent = camera.category;
  if (modalCameraName) modalCameraName.textContent = camera.name;
  if (modalCameraDescription)
    modalCameraDescription.textContent = camera.description;

  if (modalCameraPrice) {
    modalCameraPrice.textContent = isFlexiblePriceCamera(camera)
      ? `Starting from ${getCameraStartingPrice(camera)}`
      : `${getCameraStartingPrice(camera)} per day`;
  }

  if (modalBookButton) modalBookButton.dataset.cameraId = camera.id;

  setupOneDurationSelect(modalRentalDuration);
  if (rentalDuration && modalRentalDuration)
    modalRentalDuration.value = rentalDuration.value;

  updateDurationFieldState(modalRentalDuration);
  updateGalleryImage();
  cameraModal.classList.add("active");
  cameraModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  window.setTimeout(() => modalClose?.focus(), 100);
}

function getCurrentGallery() {
  const camera = cameras.find((item) => item.id === selectedCameraId);
  if (!camera) return [];
  return Array.isArray(camera.gallery) && camera.gallery.length
    ? camera.gallery
    : camera.image
      ? [camera.image]
      : [];
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
  if (galleryCounter)
    galleryCounter.textContent = `${currentGalleryIndex + 1} / ${gallery.length}`;

  const multiple = gallery.length > 1;
  if (galleryPrev) galleryPrev.style.display = multiple ? "flex" : "none";
  if (galleryNext) galleryNext.style.display = multiple ? "flex" : "none";
}

function moveGallery(direction) {
  if (!getCurrentGallery().length) return;
  currentGalleryIndex += direction;
  updateGalleryImage();
}

function setupGalleryControls() {
  galleryPrev?.addEventListener("click", () => moveGallery(-1));
  galleryNext?.addEventListener("click", () => moveGallery(1));
}

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

modalBookButton?.addEventListener("click", () => {
  const cameraId = modalBookButton.dataset.cameraId;
  if (!cameraId || !cameraSelect) return;

  const selectedMode = modalRentalDuration?.value || RENTAL_MODE.DAILY;
  cameraSelect.value = cameraId;
  selectedCameraId = cameraId;
  setupRentalDurationOptions();

  const camera = cameras.find((item) => item.id === cameraId);
  rentalDuration.value =
    isFlexiblePriceCamera(camera) && ["6", "12"].includes(selectedMode)
      ? selectedMode
      : RENTAL_MODE.DAILY;

  updateDurationFieldState(rentalDuration);
  syncReturnDateTime();
  updateBookingSummary();
  scheduleAvailabilityCheck();
  closeCameraModal();

  $("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

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
    <button type="button" class="lightbox-close" aria-label="Close enlarged photo">×</button>
    <img class="lightbox-image" src="" alt="">
  `;
  document.body.appendChild(photoLightbox);
  lightboxImage = photoLightbox.querySelector(".lightbox-image");

  const style = document.createElement("style");
  style.id = "photoLightboxStyles";
  style.textContent = `
    #photoLightbox{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;
    justify-content:center;box-sizing:border-box;padding:60px 24px 24px;background:rgba(0,0,0,.94);
    opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s ease,visibility .25s ease;cursor:zoom-out}
    #photoLightbox.active{opacity:1;visibility:visible;pointer-events:auto}
    #photoLightbox .lightbox-image{display:block;width:auto;height:auto;max-width:100%;max-height:100%;
    object-fit:contain;border-radius:4px;cursor:default;user-select:none;-webkit-user-drag:none}
    #photoLightbox .lightbox-close{position:absolute;top:12px;right:22px;z-index:2;width:46px;height:46px;
    padding:0;border:0;background:transparent;color:#fff;font:300 40px/1 Arial,sans-serif;cursor:pointer}
    #photoLightbox .lightbox-close:hover{color:#ff2aa6}
    .camera-card-image img,#modalCameraImage{cursor:zoom-in}
    @media(max-width:600px){#photoLightbox{padding:58px 10px 16px}#photoLightbox .lightbox-close{top:8px;right:12px}}
    @media(prefers-reduced-motion:reduce){#photoLightbox{transition:none}}
  `;
  if (!$("photoLightboxStyles")) document.head.appendChild(style);

  cameraGrid?.addEventListener("click", (event) => {
    const image = event.target.closest(".camera-card-image img");
    if (!image || !cameraGrid.contains(image)) return;
    event.preventDefault();
    event.stopPropagation();
    openPhotoLightbox(image.src, image.alt);
  });

  modalCameraImage?.addEventListener("click", () => {
    if (modalCameraImage.src)
      openPhotoLightbox(
        modalCameraImage.src,
        modalCameraImage.alt || "Camera sample photo",
      );
  });

  photoLightbox
    .querySelector(".lightbox-close")
    ?.addEventListener("click", closePhotoLightbox);
  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) closePhotoLightbox();
  });
  lightboxImage.addEventListener("click", (event) => event.stopPropagation());

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
   DATE AND TIME HELPERS
   ========================================================= */

function getTodayString() {
  return toLocalDateString(new Date());
}

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalTimeString(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function setMinimumDates() {
  const today = getTodayString();
  if (startDate) startDate.min = today;
  if (endDate) endDate.min = startDate?.value || today;
}

function getPickupDateTime() {
  if (!startDate?.value || !startTime?.value) return null;
  const date = new Date(`${startDate.value}T${startTime.value}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getReturnDateTime() {
  if (!endDate?.value || !endTime?.value) return null;
  const date = new Date(`${endDate.value}T${endTime.value}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTimeIndonesia(date) {
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* =========================================================
   AUTOMATIC RETURN DATE/TIME
   ========================================================= */

function syncReturnDateTime() {
  const pickup = getPickupDateTime();
  if (!pickup) {
    updateBookingSummary();
    return;
  }

  const mode = getSelectedRentalMode();
  const camera = getSelectedCamera();

  if (
    isFlexiblePriceCamera(camera) &&
    [RENTAL_MODE.SIX_HOURS, RENTAL_MODE.TWELVE_HOURS].includes(mode)
  ) {
    const returned = new Date(pickup.getTime() + Number(mode) * 60 * 60 * 1000);
    if (endDate) {
      endDate.value = toLocalDateString(returned);
      endDate.min = startDate?.value || getTodayString();
    }
    if (endTime) endTime.value = toLocalTimeString(returned);
    updateBookingSummary();
    scheduleAvailabilityCheck();
    return;
  }

  if (mode === RENTAL_MODE.DAILY) {
    if (endDate) {
      endDate.min = startDate?.value || getTodayString();
      if (
        endDate.value &&
        startDate?.value &&
        endDate.value < startDate.value
      ) {
        endDate.value = "";
      }
    }
    updateBookingSummary();
    scheduleAvailabilityCheck();
  }
}

function setupDurationSynchronization() {
  rentalDuration?.addEventListener("change", () => {
    updateDurationFieldState(rentalDuration);
    syncReturnDateTime();
    updateBookingSummary();
    scheduleAvailabilityCheck();
  });

  modalRentalDuration?.addEventListener("change", () => {
    updateDurationFieldState(modalRentalDuration);
  });
}

function setupBookingListeners() {
  [startDate, startTime].forEach((input) => {
    input?.addEventListener("change", () => {
      syncReturnDateTime();
      updateBookingSummary();
      scheduleAvailabilityCheck();
    });
    input?.addEventListener("input", () => {
      syncReturnDateTime();
      updateBookingSummary();
      scheduleAvailabilityCheck();
    });
  });

  [endDate, endTime].forEach((input) => {
    input?.addEventListener("change", () => {
      updateBookingSummary();
      scheduleAvailabilityCheck();
    });
    input?.addEventListener("input", () => {
      updateBookingSummary();
      scheduleAvailabilityCheck();
    });
  });

  cameraQuantity?.addEventListener("change", () => {
    updateBookingSummary();
    scheduleAvailabilityCheck();
  });
  cameraQuantity?.addEventListener("input", () => {
    updateBookingSummary();
    scheduleAvailabilityCheck();
  });

  setMinimumDates();
}

/* =========================================================
   NEW: AVAILABILITY CALENDAR
   ========================================================= */

const calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  cameraId: "",
  bookings: [],
  selectedDate: "",
  loading: false,
  requestId: 0,
};

function setupAvailabilityCalendar() {
  const calendarSelect = $("calendarCameraSelect");
  const calendarContainer = $("availabilityCalendar");
  const openButton = $("openAvailabilityCalendar");

  if (!calendarSelect || !calendarContainer) return;

  calendarSelect.innerHTML = `<option value="">Select a camera</option>`;

  cameras.forEach((camera) => {
    const option = document.createElement("option");
    option.value = camera.id;
    option.textContent = camera.name;
    calendarSelect.appendChild(option);
  });

  calendarSelect.addEventListener("change", () => {
    calendarState.cameraId = calendarSelect.value;
    if (cameraSelect && cameraSelect.value !== calendarSelect.value) {
      cameraSelect.value = calendarSelect.value;
      selectedCameraId = calendarSelect.value || null;
      setupRentalDurationOptions();
      syncReturnDateTime();
      updateBookingSummary();
    }
    loadCalendarBookings();
  });

  cameraSelect?.addEventListener("change", () => {
    syncCalendarCameraFromBooking();
  });

  openButton?.addEventListener("click", () => {
    syncCalendarCameraFromBooking();
    $("availabilityCalendarSection")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  calendarState.cameraId = cameraSelect?.value || "";
  calendarSelect.value = calendarState.cameraId;

  renderAvailabilityCalendar();

  if (calendarState.cameraId) {
    loadCalendarBookings();
  } else {
    showCalendarMessage("Select a camera to view its schedule.");
  }
}

function syncCalendarCameraFromBooking() {
  const calendarSelect = $("calendarCameraSelect");
  if (!calendarSelect || !cameraSelect) return;

  if (calendarSelect.value !== cameraSelect.value) {
    calendarSelect.value = cameraSelect.value;
  }

  calendarState.cameraId = cameraSelect.value || "";

  if (calendarState.cameraId) {
    loadCalendarBookings();
  } else {
    calendarState.bookings = [];
    renderAvailabilityCalendar();
    showCalendarMessage("Select a camera to view its schedule.");
  }
}

function showCalendarMessage(message, isError = false) {
  const note = $("availabilityCalendarNote");
  if (!note) return;
  note.textContent = message;
  note.style.color = isError ? "#ff7777" : "";
}

function getCalendarMonthStart() {
  return `${calendarState.year}-${String(calendarState.month + 1).padStart(2, "0")}-01`;
}

function getCalendarMonthEnd() {
  const nextMonth = new Date(calendarState.year, calendarState.month + 1, 1);
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
}

async function loadCalendarBookings() {
  const cameraId = calendarState.cameraId;
  if (
    !cameraId ||
    !Number.isSafeInteger(Number(cameraId)) ||
    Number(cameraId) <= 0
  ) {
    calendarState.bookings = [];
    renderAvailabilityCalendar();
    showCalendarMessage("Select a camera to view its schedule.");
    return;
  }

  const requestId = ++calendarState.requestId;
  calendarState.loading = true;
  renderAvailabilityCalendar();
  showCalendarMessage("Loading camera schedule...");

  try {
    const { data, error } = await supabaseClient.rpc(
      "get_public_camera_bookings",
      {
        p_camera_id: Number(cameraId),
        p_month_start: getCalendarMonthStart(),
        p_month_end: getCalendarMonthEnd(),
      },
    );

    if (error) throw error;
    if (requestId !== calendarState.requestId) return;

    calendarState.bookings = Array.isArray(data) ? data : [];
    calendarState.loading = false;
    renderAvailabilityCalendar();

    const camera = cameras.find((item) => item.id === cameraId);
    showCalendarMessage(
      `${camera?.name || "Selected camera"} schedule loaded. Dates marked “Booked” have at least one pending or confirmed booking. Remaining stock depends on the exact rental times and quantity.`,
    );
  } catch (error) {
    console.error("Failed to load calendar bookings:", error);
    if (requestId !== calendarState.requestId) return;

    calendarState.bookings = [];
    calendarState.loading = false;
    renderAvailabilityCalendar();
    showCalendarMessage(
      "Unable to load the calendar schedule. Check that the Supabase RPC get_public_camera_bookings exists and is accessible.",
      true,
    );
  }
}

function calendarDateHasBooking(year, month, day) {
  const dayStart = new Date(year, month, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month, day + 1, 0, 0, 0, 0);

  return calendarState.bookings.some((booking) => {
    const pickup = new Date(booking.pickup_at);
    const returned = new Date(booking.return_at);
    return pickup < dayEnd && returned > dayStart;
  });
}

function renderAvailabilityCalendar() {
  const container = $("availabilityCalendar");
  if (!container) return;

  const monthName = new Date(
    calendarState.year,
    calendarState.month,
    1,
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstWeekday = new Date(
    calendarState.year,
    calendarState.month,
    1,
  ).getDay();
  const daysInMonth = new Date(
    calendarState.year,
    calendarState.month + 1,
    0,
  ).getDate();
  const today = getTodayString();

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let html = `
    <div class="availability-calendar-toolbar">
      <button type="button" id="calendarPreviousMonth" aria-label="Previous month">←</button>
      <strong>${escapeHTML(monthName)}</strong>
      <button type="button" id="calendarNextMonth" aria-label="Next month">→</button>
    </div>
    <div class="availability-calendar-grid">
      ${weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
  `;

  for (let i = 0; i < firstWeekday; i++) {
    html += `<div aria-hidden="true"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${calendarState.year}-${String(calendarState.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hasBooking = calendarDateHasBooking(
      calendarState.year,
      calendarState.month,
      day,
    );
    const isPast = date < today;
    const isToday = date === today;
    const isSelected = date === calendarState.selectedDate;

    const classes = [
      "calendar-date-button",
      hasBooking ? "has-booking" : "",
      isToday ? "is-today" : "",
      isSelected ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");

    html += `
      <button type="button" class="${classes}" data-calendar-date="${date}"
        ${isPast ? "disabled" : ""} aria-label="${date}${hasBooking ? ", existing booking" : ""}">
        <span class="calendar-date-number">${day}</span>
        <span class="calendar-date-status">${hasBooking ? "Booked" : ""}</span>
      </button>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  $("calendarPreviousMonth")?.addEventListener("click", () => {
    calendarState.month--;
    if (calendarState.month < 0) {
      calendarState.month = 11;
      calendarState.year--;
    }
    loadCalendarBookings();
  });

  $("calendarNextMonth")?.addEventListener("click", () => {
    calendarState.month++;
    if (calendarState.month > 11) {
      calendarState.month = 0;
      calendarState.year++;
    }
    loadCalendarBookings();
  });

  container.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      selectCalendarDate(button.dataset.calendarDate);
    });
  });
}

function selectCalendarDate(date) {
  if (!date) return;

  const today = getTodayString();
  if (date < today) return;

  calendarState.selectedDate = date;

  if (startDate) {
    startDate.value = date;
    startDate.dispatchEvent(new Event("input", { bubbles: true }));
    startDate.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /*
   * For daily rentals, the customer can select a return date manually.
   * For 6/12-hour rentals, return date/time are calculated automatically.
   */
  if (
    getSelectedRentalMode() === RENTAL_MODE.DAILY &&
    endDate &&
    !endDate.readOnly
  ) {
    if (!endDate.value || endDate.value < date) {
      endDate.value = date;
    }
    endDate.min = date;
  }

  syncReturnDateTime();
  updateBookingSummary();
  scheduleAvailabilityCheck();
  renderAvailabilityCalendar();

  $("bookingForm")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  showCalendarMessage(
    `Pickup date set to ${date}. Choose the pickup time and check the exact availability before submitting.`,
  );
}

/* =========================================================
   AVAILABILITY MESSAGE / REAL-TIME CHECK
   ========================================================= */

function ensureAvailabilityMessage() {
  let message = $("availabilityMessage");
  if (message || !bookingForm) return message;

  message = document.createElement("div");
  message.id = "availabilityMessage";
  message.className = "availability-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  message.style.cssText =
    "margin:12px 0;padding:12px 14px;border-radius:8px;font-size:14px;line-height:1.5;display:none;";

  const submitButton = bookingForm.querySelector(
    'button[type="submit"],input[type="submit"]',
  );
  if (submitButton?.parentElement) {
    submitButton.parentElement.insertBefore(message, submitButton);
  } else {
    bookingForm.appendChild(message);
  }

  return message;
}

function showAvailabilityMessage(text, type = "info") {
  const message = ensureAvailabilityMessage();
  if (!message) return;

  message.textContent = text;
  message.style.display = "block";

  if (type === "error") {
    message.style.background = "rgba(220,38,38,.12)";
    message.style.color = "#dc2626";
  } else if (type === "success") {
    message.style.background = "rgba(22,163,74,.12)";
    message.style.color = "#16a34a";
  } else {
    message.style.background = "rgba(128,128,128,.12)";
    message.style.color = "inherit";
  }
}

async function checkCameraAvailability() {
  const requestId = ++availabilityRequestId;
  const camera = cameras.find((item) => item.id === cameraSelect?.value);
  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();
  const quantity = Number(cameraQuantity?.value);

  if (
    !camera ||
    !Number.isSafeInteger(Number(camera.id)) ||
    Number(camera.id) <= 0 ||
    !pickup ||
    !returned ||
    returned <= pickup ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    showAvailabilityMessage(
      "Pilih kamera, tanggal, jam, dan jumlah unit untuk mengecek ketersediaan.",
    );
    return null;
  }

  showAvailabilityMessage("Mengecek ketersediaan kamera...");

  try {
    const { data, error } = await supabaseClient.rpc(
      "get_camera_availability",
      {
        p_camera_id: Number(camera.id),
        p_pickup_at: pickup.toISOString(),
        p_return_at: returned.toISOString(),
      },
    );

    if (error) throw error;
    if (requestId !== availabilityRequestId) return null;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      showAvailabilityMessage(
        "Ketersediaan belum bisa diverifikasi. Periksa tanggal dan jam, lalu coba lagi.",
        "error",
      );
      return null;
    }

    const available = Number(result.available_quantity);
    if (!Number.isFinite(available)) {
      showAvailabilityMessage(
        "Respons ketersediaan tidak valid. Silakan coba lagi.",
        "error",
      );
      return null;
    }

    if (available < quantity) {
      showAvailabilityMessage(
        `Stok tidak cukup untuk periode ini. Tersedia ${available} unit, sedangkan kamu memilih ${quantity} unit.`,
        "error",
      );
      return result;
    }

    showAvailabilityMessage(
      `Tersedia ${available} unit untuk periode yang kamu pilih.`,
      "success",
    );
    return result;
  } catch (error) {
    console.error("Availability check failed:", error);
    if (requestId === availabilityRequestId) {
      showAvailabilityMessage(
        "Gagal mengecek ketersediaan. Coba lagi sebelum mengirim booking.",
        "error",
      );
    }
    return null;
  }
}

function scheduleAvailabilityCheck() {
  window.clearTimeout(availabilityTimer);
  availabilityTimer = window.setTimeout(checkCameraAvailability, 350);
}

function setupAvailabilityChecker() {
  ensureAvailabilityMessage();

  [
    cameraSelect,
    startDate,
    startTime,
    endDate,
    endTime,
    cameraQuantity,
    rentalDuration,
  ].forEach((element) => {
    element?.addEventListener("change", scheduleAvailabilityCheck);
    element?.addEventListener("input", scheduleAvailabilityCheck);
  });
}

/* =========================================================
   INTERNATIONAL PHONE INPUTS
   ========================================================= */

function setupPhoneInputs() {
  if (typeof window.intlTelInput !== "function") {
    console.warn(
      "intl-tel-input has not loaded. Country code selector is unavailable.",
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
  const camera = getSelectedCamera();
  const mode = getSelectedRentalMode();
  const actualHours = getRentalDurationDifference();
  const quantity = Math.max(1, Number(cameraQuantity?.value) || 1);

  if (summaryCamera) summaryCamera.textContent = camera ? camera.name : "-";

  if (summaryDuration) {
    if (mode === RENTAL_MODE.SIX_HOURS) {
      summaryDuration.textContent = `6 Hours — ${formatRupiah(getPriceForRental(camera, mode, actualHours).amount)}`;
    } else if (mode === RENTAL_MODE.TWELVE_HOURS) {
      summaryDuration.textContent = `12 Hours — ${formatRupiah(getPriceForRental(camera, mode, actualHours).amount)}`;
    } else {
      const days = getChargeableDays(actualHours);
      if (!actualHours || !days) {
        summaryDuration.textContent = "Daily Rental — select return time";
      } else {
        const priceInfo = getPriceForRental(camera, mode, actualHours);
        summaryDuration.textContent = `${formatDuration(actualHours)} (${actualHours.toFixed(2)} hours actual) — ${formatRupiah(priceInfo.amount)} per camera`;
      }
    }
  }

  if (summaryQuantity) {
    summaryQuantity.textContent = `${quantity} ${quantity === 1 ? "unit" : "units"}`;
  }

  updateDisplayedPriceIfPossible(camera, mode, actualHours);
}

function updateDisplayedPriceIfPossible(camera, mode, actualHours) {
  const summaryPrice = $("summaryPrice");
  if (!summaryPrice) return;

  const priceInfo = getPriceForRental(camera, mode, actualHours);
  const quantity = Math.max(1, Number(cameraQuantity?.value) || 1);
  summaryPrice.textContent =
    priceInfo.amount > 0 ? formatRupiah(priceInfo.amount * quantity) : "-";
}

function getRentalDurationDifference() {
  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();
  if (!pickup || !returned || returned <= pickup) return null;
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
  if (agreementError) agreementError.textContent = "";
}

function showFieldError(input, message) {
  if (!input) return;
  input.classList.add("input-error");
  const error = input.closest(".form-group")?.querySelector(".error-message");
  if (error) error.textContent = message;
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

  const selectedCamera = cameras.find(
    (item) => item.id === cameraSelect?.value,
  );
  if (!selectedCamera) {
    showFieldError(cameraSelect, "Please select a valid camera.");
    isValid = false;
  }

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

    const mode = getSelectedRentalMode();

    if (!isFlexiblePriceCamera(selectedCamera) && mode !== RENTAL_MODE.DAILY) {
      showFieldError(
        rentalDuration,
        "This camera is only available for daily rental.",
      );
      isValid = false;
    }

    if ([RENTAL_MODE.SIX_HOURS, RENTAL_MODE.TWELVE_HOURS].includes(mode)) {
      const actualHours = (returned - pickup) / (60 * 60 * 1000);
      if (Math.abs(actualHours - Number(mode)) > 0.001) {
        showFieldError(
          endTime || endDate,
          "Return time does not match the selected duration.",
        );
        isValid = false;
      }
    }

    if (mode === RENTAL_MODE.DAILY && returned > pickup) {
      const days = getChargeableDays((returned - pickup) / (60 * 60 * 1000));
      if (!days || days < 1) {
        showFieldError(
          endTime || endDate,
          "Please choose a valid daily rental period.",
        );
        isValid = false;
      }
    }
  }

  ["whatsapp", "emergencyContact"].forEach((id) => {
    const input = $(id);
    if (input?.value.trim() && !isValidPhoneNumber(id)) {
      showFieldError(input, "Please enter a valid phone number.");
      isValid = false;
    }
  });

  const quantity = Number(cameraQuantity?.value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    showFieldError(cameraQuantity, "Number of units must be at least 1.");
    isValid = false;
  }

  if ($("ktpCheck") && !$("ktpCheck").checked) {
    showFieldError($("ktpCheck"), "A valid ID card or passport is required.");
    isValid = false;
  }

  if (!agreement?.checked) {
    if (agreementError)
      agreementError.textContent = "You must agree to the booking terms.";
    isValid = false;
  }

  return isValid;
}

/* =========================================================
   BOOKING SUBMIT — DATABASE RPC + WHATSAPP
   ========================================================= */

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = bookingForm.querySelector(
      'button[type="submit"],input[type="submit"]',
    );
    if (submitButton?.disabled) return;

    syncReturnDateTime();

    if (!validateBookingForm()) {
      document.querySelector(".input-error")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    const camera = cameras.find((item) => item.id === cameraSelect?.value);
    if (!camera) {
      alert("Camera not found. Please select a camera again.");
      return;
    }

    const cameraId = Number(camera.id);
    if (!Number.isSafeInteger(cameraId) || cameraId <= 0) {
      alert(
        "Camera data could not be verified. Please refresh the page and try again.",
      );
      return;
    }

    const pickup = getPickupDateTime();
    const returned = getReturnDateTime();
    const quantity = Number(cameraQuantity?.value);

    if (!pickup || !returned || returned <= pickup) {
      alert("Please check the rental dates and times.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      alert("Please enter a valid camera quantity.");
      return;
    }

    const customerName = $("fullName")?.value.trim() || "";
    const whatsapp = getInternationalNumber("whatsapp");
    const emergencyContact = getInternationalNumber("emergencyContact");
    const occupation = $("occupation")?.value.trim() || "";
    const workplace = $("workplace")?.value.trim() || "";
    const instagram = $("instagram")?.value.trim() || "";
    const pickupLocation = $("pickupLocation")?.value.trim() || "";
    const returnLocation = $("returnLocation")?.value.trim() || "";
    const comments = $("comments")?.value.trim() || "";

    const mode = getSelectedRentalMode();
    const actualHours = getRentalDurationDifference();
    const priceInfo = getPriceForRental(camera, mode, actualHours);
    const totalPrice = priceInfo.amount * quantity;

    const notes = [
      `Rental duration: ${formatDuration(actualHours)}`,
      `Occupation: ${occupation}`,
      `Workplace: ${workplace}`,
      `Emergency contact: ${emergencyContact}`,
      `Instagram: ${instagram}`,
      `Pickup location: ${pickupLocation}`,
      `Return location: ${returnLocation}`,
      `ID/passport prepared: ${$("ktpCheck")?.checked ? "Yes" : "No"}`,
      `Hotel confirmation: ${$("hotelCheck")?.checked ? "Yes" : "No"}`,
      `Flight details: ${$("flightCheck")?.checked ? "Yes" : "No"}`,
      `Estimated total: ${formatRupiah(totalPrice)}`,
      `Additional comments: ${comments || "-"}`,
    ].join("\n");

    const whatsappURL = createWhatsAppMessage();
    const originalButtonText = submitButton
      ? submitButton.tagName === "INPUT"
        ? submitButton.value
        : submitButton.textContent
      : "";

    if (submitButton) {
      submitButton.disabled = true;
      if (submitButton.tagName === "INPUT")
        submitButton.value = "Checking availability...";
      else submitButton.textContent = "Checking availability...";
    }

    try {
      const availability = await checkCameraAvailability();

      if (!availability || Number(availability.available_quantity) < quantity) {
        throw new Error(
          "Stok tidak tersedia atau ketersediaannya belum berhasil diverifikasi.",
        );
      }

      if (submitButton) {
        if (submitButton.tagName === "INPUT")
          submitButton.value = "Saving booking...";
        else submitButton.textContent = "Saving booking...";
      }

      const { data: bookingId, error } = await supabaseClient.rpc(
        "create_rental_booking",
        {
          p_camera_id: cameraId,
          p_customer_name: customerName,
          p_customer_phone: whatsapp,
          p_pickup_at: pickup.toISOString(),
          p_return_at: returned.toISOString(),
          p_quantity: quantity,
          p_customer_email: null,
          p_notes: notes,
        },
      );

      if (error) throw error;
      if (!bookingId) throw new Error("Supabase did not return a booking ID.");

      console.log("Booking request saved:", bookingId);
      showAvailabilityMessage(
        "Permintaan booking berhasil disimpan. Membuka WhatsApp...",
        "success",
      );

      let whatsappWindow = null;
      try {
        whatsappWindow = window.open(
          whatsappURL,
          "_blank",
          "noopener,noreferrer",
        );
      } catch (error) {
        console.warn("Unable to open WhatsApp in a new tab:", error);
      }

      if (!whatsappWindow) window.location.href = whatsappURL;
    } catch (error) {
      console.error("Failed to save booking:", error);
      const message = String(error?.message || "").toLowerCase();

      if (
        message.includes("stok tidak cukup") ||
        message.includes("stock") ||
        message.includes("not enough")
      ) {
        showAvailabilityMessage(error.message, "error");
        alert(
          "Booking tidak bisa diproses karena stok kamera tidak cukup untuk periode tersebut. Pilih waktu lain atau kurangi jumlah unit.",
        );
      } else if (
        message.includes("create_rental_booking") ||
        message.includes("get_camera_availability") ||
        message.includes("could not find the function")
      ) {
        showAvailabilityMessage(
          "Fungsi booking Supabase belum tersedia atau belum bisa diakses. Periksa fungsi SQL dan izinnya.",
          "error",
        );
        alert(
          "Sistem booking belum siap. Periksa fungsi Supabase create_rental_booking dan get_camera_availability.",
        );
      } else {
        showAvailabilityMessage(
          "Booking belum berhasil disimpan. Silakan coba lagi.",
          "error",
        );
        alert(
          "Booking belum berhasil disimpan ke sistem. Coba lagi atau hubungi Enmax House melalui WhatsApp.",
        );
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        if (submitButton.tagName === "INPUT")
          submitButton.value = originalButtonText;
        else submitButton.textContent = originalButtonText;
      }
    }
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
  if (mode === RENTAL_MODE.SIX_HOURS) rentalDurationText = "6 Hours";
  else if (mode === RENTAL_MODE.TWELVE_HOURS) rentalDurationText = "12 Hours";
  else if (actualHours && actualHours > 0) {
    const days = getChargeableDays(actualHours);
    rentalDurationText = `${days} ${days === 1 ? "Day" : "Days"}`;
  }

  const priceInfo = getPriceForRental(camera, mode, actualHours);
  const totalPrice = priceInfo.amount * quantity;

  const documentStatus = `
ID Card / Passport: ${$("ktpCheck")?.checked ? "Required — to be presented or sent via WhatsApp" : "Not prepared"}
Hotel Booking Confirmation: ${$("hotelCheck")?.checked ? "Will be provided" : "Not specified"}
Flight Details: ${$("flightCheck")?.checked ? "Will be provided" : "Not specified"}
`.trim();

  const message = `
Hello Enmax House, I would like to submit a camera booking request.

RENTAL DETAILS
Camera: ${camera ? camera.name : "-"}
Rental Type: ${mode === RENTAL_MODE.DAILY ? "Daily Rental" : rentalDurationText}
Rental Duration: ${rentalDurationText}
Price per Camera: ${priceInfo.amount > 0 ? formatRupiah(priceInfo.amount) : "-"}
Number of Units: ${quantity}
Estimated Total Rental Price: ${totalPrice > 0 ? formatRupiah(totalPrice) : "-"}
Actual Rental Time: ${actualHours && actualHours > 0 ? `${actualHours.toFixed(2)} hours` : "-"}
Chargeable Days: ${mode === RENTAL_MODE.DAILY && priceInfo.days ? `${priceInfo.days} ${priceInfo.days === 1 ? "day" : "days"}` : "-"}
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

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
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

  commentsList.innerHTML = `<div class="empty-comments"><p>Loading comments...</p></div>`;

  try {
    const { data, error } = await supabaseClient
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    commentsList.innerHTML = "";
    if (!data?.length) {
      commentsList.innerHTML = `<div class="empty-comments"><p>Belum ada komentar. Jadilah yang pertama.</p></div>`;
      return;
    }

    data.forEach(renderComment);
  } catch (error) {
    console.error("Failed to load comments:", error);
    commentsList.innerHTML = `<div class="empty-comments"><p>Unable to load comments.</p></div>`;
  }
}

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
        <strong class="comment-author">${escapeHTML(comment.name)}</strong>
        <div class="comment-rating">${stars}</div>
      </div>
      <span class="comment-date">${escapeHTML(date)}</span>
    </div>
    <p>${escapeHTML(comment.comment || "")}</p>
  `;

  commentsList.appendChild(article);
}

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
      const { error } = await supabaseClient.from("reviews").insert([
        {
          name,
          rating,
          comment,
        },
      ]);

      if (error) throw error;

      alert("Thank you for your comment!");
      commentForm.reset();
      await loadComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
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
  if (currentYear) currentYear.textContent = new Date().getFullYear();
}
