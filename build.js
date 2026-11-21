'use strict';
/* Składa aplikację: src/* -> dist/index.html (aplikacja / PWA / Electron) oraz dist/artifact.html (wersja do publikacji w Claude).
   Użycie: node build.js */
const fs = require('fs'), path = require('path');
const root = __dirname, src = path.join(root, 'src'), dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'lib', 'mp'), { recursive: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });

const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8');
const js = fs.readdirSync(src).filter((f) => /^\d\d-.*\.js$/.test(f)).sort().map((f) => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const tpl = fs.readFileSync(path.join(src, 'template.html'), 'utf8').replace('<!--STYLE-->', () => css).replace('<!--SCRIPT-->', () => js);

/* wersja artefaktu: sama treść strony (platforma dokłada własny szkielet) */
fs.writeFileSync(path.join(dist, 'artifact.html'), tpl);

/* wersja aplikacji: pełny dokument + manifest + rejestracja service workera */
const head = `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f1117">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<style>html{color-scheme:dark;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0}</style>
</head>
<body>
`;
fs.writeFileSync(path.join(dist, 'index.html'), head + tpl + '\n</body>\n</html>\n');

/* biblioteki */
const nm = path.join(root, 'vendor');
const cp = (a, b) => fs.copyFileSync(a, b);
cp(path.join(nm, 'mp4-muxer.js'), path.join(dist, 'lib', 'mp4-muxer.js'));
cp(path.join(nm, 'webm-muxer.js'), path.join(dist, 'lib', 'webm-muxer.js'));
const models = {};
for (const f of fs.readdirSync(path.join(nm, 'mp'))) {
  if (/\.(tflite|binarypb)$/.test(f)) models[f] = fs.readFileSync(path.join(nm, 'mp', f)).toString('base64');
  else cp(path.join(nm, 'mp', f), path.join(dist, 'lib', 'mp', f));
}
fs.writeFileSync(path.join(dist, 'lib', 'mp', 'models.js'), 'window.__MP_MODELS=' + JSON.stringify(models) + ';\n');
for (const f of ['manifest.webmanifest', 'sw.js']) cp(path.join(root, f), path.join(dist, f));
for (const f of fs.readdirSync(path.join(root, 'icons'))) cp(path.join(root, 'icons', f), path.join(dist, 'icons', f));
const size = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
console.log('dist/index.html', size(path.join(dist, 'index.html')), '| dist/artifact.html', size(path.join(dist, 'artifact.html')));
