'use strict';
/* ============================================================
   Kadr Studio — rozszerzenia: dodatkowe efekty, przejścia, filtry, animacje
   ============================================================ */
function blendLayer(c, paint, blend, alpha) {
  const W = c.width, H = c.height, m = POOL.get(W, H), mx = m.getContext('2d');
  paint(mx, W, H);
  mx.globalCompositeOperation = 'destination-in'; mx.drawImage(c, 0, 0);
  const x = c.getContext('2d');
  x.save(); x.globalCompositeOperation = blend; x.globalAlpha = clamp(alpha, 0, 1); x.drawImage(m, 0, 0); x.restore();
  POOL.free(m);
}
function chromaAb(c, k) {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), ch = POOL.get(W, H), cx = ch.getContext('2d');
  x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
  [['#ff0000', 1 + k], ['#00ff00', 1], ['#0000ff', 1 - k]].forEach(([col, s]) => {
    const put = () => { cx.save(); cx.translate(W / 2, H / 2); cx.scale(s, s); cx.translate(-W / 2, -H / 2); cx.drawImage(src, 0, 0); cx.restore(); };
    cx.globalCompositeOperation = 'copy'; put();
    cx.globalCompositeOperation = 'multiply'; cx.fillStyle = col; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'destination-in'; put();
    x.drawImage(ch, 0, 0);
  });
  x.globalCompositeOperation = 'source-over'; POOL.free(src); POOL.free(ch);
}
function filterCopy(c, filter, alpha, blend) {
  if (!HAS_FILTER) return;
  const src = POOL.copy(c), x = c.getContext('2d');
  x.save(); x.globalAlpha = alpha == null ? 1 : alpha; if (blend) x.globalCompositeOperation = blend;
  x.filter = filter; x.drawImage(src, 0, 0); x.restore(); POOL.free(src);
}
function star4(x, cx, cy, r, a) {
  x.save(); x.globalAlpha = a; x.fillStyle = '#fff';
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 0.5); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 0.5, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r); x.quadraticCurveTo(cx, cy, cx - r, cy); x.fill();
  x.restore();
}

/* ---------- GLITCH ---------- */
defFx('blockglitch', 'Glitch blokowy', 'Glitch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), r = rng(Math.floor(t * 10) * 131 + 3), n = Math.round(3 + a * 12);
  for (let i = 0; i < n; i++) {
    if (r() > 0.45 + 0.5 * a) continue;
    const bw = (0.05 + r() * 0.25) * W, bh = (0.03 + r() * 0.15) * H, bx = r() * (W - bw), by = r() * (H - bh);
    x.drawImage(src, bx, by, bw, bh, bx + (r() - 0.5) * W * 0.2 * a, by + (r() - 0.5) * H * 0.1 * a, bw, bh);
  }
  POOL.free(src);
});
defFx('jitter', 'Drgania', 'Glitch', (c, a, t) => {
  const r = rng(Math.floor(t * 30) + 11), W = c.width, H = c.height;
  const dx = (r() - 0.5) * W * 0.02 * a, dy = (r() - 0.5) * H * 0.02 * a;
  xform(c, (x) => { x.translate(dx, dy); });
  if (a > 0.4) rgbSplit(c, Math.round(W * 0.004 * a), 0);
});
defFx('scanroll', 'Przewijany pasek', 'Glitch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), y0 = ((t * 0.35) % 1.3 - 0.15) * H, bh = H * 0.14;
  x.clearRect(0, 0, W, H);
  for (let y = 0; y < H; y += 3) { const d = Math.abs(y - y0 - bh / 2) / (bh / 2), off = d < 1 ? (1 - d) * W * 0.04 * a * Math.sin(y * 0.3 + t * 30) : 0; x.drawImage(src, 0, y, W, 3, off, y, W, 3); }
  POOL.free(src);
  blendLayer(c, (mx, w, h) => { const g = mx.createLinearGradient(0, y0, 0, y0 + bh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.5 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); mx.fillStyle = g; mx.fillRect(0, y0, w, bh); }, 'screen', 1);
});
defFx('tvstatic', 'Szum TV', 'Glitch', (c, a, t) => { noiseOverlay(c, 0.75 * a, t, 'source-over'); noiseOverlay(c, 0.4 * a, t + 3, 'overlay'); });
defFx('sliceV', 'Pionowe paski', 'Glitch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), r = rng(Math.floor(t * 12) * 17 + 5), n = Math.round(4 + a * 10);
  for (let i = 0; i < n; i++) { const sx = Math.floor(r() * W), sw = Math.max(2, Math.floor((0.01 + r() * 0.06) * W)), oy = Math.round((r() - 0.5) * H * 0.3 * a); x.clearRect(sx, 0, sw, H); x.drawImage(src, sx, 0, sw, H, sx, oy, sw, H); }
  POOL.free(src);
});
defFx('chromab', 'Aberracja chromatyczna', 'Glitch', (c, a, t) => { chromaAb(c, 0.012 * a * (0.8 + 0.2 * Math.sin(t * 6))); });
defFx('datamosh', 'Smuga (datamosh)', 'Glitch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), r = rng(Math.floor(t * 8) + 77);
  x.clearRect(0, 0, W, H);
  for (let i = 5; i >= 1; i--) { x.globalAlpha = 0.16 * a; x.save(); x.translate(W / 2, H / 2); const s = 1 + i * 0.012 * a; x.scale(s, s); x.translate(-W / 2 + (r() - 0.5) * W * 0.03 * i * a, -H / 2 + (r() - 0.5) * H * 0.03 * i * a); x.drawImage(src, 0, 0); x.restore(); }
  x.globalAlpha = 1; x.drawImage(src, 0, 0); POOL.free(src);
});
defFx('glitchcolor', 'Kolorowy glitch', 'Glitch', (c, a, t) => {
  FX.glitch.fn(c, a, t);
  if (HAS_FILTER && Math.sin(t * 17) > 0.4) filterCopy(c, `hue-rotate(${Math.round(120 + 100 * Math.sin(t * 9))}deg) saturate(1.8)`, 0.55 * a, 'source-atop');
});

/* ---------- RETRO ---------- */
defFx('oldfilm', 'Stary film', 'Retro', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), r = rng(Math.floor(t * 18) + 9);
  filterCopy(c, 'sepia(.85) contrast(1.1)', a, 'source-atop');
  x.save(); x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 3; i++) if (r() < 0.6) { x.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.3 * a})`; x.fillRect(r() * W, 0, Math.max(1, W * 0.0015), H); }
  for (let i = 0; i < 14; i++) { x.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)'; const s = 1 + r() * H * 0.004; x.fillRect(r() * W, r() * H, s, s); }
  x.fillStyle = `rgba(0,0,0,${(r() * 0.08) * a})`; x.fillRect(0, 0, W, H); x.restore();
  noiseOverlay(c, 0.25 * a, t); vignetteOverlay(c, 0.45 * a);
});
defFx('dust', 'Kurz i rysy', 'Retro', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), r = rng(Math.floor(t * 12) + 21);
  x.save(); x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 30 * a + 4; i++) { const s = 0.5 + r() * H * 0.005; x.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`; x.beginPath(); x.arc(r() * W, r() * H, s, 0, 7); x.fill(); }
  for (let i = 0; i < 2; i++) if (r() < 0.5) { x.strokeStyle = `rgba(255,255,255,${0.2 + r() * 0.4})`; x.lineWidth = 1; x.beginPath(); const sx = r() * W; x.moveTo(sx, 0); x.lineTo(sx + (r() - 0.5) * 12, H); x.stroke(); }
  x.restore();
});
defFx('filmburn', 'Przepalenie taśmy', 'Retro', (c, a, t) => {
  const f = 0.5 + 0.5 * Math.sin(t * 1.7) * Math.sin(t * 0.9 + 1);
  blendLayer(c, (mx, W, H) => { const g = mx.createRadialGradient(W * (0.2 + 0.6 * f), H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8); g.addColorStop(0, `rgba(255,240,180,${0.9 * a})`); g.addColorStop(0.35, `rgba(255,120,30,${0.7 * a})`); g.addColorStop(1, 'rgba(120,10,0,0)'); mx.fillStyle = g; mx.fillRect(0, 0, W, H); }, 'screen', Math.min(1, 0.4 + f * a));
});
defFx('cctv', 'Kamera CCTV', 'Retro', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d');
  filterCopy(c, 'grayscale(1) contrast(1.2) brightness(1.1)', 1, 'source-over');
  blendLayer(c, (mx, w, h) => { mx.fillStyle = 'rgba(40,255,120,.55)'; mx.fillRect(0, 0, w, h); }, 'multiply', 0.55 * a + 0.2);
  const pitch = Math.max(2, Math.round(H / 160)); x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += pitch * 2) x.fillRect(0, y, W, pitch); x.restore();
  noiseOverlay(c, 0.2 * a, t);
  const fs = Math.round(H * 0.04); x.save(); x.font = `bold ${fs}px "Courier New", monospace`; x.fillStyle = '#d8ffe0'; x.shadowColor = '#000'; x.shadowBlur = 4; x.fillText('CAM 01', fs, fs * 1.6); x.fillText(fmtTime(t, true), fs, H - fs); if (Math.floor(t * 2) % 2 === 0) { x.fillStyle = '#ff3030'; x.beginPath(); x.arc(W - fs * 1.8, fs * 1.4, fs * 0.28, 0, 7); x.fill(); } x.restore();
});
defFx('lowfi', 'Lo-fi', 'Retro', (c, a) => {
  const W = c.width, H = c.height, k = 0.25 + (1 - a) * 0.5, sw = Math.max(8, Math.round(W * k)), sh = Math.max(8, Math.round(H * k)), s = POOL.get(sw, sh);
  s.getContext('2d').drawImage(c, 0, 0, sw, sh);
  const x = c.getContext('2d'); x.clearRect(0, 0, W, H); x.imageSmoothingEnabled = true; x.drawImage(s, 0, 0, sw, sh, 0, 0, W, H); POOL.free(s);
  filterCopy(c, 'saturate(.75) contrast(1.1)', 1, 'source-over');
});
defFx('halftone', 'Półton', 'Retro', (c, a) => {
  const W = c.width, H = c.height, cols = Math.round(44 + (1 - a) * 40), cell = W / cols, rows = Math.ceil(H / cell), s = POOL.get(cols, rows), sx = s.getContext('2d');
  sx.drawImage(c, 0, 0, cols, rows);
  const d = sx.getImageData(0, 0, cols, rows).data, x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = (j * cols + i) * 4, al = d[k + 3] / 255; if (al < 0.05) continue;
    const lum = (0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2]) / 255;
    x.fillStyle = `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`; x.beginPath(); x.arc((i + 0.5) * cell, (j + 0.5) * cell, cell * 0.62 * (0.3 + 0.7 * lum) * al, 0, 7); x.fill();
  }
  POOL.free(s);
});
defFx('polaroid', 'Ramka Polaroid', 'Retro', (c, a) => {
  const W = c.width, H = c.height, src = POOL.copy(c), x = c.getContext('2d');
  x.clearRect(0, 0, W, H); x.save(); x.translate(W / 2, H / 2); x.rotate(-0.03 * a); const s = 0.8;
  x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = H * 0.04; x.fillStyle = '#f7f3ea'; x.fillRect(-W * s / 2 - W * 0.025, -H * s / 2 - H * 0.03, W * s + W * 0.05, H * s + H * 0.03 + H * 0.12);
  x.shadowColor = 'transparent'; x.drawImage(src, -W * s / 2, -H * s / 2, W * s, H * s); x.restore(); POOL.free(src);
});
defFx('vhs2', 'VHS+ (mocny)', 'Retro', (c, a, t) => { FX.vhs.fn(c, Math.min(1, a * 1.3), t); chromaAb(c, 0.006 * a); noiseOverlay(c, 0.18 * a, t + 1); });

/* ---------- RUCH ---------- */
defFx('zoompunch', 'Uderzenie zoom', 'Ruch', (c, a, t) => { const p = (t * 2) % 1, s = 1 + 0.2 * a * Math.pow(1 - p, 3); xform(c, (x, W, H) => scaleAbout(x, W, H, s)); });
defFx('spinzoom', 'Wir', 'Ruch', (c, a, t) => { const rot = Math.sin(t * 1.6) * 0.12 * a, s = 1.12 + 0.05 * a * Math.sin(t * 3.2); xform(c, (x, W, H) => { x.translate(W / 2, H / 2); x.rotate(rot); x.scale(s, s); x.translate(-W / 2, -H / 2); }); });
defFx('tilt', 'Przechył', 'Ruch', (c, a, t) => { const rot = Math.sin(t * 2.4) * 0.05 * a; xform(c, (x, W, H) => { x.translate(W / 2, H / 2); x.rotate(rot); x.scale(1.08, 1.08); x.translate(-W / 2, -H / 2); }); });
defFx('hop', 'Podskok', 'Ruch', (c, a, t) => { const dy = -Math.abs(Math.sin(t * Math.PI * 1.6)) * c.height * 0.05 * a; xform(c, (x) => { x.translate(0, dy); }); });
defFx('heavyshake', 'Mocne trzęsienie', 'Ruch', (c, a, t) => {
  const r = rng(Math.floor(t * 24) + 41), W = c.width, H = c.height;
  const dx = (r() - 0.5) * W * 0.09 * a, dy = (r() - 0.5) * H * 0.09 * a, rot = (r() - 0.5) * 0.08 * a, s = 1 + 0.1 * a;
  xform(c, (x) => { x.translate(W / 2 + dx, H / 2 + dy); x.rotate(rot); x.scale(s, s); x.translate(-W / 2, -H / 2); });
  rgbSplit(c, Math.round(W * 0.01 * a), 0);
});
defFx('slowzoom', 'Powolne zbliżanie', 'Ruch', (c, a, t) => { const s = 1 + 0.3 * a * (1 - Math.exp(-Math.max(0, t) * 0.35)); xform(c, (x, W, H) => scaleAbout(x, W, H, s)); });
defFx('motionblur', 'Smuga ruchu', 'Ruch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), n = 7, dir = Math.sin(t * 2.3);
  x.clearRect(0, 0, W, H);
  for (let k = 0; k < n; k++) { x.globalAlpha = 1 / n * (k === 3 ? 1.6 : 1); x.drawImage(src, (k - 3) * W * 0.012 * a * (0.5 + Math.abs(dir)), 0); }
  x.globalAlpha = 1; POOL.free(src);
});
defFx('radialblur', 'Rozmycie radialne', 'Ruch', (c, a, t) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c), n = 8;
  x.clearRect(0, 0, W, H);
  for (let k = n; k >= 0; k--) { const s = 1 + k * 0.012 * a * (0.7 + 0.3 * Math.sin(t * 4)); x.globalAlpha = k === 0 ? 1 : 0.5 / n * 2; x.save(); scaleAbout(x, W, H, s); x.drawImage(src, 0, 0); x.restore(); }
  x.globalAlpha = 1; POOL.free(src);
});
defFx('handheld', 'Kamera z ręki', 'Ruch', (c, a, t) => {
  const W = c.width, H = c.height, dx = (Math.sin(t * 1.3) + Math.sin(t * 2.9 + 1)) * W * 0.006 * a, dy = (Math.sin(t * 1.7 + 2) + Math.sin(t * 3.3)) * H * 0.006 * a, rot = Math.sin(t * 1.1 + 4) * 0.012 * a;
  xform(c, (x) => { x.translate(W / 2 + dx, H / 2 + dy); x.rotate(rot); x.scale(1.04, 1.04); x.translate(-W / 2, -H / 2); });
});

/* ---------- ŚWIATŁO ---------- */
defFx('lensflare', 'Flara', 'Światło', (c, a, t) => {
  blendLayer(c, (mx, W, H) => {
    const px = W * (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.6))), py = H * (0.25 + 0.1 * Math.cos(t * 0.8)), R = Math.max(W, H);
    const g = mx.createRadialGradient(px, py, 0, px, py, R * 0.3); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.15, `rgba(255,220,150,${0.7 * a})`); g.addColorStop(1, 'rgba(255,140,60,0)');
    mx.fillStyle = g; mx.fillRect(0, 0, W, H);
    mx.fillStyle = `rgba(255,230,190,${0.7 * a})`; mx.fillRect(0, py - 2, W, 4);
    [[0.35, 0.05, '255,120,80'], [0.6, 0.08, '120,200,255'], [0.8, 0.04, '255,255,160'], [1.1, 0.1, '255,100,200']].forEach(([k, r, col]) => { const cx = px + (W / 2 - px) * 2 * k, cy = py + (H / 2 - py) * 2 * k; const gg = mx.createRadialGradient(cx, cy, 0, cx, cy, R * r); gg.addColorStop(0, `rgba(${col},${0.5 * a})`); gg.addColorStop(1, `rgba(${col},0)`); mx.fillStyle = gg; mx.beginPath(); mx.arc(cx, cy, R * r, 0, 7); mx.fill(); });
  }, 'screen', 1);
});
defFx('rays', 'Promienie światła', 'Światło', (c, a, t) => {
  blendLayer(c, (mx, W, H) => {
    const ox = W * 0.15, oy = -H * 0.1, n = 9;
    for (let i = 0; i < n; i++) { const ang = 0.3 + i * 0.16 + Math.sin(t * 0.4 + i) * 0.04, w = 0.03 + 0.02 * Math.sin(t + i * 2), L = Math.hypot(W, H) * 1.2; mx.fillStyle = `rgba(255,235,190,${0.22 * a})`; mx.beginPath(); mx.moveTo(ox, oy); mx.lineTo(ox + Math.cos(ang - w) * L, oy + Math.sin(ang - w) * L); mx.lineTo(ox + Math.cos(ang + w) * L, oy + Math.sin(ang + w) * L); mx.closePath(); mx.fill(); }
  }, 'screen', 1);
});
defFx('bokeh', 'Bokeh', 'Światło', (c, a, t) => {
  blendLayer(c, (mx, W, H) => {
    const r = rng(5);
    for (let i = 0; i < 22; i++) { const bx = (r() * W + Math.sin(t * 0.3 + i) * W * 0.03 + W) % W, by = (r() * H - t * H * 0.02 * (0.5 + r()) + H * 2) % H, br = (0.02 + r() * 0.06) * H, hue = Math.floor(30 + r() * 40); const g = mx.createRadialGradient(bx, by, br * 0.6, bx, by, br); g.addColorStop(0, `hsla(${hue},100%,75%,${0.28 * a})`); g.addColorStop(0.9, `hsla(${hue},100%,70%,${0.4 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); mx.fillStyle = g; mx.beginPath(); mx.arc(bx, by, br, 0, 7); mx.fill(); }
  }, 'screen', 1);
});
defFx('sparkle', 'Iskierki', 'Światło', (c, a, t) => {
  blendLayer(c, (mx, W, H) => { const r = rng(31); for (let i = 0; i < 26; i++) { const bx = r() * W, by = r() * H, sz = (0.01 + r() * 0.025) * H, tw = Math.max(0, Math.sin(t * (2 + r() * 4) + r() * 6)); if (tw > 0.05) star4(mx, bx, by, sz * (0.5 + tw), tw * a); } }, 'screen', 1);
});
defFx('overexpose', 'Prześwietlenie', 'Światło', (c, a, t) => { washOverlay(c, '#fff4d8', a * (0.25 + 0.25 * Math.sin(t * 2.4))); filterCopy(c, `contrast(${1 + 0.2 * a}) brightness(${1 + 0.25 * a})`, 1, 'source-over'); });
defFx('neonglow', 'Neonowa poświata', 'Światło', (c, a) => {
  if (!HAS_FILTER) return;
  const src = POOL.copy(c), x = c.getContext('2d'); x.save(); x.globalCompositeOperation = 'screen'; x.filter = `blur(${(c.height * 0.012).toFixed(1)}px) saturate(2.2) brightness(1.3)`; x.globalAlpha = Math.min(1, 0.5 + a * 0.5); x.drawImage(src, 0, 0); x.restore();
  x.save(); x.filter = `saturate(${1 + a * 0.6}) contrast(${1 + a * 0.15})`; x.globalCompositeOperation = 'source-over'; x.drawImage(src, 0, 0); x.restore(); POOL.free(src);
});
defFx('prism', 'Pryzmat', 'Światło', (c, a, t) => { rgbSplit(c, Math.round(c.width * 0.02 * a), Math.round(c.height * 0.012 * a * Math.sin(t * 3))); filterCopy(c, 'saturate(1.4) brightness(1.08)', a, 'source-over'); });
defFx('vigpulse', 'Pulsująca winieta', 'Światło', (c, a, t) => { vignetteOverlay(c, a * (0.45 + 0.4 * Math.sin(t * 3.2))); });
defFx('lightflicker', 'Migotanie światła', 'Światło', (c, a, t) => { const r = rng(Math.floor(t * 20) + 6); if (r() < 0.45) washOverlay(c, '#000', a * (0.2 + r() * 0.5)); else if (r() < 0.15) washOverlay(c, '#fff', a * 0.2); });

/* ---------- KOLOR ---------- */
defFx('duotone', 'Duotone', 'Kolor', (c, a) => {
  filterCopy(c, 'grayscale(1) contrast(1.15)', 1, 'source-over');
  blendLayer(c, (mx, W, H) => { const g = mx.createLinearGradient(0, H, W, 0); g.addColorStop(0, '#2b0f7a'); g.addColorStop(1, '#ff5ec4'); mx.fillStyle = g; mx.fillRect(0, 0, W, H); }, 'color', a);
});
defFx('sunsetduo', 'Duotone zachód', 'Kolor', (c, a) => {
  filterCopy(c, 'grayscale(1) contrast(1.2)', 1, 'source-over');
  blendLayer(c, (mx, W, H) => { const g = mx.createLinearGradient(0, H, 0, 0); g.addColorStop(0, '#6a1b9a'); g.addColorStop(1, '#ffb347'); mx.fillStyle = g; mx.fillRect(0, 0, W, H); }, 'color', a);
});
defFx('hueshift', 'Tęcza', 'Kolor', (c, a, t) => { filterCopy(c, `hue-rotate(${Math.round(t * 70 * a) % 360}deg)`, 1, 'source-over'); });
defFx('cyberpunk', 'Cyberpunk', 'Kolor', (c, a) => {
  blendLayer(c, (mx, W, H) => { const g = mx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#00e5ff'); g.addColorStop(0.5, '#7b2cff'); g.addColorStop(1, '#ff2d95'); mx.fillStyle = g; mx.fillRect(0, 0, W, H); }, 'overlay', 0.9 * a);
  filterCopy(c, `contrast(${1 + 0.2 * a}) saturate(${1 + 0.4 * a})`, 1, 'source-over');
});
defFx('nightvision', 'Noktowizor', 'Kolor', (c, a, t) => {
  filterCopy(c, 'grayscale(1) contrast(1.3) brightness(1.3)', 1, 'source-over');
  blendLayer(c, (mx, W, H) => { mx.fillStyle = '#25ff4a'; mx.fillRect(0, 0, W, H); }, 'multiply', 0.9 * a + 0.1);
  noiseOverlay(c, 0.3 * a, t); vignetteOverlay(c, 0.6 * a);
});
defFx('satpulse', 'Pulsujące kolory', 'Kolor', (c, a, t) => { filterCopy(c, `saturate(${(1 + a * (0.9 + 0.9 * Math.sin(t * 3))).toFixed(2)})`, 1, 'source-over'); });
defFx('bleach', 'Wypłowiały kontrast', 'Kolor', (c, a) => { filterCopy(c, `contrast(${1 + 0.5 * a}) saturate(${1 - 0.55 * a}) brightness(1.04)`, 1, 'source-over'); });
defFx('splitcolor', 'Dwa kolory', 'Kolor', (c, a) => {
  blendLayer(c, (mx, W, H) => { const g = mx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#1f6bff'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, '#ff2a4a'); mx.fillStyle = g; mx.fillRect(0, 0, W, H); }, 'soft-light', Math.min(1, a * 1.2));
});

/* ---------- INNE ---------- */
defFx('frame', 'Ramka', 'Popularne', (c, a) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), b = Math.min(W, H) * (0.025 + 0.04 * a);
  x.save(); x.strokeStyle = '#fff'; x.lineWidth = b; x.strokeRect(b / 2, b / 2, W - b, H - b); x.restore();
});
defFx('split2', 'Podwójny kadr', 'Popularne', (c) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c); x.clearRect(0, 0, W, H);
  x.drawImage(src, 0, 0, W, H, 0, 0, W / 2, H); x.save(); x.translate(W, 0); x.scale(-1, 1); x.drawImage(src, 0, 0, W, H, 0, 0, W / 2, H); x.restore(); POOL.free(src);
});
defFx('tile4', 'Kafelki 2×2', 'Popularne', (c) => {
  const W = c.width, H = c.height, x = c.getContext('2d'), src = POOL.copy(c); x.clearRect(0, 0, W, H);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) x.drawImage(src, 0, 0, W, H, i * W / 2, j * H / 2, W / 2, H / 2);
  POOL.free(src);
});
FX_CATS.splice(0, FX_CATS.length, 'Popularne', 'Glitch', 'Retro', 'Ruch', 'Światło', 'Kolor');

/* ============================================================
   FILTRY — więcej presetów
   ============================================================ */
FILTER_CATS.splice(0, FILTER_CATS.length, 'Popularne', 'Kino', 'Ciepłe i zimne', 'Retro', 'Czerń i biel', 'Kolorowe');
Object.assign(FILTERS, {
  bright: { name: 'Jasny', cat: 'Popularne', f: { brightness: 1.15, contrast: 1.05, saturate: 1.1 } },
  soft: { name: 'Miękki', cat: 'Popularne', f: { brightness: 1.06, contrast: 0.92, saturate: 1.05, blur: 0.0012 }, tint: ['#ffe7e0', 0.1] },
  crisp: { name: 'Ostry', cat: 'Popularne', f: { contrast: 1.25, saturate: 1.2 } },
  hdr: { name: 'HDR', cat: 'Popularne', f: { contrast: 1.35, saturate: 1.45, brightness: 1.02 }, vig: 0.2 },
  punch: { name: 'Mocny edit', cat: 'Popularne', f: { contrast: 1.3, saturate: 1.5, brightness: 1.05 }, tint: ['#ff7a3d', 0.07], vig: 0.3 },
  glow: { name: 'Poświata', cat: 'Popularne', f: { brightness: 1.12, contrast: 1.05, saturate: 1.2, blur: 0.0015 }, tint: ['#fff0c8', 0.12] },
  film2: { name: 'Kodak', cat: 'Kino', f: { contrast: 1.12, saturate: 1.1, sepia: 0.1 }, tint: ['#ffc36b', 0.13], grain: 0.2 },
  fuji: { name: 'Fuji', cat: 'Kino', f: { contrast: 1.08, saturate: 1.15, brightness: 1.03 }, tint: ['#4ee0a0', 0.1], grain: 0.15 },
  blockbuster: { name: 'Blockbuster', cat: 'Kino', f: { contrast: 1.3, saturate: 1.2, brightness: 0.94 }, tint: ['#1aa6b4', 0.15], vig: 0.45 },
  nightcity: { name: 'Nocne miasto', cat: 'Kino', f: { contrast: 1.2, saturate: 1.3, brightness: 0.88 }, tint: ['#3a1bd6', 0.2], vig: 0.4 },
  noirblue: { name: 'Granatowy noir', cat: 'Kino', f: { contrast: 1.3, saturate: 0.6, brightness: 0.9 }, tint: ['#16306b', 0.25], vig: 0.5 },
  matrix: { name: 'Matrix', cat: 'Kino', f: { contrast: 1.2, saturate: 0.9 }, tint: ['#0fe05c', 0.2], vig: 0.35 },
  golden: { name: 'Złota godzina', cat: 'Ciepłe i zimne', f: { saturate: 1.25, brightness: 1.06, contrast: 1.05 }, tint: ['#ffb02e', 0.22] },
  peach: { name: 'Brzoskwinia', cat: 'Ciepłe i zimne', f: { brightness: 1.08, saturate: 1.1 }, tint: ['#ff9d8a', 0.2] },
  autumn: { name: 'Jesień', cat: 'Ciepłe i zimne', f: { saturate: 1.2, contrast: 1.05 }, tint: ['#d9640f', 0.22] },
  arctic: { name: 'Arktyka', cat: 'Ciepłe i zimne', f: { brightness: 1.1, saturate: 0.85, contrast: 1.05 }, tint: ['#bfeaff', 0.25] },
  desert: { name: 'Pustynia', cat: 'Ciepłe i zimne', f: { saturate: 1.1, contrast: 1.1 }, tint: ['#e6a85a', 0.24] },
  ice: { name: 'Lód', cat: 'Ciepłe i zimne', f: { saturate: 0.9, contrast: 1.15, brightness: 1.05 }, tint: ['#5ab8ff', 0.22] },
  kodachrome: { name: 'Kodachrome', cat: 'Retro', f: { contrast: 1.18, saturate: 1.35, sepia: 0.12 }, tint: ['#ff6a2b', 0.08], grain: 0.25, vig: 0.3 },
  polaroid: { name: 'Polaroid', cat: 'Retro', f: { contrast: 0.95, saturate: 0.9, brightness: 1.06, sepia: 0.18 }, tint: ['#ffe9b8', 0.18], vig: 0.25 },
  y2k: { name: 'Y2K', cat: 'Retro', f: { contrast: 1.15, saturate: 1.5, brightness: 1.06 }, tint: ['#7ad0ff', 0.12], grain: 0.15 },
  vintage: { name: 'Vintage', cat: 'Retro', f: { sepia: 0.5, contrast: 0.95, brightness: 1.04 }, tint: ['#d8b27a', 0.2], vig: 0.4, grain: 0.3 },
  cinebw: { name: 'Kino B&W', cat: 'Czerń i biel', f: { grayscale: 1, contrast: 1.35, brightness: 0.95 }, grain: 0.3, vig: 0.4 },
  inkbw: { name: 'Tusz', cat: 'Czerń i biel', f: { grayscale: 1, contrast: 1.8, brightness: 0.95 } },
  warmbw: { name: 'Ciepłe B&W', cat: 'Czerń i biel', f: { grayscale: 1, contrast: 1.15 }, tint: ['#e0b37a', 0.22] },
  coolbw: { name: 'Zimne B&W', cat: 'Czerń i biel', f: { grayscale: 1, contrast: 1.15 }, tint: ['#7ab3e0', 0.22] },
  rose: { name: 'Róża', cat: 'Kolorowe', f: { saturate: 1.2, brightness: 1.05 }, tint: ['#ff5c9a', 0.2] },
  lavender: { name: 'Lawenda', cat: 'Kolorowe', f: { saturate: 1.1, brightness: 1.06 }, tint: ['#a98bff', 0.22] },
  matcha: { name: 'Matcha', cat: 'Kolorowe', f: { saturate: 1.1, brightness: 1.04 }, tint: ['#8fd16a', 0.2] },
  miami: { name: 'Miami', cat: 'Kolorowe', f: { saturate: 1.5, contrast: 1.1 }, tint: ['#ff3ea5', 0.16] },
  cyber: { name: 'Cyber', cat: 'Kolorowe', f: { saturate: 1.6, contrast: 1.2 }, tint: ['#00e5ff', 0.18], vig: 0.3 },
  toxic: { name: 'Toksyczny', cat: 'Kolorowe', f: { saturate: 1.7, contrast: 1.15, hue: 30 }, tint: ['#b6ff00', 0.14] },
});

/* ============================================================
   ANIMACJE — więcej wejść/wyjść i pętli
   ============================================================ */
Object.assign(ANIM_IO, {
  punchin: { name: 'Uderzenie', fn: (p, s) => { const e = ease.out(p); s.s *= lerp(1.25, 1, e); s.al *= Math.min(1, p * 8); } },
  zoomshake: { name: 'Zoom + drgania', fn: (p, s) => { const e = ease.out(p), r = rng(Math.floor(p * 14) + 3); s.s *= lerp(0.6, 1, e); s.dx += (r() - 0.5) * 0.04 * (1 - e); s.dy += (r() - 0.5) * 0.04 * (1 - e); s.al *= Math.min(1, p * 4); } },
  rotL: { name: 'Obrót z lewej', fn: (p, s) => { const e = ease.out(p); s.r += lerp(-0.6, 0, e); s.dx += lerp(-0.4, 0, e); s.al *= Math.min(1, p * 3); } },
  rotR: { name: 'Obrót z prawej', fn: (p, s) => { const e = ease.out(p); s.r += lerp(0.6, 0, e); s.dx += lerp(0.4, 0, e); s.al *= Math.min(1, p * 3); } },
  squash: { name: 'Zgniot', fn: (p, s) => { const e = ease.outElastic(p); s.s *= Math.max(0.01, e); s.fl *= Math.max(0.2, 1 + (1 - e) * 0.4); s.al *= Math.min(1, p * 6); } },
  glitchin: { name: 'Glitch', fn: (p, s) => { const r = rng(Math.floor(p * 16) + 9); s.dx += (r() - 0.5) * 0.08 * (1 - p); s.al *= r() > p * 0.9 ? 0.25 : 1; } },
  twist: { name: 'Skręt', fn: (p, s) => { const e = ease.out(p); s.r += lerp(-1.2, 0, e); s.s *= lerp(0.3, 1, e); s.al *= Math.min(1, e * 2); } },
  fly: { name: 'Lot łukiem', fn: (p, s) => { const e = ease.out(p); s.dx += lerp(-0.6, 0, e); s.dy += -Math.sin(e * Math.PI) * 0.2 + lerp(0.3, 0, e); s.r += lerp(-0.3, 0, e); s.al *= Math.min(1, p * 4); } },
  swirl: { name: 'Wir', fn: (p, s) => { const e = ease.out(p); s.r += lerp(Math.PI * 2, 0, e); s.s *= lerp(0, 1, e); s.al *= Math.min(1, p * 3); } },
  unfold: { name: 'Rozwinięcie', fn: (p, s) => { s.s *= 1; s.fl *= 1; s.dy += 0; const e = ease.out(p); s.s *= lerp(0.85, 1, e); s.al *= e; s.bl += (1 - e) * 0.02; } },
  jump: { name: 'Skok', fn: (p, s) => { s.dy += -Math.sin(Math.min(1, p * 1.0) * Math.PI) * 0.12 * (1 - p); s.al *= Math.min(1, p * 6); } },
  tiltin: { name: 'Przechył', fn: (p, s) => { const e = ease.outBack(p); s.r += lerp(0.5, 0, Math.min(1, e)); s.s *= lerp(0.7, 1, Math.min(1, e)); s.al *= Math.min(1, p * 4); } },
  hyperzoom: { name: 'Hiper zoom', fn: (p, s) => { const e = ease.out(p); s.s *= lerp(3, 1, e); s.bl += (1 - e) * 0.05; s.al *= Math.min(1, p * 4); } },
  dropin: { name: 'Spadek', fn: (p, s) => { s.dy += -(1 - ease.outBounce(p)) * 0.9; s.al *= Math.min(1, p * 8); } },
  blurzoom: { name: 'Rozmycie + zoom', fn: (p, s) => { const e = ease.out(p); s.s *= lerp(1.4, 1, e); s.bl += (1 - e) * 0.06; s.al *= Math.min(1, e * 2); } },
  stretch: { name: 'Rozciągnięcie', fn: (p, s) => { const e = ease.out(p); s.s *= lerp(0.6, 1, e); s.dx += lerp(-0.5, 0, e); s.fl *= lerp(1.8, 1, e); s.al *= Math.min(1, p * 4); } },
  slowfade: { name: 'Wolne zanikanie', fn: (p, s) => { s.al *= p * p; } },
  letters: { name: 'Litery (pop)', textOnly: true, fn: () => {} },
  words: { name: 'Słowa', textOnly: true, fn: () => {} },
  dropletters: { name: 'Spadające litery', textOnly: true, fn: () => {} },
});
Object.assign(ANIM_LOOP, {
  zoompunch: { name: 'Uderzenie rytmu', fn: (lt, s, a) => { const x = (lt * 2) % 1; s.s *= 1 + 0.16 * a * Math.pow(1 - x, 3); } },
  tilt: { name: 'Przechył', fn: (lt, s, a) => { s.r += Math.sin(lt * 2.2) * 0.06 * a; s.s *= 1.04; } },
  sway: { name: 'Bujanie', fn: (lt, s, a) => { s.dx += Math.sin(lt * 1.8) * 0.03 * a; s.r += Math.sin(lt * 1.8) * 0.03 * a; } },
  squashloop: { name: 'Gumka', fn: (lt, s, a) => { s.s *= 1 + 0.05 * a * Math.sin(lt * 6); s.fl *= 1 - 0.05 * a * Math.sin(lt * 6); } },
  orbit: { name: 'Orbita', fn: (lt, s, a) => { s.dx += Math.cos(lt * 2) * 0.04 * a; s.dy += Math.sin(lt * 2) * 0.04 * a; } },
  shakeheavy: { name: 'Mocne drżenie', fn: (lt, s, a) => { const r = rng(Math.floor(lt * 24) + 8); s.dx += (r() - 0.5) * 0.05 * a; s.dy += (r() - 0.5) * 0.05 * a; s.r += (r() - 0.5) * 0.06 * a; } },
  flipx: { name: 'Obrót X', fn: (lt, s, a) => { s.fl *= Math.max(0.05, Math.abs(Math.cos(lt * 1.5 * a))); } },
  drift: { name: 'Dryf', fn: (lt, s, a, d) => { s.s *= 1.12; s.dx += Math.sin(lt * 0.7) * 0.03 * a; s.dy += Math.cos(lt * 0.5) * 0.02 * a; } },
  spinback: { name: 'Wahadło obrotu', fn: (lt, s, a) => { s.r += Math.sin(lt * 1.5) * 0.35 * a; } },
  glowpulse: { name: 'Migot światła', fn: (lt, s, a) => { s.al *= 1 - 0.35 * a * (0.5 + 0.5 * Math.sin(lt * 7)); } },
  dolly: { name: 'Dolly zoom', fn: (lt, s, a, d) => { s.s *= 1 + 0.35 * a * (lt / d); s.bl += 0; } },
  lift: { name: 'Uniesienie', fn: (lt, s, a, d) => { s.dy += -0.06 * a * (lt / d); s.s *= 1 + 0.06 * a * (lt / d); } },
  wave: { name: 'Fala liter', textOnly: true, fn: () => {} },
  rainbow: { name: 'Tęczowy tekst', textOnly: true, fn: () => {} },
});

/* ============================================================
   PRZEJŚCIA — więcej
   ============================================================ */
function reveal(x, A, B, pathFn) { x.drawImage(A, 0, 0); x.save(); x.beginPath(); pathFn(x); x.clip(); x.drawImage(B, 0, 0); x.restore(); }
function heartPath(x, cx, cy, s) {
  x.moveTo(cx, cy + s * 0.9); x.bezierCurveTo(cx - s * 1.3, cy + s * 0.1, cx - s * 0.9, cy - s * 0.9, cx, cy - s * 0.35);
  x.bezierCurveTo(cx + s * 0.9, cy - s * 0.9, cx + s * 1.3, cy + s * 0.1, cx, cy + s * 0.9); x.closePath();
}
defT('zoomblur', 'Zoom + rozmycie', 'Popularne', (x, A, B, p, W, H) => {
  const e = eio(p), n = 7;
  x.drawImage(B, 0, 0);
  for (let k = n; k >= 0; k--) { x.save(); x.globalAlpha = (1 - e) * (k === 0 ? 1 : 0.4 / n * 2); x.translate(W / 2, H / 2); const s = 1 + e * 0.5 + k * 0.03 * e; x.scale(s, s); x.drawImage(A, -W / 2, -H / 2); x.restore(); }
});
defT('filmburn', 'Przepalenie taśmy', 'Popularne', (x, A, B, p, W, H) => {
  x.drawImage(A, 0, 0); x.globalAlpha = eio(p); x.drawImage(B, 0, 0); x.globalAlpha = 1;
  const k = Math.sin(p * Math.PI), g = x.createRadialGradient(W * (0.3 + 0.4 * p), H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
  g.addColorStop(0, `rgba(255,245,200,${k})`); g.addColorStop(0.4, `rgba(255,120,30,${k * 0.8})`); g.addColorStop(1, 'rgba(140,20,0,0)');
  x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
});
defT('leak', 'Wyciek światła', 'Popularne', (x, A, B, p, W, H) => {
  x.drawImage(A, 0, 0); x.globalAlpha = eio(p); x.drawImage(B, 0, 0); x.globalAlpha = 1;
  const k = Math.sin(p * Math.PI);
  x.save(); x.globalCompositeOperation = 'screen';
  [['255,150,60', 0.2], ['255,60,120', 0.55], ['255,220,120', 0.85]].forEach(([c, px], i) => { const cx = W * (px + (p - 0.5) * 0.4), g = x.createRadialGradient(cx, H * (0.3 + i * 0.2), 0, cx, H * (0.3 + i * 0.2), Math.max(W, H) * 0.5); g.addColorStop(0, `rgba(${c},${0.85 * k})`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(0, 0, W, H); });
  x.restore();
});
defT('flashcut', 'Błysk (cięcie)', 'Popularne', (x, A, B, p, W, H) => {
  x.drawImage(p < 0.5 ? A : B, 0, 0); x.fillStyle = '#fff'; x.globalAlpha = Math.max(0, 1 - Math.abs(p - 0.5) * 5); x.fillRect(0, 0, W, H); x.globalAlpha = 1;
});
defT('invert', 'Negatyw', 'Popularne', (x, A, B, p, W, H) => {
  x.drawImage(p < 0.5 ? A : B, 0, 0);
  if (HAS_FILTER) { const k = Math.max(0, 1 - Math.abs(p - 0.5) * 2.4); x.save(); x.globalAlpha = k; x.filter = 'invert(1)'; x.drawImage(p < 0.5 ? A : B, 0, 0); x.restore(); }
});
defT('bounce', 'Odbicie', 'Popularne', (x, A, B, p, W, H) => {
  x.drawImage(A, 0, 0); const s = Math.max(0.001, ease.outBounce(clamp(p, 0, 1)));
  x.save(); x.translate(W / 2, H / 2); x.scale(s, s); x.drawImage(B, -W / 2, -H / 2); x.restore();
});
defT('lens', 'Soczewka', 'Popularne', (x, A, B, p, W, H) => {
  const e = eio(p), k = Math.sin(p * Math.PI);
  x.save(); x.translate(W / 2, H / 2); const s = 1 + e * 0.35; x.scale(s, s); x.drawImage(A, -W / 2, -H / 2); x.restore();
  x.save(); x.globalAlpha = e; x.translate(W / 2, H / 2); const s2 = 1.35 - e * 0.35; x.scale(s2, s2); x.drawImage(B, -W / 2, -H / 2); x.restore();
  rgbSplit(x.canvas, Math.round(W * 0.02 * k), 0);
  x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = `rgba(255,255,255,${0.35 * k})`; x.fillRect(0, 0, W, H); x.restore();
});
defT('colorflash', 'Kolorowy błysk', 'Popularne', (x, A, B, p, W, H) => {
  x.drawImage(p < 0.5 ? A : B, 0, 0); const k = Math.max(0, 1 - Math.abs(p - 0.5) * 2);
  x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = k; const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ff2d95'); g.addColorStop(1, '#00e5ff'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
});
defT('stack', 'Stos', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.save(); x.translate(W / 2, H / 2); const s = 1 - e * 0.12; x.scale(s, s); x.globalAlpha = 1 - e * 0.5; x.drawImage(A, -W / 2, -H / 2); x.restore();
  x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = W * 0.04; x.drawImage(B, 0, H * (1 - e)); x.restore();
});
defT('door', 'Drzwi', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(B, 0, 0);
  x.drawImage(A, 0, 0, W / 2, H, -W / 2 * e, 0, W / 2, H); x.drawImage(A, W / 2, 0, W / 2, H, W / 2 + W / 2 * e, 0, W / 2, H);
});
defT('curtain', 'Kurtyna', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(B, 0, 0);
  x.drawImage(A, 0, 0, W, H / 2, 0, -H / 2 * e, W, H / 2); x.drawImage(A, 0, H / 2, W, H / 2, 0, H / 2 + H / 2 * e, W, H / 2);
});
defT('cube', 'Kostka', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.save(); x.translate(0, 0); x.scale(Math.max(0.001, 1 - e), 1); x.drawImage(A, 0, 0); x.restore();
  x.save(); x.translate(W * (1 - e), 0); x.scale(Math.max(0.001, e), 1); x.drawImage(B, 0, 0); x.restore();
});
defT('rotcover', 'Obrotowe przykrycie', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(A, 0, 0);
  x.save(); x.translate(W, H); x.rotate((1 - e) * 0.9); x.translate(-W, -H); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = W * 0.03; x.globalAlpha = Math.min(1, e * 3); x.drawImage(B, 0, 0); x.restore();
});
defT('whipV', 'Smagnięcie ↕', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p); if (HAS_FILTER) x.filter = `blur(${(H * 0.035 * Math.sin(p * Math.PI)).toFixed(2)}px)`;
  x.drawImage(A, 0, -H * e * 1.1); x.drawImage(B, 0, H * (1 - e) * 1.1); x.filter = 'none';
});
defT('shakepush', 'Wstrząs + przesunięcie', 'Przesuwanie', (x, A, B, p, W, H) => {
  const e = eio(p), r = rng(Math.floor(p * 28)), k = Math.sin(p * Math.PI);
  x.save(); x.translate((r() - 0.5) * W * 0.03 * k, (r() - 0.5) * H * 0.03 * k); x.drawImage(A, -W * e, 0); x.drawImage(B, W * (1 - e), 0); x.restore();
});
defT('clock', 'Zegar', 'Odsłanianie', (x, A, B, p, W, H) => {
  const e = eio(p); reveal(x, A, B, (c) => { c.moveTo(W / 2, H / 2); c.arc(W / 2, H / 2, Math.hypot(W, H), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e); c.closePath(); });
});
defT('diamond', 'Romb', 'Odsłanianie', (x, A, B, p, W, H) => {
  const r = eio(p) * (W + H) * 0.55; reveal(x, A, B, (c) => { c.moveTo(W / 2, H / 2 - r); c.lineTo(W / 2 + r, H / 2); c.lineTo(W / 2, H / 2 + r); c.lineTo(W / 2 - r, H / 2); c.closePath(); });
});
defT('heart', 'Serce', 'Odsłanianie', (x, A, B, p, W, H) => { reveal(x, A, B, (c) => heartPath(c, W / 2, H / 2, eio(p) * Math.hypot(W, H) * 0.55)); });
defT('barn', 'Stodoła', 'Odsłanianie', (x, A, B, p, W, H) => { const e = eio(p); reveal(x, A, B, (c) => c.rect(W / 2 * (1 - e), 0, W * e, H)); });
defT('slit', 'Szczelina', 'Odsłanianie', (x, A, B, p, W, H) => { const e = eio(p); reveal(x, A, B, (c) => c.rect(0, H / 2 * (1 - e), W, H * e)); });
defT('zigzag', 'Zygzak', 'Odsłanianie', (x, A, B, p, W, H) => {
  const e = eio(p), n = 12, zz = W * 0.06; reveal(x, A, B, (c) => { c.moveTo(0, 0); for (let k = 0; k <= n; k++) c.lineTo(e * (W + zz * 2) - zz + (k % 2 ? zz : 0), k * H / n); c.lineTo(0, H); c.closePath(); });
});
defT('vstripes', 'Pionowe paski', 'Odsłanianie', (x, A, B, p, W, H) => {
  const e = eio(p), n = 10; reveal(x, A, B, (c) => { for (let i = 0; i < n; i++) c.rect(i * W / n, 0, W / n + 0.5, H * clamp(e * 1.6 - i / n * 0.6, 0, 1)); });
});
defT('pixeldissolve', 'Rozsypanie pikseli', 'Odsłanianie', (x, A, B, p, W, H) => {
  const cols = 28, rows = Math.max(8, Math.round(cols * H / W)), cw = W / cols, ch = H / rows, r = rng(99), e = eio(p);
  reveal(x, A, B, (c) => { for (let i = 0; i < cols * rows; i++) if (r() < e) c.rect((i % cols) * cw, Math.floor(i / cols) * ch, cw + 0.5, ch + 0.5); });
});
defT('checker', 'Szachownica', 'Odsłanianie', (x, A, B, p, W, H) => {
  const e = eio(p), cols = 8, rows = Math.max(4, Math.round(cols * H / W)), cw = W / cols, ch = H / rows;
  reveal(x, A, B, (c) => { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const ph = (i + j) % 2 ? clamp(e * 2 - 1, 0, 1) : clamp(e * 2, 0, 1); const w = cw * ph, h2 = ch * ph; c.rect(i * cw + (cw - w) / 2, j * ch + (ch - h2) / 2, w, h2); } });
});
defT('glitch2', 'Glitch RGB+', 'Efekty', (x, A, B, p, W, H) => {
  const r = rng(Math.floor(p * 20) * 71 + 1), k = Math.sin(p * Math.PI);
  x.drawImage(p < 0.5 ? A : B, 0, 0);
  for (let i = 0; i < 10; i++) { const bw = (0.1 + r() * 0.4) * W, bh = (0.03 + r() * 0.12) * H, bx = r() * (W - bw), by = r() * (H - bh); x.drawImage(r() < p ? B : A, bx, by, bw, bh, bx + (r() - 0.5) * W * 0.2 * k, by, bw, bh); }
  chromaAb(x.canvas, 0.02 * k);
});
defT('static', 'Szum TV', 'Efekty', (x, A, B, p, W, H) => {
  x.drawImage(p < 0.5 ? A : B, 0, 0); const k = Math.sin(p * Math.PI); noiseOverlay(x.canvas, 0.95 * k, p * 5, 'source-over');
});
defT('vhsrewind', 'Przewijanie VHS', 'Efekty', (x, A, B, p, W, H) => {
  const k = Math.sin(p * Math.PI), src = p < 0.5 ? A : B, sh = Math.max(2, Math.round(H / 90)), r = rng(Math.floor(p * 30) + 2);
  for (let y = 0; y < H; y += sh) x.drawImage(src, 0, y, W, sh, (r() - 0.5) * W * 0.12 * k + Math.sin(y * 0.1 + p * 40) * W * 0.02 * k, y, W, sh);
  rgbSplit(x.canvas, Math.round(W * 0.012 * k), 0); noiseOverlay(x.canvas, 0.4 * k, p * 8);
});
defT('ripple', 'Fala', 'Efekty', (x, A, B, p, W, H) => {
  const k = Math.sin(p * Math.PI), src = p < 0.5 ? A : B, sh = 3;
  for (let y = 0; y < H; y += sh) x.drawImage(src, 0, y, W, sh, Math.sin(y / H * Math.PI * 8 + p * 20) * W * 0.06 * k, y, W, sh);
});
defT('shatter', 'Rozbicie', 'Efekty', (x, A, B, p, W, H) => {
  const cols = 8, rows = 5, cw = W / cols, ch = H / rows, r = rng(13), e = ease.in(p);
  x.drawImage(B, 0, 0);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const vx = (r() - 0.5) * W * 0.5, vy = r() * H * 0.9 + H * 0.1, rot = (r() - 0.5) * 2.4;
    x.save(); x.globalAlpha = Math.max(0, 1 - e * 1.1); x.translate(i * cw + cw / 2 + vx * e, j * ch + ch / 2 + vy * e * e); x.rotate(rot * e); x.drawImage(A, i * cw, j * ch, cw, ch, -cw / 2, -ch / 2, cw, ch); x.restore();
  }
});
defT('blink', 'Mrugnięcie', 'Efekty', (x, A, B, p, W, H) => {
  const q = p < 0.5 ? p * 2 : (1 - p) * 2; x.drawImage(p < 0.5 ? A : B, 0, 0); x.fillStyle = '#000'; const h2 = H / 2 * ease.in(q); x.fillRect(0, 0, W, h2); x.fillRect(0, H - h2, W, h2);
});
defT('pageturn', 'Odwrócenie kartki', 'Efekty', (x, A, B, p, W, H) => {
  const e = eio(p); x.drawImage(B, 0, 0);
  x.save(); x.scale(Math.max(0.001, 1 - e), 1); x.drawImage(A, 0, 0); x.restore();
  const g = x.createLinearGradient(W * (1 - e), 0, W * (1 - e) + W * 0.12, 0); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(W * (1 - e), 0, W * 0.12, H);
});
defT('vflip', 'Przewrót pionowy', 'Efekty', (x, A, B, p, W, H) => {
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H); const cs = Math.abs(Math.cos(p * Math.PI));
  x.save(); x.translate(W / 2, H / 2); x.scale(1, Math.max(0.002, cs)); x.drawImage(p < 0.5 ? A : B, -W / 2, -H / 2); x.restore();
});
defT('flicker', 'Migotanie', 'Efekty', (x, A, B, p, W, H) => {
  const f = Math.floor(p * 14); x.drawImage(f % 2 === 0 && p < 0.85 ? A : B, 0, 0); if (f % 3 === 0 && p > 0.1 && p < 0.9) { x.fillStyle = '#fff'; x.globalAlpha = 0.25; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
});
defT('hueflash', 'Tęczowy błysk', 'Efekty', (x, A, B, p, W, H) => {
  if (HAS_FILTER) x.filter = `hue-rotate(${Math.round(Math.sin(p * Math.PI) * 180)}deg) saturate(${1 + Math.sin(p * Math.PI)})`;
  x.drawImage(A, 0, 0); x.globalAlpha = eio(p); x.drawImage(B, 0, 0); x.globalAlpha = 1; x.filter = 'none';
});
TRANS_CATS.splice(0, TRANS_CATS.length, 'Popularne', 'Przesuwanie', 'Odsłanianie', 'Efekty');
