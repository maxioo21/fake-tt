'use strict';
/* ============================================================
   Kadr Studio — eksport wideo (WebCodecs + MP4/WebM)
   Deterministyczny: każda klatka jest renderowana osobno,
   dźwięk miksowany offline, więc wynik nie zależy od szybkości komputera.
   ============================================================ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const Exporter = {
  cancel: false, running: false, result: null,
  opts: { res: 1080, fps: 30, quality: 1, audio: true },
  RES: [[480, '480p'], [720, '720p (HD)'], [1080, '1080p (Full HD)'], [1440, '1440p (2K)'], [2160, '2160p (4K)']],

  /* ---------- okno dialogowe ---------- */
  open() {
    if (!clips.length) { toast('Najpierw dodaj coś do projektu'); return; }
    Engine.pause();
    this.opts.fps = P.fps; this.cancel = false; this.result = null;
    this.render();
    $('#modal').hidden = false;
    this.detect().then((info) => { this.info = info; const el = $('#expInfo'); if (el) el.textContent = info.label; });
  },
  close() { if (this.running) return; $('#modal').hidden = true; if (this.result) { URL.revokeObjectURL(this.result.url); this.result = null; } },
  dims() { return canvasSize(P.aspect, this.opts.res); },
  estimate() {
    const [w, hh] = this.dims(), br = this.bitrate(w, hh, this.opts.fps, this.opts.quality), dur = projectDuration();
    return { w, hh, mb: br * dur / 8 / 1e6, br };
  },
  bitrate(w, hh, fps, q) { return Math.round(w * hh * fps * [0.05, 0.085, 0.14][q]); },
  render() {
    const m = $('#modal'); m.innerHTML = '';
    const o = this.opts;
    const dlg = h('div', { class: 'dialog', role: 'dialog', 'aria-label': 'Eksport' });
    const seg = (key, items) => h('div', { class: 'seg wrap' }, items.map(([v, t]) => h('button', { class: o[key] === v ? 'on' : '', onclick: () => { o[key] = v; this.render(); this.updateInfo(); } }, t)));
    const [w, hh] = this.dims(), est = this.estimate();
    dlg.append(
      h('div', { class: 'dlg-head' }, h('h3', {}, 'Eksportuj film'), h('button', { class: 'tb', onclick: () => this.close(), html: icon('x', 18), title: 'Zamknij' })),
      h('div', { class: 'dlg-body' },
        h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Rozdzielczość')), seg('res', this.RES)),
        h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Klatki na sekundę')), seg('fps', [[24, '24'], [25, '25'], [30, '30'], [50, '50'], [60, '60']])),
        h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Jakość')), seg('quality', [[0, 'Mniejszy plik'], [1, 'Zalecana'], [2, 'Najwyższa']])),
        F.toggle('Dołącz dźwięk', () => o.audio, (v) => { o.audio = v; this.updateInfo(); }),
        h('div', { class: 'sum' }, h('b', {}, `${w}×${hh}`), h('span', {}, ` · ${o.fps} kl./s · ok. ${est.mb < 1 ? '<1' : est.mb.toFixed(1)} MB · ${fmtDur(projectDuration())}`)),
        h('p', { class: 'hint', id: 'expInfo' }, this.info ? this.info.label : 'Sprawdzam obsługiwane formaty…'),
        h('div', { class: 'hint' }, 'Eksport renderuje każdą klatkę osobno, więc trwa zwykle dłużej niż sam film – zostaw tę kartę otwartą.'),
      ),
      h('div', { class: 'dlg-foot' }, F.btn('Anuluj', () => this.close(), ''), F.btn('Eksportuj', () => this.start(), 'primary', 'download')),
    );
    m.append(h('div', { class: 'scrim', onclick: () => this.close() }), dlg);
  },
  updateInfo() {
    this.detect().then((info) => { this.info = info; const el = $('#expInfo'); if (el) el.textContent = info.label; });
  },

  /* ---------- wykrywanie kodeków ---------- */
  avcCodec(w, hh, fps) {
    const mbs = Math.ceil(w / 16) * Math.ceil(hh / 16), rate = mbs * fps;
    if (mbs <= 1620 && rate <= 40500) return 'avc1.64001e';   // 3.0
    if (mbs <= 3600 && rate <= 108000) return 'avc1.64001f';  // 3.1
    if (mbs <= 8192 && rate <= 245760) return 'avc1.640028';  // 4.0
    if (mbs <= 8704 && rate <= 522240) return 'avc1.64002a';  // 4.2
    if (mbs <= 36864 && rate <= 983040) return 'avc1.640033'; // 5.1
    return 'avc1.640034';                                     // 5.2
  },
  async pickCodecs(w, hh, fps, br, wantAudio) {
    const res = { label: '', video: null, audio: null };
    if (!(window.VideoEncoder && window.VideoFrame)) { res.label = 'Ta przeglądarka nie obsługuje eksportu wideo (WebCodecs). Użyj Chrome, Edge lub aktualnej Opery.'; res.fail = true; return res; }
    const base = { width: w, height: hh, bitrate: br, framerate: fps };
    let audioCfgs = [];
    if (wantAudio && window.AudioEncoder) audioCfgs = [['aac', 'mp4a.40.2'], ['opus', 'opus']];
    /* MP4 (H.264) */
    if (window.Mp4Muxer) {
      try {
        const cfg = Object.assign({ codec: this.avcCodec(w, hh, fps), avc: { format: 'avc' }, latencyMode: 'quality' }, base);
        const s = await VideoEncoder.isConfigSupported(cfg);
        if (s.supported) {
          res.video = { cfg, mux: 'avc', container: 'mp4' };
          for (const [mname, codec] of audioCfgs) {
            const ac = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 };
            try { const a = await AudioEncoder.isConfigSupported(ac); if (a.supported) { res.audio = { cfg: ac, mux: mname }; break; } } catch (e) { /* dalej */ }
          }
          res.label = 'Format: MP4 (H.264' + (res.audio ? ' + ' + (res.audio.mux === 'aac' ? 'AAC' : 'Opus') : '') + ') – działa wszędzie.';
          return res;
        }
      } catch (e) { /* dalej */ }
    }
    /* WebM (VP9 / VP8) */
    if (window.WebMMuxer) {
      const level = w * hh <= 2100000 ? '41' : '51';
      for (const [codec, mux] of [['vp09.00.' + level + '.08', 'V_VP9'], ['vp8', 'V_VP8']]) {
        try {
          const cfg = Object.assign({ codec, latencyMode: 'quality' }, base);
          const s = await VideoEncoder.isConfigSupported(cfg);
          if (s.supported) {
            res.video = { cfg, mux, container: 'webm' };
            if (wantAudio && window.AudioEncoder) {
              const ac = { codec: 'opus', sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 };
              try { const a = await AudioEncoder.isConfigSupported(ac); if (a.supported) res.audio = { cfg: ac, mux: 'A_OPUS' }; } catch (e) { /* bez dźwięku */ }
            }
            res.label = 'Format: WebM (' + (mux === 'V_VP9' ? 'VP9' : 'VP8') + (res.audio ? ' + Opus' : '') + '). Ta przeglądarka nie koduje H.264, więc powstanie WebM.';
            return res;
          }
        } catch (e) { /* dalej */ }
      }
    }
    res.fail = true; res.label = 'Nie znaleziono obsługiwanego kodeka wideo dla tej rozdzielczości. Zmniejsz rozdzielczość lub użyj Chrome/Edge.';
    return res;
  },
  async detect() {
    const [w, hh] = this.dims();
    return this.pickCodecs(w, hh, this.opts.fps, this.bitrate(w, hh, this.opts.fps, this.opts.quality), this.opts.audio);
  },

  /* ---------- miks dźwięku (offline) ---------- */
  async mixAudio(dur) {
    const sr = 48000;
    const list = clips.filter((c) => (c.type === 'audio' || c.type === 'video') && !c.mute && c.vol > 0 && getMedia(c) && getMedia(c).hasAudio !== false);
    if (!list.length) return null;
    const ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(dur * sr)), sr), cache = new Map();
    let used = 0;
    for (const c of list) {
      const m = getMedia(c);
      if (!cache.has(m.id)) {
        let buf = null;
        try { buf = await ctx.decodeAudioData(await m.file.arrayBuffer()); } catch (e) { buf = null; }
        cache.set(m.id, buf);
      }
      const buf = cache.get(m.id); if (!buf) continue;
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = c.speed;
      const g = ctx.createGain(), t0 = c.start;
      const fi = Math.min(c.fadeIn, c.dur / 2), fo = Math.min(c.fadeOut, c.dur / 2);
      if (fi > 0) { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(c.vol, t0 + fi); } else g.gain.setValueAtTime(c.vol, t0);
      if (fo > 0) { g.gain.setValueAtTime(c.vol, t0 + c.dur - fo); g.gain.linearRampToValueAtTime(0, t0 + c.dur); }
      src.connect(g); g.connect(ctx.destination);
      src.start(t0, Math.max(0, c.inPt), c.dur * c.speed); src.stop(t0 + c.dur);
      used++;
    }
    if (!used) return null;
    return ctx.startRendering();
  },

  /* ---------- eksport ---------- */
  async start() {
    if (this.running) return;
    const o = this.opts, [W, H] = this.dims(), fps = o.fps, br = this.bitrate(W, H, fps, o.quality), dur = projectDuration();
    const info = await this.pickCodecs(W, H, fps, br, o.audio);
    if (info.fail) { toast(info.label, 'err'); return; }
    this.running = true; this.cancel = false;
    const m = $('#modal'); m.innerHTML = '';
    const bar = h('div', { class: 'bar' }, h('i', { id: 'expBar' }));
    const status = h('p', { id: 'expStatus', class: 'hint' }, 'Przygotowuję…');
    const dlg = h('div', { class: 'dialog' }, h('div', { class: 'dlg-head' }, h('h3', {}, 'Eksportuję…')), h('div', { class: 'dlg-body' }, bar, status, h('p', { class: 'hint' }, 'Nie zamykaj tej karty. Możesz anulować w każdej chwili.')),
      h('div', { class: 'dlg-foot' }, F.btn('Anuluj eksport', () => { this.cancel = true; }, '')));
    m.append(h('div', { class: 'scrim' }), dlg);
    const setP = (p, txt) => { const b = $('#expBar'); if (b) b.style.width = Math.round(p * 100) + '%'; const s = $('#expStatus'); if (s) s.textContent = txt; };
    const prov = this.makeProvider();
    const R = new Renderer(W, H, prov); R.exporting = true;
    const cleanup = () => { prov.dispose(); this.running = false; POOL.clear(); };
    try {
      /* czcionki użyte w napisach */
      setP(0, 'Ładowanie czcionek…');
      for (const c of clips) if (c.type === 'text') { try { await document.fonts.load(`${c.text.bold ? 700 : 400} 40px "${c.text.font}"`); } catch (e) { /* ignoruj */ } }
      /* dźwięk */
      let audioBuf = null;
      if (o.audio && info.audio) { setP(0, 'Miksowanie dźwięku…'); audioBuf = await this.mixAudio(dur); }
      /* muxer */
      let muxer, container = info.video.container;
      const vopt = { codec: info.video.mux, width: W, height: H, frameRate: fps };
      if (container === 'mp4') {
        muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: vopt, audio: audioBuf ? { codec: info.audio.mux, numberOfChannels: 2, sampleRate: 48000 } : undefined, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
      } else {
        muxer = new WebMMuxer.Muxer({ target: new WebMMuxer.ArrayBufferTarget(), video: vopt, audio: audioBuf ? { codec: 'A_OPUS', numberOfChannels: 2, sampleRate: 48000 } : undefined, firstTimestampBehavior: 'offset' });
      }
      let encErr = null;
      const venc = new VideoEncoder({ output: (ch, meta) => muxer.addVideoChunk(ch, meta), error: (e) => { encErr = e; } });
      venc.configure(info.video.cfg);
      let aenc = null;
      if (audioBuf) { aenc = new AudioEncoder({ output: (ch, meta) => muxer.addAudioChunk(ch, meta), error: (e) => { encErr = e; } }); aenc.configure(info.audio.cfg); }
      const L = audioBuf ? audioBuf.getChannelData(0) : null, Rr = audioBuf ? audioBuf.getChannelData(Math.min(1, audioBuf.numberOfChannels - 1)) : null;
      let apos = 0;
      const feedAudio = (upTo) => {
        if (!audioBuf) return;
        const end = Math.min(audioBuf.length, Math.floor(upTo * 48000));
        while (apos < end) {
          const n = Math.min(4800, audioBuf.length - apos), d = new Float32Array(n * 2);
          d.set(L.subarray(apos, apos + n), 0); d.set(Rr.subarray(apos, apos + n), n);
          const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(apos / 48000 * 1e6), data: d });
          aenc.encode(ad); ad.close(); apos += n;
        }
      };
      const total = Math.max(1, Math.ceil(dur * fps)), usesAI = clips.some((c) => c.cut.mode === 'ai');
      const t0 = performance.now();
      for (let i = 0; i < total; i++) {
        if (this.cancel) break;
        if (encErr) throw encErr;
        const t = i / fps;
        for (const c of R.drawnClips(t)) if (c.type === 'video') await prov.seek(c, t);
        if (usesAI) await R.prepareAI(t);
        R.render(t);
        const vf = new VideoFrame(R.canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
        venc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close();
        feedAudio(t + 0.4);
        while (venc.encodeQueueSize > 8) await sleep(4);
        if (i % 3 === 0) {
          const el = (performance.now() - t0) / 1000, p = (i + 1) / total, eta = el / p - el;
          setP(p * 0.97, `Klatka ${i + 1} z ${total} · ${Math.round(p * 100)}% · pozostało ok. ${eta < 90 ? Math.ceil(eta) + ' s' : Math.ceil(eta / 60) + ' min'}`);
          await sleep(0);
        }
      }
      if (this.cancel) { try { venc.close(); aenc && aenc.close(); } catch (e) { /* ignoruj */ } cleanup(); this.running = false; this.close(); toast('Eksport anulowany'); return; }
      feedAudio(dur + 1);
      setP(0.98, 'Kończenie pliku…');
      await venc.flush(); if (aenc) await aenc.flush();
      if (encErr) throw encErr;
      muxer.finalize();
      const blob = new Blob([muxer.target.buffer], { type: container === 'mp4' ? 'video/mp4' : 'video/webm' });
      cleanup();
      this.result = { blob, url: URL.createObjectURL(blob), name: (P.name || 'film').replace(/[^\w\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]+/g, '').trim().replace(/\s+/g, '-') + '.' + container, container, w: W, h: H, secs: ((performance.now() - t0) / 1000) };
      this.done();
    } catch (e) {
      console.error(e); cleanup();
      this.running = false;
      this.render(); toast('Eksport nie powiódł się: ' + (e && e.message ? e.message : 'nieznany błąd'), 'err');
    }
  },
  done() {
    const r = this.result, m = $('#modal'); m.innerHTML = '';
    const vid = h('video', { src: r.url, controls: true, playsinline: true, class: 'exp-prev' });
    m.append(h('div', { class: 'scrim', onclick: () => this.close() }), h('div', { class: 'dialog' },
      h('div', { class: 'dlg-head' }, h('h3', {}, 'Film gotowy'), h('button', { class: 'tb', onclick: () => this.close(), html: icon('x', 18), title: 'Zamknij' })),
      h('div', { class: 'dlg-body' }, vid, h('p', { class: 'hint' }, `${r.name} · ${r.w}×${r.h} · ${(r.blob.size / 1e6).toFixed(1)} MB · wyrenderowano w ${r.secs.toFixed(0)} s`)),
      h('div', { class: 'dlg-foot' }, F.btn('Zamknij', () => this.close(), ''), F.btn('Zapisz plik', async () => { if (await saveFile(r.name, r.blob)) toast('Zapisano ' + r.name); }, 'primary', 'download'))));
  },

  /* dostawca klatek z deterministycznym przewijaniem elementów <video> */
  makeProvider() {
    const els = new Map();
    const prov = {
      get(c, t) {
        const m = getMedia(c); if (!m) return null;
        if (c.type === 'image') return m.img ? { el: m.img, w: m.w, h: m.h } : null;
        if (c.type === 'video') { const e = els.get(c.id); return e && e.readyState >= 2 ? { el: e, w: m.w || e.videoWidth, h: m.h || e.videoHeight } : null; }
        return null;
      },
      async seek(c, t) {
        const m = getMedia(c); if (!m) return;
        let e = els.get(c.id);
        if (!e) {
          e = document.createElement('video'); e.preload = 'auto'; e.muted = true; e.playsInline = true; e.src = m.url;
          els.set(c.id, e);
          if (e.readyState < 1) await once(e, 'loadedmetadata', 20000).catch(() => {});
        }
        const target = clamp(srcTime(c, t), 0, Math.max(0, (m.dur || e.duration || 1e9) - 0.001));
        if (Math.abs(e.currentTime - target) > 0.0004 || e.readyState < 2) {
          e.currentTime = target;
          await once(e, 'seeked', 8000).catch(() => {});
          if (e.readyState < 2) await once(e, 'loadeddata', 4000).catch(() => {});
        }
      },
      dispose() { els.forEach((e) => { try { e.removeAttribute('src'); e.load(); } catch (x) { /* ignoruj */ } }); els.clear(); },
    };
    return prov;
  },
};
