'use strict';
/* ============================================================
   Kadr Studio — stan projektu, historia, biblioteka mediów
   ============================================================ */
const LANES = [
  { id: 'v3', kind: 'v', label: 'Nakł. 2' },
  { id: 'v2', kind: 'v', label: 'Nakł. 1' },
  { id: 'v1', kind: 'v', label: 'Główna', main: true },
  { id: 'a1', kind: 'a', label: 'Audio 1' },
  { id: 'a2', kind: 'a', label: 'Audio 2' },
];
const VIS_ORDER = ['v1', 'v2', 'v3']; // od dołu do góry
const laneKind = (id) => (LANES.find((l) => l.id === id) || {}).kind;

const ASPECTS = {
  '16:9': [16, 9], '9:16': [9, 16], '1:1': [1, 1], '4:5': [4, 5], '3:4': [3, 4], '4:3': [4, 3], '21:9': [21, 9],
};

/* projekt */
const P = { name: 'Mój film', aspect: '16:9', fps: 30, bg: '#000000', bgBlur: false, markers: [], lanes: { hidden: {}, muted: {}, locked: {} } };
/* klipy (zmieniamy tablicę w miejscu, żeby referencje się nie psuły) */
const clips = [];
/* biblioteka mediów */
const media = new Map();
/* stan interfejsu */
const S = {
  time: 0, playing: false, sel: null, multi: [], zoom: 90, snap: true, magnet: true,
  tab: 'media', insTab: null, picker: null, demo: false, previewScale: 1,
};

/* ---------- domyślne wartości ---------- */
function defAdj() { return { brightness: 0, contrast: 0, saturation: 0, temp: 0, hue: 0, blur: 0, vignette: 0, grain: 0 }; }
function newClip(type, o = {}) {
  return Object.assign({
    id: uid(), type, lane: 'v1', start: 0, dur: 3, inPt: 0, speed: 1, media: null,
    x: 0, y: 0, scale: 1, rot: 0, opacity: 1, flipX: false, flipY: false,
    adj: defAdj(), filter: { id: 'none', amt: 1 }, fx: [],
    animIn: { id: 'none', dur: 0.6 }, animOut: { id: 'none', dur: 0.6 }, animLoop: { id: 'none', amt: 1 },
    trans: { id: 'none', dur: 0.7 },
    cut: { mode: 'none', key: '#00ff00', tol: 0.4, soft: 0.2, feather: 0.2, edge: 0, model: 0 },
    vol: 1, mute: false, fadeIn: 0, fadeOut: 0,
    blend: 'normal', crop: { l: 0, t: 0, r: 0, b: 0 }, mask: { id: 'none', x: 0, y: 0, s: 0.7, r: 0, f: 0.08, inv: false }, kf: {}, curve: 'none',
    text: null, sticker: null, overlay: null,
  }, o);
}
function defText(str = 'Twój tekst') {
  return { str, font: 'Montserrat', size: 0.085, color: '#ffffff', strokeC: '#000000', strokeW: 0.12, bg: '', bgA: 0.7, shadowC: '#000000', shadowB: 0.12, fill2: '', gradAng: 90, strokeA: 1, out2C: '#000000', out2W: 0, hardC: '#000000', hardD: 0, glowC: '#ffffff', glowB: 0.5, glowA: 0, glowCycle: false, strokeCycle: false, fillA: 1, fillMode: '', fill3: '', fillSpeed: 1, fillSpread: 1, spark: 0.5, sparkC: '#ffffff', shA: 1, shD: null, shAng: 90, blur: 0, ul: false, bgR: 0.22, bgP: 0.32, bold: true, italic: false, align: 'center', spacing: 0, lineH: 1.15, upper: false };
}

const byId = (id) => clips.find((c) => c.id === id);
const clipEnd = (c) => c.start + c.dur;
const isVisual = (c) => c.type !== 'audio';
const hasMedia = (c) => c.type === 'video' || c.type === 'image' || c.type === 'audio';
const getMedia = (c) => (c && c.media ? media.get(c.media) : null);
function projectDuration() { return clips.reduce((m, c) => Math.max(m, clipEnd(c)), 0); }
function laneClips(laneId) { return clips.filter((c) => c.lane === laneId).sort((a, b) => a.start - b.start); }
function laneEnd(laneId) { return clips.reduce((m, c) => (c.lane === laneId ? Math.max(m, clipEnd(c)) : m), 0); }
const srcTime = (c, t) => {
  if (c.curve && c.curve !== 'none' && typeof curveFns === 'function') { const f = curveFns(c.curve); if (f) return c.inPt + c.speed * c.dur * f.M((t - c.start) / c.dur); }
  return c.inPt + (t - c.start) * c.speed;
};
/* klatki kluczowe: c.kf[prop] = [{t (s od początku klipu), v}] */
function kfVal(c, prop, lt) {
  const pts = c.kf && c.kf[prop];
  if (!pts || !pts.length) return c[prop];
  if (lt <= pts[0].t) return pts[0].v;
  if (lt >= pts[pts.length - 1].t) return pts[pts.length - 1].v;
  for (let i = 1; i < pts.length; i++) if (lt <= pts[i].t) { const a = pts[i - 1], b = pts[i], k = (lt - a.t) / Math.max(1e-6, b.t - a.t); return lerp(a.v, b.v, k * k * (3 - 2 * k)); }
  return c[prop];
}
function kfHas(c, prop) { return !!(c.kf && c.kf[prop] && c.kf[prop].length); }
function kfAt(c, prop, lt) { return kfHas(c, prop) && c.kf[prop].some((p) => Math.abs(p.t - lt) < 0.035); }
/* ustawia wartość: gdy właściwość ma klatki kluczowe, wstawia/aktualizuje klatkę w bieżącym czasie */
function kfSet(c, prop, lt, v) {
  if (!kfHas(c, prop)) { c[prop] = v; return; }
  const pts = c.kf[prop], i = pts.findIndex((p) => Math.abs(p.t - lt) < 0.035);
  if (i >= 0) pts[i].v = v; else { pts.push({ t: Math.max(0, lt), v }); pts.sort((a, b) => a.t - b.t); }
}
function kfToggle(c, prop, lt) {
  if (!c.kf) c.kf = {};
  if (kfAt(c, prop, lt)) { c.kf[prop] = c.kf[prop].filter((p) => Math.abs(p.t - lt) >= 0.035); if (!c.kf[prop].length) delete c.kf[prop]; }
  else { const v = kfVal(c, prop, lt); if (!kfHas(c, prop)) c.kf[prop] = []; c.kf[prop].push({ t: Math.max(0, lt), v }); c.kf[prop].sort((a, b) => a.t - b.t); }
}
function kfShift(c, delta) { if (!c.kf) return; Object.keys(c.kf).forEach((k) => { c.kf[k] = c.kf[k].map((p) => ({ t: p.t - delta, v: p.v })).filter((p) => p.t >= -0.0001 || true); }); }
function srcLen(c) { return c.dur * c.speed; }
function maxSrcDur(c) { const m = getMedia(c); return (m && (c.type === 'video' || c.type === 'audio') && m.dur) ? m.dur : Infinity; }

/* wymiary płótna z proporcji i rozdzielczości (krótszy bok) */
function canvasSize(aspect, short) {
  const [a, b] = ASPECTS[aspect] || [16, 9];
  let w, hh;
  if (a >= b) { hh = short; w = short * a / b; } else { w = short; hh = short * b / a; }
  return [Math.round(w / 2) * 2, Math.round(hh / 2) * 2];
}
function projectAspectRatio() { const [a, b] = ASPECTS[P.aspect]; return a / b; }

/* poprzedni sąsiadujący klip (ta sama ścieżka, styka się końcem) */
function prevAdjacent(c) {
  let best = null;
  for (const o of clips) {
    if (o.lane !== c.lane || o.id === c.id) continue;
    if (Math.abs(clipEnd(o) - c.start) < 0.06) best = o;
  }
  return best;
}
function nextAdjacent(c) {
  for (const o of clips) { if (o.lane === c.lane && o.id !== c.id && Math.abs(clipEnd(c) - o.start) < 0.06) return o; }
  return null;
}
/* efektywny czas trwania przejścia */
function transDur(c, prev) {
  if (!c.trans || c.trans.id === 'none' || !prev) return 0;
  return Math.max(0.1, Math.min(c.trans.dur, prev.dur * 0.98, c.dur * 0.98));
}

/* ---------- magnetyczna ścieżka główna: klipy zawsze stykają się bez luk ---------- */
function packMain(byCenter) {
  if (!S.magnet) return;
  const lc = clips.filter((c) => c.lane === 'v1').sort((a, b) => (byCenter ? (a.start + a.dur / 2) - (b.start + b.dur / 2) : a.start - b.start));
  let t = 0;
  for (const c of lc) { c.start = t; t += c.dur; }
}
const isLocked = (laneId) => !!(P.lanes && P.lanes.locked && P.lanes.locked[laneId]);

/* ---------- umieszczanie klipów bez nakładania ---------- */
function resolveStart(c, laneId, desired, dur) {
  dur = dur == null ? c.dur : dur;
  const others = clips.filter((o) => o.lane === laneId && o.id !== c.id).sort((a, b) => a.start - b.start);
  desired = Math.max(0, desired);
  const fits = (s) => s >= -1e-6 && others.every((o) => s + dur <= o.start + 1e-6 || s >= clipEnd(o) - 1e-6);
  if (fits(desired)) return desired;
  const cands = [0];
  others.forEach((o) => { cands.push(clipEnd(o), o.start - dur); });
  let best = null, bd = 1e9;
  for (const s of cands) {
    if (s < -1e-6 || !fits(s)) continue;
    const d = Math.abs(s - desired);
    if (d < bd) { bd = d; best = s; }
  }
  return best == null ? laneEnd(laneId) : Math.max(0, best);
}
function laneFreeAt(laneId, start, dur, ignoreId) {
  return clips.every((o) => o.lane !== laneId || o.id === ignoreId || start + dur <= o.start + 1e-6 || start >= clipEnd(o) - 1e-6);
}
/* znajdź ścieżkę nakładek wolną w danym przedziale (tekst, naklejki, efekty) */
function freeOverlayLane(start, dur) {
  for (const id of ['v3', 'v2']) if (laneFreeAt(id, start, dur)) return id;
  return 'v3';
}

/* ---------- operacje na klipach ---------- */
function addClip(c, select = true) {
  clips.push(c);
  if (select) S.sel = c.id;
  return c;
}
function removeClip(id) {
  const i = clips.findIndex((c) => c.id === id);
  if (i >= 0) clips.splice(i, 1);
  S.multi = (S.multi || []).filter((x) => x !== id);
  if (S.sel === id) S.sel = S.multi.shift() || null;
}
function duplicateClip(c) {
  const d = clone(c); d.id = uid();
  d.start = resolveStart(d, c.lane, clipEnd(c));
  d.trans = { id: 'none', dur: 0.7 };
  clips.push(d); S.sel = d.id;
  return d;
}
function splitClip(c, t) {
  if (t <= c.start + 0.05 || t >= clipEnd(c) - 0.05) return null;
  const d1 = t - c.start;
  const b = clone(c); b.id = uid();
  b.start = t; b.dur = c.dur - d1; b.inPt = c.inPt + d1 * c.speed;
  b.trans = { id: 'none', dur: 0.7 };
  b.animIn = { id: 'none', dur: 0.6 };
  kfShift(b, d1);
  c.dur = d1; c.animOut = { id: 'none', dur: 0.6 };
  clips.push(b);
  return b;
}
function setSpeed(c, sp) {
  sp = clamp(sp, 0.1, 8);
  const len = srcLen(c);
  let nd = len / sp;
  const mx = maxSrcDur(c);
  if (isFinite(mx)) { const room = mx - c.inPt; if (len > room) nd = room / sp; }
  c.speed = sp; c.dur = Math.max(0.1, nd);
  c.start = resolveStart(c, c.lane, c.start);
}
function trimLeft(c, newStart) {
  const end = clipEnd(c);
  let ns = clamp(newStart, 0, end - 0.1);
  let delta = ns - c.start;
  if ((hasMedia(c) && c.type !== 'image') || c.type === 'scene') {
    const newIn = c.inPt + delta * c.speed;
    if (newIn < 0) { delta = -c.inPt / c.speed; ns = c.start + delta; }
    c.inPt = Math.max(0, c.inPt + delta * c.speed);
  }
  if (c.kf) kfShift(c, ns - c.start);
  c.start = ns; c.dur = end - ns;
}
function trimRight(c, newEnd) {
  let ne = Math.max(c.start + 0.1, newEnd);
  const mx = maxSrcDur(c);
  if (isFinite(mx)) ne = Math.min(ne, c.start + (mx - c.inPt) / c.speed);
  c.dur = ne - c.start;
}

/* ---------- dodawanie z biblioteki ---------- */
function addMediaClip(m, opts = {}) {
  const type = m.kind;
  const lane = opts.lane || (type === 'audio' ? 'a1' : 'v1');
  const dur = type === 'image' ? 4 : Math.max(0.2, m.dur);
  const c = newClip(type, { lane, media: m.id, dur });
  if (m.kind === 'video' && m.w) c.scale = 1;
  const desired = opts.start != null ? opts.start : laneEnd(lane);
  c.start = resolveStart(c, lane, desired);
  addClip(c);
  /* pierwszy klip w pustym projekcie ustawia proporcje */
  if (!opts.keepAspect && clips.length === 1 && (type === 'video' || type === 'image') && m.w) {
    const r = m.w / m.h;
    let best = '16:9', bd = 1e9;
    for (const k of ['16:9', '9:16', '1:1', '4:5', '3:4']) { const [a, b] = ASPECTS[k]; const d = Math.abs(Math.log(a / b / r)); if (d < bd) { bd = d; best = k; } }
    P.aspect = best;
  }
  return c;
}
function addTextClip(str, over) {
  const t = clamp(S.time, 0, 3600);
  const dur = 3;
  const lane = freeOverlayLane(t, dur);
  const c = newClip('text', { lane, start: resolveStart({ id: '' }, lane, t, dur), dur, text: Object.assign(defText(str), over || {}) });
  c.animIn = { id: 'fade', dur: 0.5 };
  addClip(c);
  return c;
}
function addStickerClip(emoji) {
  const t = clamp(S.time, 0, 3600);
  const dur = 3;
  const lane = freeOverlayLane(t, dur);
  const c = newClip('sticker', { lane, start: resolveStart({ id: '' }, lane, t, dur), dur, sticker: { emoji, size: 0.28 } });
  c.animIn = { id: 'pop', dur: 0.5 };
  addClip(c);
  return c;
}
const OV_COLORS = { leakSweep: '#ffd9a0', edgeGlow: '#ff2d55', rays: '#fff0c8', flashColor: '#00e5ff', flickerLight: '#ffd36b', shockwave: '#ffffff', pulseRing: '#7be8ff', speedRadial: '#ffffff', speedH: '#ffffff', glitter: '#fff2b0', scanBar: '#7bffb0' };
function addOverlayClip(id, start, dur) {
  const def = OVERLAYS[id]; if (!def) return null;
  const t = start == null ? clamp(S.time, 0, 3600) : start, d = dur || def.d, lane = freeOverlayLane(t, d);
  const c = newClip('overlay', { lane, start: resolveStart({ id: '' }, lane, t, d), dur: d, overlay: { id, color: OV_COLORS[id] || '#ffffff', amt: 1, speed: 1, seed: 1 + Math.floor(Math.random() * 60) } });
  addClip(c); return c;
}
function addShapeClip(shapeId) {
  const t = clamp(S.time, 0, 3600), dur = 3, lane = freeOverlayLane(t, dur);
  const c = newClip('sticker', { lane, start: resolveStart({ id: '' }, lane, t, dur), dur, sticker: { shape: shapeId, color: '#ffffff', size: 0.3 } });
  c.animIn = { id: 'pop', dur: 0.5 }; addClip(c); return c;
}
function addFxLayer(patch) {
  const t = clamp(S.time, 0, 3600);
  const dur = 3;
  const lane = freeOverlayLane(t, dur);
  const c = newClip('fx', { lane, start: resolveStart({ id: '' }, lane, t, dur), dur });
  Object.assign(c, patch || {});
  addClip(c);
  return c;
}

/* ---------- historia (cofnij / ponów) ---------- */
const HIST = { undo: [], redo: [], last: '' };
function snapshot() { return JSON.stringify({ P, clips }); }
function commit() {
  packMain();
  const s = snapshot();
  if (s !== HIST.last) {
    if (HIST.last) { HIST.undo.push(HIST.last); if (HIST.undo.length > 120) HIST.undo.shift(); }
    HIST.redo.length = 0; HIST.last = s;
  }
  Bus.emit('change');
}
function restore(s) {
  const o = JSON.parse(s);
  Object.keys(P).forEach((k) => delete P[k]);
  Object.assign(P, o.P);
  clips.length = 0; o.clips.forEach((c) => clips.push(c));
  if (S.sel && !byId(S.sel)) S.sel = null;
  S.multi = (S.multi || []).filter((id) => byId(id));
  if (!P.lanes) P.lanes = { hidden: {}, muted: {}, locked: {} };
  HIST.last = s;
  Bus.emit('change'); Bus.emit('project');
}
function undo() { if (!HIST.undo.length) return; HIST.redo.push(HIST.last); restore(HIST.undo.pop()); }
function redo() { if (!HIST.redo.length) return; HIST.undo.push(HIST.last); restore(HIST.redo.pop()); }
function resetHistory() { HIST.undo.length = 0; HIST.redo.length = 0; HIST.last = snapshot(); }

/* ---------- import mediów ---------- */
const fileKind = (f) => {
  const t = f.type || '';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('audio/')) return 'audio';
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  if (['mp4', 'mov', 'webm', 'mkv', 'm4v', 'avi'].includes(ext)) return 'video';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'].includes(ext)) return 'audio';
  return null;
};

function drawCover(ctx, src, sw, sh, dw, dh) {
  const s = Math.max(dw / sw, dh / sh);
  const w = sw * s, hh = sh * s;
  ctx.drawImage(src, (dw - w) / 2, (dh - hh) / 2, w, hh);
}

async function probeVideo(m) {
  const v = document.createElement('video');
  v.preload = 'auto'; v.muted = true; v.playsInline = true; v.src = m.url;
  await once(v, 'loadedmetadata', 15000);
  if (!isFinite(v.duration)) {
    v.currentTime = 1e7;
    await once(v, 'timeupdate', 8000).catch(() => {});
    v.currentTime = 0;
  }
  m.dur = isFinite(v.duration) ? v.duration : 5;
  m.w = v.videoWidth; m.h = v.videoHeight;
  /* pasek miniatur */
  const N = clamp(Math.ceil(m.dur / 1.5), 4, 12);
  const fh = 72, fw = Math.max(24, Math.round(fh * (m.w / m.h)));
  const strip = mkCanvas(fw * N, fh), sx = strip.getContext('2d');
  for (let i = 0; i < N; i++) {
    const t = Math.min(m.dur - 0.05, (i + 0.5) / N * m.dur);
    try {
      if (Math.abs(v.currentTime - t) > 0.001) { v.currentTime = t; await once(v, 'seeked', 6000); }
      sx.save(); sx.translate(i * fw, 0); sx.beginPath(); sx.rect(0, 0, fw, fh); sx.clip();
      drawCover(sx, v, m.w, m.h, fw, fh); sx.restore();
    } catch (e) { /* pomijamy klatkę */ }
  }
  m.strip = strip.toDataURL('image/jpeg', 0.6); m.stripN = N; m.stripAR = fw / fh;
  /* miniatura biblioteki: kadr ze środka paska (przycięty do 16:10) */
  const mid = Math.floor(N / 2);
  const f0 = mkCanvas(fw, fh); f0.getContext('2d').drawImage(strip, mid * fw, 0, fw, fh, 0, 0, fw, fh);
  const t1 = mkCanvas(160, 100); drawCover(t1.getContext('2d'), f0, fw, fh, 160, 100);
  m.thumb = t1.toDataURL('image/jpeg', 0.7);
  v.removeAttribute('src'); v.load();
}

async function computePeaks(m) {
  try {
    if (m.file && m.file.size > 260e6) { m.peaks = null; return; }
    const buf = await m.file.arrayBuffer();
    const ab = await getAC().decodeAudioData(buf);
    m.hasAudio = true;
    const ch = ab.getChannelData(0);
    const rate = 100, n = Math.max(1, Math.ceil(ab.duration * rate));
    const peaks = new Float32Array(n), step = ab.sampleRate / rate;
    for (let i = 0; i < n; i++) {
      let mx = 0; const s = Math.floor(i * step), e = Math.min(ch.length, Math.floor((i + 1) * step));
      for (let j = s; j < e; j += 6) { const v = Math.abs(ch[j]); if (v > mx) mx = v; }
      peaks[i] = mx;
    }
    m.peaks = peaks; m.audioDur = ab.duration;
    Bus.emit('media');
  } catch (e) {
    if (m.kind === 'video') m.hasAudio = false;
  }
}

async function importFile(file, opts = {}) {
  const kind = fileKind(file);
  if (!kind) return null;
  const url = URL.createObjectURL(file);
  const m = { id: uid(), kind, name: file.name, file, url, dur: 0, w: 0, h: 0, thumb: null, strip: null, peaks: null, hasAudio: kind !== 'image', gen: !!opts.gen };
  try {
    if (kind === 'image') {
      const img = await loadImage(url);
      m.img = img; m.w = img.naturalWidth; m.h = img.naturalHeight;
      const t = mkCanvas(160, 100); drawCover(t.getContext('2d'), img, m.w, m.h, 160, 100);
      m.thumb = t.toDataURL('image/jpeg', 0.72);
    } else if (kind === 'video') {
      await probeVideo(m);
      computePeaks(m);
    } else {
      const a = document.createElement('audio'); a.preload = 'metadata'; a.src = url;
      await once(a, 'loadedmetadata', 12000);
      m.dur = isFinite(a.duration) ? a.duration : 0;
      if (!m.dur) await computePeaks(m); else computePeaks(m);
      if (!m.dur && m.audioDur) m.dur = m.audioDur;
    }
  } catch (e) {
    console.warn(e);
    URL.revokeObjectURL(url);
    toast('Nie mogę odczytać pliku „' + file.name + '". Spróbuj innego formatu (np. MP4/WebM, JPG/PNG, MP3/WAV).', 'err');
    return null;
  }
  media.set(m.id, m);
  Bus.emit('media');
  return m;
}
