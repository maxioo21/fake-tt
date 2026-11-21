'use strict';
/* ============================================================
   Kadr Studio — silnik podglądu: elementy mediów, odtwarzanie, synchronizacja
   ============================================================ */
const Engine = {
  els: new Map(),   // clipId -> {el, last}
  R: null, canvas: null, dirty: true, raf: 0, lastTs: 0, wasPlaying: false,
  uiTick: 0,

  /* ---------- elementy wideo/audio dla klipów ---------- */
  getEl(c) {
    let e = this.els.get(c.id);
    const m = getMedia(c);
    if (!m) return null;
    if (e && e.url !== m.url) { this.drop(c.id); e = null; }
    if (!e) {
      const el = document.createElement(c.type === 'video' ? 'video' : 'audio');
      el.preload = 'auto'; el.src = m.url; el.playsInline = true; el.crossOrigin = 'anonymous';
      if (c.type === 'video') el.muted = true;   /* dźwięk wideo gra z tego samego elementu – odmutowujemy przy odtwarzaniu */
      el.addEventListener('seeked', () => this.invalidate());
      el.addEventListener('loadeddata', () => this.invalidate());
      e = { el, url: m.url, last: performance.now() };
      this.els.set(c.id, e);
      if (this.els.size > 12) this.evict();
    }
    e.last = performance.now();
    return e.el;
  },
  drop(id) {
    const e = this.els.get(id); if (!e) return;
    try { e.el.pause(); e.el.removeAttribute('src'); e.el.load(); } catch (x) { /* ignore */ }
    this.els.delete(id);
  },
  /* usuwa elementy mediów klipów, których już nie ma w projekcie */
  gc() { for (const id of [...this.els.keys()]) if (!byId(id)) this.drop(id); },
  evict() {
    const active = new Set(this.activeIds(S.time, 2));
    const arr = [...this.els.entries()].filter(([id]) => !active.has(id)).sort((a, b) => a[1].last - b[1].last);
    while (this.els.size > 10 && arr.length) this.drop(arr.shift()[0]);
  },
  activeIds(t, ahead = 0) {
    const ids = [];
    for (const c of clips) {
      if (c.type !== 'video' && c.type !== 'audio') continue;
      const pad = (c.trans && c.trans.id !== 'none' ? c.trans.dur : 0) / 2 + ahead;
      const prevPad = nextAdjacent(c) && nextAdjacent(c).trans && nextAdjacent(c).trans.id !== 'none' ? nextAdjacent(c).trans.dur / 2 : 0;
      if (t >= c.start - pad - 0.001 && t < clipEnd(c) + prevPad + 0.001) ids.push(c.id);
    }
    return ids;
  },

  /* dostawca źródeł dla Renderera */
  provider: {
    get(c, t) {
      const m = getMedia(c); if (!m) return null;
      if (c.type === 'image') return m.img ? { el: m.img, w: m.w, h: m.h } : null;
      if (c.type === 'video') {
        const el = Engine.getEl(c);
        if (!el || el.readyState < 2) return null;
        return { el, w: m.w || el.videoWidth, h: m.h || el.videoHeight };
      }
      return null;
    },
  },

  /* ---------- rozmiar podglądu ---------- */
  setupRenderer() {
    const [w, hh] = canvasSize(P.aspect, 720);
    /* podgląd w mniejszej rozdzielczości: dłuższy bok maks. 960 */
    const k = Math.min(1, 960 / Math.max(w, hh)) * (S.previewScale || 1);
    const W = Math.max(2, Math.round(w * k / 2) * 2), H = Math.max(2, Math.round(hh * k / 2) * 2);
    if (this.R && this.R.W === W && this.R.H === H) return;
    POOL.clear();
    this.R = new Renderer(W, H, this.provider);
    this.R.onAsync = () => this.invalidate();
    this.canvas = this.R.canvas;
    this.canvas.id = 'stageCanvas';
    const host = $('#stageHost');
    if (host) { const old = $('canvas', host); if (old) old.remove(); host.prepend(this.canvas); }
    this.layoutStage();
    this.invalidate();
  },
  layoutStage() {
    const box = $('#stageBox'), host = $('#stageHost');
    if (!box || !host || !this.R) return;
    const r = box.getBoundingClientRect();
    const ar = this.R.W / this.R.H, aw = r.width - 8, ah = r.height - 8;
    let w = aw, hh = aw / ar;
    if (hh > ah) { hh = ah; w = ah * ar; }
    host.style.width = Math.max(40, w) + 'px'; host.style.height = Math.max(40, hh) + 'px';
    Bus.emit('stage-layout');
  },
  invalidate() { this.dirty = true; },

  /* ---------- sterowanie ---------- */
  play() {
    const dur = projectDuration();
    if (!dur) return;
    if (S.time >= dur - 0.02) S.time = 0;
    try { if (getAC().state === 'suspended') getAC().resume(); } catch (e) { /* ignore */ }
    S.playing = true; this.lastTs = 0; Bus.emit('transport');
  },
  pause() { S.playing = false; this.pauseAll(); Bus.emit('transport'); this.invalidate(); },
  toggle() { S.stopAt = null; S.playing ? this.pause() : this.play(); },
  seek(t) {
    S.time = clamp(t, 0, Math.max(projectDuration(), 0.001) + 3600);
    this.invalidate(); Bus.emit('time');
  },
  pauseAll() { this.els.forEach((e) => { try { e.el.pause(); } catch (x) { /* ignore */ } }); },

  /* synchronizacja elementów mediów z osią czasu */
  sync() {
    const t = S.time, act = new Set(this.activeIds(t, S.playing ? 0.6 : 0));
    for (const c of clips) {
      if (c.type !== 'video' && c.type !== 'audio') continue;
      if (!act.has(c.id)) { const e = this.els.get(c.id); if (e && !e.el.paused) e.el.pause(); continue; }
      const el = this.getEl(c); if (!el) continue;
      const m = getMedia(c), dur = m.dur || el.duration || 1e9;
      const target = clamp(srcTime(c, t), 0, Math.max(0, dur - 0.04));
      const inside = t >= c.start && t < clipEnd(c);
      /* głośność */
      let vol = 0;
      if (inside && !c.mute && !(P.lanes && P.lanes.muted && P.lanes.muted[c.lane])) {
        vol = c.vol;
        const lt = t - c.start;
        if (c.fadeIn > 0 && lt < c.fadeIn) vol *= lt / c.fadeIn;
        if (c.fadeOut > 0 && lt > c.dur - c.fadeOut) vol *= Math.max(0, (c.dur - lt) / c.fadeOut);
      }
      el.volume = clamp(vol, 0, 1);
      if (c.type === 'video') el.muted = (vol <= 0.001) || !S.playing;
      if (S.playing && inside) {
        const rate = clamp(speedAt(c, t), 0.0625, 16);
        if (Math.abs(el.playbackRate - rate) > 0.001) el.playbackRate = rate;
        if (el.paused) { if (Math.abs(el.currentTime - target) > 0.08) el.currentTime = target; el.play().catch(() => {}); }
        else if (Math.abs(el.currentTime - target) > 0.35) el.currentTime = target;
      } else {
        if (!el.paused) el.pause();
        if (Math.abs(el.currentTime - target) > 0.03 && !el.seeking) { try { el.currentTime = target; } catch (e) { /* ignore */ } }
        else if (Math.abs(el.currentTime - target) > 0.03 && el.seeking) this._pendingSeek = true;
      }
    }
  },

  /* czy któryś aktywny klip wideo czeka na dane (wtedy zatrzymujemy zegar, żeby obraz nie uciekał dźwiękowi) */
  stalled() {
    const t = S.time;
    for (const c of clips) {
      if (c.type !== 'video' || t < c.start || t >= clipEnd(c)) continue;
      const e = this.els.get(c.id);
      if (e && e.el.readyState < 2 && !e.el.error) return true;
    }
    return false;
  },

  /* ---------- pętla ---------- */
  start() {
    const loop = (ts) => {
      this.raf = requestAnimationFrame(loop);
      if (S.playing) {
        if (!this.lastTs) this.lastTs = ts;
        const dt = Math.min(0.2, (ts - this.lastTs) / 1000); this.lastTs = ts;
        if (this.stalled() && (this.stallT = this.stallT || ts) && ts - this.stallT < 2500) { /* buforowanie */ } else { this.stallT = 0; S.time += dt; }
        const dur = projectDuration();
        if (S.time >= dur) { S.time = dur; this.pause(); Bus.emit('time'); }
        else if (S.stopAt != null && S.time >= S.stopAt) { S.stopAt = null; this.pause(); Bus.emit('time'); }
        this.dirty = true;
      }
      if (S.playing || this.dirty || this._pendingSeek) { this._pendingSeek = false; this.sync(); }
      if (this.dirty && this.R) {
        this.dirty = false;
        const r0 = performance.now();
        try { this.R.render(S.time); } catch (e) { console.error('render', e); }
        const ms = performance.now() - r0; this.ema = this.ema ? this.ema * 0.9 + ms * 0.1 : ms;
        if (S.playing && S.autoQ !== false && this.ema > 36 && S.previewScale > 0.5 && ts - (this.lastDown || 0) > 2500) {
          this.lastDown = ts; S.previewScale = Math.max(0.5, S.previewScale - 0.25); this.ema = 0; this.setupRenderer();
          toast('Obniżyłem jakość podglądu, żeby odtwarzanie było płynne (eksport zachowa pełną jakość)');
        }
        if (S.playing || ts - this.uiTick > 80) { this.uiTick = ts; Bus.emit('time'); }
      } else if (S.playing && ts - this.uiTick > 60) { this.uiTick = ts; Bus.emit('time'); }
    };
    this.raf = requestAnimationFrame(loop);
    window.addEventListener('resize', () => this.layoutStage());
    if (window.ResizeObserver) { const box = $('#stageBox'); if (box) new ResizeObserver(() => this.layoutStage()).observe(box); }
  },

  /* migawka aktualnej klatki podglądu */
  snapshot() {
    this.R.render(S.time);
    return new Promise((res) => this.canvas.toBlob(res, 'image/png'));
  },
};
