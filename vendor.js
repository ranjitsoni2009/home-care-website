const vendorForm = document.querySelector("#vendorForm");
const vendorFrame = document.querySelector("#vendorSubmitFrame");
const vendorStatus = document.querySelector("#vendorStatus");
let vendorSubmissionPending = false;

if (window.HOME_CARE_CONFIG?.APPS_SCRIPT_URL) {
  vendorForm.action = window.HOME_CARE_CONFIG.APPS_SCRIPT_URL;
}

vendorForm.addEventListener("submit", () => {
  vendorSubmissionPending = true;
  vendorStatus.hidden = true;
  const submitButton = vendorForm.querySelector(".submit-btn");
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
});

vendorFrame.addEventListener("load", () => {
  if (!vendorSubmissionPending) return;
  vendorSubmissionPending = false;
  vendorForm.hidden = true;
  vendorStatus.hidden = false;
});