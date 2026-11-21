'use strict';
/* Aplikacja desktopowa (Windows / macOS / Linux) – okno Electron z lokalnym serwerem. */
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const { start } = require('./server');

let server = null, origin = '';
const PORT = 47821;   /* stały port = stały adres strony, więc ustawienia (np. klucz AI) przetrwają restart */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

/* zapytania sieciowe z procesu głównego (bez CORS) — tylko dla naszej strony i tylko http/https */
ipcMain.handle('kadr:fetch', async (ev, url, opts = {}) => {
  let from = ''; try { from = new URL(ev.senderFrame.url).origin; } catch (e) { /* nic */ }
  if (!origin || from !== origin) throw new Error('Niedozwolone źródło zapytania');
  const u = new URL(url); if (!/^https?:$/.test(u.protocol)) throw new Error('Niedozwolony protokół');
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), Math.min(Number(opts.timeout) || 60000, 300000));
  try {
    const res = await fetch(url, { method: opts.method || 'GET', headers: opts.headers || {}, body: typeof opts.body === 'string' ? opts.body : undefined, signal: ctl.signal, redirect: 'follow' });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 60e6) throw new Error('Odpowiedź jest za duża');
    const headers = {}; res.headers.forEach((v, k) => { headers[k] = v; });
    return { status: res.status, statusText: res.statusText, headers, body: new Uint8Array(buf) };
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('TIMEOUT');
    throw new Error((e && e.cause && (e.cause.code || e.cause.message)) || (e && e.message) || 'FETCH_FAILED');
  } finally { clearTimeout(tm); }
});
async function createWindow() {
  let s; try { s = await start(PORT); } catch (e) { s = await start(0); }
  server = s.server; origin = `http://127.0.0.1:${s.port}`;
  const win = new BrowserWindow({
    width: 1480, height: 920, minWidth: 980, minHeight: 640, backgroundColor: '#0f1117', title: 'Kadr Studio',
    autoHideMenuBar: true, icon: require('path').join(__dirname, '..', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, autoplayPolicy: 'no-user-gesture-required', preload: require('path').join(__dirname, 'preload.js') },
  });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  await win.loadURL(`http://127.0.0.1:${s.port}/index.html`);
}
if (gotLock) app.whenReady().then(createWindow);
app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.on('window-all-closed', () => { if (server) server.close(); app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
