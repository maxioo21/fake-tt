'use strict';
/* ============================================================
   Kadr Studio — narzędzia pomocnicze
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = (o) => JSON.parse(JSON.stringify(o));
const isNum = (v) => typeof v === 'number' && isFinite(v);

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat(3)) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}

/* ---------- easing ---------- */
const ease = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
  outElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
  },
};

/* deterministyczny generator liczb losowych (efekty muszą wyglądać tak samo w podglądzie i eksporcie) */
function rng(seed) {
  let a = (seed >>> 0) + 0x6D2B79F5;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- czas ---------- */
function fmtTime(t, frames) {
  t = Math.max(0, t || 0);
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * (frames ? 30 : 100));
  const p = (n) => String(n).padStart(2, '0');
  return p(m) + ':' + p(s) + (frames ? ':' : '.') + p(cs);
}
function fmtDur(t) {
  t = Math.max(0, t || 0);
  const m = Math.floor(t / 60), s = (t % 60);
  return m ? m + ':' + String(Math.floor(s)).padStart(2, '0') : s.toFixed(1) + 's';
}

function hex2rgb(hex) {
  let x = (hex || '#000').replace('#', '');
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  const n = parseInt(x, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ---------- zdarzenia ---------- */
const Bus = {
  m: {},
  on(e, f) { (this.m[e] = this.m[e] || []).push(f); },
  emit(e, a) { (this.m[e] || []).forEach((f) => { try { f(a); } catch (err) { console.error(err); } }); },
};

/* ---------- czekanie na zdarzenie elementu ---------- */
function once(el, ev, ms = 8000) {
  return new Promise((res, rej) => {
    let done = false;
    const ok = () => { if (done) return; done = true; cleanup(); res(); };
    const bad = () => { if (done) return; done = true; cleanup(); rej(new Error('media error')); };
    const to = setTimeout(() => { if (done) return; done = true; cleanup(); rej(new Error('timeout ' + ev)); }, ms);
    function cleanup() { clearTimeout(to); el.removeEventListener(ev, ok); el.removeEventListener('error', bad); }
    el.addEventListener(ev, ok);
    el.addEventListener('error', bad);
  });
}

function loadImage(url) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('image error'));
    i.src = url;
  });
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('script ' + src));
    document.head.appendChild(s);
  });
}

function mkCanvas(w, hgt) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(hgt));
  return c;
}

/* ---------- ikony ---------- */
const ICONS = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4.2" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/>',
  film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01"/>',
  sparkles: '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M19 14l.9 2.1 2.1.9-2.1.9L19 20l-.9-2.1-2.1-.9 2.1-.9z"/>',
  transition: '<rect x="2.5" y="6" width="8" height="12" rx="1.5"/><rect x="13.5" y="6" width="8" height="12" rx="1.5"/><path d="M11 12h2"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  wand: '<path d="m4 20 11-11 2 2L6 22z"/><path d="M15 3v3M13.5 4.5h3M20 9v3M18.5 10.5h3M19 3l1 1M5 7l1 1"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  volumeX: '<path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6"/>',
  download: '<path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16"/>',
  upload: '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 20h16"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  video: '<rect x="2.5" y="5.5" width="13" height="13" rx="2"/><path d="m15.5 10 6-3.5v11l-6-3.5"/>',
  scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><circle cx="12" cy="10.5" r="2.5"/><path d="M7.5 17.5c.9-2.2 2.5-3.2 4.5-3.2s3.6 1 4.5 3.2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a10 10 0 1 1 17.4 0"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  flip: '<path d="M12 3v18"/><path d="M8 7 3 12l5 5z"/><path d="m16 7 5 5-5 5z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  skipBack: '<path d="M6 5v14"/><path d="M19 5.5v13L9 12z" fill="currentColor"/>',
  skipFwd: '<path d="M18 5v14"/><path d="M5 5.5v13l10-6.5z" fill="currentColor"/>',
  magnet: '<path d="M5 3v9a7 7 0 0 0 14 0V3h-4v9a3 3 0 0 1-6 0V3z"/><path d="M5 7h4M15 7h4"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevRight: '<path d="m9 6 6 6-6 6"/>',
  freeze: '<path d="M12 2v20M4.2 7l15.6 10M19.8 7 4.2 17"/><path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  eraser: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a2 2 0 0 1 2.8 0l5.2 5.2a2 2 0 0 1 0 2.8L13 21"/><path d="M22 21H7M5 11l9 9"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 14h.01M15 14h.01M2 14h2M20 14h2"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 6.2A9.5 9.5 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.1 7.5A17 17 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 3.9-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  diamond: '<path d="M12 3l8 9-8 9-8-9z"/>',
  clipboard: '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V3h6v2"/>',
  wave: '<path d="M2 12h2l2-6 3 12 3-16 3 14 2-6h5"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
};
function icon(name, size = 18) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------- toast ---------- */
let toastTimer = 0;
function toast(msg, kind) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.dataset.kind = kind || '';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), kind === 'err' ? 5200 : 2600);
}

/* ---------- zapis pliku (capability "downloads" w artefakcie, zwykłe pobieranie w aplikacji) ---------- */
let _dl;
async function saveFile(filename, data) {
  try {
    if (_dl === undefined) {
      _dl = (window.claude && window.claude.use) ? await Promise.race([window.claude.use('downloads'), new Promise((r) => setTimeout(() => r(null), 2500))]) : null;
    }
  } catch (e) { _dl = null; }
  if (_dl) {
    try { await _dl.save({ filename, data }); return true; }
    catch (e) {
      if (e && e.code === 'declined') return false;
      toast('Nie udało się zapisać pliku (' + (e && e.code || 'błąd') + ')', 'err');
      return false;
    }
  }
  const blob = data instanceof Blob ? data : new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}

/* ---------- audio ---------- */
let _ac;
function getAC() {
  if (!_ac) { const C = window.AudioContext || window.webkitAudioContext; _ac = new C(); }
  return _ac;
}
