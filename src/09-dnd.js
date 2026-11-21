'use strict';
/* ============================================================
   Kadr Studio — przeciąganie kafelków na klipy / oś czasu / podgląd (jak w CapCut)
   oraz menu pod prawym przyciskiem myszy
   ============================================================ */
const DND = {
  st: null, suppress: false, ghost: null, hintEl: null, box: null, hl: [],

  init() {
    const host = $('#stageHost');
    this.box = h('div', { class: 'dnd-box', hidden: true }); host.append(this.box);
    /* biblioteka mediów (HTML5 drag) także na podgląd: jako nakładka */
    host.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('text/kadr-media')) { e.preventDefault(); host.classList.add('dropping'); } });
    host.addEventListener('dragleave', () => host.classList.remove('dropping'));
    host.addEventListener('drop', (e) => {
      host.classList.remove('dropping');
      const m = media.get(e.dataTransfer.getData('text/kadr-media')); if (!m) return;
      e.preventDefault();
      addMediaClip(m, { lane: m.kind === 'audio' ? 'a1' : (clips.some((c) => c.lane === 'v1') ? 'v2' : 'v1'), start: S.time, keepAspect: false });
      commit(); Engine.setupRenderer();
    });
    Ctx.init();
  },

  attach(el, payload) {
    el.setAttribute('data-dnd', '1');
    el.addEventListener('dragstart', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => this.down(e, el, payload));
    el.addEventListener('click', (e) => { if (this.suppress) { e.stopImmediatePropagation(); e.preventDefault(); this.suppress = false; } }, true);
  },
  down(e, el, payload) {
    if ((e.button !== undefined && e.button !== 0) || e.pointerType === 'touch') return;   /* na telefonie: dotknij kafelka */
    const lab = el.querySelector('.tl');
    this.st = { el, payload: Object.assign({ name: payload.name || (lab ? lab.textContent : '') }, payload), x0: e.clientX, y0: e.clientY, started: false, target: null };
    this._mv = (ev) => this.move(ev); this._up = (ev) => this.up(ev);
    window.addEventListener('pointermove', this._mv); window.addEventListener('pointerup', this._up); window.addEventListener('pointercancel', this._up);
  },
  begin(e) {
    const s = this.st; s.started = true; this.suppress = true;
    document.body.classList.add('dnd');
    const cv = s.el.querySelector('canvas'), g = h('div', { class: 'dnd-ghost' });
    if (cv) { const c = mkCanvas(96, 61); c.getContext('2d').drawImage(cv, 0, 0, 96, 61); g.append(c); }
    else g.append(h('div', { class: 'gtxt' }, s.el.textContent.slice(0, 4)));
    this.hintEl = h('div', { class: 'dnd-hint' }, s.payload.name);
    g.append(this.hintEl); document.body.append(g); this.ghost = g;
  },
  move(e) {
    const s = this.st; if (!s) return;
    if (!s.started) { if (Math.hypot(e.clientX - s.x0, e.clientY - s.y0) < 6) return; this.begin(e); }
    this.ghost.style.left = e.clientX + 'px'; this.ghost.style.top = e.clientY + 'px';
    /* automatyczne przewijanie osi przy brzegu */
    const sc = TL.scroll.getBoundingClientRect();
    if (e.clientY > sc.top && e.clientY < sc.bottom) { if (e.clientX > sc.right - 40) TL.scroll.scrollLeft += 18; else if (e.clientX < sc.left + 40) TL.scroll.scrollLeft -= 18; }
    const tg = this.targetAt(e.clientX, e.clientY), v = this.can(s.payload, tg);
    s.target = tg; s.ok = v.ok;
    this.hintEl.textContent = v.label; this.hintEl.classList.toggle('bad', !v.ok);
    this.highlight(v.ok ? tg : null);
  },
  up(e) {
    window.removeEventListener('pointermove', this._mv); window.removeEventListener('pointerup', this._up); window.removeEventListener('pointercancel', this._up);
    const s = this.st; this.st = null;
    if (!s || !s.started) return;
    document.body.classList.remove('dnd');
    if (this.ghost) { this.ghost.remove(); this.ghost = null; }
    this.highlight(null);
    setTimeout(() => { this.suppress = false; }, 60);
    if (s.ok && s.target) { try { this.drop(s.payload, s.target); } catch (err) { console.error(err); toast('Nie udało się upuścić elementu', 'err'); } }
    else if (s.target) toast(this.can(s.payload, s.target).label);
  },

  /* ---------- co jest pod kursorem ---------- */
  targetAt(x, y) {
    const el = document.elementFromPoint(x, y); if (!el) return null;
    const host = $('#stageHost');
    if (host && host.contains(el) && Engine.R) {
      const r = host.getBoundingClientRect(), k = Stage.k(), px = (x - r.left) / k, py = (y - r.top) / k, c = Stage.hit(px, py);
      return c ? { kind: 'clip', clip: c, via: 'stage', px, py, rx: clamp((S.time - c.start) / Math.max(0.1, c.dur), 0, 1) } : { kind: 'stage', px, py };
    }
    const j = el.closest && el.closest('.junc');
    if (j && TL.content.contains(j)) { const lane = j.parentElement.dataset.lane; const c = clips.find((q) => q.lane === lane && Math.abs(TL.px(q.start) - parseFloat(j.style.left)) < 2 && prevAdjacent(q)); if (c) return { kind: 'junc', clip: c, el: j }; }
    const ce = el.closest && el.closest('.clip');
    if (ce && TL.content.contains(ce)) { const c = byId(ce.dataset.id), r = ce.getBoundingClientRect(); if (c) return { kind: 'clip', clip: c, via: 'tl', el: ce, t: TL.timeAt(x), rx: clamp((x - r.left) / r.width, 0, 1) }; }
    const le = el.closest && el.closest('.lane');
    if (le && TL.content.contains(le)) return { kind: 'lane', lane: le.dataset.lane, t: TL.timeAt(x), el: le };
    return null;
  },
  transTarget(tg) {
    if (!tg) return null;
    if (tg.kind === 'junc') return tg.clip;
    if (tg.kind === 'clip') {
      const c = tg.clip; if (!isVisual(c) || c.type === 'fx' || c.type === 'overlay') return null;
      const prev = prevAdjacent(c), next = nextAdjacent(c);
      if (prev && next) return tg.rx < 0.5 ? c : next; if (prev) return c; if (next) return next; return null;
    }
    if (tg.kind === 'lane' && laneKind(tg.lane) === 'v') {
      let best = null, bd = 0.7;
      for (const c of laneClips(tg.lane)) { if (c.type === 'fx' || c.type === 'overlay' || !prevAdjacent(c)) continue; const d = Math.abs(c.start - tg.t); if (d < bd) { bd = d; best = c; } }
      return best;
    }
    return null;
  },
  /* czy można i co się stanie */
  can(pl, tg) {
    const ok = (label) => ({ ok: true, label }), bad = (label) => ({ ok: false, label });
    if (!tg) return bad('Upuść na klip, ścieżkę lub podgląd');
    const c = tg.clip, nm = pl.name, title = c ? UI.clipTitle(c) : '';
    switch (pl.kind) {
      case 'fx': case 'filter':
        if (c) return (c.type === 'audio' || c.type === 'overlay') ? bad('Efekty działają na obraz, nie na „' + title + '”') : ok(nm + ' → „' + title + '”');
        if (tg.kind === 'lane' && laneKind(tg.lane) === 'a') return bad('Efekty działają na obraz');
        return ok(nm + ' → nowa warstwa na osi');
      case 'look':
        if (c && (c.type === 'video' || c.type === 'image')) return ok('Look „' + nm + '” → „' + title + '”');
        return bad('Look działa na wideo i zdjęcia. Upuść na klip.');
      case 'anim': {
        if (!c || c.type === 'audio' || c.type === 'fx') return bad('Animację upuść na klip z obrazem');
        const def = (pl.dict === 'loop' ? ANIM_LOOP : ANIM_IO)[pl.id];
        if (def && def.textOnly && c.type !== 'text') return bad('Ta animacja działa tylko na tekście');
        return ok(nm + ' (' + { in: 'wejście', out: 'wyjście', loop: 'pętla' }[pl.dict] + ') → „' + title + '”');
      }
      case 'curve':
        return c && (c.type === 'video' || c.type === 'audio') ? ok('Krzywa „' + nm + '” → „' + title + '”') : bad('Krzywa prędkości działa na wideo i audio');
      case 'trans': {
        const B = this.transTarget(tg);
        return B ? ok(nm + ': „' + UI.clipTitle(prevAdjacent(B)) + '” → „' + UI.clipTitle(B) + '”') : bad('Przejście działa między dwoma stykającymi się klipami. Upuść na styk.');
      }
      case 'text':
        if (c && c.type === 'text') return ok('Zmień styl napisu „' + title + '”');
        if (tg.kind === 'lane' && laneKind(tg.lane) === 'a') return bad('Napis dodaj na ścieżce obrazu');
        return ok('Dodaj napis „' + nm + '” tutaj');
      default:
        if (tg.kind === 'lane' && laneKind(tg.lane) === 'a') return bad('Upuść na ścieżkę obrazu lub podgląd');
        return ok('Dodaj „' + nm + '” tutaj');
    }
  },
  highlight(tg) {
    this.hl.forEach((el) => el.classList.remove('dnd-over')); this.hl = [];
    this.box.hidden = true;
    if (!tg) return;
    let el = null;
    if (tg.kind === 'junc') el = tg.el;
    else if (tg.kind === 'clip' && tg.via === 'tl') el = tg.el;
    else if (tg.kind === 'lane') el = tg.el;
    else if (tg.kind === 'clip' && tg.via === 'stage') {
      const b = Engine.R.clipBox(tg.clip), k = Stage.k();
      if (b) { this.box.hidden = false; Object.assign(this.box.style, { left: b.cx * k + 'px', top: b.cy * k + 'px', width: b.w * k + 'px', height: b.h * k + 'px', transform: `translate(-50%,-50%) rotate(${tg.clip.rot}deg)` }); }
    }
    if (el) { el.classList.add('dnd-over'); this.hl.push(el); }
    if (tg.kind === 'clip' && this.st && this.st.payload.kind === 'trans') { const B = this.transTarget(tg); if (B) { const j = $$('.junc', TL.content).find((q) => q.parentElement.dataset.lane === B.lane && Math.abs(parseFloat(q.style.left) - TL.px(B.start)) < 2); if (j) { j.classList.add('dnd-over'); this.hl.push(j); } } }
  },

  /* ---------- upuszczenie ---------- */
  drop(pl, tg) {
    const R = Engine.R;
    const group = (c) => { const ids = Act.ids(); return ids.includes(c.id) && ids.length > 1 ? ids.map(byId).filter(Boolean) : [c]; };
    const place = (c, tgt) => {   /* przenosi nowy klip na ścieżkę, na którą upuszczono (jeśli wolna) */
      if (tgt.kind === 'lane' && laneKind(tgt.lane) === 'v' && tgt.lane !== 'v1' && laneFreeAt(tgt.lane, c.start, c.dur, c.id)) c.lane = tgt.lane;
      if (tgt.kind === 'stage' || (tgt.kind === 'clip' && tgt.via === 'stage')) { c.x = clamp(tgt.px / R.W - 0.5, -0.6, 0.6); c.y = clamp(tgt.py / R.H - 0.5, -0.6, 0.6); }
    };
    const atTime = tg.t != null ? tg.t : S.time, keepT = S.time;
    const withTime = (fn) => { S.time = Math.max(0, atTime); try { return fn(); } finally { S.time = keepT; } };
    const c = tg.clip;
    let sel = c ? c.id : null;
    switch (pl.kind) {
      case 'fx':
        if (c) group(c).forEach((q) => { if (!q.fx.some((e) => e.id === pl.id)) q.fx.push({ id: pl.id, amt: 0.6 }); });
        else { const l = withTime(() => addFxLayer({ fx: [{ id: pl.id, amt: 0.6 }] })); place(l, tg); sel = l.id; }
        break;
      case 'filter':
        if (c) group(c).forEach((q) => { q.filter = { id: pl.id, amt: 1 }; });
        else { const l = withTime(() => addFxLayer({ filter: { id: pl.id, amt: 1 } })); place(l, tg); sel = l.id; }
        break;
      case 'look': { const look = LOOKS.find((l) => l.id === pl.id); group(c).filter((q) => q.type === 'video' || q.type === 'image').forEach((q) => { Looks.reset(q); look.apply(q); }); break; }
      case 'anim': {
        const key = { in: 'animIn', out: 'animOut', loop: 'animLoop' }[pl.dict];
        group(c).forEach((q) => { if (q.type === 'audio' || q.type === 'fx') return; q[key] = pl.dict === 'loop' ? { id: pl.id, amt: q[key].amt || 1 } : { id: pl.id, dur: q[key].dur || 0.6 }; });
        break;
      }
      case 'curve': group(c).forEach((q) => { if (q.type === 'video' || q.type === 'audio') q.curve = pl.id; }); break;
      case 'trans': { const B = this.transTarget(tg); B.trans = { id: pl.id, dur: B.trans && B.trans.dur ? B.trans.dur : 0.7 }; sel = B.id; break; }
      case 'overlay': { const o = withTime(() => addOverlayClip(pl.id, Math.max(0, atTime))); place(o, tg); sel = o.id; break; }
      case 'text':
        if (c && c.type === 'text') applyTextStyle(c, pl.style, pl.anim);
        else { const t = withTime(() => addTextClip('Twój tekst', styleFull(pl.style))); applyTextStyle(t, pl.style, pl.anim); place(t, tg); sel = t.id; }
        break;
      case 'sticker': { const t = withTime(() => addStickerClip(pl.emoji)); place(t, tg); sel = t.id; break; }
      case 'shape': { const t = withTime(() => addShapeClip(pl.id)); t.sticker.color = S.shapeColor; place(t, tg); sel = t.id; break; }
      default: return;
    }
    S.sel = sel; S.multi = [];
    commit(); Bus.emit('select'); TL.syncSel();
    const clip = byId(sel);
    if (clip && pl.kind === 'anim') Tools.previewClip(clip, pl.dict);
    else if (clip && pl.kind === 'trans') UI.previewTrans(clip);
    toast('Zastosowano: ' + pl.name);
  },
};

/* ============================================================
   MENU KONTEKSTOWE (prawy przycisk myszy)
   ============================================================ */
const Ctx = {
  el: null,
  init() {
    const close = () => this.close();
    window.addEventListener('pointerdown', (e) => { if (this.el && !this.el.contains(e.target)) close(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', close); $('#tlScroll').addEventListener('scroll', close);
    $('#timeline').addEventListener('contextmenu', (e) => this.onTimeline(e));
    $('#stageHost').addEventListener('contextmenu', (e) => this.onStage(e));
  },
  close() { if (this.el) { this.el.remove(); this.el = null; } },
  show(x, y, items) {
    this.close();
    const m = h('div', { class: 'ctx', role: 'menu' });
    items.filter(Boolean).forEach((it) => {
      if (it.sep) { m.append(h('hr')); return; }
      m.append(h('button', { class: 'ci' + (it.danger ? ' danger' : ''), disabled: it.disabled, role: 'menuitem', onclick: () => { this.close(); it.fn(); } },
        h('span', { class: 'cic', html: it.ic ? icon(it.ic, 15) : '' }), h('span', { class: 'cl2' }, it.label), it.key ? h('kbd', {}, it.key) : null));
    });
    document.body.append(m); this.el = m;
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(6, Math.min(x, window.innerWidth - r.width - 6)) + 'px';
    m.style.top = Math.max(6, Math.min(y, window.innerHeight - r.height - 6)) + 'px';
  },
  clipItems(c) {
    const visual = isVisual(c) && c.type !== 'overlay';
    return [
      { label: 'Podziel w miejscu głowicy', key: 'S', ic: 'scissors', fn: () => Act.split() },
      { label: 'Duplikuj', key: 'Ctrl+D', ic: 'copy', fn: () => Act.dup() },
      { label: 'Kopiuj', key: 'Ctrl+C', ic: 'clipboard', fn: () => Act.copy() },
      { label: 'Wklej w miejscu głowicy', key: 'Ctrl+V', ic: 'clipboard', fn: () => Act.paste(), disabled: !(Act.clip && Act.clip.length) },
      { sep: true },
      c.type === 'video' && { label: 'Odłącz dźwięk', ic: 'music', fn: () => Act.detach() },
      c.type === 'video' && { label: 'Zatrzymaj klatkę', ic: 'freeze', fn: () => Act.freeze() },
      (c.type === 'video' || c.type === 'audio') && { label: c.mute ? 'Włącz dźwięk' : 'Wycisz', ic: c.mute ? 'volume' : 'volumeX', fn: () => { c.mute = !c.mute; commit(); } },
      visual && (c.fx.length || c.filter.id !== 'none' || c.animIn.id !== 'none' || c.animOut.id !== 'none' || c.animLoop.id !== 'none') && { label: 'Usuń efekty, filtr i animacje', ic: 'rotate', fn: () => { c.fx = []; c.filter = { id: 'none', amt: 1 }; c.animIn = { id: 'none', dur: 0.6 }; c.animOut = { id: 'none', dur: 0.6 }; c.animLoop = { id: 'none', amt: 1 }; commit(); } },
      { label: 'Ustaw głowicę na początku klipu', ic: 'skipBack', fn: () => Engine.seek(c.start) },
      { sep: true },
      { label: 'Usuń', key: 'Del', ic: 'trash', danger: true, fn: () => Act.del() },
    ];
  },
  onTimeline(e) {
    e.preventDefault();
    const ce = e.target.closest('.clip');
    if (ce) {
      const c = byId(ce.dataset.id); if (!c) return;
      if (!Act.ids().includes(c.id)) { S.sel = c.id; S.multi = []; Bus.emit('select'); TL.syncSel(); }
      this.show(e.clientX, e.clientY, this.clipItems(c));
    } else if (e.target.closest('.tl-scroll')) {
      const t = TL.timeAt(e.clientX);
      this.show(e.clientX, e.clientY, [
        { label: 'Wklej tutaj', key: 'Ctrl+V', ic: 'clipboard', fn: () => { const k = S.time; S.time = t; Act.paste(); S.time = k; }, disabled: !(Act.clip && Act.clip.length) },
        { label: 'Dodaj znacznik tutaj', key: 'M', ic: 'flag', fn: () => { const k = S.time; S.time = t; Act.marker(); S.time = k; } },
        { label: 'Ustaw głowicę tutaj', ic: 'play', fn: () => Engine.seek(t) },
        { label: 'Zaznacz wszystko', key: 'Ctrl+A', ic: 'layers', fn: () => Act.selectAll() },
      ]);
    }
  },
  onStage(e) {
    e.preventDefault();
    const r = $('#stageHost').getBoundingClientRect(), k = Stage.k(), c = Stage.hit((e.clientX - r.left) / k, (e.clientY - r.top) / k);
    if (!c) return;
    if (!Act.ids().includes(c.id)) { S.sel = c.id; S.multi = []; Bus.emit('select'); TL.syncSel(); }
    this.show(e.clientX, e.clientY, this.clipItems(c));
  },
};
