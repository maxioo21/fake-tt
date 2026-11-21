'use strict';
/* ============================================================
   Kadr Studio — rozszerzone panele: style tekstu, naklejki/kształty, zakładka „Gotowe”,
   maski, klatki kluczowe, krzywe prędkości
   ============================================================ */
TEXT_FONTS.push('Bangers', 'Black Ops One', 'Oswald', 'Poppins', 'Orbitron', 'Press Start 2P', 'Russo One', 'Staatliches', 'Teko', 'Archivo Black', 'Abril Fatface', 'Dancing Script', 'Satisfy', 'Shadows Into Light', 'Luckiest Guy', 'Fredoka', 'Monoton', 'Bungee', 'Syne', 'DM Serif Display', 'Great Vibes', 'Rye');
const TEXT_CATS = ['Popularne', 'Sport / edit', 'Neon', 'Retro', 'Elegancja', 'Zabawa', 'Etykiety', 'Napisy'];
TEXT_STYLES.forEach((s) => { s.cat = s.cat || 'Popularne'; });
const STYLE_BASE = { font: 'Montserrat', bold: true, italic: false, upper: false, color: '#ffffff', fill2: '', strokeC: '#000000', strokeW: 0, out2C: '#000000', out2W: 0, hardC: '#000000', hardD: 0, shadowC: '#000000', shadowB: 0, bg: '', bgA: 0.7, spacing: 0, lineH: 1.15 };
const styleFull = (t) => Object.assign({}, STYLE_BASE, t);
const TS = (name, cat, t) => TEXT_STYLES.push({ name, cat, t });
TS('Stadion', 'Sport / edit', { font: 'Anton', bold: false, color: '#ffffff', hardC: '#e11d48', hardD: 0.055, upper: true, spacing: 0.03 });
TS('Gol!', 'Sport / edit', { font: 'Bangers', bold: false, color: '#ffe14d', strokeC: '#e11d48', strokeW: 0.1, out2C: '#000000', out2W: 0.05, upper: true, spacing: 0.02 });
TS('Złoty edit', 'Sport / edit', { font: 'Bebas Neue', bold: false, color: '#fff3b0', fill2: '#d4a017', strokeC: '#5a3d00', strokeW: 0.07, shadowB: 0.25, upper: true, spacing: 0.06, size: 0.12 });
TS('Chrome', 'Sport / edit', { font: 'Anton', bold: false, color: '#ffffff', fill2: '#7f93a8', strokeC: '#1c2733', strokeW: 0.08, shadowB: 0.2, upper: true });
TS('Ogień', 'Sport / edit', { font: 'Bangers', bold: false, color: '#fff200', fill2: '#ff2a00', shadowC: '#ff6a00', shadowB: 0.55, upper: true, spacing: 0.03 });
TS('Lód', 'Sport / edit', { font: 'Anton', bold: false, color: '#ffffff', fill2: '#6fd3ff', shadowC: '#35b8ff', shadowB: 0.5, upper: true });
TS('Numer', 'Sport / edit', { font: 'Russo One', bold: false, color: '#ffffff', strokeC: '#e11d48', strokeW: 0.12, hardC: '#000000', hardD: 0.05, size: 0.16 });
TS('Mecz', 'Sport / edit', { font: 'Teko', bold: true, color: '#ffffff', bg: '#0b3d91', bgA: 1, upper: true, spacing: 0.05, size: 0.1 });
TS('Skład', 'Sport / edit', { font: 'Staatliches', bold: false, color: '#111111', bg: '#ffffff', bgA: 1, upper: true, spacing: 0.04 });
TS('Black Ops', 'Sport / edit', { font: 'Black Ops One', bold: false, color: '#d9ff3d', strokeC: '#000000', strokeW: 0.08, upper: true });
const neon = (name, c, glow, font) => TS(name, 'Neon', { font, bold: false, color: c, shadowC: glow, shadowB: 0.62 });
neon('Neon cyjan', '#d6fbff', '#00e5ff', 'Righteous'); neon('Neon róż', '#ffd6ec', '#ff2d95', 'Righteous'); neon('Neon zielony', '#e2ffd6', '#27ff5a', 'Orbitron');
neon('Neon żółty', '#fffbd0', '#ffe600', 'Orbitron'); neon('Neon fiolet', '#eadcff', '#8b3dff', 'Monoton'); neon('Neon pomarańcz', '#ffe6d0', '#ff7a00', 'Bungee');
TS('Arcade', 'Retro', { font: 'Press Start 2P', bold: false, color: '#00f0ff', hardC: '#ff2d95', hardD: 0.06, size: 0.055, upper: true });
TS('Synthwave', 'Retro', { font: 'Righteous', bold: false, color: '#ff9bd7', fill2: '#7a5cff', shadowC: '#ff2d95', shadowB: 0.35, strokeC: '#1a0b4d', strokeW: 0.06, upper: true });
TS('Disco', 'Retro', { font: 'Monoton', bold: false, color: '#ffd6f5', shadowC: '#ff2d95', shadowB: 0.4, size: 0.1 });
TS('Western', 'Retro', { font: 'Rye', bold: false, color: '#f3d9a4', strokeC: '#3b1d08', strokeW: 0.1, hardC: '#3b1d08', hardD: 0.04 });
TS('Vintage', 'Retro', { font: 'Abril Fatface', bold: false, color: '#f6e7c8', strokeC: '#4a2c14', strokeW: 0.08, shadowB: 0.1 });
TS('Komiks 2', 'Retro', { font: 'Bangers', bold: false, color: '#ffffff', strokeC: '#111111', strokeW: 0.1, hardC: '#ff2d55', hardD: 0.06, upper: true });
TS('Graffiti', 'Retro', { font: 'Permanent Marker', bold: false, color: '#7dffb0', strokeC: '#08331c', strokeW: 0.12, out2C: '#ffffff', out2W: 0.05 });
TS('Retro cień', 'Retro', { font: 'Lobster', bold: false, color: '#fff4c2', hardC: '#e5532d', hardD: 0.06, strokeC: '#7a2c0e', strokeW: 0.08 });
TS('Luksus', 'Elegancja', { font: 'Playfair Display', bold: true, color: '#ffffff', spacing: 0.12, upper: true, shadowB: 0.12, size: 0.07 });
TS('Kaligrafia', 'Elegancja', { font: 'Great Vibes', bold: false, color: '#ffffff', shadowB: 0.15, size: 0.13 });
TS('Dancing', 'Elegancja', { font: 'Dancing Script', bold: true, color: '#fff0f5', shadowB: 0.15, size: 0.11 });
TS('Satisfy', 'Elegancja', { font: 'Satisfy', bold: false, color: '#ffffff', shadowB: 0.15, size: 0.11 });
TS('Złoty monogram', 'Elegancja', { font: 'Abril Fatface', bold: false, color: '#fff2b8', fill2: '#c9971c', strokeC: '#4d3600', strokeW: 0.05, shadowB: 0.2 });
TS('Magazyn', 'Elegancja', { font: 'DM Serif Display', bold: false, color: '#ffffff', shadowB: 0.1, size: 0.1 });
TS('Cienki minimal', 'Elegancja', { font: 'Syne', bold: false, color: '#ffffff', spacing: 0.25, upper: true, size: 0.045 });
TS('Balon', 'Zabawa', { font: 'Luckiest Guy', bold: false, color: '#ffffff', strokeC: '#ff2d95', strokeW: 0.14, out2C: '#ffffff', out2W: 0.04, hardC: '#7a0b45', hardD: 0.05 });
TS('Cukierek', 'Zabawa', { font: 'Fredoka', bold: true, color: '#ff7ac8', strokeC: '#ffffff', strokeW: 0.16, hardC: '#c2185b', hardD: 0.05 });
TS('Naklejka', 'Zabawa', { font: 'Fredoka', bold: true, color: '#111111', strokeC: '#ffffff', strokeW: 0.14, out2C: '#111111', out2W: 0.04, hardC: '#000000', hardD: 0.04 });
TS('Tęcza', 'Zabawa', { font: 'Fredoka', bold: true, color: '#ff5e8a', fill2: '#ffd23f', strokeC: '#ffffff', strokeW: 0.12 });
TS('Bąbel', 'Zabawa', { font: 'Bungee', bold: false, color: '#00e5ff', strokeC: '#003b66', strokeW: 0.1, hardC: '#003b66', hardD: 0.05 });
TS('Kreskówka', 'Zabawa', { font: 'Bangers', bold: false, color: '#ffe14d', strokeC: '#111111', strokeW: 0.14, hardC: '#111111', hardD: 0.05, upper: true });
const lab = (name, col, fg) => TS(name, 'Etykiety', { font: 'Montserrat', bold: true, color: fg, bg: col, bgA: 1, upper: true, spacing: 0.03 });
lab('Czerwona', '#e11d48', '#ffffff'); lab('Niebieska', '#2563eb', '#ffffff'); lab('Zielona', '#16a34a', '#ffffff'); lab('Żółta', '#facc15', '#111111');
lab('Biała', '#ffffff', '#111111'); lab('Czarna', '#000000', '#ffffff'); lab('Różowa', '#ff4fa3', '#ffffff'); lab('Fioletowa', '#7c3aed', '#ffffff');
TS('Napisy: klasyczne', 'Napisy', { font: 'Montserrat', bold: true, color: '#ffffff', bg: '#000000', bgA: 0.6, size: 0.055 });
TS('Napisy: obrys', 'Napisy', { font: 'Montserrat', bold: true, color: '#ffffff', strokeC: '#000000', strokeW: 0.18, size: 0.065 });
TS('Napisy: żółte', 'Napisy', { font: 'Anton', bold: false, color: '#ffe600', strokeC: '#000000', strokeW: 0.16, upper: true, size: 0.09, hardC: '#000000', hardD: 0.03 });
TS('Napisy: zielone', 'Napisy', { font: 'Anton', bold: false, color: '#39ff6a', strokeC: '#000000', strokeW: 0.16, upper: true, size: 0.09 });
TS('Napisy: Poppins', 'Napisy', { font: 'Poppins', bold: true, color: '#ffffff', shadowB: 0.25, size: 0.06 });
TS('Napisy: Oswald', 'Napisy', { font: 'Oswald', bold: true, color: '#ffffff', strokeC: '#000000', strokeW: 0.12, upper: true, size: 0.08 });

Object.assign(EMOJI, {
  'Sport': ['⚽', '🏀', '🏈', '🎾', '🏐', '🥊', '🏆', '🥇', '🥈', '🥉', '🏟️', '🎽', '🏃', '⛹️', '🚴', '🏊', '🤸', '🧗', '⛷️', '🏂', '🥅', '📣', '🔥', '💪'],
  'Muzyka i film': ['🎵', '🎶', '🎤', '🎧', '🎸', '🥁', '🎹', '🎺', '🎷', '🪩', '📻', '🔊', '🎼', '💿', '🎬', '📹', '🎞️', '📽️', '🎭', '🕺', '💃', '🪘', '🎻', '📀'],
  'Reakcje': ['💀', '😭', '🤯', '😱', '🥶', '🤡', '👀', '🙄', '😳', '😤', '🫠', '🥹', '💅', '🤌', '🧠', '🫨', '❤️‍🔥', '💔', '💯', '‼️', '🆒', '🆗', '🚨', '⚠️'],
  'Podróże': ['✈️', '🚗', '🏖️', '🌴', '🏔️', '🗺️', '🧳', '📍', '🚀', '🛸', '🌅', '🌃', '🌉', '🏙️', '🗼', '🗽', '⛰️', '🏕️', '🚢', '🚲', '🛵', '🚁', '🚂', '🧭'],
});
S.shapeColor = '#ffffff';

/* ---------- pomocnik: ładowanie czcionek dla kafelków ---------- */
UI._fl = new Set();
UI.loadFonts = function (fonts) {
  if (!document.fonts || !document.fonts.load) return;
  const need = fonts.filter((f) => !UI._fl.has(f));
  if (!need.length) return;
  need.forEach((f) => UI._fl.add(f));
  Promise.all(need.map((f) => document.fonts.load(`700 24px "${f}"`).catch(() => {}))).then(() => { if (S.tab === 'text') UI.renderPanel(true); });
};

/* ---------- Tekst ---------- */
UI.catState.text = 'Popularne';
UI.pText = function (box) {
  const sel = byId(S.sel), isText = sel && sel.type === 'text', cur = this.catState.text;
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Tekst')), F.btn('Dodaj tekst', () => App.addText(), 'primary block', 'plus'),
    F.hint(isText ? 'Wybierz styl, aby zmienić zaznaczony napis. Animację wybierzesz w „Edytuj → Animacje”.' : 'Wybierz styl, aby dodać napis w miejscu głowicy. Dwuklik na napisie w podglądzie edytuje tekst.'));
  box.append(h('div', { class: 'chips' }, TEXT_CATS.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.text = k; this.renderPanel(); } }, k))));
  const list = TEXT_STYLES.filter((s) => s.cat === cur);
  UI.loadFonts([...new Set(list.map((s) => s.t.font).filter(Boolean))]);
  const grid = h('div', { class: 'tgrid' });
  list.forEach((s) => {
    grid.append(tile(s.name, (x, w, hh) => {
      x.fillStyle = '#23262f'; x.fillRect(0, 0, w, hh);
      const T = Object.assign(defText('Aa'), styleFull(s.t), { size: 0.5, str: 'Aa' });
      const sp = makeTextSprite(T, hh * 1.2, hh * 1.2, null);
      const k = Math.min((w - 14) / sp.width, (hh - 10) / sp.height, 1.2);
      x.drawImage(sp, (w - sp.width * k) / 2, (hh - sp.height * k) / 2, sp.width * k, sp.height * k);
    }, { anim: false, drag: { kind: 'text', style: s.t }, onclick: () => App.addText(null, s.t) }));
  });
  box.append(grid);
};

/* ---------- Naklejki i kształty ---------- */
UI.pStickers = function (box) {
  const cats = [...Object.keys(EMOJI), 'Kształty'];
  if (!cats.includes(this.catState.stickers)) this.catState.stickers = 'Popularne';
  const cur = this.catState.stickers;
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Naklejki')));
  box.append(h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.stickers = k; this.renderPanel(); } }, k))));
  if (cur === 'Kształty') {
    box.append(F.color('Kolor kształtu', () => S.shapeColor, (v) => { S.shapeColor = v; }));
    SHAPE_CATS.forEach((cat) => {
      box.append(F.title(cat));
      const g = h('div', { class: 'tgrid sm' });
      Object.values(SHAPES).filter((s) => s.cat === cat).forEach((s) => g.append(tile(s.name, (x, w, hh) => {
        x.fillStyle = '#23262f'; x.fillRect(0, 0, w, hh);
        const sp = makeShapeSprite({ shape: s.id, color: S.shapeColor, size: 0.6 }, hh, hh), k = Math.min(1, (hh - 8) / sp.height);
        x.drawImage(sp, (w - sp.width * k) / 2, (hh - sp.height * k) / 2, sp.width * k, sp.height * k);
      }, { anim: false, drag: { kind: 'shape', id: s.id }, onclick: () => { const c = addShapeClip(s.id); c.sticker.color = S.shapeColor; UI.insTab = 'basic'; commit(); } })));
      box.append(g);
    });
    box.append(F.hint('Kształty możesz przesuwać, skalować i obracać na podglądzie. Kolor zmienisz w „Edytuj → Podstawowe”.'));
    return;
  }
  box.append(h('div', { class: 'egrid' }, EMOJI[cur].map((e) => { const b = h('button', { class: 'emo', title: 'Kliknij lub przeciągnij na podgląd / oś czasu', onclick: () => App.addSticker(e) }, e); DND.attach(b, { kind: 'sticker', emoji: e, name: e }); return b; })));
  box.append(F.hint('Kliknij naklejkę, aby dodać ją do filmu. Przesuwaj, skaluj i obracaj ją bezpośrednio na podglądzie.'));
};

/* ============================================================
   ZAKŁADKA „GOTOWE”
   ============================================================ */
UI.readyTab = 'looks';
UI.catState.looks = 'Edit'; UI.catState.ovl = 'Światło'; UI.catState.pack = 'Popularne';
UI.pReady = function (box) {
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Gotowe')),
    F.hint('Gotowe efekty do edytów. Kliknij kafelek albo przeciągnij go na klip na osi lub na podgląd. Bez napisów.'));
  const subs = [['looks', 'Looki'], ['speed', 'Prędkość'], ['beat', 'Montaż na bit'], ['ovl', 'Nakładki'], ['pack', 'Przejścia']];
  box.append(h('div', { class: 'sub' }, subs.map(([id, t]) => h('button', { class: this.readyTab === id ? 'on' : '', onclick: () => { this.readyTab = id; this.renderPanel(); } }, t))));
  ({ looks: this.rLooks, speed: this.rSpeed, beat: this.rBeat, ovl: this.rOverlays, pack: this.rPack }[this.readyTab]).call(this, box);
};
UI.targetHint = function () {
  const n = Act.ids().length;
  return n ? `Zastosuję do zaznaczonych klipów (${n}).` : 'Nic nie zaznaczono, więc zastosuję do wszystkich klipów wideo i zdjęć na osi.';
};
UI.rLooks = function (box) {
  const cats = [...new Set(LOOKS.map((l) => l.cat))], cur = cats.includes(this.catState.looks) ? this.catState.looks : cats[0];
  box.append(h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.looks = k; this.renderPanel(); } }, k))));
  box.append(F.hint(this.targetHint()));
  const grid = h('div', { class: 'tgrid' });
  LOOKS.filter((l) => l.cat === cur).forEach((l) => {
    const fake = newClip('image'); l.apply(fake);
    grid.append(tile(l.name, (x, w, hh, p, tm) => {
      const sc = sceneFor(w, hh, 0);
      x.drawImage(sc, 0, 0);
      const cv = POOL.get(w, hh), cx = cv.getContext('2d');
      if (HAS_FILTER) cx.filter = cssFilter(fake, hh);
      cx.drawImage(sc, 0, 0); cx.filter = 'none';
      applyOverlays(cv, overlayList(fake), 0.4); applyEffects(cv, fake.fx, p == null ? 0.37 : tm + 0.2);
      x.save(); x.beginPath(); x.rect(w * 0.4, 0, w * 0.6, hh); x.clip(); x.drawImage(cv, 0, 0); x.restore(); POOL.free(cv);
      x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(w * 0.4 - 1, 0, 2, hh);
      if (fake.curve && fake.curve !== 'none') { x.fillStyle = 'rgba(0,0,0,.65)'; x.fillRect(w - 30, 4, 26, 15); x.fillStyle = '#ffb454'; x.font = '700 11px sans-serif'; x.fillText('⚡', w - 25, 16); }
    }, { drag: { kind: 'look', id: l.id }, onclick: () => Looks.apply(l) }));
  });
  box.append(grid, F.btn('Usuń look z klipów', () => Looks.clear(), 'block', 'x'));
};
UI.rSpeed = function (box) {
  const sel = byId(S.sel), ok = sel && (sel.type === 'video' || sel.type === 'audio');
  box.append(h('div', { class: 'note' + (ok ? ' ok' : '') }, ok ? 'Krzywa dla klipu „' + this.clipTitle(sel) + '”. Długość klipu się nie zmienia, zmienia się tylko tempo w czasie.' : 'Zaznacz klip wideo lub audio, aby nadać mu krzywą prędkości.'));
  const grid = h('div', { class: 'tgrid' });
  Object.entries(CURVES).forEach(([id, cv]) => {
    grid.append(tile(cv.name, (x, w, hh) => {
      x.fillStyle = '#20242f'; x.fillRect(0, 0, w, hh);
      x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 1; x.beginPath(); x.moveTo(8, hh * 0.5); x.lineTo(w - 8, hh * 0.5); x.stroke();
      const f = curveFns(id) || null, N = 60; x.strokeStyle = id === 'none' ? '#6b7390' : '#a79bff'; x.lineWidth = 2.5; x.beginPath();
      for (let i = 0; i <= N; i++) { const u = i / N, m = f ? f.m(u) : 1, y = hh - 8 - clamp(m / 3.6, 0, 1) * (hh - 16); i ? x.lineTo(8 + u * (w - 16), y) : x.moveTo(8, y); }
      x.stroke();
    }, { anim: false, drag: id === 'none' ? null : { kind: 'curve', id }, active: ok && (sel.curve || 'none') === id, onclick: () => { if (!ok) { toast('Zaznacz klip wideo lub audio'); return; } sel.curve = id; commit(); Tools.previewClip(sel, 'loop'); } }));
  });
  box.append(grid, F.hint('Krzywe działają jak „Prędkość → Krzywa” w CapCut. Dźwięk klipu zmienia tempo razem z obrazem.'));
};
UI.rBeat = function (box) {
  const st = this._beat || (this._beat = { style: 'punch', every: 1 });
  const audio = clips.some((c) => (c.type === 'audio' || c.type === 'video') && getMedia(c) && getMedia(c).peaks);
  box.append(h('div', { class: 'card2' },
    h('h5', {}, 'Auto-montaż na bit', h('span', { class: 'badge' }, 'NOWE')),
    F.hint('Wykrywam rytm w muzyce, tnę klipy na ścieżce głównej na uderzeniach i dodaję efekty na każdym cięciu.'),
    F.select('Styl', [['punch', 'Zoom na bit'], ['flash', 'Zoom + biały błysk'], ['glitch', 'Glitch'], ['shake', 'Wstrząs'], ['spin', 'Obrót + błysk koloru'], ['calm', 'Spokojny (Ken Burns)']], () => st.style, (v) => { st.style = v; }),
    F.seg('Co ile uderzeń tnę', [[1, '1'], [2, '2'], [4, '4'], [8, '8']], () => st.every, (v) => { st.every = v; }),
    h('div', { class: 'row2' }, F.btn('Wykryj rytm', () => Tools.beats(true), '', 'bolt'), F.btn('Zmontuj na bit', () => AutoEdit.run(st.style, st.every), 'primary', 'sparkles')),
    h('p', { class: 'hint' }, `Znaczniki rytmu: ${P.markers.length}. ${audio ? 'Znalazłem muzykę z falą dźwięku.' : 'Dodaj muzykę (klip audio) na oś i poczekaj, aż pojawi się fala dźwięku.'} Możesz też ustawić własne znaczniki klawiszem M.`)));
  box.append(h('div', { class: 'card2' }, h('h5', {}, 'Wskazówki do edytów'), h('p', { class: 'hint' }, '1. Wrzuć 1–3 dłuższe klipy na ścieżkę główną i muzykę na ścieżkę audio. 2. Kliknij „Zmontuj na bit”. 3. Dopieść: Looki (CC), Prędkość (krzywe), Nakładki (iskry, wycieki światła, błyski).')));
};
UI.rOverlays = function (box) {
  const cats = OVERLAY_CATS, cur = this.catState.ovl;
  box.append(h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.ovl = k; this.renderPanel(); } }, k))));
  box.append(F.hint('Animowane nakładki rysowane na żywo. Kliknij, aby dodać w miejscu głowicy, albo przeciągnij na wybraną ścieżkę lub podgląd. Kolor i tryb mieszania zmienisz w „Edytuj”.'));
  const grid = h('div', { class: 'tgrid' });
  Object.values(OVERLAYS).filter((o) => o.cat === cur).forEach((o) => {
    grid.append(tile(o.name, (x, w, hh, p, tm) => {
      drawScene(x, w, hh, 1);
      const ov = POOL.get(w, hh), lt = p == null ? Math.min(o.d * 0.18, 0.5) + 0.2 : (tm % Math.min(o.d, 3));
      drawOverlayTo(ov, o.id, lt, { color: OV_COLORS[o.id] || '#ffffff' });
      x.save(); x.globalCompositeOperation = blendOp(o.blend); x.drawImage(ov, 0, 0); x.restore(); POOL.free(ov);
    }, { drag: { kind: 'overlay', id: o.id }, onclick: () => { addOverlayClip(o.id); UI.insTab = 'ovl'; commit(); toast('Dodano nakładkę „' + o.name + '”'); } }));
  });
  box.append(grid);
};
UI.rPack = function (box) {
  const st = this._pack || (this._pack = { id: 'fade', dur: 0.5 });
  box.append(h('div', { class: 'card2' }, h('h5', {}, 'Przejście na wszystkich cięciach'),
    F.hint('Wybierz przejście i zastosuj je między wszystkimi klipami na ścieżce głównej jednym kliknięciem.'),
    F.slider('Czas przejścia', () => st.dur, (v) => { st.dur = v; }, 0.15, 2, 0.05, (v) => v.toFixed(2) + ' s'),
    F.btn('Zastosuj do wszystkich cięć', () => Looks.packTransitions(st.id, st.dur), 'primary block', 'transition'),
    h('div', { class: 'row2' }, F.btn('Losowe', () => Looks.packTransitions('random', st.dur), 'sm', 'repeat'), F.btn('Usuń wszystkie', () => Looks.packTransitions('none', st.dur), 'sm', 'x'))));
  box.append(this.chipsFor('pack', TRANS_CATS));
  const grid = h('div', { class: 'tgrid' });
  Object.values(TRANS).filter((t) => t.cat === this.catState.pack).forEach((t) => grid.append(transTile(t.id, st.id === t.id, () => { st.id = t.id; this.renderPanel(true); })));
  box.append(grid);
};

/* ============================================================
   INSPEKTOR — rozszerzenia
   ============================================================ */
UI.insTabsFor = function (c) {
  if (!c) return [];
  if (c.type === 'audio') return [['audio', 'Dźwięk'], ['speed', 'Tempo']];
  if (c.type === 'fx') return [['fxs', 'Efekty'], ['adjust', 'Dostosuj']];
  if (c.type === 'overlay') return [['ovl', 'Nakładka'], ['basic', 'Podstawowe'], ['anim', 'Animacje']];
  if (c.type === 'text') return [['text', 'Tekst'], ['basic', 'Podstawowe'], ['anim', 'Animacje'], ['fxs', 'Efekty']];
  if (c.type === 'sticker') return [['basic', 'Podstawowe'], ['anim', 'Animacje'], ['fxs', 'Efekty']];
  const t = [['basic', 'Podstawowe'], ['cut', 'Usuń tło'], ['mask', 'Maska'], ['anim', 'Animacje'], ['adjust', 'Dostosuj'], ['fxs', 'Efekty']];
  if (c.type === 'video') t.push(['speed', 'Tempo'], ['audio', 'Dźwięk']);
  return t;
};
UI.kfCtl = [];
UI.kfSlider = function (c, label, prop, min, max, step, fmt) {
  const lt = () => S.time - c.start, out = h('output'), inp = h('input', { type: 'range', min, max, step });
  const dia = h('button', { class: 'kfb', title: 'Klatka kluczowa: animuj tę właściwość w czasie. Ustaw głowicę, kliknij ◇, przesuń głowicę i zmień wartość.', html: icon('diamond', 12), onclick: () => { kfToggle(c, prop, lt()); commit(); } });
  const show = (v) => { out.textContent = fmt ? fmt(+v) : (+v).toFixed(2); };
  const upd = () => { const v = kfVal(c, prop, lt()); inp.value = v; show(v); dia.classList.toggle('on', kfAt(c, prop, lt())); dia.classList.toggle('has', kfHas(c, prop)); };
  inp.addEventListener('input', () => { kfSet(c, prop, lt(), +inp.value); show(inp.value); dia.classList.toggle('on', kfAt(c, prop, lt())); Engine.invalidate(); Stage.update(); });
  inp.addEventListener('change', () => commit());
  this.kfCtl.push(upd); upd();
  return h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, label), h('span', { class: 'cr' }, out, dia)), inp);
};
UI.insBasic = function (b, c) {
  const pc = (v) => Math.round(v * 100) + '%';
  if (c.type === 'sticker') {
    if (c.sticker.shape) b.append(F.color('Kolor kształtu', () => c.sticker.color, (v) => { c.sticker.color = v; if (Engine.R) Engine.R.sprites.clear(); }));
    b.append(F.slider('Rozmiar', () => c.sticker.size, (v) => { c.sticker.size = v; }, 0.05, 0.9, 0.01, pc));
  }
  b.append(this.kfSlider(c, 'Skala', 'scale', 0.1, 4, 0.01, pc), this.kfSlider(c, 'Obrót', 'rot', -180, 180, 1, (v) => Math.round(v) + '°'),
    this.kfSlider(c, 'Pozycja X', 'x', -1, 1, 0.005, (v) => Math.round(v * 100) + '%'), this.kfSlider(c, 'Pozycja Y', 'y', -1, 1, 0.005, (v) => Math.round(v * 100) + '%'),
    this.kfSlider(c, 'Krycie', 'opacity', 0, 1, 0.01, pc));
  b.append(F.select('Tryb mieszania', BLENDS, () => c.blend || 'normal', (v) => { c.blend = v; }));
  b.append(h('div', { class: 'row2' },
    F.btn('Odbij poziomo', () => { c.flipX = !c.flipX; commit(); }, c.flipX ? 'on' : '', 'flip'),
    F.btn('Odbij pionowo', () => { c.flipY = !c.flipY; commit(); }, c.flipY ? 'on' : '', 'flip')));
  if (c.type === 'video' || c.type === 'image') {
    b.append(F.title('Przytnij'));
    [['Lewa krawędź', 'l'], ['Górna krawędź', 't'], ['Prawa krawędź', 'r'], ['Dolna krawędź', 'b']].forEach(([l, k]) => b.append(F.slider(l, () => c.crop[k], (v) => { c.crop[k] = v; }, 0, 0.8, 0.005, (v) => Math.round(v * 100) + '%')));
  }
  b.append(h('div', { class: 'row2' },
    F.btn('Resetuj', () => { c.x = 0; c.y = 0; c.scale = 1; c.rot = 0; c.opacity = 1; c.flipX = c.flipY = false; c.kf = {}; c.crop = { l: 0, t: 0, r: 0, b: 0 }; commit(); }, '', 'rotate'),
    (c.type === 'video' || c.type === 'image') ? F.btn('Wypełnij kadr', () => { const m = getMedia(c), [W, H] = canvasSize(P.aspect, 720); if (m && m.w) { const a = W / m.w, d = H / m.h; c.scale = Math.max(a, d) / Math.min(a, d); c.x = 0; c.y = 0; c.kf = {}; commit(); } }, '', 'fit') : null));
  if (Object.keys(c.kf || {}).length) b.append(F.btn('Usuń wszystkie klatki kluczowe', () => { c.kf = {}; commit(); }, 'sm', 'diamond'));
};
UI.insMask = function (b, c) {
  const m = c.mask;
  b.append(F.hint('Maska ukrywa część klipu. Przydatna do „okienek”, serc i pasów kinowych.'));
  const g = h('div', { class: 'tgrid sm' });
  Object.entries(MASKS).forEach(([id, name]) => g.append(tile(name, (x, w, hh) => {
    x.fillStyle = '#23262f'; x.fillRect(0, 0, w, hh);
    if (id === 'none') { x.strokeStyle = '#6b7390'; x.lineWidth = 3; x.strokeRect(w * 0.3, hh * 0.25, w * 0.4, hh * 0.5); return; }
    x.save(); x.translate(w / 2, hh / 2); x.fillStyle = '#a79bff'; x.beginPath(); maskPath(x, id, hh * 0.3); x.clip(); x.fillRect(-w, -hh, w * 2, hh * 2); x.restore();
  }, { anim: false, active: m.id === id, onclick: () => { m.id = id; commit(); } })));
  b.append(g);
  if (m.id !== 'none') {
    b.append(F.slider('Rozmiar', () => m.s, (v) => { m.s = v; }, 0.1, 2, 0.01, pcFmt), F.slider('Pozycja X', () => m.x, (v) => { m.x = v; }, -1, 1, 0.01, pcFmt), F.slider('Pozycja Y', () => m.y, (v) => { m.y = v; }, -1, 1, 0.01, pcFmt),
      F.slider('Obrót', () => m.r, (v) => { m.r = v; }, -180, 180, 1, (v) => Math.round(v) + '°'), F.slider('Miękka krawędź', () => m.f, (v) => { m.f = v; }, 0, 1, 0.01, pcFmt), F.toggle('Odwróć maskę', () => m.inv, (v) => { m.inv = v; }));
  }
};
const pcFmt = (v) => Math.round(v * 100) + '%';
const _oldSpeed = UI.insSpeed;
UI.insSpeed = function (b, c) {
  _oldSpeed.call(this, b, c);
  b.append(F.title('Krzywa prędkości'));
  const g = h('div', { class: 'tgrid sm' });
  Object.entries(CURVES).forEach(([id, cv]) => g.append(tile(cv.name, (x, w, hh) => {
    x.fillStyle = '#20242f'; x.fillRect(0, 0, w, hh);
    const f = curveFns(id), N = 50; x.strokeStyle = id === 'none' ? '#6b7390' : '#a79bff'; x.lineWidth = 2.5; x.beginPath();
    for (let i = 0; i <= N; i++) { const u = i / N, mm = f ? f.m(u) : 1, y = hh - 8 - clamp(mm / 3.6, 0, 1) * (hh - 16); i ? x.lineTo(8 + u * (w - 16), y) : x.moveTo(8, y); }
    x.stroke();
  }, { anim: false, drag: id === 'none' ? null : { kind: 'curve', id }, active: (c.curve || 'none') === id, onclick: () => { c.curve = id; commit(); } })));
  b.append(g);
};
const _oldText = UI.insText;
UI.insText = function (b, c) {
  _oldText.call(this, b, c);
  const T = c.text;
  b.append(F.title('Efekty tekstu'));
  b.append(F.toggle('Gradient wypełnienia', () => !!T.fill2, (v) => { T.fill2 = v ? (T.fill2 || '#ff2d95') : ''; }));
  if (T.fill2) b.append(F.color('Kolor dolny', () => T.fill2, (v) => { T.fill2 = v; }));
  b.append(F.slider('Drugi obrys (zewnętrzny)', () => T.out2W, (v) => { T.out2W = v; }, 0, 0.2, 0.005, (v) => Math.round(v * 100)));
  if (T.out2W > 0) b.append(F.color('Kolor drugiego obrysu', () => T.out2C, (v) => { T.out2C = v; }));
  b.append(F.slider('Twardy cień (odsunięcie)', () => T.hardD, (v) => { T.hardD = v; }, 0, 0.15, 0.005, (v) => Math.round(v * 100)));
  if (T.hardD > 0) b.append(F.color('Kolor twardego cienia', () => T.hardC, (v) => { T.hardC = v; }));
};
UI.insOverlay = function (b, c) {
  const o = c.overlay;
  b.append(F.select('Nakładka', Object.values(OVERLAYS).map((d) => [d.id, d.name]), () => o.id, (v) => { o.id = v; o.color = OV_COLORS[v] || '#ffffff'; }));
  b.append(F.color('Kolor', () => o.color, (v) => { o.color = v; }));
  b.append(F.slider('Intensywność', () => o.amt, (v) => { o.amt = v; }, 0.1, 2, 0.05, pcFmt), F.slider('Tempo animacji', () => o.speed, (v) => { o.speed = v; }, 0.2, 3, 0.05, (v) => v.toFixed(2) + '×'), F.slider('Wariant (losowość)', () => o.seed, (v) => { o.seed = Math.round(v); }, 1, 60, 1, (v) => String(v)));
  b.append(F.hint('Tryb mieszania „Normalny” używa domyślnego dla tej nakładki (zwykle Rozjaśnij). Zmienisz go w „Podstawowe”.'));
};
