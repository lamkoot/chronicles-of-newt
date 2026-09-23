/* Chronicles of Newt — app.js
 * Een levensarchief. De data staat in een Google Sheet + Drive-map van de familie;
 * deze app is alleen het venster erop. Geen server, geen kosten.
 */
'use strict';

const CFG = Object.assign({ CLIENT_ID: '' }, window.CHRONICLES_CONFIG || {});
const QS = new URLSearchParams(location.search);
const DEMO = QS.has('demo') || !CFG.CLIENT_ID;
const VERSION = '1.0.0';
const SCOPE = 'https://www.googleapis.com/auth/drive';
const T_MEM = 'Herinneringen', T_SET = 'Instellingen', T_CH = 'Hoofdstukken';
const COLS = ['id','type','datum','titel','tekst','notitie','tags','favoriet','gezondheidstype','ernst','symptomen','medicatie','duur_dagen','media','auteur','aangemaakt','bijgewerkt','verwijderd'];
const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const FOLDER = 'application/vnd.google-apps.folder';
const PROP = 'chroniclesOfNewt';

/* ---------- icons ---------- */
const P = {
  plus:'<path d="M12 5v14M5 12h14"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  health:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/><path d="M3.5 12h4l2-3 3 6 2-3h6"/>',
  more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  star:'<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3L2.9 9.5l6.3-.9z"/>',
  flag:'<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
  quote:'<path d="M7 7H4v6h3l-1 4"/><path d="M17 7h-3v6h3l-1 4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  back:'<path d="M15 18l-6-6 6-6"/>',
  next:'<path d="M9 18l6-6-6-6"/>',
  cloud:'<path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  play:'<path d="M8 5v14l11-7z"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  printer:'<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  refresh:'<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15"/>',
  folder:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
};
const I = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

const TYPES = {
  mijlpaal:   { label: 'Mijlpaal',   plural: 'Mijlpalen',  icon: 'flag',   hint: 'Een eerste keer, een grote stap' },
  quote:      { label: 'Uitspraak',  plural: 'Uitspraken', icon: 'quote',  hint: 'Iets grappigs of wijs dat hij zei' },
  moment:     { label: 'Moment',     plural: 'Momenten',   icon: 'sun',    hint: 'Een herinnering, foto of gewoonte' },
  gezondheid: { label: 'Gezondheid', plural: 'Gezondheid', icon: 'health', hint: 'Ziek, vaccinatie, arts' },
};
const MILESTONES = ['Eerste lach','Eerste keer omrollen','Eerste tandje','Eerste keer zitten','Eerste hapje','Eerste keer kruipen','Eerste woordje','Eerste stapjes','Eerste nacht doorgeslapen','Eerste dag opvang','Eerste zinnetje','Zindelijk','Eerste schooldag','Fietsen zonder zijwieltjes','Zwemdiploma A','Zwemdiploma B'];
const HEALTH = ['Koorts','Verkoudheid','Oorontsteking','Buikgriep','Waterpokken','Allergie','Vaccinatie','Consultatiebureau','Huisarts','Ziekenhuis','Val / ongelukje','Anders'];
const ERNST = ['licht','middel','ernstig'];

/* ---------- small utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const uid = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowIso = () => new Date().toISOString();
const pad = (n) => String(n).padStart(2, '0');
const toDS = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toDS(new Date());
function parseD(ds) { if (!ds) return null; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ds); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function normDate(v) {
  if (typeof v === 'number') { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
  v = String(v || '').trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(v); if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  return v;
}
const fmtDate = (ds, opt = { day: 'numeric', month: 'long', year: 'numeric' }) => { const d = parseD(ds); return d ? d.toLocaleDateString('nl-NL', opt) : ''; };
const fmtMonth = (ds) => fmtDate(ds, { month: 'long', year: 'numeric' });
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400); }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* ---------- storage (IndexedDB, met geheugen-fallback) ---------- */
const memStore = { kv: new Map(), blobs: new Map() };
let dbPromise = null;
function openDB() {
  if (!dbPromise) dbPromise = new Promise((res, rej) => {
    const r = indexedDB.open('chronicles', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('blobs'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  return dbPromise;
}
async function dbOp(store, mode, fn) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, mode); const req = fn(tx.objectStore(store));
    tx.oncomplete = () => res(req && req.result); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
  });
}
const store = {
  async get(s, k) { try { return await dbOp(s, 'readonly', st => st.get(k)); } catch { return memStore[s].get(k); } },
  async set(s, k, v) { try { await dbOp(s, 'readwrite', st => st.put(v, k)); } catch { memStore[s].set(k, v); } },
  async del(s, k) { try { await dbOp(s, 'readwrite', st => st.delete(k)); } catch { memStore[s].delete(k); } },
};

/* ---------- state ---------- */
const S = {
  items: [], settings: { naam: 'Newt', geboortedatum: '' }, chapters: {},
  user: ls.get('cn_user'), sheetId: DEMO ? 'demo' : ls.get('cn_sheet'), header: null,
  mediaFolderId: null, rootFolderId: null, canEdit: true,
  view: 'timeline', param: null, candidates: [],
  f: { q: '', types: new Set(), year: '', age: '' }, hf: { type: '', age: '' },
  syncing: false, needAuth: false, error: null, lastSync: null, gisReady: false,
  draft: null, sheet: null, confirmDel: null, editIntro: null,
};
const cacheKey = () => 'items:' + S.sheetId;
async function saveCache() {
  const items = S.items.map(i => ({ ...i }));
  await store.set('kv', cacheKey(), { items, settings: S.settings, chapters: S.chapters, header: S.header, mediaFolderId: S.mediaFolderId, rootFolderId: S.rootFolderId, canEdit: S.canEdit });
}
async function loadCache() {
  const c = await store.get('kv', cacheKey());
  if (!c) return false;
  Object.assign(S, { items: c.items || [], settings: c.settings || S.settings, chapters: c.chapters || {}, header: c.header || null, mediaFolderId: c.mediaFolderId, rootFolderId: c.rootFolderId, canEdit: c.canEdit !== false });
  return true;
}
const active = () => S.items.filter(i => !i.verwijderd);
const naam = () => S.settings.naam || 'Newt';
const firstName = () => (S.user?.name || '').split(' ')[0] || '';
const pendingCount = () => S.items.filter(i => i._pending).length;

/* ---------- leeftijd ---------- */
const birth = () => parseD(S.settings.geboortedatum);
function diffYMD(a, b) {
  let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
  if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
}
function ageLabel(ds) {
  const b = birth(), t = parseD(ds); if (!b || !t) return '';
  const days = Math.round((t - b) / 864e5);
  if (days < 0) { const w = Math.ceil(-days / 7); return w <= 1 ? 'vlak voor de geboorte' : `${w} weken voor de geboorte`; }
  if (days === 0) return 'geboortedag';
  if (days < 14) return plural(days, 'dag', 'dagen');
  const { y, m } = diffYMD(b, t);
  if (y === 0 && m === 0) return `${Math.floor(days / 7)} weken`;
  if (y === 0) return plural(m, 'maand', 'maanden');
  if (y < 4 && m) return `${y} jaar en ${plural(m, 'maand', 'maanden')}`;
  return `${y} jaar`;
}
function lifeYear(ds) { const b = birth(), t = parseD(ds); if (!b || !t || t < b) return 0; return diffYMD(b, t).y; }
const chapterTitle = (y) => y === 0 ? 'Het eerste jaar' : `${naam()} op ${y}-jarige leeftijd`;
function chapterRange(y) {
  const b = birth(); if (!b) return '';
  const s = new Date(b.getFullYear() + y, b.getMonth(), b.getDate());
  const e = new Date(b.getFullYear() + y + 1, b.getMonth(), b.getDate() - 1);
  return `${fmtDate(toDS(s))} – ${fmtDate(toDS(e))}`;
}

/* ---------- Google auth (Google Identity Services, token model) ---------- */
class AuthError extends Error {}
const Auth = {
  client: null, token: null, exp: 0, waiters: [],
  load() { const t = ls.get('cn_token'); if (t && t.exp > Date.now() + 60000) { this.token = t.token; this.exp = t.exp; } },
  valid() { return !!this.token && this.exp > Date.now() + 30000; },
  loadScript() {
    return new Promise((res) => {
      if (window.google?.accounts?.oauth2) return res(true);
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s);
    }).then(ok => {
      if (!ok || !window.google?.accounts?.oauth2) return false;
      this.client = google.accounts.oauth2.initTokenClient({
        client_id: CFG.CLIENT_ID, scope: SCOPE, hint: ls.get('cn_email') || undefined,
        callback: (r) => this._cb(r), error_callback: (e) => this._fail(new Error(e?.type === 'popup_closed' ? 'Inloggen afgebroken' : 'Pop-up geblokkeerd of gesloten')),
      });
      S.gisReady = true; return true;
    });
  },
  request(prompt = '') {
    if (!this.client) return Promise.reject(new Error('Google is nog niet geladen — ben je online?'));
    const p = new Promise((res, rej) => this.waiters.push({ res, rej }));
    this.client.requestAccessToken({ prompt });
    return p;
  },
  _cb(r) {
    if (r.error) return this._fail(new Error(r.error_description || r.error));
    this.token = r.access_token; this.exp = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000;
    ls.set('cn_token', { token: this.token, exp: this.exp });
    S.needAuth = false;
    this.waiters.splice(0).forEach(w => w.res(this.token));
  },
  _fail(e) { this.waiters.splice(0).forEach(w => w.rej(e)); },
  signOut() { try { if (this.token) google.accounts.oauth2.revoke(this.token, () => {}); } catch {} this.token = null; ls.del('cn_token'); },
};

async function gapi(url, o = {}) {
  if (!Auth.valid()) { S.needAuth = true; renderBanner(); throw new AuthError('auth'); }
  const headers = Object.assign({ Authorization: 'Bearer ' + Auth.token }, o.headers || {});
  let body = o.body;
  if (o.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(o.json); }
  const r = await fetch(url, { method: o.method || 'GET', headers, body });
  if (r.status === 401) { Auth.token = null; ls.del('cn_token'); S.needAuth = true; renderBanner(); throw new AuthError('auth'); }
  if (!r.ok) { let msg = 'Fout ' + r.status; try { const j = await r.json(); msg = j.error?.message || msg; } catch {} const e = new Error(msg); e.status = r.status; throw e; }
  if (o.raw) return r;
  if (o.blob) return r.blob();
  const ct = r.headers.get('content-type') || '';
  return ct.includes('json') ? r.json() : r.text();
}

const Drive = {
  about: () => gapi(`${DRIVE}/about?fields=user(displayName,emailAddress)`),
  async find() {
    const q = encodeURIComponent(`properties has { key='${PROP}' and value='archive' } and trashed=false`);
    const r = await gapi(`${DRIVE}/files?q=${q}&fields=files(id,name,capabilities(canEdit),owners(displayName,emailAddress))&pageSize=20`);
    return r.files || [];
  },
  create: (meta) => gapi(`${DRIVE}/files?fields=id`, { method: 'POST', json: meta }),
  async upload(blob, meta) {
    const type = blob.type || 'application/octet-stream';
    if (blob.size < 4.5e6) {
      const b = 'cn' + Math.random().toString(36).slice(2);
      const body = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${type}\r\n\r\n`, blob, `\r\n--${b}--`]);
      return gapi(`${UPLOAD}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body });
    }
    const init = await gapi(`${UPLOAD}/files?uploadType=resumable&fields=id`, { method: 'POST', raw: true, json: meta, headers: { 'X-Upload-Content-Type': type } });
    const loc = init.headers.get('Location'); if (!loc) throw new Error('Upload kon niet starten');
    const r = await fetch(loc, { method: 'PUT', headers: { 'Content-Type': type }, body: blob });
    if (!r.ok) throw new Error('Upload mislukt (' + r.status + ')');
    return r.json();
  },
  media: (id) => gapi(`${DRIVE}/files/${id}?alt=media`, { blob: true }),
  share: (id, email, role) => gapi(`${DRIVE}/files/${id}/permissions?sendNotificationEmail=true&fields=id`, { method: 'POST', json: { type: 'user', role, emailAddress: email } }),
};
const Sheets = {
  batchGet: (id, ranges) => gapi(`${SHEETS}/${id}/values:batchGet?${ranges.map(r => 'ranges=' + encodeURIComponent(r)).join('&')}&valueRenderOption=UNFORMATTED_VALUE`),
  get: (range) => gapi(`${SHEETS}/${S.sheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`),
  append: (range, rows) => gapi(`${SHEETS}/${S.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: 'POST', json: { values: rows } }),
  update: (range, rows) => gapi(`${SHEETS}/${S.sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, { method: 'PUT', json: { values: rows } }),
  meta: (id) => gapi(`${SHEETS}/${id}?fields=sheets(properties(sheetId,title))`),
  batchUpdate: (id, requests) => gapi(`${SHEETS}/${id}:batchUpdate`, { method: 'POST', json: { requests } }),
};
const colLetter = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

/* ---------- rijen <-> herinneringen ---------- */
function toRow(it, header) {
  return (header || COLS).map(c => {
    switch (c) {
      case 'tags': return (it.tags || []).join(', ');
      case 'favoriet': return it.favoriet ? 'ja' : '';
      case 'verwijderd': return it.verwijderd ? 'ja' : '';
      case 'duur_dagen': return it.duur ?? '';
      case 'media': return it.media?.length ? JSON.stringify(it.media.map(m => ({ id: m.id, thumb: m.thumb, kind: m.kind, mime: m.mime, name: m.name }))) : '';
      default: return COLS.includes(c) ? (it[c] ?? '') : '';
    }
  });
}
function fromRow(r, header) {
  const o = {}; header.forEach((h, i) => { o[String(h).trim()] = r[i] ?? ''; });
  let media = []; try { media = o.media ? JSON.parse(o.media) : []; } catch {}
  const yes = (v) => /^(ja|yes|true|1|x)$/i.test(String(v).trim());
  return {
    id: String(o.id), type: TYPES[o.type] ? o.type : 'moment', datum: normDate(o.datum), titel: String(o.titel), tekst: String(o.tekst), notitie: String(o.notitie),
    tags: String(o.tags || '').split(',').map(s => s.trim()).filter(Boolean), favoriet: yes(o.favoriet),
    gezondheidstype: String(o.gezondheidstype), ernst: String(o.ernst), symptomen: String(o.symptomen), medicatie: String(o.medicatie),
    duur: o.duur_dagen === '' ? '' : o.duur_dagen, media, auteur: String(o.auteur), aangemaakt: String(o.aangemaakt), bijgewerkt: String(o.bijgewerkt), verwijderd: yes(o.verwijderd),
  };
}

/* ---------- archief aanmaken / openen ---------- */
const README = (n) => `CHRONICLES OF ${n.toUpperCase()} — HET LEVENSARCHIEF

Deze map is het archief van ${n}. Alles staat in gewone bestanden, zodat het over
tientallen jaren nog te openen is, ook zonder de app.

- "Chronicles of ${n} — Archief" (Google Sheet): elke rij in het tabblad
  "${T_MEM}" is één herinnering (mijlpaal, uitspraak, moment of gezondheid).
  Kolom "media" verwijst naar bestanden in de map "Media" (Drive-bestands-ID's).
- "${T_SET}": naam, geboortedatum en technische instellingen.
- "${T_CH}": zelfgeschreven inleidingen per levensjaar.
- Map "Media": alle foto's en video's, met datum en type in de bestandsnaam.

Tip: exporteer af en toe (Bestand > Downloaden) en bewaar een kopie op een tweede plek.
`;
async function createArchive(n, gd) {
  const root = await Drive.create({ name: `Chronicles of ${n}`, mimeType: FOLDER, properties: { [PROP]: 'root' } });
  const media = await Drive.create({ name: 'Media', mimeType: FOLDER, parents: [root.id], properties: { [PROP]: 'media' } });
  const sheet = await Drive.create({ name: `Chronicles of ${n} — Archief`, mimeType: 'application/vnd.google-apps.spreadsheet', parents: [root.id], properties: { [PROP]: 'archive' } });
  const m = await Sheets.meta(sheet.id); const first = m.sheets[0].properties.sheetId;
  await Sheets.batchUpdate(sheet.id, [
    { updateSheetProperties: { properties: { sheetId: first, title: T_MEM, gridProperties: { frozenRowCount: 1 } }, fields: 'title,gridProperties.frozenRowCount' } },
    { addSheet: { properties: { title: T_SET } } },
    { addSheet: { properties: { title: T_CH, gridProperties: { frozenRowCount: 1 } } } },
    { repeatCell: { range: { sheetId: first, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat.textFormat.bold' } },
  ]);
  await gapi(`${SHEETS}/${sheet.id}/values:batchUpdate`, { method: 'POST', json: { valueInputOption: 'RAW', data: [
    { range: `${T_MEM}!A1`, values: [COLS] },
    { range: `${T_SET}!A1`, values: [['sleutel', 'waarde'], ['naam', n], ['geboortedatum', gd], ['mediaFolderId', media.id], ['rootFolderId', root.id], ['schema', '1']] },
    { range: `${T_CH}!A1`, values: [['levensjaar', 'inleiding']] },
  ] } });
  try { await Drive.upload(new Blob([README(n)], { type: 'text/plain' }), { name: 'LEES MIJ.txt', parents: [root.id] }); } catch {}
  return sheet.id;
}
function useArchive(id, canEdit = true) { S.sheetId = id; S.canEdit = canEdit; ls.set('cn_sheet', id); }

async function pull() {
  let r;
  try { r = await Sheets.batchGet(S.sheetId, [`${T_MEM}!A:Z`, `${T_SET}!A:B`, `${T_CH}!A:B`]); }
  catch (e) { if (e.status === 400) r = await Sheets.batchGet(S.sheetId, [`${T_MEM}!A:Z`, `${T_SET}!A:B`]); else throw e; }
  const [mem, set, ch] = r.valueRanges.map(v => v.values || []);
  S.header = (mem[0] && mem[0].length) ? mem[0].map(String) : COLS;
  const server = mem.slice(1).filter(row => row && row[S.header.indexOf('id')]).map(row => fromRow(row, S.header));
  const settings = { ...S.settings };
  set.slice(1).forEach(([k, v]) => { if (k) settings[k] = k === 'geboortedatum' ? normDate(v) : String(v ?? ''); });
  S.settings = settings; S.mediaFolderId = settings.mediaFolderId || S.mediaFolderId; S.rootFolderId = settings.rootFolderId || S.rootFolderId;
  S.chapters = {}; (ch || []).slice(1).forEach(([y, t]) => { if (y !== '' && y != null) S.chapters[+y] = String(t ?? ''); });
  const local = new Map(S.items.filter(i => i._pending).map(i => [i.id, i]));
  const merged = server.map(it => local.get(it.id) || it);
  local.forEach((it, id) => { if (!server.find(s => s.id === id)) merged.push(it); });
  S.items = merged;
  await saveCache();
}

/* ---------- sync ---------- */
async function findRow(id) {
  const idx = (S.header || COLS).indexOf('id'); const L = colLetter(idx);
  const r = await Sheets.get(`${T_MEM}!${L}:${L}`);
  const i = (r.values || []).findIndex(v => String(v[0]) === id);
  return i > 0 ? i + 1 : 0;
}
async function uploadMedia(it) {
  let n = 0;
  for (const m of it.media) {
    n++;
    if (m.id || !m.local) continue;
    const base = `${it.datum} ${TYPES[it.type].label.toLowerCase()} ${it.id.slice(-5)}-${n}`;
    const full = await store.get('blobs', m.local);
    if (!full) { m._missing = true; continue; }
    const ext = m.kind === 'video' ? (m.mime.split('/')[1] || 'mp4').replace('quicktime', 'mov') : 'jpg';
    const f = await Drive.upload(full, { name: `${base}.${ext}`, parents: [S.mediaFolderId], description: `${naam()} · ${it.titel || it.tekst || ''}`.slice(0, 500) });
    let thumbId = '';
    const tb = m.thumbLocal ? await store.get('blobs', m.thumbLocal) : null;
    if (tb) { const t = await Drive.upload(tb, { name: `${base} (klein).jpg`, parents: [S.mediaFolderId] }); thumbId = t.id; await store.set('blobs', 't:' + thumbId, tb); }
    m.id = f.id; m.thumb = thumbId;
    await store.del('blobs', m.local); if (m.thumbLocal) await store.del('blobs', m.thumbLocal);
    delete m.local; delete m.thumbLocal;
    await saveCache();
  }
  it.media = it.media.filter(m => !m._missing);
}
async function pushItem(it) {
  await uploadMedia(it);
  const header = S.header || COLS;
  const row = toRow(it, header);
  const rn = await findRow(it.id);
  const last = colLetter(header.length - 1);
  if (rn) await Sheets.update(`${T_MEM}!A${rn}:${last}${rn}`, [row]);
  else await Sheets.append(`${T_MEM}!A1`, [row]);
  it._pending = false;
  await saveCache();
}
async function sync(quiet = true) {
  if (DEMO || S.syncing || !S.sheetId) return;
  if (!navigator.onLine) { renderBanner(); return; }
  if (!Auth.valid()) { S.needAuth = true; renderBanner(); return; }
  S.syncing = true; S.error = null; renderBanner();
  try {
    if (!S.mediaFolderId) await pull();
    for (const it of S.items.filter(i => i._pending)) await pushItem(it);
    await pull();
    S.lastSync = Date.now();
    if (!quiet) toast('Alles is bijgewerkt');
  } catch (e) {
    if (!(e instanceof AuthError)) { S.error = e.message; console.error(e); }
  } finally { S.syncing = false; render(); }
}
async function setSetting(key, val) {
  S.settings[key] = val; await saveCache();
  if (DEMO) return;
  const r = await Sheets.get(`${T_SET}!A:A`);
  const i = (r.values || []).findIndex(v => v[0] === key);
  if (i > 0) await Sheets.update(`${T_SET}!B${i + 1}`, [[val]]); else await Sheets.append(`${T_SET}!A1`, [[key, val]]);
}
async function setChapterIntro(y, text) {
  S.chapters[y] = text; await saveCache();
  if (DEMO) return;
  let r;
  try { r = await Sheets.get(`${T_CH}!A:A`); }
  catch (e) {
    const m = await Sheets.meta(S.sheetId);
    if (!m.sheets.find(s => s.properties.title === T_CH)) { await Sheets.batchUpdate(S.sheetId, [{ addSheet: { properties: { title: T_CH } } }]); await Sheets.update(`${T_CH}!A1`, [['levensjaar', 'inleiding']]); }
    r = { values: [['levensjaar']] };
  }
  const i = (r.values || []).findIndex(v => String(v[0]) === String(y));
  if (i > 0) await Sheets.update(`${T_CH}!B${i + 1}`, [[text]]); else await Sheets.append(`${T_CH}!A1`, [[y, text]]);
}

/* ---------- media ---------- */
const urlCache = new Map();
async function mediaURL(m, which) {
  const useThumb = which === 'thumb' && (m.thumb || m.thumbLocal);
  const key = useThumb ? (m.thumb ? 'd:' + m.thumb : 'l:' + m.thumbLocal) : (m.id ? 'd:' + m.id : 'l:' + m.local);
  if (urlCache.has(key)) return urlCache.get(key);
  let blob = null;
  if (key.startsWith('l:')) blob = await store.get('blobs', key.slice(2));
  else {
    const id = key.slice(2);
    if (useThumb) blob = await store.get('blobs', 't:' + id);
    if (!blob) { blob = await Drive.media(id); if (useThumb) store.set('blobs', 't:' + id, blob); }
  }
  if (!blob) return '';
  const u = URL.createObjectURL(blob); urlCache.set(key, u); return u;
}
async function hydrate(root = document) {
  const imgs = [...root.querySelectorAll('img[data-it]:not([src])')];
  await Promise.all(imgs.map(async (img) => {
    const it = S.items.find(i => i.id === img.dataset.it); const m = it?.media?.[+img.dataset.ix]; if (!m) return;
    try { const u = await mediaURL(m, 'thumb'); if (u) { img.onload = () => img.classList.add('ld'); img.src = u; } } catch (e) { /* offline of geen toegang */ }
  }));
}
function loadImage(file) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file); const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = u; });
}
async function resizeImage(src, max, q = 0.85) {
  let w = src.width || src.videoWidth, h = src.height || src.videoHeight;
  const s = Math.min(1, max / Math.max(w, h)); w = Math.round(w * s); h = Math.round(h * s);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(src, 0, 0, w, h);
  return new Promise(res => c.toBlob(b => res(b), 'image/jpeg', q));
}
async function processFile(file) {
  if (file.type.startsWith('video/')) {
    const poster = await new Promise((res) => {
      const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto';
      const done = (b) => { clearTimeout(t); res(b); };
      const t = setTimeout(() => done(null), 8000);
      v.onloadeddata = () => { try { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); } catch { done(null); } };
      v.onseeked = async () => done(await resizeImage(v, 480, 0.8));
      v.onerror = () => done(null);
      v.src = URL.createObjectURL(file);
    });
    return { full: file, thumb: poster, kind: 'video', mime: file.type || 'video/mp4', name: file.name };
  }
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { src = await loadImage(file); }
  const full = await resizeImage(src, 2048, 0.86);
  const thumb = await resizeImage(src, 480, 0.8);
  return { full, thumb, kind: 'image', mime: 'image/jpeg', name: file.name };
}

/* ---------- filteren ---------- */
const sortDesc = (a, b) => (b.datum || '').localeCompare(a.datum || '') || (b.aangemaakt || '').localeCompare(a.aangemaakt || '');
function haystack(i) { return [i.titel, i.tekst, i.notitie, i.tags.join(' '), i.gezondheidstype, i.symptomen, i.medicatie, i.auteur, TYPES[i.type]?.label].join(' ').toLowerCase(); }
function filtered() {
  const q = S.f.q.trim().toLowerCase();
  return active().filter(i =>
    (!S.f.types.size || S.f.types.has(i.type)) &&
    (!S.f.year || (i.datum || '').startsWith(S.f.year)) &&
    (S.f.age === '' || lifeYear(i.datum) === +S.f.age) &&
    (!q || q.split(/\s+/).every(w => haystack(i).includes(w)))
  ).sort(sortDesc);
}
const years = () => [...new Set(active().map(i => (i.datum || '').slice(0, 4)).filter(Boolean))].sort().reverse();
function maxLifeYear() { const b = birth(); if (!b) return 0; return Math.max(diffYMD(b, new Date()).y, ...active().map(i => lifeYear(i.datum)), 0); }

/* ---------- render: kaarten ---------- */
function mediaGrid(it, max = 6) {
  const ms = it.media || []; if (!ms.length) return '';
  const shown = ms.slice(0, max); const extra = ms.length - shown.length;
  const n = shown.length >= 3 ? 'n3' : 'n' + shown.length;
  return `<div class="mgrid ${n}">${shown.map((m, ix) => `<div class="mcell" data-a="lightbox" data-id="${it.id}" data-ix="${ix}"><img alt="" data-it="${it.id}" data-ix="${ix}">${m.kind === 'video' ? `<div class="play">${I('play')}</div>` : ''}${extra && ix === shown.length - 1 ? `<div class="more">+${extra}</div>` : ''}</div>`).join('')}</div>`;
}
function metaLine(it) {
  const t = TYPES[it.type];
  return `<div class="meta"><span class="type">${I(t.icon)} ${t.label}</span><span>·</span><span>${fmtDate(it.datum)}</span>${birth() ? `<span>·</span><span>${esc(ageLabel(it.datum))}</span>` : ''}</div>`;
}
function body(it, full = false) {
  const clamp = full ? '' : ' clamp';
  switch (it.type) {
    case 'quote': return `<blockquote class="q">“${esc(it.tekst)}”</blockquote>${it.notitie ? `<div class="ctx">${esc(it.notitie)}</div>` : ''}`;
    case 'gezondheid': return `<h3 class="${full ? 't' : ''}">${esc(it.gezondheidstype || it.titel || 'Gezondheid')}${it.titel && it.gezondheidstype ? ` <span style="color:var(--muted);font-size:.8em">· ${esc(it.titel)}</span>` : ''}</h3>
      ${it.ernst ? `<div class="sev ${esc(it.ernst)}">${esc(it.ernst)}${it.duur ? ` · ${plural(+it.duur, 'dag', 'dagen')}` : ''}</div>` : (it.duur ? `<div class="sev">${plural(+it.duur, 'dag', 'dagen')}</div>` : '')}
      ${it.symptomen ? `<div class="kv"><b>Symptomen</b>${esc(it.symptomen)}</div>` : ''}${it.medicatie ? `<div class="kv"><b>Medicatie</b>${esc(it.medicatie)}</div>` : ''}
      ${it.tekst ? `<p class="${clamp}">${esc(it.tekst)}</p>` : ''}`;
    default: return `${it.titel ? `<h3>${esc(it.titel)}</h3>` : ''}${it.tekst ? `<p class="${clamp}">${esc(it.tekst)}</p>` : ''}${full && it.notitie ? `<p class="ctx">${esc(it.notitie)}</p>` : ''}`;
  }
}
function card(it) {
  return `<article class="card t-${it.type}" data-a="open" data-id="${it.id}" tabindex="0">
    ${it.favoriet ? `<span class="fav">${I('star')}</span>` : ''}${metaLine(it)}${body(it)}${mediaGrid(it)}
    ${it._pending && !DEMO ? `<div class="pend">${I('cloud')} wacht op synchronisatie</div>` : ''}</article>`;
}

/* ---------- render: views ---------- */
function vWelcome() {
  return `<section class="welcome">
    <div class="eyebrow">Een levensarchief</div><h1>Chronicles of Newt</h1>
    <p>Mijlpalen, uitspraken, kleine momenten en alles daartussen — bewaard in jullie eigen Google Drive, voor over twintig jaar.</p>
    <button class="btn block" data-a="login">Inloggen met Google</button>
    <p class="hint">Je gegevens blijven in jullie eigen Drive. Deze app heeft geen server en slaat niets elders op.</p>
  </section>`;
}
function vSetup() {
  return `<section class="welcome">
    <div class="eyebrow">Welkom${S.user ? ', ' + esc(firstName()) : ''}</div><h1>Een nieuw archief</h1>
    <p>Er is nog geen archief gevonden in je Drive. Maak er een aan, of laat de andere ouder het met je delen.</p>
    <div class="form">
      <label class="field"><span>Naam</span><input class="inp" id="su-naam" value="Newt" autocomplete="off"></label>
      <label class="field"><span>Geboortedatum</span><input class="inp" id="su-gd" type="date"></label>
      <button class="btn block" data-a="create-archive">Archief aanmaken</button>
      <p class="hint" style="text-align:center">Al gedeeld door de andere ouder (met ${esc(S.user?.email || 'jouw e-mailadres')})? <button class="link" data-a="research">Opnieuw zoeken</button></p>
    </div></section>`;
}
function vPick() {
  return `<section class="welcome"><h1>Welk archief?</h1><p>Er zijn meerdere archieven gevonden.</p>
    ${S.candidates.map(f => `<button class="btn ghost block" style="margin-top:10px" data-a="pick" data-id="${f.id}" data-edit="${f.capabilities?.canEdit ? 1 : 0}">${esc(f.name)}<br><small>${esc(f.owners?.[0]?.displayName || '')}</small></button>`).join('')}</section>`;
}
function rediscover() {
  const t = todayStr(), md = t.slice(5);
  const on = active().filter(i => i.datum?.slice(5) === md && i.datum < t);
  if (on.length) return { title: 'Op deze dag', items: on.sort(sortDesc).slice(0, 2) };
  const cutoff = toDS(new Date(Date.now() - 45 * 864e5));
  const pool = active().filter(i => i.datum < cutoff && (i.type === 'quote' || i.favoriet || i.media?.length || i.type === 'mijlpaal'));
  if (pool.length < 3) return null;
  const day = Math.floor(Date.now() / 864e5);
  return { title: 'Uit het archief', items: [pool[day % pool.length]] };
}
function vTimeline() {
  const all = active(); const items = filtered(); const b = birth();
  const nowAge = b ? ageLabel(todayStr()) : '';
  const rd = (!S.f.q && !S.f.types.size && !S.f.year && S.f.age === '') ? rediscover() : null;
  const ys = years(); const my = maxLifeYear();
  let h = `<header class="top"><div class="eyebrow">Het levensarchief van</div><h1>${esc(naam())}</h1>
    <div class="sub">${nowAge ? esc(nowAge) + ' · ' : ''}${plural(all.length, 'herinnering', 'herinneringen')}</div><div class="ornament"><span>❦</span></div></header>`;
  if (rd) h += `<section class="rediscover"><div class="eyebrow">${I('sparkle')} ${rd.title}</div>${rd.items.map(card).join('')}</section>`;
  h += `<div class="filters"><label class="search">${I('search')}<input data-f="q" type="search" placeholder="Zoek in herinneringen…" value="${esc(S.f.q)}"></label>
    <div class="chips">${Object.entries(TYPES).map(([k, t]) => `<button class="chip ${S.f.types.has(k) ? 'on' : ''}" data-a="ftype" data-t="${k}"><span class="dot" style="background:var(--c-${k})"></span>${t.plural}</button>`).join('')}
    <select class="chip ${S.f.age !== '' ? 'on' : ''}" data-f="age"><option value="">Elke leeftijd</option>${b ? Array.from({ length: my + 1 }, (_, y) => `<option value="${y}" ${S.f.age === String(y) ? 'selected' : ''}>${y === 0 ? '0 jaar' : y + ' jaar'}</option>`).join('') : ''}</select>
    <select class="chip ${S.f.year ? 'on' : ''}" data-f="year"><option value="">Elk jaar</option>${ys.map(y => `<option ${S.f.year === y ? 'selected' : ''}>${y}</option>`).join('')}</select>
    </div></div>`;
  if (!all.length) return h + `<div class="empty"><h3>Het eerste hoofdstuk begint hier</h3><p>Tik op <b>+</b> om je eerste herinnering vast te leggen. Een uitspraak, een foto, een eerste keer.</p></div>`;
  if (!items.length) return h + `<div class="empty"><h3>Niets gevonden</h3><p><button class="link" data-a="fclear">Filters wissen</button></p></div>`;
  let cur = '';
  for (const it of items) {
    const mk = (it.datum || '').slice(0, 7);
    if (mk !== cur) { cur = mk; h += `<div class="month"><h3>${esc(fmtMonth(it.datum))}</h3><span>${esc(b ? ageLabel(it.datum) : '')}</span></div>`; }
    h += card(it);
  }
  return h;
}
function chapterData(y) {
  const items = active().filter(i => lifeYear(i.datum) === y).sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
  const by = (t) => items.filter(i => i.type === t);
  const media = items.flatMap(i => (i.media || []).map((m, ix) => ({ it: i, m, ix }))).filter(x => x.m.kind === 'image' || x.m.thumb || x.m.thumbLocal);
  media.sort((a, b) => (b.it.favoriet - a.it.favoriet) || ((b.it.type === 'mijlpaal') - (a.it.type === 'mijlpaal')));
  return { items, ms: by('mijlpaal'), qs: by('quote'), mo: by('moment'), he: by('gezondheid'), media };
}
function vChapters() {
  if (!birth()) return `<header class="top"><div class="eyebrow">Het levensboek</div><h1>Hoofdstukken</h1></header><div class="note">Vul eerst de geboortedatum in bij <button class="link" data-a="nav" data-v="more">Meer</button>, dan worden de hoofdstukken per levensjaar gemaakt.</div>`;
  const my = maxLifeYear();
  let h = `<header class="top"><div class="eyebrow">Het levensboek</div><h1>Hoofdstukken</h1><div class="sub">Eén hoofdstuk per levensjaar</div><div class="ornament"><span>❦</span></div></header><div class="chapters">`;
  for (let y = my; y >= 0; y--) {
    const d = chapterData(y); const cov = d.media[0];
    h += `<button class="chap" data-a="chapter" data-y="${y}"><div class="cover">${cov ? `<img alt="" data-it="${cov.it.id}" data-ix="${cov.ix}">` : roman(y + 1)}</div>
      <div class="body"><div class="num">Hoofdstuk ${roman(y + 1)}</div><h3>${esc(chapterTitle(y))}</h3>
      <div class="stats">${d.items.length ? [d.ms.length && plural(d.ms.length, 'mijlpaal', 'mijlpalen'), d.qs.length && plural(d.qs.length, 'uitspraak', 'uitspraken'), d.media.length && plural(d.media.length, 'foto', "foto's"), d.mo.length && plural(d.mo.length, 'moment', 'momenten')].filter(Boolean).join(' · ') : 'Nog leeg'}</div></div></button>`;
  }
  return h + '</div>';
}
function roman(n) { const r = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, c] of r) while (n >= v) { s += c; n -= v; } return s; }
function vChapter(y) {
  const d = chapterData(y); const intro = S.chapters[y] || '';
  const sick = d.he.filter(i => !/vaccin|consultatie/i.test(i.gezondheidstype));
  const tagCount = {}; d.items.forEach(i => i.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const favQ = [...d.qs].sort((a, b) => b.favoriet - a.favoriet);
  let h = `<button class="backlink noprint" data-a="nav" data-v="chapters">${I('back')} Alle hoofdstukken</button>
  <article class="book"><div class="num">Hoofdstuk ${roman(y + 1)}</div><h1>${esc(chapterTitle(y))}</h1><div class="range">${esc(chapterRange(y))}</div>
  <div class="summary">${[d.ms.length && plural(d.ms.length, 'mijlpaal', 'mijlpalen'), d.qs.length && plural(d.qs.length, 'uitspraak', 'uitspraken'), d.mo.length && plural(d.mo.length, 'moment', 'momenten'), sick.length && `${sick.length}× ziek`, d.media.length && plural(d.media.length, 'foto', "foto's")].filter(Boolean).map(s => `<span>${s}</span>`).join('')}</div>`;
  if (S.editIntro === y) {
    h += `<div class="noprint" style="margin-top:18px"><textarea class="inp big" id="intro-ta" placeholder="Hoe was dit jaar? Wie was ${esc(naam())}?">${esc(intro)}</textarea>
      <div class="btnrow" style="margin-top:10px"><button class="btn small" data-a="save-intro" data-y="${y}">Bewaren</button><button class="btn ghost small" data-a="cancel-intro">Annuleren</button></div>
      <p class="hint">Tip: vraag Claude om een inleiding te schrijven op basis van dit hoofdstuk, en plak die hier.</p></div>`;
  } else {
    h += intro ? `<div class="intro">${esc(intro)}</div>${S.canEdit ? `<p class="noprint" style="text-align:center"><button class="link" data-a="edit-intro" data-y="${y}">${I('edit')} Inleiding bewerken</button></p>` : ''}`
      : (S.canEdit ? `<p class="intro empty-intro noprint" style="text-align:center"><button class="link" data-a="edit-intro" data-y="${y}">${I('edit')} Schrijf een inleiding voor dit hoofdstuk</button></p>` : '');
  }
  if (!d.items.length) return h + `<div class="empty"><p>Dit hoofdstuk is nog leeg.</p></div></article>`;
  if (d.ms.length) h += `<h2><span class="c-mijlpaal">${I('flag')}</span> Wat ${esc(naam())} leerde</h2><ul class="plain">${d.ms.map(i => `<li data-a="open" data-id="${i.id}"><b>${esc(i.titel || i.tekst)}</b><span>${esc(fmtDate(i.datum, { day: 'numeric', month: 'long' }))}<br>${esc(ageLabel(i.datum))}</span></li>`).join('')}</ul>`;
  if (d.qs.length) h += `<h2><span class="c-quote">${I('quote')}</span> In zijn eigen woorden</h2><div class="quotes">${favQ.map(i => `<div class="qi" data-a="open" data-id="${i.id}"><blockquote>“${esc(i.tekst)}”</blockquote><small>${esc(ageLabel(i.datum))}${i.notitie ? ' · ' + esc(i.notitie) : ''}</small></div>`).join('')}</div>`;
  if (d.media.length) {
    const ms = d.media.slice(0, 12);
    h += `<h2><span class="c-moment">${I('camera')}</span> Mooiste beelden</h2><div class="mgrid ${ms.length >= 3 ? 'n3' : 'n' + ms.length}">${ms.map(x => `<div class="mcell" data-a="lightbox" data-id="${x.it.id}" data-ix="${x.ix}"><img alt="" data-it="${x.it.id}" data-ix="${x.ix}">${x.m.kind === 'video' ? `<div class="play">${I('play')}</div>` : ''}</div>`).join('')}</div>`;
  }
  if (d.mo.length) h += `<h2><span class="c-moment">${I('sun')}</span> Momenten</h2><ul class="plain">${d.mo.map(i => `<li data-a="open" data-id="${i.id}"><b>${esc(i.titel || (i.tekst || '').slice(0, 90) || 'Foto')}</b><span>${esc(fmtDate(i.datum, { day: 'numeric', month: 'long' }))}</span></li>`).join('')}</ul>`;
  if (d.he.length) h += `<h2><span class="c-gezondheid">${I('health')}</span> Gezondheid</h2><ul class="plain">${d.he.map(i => `<li data-a="open" data-id="${i.id}"><b>${esc(i.gezondheidstype || i.titel)}</b><span>${esc(fmtDate(i.datum, { day: 'numeric', month: 'long' }))}${i.ernst ? ' · ' + esc(i.ernst) : ''}</span></li>`).join('')}</ul>`;
  if (tags.length) h += `<h2>Terugkerende thema's</h2><div class="wrapchips">${tags.map(([t, n]) => `<span class="chip">${esc(t)}${n > 1 ? ` · ${n}` : ''}</span>`).join('')}</div>`;
  h += `<div class="btnrow noprint" style="justify-content:center;margin-top:28px"><button class="btn ghost small" data-a="print">${I('printer')} Afdrukken / PDF</button></div></article>`;
  return h;
}
function vHealth() {
  const all = active().filter(i => i.type === 'gezondheid');
  const list = all.filter(i => (!S.hf.type || i.gezondheidstype === S.hf.type) && (S.hf.age === '' || lifeYear(i.datum) === +S.hf.age)).sort(sortDesc);
  const types = [...new Set(all.map(i => i.gezondheidstype).filter(Boolean))].sort();
  const stats = {};
  list.forEach(i => { const k = i.gezondheidstype || 'Overig'; const s = stats[k] ||= { n: 0, last: '', dur: [], sev: {} }; s.n++; if (i.datum > s.last) s.last = i.datum; if (+i.duur) s.dur.push(+i.duur); if (i.ernst) s.sev[i.ernst] = (s.sev[i.ernst] || 0) + 1; });
  const rows = Object.entries(stats).sort((a, b) => b[1].n - a[1].n);
  const my = maxLifeYear();
  let h = `<header class="top"><div class="eyebrow">Het dossier van ${esc(naam())}</div><h1>Gezondheid</h1><div class="sub">Geen officieel medisch dossier — wel een geheugen</div><div class="ornament"><span>❦</span></div></header>
  <div class="filters" style="position:static"><div class="chips" style="padding-top:0">
    <select class="chip ${S.hf.type ? 'on' : ''}" data-hf="type"><option value="">Alle soorten</option>${types.map(t => `<option ${S.hf.type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
    ${birth() ? `<select class="chip ${S.hf.age !== '' ? 'on' : ''}" data-hf="age"><option value="">Elke leeftijd</option>${Array.from({ length: my + 1 }, (_, y) => `<option value="${y}" ${S.hf.age === String(y) ? 'selected' : ''}>${y} jaar</option>`).join('')}</select>` : ''}
  </div></div>`;
  if (!all.length) return h + `<div class="empty"><h3>Nog niets vastgelegd</h3><p>Koorts, een vaccinatie of een bezoek aan de huisarts: tik op <b>+</b> en kies Gezondheid.</p></div>`;
  if (rows.length) h += `<h2 class="section">Patronen</h2><table class="tbl"><thead><tr><th>Soort</th><th class="n">Aantal</th><th class="n">Gem. duur</th><th>Laatst</th></tr></thead><tbody>
    ${rows.map(([k, s]) => `<tr><td>${esc(k)}</td><td class="n">${s.n}×</td><td class="n">${s.dur.length ? Math.round(s.dur.reduce((a, b) => a + b, 0) / s.dur.length * 10) / 10 + ' d' : '–'}</td><td>${esc(fmtDate(s.last, { month: 'short', year: 'numeric' }))}</td></tr>`).join('')}</tbody></table>`;
  if (birth() && S.hf.age === '') {
    const per = {}; list.forEach(i => { if (/vaccin|consultatie/i.test(i.gezondheidstype)) return; const y = lifeYear(i.datum); per[y] = (per[y] || 0) + 1; });
    const ks = Object.keys(per).sort((a, b) => a - b);
    if (ks.length > 1) h += `<p class="hint" style="margin:10px 4px">Keren ziek per levensjaar: ${ks.map(y => `${y} jr: ${per[y]}×`).join(' · ')}</p>`;
  }
  h += `<h2 class="section">Alle gebeurtenissen</h2>${list.map(card).join('')}`;
  return h;
}
function vMore() {
  const shared = !DEMO && S.rootFolderId;
  return `<header class="top"><div class="eyebrow">${esc(naam())}</div><h1>Meer</h1><div class="ornament"><span>❦</span></div></header>
  <section class="panel"><h3>${I('sparkle')} Vraag het Claude</h3>
    <p>Stel vragen over het archief aan Claude, bijvoorbeeld in het project <i>Chronicles of Newt</i>. Claude kan de Google Sheet lezen via de Google Drive-koppeling, of je plakt de tekstversie hieronder in het gesprek.</p>
    <ul><li>Wanneer kreeg ${esc(naam())} zijn eerste tandje?</li><li>Welke ziektes had hij tussen zijn 1e en 3e jaar?</li><li>Wat waren zijn grappigste uitspraken toen hij 4 was?</li><li>Schrijf een inleiding voor het hoofdstuk over zijn tweede levensjaar.</li></ul>
    <div class="btnrow"><button class="btn small" data-a="copy-export">${I('copy')} Kopieer archief als tekst</button><button class="btn ghost small" data-a="dl-md">${I('download')} Download (.md)</button></div></section>
  <section class="panel"><h3>Over ${esc(naam())}</h3>
    <label class="field"><span>Naam</span><input class="inp" id="set-naam" value="${esc(S.settings.naam || '')}" ${S.canEdit ? '' : 'disabled'}></label>
    <label class="field"><span>Geboortedatum</span><input class="inp" id="set-gd" type="date" value="${esc(S.settings.geboortedatum || '')}" ${S.canEdit ? '' : 'disabled'}></label>
    ${S.canEdit ? `<button class="btn small" data-a="save-settings">Bewaren</button>` : ''}</section>
  ${shared ? `<section class="panel"><h3>${I('users')} Delen</h3>
    <p>Geef de andere ouder (bewerken) of grootouders (alleen kijken) toegang. Zij openen daarna deze app en loggen in met hun eigen Google-account.</p>
    <label class="field"><span>E-mailadres (Google-account)</span><input class="inp" id="sh-email" type="email" placeholder="naam@gmail.com"></label>
    <div class="seg" style="margin-bottom:12px"><button class="${(S.shareRole || 'writer') === 'writer' ? 'on' : ''}" data-a="share-role" data-r="writer">Ouder · bewerken</button><button class="${S.shareRole === 'reader' ? 'on' : ''}" data-a="share-role" data-r="reader">Familie · kijken</button></div>
    <button class="btn small" data-a="share">Uitnodigen</button></section>` : ''}
  <section class="panel"><h3>${I('folder')} Archief & back-up</h3>
    <p>${DEMO ? 'Demomodus: herinneringen staan alleen op dit apparaat.' : `Alles staat in jullie Google Drive, in de map <i>Chronicles of ${esc(naam())}</i>.`}</p>
    <div class="btnrow">${!DEMO && S.sheetId ? `<a class="btn ghost small" href="https://docs.google.com/spreadsheets/d/${esc(S.sheetId)}" target="_blank" rel="noopener">Open de Sheet</a>` : ''}
    ${!DEMO && S.rootFolderId ? `<a class="btn ghost small" href="https://drive.google.com/drive/folders/${esc(S.rootFolderId)}" target="_blank" rel="noopener">Open de Drive-map</a>` : ''}
    <button class="btn ghost small" data-a="dl-json">${I('download')} Back-up (.json)</button>${!DEMO ? `<button class="btn ghost small" data-a="sync-now">${I('refresh')} Nu synchroniseren</button>` : ''}</div>
    ${S.lastSync ? `<p class="hint">Laatst gesynchroniseerd: ${new Date(S.lastSync).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</p>` : ''}</section>
  <section class="panel"><h3>Account</h3><p>${DEMO ? 'Demomodus — niet ingelogd.' : `Ingelogd als ${esc(S.user?.name || '')} (${esc(S.user?.email || '')})`}</p>
    ${!DEMO ? `<button class="btn ghost small" data-a="signout">Uitloggen</button>` : ''}<p class="hint">Chronicles of Newt · versie ${VERSION}</p></section>`;
}

/* ---------- sheets (modals) ---------- */
function newDraft(type, base = {}) {
  return Object.assign({ id: null, type, datum: todayStr(), titel: '', tekst: '', notitie: '', tags: '', favoriet: false, gezondheidstype: '', ernst: '', symptomen: '', medicatie: '', duur: '', media: [], more: false, busy: 0 }, base);
}
function sheetPicker() {
  return `<div class="sheet-head"><h2>Nieuwe herinnering</h2><button class="x" data-a="close" aria-label="Sluiten">${I('x')}</button></div>
  <div class="types">${Object.entries(TYPES).map(([k, t]) => `<button class="typebtn" data-a="draft-type" data-t="${k}"><span class="c-${k}">${I(t.icon)}</span><b>${t.label}</b><small>${t.hint}</small></button>`).join('')}</div>`;
}
function inp(name, label, opt = {}) {
  const d = S.draft; const v = esc(d[name] ?? '');
  if (opt.area) return `<label class="field"><span>${label}</span><textarea class="inp ${opt.cls || ''}" data-d="${name}" placeholder="${esc(opt.ph || '')}" ${opt.af ? 'autofocus' : ''}>${v}</textarea></label>`;
  return `<label class="field"><span>${label}</span><input class="inp" data-d="${name}" type="${opt.type || 'text'}" value="${v}" placeholder="${esc(opt.ph || '')}" ${opt.af ? 'autofocus' : ''} ${opt.attrs || ''}></label>`;
}
function sheetForm() {
  const d = S.draft; const t = TYPES[d.type]; const n = esc(naam());
  let f = '';
  if (d.type === 'quote') {
    f += inp('tekst', `Wat zei ${n}?`, { area: true, cls: 'big quote', ph: 'Mama, waarom heeft de maan geen schoenen aan?', af: !d.id });
    f += inp('notitie', 'Context (optioneel)', { ph: 'Bij het naar bed gaan, tegen opa…' });
  } else if (d.type === 'mijlpaal') {
    const done = new Set(active().filter(i => i.type === 'mijlpaal').map(i => i.titel.toLowerCase()));
    const sugg = MILESTONES.filter(m => !done.has(m.toLowerCase())).slice(0, 8);
    f += inp('titel', 'Mijlpaal', { ph: 'Eerste stapjes', af: !d.id });
    if (!d.id && sugg.length) f += `<div class="wrapchips" style="margin:-4px 0 16px">${sugg.map(s => `<button class="chip ${d.titel === s ? 'on' : ''}" data-a="draft-sugg" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
    f += inp('tekst', 'Hoe ging het?', { area: true, ph: 'Van de bank naar papa, vier stapjes, en toen met een grote grijns op zijn billen.' });
  } else if (d.type === 'moment') {
    f += inp('tekst', 'Wat gebeurde er?', { area: true, cls: 'big', ph: 'Vandaag…', af: !d.id });
  } else {
    f += `<div class="field"><span>Wat was er?</span><div class="wrapchips">${HEALTH.map(s => `<button class="chip ${d.gezondheidstype === s ? 'on' : ''}" data-a="draft-ht" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
    f += `<div class="field"><span>Ernst</span><div class="seg">${ERNST.map(e => `<button class="${d.ernst === e ? 'on' : ''}" data-a="draft-ernst" data-v="${e}">${e}</button>`).join('')}</div></div>`;
    f += `<div class="row">${inp('symptomen', 'Symptomen', { ph: '39,2 koorts, hangerig' })}${inp('duur', 'Duur (dagen)', { type: 'number', attrs: 'inputmode="numeric" min="0"' })}</div>`;
    f += inp('medicatie', 'Medicatie', { ph: 'Paracetamol zetpil 120 mg' });
    f += inp('tekst', 'Notities', { area: true, ph: 'Huisarts gebeld, oortjes bekeken…' });
  }
  f += `<div class="row">${inp('datum', 'Datum', { type: 'date', attrs: `max="${toDS(new Date(Date.now() + 365 * 864e5))}"` })}<div class="field"><span>Leeftijd</span><div class="inp" style="border-color:transparent;background:transparent;padding-left:0;color:var(--muted)" id="age-out">${esc(ageLabel(d.datum) || '—')}</div></div></div>`;
  f += `<div class="field"><span>Foto's & video's</span><div class="thumbs">${d.media.map((m, ix) => `<div class="thumb"><img alt="" data-dm="${ix}">${m.kind === 'video' ? `<div class="play" style="position:absolute;inset:0;display:grid;place-items:center;color:#fff">${I('play')}</div>` : ''}<button data-a="draft-rm" data-ix="${ix}" aria-label="Verwijderen">${I('x')}</button></div>`).join('')}
    ${d.busy ? `<div class="addmedia"><div class="spinner"></div></div>` : ''}<button class="addmedia" data-a="draft-media" aria-label="Foto of video toevoegen">${I('camera')}</button></div></div>`;
  if (d.more || d.id) {
    if (d.type !== 'quote' && d.type !== 'mijlpaal') f += inp('titel', 'Titel (optioneel)', { ph: d.type === 'gezondheid' ? 'bv. Eerste oorontsteking' : 'bv. Eerste keer naar zee' });
    if (d.type === 'mijlpaal' || d.type === 'moment') f += inp('notitie', 'Notities van ouders', { area: true });
    f += inp('tags', 'Tags (met komma’s)', { ph: 'eten, opa & oma, logeren' });
  } else f += `<p style="margin:-4px 0 8px"><button class="link" data-a="draft-more">+ Titel, notities & tags</button></p>`;
  return `<div class="sheet-head"><h2><span class="c-${d.type}">${I(t.icon)}</span> ${d.id ? 'Bewerken' : t.label}</h2><button class="x" data-a="close" aria-label="Sluiten">${I('x')}</button></div>
  ${f}<div class="save-bar"><button class="btn block" data-a="save" ${d.busy ? 'disabled' : ''}>${d.busy ? 'Even geduld…' : 'Bewaren'}</button>
  <button class="x" style="width:48px;height:48px;flex:none;${d.favoriet ? 'color:var(--c-mijlpaal)' : ''}" data-a="draft-fav" aria-label="Favoriet">${d.favoriet ? I('star').replace('class="i ', 'class="i filled ') : I('star')}</button></div>`;
}
function sheetDetail(it) {
  const confirm = S.confirmDel === it.id;
  return `<div class="sheet-head"><div>${metaLine(it)}</div><button class="x" data-a="close" aria-label="Sluiten">${I('x')}</button></div>
  <div class="detail t-${it.type}">${it.type === 'mijlpaal' || it.type === 'moment' ? (it.titel ? `<h2 class="t">${esc(it.titel)}</h2>` : '') + (it.tekst ? `<p>${esc(it.tekst)}</p>` : '') + (it.notitie ? `<p class="ctx">${esc(it.notitie)}</p>` : '') : body(it, true)}
  ${mediaGrid(it, 50)}
  ${it.tags.length ? `<div class="wrapchips" style="margin-top:14px">${it.tags.map(t => `<button class="chip" data-a="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
  <div class="by">${it.auteur ? 'Vastgelegd door ' + esc(it.auteur) : ''}${it.aangemaakt ? ' · ' + esc(new Date(it.aangemaakt).toLocaleDateString('nl-NL')) : ''}</div>
  ${S.canEdit ? `<div class="actions"><button class="btn small" data-a="edit" data-id="${it.id}">${I('edit')} Bewerken</button>
    <button class="btn ghost small" data-a="fav" data-id="${it.id}">${I('star')} ${it.favoriet ? 'Geen favoriet' : 'Favoriet'}</button>
    <button class="btn danger small" data-a="del" data-id="${it.id}">${I('trash')} ${confirm ? 'Zeker weten?' : 'Verwijderen'}</button></div>` : ''}</div>`;
}
function renderSheet() {
  const root = $('#sheet-root');
  if (!S.sheet) { root.innerHTML = ''; document.body.style.overflow = ''; return; }
  let inner = '';
  if (S.sheet === 'picker') inner = sheetPicker();
  else if (S.sheet === 'form') inner = sheetForm();
  else if (S.sheet.startsWith('detail:')) { const it = S.items.find(i => i.id === S.sheet.slice(7)); if (!it) { S.sheet = null; return renderSheet(); } inner = sheetDetail(it); }
  const scroll = root.querySelector('.sheet')?.scrollTop || 0;
  root.innerHTML = `<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${inner}</div>`;
  document.body.style.overflow = 'hidden';
  const sh = root.querySelector('.sheet'); sh.scrollTop = scroll;
  const af = sh.querySelector('[autofocus]'); if (af && !renderSheet._focused) { renderSheet._focused = true; setTimeout(() => af.focus(), 60); }
  if (S.sheet === 'form') S.draft.media.forEach(async (m, ix) => { const img = sh.querySelector(`img[data-dm="${ix}"]`); if (img) img.src = m.preview || await mediaURL(m, 'thumb').catch(() => ''); });
  hydrate(sh);
}
function openSheet(s) { renderSheet._focused = false; S.sheet = s; S.confirmDel = null; renderSheet(); }
function closeSheet() {
  if (S.sheet === 'form' && S.draft && !S.draft.id) S.draft.media.forEach(m => { if (m.local) { store.del('blobs', m.local); store.del('blobs', m.thumbLocal); } });
  S.sheet = null; S.draft = null; renderSheet();
}

/* ---------- lightbox ---------- */
async function openLightbox(id, ix) {
  const it = S.items.find(i => i.id === id); if (!it) return;
  const ms = it.media || []; let cur = ix;
  const box = document.createElement('div'); box.className = 'lightbox';
  const show = async () => {
    const m = ms[cur];
    box.innerHTML = `<div class="spinner"></div><button class="x" aria-label="Sluiten">${I('x')}</button>${ms.length > 1 ? `<button class="nav prev">${I('back')}</button><button class="nav next">${I('next')}</button>` : ''}`;
    box.querySelector('.x').onclick = () => box.remove();
    if (ms.length > 1) { box.querySelector('.prev').onclick = (e) => { e.stopPropagation(); cur = (cur - 1 + ms.length) % ms.length; show(); }; box.querySelector('.next').onclick = (e) => { e.stopPropagation(); cur = (cur + 1) % ms.length; show(); }; }
    try {
      const u = await mediaURL(m, 'full');
      const el = document.createElement(m.kind === 'video' ? 'video' : 'img');
      if (m.kind === 'video') { el.controls = true; el.playsInline = true; el.autoplay = true; }
      el.src = u; box.querySelector('.spinner').replaceWith(el);
    } catch (e) { box.querySelector('.spinner').outerHTML = `<p style="color:#fff">Kon niet laden${navigator.onLine ? '' : ' (offline)'}.</p>`; }
  };
  document.body.appendChild(box); show();
}

/* ---------- export ---------- */
function exportMarkdown() {
  const lines = [`# Chronicles of ${naam()} — archief`, '', `Geboortedatum: ${S.settings.geboortedatum || 'onbekend'} · Export: ${todayStr()} · ${active().length} herinneringen`, ''];
  const items = active().sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
  let y = null;
  for (const i of items) {
    const ly = lifeYear(i.datum);
    if (birth() && ly !== y) { y = ly; lines.push('', `## ${chapterTitle(ly)}`); if (S.chapters[ly]) lines.push('', S.chapters[ly]); lines.push(''); }
    const parts = [`- ${i.datum}${birth() ? ` (${ageLabel(i.datum)})` : ''} · ${TYPES[i.type].label}`];
    if (i.type === 'quote') parts.push(`: “${i.tekst}”${i.notitie ? ` (${i.notitie})` : ''}`);
    else if (i.type === 'gezondheid') parts.push(`: ${[i.gezondheidstype, i.titel].filter(Boolean).join(' – ')}${i.ernst ? `; ernst ${i.ernst}` : ''}${i.duur ? `; ${i.duur} dagen` : ''}${i.symptomen ? `; symptomen: ${i.symptomen}` : ''}${i.medicatie ? `; medicatie: ${i.medicatie}` : ''}${i.tekst ? `; ${i.tekst}` : ''}`);
    else parts.push(`: ${[i.titel, i.tekst, i.notitie].filter(Boolean).join(' — ')}`);
    if (i.media?.length) parts.push(` [${i.media.length} foto/video]`);
    if (i.tags.length) parts.push(` #${i.tags.join(' #')}`);
    if (i.favoriet) parts.push(' ★');
    lines.push(parts.join('').replace(/\n+/g, ' '));
  }
  return lines.join('\n');
}
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

/* ---------- render root ---------- */
function renderNav() {
  const nav = $('#nav');
  if (['welcome', 'setup', 'pick'].includes(S.view)) { nav.innerHTML = ''; return; }
  const v = S.view === 'chapter' ? 'chapters' : S.view;
  const b = (k, icon, label) => `<button class="${v === k ? 'on' : ''}" data-a="nav" data-v="${k}">${I(icon)}<span>${label}</span></button>`;
  nav.innerHTML = b('timeline', 'list', 'Tijdlijn') + b('chapters', 'book', 'Boek') + (S.canEdit ? `<button class="add" data-a="add" aria-label="Nieuwe herinnering">${I('plus')}</button>` : '') + b('health', 'health', 'Gezondheid') + b('more', 'more', 'Meer');
}
function renderBanner() {
  const el = $('#banner'); let h = '';
  const pc = pendingCount();
  if (DEMO) h = `<div class="bar soft">Demomodus — herinneringen blijven alleen op dit apparaat</div>`;
  else if (['welcome', 'setup', 'pick'].includes(S.view)) h = '';
  else if (S.needAuth || (!Auth.valid() && S.sheetId)) h = `<div class="bar">${pc ? plural(pc, 'herinnering wacht', 'herinneringen wachten') + ' om bewaard te worden.' : 'Verbinding met Google verlopen.'} <button data-a="connect">Verbinden</button></div>`;
  else if (!navigator.onLine) h = `<div class="bar soft">Offline${pc ? ` — ${plural(pc, 'herinnering', 'herinneringen')} ${pc === 1 ? 'wordt' : 'worden'} later bewaard` : ''}</div>`;
  else if (S.error) h = `<div class="bar soft">Kon niet synchroniseren: ${esc(S.error)} <button data-a="sync-now">Opnieuw</button></div>`;
  else if (S.syncing && pc) h = `<div class="bar soft">Bezig met bewaren in Drive…</div>`;
  el.innerHTML = h;
}
function render() {
  const app = $('#app'); let h = '';
  switch (S.view) {
    case 'welcome': h = vWelcome(); break;
    case 'setup': h = vSetup(); break;
    case 'pick': h = vPick(); break;
    case 'chapters': h = vChapters(); break;
    case 'chapter': h = vChapter(+S.param); break;
    case 'health': h = vHealth(); break;
    case 'more': h = vMore(); break;
    default: h = vTimeline();
  }
  const ae = document.activeElement; const fk = ae?.dataset?.f; const pos = ae?.selectionStart;
  app.innerHTML = h;
  if (fk) { const el = app.querySelector(`[data-f="${fk}"]`); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch {} } }
  renderNav(); renderBanner(); hydrate(app);
  if (S.sheet) renderSheet();
}
function go(view, param = null) { S.view = view; S.param = param; S.editIntro = null; render(); window.scrollTo(0, 0); ls.set('cn_view', view === 'chapter' ? 'chapters' : view); }

/* ---------- acties ---------- */
async function afterLogin() {
  const a = await Drive.about();
  S.user = { name: a.user.displayName, email: a.user.emailAddress }; ls.set('cn_user', S.user); ls.set('cn_email', S.user.email);
  if (!S.sheetId) {
    const files = await Drive.find();
    if (files.length === 1) useArchive(files[0].id, files[0].capabilities?.canEdit !== false);
    else if (files.length > 1) { S.candidates = files; return go('pick'); }
    else return go('setup');
  }
  await loadCache(); render();
  await pull(); go(ls.get('cn_view') || 'timeline'); sync();
}
async function saveDraft() {
  const d = S.draft;
  if (d.busy) return toast('Even geduld, media wordt nog verwerkt');
  const has = (d.tekst || '').trim() || (d.titel || '').trim() || d.media.length || d.gezondheidstype;
  if (!has) return toast(d.type === 'quote' ? 'Wat zei hij?' : 'Voeg tekst of een foto toe');
  if (!d.datum) return toast('Kies een datum');
  if (!DEMO && !Auth.valid() && navigator.onLine && Auth.client) Auth.request('').then(() => sync()).catch(() => {});
  const fields = {
    type: d.type, datum: d.datum, titel: d.titel.trim(), tekst: d.tekst.trim(), notitie: d.notitie.trim(),
    tags: String(d.tags || '').split(',').map(s => s.trim()).filter(Boolean), favoriet: !!d.favoriet,
    gezondheidstype: d.type === 'gezondheid' ? d.gezondheidstype : '', ernst: d.type === 'gezondheid' ? d.ernst : '',
    symptomen: d.type === 'gezondheid' ? d.symptomen.trim() : '', medicatie: d.type === 'gezondheid' ? d.medicatie.trim() : '', duur: d.type === 'gezondheid' ? d.duur : '',
    media: d.media.map(({ preview, ...m }) => m),
  };
  const now = nowIso();
  let it = d.id && S.items.find(i => i.id === d.id);
  if (it) Object.assign(it, fields, { bijgewerkt: now, _pending: !DEMO });
  else { it = { id: uid(), ...fields, auteur: firstName(), aangemaakt: now, bijgewerkt: now, verwijderd: false, _pending: !DEMO }; S.items.push(it); }
  S.draft = null; S.sheet = null; renderSheet();
  await saveCache(); render(); toast('Bewaard in het archief'); sync();
}
async function addFiles(files) {
  const d = S.draft; if (!d) return;
  for (const file of files) {
    if (file.size > 300e6) { toast(`${file.name} is te groot (max 300 MB)`); continue; }
    d.busy++; renderSheet();
    try {
      const p = await processFile(file);
      const key = uid();
      await store.set('blobs', 'f' + key, p.full);
      if (p.thumb) await store.set('blobs', 't' + key, p.thumb);
      if (S.draft !== d) { store.del('blobs', 'f' + key); store.del('blobs', 't' + key); return; }
      d.media.push({ local: 'f' + key, thumbLocal: p.thumb ? 't' + key : '', kind: p.kind, mime: p.mime, name: p.name, preview: p.thumb ? URL.createObjectURL(p.thumb) : '' });
    } catch (e) { console.error(e); toast('Kon ' + file.name + ' niet verwerken'); }
    d.busy--; if (S.draft === d) renderSheet();
  }
}

const actions = {
  nav: (el) => go(el.dataset.v),
  add: () => openSheet('picker'),
  'draft-type': (el) => { S.draft = newDraft(el.dataset.t); openSheet('form'); },
  'draft-sugg': (el) => { S.draft.titel = el.dataset.v; renderSheet(); const ta = $('#sheet-root [data-d="tekst"]'); ta?.focus(); },
  'draft-ht': (el) => { S.draft.gezondheidstype = S.draft.gezondheidstype === el.dataset.v ? '' : el.dataset.v; renderSheet(); },
  'draft-ernst': (el) => { S.draft.ernst = S.draft.ernst === el.dataset.v ? '' : el.dataset.v; renderSheet(); },
  'draft-more': () => { S.draft.more = true; renderSheet(); },
  'draft-fav': () => { S.draft.favoriet = !S.draft.favoriet; renderSheet(); },
  'draft-media': () => $('#file-in').click(),
  'draft-rm': (el) => { const [m] = S.draft.media.splice(+el.dataset.ix, 1); if (m?.local && !S.draft.id) { store.del('blobs', m.local); store.del('blobs', m.thumbLocal); } renderSheet(); },
  save: () => saveDraft(),
  close: () => closeSheet(),
  open: (el) => openSheet('detail:' + el.dataset.id),
  edit: (el) => { const it = S.items.find(i => i.id === el.dataset.id); S.draft = newDraft(it.type, { ...it, tags: it.tags.join(', '), media: it.media.map(m => ({ ...m })) }); openSheet('form'); },
  fav: async (el) => { const it = S.items.find(i => i.id === el.dataset.id); it.favoriet = !it.favoriet; it._pending = !DEMO; await saveCache(); render(); sync(); },
  del: async (el) => {
    const id = el.dataset.id;
    if (S.confirmDel !== id) { S.confirmDel = id; return renderSheet(); }
    const it = S.items.find(i => i.id === id); it.verwijderd = true; it._pending = !DEMO; it.bijgewerkt = nowIso();
    S.confirmDel = null; closeSheet(); await saveCache(); render(); toast('Verwijderd'); sync();
  },
  tag: (el) => { S.f = { q: el.dataset.v, types: new Set(), year: '', age: '' }; closeSheet(); go('timeline'); },
  lightbox: (el, e) => { e.stopPropagation(); openLightbox(el.dataset.id, +el.dataset.ix); },
  ftype: (el) => { const t = el.dataset.t; S.f.types.has(t) ? S.f.types.delete(t) : S.f.types.add(t); render(); },
  fclear: () => { S.f = { q: '', types: new Set(), year: '', age: '' }; render(); },
  chapter: (el) => go('chapter', el.dataset.y),
  'edit-intro': (el) => { S.editIntro = +el.dataset.y; render(); $('#intro-ta')?.focus(); },
  'cancel-intro': () => { S.editIntro = null; render(); },
  'save-intro': async (el) => { const y = +el.dataset.y; const t = $('#intro-ta').value.trim(); S.editIntro = null; try { await setChapterIntro(y, t); toast('Inleiding bewaard'); } catch (e) { toast('Bewaren mislukt: ' + e.message); } render(); },
  print: () => window.print(),
  login: async () => { try { await Auth.request(''); await afterLogin(); } catch (e) { toast(e.message); } },
  connect: async () => { try { await Auth.request(''); S.needAuth = false; renderBanner(); if (!S.user) await afterLogin(); else sync(); } catch (e) { toast(e.message); } },
  research: async (el) => { try { const files = await Drive.find(); if (files.length === 1) { useArchive(files[0].id, files[0].capabilities?.canEdit !== false); await afterLogin(); } else if (files.length > 1) { S.candidates = files; go('pick'); } else toast('Nog geen gedeeld archief gevonden'); } catch (e) { toast(e.message); } },
  pick: async (el) => { useArchive(el.dataset.id, el.dataset.edit === '1'); await afterLogin(); },
  'create-archive': async (el) => {
    const n = $('#su-naam').value.trim() || 'Newt'; const gd = $('#su-gd').value;
    if (!gd) return toast('Vul de geboortedatum in');
    el.disabled = true; el.textContent = 'Archief wordt aangemaakt…';
    try { const id = await createArchive(n, gd); useArchive(id, true); S.settings = { naam: n, geboortedatum: gd }; await pull(); go('timeline'); toast('Het archief is klaar'); }
    catch (e) { el.disabled = false; el.textContent = 'Archief aanmaken'; toast('Mislukt: ' + e.message); }
  },
  'save-settings': async () => {
    const n = $('#set-naam').value.trim(); const gd = $('#set-gd').value;
    try { if (n && n !== S.settings.naam) await setSetting('naam', n); if (gd !== S.settings.geboortedatum) await setSetting('geboortedatum', gd); toast('Bewaard'); render(); } catch (e) { toast('Bewaren mislukt: ' + e.message); }
  },
  'share-role': (el) => { S.shareRole = el.dataset.r; const v = $('#sh-email')?.value; render(); if (v) $('#sh-email').value = v; },
  share: async () => {
    const email = $('#sh-email').value.trim(); if (!/.+@.+\..+/.test(email)) return toast('Vul een geldig e-mailadres in');
    try { await Drive.share(S.rootFolderId, email, S.shareRole || 'writer'); toast('Uitnodiging verstuurd'); $('#sh-email').value = ''; } catch (e) { toast('Delen mislukt: ' + e.message); }
  },
  'copy-export': async () => { const t = exportMarkdown(); try { await navigator.clipboard.writeText(t); toast('Gekopieerd — plak het in een gesprek met Claude'); } catch { download(`chronicles-of-${naam().toLowerCase()}.md`, t, 'text/markdown'); } },
  'dl-md': () => download(`chronicles-of-${naam().toLowerCase()}-${todayStr()}.md`, exportMarkdown(), 'text/markdown'),
  'dl-json': () => download(`chronicles-of-${naam().toLowerCase()}-backup-${todayStr()}.json`, JSON.stringify({ exported: nowIso(), settings: S.settings, chapters: S.chapters, items: S.items.map(({ _pending, ...i }) => i) }, null, 2), 'application/json'),
  'sync-now': () => { if (!Auth.valid() && !DEMO) return actions.connect(); sync(false); },
  signout: () => { Auth.signOut(); ['cn_sheet', 'cn_user', 'cn_view'].forEach(ls.del); location.reload(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = actions[el.dataset.a]; if (!a) return;
  if (el.tagName === 'A') return;
  e.preventDefault(); a(el, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { const lb = $('.lightbox'); if (lb) lb.remove(); else if (S.sheet) closeSheet(); }
  if (e.key === 'Enter' && e.target.matches('article[data-a]')) e.target.click();
});
let searchT;
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.d && S.draft) {
    S.draft[t.dataset.d] = t.value;
    if (t.dataset.d === 'datum') { const o = $('#age-out'); if (o) o.textContent = ageLabel(t.value) || '—'; }
    if (t.dataset.d === 'titel' && S.draft.type === 'mijlpaal') $('#sheet-root .wrapchips')?.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.v === t.value));
  }
  if (t.dataset.f === 'q') { S.f.q = t.value; clearTimeout(searchT); searchT = setTimeout(render, 180); }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.f === 'age' || t.dataset.f === 'year') { S.f[t.dataset.f] = t.value; render(); }
  if (t.dataset.hf) { S.hf[t.dataset.hf] = t.value; render(); }
  if (t.id === 'file-in') { const files = [...t.files]; t.value = ''; addFiles(files); }
});
window.addEventListener('online', () => { renderBanner(); sync(); });
window.addEventListener('offline', renderBanner);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Auth.valid()) sync(); });
setInterval(() => { if (document.visibilityState === 'visible' && Auth.valid() && !S.sheet) sync(); }, 3 * 60 * 1000);

/* ---------- demo ---------- */
function demoSeed() {
  const b = new Date(); b.setFullYear(b.getFullYear() - 2); b.setMonth(b.getMonth() - 4);
  const at = (days) => toDS(new Date(b.getTime() + days * 864e5));
  const mk = (days, type, o) => ({ id: uid(), type, datum: at(days), titel: '', tekst: '', notitie: '', tags: [], favoriet: false, gezondheidstype: '', ernst: '', symptomen: '', medicatie: '', duur: '', media: [], auteur: 'Laura', aangemaakt: nowIso(), bijgewerkt: nowIso(), verwijderd: false, ...o });
  S.settings = { naam: 'Newt', geboortedatum: toDS(b) };
  S.items = [
    mk(0, 'moment', { titel: 'Welkom, Newt', tekst: 'Om 04:12 in de nacht. Klein, boos en volmaakt.', favoriet: true, tags: ['geboorte'] }),
    mk(44, 'mijlpaal', { titel: 'Eerste lach', tekst: 'Op de commode, toen papa een raar geluid maakte. Hij deed het daarna nog drie keer.' }),
    mk(62, 'gezondheid', { gezondheidstype: 'Vaccinatie', tekst: 'Eerste prikken bij het consultatiebureau. Flink gehuild, snel weer rustig.', ernst: 'licht' }),
    mk(140, 'mijlpaal', { titel: 'Eerste keer omrollen', tekst: 'Van buik naar rug, en hij schrok er zelf het meest van.' }),
    mk(201, 'mijlpaal', { titel: 'Eerste tandje', tekst: 'Linksonder. Een paar nachten slecht geslapen.', tags: ['tandjes'] }),
    mk(260, 'gezondheid', { gezondheidstype: 'Oorontsteking', ernst: 'middel', symptomen: 'Koorts 39,1, trekken aan oor', medicatie: 'Paracetamol', duur: 4, tekst: 'Huisarts: afwachten, na 4 dagen over.' }),
    mk(372, 'mijlpaal', { titel: 'Eerste stapjes', tekst: 'Vier stapjes van de bank naar oma. Daarna met een grote grijns op zijn billen.', favoriet: true, tags: ['opa & oma'] }),
    mk(410, 'mijlpaal', { titel: 'Eerste woordje', tekst: '"Da!" — voor alles wat hij wil hebben. Vooral de kat.' }),
    mk(455, 'gezondheid', { gezondheidstype: 'Waterpokken', ernst: 'middel', symptomen: 'Blaasjes op buik en rug, jeuk', duur: 8, medicatie: 'Zinkzalf' }),
    mk(520, 'moment', { tekst: 'Wil elke avond hetzelfde boekje over de rups. Kent het einde uit zijn hoofd en roept het net te vroeg.', tags: ['boeken', 'bedtijd'] }),
    mk(600, 'quote', { tekst: 'Mama, de maan loopt met ons mee!', notitie: 'In de auto terug van opa en oma', favoriet: true }),
    mk(640, 'gezondheid', { gezondheidstype: 'Koorts', ernst: 'licht', duur: 2, symptomen: '38,6', tekst: 'Hangerig, veel geslapen.' }),
    mk(700, 'quote', { tekst: 'Papa, waarom heeft de maan geen schoenen aan?', notitie: 'Bij het naar bed gaan' }),
    mk(745, 'moment', { titel: 'Eerste keer naar zee', tekst: 'Rende op de golven af, en even hard weer terug. Zand overal.', tags: ['vakantie'] }),
    mk(780, 'quote', { tekst: 'Ik ben niet moe, mijn ogen zijn alleen dicht.', notitie: 'Om kwart over zeven, half in slaap op de bank' }),
    mk(810, 'mijlpaal', { titel: 'Eerste zinnetje', tekst: '"Newt ook koekje." Heel duidelijk wat hij bedoelde.', tags: ['eten'] }),
  ];
  S.chapters = { 0: 'Een jaar van weinig slaap en veel verwondering. Newt keek alles aan alsof hij het voor het eerst zag — wat ook zo was.' };
}

/* ---------- start ---------- */
async function boot() {
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !QS.has('nosw')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (DEMO) {
    S.user = { name: 'Laura', email: '' };
    if (!(await loadCache())) { demoSeed(); await saveCache(); }
    S.view = ls.get('cn_view') || 'timeline'; render(); return;
  }
  Auth.load();
  if (S.sheetId) { await loadCache(); S.view = ls.get('cn_view') || 'timeline'; }
  else S.view = 'welcome';
  render();
  const ok = await Auth.loadScript();
  if (!ok) { if (!S.sheetId) $('#app').innerHTML = `<section class="welcome"><h1>Offline</h1><p>Maak verbinding met internet om in te loggen.</p></section>`; return; }
  if (Auth.valid()) { try { if (!S.user || !S.sheetId) await afterLogin(); else sync(); } catch (e) { console.error(e); } }
  else if (S.sheetId) { S.needAuth = true; renderBanner(); }
}
boot();
