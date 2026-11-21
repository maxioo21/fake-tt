'use strict';
/* node electron/serve.js [port]  ->  uruchamia aplikację w przeglądarce pod http://localhost:8080 (można ją tam zainstalować jako PWA) */
const { start } = require('./server');
const port = Number(process.argv[2]) || 8080;
start(port, 'localhost').then(({ port: p }) => console.log(`Kadr Studio działa: http://localhost:${p}  (Ctrl+C aby zatrzymać)`));
