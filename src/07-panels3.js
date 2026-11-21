'use strict';
/* ============================================================
   Kadr Studio — mnóstwo stylów tekstu, szablony z animacją i pełne ustawienia tekstu jak w CapCut
   ============================================================ */
const mixHex = (a, b, k) => { const x = hex2rgb(a), y = hex2rgb(b); return '#' + [0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * k).toString(16).padStart(2, '0')).join(''); };
const COLS = [['czerwony', '#ff3b3b'], ['pomarańczowy', '#ff8a1f'], ['żółty', '#ffe14d'], ['limonkowy', '#b6ff3b'], ['zielony', '#2bff7a'], ['turkusowy', '#1ff2d0'], ['cyjan', '#27e1ff'], ['niebieski', '#3b82ff'], ['fioletowy', '#8b5cff'], ['różowy', '#ff4fb8'], ['magenta', '#ff2bd6'], ['biały', '#ffffff']];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
TEXT_CATS.splice(0, TEXT_CATS.length, 'Popularne', 'Szablony', 'Sport / edit', 'Neon', 'Poświata', 'Rozmyte', 'Gradient', 'Metaliczne', '3D / cień', 'Komiks', 'Retro', 'Elegancja', 'Zabawa', 'Etykiety', 'Napisy');

/* ---------- Neon (kolory × czcionki) ---------- */
COLS.forEach(([n, c]) => {
  TS('Neon ' + n, 'Neon', { font: 'Righteous', bold: false, color: mixHex(c, '#ffffff', 0.72), shadowC: c, shadowB: 0.62 });
  TS('Neon Orbitron ' + n, 'Neon', { font: 'Orbitron', bold: true, color: mixHex(c, '#ffffff', 0.7), glowC: c, glowA: 1, glowB: 0.8, shadowB: 0 });
});
/* ---------- Poświata (biały tekst + kolorowa poświata, mocniejsza) ---------- */
COLS.forEach(([n, c]) => TS('Poświata ' + n, 'Poświata', { font: 'Montserrat', bold: true, color: '#ffffff', glowC: c, glowA: 1.3, glowB: 0.9, shadowB: 0 }));
TS('Delikatna poświata', 'Poświata', { font: 'Poppins', bold: true, color: '#ffffff', glowC: '#ffffff', glowA: 0.6, glowB: 0.5, shadowB: 0 });
TS('Gorąca poświata', 'Poświata', { font: 'Anton', bold: false, color: '#fff3c4', glowC: '#ff5a1f', glowA: 1.4, glowB: 1, upper: true });
TS('Zimna poświata', 'Poświata', { font: 'Anton', bold: false, color: '#e8fbff', glowC: '#2ec8ff', glowA: 1.4, glowB: 1, upper: true });
TS('Toksyczna poświata', 'Poświata', { font: 'Bangers', bold: false, color: '#eaffb0', glowC: '#8dff00', glowA: 1.4, glowB: 1, upper: true });
/* ---------- Rozmyte ---------- */
[[0.25, 'lekko'], [0.5, 'średnio'], [0.9, 'mocno']].forEach(([b, n]) => {
  TS('Rozmyty biały (' + n + ')', 'Rozmyte', { font: 'Montserrat', bold: true, color: '#ffffff', blur: b, shadowB: 0 });
  TS('Rozmyty z poświatą (' + n + ')', 'Rozmyte', { font: 'Poppins', bold: true, color: '#ffffff', blur: b * 0.6, glowC: '#7c6cff', glowA: 1, glowB: 0.9, shadowB: 0 });
});
TS('Mgła', 'Rozmyte', { font: 'Playfair Display', bold: false, italic: true, color: '#dfe7ff', blur: 0.45, shadowB: 0.3, shadowC: '#8aa4ff' });
TS('Duch', 'Rozmyte', { font: 'Dancing Script', bold: true, color: '#ffffff', blur: 0.35, glowC: '#ffffff', glowA: 0.8, glowB: 0.8, shadowB: 0 });
TS('Rozmyty cień', 'Rozmyte', { font: 'Anton', bold: false, color: '#ffffff', upper: true, shadowC: '#000000', shadowB: 0.5, shD: 0.12, shAng: 90, shA: 0.9 });
TS('Sen', 'Rozmyte', { font: 'Pacifico', bold: false, color: '#ffd9f2', blur: 0.3, glowC: '#ff7ad9', glowA: 1, glowB: 0.8, shadowB: 0 });
/* ---------- Gradient ---------- */
const GR = [['Zachód', '#ffe259', '#ff4e50'], ['Ocean', '#00e5ff', '#2a5bff'], ['Cukierek', '#ff9ad5', '#9b5cff'], ['Mięta', '#c7ffd8', '#00c2a8'], ['Ogień', '#fff200', '#ff2a00'], ['Lód', '#ffffff', '#4fc3ff'], ['Fiolet-róż', '#7a5cff', '#ff4fb8'], ['Limonka', '#f9ff7a', '#22c55e'], ['Złoto', '#fff3b0', '#d4a017'], ['Srebro', '#ffffff', '#8fa3b8'], ['Krew', '#ff8a8a', '#a50014'], ['Noc', '#8ab4ff', '#2b1a6b'], ['Brzoskwinia', '#ffe0c2', '#ff7e7e'], ['Aurora', '#69ffc5', '#8a5cff'], ['Tęcza', '#ff4d4d', '#4d7dff']];
GR.forEach(([n, a, b], i) => {
  const f = ['Anton', 'Montserrat', 'Bangers', 'Poppins', 'Bebas Neue'][i % 5];
  TS('Gradient ' + n, 'Gradient', { font: f, bold: f !== 'Anton' && f !== 'Bangers' && f !== 'Bebas Neue', color: a, fill2: b, gradAng: i % 3 === 0 ? 90 : i % 3 === 1 ? 45 : 0, strokeC: '#000000', strokeW: i % 2 ? 0.08 : 0, shadowB: 0.2, shadowC: '#000000', upper: f !== 'Poppins', spacing: 0.02 });
});
/* ---------- Metaliczne ---------- */
[['Złoto', '#fff6c2', '#c98e12', '#5a3d00'], ['Srebro', '#ffffff', '#8f9bab', '#2a3340'], ['Brąz', '#ffd9b0', '#a0602a', '#3d2210'], ['Chrom', '#ffffff', '#6e86a3', '#0f1824'], ['Miedź', '#ffd0b0', '#b4532a', '#3b1608'], ['Różowe złoto', '#ffe3dc', '#d98a7a', '#5a2a22'], ['Platyna', '#f6fbff', '#a9b8c8', '#2a3a4a'], ['Tytan', '#dfe6ee', '#5c6b7c', '#161e28']].forEach(([n, a, b, s], i) =>
  TS('Metal ' + n, 'Metaliczne', { font: i % 2 ? 'Anton' : 'Bebas Neue', bold: false, color: a, fill2: b, gradAng: 90, strokeC: s, strokeW: 0.09, shadowB: 0.22, shadowC: '#000000', upper: true, spacing: 0.04 }));
/* ---------- 3D / cień ---------- */
COLS.forEach(([n, c], i) => TS('3D ' + n, '3D / cień', { font: i % 2 ? 'Anton' : 'Bangers', bold: false, color: '#ffffff', hardC: mixHex(c, '#000000', 0.15), hardD: 0.07, strokeC: mixHex(c, '#000000', 0.15), strokeW: 0.04, upper: true, spacing: 0.02 }));
TS('Cień po skosie', '3D / cień', { font: 'Montserrat', bold: true, color: '#ffffff', shadowC: '#000000', shadowB: 0, shD: 0.08, shAng: 45, shA: 1 });
TS('Cień długi', '3D / cień', { font: 'Russo One', bold: false, color: '#ffe14d', hardC: '#d17b00', hardD: 0.1 });
TS('Cień miękki', '3D / cień', { font: 'Poppins', bold: true, color: '#ffffff', shadowC: '#000000', shadowB: 0.45, shD: 0.1, shAng: 100, shA: 0.7 });
/* ---------- Komiks ---------- */
[['#ffe14d', '#e11d48'], ['#ffffff', '#2563eb'], ['#7dffb0', '#0b6b34'], ['#ff9ad5', '#7a0b45'], ['#ffb347', '#7a2d00'], ['#a5f3fc', '#0b4a6f'], ['#ffffff', '#111111'], ['#fff3a8', '#8a2be2']].forEach(([c, s], i) =>
  TS('Komiks ' + (i + 3), 'Komiks', { font: i % 2 ? 'Bangers' : 'Luckiest Guy', bold: false, color: c, strokeC: s, strokeW: 0.12, out2C: '#000000', out2W: 0.05, hardC: '#000000', hardD: 0.05, upper: true }));
/* ---------- Retro / Elegancja / Zabawa dodatkowe ---------- */
TS('Lata 80.', 'Retro', { font: 'Monoton', bold: false, color: '#ff9bd7', glowC: '#ff2d95', glowA: 1, glowB: 0.7, shadowB: 0, size: 0.1 });
TS('Chrome 80', 'Retro', { font: 'Righteous', bold: false, color: '#ffffff', fill2: '#ff4fb8', gradAng: 90, strokeC: '#2a0a55', strokeW: 0.08, hardC: '#00e5ff', hardD: 0.05, upper: true });
TS('Maszynopis', 'Retro', { font: 'Space Grotesk', bold: false, color: '#2b2b2b', bg: '#f3ecd8', bgA: 1, bgR: 0.05, spacing: 0.04 });
TS('Gazeta', 'Retro', { font: 'Playfair Display', bold: true, color: '#111111', bg: '#e9e2cf', bgA: 1, bgR: 0.02, upper: true, spacing: 0.04 });
TS('Western 2', 'Retro', { font: 'Rye', bold: false, color: '#ffe3a8', strokeC: '#4a2c14', strokeW: 0.1, hardC: '#2b1608', hardD: 0.05 });
TS('Piksele', 'Retro', { font: 'Press Start 2P', bold: false, color: '#7dffb0', hardC: '#0b6b34', hardD: 0.07, size: 0.05, upper: true });
TS('Pismo odręczne 2', 'Elegancja', { font: 'Shadows Into Light', bold: true, color: '#ffffff', shadowB: 0.2, size: 0.11 });
TS('Elegancki kontur', 'Elegancja', { font: 'Playfair Display', bold: false, color: 'rgba(255,255,255,0.02)', strokeC: '#ffffff', strokeW: 0.04, spacing: 0.1, upper: true, size: 0.08 });
TS('Złote litery', 'Elegancja', { font: 'DM Serif Display', bold: false, color: '#ffeaa0', fill2: '#d4a017', gradAng: 90, shadowB: 0.2, size: 0.1 });
TS('Neonowy skrypt', 'Elegancja', { font: 'Great Vibes', bold: false, color: '#ffd6f2', glowC: '#ff4fb8', glowA: 1.2, glowB: 0.9, size: 0.14 });
TS('Cukierkowy kontur', 'Zabawa', { font: 'Fredoka', bold: true, color: '#ffffff', strokeC: '#ff4fb8', strokeW: 0.18, hardC: '#a1196b', hardD: 0.05 });
TS('Galaretka', 'Zabawa', { font: 'Luckiest Guy', bold: false, color: '#9bff6b', strokeC: '#0b6b34', strokeW: 0.14, hardC: '#06401f', hardD: 0.06 });
TS('Kreda', 'Zabawa', { font: 'Shadows Into Light', bold: true, color: '#f4f4f4', blur: 0.08, shadowB: 0.1, size: 0.11 });
TS('Piankowy', 'Zabawa', { font: 'Bungee', bold: false, color: '#ffffff', strokeC: '#7c6cff', strokeW: 0.14, out2C: '#ffffff', out2W: 0.04, hardC: '#3b2db0', hardD: 0.05 });
/* ---------- Etykiety / napisy dodatkowe ---------- */
[['Pomarańczowa', '#ff8a1f', '#111111'], ['Turkusowa', '#14b8a6', '#ffffff'], ['Granatowa', '#1e3a8a', '#ffffff'], ['Limonkowa', '#a3e635', '#111111'], ['Szara', '#374151', '#ffffff'], ['Bordowa', '#7f1d1d', '#ffffff'], ['Złota', '#d4a017', '#111111'], ['Półprzezroczysta', '#000000', '#ffffff']].forEach(([n, c, f], i) =>
  TS(n, 'Etykiety', { font: i % 2 ? 'Oswald' : 'Montserrat', bold: true, color: f, bg: c, bgA: n === 'Półprzezroczysta' ? 0.55 : 1, bgR: i % 3 === 0 ? 0.5 : 0.18, upper: true, spacing: 0.03 }));
TS('Hormozi żółty', 'Napisy', { font: 'Montserrat', bold: true, color: '#ffe600', strokeC: '#000000', strokeW: 0.22, upper: true, size: 0.08, shadowB: 0, hardC: '#000000', hardD: 0.03 });
TS('Hormozi biały', 'Napisy', { font: 'Montserrat', bold: true, color: '#ffffff', strokeC: '#000000', strokeW: 0.22, upper: true, size: 0.08 });
TS('Hormozi zielony', 'Napisy', { font: 'Montserrat', bold: true, color: '#39ff6a', strokeC: '#000000', strokeW: 0.22, upper: true, size: 0.08 });
TS('Napisy: ciemne tło', 'Napisy', { font: 'Poppins', bold: true, color: '#ffffff', bg: '#000000', bgA: 0.7, bgR: 0.3, size: 0.055 });
TS('Napisy: żółte tło', 'Napisy', { font: 'Poppins', bold: true, color: '#111111', bg: '#ffe600', bgA: 1, bgR: 0.2, size: 0.055 });
TS('Napisy: kinowe', 'Napisy', { font: 'Playfair Display', bold: false, italic: true, color: '#fff7dc', shadowB: 0.25, size: 0.06 });
TS('Napisy: cienkie', 'Napisy', { font: 'Syne', bold: false, color: '#ffffff', shadowB: 0.3, spacing: 0.06, size: 0.05 });

/* ---------- Szablony z animacją ---------- */
const TPL = (name, t, a) => TEXT_STYLES.push({ name, cat: 'Szablony', t, a });
const IN = (id, dur = 1) => ({ id, dur }), LOOP = (id, amt = 1) => ({ id, amt });
TPL('Tytuł: litery pop', { font: 'Anton', bold: false, color: '#ffffff', hardC: '#e11d48', hardD: 0.05, upper: true, spacing: 0.03 }, { in: IN('letters', 1), out: IN('fade', 0.4) });
TPL('Neon: zapalenie', { font: 'Righteous', bold: false, color: '#d6fbff', shadowC: '#00e5ff', shadowB: 0.62 }, { in: IN('neonOn', 1.1), loop: LOOP('neonFlicker') });
TPL('Maszyna z kursorem', { font: 'Space Grotesk', bold: true, color: '#ffffff', bg: '#000000', bgA: 0.75, bgR: 0.1 }, { in: IN('typeCaret', 1.6) });
TPL('Szyfr (hacker)', { font: 'Orbitron', bold: true, color: '#7dff9a', glowC: '#22ff66', glowA: 1, glowB: 0.7, upper: true }, { in: IN('scramble', 1.2) });
TPL('Glitch tytuł', { font: 'Bangers', bold: false, color: '#ffffff', hardC: '#ff2d95', hardD: 0.05, strokeC: '#00e5ff', strokeW: 0.04, upper: true }, { in: IN('glitchLetters', 0.9), loop: LOOP('glitchLoop') });
TPL('Wiersze po kolei', { font: 'Montserrat', bold: true, color: '#ffffff', shadowB: 0.2, upper: true, spacing: 0.06 }, { in: IN('lineIn', 1.2), out: IN('fade', 0.4) });
TPL('Litery z lewej', { font: 'Poppins', bold: true, color: '#ffffff', shadowB: 0.25 }, { in: IN('slideLetters', 1) });
TPL('Rozmycie → ostrość', { font: 'Playfair Display', bold: false, italic: true, color: '#ffffff', shadowB: 0.2 }, { in: IN('blurText', 1.2) });
TPL('Spadające litery', { font: 'Luckiest Guy', bold: false, color: '#ffe14d', strokeC: '#e11d48', strokeW: 0.1, hardC: '#7a0b2a', hardD: 0.05 }, { in: IN('dropletters', 1.2) });
TPL('Zoom liter', { font: 'Bebas Neue', bold: false, color: '#ffffff', glowC: '#ffffff', glowA: 0.6, upper: true, spacing: 0.08, size: 0.12 }, { in: IN('zoomLetters', 1) });
TPL('Przewrót liter', { font: 'Anton', bold: false, color: '#ffffff', fill2: '#6fd3ff', upper: true }, { in: IN('flipLetters', 1) });
TPL('Fala liter', { font: 'Fredoka', bold: true, color: '#ffffff', strokeC: '#ff4fb8', strokeW: 0.14 }, { in: IN('letters', 0.9), loop: LOOP('wave') });
TPL('Tęczowy napis', { font: 'Montserrat', bold: true, color: '#ffffff', strokeC: '#000000', strokeW: 0.1 }, { in: IN('zoomLetters', 0.9), loop: LOOP('rainbow') });
TPL('Skaczące litery', { font: 'Bungee', bold: false, color: '#00e5ff', strokeC: '#003b66', strokeW: 0.1, hardC: '#003b66', hardD: 0.05 }, { in: IN('letters', 0.8), loop: LOOP('jumpLetters') });
TPL('Pulsująca poświata', { font: 'Poppins', bold: true, color: '#ffffff', glowC: '#7c6cff', glowA: 1.2, glowB: 0.9 }, { in: IN('fadeLetters', 1), loop: LOOP('glowPulse') });
TPL('Rozmyty duch', { font: 'Dancing Script', bold: true, color: '#ffffff', glowC: '#ffffff', glowA: 0.8 }, { in: IN('blurText', 1.2), loop: LOOP('blurPulse') });
TPL('Etykieta wjazd', { font: 'Montserrat', bold: true, color: '#ffffff', bg: '#e11d48', bgA: 1, bgR: 0.2, upper: true }, { in: IN('slideBigL', 0.5), out: IN('slideBigR', 0.5) });
TPL('Stempel', { font: 'Anton', bold: false, color: '#e11d48', strokeC: '#e11d48', strokeW: 0.03, upper: true, spacing: 0.04 }, { in: IN('stamp', 0.45) });
TPL('Gumka', { font: 'Luckiest Guy', bold: false, color: '#ffffff', strokeC: '#ff2d95', strokeW: 0.14, hardC: '#7a0b45', hardD: 0.05 }, { in: IN('rubber', 0.8), loop: LOOP('jellyLoop') });
TPL('Złoty wjazd', { font: 'Playfair Display', bold: true, color: '#fff2b8', fill2: '#c9971c', strokeC: '#4d3600', strokeW: 0.05, shadowB: 0.2, upper: true, spacing: 0.1 }, { in: IN('wipeL', 0.9), out: IN('wipeR', 0.6) });
TPL('Słowa po kolei', { font: 'Poppins', bold: true, color: '#ffffff', shadowB: 0.2 }, { in: IN('bounceWords', 1.2) });
TPL('Drżący horror', { font: 'Rye', bold: false, color: '#ff3b3b', blur: 0.1, glowC: '#ff0000', glowA: 1, glowB: 0.7 }, { in: IN('fadeLetters', 1), loop: LOOP('shakeLetters') });
TPL('Dolny pasek', { font: 'Teko', bold: true, color: '#ffffff', bg: '#0b3d91', bgA: 0.95, bgR: 0.06, upper: true, spacing: 0.04 }, { in: IN('wipeL', 0.5), out: IN('wipeL', 0.4) });
TPL('Hype: uderzenie', { font: 'Anton', bold: false, color: '#ffe600', strokeC: '#000000', strokeW: 0.16, upper: true, hardC: '#000', hardD: 0.04 }, { in: IN('punchin', 0.25), loop: LOOP('zoompunch') });

/* ---------- zastosowanie stylu (z animacją szablonu) ---------- */
function applyTextAnim(c, a) {
  if (!a) return;
  c.animIn = a.in ? { id: a.in.id, dur: a.in.dur } : { id: 'none', dur: 0.6 };
  c.animOut = a.out ? { id: a.out.id, dur: a.out.dur } : { id: 'none', dur: 0.6 };
  c.animLoop = a.loop ? { id: a.loop.id, amt: a.loop.amt } : { id: 'none', amt: 1 };
}
/* ---------- panel tekstu: kategorie + duży podgląd po najechaniu (z animacją szablonu) ---------- */
function textStylePreview(x, w, hh, p, style) {
  const big = w > 220;
  const T = Object.assign(defText(big ? 'Twój napis' : 'Aa'), styleFull(style.t));
  let tfx = null, st = { dx: 0, dy: 0, s: 1, r: 0, al: 1, bl: 0, fl: 1, fy: 1, cl: null };
  if (p != null && style.a) {
    const lt = p * 2.6, fake = { dur: 4, animIn: style.a.in || { id: 'none', dur: 1 }, animOut: { id: 'none', dur: 0.5 }, animLoop: style.a.loop || { id: 'none', amt: 1 } };
    st = animState(fake, lt);
    const ai = fake.animIn;
    if (TEXT_IN_MODES.includes(ai.id) && lt < ai.dur) tfx = { mode: ai.id, p: clamp(lt / ai.dur, 0, 1), t: lt };
    else if (TEXT_LOOP_MODES.includes(fake.animLoop.id)) tfx = { mode: fake.animLoop.id, t: lt, p: 1 };
  }
  T.size = big ? 0.2 : 0.5;
  const ref = big ? hh * 1.3 : hh * 1.2, refW = big ? w * 1.3 : ref;
  const sp = makeTextSprite(T, refW, ref, tfx);
  /* skalujemy według samego napisu (bez marginesów na poświatę i cień), żeby litery były duże */
  const plain = Object.assign({}, T, { shadowB: 0, glowA: 0, blur: 0, strokeW: 0, out2W: 0, hardD: 0, shD: 0, bg: '', ul: false });
  const tight = makeTextSprite(plain, refW, ref, null), padT = 0.5 * T.size * Math.min(refW, ref);
  const k = Math.min((w * 0.84) / Math.max(1, tight.width - padT), (hh * 0.7) / Math.max(1, tight.height - padT), big ? 2.2 : 1.6);
  x.fillStyle = big ? '#1b1e29' : '#23262f'; x.fillRect(0, 0, w, hh);
  x.save(); x.beginPath(); x.rect(0, 0, w, hh); x.clip();
  x.translate(w / 2 + st.dx * w, hh / 2 + st.dy * hh); x.rotate(st.r); x.scale(st.s * st.fl, st.s * st.fy); x.globalAlpha = clamp(st.al, 0, 1);
  if (HAS_FILTER && st.bl > 0.001) x.filter = `blur(${(st.bl * hh).toFixed(1)}px)`;
  if (st.cl) { x.beginPath(); x.rect(-sp.width * k / 2 + st.cl.l * sp.width * k, -sp.height * k / 2 + st.cl.t * sp.height * k, Math.max(0, sp.width * k * (1 - st.cl.l - st.cl.r)), Math.max(0, sp.height * k * (1 - st.cl.t - st.cl.b))); x.clip(); }
  x.drawImage(sp, -sp.width * k / 2, -sp.height * k / 2, sp.width * k, sp.height * k);
  x.restore();
  if (style.a) { x.font = `800 ${Math.round(hh * 0.09)}px sans-serif`; x.textAlign = 'right'; x.fillStyle = 'rgba(255,180,84,.95)'; x.fillText('▶ animacja', w - 6, hh - 6); }
}
UI.pText = function (box) {
  const sel = byId(S.sel), isText = sel && sel.type === 'text', cur = this.catState.text;
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Tekst'), h('span', { class: 'hint' }, TEXT_STYLES.length + ' stylów')), F.btn('Dodaj tekst', () => App.addText(), 'primary block', 'plus'),
    F.hint(isText ? 'Kliknij styl, aby zmienić zaznaczony napis, albo przeciągnij styl na podgląd lub oś. Najedź, aby zobaczyć duży podgląd.' : 'Kliknij styl albo przeciągnij go na podgląd lub oś. Najedź na kafelek, aby zobaczyć duży podgląd (szablony pokazują animację).'));
  box.append(h('div', { class: 'chips' }, TEXT_CATS.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.text = k; this.renderPanel(); } }, k))));
  const list = TEXT_STYLES.filter((s) => s.cat === cur);
  UI.loadFonts([...new Set(list.map((s) => s.t.font).filter(Boolean))]);
  const grid = h('div', { class: 'tgrid' });
  list.forEach((s) => grid.append(tile(s.name, (x, w, hh, p) => textStylePreview(x, w, hh, p, s), { anim: !!s.a, drag: { kind: 'text', style: s.t, anim: s.a }, onclick: () => App.addText(null, s.t, s.a), popTitle: s.name + (s.a ? ' · z animacją' : '') })));
  box.append(grid);
};

/* ============================================================
   USTAWIENIA TEKSTU jak w CapCut (zakładki: Tekst, Kolor, Obrys, Poświata, Cień, Tło, Rozmycie)
   ============================================================ */
F.sn = function (label, get, set, min, max, step, k = 1, unit = '') {
  const range = h('input', { type: 'range', min, max, step, value: get() });
  const num = h('input', { type: 'number', class: 'num', min: +(min * k).toFixed(3), max: +(max * k).toFixed(3), step: +(step * k).toFixed(4), value: +(get() * k).toFixed(2) });
  range.addEventListener('input', () => { set(+range.value); num.value = +(range.value * k).toFixed(2); Engine.invalidate(); });
  range.addEventListener('change', () => commit());
  num.addEventListener('input', () => { const v = clamp(+num.value / k, min, max); if (isFinite(v)) { set(v); range.value = v; Engine.invalidate(); } });
  num.addEventListener('change', () => commit());
  return h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, label), h('span', { class: 'numw' }, num, unit ? h('em', {}, unit) : null)), range);
};
UI.textSub = 'text';
UI.insText = function (b, c) {
  const T = c.text, subs = [['text', 'Tekst'], ['color', 'Kolor'], ['stroke', 'Obrys'], ['glow', 'Poświata'], ['shadow', 'Cień'], ['bg', 'Tło'], ['blur', 'Rozmycie']];
  b.append(h('div', { class: 'sub tsub' }, subs.map(([id, t]) => h('button', { class: this.textSub === id ? 'on' : '', onclick: () => { this.textSub = id; this.renderInspector(); } }, t))));
  const A = (el) => b.append(el), sz = (v) => v;
  if (this.textSub === 'text') {
    const ta = h('textarea', { rows: 3, class: 'txt', oninput: (e) => { T.str = e.target.value; Engine.invalidate(); }, onchange: () => commit() }, T.str);
    A(h('div', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Treść')), ta));
    A(F.select('Czcionka', TEXT_FONTS.map((f) => [f, f]), () => T.font, (v) => { T.font = v; document.fonts && document.fonts.load(`24px "${v}"`).then(() => { Engine.R && Engine.R.sprites.clear(); Engine.invalidate(); }).catch(() => {}); }));
    A(h('div', { class: 'row4' }, F.btn('B', () => { T.bold = !T.bold; commit(); }, (T.bold ? 'on ' : '') + 'sm'), F.btn('I', () => { T.italic = !T.italic; commit(); }, (T.italic ? 'on ' : '') + 'sm'), F.btn('U', () => { T.ul = !T.ul; commit(); }, (T.ul ? 'on ' : '') + 'sm'), F.btn('Aa', () => { T.upper = !T.upper; commit(); }, (T.upper ? 'on ' : '') + 'sm')));
    A(F.sn('Rozmiar', () => T.size, (v) => { T.size = v; }, 0.02, 0.4, 0.001, 100));
    A(F.sn('Odstęp liter', () => T.spacing, (v) => { T.spacing = v; }, -0.1, 0.6, 0.005, 100));
    A(F.sn('Odstęp wierszy', () => T.lineH, (v) => { T.lineH = v; }, 0.7, 2.5, 0.01, 100));
    A(F.seg('Wyrównanie', [['left', 'Lewo'], ['center', 'Środek'], ['right', 'Prawo']], () => T.align, (v) => { T.align = v; }));
    A(F.btn('Resetuj styl tekstu', () => { Object.assign(T, styleFull({}), { glowA: 0, blur: 0, shD: null, shAng: 90, shA: 1, ul: false, strokeA: 1, gradAng: 90, bgR: 0.22, bgP: 0.32, glowB: 0.5 }); commit(); }, 'sm', 'rotate'));
  } else if (this.textSub === 'color') {
    A(F.color('Kolor tekstu', () => T.color, (v) => { T.color = v; }));
    A(F.toggle('Gradient', () => !!T.fill2, (v) => { T.fill2 = v ? (T.fill2 || '#ff2d95') : ''; }));
    if (T.fill2) { A(F.color('Drugi kolor', () => T.fill2, (v) => { T.fill2 = v; })); A(F.sn('Kąt gradientu', () => T.gradAng == null ? 90 : T.gradAng, (v) => { T.gradAng = v; }, 0, 360, 1, 1, '°')); }
    A(F.hint('Krycie całego napisu ustawisz w „Podstawowe → Krycie”.'));
  } else if (this.textSub === 'stroke') {
    A(F.color('Kolor obrysu', () => T.strokeC, (v) => { T.strokeC = v; }));
    A(F.sn('Grubość obrysu', () => T.strokeW, (v) => { T.strokeW = v; }, 0, 0.4, 0.005, 100));
    A(F.sn('Krycie obrysu', () => T.strokeA == null ? 1 : T.strokeA, (v) => { T.strokeA = v; }, 0, 1, 0.01, 100, '%'));
    A(F.title('Drugi obrys'));
    A(F.color('Kolor', () => T.out2C, (v) => { T.out2C = v; }));
    A(F.sn('Grubość', () => T.out2W, (v) => { T.out2W = v; }, 0, 0.2, 0.005, 100));
  } else if (this.textSub === 'glow') {
    A(F.hint('Poświata jak w CapCut: kolorowa łuna wokół liter.'));
    A(F.color('Kolor poświaty', () => T.glowC || '#ffffff', (v) => { T.glowC = v; }));
    A(F.sn('Intensywność', () => T.glowA || 0, (v) => { T.glowA = v; }, 0, 1.6, 0.01, 100, '%'));
    A(F.sn('Rozmiar (rozmycie)', () => T.glowB == null ? 0.5 : T.glowB, (v) => { T.glowB = v; }, 0, 1.5, 0.01, 100));
  } else if (this.textSub === 'shadow') {
    A(F.color('Kolor cienia', () => T.shadowC, (v) => { T.shadowC = v; }));
    A(F.sn('Krycie', () => T.shA == null ? 1 : T.shA, (v) => { T.shA = v; }, 0, 1, 0.01, 100, '%'));
    A(F.sn('Rozmycie', () => T.shadowB, (v) => { T.shadowB = v; }, 0, 1, 0.01, 100));
    A(F.sn('Odległość', () => T.shD == null ? T.shadowB * 0.25 : T.shD, (v) => { T.shD = v; }, 0, 0.3, 0.005, 100));
    A(F.sn('Kąt', () => T.shAng == null ? 90 : T.shAng, (v) => { T.shAng = v; }, 0, 360, 1, 1, '°'));
    A(F.title('Twardy cień (3D)'));
    A(F.color('Kolor', () => T.hardC, (v) => { T.hardC = v; }));
    A(F.sn('Odsunięcie', () => T.hardD, (v) => { T.hardD = v; }, 0, 0.2, 0.005, 100));
  } else if (this.textSub === 'bg') {
    A(F.toggle('Tło pod tekstem', () => !!T.bg, (v) => { T.bg = v ? (T.bg || '#000000') : ''; }));
    if (T.bg) {
      A(F.color('Kolor tła', () => T.bg, (v) => { T.bg = v; }));
      A(F.sn('Krycie tła', () => T.bgA, (v) => { T.bgA = v; }, 0, 1, 0.01, 100, '%'));
      A(F.sn('Zaokrąglenie', () => T.bgR == null ? 0.22 : T.bgR, (v) => { T.bgR = v; }, 0, 0.8, 0.01, 100));
      A(F.sn('Odstęp od tekstu', () => T.bgP == null ? 0.32 : T.bgP, (v) => { T.bgP = v; }, 0, 1.2, 0.01, 100));
    }
  } else if (this.textSub === 'blur') {
    A(F.hint('Rozmycie samego tekstu (efekt „mgły” lub ducha).'));
    A(F.sn('Rozmycie tekstu', () => T.blur || 0, (v) => { T.blur = v; }, 0, 1, 0.01, 100, '%'));
  }
};
