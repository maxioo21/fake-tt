'use strict';
/* ============================================================
   Kadr Studio — efekty, filtry, animacje, przejścia
   (wszystko własna implementacja na Canvas 2D)
   ============================================================ */
const POOL = {
  m: new Map(),
  get(w, hh) {
    w = Math.max(1, Math.round(w)); hh = Math.max(1, Math.round(hh));
    const k = w + 'x' + hh;
    let a = this.m.get(k);
    if (!a) { a = []; this.m.set(k, a); }
    const c = a.pop() || mkCanvas(w, hh);
    const x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
    x.shadowBlur = 0; x.shadowColor = 'transparent';
    x.clearRect(0, 0, w, hh);
    return c;
  },
  free(c) {
    const k = c.width + 'x' + c.height;
    let a = this.m.get(k);
    if (!a) { a = []; this.m.set(k, a); }
    if (a.length < 6) a.push(c);
  },
  copy(c) { const t = this.get(c.width, c.height); t.getContext('2d').drawImage(c, 0, 0); return t; },
  clear() { this.m.clear(); },
};
const HAS_FILTER = (() => { try { return 'filter' in mkCanvas(1, 1).getContext('2d'); } catch (e) { return false; } })();

let _noise;
function noiseTile() {
  if (_noise) return _noise;
  const c = mkCanvas(256, 256), x = c.getContext('2d'), id = x.createImageData(256, 256), r = rng(1234);
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  x.putImageData(id, 0, 0);
  return (_noise = c);
}
function noiseOverlay(c, alpha, t, blend = 'overlay') {
  const W = c.width, H = c.height;
  const m = POOL.get(W, H), mx = m.getContext('2d');
  const r = rng(Math.floor(t * 24) + 99);
  const k = Math.max(1, H / 540);
  mx.save(); mx.scale(k, k); mx.translate(-r() * 256, -r() * 256);
  mx.fillStyle = mx.createPattern(noiseTile(), 'repeat'); mx.fillRect(0, 0, W / k + 256, H / k + 256); mx.restore();
  mx.globalCompositeOperation = 'destination-in'; mx.drawImage(c, 0, 0);
  const x = c.getContext('2d');
  x.globalCompositeOperation = blend; x.globalAlpha = clamp(alpha, 0, 1); x.drawImage(m, 0, 0);
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  POOL.free(m);
}
function washOverlay(c, color, alpha) {
  const x = c.getContext('2d');
  x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = clamp(alpha, 0, 1); x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); x.restore();
}
function vignetteOverlay(c, amount) {
  const W = c.width, H = c.height, x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.hypot(W, H) * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${clamp(amount, 0, 1)})`);
  x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
}
function rgbSplit(c, dx, dy) {
  const W = c.width, H = c.height, x = c.getContext('2d');
  const src = POOL.copy(c), ch = POOL.get(W, H), cx = ch.getContext('2d');
  x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
  [['#ff0000', -dx, -dy], ['#00ff00', 0, 0], ['#0000ff', dx, dy]].forEach(([col, ox, oy]) => {
    cx.globalCompositeOperation = 'copy'; cx.drawImage(src, 0, 0);
    cx.globalCompositeOperation = 'multiply'; cx.fillStyle = col; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'destination-in'; cx.drawImage(src, 0, 0);
    x.drawImage(ch, ox, oy);
  });
  x.globalCompositeOperation = 'source-over';
  POOL.free(src); POOL.free(ch);
}
function xform(c, fn) {
  const src = POOL.copy(c), x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height); x.save(); fn(x, c.width, c.height); x.drawImage(src, 0, 0); x.restore();
  POOL.free(src);
}
function scaleAbout(x, W, H, s) { x.translate(W / 2, H / 2); x.scale(s, s); x.translate(-W / 2, -H / 2); }

/* ============================================================
   EFEKTY
   ============================================================ */
const FX = {};
const FX_CATS = ['Popularne', 'Glitch', 'Retro', 'Ruch', 'Światło', 'Kolor'];
function defFx(id, name, cat, fn) { FX[id] = { id, name, cat, fn }; }

defFx('glitch', 'Glitch', 'Glitch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), r = rng(Math.floor(t * 13) * 7919 + 17);
  const n = Math.round(2 + a * 10);
  if (r() < 0.45 + 0.5 * a) {
    for (let i = 0; i < n; i++) {
      const y = Math.floor(r() * H), hh = Math.max(2, Math.floor((0.008 + r() * 0.07) * H)), off = Math.round((r() - 0.5) * W * 0.24 * a);
      x.clearRect(0, y, W, hh);
      x.drawImage(src, 0, y, W, hh, off, y, W, hh);
      if (off) x.drawImage(src, 0, y, W, hh, off > 0 ? off - W : off + W, y, W, hh);
    }
  }
  POOL.free(src);
  if (r() < 0.35 + 0.4 * a) rgbSplit(c, Math.round(W * 0.012 * a * (0.5 + r())), Math.round(H * 0.002 * a * r()));
});
defFx('rgb', 'Rozdzielenie RGB', 'Glitch', (c, a, t) => {
  const W = c.width, H = c.height;
  rgbSplit(c, Math.round(W * 0.018 * a * (0.7 + 0.3 * Math.sin(t * 7))), Math.round(H * 0.004 * a * Math.cos(t * 5)));
});
defFx('vhs', 'VHS', 'Retro', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c);
  x.clearRect(0, 0, W, H);
  const sh = Math.max(2, Math.round(H / 180)), r = rng(Math.floor(t * 24)), bandY = ((t * 0.22) % 1.2 - 0.1) * H;
  for (let y = 0; y < H; y += sh) {
    let off = Math.sin(y * 0.045 + t * 8) * W * 0.0035 * a;
    const d = Math.abs(y - bandY);
    if (d < H * 0.05) off += (1 - d / (H * 0.05)) * W * 0.03 * a * (r() - 0.3);
    x.drawImage(src, 0, y, W, sh, off, y, W, sh);
  }
  POOL.free(src);
  rgbSplit(c, Math.max(1, Math.round(W * 0.004 * (0.5 + a))), 0);
  x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(0,0,0,${0.16 * a})`;
  for (let y = 0; y < H; y += sh * 2) x.fillRect(0, y, W, sh);
  const g = x.createLinearGradient(0, bandY - H * 0.04, 0, bandY + H * 0.04);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.16 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, bandY - H * 0.04, W, H * 0.08); x.restore();
  noiseOverlay(c, 0.14 * a, t);
});
defFx('crt', 'Stary TV', 'Retro', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d');
  rgbSplit(c, Math.max(1, Math.round(W * 0.003 * (0.5 + a))), 0);
  const pitch = Math.max(2, Math.round(H / 200));
  x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(0,0,0,${0.22 * a})`;
  for (let y = 0; y < H; y += pitch * 2) x.fillRect(0, y, W, pitch);
  x.fillStyle = `rgba(0,0,0,${(Math.sin(t * 60) * 0.03 + 0.04) * a})`; x.fillRect(0, 0, W, H); x.restore();
  vignetteOverlay(c, 0.55 * a);
});
defFx('dv', 'Retro DV', 'Retro', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d');
  rgbSplit(c, Math.max(1, Math.round(W * 0.0025)), 0);
  noiseOverlay(c, 0.12 * a, t);
  vignetteOverlay(c, 0.35 * a);
  const fs = Math.round(H * 0.045);
  x.save();
  x.font = `bold ${fs}px "Courier New", monospace`; x.textBaseline = 'middle';
  x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = fs * 0.2;
  if (Math.floor(t * 1.5) % 2 === 0) { x.fillStyle = '#ff2a2a'; x.beginPath(); x.arc(fs * 1.2, fs * 1.4, fs * 0.28, 0, 7); x.fill(); }
  x.fillStyle = '#fff'; x.fillText('REC', fs * 1.8, fs * 1.4);
  x.textAlign = 'right';
  x.fillText(new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(), W - fs, H - fs * 1.8);
  x.fillText(fmtTime(t, true), W - fs, H - fs * 0.7);
  x.textAlign = 'left'; x.fillText('▶ PLAY', fs, H - fs * 0.9);
  x.restore();
});
defFx('grain', 'Ziarno filmowe', 'Retro', (c, a, t) => { noiseOverlay(c, 0.45 * a, t); });
defFx('pixel', 'Mozaika', 'Popularne', (c, a) => {
  const W = c.width, H = c.height, px = Math.max(2, Math.round(W * (0.006 + a * 0.05)));
  const sw = Math.max(1, Math.round(W / px)), sh = Math.max(1, Math.round(H / px));
  const s = POOL.get(sw, sh); s.getContext('2d').drawImage(c, 0, 0, sw, sh);
  const x = c.getContext('2d'); x.clearRect(0, 0, W, H); x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0, sw, sh, 0, 0, W, H); x.imageSmoothingEnabled = true;
  POOL.free(s);
});
defFx('blurpulse', 'Rozmycie', 'Popularne', (c, a, t) => {
  if (!HAS_FILTER) return;
  const px = c.height * 0.022 * a * (0.55 + 0.45 * Math.sin(t * 4));
  const src = POOL.copy(c), x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height); x.filter = `blur(${px.toFixed(2)}px)`; x.drawImage(src, 0, 0); x.filter = 'none'; POOL.free(src);
});
defFx('letterbox', 'Kinowe pasy', 'Popularne', (c, a) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), bh = H * (0.06 + 0.14 * a);
  x.save(); x.fillStyle = '#000'; x.fillRect(0, 0, W, bh); x.fillRect(0, H - bh, W, bh); x.restore();
});
defFx('mirror', 'Lustro', 'Popularne', (c) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c);
  x.save(); x.translate(W, 0); x.scale(-1, 1); x.drawImage(src, 0, 0, W / 2, H, 0, 0, W / 2, H); x.restore(); POOL.free(src);
});
defFx('kaleido', 'Kalejdoskop', 'Popularne', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c);
  const sx = W * 0.25 * (0.5 + 0.5 * Math.sin(t * 0.8)), sy = H * 0.25 * (0.5 + 0.5 * Math.cos(t * 0.6));
  x.clearRect(0, 0, W, H);
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([fx, fy]) => {
    x.save(); x.translate(fx ? W : 0, fy ? H : 0); x.scale(fx ? -1 : 1, fy ? -1 : 1);
    x.drawImage(src, sx, sy, W / 2, H / 2, 0, 0, W / 2, H / 2); x.restore();
  });
  POOL.free(src);
});
defFx('wave', 'Fala', 'Ruch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c);
  x.clearRect(0, 0, W, H);
  const sh = Math.max(2, Math.round(H / 240));
  for (let y = 0; y < H; y += sh) x.drawImage(src, 0, y, W, sh, Math.sin(y / H * Math.PI * 6 + t * 4) * W * 0.03 * a, y, W, sh);
  POOL.free(src);
});
defFx('echo', 'Echo', 'Ruch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c);
  const ox = Math.sin(t * 3) * W * 0.035 * a, oy = Math.cos(t * 2.3) * H * 0.025 * a;
  x.clearRect(0, 0, W, H);
  for (let i = 3; i >= 1; i--) { x.globalAlpha = 0.32 * a / i; x.drawImage(src, ox * i, oy * i); }
  x.globalAlpha = 1; x.drawImage(src, 0, 0); POOL.free(src);
});
defFx('pulse', 'Puls', 'Ruch', (c, a, t) => {
  const s = 1 + 0.1 * a * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.2)), 3);
  xform(c, (x, W, H) => scaleAbout(x, W, H, s));
});
defFx('shake', 'Trzęsienie', 'Ruch', (c, a, t) => {
  const r = rng(Math.floor(t * 20) + 5);
  const W = c.width, H = c.height;
  const dx = (r() - 0.5) * W * 0.045 * a, dy = (r() - 0.5) * H * 0.045 * a, rot = (r() - 0.5) * 0.035 * a, s = 1 + 0.05 * a;
  xform(c, (x) => { x.translate(W / 2 + dx, H / 2 + dy); x.rotate(rot); x.scale(s, s); x.translate(-W / 2, -H / 2); });
});
defFx('zoomlens', 'Soczewka', 'Ruch', (c, a, t) => {
  const s = 1 + 0.28 * a * ease.inOut(Math.abs(Math.sin(t * 1.1)));
  xform(c, (x, W, H) => scaleAbout(x, W, H, s));
  rgbSplit(c, Math.round(c.width * 0.004 * a), 0);
});
defFx('glow', 'Poświata', 'Światło', (c, a) => {
  if (!HAS_FILTER) return;
  const src = POOL.copy(c), x = c.getContext('2d');
  x.save(); x.globalCompositeOperation = 'screen'; x.filter = `blur(${Math.max(2, c.height * 0.02 * (0.5 + a)).toFixed(1)}px) brightness(${(1 + a * 0.5).toFixed(2)})`;
  x.globalAlpha = 0.4 + 0.6 * a; x.drawImage(src, 0, 0); x.restore(); POOL.free(src);
});
defFx('flash', 'Błysk', 'Światło', (c, a, t) => {
  const ph = (t * 1.6) % 1, al = a * Math.max(0, 1 - ph * 3.2) * 0.85;
  if (al > 0.01) washOverlay(c, '#ffffff', al);
});
defFx('strobe', 'Stroboskop', 'Światło', (c, a, t) => { if (Math.floor(t * 10) % 2 === 0) washOverlay(c, '#ffffff', 0.55 * a); });
defFx('leak', 'Wyciek światła', 'Światło', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d');
  const px = W * (0.5 + 0.5 * Math.sin(t * 0.7)), py = H * (0.3 + 0.2 * Math.cos(t * 0.5));
  const g = x.createRadialGradient(px, py, 0, px, py, Math.max(W, H) * 0.7);
  g.addColorStop(0, `rgba(255,150,60,${0.75 * a})`); g.addColorStop(0.5, `rgba(255,60,90,${0.3 * a})`); g.addColorStop(1, 'rgba(255,60,90,0)');
  x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
});
defFx('bw', 'Czerń i biel', 'Kolor', (c, a) => {
  if (!HAS_FILTER) return;
  const src = POOL.copy(c), x = c.getContext('2d');
  x.save(); x.globalAlpha = a; x.filter = 'grayscale(1) contrast(1.1)'; x.drawImage(src, 0, 0); x.restore(); POOL.free(src);
});
defFx('invert', 'Negatyw', 'Kolor', (c, a) => {
  if (!HAS_FILTER) return;
  const src = POOL.copy(c), x = c.getContext('2d');
  x.save(); x.globalAlpha = a; x.filter = 'invert(1)'; x.drawImage(src, 0, 0); x.restore(); POOL.free(src);
});
function applyEffects(c, list, t) {
  for (const e of list) { const f = FX[e.id]; if (f) f.fn(c, e.amt == null ? 0.6 : e.amt, t); }
}

/* ============================================================
   FILTRY (presety kolorystyczne)
   ============================================================ */
const FILTER_CATS = ['Popularne', 'Kino', 'Ciepłe i zimne', 'Retro', 'Czerń i biel'];
const FILTERS = {
  none: { name: 'Brak', cat: 'Popularne' },
  vivid: { name: 'Żywe', cat: 'Popularne', f: { saturate: 1.4, contrast: 1.1, brightness: 1.03 } },
  clear: { name: 'Czyste', cat: 'Popularne', f: { contrast: 1.08, brightness: 1.06, saturate: 1.1 } },
  pop: { name: 'Pop', cat: 'Popularne', f: { saturate: 1.6, contrast: 1.18 }, tint: ['#ff4f9a', 0.06] },
  fresh: { name: 'Świeże', cat: 'Popularne', f: { brightness: 1.08, saturate: 1.15, contrast: 0.97 }, tint: ['#7fffd4', 0.08] },
  dream: { name: 'Sen', cat: 'Popularne', f: { brightness: 1.1, contrast: 0.9, saturate: 1.15, blur: 0.0025 }, tint: ['#ffb6e6', 0.14] },
  cinema: { name: 'Kino', cat: 'Kino', f: { contrast: 1.22, saturate: 1.05, brightness: 0.96 }, tint: ['#ff9a4d', 0.1], vig: 0.35 },
  teal: { name: 'Teal & Orange', cat: 'Kino', f: { contrast: 1.18, saturate: 1.25 }, tint: ['#14b8c4', 0.14], vig: 0.25 },
  moody: { name: 'Mroczny', cat: 'Kino', f: { contrast: 1.25, brightness: 0.88, saturate: 0.8 }, tint: ['#1b3a6b', 0.14], vig: 0.5 },
  film: { name: 'Film', cat: 'Kino', f: { contrast: 1.1, saturate: 0.9, sepia: 0.15 }, tint: ['#ffb27a', 0.1], grain: 0.25 },
  warm: { name: 'Ciepły', cat: 'Ciepłe i zimne', f: { saturate: 1.15, brightness: 1.03 }, tint: ['#ff8a1f', 0.16] },
  sunset: { name: 'Zachód', cat: 'Ciepłe i zimne', f: { saturate: 1.3, contrast: 1.08 }, tint: ['#ff5e3a', 0.2] },
  cold: { name: 'Zimny', cat: 'Ciepłe i zimne', f: { saturate: 1.05, brightness: 1.02 }, tint: ['#2f80ff', 0.17] },
  frost: { name: 'Mróz', cat: 'Ciepłe i zimne', f: { brightness: 1.08, saturate: 0.8, contrast: 1.05 }, tint: ['#9fe3ff', 0.22] },
  forest: { name: 'Las', cat: 'Ciepłe i zimne', f: { saturate: 1.2, contrast: 1.05 }, tint: ['#3ddc84', 0.14] },
  retro: { name: 'Retro', cat: 'Retro', f: { sepia: 0.35, contrast: 1.1, saturate: 1.1 }, tint: ['#ffcf70', 0.14], grain: 0.3, vig: 0.3 },
  fade: { name: 'Wyblakły', cat: 'Retro', f: { contrast: 0.82, brightness: 1.1, saturate: 0.78 }, tint: ['#f0e6d6', 0.18] },
  vhs80: { name: 'Lata 80.', cat: 'Retro', f: { saturate: 1.4, contrast: 1.1, hue: -10 }, tint: ['#ff3ea5', 0.14], grain: 0.3 },
  sepia: { name: 'Sepia', cat: 'Retro', f: { sepia: 0.9, contrast: 1.05 } },
  bw: { name: 'Czarno-biały', cat: 'Czerń i biel', f: { grayscale: 1, contrast: 1.1 } },
  noir: { name: 'Noir', cat: 'Czerń i biel', f: { grayscale: 1, contrast: 1.5, brightness: 0.9 }, vig: 0.55 },
  silver: { name: 'Srebrny', cat: 'Czerń i biel', f: { grayscale: 1, contrast: 0.95, brightness: 1.1 }, tint: ['#b6c4d8', 0.14] },
};

/* składa filtr CSS z ustawień „Dostosuj” i presetu */
function cssFilter(c, H) {
  const a = c.adj, F = (FILTERS[c.filter.id] || {}).f || {}, k = c.filter.amt == null ? 1 : c.filter.amt;
  const mix = (v, d = 1) => d + (v - d) * k;
  let br = 1 + a.brightness * 0.5, co = 1 + a.contrast * 0.6, sa = 1 + a.saturation, hu = a.hue * 180, bl = a.blur * H * 0.04;
  if (F.brightness != null) br *= mix(F.brightness);
  if (F.contrast != null) co *= mix(F.contrast);
  if (F.saturate != null) sa *= mix(F.saturate);
  if (F.hue) hu += F.hue * k;
  if (F.blur) bl += F.blur * H * k;
  const parts = [];
  if (Math.abs(br - 1) > 0.004) parts.push(`brightness(${br.toFixed(3)})`);
  if (Math.abs(co - 1) > 0.004) parts.push(`contrast(${co.toFixed(3)})`);
  if (Math.abs(sa - 1) > 0.004) parts.push(`saturate(${Math.max(0, sa).toFixed(3)})`);
  if (Math.abs(hu) > 0.5) parts.push(`hue-rotate(${hu.toFixed(1)}deg)`);
  if (F.sepia) parts.push(`sepia(${(F.sepia * k).toFixed(3)})`);
  if (F.grayscale) parts.push(`grayscale(${(F.grayscale * k).toFixed(3)})`);
  if (bl > 0.3) parts.push(`blur(${bl.toFixed(2)}px)`);
  return parts.length ? parts.join(' ') : 'none';
}
/* nakładki (kolorowy filtr, temperatura, winieta, ziarno) – wymagają bufora */
function overlayList(c) {
  const a = c.adj, P0 = FILTERS[c.filter.id] || {}, k = c.filter.amt == null ? 1 : c.filter.amt, o = [];
  if (P0.tint) o.push({ t: 'wash', col: P0.tint[0], a: P0.tint[1] * k });
  if (Math.abs(a.temp) > 0.01) o.push({ t: 'wash', col: a.temp > 0 ? '#ff8a1f' : '#1f7bff', a: Math.abs(a.temp) * 0.3 });
  const vig = a.vignette + (P0.vig || 0) * k;
  if (vig > 0.01) o.push({ t: 'vig', a: vig });
  const gr = a.grain + (P0.grain || 0) * k;
  if (gr > 0.01) o.push({ t: 'grain', a: gr });
  return o;
}
function applyOverlays(cv, list, t) {
  for (const o of list) {
    if (o.t === 'wash') washOverlay(cv, o.col, o.a);
    else if (o.t === 'vig') vignetteOverlay(cv, o.a);
    else if (o.t === 'grain') noiseOverlay(cv, o.a * 0.6, t);
  }
}

/* ============================================================
   ANIMACJE
   st: {dx,dy (ułamek płótna), s, r (rad), al, bl (ułamek H), fl (skala X)}
   ============================================================ */
const ANIM_IO = {
  none: { name: 'Brak' },
  fade: { name: 'Zanikanie', fn: (p, s) => { s.al *= ease.out(p); } },
  zoomin: { name: 'Powiększ', fn: (p, s) => { const e = ease.out(p); s.s *= lerp(0.55, 1, e); s.al *= Math.min(1, e * 1.7); } },
  zoomout: { name: 'Pomniejsz', fn: (p, s) => { const e = ease.out(p); s.s *= lerp(1.7, 1, e); s.al *= Math.min(1, e * 1.7); } },
  slideL: { name: 'Z lewej', fn: (p, s) => { s.dx += lerp(-0.7, 0, ease.out(p)); s.al *= Math.min(1, p * 3); } },
  slideR: { name: 'Z prawej', fn: (p, s) => { s.dx += lerp(0.7, 0, ease.out(p)); s.al *= Math.min(1, p * 3); } },
  slideU: { name: 'Z góry', fn: (p, s) => { s.dy += lerp(-0.7, 0, ease.out(p)); s.al *= Math.min(1, p * 3); } },
  slideD: { name: 'Z dołu', fn: (p, s) => { s.dy += lerp(0.7, 0, ease.out(p)); s.al *= Math.min(1, p * 3); } },
  rise: { name: 'Wznoszenie', fn: (p, s) => { const e = ease.out(p); s.dy += lerp(0.12, 0, e); s.al *= e; } },
  spin: { name: 'Obrót', fn: (p, s) => { const e = ease.out(p); s.r += lerp(-Math.PI, 0, e); s.s *= lerp(0.15, 1, e); s.al *= Math.min(1, e * 2); } },
  bounce: { name: 'Odbicie', fn: (p, s) => { s.dy += -(1 - ease.outBounce(p)) * 0.55; s.al *= Math.min(1, p * 5); } },
  pop: { name: 'Wyskok', fn: (p, s) => { s.s *= Math.max(0, ease.outBack(p)); s.al *= Math.min(1, p * 5); } },
  elastic: { name: 'Gumka', fn: (p, s) => { s.s *= Math.max(0, ease.outElastic(p)); s.al *= Math.min(1, p * 6); } },
  blur: { name: 'Rozmycie', fn: (p, s) => { const e = ease.out(p); s.bl += (1 - e) * 0.045; s.al *= Math.min(1, e * 1.5); } },
  flip: { name: 'Przewrót', fn: (p, s) => { s.fl *= Math.max(0.001, ease.out(p)); s.al *= Math.min(1, p * 4); } },
  swing: { name: 'Wahadło', fn: (p, s) => { const e = 1 - p; s.r += Math.sin(p * Math.PI * 3) * 0.35 * e * e; s.al *= Math.min(1, p * 4); } },
  whip: { name: 'Smagnięcie', fn: (p, s) => { s.dx += lerp(-1, 0, ease.out(p)); s.bl += (1 - ease.out(p)) * 0.03; } },
  flicker: { name: 'Migotanie', fn: (p, s) => { s.al *= p > 0.82 ? 1 : (Math.floor(p * 18) % 2 ? 0.15 : 1); } },
  typewriter: { name: 'Maszyna do pisania', textOnly: true, fn: () => {} },
};
const ANIM_LOOP = {
  none: { name: 'Brak' },
  pulse: { name: 'Puls', fn: (lt, s, a) => { s.s *= 1 + 0.06 * a * Math.sin(lt * Math.PI * 2 * 1.4); } },
  heart: { name: 'Serce', fn: (lt, s, a) => { const x = (lt * 1.2) % 1; s.s *= 1 + 0.11 * a * (Math.pow(Math.sin(Math.min(1, x * 2.4) * Math.PI), 2) * (x < 0.42 ? 1 : 0)); } },
  swing: { name: 'Kołysanie', fn: (lt, s, a) => { s.r += Math.sin(lt * 2.6) * 0.09 * a; } },
  float: { name: 'Unoszenie', fn: (lt, s, a) => { s.dy += Math.sin(lt * 2.2) * 0.025 * a; } },
  jitter: { name: 'Drżenie', fn: (lt, s, a) => { const r = rng(Math.floor(lt * 18) + 3); s.dx += (r() - 0.5) * 0.02 * a; s.dy += (r() - 0.5) * 0.02 * a; s.r += (r() - 0.5) * 0.03 * a; } },
  spin: { name: 'Obracanie', fn: (lt, s, a) => { s.r += lt * 1.4 * a; } },
  kbIn: { name: 'Zbliżanie', fn: (lt, s, a, d) => { s.s *= 1 + 0.18 * a * (lt / d); } },
  kbOut: { name: 'Oddalanie', fn: (lt, s, a, d) => { s.s *= 1.18 - 0.18 * a * (lt / d) + 0.0; } },
  panL: { name: 'Panorama ←', fn: (lt, s, a, d) => { s.s *= 1.15; s.dx += lerp(0.05, -0.05, lt / d) * a; } },
  panR: { name: 'Panorama →', fn: (lt, s, a, d) => { s.s *= 1.15; s.dx += lerp(-0.05, 0.05, lt / d) * a; } },
  blink: { name: 'Migotanie', fn: (lt, s, a) => { s.al *= 1 - 0.6 * a * (Math.floor(lt * 4) % 2); } },
  beat: { name: 'Rytm', fn: (lt, s, a) => { const x = (lt * 2) % 1; s.s *= 1 + 0.07 * a * Math.pow(1 - x, 4); } },
  wobble: { name: 'Chybotanie', fn: (lt, s, a) => { s.dx += Math.sin(lt * 5) * 0.012 * a; s.r += Math.sin(lt * 5 + 1) * 0.05 * a; } },
};
function animState(c, lt, opts = {}) {
  const st = { dx: 0, dy: 0, s: 1, r: 0, al: 1, bl: 0, fl: 1 };
  const dIn = c.animIn && c.animIn.id !== 'none' ? Math.min(c.animIn.dur, c.dur * 0.6) : 0;
  const dOut = c.animOut && c.animOut.id !== 'none' ? Math.min(c.animOut.dur, c.dur * 0.6) : 0;
  if (!opts.skipIn && dIn > 0 && lt < dIn) { const f = ANIM_IO[c.animIn.id]; if (f && f.fn) f.fn(clamp(lt / dIn, 0, 1), st); }
  if (!opts.skipOut && dOut > 0 && lt > c.dur - dOut) { const f = ANIM_IO[c.animOut.id]; if (f && f.fn) f.fn(clamp((c.dur - lt) / dOut, 0, 1), st); }
  if (c.animLoop && c.animLoop.id !== 'none') { const f = ANIM_LOOP[c.animLoop.id]; if (f) f.fn(Math.max(0, lt), st, c.animLoop.amt == null ? 1 : c.animLoop.amt, Math.max(0.1, c.dur)); }
  return st;
}

/* ============================================================
   PRZEJŚCIA  fn(x, A, B, p, W, H)
   x = kontekst docelowy, A/B = płótna klipów, p = 0..1
   ============================================================ */
const TRANS_CATS = ['Popularne', 'Przesuwanie', 'Odsłanianie', 'Efekty'];
const TRANS = {};
function defT(id, name, cat, fn) { TRANS[id] = { id, name, cat, fn }; }
const eio = (p) => ease.inOut(clamp(p, 0, 1));

defT('fade', 'Zanikanie', 'Popularne', (x, A, B, p, W, H) => { x.drawImage(A, 0, 0); x.globalAlpha = p; x.drawImage(B, 0, 0); x.globalAlpha = 1; });
defT('dipblack', 'Przez czerń', 'Popularne', (x, A, B, p, W, H) => {
  const s = p < 0.5; x.drawImage(s ? A : B, 0, 0); x.fillStyle = '#000'; x.globalAlpha = s ? p * 2 : (1 - p) * 2; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
});
defT('dipwhite', 'Biały błysk', 'Popularne', (x, A, B, p, W, H) => {
  const s = p < 0.5; x.drawImage(s ? A : B, 0, 0); x.fillStyle = '#fff'; x.globalAlpha = s ? p * 2 : (1 - p) * 2; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
});
defT('blur', 'Rozmycie', 'Popularne', (x, A, B, p, W, H) => {
  if (HAS_FILTER) x.filter = `blur(${(H * 0.035 * Math.sin(p * Math.PI)).toFixed(2)}px)`;
  x.drawImage(A, 0, 0); x.globalAlpha = eio(p); x.drawImage(B, 0, 0); x.globalAlpha = 1; x.filter = 'none';
});
defT('zoomin', 'Zoom +', 'Popularne', (x, A, B, p, W, H) => {
  const e = eio(p);
  x.save(); x.translate(W / 2, H / 2); const sb = lerp(1.25, 1, e); x.scale(sb, sb); x.drawImage(B, -W / 2, -H / 2); x.restore();
  x.save(); x.translate(W / 2, H / 2); const sa = 1 + e * 0.6; x.scale(sa, sa); x.globalAlpha = 1 - e; x.drawImage(A, -W / 2, -H / 2); x.restore();
});
defT('zoomout', 'Zoom −', 'Popularne', (x, A, B, p, W, H) => {
  const e = eio(p);
  x.drawImage(B, 0, 0);
  x.save(); x.translate(W / 2, H / 2); const sa = lerp(1, 0.55, e); x.scale(sa, sa); x.globalAlpha = 1 - e; x.drawImage(A, -W / 2, -H / 2); x.restore();
});
defT('spin', 'Obrót', 'Popularne', (x, A, B, p, W, H) => {
  const e = eio(p);
  x.save(); x.translate(W / 2, H / 2); x.rotate(-(1 - e) * 0.5); const sb = lerp(1.4, 1, e); x.scale(sb, sb); x.drawImage(B, -W / 2, -H / 2); x.restore();
  x.save(); x.translate(W / 2, H / 2); x.rotate(e * 0.9); const sa = 1 + e * 0.5; x.scale(sa, sa); x.globalAlpha = 1 - e; x.drawImage(A, -W / 2, -H / 2); x.restore();
});
defT('flip', 'Przewrót', 'Popularne', (x, A, B, p, W, H) => {
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const cs = Math.abs(Math.cos(p * Math.PI)), src = p < 0.5 ? A : B;
  x.save(); x.translate(W / 2, H / 2); x.scale(Math.max(0.002, cs), 1); x.drawImage(src, -W / 2, -H / 2); x.restore();
});
defT('pushL', 'Przesuń ←', 'Przesuwanie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, -W * e, 0); x.drawImage(B, W * (1 - e), 0); });
defT('pushR', 'Przesuń →', 'Przesuwanie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, W * e, 0); x.drawImage(B, -W * (1 - e), 0); });
defT('pushU', 'Przesuń ↑', 'Przesuwanie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, 0, -H * e); x.drawImage(B, 0, H * (1 - e)); });
defT('pushD', 'Przesuń ↓', 'Przesuwanie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, 0, H * e); x.drawImage(B, 0, -H * (1 - e)); });
defT('coverL', 'Przykryj ←', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(A, 0, 0);
  x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = W * 0.03; x.drawImage(B, W * (1 - e), 0); x.restore();
});
defT('coverR', 'Przykryj →', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(A, 0, 0);
  x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = W * 0.03; x.drawImage(B, -W * (1 - e), 0); x.restore();
});
defT('whip', 'Smagnięcie', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p);
  if (HAS_FILTER) x.filter = `blur(${(W * 0.03 * Math.sin(p * Math.PI)).toFixed(2)}px)`;
  x.drawImage(A, -W * e * 1.1, 0); x.drawImage(B, W * (1 - e) * 1.1, 0); x.filter = 'none';
});
function wipeClip(x, B, p, W, H, r) { x.save(); x.beginPath(); x.rect(r[0], r[1], r[2], r[3]); x.clip(); x.drawImage(B, 0, 0); x.restore(); }
defT('wipeL', 'Wycieraczka ←', 'Odsłanianie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, 0, 0); wipeClip(x, B, p, W, H, [W * (1 - e), 0, W * e, H]); });
defT('wipeR', 'Wycieraczka →', 'Odsłanianie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, 0, 0); wipeClip(x, B, p, W, H, [0, 0, W * e, H]); });
defT('wipeU', 'Wycieraczka ↑', 'Odsłanianie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, 0, 0); wipeClip(x, B, p, W, H, [0, H * (1 - e), W, H * e]); });
defT('wipeD', 'Wycieraczka ↓', 'Odsłanianie', (x, A, B, p, W, H) => { const e = eio(p); x.drawImage(A, 0, 0); wipeClip(x, B, p, W, H, [0, 0, W, H * e]); });
defT('circle', 'Koło', 'Odsłanianie', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(A, 0, 0);
  x.save(); x.beginPath(); x.arc(W / 2, H / 2, e * Math.hypot(W, H) / 2, 0, Math.PI * 2); x.clip(); x.drawImage(B, 0, 0); x.restore();
});
defT('diag', 'Przekątna', 'Odsłanianie', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(A, 0, 0);
  x.save(); x.beginPath(); x.moveTo(0, 0); x.lineTo(2 * e * W, 0); x.lineTo(0, 2 * e * H); x.closePath(); x.clip(); x.drawImage(B, 0, 0); x.restore();
});
defT('blinds', 'Żaluzje', 'Odsłanianie', (x, A, B, p, W, H) => {
  const e = eio(p), n = 8; x.drawImage(A, 0, 0);
  x.save(); x.beginPath(); for (let i = 0; i < n; i++) x.rect(i * W / n, 0, W / n * e, H); x.clip(); x.drawImage(B, 0, 0); x.restore();
});
defT('blocks', 'Kostki', 'Odsłanianie', (x, A, B, p, W, H) => {
  const cols = 10, rows = Math.max(4, Math.round(cols * H / W)), cw = W / cols, ch = H / rows, r = rng(42), e = eio(p);
  x.drawImage(A, 0, 0);
  for (let i = 0; i < cols * rows; i++) {
    const th = r() * 0.7, f = clamp((e - th) / 0.3, 0, 1);
    if (f <= 0) continue;
    const cx = (i % cols) * cw, cy = Math.floor(i / cols) * ch;
    x.save(); x.beginPath(); x.rect(cx, cy, cw + 0.5, ch + 0.5); x.clip(); x.globalAlpha = f; x.drawImage(B, 0, 0); x.restore();
  }
});
defT('glitch', 'Glitch', 'Efekty', (x, A, B, p, W, H) => {
  const n = 16, r = rng(Math.floor(p * 18) * 131 + 7), amt = Math.sin(p * Math.PI);
  x.drawImage(p < 0.5 ? A : B, 0, 0);
  for (let i = 0; i < n; i++) {
    const y = Math.floor(r() * H), hh = Math.floor((0.01 + r() * 0.1) * H), off = (r() - 0.5) * W * 0.3 * amt, src = r() < p ? B : A;
    x.clearRect(0, y, W, hh); x.drawImage(src, 0, y, W, hh, off, y, W, hh);
  }
  rgbSplit(x.canvas, Math.round(W * 0.02 * amt), 0);
});
defT('rgb', 'Rozdzielenie RGB', 'Efekty', (x, A, B, p, W, H) => {
  x.drawImage(A, 0, 0); x.globalAlpha = eio(p); x.drawImage(B, 0, 0); x.globalAlpha = 1;
  rgbSplit(x.canvas, Math.round(W * 0.035 * Math.sin(p * Math.PI)), 0);
});
defT('pixel', 'Mozaika', 'Efekty', (x, A, B, p, W, H) => {
  const px = Math.max(1, Math.round(1 + Math.sin(p * Math.PI) * W * 0.06));
  const sw = Math.max(1, Math.round(W / px)), sh = Math.max(1, Math.round(H / px));
  const s = POOL.get(sw, sh), sx = s.getContext('2d');
  sx.drawImage(A, 0, 0, sw, sh); sx.globalAlpha = eio(p); sx.drawImage(B, 0, 0, sw, sh); sx.globalAlpha = 1;
  x.imageSmoothingEnabled = px < 2; x.drawImage(s, 0, 0, sw, sh, 0, 0, W, H); x.imageSmoothingEnabled = true; POOL.free(s);
});
defT('shake', 'Wstrząs', 'Efekty', (x, A, B, p, W, H) => {
  const r = rng(Math.floor(p * 30)), amt = Math.sin(p * Math.PI);
  x.save(); x.translate((r() - 0.5) * W * 0.05 * amt, (r() - 0.5) * H * 0.05 * amt);
  x.drawImage(A, 0, 0); x.globalAlpha = p < 0.5 ? 0 : 1; x.drawImage(B, 0, 0); x.restore();
});

/* ============================================================
   Wzorcowa scena do miniatur
   ============================================================ */
function drawScene(x, w, hh, v) {
  const pal = v ? ['#0b1030', '#3a2a7a', '#ff9bd0', '#1d1648', '#2c1f66'] : ['#ffb347', '#ff6f61', '#fff1b8', '#7a3b4f', '#4d2540'];
  const g = x.createLinearGradient(0, 0, 0, hh);
  g.addColorStop(0, pal[0]); g.addColorStop(0.6, pal[1]); g.addColorStop(1, pal[2]);
  x.fillStyle = g; x.fillRect(0, 0, w, hh);
  x.fillStyle = v ? '#fff6c8' : '#fff7d6'; x.beginPath(); x.arc(w * (v ? 0.72 : 0.3), hh * 0.34, hh * 0.15, 0, 7); x.fill();
  x.fillStyle = pal[3]; x.beginPath(); x.moveTo(0, hh); x.lineTo(0, hh * 0.68); x.lineTo(w * 0.25, hh * 0.52); x.lineTo(w * 0.45, hh * 0.7); x.lineTo(w * 0.66, hh * 0.5); x.lineTo(w, hh * 0.72); x.lineTo(w, hh); x.fill();
  x.fillStyle = pal[4]; x.beginPath(); x.moveTo(0, hh); x.lineTo(0, hh * 0.82); x.lineTo(w * 0.35, hh * 0.7); x.lineTo(w * 0.7, hh * 0.86); x.lineTo(w, hh * 0.76); x.lineTo(w, hh); x.fill();
  x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(w * 0.12, hh * 0.12, w * 0.22, hh * 0.05);
}
