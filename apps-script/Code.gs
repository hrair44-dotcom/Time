const CONFIG = {
  spreadsheetId: '1rzdFlQujYzNLtatBlc2TXNnAGkbZDgmS4zzToSeF3zg',
  rawdataSheetName: 'Rawdata',
  employeeSheetName: 'Y',
  oauthClientId: 'PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE',
  access: {
    'akkaraphol.c@gmail.com': ['PG'],
    'kaew1475@gmail.com': ['PG']
  }
};

function doGet(e) {
  const callback = safeCallback_(e.parameter.callback || 'callback');

  try {
    const idToken = String(e.parameter.idToken || '');
    if (!idToken) throw new Error('Missing Google ID token');

    const user = verifyGoogleIdToken_(idToken);
    const email = String(user.email || '').toLowerCase();
    const allowedSecs = CONFIG.access[email];
    if (!allowedSecs || !allowedSecs.length) {
      throw new Error('บัญชีนี้ยังไม่มีสิทธิ์เข้าดู dashboard');
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const rawSheet = spreadsheet.getSheetByName(CONFIG.rawdataSheetName);
    const employeeSheet = spreadsheet.getSheetByName(CONFIG.employeeSheetName);
    if (!rawSheet) throw new Error('ไม่พบชีต Rawdata');
    if (!employeeSheet) throw new Error('ไม่พบชีต Y');

    const rawRows = rawSheet.getDataRange().getDisplayValues();
    const employeeRows = employeeSheet.getDataRange().getDisplayValues();
    const filteredRows = filterRowsByAllowedSecs_(rawRows, allowedSecs, ['sec']);
    const employeeCount = countEmployeesByAllowedSecs_(employeeRows, allowedSecs);

    return jsonp_(callback, {
      ok: true,
      email: email,
      allowedSecs: allowedSecs,
      rows: filteredRows,
      employeeCount: employeeCount,
      sourceLabel: `Google Sheets / ${CONFIG.rawdataSheetName} (${allowedSecs.join(', ')})`
    });
  } catch (err) {
    return jsonp_(callback, {
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

function verifyGoogleIdToken_(idToken) {
  const response = UrlFetchApp.fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) {
    throw new Error('ยืนยันตัวตน Google ไม่สำเร็จ');
  }

  const payload = JSON.parse(response.getContentText());
  if (payload.aud !== CONFIG.oauthClientId) {
    throw new Error('OAuth Client ID ไม่ตรงกับ backend');
  }
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new Error('Google account นี้ยังไม่ได้ยืนยันอีเมล');
  }
  return payload;
}

function filterRowsByAllowedSecs_(rows, allowedSecs, headerNames) {
  const headerIdx = findHeaderIndex_(rows, headerNames);
  if (headerIdx === -1) throw new Error('ไม่พบหัวตาราง Sec. ใน Rawdata');

  const header = rows[headerIdx];
  const secIdx = findColumnIndex_(header, headerNames);
  const allowed = makeAllowedSet_(allowedSecs);

  return rows
    .slice(0, headerIdx + 1)
    .concat(rows.slice(headerIdx + 1).filter(row => allowed.has(norm_(row[secIdx]))));
}

function countEmployeesByAllowedSecs_(rows, allowedSecs) {
  const headerIdx = findHeaderIndex_(rows, ['แผนก', 'sec']);
  if (headerIdx === -1) throw new Error('ไม่พบหัวตารางแผนกในชีต Y');

  const header = rows[headerIdx];
  const codeIdx = findColumnIndex_(header, ['รหัส']);
  const secIdx = findColumnIndex_(header, ['แผนก', 'sec']);
  if (codeIdx === -1) throw new Error('ไม่พบคอลัมน์รหัสในชีต Y');
  if (secIdx === -1) throw new Error('ไม่พบคอลัมน์แผนกในชีต Y');

  const allowed = makeAllowedSet_(allowedSecs);
  const codes = new Set();
  rows.slice(headerIdx + 1).forEach(row => {
    const code = String(row[codeIdx] == null ? '' : row[codeIdx]).replace(/,/g, '').trim();
    const sec = norm_(row[secIdx]);
    if (/^\d+$/.test(code) && allowed.has(sec)) codes.add(code);
  });
  return codes.size;
}

function findHeaderIndex_(rows, names) {
  return rows.findIndex(row => findColumnIndex_(row, names) !== -1);
}

function findColumnIndex_(row, names) {
  const targets = names.map(norm_);
  return (row || []).findIndex(cell => targets.includes(norm_(cell)));
}

function makeAllowedSet_(secs) {
  return new Set(secs.map(norm_));
}

function norm_(value) {
  return String(value == null ? '' : value)
    .replace(/\uFEFF/g, '')
    .replace(/\./g, '')
    .trim()
    .toLowerCase();
}

function safeCallback_(name) {
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(name) ? name : 'callback';
}

function jsonp_(callback, data) {
  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(data)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
