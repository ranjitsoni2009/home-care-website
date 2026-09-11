# Home Care Service — Static Website + Google Sheets Backend

This website is based on the uploaded Home Care Service UX/poster. It is responsive and static: HTML + CSS + JavaScript. Service cards open an enquiry form. Enquiries are stored in Google Sheets, and the service dropdown/card list is loaded from a Google Sheet.

## What is included

- `index.html` — website and enquiry modal
- `styles.css` — responsive UI
- `app.js` — service loading + form interactions
- `assets/payment-qr.png` — QR image cropped from the supplied UX image
- `google-apps-script/Code.gs` — Google Apps Script backend for Google Sheets

## Google Sheet setup

1. Create a Google Sheet.
2. Copy the Sheet ID from its URL. Example: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`.
3. Open **Extensions → Apps Script**.
4. Paste `google-apps-script/Code.gs` into the Apps Script editor.
5. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your Sheet ID.
6. Save.
7. Run the `setup` function once and authorize it. This creates two sheets:
   - `Services`: `Service | Description | Icon | Active`
   - `Enquiries`: stores customer submissions.
8. In Apps Script choose **Deploy → New deployment → Web app**.
9. Execute as **Me** and set access to **Anyone** (or your required access policy).
10. Copy the deployed Web App URL.
11. In `index.html`, replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with that URL in both places: the form `action` and `HOME_CARE_CONFIG.APPS_SCRIPT_URL`.
12. Upload the website files to any static host (GitHub Pages, Netlify, Vercel static hosting, Firebase Hosting, your own web server, etc.).

## Managing services

You do NOT need to edit the HTML when adding/removing services. Edit the `Services` sheet instead:

| Service | Description | Icon | Active |
|---|---|---|---|
| Electrician | Electrical repair & installation | ⚡ | TRUE |
| AC Repair & Service | AC servicing & repair | ❄️ | TRUE |

Set `Active` to `FALSE` to hide a service from the website. Add a new row to make a new service appear.

## Payment QR

The site displays only a QR-code payment option. The QR asset was cropped from the uploaded reference image. Replace `assets/payment-qr.png` with your final merchant/payment QR before publishing if the supplied QR is not the live payment QR.

## Important production notes

- Replace the sample phone number `+91 99999 99999` with the business number.
- The Apps Script web app is the backend bridge; do not put Google service-account credentials or Google Sheets API secrets in the browser.
- Add server-side spam/rate limiting or a CAPTCHA before using this publicly at scale.
- For stronger reliability, add an enquiry ID/status column and an automated confirmation email/WhatsApp flow later.
