'use strict';
/* ============================================================
   Kadr Studio — silnik renderowania klatek (Canvas 2D)
   ============================================================ */
const rgba = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };
const TEXT_FONTS = ['Montserrat', 'Anton', 'Bebas Neue', 'Playfair Display', 'Pacifico', 'Permanent Marker', 'Righteous', 'Caveat', 'Lobster', 'Space Grotesk'];
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/* ---------- sprite tekstu (ustawienia jak w CapCut: poświata, cień, obrys, rozmycie, gradient, tło…) ---------- */

/* paleta kolorów (zmienne wypełnienie, poświata i obrys) */
const rgbOf = (c) => (typeof c === 'string' && c[0] === '#' ? hex2rgb(c) : [255, 255, 255]);
function palAt(cols, u) {
  u = ((u % 1) + 1) % 1; const n = cols.length;
  if (n === 1) return rgbOf(cols[0]);
  const f = u * n, i = Math.floor(f), k = f - i, a = rgbOf(cols[i % n]), b = rgbOf(cols[(i + 1) % n]), e = k * k * (3 - 2 * k);
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
}
const rgbaA = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
function starC(x, cx, cy, r, a, col) {
  x.save(); x.globalAlpha = clamp(a, 0, 1); x.fillStyle = col;
  x.beginPath(); x.moveTo(cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r); x.quadraticCurveTo(cx, cy, cx - r, cy); x.fill();
  x.restore();
}
const TEXT_IN_MODES = ['typewriter', 'letters', 'words', 'dropletters', 'blurText', 'slideLetters', 'zoomLetters', 'rotateLetters', 'fadeLetters', 'scramble', 'bounceWords', 'flipLetters', 'neonOn', 'lineIn', 'typeCaret', 'glitchLetters'];
const TEXT_LOOP_MODES = ['wave', 'rainbow', 'jumpLetters', 'shakeLetters', 'neonFlicker', 'glowPulse', 'colorCycle', 'blurPulse'];
const TEXT_SPRITE_ONLY = ['typewriter', 'typeCaret', 'glowPulse', 'blurPulse', 'fill'];
const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*';
function makeTextSprite(T, W, H, tfx) {
  const fs = Math.max(8, Math.round(T.size * Math.min(W, H)));
  let str = T.str == null ? '' : String(T.str);
  if (T.upper) str = str.toUpperCase();
  if (tfx && (tfx.mode === 'typewriter' || tfx.mode === 'typeCaret')) {
    str = str.slice(0, Math.floor(clamp(tfx.p, 0, 1) * str.length));
    if (tfx.mode === 'typeCaret') str += Math.floor((tfx.p || 0) * 40) % 2 === 0 ? '|' : ' ';
  }
  const mc = mkCanvas(8, 8).getContext('2d');
  const font = `${T.italic ? 'italic ' : ''}${T.bold ? '700' : '400'} ${fs}px "${T.font}", "Segoe UI", system-ui, sans-serif`;
  mc.font = font;
  const hasLS = 'letterSpacing' in mc;
  if (hasLS) mc.letterSpacing = (T.spacing * fs) + 'px';
  const maxW = W * 0.9, lines = [];
  for (const para of str.split('\n')) {
    const words = para.split(' ');
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (mc.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    lines.push(cur);
  }
  const lh = fs * T.lineH;
  let tw = 0; lines.forEach((l) => { tw = Math.max(tw, mc.measureText(l).width); });
  const lw = T.strokeW * fs, lw2 = (T.out2W || 0) * fs, hard = (T.hardD || 0) * fs;
  const per = !!(tfx && !TEXT_SPRITE_ONLY.includes(tfx.mode));
  const sdist = T.shD == null ? T.shadowB * 0.25 : T.shD, sang = (T.shAng == null ? 90 : T.shAng) * Math.PI / 180;
  const shx = Math.cos(sang) * sdist * fs, shy = Math.sin(sang) * sdist * fs;
  const shCol = rgba(T.shadowC, T.shA == null ? 1 : T.shA), strokeCol = rgba(T.strokeC, T.strokeA == null ? 1 : T.strokeA);
  const pulse = tfx && tfx.mode === 'glowPulse' ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((tfx.t || 0) * 4)) : 1;
  const glowBase = tfx && tfx.mode === 'glowPulse' ? Math.max(T.glowA || 0, 0.9) : (T.glowA || 0);
  const glowA = glowBase * pulse;
  const blurAmt = tfx && tfx.mode === 'blurPulse' ? (0.5 + 0.5 * Math.sin((tfx.t || 0) * 3)) * 0.6 : (T.blur || 0);
  const bgP = fs * (T.bgP == null ? 0.32 : T.bgP), bgR = fs * (T.bgR == null ? 0.22 : T.bgR);
  const ft = tfx && tfx.t != null ? tfx.t : 0, fSpeed = T.fillSpeed == null ? 1 : T.fillSpeed, fSpread = T.fillSpread == null ? 1 : T.fillSpread, fa = T.fillA == null ? 1 : T.fillA;
  const fmode = T.fillMode || (T.fill2 ? 'gradient' : 'solid');
  const palList = [T.color, T.fill2 || T.color, T.fill3 || ''].filter((c) => c && c[0] === '#');
  const cyc = (phase, a) => (fmode === 'rainbow' ? `hsla(${Math.floor(((phase % 1) + 1) % 1 * 360)},95%,62%,${a})` : rgbaA(palAt(palList.length ? palList : ['#ffffff'], phase), a));
  const phase0 = ft * fSpeed * 0.2;
  const glowStr = (a) => (T.glowCycle ? cyc(phase0, a) : rgba(T.glowC || '#ffffff', a));
  const strokeStr = () => (T.strokeCycle ? cyc(phase0 + 0.5, T.strokeA == null ? 1 : T.strokeA) : strokeCol);
  const pad = Math.ceil(fs * (0.25 + T.shadowB * 1.4 + Math.abs(sdist) * 1.1 + (glowBase > 0 ? (T.glowB == null ? 0.5 : T.glowB) * 1.5 + 0.1 : 0) + blurAmt * 0.55) + lw + lw2 * 2 + hard + (T.bg ? bgP + fs * 0.05 : 0) + (per ? fs * 0.8 : 0));
  const w = Math.max(fs * 0.5, Math.ceil(tw + pad * 2)), hh = Math.max(fs, Math.ceil(lines.length * lh + pad * 2));
  let cv = mkCanvas(w, hh);
  const x = cv.getContext('2d');
  x.font = font; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.miterLimit = 2;
  if (hasLS) x.letterSpacing = (T.spacing * fs) + 'px';
  if (T.bg) {
    x.fillStyle = rgba(T.bg, T.bgA);
    const bx = pad - bgP, by = pad - bgP * 0.8, bw = w - (pad - bgP) * 2, bh = hh - (pad - bgP * 0.8) * 2;
    x.beginPath();
    if (x.roundRect) x.roundRect(bx, by, bw, bh, bgR); else x.rect(bx, by, bw, bh);
    x.fill();
  }
  const clearShadow = () => { x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetX = 0; x.shadowOffsetY = 0; };
  const makeFill = (fillOver) => {
    if (fillOver) return fillOver;
    const solid = () => (fa < 1 && typeof T.color === 'string' && T.color[0] === '#' ? rgba(T.color, fa) : T.color);
    if (fmode === 'solid') return solid();
    const a = (T.gradAng == null ? 90 : T.gradAng) * Math.PI / 180, len = Math.abs(w * Math.cos(a)) + Math.abs(hh * Math.sin(a)), gx = Math.cos(a) * len / 2, gy = Math.sin(a) * len / 2;
    const g = x.createLinearGradient(w / 2 - gx, hh / 2 - gy, w / 2 + gx, hh / 2 + gy);
    if (fmode === 'gradient') {
      const cs = [T.color, T.fill2 || T.color, T.fill3 || ''].filter(Boolean), conv = (c) => (c[0] === '#' ? rgba(c, fa) : c);
      cs.forEach((c, i) => g.addColorStop(cs.length === 1 ? 0 : i / (cs.length - 1), conv(c)));
      return g;
    }
    const N = 30;
    for (let j = 0; j <= N; j++) { const u = j / N; g.addColorStop(u, cyc(u * fSpread + phase0, fa)); }
    return g;
  };
  /* jedna „warstwowa” sztuka tekstu: twardy cień, poświata, obrys zewnętrzny, obrys, cień, wypełnienie */
  const run = (txt, px, py, fillOver, noGrad) => {
    const hasSh = T.shadowB > 0 || Math.abs(sdist) > 0.0005;
    const sh = () => { if (hasSh) { x.shadowColor = shCol; x.shadowBlur = T.shadowB * fs; x.shadowOffsetX = shx; x.shadowOffsetY = shy; } };
    if (hard > 0) { x.fillStyle = T.hardC || '#000'; x.strokeStyle = T.hardC || '#000'; x.lineWidth = lw + lw2 * 2; x.fillText(txt, px + hard, py + hard); if (x.lineWidth > 0.4) x.strokeText(txt, px + hard, py + hard); }
    if (glowA > 0.01) {
      const gA = glowA * 1.5, passes = Math.min(9, Math.max(1, Math.ceil(gA * 2.2))), wide = (T.glowB == null ? 0.5 : T.glowB) * fs * 1.15 + fs * 0.08;
      x.fillStyle = fillOver || T.color; x.shadowOffsetX = 0; x.shadowOffsetY = 0;
      const emit = (blur, alpha, n) => {
        x.shadowColor = glowStr(clamp(alpha, 0, 1)); x.shadowBlur = blur;
        if (fa < 0.999 && !noGrad) { x.shadowOffsetX = 5000; for (let i = 0; i < n; i++) x.fillText(txt, px - 5000, py); x.shadowOffsetX = 0; }   /* przezroczysty napis: samą poświatę, bez pełnego wypełnienia */
        else for (let i = 0; i < n; i++) x.fillText(txt, px, py);
      };
      emit(wide, gA, passes);                      /* szeroka łuna */
      emit(wide * 0.38, gA * 0.95, Math.ceil(passes * 0.6));   /* jasny rdzeń tuż przy literach */
      clearShadow();
    }
    let first = true;
    const layer = (width, col) => { if (first) sh(); x.strokeStyle = col; x.lineWidth = width; x.strokeText(txt, px, py); if (first) { clearShadow(); first = false; } };
    if (lw2 > 0.4) layer(lw + lw2 * 2, rgba(T.out2C || '#000', 1));
    if (lw > 0.4) layer(lw, strokeStr());
    x.fillStyle = noGrad ? (fillOver || T.color) : makeFill(fillOver);
    if (first) sh();
    x.fillText(txt, px, py);
    if (first && T.shadowB > 0.35 && !(T.shA < 1)) x.fillText(txt, px, py);
    clearShadow();
  };
  x.textAlign = 'left';
  let g = 0, wi = 0;
  const totalChars = lines.reduce((n, l) => n + l.length, 0), totalWords = Math.max(1, str.split(/\s+/).filter(Boolean).length), L = lines.length;
  lines.forEach((l, li) => {
    const y = pad + lh * (li + 0.5), lwid = mc.measureText(l).width;
    const left = T.align === 'left' ? pad : T.align === 'right' ? w - pad - lwid : w / 2 - lwid / 2;
    if (!per) {
      run(l, left, y);
      if (T.ul) { x.fillStyle = T.color; x.fillRect(left, y + fs * 0.4, lwid, Math.max(1.5, fs * 0.055)); }
      return;
    }
    for (let k = 0; k < l.length; k++) {
      const ch = l[k], px = left + mc.measureText(l.slice(0, k)).width, cw = mc.measureText(ch).width;
      let al = 1, sc = 1, sx = 1, xo = 0, yo = 0, rot = 0, fillOver = null, blurPx = 0, ch2 = ch;
      const N = totalChars, qL = clamp(tfx.p * (N + 5) - g, 0, 5) / 5, md = tfx.mode;
      if (md === 'letters') { al = Math.min(1, qL * 2); sc = qL <= 0 ? 0 : ease.outBack(qL); }
      else if (md === 'dropletters') { al = qL <= 0 ? 0 : Math.min(1, qL * 4); yo = -(1 - ease.outBounce(qL)) * fs * 1.1; }
      else if (md === 'words') { const q = clamp(tfx.p * (totalWords + 2) - wi, 0, 2) / 2; al = q; sc = lerp(0.6, 1, ease.out(q)); yo = (1 - q) * fs * 0.3; }
      else if (md === 'bounceWords') { const q = clamp(tfx.p * (totalWords + 2) - wi, 0, 2) / 2; al = Math.min(1, q * 4); yo = -(1 - ease.outBounce(q)) * fs * 0.9; }
      else if (md === 'blurText') { al = qL; blurPx = (1 - qL) * fs * 0.3; }
      else if (md === 'slideLetters') { xo = -(1 - ease.out(qL)) * fs * 1.3; al = Math.min(1, qL * 3); }
      else if (md === 'zoomLetters') { sc = lerp(2.8, 1, ease.out(qL)); al = qL; }
      else if (md === 'rotateLetters') { rot = -(1 - ease.out(qL)) * 1.5; al = Math.min(1, qL * 2); sc = lerp(0.4, 1, ease.out(qL)); }
      else if (md === 'fadeLetters') { al = qL; }
      else if (md === 'scramble') { if (qL < 1 && ch !== ' ') ch2 = SCRAMBLE[Math.floor(rng(Math.floor(tfx.p * 28) * 131 + g)() * SCRAMBLE.length)]; al = qL <= 0 ? 0.3 : 1; }
      else if (md === 'flipLetters') { sx = Math.max(0.02, ease.out(qL)); al = qL > 0 ? 1 : 0; }
      else if (md === 'neonOn') { al = qL <= 0 ? 0 : qL < 1 ? (Math.floor(qL * 16 + g * 3) % 3 === 0 ? 0.15 : 1) : 1; }
      else if (md === 'lineIn') { const q = clamp(tfx.p * (L + 1) - li, 0, 1); al = q; yo = (1 - ease.out(q)) * fs * 0.9; }
      else if (md === 'glitchLetters') { const r = rng(Math.floor(tfx.p * 24) * 17 + g), kk = 1 - tfx.p; xo = (r() - 0.5) * fs * 0.6 * kk; al = r() < kk * 0.7 ? 0.2 : 1; if (r() < kk * 0.4) fillOver = ['#ff2d95', '#00e5ff', '#ffffff'][Math.floor(r() * 3)]; }
      else if (md === 'wave') yo = Math.sin(tfx.t * 5 + g * 0.55) * fs * 0.14;
      else if (md === 'rainbow') fillOver = `hsl(${Math.floor((tfx.t * 120 + g * 25) % 360)},95%,62%)`;
      else if (md === 'jumpLetters') yo = -Math.abs(Math.sin(tfx.t * 4 - g * 0.45)) * fs * 0.28;
      else if (md === 'shakeLetters') { const r = rng(Math.floor(tfx.t * 22) * 31 + g); xo = (r() - 0.5) * fs * 0.08; yo = (r() - 0.5) * fs * 0.08; rot = (r() - 0.5) * 0.1; }
      else if (md === 'neonFlicker') { al = rng(Math.floor(tfx.t * 14) * 7 + g)() < 0.14 ? 0.25 : 1; }
      else if (md === 'colorCycle') fillOver = `hsl(${Math.floor((tfx.t * 70 + g * 10) % 360)},90%,64%)`;
      if (ch === ' ') wi++;
      g++;
      if (al <= 0.003 || ch === ' ') continue;
      x.save(); x.globalAlpha = al; x.translate(px + cw / 2 + xo, y + yo); x.rotate(rot); x.scale(sc * sx, sc);
      if (blurPx > 0.3 && HAS_FILTER) x.filter = `blur(${blurPx.toFixed(1)}px)`;
      run(ch2, -x.measureText(ch2).width / 2, 0, fillOver, true); x.restore();
    }
  });
  if ((fmode === 'galaxy' || fmode === 'glitter') && !per) {
    /* tekstura kosmiczna / brokat widoczna tylko wewnątrz liter */
    const fm = mkCanvas(w, hh), fx = fm.getContext('2d');
    fx.font = font; fx.textBaseline = 'middle'; fx.textAlign = 'left'; fx.fillStyle = '#fff'; if (hasLS) fx.letterSpacing = (T.spacing * fs) + 'px';
    lines.forEach((l, li) => { const lwid = mc.measureText(l).width, left = T.align === 'left' ? pad : T.align === 'right' ? w - pad - lwid : w / 2 - lwid / 2; fx.fillText(l, left, pad + lh * (li + 0.5)); });
    const ly = mkCanvas(w, hh), lx = ly.getContext('2d'), r1 = rng(7), r2 = rng(11);
    if (fmode === 'galaxy') {
      for (let i = 0; i < 7; i++) {
        const bx = r1() * w + Math.sin(ft * 0.3 + i) * w * 0.05, by = pad + r1() * (hh - pad * 2), rad = Math.max(w, hh) * (0.18 + r1() * 0.2), col = palAt(palList.length ? palList : ['#ffffff'], i / 7 + phase0 * 0.5);
        const gr = lx.createRadialGradient(bx, by, 0, bx, by, rad); gr.addColorStop(0, rgbaA(col, 0.7)); gr.addColorStop(1, rgbaA(col, 0)); lx.fillStyle = gr; lx.fillRect(0, 0, w, hh);
      }
    }
    const dens = T.spark == null ? 0.5 : T.spark, n = clamp(Math.round(dens * (fmode === 'glitter' ? 220 : 120) * (w * hh) / (420 * 130)), 6, 700), sc = T.sparkC || '#ffffff';
    for (let i = 0; i < n; i++) {
      const sx = r2() * w, sy = r2() * hh, sz = fs * (0.012 + r2() * 0.05), tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ft * (2 + r2() * 5) + r2() * 6.28));
      if (r2() < (fmode === 'glitter' ? 0.3 : 0.14)) starC(lx, sx, sy, sz * 2.6, tw, sc); else { lx.globalAlpha = tw * 0.9; lx.fillStyle = sc; lx.beginPath(); lx.arc(sx, sy, Math.max(0.6, sz * 0.5), 0, 7); lx.fill(); lx.globalAlpha = 1; }
    }
    lx.globalCompositeOperation = 'destination-in'; lx.drawImage(fm, 0, 0);
    x.save(); x.globalAlpha = clamp(fa + 0.1, 0, 1); x.drawImage(ly, 0, 0); x.restore();
  }
  if (blurAmt > 0.01 && HAS_FILTER) {
    const b = mkCanvas(w, hh), bx = b.getContext('2d');
    bx.filter = `blur(${(blurAmt * fs * 0.22).toFixed(1)}px)`; bx.drawImage(cv, 0, 0); cv = b;
  }
  return cv;
}
function makeStickerSprite(S0, W, H) {
  const fs = Math.max(8, Math.round(S0.size * Math.min(W, H))), n = Math.ceil(fs * 1.35);
  const cv = mkCanvas(n, n), x = cv.getContext('2d');
  x.font = `${fs}px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(S0.emoji, n / 2, n / 2 + fs * 0.06);
  return cv;
}

/* ---------- klucz chromatyczny (zielony ekran) ---------- */
function chromaKey(cx, w, hh, cut) {
  const id = cx.getImageData(0, 0, w, hh), d = id.data;
  const [kr, kg, kb] = hex2rgb(cut.key);
  const kcb = 128 - 0.168736 * kr - 0.331264 * kg + 0.5 * kb, kcr = 128 + 0.5 * kr - 0.418688 * kg - 0.081312 * kb;
  const thr1 = cut.tol * 150, thr2 = thr1 + 4 + cut.soft * 110;
  const keyIsGreen = kg >= kr && kg >= kb, keyIsBlue = kb > kg && kb >= kr;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    const dist = Math.hypot(cb - kcb, cr - kcr);
    let a;
    if (dist <= thr1) a = 0; else if (dist >= thr2) a = 1; else a = (dist - thr1) / (thr2 - thr1);
    if (a > 0 && a < 1 || (a === 1 && dist < thr2 + 28)) {
      /* usuwanie zielonej/niebieskiej poświaty na krawędziach */
      if (keyIsGreen) { const lim = (r + b) / 2; if (g > lim) d[i + 1] = lim; }
      else if (keyIsBlue) { const lim = (r + g) / 2; if (b > lim) d[i + 2] = lim; }
    }
    d[i + 3] = d[i + 3] * a;
  }
  cx.putImageData(id, 0, 0);
}

/* ---------- AI: usuwanie tła człowieka (MediaPipe Selfie Segmentation) ---------- */
const AI = {
  state: 'idle', sess: null, q: null, resolver: null, lastModel: -1, err: null,
  base: 'lib/mp/',
  init() {
    if (this.sess) return Promise.resolve(this.sess);
    if (this._p) return this._p;
    this.state = 'loading'; Bus.emit('ai');
    this._p = (async () => {
      try {
        if (!window.__MP_MODELS) { try { await loadScript(this.base + 'models.js'); } catch (e) { /* użyjemy plików bezpośrednio */ } }
        if (!window.SelfieSegmentation) await loadScript(this.base + 'selfie_segmentation.js');
        /* pliki modelu są zapakowane w models.js (base64), żeby działały też tam, gdzie serwowane są tylko typowe pliki webowe */
        const urls = {};
        const urlFor = (f) => {
          const b64 = window.__MP_MODELS && window.__MP_MODELS[f];
          if (!b64) return this.base + f;
          if (!urls[f]) { const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); urls[f] = URL.createObjectURL(new Blob([u8], { type: 'application/octet-stream' })); }
          return urls[f];
        };
        const s = new window.SelfieSegmentation({ locateFile: urlFor });
        s.setOptions({ modelSelection: 0, selfieMode: false });
        s.onResults((r) => { if (this.resolver) { const f = this.resolver; this.resolver = null; f(r); } });
        await s.initialize();
        this.sess = s; this.state = 'ready'; Bus.emit('ai');
        return s;
      } catch (e) {
        this.state = 'error'; this.err = e; this._p = null; Bus.emit('ai');
        throw e;
      }
    })();
    return this._p;
  },
  /* zwraca płótno z maską (alfa = prawdopodobieństwo osoby) */
  segment(canvas, model = 0) {
    const job = async () => {
      const s = await this.init();
      if (model !== this.lastModel) { s.setOptions({ modelSelection: model }); this.lastModel = model; }
      return new Promise((resolve, reject) => {
        const to = setTimeout(() => { this.resolver = null; reject(new Error('AI timeout')); }, 20000);
        this.resolver = (r) => {
          clearTimeout(to);
          const m = r.segmentationMask, out = mkCanvas(m.width || canvas.width, m.height || canvas.height);
          out.getContext('2d', { willReadFrequently: true }).drawImage(m, 0, 0, out.width, out.height);
          resolve(out);
        };
        s.send({ image: canvas }).catch((e) => { clearTimeout(to); this.resolver = null; reject(e); });
      });
    };
    const p = (this.q || Promise.resolve()).then(job);
    this.q = p.catch(() => {});
    return p;
  },
};

/* przetwarza surową maskę w gładkie, kontrolowane alfa */
function processMask(raw, cut) {
  const w = raw.width, hh = raw.height;
  const rx = raw.getContext('2d', { willReadFrequently: true }), id = rx.getImageData(0, 0, w, hh), d = id.data;
  let minA = 255;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < minA) minA = d[i];
  const useAlpha = minA < 200;
  const thr = 0.5 - cut.edge * 0.25, wd = 0.04 + cut.soft * 0.3;
  const lo = thr - wd, hi = thr + wd;
  const out = mkCanvas(w, hh), ox = out.getContext('2d'), od = ox.createImageData(w, hh);
  for (let i = 0; i < d.length; i += 4) {
    const v = (useAlpha ? d[i + 3] : d[i]) / 255;
    let a = (v - lo) / (hi - lo); a = a < 0 ? 0 : a > 1 ? 1 : a; a = a * a * (3 - 2 * a);
    od.data[i] = od.data[i + 1] = od.data[i + 2] = 255; od.data[i + 3] = Math.round(a * 255);
  }
  ox.putImageData(od, 0, 0);
  return out;
}

/* ============================================================
   Renderer
   provider.get(clip, t) -> {el, w, h} | null
   ============================================================ */
class Renderer {
  constructor(W, H, provider) {
    this.W = W; this.H = H; this.provider = provider;
    this.canvas = mkCanvas(W, H);
    this.ctx = this.canvas.getContext('2d');
    this.sprites = new Map(); this.cuts = new Map();
    this.exporting = false; this.onAsync = null;
  }
  /* plan klatki: co rysujemy na każdej ścieżce w czasie t */
  plan(t) {
    const out = []; syncLanes();
    for (const lane of VIS_ORDER) {
      if (P.lanes && P.lanes.hidden && P.lanes.hidden[lane]) continue;
      const lc = clips.filter((c) => c.lane === lane && isVisual(c)).sort((a, b) => a.start - b.start);
      let pair = null;
      for (const B of lc) {
        if (!B.trans || B.trans.id === 'none' || !TRANS[B.trans.id]) continue;
        const A = prevAdjacent(B);
        if (!A || A.type === 'fx' || B.type === 'fx') continue;
        const d = transDur(B, A), t0 = B.start - d / 2, t1 = B.start + d / 2;
        if (t >= t0 && t < t1) { pair = { lane, A, B, p: (t - t0) / d }; break; }
      }
      if (pair) { out.push(pair); continue; }
      for (const c of lc) if (t >= c.start && t < clipEnd(c)) out.push({ lane, c });
    }
    return out;
  }
  drawnClips(t) {
    const r = [];
    for (const p of this.plan(t)) { if (p.c) r.push(p.c); else { r.push(p.A, p.B); } }
    return r;
  }
  textSprite(c, tfx) {
    if (typeof FontLoader !== 'undefined' && !this.exporting) FontLoader.ensure(c.text.font, c.text.bold);
    const tk = tfx ? [tfx.mode, Math.round((tfx.p || 0) * 40), Math.round((tfx.t || 0) * 20)] : null;
    const key = 'T' + JSON.stringify([c.text, tk, this.W, this.H]);
    let s = this.sprites.get(key);
    if (!s) { s = makeTextSprite(c.text, this.W, this.H, tfx); this._cache(key, s); }
    return s;
  }
  stickerSprite(c) {
    const key = 'S' + JSON.stringify([c.sticker, this.W, this.H]);
    let s = this.sprites.get(key);
    if (!s) { s = c.sticker.shape ? makeShapeSprite(c.sticker, this.W, this.H) : makeStickerSprite(c.sticker, this.W, this.H); this._cache(key, s); }
    return s;
  }
  sceneCanvas(c, t) {
    if (!this._scn) this._scn = new Map();
    let cv = this._scn.get(c.id);
    if (!cv || cv.width !== this.W || cv.height !== this.H) { cv = mkCanvas(this.W, this.H); this._scn.set(c.id, cv); if (this._scn.size > 12) this._scn.delete(this._scn.keys().next().value); }
    Anim.draw(cv.getContext('2d'), this.W, this.H, c.scene, c.inPt + (t - c.start) * (c.speed || 1));
    return cv;
  }
  _cache(k, v) { this.sprites.set(k, v); if (this.sprites.size > 80) this.sprites.delete(this.sprites.keys().next().value); }

  /* geometria klipu (do ramki zaznaczenia) */
  clipBox(c, t) {
    const W = this.W, H = this.H, lt = (t == null ? S.time : t) - c.start;
    let ow, oh, base = 1;
    if (c.type === 'video' || c.type === 'image') { const m = getMedia(c); if (!m || !m.w) return null; ow = m.w; oh = m.h; base = Math.min(W / ow, H / oh); }
    else if (c.type === 'text') { const sp = this.textSprite(c, null); ow = sp.width; oh = sp.height; }
    else if (c.type === 'sticker') { const sp = this.stickerSprite(c); ow = sp.width; oh = sp.height; }
    else if (c.type === 'scene') { ow = W; oh = H; }
    else return null;
    return { cx: W / 2 + kfVal(c, 'x', lt) * W, cy: H / 2 + kfVal(c, 'y', lt) * H, w: ow * base * kfVal(c, 'scale', lt), h: oh * base * kfVal(c, 'scale', lt), rot: kfVal(c, 'rot', lt) * Math.PI / 180 };
  }

  /* wycinanie tła */
  _cutSprite(c, src, ow, oh) {
    const maxD = this.exporting ? 1600 : 640, k = Math.min(1, maxD / Math.max(ow, oh));
    const cw = Math.max(2, Math.round(ow * k)), ch = Math.max(2, Math.round(oh * k));
    let st = this.cuts.get(c.id);
    if (!st) { st = { cv: mkCanvas(cw, ch), busy: false, key: null }; this.cuts.set(c.id, st); }
    if (st.cv.width !== cw || st.cv.height !== ch) { st.cv.width = cw; st.cv.height = ch; st.maskCv = null; st.key = null; }
    const cx = st.cv.getContext('2d', { willReadFrequently: true });
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalCompositeOperation = 'source-over'; cx.filter = 'none'; cx.globalAlpha = 1;
    cx.clearRect(0, 0, cw, ch); cx.drawImage(src, 0, 0, cw, ch);
    return { st, cx, cw, ch };
  }
  _aiKey(c, t) { return c.type === 'image' ? 'img' : String(Math.round(srcTime(c, t) * (this.exporting ? 1000 : 12))) + '|' + c.cut.model; }
  _aiInput(st, cw, ch) {
    const inp = st.inp || (st.inp = mkCanvas(1, 1)), k = Math.min(1, 512 / Math.max(cw, ch));
    inp.width = Math.max(2, Math.round(cw * k)); inp.height = Math.max(2, Math.round(ch * k));
    inp.getContext('2d').drawImage(st.cv, 0, 0, inp.width, inp.height);
    return inp;
  }
  cutout(c, src, ow, oh, t) {
    const cut = c.cut;
    const { st, cx, cw, ch } = this._cutSprite(c, src, ow, oh);
    if (cut.mode === 'chroma') { chromaKey(cx, cw, ch, cut); return st.cv; }
    if (cut.mode === 'ai') {
      const key = this._aiKey(c, t);
      if (!this.exporting && st.key !== key && !st.busy && AI.state !== 'error') {
        st.busy = true;
        AI.segment(this._aiInput(st, cw, ch), cut.model).then((m) => { st.maskCv = m; st.key = key; st.procKey = ''; st.busy = false; if (this.onAsync) this.onAsync(); })
          .catch((e) => { st.busy = false; console.warn('AI', e); if (this.onAsync) this.onAsync(); });
      }
      if (!st.maskCv) return AI.state === 'error' ? null : this._ghost(st, cx, cw, ch);
      const pk = [st.key, cut.edge, cut.soft].join('|');
      if (st.procKey !== pk) { st.proc = processMask(st.maskCv, cut); st.procKey = pk; }
      cx.globalCompositeOperation = 'destination-in';
      if (HAS_FILTER && cut.feather > 0.01) cx.filter = `blur(${(cut.feather * Math.max(cw, ch) * 0.006).toFixed(2)}px)`;
      cx.drawImage(st.proc, 0, 0, cw, ch);
      cx.filter = 'none'; cx.globalCompositeOperation = 'source-over';
      return st.cv;
    }
    return null;
  }
  _ghost(st, cx, cw, ch) { /* do czasu pierwszej maski pokazujemy przyciemniony oryginał */
    cx.save(); cx.globalCompositeOperation = 'destination-in'; cx.fillStyle = 'rgba(0,0,0,0.45)'; cx.fillRect(0, 0, cw, ch); cx.restore();
    return st.cv;
  }
  /* eksport: policz maski AI zanim narysujemy klatkę */
  async prepareAI(t) {
    for (const c of this.drawnClips(t)) {
      if (c.cut.mode !== 'ai' || (c.type !== 'video' && c.type !== 'image')) continue;
      const s = this.provider.get(c, t);
      if (!s) continue;
      const { st, cw, ch } = this._cutSprite(c, s.el, s.w, s.h);
      const key = this._aiKey(c, t);
      if (st.key === key && st.maskCv) continue;
      st.maskCv = await AI.segment(this._aiInput(st, cw, ch), c.cut.model);
      st.key = key; st.procKey = '';
    }
  }

  /* ---------- rysowanie ---------- */
  render(t) {
    const { ctx, W, H } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    const plan = this.plan(t);
    if (P.bgBlur) this.drawBlurBg(plan, t);
    for (const p of plan) {
      if (p.c) this.drawClip(ctx, p.c, t);
      else this.drawTransition(p, t);
    }
  }
  drawBlurBg(plan, t) {
    const p = plan.find((q) => q.lane === 'v1'); if (!p) return;
    const c = p.c || p.B;
    if (c.type !== 'video' && c.type !== 'image') return;
    const s = this.provider.get(c, t); if (!s) return;
    const { ctx, W, H } = this, k = Math.max(W / s.w, H / s.h) * 1.12;
    ctx.save();
    if (HAS_FILTER) ctx.filter = `blur(${(H * 0.035).toFixed(1)}px) brightness(.65)`;
    ctx.drawImage(s.el, (W - s.w * k) / 2, (H - s.h * k) / 2, s.w * k, s.h * k);
    ctx.restore();
  }
  drawTransition(p, t) {
    const { W, H } = this;
    const ca = POOL.get(W, H), cb = POOL.get(W, H), cl = POOL.get(W, H);
    this.drawClip(ca.getContext('2d'), p.A, t, { skipOut: true, trans: true });
    this.drawClip(cb.getContext('2d'), p.B, t, { skipIn: true, trans: true });
    TRANS[p.B.trans.id].fn(cl.getContext('2d'), ca, cb, p.p, W, H);
    this.ctx.drawImage(cl, 0, 0);
    POOL.free(ca); POOL.free(cb); POOL.free(cl);
  }
  drawFxLayer(c, t) {
    const { W, H, ctx } = this, lt = t - c.start, st = animState(c, lt);
    const alpha = c.opacity * st.al; if (alpha < 0.003) return;
    const w = POOL.get(W, H), wx = w.getContext('2d'), f = cssFilter(c, H);
    if (HAS_FILTER && f !== 'none') wx.filter = f;
    wx.drawImage(this.canvas, 0, 0); wx.filter = 'none';
    applyOverlays(w, overlayList(c), t);
    applyEffects(w, c.fx, lt);
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(w, 0, 0); ctx.restore();
    POOL.free(w);
  }
  drawOverlay(tctx, c, t, o) {
    const def = OVERLAYS[c.overlay && c.overlay.id]; if (!def) return;
    const W = this.W, H = this.H, lt = t - c.start, st = animState(c, lt, o), alpha = kfVal(c, 'opacity', lt) * st.al;
    if (alpha < 0.003) return;
    const ov = POOL.get(W, H), ox = ov.getContext('2d');
    ox.save(); def.fn(ox, W, H, lt, c.dur, Object.assign({}, OV_DEFAULT, c.overlay)); ox.restore();
    tctx.save();
    tctx.globalCompositeOperation = blendOp(c.blend && c.blend !== 'normal' ? c.blend : def.blend);
    tctx.globalAlpha = clamp(alpha, 0, 1);
    tctx.translate(W / 2 + kfVal(c, 'x', lt) * W, H / 2 + kfVal(c, 'y', lt) * H); tctx.rotate(kfVal(c, 'rot', lt) * Math.PI / 180); const sc = kfVal(c, 'scale', lt) * st.s; tctx.scale(sc, sc);
    tctx.drawImage(ov, -W / 2, -H / 2); tctx.restore();
    POOL.free(ov);
  }
  applyMask(cv, c, cx, cy, dw, dh, rot) {
    const m = c.mask, W = this.W, H = this.H, base = Math.min(dw, dh) * 0.5 * m.s;
    let mk = POOL.get(W, H), mx = mk.getContext('2d');
    const ang = rot + m.r * Math.PI / 180, ox = m.x * dw, oy = m.y * dh, cr = Math.cos(rot), sr = Math.sin(rot);
    mx.save(); mx.translate(cx + ox * cr - oy * sr, cy + ox * sr + oy * cr); mx.rotate(ang); mx.fillStyle = '#fff'; mx.beginPath(); maskPath(mx, m.id, base); mx.fill(); mx.restore();
    if (m.f > 0.01 && HAS_FILTER) { const b = POOL.copy(mk); mx.clearRect(0, 0, W, H); mx.filter = `blur(${(m.f * base * 0.6).toFixed(1)}px)`; mx.drawImage(b, 0, 0); mx.filter = 'none'; POOL.free(b); }
    if (m.inv) { const inv = POOL.get(W, H), ix = inv.getContext('2d'); ix.fillStyle = '#fff'; ix.fillRect(0, 0, W, H); ix.globalCompositeOperation = 'destination-out'; ix.drawImage(mk, 0, 0); POOL.free(mk); mk = inv; }
    const x = cv.getContext('2d'); x.save(); x.globalCompositeOperation = 'destination-in'; x.drawImage(mk, 0, 0); x.restore(); POOL.free(mk);
  }
  drawClip(tctx, c, t, o = {}) {
    if (c.type === 'fx') { if (tctx === this.ctx) this.drawFxLayer(c, t); return; }
    if (c.type === 'overlay') { this.drawOverlay(tctx, c, t, o); return; }
    const W = this.W, H = this.H, lt = t - c.start;
    const st = animState(c, lt, o);
    const alpha = kfVal(c, 'opacity', lt) * st.al;
    if (alpha < 0.003) return;
    let src = null, ow, oh;
    if (c.type === 'text') {
      let tfx = null;
      if (!o.trans) {
        const ai = c.animIn.id, ao = c.animOut.id;
        const dIn = Math.max(0.1, Math.min(c.animIn.dur, c.dur * 0.6)), dOut = Math.max(0.1, Math.min(c.animOut.dur, c.dur * 0.6));
        if (TEXT_IN_MODES.includes(ai) && lt < dIn) tfx = { mode: ai, p: clamp(lt / dIn, 0, 1), t: lt };
        if (!tfx && TEXT_IN_MODES.includes(ao) && lt > c.dur - dOut) tfx = { mode: ao, p: clamp((c.dur - lt) / dOut, 0, 1), t: lt };
        if (!tfx && TEXT_LOOP_MODES.includes(c.animLoop.id)) tfx = { mode: c.animLoop.id, t: Math.max(0, lt), p: 1 };
      }
      const T0 = c.text;
      if (['shift', 'rainbow', 'galaxy', 'glitter'].includes(T0.fillMode) || T0.glowCycle || T0.strokeCycle) { tfx = tfx || { mode: 'fill', t: Math.max(0, lt), p: 1 }; if (tfx.t == null) tfx.t = Math.max(0, lt); }
      src = this.textSprite(c, tfx); ow = src.width; oh = src.height;
    } else if (c.type === 'sticker') { src = this.stickerSprite(c); ow = src.width; oh = src.height; }
    else if (c.type === 'scene') { src = this.sceneCanvas(c, t); ow = this.W; oh = this.H; }
    else {
      const s = this.provider.get(c, t);
      if (!s) return;
      src = s.el; ow = s.w; oh = s.h;
      if (c.cut.mode !== 'none') { const cc = this.cutout(c, src, ow, oh, t); if (cc) src = cc; }
    }
    if (!ow || !oh) return;
    const base = (c.type === 'video' || c.type === 'image') ? Math.min(W / ow, H / oh) : 1;
    const ks = kfVal(c, 'scale', lt), dw = ow * base * ks * st.s, dh = oh * base * ks * st.s;
    const cx = W / 2 + (kfVal(c, 'x', lt) + st.dx) * W, cy = H / 2 + (kfVal(c, 'y', lt) + st.dy) * H, rot = kfVal(c, 'rot', lt) * Math.PI / 180 + st.r;
    const overlays = overlayList(c), hasMask = c.mask && c.mask.id !== 'none', need = c.fx.length > 0 || overlays.length > 0 || hasMask;
    const blend = c.blend && c.blend !== 'normal' ? blendOp(c.blend) : null;
    let target = tctx, scratch = null;
    if (need) { scratch = POOL.get(W, H); target = scratch.getContext('2d'); }
    target.save();
    if (blend && !need) target.globalCompositeOperation = blend;
    target.translate(cx, cy); target.rotate(rot);
    target.scale((c.flipX ? -1 : 1) * st.fl, (c.flipY ? -1 : 1) * st.fy);
    if (st.cl) { target.beginPath(); target.rect(-dw / 2 + st.cl.l * dw, -dh / 2 + st.cl.t * dh, Math.max(0, dw * (1 - st.cl.l - st.cl.r)), Math.max(0, dh * (1 - st.cl.t - st.cl.b))); target.clip(); }
    target.globalAlpha = need ? 1 : alpha;
    if (HAS_FILTER) {
      let f = cssFilter(c, H);
      if (st.bl > 0.001) f = (f === 'none' ? '' : f + ' ') + `blur(${(st.bl * H).toFixed(1)}px)`;
      target.filter = f;
    }
    const cr = c.crop;
    if (cr && (cr.l || cr.t || cr.r || cr.b)) {
      const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
      const l = clamp(cr.l, 0, 0.9), tp = clamp(cr.t, 0, 0.9), rr = clamp(cr.r, 0, 0.9 - l), bb = clamp(cr.b, 0, 0.9 - tp);
      target.drawImage(src, l * sw, tp * sh, sw * (1 - l - rr), sh * (1 - tp - bb), -dw / 2 + l * dw, -dh / 2 + tp * dh, dw * (1 - l - rr), dh * (1 - tp - bb));
    } else target.drawImage(src, -dw / 2, -dh / 2, dw, dh);
    target.restore();
    if (scratch) {
      if (hasMask) this.applyMask(scratch, c, cx, cy, dw, dh, rot);
      applyOverlays(scratch, overlays, t);
      applyEffects(scratch, c.fx, lt);
      tctx.save(); if (blend) tctx.globalCompositeOperation = blend; tctx.globalAlpha = alpha; tctx.drawImage(scratch, 0, 0); tctx.restore();
      POOL.free(scratch);
    }
  }
}
