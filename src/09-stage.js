'use strict';
/* ============================================================
   Kadr Studio — podgląd: zaznaczanie, przesuwanie, skalowanie, obrót
   ============================================================ */
const Stage = {
  box: null, drag: null,
  init() {
    const host = $('#stageHost');
    this.box = h('div', { class: 'sbox', hidden: true },
      h('i', { class: 'hd c1', 'data-hd': 's' }), h('i', { class: 'hd c2', 'data-hd': 's' }), h('i', { class: 'hd c3', 'data-hd': 's' }), h('i', { class: 'hd c4', 'data-hd': 's' }),
      h('i', { class: 'hd rot', 'data-hd': 'r' }), h('i', { class: 'stem' }));
    host.append(this.box);
    host.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', () => this.up());
    window.addEventListener('pointercancel', () => this.up());
    ['select', 'change', 'time', 'stage-layout', 'project'].forEach((ev) => Bus.on(ev, () => this.update()));
  },
  k() { const host = $('#stageHost'); return Engine.R ? host.clientWidth / Engine.R.W : 1; },
  update() {
    const c = byId(S.sel), R = Engine.R;
    if (!c || !R || c.type === 'audio' || c.type === 'fx' || S.time < c.start - 0.001 || S.time > clipEnd(c) + 0.001) { this.box.hidden = true; return; }
    const b = R.clipBox(c);
    if (!b) { this.box.hidden = true; return; }
    const k = this.k();
    this.box.hidden = false;
    Object.assign(this.box.style, { left: b.cx * k + 'px', top: b.cy * k + 'px', width: b.w * k + 'px', height: b.h * k + 'px', transform: `translate(-50%,-50%) rotate(${c.rot}deg)` });
  },
  hit(px, py) {
    const R = Engine.R, list = R.drawnClips(S.time).filter((c) => c.type !== 'fx').reverse();
    for (const c of list) {
      const b = R.clipBox(c); if (!b) continue;
      const dx = px - b.cx, dy = py - b.cy, cs = Math.cos(-b.rot), sn = Math.sin(-b.rot);
      const lx = dx * cs - dy * sn, ly = dx * sn + dy * cs;
      if (Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2) return c;
    }
    return null;
  },
  down(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (S.picker) { Tools.pickColor(e.clientX, e.clientY); e.preventDefault(); return; }
    const R = Engine.R; if (!R) return;
    const hd = e.target.dataset && e.target.dataset.hd;
    const host = $('#stageHost'), r = host.getBoundingClientRect(), k = this.k();
    let c = byId(S.sel), mode = null;
    if (hd && c) mode = hd === 'r' ? 'rot' : 'scale';
    else {
      const px = (e.clientX - r.left) / k, py = (e.clientY - r.top) / k;
      const hitc = this.hit(px, py);
      if (hitc) { c = hitc; mode = 'move'; if (S.sel !== c.id) { S.sel = c.id; Bus.emit('select'); TL.syncSel(); } }
      else { if (S.sel) { S.sel = null; Bus.emit('select'); TL.render(); } return; }
    }
    const b = R.clipBox(c);
    this.drag = { mode, c, sx: e.clientX, sy: e.clientY, o: { x: c.x, y: c.y, scale: c.scale, rot: c.rot }, ccx: r.left + b.cx * k, ccy: r.top + b.cy * k, moved: false };
    e.preventDefault();
  },
  move(e) {
    const d = this.drag; if (!d) return;
    const host = $('#stageHost'), c = d.c;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    d.moved = true;
    if (d.mode === 'move') {
      let nx = d.o.x + dx / host.clientWidth, ny = d.o.y + dy / host.clientHeight;
      if (Math.abs(nx) < 0.012) nx = 0; if (Math.abs(ny) < 0.012) ny = 0;
      c.x = nx; c.y = ny;
    } else if (d.mode === 'scale') {
      const d0 = Math.hypot(d.sx - d.ccx, d.sy - d.ccy) || 1, d1 = Math.hypot(e.clientX - d.ccx, e.clientY - d.ccy);
      c.scale = clamp(d.o.scale * d1 / d0, 0.05, 8);
    } else if (d.mode === 'rot') {
      const a0 = Math.atan2(d.sy - d.ccy, d.sx - d.ccx), a1 = Math.atan2(e.clientY - d.ccy, e.clientX - d.ccx);
      let rot = d.o.rot + (a1 - a0) * 180 / Math.PI;
      rot = ((rot + 180) % 360 + 360) % 360 - 180;
      const snap = Math.round(rot / 45) * 45; if (Math.abs(rot - snap) < 3) rot = snap;
      c.rot = rot;
    }
    Engine.invalidate(); this.update();
  },
  up() {
    const d = this.drag; if (!d) return;
    this.drag = null;
    if (d.moved) commit();
  },
};

/* ---------- sterowanie odtwarzaniem pod podglądem ---------- */
const Transport = {
  init() {
    $('#bBack').innerHTML = icon('skipBack', 18); $('#bFwd').innerHTML = icon('skipFwd', 18); $('#bFull').innerHTML = icon('fit', 18);
    $('#bFrameL').innerHTML = icon('chevRight', 18).replace('<svg', '<svg style="transform:scaleX(-1)"'); $('#bFrameR').innerHTML = icon('chevRight', 18);
    $('#bPlay').addEventListener('click', () => Engine.toggle());
    $('#bBack').addEventListener('click', () => { S.stopAt = null; Engine.seek(0); });
    $('#bFwd').addEventListener('click', () => { S.stopAt = null; Engine.seek(projectDuration()); });
    $('#bFrameL').addEventListener('click', () => Engine.seek(S.time - 1 / P.fps));
    $('#bFrameR').addEventListener('click', () => Engine.seek(S.time + 1 / P.fps));
    $('#bFull').addEventListener('click', () => {
      const el = $('#stageBox');
      try { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Pełny ekran jest niedostępny w tym widoku')); else toast('Pełny ekran jest niedostępny'); } catch (e) { toast('Pełny ekran jest niedostępny'); }
    });
    Bus.on('time', () => this.update()); Bus.on('transport', () => this.update()); Bus.on('change', () => this.update());
    this.update();
  },
  update() {
    $('#timeNow').textContent = fmtTime(S.time, false);
    $('#timeTotal').textContent = fmtTime(projectDuration(), false);
    $('#bPlay').innerHTML = icon(S.playing ? 'pause' : 'play', 22);
    $('#bPlay').title = S.playing ? 'Pauza (spacja)' : 'Odtwórz (spacja)';
  },
};
