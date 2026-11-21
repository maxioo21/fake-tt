'use strict';
/* ============================================================
   Kadr Code — AI pisze kod animacji w dowolnym stylu, a aplikacja uruchamia go w bezpiecznej piaskownicy
   (Web Worker + OffscreenCanvas, bez dostępu do DOM, kluczy i sieci), renderuje klatki i koduje prawdziwe wideo.
   Błąd w kodzie wraca do AI w pętli naprawy — tak samo, jak pracuję ja: napisz, uruchom, popraw.
   ============================================================ */
const CodeAnim = (() => {
  /* ---- kod wykonywany w Workerze: biblioteka pomocnicza + wykonawca klatek ---- */
  const WORKER_SRC = String.raw`'use strict';
const __post = self.postMessage.bind(self);
['fetch','XMLHttpRequest','WebSocket','EventSource','importScripts','indexedDB','caches','Worker','SharedWorker','BroadcastChannel','WebTransport','postMessage','close'].forEach(function (k) { try { Object.defineProperty(self, k, { value: undefined, configurable: false, writable: false }); } catch (e) {} });
const PI = Math.PI, TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, map = (v, a, b, c, d) => c + (d - c) * ((v - a) / ((b - a) || 1)), fract = (v) => v - Math.floor(v), mod = (a, b) => ((a % b) + b) % b;
const ease = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }, easeIn = (k) => clamp(k, 0, 1) ** 3, easeOut = (k) => 1 - (1 - clamp(k, 0, 1)) ** 3;
const easeInOut = (k) => { k = clamp(k, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };
const easeOutBack = (k) => { k = clamp(k, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
const easeOutBounce = (k) => { k = clamp(k, 0, 1); const n1 = 7.5625, d1 = 2.75; if (k < 1 / d1) return n1 * k * k; if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75; if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375; return n1 * (k -= 2.625 / d1) * k + 0.984375; };
const easeOutElastic = (k) => { k = clamp(k, 0, 1); return k === 0 ? 0 : k === 1 ? 1 : 2 ** (-10 * k) * Math.sin((k * 10 - 0.75) * (TAU / 3)) + 1; };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const rand = (s) => hash(s * 1.37 + 7.1);
const noise = (x) => { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), f * f * (3 - 2 * f)); };
const noise2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), h = (a, b) => hash(a * 57.3 + b * 113.9); return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); };
const hsl = (h, s, l, a) => 'hsla(' + (((h % 360) + 360) % 360) + ',' + clamp(s, 0, 100) + '%,' + clamp(l, 0, 100) + '%,' + (a == null ? 1 : clamp(a, 0, 1)) + ')';
const rgba = (r, g, b, a) => 'rgba(' + (clamp(r, 0, 255) | 0) + ',' + (clamp(g, 0, 255) | 0) + ',' + (clamp(b, 0, 255) | 0) + ',' + (a == null ? 1 : clamp(a, 0, 1)) + ')';
function roundRect(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function star(ctx, cx, cy, r, n, inner) { ctx.beginPath(); for (let i = 0; i < (n || 5) * 2; i++) { const rr = i % 2 ? r * (inner == null ? 0.45 : inner) : r, a = -PI / 2 + i * PI / (n || 5); ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); }
function glow(ctx, color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function linGrad(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function radGrad(ctx, x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function text(ctx, str, x, y, size, color, o) { o = o || {}; ctx.save(); ctx.font = (o.italic ? 'italic ' : '') + (o.weight || 800) + ' ' + size + 'px "' + (o.font || 'Anton') + '", "Arial Black", sans-serif'; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.baseline || 'middle'; if (o.strokeW) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW; ctx.strokeStyle = o.stroke || '#000'; ctx.strokeText(str, x, y); } ctx.fillStyle = color || '#fff'; ctx.fillText(str, x, y); ctx.restore(); }
function project(x, y, z, o) { o = o || {}; const f = o.fx || 600, cx = o.cx || 0, cy = o.cy || 0, d = (o.dist || 600) + z, s = f / Math.max(1, d); return { x: cx + x * s, y: cy + y * s, s: s }; }
function rng(seed) { let a = (seed * 2654435761) >>> 0 || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let __draw = null, __ctx = null, __canvas = null, __gl = null, __W = 0, __H = 0, __dur = 0, __fps = 30, __isGL = false;
function __err(e, i) { try { __post({ type: 'error', message: String((e && e.message) || e).slice(0, 400), stack: String((e && e.stack) || '').split('\n').slice(0, 4).join(' | ').slice(0, 500), frame: i }); } catch (x) {} }
self.onmessage = function (ev) {
  const m = ev.data || {};
  if (m.cmd === 'init') {
    try {
      __W = m.W; __H = m.H; __dur = m.dur; __fps = m.fps; __isGL = /^\s*\/\/\s*@gl\b/.test(m.code);
      __canvas = new OffscreenCanvas(__W, __H);
      if (__isGL) { __gl = __canvas.getContext('webgl2'); if (!__gl) throw new Error('WebGL2 niedostępne w tej przeglądarce'); } else __ctx = __canvas.getContext('2d');
      const mod = new Function('canvas', 'ctx', 'gl', 'W', 'H', 'dur', 'fps', m.code + '\n;return { draw: typeof draw === "function" ? draw : null, setup: typeof setup === "function" ? setup : null };')(__canvas, __ctx, __gl, __W, __H, __dur, __fps);
      if (!mod.draw) throw new Error('Kod musi zdefiniować funkcję draw(ctx, t, W, H, dur)');
      if (mod.setup) mod.setup();
      __draw = mod.draw; __post({ type: 'ready' });
    } catch (e) { __err(e, -1); }
  } else if (m.cmd === 'frame') {
    try {
      const t = m.i / __fps;
      if (__ctx) { __ctx.setTransform(1, 0, 0, 1, 0, 0); __ctx.globalAlpha = 1; __ctx.globalCompositeOperation = 'source-over'; __ctx.shadowBlur = 0; __ctx.filter = 'none'; __ctx.fillStyle = '#000'; __ctx.fillRect(0, 0, __W, __H); __ctx.save(); __draw(__ctx, t, __W, __H, __dur, m.i); __ctx.restore(); }
      else __draw(null, t, __W, __H, __dur, m.i);
      const bm = __canvas.transferToImageBitmap();
      __post({ type: 'frame', i: m.i, bm: bm }, [bm]);
    } catch (e) { __err(e, m.i); }
  }
};`;
  class CodeError extends Error { constructor(msg, kind) { super(msg); this.kind = kind || 'runtime'; } }
  /* uruchamia kod w piaskownicy i udostępnia kolejne klatki jako ImageBitmap */
  function open(code, o) {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })), w = new Worker(url), timeout = o.timeout || API.timeout;
    let pending = null, dead = false, tm = 0;
    const fail = (e) => { if (pending) { const p = pending; pending = null; clearTimeout(tm); p.rej(e); } };
    const arm = () => { clearTimeout(tm); tm = setTimeout(() => { fail(new CodeError('Animacja nie odpowiada (nieskończona pętla albo zbyt wolny kod) — jedna klatka trwa dłużej niż ' + Math.round(timeout / 1000) + ' s', 'timeout')); close(); }, timeout); };
    const close = () => { if (dead) return; dead = true; clearTimeout(tm); try { w.terminate(); } catch (e) { /* ok */ } URL.revokeObjectURL(url); };
    w.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.type === 'ready' && pending && pending.kind === 'init') { const p = pending; pending = null; clearTimeout(tm); p.res(); }
      else if (m.type === 'frame' && pending && pending.kind === 'frame' && m.i === pending.i && typeof ImageBitmap !== 'undefined' && m.bm instanceof ImageBitmap) { const p = pending; pending = null; clearTimeout(tm); p.res(m.bm); }
      else if (m.type === 'error') fail(new CodeError((m.frame >= 0 ? 'Błąd w klatce ' + m.frame + ': ' : 'Błąd w kodzie: ') + m.message + (m.stack ? ' (' + m.stack + ')' : ''), 'runtime'));
    };
    w.onerror = (e) => { fail(new CodeError('Błąd piaskownicy: ' + (e.message || 'nieznany'), 'runtime')); close(); };
    const send = (kind, msg, i) => new Promise((res, rej) => { pending = { kind, res, rej, i }; arm(); w.postMessage(msg); });
    return { init: () => send('init', { cmd: 'init', code, W: o.W, H: o.H, dur: o.dur, fps: o.fps }), frame: (i) => send('frame', { cmd: 'frame', i, fps: o.fps }, i), close };
  }
  /* proste kontrole jakości: czy animacja nie jest pusta/statyczna */
  function probe(bm, sz = 48) { const cv = document.createElement('canvas'); cv.width = sz; cv.height = Math.max(8, Math.round(sz * bm.height / bm.width)); const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(bm, 0, 0, cv.width, cv.height); return x.getImageData(0, 0, cv.width, cv.height).data; }
  const lum = (d) => { let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; return s / (d.length / 4); };
  const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return s / (a.length / 4) / 3; };
  /* renderuje cały kod do wideo; zwraca { blob, container, w, h, thumbs, stats } albo rzuca CodeError */
  async function toVideo(code, o) {
    const fps = o.fps || 30, dur = Math.max(0.5, Math.min(60, o.dur || 5)), total = Math.max(1, Math.ceil(dur * fps)), sb = open(code, { W: o.W, H: o.H, dur, fps, timeout: o.timeout });
    const probes = {}, thumbs = [], marks = new Set([0, Math.floor(total * 0.5), total - 1]);
    try {
      await sb.init();
      const r = await encodeFrames(o.W, o.H, fps, total, async (i) => {
        const bm = await sb.frame(i);
        if (marks.has(i)) { probes[i] = probe(bm); const cv = document.createElement('canvas'); cv.width = 320; cv.height = Math.round(320 * o.H / o.W); cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height); thumbs.push(cv.toDataURL('image/jpeg', 0.8)); }
        return bm;
      }, o.cb);
      const ks = Object.keys(probes).map(Number).sort((a, b) => a - b), lm = ks.map((k) => lum(probes[k])), dd = ks.length > 1 ? Math.max(...ks.slice(1).map((k) => diff(probes[ks[0]], probes[k]))) : 0;
      const stats = { meanLum: lm.reduce((a, b) => a + b, 0) / lm.length, motion: dd };
      if (stats.meanLum < 2.5) throw new CodeError('Wszystkie klatki są czarne — nic nie zostało narysowane (sprawdź tło, współrzędne i kolory).', 'blank');
      if (total > 12 && stats.motion < 0.6) throw new CodeError('Animacja jest statyczna — obraz prawie się nie zmienia w czasie (animuj w funkcji t).', 'static');
      return Object.assign(r, { thumbs, stats });
    } finally { sb.close(); }
  }
  const API = { toVideo, CodeError, WORKER_SRC, probe, timeout: 8000 };
  return API;
})();

/* wspólne kodowanie klatek do MP4/WebM (używane przez sceny i kod z AI); getFrame(i) zwraca canvas albo ImageBitmap */
async function encodeFrames(W, H, fps, total, getFrame, cb) {
  if (!(window.VideoEncoder && window.VideoFrame)) throw new Error('ta przeglądarka nie koduje wideo (użyj aplikacji desktopowej, Chrome lub Edge)');
  const info = await Exporter.pickCodecs(W, H, fps, Exporter.bitrate(W, H, fps, 1), false);
  if (info.fail) throw new Error(info.label);
  const vopt = { codec: info.video.mux, width: W, height: H, frameRate: fps }, cont = info.video.container;
  const muxer = cont === 'mp4' ? new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: vopt, fastStart: 'in-memory', firstTimestampBehavior: 'offset' }) : new WebMMuxer.Muxer({ target: new WebMMuxer.ArrayBufferTarget(), video: vopt, firstTimestampBehavior: 'offset' });
  let err = null; const enc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { err = e; } }); enc.configure(info.video.cfg);
  try {
    for (let i = 0; i < total; i++) {
      if (err) throw err;
      const src = await getFrame(i), vf = new VideoFrame(src, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      enc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close(); if (src && src.close) src.close();
      while (enc.encodeQueueSize > 8) await sleep(4);
      if (i % 6 === 0) { if (cb) cb(i / total); await sleep(0); }
    }
    await enc.flush(); if (err) throw err; muxer.finalize();
  } catch (e) { try { enc.close(); } catch (x) { /* ok */ } throw e; }
  return { blob: new Blob([muxer.target.buffer], { type: cont === 'mp4' ? 'video/mp4' : 'video/webm' }), container: cont, w: W, h: H };
}
