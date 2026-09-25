/* =========================================================
   ENMAX HOUSE
   Camera Rental Website
   ========================================================= */

/* =========================================================
   CONFIGURATION
   ========================================================= */

// Ganti dengan nomor WhatsApp Enmax House.
// Format: 62 + nomor tanpa tanda +, spasi, atau 0 di depan.
const WHATSAPP_NUMBER = "+628145929947";

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
  },

  {
    id: "camera-02",
    name: "Canon SX740 HS",
    category: "Instanly Post Ready",
    description:
      "Powerful zoom in a compact body, made for travel and everyday moments.",
    price: "Rp 200.000 / day",
    image: "assets/cameras/camera-02.jpg",
  },

  {
    id: "camera-03",
    name: "Panasonic Lumix TZ999",
    category: "Feel Leica Quality",
    description:
      "Versatile zoom and compact design for travel and everyday shooting.",
    price: "Rp 200.000 / day",
    image: "assets/cameras/camera-03.jpg",
  },

  {
    id: "camera-04",
    name: "Leica D-Lux 6",
    category: "Luxury In Every Shot",
    description:
      "Premium compact camera with Leica character for street and lifestyle photography.",
    price: "Rp 140.000 / day",
    image: "assets/cameras/camera-04.jpg",
  },

  {
    id: "camera-05",
    name: "Sony ZV-1",
    category: "Your Moment Your Content",
    description:
      "Creator-focused compact camera for vlogs, travel, and social content.",
    price: "Rp 150.000 / day",
    image: "assets/cameras/camera-05.jpg",
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

const modalCameraImage = document.getElementById("modalCameraImage");

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

let selectedCameraId = null;

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
            <div class="camera-image-wrapper">

                <img
                    src="${camera.image}"
                    alt="${camera.name}"
                    class="camera-image"
                    loading="lazy"
                >

                <span class="camera-status">
                    Available
                </span>

            </div>

            <div class="camera-card-content">

                <span class="camera-category">
                    ${camera.category}
                </span>

                <h3>
                    ${camera.name}
                </h3>

                <p>
                    ${camera.description}
                </p>

                <div class="camera-card-footer">

                    <strong>
                        ${camera.price}
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

  // Attach event listener after cards are rendered.
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

  if (!camera) return;

  selectedCameraId = camera.id;

  modalCameraImage.src = camera.image;

  modalCameraImage.alt = camera.name;

  modalCameraCategory.textContent = camera.category;

  modalCameraName.textContent = camera.name;

  modalCameraDescription.textContent = camera.description;

  modalCameraPrice.textContent = camera.price;

  modalBookButton.dataset.cameraId = camera.id;

  cameraModal.classList.add("active");

  cameraModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  // Move keyboard focus to close button.
  setTimeout(() => {
    modalClose.focus();
  }, 100);
}

/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeCameraModal() {
  cameraModal.classList.remove("active");

  cameraModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

/* Close button */
modalClose.addEventListener("click", closeCameraModal);

/* Click overlay */
modalOverlay.addEventListener("click", closeCameraModal);

/* Escape key */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cameraModal.classList.contains("active")) {
    closeCameraModal();
  }
});

/* =========================================================
   BOOK THIS CAMERA
   ========================================================= */

modalBookButton.addEventListener("click", () => {
  const cameraId = modalBookButton.dataset.cameraId;

  if (!cameraId) return;

  selectedCameraId = cameraId;

  cameraSelect.value = cameraId;

  updateBookingSummary();

  closeCameraModal();

  const bookingSection = document.getElementById("booking");

  bookingSection.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

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
  const today = getTodayString();

  startDate.min = today;

  endDate.min = today;
}

/* Start date changed */
startDate.addEventListener("change", () => {
  if (!startDate.value) return;

  endDate.min = startDate.value;

  if (endDate.value && endDate.value < startDate.value) {
    endDate.value = startDate.value;
  }

  updateBookingSummary();
});

/* End date changed */
endDate.addEventListener("change", () => {
  updateBookingSummary();
});

/* =========================================================
   RENTAL DURATION
   ========================================================= */

function calculateRentalDays() {
  if (!startDate.value || !endDate.value) {
    return null;
  }

  const start = new Date(`${startDate.value}T00:00:00`);

  const end = new Date(`${endDate.value}T00:00:00`);

  const difference = end.getTime() - start.getTime();

  const days = Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;

  return days;
}

/* =========================================================
   BOOKING SUMMARY
   ========================================================= */

function updateBookingSummary() {
  const camera = cameras.find((item) => item.id === cameraSelect.value);

  summaryCamera.textContent = camera ? camera.name : "-";

  const duration = calculateRentalDays();

  summaryDuration.textContent = duration
    ? `${duration} day${duration > 1 ? "s" : ""}`
    : "-";
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
  const errors = document.querySelectorAll(".error-message");

  errors.forEach((error) => {
    error.textContent = "";
  });

  const invalidInputs = document.querySelectorAll(".input-error");

  invalidInputs.forEach((input) => {
    input.classList.remove("input-error");
  });

  agreementError.textContent = "";
}

function showFieldError(input, message) {
  input.classList.add("input-error");

  const parent = input.closest(".form-group");

  if (!parent) return;

  const error = parent.querySelector(".error-message");

  if (error) {
    error.textContent = message;
  }
}

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

    if (!input.value.trim()) {
      showFieldError(input, field.message);

      isValid = false;
    }
  });

  // Date validation
  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    showFieldError(
      endDate,
      "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
    );

    isValid = false;
  }

  // WhatsApp number validation
  const whatsapp = document.getElementById("whatsapp");

  if (whatsapp.value && !/^[0-9+\-\s()]{8,20}$/.test(whatsapp.value)) {
    showFieldError(whatsapp, "Masukkan nomor WhatsApp yang valid.");

    isValid = false;
  }

  // Supporting documents
  const ktpCheck = document.getElementById("ktpCheck");
  const hotelCheck = document.getElementById("hotelCheck");
  const flightCheck = document.getElementById("flightCheck");

  const hasAtLeastOneDocument =
    ktpCheck.checked || hotelCheck.checked || flightCheck.checked;

  if (!hasAtLeastOneDocument) {
    ktpCheck.closest(".checkbox-item")?.classList.add("input-error");

    hotelCheck.closest(".checkbox-item")?.classList.add("input-error");

    flightCheck.closest(".checkbox-item")?.classList.add("input-error");

    isValid = false;
  }

  // Agreement
  if (!agreement.checked) {
    agreementError.textContent = "Kamu harus menyetujui ketentuan booking.";

    isValid = false;
  }

  return isValid;
}

/* =========================================================
   BOOKING FORM SUBMIT
   ========================================================= */

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

  const duration = calculateRentalDays();

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
KTP / Passport: ✓
Bukti Booking Hotel: ✓
Detail Penerbangan: ✓

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
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", isOpen);
  });

  // Close mobile menu after clicking link.
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

function renderComment(comment) {
  const article = document.createElement("article");

  article.className = "comment-card";

  const stars = "★".repeat(comment.rating) + "☆".repeat(5 - comment.rating);

  article.innerHTML = `
        <div class="comment-header">

            <div>
                <strong>
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
