'use strict';
/* ============================================================
   Kadr Studio — start aplikacji, skróty klawiszowe, przeciąganie plików
   ============================================================ */
const FontLoader = {
  pending: new Set(),
  ensure(family, bold) {
    if (!document.fonts || !document.fonts.check) return true;
    const spec = `${bold ? 700 : 400} 40px "${family}"`;
    let ok = true;
    try { ok = document.fonts.check(spec); } catch (e) { return true; }
    if (!ok && !this.pending.has(spec)) {
      this.pending.add(spec);
      document.fonts.load(spec).then(() => { this.pending.delete(spec); Engine.R && Engine.R.sprites.clear(); Engine.invalidate(); if (S.tab === 'text') UI.renderPanel(true); }).catch(() => {});
    }
    return ok;
  },
};

function confirmDlg(title, text, okLabel, onOk) {
  const m = $('#modal'); m.innerHTML = ''; m.hidden = false;
  const close = () => { m.hidden = true; m.innerHTML = ''; };
  m.append(h('div', { class: 'scrim', onclick: close }), h('div', { class: 'dialog small' },
    h('div', { class: 'dlg-head' }, h('h3', {}, title)), h('div', { class: 'dlg-body' }, h('p', {}, text)),
    h('div', { class: 'dlg-foot' }, F.btn('Anuluj', close, ''), F.btn(okLabel, () => { close(); onOk(); }, 'primary'))));
}

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' && !['range', 'checkbox', 'color'].includes(t.type) || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}

function bindGlobal() {
  window.addEventListener('keydown', (e) => {
    if (!$('#modal').hidden) { if (e.key === 'Escape') Exporter.close(); return; }
    if (isTyping(e)) return;
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (k === ' ') { e.preventDefault(); Engine.toggle(); }
    else if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); }
    else if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); Act.dup(); }
    else if (mod && (k === 'e' || k === 'E')) { e.preventDefault(); Exporter.open(); }
    else if (!mod && (k === 's' || k === 'S')) { Act.split(); }
    else if (!mod && (k === 'm' || k === 'M')) { Act.marker(); }
    else if (k === 'Delete' || k === 'Backspace') { if (S.sel) { e.preventDefault(); Act.del(); } }
    else if (k === 'ArrowLeft') { e.preventDefault(); Engine.seek(S.time - (e.shiftKey ? 1 : 1 / P.fps)); }
    else if (k === 'ArrowRight') { e.preventDefault(); Engine.seek(S.time + (e.shiftKey ? 1 : 1 / P.fps)); }
    else if (k === 'Home') { Engine.seek(0); }
    else if (k === 'End') { Engine.seek(projectDuration()); }
    else if (k === '+' || k === '=') { TL.setZoom(S.zoom * 1.25); }
    else if (k === '-' || k === '_') { TL.setZoom(S.zoom / 1.25); }
    else if (k === 'Escape') { if (S.sel) { S.sel = null; Bus.emit('select'); TL.render(); } }
  });

  /* przeciąganie plików z komputera */
  const ov = $('#dropOv');
  let depth = 0;
  window.addEventListener('dragenter', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { depth++; ov.hidden = false; } });
  window.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) ov.hidden = true; });
  window.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    depth = 0; ov.hidden = true;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); App.addFiles([...e.dataTransfer.files]); }
  });

  /* tryb mobilny */
  const mq = window.matchMedia('(max-width: 900px)');
  const setMobile = () => { if (mq.matches) document.body.dataset.mobile = '1'; else delete document.body.dataset.mobile; Engine.layoutStage(); TL.render(); };
  mq.addEventListener ? mq.addEventListener('change', setMobile) : mq.addListener(setMobile);
  setMobile();

  window.addEventListener('beforeunload', (e) => { if (clips.length && !S.demo && HIST.undo.length) { e.preventDefault(); e.returnValue = ''; } });

  /* instalacja jako aplikacja (PWA) */
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; const b = $('#installBtn'); if (b) b.hidden = false; });
  $('#installBtn').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch (x) { /* ignoruj */ } deferred = null; $('#installBtn').hidden = true; });
  window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; toast('Aplikacja zainstalowana'); });
  try { if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== '') navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* w artefakcie niedostępne */ }
}

function syncTop() {
  $('#projBtn').textContent = P.name || 'Mój film';
  $('#demoChip').hidden = !S.demo;
  const a = $('#aspSel'); if (a && a.value !== P.aspect) a.value = P.aspect;
}

async function boot() {
  UI.init(); TL.init(); Stage.init(); Transport.init();
  $('#expBtn').addEventListener('click', () => Exporter.open());
  $('#newBtn').addEventListener('click', () => confirmDlg('Nowy projekt', 'Obecny projekt zostanie wyczyszczony (biblioteka plików zostaje). Kontynuować?', 'Nowy projekt', () => App.newProject()));
  $('#projBtn').addEventListener('click', () => { S.sel = null; Bus.emit('select'); TL.render(); UI.openTab('inspect'); if (!document.body.dataset.mobile) UI.openTab(S.tab === 'inspect' ? 'media' : S.tab); });
  const asp = $('#aspSel');
  Object.keys(ASPECTS).forEach((k) => asp.append(h('option', { value: k }, k)));
  asp.value = P.aspect;
  asp.addEventListener('change', () => { P.aspect = asp.value; commit(); Engine.setupRenderer(); });
  Bus.on('change', syncTop); Bus.on('project', syncTop);
  Bus.on('change', () => { Engine.invalidate(); Engine.gc(); });
  /* po każdej zmianie struktury pilnujemy rozmiaru podglądu */
  Bus.on('change', () => Engine.setupRenderer());
  Bus.on('project', () => Engine.setupRenderer());
  bindGlobal();
  Engine.setupRenderer(); Engine.start();
  if (document.fonts) { TEXT_FONTS.forEach((f) => document.fonts.load(`700 24px "${f}"`).catch(() => {})); document.fonts.ready.then(() => { if (S.tab === 'text') UI.renderPanel(true); }); }
  await Demo.load();
  syncTop();
  UI.openTab('media');
}
window.addEventListener('DOMContentLoaded', () => { boot().catch((e) => { console.error(e); toast('Błąd uruchomienia: ' + e.message, 'err'); }); });
