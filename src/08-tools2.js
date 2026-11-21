'use strict';
/* ============================================================
   Kadr Studio — gotowe looki, pakiety przejść, auto-montaż na bit
   ============================================================ */
const LOOKS = [];
const L = (name, cat, fn) => LOOKS.push({ id: name, name, cat, apply: fn });
const fxs = (...a) => a.map(([id, amt]) => ({ id, amt }));
/* Edit */
L('CC ciepły', 'Edit', (c) => { c.filter = { id: 'punch', amt: 1 }; c.fx = fxs(['glow', 0.35]); });
L('CC zimny', 'Edit', (c) => { c.filter = { id: 'blockbuster', amt: 1 }; c.fx = fxs(['chromab', 0.3], ['glow', 0.3]); });
L('CC neon', 'Edit', (c) => { c.filter = { id: 'cyber', amt: 1 }; c.fx = fxs(['neonglow', 0.6]); });
L('Uderzenie na bit', 'Edit', (c) => { c.filter = { id: 'punch', amt: 0.7 }; c.fx = fxs(['zoompunch', 0.8]); });
L('Mocny wstrząs', 'Edit', (c) => { c.fx = fxs(['heavyshake', 0.6], ['rgb', 0.3]); });
L('Glitch hit', 'Edit', (c) => { c.fx = fxs(['glitchcolor', 0.6], ['chromab', 0.4]); });
L('Złoty edit', 'Edit', (c) => { c.filter = { id: 'golden', amt: 1 }; c.fx = fxs(['glow', 0.4], ['lensflare', 0.5], ['sparkle', 0.5]); });
L('Velocity: montaż', 'Edit', (c) => { c.curve = 'montage'; c.filter = { id: 'punch', amt: 0.8 }; c.fx = fxs(['radialblur', 0.35]); });
L('Slow-mo bohater', 'Edit', (c) => { c.curve = 'hero'; c.filter = { id: 'cinema', amt: 1 }; c.fx = fxs(['glow', 0.3]); });
L('Bullet time', 'Edit', (c) => { c.curve = 'bullet'; c.fx = fxs(['motionblur', 0.5], ['chromab', 0.3]); });
L('Flash in', 'Edit', (c) => { c.curve = 'flashin'; c.fx = fxs(['flash', 0.6]); });
L('Zoom lens', 'Edit', (c) => { c.fx = fxs(['zoomlens', 0.7], ['chromab', 0.3]); });
L('Kamera z ręki', 'Edit', (c) => { c.filter = { id: 'clear', amt: 1 }; c.fx = fxs(['handheld', 0.7]); });
L('Przyspieszenie', 'Edit', (c) => { c.curve = 'rampup'; c.fx = fxs(['motionblur', 0.4]); });
/* Kino */
L('Teal & Orange', 'Kino', (c) => { c.filter = { id: 'teal', amt: 1 }; c.fx = fxs(['letterbox', 0.4]); });
L('Noir', 'Kino', (c) => { c.filter = { id: 'noir', amt: 1 }; c.fx = fxs(['grain', 0.5], ['letterbox', 0.3]); });
L('Ciepły film', 'Kino', (c) => { c.filter = { id: 'film2', amt: 1 }; c.fx = fxs(['grain', 0.4], ['letterbox', 0.5]); });
L('Anamorphic', 'Kino', (c) => { c.filter = { id: 'blockbuster', amt: 1 }; c.fx = fxs(['letterbox', 0.6], ['lensflare', 0.4]); });
L('Sny', 'Kino', (c) => { c.filter = { id: 'dream', amt: 1 }; c.fx = fxs(['glow', 0.6], ['bokeh', 0.5]); });
L('Noc w mieście', 'Kino', (c) => { c.filter = { id: 'nightcity', amt: 1 }; c.fx = fxs(['bokeh', 0.4], ['chromab', 0.2]); });
/* Retro */
L('VHS wspomnienia', 'Retro', (c) => { c.filter = { id: 'vhs80', amt: 1 }; c.fx = fxs(['vhs', 0.7]); });
L('Retro DV', 'Retro', (c) => { c.filter = { id: 'y2k', amt: 1 }; c.fx = fxs(['dv', 0.8]); });
L('Stary film', 'Retro', (c) => { c.filter = { id: 'vintage', amt: 1 }; c.fx = fxs(['oldfilm', 0.8]); });
L('CCTV', 'Retro', (c) => { c.fx = fxs(['cctv', 0.8]); });
L('Polaroid', 'Retro', (c) => { c.filter = { id: 'polaroid', amt: 1 }; c.fx = fxs(['polaroid', 0.8]); });
L('Lo-fi', 'Retro', (c) => { c.fx = fxs(['lowfi', 0.6], ['vhs2', 0.5]); });
L('Półton', 'Retro', (c) => { c.fx = fxs(['halftone', 0.7]); });
/* Kolor */
L('Cyberpunk', 'Kolor', (c) => { c.fx = fxs(['cyberpunk', 0.9], ['neonglow', 0.4]); });
L('Duotone fiolet', 'Kolor', (c) => { c.fx = fxs(['duotone', 0.9]); });
L('Duotone zachód', 'Kolor', (c) => { c.fx = fxs(['sunsetduo', 0.9]); });
L('Złota godzina', 'Kolor', (c) => { c.filter = { id: 'golden', amt: 1 }; c.fx = fxs(['rays', 0.5], ['overexpose', 0.2]); });
L('Noktowizor', 'Kolor', (c) => { c.fx = fxs(['nightvision', 0.9]); });
L('Lodowy', 'Kolor', (c) => { c.filter = { id: 'ice', amt: 1 }; c.fx = fxs(['bokeh', 0.4]); });
L('Pryzmat', 'Kolor', (c) => { c.fx = fxs(['prism', 0.7], ['hueshift', 0.3]); });
L('B&W + ziarno', 'Kolor', (c) => { c.filter = { id: 'cinebw', amt: 1 }; c.fx = fxs(['grain', 0.5]); });

const Looks = {
  targets() {
    const ids = Act.ids();
    let list = ids.map(byId).filter((c) => c && (c.type === 'video' || c.type === 'image'));
    if (!ids.length) list = clips.filter((c) => c.type === 'video' || c.type === 'image');
    return list;
  },
  reset(c) { c.filter = { id: 'none', amt: 1 }; c.adj = defAdj(); c.fx = []; c.animLoop = { id: 'none', amt: 1 }; },
  apply(look) {
    const list = this.targets();
    if (!list.length) { toast('Najpierw dodaj wideo lub zdjęcie na oś czasu'); return; }
    list.forEach((c) => { this.reset(c); look.apply(c); });
    commit(); toast(`Look „${look.name}” zastosowany (${list.length})`);
  },
  clear() {
    const list = this.targets();
    if (!list.length) return;
    list.forEach((c) => { this.reset(c); c.curve = 'none'; });
    commit(); toast('Usunięto look');
  },
  packTransitions(id, dur) {
    const lc = clips.filter((c) => c.lane === 'v1' && c.type !== 'fx').sort((a, b) => a.start - b.start), ids = Object.keys(TRANS);
    let n = 0;
    for (let i = 1; i < lc.length; i++) {
      const A = lc[i - 1], B = lc[i];
      if (Math.abs(clipEnd(A) - B.start) > 0.06) continue;
      if (id === 'none') B.trans = { id: 'none', dur: 0.7 };
      else B.trans = { id: id === 'random' ? ids[Math.floor(Math.random() * ids.length)] : id, dur };
      n++;
    }
    if (!n) { toast('Potrzebuję co najmniej dwóch stykających się klipów na ścieżce głównej'); return; }
    commit(); toast(id === 'none' ? 'Usunięto przejścia' : `Dodano przejścia (${n})`);
  },
};

/* ---------- auto-montaż na bit ---------- */
const AutoEdit = {
  fxAt(t, dur, list) {
    const lane = freeOverlayLane(t, dur), c = newClip('fx', { lane, start: resolveStart({ id: '' }, lane, t, dur), dur, fx: list });
    c.auto = true; clips.push(c); return c;
  },
  ovAt(id, t, dur, amt) { const c = addOverlayClip(id, t, dur); if (c) { c.auto = true; if (amt) c.overlay.amt = amt; S.sel = null; } return c; },
  run(style, every) {
    if (P.markers.length < 3) Tools.beats(true);
    const marks = P.markers.filter((_, i) => i % every === 0);
    const main = (c) => c.lane === 'v1' && (c.type === 'video' || c.type === 'image');
    if (!clips.some(main)) { toast('Dodaj wideo lub zdjęcie na ścieżkę główną'); return; }
    if (marks.length < 2) { toast('Nie mam znaczników rytmu. Dodaj muzykę (klip audio) i poczekaj na falę dźwięku albo ustaw znaczniki klawiszem M.', 'err'); return; }
    clips.filter((c) => c.auto).forEach((c) => removeClip(c.id));
    marks.forEach((t) => { const c = clips.find((q) => main(q) && t > q.start + 0.12 && t < clipEnd(q) - 0.12); if (c) splitClip(c, t); });
    const segs = clips.filter(main).sort((a, b) => a.start - b.start);
    segs.forEach((c, i) => {
      c.animIn = { id: 'none', dur: 0.6 }; c.animOut = { id: 'none', dur: 0.6 }; c.animLoop = { id: 'none', amt: 1 };
      if (i === 0 && style !== 'calm') return;
      if (style === 'calm') { c.animLoop = { id: i % 2 ? 'kbOut' : 'kbIn', amt: 1 }; if (i > 0) c.trans = { id: 'fade', dur: 0.4 }; }
      else if (style === 'spin') c.animIn = { id: i % 2 ? 'rotL' : 'rotR', dur: 0.3 };
      else c.animIn = { id: 'punchin', dur: style === 'glitch' || style === 'shake' ? 0.15 : 0.22 };
    });
    segs.slice(1).forEach((c) => {
      const t = Math.max(0, c.start - 0.03);
      if (style === 'flash') this.ovAt('flashWhite', t, 0.3, 0.9);
      else if (style === 'glitch') this.fxAt(t, 0.25, fxs(['glitchcolor', 0.8], ['chromab', 0.5]));
      else if (style === 'shake') this.fxAt(t, 0.3, fxs(['heavyshake', 0.7], ['rgb', 0.4]));
      else if (style === 'spin') this.ovAt('flashColor', t, 0.3, 0.8);
    });
    S.sel = null; commit(); Engine.seek(0);
    toast(`Zmontowano na bit: ${segs.length} ujęć. Dopieść w Looki, Prędkość i Nakładki.`);
  },
};

/* ---------- dodawanie tekstu ze stylem i animacją szablonu ---------- */
App.addText = function (str, style, anim) {
  const sel = byId(S.sel);
  if (style && sel && sel.type === 'text') { applyTextStyle(sel, style, anim); commit(); if (anim) Tools.previewClip(sel, 'in'); return; }
  const c = addTextClip(str || 'Twój tekst', style ? styleFull(style) : undefined);
  if (style) applyTextStyle(c, style, anim); else c.animIn = { id: 'fade', dur: 0.5 };
  if (anim) c.dur = Math.max(c.dur, 3);
  UI.insTab = 'text'; commit();
  Engine.seek(c.start + 0.2);
  if (anim) Tools.previewClip(c, 'in');
  const ta = $('#inspector textarea'); if (ta && !document.body.dataset.mobile) { ta.focus(); ta.select(); }
};
