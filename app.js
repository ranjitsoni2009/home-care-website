const CONFIG = window.HOME_CARE_CONFIG || {};
const FALLBACK_SERVICES = [
  ["Electrician", "Electrical repair & installation", "⚡"],
  ["AC Repair & Service", "AC servicing & repair", "❄️"],
  ["Plumbing", "Plumbing & fittings", "🔧"],
  ["Washing Machine Repair", "Washing machine repair", "🧺"],
  ["Refrigerator Repair", "Fridge repair & service", "🧊"],
  ["RO Service", "RO / water purifier service", "💧"],
  ["House Cleaning", "Home cleaning", "🏠"],
  ["Deep Cleaning", "Deep cleaning service", "🧹"],
  ["Sofa Cleaning", "Sofa & upholstery cleaning", "🛋️"],
  ["Bathroom Cleaning", "Bathroom cleaning", "🚿"],
  ["Kitchen Cleaning", "Kitchen cleaning", "🍳"],
  ["Water Tank Cleaning", "Water tank cleaning", "🛢️"],
  ["CCTV Installation", "CCTV installation & setup", "📹"],
  ["Salon Prime", "At-home salon service", "💇"],
  ["Painting", "Home painting service", "🎨"],
  ["Carpentry", "Furniture & carpentry work", "🪚"],
];
const $ = (s) => document.querySelector(s);
const grid = $("#servicesGrid");
const select = $("#serviceSelect");
const modal = $("#enquiryModal");
const form = $("#enquiryForm");
const success = $("#successMessage");
const errorBox = $("#errorMessage");
const preferredDateInput = $("#preferredDate");

function hideStatusMessages() {
  success.hidden = true;
  errorBox.hidden = true;
  errorBox.textContent = "";
  errorBox.style.display = "none";
}

function normalizeService(item) {
  if (Array.isArray(item))
    return {
      name: item[0],
      description: item[1] || "Professional home service",
      icon: item[2] || "🔧",
    };
  return {
    name: item.name || item.service || "Service",
    description: item.description || "Professional home service",
    icon: item.icon || "🔧",
  };
}
function renderServices(raw) {
  const services = raw.map(normalizeService).filter((x) => x.name);
  grid.innerHTML = services
    .map(
      (s) =>
        `<button class="service-card" type="button" data-service="${escapeHtml(s.name)}"><div class="service-icon">${escapeHtml(s.icon)}</div><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description)}</p></button>`,
    )
    .join("");
  select.innerHTML =
    '<option value="">Select a service</option>' +
    services
      .map(
        (s) =>
          `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`,
      )
      .join("");
  grid
    .querySelectorAll("[data-service]")
    .forEach((btn) =>
      btn.addEventListener("click", () => openModal(btn.dataset.service)),
    );
  $("#serviceLoading").style.display = "none";
}
function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
function loadServices() {
  const url = CONFIG.APPS_SCRIPT_URL;
  if (!url || url.includes("YOUR_GOOGLE")) {
    renderServices(FALLBACK_SERVICES);
    return;
  }
  const callback = "homeCareServicesCallback";
  window[callback] = (data) => {
    try {
      renderServices(
        Array.isArray(data) ? data : data.services || FALLBACK_SERVICES,
      );
    } catch (e) {
      renderServices(FALLBACK_SERVICES);
    }
  };
  const script = document.createElement("script");
  script.src = `${url}${url.includes("?") ? "&" : "?"}action=services&callback=${callback}`;
  script.onerror = () => renderServices(FALLBACK_SERVICES);
  document.body.appendChild(script);
  setTimeout(() => {
    if ($("#serviceLoading").style.display !== "none")
      renderServices(FALLBACK_SERVICES);
  }, 6000);
}
function openModal(service = "") {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  hideStatusMessages();
  form.style.display = "block";
  if (service) {
    select.value = service;
    $("#selectedService").value = service;
  } else if (select.value) $("#selectedService").value = select.value;
  setTimeout(() => form.querySelector('input[name="name"]').focus(), 100);
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function setMinPreferredDate() {
  if (!preferredDateInput) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  preferredDateInput.min = `${yyyy}-${mm}-${dd}`;
}

function applyFieldValidations() {
  const nameInput = form.querySelector('input[name="name"]');
  const phoneInput = form.querySelector('input[name="phone"]');

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, "");
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  if (preferredDateInput) {
    preferredDateInput.addEventListener("change", () => {
      if (!preferredDateInput.value) return;
      const selected = new Date(preferredDateInput.value + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        preferredDateInput.value = "";
        preferredDateInput.setCustomValidity("Please select today or a future date.");
        preferredDateInput.reportValidity();
      } else {
        preferredDateInput.setCustomValidity("");
      }
    });
  }
}
document
  .querySelectorAll("[data-book-service]")
  .forEach((b) => b.addEventListener("click", () => openModal()));
document
  .querySelectorAll("[data-close-modal]")
  .forEach((b) => b.addEventListener("click", closeModal));
select.addEventListener(
  "change",
  () => ($("#selectedService").value = select.value),
);
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nameInput = form.querySelector('input[name="name"]');
  const phoneInput = form.querySelector('input[name="phone"]');

  if (!nameInput || !phoneInput) {
    return;
  }

  const nameValue = (nameInput.value || "").trim();
  const phoneValue = (phoneInput.value || "").trim();

  if (!nameValue || !/^[A-Za-z\s]+$/.test(nameValue)) {
    nameInput.focus();
    nameInput.setCustomValidity("Name is required and only letters and spaces are allowed.");
    nameInput.reportValidity();
    return;
  }

  if (!phoneValue || !/^\d{10}$/.test(phoneValue)) {
    phoneInput.focus();
    phoneInput.setCustomValidity("Mobile number is required and must contain exactly 10 digits.");
    phoneInput.reportValidity();
    return;
  }

  nameInput.setCustomValidity("");
  phoneInput.setCustomValidity("");

  $("#selectedService").value = select.value;
  const submitBtn = form.querySelector(".submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";
  hideStatusMessages();

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      mode: "cors",
      headers: { Accept: "application/json" },
    });

    const responseText = await response.text();
    let payload = {};

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch (e) {
        payload = {};
      }
    }

    if (!response.ok) {
      throw new Error(payload.error || payload.message || "Unable to send enquiry. Please try again.");
    }

    if (payload && payload.ok === false) {
      throw new Error(payload.error || payload.message || "Unable to send enquiry. Please try again.");
    }

    form.reset();
    form.style.display = "none";
    success.hidden = false;
  } catch (err) {
    const message = err && err.message ? String(err.message).trim() : "";
    if (message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
      errorBox.style.display = "block";
    } else {
      errorBox.textContent = "";
      errorBox.hidden = true;
      errorBox.style.display = "none";
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Enquiry";
  }
});
$("#year").textContent = new Date().getFullYear();
setMinPreferredDate();
applyFieldValidations();
loadServices();
