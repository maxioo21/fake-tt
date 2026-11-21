'use strict';
/* ============================================================
   Kadr Studio — uporządkowane kategorie („Wszystkie” + kilka grup), panel tekstu z wyszukiwarką,
   naklejki, animacje w inspektorze (Wejście / Wyjście / Pętla z kategoriami)
   ============================================================ */
const FX_GROUPS = ['Popularne', 'Glitch', 'Retro', 'Ruch', 'Światło i kolor'];
const fxGroup = (c) => (c === 'Światło' || c === 'Kolor' ? 'Światło i kolor' : c);
const FILTER_GROUPS = ['Popularne', 'Kino', 'Kolory', 'Retro', 'Czerń i biel'];
const filterGroup = (c) => (c === 'Ciepłe i zimne' || c === 'Kolorowe' ? 'Kolory' : c);
const OVL_GROUPS = ['Światło i błysk', 'Ruch', 'Cząsteczki i pogoda', 'Glitch i inne'];
const ovlGroup = (c) => ({ 'Światło': 'Światło i błysk', 'Błysk': 'Światło i błysk', 'Ruch': 'Ruch', 'Cząsteczki': 'Cząsteczki i pogoda', 'Pogoda': 'Cząsteczki i pogoda', 'Glitch': 'Glitch i inne', 'Inne': 'Glitch i inne' }[c] || 'Glitch i inne');
['effects', 'trans', 'filters', 'stickers', 'text', 'ovl', 'pack', 'looks'].forEach((k) => { UI.catState[k] = 'Wszystkie'; });

/* ---------- tekst: 6 grup + wyszukiwarka + „Pokaż więcej” ---------- */
const TEXT_GROUPS = ['Szablony', 'Szkło i rozmycie', 'Kolory i neon', 'Edit i 3D', 'Klasyczne', 'Napisy i etykiety'];
const TEXT_GROUP_OF = { 'Szablony': 'Szablony', 'Przezroczyste': 'Szkło i rozmycie', 'Rozmyte': 'Szkło i rozmycie', 'Zmienne kolory': 'Kolory i neon', 'Galaktyka i brokat': 'Kolory i neon', 'Neon': 'Kolory i neon', 'Poświata': 'Kolory i neon', 'Gradient': 'Kolory i neon', 'Metaliczne': 'Kolory i neon', 'Sport / edit': 'Edit i 3D', '3D / cień': 'Edit i 3D', 'Komiks': 'Edit i 3D', 'Popularne': 'Klasyczne', 'Retro': 'Klasyczne', 'Elegancja': 'Klasyczne', 'Zabawa': 'Klasyczne', 'Etykiety': 'Napisy i etykiety', 'Napisy': 'Napisy i etykiety' };
const textGroup = (cat) => TEXT_GROUP_OF[cat] || 'Klasyczne';
/* neutralne tło do podglądu przezroczystych napisów (bez postaci) */
function drawTextBackdrop(x, w, h) {
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2b1055'); g.addColorStop(0.55, '#c2417a'); g.addColorStop(1, '#ffb46b');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.arc(w * 0.82, h * 0.22, h * 0.2, 0, 7); x.fill(); x.beginPath(); x.arc(w * 0.12, h * 0.85, h * 0.26, 0, 7); x.fill();
  x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.moveTo(0, h); x.lineTo(0, h * 0.72); x.lineTo(w * 0.3, h * 0.58); x.lineTo(w * 0.55, h * 0.78); x.lineTo(w * 0.8, h * 0.6); x.lineTo(w, h * 0.75); x.lineTo(w, h); x.fill();
}
UI.textQuery = ''; UI.textLimit = 48;
UI.pText = function (box) {
  const sel = byId(S.sel), isText = sel && sel.type === 'text', cur = this.catState.text, q = (this.textQuery || '').trim().toLowerCase();
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Tekst'), h('span', { class: 'hint' }, TEXT_STYLES.length + ' stylów')), F.btn('Dodaj tekst', () => App.addText(), 'primary block', 'plus'));
  if (isText) box.append(F.btn('Dodaj animację do tego napisu', () => { UI.insTab = 'anim'; UI.animSub = 'in'; UI.renderInspector(); if (document.body.dataset.mobile) UI.openTab('inspect'); toast('Wybierz animację w panelu po prawej (zakładka Animacje)'); }, 'block', 'sparkles'));
  let timer = 0;
  box.append(h('input', { type: 'search', class: 'txt tsearch', placeholder: 'Szukaj stylu, np. neon, szkło, złoty…', value: this.textQuery || '', oninput: (e) => {
    clearTimeout(timer); const v = e.target.value; timer = setTimeout(() => { this.textQuery = v; this.textLimit = 48; this.renderPanel(true); const i = $('#panel .tsearch'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 250);
  } }));
  box.append(h('div', { class: 'chips' }, ['Wszystkie', ...TEXT_GROUPS].map((k) => h('button', { class: 'chip' + (k === cur && !q ? ' on' : ''), onclick: () => { this.catState.text = k; this.textQuery = ''; this.textLimit = 48; this.renderPanel(); } }, k))));
  let list = TEXT_STYLES.slice();
  if (q) list = list.filter((s) => (s.name + ' ' + (s.t.font || '') + ' ' + s.cat).toLowerCase().includes(q));
  else if (cur !== 'Wszystkie') list = list.filter((s) => textGroup(s.cat) === cur);
  else list.sort((a, b) => TEXT_GROUPS.indexOf(textGroup(a.cat)) - TEXT_GROUPS.indexOf(textGroup(b.cat)));
  const shown = list.slice(0, this.textLimit);
  UI.loadFonts([...new Set(shown.map((s) => s.t.font).filter(Boolean))]);
  if (!list.length) box.append(F.hint('Nic nie znaleziono. Spróbuj innego słowa.'));
  const grid = h('div', { class: 'tgrid' });
  shown.forEach((s) => grid.append(tile(s.name, (x, w, hh, p, tm) => textStylePreview(x, w, hh, p, s, tm), { anim: !!s.a || ['shift', 'rainbow', 'galaxy', 'glitter'].includes(s.t.fillMode) || !!s.t.glowCycle || !!s.t.strokeCycle, drag: { kind: 'text', style: s.t, anim: s.a }, onclick: () => App.addText(null, s.t, s.a), popTitle: s.name + (s.a ? ' · z animacją' : '') })));
  box.append(grid);
  if (list.length > shown.length) box.append(F.btn('Pokaż więcej (' + (list.length - shown.length) + ')', () => { this.textLimit += 48; this.renderPanel(true); }, 'block'));
  box.append(F.hint('Kliknij styl albo przeciągnij go na podgląd lub oś. Najedź na kafelek, aby zobaczyć duży podgląd. Animację dodasz po zaznaczeniu napisu w panelu po prawej (zakładka Animacje).'));
};

/* ---------- naklejki: 5 grup + kształty ---------- */
const EMO_GROUPS = { 'Popularne': ['Popularne'], 'Emocje': ['Buźki', 'Gesty', 'Reakcje'], 'Natura i jedzenie': ['Natura', 'Jedzenie', 'Podróże'], 'Sport i muzyka': ['Sport', 'Muzyka i film'], 'Symbole': ['Symbole'] };
UI.pStickers = function (box) {
  const cats = ['Wszystkie', ...Object.keys(EMO_GROUPS), 'Kształty'], cur = cats.includes(this.catState.stickers) ? this.catState.stickers : 'Wszystkie';
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
    box.append(F.hint('Kształty możesz przesuwać, skalować i obracać na podglądzie. Kolor zmienisz w „Edytuj → Pozycja”.'));
    return;
  }
  const keys = cur === 'Wszystkie' ? Object.keys(EMOJI) : EMO_GROUPS[cur], all = [...new Set(keys.flatMap((k) => EMOJI[k] || []))];
  box.append(h('div', { class: 'egrid' }, all.map((e) => { const b = h('button', { class: 'emo', title: 'Kliknij lub przeciągnij na podgląd / oś czasu', onclick: () => App.addSticker(e) }, e); DND.attach(b, { kind: 'sticker', emoji: e, name: e }); return b; })));
  box.append(F.hint('Kliknij naklejkę, aby dodać ją do filmu. Przesuwaj, skaluj i obracaj ją bezpośrednio na podglądzie.'));
};

/* ---------- inspektor: kolejność zakładek dla tekstu (Animacje zaraz po Tekst) ---------- */
const _tabsFor = UI.insTabsFor;
UI.insTabsFor = function (c) {
  if (c && c.type === 'text') return [['text', 'Tekst'], ['anim', 'Animacje'], ['basic', 'Pozycja'], ['fxs', 'Efekty']];
  if (c && c.type === 'sticker') return [['basic', 'Pozycja'], ['anim', 'Animacje'], ['fxs', 'Efekty']];
  return _tabsFor.call(this, c);
};

/* ---------- animacje: Wejście / Wyjście / Pętla + kategorie ---------- */
const ANIM_CAT_LISTS = {
  io: {
    'Podstawowe': ['fade', 'zoomin', 'zoomout', 'slideL', 'slideR', 'slideU', 'slideD', 'rise', 'blur', 'pop', 'punchin', 'slowfade', 'flip', 'unfold'],
    'Ruch': ['slideBigL', 'slideBigR', 'slideBigU', 'slideBigD', 'bounce', 'bounceL', 'bounceR', 'bounceU', 'dropZoom', 'fly', 'swipeDiag', 'rollIn', 'blurSlide', 'whip', 'stretch', 'jump', 'stamp'],
    'Obroty i skala': ['spin', 'twist', 'swirl', 'tornado', 'popRotate', 'spinH', 'elastic', 'rubber', 'jelly', 'squash', 'unfoldY', 'flipY', 'rotL', 'rotR', 'swing', 'tiltin', 'hyperzoom', 'zoomBlur', 'heartIn'],
    'Odsłanianie': ['wipeL', 'wipeR', 'wipeU', 'wipeD', 'wipeC', 'wipeCV'],
    'Efekty': ['glitchin', 'flicker', 'strobeIn', 'ghost', 'ripple', 'shakeIn', 'wobbleIn', 'zoomshake'],
  },
  loop: {
    'Skala i puls': ['pulse', 'heart', 'heartbeat2', 'breathe', 'beat', 'zoompunch', 'zoomWiggle', 'squashloop', 'rubberLoop', 'jellyLoop', 'wobbleY', 'tada'],
    'Ruch': ['float', 'floatRot', 'hop', 'orbit', 'fig8', 'swingY', 'drift', 'driftUp', 'sway', 'rockBoat', 'jitter', 'shiver', 'shakeheavy', 'wobble'],
    'Obroty': ['spin', 'spinSlow', 'swing', 'tilt', 'tiltShake', 'spinback', 'spinZoomLoop', 'flipx'],
    'Kamera': ['kbIn', 'kbOut', 'panL', 'panR', 'dolly', 'lift'],
    'Efekty': ['blink', 'strobeLoop', 'glitchLoop', 'opacityPulse', 'glowpulse'],
  },
};
function animCategory(id, kind, def) {
  if (def && def.textOnly) return 'Litery i słowa';
  const L = ANIM_CAT_LISTS[kind === 'loop' ? 'loop' : 'io'];
  for (const k in L) if (L[k].includes(id)) return k;
  return 'Efekty';
}
UI.animSub = 'in'; UI.animCat = 'Wszystkie';
UI.insAnim = function (b, c) {
  const isText = c.type === 'text', kind = this.animSub, key = { in: 'animIn', out: 'animOut', loop: 'animLoop' }[kind], dict = kind === 'loop' ? ANIM_LOOP : ANIM_IO;
  b.append(h('div', { class: 'animtabs' }, [['in', 'Wejście', 'animIn'], ['out', 'Wyjście', 'animOut'], ['loop', 'Pętla', 'animLoop']].map(([id, t, k]) =>
    h('button', { class: this.animSub === id ? 'on' : '', onclick: () => { this.animSub = id; this.animCat = 'Wszystkie'; this.renderInspector(); } }, t, c[k].id !== 'none' ? h('i', { class: 'dot' }) : null))));
  const entries = Object.entries(dict).filter(([id, a]) => id !== 'none' && (!a.textOnly || isText));
  const order = Object.keys(ANIM_CAT_LISTS[kind === 'loop' ? 'loop' : 'io']).concat(isText ? ['Litery i słowa'] : []);
  const cats = ['Wszystkie', ...order.filter((k) => entries.some(([id, a]) => animCategory(id, kind, a) === k))];
  const cur = cats.includes(this.animCat) ? this.animCat : 'Wszystkie';
  b.append(h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.animCat = k; this.renderInspector(); } }, k))));
  const g = h('div', { class: 'tgrid anim' });
  const pick = (id) => { c[key].id = id; commit(); if (id !== 'none') Tools.previewClip(c, kind); };
  g.append(animTile(dict, 'none', kind, c[key].id === 'none', () => pick('none'), isText ? 'text' : null));
  entries.filter(([id, a]) => cur === 'Wszystkie' || animCategory(id, kind, a) === cur).forEach(([id]) => g.append(animTile(dict, id, kind, c[key].id === id, () => pick(id), isText ? 'text' : null)));
  b.append(g);
  if (c[key].id !== 'none') {
    if (kind === 'loop') b.append(F.sn('Intensywność', () => c[key].amt, (v) => { c[key].amt = v; }, 0.1, 2.5, 0.05, 100, '%'));
    else b.append(F.sn('Czas trwania', () => c[key].dur, (v) => { c[key].dur = v; }, 0.2, Math.max(0.3, Math.min(4, c.dur * 0.7)), 0.05, 1, ' s'));
    b.append(F.btn('Podgląd animacji', () => Tools.previewClip(c, kind), 'sm', 'play'));
  }
  b.append(F.hint('Kliknij animację, aby ją dodać. Najedź, aby zobaczyć duży podgląd. Możesz mieć osobno wejście, wyjście i pętlę.'));
};
