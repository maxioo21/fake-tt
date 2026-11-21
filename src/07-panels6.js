'use strict';
/* ============================================================
   Kadr Studio — wyszukiwarki w każdym panelu (rozumieją słowa, np. „rozmazanie” → rozmycie / blur),
   Gotowe: szablony edytów + napisy z piosenki, wyszukiwarka ustawień napisów
   ============================================================ */
UI.Q = {};
UI.searchBar = function (key, ph, rerender) {
  const rr = rerender || (() => UI.renderPanel(true));
  let timer = 0;
  const inp = h('input', {
    type: 'search', class: 'txt tsearch', placeholder: ph, value: this.Q[key] || '', autocomplete: 'off', spellcheck: 'false', 'data-sq': key, 'aria-label': ph,
    oninput: (e) => {
      clearTimeout(timer); const v = e.target.value;
      timer = setTimeout(() => { UI.Q[key] = v; rr(); const i = document.querySelector(`[data-sq="${key}"]`); if (i) { i.focus(); try { i.setSelectionRange(v.length, v.length); } catch (e2) { /* ok */ } } }, 160);
    },
    onkeydown: (e) => { if (e.key === 'Escape' && inp.value) { inp.value = ''; UI.Q[key] = ''; rr(); } },
  });
  return inp;
};
UI.sfind = function (key, items, docOf) { const q = (this.Q[key] || '').trim(); return q ? Search.run(q, items, docOf) : null; };
const plPl = (n, a, b, c) => (n === 1 ? a : (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? b : c));
UI.searchNote = function (key, res, rerender) {
  const rr = rerender || (() => UI.renderPanel(true)), q = (this.Q[key] || '').trim(), el = h('div', { class: 'snote' });
  if (!res.n) {
    el.append(h('b', {}, `Nic nie znaleziono dla „${q}”.`), h('span', {}, ' Spróbuj: '));
    Search.suggest(7).forEach((w) => el.append(h('button', { class: 'chip', onclick: () => { UI.Q[key] = w; rr(); } }, w)));
  } else {
    el.append(h('b', {}, `${res.n} ${plPl(res.n, 'wynik', 'wyniki', 'wyników')}`));
    if (res.concepts.length) el.append(h('span', {}, ' · rozumiem jako: ' + res.concepts.slice(0, 3).map((c) => c.name).join(', ')), h('p', { class: 'hint' }, res.concepts[0].name + ' — ' + res.concepts[0].desc));
  }
  return el;
};

/* ---------- Efekty ---------- */
UI.pEffects = function (box) {
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Efekty'), h('span', { class: 'hint' }, Object.keys(FX).length + ' efektów')), this.modeSeg());
  box.append(this.searchBar('effects', 'Szukaj efektu: np. rozmazanie, glitch, błysk, trzęsienie…'));
  const all = Object.values(FX), res = this.sfind('effects', all, (f) => ({ id: f.id, name: f.name, cat: f.cat }));
  box.append(res ? this.searchNote('effects', res) : this.chipsFor('effects', ['Wszystkie', ...FX_GROUPS]));
  const sel = byId(S.sel), grid = h('div', { class: 'tgrid' });
  (res ? res.list : all.filter((f) => this.catState.effects === 'Wszystkie' || fxGroup(f.cat) === this.catState.effects)).forEach((f) => {
    const on = this._mode === 'clip' && sel && sel.fx.some((e) => e.id === f.id);
    grid.append(fxTile(f.id, on, () => {
      if (this._mode === 'clip' && sel) {
        const i = sel.fx.findIndex((e) => e.id === f.id);
        if (i >= 0) sel.fx.splice(i, 1); else sel.fx.push({ id: f.id, amt: 0.6 });
        commit(); if (i < 0) toast('Efekt „' + f.name + '” dodany – siłę ustawisz w panelu po prawej');
      } else { addFxLayer({ fx: [{ id: f.id, amt: 0.6 }] }); commit(); toast('Dodano warstwę efektu na osi'); }
    }));
  });
  box.append(grid, F.hint('Kliknij kafelek albo przeciągnij go na klip (na osi lub na podglądzie). Najedź, aby zobaczyć efekt w ruchu. Kliknij ponownie, aby zdjąć go z klipu.'));
};

/* ---------- Przejścia ---------- */
UI.pTrans = function (box) {
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Przejścia'), h('span', { class: 'hint' }, Object.keys(TRANS).length + ' przejść')));
  const sel = byId(S.sel), prev = sel ? prevAdjacent(sel) : null;
  const ok = sel && prev && isVisual(sel) && sel.type !== 'fx';
  box.append(h('div', { class: 'note' + (ok ? ' ok' : '') }, ok ? 'Przejście między „' + this.clipTitle(prev) + '” a „' + this.clipTitle(sel) + '”.' : 'Przeciągnij przejście na styk dwóch klipów na osi (lub na klip) albo zaznacz klip i kliknij kafelek. Można też kliknąć „+” między klipami.'));
  if (ok) box.append(F.slider('Czas trwania', () => sel.trans.dur, (v) => { sel.trans.dur = v; }, 0.2, 2.5, 0.1, (v) => v.toFixed(1) + ' s', () => this.previewTrans(sel)));
  box.append(this.searchBar('trans', 'Szukaj przejścia: np. rozmazanie, obrót, błysk, glitch…'));
  const all = Object.values(TRANS), res = this.sfind('trans', all, (t) => ({ id: t.id, name: t.name, cat: t.cat }));
  box.append(res ? this.searchNote('trans', res) : this.chipsFor('trans', ['Wszystkie', 'Popularne', 'Przesuwanie', 'Odsłanianie', 'Efekty']));
  const grid = h('div', { class: 'tgrid' });
  if (!res) grid.append(transTile('none', ok && sel.trans.id === 'none', () => { if (ok) { sel.trans.id = 'none'; commit(); } }));
  (res ? res.list : all.filter((t) => this.catState.trans === 'Wszystkie' || t.cat === this.catState.trans)).forEach((t) => {
    grid.append(transTile(t.id, ok && sel.trans.id === t.id, () => {
      if (!ok) { toast('Najpierw zaznacz klip, który styka się z poprzednim klipem'); return; }
      sel.trans.id = t.id; commit(); this.previewTrans(sel);
    }));
  });
  box.append(grid);
};

/* ---------- Filtry ---------- */
UI.pFilters = function (box) {
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Filtry'), h('span', { class: 'hint' }, (Object.keys(FILTERS).length - 1) + ' filtrów')), this.modeSeg());
  box.append(this.searchBar('filters', 'Szukaj filtra: np. kino, ciepły, czarno-biały, neon…'));
  const all = Object.entries(FILTERS).map(([id, f]) => Object.assign({ id }, f)), res = this.sfind('filters', all.filter((f) => f.id !== 'none'), (f) => ({ id: f.id, name: f.name, cat: f.cat }));
  box.append(res ? this.searchNote('filters', res) : this.chipsFor('filters', ['Wszystkie', ...FILTER_GROUPS]));
  const sel = byId(S.sel), grid = h('div', { class: 'tgrid' });
  (res ? res.list : all.filter((f) => f.id === 'none' ? ['Wszystkie', 'Popularne'].includes(this.catState.filters) : (this.catState.filters === 'Wszystkie' || filterGroup(f.cat) === this.catState.filters))).forEach((f) => {
    const id = f.id, on = this._mode === 'clip' && sel && sel.filter.id === id;
    grid.append(filterTile(id, on, () => {
      if (this._mode === 'clip' && sel) { sel.filter = { id, amt: sel.filter.amt == null ? 1 : sel.filter.amt }; commit(); }
      else if (id !== 'none') { addFxLayer({ filter: { id, amt: 1 } }); commit(); toast('Dodano warstwę filtra na osi'); }
    }));
  });
  box.append(grid);
  if (this._mode === 'clip' && sel && sel.filter.id !== 'none') box.append(F.slider('Siła filtra', () => sel.filter.amt, (v) => { sel.filter.amt = v; }, 0, 1, 0.01, (v) => Math.round(v * 100) + '%'));
};

/* ---------- Tekst: wyszukiwarka rozumie opis stylu (poświata, rozmycie, szkło…) ---------- */
function styleDoc(s) {
  const t = s.t, w = [];
  if (t.glowA > 0.3 || t.glowCycle) w.push('poswiata swiecacy blask glow neon');
  if (t.blur > 0) w.push('rozmycie rozmazany rozmyty blur nieostry');
  if (t.fillA != null && t.fillA < 0.9) w.push('przezroczysty szklo glass');
  if (t.fillMode === 'shift') w.push('zmiana kolorow zmienne kolory animowany');
  if (t.fillMode === 'rainbow') w.push('tecza kolorowy zmiana kolorow');
  if (t.fillMode === 'galaxy') w.push('galaktyka kosmos gwiazdy');
  if (t.fillMode === 'glitter') w.push('brokat blyszczacy iskry');
  if (t.fill2 || t.fillMode === 'gradient') w.push('gradient przejscie kolorow');
  if (t.bg) w.push('tlo etykieta belka');
  if (t.strokeW > 0.02) w.push('obrys kontur');
  if (t.hardD > 0) w.push('3d cien twardy glebia');
  else if (t.shadowB > 0.3) w.push('cien');
  if (s.a) w.push('animacja animowany ruch');
  if (t.upper) w.push('wielkie litery');
  return { id: s.name, name: s.name, cat: s.cat + ' ' + textGroup(s.cat), tags: w.join(' ') + ' ' + (t.font || '') };
}
UI.pText = function (box) {
  const sel = byId(S.sel), isText = sel && sel.type === 'text', cur = this.catState.text;
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Tekst'), h('span', { class: 'hint' }, TEXT_STYLES.length + ' stylów')), F.btn('Dodaj tekst', () => App.addText(), 'primary block', 'plus'));
  if (isText) box.append(F.btn('Dodaj animację do tego napisu', () => { UI.insTab = 'anim'; UI.animSub = 'in'; UI.renderInspector(); if (document.body.dataset.mobile) UI.openTab('inspect'); toast('Wybierz animację w panelu po prawej (zakładka Animacje)'); }, 'block', 'sparkles'));
  box.append(this.searchBar('text', 'Szukaj stylu: np. neon, szkło, rozmazany, złoty, galaktyka…'));
  const res = this.sfind('text', TEXT_STYLES, styleDoc);
  box.append(res ? this.searchNote('text', res) : h('div', { class: 'chips' }, ['Wszystkie', ...TEXT_GROUPS].map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.text = k; this.textLimit = 48; this.renderPanel(); } }, k))));
  let list;
  if (res) list = res.list;
  else if (cur !== 'Wszystkie') list = TEXT_STYLES.filter((s) => textGroup(s.cat) === cur);
  else list = TEXT_STYLES.slice().sort((a, b) => TEXT_GROUPS.indexOf(textGroup(a.cat)) - TEXT_GROUPS.indexOf(textGroup(b.cat)));
  const shown = list.slice(0, this.textLimit);
  UI.loadFonts([...new Set(shown.map((s) => s.t.font).filter(Boolean))]);
  const grid = h('div', { class: 'tgrid' });
  shown.forEach((s) => grid.append(tile(s.name, (x, w, hh, p, tm) => textStylePreview(x, w, hh, p, s, tm), { anim: !!s.a || ['shift', 'rainbow', 'galaxy', 'glitter'].includes(s.t.fillMode) || !!s.t.glowCycle || !!s.t.strokeCycle, drag: { kind: 'text', style: s.t, anim: s.a }, onclick: () => App.addText(null, s.t, s.a), popTitle: s.name + (s.a ? ' · z animacją' : '') })));
  box.append(grid);
  if (list.length > shown.length) box.append(F.btn('Pokaż więcej (' + (list.length - shown.length) + ')', () => { this.textLimit += 48; this.renderPanel(true); }, 'block'));
  box.append(F.hint('Kliknij styl albo przeciągnij go na podgląd lub oś. Najedź na kafelek, aby zobaczyć duży podgląd. Animację dodasz po zaznaczeniu napisu w panelu po prawej (zakładka Animacje).'));
};

/* ---------- Naklejki ---------- */
const EMOJI_TAGS = {};
('🔥:ogien plomien goraco hot fire|❤️:serce milosc love|😂:smiech lzy ze smiechu lol|😍:zakochany oczy serca|🎉:impreza konfetti party swietowanie|✨:iskry blysk magia|👍:kciuk ok super like|💯:sto procent perfekcyjnie|🌟:gwiazda|😎:okulary cool luz|🥳:impreza urodziny|💥:wybuch boom|🎵:nuta muzyka|📸:aparat zdjecie|🚀:rakieta start szybko|🙌:rece hurra|😮:zdziwiony wow|👀:oczy patrzy|💫:gwiazdy zawrot glowy|🌈:tecza|👑:korona krol|💎:diament brylant|⚡:piorun blyskawica energia|🎬:klaps film kino'
  + '|😀:usmiech|😁:usmiech zeby|🤣:smiech turla|😊:usmiech rumieniec|😇:aniol|🥰:milosc zakochany|😘:buziak|🤩:zachwyt gwiazdy w oczach|🤔:mysli zastanawia|🙄:przewraca oczami|😴:spi sen|😭:placze lzy|😡:zly zlosc|🤯:mozg wybuch szok|🥶:zimno mroz|🥵:goraco upal|🤢:mdlosci chory|🤗:przytulenie|🤫:cisza sza|🫡:salut|😈:diabel|👻:duch|💀:czaszka|🤡:klaun'
  + '|👎:kciuk w dol nie lubie|👏:brawa|🙏:modlitwa prosze dziekuje|💪:sila miesnie biceps|🤝:uscisk dloni zgoda|✌️:pokoj zwyciestwo|🤞:trzymam kciuki|🤟:kocham cie rock|👌:ok w porzadku|👋:machanie czesc|🫶:serce dlonie|👉:wskazuje prawo|👆:wskazuje gora|☝️:palec|✊:piesc|🖐️:dlon stop|🤙:zadzwon|🫰:pstryk|🙈:malpka nie widze|🙉:nie slysze|🙊:nie mowie|💋:usta pocalunek|👣:slady stopy'
  + '|🌞:slonce|🌙:ksiezyc noc|⭐:gwiazda|☁️:chmura|🌧️:deszcz|❄️:snieg zima|🌊:fala ocean woda|🌸:kwiat wisnia|🌹:roza|🌴:palma wakacje|🍀:koniczyna szczescie|🐶:pies|🐱:kot|🦋:motyl|🐼:panda|🦄:jednorozec|🐢:zolw|🦁:lew|🐝:pszczola|🌍:ziemia swiat|🌋:wulkan|🌵:kaktus|🍁:lisc jesien'
  + '|🍕:pizza|🍔:burger hamburger|🍟:frytki|🌮:taco|🍣:sushi|🍩:paczek donut|🍰:ciasto tort|🍫:czekolada|🍿:popcorn kino|☕:kawa|🍺:piwo|🍷:wino|🍓:truskawka|🍉:arbuz|🍌:banan|🥑:awokado|🍒:wisnie|🍋:cytryna|🥐:rogalik|🍦:lody|🧁:babeczka muffin|🥤:napoj|🍜:zupa makaron|🥞:nalesniki'
  + '|✅:ptaszek ok zrobione|❌:krzyzyk blad nie|❗:wykrzyknik uwaga|❓:pytanie|💡:pomysl zarowka|🔔:dzwonek powiadomienie|📍:pinezka miejsce lokalizacja|🎯:cel tarcza|🏆:puchar trofeum wygrana|🎁:prezent|💰:pieniadze kasa|📈:wzrost wykres|⏰:budzik czas|🔒:klodka zamkniete|🔑:klucz|➡️:strzalka prawo|⬅️:strzalka lewo|⬆️:strzalka gora|⬇️:strzalka dol|🔴:czerwone kolko rec|🟢:zielone kolko|🔵:niebieskie kolko|▶️:play odtwarzaj|🆕:nowosc new'
  + '|⚽:pilka nozna football gol|🏀:koszykowka|🏈:futbol amerykanski|🎾:tenis|🏐:siatkowka|🥊:boks rekawica walka|🥇:zloty medal pierwsze miejsce|🥈:srebrny medal|🥉:brazowy medal|🏟️:stadion|🎽:koszulka biegacz|🏃:bieg biegacz|⛹️:koszykarz|🚴:rower kolarz|🏊:plywanie|🤸:gimnastyka|🧗:wspinaczka|⛷️:narty|🏂:snowboard|🥅:bramka gol|📣:megafon doping'
  + '|🎶:nuty muzyka|🎤:mikrofon spiew karaoke|🎧:sluchawki muzyka|🎸:gitara|🥁:perkusja bebny|🎹:pianino klawisze|🎺:trabka|🎷:saksofon|🪩:kula disco impreza|📻:radio|🔊:glosnik glosno|🎼:nuty partytura|💿:plyta cd|📹:kamera film|🎞️:tasma film|📽️:projektor kino|🎭:teatr maski|🕺:taniec disco|💃:taniec|🪘:bebenek|🎻:skrzypce|📀:plyta dvd'
  + '|😱:krzyk przerazenie|😳:zawstydzony zaskoczony|😤:zly parska|🫠:topi sie|🥹:wzruszony lzy|💅:paznokcie styl|🤌:wloski gest|🧠:mozg|🫨:trzesie sie|❤️‍🔥:serce w ogniu|💔:zlamane serce|‼️:wykrzykniki uwaga|🆒:cool|🆗:ok|🚨:alarm syrena policja|⚠️:ostrzezenie uwaga'
  + '|✈️:samolot lot podroz|🚗:samochod auto|🏖️:plaza wakacje|🏔️:gory|🗺️:mapa|🧳:walizka podroz|🛸:ufo|🌅:wschod slonca zachod|🌃:noc miasto|🌉:most|🏙️:miasto|🗼:wieza|🗽:statua wolnosci|⛰️:gora|🏕️:camping namiot|🚢:statek|🚲:rower|🛵:skuter|🚁:helikopter|🚂:pociag|🧭:kompas')
  .split('|').forEach((p) => { const i = p.indexOf(':'); EMOJI_TAGS[p.slice(0, i)] = p.slice(i + 1); });
const _origSt = UI.pStickers;
UI.pStickers = function (box) {
  const q = (this.Q.stickers || '').trim();
  if (!q) {
    _origSt.call(this, box);
    /* wstaw wyszukiwarkę zaraz pod nagłówkiem */
    const head = box.querySelector('.p-head'); if (head) head.after(this.searchBar('stickers', 'Szukaj naklejki: np. ogień, serce, piłka, korona, strzałka…'));
    return;
  }
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Naklejki')), this.searchBar('stickers', 'Szukaj naklejki: np. ogień, serce, piłka, korona, strzałka…'));
  const emos = [...new Set(Object.values(EMOJI).flat())], eres = Search.run(q, emos, (e) => ({ id: e, name: EMOJI_TAGS[e] || '', cat: Object.keys(EMOJI).filter((k) => EMOJI[k].includes(e)).join(' ') }));
  const shapes = Object.values(SHAPES), sres = Search.run(q, shapes, (s) => ({ id: s.id, name: s.name, cat: s.cat }));
  box.append(this.searchNote('stickers', { n: eres.n + sres.n, concepts: eres.concepts }));
  if (eres.list.length) box.append(h('div', { class: 'egrid' }, eres.list.map((e) => { const b = h('button', { class: 'emo', title: (EMOJI_TAGS[e] || '').split(' ').slice(0, 3).join(', '), onclick: () => App.addSticker(e) }, e); DND.attach(b, { kind: 'sticker', emoji: e, name: e }); return b; })));
  if (sres.list.length) {
    box.append(F.title('Kształty'));
    const g = h('div', { class: 'tgrid sm' });
    sres.list.forEach((s) => g.append(tile(s.name, (x, w, hh) => {
      x.fillStyle = '#23262f'; x.fillRect(0, 0, w, hh);
      const sp = makeShapeSprite({ shape: s.id, color: S.shapeColor, size: 0.6 }, hh, hh), k = Math.min(1, (hh - 8) / sp.height);
      x.drawImage(sp, (w - sp.width * k) / 2, (hh - sp.height * k) / 2, sp.width * k, sp.height * k);
    }, { anim: false, drag: { kind: 'shape', id: s.id }, onclick: () => { const c = addShapeClip(s.id); c.sticker.color = S.shapeColor; UI.insTab = 'basic'; commit(); } })));
    box.append(g);
  }
};

/* ---------- Gotowe: szablony edytów, looki, prędkość, nakładki, przejścia, napisy z piosenki ---------- */
UI.readyTab = 'tpl';
UI.pReady = function (box) {
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'Gotowe')));
  const subs = [['tpl', 'Szablony'], ['looks', 'Looki'], ['speed', 'Prędkość'], ['ovl', 'Nakładki'], ['pack', 'Przejścia'], ['lyr', 'Napisy'], ['beat', 'Na bit']];
  box.append(h('div', { class: 'sub wrap' }, subs.map(([id, t]) => h('button', { class: this.readyTab === id ? 'on' : '', onclick: () => { this.readyTab = id; this.renderPanel(); } }, t))));
  ({ tpl: this.rTemplates, looks: this.rLooks2, speed: this.rSpeed2, beat: this.rBeat, ovl: this.rOverlays2, pack: this.rPack2, lyr: this.rLyrics }[this.readyTab] || this.rTemplates).call(this, box);
};
UI._tpl = { cut: 'beat', sec: 0, withLyr: false };
UI._lyr = { text: '', style: null, anim: null, mode: 'line', y: 0.3, per: 0 };

/* podgląd szablonu: ujęcia ze zmianą co ~0,8 s, efekty, przejścia, warstwa i przykładowy napis */
function tplPreviewFn(tpl) {
  const fakes = tpl.segs.map((_, i) => { const c = newClip('image'); tplApplyTo(c, tpl, i); return c; });
  const lyr = tpl.lyr && TEXT_STYLES.find((s) => s.name === tpl.lyr.style), spCache = {}, segLen = 0.8, td = tpl.trans.length && tpl.trans[0] !== 'none' ? Math.min(tpl.tdur + 0.1, 0.5) : 0;
  const seg = (k, lt, w, hh) => {
    const f = fakes[k % fakes.length], sc = sceneFor(w, hh, k % 2), cv = POOL.get(w, hh), cx = cv.getContext('2d');
    if (HAS_FILTER) cx.filter = cssFilter(f, hh);
    cx.drawImage(sc, 0, 0); cx.filter = 'none';
    applyEffects(cv, f.fx, lt + 0.02);
    const st = animState({ dur: 3, animIn: f.animIn, animOut: { id: 'none', dur: 0.5 }, animLoop: f.animLoop }, lt), out = POOL.get(w, hh), ox = out.getContext('2d');
    ox.save(); ox.globalAlpha = clamp(st.al, 0, 1); ox.translate(w / 2 + st.dx * w, hh / 2 + st.dy * hh); ox.rotate(st.r); ox.scale(st.s, st.s); ox.drawImage(cv, -w / 2, -hh / 2); ox.restore();
    POOL.free(cv); return out;
  };
  return (x, w, hh, p, tm) => {
    const t = p == null ? 0.3 : tm, k = Math.floor(t / segLen), lt = t - k * segLen;
    let out;
    if (td && k > 0 && lt < td) {
      const A = seg(k - 1, segLen - 0.02, w, hh), B = seg(k, lt, w, hh), T0 = TRANS[tpl.trans[(k - 1) % tpl.trans.length]];
      out = POOL.get(w, hh); if (T0) T0.fn(out.getContext('2d'), A, B, clamp(lt / td, 0, 1), w, hh); else out.getContext('2d').drawImage(B, 0, 0);
      POOL.free(A); POOL.free(B);
    } else out = seg(k, lt, w, hh);
    if (tpl.layer) applyEffects(out, tpl.layer.fx, t);
    x.drawImage(out, 0, 0); POOL.free(out);
    if (lyr) {
      const key = w + 'x' + hh;
      if (!spCache[key]) spCache[key] = makeTextSprite(Object.assign(defText('♪ tekst'), styleFull(lyr.t), { size: 0.13 }), w, hh, null);
      const sp = spCache[key]; x.drawImage(sp, (w - sp.width) / 2, hh * 0.78 - sp.height / 2);
    }
    const fs = Math.round(hh * 0.1); x.font = `800 ${fs}px sans-serif`; x.textAlign = 'left'; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(4, 4, fs * 1.9, fs * 1.35); x.fillStyle = '#fff'; x.fillText('#' + (k + 1), 4 + fs * 0.25, 4 + fs * 1.0);
  };
}
UI.rTemplates = function (box) {
  const st = this._tpl;
  box.append(h('div', { class: 'card2' },
    h('h5', {}, 'Gotowe edity', h('span', { class: 'badge' }, 'NOWE')),
    F.hint('Wybierz szablon — potnę Twoje klipy (na rytm albo co stały czas) i dodam animacje, efekty, krzywe prędkości, przejścia i warstwę efektów. To zwykłe klipy na osi: dalej zmienisz każdy efekt, dodasz własne napisy i muzykę.'),
    F.seg('Cięcia', [['beat', 'Na rytm muzyki'], ['time', 'Co stały czas'], ['none', 'Moje cięcia']], () => st.cut, (v) => { st.cut = v; }),
    st.cut !== 'none' ? F.sn(st.cut === 'beat' ? 'Długość ujęcia (gdy brak rytmu)' : 'Długość ujęcia', () => st.sec || 0.6, (v) => { st.sec = v; }, 0.2, 4, 0.05, 1, ' s') : null,
    F.toggle('Dołącz napisy z piosenki (zakładka Napisy)', () => st.withLyr, (v) => { st.withLyr = v; }),
    st.withLyr && !this._lyr.text.trim() ? h('p', { class: 'hint err' }, 'Najpierw wpisz tekst piosenki w zakładce „Napisy”.') : null,
    h('p', { class: 'hint' }, 'Zaznaczone klipy nie mają znaczenia — szablon działa na ścieżce głównej. ' + (P.markers.length >= 3 ? `Mam ${P.markers.length} znaczników rytmu.` : 'Dodaj muzykę, a wykryję rytm automatycznie.'))));
  box.append(this.searchBar('tpl', 'Szukaj szablonu: np. football, glitch, retro, kino, neon…'));
  const res = this.sfind('tpl', EDIT_TPLS, (t) => ({ id: t.id, name: t.name, cat: t.cat, tags: t.desc + ' ' + tplIncludes(t).join(' ') }));
  if (res) box.append(this.searchNote('tpl', res));
  (res ? res.list : EDIT_TPLS).forEach((tpl) => {
    const go = () => EditTpl.apply(tpl, { cut: st.cut, sec: st.sec || 0, lyrics: st.withLyr, lyricsText: this._lyr.text, lyrOpt: { mode: this._lyr.mode, y: this._lyr.y, per: this._lyr.per, style: this._lyr.style, anim: this._lyr.anim } });
    box.append(h('div', { class: 'tplcard' },
      tile('', tplPreviewFn(tpl), { onclick: go, title: tpl.desc, popTitle: tpl.name }),
      h('div', { class: 'tinfo' }, h('div', { class: 'tn' }, h('b', {}, tpl.name), h('span', { class: 'tcat' }, tpl.cat)), h('p', {}, tpl.desc),
        h('div', { class: 'tags' }, tplIncludes(tpl).map((t) => h('i', {}, t))), F.btn('Użyj szablonu', go, 'primary sm', 'sparkles'))));
  });
  box.append(F.btn('Zdejmij szablon z klipów', () => EditTpl.clear(), 'block', 'x'), F.hint('Najedź na kafelek, aby zobaczyć szablon w ruchu. Nie podoba się? Ctrl+Z cofa cały szablon.'));
};

UI.rLooks2 = function (box) {
  const sbk = 'looks', cats = ['Wszystkie', ...new Set(LOOKS.map((l) => l.cat))], cur = cats.includes(this.catState.looks) ? this.catState.looks : 'Wszystkie';
  box.append(this.searchBar(sbk, 'Szukaj looka: np. neon, kino, retro, złoty, zwolnienie…'));
  const res = this.sfind(sbk, LOOKS, (l) => ({ id: l.id, name: l.name, cat: l.cat, tags: lookTags(l) }));
  box.append(res ? this.searchNote(sbk, res) : h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.looks = k; this.renderPanel(); } }, k))));
  box.append(F.hint(this.targetHint()));
  const grid = h('div', { class: 'tgrid' });
  (res ? res.list : LOOKS.filter((l) => cur === 'Wszystkie' || l.cat === cur)).forEach((l) => {
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
function lookTags(l) {
  const c = newClip('image'); l.apply(c);
  const w = [];
  if (c.filter.id !== 'none' && FILTERS[c.filter.id]) w.push(FILTERS[c.filter.id].name, c.filter.id);
  c.fx.forEach((e) => { if (FX[e.id]) w.push(FX[e.id].name, e.id); });
  if (c.curve && c.curve !== 'none' && CURVES[c.curve]) w.push('predkosc zwolnienie krzywa', CURVES[c.curve].name);
  return w.join(' ');
}
UI.rSpeed2 = function (box) {
  const sel = byId(S.sel), ok = sel && (sel.type === 'video' || sel.type === 'audio');
  box.append(h('div', { class: 'note' + (ok ? ' ok' : '') }, ok ? 'Krzywa dla klipu „' + this.clipTitle(sel) + '”. Długość klipu się nie zmienia, zmienia się tylko tempo w czasie.' : 'Zaznacz klip wideo lub audio, aby nadać mu krzywą prędkości.'));
  box.append(this.searchBar('speed', 'Szukaj krzywej: np. zwolnienie, przyspieszenie, bohater…'));
  const all = Object.entries(CURVES).map(([id, cv]) => Object.assign({ id }, cv)), res = this.sfind('speed', all, (c) => ({ id: c.id, name: c.name, cat: 'predkosc krzywa' }));
  if (res) box.append(this.searchNote('speed', res));
  const grid = h('div', { class: 'tgrid' });
  (res ? res.list : all).forEach((cv) => {
    const id = cv.id;
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
UI.rOverlays2 = function (box) {
  const cats = ['Wszystkie', ...OVL_GROUPS], cur = this.catState.ovl;
  box.append(this.searchBar('ovl', 'Szukaj nakładki: np. iskry, śnieg, błysk, wyciek światła…'));
  const all = Object.values(OVERLAYS), res = this.sfind('ovl', all, (o) => ({ id: o.id, name: o.name, cat: o.cat }));
  box.append(res ? this.searchNote('ovl', res) : h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.catState.ovl = k; this.renderPanel(); } }, k))));
  box.append(F.hint('Animowane nakładki rysowane na żywo. Kliknij, aby dodać w miejscu głowicy, albo przeciągnij na wybraną ścieżkę lub podgląd. Kolor i tryb mieszania zmienisz w „Edytuj”.'));
  const grid = h('div', { class: 'tgrid' });
  (res ? res.list : all.filter((o) => cur === 'Wszystkie' || ovlGroup(o.cat) === cur)).forEach((o) => {
    grid.append(tile(o.name, (x, w, hh, p, tm) => {
      drawScene(x, w, hh, 1);
      const ov = POOL.get(w, hh), lt = p == null ? Math.min(o.d * 0.18, 0.5) + 0.2 : (tm % Math.min(o.d, 3));
      drawOverlayTo(ov, o.id, lt, { color: OV_COLORS[o.id] || '#ffffff' });
      x.save(); x.globalCompositeOperation = blendOp(o.blend); x.drawImage(ov, 0, 0); x.restore(); POOL.free(ov);
    }, { drag: { kind: 'overlay', id: o.id }, onclick: () => { addOverlayClip(o.id); UI.insTab = 'ovl'; commit(); toast('Dodano nakładkę „' + o.name + '”'); } }));
  });
  box.append(grid);
};
UI.rPack2 = function (box) {
  const st = this._pack || (this._pack = { id: 'fade', dur: 0.5 });
  box.append(h('div', { class: 'card2' }, h('h5', {}, 'Przejście na wszystkich cięciach'),
    F.hint('Wybierz przejście i zastosuj je między wszystkimi klipami na ścieżce głównej jednym kliknięciem.'),
    F.slider('Czas przejścia', () => st.dur, (v) => { st.dur = v; }, 0.15, 2, 0.05, (v) => v.toFixed(2) + ' s'),
    F.btn('Zastosuj do wszystkich cięć', () => Looks.packTransitions(st.id, st.dur), 'primary block', 'transition'),
    h('div', { class: 'row2' }, F.btn('Losowe', () => Looks.packTransitions('random', st.dur), 'sm', 'repeat'), F.btn('Usuń wszystkie', () => Looks.packTransitions('none', st.dur), 'sm', 'x'))));
  box.append(this.searchBar('pack', 'Szukaj przejścia: np. rozmazanie, obrót, błysk…'));
  const all = Object.values(TRANS), res = this.sfind('pack', all, (t) => ({ id: t.id, name: t.name, cat: t.cat }));
  box.append(res ? this.searchNote('pack', res) : this.chipsFor('pack', ['Wszystkie', ...TRANS_CATS]));
  const grid = h('div', { class: 'tgrid' });
  (res ? res.list : all.filter((t) => this.catState.pack === 'Wszystkie' || t.cat === this.catState.pack)).forEach((t) => grid.append(transTile(t.id, st.id === t.id, () => { st.id = t.id; this.renderPanel(true); })));
  box.append(grid);
};

/* ---------- Napisy z piosenki ---------- */
UI.rLyrics = function (box) {
  const L = this._lyr, sp = Lyrics.span(), have = clips.filter((c) => c.lyr).length;
  box.append(h('div', { class: 'card2' }, h('h5', {}, 'Napisy z piosenki', h('span', { class: 'badge' }, 'NOWE')),
    F.hint('Wklej tekst piosenki (jedna linijka = jeden napis) albo wczytaj plik .lrc / .srt z czasami. Napisy lądują na osi jako zwykłe klipy tekstowe — przesuwasz je, skracasz i zmieniasz im styl i animację.')));
  const ta = h('textarea', { class: 'txt lyr', rows: 8, placeholder: 'Wklej tekst piosenki…\nJedna linijka = jeden napis.\n\nMożesz też wkleić linijki z czasami:\n[00:12.50] pierwsza linijka', oninput: (e) => { L.text = e.target.value; } }, L.text);
  const fi = h('input', { type: 'file', accept: '.lrc,.srt,.txt,text/plain', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { L.text = await f.text(); toast('Wczytano „' + f.name + '”' + (Lyrics.parse(L.text) ? ' (z czasami)' : '')); this.renderPanel(true); } catch (er) { toast('Nie udało się wczytać pliku', 'err'); } } });
  box.append(ta, fi, h('div', { class: 'row2' }, F.btn('Wczytaj plik .lrc / .srt', () => fi.click(), 'sm', 'upload'), F.btn('Wyczyść', () => { L.text = ''; this.renderPanel(true); }, 'sm', 'x')));
  const names = LYRIC_STYLES.filter((n) => TEXT_STYLES.some((s) => s.name === n));
  UI.loadFonts([...new Set(names.map((n) => TEXT_STYLES.find((s) => s.name === n).t.font).filter(Boolean))]);
  box.append(F.title('Styl napisów'));
  const grid = h('div', { class: 'tgrid sm' });
  names.forEach((n) => { const s = TEXT_STYLES.find((q) => q.name === n); grid.append(tile(n, (x, w, hh, p, tm) => textStylePreview(x, w, hh, p, s, tm), { anim: !!s.a, active: L.style === n, onclick: () => { L.style = n; this.renderPanel(true); } })); });
  box.append(grid);
  box.append(F.select('Animacja wejścia', LYRIC_ANIMS, () => L.anim || 'fade', (v) => { L.anim = v; }),
    F.seg('Tryb', [['line', 'Linijka'], ['word', 'Słowo po słowie']], () => L.mode, (v) => { L.mode = v; }),
    F.seg('Pozycja', [[0.3, 'Dół'], [0, 'Środek'], [-0.3, 'Góra']], () => L.y, (v) => { L.y = v; }),
    F.sn('Czas na linijkę (0 = rozłóż równo)', () => L.per, (v) => { L.per = v; }, 0, 12, 0.1, 1, ' s'),
    h('p', { class: 'hint' }, `Rozłożę napisy na: ${sp.label} (${fmtDur(sp.a)}–${fmtDur(sp.b)}). Zaznacz klip z piosenką, aby czasy liczyć od niego.` + (have ? ` Na osi jest teraz ${have} napisów z piosenki — dodanie nowych je zastąpi.` : '')),
    F.btn('Dodaj napisy na oś', () => Lyrics.add(L.text, { style: L.style || 'Napisy: klasyczne', anim: L.anim || 'fade', mode: L.mode, y: L.y, per: L.per }), 'primary block', 'type'));
  if (have) box.append(F.btn('Usuń napisy z piosenki', () => { const n = Lyrics.remove(); commit(); toast('Usunięto ' + n + ' napisów'); }, 'block', 'trash'));
};

/* ---------- Animacje w inspektorze: wyszukiwarka (+ podpowiedź, gdzie jeszcze coś jest) ---------- */
UI.insAnim = function (b, c) {
  const isText = c.type === 'text', kind = this.animSub, key = { in: 'animIn', out: 'animOut', loop: 'animLoop' }[kind];
  const dictOf = (k) => (k === 'loop' ? ANIM_LOOP : ANIM_IO), entriesOf = (k) => Object.entries(dictOf(k)).filter(([id, a]) => id !== 'none' && (!a.textOnly || isText));
  const docOf = (k) => ([id, a]) => ({ id, name: a.name, cat: animCategory(id, k, a) });
  b.append(h('div', { class: 'animtabs' }, [['in', 'Wejście', 'animIn'], ['out', 'Wyjście', 'animOut'], ['loop', 'Pętla', 'animLoop']].map(([id, t, k]) =>
    h('button', { class: this.animSub === id ? 'on' : '', onclick: () => { this.animSub = id; this.animCat = 'Wszystkie'; this.renderInspector(); } }, t, c[k].id !== 'none' ? h('i', { class: 'dot' }) : null))));
  const rr = () => UI.renderInspector();
  b.append(this.searchBar('anim', 'Szukaj animacji: np. rozmazanie, obrót, odbicie, litery…', rr));
  const entries = entriesOf(kind), res = this.sfind('anim', entries, docOf(kind));
  const order = Object.keys(ANIM_CAT_LISTS[kind === 'loop' ? 'loop' : 'io']).concat(isText ? ['Litery i słowa'] : []);
  const cats = ['Wszystkie', ...order.filter((k) => entries.some(([id, a]) => animCategory(id, kind, a) === k))];
  const cur = cats.includes(this.animCat) ? this.animCat : 'Wszystkie';
  if (res) {
    b.append(this.searchNote('anim', res, rr));
    const other = ['in', 'out', 'loop'].filter((k) => k !== kind).map((k) => [k, Search.run(this.Q.anim, entriesOf(k), docOf(k)).n]).filter(([, n]) => n);
    if (other.length) b.append(h('p', { class: 'hint' }, 'Pasuje też: ' + other.map(([k, n]) => ({ in: 'Wejście', out: 'Wyjście', loop: 'Pętla' }[k]) + ' (' + n + ')').join(', ') + ' — przełącz zakładkę powyżej.'));
  } else b.append(h('div', { class: 'chips' }, cats.map((k) => h('button', { class: 'chip' + (k === cur ? ' on' : ''), onclick: () => { this.animCat = k; this.renderInspector(); } }, k))));
  const dict = dictOf(kind), g = h('div', { class: 'tgrid anim' });
  const pick = (id) => { c[key].id = id; commit(); if (id !== 'none') Tools.previewClip(c, kind); };
  if (!res) g.append(animTile(dict, 'none', kind, c[key].id === 'none', () => pick('none'), isText ? 'text' : null));
  (res ? res.list : entries.filter(([id, a]) => cur === 'Wszystkie' || animCategory(id, kind, a) === cur)).forEach(([id]) => g.append(animTile(dict, id, kind, c[key].id === id, () => pick(id), isText ? 'text' : null)));
  b.append(g);
  if (c[key].id !== 'none') {
    if (kind === 'loop') b.append(F.sn('Intensywność', () => c[key].amt, (v) => { c[key].amt = v; }, 0.1, 2.5, 0.05, 100, '%'));
    else b.append(F.sn('Czas trwania', () => c[key].dur, (v) => { c[key].dur = v; }, 0.2, Math.max(0.3, Math.min(4, c.dur * 0.7)), 0.05, 1, ' s'));
    b.append(F.btn('Podgląd animacji', () => Tools.previewClip(c, kind), 'sm', 'play'));
  }
  b.append(F.hint('Kliknij animację, aby ją dodać. Najedź, aby zobaczyć duży podgląd. Możesz mieć osobno wejście, wyjście i pętlę.'));
};

/* ---------- Ustawienia napisów: wyszukiwarka („poświata”, „rozmazanie”, „obrys”…) ---------- */
const TSET = [
  ['Treść napisu', 'text', 'tekst napis zawartosc wpisz', 'Treść'], ['Czcionka', 'text', 'font krój pismo typ liter', 'Czcionka'], ['Pogrubienie, kursywa, podkreślenie, wielkie litery', 'text', 'bold italic podkreslenie male wielkie litery', 'Czcionka'],
  ['Rozmiar tekstu', 'text', 'wielkosc size', 'Rozmiar'], ['Odstęp liter', 'text', 'spacing interlitera kerning rozstaw', 'Odstęp liter'], ['Odstęp wierszy', 'text', 'interlinia line height wysokosc wiersza', 'Odstęp wierszy'], ['Wyrównanie tekstu', 'text', 'lewo srodek prawo align', 'Wyrównanie'],
  ['Rodzaj wypełnienia', 'color', 'jednolity gradient tecza galaktyka brokat zmiana kolorow', 'Rodzaj wypełnienia'], ['Zmieniające się kolory', 'color', 'animowane kolory plynace przejscie zmiana koloru', 'Zmieniające się kolory'], ['Gradienty', 'color', 'przejscie kolorow ombre', 'Gradienty'],
  ['Kolor tekstu', 'color', 'barwa kolor wypelnienie', 'Kolory jednolite'], ['Kąt gradientu', 'color', 'kierunek gradient', 'Kąt gradientu'], ['Szybkość zmiany kolorów', 'color', 'predkosc tempo animacja kolorow', 'Szybkość zmiany'], ['Rozciągnięcie kolorów', 'color', 'rozstaw rozlozenie', 'Rozciągnięcie'],
  ['Gęstość iskier (galaktyka, brokat)', 'color', 'iskry gwiazdki brokat', 'Gęstość iskier'], ['Przezroczystość tekstu', 'color', 'krycie szklo przezroczysty glass opacity', 'Przezroczystość'], ['Przezroczysty tekst (szkło)', 'color', 'szklo glass przezroczysty', 'Zrób przezroczysty'],
  ['Rodzaj obrysu', 'stroke', 'kontur outline', 'Rodzaj obrysu'], ['Kolor obrysu', 'stroke', 'kontur kolor', 'Kolor obrysu'], ['Grubość obrysu', 'stroke', 'kontur grubosc', 'Grubość obrysu'], ['Krycie obrysu', 'stroke', 'kontur przezroczystosc', 'Krycie obrysu'], ['Drugi obrys', 'stroke', 'podwojny obrys', 'Drugi obrys'],
  ['Siła poświaty', 'glow', 'mocna poswiata blask neon swiecenie glow', 'Siła poświaty'], ['Kolor poświaty', 'glow', 'blask kolor swiecenia', 'Kolor poświaty'], ['Intensywność poświaty', 'glow', 'moc blask intensywnosc', 'Intensywność'], ['Rozmiar poświaty', 'glow', 'zasieg rozmycie poswiaty wielkosc', 'Rozmiar (rozmycie)'],
  ['Rodzaj cienia', 'shadow', 'cien shadow', 'Rodzaj cienia'], ['Kolor cienia', 'shadow', 'cien kolor', 'Kolor cienia'], ['Rozmycie cienia', 'shadow', 'cien rozmazanie miekki', 'Rozmycie'], ['Odległość i kąt cienia', 'shadow', 'cien odleglosc kat kierunek', 'Odległość'], ['Twardy cień 3D', 'shadow', 'glebia 3d cien twardy', 'Twardy cień (3D)'],
  ['Tło pod tekstem', 'bg', 'etykieta belka podklad', 'Tło pod tekstem'], ['Kolor tła', 'bg', 'etykieta kolor podklad', 'Kolor tła'], ['Krycie tła', 'bg', 'przezroczystosc tla', 'Krycie tła'], ['Zaokrąglenie tła', 'bg', 'rogi zaokraglone pigulka', 'Zaokrąglenie'], ['Odstęp tła od tekstu', 'bg', 'padding margines', 'Odstęp od tekstu'],
  ['Rozmycie tekstu', 'blur', 'rozmazanie nieostrosc mgla blur', 'Rozmycie tekstu'],
  ['Animacja wejścia', '@anim:in', 'pojawianie wjazd animacja wejscia', null], ['Animacja wyjścia', '@anim:out', 'znikanie animacja wyjscia', null], ['Animacja w pętli', '@anim:loop', 'zapetlona ruch ciagly petla', null],
  ['Pozycja, skala i obrót napisu', '@basic', 'przesun polozenie skala obrot krycie klipu tryb mieszania', null], ['Efekty na napisie', '@fxs', 'efekty filtry glitch', null],
];
const _insText = UI.insText;
UI.insText = function (b, c) {
  const rr = () => UI.renderInspector();
  b.append(this.searchBar('tset', 'Szukaj ustawienia: np. poświata, rozmazanie, obrys, odstęp…', rr));
  const q = (this.Q.tset || '').trim();
  if (!q) { _insText.call(this, b, c); return; }
  const subName = { text: 'Tekst', color: 'Kolor', stroke: 'Obrys', glow: 'Poświata', shadow: 'Cień', bg: 'Tło', blur: 'Rozmycie' };
  const res = Search.run(q, TSET, (r) => ({ id: r[0], name: r[0], cat: subName[r[1]] || 'Ustawienia klipu', tags: r[2] }));
  b.append(this.searchNote('tset', res, rr));
  const list = h('div', { class: 'srow' });
  res.list.forEach((r) => list.append(h('button', { class: 'sres', onclick: () => {
    this.Q.tset = '';
    if (r[1].startsWith('@anim:')) { this.insTab = 'anim'; this.animSub = r[1].slice(6); } else if (r[1].startsWith('@')) this.insTab = r[1].slice(1); else { this.insTab = 'text'; this.textSub = r[1]; }
    this.renderInspector(); if (document.body.dataset.mobile) this.openTab('inspect');
    if (r[3]) setTimeout(() => UI.flashSetting(r[3]), 60);
  } }, h('b', {}, r[0]), h('span', {}, subName[r[1]] ? 'Napis → ' + subName[r[1]] : 'Zakładka: ' + (r[1].startsWith('@anim') ? 'Animacje' : r[1] === '@basic' ? 'Pozycja' : 'Efekty')))));
  b.append(list);
};
UI.flashSetting = function (key) {
  const n = Search.norm(key), el = [...document.querySelectorAll('#inspector .ctl, #inspector h4.ttl')].find((e) => Search.norm(e.textContent).startsWith(n));
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2200);
};
