'use strict';
/* ============================================================
   Kadr Studio — gotowe edity (szablony) i napisy z piosenki.
   Szablon tnie Twoje klipy (na rytm albo co stały czas), nadaje każdemu ujęciu animację, efekty,
   krzywą prędkości i przejście oraz dodaje warstwę efektów. Wszystko to zwykłe klipy — edytujesz dalej.
   ============================================================ */
const EDIT_TPLS = [];
const ET = (o) => EDIT_TPLS.push(Object.assign({ every: 1, sec: 0.6, tdur: 0.3, trans: [], segs: [{}] }, o));
ET({ id: 'football', name: 'Football edit', cat: 'Sport', every: 1, sec: 0.5, tdur: 0.18, desc: 'Szybkie cięcia na bit, uderzenia zoomem, błyski i złoty kolor. Pod bramki, skille i kibiców.',
  base: (c) => { c.filter = { id: 'punch', amt: 0.9 }; c.fx = fxs(['glow', 0.3]); },
  segs: [{ in: ['punchin', 0.2], fx: fxs(['zoompunch', 0.9]) }, { in: ['zoomin', 0.2], fx: fxs(['flash', 0.7]) }, { in: ['rotR', 0.25], fx: fxs(['zoompunch', 0.8], ['chromab', 0.3]) }, { in: ['punchin', 0.2], fx: fxs(['heavyshake', 0.6]) }],
  trans: ['flashcut', 'zoomblur', 'none'], layer: { fx: fxs(['vigpulse', 0.45], ['lensflare', 0.25]) }, lyr: { style: 'Złoty edit', anim: 'zoomLetters' } });
ET({ id: 'velocity', name: 'Velocity: zwolnienia', cat: 'Sport', every: 2, sec: 1.2, tdur: 0.25, desc: 'Płynne zmiany prędkości (krzywe) z rozmyciem ruchu: montaż, bohater, bullet time.',
  base: (c) => { c.filter = { id: 'punch', amt: 0.7 }; },
  segs: [{ curve: 'montage', in: ['punchin', 0.2], fx: fxs(['radialblur', 0.4]) }, { curve: 'rampup', fx: fxs(['motionblur', 0.5]) }, { curve: 'hero', fx: fxs(['glow', 0.3]) }, { curve: 'bullet', fx: fxs(['motionblur', 0.5], ['chromab', 0.3]) }],
  trans: ['zoomblur', 'whip'], layer: { fx: fxs(['vigpulse', 0.35]) }, lyr: { style: 'Hormozi biały', anim: 'pop' } });
ET({ id: 'glitch', name: 'Glitch edit', cat: 'Glitch', every: 1, sec: 0.55, tdur: 0.22, desc: 'Cyfrowe usterki na każdym cięciu: rozjechane kolory, paski, szum TV.',
  base: (c) => { c.filter = { id: 'cyber', amt: 0.8 }; },
  segs: [{ in: ['glitchin', 0.2], fx: fxs(['glitchcolor', 0.8], ['chromab', 0.5]) }, { in: ['flicker', 0.2], fx: fxs(['blockglitch', 0.6], ['rgb', 0.4]) }, { in: ['strobeIn', 0.2], fx: fxs(['tvstatic', 0.45], ['chromab', 0.4]) }],
  trans: ['glitch', 'glitch2', 'rgb', 'static'], layer: { fx: fxs(['scanroll', 0.3]) }, lyr: { style: 'Neon cyjan', anim: 'glitchLetters' } });
ET({ id: 'hype', name: 'Hype: wstrząsy', cat: 'Sport', every: 1, sec: 0.45, tdur: 0.2, desc: 'Mocne wstrząsy, zoom i błyski. Dla szybkiej, agresywnej muzyki.',
  base: (c) => { c.filter = { id: 'punch', amt: 1 }; },
  segs: [{ in: ['shakeIn', 0.2], fx: fxs(['heavyshake', 0.8], ['rgb', 0.4]) }, { in: ['punchin', 0.2], fx: fxs(['zoompunch', 1], ['flash', 0.6]) }, { in: ['rotL', 0.25], fx: fxs(['spinzoom', 0.5]) }],
  trans: ['shake', 'flashcut'], layer: { fx: fxs(['vigpulse', 0.5]) }, lyr: { style: 'Hormozi żółty', anim: 'pop' } });
ET({ id: 'neon', name: 'Neonowa noc', cat: 'Klimat', every: 2, sec: 0.9, tdur: 0.3, desc: 'Nocne miasto, neonowa poświata i błyski. Pasuje do rapu i muzyki klubowej.',
  base: (c) => { c.filter = { id: 'nightcity', amt: 1 }; c.fx = fxs(['neonglow', 0.5]); },
  segs: [{ in: ['zoomin', 0.25], fx: fxs(['chromab', 0.25]) }, { in: ['slideR', 0.25], loop: ['pulse', 0.5] }, { in: ['blurzoom', 0.3], loop: ['glowpulse', 0.8] }],
  trans: ['flashcut', 'leak'], layer: { fx: fxs(['bokeh', 0.35]) }, lyr: { style: 'Neon róż', anim: 'neonOn' } });
ET({ id: 'vhs', name: 'Retro VHS', cat: 'Retro', every: 2, sec: 1, tdur: 0.3, desc: 'Kaseta VHS z lat 80.: ziarno, drgania taśmy i przewijanie.',
  base: (c) => { c.filter = { id: 'vhs80', amt: 1 }; },
  segs: [{ in: ['flicker', 0.25], fx: fxs(['vhs', 0.7], ['grain', 0.4]) }, { in: ['fade', 0.2], fx: fxs(['vhs2', 0.5]) }, { in: ['glitchin', 0.2], fx: fxs(['vhs', 0.6], ['chromab', 0.3]) }],
  trans: ['vhsrewind', 'static'], layer: { fx: fxs(['dv', 0.3]) }, lyr: { style: 'Lata 80.', anim: 'fade' } });
ET({ id: 'cinema', name: 'Kinowy trailer', cat: 'Klimat', every: 4, sec: 2.5, tdur: 0.6, desc: 'Spokojne ujęcia z czarnymi pasami, ziarnem i powolnym najazdem kamery.',
  base: (c) => { c.filter = { id: 'teal', amt: 1 }; c.fx = fxs(['letterbox', 0.5]); },
  segs: [{ in: ['fade', 0.4], loop: ['kbIn', 1] }, { in: ['fade', 0.4], loop: ['kbOut', 1] }],
  trans: ['fade', 'dipblack'], layer: { fx: fxs(['grain', 0.4]) }, lyr: { style: 'Napisy: kinowe', anim: 'fade' } });
ET({ id: 'dream', name: 'Sny i estetyka', cat: 'Klimat', every: 2, sec: 1.4, tdur: 0.5, desc: 'Miękki, marzycielski look z poświatą, bokeh i unoszeniem się kadru.',
  base: (c) => { c.filter = { id: 'dream', amt: 1 }; c.fx = fxs(['glow', 0.5], ['bokeh', 0.35]); },
  segs: [{ in: ['slowfade', 0.5], loop: ['float', 0.8] }, { in: ['slowfade', 0.5], loop: ['drift', 0.8] }],
  trans: ['blur', 'fade'], layer: { fx: fxs(['sparkle', 0.4]) }, lyr: { style: 'Szkło biały', anim: 'blurText' } });
ET({ id: 'vlog', name: 'Podróż / vlog', cat: 'Lifestyle', every: 2, sec: 1.2, tdur: 0.35, desc: 'Żywe kolory, szybkie wjazdy i przejścia. Idealne na wakacje i vlogi.',
  base: (c) => { c.filter = { id: 'vivid', amt: 0.9 }; },
  segs: [{ in: ['pop', 0.25] }, { in: ['slideL', 0.25] }, { in: ['zoomin', 0.25] }, { in: ['slideR', 0.25] }],
  trans: ['whip', 'zoomblur', 'pushL', 'spin'], lyr: { style: 'Napisy: żółte', anim: 'pop' } });
ET({ id: 'lofi', name: 'Lo-fi wspomnienia', cat: 'Retro', every: 2, sec: 1.5, tdur: 0.5, desc: 'Ciepłe, wyblakłe kadry jak ze starej taśmy, z kurzem i delikatnym bujaniem.',
  base: (c) => { c.filter = { id: 'vintage', amt: 1 }; c.fx = fxs(['lowfi', 0.5], ['grain', 0.4]); },
  segs: [{ in: ['fade', 0.4], loop: ['sway', 0.7] }, { in: ['fade', 0.4], loop: ['breathe', 0.7] }],
  trans: ['fade'], layer: { fx: fxs(['dust', 0.5]) }, lyr: { style: 'Maszynopis', anim: 'typeCaret' } });
ET({ id: 'gold', name: 'Złoty hype', cat: 'Klimat', every: 1, sec: 0.7, tdur: 0.3, desc: 'Złota godzina, flary i iskierki. Luksusowy klimat do wolniejszych bitów.',
  base: (c) => { c.filter = { id: 'golden', amt: 1 }; c.fx = fxs(['glow', 0.4]); },
  segs: [{ in: ['zoomin', 0.3], fx: fxs(['lensflare', 0.6], ['sparkle', 0.5]) }, { in: ['fade', 0.25], fx: fxs(['rays', 0.5]) }],
  trans: ['leak', 'flashcut'], layer: { fx: fxs(['sparkle', 0.3]) }, lyr: { style: 'Metal Złoto', anim: 'zoomLetters' } });
ET({ id: 'dark', name: 'Mroczny edit', cat: 'Klimat', every: 1, sec: 0.65, tdur: 0.25, desc: 'Ciemny, kontrastowy look z pulsującą winietą i krótkimi zakłóceniami.',
  base: (c) => { c.filter = { id: 'moody', amt: 1 }; c.fx = fxs(['grain', 0.35]); },
  segs: [{ in: ['zoomin', 0.2], fx: fxs(['zoompunch', 0.7], ['vigpulse', 0.6]) }, { in: ['glitchin', 0.2], fx: fxs(['chromab', 0.4], ['jitter', 0.4]) }],
  trans: ['dipblack', 'flicker'], layer: { fx: fxs(['vigpulse', 0.4]) }, lyr: { style: 'Napisy: obrys', anim: 'fade' } });

/* efekty/animacje szablonu nałożone na jeden klip */
function tplApplyTo(c, tpl, i) {
  Looks.reset(c); c.curve = 'none'; c.animIn = { id: 'none', dur: 0.6 }; c.animOut = { id: 'none', dur: 0.6 }; c.trans = { id: 'none', dur: 0.7 };
  if (tpl.base) tpl.base(c);
  const r = tpl.segs[i % tpl.segs.length];
  if (r.in) c.animIn = { id: r.in[0], dur: r.in[1] };
  if (r.out) c.animOut = { id: r.out[0], dur: r.out[1] };
  if (r.loop) c.animLoop = { id: r.loop[0], amt: r.loop[1] == null ? 1 : r.loop[1] };
  if (r.fx) c.fx = c.fx.concat(r.fx);
  if (r.filter) c.filter = { id: r.filter[0], amt: r.filter[1] == null ? 1 : r.filter[1] };
  if (r.curve && c.type === 'video') c.curve = r.curve;
}
/* krótki opis „co zawiera szablon” (do kart) */
function tplIncludes(tpl) {
  const out = [tpl.every >= 4 ? 'Wolne ujęcia' : tpl.every === 1 ? 'Cięcia na każdy bit' : 'Cięcia na bit'];
  const f = tpl.segs.concat([{ fx: (tpl.layer || {}).fx }]).flatMap((r) => r.fx || []).map((e) => (FX[e.id] || {}).name).filter(Boolean);
  const base = newClip('image'); tpl.base && tpl.base(base);
  const filt = base.filter.id !== 'none' && FILTERS[base.filter.id] ? 'Filtr ' + FILTERS[base.filter.id].name : null;
  if (filt) out.push(filt);
  [...new Set(f)].slice(0, 3).forEach((n) => out.push(n));
  if (tpl.segs.some((s) => s.curve)) out.push('Krzywe prędkości');
  if (tpl.trans.length && tpl.trans[0] !== 'none') out.push('Przejścia: ' + [...new Set(tpl.trans.filter((t) => t !== 'none').map((t) => (TRANS[t] || {}).name).filter(Boolean))].slice(0, 2).join(', '));
  return out;
}

const EditTpl = {
  main: (c) => c.lane === 'v1' && (c.type === 'video' || c.type === 'image'),
  span() {
    const m = clips.filter(this.main).sort((a, b) => a.start - b.start);
    return m.length ? [m[0].start, clipEnd(m[m.length - 1])] : [0, 0];
  },
  cutTimes(tpl, opt) {
    const [t0, t1] = this.span(), marks = [];
    if (opt.cut === 'none') return { marks, beat: false };
    const hasAudio = clips.some((c) => (c.type === 'audio' || c.type === 'video') && getMedia(c) && getMedia(c).peaks);
    let beat = false;
    if (opt.cut === 'beat') {
      if (P.markers.length < 3 && hasAudio) Tools.beats();
      const ev = opt.every || tpl.every || 1;
      P.markers.filter((t, i) => i % ev === 0 && t > t0 + 0.2 && t < t1 - 0.2).forEach((t) => marks.push(t));
      beat = marks.length >= 2;
    }
    if (!beat) {
      marks.length = 0;
      const sec = Math.max(0.2, opt.sec || tpl.sec);
      for (let t = t0 + sec; t < t1 - sec * 0.4 && marks.length < 160; t += sec) marks.push(Math.round(t * 100) / 100);
    }
    return { marks, beat };
  },
  apply(tpl, opt) {
    opt = Object.assign({ cut: 'beat', sec: 0, lyrics: false }, opt || {});
    if (!clips.some(this.main)) { toast('Najpierw dodaj wideo lub zdjęcia na ścieżkę główną'); return; }
    const { marks, beat } = this.cutTimes(tpl, opt);
    clips.filter((c) => c.auto).forEach((c) => removeClip(c.id));
    marks.forEach((t) => { const c = clips.find((q) => this.main(q) && t > q.start + 0.12 && t < clipEnd(q) - 0.12); if (c) splitClip(c, t); });
    const segs = clips.filter(this.main).sort((a, b) => a.start - b.start);
    segs.forEach((c, i) => {
      tplApplyTo(c, tpl, i);
      if (i === 0) c.animIn = { id: 'none', dur: 0.6 };   /* pierwszy kadr bez wejścia, żeby podgląd nie zaczynał się od czerni */
      if (i > 0 && tpl.trans.length) {
        const prev = segs[i - 1], id = tpl.trans[(i - 1) % tpl.trans.length];
        if (id !== 'none' && Math.abs(clipEnd(prev) - c.start) < 0.06) c.trans = { id, dur: Math.max(0.12, Math.min(tpl.tdur, c.dur * 0.45, prev.dur * 0.45)) };
      }
    });
    const [t0, t1] = this.span();
    if (tpl.layer && t1 - t0 > 0.3) {
      const lane = ['v2', 'v3'].find((l) => laneFreeAt(l, t0, t1 - t0));
      if (lane) { const lc = newClip('fx', { lane, start: t0, dur: t1 - t0, fx: tpl.layer.fx.slice() }); lc.auto = true; clips.push(lc); }
      else segs.forEach((c) => { c.fx = c.fx.concat(tpl.layer.fx.map((e) => Object.assign({}, e))); });   /* ścieżki nakładek zajęte: efekty warstwy trafiają na ujęcia */
    }
    let lyrN = 0;
    if (opt.lyrics && opt.lyricsText && opt.lyricsText.trim()) {
      const lo = { style: tpl.lyr && tpl.lyr.style, anim: tpl.lyr && tpl.lyr.anim };
      Object.entries(opt.lyrOpt || {}).forEach(([k, v]) => { if (v != null && v !== '') lo[k] = v; });
      lyrN = Lyrics.add(opt.lyricsText, lo, true);
    }
    S.sel = null; commit(); Engine.seek(t0 + Math.min(0.35, (segs[0] ? segs[0].dur : 1) * 0.5));
    toast(`Szablon „${tpl.name}”: ${segs.length} ujęć${beat ? ' (na rytm)' : ''}${lyrN ? ', ' + lyrN + ' napisów' : ''}. Każdy klip możesz edytować. Cofnij: Ctrl+Z.`);
  },
  clear() {
    const n = clips.filter((c) => c.auto).length;
    clips.filter((c) => c.auto).forEach((c) => removeClip(c.id));
    Looks.targets().forEach((c) => { Looks.reset(c); c.curve = 'none'; c.animIn = { id: 'none', dur: 0.6 }; c.animOut = { id: 'none', dur: 0.6 }; if (c.lane === 'v1') c.trans = { id: 'none', dur: 0.7 }; });
    commit(); toast(n ? 'Zdjęto szablon (efekty, animacje i przejścia)' : 'Zdjęto efekty i animacje z klipów');
  },
};

/* ---------- napisy z piosenki ---------- */
const LYRIC_STYLES = ['Napisy: klasyczne', 'Hormozi żółty', 'Hormozi biały', 'Neon cyjan', 'Neon róż', 'Szkło biały', 'Szkło różowy', 'Galaktyka różowa', 'Różowo-fioletowy (płynący)', 'Złoty edit', 'Gradient Zachód', 'Metal Złoto', 'Napisy: obrys', 'Lata 80.', 'Maszynopis', 'Napisy: kinowe'];
const LYRIC_ANIMS = [['none', 'Bez animacji'], ['fade', 'Zanikanie'], ['pop', 'Wyskok'], ['zoomin', 'Zoom'], ['letters', 'Litery (pop)'], ['slideLetters', 'Litery z lewej'], ['zoomLetters', 'Litery zoom'], ['blurText', 'Rozmycie → ostrość'], ['typeCaret', 'Maszyna z kursorem'], ['neonOn', 'Neon zapala się'], ['glitchLetters', 'Glitch liter'], ['dropletters', 'Spadające litery'], ['words', 'Słowa po kolei'], ['lineIn', 'Wiersze po kolei']];
const Lyrics = {
  parse(text) {   /* linie z czasami [mm:ss.xx] (LRC) albo bloki SRT → [{t, text, end?}] albo null */
    const raw = String(text || '').replace(/\r/g, '');
    const lrc = [];
    raw.split('\n').forEach((ln) => {
      const m = ln.match(/^\s*((?:\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]\s*)+)(.*)$/);
      if (!m) return;
      const txt = m[2].trim(); if (!txt) return;
      m[1].replace(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g, (_, mm, ss, ff) => { lrc.push({ t: (+mm) * 60 + (+ss) + (ff ? +('0.' + ff) : 0), text: txt }); return ''; });
    });
    if (lrc.length >= 2) { lrc.sort((a, b) => a.t - b.t); return lrc; }
    const srt = [], re = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*\n([\s\S]*?)(?=\n\s*\n|\s*$)/g;
    let m;
    while ((m = re.exec(raw))) { srt.push({ t: (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + +('0.' + m[4]), end: (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + +('0.' + m[8]), text: m[9].replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim() }); }
    return srt.length ? srt : null;
  },
  span() {
    const sel = byId(S.sel);
    if (sel && sel.type !== 'text' && sel.lane !== 'v2' && sel.lane !== 'v3') return { a: sel.start, b: clipEnd(sel), c: sel, label: 'zaznaczony klip' };
    const m = EditTpl.span();
    if (m[1] > m[0]) return { a: m[0], b: m[1], c: null, label: 'cały film' };
    const d = projectDuration(); return { a: 0, b: Math.max(d, 8), c: null, label: 'cały film' };
  },
  moved: 0,
  /* ścieżka nakładek wolna dokładnie w tym czasie; gdy zajęta, skracam napis do wolnej luki; ostatecznie przesuwam */
  place(start, dur) {
    for (const lane of ['v3', 'v2']) if (laneFreeAt(lane, start, dur)) return { lane, start, dur };
    for (const lane of ['v3', 'v2']) {
      const inside = clips.some((o) => o.lane === lane && o.start <= start + 1e-6 && clipEnd(o) > start + 1e-6);
      if (inside) continue;
      const nx = clips.filter((o) => o.lane === lane && o.start > start).reduce((m, o) => Math.min(m, o.start), Infinity);
      if (nx - start >= 0.35) return { lane, start, dur: Math.min(dur, nx - start - 0.02) };
    }
    const lane = freeOverlayLane(start, dur);
    return { lane, start: resolveStart({ id: '' }, lane, start, dur), dur, moved: true };
  },
  remove() { const n = clips.filter((c) => c.lyr).length; clips.filter((c) => c.lyr).forEach((c) => removeClip(c.id)); return n; },
  mk(str, start, dur, o) {
    const st = TEXT_STYLES.find((s) => s.name === o.style) || TEXT_STYLES.find((s) => s.name === 'Napisy: klasyczne') || TEXT_STYLES[0];
    const pl = this.place(start, dur);
    const c = newClip('text', { lane: pl.lane, start: pl.start, dur: pl.dur, y: o.y == null ? 0.3 : o.y, text: Object.assign(defText(str), styleFull(st.t)) });
    dur = pl.dur; if (pl.moved) this.moved++;
    applyTextStyle(c, st.t, null);
    const len = str.length, cap = o.mode === 'word' ? 0.14 : (len > 30 ? 0.058 : len > 20 ? 0.07 : 0.085);
    c.text.size = Math.min(c.text.size || 0.085, cap) * (o.scale || 1);
    if (o.mode === 'word') c.text.size = Math.max(c.text.size, 0.11);
    const anim = o.anim == null ? (st.a ? 'style' : 'fade') : o.anim;
    if (anim === 'style' && st.a) applyTextAnim(c, st.a);
    else if (anim !== 'none' && anim !== 'style') { c.animIn = { id: anim, dur: Math.min(anim === 'typeCaret' ? 1.2 : 0.55, dur * 0.5) }; c.animOut = { id: 'fade', dur: Math.min(0.25, dur * 0.25) }; }
    else { c.animIn = { id: 'none', dur: 0.5 }; c.animOut = { id: 'none', dur: 0.5 }; }
    c.lyr = true; clips.push(c); return c;
  },
  /* dodaje napisy; zwraca liczbę klipów. noCommit = wywołane z szablonu */
  add(text, o = {}, noCommit) {
    const parsed = this.parse(text), sp = this.span();
    let n = 0;
    this.remove(); this.moved = 0;
    const base = sp.c ? (t) => sp.c.start + (t - sp.c.inPt) / (sp.c.speed || 1) : (t) => sp.a + t;
    if (parsed) {
      parsed.forEach((ln, i) => {
        const nx = parsed[i + 1], t = base(ln.t), e = ln.end != null ? base(ln.end) : (nx ? base(nx.t) : t + 3), dur = Math.max(0.3, Math.min(e - t - 0.02, 8));
        if (t < 0) return;
        if (o.mode === 'word') { const w = ln.text.split(/\s+/).filter(Boolean), wd = dur / Math.max(1, w.length); w.forEach((x, j) => { this.mk(x, t + j * wd, Math.max(0.15, wd * 0.98), o); n++; }); }
        else { this.mk(ln.text, t, dur, o); n++; }
      });
    } else {
      const lines = String(text || '').split(/\n/).map((s) => s.trim()).filter(Boolean);
      if (!lines.length) { if (!noCommit) toast('Wklej tekst piosenki (jedna linijka = jeden napis)'); return 0; }
      const per = o.per > 0 ? o.per : (sp.b - sp.a) / lines.length;
      lines.forEach((ln, i) => {
        const st = sp.a + i * per;
        if (o.mode === 'word') { const w = ln.split(/\s+/).filter(Boolean), wd = per / Math.max(1, w.length); w.forEach((x, j) => { this.mk(x, st + j * wd, Math.max(0.15, wd * 0.98), o); n++; }); }
        else { this.mk(ln, st, Math.max(0.4, per * 0.96), o); n++; }
      });
    }
    if (!noCommit) { S.sel = null; commit(); Engine.seek(sp.a); toast(`Dodano ${n} napisów${parsed ? ' (z czasami z pliku)' : ' (rozłożone równo na: ' + sp.label + ')'}.${this.moved ? ' ' + this.moved + ' przesunięto, bo ścieżki nakładek były zajęte — usuń inne nakładki lub popraw czas na osi.' : ' Przeciągnij je na osi, aby poprawić czas.'}`); }
    return n;
  },
};
