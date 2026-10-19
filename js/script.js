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

/* INITIALIZATION */

document.addEventListener("DOMContentLoaded", () => {
  renderCameraCards();
  populateCameraSelect();
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
    option.textContent = `${camera.name} — Starting from ${camera.price}`;

    cameraSelect.appendChild(option);
  });

  cameraSelect.addEventListener("change", () => {
    selectedCameraId = cameraSelect.value || null;

    if (selectedCameraId) {
      updateDurationOptions(
        rentalDuration,
        selectedCameraId,
        Number(rentalDuration?.value) || 24,
      );

      // Update modal duration only if it shows the same camera.
      if (
        modalRentalDuration &&
        modalBookButton?.dataset.cameraId === selectedCameraId
      ) {
        updateDurationOptions(
          modalRentalDuration,
          selectedCameraId,
          Number(rentalDuration?.value) || 24,
        );
      }
    }

    updateBookingSummary();
  });
}

/* DURATION OPTIONS PER CAMERA */

function getAvailableDurations(cameraId) {
  const camera = cameras.find((item) => item.id === cameraId);

  if (!camera) return [6, 12, 24];

  return camera.durations || [6, 12, 24];
}

function updateDurationOptions(select, cameraId, preferredDuration = 24) {
  if (!select) return;

  const durations = getAvailableDurations(cameraId);

  select.innerHTML = "";

  durations.forEach((hours) => {
    const option = document.createElement("option");

    option.value = String(hours);
    option.textContent = `${hours} hours`;

    select.appendChild(option);
  });

  const selectedDuration = durations.includes(Number(preferredDuration))
    ? Number(preferredDuration)
    : durations[durations.length - 1];

  select.value = String(selectedDuration);
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

  // Set modal options independently of the booking form.
  updateDurationOptions(
    modalRentalDuration,
    camera.id,
    Number(rentalDuration?.value) || 24,
  );

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
   PHOTO LIGHTBOX — CLICK TO ENLARGE
   ========================================================= */

function setupPhotoLightbox() {
  if (photoLightbox) return;

  // Create the lightbox dynamically without editing HTML.
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

    <img
      class="lightbox-image"
      src=""
      alt=""
    >
  `;

  document.body.appendChild(photoLightbox);

  lightboxImage = photoLightbox.querySelector(".lightbox-image");

  const closeButton = photoLightbox.querySelector(".lightbox-close");

  // Add lightbox styling dynamically.
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
      transition:
        opacity 0.25s ease,
        visibility 0.25s ease;
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
      display: flex;
      align-items: center;
      justify-content: center;
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
      transition: color 0.2s ease;
    }

    #photoLightbox .lightbox-close:hover {
      color: #ff2aa6;
    }

    #photoLightbox .lightbox-close:focus-visible {
      outline: 2px solid #ff2aa6;
      outline-offset: 3px;
    }

    /* Indicate that camera photos are clickable. */
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

  document.head.appendChild(style);

  // Click a camera card photo to enlarge it.
  cameraGrid?.addEventListener("click", (event) => {
    const image = event.target.closest(".camera-card-image img");

    if (!image || !cameraGrid.contains(image)) return;

    event.preventDefault();
    event.stopPropagation();

    openPhotoLightbox(image.src, image.alt);
  });

  // Click the current gallery photo inside the camera modal.
  modalCameraImage?.addEventListener("click", () => {
    if (!modalCameraImage.src) return;

    openPhotoLightbox(
      modalCameraImage.src,
      modalCameraImage.alt || "Camera sample photo",
    );
  });

  // Close using the × button.
  closeButton.addEventListener("click", closePhotoLightbox);

  // Close by clicking the dark area outside the image.
  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) {
      closePhotoLightbox();
    }
  });

  // Prevent clicks on the image itself from closing the lightbox.
  lightboxImage.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // Close with Escape, independently of the camera modal.
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

  // Remember the previous page scroll setting.
  previousBodyOverflow = document.body.style.overflow;

  lightboxImage.src = src;
  lightboxImage.alt = alt;

  photoLightbox.classList.add("active");
  photoLightbox.setAttribute("aria-hidden", "false");

  // Prevent the page from scrolling behind the enlarged photo.
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

  // Restore the page scroll setting.
  document.body.style.overflow = previousBodyOverflow;
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
  // The lightbox has its own Escape handler above.
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

/* BOOK THIS CAMERA */

modalBookButton?.addEventListener("click", () => {
  const cameraId = modalBookButton.dataset.cameraId;

  if (!cameraId || !cameraSelect) return;

  cameraSelect.value = cameraId;
  selectedCameraId = cameraId;

  updateDurationOptions(
    rentalDuration,
    cameraId,
    Number(modalRentalDuration?.value) || 24,
  );

  updateBookingSummary();
  closeCameraModal();

  $("booking")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

/* RENTAL DURATION */

function getSelectedDurationHours() {
  const cameraId = cameraSelect?.value;

  if (!cameraId || !rentalDuration) return null;

  const availableDurations = getAvailableDurations(cameraId);
  const selectedHours = Number(rentalDuration.value);

  return availableDurations.includes(selectedHours) ? selectedHours : null;
}

function formatDuration(hours) {
  if (!hours) return "-";

  return `${hours} hours`;
}

function setupDurationSynchronization() {
  modalRentalDuration?.addEventListener("change", () => {
    // Modal duration stays independent until the user clicks Book.
    // This prevents changing a different camera's booking duration.
  });

  rentalDuration?.addEventListener("change", () => {
    if (
      modalRentalDuration &&
      modalBookButton?.dataset.cameraId === cameraSelect?.value
    ) {
      updateDurationOptions(
        modalRentalDuration,
        cameraSelect.value,
        Number(rentalDuration.value),
      );
    }

    updateBookingSummary();
  });
}

/* INTERNATIONAL PHONE INPUTS */

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

function getRentalDurationDifference() {
  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();

  if (!pickup || !returned || returned <= pickup) return null;

  return (returned.getTime() - pickup.getTime()) / 3600000;
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
  if (summaryCamera && cameraSelect) {
    const camera = cameras.find((item) => item.id === cameraSelect.value);

    summaryCamera.textContent = camera ? camera.name : "-";
  }

  if (summaryDuration) {
    summaryDuration.textContent = formatDuration(getSelectedDurationHours());
  }

  if (summaryQuantity) {
    const quantity = Math.max(1, Number(cameraQuantity?.value) || 1);

    summaryQuantity.textContent = `${quantity} ${quantity === 1 ? "unit" : "units"}`;
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

  /* DURATION VALIDATION */

  const selectedHours = getSelectedDurationHours();

  if (!selectedHours) {
    showFieldError(
      rentalDuration,
      "Please choose a valid rental duration for this camera.",
    );

    isValid = false;
  }

  /* DATE AND TIME VALIDATION */

  const pickup = getPickupDateTime();
  const returned = getReturnDateTime();

  if (pickup && pickup.getTime() < Date.now()) {
    showFieldError(
      startTime || startDate,
      "Pickup time cannot be in the past.",
    );

    isValid = false;
  }

  if (pickup && returned && returned <= pickup) {
    showFieldError(
      endTime || endDate,
      "Return time must be after pickup time.",
    );

    isValid = false;
  }

  /*
    The selected rental duration must match the interval
    between pickup and return.
  */

  if (pickup && returned && returned > pickup && selectedHours) {
    const actualHours = getRentalDurationDifference();

    if (Math.abs(actualHours - selectedHours) > 0.001) {
      showFieldError(
        endTime || endDate,
        `Return time must be exactly ${selectedHours} hours after pickup.`,
      );

      isValid = false;
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
  const selectedHours = getSelectedDurationHours();

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
Rental Duration: ${selectedHours ? `${selectedHours} hours` : "-"}
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
