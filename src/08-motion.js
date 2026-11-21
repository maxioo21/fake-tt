'use strict';
/* ============================================================
   Kadr Motion — grafika ruchoma z opisu: odliczanie, liczniki, stopery, paski ładowania, tytuły,
   wykresy, cząsteczki i dowolne kompozycje z warstw. Wartości mogą być wyrażeniami zależnymi od czasu,
   więc opis (lokalny planer albo dowolne AI) może zbudować niemal każdą animację 2D.
   Wyrażenia wykonuje własny, bezpieczny kalkulator — to nie jest uruchamianie obcego kodu.
   ============================================================ */
const Motion = (() => {
  const PI = Math.PI, MX = Math.max, MN = Math.min, cl = (x, a, b) => MX(a, MN(b, x));
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const ease = (k) => { k = cl(k, 0, 1); return k * k * (3 - 2 * k); };
  const FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, round: Math.round, sqrt: Math.sqrt, pow: Math.pow, exp: Math.exp, log: Math.log, atan2: Math.atan2, atan: Math.atan, hypot: Math.hypot, sign: Math.sign,
    lerp: (a, b, k) => a + (b - a) * k, clamp: cl, map: (v, a, b, c, d) => c + (d - c) * ((v - a) / ((b - a) || 1)), step: (a, t) => (t >= a ? 1 : 0), mod: (a, b) => ((a % b) + b) % b, fract: (v) => v - Math.floor(v),
    ease, easeIn: (k) => cl(k, 0, 1) ** 3, easeOut: (k) => 1 - (1 - cl(k, 0, 1)) ** 3, easeInOut: (k) => { k = cl(k, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; },
    easeOutBack: (k) => { k = cl(k, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; },
    easeOutBounce: (k) => { k = cl(k, 0, 1); const n1 = 7.5625, d1 = 2.75; if (k < 1 / d1) return n1 * k * k; if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75; if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375; return n1 * (k -= 2.625 / d1) * k + 0.984375; },
    easeOutElastic: (k) => { k = cl(k, 0, 1); return k === 0 ? 0 : k === 1 ? 1 : 2 ** (-10 * k) * Math.sin((k * 10 - 0.75) * (2 * PI / 3)) + 1; },
    rand: (s) => hash(s * 1.37 + 7.1), noise: (x) => { const i = Math.floor(x), f = x - i, a = hash(i), b = hash(i + 1); return a + (b - a) * f * f * (3 - 2 * f); },
    pad: (n, l) => String(Math.round(n)).padStart(l, '0'), fmt: (n) => Math.round(n).toLocaleString('pl-PL'), pct: (v) => Math.round(v * 100) + '%',
    time: (s) => { s = MX(0, s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0'); },
    timecc: (s) => { s = MX(0, s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0') + '.' + String(Math.floor((s % 1) * 100)).padStart(2, '0'); },
    typed: (str, k) => String(str).slice(0, Math.floor(cl(k, 0, 1) * String(str).length + 0.0001)), upper: (s) => String(s).toUpperCase(), lower: (s) => String(s).toLowerCase(), len: (s) => String(s).length,
    hsl: (h, s, l, a) => `hsla(${((h % 360) + 360) % 360},${cl(s, 0, 100)}%,${cl(l, 0, 100)}%,${a == null ? 1 : cl(a, 0, 1)})`, rgb: (r, g, b, a) => `rgba(${cl(r, 0, 255) | 0},${cl(g, 0, 255) | 0},${cl(b, 0, 255) | 0},${a == null ? 1 : cl(a, 0, 1)})`, mix: (a, b, k) => a + (b - a) * k, pingpong: (v) => 1 - Math.abs((v % 2) - 1),
  };
  const CONST = { pi: PI, tau: 2 * PI, e: Math.E };
  /* --- parser wyrażeń (bez dostępu do niczego poza zmiennymi i funkcjami z listy) --- */
  const CACHE = new Map();
  function tokenize(src) {
    const out = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) { let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++; out.push({ t: 'n', v: parseFloat(src.slice(i, j)) }); i = j; continue; }
      if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++; out.push({ t: 'i', v: src.slice(i, j) }); i = j; continue; }
      if (c === '"' || c === "'") { let j = i + 1; while (j < src.length && src[j] !== c) j++; out.push({ t: 's', v: src.slice(i + 1, j) }); i = j + 1; continue; }
      const two = src.slice(i, i + 2);
      if (['**', '<=', '>=', '==', '!=', '&&', '||'].includes(two)) { out.push({ t: 'o', v: two }); i += 2; continue; }
      if ('+-*/%^<>!?:,()'.includes(c)) { out.push({ t: 'o', v: c }); i++; continue; }
      throw new Error('nieznany znak „' + c + '” w wyrażeniu');
    }
    return out;
  }
  function compile(src) {
    let c = CACHE.get(src); if (c) return c;
    const tk = tokenize(src); let p = 0; const peek = () => tk[p], next = () => tk[p++], isOp = (v) => tk[p] && tk[p].t === 'o' && tk[p].v === v;
    const PREC = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };
    const bin = (op, a, b) => {
      switch (op) {
        case '+': return (e) => { const x = a(e), y = b(e); return typeof x === 'string' || typeof y === 'string' ? String(x) + String(y) : x + y; };
        case '-': return (e) => a(e) - b(e); case '*': return (e) => a(e) * b(e); case '/': return (e) => { const d = b(e); return d === 0 ? 0 : a(e) / d; }; case '%': return (e) => { const d = b(e); return d === 0 ? 0 : ((a(e) % d) + d) % d; };
        case '<': return (e) => (a(e) < b(e) ? 1 : 0); case '>': return (e) => (a(e) > b(e) ? 1 : 0); case '<=': return (e) => (a(e) <= b(e) ? 1 : 0); case '>=': return (e) => (a(e) >= b(e) ? 1 : 0);
        case '==': return (e) => (a(e) === b(e) ? 1 : 0); case '!=': return (e) => (a(e) !== b(e) ? 1 : 0); case '&&': return (e) => (a(e) && b(e) ? 1 : 0); case '||': return (e) => (a(e) || b(e) ? 1 : 0);
        default: throw new Error('operator ' + op);
      }
    };
    function parseTernary() { const cnd = parseBin(1); if (isOp('?')) { next(); const a = parseTernary(); if (!isOp(':')) throw new Error('brakuje „:”'); next(); const b = parseTernary(); return (e) => (cnd(e) ? a(e) : b(e)); } return cnd; }
    function parseBin(min) { let left = parsePow(); while (peek() && peek().t === 'o' && PREC[peek().v] >= min) { const op = next().v, right = parseBin(PREC[op] + 1); left = bin(op, left, right); } return left; }
    function parsePow() { const base = parseUnary(); if (isOp('**') || isOp('^')) { next(); const ex = parsePow(); return (e) => base(e) ** ex(e); } return base; }
    function parseUnary() { if (isOp('-')) { next(); const v = parseUnary(); return (e) => -v(e); } if (isOp('+')) { next(); return parseUnary(); } if (isOp('!')) { next(); const v = parseUnary(); return (e) => (v(e) ? 0 : 1); } return parsePrimary(); }
    function parsePrimary() {
      const t = next(); if (!t) throw new Error('niedokończone wyrażenie');
      if (t.t === 'n') return () => t.v; if (t.t === 's') return () => t.v;
      if (t.t === 'o' && t.v === '(') { const v = parseTernary(); if (!isOp(')')) throw new Error('brakuje „)”'); next(); return v; }
      if (t.t === 'i') {
        if (isOp('(')) { next(); const args = []; if (!isOp(')')) { do { args.push(parseTernary()); } while (isOp(',') && next()); } if (!isOp(')')) throw new Error('brakuje „)”'); next(); const f = FN[t.v]; if (!f) throw new Error('nieznana funkcja ' + t.v); return (e) => { const r = f(...args.map((a) => a(e))); return typeof r === 'number' && !isFinite(r) ? 0 : r; }; }
        const name = t.v; return (e) => (name in e ? e[name] : name in CONST ? CONST[name] : 0);
      }
      throw new Error('nieoczekiwane „' + t.v + '”');
    }
    const fn = parseTernary(); if (p < tk.length) throw new Error('nadmiar znaków w wyrażeniu');
    CACHE.set(src, fn); if (CACHE.size > 800) CACHE.clear(); return fn;
  }
  const evalExpr = (src, env, def) => { try { const v = compile(String(src))(env); return v == null ? def : v; } catch (e) { return def; } };
  /* tekst z wstawkami {wyrażenie} */
  function tmpl(str, env) { return String(str).replace(/\{([^{}]+)\}/g, (_, ex) => { const v = evalExpr(ex, env, ''); return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)) : String(v); }); }

  const fontsOK = new Set();
  const FONTS = ['Anton', 'Bebas Neue', 'Montserrat', 'Poppins', 'Orbitron', 'Righteous', 'Bangers', 'Space Grotesk', 'Playfair Display', 'Luckiest Guy', 'Fredoka', 'Oswald', 'Archivo Black', 'Manrope'];
  function loadFont(f) { if (!f || fontsOK.has(f) || !document.fonts || !document.fonts.load) return Promise.resolve(); fontsOK.add(f); return document.fonts.load(`800 40px "${f}"`).catch(() => {}); }
  const preload = (sc) => Promise.all([...new Set((sc.layers || []).map((l) => l.font).filter(Boolean))].map(loadFont));

  const num = (L, k, env, d) => { const v = L[k]; if (v == null) return d; if (typeof v === 'number') return v; const r = evalExpr(v, env, d); return typeof r === 'number' ? r : d; };
  const colorOf = (v, env, d) => { if (v == null) return d; v = String(v); return v[0] === '=' ? String(evalExpr(v.slice(1), env, d)) : v; };
  function drawBg(x, W, H, sc, t, env) {
    const bg = sc.bg || {};
    if (bg.type === 'solid' || !bg.colors) { x.fillStyle = bg.color || (bg.colors && bg.colors[0]) || '#0b1020'; x.fillRect(0, 0, W, H); }
    else {
      const a = ((bg.angle == null ? 90 : bg.angle) + (bg.spin ? t * bg.spin : 0)) * PI / 180, cx = W / 2, cy = H / 2, r = Math.hypot(W, H) / 2, g = x.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      bg.colors.forEach((c, i) => g.addColorStop(bg.colors.length === 1 ? 0 : i / (bg.colors.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    (sc.bgfx || []).forEach((f, fi) => {
      const col = f.color || 'rgba(255,255,255,.5)', n = f.count || 60; x.save();
      if (f.type === 'stars') for (let i = 0; i < n; i++) { x.globalAlpha = 0.25 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1 + hash(i) * 2) + i)); x.fillStyle = col; const s = 1 + hash(i + 9) * 2.5; x.fillRect(hash(i + fi) * W, hash(i + 40 + fi) * H, s, s); }
      else if (f.type === 'bokeh') for (let i = 0; i < n; i++) { const k = hash(i + fi * 7), px = (hash(i + 3) * W + t * (10 + k * 30)) % W, py = (hash(i + 50) * H - t * (8 + k * 20) + H * 4) % H, r = H * (0.015 + 0.05 * k); x.globalAlpha = 0.08 + 0.2 * hash(i + 90); x.fillStyle = f.colors ? f.colors[i % f.colors.length] : col; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
      else if (f.type === 'rays') { const cx = W / 2, cy = H / 2, m = f.count || 14; x.globalAlpha = f.alpha == null ? 0.12 : f.alpha; x.fillStyle = col; for (let i = 0; i < m; i++) { const a = t * (f.speed == null ? 0.15 : f.speed) + i * 2 * PI / m, w = PI / m * 0.55; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a - w) * W * 1.5, cy + Math.sin(a - w) * W * 1.5); x.lineTo(cx + Math.cos(a + w) * W * 1.5, cy + Math.sin(a + w) * W * 1.5); x.closePath(); x.fill(); } }
      else if (f.type === 'grid') { x.strokeStyle = col; x.globalAlpha = f.alpha == null ? 0.35 : f.alpha; x.lineWidth = 1.5; const hz = H * 0.5; for (let i = -12; i <= 12; i++) { x.beginPath(); x.moveTo(W / 2 + i * W * 0.02, hz); x.lineTo(W / 2 + i * W * 0.2, H); x.stroke(); } for (let i = 0; i < 10; i++) { const k = ((i + (t * 0.6) % 1) / 10), y = hz + (H - hz) * k * k; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } }
      else if (f.type === 'vignette') { const g = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f.alpha == null ? 0.6 : f.alpha})`); x.fillStyle = g; x.fillRect(0, 0, W, H); }
      x.restore();
    });
  }
  function star(x, r, n, inner) { x.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * inner : r, a = -PI / 2 + i * PI / n; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); }
  function drawLayer(x, W, H, L, env, t) {
    const at = L.at || 0, dur = L.dur == null ? MX(0.01, env.dur - at) : MX(0.01, L.dur);
    if (t < at - 1e-6 || t > at + dur + 1e-6) return;
    env.lt = t - at; env.lu = cl(env.lt / dur, 0, 1); env.ld = dur;
    if (L.vars) for (const k in L.vars) env[k] = typeof L.vars[k] === 'number' ? L.vars[k] : evalExpr(L.vars[k], env, 0);
    const copies = cl(Math.round(num(L, 'copies', env, 1)), 1, 300);
    for (let i = 0; i < copies; i++) {
      env.i = i; env.n = copies; env.f = copies > 1 ? i / (copies - 1) : 0;
      const op = cl(num(L, 'opacity', env, 1), 0, 1); if (op <= 0.002) continue;
      x.save(); x.globalAlpha = op; if (L.blend) x.globalCompositeOperation = L.blend;
      const px = num(L, 'x', env, 0.5) * W, py = num(L, 'y', env, 0.5) * H, rot = num(L, 'rot', env, 0) * PI / 180, sc = num(L, 'scale', env, 1);
      x.translate(px, py); x.rotate(rot); x.scale(sc * (num(L, 'sx', env, 1)), sc * (num(L, 'sy', env, 1)));
      const col = colorOf(L.color, env, '#ffffff');
      if (L.shadow) { x.shadowColor = colorOf(L.shadow.color, env, col); x.shadowBlur = num(L.shadow, 'blur', env, 0.03) * H; x.shadowOffsetX = num(L.shadow, 'dx', env, 0) * H; x.shadowOffsetY = num(L.shadow, 'dy', env, 0) * H; }
      switch (L.type) {
        case 'text': {
          const px2 = MX(1, num(L, 'size', env, 0.1) * H), txt = tmpl(L.text == null ? '' : L.text, env);
          x.font = `${L.italic ? 'italic ' : ''}${L.weight || 800} ${px2}px "${L.font || 'Anton'}", "Arial Black", sans-serif`; x.textAlign = L.align || 'center'; x.textBaseline = 'middle'; try { if (L.spacing) x.letterSpacing = (num(L, 'spacing', env, 0) * px2) + 'px'; } catch (e) { /* ok */ }
          const lines = txt.split('\n'), lh = px2 * (L.lineHeight || 1.12), y0 = -(lines.length - 1) * lh / 2;
          const g = num(L, 'glow', env, 0);
          lines.forEach((ln, k) => {
            if (g > 0) { x.save(); x.shadowColor = colorOf(L.glowColor, env, col); x.shadowBlur = g * px2; x.fillStyle = col; x.fillText(ln, 0, y0 + k * lh); x.fillText(ln, 0, y0 + k * lh); x.restore(); }
            if (L.stroke) { x.lineJoin = 'round'; x.lineWidth = MX(1, num(L.stroke, 'w', env, 0.05) * px2); x.strokeStyle = colorOf(L.stroke.color, env, '#000'); x.strokeText(ln, 0, y0 + k * lh); }
            x.fillStyle = col; x.fillText(ln, 0, y0 + k * lh);
          }); break;
        }
        case 'rect': { const w = num(L, 'w', env, 0.3) * W, hh = num(L, 'h', env, 0.2) * H, r = num(L, 'radius', env, 0) * MN(w, hh); if (L.color2) { const g = x.createLinearGradient(0, -hh / 2, 0, hh / 2); g.addColorStop(0, col); g.addColorStop(1, colorOf(L.color2, env, col)); x.fillStyle = g; } else x.fillStyle = col; x.beginPath(); if (x.roundRect) x.roundRect(-w / 2, -hh / 2, w, hh, r); else x.rect(-w / 2, -hh / 2, w, hh); x.fill(); if (L.stroke) { x.lineWidth = num(L.stroke, 'w', env, 0.005) * H; x.strokeStyle = colorOf(L.stroke.color, env, '#fff'); x.stroke(); } break; }
        case 'circle': { const r = MX(0, num(L, 'r', env, 0.1)) * H; x.beginPath(); x.arc(0, 0, r, 0, 7); if (L.fill !== false) { x.fillStyle = col; x.fill(); } if (L.stroke) { x.lineWidth = num(L.stroke, 'w', env, 0.005) * H; x.strokeStyle = colorOf(L.stroke.color, env, '#fff'); x.stroke(); } break; }
        case 'line': { x.lineCap = 'round'; x.lineWidth = MX(1, num(L, 'width', env, 0.01) * H); x.strokeStyle = col; x.beginPath(); x.moveTo(0, 0); x.lineTo((num(L, 'x2', env, 0.6) - num(L, 'x', env, 0.5)) * W, (num(L, 'y2', env, 0.5) - num(L, 'y', env, 0.5)) * H); x.stroke(); break; }
        case 'ring': { const r = num(L, 'r', env, 0.2) * H, wd = num(L, 'width', env, 0.03) * H, v = cl(num(L, 'value', env, 1), 0, 1); x.lineWidth = wd; x.lineCap = 'round'; if (L.trackColor) { x.strokeStyle = colorOf(L.trackColor, env, 'rgba(255,255,255,.15)'); x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); } x.strokeStyle = col; x.beginPath(); x.arc(0, 0, r, -PI / 2, -PI / 2 + v * 2 * PI); x.stroke(); break; }
        case 'bar': { const w = num(L, 'w', env, 0.6) * W, hh = num(L, 'h', env, 0.04) * H, v = cl(num(L, 'value', env, 1), 0, 1), r = num(L, 'radius', env, 0.5) * hh; const rr = (xx, ww, c) => { x.fillStyle = c; x.beginPath(); if (x.roundRect) x.roundRect(xx, -hh / 2, MX(0, ww), hh, r); else x.rect(xx, -hh / 2, MX(0, ww), hh); x.fill(); }; rr(-w / 2, w, colorOf(L.trackColor, env, 'rgba(255,255,255,.18)')); if (v > 0.002) rr(-w / 2, w * v, col); break; }
        case 'emoji': { x.font = `${MX(1, num(L, 'size', env, 0.1) * H)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(tmpl(L.char || '⭐', env), 0, 0); break; }
        case 'poly': { const pts = L.points || []; if (pts.length < 2) break; x.beginPath(); pts.forEach((q, k) => { const a = typeof q[0] === 'number' ? q[0] : evalExpr(q[0], env, 0), b = typeof q[1] === 'number' ? q[1] : evalExpr(q[1], env, 0); k ? x.lineTo(a * H, b * H) : x.moveTo(a * H, b * H); }); if (L.closed !== false) x.closePath(); if (L.fill !== false) { x.fillStyle = col; x.fill(); } if (L.stroke) { x.lineWidth = num(L.stroke, 'w', env, 0.005) * H; x.strokeStyle = colorOf(L.stroke.color, env, '#fff'); x.stroke(); } break; }
        case 'particles': {
          const m = cl(Math.round(num(L, 'count', env, 60)), 1, 400), life = MX(0.2, num(L, 'life', env, 2)), sp = num(L, 'speed', env, 0.3), gr = num(L, 'gravity', env, 0.2), size = num(L, 'size', env, 0.012) * H, cols = Array.isArray(L.colors) ? L.colors : [col], dir = L.direction || 'up', shape = L.shape || 'circle', sd = L.seed || 1;
          x.restore(); x.save(); if (L.blend) x.globalCompositeOperation = L.blend;
          for (let k = 0; k < m; k++) {
            const ph = ((env.lt / life) + hash(k * 3.1 + sd)) % 1, age = ph * life, a0 = hash(k + sd * 7) * 2 * PI, v = sp * (0.4 + hash(k + 11 + sd)) * H;
            let vx, vy, ox = num(L, 'x', env, 0.5) * W + (hash(k + 5 + sd) - 0.5) * (L.spreadX == null ? 0 : L.spreadX) * W, oy = num(L, 'y', env, 0.5) * H + (hash(k + 8 + sd) - 0.5) * (L.spreadY == null ? 0 : L.spreadY) * H;
            if (dir === 'down') { vx = Math.cos(a0) * v * 0.2; vy = v; } else if (dir === 'up') { vx = Math.cos(a0) * v * 0.3; vy = -v; } else if (dir === 'burst') { vx = Math.cos(a0) * v; vy = Math.sin(a0) * v; } else { vx = Math.cos(a0) * v; vy = Math.sin(a0) * v; }
            const qx = ox + vx * age, qy = oy + vy * age + 0.5 * gr * H * age * age; x.globalAlpha = op * Math.sin(PI * ph); x.fillStyle = cols[k % cols.length];
            x.save(); x.translate(qx, qy); x.rotate(a0 + age * 3);
            if (shape === 'square') x.fillRect(-size, -size / 2, size * 2, size); else if (shape === 'star') { star(x, size * 1.4, 5, 0.45); x.fill(); } else { x.beginPath(); x.arc(0, 0, size, 0, 7); x.fill(); }
            x.restore();
          }
          break;
        }
        default: break;
      }
      x.restore();
    }
  }
  function draw(x, W, H, sc, t) {
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.shadowBlur = 0;
    const env = { t, u: cl(t / MX(0.01, sc.dur), 0, 1), dur: sc.dur, W, H, lt: t, lu: 0, i: 0, n: 1, f: 0 };
    drawBg(x, W, H, sc, t, env);
    (sc.layers || []).forEach((L) => { try { if (L.font) loadFont(L.font); drawLayer(x, W, H, L, env, t); } catch (e) { /* warstwa pominięta */ } });
    x.restore();
  }
  /* ---------- sanityzacja scen z zewnętrznego AI ---------- */
  const TYPES = ['text', 'rect', 'circle', 'line', 'ring', 'bar', 'emoji', 'poly', 'particles'];
  function sanitize(o) {
    if (!o || typeof o !== 'object') return null;
    const sc = { v: 1, kind: 'motion', dur: cl(+o.dur || 4, 0.5, 180), prompt: String(o.prompt || '').slice(0, 800), bg: { type: 'gradient', colors: ['#14102e', '#3a1c71'], angle: 90 }, bgfx: [], layers: [] };
    if (o.bg && typeof o.bg === 'object') { if (Array.isArray(o.bg.colors) && o.bg.colors.length) sc.bg = { type: o.bg.type === 'solid' ? 'solid' : 'gradient', colors: o.bg.colors.slice(0, 5).map(String), color: o.bg.color ? String(o.bg.color) : undefined, angle: +o.bg.angle || 90, spin: +o.bg.spin || 0 }; else if (o.bg.color) sc.bg = { type: 'solid', color: String(o.bg.color) }; }
    if (Array.isArray(o.bgfx)) sc.bgfx = o.bgfx.slice(0, 5).filter((f) => f && ['stars', 'bokeh', 'rays', 'grid', 'vignette'].includes(f.type)).map((f) => Object.assign({}, f, { count: f.count ? cl(+f.count, 1, 200) : undefined }));
    const clean = (v, depth = 0) => { if (v == null) return v; if (typeof v === 'number') return isFinite(v) ? v : 0; if (typeof v === 'string') return v.slice(0, 500); if (typeof v === 'boolean') return v; if (Array.isArray(v)) return v.slice(0, 60).map((a) => clean(a, depth + 1)); if (typeof v === 'object' && depth < 3) { const r = {}; Object.keys(v).slice(0, 40).forEach((k) => { r[k] = clean(v[k], depth + 1); }); return r; } return undefined; };
    (Array.isArray(o.layers) ? o.layers : []).slice(0, 60).forEach((L) => { if (L && TYPES.includes(L.type)) { const c = clean(L); if (c.font && !FONTS.includes(c.font)) c.font = 'Anton'; sc.layers.push(c); } });
    return sc.layers.length ? sc : null;
  }
  /* ---------- lokalny planer grafiki ruchomej ---------- */
  const nz = (s) => String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const PALS = [['#0f0c29', '#302b63', '#24243e'], ['#42275a', '#734b6d'], ['#0f2027', '#203a43', '#2c5364'], ['#232526', '#414345'], ['#1d2b64', '#f8cdda'], ['#0b486b', '#f56217'], ['#141e30', '#243b55'], ['#3a1c71', '#d76d77', '#ffaf7b']];
  const ACC = ['#ffd23f', '#ff4fa3', '#37e2ff', '#7dffb0', '#ff8a3d', '#b983ff'];
  const COLW = [[/czerwon/, ['#3b0a0a', '#c1121f'], '#ffffff'], [/niebiesk|granat/, ['#071a3c', '#1e6bd6'], '#ffffff'], [/zielon/, ['#06281c', '#1f9d55'], '#ffffff'], [/zolt/, ['#3a2e00', '#e5b800'], '#111111'], [/fiolet|purpur/, ['#1a0b3a', '#7b2ff7'], '#ffffff'], [/rozow/, ['#3a0a2a', '#ff4fa3'], '#ffffff'], [/czarn/, ['#000000', '#111111'], '#ffffff'], [/\bbial/, ['#ffffff', '#e8edf5'], '#111111'], [/pomaranc/, ['#3a1500', '#ff7a1a'], '#ffffff']];
  function plan(raw) {
    const txt = String(raw || ''), quotes = []; const t0 = txt.replace(/[„"“”«»]([^„"“”«»]+)[„"“”«»]/g, (_, q) => { quotes.push(q.trim()); return ' qqq' + (quotes.length - 1) + ' '; });
    const n = nz(t0), notes = [], seed = [...n].reduce((a, c) => a + c.charCodeAt(0), 0);
    const dm = /(\d+(?:[.,]\d+)?)\s*(sek\w*|s\b|minut\w*|min\b)/.exec(n); let dur = dm ? cl(parseFloat(dm[1].replace(',', '.')) * (/^min/.test(dm[2]) ? 60 : 1), 1, 180) : 0;
    let pal = PALS[seed % PALS.length], accent = ACC[seed % ACC.length], textCol = '#ffffff';
    COLW.forEach(([re, p2, tc]) => { if (re.test(n)) { pal = p2; textCol = tc; if (tc === '#111111') accent = '#111111'; } });
    const bg = { type: 'gradient', colors: pal, angle: 90 + (seed % 5) * 15 }, sc = { v: 1, kind: 'motion', dur: 4, prompt: txt, bg, bgfx: [{ type: 'stars', count: 50, color: 'rgba(255,255,255,.6)' }], layers: [] };
    const NUM = '(-?\\d+(?:[.,]\\d+)?)', pn = (s) => parseFloat(String(s).replace(',', '.'));
    let m = new RegExp('od\\s*' + NUM + '\\s*(?:do|-|–|—|na|->|→)\\s*' + NUM).exec(n) || new RegExp('(?:z|ze)\\s*' + NUM + '\\s*(?:do|na)\\s*' + NUM).exec(n) || new RegExp(NUM + '\\s*(?:->|→|–|—)\\s*' + NUM).exec(n);
    const isCount = /odlicz|licznik|liczy\w*|zlicza|counter|countdown|\bod\b.*\bdo\b|stoper|timer|minutnik|zegar/.test(n);
    const isTime = /stoper|timer|minutnik|zegar|odmierz/.test(n) && !m;
    const isLoad = /ladowani|loading|progress|postep|pasek/.test(n);
    const wantsTitle = quotes.length > 0 || /\b(tytul|napis|intro|outro|logo|tekst)\b/.test(n);
    const addFx = () => {
      if (/konfetti/.test(n)) sc.layers.push({ type: 'particles', count: 90, colors: ['#ff4fa3', '#ffd23f', '#37e2ff', '#7dffb0', '#b983ff'], shape: 'square', size: 0.012, speed: 0.35, gravity: 0.7, life: 2.4, direction: 'burst', x: 0.5, y: 0.35, seed: 3 });
      if (/fajerwerk/.test(n)) [[0.3, 0.35, '#ffd23f'], [0.7, 0.3, '#ff4fa3'], [0.5, 0.45, '#37e2ff']].forEach(([px, py, c], k) => sc.layers.push({ type: 'particles', at: k * 0.7, count: 60, colors: [c, '#ffffff'], shape: 'star', size: 0.01, speed: 0.28, gravity: 0.35, life: 1.6, direction: 'burst', x: px, y: py, seed: 10 + k, blend: 'lighter' }));
      if (/snieg|snow/.test(n)) sc.layers.push({ type: 'particles', count: 90, colors: ['#ffffff'], size: 0.008, speed: 0.12, gravity: 0, life: 4, direction: 'down', x: 0.5, y: -0.05, spreadX: 1, seed: 5 });
      if (/deszcz/.test(n)) sc.layers.push({ type: 'particles', count: 120, colors: ['#8ec5ff'], shape: 'square', size: 0.004, speed: 0.9, gravity: 0, life: 1.1, direction: 'down', x: 0.5, y: -0.05, spreadX: 1, seed: 6 });
      if (/iskr|gwiazd/.test(n) && !/konfetti/.test(n)) sc.layers.push({ type: 'particles', count: 70, colors: ['#ffd23f', '#ffffff'], shape: 'star', size: 0.009, speed: 0.1, gravity: -0.05, life: 3, direction: 'out', x: 0.5, y: 0.5, spreadX: 1, spreadY: 1, seed: 8, blend: 'lighter' });
    };
    if (isCount && m) {
      const a = pn(m[1]), b = pn(m[2]), span = Math.abs(b - a);
      if (!dur) dur = span <= 30 ? Math.max(2, span) : 4;
      const fast = span / dur > 12, asc = b >= a, K = fast ? 'easeOut(u)' : 'u';
      const val = `round(lerp(${a},${b},${K}))`;
      sc.dur = dur + 0.8; sc.layers.push({ type: 'text', at: 0, dur: dur + 0.8, text: `{${val}}`, size: 0.42, font: 'Anton', color: textCol, y: 0.47, glow: 0.18, glowColor: accent, scale: fast ? '1+0.06*sin(u*40)*(1-u)' : `1+0.10*${asc ? '(1-fract(lerp(' + a + ',' + b + ',u)))' : 'fract(lerp(' + a + ',' + b + ',u))'}` , stroke: { w: 0.02, color: 'rgba(0,0,0,.35)' } });
      sc.layers.push({ type: 'bar', x: 0.5, y: 0.86, w: 0.6, h: 0.022, value: `clamp(lt/${dur},0,1)`, color: accent, radius: 0.5 });
      sc.layers.push({ type: 'text', x: 0.5, y: 0.14, text: asc ? 'LICZNIK' : 'ODLICZANIE', size: 0.05, font: 'Oswald', color: accent, spacing: 0.25, weight: 700 });
      addFx(); notes.push(`Odliczanie od ${a} do ${b} w ${dur.toFixed(1)} s.`);
    } else if (isTime || (isCount && !m && /\d/.test(n))) {
      const nn = /(\d+(?:[.,]\d+)?)/.exec(n), total = dur || (nn ? pn(nn[1]) : 10), down = /odlicz|minutnik|countdown/.test(n);
      sc.dur = total + 0.8; sc.layers.push({ type: 'text', text: `{timecc(${down ? total + '-clamp(lt,0,' + total + ')' : 'clamp(lt,0,' + total + ')'})}`, size: 0.26, font: 'Orbitron', color: textCol, glow: 0.2, glowColor: accent, y: 0.48 });
      sc.layers.push({ type: 'ring', x: 0.5, y: 0.48, r: 0.36, width: 0.02, value: `${down ? '1-' : ''}clamp(lt/${total},0,1)`, color: accent, trackColor: 'rgba(255,255,255,.12)', rot: 0 });
      notes.push(`${down ? 'Minutnik' : 'Stoper'} na ${total} s.`);
    } else if (isCount && !m) {
      const total = dur || 10; sc.dur = total + 0.8; sc.layers.push({ type: 'text', text: `{round(lerp(${Math.round(total)},0,clamp(lt/${total},0,1)))}`, size: 0.42, font: 'Anton', color: textCol, glow: 0.18, glowColor: accent, y: 0.47 }); sc.layers.push({ type: 'bar', y: 0.86, w: 0.6, h: 0.022, value: `clamp(lt/${total},0,1)`, color: accent }); notes.push(`Odliczanie od ${Math.round(total)} do 0.`);
    } else if (isLoad) {
      const total = dur || 4; sc.dur = total + 0.8; sc.layers.push({ type: 'text', y: 0.36, text: quotes[0] || 'ŁADOWANIE', size: 0.07, font: 'Oswald', color: textCol, spacing: 0.2, weight: 700 }); sc.layers.push({ type: 'bar', y: 0.5, w: 0.62, h: 0.045, value: `ease(clamp(lt/${total},0,1))`, color: accent, radius: 0.5 }); sc.layers.push({ type: 'text', y: 0.62, text: `{round(ease(clamp(lt/${total},0,1))*100)}%`, size: 0.12, font: 'Anton', color: textCol, glow: 0.1, glowColor: accent }); notes.push(`Pasek ładowania, ${total.toFixed(1)} s.`);
    } else if (wantsTitle) {
      const text = quotes[0] || (/tytul\s+(.+)/.exec(n) || [])[1] || 'TWÓJ TYTUŁ', total = dur || 4, anim = /maszyn|typewriter|pisan/.test(n) ? 'type' : /glitch/.test(n) ? 'glitch' : /odbij|bounce|spad/.test(n) ? 'bounce' : /powoli|fade|zanik/.test(n) ? 'fade' : 'pop';
      sc.dur = total;
      const base = { type: 'text', text: String(text).toUpperCase(), size: 0.15, font: 'Anton', color: textCol, glow: 0.12, glowColor: accent, y: 0.5 };
      if (anim === 'type') { base.text = `{typed('${String(text).replace(/'/g, '')}',clamp(lt/${(total * 0.6).toFixed(2)},0,1))}`; base.font = 'Space Grotesk'; base.align = 'center'; }
      else if (anim === 'bounce') base.y = 'lerp(-0.2,0.5,easeOutBounce(clamp(lt/1.2,0,1)))';
      else if (anim === 'fade') base.opacity = 'clamp(lt/1.5,0,1)';
      else if (anim === 'glitch') { sc.layers.push(Object.assign({}, base, { color: '#ff2a6d', x: '0.5+0.01*sin(t*47)*step(0.7,rand(floor(t*14)))', glow: 0 }), Object.assign({}, base, { color: '#05d9e8', x: '0.5-0.01*sin(t*53)*step(0.7,rand(floor(t*14)+9))', glow: 0 })); }
      else { base.scale = '0.3+0.7*easeOutBack(clamp(lt/0.7,0,1))'; base.opacity = 'clamp(lt*5,0,1)'; }
      sc.layers.push(base); sc.layers.push({ type: 'line', x: 0.3, y: 0.64, x2: 0.7, y2: 0.64, width: 0.008, color: accent, opacity: 'clamp((lt-0.4)*2,0,1)' });
      addFx(); notes.push(`Tytuł „${text}” (${anim}).`);
    } else if (/konfetti|fajerwerk|snieg|deszcz|iskr|gwiazd/.test(n)) {
      sc.dur = dur || 4; addFx(); notes.push('Efekt cząsteczkowy na gradientowym tle.');
    } else return null;
    if (dur && sc.dur < dur) sc.dur = dur;
    sc.dur = +sc.dur.toFixed(2);
    return { scene: sc, notes, report: { kind: 'motion', dur: sc.dur, layers: sc.layers.length } };
  }
  return { draw, plan, sanitize, preload, compile, evalExpr, FONTS, PALS, ACC, TYPES };
})();
