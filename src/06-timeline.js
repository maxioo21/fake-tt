'use strict';
/* ============================================================
   Kadr Studio — oś czasu
   ============================================================ */
const TL = {
  LANE_H: { v3: 36, v2: 36, v1: 54, a1: 40, a2: 40 },
  scroll: null, content: null, ruler: null, head: null, lanesBox: null, labels: null, drag: null, lanes: {},

  init() {
    const root = $('#timeline');
    root.innerHTML = '';
    const bar = h('div', { class: 'tl-bar' });
    const tb = (ic, title, fn, id) => h('button', { class: 'tb', title, id, onclick: fn, html: icon(ic, 17) });
    bar.append(
      tb('undo', 'Cofnij (Ctrl+Z)', () => undo(), 'bUndo'),
      tb('redo', 'Ponów (Ctrl+Shift+Z)', () => redo(), 'bRedo'),
      h('span', { class: 'sep' }),
      tb('scissors', 'Podziel w miejscu głowicy (S)', () => Act.split(), 'bSplit'),
      tb('trash', 'Usuń (Del)', () => Act.del(), 'bDel'),
      tb('copy', 'Duplikuj (Ctrl+D)', () => Act.dup(), 'bDup'),
      h('span', { class: 'sep' }),
      tb('music', 'Odłącz dźwięk od wideo', () => Act.detach(), 'bDetach'),
      tb('freeze', 'Zatrzymaj klatkę', () => Act.freeze(), 'bFreeze'),
      tb('flag', 'Dodaj znacznik (M)', () => Act.marker(), 'bMarker'),
      tb('magnet', 'Przyciąganie do krawędzi', () => { S.snap = !S.snap; this.syncBar(); }, 'bSnap'),
      h('span', { class: 'grow' }),
      tb('zoomOut', 'Oddal oś (−)', () => this.setZoom(S.zoom / 1.35)),
      h('input', { type: 'range', id: 'zoomRange', min: '0', max: '100', value: '50', 'aria-label': 'Powiększenie osi czasu', oninput: (e) => this.setZoom(Math.exp(lerp(Math.log(12), Math.log(500), e.target.value / 100)), true) }),
      tb('zoomIn', 'Przybliż oś (+)', () => this.setZoom(S.zoom * 1.35)),
      tb('fit', 'Dopasuj do okna', () => this.fit(), 'bFit'),
    );
    this.labels = h('div', { class: 'tl-labels' });
    this.content = h('div', { class: 'tl-content', id: 'tlContent' });
    this.scroll = h('div', { class: 'tl-scroll', id: 'tlScroll' }, this.content);
    const body = h('div', { class: 'tl-body' }, h('div', { class: 'tl-grid' }, this.labels, this.scroll));
    root.append(bar, body);
    this.ruler = h('div', { class: 'tl-ruler', id: 'tlRuler' });
    this.lanesBox = h('div', { class: 'tl-lanes' });
    this.head = h('div', { class: 'tl-head', id: 'tlHead' }, h('div', { class: 'knob' }));
    this.content.append(this.ruler, this.lanesBox, this.head);
    /* etykiety ścieżek */
    this.labels.append(h('div', { class: 'lbl-ruler' }));
    LANES.forEach((l) => this.labels.append(h('div', { class: 'lbl ' + l.kind, style: `height:${this.LANE_H[l.id]}px`, title: l.label }, h('span', {}, l.label))));
    LANES.forEach((l) => {
      const el = h('div', { class: 'lane ' + l.kind, 'data-lane': l.id, style: `height:${this.LANE_H[l.id]}px` });
      el.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('text/kadr-media')) { e.preventDefault(); el.classList.add('drop'); } });
      el.addEventListener('dragleave', () => el.classList.remove('drop'));
      el.addEventListener('drop', (e) => this.onDrop(e, l));
      this.lanes[l.id] = el; this.lanesBox.append(el);
    });
    /* wskaźnik / przewijanie / przeciąganie */
    this.scroll.addEventListener('pointerdown', (e) => this.onDown(e));
    window.addEventListener('pointermove', (e) => this.onMove(e));
    window.addEventListener('pointerup', (e) => this.onUp(e));
    window.addEventListener('pointercancel', (e) => this.onUp(e));
    this.scroll.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.setZoom(S.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }
      else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) { /* natywne przewijanie poziome */ }
    }, { passive: false });
    Bus.on('change', () => this.render());
    Bus.on('media', () => this.render());
    Bus.on('time', () => this.updateHead());
    Bus.on('project', () => this.render());
    this.setZoom(S.zoom, false, true);
  },

  px(t) { return t * S.zoom; },
  setZoom(z, fromSlider, noRender) {
    const old = S.zoom;
    S.zoom = clamp(z, 12, 500);
    if (!fromSlider) { const r = $('#zoomRange'); if (r) r.value = String(Math.round((Math.log(S.zoom) - Math.log(12)) / (Math.log(500) - Math.log(12)) * 100)); }
    if (!noRender) {
      const cx = S.time * old - this.scroll.scrollLeft;
      this.render();
      this.scroll.scrollLeft = Math.max(0, S.time * S.zoom - cx);
    }
  },
  fit() {
    const dur = Math.max(2, projectDuration());
    this.setZoom((this.scroll.clientWidth - 40) / (dur * 1.05));
    this.scroll.scrollLeft = 0;
  },
  syncBar() {
    const sel = byId(S.sel);
    const set = (id, on) => { const b = $('#' + id); if (b) b.disabled = !on; };
    set('bUndo', HIST.undo.length > 0); set('bRedo', HIST.redo.length > 0);
    set('bSplit', !!sel); set('bDel', !!sel); set('bDup', !!sel);
    set('bDetach', !!sel && sel.type === 'video'); set('bFreeze', !!sel && sel.type === 'video');
    const sn = $('#bSnap'); if (sn) sn.classList.toggle('on', S.snap);
  },

  /* ---------- rysowanie ---------- */
  render() {
    const dur = projectDuration();
    const vw = this.scroll.clientWidth || 600;
    const total = Math.max(dur + Math.max(8, vw / S.zoom * 0.5), vw / S.zoom);
    const W = Math.ceil(total * S.zoom);
    this.content.style.width = W + 'px';
    this.renderRuler(total);
    LANES.forEach((l) => {
      const el = this.lanes[l.id]; el.innerHTML = '';
      el.style.width = W + 'px';
    });
    /* znaczniki */
    P.markers.forEach((mt, i) => {
      const f = h('div', { class: 'marker', style: `left:${this.px(mt)}px`, title: 'Znacznik – kliknij dwukrotnie, aby usunąć', ondblclick: () => { P.markers.splice(i, 1); commit(); } }, h('span', { html: icon('flag', 12) }));
      this.ruler.append(f);
    });
    for (const c of clips) this.lanes[c.lane].append(this.clipEl(c));
    /* przyciski przejść */
    for (const c of clips) {
      if (!isVisual(c) || c.type === 'fx') continue;
      const A = prevAdjacent(c);
      if (!A || A.type === 'fx') continue;
      const has = c.trans && c.trans.id !== 'none';
      const j = h('button', { class: 'junc' + (has ? ' has' : ''), style: `left:${this.px(c.start)}px`, title: has ? 'Przejście: ' + (TRANS[c.trans.id] || {}).name : 'Dodaj przejście', html: icon(has ? 'transition' : 'plus', 13),
        onpointerdown: (e) => e.stopPropagation(),
        onclick: (e) => { e.stopPropagation(); S.sel = c.id; Bus.emit('select'); UI.openTab('trans'); this.render(); } });
      this.lanes[c.lane].append(j);
    }
    this.syncBar();
    this.updateHead();
  },
  renderRuler(total) {
    this.ruler.innerHTML = '';
    const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];
    let step = steps[steps.length - 1];
    for (const s of steps) if (s * S.zoom >= 76) { step = s; break; }
    for (let t = 0; t <= total; t += step) {
      const x = this.px(t);
      const m = Math.floor(t / 60), s = t % 60;
      const label = m ? `${m}:${String(Math.floor(s)).padStart(2, '0')}` : (step < 1 ? s.toFixed(1) : String(Math.floor(s))) + 's';
      this.ruler.append(h('div', { class: 'tick major', style: `left:${x}px` }, h('span', {}, t === 0 ? '0' : label)));
      for (let k = 1; k < 4; k++) { const tt = t + step * k / 4; if (tt <= total) this.ruler.append(h('div', { class: 'tick', style: `left:${this.px(tt)}px` })); }
    }
  },
  clipLabel(c) {
    if (c.type === 'text') return c.text.str.replace(/\n/g, ' ');
    if (c.type === 'sticker') return c.sticker.emoji;
    if (c.type === 'fx') return c.fx.length ? c.fx.map((e) => (FX[e.id] || {}).name).join(' + ') : ((FILTERS[c.filter.id] || {}).name !== 'Brak' ? (FILTERS[c.filter.id] || {}).name : 'Efekt / filtr');
    const m = getMedia(c); return m ? m.name : '';
  },
  clipEl(c) {
    const left = this.px(c.start), w = Math.max(6, this.px(c.dur));
    const sel = c.id === S.sel;
    const el = h('div', { class: `clip ${c.type}${sel ? ' sel' : ''}`, 'data-id': c.id, style: `left:${left}px;width:${w}px` });
    const m = getMedia(c);
    if (c.type === 'video' && m && m.strip) {
      const seg = srcLen(c), bgW = (m.dur / seg) * w;
      el.append(h('div', { class: 'bg', style: `background-image:url(${m.strip});background-size:${bgW}px 100%;background-position:${-(c.inPt / m.dur) * bgW}px 0` }));
    } else if (c.type === 'image' && m) {
      el.append(h('div', { class: 'bg', style: `background-image:url(${m.thumb});background-size:auto 100%;background-repeat:repeat-x` }));
    } else if (c.type === 'audio' || (c.type === 'video' && false)) {
      const cv = h('canvas', { class: 'wave' });
      el.append(cv);
      requestAnimationFrame(() => this.drawWave(cv, c, w));
    }
    const tags = [];
    if (c.speed !== 1) tags.push(c.speed.toFixed(2).replace(/\.?0+$/, '') + '×');
    if (c.mute) tags.push('🔇');
    if (c.fx.length && c.type !== 'fx') tags.push('✦');
    if (c.cut.mode !== 'none') tags.push('✂');
    el.append(h('div', { class: 'lab' }, h('span', { class: 'ico', html: this.typeIcon(c) }), h('span', { class: 't' }, this.clipLabel(c)), tags.length ? h('span', { class: 'tags' }, tags.join(' ')) : null));
    el.append(h('div', { class: 'handle l', 'data-h': 'l' }), h('div', { class: 'handle r', 'data-h': 'r' }));
    return el;
  },
  typeIcon(c) {
    return icon({ video: 'video', image: 'image', audio: 'music', text: 'type', sticker: 'smile', fx: 'sparkles' }[c.type] || 'film', 12);
  },
  drawWave(cv, c, w) {
    const m = getMedia(c); if (!m || !m.peaks) { cv.width = 2; return; }
    const Hh = cv.parentElement ? cv.parentElement.clientHeight || 34 : 34;
    cv.width = Math.min(4096, Math.ceil(w)); cv.height = Hh; cv.style.width = w + 'px';
    const x = cv.getContext('2d'), pk = m.peaks, s0 = c.inPt * 100, per = (srcLen(c) * 100) / cv.width;
    x.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--wave').trim() || '#7fe3b0';
    for (let i = 0; i < cv.width; i++) {
      let mx = 0; const a = Math.floor(s0 + i * per), b = Math.max(a + 1, Math.floor(s0 + (i + 1) * per));
      for (let j = a; j < b && j < pk.length; j++) if (pk[j] > mx) mx = pk[j];
      const hh = Math.max(1, Math.min(1, mx * 1.6) * Hh * 0.9);
      x.fillRect(i, (Hh - hh) / 2, 1, hh);
    }
  },
  updateHead() {
    if (!this.head) return;
    const x = this.px(S.time);
    this.head.style.transform = `translateX(${x}px)`;
    if (S.playing) {
      const sl = this.scroll.scrollLeft, vw = this.scroll.clientWidth;
      if (x > sl + vw * 0.92 || x < sl) this.scroll.scrollLeft = Math.max(0, x - vw * 0.15);
    }
  },

  /* ---------- interakcje ---------- */
  timeAt(clientX) { const r = this.content.getBoundingClientRect(); return Math.max(0, (clientX - r.left) / S.zoom); },
  laneAt(clientY) {
    for (const l of LANES) { const r = this.lanes[l.id].getBoundingClientRect(); if (clientY >= r.top && clientY < r.bottom) return l; }
    return null;
  },
  snapPts(excl) {
    const pts = [0, S.time, ...P.markers];
    clips.forEach((c) => { if (c.id !== excl) pts.push(c.start, clipEnd(c)); });
    return pts;
  },
  snapTo(v, pts, thr) { let b = v, bd = thr; for (const p of pts) { const d = Math.abs(p - v); if (d < bd) { bd = d; b = p; } } return b; },

  onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const clipEl = e.target.closest('.clip');
    if (!clipEl) {
      /* puste miejsce / linijka: przewijanie głowicy */
      if (e.target.closest('.junc') || e.target.closest('.marker')) return;
      const onRuler = !!e.target.closest('.tl-ruler');
      if (!onRuler) { S.sel = null; Bus.emit('select'); this.render(); }
      this.drag = { mode: 'scrub' };
      Engine.seek(this.timeAt(e.clientX));
      e.preventDefault();
      return;
    }
    const c = byId(clipEl.dataset.id); if (!c) return;
    const mode = e.target.dataset.h === 'l' ? 'trimL' : e.target.dataset.h === 'r' ? 'trimR' : 'move';
    if (S.sel !== c.id) { S.sel = c.id; Bus.emit('select'); this.syncSel(); }
    this.drag = { mode, c, id: c.id, el: clipEl, x0: e.clientX, y0: e.clientY, moved: false, o: { start: c.start, dur: c.dur, inPt: c.inPt, lane: c.lane }, lane: c.lane, tmp: null };
    clipEl.setPointerCapture && clipEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  },
  syncSel() {
    $$('.clip', this.content).forEach((el) => el.classList.toggle('sel', el.dataset.id === S.sel));
    this.syncBar();
  },
  onMove(e) {
    const d = this.drag; if (!d) return;
    if (d.mode === 'scrub') {
      const r = this.scroll.getBoundingClientRect();
      if (e.clientX > r.right - 30) this.scroll.scrollLeft += 14; else if (e.clientX < r.left + 30) this.scroll.scrollLeft -= 14;
      Engine.seek(this.timeAt(e.clientX)); return;
    }
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    if (!d.moved) { d.moved = true; d.el.classList.add('dragging'); }
    const c = d.c, o = d.o, dt = dx / S.zoom, thr = 9 / S.zoom, pts = S.snap ? this.snapPts(c.id) : [];
    if (d.mode === 'move') {
      let s = Math.max(0, o.start + dt);
      if (S.snap) {
        const s1 = this.snapTo(s, pts, thr), s2 = this.snapTo(s + o.dur, pts, thr) - o.dur;
        s = Math.abs(s1 - s) <= Math.abs(s2 - s) ? s1 : s2;
        if (Math.abs(s1 - (o.start + dt)) >= thr && Math.abs(s2 - (o.start + dt)) >= thr) s = Math.max(0, o.start + dt);
      }
      let lane = o.lane;
      const la = this.laneAt(e.clientY);
      if (la && la.kind === laneKind(o.lane)) lane = la.id;
      d.lane = lane; d.start = Math.max(0, s);
      d.el.style.left = this.px(d.start) + 'px';
      if (this.lanes[lane] !== d.el.parentElement) this.lanes[lane].append(d.el);
      $$('.lane', this.lanesBox).forEach((l) => l.classList.toggle('drop', l.dataset.lane === lane && lane !== o.lane));
    } else if (d.mode === 'trimL') {
      c.start = o.start; c.dur = o.dur; c.inPt = o.inPt;
      let ns = o.start + dt;
      if (S.snap) ns = this.snapTo(ns, pts, thr);
      const prev = clips.filter((q) => q.lane === c.lane && q.id !== c.id && clipEnd(q) <= o.start + 1e-6).reduce((m, q) => Math.max(m, clipEnd(q)), 0);
      trimLeft(c, Math.max(prev, ns));
      d.el.style.left = this.px(c.start) + 'px'; d.el.style.width = Math.max(6, this.px(c.dur)) + 'px';
      Engine.invalidate();
    } else if (d.mode === 'trimR') {
      c.start = o.start; c.dur = o.dur; c.inPt = o.inPt;
      let ne = o.start + o.dur + dt;
      if (S.snap) ne = this.snapTo(ne, pts, thr);
      const next = clips.filter((q) => q.lane === c.lane && q.id !== c.id && q.start >= clipEnd({ start: o.start, dur: o.dur }) - 1e-6).reduce((m, q) => Math.min(m, q.start), Infinity);
      trimRight(c, Math.min(next, ne));
      d.el.style.width = Math.max(6, this.px(c.dur)) + 'px';
      Engine.invalidate();
    }
  },
  onUp() {
    const d = this.drag; if (!d) return;
    this.drag = null;
    if (d.mode === 'scrub') return;
    $$('.lane', this.lanesBox).forEach((l) => l.classList.remove('drop'));
    if (d.el) d.el.classList.remove('dragging');
    const c = d.c;
    if (d.moved) {
      if (d.mode === 'move') {
        c.start = resolveStart(c, d.lane, d.start); c.lane = d.lane;
      } else if (d.mode === 'trimL' || d.mode === 'trimR') {
        if (c.type === 'video' || c.type === 'audio') { c.dur = Math.max(0.1, c.dur); }
      }
      commit();
    } else this.render();
  },
  onDrop(e, l) {
    e.preventDefault();
    this.lanes[l.id].classList.remove('drop');
    const id = e.dataTransfer.getData('text/kadr-media'); const m = media.get(id); if (!m) return;
    let lane = l.id;
    if (m.kind === 'audio' && l.kind !== 'a') lane = 'a1';
    if (m.kind !== 'audio' && l.kind !== 'v') lane = 'v1';
    addMediaClip(m, { lane, start: this.timeAt(e.clientX) });
    commit(); Engine.setupRenderer();
  },
};

/* ============================================================
   Akcje na klipach (używane przez przyciski, skróty i panele)
   ============================================================ */
const Act = {
  sel() { return byId(S.sel); },
  split() {
    const c = this.sel(); const t = S.time;
    let target = c && t > c.start + 0.05 && t < clipEnd(c) - 0.05 ? c : null;
    if (!target) { /* podziel klip pod głowicą na głównej ścieżce */
      target = clips.find((q) => q.lane === (c ? c.lane : 'v1') && t > q.start + 0.05 && t < clipEnd(q) - 0.05) || clips.find((q) => t > q.start + 0.05 && t < clipEnd(q) - 0.05);
    }
    if (!target) { toast('Ustaw głowicę wewnątrz klipu, aby go podzielić'); return; }
    const b = splitClip(target, t);
    if (b) { S.sel = b.id; commit(); }
  },
  del() { const c = this.sel(); if (!c) return; removeClip(c.id); commit(); },
  dup() { const c = this.sel(); if (!c) return; duplicateClip(c); commit(); },
  marker() {
    const t = Math.round(S.time * 100) / 100;
    const i = P.markers.findIndex((m) => Math.abs(m - t) < 0.05);
    if (i >= 0) P.markers.splice(i, 1); else P.markers.push(t);
    P.markers.sort((a, b) => a - b); commit();
  },
  detach() {
    const c = this.sel();
    if (!c || c.type !== 'video') { toast('Zaznacz klip wideo'); return; }
    const m = getMedia(c);
    if (m && m.hasAudio === false) { toast('To wideo nie ma ścieżki dźwiękowej'); return; }
    const lane = laneFreeAt('a1', c.start, c.dur) ? 'a1' : 'a2';
    const a = newClip('audio', { lane, start: c.start, dur: c.dur, inPt: c.inPt, speed: c.speed, media: c.media, vol: c.vol });
    c.mute = true; clips.push(a); S.sel = a.id; commit();
    toast('Dźwięk odłączony do osobnej ścieżki');
  },
  async freeze() {
    const c = this.sel(); const t = S.time;
    if (!c || c.type !== 'video') { toast('Zaznacz klip wideo'); return; }
    if (t <= c.start + 0.05 || t >= clipEnd(c) - 0.05) { toast('Ustaw głowicę wewnątrz klipu na klatce, którą chcesz zatrzymać'); return; }
    Engine.R.render(t);
    const s = Engine.provider.get(c, t);
    if (!s) { toast('Klatka jest jeszcze niedostępna, spróbuj za chwilę', 'err'); return; }
    const cv = mkCanvas(s.w, s.h); cv.getContext('2d').drawImage(s.el, 0, 0, s.w, s.h);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const m = await importFile(new File([blob], 'Zatrzymana klatka.png', { type: 'image/png' }), { gen: true });
    if (!m) return;
    const b = splitClip(c, t); const FZ = 2;
    clips.forEach((o) => { if (o.lane === c.lane && o.start >= t - 0.001) o.start += FZ; });
    const f = newClip('image', { lane: c.lane, media: m.id, start: t, dur: FZ, x: c.x, y: c.y, scale: c.scale, rot: c.rot, opacity: c.opacity, flipX: c.flipX, flipY: c.flipY, adj: clone(c.adj), filter: clone(c.filter) });
    clips.push(f); S.sel = f.id; commit();
    toast('Klatka zatrzymana na 2 s');
  },
};
