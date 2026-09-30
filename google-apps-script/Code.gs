/**
 * Home Care Service - Google Sheets backend
 *
 * SHEET 1: Services
 * Columns: Service | Description | Icon | Active
 *
 * SHEET 2: Enquiries
 * Automatically created with headers by setup().
 *
 * SHEET 3: Admins
 * Columns: Created At | Name | Email | PasswordHash | Role
 */

const SPREADSHEET_ID = "1mw0NJxQR5RCX9jaZqLUF11Jt_y56llBVN-VsxYtMS4U";
const SERVICES_SHEET = "Services";
const ENQUIRIES_SHEET = "Enquiries";
const ADMINS_SHEET = "Admins";
const VENDORS_SHEET = "vendor";

function hashPassword_(value) {
  const raw = value == null ? "" : String(value);
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    raw,
    Utilities.Charset.UTF_8,
  );
  return digest
    .map((byte) => ((byte + 256) % 256).toString(16).padStart(2, "0"))
    .join("");
}

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  let services = ss.getSheetByName(SERVICES_SHEET);
  if (!services) services = ss.insertSheet(SERVICES_SHEET);
  if (services.getLastRow() === 0) {
    services.appendRow(["Service", "Description", "Icon", "Active"]);
    [
      ["Electrician", "Electrical repair & installation", "⚡", true],
      ["AC Repair & Service", "AC servicing & repair", "❄️", true],
      ["Plumbing", "Plumbing & fittings", "🔧", true],
      ["Washing Machine Repair", "Washing machine repair", "🧺", true],
      ["Refrigerator Repair", "Fridge repair & service", "🧊", true],
      ["RO Service", "RO / water purifier service", "💧", true],
      ["House Cleaning", "Home cleaning", "🏠", true],
      ["Deep Cleaning", "Deep cleaning service", "🧹", true],
      ["Sofa Cleaning", "Sofa & upholstery cleaning", "🛋️", true],
      ["Bathroom Cleaning", "Bathroom cleaning", "🚿", true],
      ["Kitchen Cleaning", "Kitchen cleaning", "🍳", true],
      ["Water Tank Cleaning", "Water tank cleaning", "🛢️", true],
      ["CCTV Installation", "CCTV installation & setup", "📹", true],
      ["Salon Prime", "At-home salon service", "💇", true],
      ["Painting", "Home painting service", "🎨", true],
      ["Carpentry", "Furniture & carpentry work", "🪚", true],
    ].forEach((r) => services.appendRow(r));
  }

  let enquiries = ss.getSheetByName(ENQUIRIES_SHEET);
  if (!enquiries) enquiries = ss.insertSheet(ENQUIRIES_SHEET);
  if (enquiries.getLastRow() === 0) {
    enquiries.appendRow([
      "Timestamp",
      "Name",
      "Phone",
      "Email",
      "Preferred Date",
      "Preferred Time",
      "Service",
      "Address",
      "Requirement",
      "Source",
    ]);
    enquiries.setFrozenRows(1);
  }

  let vendors = ss.getSheetByName(VENDORS_SHEET);
  if (!vendors) vendors = ss.insertSheet(VENDORS_SHEET);
  if (vendors.getLastRow() === 0) {
    vendors.appendRow([
      "Registered At",
      "Provider Name",
      "Contact Person",
      "Phone",
      "Email",
      "Service Category",
      "Experience Years",
      "Service Areas",
      "Address",
      "Additional Details",
      "Status",
    ]);
    vendors.setFrozenRows(1);
  }

  let admins = ss.getSheetByName(ADMINS_SHEET);
  if (!admins) admins = ss.insertSheet(ADMINS_SHEET);
  if (admins.getLastRow() === 0) {
    admins.appendRow(["Created At", "Name", "Email", "PasswordHash", "Role"]);
    admins.setFrozenRows(1);
    admins.appendRow([
      new Date(),
      "Super Admin",
      "admin@gwaliorservice.in",
      hashPassword_("password123"),
      "Super Admin",
    ]);
  }
}

function getBookings_() {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ENQUIRIES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  return rows
    .filter((row) => row[0] || row[1] || row[2])
    .map((row, index) => ({
      id: index + 1,
      timestamp: row[0] ? new Date(row[0]).toISOString() : "",
      name: String(row[1] || ""),
      phone: String(row[2] || ""),
      email: String(row[3] || ""),
      preferredDate: String(row[4] || ""),
      preferredTime: String(row[5] || ""),
      service: String(row[6] || ""),
      address: String(row[7] || ""),
      requirement: String(row[8] || ""),
      source: String(row[9] || "website"),
    }));
}

function loginAdmin_(p) {
  const email = String(p.email || "")
    .trim()
    .toLowerCase();
  const password = String(p.password || "");
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ADMINS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    return { ok: false, error: "No admin account found." };
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const match = rows.find(
    (row) =>
      String(row[2] || "")
        .trim()
        .toLowerCase() === email,
  );
  if (!match) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (hashPassword_(password) !== String(match[3] || "")) {
    return { ok: false, error: "Invalid email or password." };
  }

  return {
    ok: true,
    message: "Login successful.",
    admin: {
      name: String(match[1] || ""),
      email: String(match[2] || ""),
      role: String(match[4] || "Admin"),
    },
  };
}

function registerAdmin_(p) {
  const name = String(p.name || "").trim();
  const email = String(p.email || "")
    .trim()
    .toLowerCase();
  const password = String(p.password || "");
  const role = String(p.role || "Admin").trim();

  if (!name || !email || !password) {
    return { ok: false, error: "Name, email and password are required." };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(ADMINS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ADMINS_SHEET);
    sheet.appendRow(["Created At", "Name", "Email", "PasswordHash", "Role"]);
    sheet.setFrozenRows(1);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Created At", "Name", "Email", "PasswordHash", "Role"]);
    sheet.setFrozenRows(1);
  }

  const rows =
    sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues()
      : [];
  const exists = rows.some(
    (row) =>
      String(row[2] || "")
        .trim()
        .toLowerCase() === email,
  );
  if (exists) {
    return { ok: false, error: "This email is already registered." };
  }

  sheet.appendRow([
    new Date(),
    name,
    email,
    hashPassword_(password),
    role || "Admin",
  ]);
  return {
    ok: true,
    message: "Admin account created successfully.",
    admin: { name, email, role: role || "Admin" },
  };
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "services";
  if (action === "services") {
    const services = getServices_();
    const callback = e.parameter.callback;
    const payload = JSON.stringify(services);
    if (callback) {
      return ContentService.createTextOutput(
        callback + "(" + payload + ");",
      ).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(payload).setMimeType(
      ContentService.MimeType.JSON,
    );
  }

  if (action === "bookings") {
    return ContentService.createTextOutput(
      JSON.stringify(getBookings_()),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const p = e.parameter || {};
    const action = String(p.action || "").toLowerCase();

    if (action === "login") {
      return ContentService.createTextOutput(
        JSON.stringify(loginAdmin_(p)),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "register-admin") {
      return ContentService.createTextOutput(
        JSON.stringify(registerAdmin_(p)),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "register-vendor") {
      return ContentService.createTextOutput(
        JSON.stringify(registerVendor_(p)),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet =
      ss.getSheetByName(ENQUIRIES_SHEET) || ss.insertSheet(ENQUIRIES_SHEET);
    if (sheet.getLastRow() === 0)
      sheet.appendRow([
        "Timestamp",
        "Name",
        "Phone",
        "Email",
        "Preferred Date",
        "Preferred Time",
        "Service",
        "Address",
        "Requirement",
        "Source",
      ]);
    sheet.appendRow([
      new Date(),
      p.name || "",
      p.phone || "",
      p.email || "",
      p.preferredDate || "",
      p.preferredTime || "",
      p.service || p.selectedService || "",
      p.address || "",
      p.requirement || "",
      p.source || "website",
    ]);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, message: "Enquiry saved" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function registerVendor_(p) {
  const providerName = String(p.providerName || "").trim();
  const contactPerson = String(p.contactPerson || "").trim();
  const phone = String(p.phone || "").trim();
  const email = String(p.email || "").trim();
  const serviceCategory = String(p.serviceCategory || "").trim();
  const experienceYears = String(p.experienceYears || "").trim();
  const serviceAreas = String(p.serviceAreas || "").trim();
  const address = String(p.address || "").trim();
  const details = String(p.details || "").trim();

  if (
    !providerName ||
    !contactPerson ||
    !phone ||
    !serviceCategory ||
    !serviceAreas ||
    !address
  ) {
    return {
      ok: false,
      error: "Please complete all required registration fields.",
    };
  }
  if (!/^\d{10}$/.test(phone)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(VENDORS_SHEET);
  if (!sheet) sheet = ss.insertSheet(VENDORS_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Registered At",
      "Provider Name",
      "Contact Person",
      "Phone",
      "Email",
      "Service Category",
      "Experience Years",
      "Service Areas",
      "Address",
      "Additional Details",
      "Status",
    ]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    new Date(),
    providerName,
    contactPerson,
    phone,
    email,
    serviceCategory,
    experienceYears,
    serviceAreas,
    address,
    details,
    "Pending",
  ]);
  return { ok: true, message: "Registration received." };
}

function getServices_() {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SERVICES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  return rows
    .filter(
      (r) =>
        r[0] &&
        String(r[3]).toLowerCase() !== "false" &&
        String(r[3]).toLowerCase() !== "no",
    )
    .map((r) => ({
      name: String(r[0]),
      description: String(r[1] || ""),
      icon: String(r[2] || "🔧"),
    }));
}
