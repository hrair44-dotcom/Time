import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === '1';

const SHEET = {
  spreadsheetId: '1rzdFlQujYzNLtatBlc2TXNnAGkbZDgmS4zzToSeF3zg',
  rawdataGid: '750856257',
  employeeGid: '2031942902'
};

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

function sheetCsvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${SHEET.spreadsheetId}/export?format=csv&gid=${gid}&single=true&cachebust=${Date.now()}`;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function norm(value) {
  return String(value ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const ALIASES = {
  rd: ['รอบ'],
  code: ['รหัส'],
  prefix: ['คำนำ'],
  fname: ['ชื่อ'],
  lname: ['สกุล'],
  nm: ['ชื่อเล่น'],
  sec: ['sec.', 'sec', 'แผนก'],
  dept: ['dept.', 'dept', 'ฝ่าย'],
  date: ['วันที่ลา'],
  v: ['พักร้อน'],
  si: ['ป่วย'],
  p: ['กิจ'],
  pu: ['กิจ-ไม่ จ.', 'กิจ-ไม่จ่าย', 'ไม่จ่าย'],
  ab: ['ขาดงาน', 'ขาด'],
  ot: ['อื่นๆ', 'อื่น'],
  lt: ['สาย']
};

function findHeaderRow(rows, keys) {
  return rows.findIndex(row => {
    const cells = row.map(norm);
    return keys.every(key => ALIASES[key].some(label => cells.includes(norm(label))));
  });
}

function buildColMap(header) {
  const cells = header.map(norm);
  const map = {};
  for (const [key, labels] of Object.entries(ALIASES)) {
    const idx = cells.findIndex(cell => labels.some(label => cell === norm(label)));
    if (idx !== -1) map[key] = idx;
  }
  return map;
}

function numSafe(value) {
  if (value == null || value === '') return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function expandYear(y) {
  const n = Number(y);
  if (n > 2400) return n - 543;
  if (n < 100) return n + 2000;
  return n;
}

function dateParts(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const first = Number(m[1]);
    const second = Number(m[2]);
    const year = expandYear(m[3]);
    if (first > 12) return { y: year, m: second, d: first };
    return { y: year, m: first, d: second };
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return { y: parsed.getFullYear(), m: parsed.getMonth() + 1, d: parsed.getDate() };
  }
  return null;
}

function lateMinutes(value) {
  if (!value) return 0;
  const s = String(value).trim();
  const m = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0);
  const n = numSafe(s);
  return n < 1 ? n * 24 * 60 : 0;
}

async function fetchRows(gid) {
  const res = await fetch(sheetCsvUrl(gid));
  if (!res.ok) throw new Error(`Google Sheet responded ${res.status}`);
  const text = await res.text();
  if (/^\s*</.test(text)) throw new Error('Google returned HTML instead of CSV');
  return parseCSV(text);
}

function parseRawdata(rows) {
  const headerIdx = findHeaderRow(rows, ['rd', 'code', 'date']);
  if (headerIdx === -1) throw new Error('Rawdata header not found');
  const col = buildColMap(rows[headerIdx]);

  return rows.slice(headerIdx + 1).flatMap((row, idx) => {
    const code = String(row[col.code] ?? '').replace(/,/g, '').trim();
    if (!/^\d+$/.test(code)) return [];

    const dp = dateParts(col.date != null ? row[col.date] : '');
    const dt = dp ? `${dp.y}-${pad2(dp.m)}-${pad2(dp.d)}` : null;
    const mo = dp ? `${dp.y}-${pad2(dp.m)}` : null;
    const prefix = col.prefix != null ? row[col.prefix] ?? '' : '';
    const fname = col.fname != null ? row[col.fname] ?? '' : '';
    const lname = col.lname != null ? row[col.lname] ?? '' : '';
    const nm = col.nm != null ? String(row[col.nm] ?? '').trim() : code;
    const full = `${prefix}${fname} ${lname}`.trim() || nm || code;

    const record = {
      rd: col.rd != null ? numSafe(row[col.rd]) : 0,
      code,
      nm: nm || code,
      full_name: full,
      sec: col.sec != null ? String(row[col.sec] ?? '').trim() : '-',
      dept: col.dept != null ? String(row[col.dept] ?? '').trim() : '-',
      dt,
      mo,
      v: col.v != null ? numSafe(row[col.v]) : 0,
      si: col.si != null ? numSafe(row[col.si]) : 0,
      p: col.p != null ? numSafe(row[col.p]) : 0,
      pu: col.pu != null ? numSafe(row[col.pu]) : 0,
      ab: col.ab != null ? numSafe(row[col.ab]) : 0,
      ot: col.ot != null ? numSafe(row[col.ot]) : 0,
      lt: col.lt != null ? lateMinutes(row[col.lt]) : 0
    };
    record.row_hash = crypto
      .createHash('sha1')
      .update(JSON.stringify([idx, record.rd, record.code, record.dt, record.sec, record.v, record.si, record.p, record.pu, record.ab, record.ot, record.lt]))
      .digest('hex');
    return [record];
  });
}

function parseEmployees(rows) {
  const headerIdx = findHeaderRow(rows, ['code', 'sec']);
  if (headerIdx === -1) throw new Error('Employee sheet header not found');
  const col = buildColMap(rows[headerIdx]);
  const employees = new Map();

  rows.slice(headerIdx + 1).forEach(row => {
    const code = String(row[col.code] ?? '').replace(/,/g, '').trim();
    if (!/^\d+$/.test(code)) return;
    const prefix = col.prefix != null ? row[col.prefix] ?? '' : '';
    const fname = col.fname != null ? row[col.fname] ?? '' : '';
    const lname = col.lname != null ? row[col.lname] ?? '' : '';
    const nm = col.nm != null ? String(row[col.nm] ?? '').trim() : code;
    employees.set(code, {
      code,
      sec: col.sec != null ? String(row[col.sec] ?? '').trim() : '-',
      dept: col.dept != null ? String(row[col.dept] ?? '').trim() : '-',
      nm,
      full_name: `${prefix}${fname} ${lname}`.trim() || nm || code
    });
  });

  return [...employees.values()];
}

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed: ${res.status} ${text}`);
  }
  return res;
}

async function upsertInBatches(table, rows, conflictKey) {
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await supabaseRequest(`${table}?on_conflict=${conflictKey}`, {
      method: 'POST',
      body: JSON.stringify(batch)
    });
    console.log(`Upserted ${table}: ${Math.min(i + batch.length, rows.length)}/${rows.length}`);
  }
}

const rawRows = await fetchRows(SHEET.rawdataGid);
const employeeRows = await fetchRows(SHEET.employeeGid);
const rawdata = parseRawdata(rawRows);
const employees = parseEmployees(employeeRows);

console.log(`Parsed rawdata rows: ${rawdata.length}`);
console.log(`Parsed employees: ${employees.length}`);

if (DRY_RUN) {
  console.log('DRY_RUN=1, skipped Supabase upload');
  process.exit(0);
}

await upsertInBatches('rawdata', rawdata, 'row_hash');
await upsertInBatches('employee_master', employees, 'code');

console.log('Sync complete');
