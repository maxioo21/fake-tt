'use strict';
/* ============================================================
   Kadr Studio — ustawienia tekstu z podglądem na literze (jak w CapCut):
   każdy wybór (kolory, poświata, obrys, cień, tło, rozmycie, czcionka) to kafelek z Twoją literą
   ============================================================ */
const SW12 = ['#ffffff', '#ffe14d', '#ff8a1f', '#ff3b3b', '#ff4fb8', '#b44bff', '#5b8cff', '#27e1ff', '#1ff2d0', '#2bff7a', '#b6ff3b', '#111111'];
const SHIFT_PALS = [['#ff2d95', '#8b5cff'], ['#27e1ff', '#3b82ff'], ['#2bff7a', '#ffe14d'], ['#ff3b3b', '#ff8a1f'], ['#ffe14d', '#ffffff'], ['#8b5cff', '#27e1ff'], ['#ff4fb8', '#ffe14d', '#27e1ff'], ['#1ff2d0', '#ff4fb8'], ['#ff8a1f', '#ff2d95', '#8b5cff'], ['#27e1ff', '#ff2bd6', '#b6ff3b'], ['#ffffff', '#6fd3ff', '#8b5cff'], ['#fff200', '#ff2a00']];
const GRAD_PALS = [['#ffe259', '#ff4e50'], ['#00e5ff', '#2a5bff'], ['#ff9ad5', '#9b5cff'], ['#c7ffd8', '#00c2a8'], ['#fff200', '#ff2a00'], ['#ffffff', '#4fc3ff'], ['#7a5cff', '#ff4fb8'], ['#f9ff7a', '#22c55e'], ['#fff3b0', '#d4a017'], ['#ffffff', '#8fa3b8'], ['#ff8a8a', '#a50014'], ['#8ab4ff', '#2b1a6b']];
const ANIMATED_FILL = ['shift', 'rainbow', 'galaxy', 'glitter'];

function textLetter(T) { const ch = String(T.str == null ? 'A' : T.str).replace(/\s/g, '').charAt(0) || 'A'; return T.upper ? ch.toUpperCase() : ch; }
/* rysuje literę (z pełnymi ustawieniami tekstu) w kafelku, skalowaną według samego znaku */
function drawLetterOn(x, w, hh, T0, clock, backdrop) {
  const T = Object.assign({}, T0, { size: 0.5, lineH: 1.15, align: 'center', bg: T0.bg });
  const animFill = ANIMATED_FILL.includes(T.fillMode) || T.glowCycle || T.strokeCycle;
  const tfx = animFill ? { mode: 'fill', t: clock, p: 1 } : null;
  const ref = hh * 1.2, sp = makeTextSprite(T, ref, ref, tfx);
  const plain = Object.assign({}, T, { shadowB: 0, glowA: 0, blur: 0, strokeW: 0, out2W: 0, hardD: 0, shD: 0, bg: '', ul: false, fillMode: 'solid' });
  const tight = makeTextSprite(plain, ref, ref, null), padT = 0.5 * T.size * ref;
  const k = Math.min((w * 0.62) / Math.max(1, tight.width - padT), (hh * 0.62) / Math.max(1, tight.height - padT), 1.6);
  if (backdrop === 'glass') drawTextBackdrop(x, w, hh); else { x.fillStyle = '#1a1d27'; x.fillRect(0, 0, w, hh); }
  if (T0.cblend && T0.cblend !== 'normal') { /* nic: tryb mieszania jest na poziomie klipu */ }
  x.save(); x.beginPath(); x.rect(0, 0, w, hh); x.clip();
  x.drawImage(sp, (w - sp.width * k) / 2, (hh - sp.height * k) / 2, sp.width * k, sp.height * k);
  x.restore();
}
const sameVal = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= Math.max(0.06, Math.abs(b) * 0.1) : a === b);

/* siatka kafelków z literą; item: {label, patch, anim, active, backdrop, after, swatch} */
UI.letterGrid = function (c, items, opts = {}) {
  const T = c.text, letter = textLetter(T), g = h('div', { class: 'tgrid sm lgrid' + (opts.swatch ? ' sw' : '') });
  items.forEach((it) => {
    const patch = typeof it.patch === 'function' ? it.patch(T) : it.patch;
    const active = it.active ? it.active(T) : Object.keys(patch).every((k) => sameVal(T[k], patch[k]));
    const glass = it.backdrop || opts.backdrop || ((T.fillA != null && T.fillA < 0.9 && !patch.fillA) ? 'glass' : null);
    g.append(tile(it.label || '', (x, w, hh, p, tm) => drawLetterOn(x, w, hh, Object.assign({}, T, patch, { str: letter }), p == null ? 1.2 : tm, glass),
      { anim: !!it.anim, pop: false, active, title: it.title || it.label || '', onclick: () => { Object.assign(T, patch); if (it.after) it.after(c); commit(); } }));
  });
  return g;
};
const _loadFonts = UI.loadFonts;
UI.loadFonts = function (fonts) {
  if (!document.fonts || !document.fonts.load) return;
  const need = fonts.filter((f) => !UI._fl.has(f));
  if (!need.length) return;
  need.forEach((f) => UI._fl.add(f));
  Promise.all(need.map((f) => document.fonts.load(`700 24px "${f}"`).catch(() => {}))).then(() => { if (S.tab === 'text') UI.renderPanel(true); if (UI.insTab === 'text') UI.renderInspector(); });
};

UI.textSub = 'text';
UI.insText = function (b, c) {
  const T = c.text, A = (el) => b.append(el), sub = this.textSub;
  const subs = [['text', 'Tekst'], ['color', 'Kolor'], ['stroke', 'Obrys'], ['glow', 'Poświata'], ['shadow', 'Cień'], ['bg', 'Tło'], ['blur', 'Rozmycie']];
  A(h('div', { class: 'sub tsub' }, subs.map(([id, t]) => h('button', { class: sub === id ? 'on' : '', onclick: () => { this.textSub = id; this.renderInspector(); } }, t))));
  const swatches = (fn, label) => { A(F.title(label)); A(this.letterGrid(c, SW12.map((col) => ({ label: col, patch: fn(col) })), { swatch: true })); };

  if (sub === 'text') {
    const ta = h('textarea', { rows: 3, class: 'txt', oninput: (e) => { T.str = e.target.value; Engine.invalidate(); }, onchange: () => commit() }, T.str);
    A(h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Treść')), ta));
    A(F.title('Czcionka'));
    UI.loadFonts(TEXT_FONTS);
    A(this.letterGrid(c, TEXT_FONTS.map((f) => ({ label: f, patch: { font: f }, after: () => { document.fonts && document.fonts.load(`24px "${f}"`).then(() => { Engine.R && Engine.R.sprites.clear(); Engine.invalidate(); }).catch(() => {}); } })), { swatch: false }));
    A(h('div', { class: 'row4' }, F.btn('B', () => { T.bold = !T.bold; commit(); }, (T.bold ? 'on ' : '') + 'sm'), F.btn('I', () => { T.italic = !T.italic; commit(); }, (T.italic ? 'on ' : '') + 'sm'), F.btn('U', () => { T.ul = !T.ul; commit(); }, (T.ul ? 'on ' : '') + 'sm'), F.btn('Aa', () => { T.upper = !T.upper; commit(); }, (T.upper ? 'on ' : '') + 'sm')));
    A(F.sn('Rozmiar', () => T.size, (v) => { T.size = v; }, 0.02, 0.4, 0.001, 100));
    A(F.sn('Odstęp liter', () => T.spacing, (v) => { T.spacing = v; }, -0.1, 0.6, 0.005, 100));
    A(F.sn('Odstęp wierszy', () => T.lineH, (v) => { T.lineH = v; }, 0.7, 2.5, 0.01, 100));
    A(F.seg('Wyrównanie', [['left', 'Lewo'], ['center', 'Środek'], ['right', 'Prawo']], () => T.align, (v) => { T.align = v; }));
    A(F.btn('Resetuj styl tekstu', () => { Object.assign(T, styleFull({}), { size: T.size }); commit(); }, 'sm', 'rotate'));
  } else if (sub === 'color') {
    const mode = T.fillMode || (T.fill2 ? 'gradient' : 'solid'), animated = ANIMATED_FILL.includes(mode);
    A(F.title('Rodzaj wypełnienia'));
    A(this.letterGrid(c, [
      { label: 'Jednolity', patch: { fillMode: 'solid' }, active: () => mode === 'solid' },
      { label: 'Gradient', patch: { fillMode: 'gradient', fill2: T.fill2 || '#ff2d95' }, active: () => mode === 'gradient' },
      { label: 'Zmiana kolorów', patch: { fillMode: 'shift', fill2: T.fill2 || '#ff2d95', fillSpread: T.fillSpread == null ? 1 : T.fillSpread }, anim: true, active: () => mode === 'shift' },
      { label: 'Tęcza', patch: { fillMode: 'rainbow' }, anim: true, active: () => mode === 'rainbow' },
      { label: 'Galaktyka', patch: { fillMode: 'galaxy', fill2: T.fill2 || '#c026d3', fill3: T.fill3 || '#7c3aed' }, anim: true, active: () => mode === 'galaxy' },
      { label: 'Brokat', patch: { fillMode: 'glitter', fill2: T.fill2 || '#ffb300', fill3: T.fill3 || '#fff3b0' }, anim: true, active: () => mode === 'glitter' },
    ]));
    A(F.title('Zmieniające się kolory (kliknij literę)'));
    A(this.letterGrid(c, SHIFT_PALS.map((p) => ({ label: p[0], patch: { fillMode: 'shift', color: p[0], fill2: p[1], fill3: p[2] || '', fillSpread: T.fillSpread == null ? 1 : T.fillSpread }, anim: true, active: () => mode === 'shift' && T.color === p[0] && T.fill2 === p[1] })), { swatch: true }));
    A(F.title('Gradienty'));
    A(this.letterGrid(c, GRAD_PALS.map((p) => ({ label: p[0], patch: { fillMode: 'gradient', color: p[0], fill2: p[1], fill3: '' }, active: () => mode === 'gradient' && T.color === p[0] && T.fill2 === p[1] })), { swatch: true }));
    A(F.title('Kolory jednolite'));
    A(this.letterGrid(c, SW12.map((col) => ({ label: col, patch: { fillMode: 'solid', color: col }, active: () => mode === 'solid' && T.color === col })), { swatch: true }));
    A(F.title('Dokładne ustawienia'));
    if (mode !== 'rainbow') A(F.color('Kolor 1', () => T.color, (v) => { T.color = v; }));
    if (mode !== 'solid' && mode !== 'rainbow') {
      A(F.color('Kolor 2', () => T.fill2 || '#ff2d95', (v) => { T.fill2 = v; }));
      A(F.toggle('Trzeci kolor', () => !!T.fill3, (v) => { T.fill3 = v ? (T.fill3 || '#27e1ff') : ''; }));
      if (T.fill3) A(F.color('Kolor 3', () => T.fill3, (v) => { T.fill3 = v; }));
    }
    if (mode === 'gradient') A(F.sn('Kąt gradientu', () => T.gradAng == null ? 90 : T.gradAng, (v) => { T.gradAng = v; }, 0, 360, 1, 1, '°'));
    if (animated) {
      A(F.sn('Szybkość zmiany kolorów', () => T.fillSpeed == null ? 1 : T.fillSpeed, (v) => { T.fillSpeed = v; }, 0, 4, 0.05, 100, '%'));
      A(F.sn('Rozciągnięcie kolorów', () => T.fillSpread == null ? 1 : T.fillSpread, (v) => { T.fillSpread = v; }, 0, 3, 0.05, 100, '%'));
    }
    if (mode === 'galaxy' || mode === 'glitter') {
      A(F.sn('Gęstość iskier', () => T.spark == null ? 0.5 : T.spark, (v) => { T.spark = v; }, 0, 1, 0.01, 100, '%'));
      A(F.color('Kolor iskier', () => T.sparkC || '#ffffff', (v) => { T.sparkC = v; }));
    }
    A(F.sn('Przezroczystość tekstu (krycie wypełnienia)', () => T.fillA == null ? 1 : T.fillA, (v) => { T.fillA = v; }, 0, 1, 0.01, 100, '%'));
    A(F.btn('Zrób przezroczysty (szkło)', () => { T.fillA = 0.25; T.strokeC = '#ffffff'; T.strokeW = Math.max(T.strokeW, 0.035); T.strokeA = 0.95; T.glowA = Math.max(T.glowA || 0, 1); T.glowB = 0.6; c.blend = 'screen'; commit(); }, 'sm', 'sparkles'));
  } else if (sub === 'stroke') {
    A(F.title('Rodzaj obrysu'));
    A(this.letterGrid(c, [
      { label: 'Brak', patch: { strokeW: 0, out2W: 0, strokeCycle: false } },
      { label: 'Cienki', patch: { strokeW: 0.04, out2W: 0 } },
      { label: 'Średni', patch: { strokeW: 0.09, out2W: 0 } },
      { label: 'Gruby', patch: { strokeW: 0.16, out2W: 0 } },
      { label: 'Podwójny', patch: { strokeW: 0.07, out2W: 0.06, out2C: T.out2C || '#000000' } },
      { label: 'Zmienny kolor', patch: { strokeCycle: true, strokeW: Math.max(T.strokeW, 0.07) }, anim: true },
    ]));
    swatches((col) => ({ strokeC: col, strokeCycle: false, strokeW: Math.max(T.strokeW, 0.07) }), 'Kolor obrysu (kliknij literę)');
    A(F.title('Dokładne ustawienia'));
    A(F.color('Kolor obrysu', () => T.strokeC, (v) => { T.strokeC = v; }));
    A(F.sn('Grubość obrysu', () => T.strokeW, (v) => { T.strokeW = v; }, 0, 0.4, 0.005, 100));
    A(F.sn('Krycie obrysu', () => T.strokeA == null ? 1 : T.strokeA, (v) => { T.strokeA = v; }, 0, 1, 0.01, 100, '%'));
    A(F.toggle('Kolor obrysu zmienia się (kolory z zakładki Kolor)', () => !!T.strokeCycle, (v) => { T.strokeCycle = v; }));
    A(F.title('Drugi obrys'));
    A(F.color('Kolor', () => T.out2C, (v) => { T.out2C = v; }));
    A(F.sn('Grubość', () => T.out2W, (v) => { T.out2W = v; }, 0, 0.2, 0.005, 100));
  } else if (sub === 'glow') {
    A(F.title('Siła poświaty (kliknij literę)'));
    A(this.letterGrid(c, [
      { label: 'Brak', patch: { glowA: 0 } },
      { label: 'Delikatna', patch: { glowA: 0.6, glowB: 0.5 } },
      { label: 'Średnia', patch: { glowA: 1.3, glowB: 0.7 } },
      { label: 'Mocna', patch: { glowA: 2.2, glowB: 0.9 } },
      { label: 'Bardzo mocna', patch: { glowA: 3.2, glowB: 1.2 } },
      { label: 'Ekstremalna', patch: { glowA: 4, glowB: 1.7 } },
      { label: 'Zmienia kolor', patch: { glowCycle: true, glowA: Math.max(T.glowA || 0, 2) }, anim: true, active: () => !!T.glowCycle },
    ], { backdrop: null }));
    swatches((col) => ({ glowC: col, glowCycle: false, glowA: Math.max(T.glowA || 0, 2.2), glowB: Math.max(T.glowB == null ? 0.5 : T.glowB, 0.8) }), 'Kolor poświaty (kliknij literę)');
    A(F.title('Dokładne ustawienia'));
    A(F.toggle('Kolor poświaty zmienia się (kolory z zakładki Kolor)', () => !!T.glowCycle, (v) => { T.glowCycle = v; }));
    if (!T.glowCycle) A(F.color('Kolor poświaty', () => T.glowC || '#ffffff', (v) => { T.glowC = v; }));
    A(F.sn('Intensywność', () => T.glowA || 0, (v) => { T.glowA = v; }, 0, 4, 0.01, 100, '%'));
    A(F.sn('Rozmiar (rozmycie)', () => T.glowB == null ? 0.5 : T.glowB, (v) => { T.glowB = v; }, 0, 2.5, 0.01, 100));
    A(F.hint('Aby poświata była naprawdę mocna: intensywność powyżej 250% i rozmiar powyżej 100%.'));
  } else if (sub === 'shadow') {
    A(F.title('Rodzaj cienia (kliknij literę)'));
    A(this.letterGrid(c, [
      { label: 'Brak', patch: { shadowB: 0, shD: 0, hardD: 0 } },
      { label: 'Miękki', patch: { shadowB: 0.3, shD: 0.06, shA: 0.7, shAng: 90, hardD: 0 } },
      { label: 'Rozmyty', patch: { shadowB: 0.8, shD: 0.12, shA: 0.9, shAng: 90, hardD: 0 } },
      { label: 'Po skosie', patch: { shadowB: 0.05, shD: 0.09, shA: 1, shAng: 45, hardD: 0 } },
      { label: 'Twardy 3D', patch: { shadowB: 0, shD: 0, hardD: 0.07, hardC: T.hardC || '#000000' } },
      { label: 'Długi 3D', patch: { shadowB: 0, shD: 0, hardD: 0.13, hardC: T.hardC || '#000000' } },
    ]));
    swatches((col) => ({ shadowC: col, hardC: col, shadowB: Math.max(T.shadowB, 0.3), shD: T.shD == null ? 0.06 : Math.max(T.shD, 0.05), hardD: T.hardD }), 'Kolor cienia (kliknij literę)');
    A(F.title('Dokładne ustawienia'));
    A(F.color('Kolor cienia', () => T.shadowC, (v) => { T.shadowC = v; }));
    A(F.sn('Krycie', () => T.shA == null ? 1 : T.shA, (v) => { T.shA = v; }, 0, 1, 0.01, 100, '%'));
    A(F.sn('Rozmycie', () => T.shadowB, (v) => { T.shadowB = v; }, 0, 1.2, 0.01, 100));
    A(F.sn('Odległość', () => T.shD == null ? T.shadowB * 0.25 : T.shD, (v) => { T.shD = v; }, 0, 0.3, 0.005, 100));
    A(F.sn('Kąt', () => T.shAng == null ? 90 : T.shAng, (v) => { T.shAng = v; }, 0, 360, 1, 1, '°'));
    A(F.title('Twardy cień (3D)'));
    A(F.color('Kolor', () => T.hardC, (v) => { T.hardC = v; }));
    A(F.sn('Odsunięcie', () => T.hardD, (v) => { T.hardD = v; }, 0, 0.2, 0.005, 100));
  } else if (sub === 'bg') {
    A(F.title('Tło pod tekstem (kliknij literę)'));
    A(this.letterGrid(c, [
      { label: 'Brak', patch: { bg: '' } },
      { label: 'Ciemne', patch: { bg: '#000000', bgA: 0.7 } },
      { label: 'Żółta etykieta', patch: { bg: '#ffe600', bgA: 1, color: '#111111' } },
      { label: 'Czerwona', patch: { bg: '#e11d48', bgA: 1, color: '#ffffff' } },
      { label: 'Biała', patch: { bg: '#ffffff', bgA: 1, color: '#111111' } },
      { label: 'Pigułka', patch: { bg: T.bg || '#000000', bgA: Math.max(T.bgA || 0.7, 0.7), bgR: 0.8 } },
      { label: 'Szklane', patch: { bg: '#ffffff', bgA: 0.2, bgR: 0.3 } },
    ]));
    A(F.title('Kolor tła (kliknij literę)'));
    A(this.letterGrid(c, SW12.map((col) => ({ label: col, patch: { bg: col, bgA: Math.max(T.bgA || 0.8, 0.8), color: ['#ffffff', '#ffe14d', '#b6ff3b', '#2bff7a', '#27e1ff', '#1ff2d0'].includes(col) ? '#111111' : '#ffffff' } })), { swatch: true }));
    A(F.title('Dokładne ustawienia'));
    A(F.toggle('Tło pod tekstem', () => !!T.bg, (v) => { T.bg = v ? (T.bg || '#000000') : ''; }));
    if (T.bg) {
      A(F.color('Kolor tła', () => T.bg, (v) => { T.bg = v; }));
      A(F.sn('Krycie tła', () => T.bgA, (v) => { T.bgA = v; }, 0, 1, 0.01, 100, '%'));
      A(F.sn('Zaokrąglenie', () => T.bgR == null ? 0.22 : T.bgR, (v) => { T.bgR = v; }, 0, 0.8, 0.01, 100));
      A(F.sn('Odstęp od tekstu', () => T.bgP == null ? 0.32 : T.bgP, (v) => { T.bgP = v; }, 0, 1.2, 0.01, 100));
    }
  } else if (sub === 'blur') {
    A(F.title('Rozmycie tekstu (kliknij literę)'));
    A(this.letterGrid(c, [{ label: 'Brak', patch: { blur: 0 } }, { label: 'Lekkie', patch: { blur: 0.15 } }, { label: 'Średnie', patch: { blur: 0.35 } }, { label: 'Mocne', patch: { blur: 0.7 } }, { label: 'Mgła', patch: { blur: 0.5, glowA: Math.max(T.glowA || 0, 1.5), glowC: T.glowC || '#ffffff' } }]));
    A(F.sn('Rozmycie tekstu', () => T.blur || 0, (v) => { T.blur = v; }, 0, 1, 0.01, 100, '%'));
  }
};
