'use strict';
/* ============================================================
   Kadr Studio — narzędzia dodatkowe i akcje aplikacji
   ============================================================ */
const App = {
  async addFiles(files) {
    const added = [];
    for (const f of files) { const m = await importFile(f); if (m) added.push(m); }
    if (!added.length) return;
    toast(added.length === 1 ? 'Dodano do biblioteki: ' + added[0].name : 'Dodano do biblioteki: ' + added.length + ' pliki');
    if (S.demo) {   /* pierwszy własny import zastępuje projekt przykładowy (przykładowe pliki zostają w bibliotece) */
      clips.length = 0; S.sel = null; S.time = 0; S.demo = false;
      Object.assign(P, { name: 'Mój film', aspect: '16:9', fps: 30, bg: '#000000', bgBlur: false, markers: [] });
      resetHistory();
    }
    if (!clips.length) { added.forEach((m) => addMediaClip(m, { keepAspect: false })); commit(); Engine.setupRenderer(); Engine.seek(0); }
    else Bus.emit('media');
  },
  addMedia(m) {
    addMediaClip(m); commit(); Engine.setupRenderer();
    if (document.body.dataset.mobile) UI.openTab('media');
  },
  addText(str, style) {
    const sel = byId(S.sel);
    if (style && sel && sel.type === 'text') { Object.assign(sel.text, style); commit(); return; }
    const c = addTextClip(str || 'Twój tekst', style);
    UI.insTab = 'text'; commit();
    Engine.seek(c.start + 0.3);
    const ta = $('#inspector textarea'); if (ta && !document.body.dataset.mobile) { ta.focus(); ta.select(); }
  },
  addSticker(e) { addStickerClip(e); UI.insTab = 'basic'; commit(); },
  newProject() {
    Engine.pause();
    Object.assign(P, { name: 'Mój film', aspect: '16:9', fps: 30, bg: '#000000', bgBlur: false, markers: [] });
    clips.length = 0; S.sel = null; S.time = 0; S.demo = false;
    resetHistory(); Bus.emit('change'); Bus.emit('project'); Engine.setupRenderer(); Engine.invalidate();
    UI.openTab('media');
  },
};

async function getSample() {
  try {
    if (!(window.claude && window.claude.use)) return null;
    return await Promise.race([window.claude.use('sample'), new Promise((r) => setTimeout(() => r(null), 3000))]);
  } catch (e) { return null; }
}

const Tools = {
  /* podgląd animacji klipu */
  previewClip(c, kind) {
    let t0;
    if (kind === 'in') t0 = Math.max(0, c.start - 0.2);
    else if (kind === 'out') t0 = Math.max(c.start, clipEnd(c) - c.animOut.dur - 0.5);
    else t0 = c.start;
    S.stopAt = Math.min(clipEnd(c) + 0.15, kind === 'loop' ? c.start + 3 : 1e9);
    Engine.seek(t0); Engine.play();
  },

  async snapshot() {
    if (!clips.length) { toast('Najpierw dodaj coś do projektu'); return; }
    const blob = await Engine.snapshot();
    if (blob && await saveFile('kadr-klatka.png', blob)) toast('Zapisano klatkę');
  },

  /* rytm: znaczniki na uderzeniach muzyki */
  beats() {
    const c = byId(S.sel), m = getMedia(c);
    if (!c || !m || !m.peaks) { toast('Zaznacz klip audio (lub wideo z dźwiękiem). Fala dźwięku musi się najpierw wczytać.'); return; }
    const pk = m.peaks, n = pk.length, env = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0, k = 0; for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < n) { s += pk[j]; k++; } env[i] = s / k; }
    const flux = new Float32Array(n);
    for (let i = 1; i < n; i++) flux[i] = Math.max(0, env[i] - env[i - 1]);
    const W = 100, found = [];
    let last = -1e9;
    for (let i = 2; i < n - 2; i++) {
      let mean = 0, cnt = 0;
      for (let j = Math.max(0, i - W); j < Math.min(n, i + W); j++) { mean += flux[j]; cnt++; }
      mean /= cnt;
      let isMax = true;
      for (let j = i - 12; j <= i + 12; j++) if (j >= 0 && j < n && flux[j] > flux[i]) { isMax = false; break; }
      if (isMax && flux[i] > mean * 1.8 + 0.004 && i - last >= 25) { found.push(i / 100); last = i; }
    }
    let added = 0;
    for (const tau of found) {
      if (tau < c.inPt || tau > c.inPt + srcLen(c)) continue;
      const t = Math.round((c.start + (tau - c.inPt) / c.speed) * 100) / 100;
      if (P.markers.some((x) => Math.abs(x - t) < 0.12)) continue;
      P.markers.push(t); added++;
      if (P.markers.length > 400) break;
    }
    P.markers.sort((a, b) => a - b);
    if (added) { commit(); toast('Dodano ' + added + ' znaczników rytmu. Klipy będą się do nich przyciągać.'); }
    else toast('Nie wykryłem wyraźnego rytmu w tym klipie');
  },

  /* pipeta: kolor z podglądu */
  pickColor(clientX, clientY) {
    const c = byId(S.picker); S.picker = null; document.body.classList.remove('picking');
    if (!c) return;
    const cv = Engine.canvas, r = cv.getBoundingClientRect();
    const x = clamp(Math.floor((clientX - r.left) / r.width * cv.width), 0, cv.width - 1), y = clamp(Math.floor((clientY - r.top) / r.height * cv.height), 0, cv.height - 1);
    const d = cv.getContext('2d').getImageData(x, y, 1, 1).data;
    c.cut.key = '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
    c.cut.mode = 'chroma'; commit();
  },
  autoKey(c) {
    const t = clamp(S.time, c.start, clipEnd(c) - 0.01), s = Engine.provider.get(c, t);
    if (!s) { toast('Klatka niedostępna'); return; }
    const k = 48, cv = mkCanvas(k, k), x = cv.getContext('2d', { willReadFrequently: true });
    x.drawImage(s.el, 0, 0, k, k);
    let r = 0, g = 0, b = 0, n = 0;
    [[0, 0], [k - 6, 0], [0, k - 6], [k - 6, k - 6]].forEach(([px, py]) => { const d = x.getImageData(px, py, 6, 6).data; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } });
    c.cut.key = '#' + [r / n, g / n, b / n].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    commit();
  },

  /* ---- samodzielne usuwanie tła ze zdjęcia ---- */
  async bgLoad(file) {
    if (!file) return;
    const st = UI._bg || (UI._bg = {});
    try {
      const img = await loadImage(URL.createObjectURL(file));
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = mkCanvas(img.naturalWidth * k, img.naturalHeight * k);
      cv.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, cv.width, cv.height);
      st.src = cv; st.out = null; st.name = file.name.replace(/\.[^.]+$/, '');
    } catch (e) { toast('Nie mogę otworzyć tego zdjęcia', 'err'); }
    UI.renderPanel();
  },
  async bgRun(mode) {
    const st = UI._bg; if (!st || !st.src) return;
    const status = $('#bgStatus'), src = st.src, w = src.width, hh = src.height;
    const out = mkCanvas(w, hh), ox = out.getContext('2d', { willReadFrequently: true });
    ox.drawImage(src, 0, 0);
    try {
      if (mode === 'ai') {
        if (status) status.textContent = AI.state === 'ready' ? 'Wycinanie…' : 'Ładowanie modelu AI i wycinanie…';
        const k = Math.min(1, 512 / Math.max(w, hh)), inp = mkCanvas(w * k, hh * k);
        inp.getContext('2d').drawImage(src, 0, 0, inp.width, inp.height);
        const m = await AI.segment(inp, 0);
        const proc = processMask(m, { edge: 0, soft: 0.25 });
        ox.globalCompositeOperation = 'destination-in';
        if (HAS_FILTER) ox.filter = `blur(${(Math.max(w, hh) * 0.002).toFixed(1)}px)`;
        ox.drawImage(proc, 0, 0, w, hh); ox.filter = 'none'; ox.globalCompositeOperation = 'source-over';
      } else {
        const d = ox.getImageData(0, 0, w, hh).data, pts = [];
        const add = (x, y) => { const i = (y * w + x) * 4; pts.push([d[i], d[i + 1], d[i + 2]]); };
        for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 40))) { add(x, 0); add(x, hh - 1); }
        for (let y = 0; y < hh; y += Math.max(1, Math.floor(hh / 40))) { add(0, y); add(w - 1, y); }
        const med = [0, 1, 2].map((ch) => pts.map((p) => p[ch]).sort((a, b) => a - b)[pts.length >> 1]);
        chromaKey(ox, w, hh, { key: '#' + med.map((v) => v.toString(16).padStart(2, '0')).join(''), tol: 0.28, soft: 0.25 });
      }
      st.out = out;
      UI.renderPanel();
      const s2 = $('#bgStatus'); if (s2) s2.textContent = 'Gotowe. Dodaj wynik do biblioteki albo zapisz jako PNG.';
    } catch (e) {
      console.warn(e);
      const s2 = $('#bgStatus');
      if (s2) { s2.textContent = mode === 'ai' ? 'Model AI jest niedostępny w tym środowisku. Spróbuj „Usuń jednolite tło”.' : 'Nie udało się usunąć tła.'; s2.classList.add('err'); }
    }
  },
  async _bgBlob() { const st = UI._bg; return new Promise((r) => st.out.toBlob(r, 'image/png')); },
  async bgToLib() {
    const st = UI._bg; if (!st || !st.out) return;
    const blob = await this._bgBlob();
    const m = await importFile(new File([blob], (st.name || 'zdjecie') + '-bez-tla.png', { type: 'image/png' }), { gen: true });
    if (m) toast('Dodano do biblioteki: ' + m.name);
  },
  async bgSave() {
    const st = UI._bg; if (!st || !st.out) return;
    const blob = await this._bgBlob();
    if (await saveFile((st.name || 'zdjecie') + '-bez-tla.png', blob)) toast('Zapisano PNG');
  },

  /* ---- asystent Claude (capability "sample") ---- */
  async assist() {
    const st = UI._as; if (!st || st.busy) return;
    if (!st.topic.trim()) { st.msg = 'Opisz najpierw, o czym jest film.'; UI.renderPanel(true); return; }
    st.busy = true; st.msg = ''; UI.renderPanel(true);
    try {
      const sample = await getSample();
      if (!sample) { st.msg = 'Asystent działa po otwarciu aplikacji w Claude (wymaga połączenia z Claude).'; return; }
      const topic = st.topic.trim().slice(0, 1200);
      const prompts = {
        captions: 'Odpowiedz wyłącznie tablicą JSON z 8 krótkimi napisami na ekran (maks. 6 słów każdy, po polsku, chwytliwe, bez hasztagów) do krótkiego filmu. Temat filmu:\n' + topic,
        hook: 'Odpowiedz wyłącznie tablicą JSON z 6 propozycjami otwarcia krótkiego filmu (pierwsze 2 sekundy, maks. 8 słów każda, po polsku, budzące ciekawość). Temat filmu:\n' + topic,
        post: 'Odpowiedz wyłącznie tablicą JSON z dokładnie 2 stringami: [0] krótki angażujący opis posta (po polsku, 1-2 zdania), [1] jedna linia z 8 trafnymi hasztagami oddzielonymi spacją. Temat filmu:\n' + topic,
      };
      const arr = await sample.json(prompts[st.kind], { modelTier: 'quick' });
      st.items = (Array.isArray(arr) ? arr : [arr]).map((x) => String(x)).filter(Boolean).slice(0, 10);
    } catch (e) {
      const code = e && e.code;
      st.msg = code === 'not_granted' ? 'Nie zezwolono na użycie Claude.' : code === 'rate_limited' ? 'Za dużo zapytań. Spróbuj za chwilę.' : code === 'invalid_json' ? 'Claude odpowiedział w nieoczekiwanym formacie. Spróbuj ponownie.' : 'Nie udało się połączyć z Claude.';
    } finally { st.busy = false; UI.renderPanel(true); }
  },
};

/* ============================================================
   Projekt przykładowy (obrazy i muzyka generowane w przeglądarce)
   ============================================================ */
const Demo = {
  scene(v) {
    const W = 1280, H = 720, cv = mkCanvas(W, H), x = cv.getContext('2d'), r = rng(7 + v);
    if (v === 0) { /* wschód słońca nad górami */
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1f2a5c'); g.addColorStop(0.45, '#c0508a'); g.addColorStop(0.75, '#ff9a5c'); g.addColorStop(1, '#ffd98a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const sg = x.createRadialGradient(W * 0.62, H * 0.62, 10, W * 0.62, H * 0.62, 260); sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.2, 'rgba(255,230,160,.9)'); sg.addColorStop(1, 'rgba(255,160,90,0)');
      x.fillStyle = sg; x.fillRect(0, 0, W, H);
      const ridge = (base, amp, col, seed) => { const rr = rng(seed); x.fillStyle = col; x.beginPath(); x.moveTo(0, H); let y = base; for (let px = 0; px <= W; px += 40) { y = base + Math.sin(px * 0.006 + seed) * amp + (rr() - 0.5) * amp * 0.8; x.lineTo(px, y); } x.lineTo(W, H); x.fill(); };
      ridge(470, 70, '#6b3a68', 3); ridge(540, 60, '#3d2352', 8); ridge(620, 40, '#1c1236', 12);
      x.strokeStyle = 'rgba(20,10,40,.8)'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { const bx = 200 + i * 130 + r() * 40, by = 130 + r() * 90; x.beginPath(); x.moveTo(bx - 14, by); x.quadraticCurveTo(bx - 7, by - 10, bx, by); x.quadraticCurveTo(bx + 7, by - 10, bx + 14, by); x.stroke(); }
    } else if (v === 1) { /* nocne miasto */
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05081c'); g.addColorStop(0.7, '#1b1f55'); g.addColorStop(1, '#3a2f7a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; x.fillRect(r() * W, r() * H * 0.6, 2, 2); }
      x.fillStyle = '#f6f1d3'; x.beginPath(); x.arc(W * 0.8, H * 0.2, 54, 0, 7); x.fill();
      x.fillStyle = '#1b1f55'; x.beginPath(); x.arc(W * 0.8 + 18, H * 0.2 - 8, 50, 0, 7); x.fill();
      for (let layer = 0; layer < 2; layer++) {
        let px = -20;
        while (px < W) {
          const bw = 70 + r() * 90, bh = (layer ? 220 : 330) + r() * (layer ? 150 : 230);
          x.fillStyle = layer ? '#0e0f2c' : '#15173f'; x.fillRect(px, H - bh, bw, bh);
          for (let wy = H - bh + 18; wy < H - 14; wy += 26) for (let wx = px + 10; wx < px + bw - 12; wx += 22) if (r() > 0.55) { x.fillStyle = r() > 0.5 ? '#ffd86b' : '#ff9ad5'; x.fillRect(wx, wy, 10, 14); }
          px += bw + 6;
        }
      }
    } else { /* synthwave */
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#12002f'); g.addColorStop(0.55, '#7b1fa2'); g.addColorStop(0.56, '#ff4fa3'); g.addColorStop(0.57, '#14002b'); g.addColorStop(1, '#2a0a55');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const sg = x.createLinearGradient(0, 130, 0, 400); sg.addColorStop(0, '#ffe45e'); sg.addColorStop(1, '#ff2e93');
      x.save(); x.beginPath(); x.arc(W / 2, 330, 190, 0, 7); x.clip(); x.fillStyle = sg; x.fillRect(0, 100, W, 300);
      x.fillStyle = '#7b1fa2'; for (let i = 0; i < 9; i++) x.fillRect(0, 270 + i * 20, W, 4 + i * 1.6); x.restore();
      x.strokeStyle = '#ff4fd8'; x.lineWidth = 2;
      for (let i = -12; i <= 12; i++) { x.beginPath(); x.moveTo(W / 2 + i * 14, 400); x.lineTo(W / 2 + i * 120, H); x.stroke(); }
      for (let i = 1; i < 11; i++) { const y = 400 + Math.pow(i / 10, 2.2) * 320; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    }
    return cv;
  },
  wav() {
    const sr = 44100, dur = 12, n = sr * dur, data = new Int16Array(n), bpm = 100, beat = 60 / bpm;
    const notes = [220, 261.63, 329.63, 392, 329.63, 261.63, 293.66, 349.23];
    for (let i = 0; i < n; i++) {
      const t = i / sr, bt = t % beat, step = Math.floor(t / (beat / 2)), f = notes[step % notes.length] * (step % 16 >= 8 ? 1.125 : 1);
      const eT = (t % (beat / 2));
      let v = 0.22 * Math.sin(2 * Math.PI * f * t) * Math.exp(-eT * 5) + 0.08 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-eT * 8);
      v += 0.55 * Math.sin(2 * Math.PI * (52 + 90 * Math.exp(-bt * 26)) * bt) * Math.exp(-bt * 9);
      v += 0.18 * Math.sin(2 * Math.PI * 110 * t) * (0.5 + 0.5 * Math.sin(t * 0.8));
      data[i] = Math.max(-1, Math.min(1, v)) * 30000;
    }
    const buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
    const wr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    wr(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); wr(8, 'WAVE'); wr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); wr(36, 'data'); dv.setUint32(40, n * 2, true);
    new Int16Array(buf, 44).set(data);
    return new Blob([buf], { type: 'audio/wav' });
  },
  async load() {
    const names = ['Wschód.png', 'Miasto nocą.png', 'Synthwave.png'], ms = [];
    for (let i = 0; i < 3; i++) {
      const blob = await new Promise((r) => this.scene(i).toBlob(r, 'image/png'));
      ms.push(await importFile(new File([blob], 'Przykład – ' + names[i], { type: 'image/png' }), { gen: true }));
    }
    const au = await importFile(new File([this.wav()], 'Przykład – beat.wav', { type: 'audio/wav' }), { gen: true });
    clips.length = 0; P.aspect = '16:9'; P.name = 'Przykładowy projekt'; P.markers = [];
    const mk = (m, i) => { const c = newClip('image', { lane: 'v1', media: m.id, start: i * 4, dur: 4 }); clips.push(c); return c; };
    const a = mk(ms[0], 0), b = mk(ms[1], 1), c = mk(ms[2], 2);
    a.animLoop = { id: 'kbIn', amt: 1 }; a.animOut = { id: 'none', dur: 0.6 };
    b.trans = { id: 'pushL', dur: 0.8 }; b.filter = { id: 'cinema', amt: 1 }; b.animLoop = { id: 'kbOut', amt: 1 };
    c.trans = { id: 'glitch', dur: 0.8 }; c.fx = [{ id: 'rgb', amt: 0.35 }]; c.animLoop = { id: 'pulse', amt: 0.5 };
    const t1 = newClip('text', { lane: 'v3', start: 0.5, dur: 3.2, y: -0.05, text: Object.assign(defText('Kadr Studio'), TEXT_STYLES[9].t) });
    t1.animIn = { id: 'pop', dur: 0.6 }; t1.animOut = { id: 'fade', dur: 0.4 }; clips.push(t1);
    const t2 = newClip('text', { lane: 'v2', start: 4.6, dur: 3, y: 0.32, text: Object.assign(defText('Importuj swoje pliki →'), TEXT_STYLES[5].t, { size: 0.06 }) });
    t2.animIn = { id: 'slideL', dur: 0.5 }; clips.push(t2);
    const st = newClip('sticker', { lane: 'v2', start: 9, dur: 2.6, x: 0.3, y: -0.2, sticker: { emoji: '🔥', size: 0.3 } });
    st.animIn = { id: 'elastic', dur: 0.7 }; st.animLoop = { id: 'heart', amt: 1 }; clips.push(st);
    const fx = newClip('fx', { lane: 'v3', start: 8.2, dur: 3.8, fx: [{ id: 'leak', amt: 0.5 }] }); clips.push(fx);
    const m1 = newClip('audio', { lane: 'a1', media: au.id, start: 0, dur: 12, vol: 0.7, fadeOut: 1.5 }); clips.push(m1);
    S.sel = null; S.time = 1.2; S.demo = true;
    resetHistory(); Bus.emit('change'); Bus.emit('project'); Engine.setupRenderer(); Engine.invalidate();
    TL.fit();
  },
};
