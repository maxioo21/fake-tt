'use strict';
/* Most między stroną a aplikacją desktopową: zapytania do AI idą przez proces główny, więc nie blokuje ich CORS. */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kadrNative', {
  desktop: true,
  fetch: (url, opts) => ipcRenderer.invoke('kadr:fetch', String(url), opts || {}),
});
