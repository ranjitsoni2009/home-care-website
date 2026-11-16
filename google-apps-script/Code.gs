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
const ENQUIRY_HEADERS = [
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
  "Status",
  "Assignee",
  "Payment Status",
];

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

  ensureEnquiriesSheet_();

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

function ensureEnquiriesSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(ENQUIRIES_SHEET);
  if (!sheet) sheet = ss.insertSheet(ENQUIRIES_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ENQUIRY_HEADERS);
  } else {
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getDisplayValues()[0]
      .map((header) => String(header || "").trim());
    ENQUIRY_HEADERS.forEach((header) => {
      if (headers.includes(header)) return;
      const column = sheet.getLastColumn() + 1;
      sheet.getRange(1, column).setValue(header);
      headers.push(header);
      const defaultValue =
        header === "Status"
          ? "Pending"
          : header === "Payment Status"
            ? "Unpaid"
            : "";
      if (defaultValue && sheet.getLastRow() > 1) {
        sheet
          .getRange(2, column, sheet.getLastRow() - 1, 1)
          .setValue(defaultValue);
      }
    });
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function getHeaderColumns_(sheet) {
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .reduce((columns, header, index) => {
      columns[String(header || "").trim()] = index;
      return columns;
    }, {});
}

function createAdminSession_(admin) {
  const token = Utilities.getUuid().replace(/-/g, "");
  CacheService.getScriptCache().put(
    "admin_session_" + token,
    JSON.stringify({ email: admin.email, role: admin.role }),
    21600,
  );
  return token;
}

function getAdminSession_(token) {
  const value = String(token || "");
  if (!value) return null;
  const session = CacheService.getScriptCache().get("admin_session_" + value);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (error) {
    return null;
  }
}

function getBookings_() {
  const sheet = ensureEnquiriesSheet_();
  if (!sheet || sheet.getLastRow() < 2) return [];
  const columns = getHeaderColumns_(sheet);
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getValues();
  return rows
    .map((row, index) => {
      const value = (header) => row[columns[header]];
      return {
        id: index + 2,
        timestamp: value("Timestamp")
          ? new Date(value("Timestamp")).toISOString()
          : "",
        name: String(value("Name") || ""),
        phone: String(value("Phone") || ""),
        email: String(value("Email") || ""),
        preferredDate: String(value("Preferred Date") || ""),
        preferredTime: String(value("Preferred Time") || ""),
        service: String(value("Service") || ""),
        address: String(value("Address") || ""),
        requirement: String(value("Requirement") || ""),
        source: String(value("Source") || "website"),
        status: String(value("Status") || "Pending"),
        assignee: String(value("Assignee") || ""),
        paymentStatus: String(value("Payment Status") || "Unpaid"),
      };
    })
    .filter((booking) => booking.timestamp || booking.name || booking.phone);
}

function getVendors_() {
  const sheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VENDORS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const columns = getHeaderColumns_(sheet);
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getDisplayValues();
  return rows
    .map((row) => {
      const value = (header) => row[columns[header]];
      const providerName = String(value("Provider Name") || "").trim();
      const phone = String(value("Phone") || "").trim();
      const status = String(value("Status") || "Pending").trim();
      return {
        providerName,
        contactPerson: String(value("Contact Person") || ""),
        phone,
        serviceCategory: String(value("Service Category") || ""),
        status,
        assigneeKey: providerName && phone ? `${providerName} (${phone})` : "",
      };
    })
    .filter(
      (vendor) =>
        vendor.assigneeKey && !/^(rejected|inactive)$/i.test(vendor.status),
    );
}

function updateBooking_(p) {
  const rowNumber = Number(p.id);
  const status = String(p.status || "").trim();
  const assignee = String(p.assignee || "").trim();
  const paymentStatus = String(p.paymentStatus || "").trim();
  const allowedStatuses = [
    "Pending",
    "Assigned",
    "In Progress",
    "Completed",
    "Cancelled",
  ];
  const allowedPaymentStatuses = ["Unpaid", "Paid", "Refunded", "Failed"];
  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    return { ok: false, error: "Invalid booking." };
  }
  if (
    !allowedStatuses.includes(status) ||
    !allowedPaymentStatuses.includes(paymentStatus)
  ) {
    return { ok: false, error: "Select valid booking and payment statuses." };
  }
  if (
    assignee &&
    !getVendors_().some((vendor) => vendor.assigneeKey === assignee)
  ) {
    return { ok: false, error: "Select a vendor from the vendor list." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureEnquiriesSheet_();
    if (rowNumber > sheet.getLastRow())
      return { ok: false, error: "Booking not found." };
    const columns = getHeaderColumns_(sheet);
    [
      ["Status", status],
      ["Assignee", assignee],
      ["Payment Status", paymentStatus],
    ].forEach(([header, value]) =>
      sheet.getRange(rowNumber, columns[header] + 1).setValue(value),
    );
    return { ok: true, message: "Booking updated." };
  } finally {
    lock.releaseLock();
  }
}

function createBooking_(p) {
  const name = String(p.name || "").trim();
  const phone = String(p.phone || "").trim();
  const service = String(p.service || "").trim();
  const assignee = String(p.assignee || "").trim();
  if (!name || !phone || !service) {
    return {
      ok: false,
      error: "Customer name, phone, and service are required.",
    };
  }
  if (
    assignee &&
    !getVendors_().some((vendor) => vendor.assigneeKey === assignee)
  ) {
    return { ok: false, error: "Select a vendor from the vendor list." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ensureEnquiriesSheet_();
    const columns = getHeaderColumns_(sheet);
    const row = new Array(sheet.getLastColumn()).fill("");
    const fields = {
      Timestamp: new Date(),
      Name: name,
      Phone: phone,
      Service: service,
      Source: "admin",
      Status: assignee ? "Assigned" : "Pending",
      Assignee: assignee,
      "Payment Status": "Unpaid",
    };
    Object.keys(fields).forEach((header) => {
      row[columns[header]] = fields[header];
    });
    sheet.appendRow(row);
    return { ok: true, id: sheet.getLastRow(), message: "Booking created." };
  } finally {
    lock.releaseLock();
  }
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

  const admin = {
    name: String(match[1] || ""),
    email: String(match[2] || ""),
    role: String(match[4] || "Admin"),
  };
  admin.token = createAdminSession_(admin);
  return {
    ok: true,
    message: "Login successful.",
    admin,
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
      JSON.stringify({ ok: false, error: "Sign in to access bookings." }),
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
      const session = getAdminSession_(p.token);
      if (!session || session.role !== "Super Admin") {
        return ContentService.createTextOutput(
          JSON.stringify({
            ok: false,
            error: "Super Admin access is required.",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(
        JSON.stringify(registerAdmin_(p)),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "register-vendor") {
      return ContentService.createTextOutput(
        JSON.stringify(registerVendor_(p)),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (
      [
        "get-bookings",
        "get-vendors",
        "update-booking",
        "create-booking",
      ].includes(action)
    ) {
      const session = getAdminSession_(p.token);
      if (!session) {
        return ContentService.createTextOutput(
          JSON.stringify({
            ok: false,
            error: "Your admin session has expired. Sign in again.",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }
      let result;
      if (action === "get-bookings")
        result = { ok: true, bookings: getBookings_() };
      if (action === "get-vendors")
        result = { ok: true, vendors: getVendors_() };
      if (action === "update-booking") result = updateBooking_(p);
      if (action === "create-booking") result = createBooking_(p);
      return ContentService.createTextOutput(
        JSON.stringify(result),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = ensureEnquiriesSheet_();
    const columns = getHeaderColumns_(sheet);
    const row = new Array(sheet.getLastColumn()).fill("");
    const fields = {
      Timestamp: new Date(),
      Name: p.name || "",
      Phone: p.phone || "",
      Email: p.email || "",
      "Preferred Date": p.preferredDate || "",
      "Preferred Time": p.preferredTime || "",
      Service: p.service || p.selectedService || "",
      Address: p.address || "",
      Requirement: p.requirement || "",
      Source: p.source || "website",
      Status: "Pending",
      Assignee: "",
      "Payment Status": "Unpaid",
    };
    Object.keys(fields).forEach((header) => {
      row[columns[header]] = fields[header];
    });
    sheet.appendRow(row);
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
