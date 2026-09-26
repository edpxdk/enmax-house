/* =========================================================
   ENMAX HOUSE
   Camera Rental Website
   ========================================================= */

/* =========================================================
   CONFIGURATION
   ========================================================= */

// Format WhatsApp:
// 62 + nomor tanpa +, spasi, atau 0 di depan.
const WHATSAPP_NUMBER = "6282145929947";

/* =========================================================
   CAMERA DATA
   ========================================================= */

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

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const navbar = document.getElementById("navbar");

const navMenu = document.getElementById("navMenu");
const menuToggle = document.getElementById("menuToggle");

const cameraGrid = document.getElementById("cameraGrid");
const cameraSelect = document.getElementById("cameraSelect");

const cameraModal = document.getElementById("cameraModal");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");

/*
  IMPORTANT:
  Gallery sekarang hanya menggunakan SATU image.
  JavaScript akan mengganti src image tersebut.
*/
const modalCameraImage = document.getElementById("modalCameraImage");

const galleryPrev = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");
const galleryCounter = document.getElementById("galleryCounter");

const modalCameraCategory = document.getElementById("modalCameraCategory");
const modalCameraName = document.getElementById("modalCameraName");

const modalCameraDescription = document.getElementById(
  "modalCameraDescription",
);

const modalCameraPrice = document.getElementById("modalCameraPrice");

const modalBookButton = document.getElementById("modalBookButton");

const bookingForm = document.getElementById("bookingForm");

const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const summaryCamera = document.getElementById("summaryCamera");
const summaryDuration = document.getElementById("summaryDuration");

const agreement = document.getElementById("agreement");
const agreementError = document.getElementById("agreementError");

const commentForm = document.getElementById("commentForm");
const commentsList = document.getElementById("commentsList");

const currentYear = document.getElementById("currentYear");

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let selectedCameraId = null;
let currentGalleryIndex = 0;

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderCameraCards();
  populateCameraSelect();
  setMinimumDates();
  loadComments();
  updateCurrentYear();
  setupNavbar();
  setupGalleryControls();
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

        <span class="camera-badge">
          Available
        </span>
      </div>

      <div class="camera-card-content">

        <span class="camera-category">
          ${escapeHTML(camera.category)}
        </span>

        <h3>
          ${escapeHTML(camera.name)}
        </h3>

        <p>
          ${escapeHTML(camera.description)}
        </p>

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

  const viewButtons = document.querySelectorAll(".camera-view-button");

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const cameraId = button.dataset.cameraId;

      openCameraModal(cameraId);
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

    option.textContent = `${camera.name} — ${camera.price}`;

    cameraSelect.appendChild(option);
  });

  cameraSelect.addEventListener("change", () => {
    selectedCameraId = cameraSelect.value || null;

    updateBookingSummary();
  });
}

/* =========================================================
   CAMERA MODAL
   ========================================================= */

function openCameraModal(cameraId) {
  const camera = cameras.find((item) => item.id === cameraId);

  if (!camera || !cameraModal) return;

  selectedCameraId = camera.id;

  currentGalleryIndex = 0;

  /*
    Set camera information
  */
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

  /*
    Load first gallery image
  */
  updateGalleryImage();

  /*
    Open modal
  */
  cameraModal.classList.add("active");

  cameraModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  setTimeout(() => {
    modalClose?.focus();
  }, 100);
}

/* =========================================================
   GET CURRENT GALLERY
   ========================================================= */

function getCurrentGallery() {
  const camera = cameras.find((item) => item.id === selectedCameraId);

  if (!camera) {
    return [];
  }

  if (Array.isArray(camera.gallery) && camera.gallery.length > 0) {
    return camera.gallery;
  }

  return [camera.image];
}

/* =========================================================
   UPDATE GALLERY IMAGE
   ========================================================= */

function updateGalleryImage() {
  if (!modalCameraImage) return;

  const camera = cameras.find((item) => item.id === selectedCameraId);

  if (!camera) return;

  const gallery = getCurrentGallery();

  if (!gallery.length) return;

  /*
    Pastikan index selalu valid
  */
  if (currentGalleryIndex < 0) {
    currentGalleryIndex = gallery.length - 1;
  }

  if (currentGalleryIndex >= gallery.length) {
    currentGalleryIndex = 0;
  }

  /*
    INI INTINYA:
    Tidak membuat <img> baru.
    Hanya mengganti src dari satu image.
  */
  modalCameraImage.src = gallery[currentGalleryIndex];

  modalCameraImage.alt = `${camera.name} photo ${currentGalleryIndex + 1}`;

  /*
    Counter
  */
  if (galleryCounter) {
    galleryCounter.textContent = `${currentGalleryIndex + 1} / ${gallery.length}`;
  }

  /*
    Show / hide arrows
  */
  const hasMultipleImages = gallery.length > 1;

  if (galleryPrev) {
    galleryPrev.style.display = hasMultipleImages ? "flex" : "none";
  }

  if (galleryNext) {
    galleryNext.style.display = hasMultipleImages ? "flex" : "none";
  }
}

/* =========================================================
   GALLERY CONTROLS
   ========================================================= */

function setupGalleryControls() {
  if (galleryPrev) {
    galleryPrev.addEventListener("click", () => {
      moveGallery(-1);
    });
  }

  if (galleryNext) {
    galleryNext.addEventListener("click", () => {
      moveGallery(1);
    });
  }
}

/* =========================================================
   MOVE GALLERY
   ========================================================= */

function moveGallery(direction) {
  const gallery = getCurrentGallery();

  if (!gallery.length) return;

  currentGalleryIndex += direction;

  /*
    Loop ke foto terakhir
  */
  if (currentGalleryIndex < 0) {
    currentGalleryIndex = gallery.length - 1;
  }

  /*
    Loop ke foto pertama
  */
  if (currentGalleryIndex >= gallery.length) {
    currentGalleryIndex = 0;
  }

  updateGalleryImage();
}

/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeCameraModal() {
  if (!cameraModal) return;

  cameraModal.classList.remove("active");

  cameraModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

if (modalClose) {
  modalClose.addEventListener("click", closeCameraModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", closeCameraModal);
}

/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cameraModal?.classList.contains("active")) {
    closeCameraModal();
  }
});

/* =========================================================
   KEYBOARD GALLERY NAVIGATION
   ========================================================= */

document.addEventListener("keydown", (event) => {
  if (!cameraModal?.classList.contains("active")) {
    return;
  }

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

if (modalBookButton) {
  modalBookButton.addEventListener("click", () => {
    const cameraId = modalBookButton.dataset.cameraId;

    if (!cameraId || !cameraSelect) {
      return;
    }

    selectedCameraId = cameraId;

    cameraSelect.value = cameraId;

    updateBookingSummary();

    closeCameraModal();

    const bookingSection = document.getElementById("booking");

    bookingSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

/* =========================================================
   DATE LOGIC
   ========================================================= */

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function setMinimumDates() {
  if (!startDate || !endDate) return;

  const today = getTodayString();

  startDate.min = today;

  endDate.min = today;
}

/* =========================================================
   START DATE
   ========================================================= */

if (startDate) {
  startDate.addEventListener("change", () => {
    if (!startDate.value) return;

    endDate.min = startDate.value;

    if (endDate.value && endDate.value < startDate.value) {
      endDate.value = startDate.value;
    }

    updateBookingSummary();
  });
}

/* =========================================================
   END DATE
   ========================================================= */

if (endDate) {
  endDate.addEventListener("change", updateBookingSummary);
}

/* =========================================================
   RENTAL DURATION
   ========================================================= */

function calculateRentalDays() {
  if (!startDate?.value || !endDate?.value) {
    return null;
  }

  const start = new Date(`${startDate.value}T00:00:00`);

  const end = new Date(`${endDate.value}T00:00:00`);

  const difference = end.getTime() - start.getTime();

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
}

/* =========================================================
   BOOKING SUMMARY
   ========================================================= */

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
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDateIndonesia(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

/* =========================================================
   SHOW FIELD ERROR
   ========================================================= */

function showFieldError(input, message) {
  if (!input) return;

  input.classList.add("input-error");

  const parent = input.closest(".form-group");

  if (!parent) return;

  const error = parent.querySelector(".error-message");

  if (error) {
    error.textContent = message;
  }
}

/* =========================================================
   VALIDATE BOOKING FORM
   ========================================================= */

function validateBookingForm() {
  clearValidation();

  let isValid = true;

  const requiredFields = [
    {
      id: "fullName",
      message: "Nama lengkap wajib diisi.",
    },

    {
      id: "occupation",
      message: "Pekerjaan wajib diisi.",
    },

    {
      id: "workplace",
      message: "Tempat kerja wajib diisi.",
    },

    {
      id: "whatsapp",
      message: "Nomor WhatsApp wajib diisi.",
    },

    {
      id: "emergencyContact",
      message: "Kontak darurat wajib diisi.",
    },

    {
      id: "cameraSelect",
      message: "Silakan pilih kamera.",
    },

    {
      id: "startDate",
      message: "Tanggal mulai wajib dipilih.",
    },

    {
      id: "endDate",
      message: "Tanggal selesai wajib dipilih.",
    },

    {
      id: "pickupLocation",
      message: "Tempat pengambilan wajib diisi.",
    },

    {
      id: "returnLocation",
      message: "Tempat pengembalian wajib diisi.",
    },
  ];

  requiredFields.forEach((field) => {
    const input = document.getElementById(field.id);

    if (!input || !input.value.trim()) {
      showFieldError(input, field.message);

      isValid = false;
    }
  });

  /* =======================================================
     DATE VALIDATION
  ======================================================== */

  if (startDate?.value && endDate?.value && endDate.value < startDate.value) {
    showFieldError(
      endDate,
      "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
    );

    isValid = false;
  }

  /* =======================================================
     WHATSAPP VALIDATION
  ======================================================== */

  const whatsapp = document.getElementById("whatsapp");

  if (whatsapp?.value && !/^[0-9+\-\s()]{8,20}$/.test(whatsapp.value)) {
    showFieldError(whatsapp, "Masukkan nomor WhatsApp yang valid.");

    isValid = false;
  }

  /* =======================================================
     SUPPORTING DOCUMENTS
  ======================================================== */

  const ktpCheck = document.getElementById("ktpCheck");

  const hotelCheck = document.getElementById("hotelCheck");

  const flightCheck = document.getElementById("flightCheck");

  const hasAtLeastOneDocument =
    ktpCheck?.checked || hotelCheck?.checked || flightCheck?.checked;

  if (!hasAtLeastOneDocument) {
    ktpCheck?.closest(".checkbox-item")?.classList.add("input-error");

    hotelCheck?.closest(".checkbox-item")?.classList.add("input-error");

    flightCheck?.closest(".checkbox-item")?.classList.add("input-error");

    isValid = false;
  }

  /* =======================================================
     AGREEMENT
  ======================================================== */

  if (!agreement?.checked) {
    if (agreementError) {
      agreementError.textContent = "Kamu harus menyetujui ketentuan booking.";
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

    const isValid = validateBookingForm();

    if (!isValid) {
      const firstError = document.querySelector(".input-error");

      if (firstError) {
        firstError.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        if (typeof firstError.focus === "function") {
          firstError.focus();
        }
      }

      return;
    }

    createWhatsAppMessage();
  });
}

/* =========================================================
   WHATSAPP MESSAGE
   ========================================================= */

function createWhatsAppMessage() {
  const camera = cameras.find((item) => item.id === cameraSelect.value);

  const fullName = document.getElementById("fullName").value.trim();

  const occupation = document.getElementById("occupation").value.trim();

  const workplace = document.getElementById("workplace").value.trim();

  const whatsapp = document.getElementById("whatsapp").value.trim();

  const emergencyContact = document
    .getElementById("emergencyContact")
    .value.trim();

  const instagram = document.getElementById("instagram").value.trim();

  const pickupLocation = document.getElementById("pickupLocation").value.trim();

  const returnLocation = document.getElementById("returnLocation").value.trim();

  const comments = document.getElementById("comments").value.trim();

  const ktpCheck = document.getElementById("ktpCheck").checked;

  const hotelCheck = document.getElementById("hotelCheck").checked;

  const flightCheck = document.getElementById("flightCheck").checked;

  const duration = calculateRentalDays();

  const documentStatus = `
KTP / Passport: ${ktpCheck ? "✓" : "-"}
Bukti Booking Hotel: ${hotelCheck ? "✓" : "-"}
Detail Penerbangan: ${flightCheck ? "✓" : "-"}
  `.trim();

  const message = `
Halo Enmax House, saya ingin mengajukan booking kamera.

DETAIL RENTAL
Camera: ${camera ? camera.name : "-"}
Durasi: ${duration ? `${duration} hari` : "-"}
Tanggal Mulai: ${formatDateIndonesia(startDate.value)}
Tanggal Selesai: ${formatDateIndonesia(endDate.value)}
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

Saya memahami bahwa booking ini belum confirmed dan masih menunggu pengecekan serta konfirmasi dari Enmax House.
  `.trim();

  const encodedMessage = encodeURIComponent(message);

  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  window.open(whatsappURL, "_blank");
}

/* =========================================================
   NAVBAR
   ========================================================= */

function setupNavbar() {
  if (!navbar || !navMenu || !menuToggle) {
    return;
  }

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
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
   CUSTOMER COMMENTS
   ========================================================= */

function loadComments() {
  if (!commentsList) return;

  const savedComments = JSON.parse(
    localStorage.getItem("enmaxComments") || "[]",
  );

  commentsList.innerHTML = "";

  if (!savedComments.length) {
    commentsList.innerHTML = `
      <div class="empty-comments">
        <p>
          Belum ada komentar. Jadilah yang pertama.
        </p>
      </div>
    `;

    return;
  }

  savedComments.forEach((comment) => {
    renderComment(comment);
  });
}

/* =========================================================
   RENDER COMMENT
   ========================================================= */

function renderComment(comment) {
  const article = document.createElement("article");

  article.className = "comment-card";

  const stars = "★".repeat(comment.rating) + "☆".repeat(5 - comment.rating);

  article.innerHTML = `
    <div class="comment-header">

      <div>

        <strong class="comment-author">
          ${escapeHTML(comment.name)}
        </strong>

        <div class="comment-rating">
          ${stars}
        </div>

      </div>

      <span class="comment-date">
        ${escapeHTML(comment.date)}
      </span>

    </div>

    <p>
      ${escapeHTML(comment.text)}
    </p>
  `;

  commentsList.prepend(article);
}

/* =========================================================
   COMMENT FORM
   ========================================================= */

if (commentForm) {
  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("commentName").value.trim();

    const rating = Number(document.getElementById("commentRating").value);

    const text = document.getElementById("commentText").value.trim();

    if (!name || !text) {
      return;
    }

    const comment = {
      name,
      rating,
      text,

      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    const comments = JSON.parse(localStorage.getItem("enmaxComments") || "[]");

    comments.push(comment);

    localStorage.setItem("enmaxComments", JSON.stringify(comments));

    commentForm.reset();

    loadComments();
  });
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
  return String(value)
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
  if (!currentYear) return;

  currentYear.textContent = new Date().getFullYear();
}
