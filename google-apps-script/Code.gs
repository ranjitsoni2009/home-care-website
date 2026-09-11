/**
 * Home Care Service - Google Sheets backend
 *
 * SHEET 1: Services
 * Columns: Service | Description | Icon | Active
 *
 * SHEET 2: Enquiries
 * Automatically created with headers by setup().
 */

const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SERVICES_SHEET = 'Services';
const ENQUIRIES_SHEET = 'Enquiries';

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let services = ss.getSheetByName(SERVICES_SHEET);
  if (!services) services = ss.insertSheet(SERVICES_SHEET);
  if (services.getLastRow() === 0) {
    services.appendRow(['Service','Description','Icon','Active']);
    [
      ['Electrician','Electrical repair & installation','⚡',true],
      ['AC Repair & Service','AC servicing & repair','❄️',true],
      ['Plumbing','Plumbing & fittings','🔧',true],
      ['Washing Machine Repair','Washing machine repair','🧺',true],
      ['Refrigerator Repair','Fridge repair & service','🧊',true],
      ['RO Service','RO / water purifier service','💧',true],
      ['House Cleaning','Home cleaning','🏠',true],
      ['Deep Cleaning','Deep cleaning service','🧹',true],
      ['Sofa Cleaning','Sofa & upholstery cleaning','🛋️',true],
      ['Bathroom Cleaning','Bathroom cleaning','🚿',true],
      ['Kitchen Cleaning','Kitchen cleaning','🍳',true],
      ['Water Tank Cleaning','Water tank cleaning','🛢️',true],
      ['CCTV Installation','CCTV installation & setup','📹',true],
      ['Salon Prime','At-home salon service','💇',true],
      ['Painting','Home painting service','🎨',true],
      ['Carpentry','Furniture & carpentry work','🪚',true]
    ].forEach(r => services.appendRow(r));
  }

  let enquiries = ss.getSheetByName(ENQUIRIES_SHEET);
  if (!enquiries) enquiries = ss.insertSheet(ENQUIRIES_SHEET);
  if (enquiries.getLastRow() === 0) {
    enquiries.appendRow(['Timestamp','Name','Phone','Email','Preferred Date','Preferred Time','Service','Address','Requirement','Source']);
    enquiries.setFrozenRows(1);
  }
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'services';
  if (action === 'services') {
    const services = getServices_();
    const callback = e.parameter.callback;
    const payload = JSON.stringify(services);
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + payload + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const p = e.parameter || {};
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(ENQUIRIES_SHEET) || ss.insertSheet(ENQUIRIES_SHEET);
    if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp','Name','Phone','Email','Preferred Date','Preferred Time','Service','Address','Requirement','Source']);
    sheet.appendRow([
      new Date(), p.name || '', p.phone || '', p.email || '', p.preferredDate || '', p.preferredTime || '',
      p.service || p.selectedService || '', p.address || '', p.requirement || '', p.source || 'website'
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok:true,message:'Enquiry saved'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getServices_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SERVICES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues();
  return rows.filter(r => r[0] && String(r[3]).toLowerCase() !== 'false' && String(r[3]).toLowerCase() !== 'no')
    .map(r => ({name:String(r[0]),description:String(r[1] || ''),icon:String(r[2] || '🔧')}));
}
