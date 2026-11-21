'use strict';
/* ============================================================
   Kadr Studio — nakładki animowane, kształty, krzywe prędkości, maski, tryby mieszania
   ============================================================ */
const BLENDS = [['normal', 'Normalny'], ['screen', 'Rozjaśnij (screen)'], ['add', 'Dodaj'], ['multiply', 'Pomnóż'], ['overlay', 'Nakładka'], ['soft-light', 'Miękkie światło'], ['hard-light', 'Twarde światło'],
  ['color-dodge', 'Rozjaśnianie koloru'], ['lighten', 'Jaśniejszy'], ['darken', 'Ciemniejszy'], ['difference', 'Różnica'], ['exclusion', 'Wykluczenie'], ['hue', 'Odcień'], ['color', 'Kolor'], ['luminosity', 'Jasność']];
const blendOp = (b) => (b === 'add' ? 'lighter' : b || 'source-over');

/* ---------- KRZYWE PRĘDKOŚCI ---------- */
const CURVES = {
  none: { name: 'Brak', pts: [[0, 1], [1, 1]] },
  montage: { name: 'Montaż', pts: [[0, 1], [0.2, 0.25], [0.45, 0.25], [0.55, 2.8], [0.75, 1], [1, 1]] },
  hero: { name: 'Bohater', pts: [[0, 1], [0.15, 1], [0.3, 0.22], [0.7, 0.22], [0.85, 1], [1, 1.6]] },
  bullet: { name: 'Bullet time', pts: [[0, 2], [0.12, 0.1], [0.88, 0.1], [1, 2]] },
  jumpcut: { name: 'Jump cut', pts: [[0, 0.3], [0.2, 0.3], [0.3, 2.2], [0.6, 2.2], [0.7, 0.5], [1, 1]] },
  flashin: { name: 'Flash in', pts: [[0, 3.5], [0.15, 1], [1, 1]] },
  flashout: { name: 'Flash out', pts: [[0, 1], [0.85, 1], [1, 3.5]] },
  rampup: { name: 'Przyspieszanie', pts: [[0, 0.4], [1, 2.4]] },
  rampdown: { name: 'Zwalnianie', pts: [[0, 2.4], [1, 0.4]] },
  pulse: { name: 'Pulsowanie', pts: [[0, 1], [0.12, 2.6], [0.25, 0.35], [0.4, 2.6], [0.55, 0.35], [0.7, 2.6], [0.85, 0.35], [1, 1]] },
  beat: { name: 'Beat drop', pts: [[0, 0.5], [0.5, 0.5], [0.52, 3], [0.7, 1], [1, 1]] },
  slowmid: { name: 'Zwolnienie w środku', pts: [[0, 1.3], [0.35, 0.35], [0.65, 0.35], [1, 1.3]] },
};
const _curveCache = {};
function curveFns(id) {
  const def = CURVES[id]; if (!def || id === 'none') return null;
  if (_curveCache[id]) return _curveCache[id];
  const N = 512, pts = def.pts, m = (u) => {
    for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const [u0, v0] = pts[i - 1], [u1, v1] = pts[i], k = (u - u0) / Math.max(1e-6, u1 - u0); const e = k * k * (3 - 2 * k); return lerp(v0, v1, 0.6 * e + 0.4 * k); }
    return pts[pts.length - 1][1];
  };
  const cum = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) cum[i] = cum[i - 1] + (m((i - 0.5) / N)) / N;
  const total = cum[N], m0 = m(0) / total, m1 = m(1) / total;
  const f = {
    m: (u) => (m(clamp(u, 0, 1)) / total),
    M: (u) => {
      if (u <= 0) return u * m0; if (u >= 1) return 1 + (u - 1) * m1;
      const x = u * N, i = Math.floor(x); return lerp(cum[i], cum[Math.min(N, i + 1)], x - i) / total;
    },
  };
  return (_curveCache[id] = f);
}
function speedAt(c, t) {
  const f = c.curve && c.curve !== 'none' ? curveFns(c.curve) : null;
  return f ? c.speed * f.m((t - c.start) / c.dur) : c.speed;
}

/* ---------- MASKI ---------- */
const MASKS = { none: 'Brak', circle: 'Koło', rect: 'Prostokąt', rounded: 'Zaokrąglony', heart: 'Serce', star: 'Gwiazda', diamond: 'Romb', linear: 'Liniowa', mirror: 'Pasek', cine: 'Kinowy pas' };
function maskPath(x, id, s) {
  switch (id) {
    case 'circle': x.arc(0, 0, s, 0, Math.PI * 2); break;
    case 'rect': x.rect(-s, -s, s * 2, s * 2); break;
    case 'rounded': if (x.roundRect) x.roundRect(-s, -s, s * 2, s * 2, s * 0.35); else x.rect(-s, -s, s * 2, s * 2); break;
    case 'heart': heartPath(x, 0, 0, s * 0.85); break;
    case 'star': for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.45 : s * 1.05, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); break;
    case 'diamond': x.moveTo(0, -s * 1.2); x.lineTo(s * 1.2, 0); x.lineTo(0, s * 1.2); x.lineTo(-s * 1.2, 0); x.closePath(); break;
    case 'linear': x.rect(-s * 6, -s * 6, s * 6, s * 12); break;
    case 'mirror': x.rect(-s * 6, -s * 0.6, s * 12, s * 1.2); break;
    case 'cine': x.rect(-s * 6, -s * 0.5, s * 12, s); break;
    default: x.rect(-s * 6, -s * 6, s * 12, s * 12);
  }
}

/* ---------- KSZTAŁTY (naklejki wektorowe) ---------- */
const SHAPE_CATS = ['Strzałki', 'Kształty', 'Ramki i celowniki', 'Kreski'];
const SHAPES = {};
function defShape(id, name, cat, draw) { SHAPES[id] = { id, name, cat, draw }; }
const polyStar = (x, n, ro, ri) => { for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / n; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); };
defShape('arrow', 'Strzałka', 'Strzałki', (x, s) => { x.beginPath(); x.moveTo(-s, -s * 0.2); x.lineTo(s * 0.2, -s * 0.2); x.lineTo(s * 0.2, -s * 0.6); x.lineTo(s, 0); x.lineTo(s * 0.2, s * 0.6); x.lineTo(s * 0.2, s * 0.2); x.lineTo(-s, s * 0.2); x.closePath(); x.fill(); });
defShape('arrowthin', 'Strzałka cienka', 'Strzałki', (x, s, st) => { x.lineWidth = s * 0.14; x.beginPath(); x.moveTo(-s, 0); x.lineTo(s, 0); x.moveTo(s * 0.45, -s * 0.45); x.lineTo(s, 0); x.lineTo(s * 0.45, s * 0.45); x.stroke(); });
defShape('arrowcurve', 'Strzałka łukiem', 'Strzałki', (x, s) => { x.lineWidth = s * 0.14; x.beginPath(); x.moveTo(-s, s * 0.4); x.quadraticCurveTo(-s * 0.2, -s * 0.9, s * 0.8, -s * 0.1); x.stroke(); x.beginPath(); x.moveTo(s * 0.9, -s * 0.05); x.lineTo(s * 0.35, -s * 0.15); x.lineTo(s * 0.7, s * 0.4); x.closePath(); x.fill(); });
defShape('arrowdbl', 'Strzałka podwójna', 'Strzałki', (x, s) => { x.lineWidth = s * 0.14; x.beginPath(); x.moveTo(-s * 0.9, 0); x.lineTo(s * 0.9, 0); x.moveTo(s * 0.5, -s * 0.4); x.lineTo(s * 0.95, 0); x.lineTo(s * 0.5, s * 0.4); x.moveTo(-s * 0.5, -s * 0.4); x.lineTo(-s * 0.95, 0); x.lineTo(-s * 0.5, s * 0.4); x.stroke(); });
defShape('chevron', 'Szewron', 'Strzałki', (x, s) => { x.lineWidth = s * 0.2; x.beginPath(); x.moveTo(-s * 0.4, -s * 0.7); x.lineTo(s * 0.4, 0); x.lineTo(-s * 0.4, s * 0.7); x.stroke(); });
defShape('chevrons', 'Szewrony', 'Strzałki', (x, s) => { x.lineWidth = s * 0.16; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(k * s * 0.5 - s * 0.25, -s * 0.55); x.lineTo(k * s * 0.5 + s * 0.2, 0); x.lineTo(k * s * 0.5 - s * 0.25, s * 0.55); x.stroke(); } });
defShape('triplay', 'Odtwarzaj', 'Strzałki', (x, s) => { x.beginPath(); x.moveTo(-s * 0.6, -s * 0.8); x.lineTo(s * 0.8, 0); x.lineTo(-s * 0.6, s * 0.8); x.closePath(); x.fill(); });
defShape('circle', 'Koło', 'Kształty', (x, s) => { x.beginPath(); x.arc(0, 0, s, 0, 7); x.fill(); });
defShape('ring', 'Pierścień', 'Kształty', (x, s) => { x.lineWidth = s * 0.18; x.beginPath(); x.arc(0, 0, s * 0.9, 0, 7); x.stroke(); });
defShape('rect', 'Prostokąt', 'Kształty', (x, s) => { x.beginPath(); if (x.roundRect) x.roundRect(-s, -s * 0.7, s * 2, s * 1.4, s * 0.12); else x.rect(-s, -s * 0.7, s * 2, s * 1.4); x.fill(); });
defShape('triangle', 'Trójkąt', 'Kształty', (x, s) => { x.beginPath(); x.moveTo(0, -s); x.lineTo(s * 0.95, s * 0.8); x.lineTo(-s * 0.95, s * 0.8); x.closePath(); x.fill(); });
defShape('diamond', 'Romb', 'Kształty', (x, s) => { x.beginPath(); x.moveTo(0, -s); x.lineTo(s * 0.75, 0); x.lineTo(0, s); x.lineTo(-s * 0.75, 0); x.closePath(); x.fill(); });
defShape('star5', 'Gwiazda', 'Kształty', (x, s) => { x.beginPath(); polyStar(x, 5, s, s * 0.42); x.fill(); });
defShape('star4', 'Błysk 4', 'Kształty', (x, s) => { x.beginPath(); polyStar(x, 4, s, s * 0.22); x.fill(); });
defShape('burst', 'Wybuch', 'Kształty', (x, s) => { x.beginPath(); polyStar(x, 14, s, s * 0.7); x.fill(); });
defShape('hexagon', 'Sześciokąt', 'Kształty', (x, s) => { x.beginPath(); for (let i = 0; i < 6; i++) x.lineTo(Math.cos(i * Math.PI / 3) * s, Math.sin(i * Math.PI / 3) * s); x.closePath(); x.fill(); });
defShape('heart', 'Serce', 'Kształty', (x, s) => { x.beginPath(); heartPath(x, 0, 0, s * 0.85); x.fill(); });
defShape('bolt', 'Piorun', 'Kształty', (x, s) => { x.beginPath(); x.moveTo(s * 0.2, -s); x.lineTo(-s * 0.6, s * 0.1); x.lineTo(-s * 0.05, s * 0.1); x.lineTo(-s * 0.3, s); x.lineTo(s * 0.65, -s * 0.2); x.lineTo(s * 0.05, -s * 0.2); x.closePath(); x.fill(); });
defShape('cross', 'Krzyż', 'Kształty', (x, s) => { x.lineWidth = s * 0.3; x.beginPath(); x.moveTo(-s * 0.8, -s * 0.8); x.lineTo(s * 0.8, s * 0.8); x.moveTo(s * 0.8, -s * 0.8); x.lineTo(-s * 0.8, s * 0.8); x.stroke(); });
defShape('plus', 'Plus', 'Kształty', (x, s) => { x.lineWidth = s * 0.3; x.beginPath(); x.moveTo(-s * 0.85, 0); x.lineTo(s * 0.85, 0); x.moveTo(0, -s * 0.85); x.lineTo(0, s * 0.85); x.stroke(); });
defShape('check', 'Ptaszek', 'Kształty', (x, s) => { x.lineWidth = s * 0.26; x.beginPath(); x.moveTo(-s * 0.8, 0); x.lineTo(-s * 0.2, s * 0.6); x.lineTo(s * 0.85, -s * 0.6); x.stroke(); });
defShape('drop', 'Kropla', 'Kształty', (x, s) => { x.beginPath(); x.moveTo(0, -s); x.bezierCurveTo(s * 0.9, -s * 0.1, s * 0.9, s * 0.95, 0, s * 0.95); x.bezierCurveTo(-s * 0.9, s * 0.95, -s * 0.9, -s * 0.1, 0, -s); x.fill(); });
defShape('moon', 'Księżyc', 'Kształty', (x, s) => { x.beginPath(); x.arc(0, 0, s, Math.PI * 0.2, Math.PI * 1.8); x.arc(s * 0.35, 0, s * 0.8, Math.PI * 1.65, Math.PI * 0.35, true); x.closePath(); x.fill(); });
defShape('bubble', 'Dymek', 'Kształty', (x, s) => { x.beginPath(); if (x.roundRect) x.roundRect(-s, -s * 0.7, s * 2, s * 1.2, s * 0.3); else x.rect(-s, -s * 0.7, s * 2, s * 1.2); x.moveTo(-s * 0.4, s * 0.5); x.lineTo(-s * 0.6, s * 0.95); x.lineTo(0, s * 0.5); x.fill(); });
defShape('flame', 'Płomień', 'Kształty', (x, s) => { x.beginPath(); x.moveTo(0, -s); x.bezierCurveTo(s * 0.2, -s * 0.5, s * 0.85, -s * 0.2, s * 0.7, s * 0.4); x.bezierCurveTo(s * 0.6, s * 0.95, -s * 0.6, s * 0.95, -s * 0.7, s * 0.4); x.bezierCurveTo(-s * 0.8, -s * 0.1, -s * 0.2, -s * 0.3, 0, -s); x.fill(); });
defShape('crown', 'Korona', 'Kształty', (x, s) => { x.beginPath(); x.moveTo(-s, s * 0.6); x.lineTo(-s, -s * 0.5); x.lineTo(-s * 0.45, s * 0.05); x.lineTo(0, -s * 0.8); x.lineTo(s * 0.45, s * 0.05); x.lineTo(s, -s * 0.5); x.lineTo(s, s * 0.6); x.closePath(); x.fill(); });
defShape('recdot', 'REC', 'Kształty', (x, s) => { x.beginPath(); x.arc(0, 0, s * 0.8, 0, 7); x.fill(); });
defShape('frame', 'Ramka', 'Ramki i celowniki', (x, s) => { x.lineWidth = s * 0.12; x.strokeRect(-s, -s * 0.7, s * 2, s * 1.4); });
defShape('brackets', 'Narożniki', 'Ramki i celowniki', (x, s) => { x.lineWidth = s * 0.12; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a * s, b * s * 0.6); x.lineTo(a * s, b * s * 0.95); x.lineTo(a * s * 0.6, b * s * 0.95); x.stroke(); }); x.beginPath(); });
defShape('viewfinder', 'Wizjer', 'Ramki i celowniki', (x, s) => { x.lineWidth = s * 0.09; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a * s, b * s * 0.45); x.lineTo(a * s, b * s * 0.85); x.lineTo(a * s * 0.6, b * s * 0.85); x.stroke(); }); x.beginPath(); x.moveTo(-s * 0.12, 0); x.lineTo(s * 0.12, 0); x.moveTo(0, -s * 0.12); x.lineTo(0, s * 0.12); x.stroke(); });
defShape('crosshair', 'Celownik', 'Ramki i celowniki', (x, s) => { x.lineWidth = s * 0.07; x.beginPath(); x.arc(0, 0, s * 0.6, 0, 7); x.moveTo(-s, 0); x.lineTo(-s * 0.3, 0); x.moveTo(s * 0.3, 0); x.lineTo(s, 0); x.moveTo(0, -s); x.lineTo(0, -s * 0.3); x.moveTo(0, s * 0.3); x.lineTo(0, s); x.stroke(); });
defShape('circledash', 'Okrąg przerywany', 'Ramki i celowniki', (x, s) => { x.lineWidth = s * 0.1; x.setLineDash([s * 0.25, s * 0.18]); x.beginPath(); x.arc(0, 0, s * 0.9, 0, 7); x.stroke(); x.setLineDash([]); });
defShape('target', 'Tarcza', 'Ramki i celowniki', (x, s) => { x.lineWidth = s * 0.1; [0.9, 0.55, 0.2].forEach((r) => { x.beginPath(); x.arc(0, 0, s * r, 0, 7); x.stroke(); }); });
defShape('underline', 'Podkreślenie', 'Kreski', (x, s) => { x.lineWidth = s * 0.12; x.beginPath(); x.moveTo(-s, s * 0.1); x.quadraticCurveTo(-s * 0.4, -s * 0.15, 0, s * 0.05); x.quadraticCurveTo(s * 0.5, s * 0.2, s, -s * 0.05); x.stroke(); });
defShape('scribble', 'Zakreślenie', 'Kreski', (x, s) => { x.lineWidth = s * 0.07; x.beginPath(); x.moveTo(-s, s * 0.1); x.bezierCurveTo(-s, -s * 0.8, s, -s * 0.9, s * 0.95, 0); x.bezierCurveTo(s * 0.9, s * 0.8, -s * 0.9, s * 0.8, -s * 0.8, -s * 0.2); x.stroke(); });
defShape('wave', 'Fala', 'Kreski', (x, s) => { x.lineWidth = s * 0.1; x.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40; x.lineTo(-s + u * s * 2, Math.sin(u * Math.PI * 4) * s * 0.28); } x.stroke(); });
defShape('zigzag', 'Zygzak', 'Kreski', (x, s) => { x.lineWidth = s * 0.1; x.beginPath(); for (let i = 0; i <= 8; i++) x.lineTo(-s + i * s / 4, i % 2 ? s * 0.25 : -s * 0.25); x.stroke(); });
defShape('dots', 'Kropki', 'Kreski', (x, s) => { for (let i = -2; i <= 2; i++) { x.beginPath(); x.arc(i * s * 0.4, 0, s * 0.1, 0, 7); x.fill(); } });
defShape('slash', 'Cięcie', 'Kreski', (x, s) => { x.beginPath(); x.moveTo(-s, s * 0.12); x.lineTo(s, -s * 0.12); x.lineTo(s, -s * 0.02); x.lineTo(-s, s * 0.22); x.closePath(); x.fill(); });
function makeShapeSprite(S0, W, H) {
  const fs = Math.max(8, Math.round(S0.size * Math.min(W, H))), n = Math.ceil(fs * 1.3), cv = mkCanvas(n, n), x = cv.getContext('2d'), sh = SHAPES[S0.shape];
  if (!sh) return cv;
  x.translate(n / 2, n / 2); x.fillStyle = S0.color || '#ffffff'; x.strokeStyle = S0.color || '#ffffff'; x.lineCap = 'round'; x.lineJoin = 'round';
  x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = fs * 0.04;
  sh.draw(x, fs / 2, S0);
  return cv;
}

/* ============================================================
   NAKŁADKI ANIMOWANE (bez napisów) – rysowane proceduralnie
   fn(x, W, H, lt, dur, o)   o = {color, amt, speed, seed}
   ============================================================ */
const OVERLAY_CATS = ['Światło', 'Błysk', 'Ruch', 'Cząsteczki', 'Pogoda', 'Glitch', 'Inne'];
const OVERLAYS = {};
function defOv(id, name, cat, d, blend, fn) { OVERLAYS[id] = { id, name, cat, d, blend, fn }; }
const decay = (lt, d, p = 2) => Math.pow(Math.max(0, 1 - lt / d), p);
const rgbaC = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };
function blob(x, cx, cy, r, col, a) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgbaC(col, a)); g.addColorStop(1, rgbaC(col, 0)); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }

defOv('leakWarm', 'Wyciek ciepły', 'Światło', 3, 'screen', (x, W, H, lt, d, o) => { const R = Math.max(W, H), k = lt / d; blob(x, W * (0.1 + 0.5 * k), H * 0.3, R * 0.6, '#ff7a1a', 0.9 * o.amt); blob(x, W * (0.9 - 0.4 * k), H * 0.7, R * 0.5, '#ff2d55', 0.7 * o.amt); blob(x, W * 0.5, H * (0.2 + 0.3 * Math.sin(k * 3)), R * 0.4, '#ffd36b', 0.6 * o.amt); });
defOv('leakCool', 'Wyciek zimny', 'Światło', 3, 'screen', (x, W, H, lt, d, o) => { const R = Math.max(W, H), k = lt / d; blob(x, W * (0.9 - 0.5 * k), H * 0.3, R * 0.6, '#1ea0ff', 0.85 * o.amt); blob(x, W * (0.1 + 0.4 * k), H * 0.75, R * 0.5, '#7b3cff', 0.7 * o.amt); blob(x, W * 0.5, H * (0.8 - 0.3 * Math.sin(k * 3)), R * 0.35, '#34f5e2', 0.5 * o.amt); });
defOv('leakRainbow', 'Wyciek tęczowy', 'Światło', 3, 'screen', (x, W, H, lt, d, o) => { const R = Math.max(W, H), k = lt / d; ['#ff3b3b', '#ffb43b', '#3bff7a', '#3bb4ff', '#b43bff'].forEach((c, i) => blob(x, W * ((i * 0.23 + k * 0.5) % 1.1), H * (0.2 + 0.6 * ((i * 0.37) % 1)), R * 0.35, c, 0.55 * o.amt)); });
defOv('leakSweep', 'Przemiatanie światła', 'Światło', 1.2, 'screen', (x, W, H, lt, d, o) => { const k = lt / d, cx = -W * 0.3 + k * W * 1.6, g = x.createLinearGradient(cx - W * 0.3, 0, cx + W * 0.3, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, rgbaC(o.color, 0.9 * o.amt)); g.addColorStop(1, 'rgba(255,255,255,0)'); x.save(); x.translate(W / 2, H / 2); x.rotate(0.35); x.translate(-W / 2, -H / 2); x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3); x.restore(); });
defOv('edgeGlow', 'Poświata brzegów', 'Światło', 3, 'screen', (x, W, H, lt, d, o) => { const k = 0.6 + 0.4 * Math.sin(lt * 4 * o.speed), g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.55); g.addColorStop(0, rgbaC(o.color, 0)); g.addColorStop(1, rgbaC(o.color, 0.9 * k * o.amt)); x.fillStyle = g; x.fillRect(0, 0, W, H); });
defOv('flare', 'Flara obiektywu', 'Światło', 3, 'screen', (x, W, H, lt, d, o) => { const k = lt / d, px = W * (0.15 + 0.7 * k), py = H * (0.25 + 0.05 * Math.sin(k * 6)), R = Math.max(W, H); blob(x, px, py, R * 0.3, '#fff2c8', o.amt); x.fillStyle = rgbaC('#ffe9b0', 0.8 * o.amt); x.fillRect(0, py - 2, W, 4); [[0.3, 0.05, '#ff7a50'], [0.6, 0.08, '#78c8ff'], [0.85, 0.04, '#ffff9c'], [1.1, 0.1, '#ff64c8']].forEach(([f, r, c]) => blob(x, px + (W / 2 - px) * 2 * f, py + (H / 2 - py) * 2 * f, R * r, c, 0.55 * o.amt)); });
defOv('rays', 'Promienie', 'Światło', 3, 'screen', (x, W, H, lt, d, o) => { const ox = W * 0.8, oy = -H * 0.1, L = Math.hypot(W, H) * 1.3; for (let i = 0; i < 10; i++) { const a = 1.7 + i * 0.13 + Math.sin(lt * 0.6 + i) * 0.04, w = 0.025 + 0.02 * Math.sin(lt + i * 2); x.fillStyle = rgbaC(o.color, 0.2 * o.amt); x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + Math.cos(a - w) * L, oy + Math.sin(a - w) * L); x.lineTo(ox + Math.cos(a + w) * L, oy + Math.sin(a + w) * L); x.closePath(); x.fill(); } });
defOv('flashWhite', 'Błysk biały', 'Błysk', 0.35, 'screen', (x, W, H, lt, d, o) => { x.fillStyle = `rgba(255,255,255,${clamp(decay(lt, d, 2.2) * o.amt, 0, 1)})`; x.fillRect(0, 0, W, H); });
defOv('flashColor', 'Błysk kolorowy', 'Błysk', 0.4, 'screen', (x, W, H, lt, d, o) => { x.fillStyle = rgbaC(o.color, clamp(decay(lt, d, 2) * o.amt, 0, 1)); x.fillRect(0, 0, W, H); });
defOv('doubleFlash', 'Podwójny błysk', 'Błysk', 0.6, 'screen', (x, W, H, lt, d, o) => { const k = lt / d, a = Math.max(decay(k, 0.5, 2.5), k > 0.5 ? decay(k - 0.5, 0.5, 2.5) : 0); x.fillStyle = `rgba(255,255,255,${clamp(a * o.amt, 0, 1)})`; x.fillRect(0, 0, W, H); });
defOv('strobe', 'Stroboskop', 'Błysk', 2, 'screen', (x, W, H, lt, d, o) => { if (Math.floor(lt * 12 * o.speed) % 2 === 0) { x.fillStyle = `rgba(255,255,255,${0.7 * o.amt})`; x.fillRect(0, 0, W, H); } });
defOv('flickerLight', 'Migotanie', 'Błysk', 2, 'screen', (x, W, H, lt, d, o) => { const r = rng(Math.floor(lt * 18 * o.speed) + o.seed); if (r() < 0.5) { x.fillStyle = rgbaC(o.color, r() * 0.6 * o.amt); x.fillRect(0, 0, W, H); } });
defOv('shockwave', 'Fala uderzeniowa', 'Ruch', 0.9, 'screen', (x, W, H, lt, d, o) => {
  const k = lt / d, R = Math.hypot(W, H) * 0.6;
  for (let i = 0; i < 3; i++) { const q = k - i * 0.08; if (q <= 0 || q >= 1) continue; const r = ease.out(q) * R, th = H * (0.03 + 0.08 * (1 - q)), g = x.createRadialGradient(W / 2, H / 2, Math.max(0, r - th), W / 2, H / 2, r + th); g.addColorStop(0, rgbaC(o.color, 0)); g.addColorStop(0.5, rgbaC(o.color, 0.9 * (1 - q) * o.amt)); g.addColorStop(1, rgbaC(o.color, 0)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
});
defOv('pulseRing', 'Pulsujące okręgi', 'Ruch', 3, 'screen', (x, W, H, lt, d, o) => { for (let i = 0; i < 4; i++) { const q = ((lt * 0.5 * o.speed) + i / 4) % 1, r = q * Math.hypot(W, H) * 0.5; x.strokeStyle = rgbaC(o.color, (1 - q) * 0.7 * o.amt); x.lineWidth = H * 0.012; x.beginPath(); x.arc(W / 2, H / 2, r, 0, 7); x.stroke(); } });
defOv('speedRadial', 'Linie prędkości', 'Ruch', 2, 'screen', (x, W, H, lt, d, o) => {
  const r = rng(Math.floor(lt * 18 * o.speed) + o.seed), n = 90, R = Math.hypot(W, H);
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, r0 = Math.min(W, H) * (0.22 + r() * 0.3), w = 0.004 + r() * 0.012; x.fillStyle = rgbaC(o.color, (0.35 + r() * 0.6) * o.amt); x.beginPath(); x.moveTo(W / 2 + Math.cos(a - w) * r0, H / 2 + Math.sin(a - w) * r0); x.lineTo(W / 2 + Math.cos(a) * R, H / 2 + Math.sin(a) * R); x.lineTo(W / 2 + Math.cos(a + w) * r0, H / 2 + Math.sin(a + w) * r0); x.closePath(); x.fill(); }
});
defOv('speedH', 'Smugi poziome', 'Ruch', 2, 'screen', (x, W, H, lt, d, o) => { const r = rng(o.seed + 3); for (let i = 0; i < 28; i++) { const y = r() * H, len = (0.15 + r() * 0.5) * W, sp = (0.8 + r() * 1.6) * o.speed, px = (((lt * sp + r()) % 1.4) - 0.2) * W * 1.4 - len / 2; const g = x.createLinearGradient(px, 0, px + len, 0); g.addColorStop(0, rgbaC(o.color, 0)); g.addColorStop(1, rgbaC(o.color, 0.75 * o.amt)); x.fillStyle = g; x.fillRect(px, y, len, Math.max(1.5, H * 0.003)); } });
defOv('embers', 'Żar', 'Cząsteczki', 4, 'screen', (x, W, H, lt, d, o) => { const r = rng(o.seed + 7); for (let i = 0; i < 70; i++) { const bx = r() * W, sp = (0.08 + r() * 0.22) * o.speed, ph = r(), y = H * (1.05 - (((lt * sp) + ph) % 1.1)), px = bx + Math.sin(lt * 2 + i) * W * 0.02, sz = H * (0.003 + r() * 0.007), fl = 0.5 + 0.5 * Math.sin(lt * 9 + i * 3); blob(x, px, y, sz * 5, i % 3 ? '#ff8a1a' : '#ffcf5a', 0.85 * fl * o.amt); } });
defOv('glitter', 'Brokat', 'Cząsteczki', 4, 'screen', (x, W, H, lt, d, o) => { const r = rng(o.seed + 11); for (let i = 0; i < 34; i++) { const bx = r() * W, by = r() * H, sz = (0.008 + r() * 0.025) * H, tw = Math.max(0, Math.sin(lt * (2 + r() * 5) * o.speed + r() * 6)); if (tw > 0.05) { x.save(); x.fillStyle = o.color; star4(x, bx, by, sz * (0.5 + tw), tw * o.amt); x.restore(); } } });
defOv('dustFloat', 'Pył w świetle', 'Cząsteczki', 5, 'screen', (x, W, H, lt, d, o) => { const r = rng(o.seed + 13); for (let i = 0; i < 80; i++) { const bx = (r() * W + Math.sin(lt * 0.4 + i) * W * 0.03 + W) % W, by = (r() * H - lt * H * 0.03 * (0.4 + r()) * o.speed + H * 3) % H, sz = H * (0.002 + r() * 0.005); blob(x, bx, by, sz * 4, '#fff6dd', (0.25 + r() * 0.5) * o.amt); } });
defOv('bokehOv', 'Bokeh', 'Cząsteczki', 5, 'screen', (x, W, H, lt, d, o) => { const r = rng(o.seed + 17); for (let i = 0; i < 22; i++) { const bx = (r() * W + Math.sin(lt * 0.3 + i) * W * 0.04 + W) % W, by = (r() * H - lt * H * 0.03 * (0.5 + r()) * o.speed + H * 3) % H, br = (0.025 + r() * 0.07) * H, hue = Math.floor(20 + r() * 50), g = x.createRadialGradient(bx, by, br * 0.6, bx, by, br); g.addColorStop(0, `hsla(${hue},100%,75%,${0.22 * o.amt})`); g.addColorStop(0.92, `hsla(${hue},100%,70%,${0.45 * o.amt})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill(); } });
defOv('confetti', 'Konfetti', 'Cząsteczki', 4, 'normal', (x, W, H, lt, d, o) => { const r = rng(o.seed + 19); for (let i = 0; i < 90; i++) { const bx = r() * W, sp = (0.25 + r() * 0.35) * o.speed, y = (((lt * sp) + r()) % 1.15 - 0.1) * H, sz = H * (0.012 + r() * 0.016), rot = r() * 6 + lt * (2 + r() * 4); x.save(); x.translate(bx + Math.sin(lt * 2 + i) * W * 0.03, y); x.rotate(rot); x.fillStyle = `hsl(${Math.floor(r() * 360)},90%,60%)`; x.globalAlpha = Math.min(1, o.amt); x.fillRect(-sz / 2, -sz / 4, sz, sz / 2); x.restore(); } });
defOv('snow', 'Śnieg', 'Pogoda', 6, 'screen', (x, W, H, lt, d, o) => { const r = rng(o.seed + 23); for (let i = 0; i < 110; i++) { const bx = r() * W, sp = (0.06 + r() * 0.12) * o.speed, y = (((lt * sp) + r()) % 1.1 - 0.05) * H, sz = H * (0.003 + r() * 0.007); blob(x, bx + Math.sin(lt * 1.2 + i) * W * 0.02, y, sz * 2.5, '#ffffff', (0.5 + r() * 0.5) * o.amt); } });
defOv('rain', 'Deszcz', 'Pogoda', 6, 'screen', (x, W, H, lt, d, o) => { const r = rng(o.seed + 29); x.strokeStyle = rgbaC('#cfe4ff', 0.5 * o.amt); x.lineWidth = Math.max(1, H * 0.0015); for (let i = 0; i < 160; i++) { const bx = r() * W * 1.2, sp = (1.2 + r() * 0.8) * o.speed, y = (((lt * sp) + r()) % 1.1 - 0.05) * H, len = H * (0.03 + r() * 0.05); x.beginPath(); x.moveTo(bx - y * 0.2, y); x.lineTo(bx - y * 0.2 - len * 0.2, y + len); x.stroke(); } });
defOv('lightning', 'Błyskawice', 'Pogoda', 4, 'screen', (x, W, H, lt, d, o) => {
  const slot = Math.floor(lt * 2.2 * o.speed), r = rng(slot * 97 + o.seed), ph = (lt * 2.2 * o.speed) % 1;
  if (r() < 0.65 && ph < 0.35) {
    const a = (1 - ph / 0.35); x.fillStyle = `rgba(190,210,255,${0.35 * a * o.amt})`; x.fillRect(0, 0, W, H);
    let px = r() * W, py = 0; x.strokeStyle = `rgba(255,255,255,${a * o.amt})`; x.lineWidth = Math.max(2, H * 0.006); x.shadowColor = '#9bbcff'; x.shadowBlur = H * 0.03; x.beginPath(); x.moveTo(px, py);
    while (py < H) { py += H * (0.04 + r() * 0.06); px += (r() - 0.5) * W * 0.1; x.lineTo(px, py); } x.stroke();
  }
});
defOv('glitchBars', 'Pasy glitch', 'Glitch', 2, 'screen', (x, W, H, lt, d, o) => { const r = rng(Math.floor(lt * 14 * o.speed) + o.seed * 3); for (let i = 0; i < 6; i++) { if (r() > 0.6) continue; const y = r() * H, hh = (0.01 + r() * 0.06) * H, c = ['#ff0050', '#00ffe0', '#ffffff'][Math.floor(r() * 3)]; x.fillStyle = rgbaC(c, 0.5 * o.amt); x.fillRect(r() * W * 0.3, y, W * (0.3 + r() * 0.7), hh); } });
defOv('staticNoise', 'Szum', 'Glitch', 2, 'screen', (x, W, H, lt, d, o) => { const r = rng(Math.floor(lt * 24) + 1), k = Math.max(1, H / 540); x.save(); x.scale(k, k); x.translate(-r() * 256, -r() * 256); x.globalAlpha = 0.55 * o.amt; x.fillStyle = x.createPattern(noiseTile(), 'repeat'); x.fillRect(0, 0, W / k + 256, H / k + 256); x.restore(); });
defOv('scanBar', 'Skan', 'Glitch', 3, 'screen', (x, W, H, lt, d, o) => { const y = ((lt * 0.4 * o.speed) % 1.2 - 0.1) * H, g = x.createLinearGradient(0, y - H * 0.08, 0, y + H * 0.08); g.addColorStop(0, rgbaC(o.color, 0)); g.addColorStop(0.5, rgbaC(o.color, 0.6 * o.amt)); g.addColorStop(1, rgbaC(o.color, 0)); x.fillStyle = g; x.fillRect(0, y - H * 0.08, W, H * 0.16); x.fillStyle = rgbaC(o.color, 0.12 * o.amt); for (let yy = 0; yy < H; yy += 4) x.fillRect(0, yy, W, 1); });
defOv('filmBurn', 'Przepalenie taśmy', 'Inne', 2, 'screen', (x, W, H, lt, d, o) => { const f = 0.5 + 0.5 * Math.sin(lt * 5) * Math.sin(lt * 2.3 + 1), R = Math.max(W, H); blob(x, W * (0.2 + 0.6 * f), H * 0.4, R * 0.7, '#ff7a1a', 0.9 * o.amt); blob(x, W * 0.5, H * 0.5, R * 0.45, '#ffe9a8', 0.5 * f * o.amt); blob(x, W * (0.9 - 0.3 * f), H * 0.9, R * 0.4, '#ff2d2d', 0.5 * o.amt); });
defOv('vignetteOv', 'Winieta', 'Inne', 3, 'multiply', (x, W, H, lt, d, o) => { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.55); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${clamp(0.85 * o.amt * (0.85 + 0.15 * Math.sin(lt * 3)), 0, 1)})`); x.fillStyle = g; x.fillRect(0, 0, W, H); });
defOv('fireGlow', 'Ogień od dołu', 'Inne', 4, 'screen', (x, W, H, lt, d, o) => { const fl = 0.75 + 0.25 * Math.sin(lt * 11) * Math.sin(lt * 7 + 1), g = x.createLinearGradient(0, H, 0, H * 0.35); g.addColorStop(0, `rgba(255,120,20,${0.9 * fl * o.amt})`); g.addColorStop(0.5, `rgba(255,50,10,${0.4 * fl * o.amt})`); g.addColorStop(1, 'rgba(255,40,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); const r = rng(o.seed + 5); for (let i = 0; i < 30; i++) { const bx = r() * W, y = H * (1 - (((lt * (0.2 + r() * 0.3)) + r()) % 1) * 0.7); blob(x, bx, y, H * 0.02, '#ffcf5a', 0.8 * o.amt); } });
const OV_DEFAULT = { color: '#ffffff', amt: 1, speed: 1, seed: 1 };

/* ---------- eksport symulacji rysowania nakładki do kafelka ---------- */
function drawOverlayTo(cv, ovId, lt, o) {
  const def = OVERLAYS[ovId]; if (!def) return;
  const oo = Object.assign({}, OV_DEFAULT, o || {});
  const x = cv.getContext('2d'); x.save(); def.fn(x, cv.width, cv.height, lt, def.d, oo); x.restore();
}
