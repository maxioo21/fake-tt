'use strict';
/* Aplikacja desktopowa (Windows / macOS / Linux) – okno Electron z lokalnym serwerem. */
const { app, BrowserWindow, shell, Menu } = require('electron');
const { start } = require('./server');

let server = null;
async function createWindow() {
  const s = await start(0);
  server = s.server;
  const win = new BrowserWindow({
    width: 1480, height: 920, minWidth: 980, minHeight: 640, backgroundColor: '#0f1117', title: 'Kadr Studio',
    autoHideMenuBar: true, icon: require('path').join(__dirname, '..', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, autoplayPolicy: 'no-user-gesture-required' },
  });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  await win.loadURL(`http://127.0.0.1:${s.port}/index.html`);
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (server) server.close(); app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
