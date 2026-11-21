'use strict';
/* ============================================================
   Kadr Studio — silnik renderowania klatek (Canvas 2D)
   ============================================================ */
const rgba = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };
const TEXT_FONTS = ['Montserrat', 'Anton', 'Bebas Neue', 'Playfair Display', 'Pacifico', 'Permanent Marker', 'Righteous', 'Caveat', 'Lobster', 'Space Grotesk'];
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/* ---------- sprite tekstu ---------- */
const TEXT_PER = ['letters', 'words', 'dropletters', 'wave', 'rainbow'];
function makeTextSprite(T, W, H, tfx) {
  const fs = Math.max(8, Math.round(T.size * Math.min(W, H)));
  let str = T.str == null ? '' : String(T.str);
  if (T.upper) str = str.toUpperCase();
  if (tfx && tfx.mode === 'typewriter') str = str.slice(0, Math.floor(clamp(tfx.p, 0, 1) * str.length));
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
  const per = !!(tfx && TEXT_PER.includes(tfx.mode));
  const pad = Math.ceil(fs * (0.25 + T.shadowB * 1.4) + lw + lw2 * 2 + hard + (T.bg ? fs * 0.35 : 0) + (per ? fs * 0.75 : 0));
  const w = Math.max(fs * 0.5, Math.ceil(tw + pad * 2)), hh = Math.max(fs, Math.ceil(lines.length * lh + pad * 2));
  const cv = mkCanvas(w, hh), x = cv.getContext('2d');
  x.font = font; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.miterLimit = 2;
  if (hasLS) x.letterSpacing = (T.spacing * fs) + 'px';
  if (T.bg) {
    const m = fs * 0.32, rx = fs * 0.22;
    x.fillStyle = rgba(T.bg, T.bgA);
    const bx = pad - m, by = pad - m * 0.8, bw = w - (pad - m) * 2, bh = hh - (pad - m * 0.8) * 2;
    x.beginPath();
    if (x.roundRect) x.roundRect(bx, by, bw, bh, rx); else x.rect(bx, by, bw, bh);
    x.fill();
  }
  const clearShadow = () => { x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0; };
  /* jedna „warstwowa” sztuka tekstu: twardy cień, obrys zewnętrzny, obrys, wypełnienie (opcjonalnie gradient) */
  const run = (txt, px, py, fillOver) => {
    const glow = T.shadowB > 0;
    const sh = () => { if (glow) { x.shadowColor = T.shadowC; x.shadowBlur = T.shadowB * fs; x.shadowOffsetY = T.shadowB * fs * 0.25; } };
    if (hard > 0) { x.fillStyle = T.hardC || '#000'; x.strokeStyle = T.hardC || '#000'; x.lineWidth = lw + lw2 * 2; x.fillText(txt, px + hard, py + hard); if (x.lineWidth > 0.4) x.strokeText(txt, px + hard, py + hard); }
    let first = true;
    const layer = (width, col) => { if (first) sh(); x.strokeStyle = col; x.lineWidth = width; x.strokeText(txt, px, py); if (first) { clearShadow(); first = false; } };
    if (lw2 > 0.4) layer(lw + lw2 * 2, T.out2C || '#000');
    if (lw > 0.4) layer(lw, T.strokeC);
    let fill = fillOver || T.color;
    if (!fillOver && T.fill2) { const g = x.createLinearGradient(0, py - fs * 0.55, 0, py + fs * 0.55); g.addColorStop(0, T.color); g.addColorStop(1, T.fill2); fill = g; }
    x.fillStyle = fill;
    if (first) sh();
    x.fillText(txt, px, py);
    if (first && T.shadowB > 0.35) x.fillText(txt, px, py);
    clearShadow();
  };
  x.textAlign = 'left';
  let g = 0, wi = 0;
  const totalChars = lines.reduce((n, l) => n + l.length, 0), totalWords = Math.max(1, str.split(/\s+/).filter(Boolean).length);
  lines.forEach((l, i) => {
    const y = pad + lh * (i + 0.5), lwid = mc.measureText(l).width;
    const left = T.align === 'left' ? pad : T.align === 'right' ? w - pad - lwid : w / 2 - lwid / 2;
    if (!per) { run(l, left, y); return; }
    for (let k = 0; k < l.length; k++) {
      const ch = l[k], px = left + mc.measureText(l.slice(0, k)).width, cw = mc.measureText(ch).width;
      let al = 1, sc = 1, yo = 0, fillOver = null;
      if (tfx.mode === 'letters') { const q = clamp(tfx.p * (totalChars + 5) - g, 0, 5) / 5; al = Math.min(1, q * 2); sc = q <= 0 ? 0 : ease.outBack(q); }
      else if (tfx.mode === 'dropletters') { const q = clamp(tfx.p * (totalChars + 5) - g, 0, 5) / 5; al = Math.min(1, q * 4); yo = -(1 - ease.outBounce(q)) * fs * 1.1; if (q <= 0) al = 0; }
      else if (tfx.mode === 'words') { const q = clamp(tfx.p * (totalWords + 2) - wi, 0, 2) / 2; al = q; sc = lerp(0.6, 1, ease.out(q)); yo = (1 - q) * fs * 0.3; }
      else if (tfx.mode === 'wave') yo = Math.sin(tfx.t * 5 + g * 0.55) * fs * 0.14;
      else if (tfx.mode === 'rainbow') fillOver = `hsl(${Math.floor((tfx.t * 120 + g * 25) % 360)},95%,62%)`;
      if (ch === ' ') wi++;
      g++;
      if (al <= 0.003 || ch === ' ') continue;
      x.save(); x.globalAlpha = al; x.translate(px + cw / 2, y + yo); x.scale(sc, sc); run(ch, -cw / 2, 0, fillOver); x.restore();
    }
  });
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
    const out = [];
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
  _cache(k, v) { this.sprites.set(k, v); if (this.sprites.size > 80) this.sprites.delete(this.sprites.keys().next().value); }

  /* geometria klipu (do ramki zaznaczenia) */
  clipBox(c, t) {
    const W = this.W, H = this.H, lt = (t == null ? S.time : t) - c.start;
    let ow, oh, base = 1;
    if (c.type === 'video' || c.type === 'image') { const m = getMedia(c); if (!m || !m.w) return null; ow = m.w; oh = m.h; base = Math.min(W / ow, H / oh); }
    else if (c.type === 'text') { const sp = this.textSprite(c, null); ow = sp.width; oh = sp.height; }
    else if (c.type === 'sticker') { const sp = this.stickerSprite(c); ow = sp.width; oh = sp.height; }
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
        const ai = c.animIn.id;
        if (['typewriter', 'letters', 'words', 'dropletters'].includes(ai)) { const d = Math.max(0.1, Math.min(c.animIn.dur, c.dur * 0.6)); if (lt < d) tfx = { mode: ai, p: clamp(lt / d, 0, 1) }; }
        if (!tfx && (c.animLoop.id === 'wave' || c.animLoop.id === 'rainbow')) tfx = { mode: c.animLoop.id, t: Math.max(0, lt), p: 1 };
      }
      src = this.textSprite(c, tfx); ow = src.width; oh = src.height;
    } else if (c.type === 'sticker') { src = this.stickerSprite(c); ow = src.width; oh = src.height; }
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
    target.scale((c.flipX ? -1 : 1) * st.fl, c.flipY ? -1 : 1);
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
