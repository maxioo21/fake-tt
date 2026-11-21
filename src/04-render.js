'use strict';
/* ============================================================
   Kadr Studio — silnik renderowania klatek (Canvas 2D)
   ============================================================ */
const rgba = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };
const TEXT_FONTS = ['Montserrat', 'Anton', 'Bebas Neue', 'Playfair Display', 'Pacifico', 'Permanent Marker', 'Righteous', 'Caveat', 'Lobster', 'Space Grotesk'];
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/* ---------- sprite tekstu ---------- */
function makeTextSprite(T, W, H, vis) {
  const fs = Math.max(8, Math.round(T.size * Math.min(W, H)));
  let str = T.str == null ? '' : String(T.str);
  if (T.upper) str = str.toUpperCase();
  if (vis != null) str = str.slice(0, vis);
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
  const lw = T.strokeW * fs;
  const pad = Math.ceil(fs * (0.25 + T.shadowB * 1.4) + lw + (T.bg ? fs * 0.35 : 0));
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
  const ax = T.align === 'left' ? pad : T.align === 'right' ? w - pad : w / 2;
  x.textAlign = T.align === 'left' ? 'left' : T.align === 'right' ? 'right' : 'center';
  lines.forEach((l, i) => {
    const y = pad + lh * (i + 0.5);
    if (T.shadowB > 0) { x.shadowColor = T.shadowC; x.shadowBlur = T.shadowB * fs; x.shadowOffsetY = T.shadowB * fs * 0.25; }
    if (lw > 0.4) {
      x.strokeStyle = T.strokeC; x.lineWidth = lw; x.strokeText(l, ax, y);
      x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
    }
    x.fillStyle = T.color; x.fillText(l, ax, y);
    x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
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
  textSprite(c, vis) {
    if (typeof FontLoader !== 'undefined' && !this.exporting) FontLoader.ensure(c.text.font, c.text.bold);
    const key = 'T' + JSON.stringify([c.text, vis, this.W, this.H]);
    let s = this.sprites.get(key);
    if (!s) { s = makeTextSprite(c.text, this.W, this.H, vis); this._cache(key, s); }
    return s;
  }
  stickerSprite(c) {
    const key = 'S' + JSON.stringify([c.sticker, this.W, this.H]);
    let s = this.sprites.get(key);
    if (!s) { s = makeStickerSprite(c.sticker, this.W, this.H); this._cache(key, s); }
    return s;
  }
  _cache(k, v) { this.sprites.set(k, v); if (this.sprites.size > 80) this.sprites.delete(this.sprites.keys().next().value); }

  /* geometria klipu (do ramki zaznaczenia) */
  clipBox(c) {
    const W = this.W, H = this.H;
    let ow, oh, base = 1;
    if (c.type === 'video' || c.type === 'image') { const m = getMedia(c); if (!m || !m.w) return null; ow = m.w; oh = m.h; base = Math.min(W / ow, H / oh); }
    else if (c.type === 'text') { const sp = this.textSprite(c, null); ow = sp.width; oh = sp.height; }
    else if (c.type === 'sticker') { const sp = this.stickerSprite(c); ow = sp.width; oh = sp.height; }
    else return null;
    return { cx: W / 2 + c.x * W, cy: H / 2 + c.y * H, w: ow * base * c.scale, h: oh * base * c.scale, rot: c.rot * Math.PI / 180 };
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
  drawClip(tctx, c, t, o = {}) {
    if (c.type === 'fx') { if (tctx === this.ctx) this.drawFxLayer(c, t); return; }
    const W = this.W, H = this.H, lt = t - c.start;
    const st = animState(c, lt, o);
    const alpha = c.opacity * st.al;
    if (alpha < 0.003) return;
    let src = null, ow, oh;
    if (c.type === 'text') {
      let vis = null;
      if (!o.trans && c.animIn.id === 'typewriter') {
        const d = Math.max(0.1, Math.min(c.animIn.dur, c.dur * 0.6));
        vis = Math.floor(clamp(lt / d, 0, 1) * String(c.text.str).length);
      }
      src = this.textSprite(c, vis); ow = src.width; oh = src.height;
    } else if (c.type === 'sticker') { src = this.stickerSprite(c); ow = src.width; oh = src.height; }
    else {
      const s = this.provider.get(c, t);
      if (!s) return;
      src = s.el; ow = s.w; oh = s.h;
      if (c.cut.mode !== 'none') { const cc = this.cutout(c, src, ow, oh, t); if (cc) src = cc; }
    }
    if (!ow || !oh) return;
    const base = (c.type === 'video' || c.type === 'image') ? Math.min(W / ow, H / oh) : 1;
    const dw = ow * base * c.scale * st.s, dh = oh * base * c.scale * st.s;
    const cx = W / 2 + (c.x + st.dx) * W, cy = H / 2 + (c.y + st.dy) * H, rot = c.rot * Math.PI / 180 + st.r;
    const overlays = overlayList(c), need = c.fx.length > 0 || overlays.length > 0;
    let target = tctx, scratch = null;
    if (need) { scratch = POOL.get(W, H); target = scratch.getContext('2d'); }
    target.save();
    target.translate(cx, cy); target.rotate(rot);
    target.scale((c.flipX ? -1 : 1) * st.fl, c.flipY ? -1 : 1);
    target.globalAlpha = need ? 1 : alpha;
    if (HAS_FILTER) {
      let f = cssFilter(c, H);
      if (st.bl > 0.001) f = (f === 'none' ? '' : f + ' ') + `blur(${(st.bl * H).toFixed(1)}px)`;
      target.filter = f;
    }
    target.drawImage(src, -dw / 2, -dh / 2, dw, dh);
    target.restore();
    if (scratch) {
      applyOverlays(scratch, overlays, t);
      applyEffects(scratch, c.fx, lt);
      tctx.save(); tctx.globalAlpha = alpha; tctx.drawImage(scratch, 0, 0); tctx.restore();
      POOL.free(scratch);
    }
  }
}
