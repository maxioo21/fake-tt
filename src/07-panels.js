'use strict';
/* ============================================================
   Kadr Studio — panele boczne, inspektor, narzędzia
   ============================================================ */
const TEXT_STYLES = [
  { name: 'Klasyk', t: { font: 'Montserrat', bold: true, color: '#ffffff', strokeW: 0, shadowB: 0.18, shadowC: '#000000', bg: '' } },
  { name: 'TikTok', t: { font: 'Montserrat', bold: true, color: '#ffffff', strokeC: '#000000', strokeW: 0.16, shadowB: 0, bg: '' } },
  { name: 'Komiks', t: { font: 'Permanent Marker', bold: false, color: '#ffe14d', strokeC: '#1a1a1a', strokeW: 0.18, shadowB: 0.1, shadowC: '#000000', bg: '' } },
  { name: 'Neon', t: { font: 'Righteous', bold: false, color: '#c9fbff', strokeW: 0, shadowC: '#00e5ff', shadowB: 0.55, bg: '' } },
  { name: 'Kino', t: { font: 'Playfair Display', bold: false, italic: true, color: '#f5e9d0', strokeW: 0, shadowB: 0.14, shadowC: '#000000', spacing: 0.04, bg: '' } },
  { name: 'Etykieta', t: { font: 'Anton', bold: false, color: '#111111', bg: '#ffd23f', bgA: 1, strokeW: 0, shadowB: 0, upper: true, spacing: 0.02 } },
  { name: 'Retro', t: { font: 'Pacifico', bold: false, color: '#ff8fc7', strokeC: '#4a1d6b', strokeW: 0.14, shadowC: '#4a1d6b', shadowB: 0.12, bg: '' } },
  { name: 'Ciemna belka', t: { font: 'Montserrat', bold: true, color: '#ffffff', bg: '#000000', bgA: 0.72, strokeW: 0, shadowB: 0 } },
  { name: 'Złoto', t: { font: 'Playfair Display', bold: true, color: '#ffd978', strokeC: '#6b4a00', strokeW: 0.1, shadowB: 0.22, shadowC: '#000000', bg: '' } },
  { name: 'Tytuł', t: { font: 'Bebas Neue', bold: false, color: '#ffffff', strokeW: 0, shadowB: 0.2, shadowC: '#000000', spacing: 0.08, upper: true, size: 0.14, bg: '' } },
  { name: 'Odręczny', t: { font: 'Caveat', bold: true, color: '#ffffff', strokeC: '#222222', strokeW: 0.07, shadowB: 0.1, shadowC: '#000000', size: 0.11, bg: '' } },
  { name: 'Alert', t: { font: 'Anton', bold: false, color: '#ffffff', bg: '#e11d48', bgA: 1, upper: true, strokeW: 0, shadowB: 0 } },
  { name: 'Lobster', t: { font: 'Lobster', bold: false, color: '#ffffff', strokeC: '#ff3d81', strokeW: 0.16, shadowB: 0, bg: '' } },
  { name: 'Minimal', t: { font: 'Space Grotesk', bold: false, color: '#ffffff', strokeW: 0, shadowB: 0.08, shadowC: '#000000', spacing: 0.12, upper: true, size: 0.06, bg: '' } },
];
const EMOJI = {
  'Popularne': ['🔥', '❤️', '😂', '😍', '🎉', '✨', '👍', '💯', '🌟', '😎', '🥳', '💥', '🎵', '📸', '🚀', '🙌', '😮', '👀', '💫', '🌈', '👑', '💎', '⚡', '🎬'],
  'Buźki': ['😀', '😁', '🤣', '😊', '😇', '🥰', '😘', '🤩', '🤔', '🙄', '😴', '😭', '😡', '🤯', '🥶', '🥵', '🤢', '🤗', '🤫', '🫡', '😈', '👻', '💀', '🤡'],
  'Gesty': ['👍', '👎', '👏', '🙏', '💪', '🤝', '✌️', '🤞', '🤟', '👌', '👋', '🫶', '👉', '👆', '☝️', '✊', '🖐️', '🤙', '🫰', '🙈', '🙉', '🙊', '💋', '👣'],
  'Natura': ['🌞', '🌙', '⭐', '☁️', '🌧️', '❄️', '🔥', '🌊', '🌸', '🌹', '🌴', '🍀', '🐶', '🐱', '🦋', '🐼', '🦄', '🐢', '🦁', '🐝', '🌍', '🌋', '🌵', '🍁'],
  'Jedzenie': ['🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍰', '🍫', '🍿', '☕', '🍺', '🍷', '🍓', '🍉', '🍌', '🥑', '🍒', '🍋', '🥐', '🍦', '🧁', '🥤', '🍜', '🥞'],
  'Symbole': ['✅', '❌', '❗', '❓', '💡', '🔔', '📍', '🎯', '🏆', '🎁', '💰', '📈', '⏰', '🔒', '🔑', '➡️', '⬅️', '⬆️', '⬇️', '🔴', '🟢', '🔵', '▶️', '🆕'],
};

/* ---------- małe komponenty ---------- */
const F = {
  slider(label, get, set, min, max, step, fmt, onCommit) {
    const out = h('output'), inp = h('input', { type: 'range', min, max, step, value: get() });
    const upd = () => { out.textContent = fmt ? fmt(+inp.value) : (+inp.value).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0); };
    inp.addEventListener('input', () => { set(+inp.value); upd(); Engine.invalidate(); });
    inp.addEventListener('change', () => { commit(); if (onCommit) onCommit(); });
    inp.addEventListener('dblclick', () => { /* podwójne kliknięcie = wartość domyślna */ });
    upd();
    return h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, label), out), inp);
  },
  seg(label, opts, get, set) {
    const wrap = h('div', { class: 'seg' });
    opts.forEach(([v, text]) => {
      const b = h('button', { class: get() === v ? 'on' : '', onclick: () => { set(v); commit(); } }, text);
      wrap.append(b);
    });
    return h('div', { class: 'ctl' }, label ? h('div', { class: 'cl' }, h('span', {}, label)) : null, wrap);
  },
  toggle(label, get, set) {
    const inp = h('input', { type: 'checkbox' }); inp.checked = !!get();
    inp.addEventListener('change', () => { set(inp.checked); commit(); });
    return h('label', { class: 'ctl tgl' }, h('span', {}, label), inp, h('i'));
  },
  color(label, get, set) {
    const inp = h('input', { type: 'color', value: get() });
    inp.addEventListener('input', () => { set(inp.value); Engine.invalidate(); });
    inp.addEventListener('change', () => commit());
    return h('label', { class: 'ctl clr' }, h('span', {}, label), inp);
  },
  select(label, opts, get, set) {
    const sel = h('select', {}, opts.map(([v, t]) => h('option', { value: v, selected: v === get() }, t)));
    sel.addEventListener('change', () => { set(sel.value); commit(); });
    return h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, label)), sel);
  },
  btn(text, fn, cls, ic) { return h('button', { class: 'btn ' + (cls || ''), onclick: fn, html: (ic ? icon(ic, 16) : '') + `<span>${text}</span>` }); },
  hint(text) { return h('p', { class: 'hint' }, text); },
  title(text) { return h('h4', { class: 'ttl' }, text); },
};

/* ---------- kafelki z podglądem (animowane po najechaniu) ---------- */
const TileAnim = {
  active: null, raf: 0,
  start(t) {
    this.stop(); this.active = t; const t0 = performance.now();
    const loop = (now) => { if (this.active !== t) return; t.draw(((now - t0) / 1700) % 1, (now - t0) / 1000); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  },
  stop() { if (this.active) { const a = this.active; this.active = null; cancelAnimationFrame(this.raf); a.draw(null, 0.4); } },
};
/* ---------- postać do podglądów (jak w CapCut): asymetryczna, żeby było widać odbicia, obroty i kierunki ---------- */
const TW = 168, TH = 106;
function drawCharacter(x, w, h, v) {
  const P0 = v === 0
    ? { bg: ['#ffe0b2', '#ff8fa3'], skin: '#f2b88c', hair: '#2b1b12', shirt: '#2e86ff', cap: '#e53935', acc: '#ffd23f' }
    : { bg: ['#b3ecff', '#7b6cff'], skin: '#c98b62', hair: '#1c1630', shirt: '#ff5ca8', cap: null, acc: '#fff3a8' };
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P0.bg[0]); g.addColorStop(1, P0.bg[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(w * 0.84, h * 0.2, h * 0.15, 0, 7); x.fill(); x.beginPath(); x.arc(w * 0.1, h * 0.85, h * 0.2, 0, 7); x.fill();
  x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, h * 0.9, w, h * 0.1);
  const R = h * 0.2, cx = w * 0.5, cy = h * 0.41;
  x.lineCap = 'round'; x.lineJoin = 'round';
  /* ręka z gwiazdką (po prawej) */
  x.strokeStyle = P0.shirt; x.lineWidth = R * 0.44; x.beginPath(); x.moveTo(cx + R * 1.2, cy + R * 1.4); x.lineTo(cx + R * 1.85, cy + R * 1.9); x.stroke();
  x.fillStyle = P0.skin; x.beginPath(); x.arc(cx + R * 1.9, cy + R * 2.0, R * 0.26, 0, 7); x.fill();
  x.fillStyle = P0.acc; x.save(); x.translate(cx + R * 2.0, cy + R * 1.55); x.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? R * 0.22 : R * 0.52, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); x.restore();
  /* tułów */
  x.fillStyle = P0.shirt; x.beginPath(); x.moveTo(cx - R * 1.5, h + 2); x.quadraticCurveTo(cx - R * 1.45, cy + R * 1.3, cx - R * 0.55, cy + R * 1.05); x.lineTo(cx + R * 0.55, cy + R * 1.05); x.quadraticCurveTo(cx + R * 1.45, cy + R * 1.3, cx + R * 1.5, h + 2); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(cx - R * 1.42, cy + R * 2.05, R * 2.84, R * 0.26);
  x.fillStyle = P0.skin; x.fillRect(cx - R * 0.28, cy + R * 0.72, R * 0.56, R * 0.45);
  /* ręka machająca (po lewej) */
  x.strokeStyle = P0.shirt; x.lineWidth = R * 0.44; x.beginPath(); x.moveTo(cx - R * 1.15, cy + R * 1.4); x.lineTo(cx - R * 1.95, cy + R * 0.6); x.lineTo(cx - R * 1.75, cy - R * 0.2); x.stroke();
  x.fillStyle = P0.skin; x.beginPath(); x.arc(cx - R * 1.75, cy - R * 0.38, R * 0.3, 0, 7); x.fill();
  /* głowa */
  x.fillStyle = P0.skin; x.beginPath(); x.arc(cx - R * 0.98, cy + R * 0.05, R * 0.2, 0, 7); x.arc(cx + R * 0.98, cy + R * 0.05, R * 0.2, 0, 7); x.fill();
  x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
  if (P0.cap) {
    x.fillStyle = P0.cap; x.beginPath(); x.arc(cx, cy - R * 0.02, R * 1.04, Math.PI * 1.02, Math.PI * 1.98); x.closePath(); x.fill();
    x.fillStyle = '#b71c1c'; x.beginPath(); x.ellipse(cx + R * 0.7, cy - R * 0.04, R * 0.95, R * 0.2, -0.1, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy - R * 0.75, R * 0.13, 0, 7); x.fill();
  } else {
    x.fillStyle = P0.hair; x.beginPath(); x.arc(cx, cy - R * 0.02, R * 1.06, Math.PI * 0.98, Math.PI * 2.02); x.lineTo(cx + R * 0.95, cy - R * 0.2); x.lineTo(cx - R * 0.95, cy - R * 0.2); x.closePath(); x.fill();
    x.beginPath(); x.arc(cx - R * 0.55, cy - R * 1.12, R * 0.4, 0, 7); x.fill();
  }
  /* twarz */
  x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx - R * 0.38, cy + R * 0.12, R * 0.19, R * 0.22, 0, 0, 7); x.ellipse(cx + R * 0.38, cy + R * 0.12, R * 0.19, R * 0.22, 0, 0, 7); x.fill();
  x.fillStyle = '#1b1b1b'; x.beginPath(); x.arc(cx - R * 0.33, cy + R * 0.14, R * 0.1, 0, 7); x.arc(cx + R * 0.43, cy + R * 0.14, R * 0.1, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - R * 0.3, cy + R * 0.1, R * 0.035, 0, 7); x.arc(cx + R * 0.46, cy + R * 0.1, R * 0.035, 0, 7); x.fill();
  x.strokeStyle = '#1b1b1b'; x.lineWidth = R * 0.07; x.beginPath(); x.moveTo(cx - R * 0.6, cy - R * 0.2); x.lineTo(cx - R * 0.2, cy - R * 0.24); x.moveTo(cx + R * 0.2, cy - R * 0.24); x.lineTo(cx + R * 0.62, cy - R * 0.14); x.stroke();
  x.beginPath(); x.arc(cx, cy + R * 0.32, R * 0.4, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
  x.fillStyle = 'rgba(255,90,110,.35)'; x.beginPath(); x.arc(cx - R * 0.68, cy + R * 0.42, R * 0.14, 0, 7); x.arc(cx + R * 0.68, cy + R * 0.42, R * 0.14, 0, 7); x.fill();
}
function drawBadge(x, w, h, letter) {
  x.fillStyle = 'rgba(0,0,0,.6)'; x.beginPath(); if (x.roundRect) x.roundRect(5, 5, h * 0.2, h * 0.2, 4); else x.rect(5, 5, h * 0.2, h * 0.2); x.fill();
  x.fillStyle = '#fff'; x.font = `900 ${Math.round(h * 0.15)}px Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(letter, 5 + h * 0.1, 5 + h * 0.105);
}
const _sceneCache = {};
function sceneFor(w, h, v) {
  const k = Math.round(w) + 'x' + Math.round(h) + ':' + v;
  if (_sceneCache[k]) return _sceneCache[k];
  const c = mkCanvas(w, h); drawCharacter(c.getContext('2d'), c.width, c.height, v);
  if (Object.keys(_sceneCache).length > 24) for (const kk of Object.keys(_sceneCache).slice(0, 8)) delete _sceneCache[kk];
  return (_sceneCache[k] = c);
}
function transFor(w, h) {
  const a = mkCanvas(w, h), b = mkCanvas(w, h);
  [[a, 0, 'A'], [b, 1, 'B']].forEach(([c, v, l]) => { const x = c.getContext('2d'); x.drawImage(sceneFor(w, h, v), 0, 0); drawBadge(x, w, h, l); });
  return [a, b];
}
const _transCache = {};
function transScenes(w = TW, h = TH) { const k = w + 'x' + h; return _transCache[k] || (_transCache[k] = transFor(w, h)); }
function sceneCanvases() { return [sceneFor(TW, TH, 0), sceneFor(TW, TH, 1)]; }

/* ---------- duży podgląd po najechaniu (jak w CapCut) ---------- */
const HoverPop = {
  el: null, cv: null, raf: 0, t0: 0, cur: null,
  PW: 280, PH: 177,
  show(tileEl, t, animated, title) {
    this.hide(); this.cur = t;
    const cv = mkCanvas(this.PW * 2, this.PH * 2); cv.style.width = this.PW + 'px'; cv.style.height = this.PH + 'px';
    const el = h('div', { class: 'hpop' }, cv, h('div', { class: 'hpt' }, title));
    document.body.append(el); this.el = el; this.cv = cv;
    const r = tileEl.getBoundingClientRect();
    let x = r.right + 12; if (x + this.PW + 12 > window.innerWidth) x = r.left - this.PW - 14;
    x = clamp(x, 8, window.innerWidth - this.PW - 12);
    const y = clamp(r.top + r.height / 2 - this.PH / 2, 8, window.innerHeight - this.PH - 48);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    const cx = cv.getContext('2d'); this.t0 = performance.now();
    const loop = (now) => {
      if (this.cur !== t) return;
      cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; cx.filter = 'none'; cx.clearRect(0, 0, cv.width, cv.height);
      try { if (animated) t.fn(cx, cv.width, cv.height, ((now - this.t0) / 1800) % 1, (now - this.t0) / 1000); else t.fn(cx, cv.width, cv.height, null, 0.4); } catch (e) { /* ignore */ }
      if (animated) this.raf = requestAnimationFrame(loop);
    };
    loop(this.t0);
  },
  hide() { this.cur = null; cancelAnimationFrame(this.raf); if (this.el) { this.el.remove(); this.el = null; } },
};
function tile(label, drawFn, o = {}) {
  const cv = mkCanvas(TW, TH); cv.className = 'tcv';
  const x = cv.getContext('2d');
  const t = { fn: drawFn, draw: (p, tm) => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, TW, TH); try { drawFn(x, TW, TH, p, tm); } catch (e) { /* ignore */ } } };
  t.draw(null, 0.4);
  const el = h('button', { class: 'tile' + (o.active ? ' on' : ''), title: o.title || label, onclick: o.onclick }, cv, h('span', { class: 'tl' }, label));
  if (o.drag) DND.attach(el, o.drag);
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || document.body.classList.contains('dnd')) return;
    if (o.anim !== false) TileAnim.start(t);
    HoverPop.show(el, t, o.anim !== false, o.popTitle || label);
  });
  el.addEventListener('pointerleave', () => { TileAnim.stop(); HoverPop.hide(); });
  el.addEventListener('pointerdown', () => HoverPop.hide());
  return el;
}
/* chwila, w której efekt jest najlepiej widoczny na nieruchomym podglądzie */
const FX_PREVIEW_T = { flash: 0.03, strobe: 0.02, zoompunch: 0.02, pulse: 0.2, lightflicker: 0.1, slowzoom: 3, hop: 0.3, zoomlens: 0.55, overexpose: 0.5, filmburn: 1, leak: 1 };
function fxTile(id, active, onclick) {
  const F0 = FX[id], st = FX_PREVIEW_T[id] == null ? 0.37 : FX_PREVIEW_T[id];
  return tile(F0.name, (x, w, hh, p, tm) => {
    const cv = POOL.get(w, hh), cx = cv.getContext('2d'); cx.drawImage(sceneFor(w, hh, 0), 0, 0);
    F0.fn(cv, 0.8, p == null ? st : st + tm); x.drawImage(cv, 0, 0); POOL.free(cv);
  }, { active, onclick, drag: { kind: 'fx', id } });
}
const TRANS_PREVIEW_P = { dipblack: 0.32, dipwhite: 0.32, flashcut: 0.43, invert: 0.4, colorflash: 0.4, blink: 0.35, vflip: 0.3, flip: 0.3, static: 0.45, bounce: 0.3, flicker: 0.4, hueflash: 0.4, shatter: 0.4, zoomblur: 0.45 };
function transTile(id, active, onclick) {
  if (id === 'none') return tile('Brak', (x, w, hh) => { const [A] = transScenes(w, hh); x.drawImage(A, 0, 0); x.fillStyle = 'rgba(10,12,18,.55)'; x.fillRect(0, 0, w, hh); x.strokeStyle = '#e5e7ef'; x.lineWidth = Math.max(3, w * 0.025); x.beginPath(); x.moveTo(w * 0.38, hh * 0.3); x.lineTo(w * 0.62, hh * 0.7); x.moveTo(w * 0.62, hh * 0.3); x.lineTo(w * 0.38, hh * 0.7); x.stroke(); }, { active, onclick, anim: false, title: 'Bez przejścia (twarde cięcie)' });
  const T0 = TRANS[id], sp = TRANS_PREVIEW_P[id] == null ? 0.5 : TRANS_PREVIEW_P[id];
  return tile(T0.name, (x, w, hh, p) => {
    const [A, B] = transScenes(w, hh), cl = POOL.get(w, hh);
    const q = p == null ? sp : (p < 0.5 ? p * 2 : (1 - p) * 2);
    T0.fn(cl.getContext('2d'), A, B, clamp(q, 0, 1), w, hh); x.drawImage(cl, 0, 0); POOL.free(cl);
    if (p == null) { const fs = Math.round(hh * 0.11); x.font = `800 ${fs}px sans-serif`; x.textAlign = 'center'; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(w - fs * 4.2, hh - fs * 1.6, fs * 4, fs * 1.3); x.fillStyle = '#fff'; x.fillText('A → B', w - fs * 2.2, hh - fs * 0.65); }
  }, { active, onclick, drag: { kind: 'trans', id }, title: T0.name + ' (najedź: zobaczysz przejście A → B; przeciągnij na styk klipów)' });
}
function filterTile(id, active, onclick) {
  const F0 = FILTERS[id], fake = { adj: defAdj(), filter: { id, amt: 1 } };
  return tile(F0.name, (x, w, hh) => {
    const sc = sceneFor(w, hh, 0);
    x.drawImage(sc, 0, 0);               /* lewa połowa: oryginał */
    const cv = POOL.get(w, hh), cx = cv.getContext('2d');
    if (HAS_FILTER) cx.filter = cssFilter(fake, hh);
    cx.drawImage(sc, 0, 0); cx.filter = 'none';
    applyOverlays(cv, overlayList(fake), 0.4);
    x.save(); x.beginPath(); x.rect(w / 2, 0, w / 2, hh); x.clip(); x.drawImage(cv, 0, 0); x.restore(); POOL.free(cv);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(w / 2 - 1, 0, 2, hh);
    const fs = Math.round(hh * 0.095); x.font = `800 ${fs}px sans-serif`; x.textAlign = 'center'; x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(4, hh - fs * 1.5, fs * 3.2, fs * 1.2); x.fillRect(w - fs * 3.2 - 4, hh - fs * 1.5, fs * 3.2, fs * 1.2);
    x.fillStyle = '#fff'; x.fillText('przed', 4 + fs * 1.6, hh - fs * 0.6); x.fillText('po', w - fs * 1.6 - 4, hh - fs * 0.6);
  }, { active, onclick, anim: false, drag: id === 'none' ? null : { kind: 'filter', id }, title: F0.name + ' (lewa połowa: oryginał, prawa: z filtrem; przeciągnij na klip)' });
}
/* animacje: w spoczynku 4 klatki (1→4); po najechaniu gra w dużym podglądzie na postaci (a dla tekstu na napisie) */
function animTile(dict, id, kind, active, onclick, ctxType) {
  const A0 = dict[id];
  const mkTextStyle = () => { const c = byId(S.sel); return Object.assign(defText('Napis'), c && c.type === 'text' ? c.text : { size: 0.16, shadowB: 0.2 }); };
  if (id === 'none') return tile('Brak', (x, w, hh) => { x.fillStyle = '#14161c'; x.fillRect(0, 0, w, hh); const sw = w * 0.42, sh = hh * 0.5; x.globalAlpha = 0.55; x.drawImage(sceneFor(w, hh, 0), (w - sw) / 2, (hh - sh) / 2, sw, sh); x.globalAlpha = 1; x.strokeStyle = '#e5e7ef'; x.lineWidth = Math.max(3, w * 0.02); x.beginPath(); x.moveTo(w * 0.4, hh * 0.35); x.lineTo(w * 0.6, hh * 0.65); x.moveTo(w * 0.6, hh * 0.35); x.lineTo(w * 0.4, hh * 0.65); x.stroke(); }, { active, onclick, anim: false, title: 'Bez animacji' });
  const kindLabel = { in: 'wejście', out: 'wyjście', loop: 'pętla' }[kind];
  return tile(A0.name, (x, w, hh, p, tm) => {
    const stateAt = (lt) => {
      const fake = { dur: 2, animIn: { id: 'none', dur: 1 }, animOut: { id: 'none', dur: 1 }, animLoop: { id: 'none', amt: 1 } };
      if (kind === 'loop') fake.animLoop = { id, amt: 1 }; else if (kind === 'in') fake.animIn = { id, dur: 1 }; else fake.animOut = { id, dur: 1 };
      return animState(fake, lt);
    };
    const tfxAt = (lt) => {
      if (kind === 'loop') return TEXT_LOOP_MODES.includes(id) ? { mode: id, t: lt, p: 1 } : null;
      if (!TEXT_IN_MODES.includes(id)) return null;
      return { mode: id, p: kind === 'in' ? clamp(lt, 0, 1) : clamp(2 - lt, 0, 1), t: lt };
    };
    /* rysuje obiekt w stanie st w prostokącie (ox,oy,W,H); poza prostokąt nic nie wychodzi */
    const put = (lt, alpha, ox, oy, W, H) => {
      const st = stateAt(lt);
      let img, sw, sh;
      if (ctxType === 'text') { const T = mkTextStyle(); T.size = 0.2 * (H / (H * 2.4)) * 2.4 * 0.62; img = makeTextSprite(T, W * 2.4, H * 2.4, tfxAt(lt)); const k = Math.min(1, W * 0.9 / img.width, H * 0.75 / img.height); sw = img.width * k; sh = img.height * k; }
      else { img = sceneFor(Math.round(W * 1.4), Math.round(H * 1.4), 0); sw = W * 0.5; sh = H * 0.56; }
      x.save(); x.beginPath(); x.rect(ox, oy, W, H); x.clip();
      x.translate(ox + W / 2 + st.dx * W, oy + H / 2 + st.dy * H); x.rotate(st.r); x.scale(st.s * st.fl, st.s * st.fy); x.globalAlpha = clamp(st.al * alpha, 0, 1);
      if (HAS_FILTER && st.bl > 0.001) x.filter = `blur(${(st.bl * H).toFixed(1)}px)`;
      if (st.cl) { x.beginPath(); x.rect(-sw / 2 + st.cl.l * sw, -sh / 2 + st.cl.t * sh, Math.max(0, sw * (1 - st.cl.l - st.cl.r)), Math.max(0, sh * (1 - st.cl.t - st.cl.b))); x.clip(); }
      x.drawImage(img, -sw / 2, -sh / 2, sw, sh);
      if (ctxType !== 'text') { x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = Math.max(1, W * 0.008); x.strokeRect(-sw / 2, -sh / 2, sw, sh); }
      x.restore();
    };
    const cell = (ox, oy, W, H) => { x.fillStyle = '#14161c'; x.fillRect(ox, oy, W, H); x.strokeStyle = 'rgba(255,255,255,.2)'; x.setLineDash([3, 3]); x.lineWidth = 1; x.strokeRect(ox + W * 0.25, oy + H * 0.22, W * 0.5, H * 0.56); x.setLineDash([]); };
    if (p == null) {
      const lts = kind === 'in' ? [0.0, 0.3, 0.62, 1.0] : kind === 'out' ? [1.0, 1.3, 1.62, 1.98] : [0, 0.5, 1.0, 1.5];
      const g = Math.round(hh * 0.03), cw = (w - g * 3) / 2, ch = (hh - g * 3) / 2;
      x.fillStyle = '#0c0e13'; x.fillRect(0, 0, w, hh);
      lts.forEach((lt, i) => {
        const ox = g + (i % 2) * (cw + g), oy = g + Math.floor(i / 2) * (ch + g);
        cell(ox, oy, cw, ch); put(lt, 1, ox, oy, cw, ch);
        x.font = `800 ${Math.round(hh * 0.095)}px sans-serif`; x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText(String(i + 1), ox + 4, oy + hh * 0.1);
      });
    } else {
      cell(0, 0, w, hh);
      const base = kind === 'loop' ? tm : kind === 'in' ? p * 1.7 : 1 + p * 1.0;
      for (let k = 4; k >= 1; k--) put(Math.max(0, base - k * 0.045), 0.12 * (5 - k), 0, 0, w, hh);
      put(base, 1, 0, 0, w, hh);
      x.font = `800 ${Math.round(hh * 0.075)}px sans-serif`; x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText(kindLabel, 6, hh - 6);
    }
  }, { active, onclick, drag: { kind: 'anim', dict: kind, id }, popTitle: A0.name + ' · ' + kindLabel, title: A0.name + ' (' + kindLabel + '): kolejne klatki 1 → 4; najedź, aby zobaczyć na dużym podglądzie; przeciągnij na dowolny klip' });
}

/* ============================================================
   UI
   ============================================================ */
const UI = {
  tabs: [
    { id: 'media', label: 'Media', ic: 'film' }, { id: 'text', label: 'Tekst', ic: 'type' }, { id: 'stickers', label: 'Naklejki', ic: 'smile' },
    { id: 'effects', label: 'Efekty', ic: 'sparkles' }, { id: 'trans', label: 'Przejścia', ic: 'transition' }, { id: 'filters', label: 'Filtry', ic: 'wand' },
    { id: 'ready', label: 'Gotowe', ic: 'bolt' }, { id: 'tools', label: 'Narzędzia', ic: 'grid' }, { id: 'inspect', label: 'Edytuj', ic: 'sliders', mobile: true },
  ],
  catState: { effects: 'Popularne', filters: 'Popularne', trans: 'Popularne', stickers: 'Popularne' },
  fxMode: 'auto', toolView: null,

  init() {
    const rail = $('#rail'); rail.innerHTML = '';
    this.tabs.forEach((t) => rail.append(h('button', { class: 'rt' + (t.mobile ? ' mob' : ''), 'data-tab': t.id, title: t.label, onclick: () => this.openTab(t.id), html: icon(t.ic, 22) + `<span>${t.label}</span>` })));
    Bus.on('media', () => { if (S.tab === 'media') this.renderPanel(); });
    Bus.on('select', () => { this.renderInspector(); if (['effects', 'filters', 'trans', 'text', 'ready'].includes(S.tab)) this.renderPanel(true); });
    Bus.on('change', () => { this.renderInspector(); if (['effects', 'filters', 'trans', 'text', 'ready'].includes(S.tab)) this.renderPanel(true); });
    Bus.on('project', () => this.renderInspector());
    Bus.on('time', () => { if (this.kfCtl && this.kfCtl.length) this.kfCtl.forEach((f) => f()); });
    Bus.on('ai', () => { if (S.tab === 'tools' || this.insTab === 'cut') { this.renderInspector(); } });
    this.openTab(S.tab);
    this.renderInspector();
  },
  openTab(id) {
    S.tab = id; this.toolView = id === 'tools' ? this.toolView : null;
    $$('.rt', $('#rail')).forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    $('#app').dataset.tab = id;
    this.renderPanel();
    if (id === 'inspect') this.renderInspector();
    Bus.emit('layout');
  },
  renderPanel(keepScroll) {
    const box = $('#panel'), sc = box.scrollTop;
    box.innerHTML = '';
    const fn = { media: this.pMedia, text: this.pText, stickers: this.pStickers, effects: this.pEffects, trans: this.pTrans, filters: this.pFilters, ready: this.pReady, tools: this.pTools }[S.tab];
    if (fn) fn.call(this, box);
    if (keepScroll) box.scrollTop = sc;
  },

  /* ---------- Media ---------- */
  pMedia(box) {
    const inp = h('input', { type: 'file', multiple: true, accept: 'video/*,image/*,audio/*', hidden: true, id: 'fileIn', onchange: async (e) => { await App.addFiles([...e.target.files]); e.target.value = ''; } });
    box.append(
      h('div', { class: 'p-head' }, h('h3', {}, 'Biblioteka'), F.btn('Importuj', () => inp.click(), 'primary sm', 'upload')),
      inp,
    );
    if (!media.size) {
      box.append(h('div', { class: 'drop-empty', onclick: () => inp.click() }, h('div', { html: icon('upload', 30) }), h('b', {}, 'Upuść pliki tutaj'), h('span', {}, 'wideo, zdjęcia lub muzykę — albo kliknij, aby wybrać')));
      return;
    }
    const grid = h('div', { class: 'mgrid' });
    [...media.values()].forEach((m) => {
      const used = clips.some((c) => c.media === m.id);
      const el = h('div', { class: 'mitem' + (used ? ' used' : ''), draggable: true, title: m.name },
        h('div', { class: 'mth', style: m.thumb ? `background-image:url(${m.thumb})` : '' }, m.kind === 'audio' ? h('span', { class: 'mic', html: icon('music', 26) }) : null,
          h('span', { class: 'dur' }, m.kind === 'image' ? 'zdjęcie' : fmtDur(m.dur)),
          h('button', { class: 'add', title: 'Dodaj na oś czasu', onclick: (e) => { e.stopPropagation(); App.addMedia(m); }, html: icon('plus', 16) })),
        h('div', { class: 'mn' }, m.name));
      el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/kadr-media', m.id); e.dataTransfer.effectAllowed = 'copy'; });
      el.addEventListener('dblclick', () => App.addMedia(m));
      grid.append(el);
    });
    box.append(grid, F.hint('Przeciągnij plik na oś czasu albo kliknij „+”. Pierwszy dodany klip ustawia proporcje filmu.'));
  },

  /* ---------- Tekst ---------- */
  pText(box) {
    const sel = byId(S.sel);
    const isText = sel && sel.type === 'text';
    box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Tekst')), F.btn('Dodaj tekst', () => { App.addText(); }, 'primary block', 'plus'),
      F.hint(isText ? 'Wybierz styl, aby zmienić zaznaczony napis.' : 'Wybierz styl, aby dodać napis w miejscu głowicy.'));
    const grid = h('div', { class: 'tgrid' });
    TEXT_STYLES.forEach((s) => {
      grid.append(tile(s.name, (x, w, hh) => {
        x.fillStyle = '#23262f'; x.fillRect(0, 0, w, hh);
        const T = Object.assign(defText('Aa'), s.t, { size: 0.5, strokeW: (s.t.strokeW || 0) });
        const sp = makeTextSprite(T, hh * 1.2, hh * 1.2, null);
        const k = Math.min((w - 14) / sp.width, (hh - 10) / sp.height, 1.2);
        x.drawImage(sp, (w - sp.width * k) / 2, (hh - sp.height * k) / 2, sp.width * k, sp.height * k);
      }, { anim: false, onclick: () => App.addText(null, s.t) }));
    });
    box.append(grid);
  },

  /* ---------- Naklejki ---------- */
  pStickers(box) {
    box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Naklejki')));
    const cur = this.catState.stickers;
    box.append(h('div', { class: 'chips' }, Object.keys(EMOJI).map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.stickers = k; this.renderPanel(); } }, k))));
    box.append(h('div', { class: 'egrid' }, EMOJI[cur].map((e) => h('button', { class: 'emo', onclick: () => App.addSticker(e) }, e))));
    box.append(F.hint('Kliknij naklejkę, aby dodać ją do filmu. Przesuwaj, skaluj i obracaj ją bezpośrednio na podglądzie.'));
  },

  /* ---------- tryb stosowania (klip / warstwa) ---------- */
  modeSeg() {
    const sel = byId(S.sel), can = sel && isVisual(sel);
    if (this.fxMode === 'auto') this._mode = can ? 'clip' : 'layer';
    else this._mode = this.fxMode;
    if (this._mode === 'clip' && !can) this._mode = 'layer';
    const wrap = h('div', { class: 'seg wide' });
    [['clip', 'Na zaznaczony klip'], ['layer', 'Jako warstwa na osi']].forEach(([v, t]) => wrap.append(h('button', { class: this._mode === v ? 'on' : '', disabled: v === 'clip' && !can, onclick: () => { this.fxMode = v; this.renderPanel(true); } }, t)));
    return wrap;
  },
  chipsFor(key, cats) {
    return h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === this.catState[key] ? ' on' : ''), onclick: () => { this.catState[key] = k; this.renderPanel(); } }, k)));
  },

  /* ---------- Efekty ---------- */
  pEffects(box) {
    box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Efekty')), this.modeSeg(), this.chipsFor('effects', FX_CATS));
    const sel = byId(S.sel), grid = h('div', { class: 'tgrid' });
    Object.values(FX).filter((f) => f.cat === this.catState.effects).forEach((f) => {
      const on = this._mode === 'clip' && sel && sel.fx.some((e) => e.id === f.id);
      grid.append(fxTile(f.id, on, () => {
        if (this._mode === 'clip' && sel) {
          const i = sel.fx.findIndex((e) => e.id === f.id);
          if (i >= 0) sel.fx.splice(i, 1); else sel.fx.push({ id: f.id, amt: 0.6 });
          commit(); if (i < 0) toast('Efekt „' + f.name + '” dodany – siłę ustawisz w panelu po prawej');
        } else { const c = addFxLayer({ fx: [{ id: f.id, amt: 0.6 }] }); commit(); toast('Dodano warstwę efektu na osi'); }
      }));
    });
    box.append(grid, F.hint('Kliknij kafelek albo przeciągnij go na klip (na osi lub na podglądzie). Najedź, aby zobaczyć efekt w ruchu. Kliknij ponownie, aby zdjąć go z klipu.'));
  },

  /* ---------- Przejścia ---------- */
  pTrans(box) {
    box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Przejścia')));
    const sel = byId(S.sel), prev = sel ? prevAdjacent(sel) : null;
    const ok = sel && prev && isVisual(sel) && sel.type !== 'fx';
    box.append(h('div', { class: 'note' + (ok ? ' ok' : '') }, ok ? 'Przejście między „' + this.clipTitle(prev) + '” a „' + this.clipTitle(sel) + '”.' : 'Przeciągnij przejście na styk dwóch klipów na osi (lub na klip) albo zaznacz klip i kliknij kafelek. Można też kliknąć „+” między klipami.'));
    if (ok) box.append(F.slider('Czas trwania', () => sel.trans.dur, (v) => { sel.trans.dur = v; }, 0.2, 2.5, 0.1, (v) => v.toFixed(1) + ' s', () => this.previewTrans(sel)));
    box.append(this.chipsFor('trans', ['Popularne', 'Przesuwanie', 'Odsłanianie', 'Efekty']));
    const grid = h('div', { class: 'tgrid' });
    grid.append(transTile('none', ok && sel.trans.id === 'none', () => { if (ok) { sel.trans.id = 'none'; commit(); } }));
    Object.values(TRANS).filter((t) => t.cat === this.catState.trans).forEach((t) => {
      grid.append(transTile(t.id, ok && sel.trans.id === t.id, () => {
        if (!ok) { toast('Najpierw zaznacz klip, który styka się z poprzednim klipem'); return; }
        sel.trans.id = t.id; commit(); this.previewTrans(sel);
      }));
    });
    box.append(grid);
  },
  clipTitle(c) { const s = TL.clipLabel(c); return s.length > 18 ? s.slice(0, 17) + '…' : s; },
  previewTrans(c) {
    const prev = prevAdjacent(c); if (!prev) return;
    const d = transDur(c, prev);
    Engine.seek(Math.max(0, c.start - Math.min(1.2, d * 1.4))); Engine.play();
  },

  /* ---------- Filtry ---------- */
  pFilters(box) {
    box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Filtry')), this.modeSeg(), this.chipsFor('filters', FILTER_CATS));
    const sel = byId(S.sel), grid = h('div', { class: 'tgrid' });
    Object.entries(FILTERS).filter(([id, f]) => id === 'none' ? this.catState.filters === 'Popularne' : f.cat === this.catState.filters).forEach(([id, f]) => {
      const on = this._mode === 'clip' && sel && sel.filter.id === id;
      grid.append(filterTile(id, on, () => {
        if (this._mode === 'clip' && sel) { sel.filter = { id, amt: sel.filter.amt == null ? 1 : sel.filter.amt }; commit(); }
        else if (id !== 'none') { addFxLayer({ filter: { id, amt: 1 } }); commit(); toast('Dodano warstwę filtra na osi'); }
      }));
    });
    box.append(grid);
    if (this._mode === 'clip' && sel && sel.filter.id !== 'none') box.append(F.slider('Siła filtra', () => sel.filter.amt, (v) => { sel.filter.amt = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
  },

  /* ---------- Narzędzia ---------- */
  pTools(box) {
    if (this.toolView === 'bg') return this.toolBgRemover(box);
    if (this.toolView === 'ai') return this.toolAssistant(box);
    box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Narzędzia')));
    const card = (ic, title, desc, fn) => h('button', { class: 'tcard', onclick: fn }, h('span', { class: 'tic', html: icon(ic, 22) }), h('span', { class: 'tx' }, h('b', {}, title), h('small', {}, desc)));
    box.append(h('div', { class: 'tcards' },
      card('eraser', 'Usuń tło ze zdjęcia', 'AI wycina osobę lub jednolite tło. Wynik jako PNG.', () => { this.toolView = 'bg'; this.renderPanel(); }),
      card('bot', 'Asystent Claude', 'Pomysły na napisy, hasztagi i opis posta.', () => { this.toolView = 'ai'; this.renderPanel(); }),
      card('bolt', 'Auto-rytm', 'Wykryj uderzenia w muzyce i dodaj znaczniki.', () => Tools.beats()),
      card('music', 'Odłącz dźwięk', 'Wyciągnij ścieżkę audio z zaznaczonego wideo.', () => Act.detach()),
      card('freeze', 'Zatrzymaj klatkę', 'Zamień klatkę pod głowicą w 2-sekundowe zdjęcie.', () => Act.freeze()),
      card('camera', 'Zrzut klatki', 'Zapisz aktualny podgląd jako PNG.', () => Tools.snapshot()),
    ));
  },
  toolBack(box, title) {
    box.append(h('div', { class: 'p-head' }, h('button', { class: 'tb', onclick: () => { this.toolView = null; this.renderPanel(); }, html: icon('chevRight', 16).replace('<svg', '<svg style="transform:scaleX(-1)"') }), h('h3', {}, title)));
  },
  toolBgRemover(box) {
    this.toolBack(box, 'Usuń tło ze zdjęcia');
    const st = this._bg || (this._bg = { src: null, out: null, name: '' });
    const inp = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (e) => Tools.bgLoad(e.target.files[0]) });
    const stage = h('div', { class: 'checker bgprev', id: 'bgPrev' });
    if (st.out) stage.append(st.out); else if (st.src) stage.append(st.src); else stage.append(h('div', { class: 'ph' }, h('span', { html: icon('image', 28) }), 'Wybierz zdjęcie'));
    box.append(inp, stage, F.btn(st.src ? 'Wybierz inne zdjęcie' : 'Wybierz zdjęcie', () => inp.click(), 'block', 'upload'));
    if (st.src) {
      box.append(
        F.btn('Usuń tło (AI – osoba)', () => Tools.bgRun('ai'), 'primary block', 'scan'),
        F.btn('Usuń jednolite tło', () => Tools.bgRun('auto'), 'block', 'wand'),
        h('div', { id: 'bgStatus', class: 'hint' }, st.out ? 'Gotowe.' : 'Model AI pobierze się przy pierwszym użyciu.'),
      );
      if (st.out) box.append(h('div', { class: 'row2' }, F.btn('Dodaj do biblioteki', () => Tools.bgToLib(), 'block', 'plus'), F.btn('Zapisz PNG', () => Tools.bgSave(), 'block', 'download')));
    }
  },
  toolAssistant(box) {
    this.toolBack(box, 'Asystent Claude');
    const st = this._as || (this._as = { topic: '', kind: 'captions', items: null, busy: false, msg: '' });
    box.append(F.hint('Opisz film, a Claude zaproponuje napisy na ekran, hasztagi lub opis posta. Zużywa Twój limit Claude.'));
    const ta = h('textarea', { rows: 3, placeholder: 'O czym jest film? np. „Weekend w Tatrach, wschód słońca nad Morskim Okiem”', oninput: (e) => { st.topic = e.target.value; } }, st.topic);
    const sel = h('select', { onchange: (e) => { st.kind = e.target.value; } }, [['captions', 'Napisy na ekran (krótkie hasła)'], ['hook', 'Pomysły na początek filmu (hook)'], ['post', 'Opis posta + hasztagi']].map(([v, t]) => h('option', { value: v, selected: v === st.kind }, t)));
    box.append(ta, sel, F.btn(st.busy ? 'Claude myśli…' : 'Generuj', () => Tools.assist(), 'primary block', 'sparkles'));
    if (st.msg) box.append(h('p', { class: 'hint err' }, st.msg));
    if (st.items) {
      const list = h('div', { class: 'alist' });
      st.items.forEach((s) => list.append(h('div', { class: 'aitem' }, h('span', {}, s),
        h('div', { class: 'ab' }, h('button', { class: 'tb', title: 'Dodaj jako napis', onclick: () => App.addText(s), html: icon('type', 15) }), h('button', { class: 'tb', title: 'Kopiuj', onclick: () => { try { navigator.clipboard.writeText(s); toast('Skopiowano'); } catch (e) { toast('Nie udało się skopiować', 'err'); } }, html: icon('copy', 15) })))));
      box.append(list);
    }
  },

  /* ============================================================
     INSPEKTOR
     ============================================================ */
  insTabsFor(c) {
    if (!c) return [];
    if (c.type === 'audio') return [['audio', 'Dźwięk'], ['speed', 'Tempo']];
    if (c.type === 'fx') return [['fxs', 'Efekty'], ['adjust', 'Dostosuj']];
    if (c.type === 'text') return [['text', 'Tekst'], ['basic', 'Podstawowe'], ['anim', 'Animacje'], ['fxs', 'Efekty']];
    if (c.type === 'sticker') return [['basic', 'Podstawowe'], ['anim', 'Animacje'], ['fxs', 'Efekty']];
    const t = [['basic', 'Podstawowe'], ['cut', 'Usuń tło'], ['anim', 'Animacje'], ['adjust', 'Dostosuj'], ['fxs', 'Efekty']];
    if (c.type === 'video') t.push(['speed', 'Tempo'], ['audio', 'Dźwięk']);
    return t;
  },
  renderInspector() {
    const box = $('#inspector'); if (!box) return;
    const sc = box.scrollTop;
    this.kfCtl = [];
    box.innerHTML = '';
    const c = byId(S.sel);
    if (!c) { this.insProject(box); return; }
    const tabs = this.insTabsFor(c);
    if (!tabs.some(([id]) => id === this.insTab)) this.insTab = tabs[0][0];
    box.append(h('div', { class: 'ins-head' }, h('span', { class: 'ico', html: TL.typeIcon(c) }), h('b', {}, this.clipTitle(c)), h('span', { class: 'dur' }, fmtDur(c.dur))));
    box.append(h('div', { class: 'itabs' }, tabs.map(([id, t]) => h('button', { class: id === this.insTab ? 'on' : '', onclick: () => { this.insTab = id; this.renderInspector(); } }, t))));
    const body = h('div', { class: 'ibody' });
    const fn = { basic: this.insBasic, anim: this.insAnim, adjust: this.insAdjust, fxs: this.insFxs, cut: this.insCut, speed: this.insSpeed, audio: this.insAudio, text: this.insText, mask: this.insMask, ovl: this.insOverlay }[this.insTab];
    if (fn) fn.call(this, body, c);
    box.append(body);
    box.scrollTop = sc;
  },

  /* --- projekt (gdy nic nie jest zaznaczone) --- */
  insProject(box) {
    box.append(h('div', { class: 'ins-head' }, h('span', { class: 'ico', html: icon('settings', 14) }), h('b', {}, 'Ustawienia filmu')));
    const body = h('div', { class: 'ibody' });
    body.append(h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Nazwa projektu')),
      h('input', { type: 'text', value: P.name, class: 'txt', oninput: (e) => { P.name = e.target.value; }, onchange: () => commit() })));
    body.append(F.title('Proporcje'));
    const g = h('div', { class: 'agrid' });
    Object.keys(ASPECTS).forEach((k) => {
      const [a, b] = ASPECTS[k], s = 30, w = a >= b ? s : s * a / b, hh = a >= b ? s * b / a : s;
      g.append(h('button', { class: 'asp' + (P.aspect === k ? ' on' : ''), onclick: () => { P.aspect = k; commit(); Engine.setupRenderer(); }, title: k },
        h('i', { style: `width:${w}px;height:${hh}px` }), h('span', {}, k)));
    });
    body.append(g);
    body.append(F.title('Tło płótna'));
    body.append(F.toggle('Rozmyte tło (z głównego klipu)', () => P.bgBlur, (v) => { P.bgBlur = v; Engine.invalidate(); }));
    body.append(F.color('Kolor tła', () => P.bg, (v) => { P.bg = v; }));
    body.append(F.title('Płynność'));
    body.append(F.seg('', [[24, '24'], [25, '25'], [30, '30'], [50, '50'], [60, '60']], () => P.fps, (v) => { P.fps = v; }));
    body.append(F.hint('Rozdzielczość i format wybierzesz przy eksporcie.'));
    body.append(F.title('Podgląd'));
    body.append(F.seg('Jakość podglądu', [[0.5, 'Niska'], [0.75, 'Średnia'], [1, 'Wysoka']], () => S.previewScale, (v) => { S.previewScale = v; Engine.setupRenderer(); }));
    box.append(body);
  },

  /* --- podstawowe --- */
  insBasic(b, c) {
    const pc = (v) => Math.round(v * 100) + '%';
    if (c.type === 'sticker') b.append(F.slider('Rozmiar', () => c.sticker.size, (v) => { c.sticker.size = v; }, 0.05, 0.9, 0.01, pc));
    b.append(F.slider('Skala', () => c.scale, (v) => { c.scale = v; }, 0.1, 4, 0.01, pc));
    b.append(F.slider('Obrót', () => c.rot, (v) => { c.rot = v; }, -180, 180, 1, (v) => Math.round(v) + '°'));
    b.append(F.slider('Pozycja X', () => c.x, (v) => { c.x = v; }, -1, 1, 0.005, (v) => Math.round(v * 100) + '%'));
    b.append(F.slider('Pozycja Y', () => c.y, (v) => { c.y = v; }, -1, 1, 0.005, (v) => Math.round(v * 100) + '%'));
    b.append(F.slider('Krycie', () => c.opacity, (v) => { c.opacity = v; }, 0, 1, 0.01, pc));
    b.append(h('div', { class: 'row2' },
      F.btn('Odbij poziomo', () => { c.flipX = !c.flipX; commit(); }, c.flipX ? 'on' : '', 'flip'),
      F.btn('Odbij pionowo', () => { c.flipY = !c.flipY; commit(); }, c.flipY ? 'on' : '', 'flip')));
    b.append(h('div', { class: 'row2' },
      F.btn('Resetuj', () => { c.x = 0; c.y = 0; c.scale = 1; c.rot = 0; c.opacity = 1; c.flipX = c.flipY = false; commit(); }, '', 'rotate'),
      (c.type === 'video' || c.type === 'image') ? F.btn('Wypełnij kadr', () => { const m = getMedia(c), [W, H] = canvasSize(P.aspect, 720); if (m && m.w) { const a = W / m.w, d = H / m.h; c.scale = Math.max(a, d) / Math.min(a, d); c.x = 0; c.y = 0; commit(); } }, '', 'fit') : null));
  },

  /* --- animacje --- */
  insAnim(b, c) {
    const isText = c.type === 'text';
    const group = (title, key, kind, dict, withDur) => {
      b.append(F.title(title));
      const g = h('div', { class: 'tgrid anim' });
      Object.entries(dict).filter(([id, a]) => !a.textOnly || isText).forEach(([id, a]) => {
        g.append(animTile(dict, id, kind, c[key].id === id, () => {
          c[key].id = id; commit();
          if (id !== 'none') Tools.previewClip(c, kind);
        }, isText ? 'text' : null));
      });
      b.append(g);
      if (c[key].id !== 'none') {
        if (withDur) b.append(F.slider('Czas', () => c[key].dur, (v) => { c[key].dur = v; }, 0.2, Math.max(0.3, Math.min(3, c.dur * 0.6)), 0.05, (v) => v.toFixed(2) + ' s'));
        else b.append(F.slider('Intensywność', () => c[key].amt, (v) => { c[key].amt = v; }, 0.1, 2, 0.05, (v) => Math.round(v * 100) + '%'));
      }
    };
    group('Wejście', 'animIn', 'in', ANIM_IO, true);
    group('Wyjście', 'animOut', 'out', ANIM_IO, true);
    group('Pętla', 'animLoop', 'loop', ANIM_LOOP, false);
  },

  /* --- dostosuj --- */
  insAdjust(b, c) {
    const pc = (v) => (v > 0 ? '+' : '') + Math.round(v * 100);
    if (c.filter.id !== 'none') b.append(F.slider('Filtr: ' + FILTERS[c.filter.id].name, () => c.filter.amt, (v) => { c.filter.amt = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'),
      F.btn('Usuń filtr', () => { c.filter = { id: 'none', amt: 1 }; commit(); }, 'sm'));
    else b.append(F.hint('Filtr wybierzesz w zakładce „Filtry” po lewej.'));
    [['Jasność', 'brightness'], ['Kontrast', 'contrast'], ['Nasycenie', 'saturation'], ['Temperatura', 'temp'], ['Odcień', 'hue']].forEach(([l, k]) => b.append(F.slider(l, () => c.adj[k], (v) => { c.adj[k] = v; }, -1, 1, 0.01, pc)));
    [['Rozmycie', 'blur'], ['Winieta', 'vignette'], ['Ziarno', 'grain']].forEach(([l, k]) => b.append(F.slider(l, () => c.adj[k], (v) => { c.adj[k] = v; }, 0, 1, 0.01, (v) => Math.round(v * 100))));
    b.append(F.btn('Resetuj korekcję', () => { c.adj = defAdj(); commit(); }, '', 'rotate'));
  },

  /* --- efekty klipu --- */
  insFxs(b, c) {
    if (!c.fx.length) b.append(F.hint('Brak efektów. Wybierz efekt w zakładce „Efekty” po lewej.'), F.btn('Otwórz efekty', () => this.openTab('effects'), 'primary', 'sparkles'));
    c.fx.forEach((e, i) => {
      const f = FX[e.id]; if (!f) return;
      b.append(h('div', { class: 'fxrow' }, F.slider(f.name, () => e.amt, (v) => { e.amt = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'),
        h('button', { class: 'tb', title: 'Usuń efekt', onclick: () => { c.fx.splice(i, 1); commit(); }, html: icon('x', 15) })));
    });
    if (c.fx.length) b.append(F.btn('Dodaj kolejny efekt', () => this.openTab('effects'), '', 'plus'));
    if (c.type === 'fx') b.append(F.slider('Siła warstwy', () => c.opacity, (v) => { c.opacity = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
  },

  /* --- usuń tło --- */
  insCut(b, c) {
    const cut = c.cut;
    b.append(F.seg('Tryb', [['none', 'Wyłączone'], ['ai', 'AI (osoba)'], ['chroma', 'Kolor']], () => cut.mode, (v) => { cut.mode = v; if (v === 'ai') AI.init().catch(() => toast('Nie udało się załadować modelu AI. Użyj trybu „Kolor”.', 'err')); }));
    if (cut.mode === 'ai') {
      const msg = { idle: 'Model AI załaduje się przy pierwszym użyciu.', loading: 'Ładowanie modelu AI…', ready: 'Model AI gotowy – działa lokalnie w przeglądarce.', error: 'Model AI niedostępny. Użyj trybu „Kolor” (zielony ekran / jednolite tło).' }[AI.state];
      b.append(h('div', { class: 'note ' + (AI.state === 'ready' ? 'ok' : AI.state === 'error' ? 'bad' : '') }, msg));
      b.append(F.seg('Model', [[0, 'Portret'], [1, 'Szeroki kadr']], () => cut.model, (v) => { cut.model = v; }));
      b.append(F.slider('Krawędź', () => cut.edge, (v) => { cut.edge = v; }, -1, 1, 0.01, (v) => (v > 0 ? '+' : '') + Math.round(v * 100)));
      b.append(F.slider('Miękkość', () => cut.soft, (v) => { cut.soft = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
      b.append(F.slider('Wygładzenie', () => cut.feather, (v) => { cut.feather = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
    } else if (cut.mode === 'chroma') {
      b.append(F.color('Kolor do usunięcia', () => cut.key, (v) => { cut.key = v; }));
      b.append(h('div', { class: 'row2' },
        F.btn('Pipeta z podglądu', () => { S.picker = c.id; toast('Kliknij kolor na podglądzie'); document.body.classList.add('picking'); }, '', 'crop'),
        F.btn('Auto z rogów', () => { Tools.autoKey(c); }, '', 'wand')));
      b.append(F.slider('Tolerancja', () => cut.tol, (v) => { cut.tol = v; }, 0.02, 1, 0.01, (v) => Math.round(v * 100) + '%'));
      b.append(F.slider('Miękkość krawędzi', () => cut.soft, (v) => { cut.soft = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
    } else b.append(F.hint('Wybierz „AI (osoba)”, aby wyciąć człowieka z tła bez zielonego ekranu, albo „Kolor”, aby usunąć jednolite tło.'));
  },

  /* --- tempo --- */
  insSpeed(b, c) {
    const seg = h('div', { class: 'seg wrap' });
    [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].forEach((v) => seg.append(h('button', { class: Math.abs(c.speed - v) < 0.001 ? 'on' : '', onclick: () => { setSpeed(c, v); commit(); } }, v + '×')));
    b.append(h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Szybkość')), seg));
    b.append(F.slider('Własna szybkość', () => c.speed, (v) => { c.speed = v; }, 0.1, 4, 0.05, (v) => v.toFixed(2) + '×', () => { setSpeed(c, c.speed); commit(); }));
    b.append(F.hint('Czas trwania klipu: ' + c.dur.toFixed(2) + ' s'));
  },

  /* --- dźwięk --- */
  insAudio(b, c) {
    b.append(F.toggle('Wycisz', () => c.mute, (v) => { c.mute = v; }));
    b.append(F.slider('Głośność', () => c.vol, (v) => { c.vol = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
    b.append(F.slider('Narastanie', () => c.fadeIn, (v) => { c.fadeIn = v; }, 0, Math.max(0.1, c.dur / 2), 0.1, (v) => v.toFixed(1) + ' s'));
    b.append(F.slider('Wyciszanie', () => c.fadeOut, (v) => { c.fadeOut = v; }, 0, Math.max(0.1, c.dur / 2), 0.1, (v) => v.toFixed(1) + ' s'));
    if (c.type === 'video') b.append(F.btn('Odłącz dźwięk do osobnej ścieżki', () => Act.detach(), '', 'music'));
    const m = getMedia(c); if (m && m.hasAudio === false) b.append(F.hint('To wideo nie zawiera dźwięku.'));
  },

  /* --- tekst --- */
  insText(b, c) {
    const T = c.text;
    const ta = h('textarea', { rows: 3, class: 'txt', oninput: (e) => { T.str = e.target.value; Engine.invalidate(); }, onchange: () => commit() }, T.str);
    b.append(h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Treść')), ta));
    b.append(F.select('Czcionka', TEXT_FONTS.map((f) => [f, f]), () => T.font, (v) => { T.font = v; document.fonts && document.fonts.load(`24px "${v}"`).then(() => { Engine.R && Engine.R.sprites.clear(); Engine.invalidate(); }).catch(() => {}); }));
    b.append(F.slider('Rozmiar', () => T.size, (v) => { T.size = v; }, 0.02, 0.3, 0.001, (v) => Math.round(v * 1000) / 10));
    b.append(h('div', { class: 'row3' },
      F.btn('B', () => { T.bold = !T.bold; commit(); }, T.bold ? 'on' : ''), F.btn('I', () => { T.italic = !T.italic; commit(); }, T.italic ? 'on' : ''), F.btn('Aa', () => { T.upper = !T.upper; commit(); }, T.upper ? 'on' : '')));
    b.append(F.seg('Wyrównanie', [['left', 'Lewo'], ['center', 'Środek'], ['right', 'Prawo']], () => T.align, (v) => { T.align = v; }));
    b.append(F.color('Kolor tekstu', () => T.color, (v) => { T.color = v; }));
    b.append(F.color('Kolor obrysu', () => T.strokeC, (v) => { T.strokeC = v; }), F.slider('Grubość obrysu', () => T.strokeW, (v) => { T.strokeW = v; }, 0, 0.4, 0.01, (v) => Math.round(v * 100)));
    b.append(F.color('Kolor cienia / poświaty', () => T.shadowC, (v) => { T.shadowC = v; }), F.slider('Cień / poświata', () => T.shadowB, (v) => { T.shadowB = v; }, 0, 1, 0.01, (v) => Math.round(v * 100)));
    b.append(F.toggle('Tło pod tekstem', () => !!T.bg, (v) => { T.bg = v ? (T.bg || '#000000') : ''; }));
    if (T.bg) b.append(F.color('Kolor tła', () => T.bg, (v) => { T.bg = v; }), F.slider('Krycie tła', () => T.bgA, (v) => { T.bgA = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
    b.append(F.slider('Odstęp liter', () => T.spacing, (v) => { T.spacing = v; }, -0.05, 0.4, 0.005, (v) => Math.round(v * 100)));
    b.append(F.slider('Odstęp wierszy', () => T.lineH, (v) => { T.lineH = v; }, 0.8, 2, 0.01, (v) => v.toFixed(2)));
  },
};
