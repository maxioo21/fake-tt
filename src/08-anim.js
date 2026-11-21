'use strict';
/* ============================================================
   Kadr Animator — własny silnik scen 2D/3D rysowany na Canvas 2D.
   Postacie szkieletowe (FK + 2-kostne IK), ~40 czynności, kamera z najazdem na uderzenia,
   10 teł, efekty komiksowe. Działa lokalnie i za darmo (bez żadnego AI, bez kredytów).
   ============================================================ */
const Anim = (() => {
  const PI = Math.PI, cos = Math.cos, sin = Math.sin, abs = Math.abs, MX = Math.max, MN = Math.min;
  const cl = (x, a, b) => MX(a, MN(b, x));
  const sm = (x) => { x = cl(x, 0, 1); return x * x * (3 - 2 * x); };
  const ss = (u, a, b) => sm((u - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const hash = (n) => { const s = sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
  const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const lerp3 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
  const rx = (p, a) => { const c = cos(a), s = sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
  const ry = (p, a) => { const c = cos(a), s = sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
  const rz = (p, a) => { const c = cos(a), s = sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
  const angMix = (a, b, k) => { let d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * k; };
  const hex = (c) => { c = String(c || '#888888').replace('#', ''); if (c.length === 3) c = c.split('').map((x) => x + x).join(''); const n = parseInt(c, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixc = (a, b, k) => { const x = hex(a), y = hex(b); return `rgb(${Math.round(mix(x[0], y[0], k))},${Math.round(mix(x[1], y[1], k))},${Math.round(mix(x[2], y[2], k))})`; };

  /* ---------- szkielet ---------- */
  const B = { hip: 0.93, spine: 0.52, neck: 0.1, headR: 0.165, shW: 0.2, hipW: 0.09, ua: 0.3, fa: 0.28, th: 0.45, sh: 0.44, foot: 0.14, torsoR: 0.165, armR: 0.052, legR: 0.075 };
  const mkArm = () => ({ p: 0.04, r: 0.1, e: 0.25, ik: null });
  const mkLeg = () => ({ p: 0, r: 0.03, k: 0.04 });
  const newPose = () => ({ yaw: 0, rootY: 0, rootZ: 0, air: 0, bp: 0, br: 0, lean: 0, twist: 0, roll: 0, hp: 0, hy: 0, hr: 0, L: mkArm(), R: mkArm(), LL: mkLeg(), RL: mkLeg(), mouth: 0, eyes: 'open', brow: 0, smile: 0.4, ball: null });
  const setArm = (a, p, r, e, k = 1) => { a.p = mix(a.p, p, k); a.r = mix(a.r, r, k); a.e = mix(a.e, e, k); };
  const setLeg = (l, p, r, kn, k = 1) => { l.p = mix(l.p, p, k); l.r = mix(l.r, r, k); l.k = mix(l.k, kn, k); };
  const dirPR = (p, r, o) => { const wy = -cos(p), wz = sin(p); return [o * -wy * sin(r), wy * cos(r), wz]; };
  function ik2(S, T, l1, l2, pole) {
    let d = sub(T, S), dist = len(d); const u = nrm(d); dist = cl(dist, abs(l1 - l2) + 0.03, (l1 + l2) * 0.995);
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), hh = Math.sqrt(MX(0, l1 * l1 - a * a));
    const pv = nrm(sub(pole, mul(u, dot(pole, u))));
    return [add(S, add(mul(u, a), mul(pv, hh))), add(S, mul(u, dist))];
  }
  /* wynik: stawy w świecie + dane głowy */
  function solve(P, st) {
    const h = st.h + P.yaw, pel0 = [0, B.hip + P.rootY, P.rootZ];
    const body = (p) => { let q = sub(p, pel0); q = rx(rz(q, P.br), P.bp); q = add(q, pel0); q = ry(q, h); return [q[0] + st.x, q[1], q[2] + st.z]; };
    const tor = (p) => body(add(pel0, rz(rx(ry(p, P.twist), P.lean), P.roll)));
    const toTorLocal = (w) => { let q = [w[0] - st.x, w[1], w[2] - st.z]; q = ry(q, -h); q = sub(q, pel0); q = rz(rx(q, -P.bp), -P.br); q = add(q, pel0); q = sub(q, pel0); return ry(rx(rz(q, -P.roll), -P.lean), -P.twist); };
    const J = {};
    J.pel = body(pel0); J.chest = tor([0, B.spine, 0]); J.neck = tor([0, B.spine + B.neck, 0]);
    const nb = [0, B.spine + B.neck, 0], hd = (p) => tor(add(nb, rz(rx(ry(p, P.hy), P.hp), P.hr))), hc = B.headR * 0.95;
    J.head = hd([0, hc, 0]);
    J.eyeL = hd([0.062, hc + 0.025, B.headR * 0.9]); J.eyeR = hd([-0.062, hc + 0.025, B.headR * 0.9]); J.mouth = hd([0, hc - 0.075, B.headR * 0.93]);
    J.fwd = nrm(sub(hd([0, hc, 1]), hd([0, hc, 0]))); J.up = nrm(sub(hd([0, hc + 1, 0]), hd([0, hc, 0]))); J.rgt = nrm(sub(hd([-1, hc, 0]), hd([0, hc, 0])));
    J.hairBack = hd([0, hc + 0.02, -B.headR * 0.55]); J.top = hd([0, hc + B.headR * 0.95, 0]);
    for (const o of [1, -1]) {
      const A = o > 0 ? P.L : P.R, S = [o * B.shW, B.spine - 0.05, 0], key = o > 0 ? 'L' : 'R';
      let E = add(S, mul(dirPR(A.p, A.r, o), B.ua)), Wr = add(E, mul(dirPR(A.p + A.e, A.r * 0.85, o), B.fa));
      if (A.ik && A.ik.w > 0.001) {
        const [E2, W2] = ik2(S, toTorLocal(A.ik.t), B.ua, B.fa, A.ik.pole ? [A.ik.pole[0] * o, A.ik.pole[1], A.ik.pole[2]] : [o * 1, 0.25, -0.5]);
        E = lerp3(E, E2, A.ik.w); Wr = lerp3(Wr, W2, A.ik.w);
      }
      J['sh' + key] = tor(S); J['el' + key] = tor(E); J['wr' + key] = tor(Wr);
      const Lg = o > 0 ? P.LL : P.RL, H = [o * B.hipW, 0, 0];
      const kn = add(H, mul(dirPR(Lg.p, Lg.r, o), B.th)), an = add(kn, mul(dirPR(Lg.p - Lg.k, Lg.r * 0.4, o), B.sh)), toe = add(an, rx([0, -0.035, B.foot], -(Lg.p - Lg.k) * 0.35));
      const lb = (p) => body(add(pel0, p));
      J['hp' + key] = lb(H); J['kn' + key] = lb(kn); J['an' + key] = lb(an); J['to' + key] = lb(toe);
    }
    return J;
  }

  /* ---------- czynności ---------- */
  const near = (P, c) => (c.near === 'R' ? P.R : P.L), far = (P, c) => (c.near === 'R' ? P.L : P.R);
  const nearLeg = (P, c) => (c.near === 'R' ? P.RL : P.LL);
  function idle(P, t) { P.lean = 0.025 + 0.012 * sin(t * 2.1); P.L.p = 0.04 + 0.03 * sin(t * 2.1 + 1); P.R.p = 0.04 + 0.03 * sin(t * 2.1); P.hp = 0.03 * sin(t * 1.3); P.hy = 0.05 * sin(t * 0.9); P.smile = 0.4; P.LL.k = P.RL.k = 0.04; }
  function gait(P, ph, amp, arms) {
    const s = sin(ph), c = cos(ph);
    P.LL.p = s * amp; P.RL.p = -s * amp; P.LL.k = MX(0, c) * amp * 1.25 + 0.05; P.RL.k = MX(0, -c) * amp * 1.25 + 0.05;
    P.L.p = -s * arms; P.R.p = s * arms; P.L.e = 0.35 + MX(0, s) * 0.45 * arms; P.R.e = 0.35 + MX(0, -s) * 0.45 * arms; P.twist = s * 0.14 * arms; P.roll = 0.025 * s; P.hp = 0.02;
  }
  const phase = (u, s, stride) => (u * s.len) / stride * 2 * PI;
  const lookT = (P, c, k = 1) => { if (c.tgt) P.hy = mix(P.hy, cl((c.hAng || 0), -0.7, 0.7), k); };
  const talk = (P, tt) => { P.mouth = 0.25 + 0.35 * abs(sin(tt * 13)); };
  const DEF = { dur: 1.5, mv: null, hold: false, tgt: false, gap: 0, hitAt: 0, react: null, reactDur: 0 };
  const ACTS = {};
  const act = (id, n, o, pose, fx) => { ACTS[id] = Object.assign({}, DEF, { id, n }, o, { pose, fx }); };
  act('idle', 'Stoi', { dur: 1.5 }, (P, u, s, c) => idle(P, c.t));
  act('walk', 'Idzie', { mv: 'walk' }, (P, u, s, c) => { gait(P, phase(u, s, 1.3), 0.62, 0.55); P.lean = 0.05; });
  act('run', 'Biegnie', { mv: 'run' }, (P, u, s, c) => { gait(P, phase(u, s, 2.0), 1.0, 1.05); P.lean = 0.3; P.L.e = P.R.e = 1.5; P.hp = -0.05; P.mouth = 0.2; });
  act('approach', 'Podchodzi do', { mv: 'walk', tgt: true, gap: 0.85 }, (P, u, s, c) => { gait(P, phase(u, s, 1.3), 0.62, 0.55); P.lean = 0.06; lookT(P, c); });
  act('runto', 'Podbiega do', { mv: 'run', tgt: true, gap: 0.85 }, (P, u, s, c) => { gait(P, phase(u, s, 2.0), 1.0, 1.05); P.lean = 0.3; P.L.e = P.R.e = 1.5; lookT(P, c); });
  act('turn', 'Odwraca się do', { dur: 0.6, tgt: true }, (P, u, s, c) => { idle(P, c.t); P.twist = 0.3 * pulse(u); });
  const pulse = (u) => sin(PI * cl(u, 0, 1));
  act('look', 'Patrzy na', { dur: 1.2, tgt: true }, (P, u, s, c) => { idle(P, c.t); lookT(P, c); });
  act('jump', 'Skacze', { dur: 0.95 }, (P, u) => {
    const cr = pulse(ss(u, 0, 0.28)) * (1 - ss(u, 0.28, 0.3)) + pulse(ss(u, 0.78, 1)) * 0.7, fl = pulse(ss(u, 0.26, 0.8));
    P.air = fl * 0.75; P.lean = 0.1 + cr * 0.25 - fl * 0.1;
    for (const l of [P.LL, P.RL]) setLeg(l, cr * 0.9 + fl * 0.5, 0.05, cr * 1.5 + fl * 0.8);
    setArm(P.L, -0.4 * cr + 2.4 * fl, 0.4 + fl * 1.0, 0.3); setArm(P.R, -0.4 * cr + 2.4 * fl, 0.4 + fl * 1.0, 0.3); P.mouth = fl * 0.6; P.eyes = fl > 0.5 ? 'happy' : 'open';
  });
  act('wave', 'Macha', { dur: 1.9 }, (P, u, s, c) => { idle(P, c.t); const a = near(P, c), k = pulse(ss(u, 0, 0.18) * (1 - ss(u, 0.85, 1)) * 1) ? 1 : 1, kk = ss(u, 0, 0.15) * (1 - ss(u, 0.88, 1)); setArm(a, 0.1, 2.5, 0.5 + 0.55 * sin(c.tt * 13), kk); P.smile = 0.8; P.eyes = 'happy'; P.hr = 0.1 * kk; P.mouth = 0.2 * kk; });
  act('dance', 'Tańczy', { dur: 3 }, (P, u, s, c) => {
    const t = c.tt * 5.5, b = abs(sin(t)); idle(P, c.t); P.rootY = -b * 0.05; P.roll = 0.14 * sin(t); P.twist = 0.3 * sin(t); P.hr = 0.15 * sin(t); P.hy = 0.25 * sin(t * 0.5);
    setArm(P.L, 2.4 * MX(0, sin(t)), 0.7 + 0.8 * MX(0, sin(t)), 0.5); setArm(P.R, 2.4 * MX(0, -sin(t)), 0.7 + 0.8 * MX(0, -sin(t)), 0.5);
    P.LL.p = 0.3 * sin(t); P.RL.p = -0.3 * sin(t); P.LL.k = 0.3 + 0.4 * MX(0, sin(t)); P.RL.k = 0.3 + 0.4 * MX(0, -sin(t)); P.smile = 0.9; P.eyes = 'happy'; P.mouth = 0.2;
  }, (s) => [{ k: 'notes', t: s.s0 + 0.3, d: s.s1 - s.s0 - 0.3, who: s.me }]);
  act('clap', 'Klaszcze', { dur: 1.7 }, (P, u, s, c) => { idle(P, c.t); const k = 0.5 + 0.5 * sin(c.tt * 16); setArm(P.L, 1.2, 0.3 + (1 - k) * 0.3, 1.5); setArm(P.R, 1.2, 0.3 + (1 - k) * 0.3, 1.5); P.smile = 0.9; P.eyes = 'happy'; P.mouth = 0.3; });
  act('laugh', 'Śmieje się', { dur: 2.2 }, (P, u, s, c) => { idle(P, c.t); const sh = sin(c.tt * 22); P.hp = -0.35; P.lean = -0.1 + 0.05 * sh; P.rootY = -0.02 * abs(sh); P.mouth = 0.8; P.eyes = 'happy'; P.smile = 1; setArm(P.L, 0.5, 0.4, 1.6); setArm(P.R, 0.5, 0.4, 1.6); P.roll = 0.03 * sh; },
    (s) => [{ k: 'bubble', t: s.s0 + 0.2, d: s.s1 - s.s0 - 0.2, who: s.me, text: 'HAHA!' }]);
  act('cry', 'Płacze', { dur: 2.6 }, (P, u, s, c) => { idle(P, c.t); const sh = sin(c.tt * 18); P.hp = 0.4; P.lean = 0.22; P.mouth = 0.5; P.smile = -0.8; P.eyes = 'closed'; P.brow = -0.6; setArm(P.L, 1.7, 0.45, 2.3); setArm(P.R, 1.7, 0.45, 2.3); P.rootY = -0.015 * abs(sh); P.roll = 0.03 * sh; },
    (s) => [{ k: 'tears', t: s.s0 + 0.2, d: s.s1 - s.s0 - 0.2, who: s.me }]);
  act('angry', 'Złości się', { dur: 2 }, (P, u, s, c) => { idle(P, c.t); const st = sin(c.tt * 14); P.brow = 1; P.mouth = 0.5; P.smile = -0.9; P.lean = 0.15; P.hp = 0.1; P.rootY = -0.02; setArm(P.L, 0.3, 0.45, 2.2); setArm(P.R, 0.3, 0.45, 2.2); P.LL.p = 0.4 * MX(0, st); P.RL.p = 0.4 * MX(0, -st); P.LL.k = 0.4 * MX(0, st); P.RL.k = 0.4 * MX(0, -st); P.twist = 0.1 * st; },
    (s) => [{ k: 'steam', t: s.s0 + 0.1, d: s.s1 - s.s0 - 0.1, who: s.me }]);
  act('sit', 'Siada', { dur: 1.0, hold: true }, (P, u, s, c) => { idle(P, c.t); const k = ss(u, 0, 0.7); P.LL.p = P.RL.p = 1.45 * k; P.LL.k = P.RL.k = 1.5 * k; P.lean = 0.02; setArm(P.L, 0.6 * k, 0.2, 1.2 * k); setArm(P.R, 0.6 * k, 0.2, 1.2 * k); },
    (s) => [{ k: 'chair', t: s.s0, d: 999, who: s.me }]);
  act('sleep', 'Śpi', { dur: 3.2, hold: true }, (P, u, s, c) => { idle(P, c.t); const k = ss(u, 0, 0.35); P.bp = -1.5 * k; P.eyes = 'closed'; P.smile = 0.5; setArm(P.L, 0.2, 0.3, 0.3); setArm(P.R, 0.2, 0.3, 0.3); P.lean = 0; P.rootY = 0.12 * k * (1 - k) * 2; },
    (s) => [{ k: 'zzz', t: s.s0 + 0.6, d: 99, who: s.me }]);
  act('fall', 'Przewraca się', { dur: 1.0, hold: true }, (P, u, s, c) => {
    idle(P, c.t); const k = ss(u, 0, 0.55), fl = pulse(ss(u, 0, 0.5)); P.bp = -1.52 * k + 0.1 * sin(PI * ss(u, 0.55, 0.8)); setArm(P.L, 2.6 * fl + 0.2, 1.0 * fl + 0.3, 0.4); setArm(P.R, 2.6 * fl + 0.2, 1.0 * fl + 0.3, 0.4); P.eyes = 'x'; P.mouth = 0.6; P.rootY = 0.06 * pulse(u);
  }, (s) => [{ k: 'dust', t: s.s0 + 0.5, d: 0.6, who: s.me }]);
  act('getup', 'Wstaje', { dur: 1.2 }, (P, u, s, c) => { idle(P, c.t); const k = 1 - ss(u, 0.1, 0.8); P.bp = -1.52 * k; setArm(P.L, 0.9 * k, 0.6, 0.4); setArm(P.R, 0.9 * k, 0.6, 0.4); P.eyes = u < 0.5 ? 'closed' : 'open'; });
  act('point', 'Wskazuje na', { dur: 1.5, tgt: true }, (P, u, s, c) => { idle(P, c.t); const k = ss(u, 0, 0.2) * (1 - ss(u, 0.85, 1)); setArm(near(P, c), 1.5, 0.35, 0.05, k); lookT(P, c); P.brow = 0.2 * k; });
  act('nod', 'Kiwa głową', { dur: 1.2 }, (P, u, s, c) => { idle(P, c.t); P.hp = 0.3 * sin(c.tt * 9) * (1 - ss(u, 0.8, 1)); P.smile = 0.7; });
  act('shake', 'Kręci głową', { dur: 1.3 }, (P, u, s, c) => { idle(P, c.t); P.hy = 0.55 * sin(c.tt * 10) * (1 - ss(u, 0.8, 1)); P.smile = -0.4; P.eyes = 'closed'; });
  act('bow', 'Kłania się', { dur: 1.6 }, (P, u, s, c) => { idle(P, c.t); const k = pulse(ss(u, 0.1, 0.9)); P.lean = 0.9 * k; P.hp = 0.3 * k; setArm(near(P, c), 0.6 * k, 0.3, 1.0 * k); P.smile = 0.8; });
  act('flip', 'Robi salto', { dur: 1.3 }, (P, u) => { const k = ss(u, 0.18, 0.82), cr = pulse(ss(u, 0, 0.2)) + pulse(ss(u, 0.8, 1)) * 0.6; P.bp = -2 * PI * k; P.air = pulse(ss(u, 0.15, 0.85)) * 1.0; for (const l of [P.LL, P.RL]) setLeg(l, cr * 0.9 + 1.4 * k * (1 - k) * 2, 0.05, cr * 1.4 + 1.5 * k * (1 - k) * 2); setArm(P.L, 2.5, 0.4, 0.3); setArm(P.R, 2.5, 0.4, 0.3); P.eyes = 'happy'; P.mouth = 0.4; });
  act('spin', 'Kręci się', { dur: 1.4 }, (P, u, s, c) => { idle(P, c.t); P.yaw = 2 * PI * 2 * ss(u, 0, 1); setArm(P.L, 0.2, 1.4, 0.2); setArm(P.R, 0.2, 1.4, 0.2); P.eyes = 'happy'; P.smile = 0.9; });
  act('celebrate', 'Świętuje', { dur: 2.2 }, (P, u, s, c) => { idle(P, c.t); const j = abs(sin(c.tt * 6)); P.air = j * 0.3; setArm(P.L, 2.7, 0.55 + 0.2 * sin(c.tt * 12), 0.3); setArm(P.R, 2.7, 0.55 - 0.2 * sin(c.tt * 12), 0.3); P.mouth = 0.7; P.eyes = 'happy'; P.smile = 1; P.hp = -0.2; for (const l of [P.LL, P.RL]) setLeg(l, 0.2, 0.1, 0.5); },
    (s) => [{ k: 'confetti', t: s.s0, d: s.s1 - s.s0 + 0.8, who: s.me }]);
  act('think', 'Myśli', { dur: 2 }, (P, u, s, c) => { idle(P, c.t); const k = ss(u, 0, 0.2); setArm(near(P, c), 1.3, 0.2, 2.3, k); P.hy = 0.3 * k; P.hr = 0.12 * k; P.hp = -0.15 * k; P.brow = -0.3 * k; P.eyes = 'open'; },
    (s) => [{ k: 'question', t: s.s0 + 0.2, d: s.s1 - s.s0 - 0.2, who: s.me }]);
  act('shrug', 'Wzrusza ramionami', { dur: 1.3 }, (P, u, s, c) => { idle(P, c.t); const k = pulse(ss(u, 0.05, 0.9)); setArm(P.L, 0.5, 0.9, 1.5, k); setArm(P.R, 0.5, 0.9, 1.5, k); P.rootY = 0.02 * k; P.hr = 0.18 * k; P.smile = -0.2; });
  act('facepalm', 'Łapie się za głowę', { dur: 1.6 }, (P, u, s, c) => { idle(P, c.t); const k = ss(u, 0, 0.25) * (1 - ss(u, 0.85, 1)); setArm(near(P, c), 1.7, 0.3, 2.4, k); P.hp = 0.35 * k; P.eyes = 'closed'; P.smile = -0.6; });
  act('scared', 'Boi się', { dur: 1.8 }, (P, u, s, c) => { idle(P, c.t); const tr = sin(c.tt * 30) * 0.03; P.lean = -0.18; P.rootY = -0.03; setArm(P.L, 1.3, 0.6, 1.9); setArm(P.R, 1.3, 0.6, 1.9); P.mouth = 0.8; P.eyes = 'open'; P.brow = -0.8; P.smile = -0.7; P.roll = tr * 2; for (const l of [P.LL, P.RL]) setLeg(l, 0.2, 0.12, 0.5); },
    (s) => [{ k: 'sweat', t: s.s0 + 0.1, d: s.s1 - s.s0, who: s.me }]);
  act('shout', 'Krzyczy do', { dur: 1.6, tgt: true }, (P, u, s, c) => { idle(P, c.t); const k = ss(u, 0, 0.15) * (1 - ss(u, 0.9, 1)); P.mouth = 0.9 * k; P.brow = 0.8 * k; P.lean = 0.15 * k; P.hp = -0.2 * k; setArm(P.L, 1.3, 0.4, 2.0, k); setArm(P.R, 1.3, 0.4, 2.0, k); lookT(P, c, k); },
    (s) => [{ k: 'bubble', t: s.s0 + 0.1, d: s.s1 - s.s0 - 0.1, who: s.me, text: s.text || 'HEJ!' }]);
  act('say', 'Mówi', { dur: 2 }, (P, u, s, c) => { idle(P, c.t); talk(P, c.tt); lookT(P, c, 0.8); setArm(near(P, c), 0.7, 0.45, 1.5, 0.5 + 0.5 * sin(c.tt * 3)); },
    (s) => [{ k: 'bubble', t: s.s0, d: s.s1 - s.s0, who: s.me, text: s.text || '...' }]);
  act('kiss', 'Posyła buziaka', { dur: 1.6, tgt: true }, (P, u, s, c) => { idle(P, c.t); const k = pulse(ss(u, 0.1, 0.9)); setArm(near(P, c), 1.6, 0.3, 2.2, k); P.eyes = 'happy'; P.smile = 0.6; lookT(P, c, k); },
    (s) => [{ k: 'hearts', t: s.s0 + 0.5, d: 1.2, who: s.me }]);
  act('throw', 'Rzuca piłką do', { dur: 1.3, tgt: true, hitAt: 0.45, react: 'hit', reactDur: 1.2, gap: 3 }, (P, u, s, c) => {
    idle(P, c.t); const N = near(P, c), d = c.near === 'R' ? 1 : -1, w = ss(u, 0.05, 0.35), th = ss(u, 0.35, 0.5), ret = ss(u, 0.6, 1);
    setArm(N, -0.9, 1.1, 1.3, w); setArm(N, 1.9, 0.4, 0.2, th); setArm(N, 0.05, 0.12, 0.25, ret); P.twist = d * (-0.7 * w + 1.2 * th) * (1 - ret); P.lean = (-0.15 * w + 0.35 * th) * (1 - ret); lookT(P, c);
    if (u < 0.43) P.ball = { hand: c.near === 'R' ? 'wrR' : 'wrL' };
  }, (s) => [{ k: 'ball', t: s.s0 + 0.45 * (s.s1 - s.s0), d: 0.55, who: s.me, to: s.tgt }]);

  /* --- ataki (z reakcjami celu dodawanymi automatycznie przy kompilacji) --- */
  const strike = (P, u, c, o) => {
    const N = near(P, c), Fa = far(P, c), d = c.near === 'R' ? 1 : -1, wind = ss(u, o.w0, o.w1), str = ss(u, o.w1, o.s1), ret = ss(u, o.r0, o.r1);
    setArm(N, o.wp, o.wr, o.we, wind); setArm(N, 0.05, 0.12, 0.25, ret);
    N.ik = c.tgt ? { t: add(c.tgt, o.off || [0, 0, 0]), w: str * (1 - ret) } : null;
    setArm(Fa, 0.3, 0.5, 1.0, wind * (1 - ret));
    P.twist = d * (o.tw0 * wind + (o.tw1 - o.tw0) * str) * (1 - ret); P.lean = (o.l0 * wind + (o.l1 - o.l0) * str) * (1 - ret) + 0.02; P.rootZ = (o.lunge || 0.12) * str * (1 - ret);
    P.brow = 0.9 * wind * (1 - ret); P.smile = -0.5; lookT(P, c);
    return { wind, str, ret, d };
  };
  act('slap', 'Uderza z liścia', { dur: 1.25, tgt: true, hitAt: 0.46, react: 'slapped', reactDur: 1.6, gap: 0.8 }, (P, u, s, c) => {
    strike(P, u, c, { w0: 0.04, w1: 0.34, s1: 0.46, r0: 0.62, r1: 0.95, wp: -0.3, wr: 1.9, we: 1.1, tw0: -0.8, tw1: 0.55, l0: -0.2, l1: 0.18, off: [0, 0.0, 0] });
  }, (s) => [{ k: 'burst', t: s.hit, d: 0.8, who: s.tgtI, text: 'PLASK!', j: 'head' }, { k: 'shock', t: s.hit, d: 0.4, who: s.tgtI, j: 'head' }, { k: 'stars', t: s.hit + 0.1, d: 1.4, who: s.tgtI }]);
  act('punch', 'Uderza pięścią', { dur: 1.1, tgt: true, hitAt: 0.42, react: 'punched', reactDur: 2.0, gap: 0.85 }, (P, u, s, c) => {
    strike(P, u, c, { w0: 0.04, w1: 0.3, s1: 0.42, r0: 0.6, r1: 0.95, wp: -0.7, wr: 0.45, we: 1.9, tw0: -0.7, tw1: 0.7, l0: -0.12, l1: 0.3, lunge: 0.18 });
  }, (s) => [{ k: 'burst', t: s.hit, d: 0.8, who: s.tgtI, text: 'BAM!', j: 'head' }, { k: 'shock', t: s.hit, d: 0.4, who: s.tgtI, j: 'head' }, { k: 'stars', t: s.hit + 0.1, d: 1.6, who: s.tgtI }]);
  act('kick', 'Kopie', { dur: 1.2, tgt: true, hitAt: 0.5, react: 'kicked', reactDur: 2.0, gap: 1.05 }, (P, u, s, c) => {
    const L = nearLeg(P, c), w = ss(u, 0.05, 0.38), k = ss(u, 0.38, 0.5), r = ss(u, 0.65, 1), d = c.near === 'R' ? 1 : -1;
    setLeg(L, -0.9, 0.05, 1.6, w); setLeg(L, 1.5, 0.05, 0.1, k); setLeg(L, 0, 0.03, 0.04, r); P.lean = (-0.2 * w + 0.35 * k) * (1 - r); setArm(P.L, 0.9 * (w - r), 0.6, 0.4); setArm(P.R, -0.9 * (w - r), 0.6, 0.4); P.brow = 0.8 * w * (1 - r); lookT(P, c);
    const o = c.near === 'R' ? P.LL : P.RL; o.k = 0.15; o.p = 0.1; void d;
  }, (s) => [{ k: 'burst', t: s.hit, d: 0.8, who: s.tgtI, text: 'KOP!', j: 'pel' }, { k: 'shock', t: s.hit, d: 0.4, who: s.tgtI, j: 'pel' }]);
  act('push', 'Popycha', { dur: 1.1, tgt: true, hitAt: 0.4, react: 'pushed', reactDur: 1.6, gap: 0.75 }, (P, u, s, c) => {
    const w = ss(u, 0.05, 0.3), k = ss(u, 0.3, 0.4), r = ss(u, 0.65, 1);
    setArm(P.L, 0.8, 0.35, 1.7, w); setArm(P.R, 0.8, 0.35, 1.7, w); setArm(P.L, 1.55, 0.25, 0.05, k); setArm(P.R, 1.55, 0.25, 0.05, k); setArm(P.L, 0.05, 0.12, 0.25, r); setArm(P.R, 0.05, 0.12, 0.25, r);
    P.lean = (-0.1 * w + 0.4 * k) * (1 - r); P.rootZ = 0.18 * k * (1 - r); P.brow = 0.6 * w; lookT(P, c);
  }, (s) => [{ k: 'burst', t: s.hit, d: 0.7, who: s.tgtI, text: 'PCH!', j: 'chest' }, { k: 'shock', t: s.hit, d: 0.4, who: s.tgtI, j: 'chest' }]);
  act('hug', 'Przytula', { dur: 2.4, tgt: true, hitAt: 0.3, react: 'hugged', reactDur: 2.0, gap: 0.5 }, (P, u, s, c) => {
    idle(P, c.t); const k = ss(u, 0.05, 0.3) * (1 - ss(u, 0.85, 1));
    for (const a of [P.L, P.R]) { a.ik = { t: add(c.tgt, [0, -0.3, 0]), w: 0.95 * k }; setArm(a, 1.1, 0.5, 1.2, k); }
    P.lean = 0.12 * k; P.hy = 0.2 * k; P.eyes = k > 0.5 ? 'closed' : 'open'; P.smile = 0.9; lookT(P, c, 0.5);
  }, (s) => [{ k: 'hearts', t: s.hit + 0.2, d: 1.8, who: s.me }]);
  /* --- reakcje --- */
  const recoil = (P, u, c, o) => {
    const kk = Math.exp(-u * (o.decay || 6)), sn = c.sgn;
    P.hy = -sn * o.hy * kk * ss(u, 0, 0.05); P.hr = sn * 0.35 * kk; P.hp = 0.15 * kk; P.twist = -sn * 0.5 * kk; P.lean = -o.lean * kk; P.mouth = 0.75 * kk; P.eyes = u < 0.45 ? 'x' : 'open'; P.brow = -0.5; P.smile = -0.7;
    setArm(P.L, 1.0, 0.8, 1.8, 0.6 * kk); setArm(P.R, 1.0, 0.8, 1.8, 0.6 * kk);
    const N = near(P, c); setArm(N, 1.0, 0.7, 2.1, ss(u, 0.2, 0.5) * (1 - ss(u, 0.9, 1)));
    if (c.selfHead) N.ik = { t: add(c.selfHead, [0, 0, 0.16 * (c.near === 'R' ? 0 : 0)]), w: 0.7 * ss(u, 0.25, 0.5) * (1 - ss(u, 0.9, 1)), pole: [1, 0.2, 0.1] };
  };
  act('slapped', 'Dostaje z liścia', { dur: 1.6, tgt: true, knock: 0.45 }, (P, u, s, c) => { idle(P, c.t); recoil(P, u, c, { hy: 1.2, lean: 0.25, decay: 5 }); });
  act('punched', 'Dostaje pięścią', { dur: 2.0, tgt: true, knock: 0.9 }, (P, u, s, c) => {
    idle(P, c.t); recoil(P, u, c, { hy: 0.9, lean: 0.45, decay: 4 }); const k = ss(u, 0.3, 0.7); P.bp = -1.52 * k * 0.0; P.air = 0.12 * pulse(ss(u, 0, 0.35)); setArm(P.L, 1.6 * (1 - k) + 0.2, 0.9, 0.5, 0.5); P.eyes = u < 0.6 ? 'x' : 'open';
  });
  act('kicked', 'Dostaje kopniaka', { dur: 2.0, tgt: true, knock: 1.1 }, (P, u, s, c) => {
    idle(P, c.t); const k = ss(u, 0.05, 0.45); P.bp = -1.52 * k * 0.0 - 0.9 * pulse(ss(u, 0, 0.7)); P.lean = 0.7 * pulse(ss(u, 0, 0.35)); P.hp = 0.3; P.eyes = u < 0.7 ? 'x' : 'open'; P.mouth = 0.7 * (1 - ss(u, 0.5, 0.8)); P.brow = -0.8; setArm(P.L, 2.0, 0.8, 0.3, 0.9); setArm(P.R, 2.0, 0.8, 0.3, 0.9);
  });
  act('pushed', 'Zostaje popchnięty', { dur: 1.6, tgt: true, knock: 1.0 }, (P, u, s, c) => {
    idle(P, c.t); const k = pulse(ss(u, 0, 0.5)); P.lean = -0.4 * k; setArm(P.L, 2.0, 0.9, 0.3, 0.9 * k); setArm(P.R, 2.0, 0.9, 0.3, 0.9 * k); P.mouth = 0.7 * k; P.eyes = 'open'; P.brow = -0.6; setLeg(P.LL, -0.5 * k, 0.1, 0.4); setLeg(P.RL, 0.5 * k, 0.1, 0.2); P.rootY = 0;
  });
  act('hit', 'Dostaje piłką', { dur: 1.2, tgt: true, knock: 0.3 }, (P, u, s, c) => { idle(P, c.t); recoil(P, u, c, { hy: 0.7, lean: 0.2, decay: 6 }); });
  act('hugged', 'Odwzajemnia uścisk', { dur: 2.0, tgt: true }, (P, u, s, c) => {
    idle(P, c.t); const k = ss(u, 0.05, 0.3) * (1 - ss(u, 0.85, 1));
    for (const a of [P.L, P.R]) { a.ik = { t: add(c.tgt, [0, -0.3, 0]), w: 0.9 * k }; setArm(a, 1.1, 0.5, 1.2, k); }
    P.hy = 0.2 * k; P.eyes = k > 0.5 ? 'closed' : 'open'; P.smile = 1; lookT(P, c, 0.4);
  });
  const ACT_LIST = Object.keys(ACTS);
  const HIT_ACTS = ACT_LIST.filter((k) => ACTS[k].react);

  /* ---------- kompilacja scenariusza do segmentów ---------- */
  const LOOKS = [
    { skin: '#f2c9a0', shirt: '#3b82f6', pants: '#1e293b', hair: '#3b2417', hs: 'short' }, { skin: '#e8b48a', shirt: '#ef4444', pants: '#374151', hair: '#7c2d12', hs: 'long' },
    { skin: '#c68a5c', shirt: '#22c55e', pants: '#4b5563', hair: '#111827', hs: 'bun' }, { skin: '#f7d7b5', shirt: '#f59e0b', pants: '#1f2937', hair: '#facc15', hs: 'cap' }];
  const ROBOT = { skin: '#aab8c6', shirt: '#64748b', pants: '#3b4756', hair: '#334155', hs: 'robot' };
  function startPos(n, i) { const sp = n === 1 ? [0] : n === 2 ? [-2.3, 2.3] : n === 3 ? [-3, 0, 3] : [-4.2, -1.4, 1.4, 4.2]; const x = sp[i], z = n === 3 && i === 1 ? -0.9 : 0; return { x, z, face: n === 1 ? 1 : (x < 0 ? 1 : -1) }; }
  function newScene(o = {}) {
    const n = cl(o.n || 1, 1, 4), chars = [];
    for (let i = 0; i < n; i++) { const sp = startPos(n, i), L = (o.looks && o.looks[i]) || LOOKS[i % LOOKS.length]; chars.push(Object.assign({ id: 'ABCD'[i], name: 'Postać ' + (i + 1), type: 'human', x: sp.x, z: sp.z, face: sp.face }, L)); }
    return Object.assign({ v: 1, style: '3d', bg: 'park', cam: 'auto', prompt: '', chars, steps: [] }, o.over || {});
  }
  const speedOf = (mv) => (mv === 'run' ? 3.6 : 1.45);
  function expandSteps(sc) {
    const ids = sc.chars.map((c) => c.id), idx = (id) => ids.indexOf(id);
    return (sc.steps || []).filter((s) => ACTS[s.act] && idx(s.who) >= 0).map((s) => Object.assign({}, s, { me: idx(s.who), tI: s.target != null && idx(s.target) >= 0 ? idx(s.target) : -1 })).sort((a, b) => (a.at || 0) - (b.at || 0));
  }
  function compile(sc) {
    const n = sc.chars.length, C = { chars: sc.chars.map((ch) => ({ init: [ch.x, ch.z], h0: ch.face >= 0 ? PI / 2 : -PI / 2, segs: [] })), fx: [], hits: [], end: 0 };
    const posAt = (i, t) => { const ch = C.chars[i]; let p = ch.init, h = ch.h0; for (const s of ch.segs) { if (t < s.s0) break; if (t >= s.s1) { p = s.to; h = s.h1; } else { const u = (t - s.s0) / (s.s1 - s.s0); return { x: mix(s.from[0], s.to[0], u), z: mix(s.from[1], s.to[1], u), h: hAt(s, t) }; } } return { x: p[0], z: p[1], h }; };
    const hAt = (s, t) => angMix(s.h0, s.h1, ss(t - s.s0, 0, MN(0.35, (s.s1 - s.s0) * 0.4)));
    const base = expandSteps(sc), queue = base.slice(), ids = sc.chars.map((c) => c.id);
    while (queue.length) {
      queue.sort((a, b) => (a.at || 0) - (b.at || 0) || (a.auto ? 1 : 0) - (b.auto ? 1 : 0));
      const st = queue.shift();
      let s0 = MX(0, st.at || 0);
      const a = ACTS[st.act], i = st.me, ch = C.chars[i]; let from = posAt(i, s0);
      /* atak z daleka: najpierw automatyczne podejście */
      if (a.react && st.tI >= 0 && st.tI !== i) {
        const tp0 = posAt(st.tI, s0), dx0 = tp0.x - from.x, dz0 = tp0.z - from.z, d0 = Math.hypot(dx0, dz0), g = st.gap > 0 ? st.gap : a.gap;
        if (d0 > g + 0.4) {
          const to2 = [tp0.x - dx0 / d0 * g, tp0.z - dz0 / d0 * g], dur2 = (d0 - g) / speedOf('walk'), hd = Math.atan2(dx0, dz0), prev0 = ch.segs[ch.segs.length - 1];
          if (prev0 && prev0.s1 > s0 + 1e-6) prev0.s1 = s0; if (prev0) { prev0.to = [from.x, from.z]; prev0.h1 = from.h; }
          ch.segs.push({ s0, s1: s0 + dur2, act: 'approach', from: [from.x, from.z], to: to2, h0: from.h, h1: hd, tgt: st.tI, tgtI: st.tI, me: i, text: '', len: d0 - g, hit: s0, auto: true });
          s0 += dur2; from = { x: to2[0], z: to2[1], h: hd };
        }
      }
      const prev = ch.segs[ch.segs.length - 1]; if (prev && prev.s1 > s0 + 1e-6) prev.s1 = s0;       /* nowy krok przerywa poprzedni */
      if (prev && !(prev.auto && prev.act === 'approach' && abs(prev.s1 - s0) < 1e-6)) { prev.to = [from.x, from.z]; prev.h1 = from.h; }
      let to = [from.x, from.z], h1 = from.h, dur = st.dur > 0 ? st.dur : a.dur, tp = null;
      if (st.tI >= 0 && st.tI !== i) { tp = posAt(st.tI, s0 + (a.react ? 0 : 0)); }
      if (tp && (a.tgt || a.mv)) { const dx = tp.x - from.x, dz = tp.z - from.z; if (abs(dx) + abs(dz) > 1e-4) h1 = Math.atan2(dx, dz); }
      if (a.mv) {
        if (st.to && st.to.length === 2) to = [+st.to[0], +st.to[1]];
        else if (tp) { const dx = tp.x - from.x, dz = tp.z - from.z, d = Math.hypot(dx, dz) || 1, g = st.gap > 0 ? st.gap : (a.gap || 0.85); to = d > g ? [tp.x - dx / d * g, tp.z - dz / d * g] : [from.x, from.z]; }
        else { to = [from.x + sin(from.h) * 2.5, from.z + cos(from.h) * 2.5]; }
        const dd = Math.hypot(to[0] - from.x, to[1] - from.z); if (!(st.dur > 0)) dur = MX(0.4, dd / speedOf(a.mv));
        if (dd > 1e-3) h1 = Math.atan2(to[0] - from.x, to[1] - from.z);
      } else if (a.knock && tp) {
        const dx = from.x - tp.x, dz = from.z - tp.z, d = Math.hypot(dx, dz) || 1; to = [from.x + dx / d * a.knock, from.z + dz / d * a.knock]; h1 = Math.atan2(-dx, -dz);
      }
      const seg = { s0, s1: s0 + dur, act: st.act, from: [from.x, from.z], to, h0: from.h, h1, tgt: st.tI, tgtI: st.tI, me: i, text: st.text || '', len: Math.hypot(to[0] - from.x, to[1] - from.z), hit: s0 + a.hitAt * dur, auto: !!st.auto };
      ch.segs.push(seg); C.end = MX(C.end, seg.s1);
      if (a.react && !st.auto) {
        C.hits.push({ t: seg.hit, by: i, to: st.tI });
        if (st.tI >= 0 && st.tI !== i && !base.some((o) => o.me === st.tI && !o.auto && abs((o.at || 0) - seg.hit) < 0.6 && o !== st)) queue.push({ at: seg.hit, who: ids[st.tI], me: st.tI, act: a.react, target: st.who, tI: i, dur: a.reactDur, auto: true });
      }
      if (a.fx) a.fx(seg).forEach((e) => C.fx.push(e));
    }
    C.posAt = posAt; C.n = n; return C;
  }
  const sigOf = (sc) => JSON.stringify([sc.chars, sc.steps, sc.style, sc.bg, sc.cam]);
  function get(sc) { const sg = sigOf(sc); if (!sc._c || sc._sig !== sg) { Object.defineProperty(sc, '_c', { value: compile(sc), writable: true, enumerable: false, configurable: true }); Object.defineProperty(sc, '_sig', { value: sg, writable: true, enumerable: false, configurable: true }); } return sc._c; }
  const duration = (sc) => MX(2, get(sc).end + 0.7);

  /* stan postaci w czasie t */
  function evalChar(C, sc, i, t) {
    const ch = C.chars[i], P = newPose(); let seg = null, u = 0;
    for (const s of ch.segs) { if (s.s0 <= t) seg = s; else break; }
    const pr = C.posAt(i, t), h = pr.h, sgn = sin(h) >= 0 ? 1 : -1;
    const c = { t, tt: 0, near: sgn >= 0 ? 'R' : 'L', sgn, tgt: null, hAng: 0, selfHead: [pr.x, 1.55, pr.z] };
    if (seg && t < seg.s1) {
      u = (t - seg.s0) / MX(1e-3, seg.s1 - seg.s0); c.tt = t - seg.s0;
      if (seg.tgt >= 0) { const tp = C.posAt(seg.tgt, t); c.tgt = [tp.x, 1.55, tp.z]; const dx = tp.x - pr.x, dz = tp.z - pr.z; c.hAng = angMix(0, Math.atan2(dx, dz) - h, 1) * 0.8; }
      ACTS[seg.act].pose(P, u, seg, c);
    } else if (seg && ACTS[seg.act].hold) { c.tt = seg.s1 - seg.s0; ACTS[seg.act].pose(P, 1, seg, c); }
    else idle(P, t);
    return { x: pr.x, z: pr.z, h, P, seg, u, c };
  }

  /* ---------- kamera ---------- */
  function camera(sc, C, t, W, H) {
    const N = C.n, three = sc.style !== '2d';
    let minX = 1e9, maxX = -1e9, cz = 0, nz = 0;
    for (let k = -3; k <= 3; k++) {
      const tt = MX(0, t + k * 0.2); let act = [];
      for (let i = 0; i < N; i++) { const sg = C.chars[i].segs.find((s) => s.s0 <= tt && tt < s.s1); if (sg && sg.act !== 'idle' && sg.act !== 'look' && sg.act !== 'turn') act.push(i); if (sg && sg.tgt >= 0 && sg.act !== 'turn' && sg.act !== 'look' && act.indexOf(sg.tgt) < 0) act.push(sg.tgt); }
      if (!act.length || sc.cam === 'wide') act = sc.chars.map((_, i) => i);
      act.forEach((i) => { const p = C.posAt(i, tt); minX = MN(minX, p.x); maxX = MX(maxX, p.x); cz += p.z; nz++; });
    }
    const cx = (minX + maxX) / 2; cz = nz ? cz / nz : 0;
    let focus = 0, shake = 0; if (sc.cam === 'close') focus = 0.75; else if (sc.cam !== 'wide') C.hits.forEach((h) => { focus = MX(focus, Math.exp(-(((t - h.t) / 0.55) ** 2))); shake = MX(shake, Math.exp(-(((t - h.t) / 0.09) ** 2))); });
    if (sc.cam === 'wide') shake = 0;
    const span = MX(3.6, (maxX - minX) + 2.6) * (sc.cam === 'wide' ? 1.25 : 1), z = 1 + 0.65 * focus, sk = shake * 0.02 * H;
    const shx = sin(t * 83) * sk, shy = cos(t * 71) * sk;
    if (!three) {
      const scale = MN(W / span, H / 2.5) * (1 + 0.38 * focus), gy = H * 0.8 + H * 0.42 * focus;
      return { three: false, scale, hz: gy - H * 0.2 * (1 - 0.5 * focus), pan: cx * scale, project: (q) => [W / 2 + (q[0] - cx) * scale + shx, gy - q[1] * scale - q[2] * scale * 0.08 + shy, -q[2]], rad: (q, r) => r * scale, cx, gy, sc: scale, camDir: [0, 0, 1], pos: [cx, 1, 20] };
    }
    const yaw = 0.06 + 0.3 * sin(t * 0.4) - 0.12 * focus, pitch = 0.16 + 0.03 * focus, dist = (MX(4.4, span * 0.7 + 1.6)) / z, tg = [cx, 0.9 + 0.35 * focus, cz];
    const Cp = [tg[0] + dist * sin(yaw) * cos(pitch), tg[1] + dist * sin(pitch), tg[2] + dist * cos(yaw) * cos(pitch)];
    const F = nrm(sub(tg, Cp)), Rv = nrm(cross(F, [0, 1, 0])), Uv = cross(Rv, F), f = (H / 2) / Math.tan(0.34);
    const project = (q) => { const v = sub(q, Cp), zc = MX(0.05, dot(v, F)), s = f / zc; return [W / 2 + dot(v, Rv) * s + shx, H / 2 - dot(v, Uv) * s + shy, zc]; };
    return { three: true, hz: H / 2 - f * Math.tan(pitch) + shy, pan: yaw * W * 0.9 + cx * f / dist * 0.4, project, rad: (q, r) => r * f / MX(0.05, dot(sub(q, Cp), F)), sc: f / dist, camDir: nrm(sub(Cp, tg)), pos: Cp, F, Rv, Uv, f, W, H, yaw, cx };
  }

  /* ---------- tła ---------- */
  const rep = (W, sp, off, fn) => { for (let i = Math.floor((off - sp) / sp); i * sp - off < W + sp; i++) fn(i * sp - off, i); };
  const grad = (x, W, y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); x.fillStyle = g; };
  const hills = (x, W, hz, amp, base, col, par, off, ph) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, hz); for (let px = 0; px <= W + 20; px += 20) x.lineTo(px, hz - base - amp * (sin((px + off * par) * 0.004 + ph) * 0.6 + sin((px + off * par) * 0.011 + ph * 2) * 0.4)); x.lineTo(W, hz); x.closePath(); x.fill(); };
  const sun = (x, cx, cy, r, c1, c2) => { const g = x.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6); g.addColorStop(0, c1); g.addColorStop(0.35, c2); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 2.6, 0, 7); x.fill(); x.fillStyle = c1; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
  const BGS = {
    park: { n: 'Park', sky: ['#69b8f5', '#d4efff'], gnd: ['#6dbb52', '#3f8a37'], line: 'rgba(255,255,255,.12)', draw(x, W, H, hz, sc, pan, t) {
      sun(x, W * 0.78, hz - H * 0.32, sc * 0.35, '#fff6c8', 'rgba(255,230,140,.5)');
      rep(W, sc * 5, pan * 0.15 + t * 6, (px, i) => { x.fillStyle = 'rgba(255,255,255,.85)'; const y = hz - H * (0.32 + hash(i) * 0.14); for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(px + k * sc * 0.45, y + (k % 2) * 6, sc * 0.55, sc * 0.26, 0, 0, 7); x.fill(); } });
      hills(x, W, hz, H * 0.07, H * 0.04, '#8fd17a', 0.15, pan, 1); hills(x, W, hz, H * 0.06, H * 0.0, '#5fae4a', 0.3, pan, 3);
      rep(W, sc * 3.2, pan * 0.55, (px, i) => { const th = sc * (1.3 + hash(i) * 0.9), y = hz + 2; x.fillStyle = '#6b4a2e'; x.fillRect(px - sc * 0.07, y - th, sc * 0.14, th); x.fillStyle = hash(i + 9) > 0.5 ? '#2f8f3a' : '#3aa046'; x.beginPath(); x.arc(px, y - th, sc * 0.55, 0, 7); x.arc(px - sc * 0.35, y - th + sc * 0.2, sc * 0.4, 0, 7); x.arc(px + sc * 0.35, y - th + sc * 0.2, sc * 0.4, 0, 7); x.fill(); }); } },
    sunset: { n: 'Zachód słońca', sky: ['#2b1a5e', '#e8556f', '#ffc371'], gnd: ['#47264f', '#241335'], line: 'rgba(255,190,120,.16)', draw(x, W, H, hz, sc, pan, t) {
      sun(x, W * 0.5 - pan * 0.03, hz - sc * 0.15, sc * 0.9, '#fff1b8', 'rgba(255,150,80,.55)');
      hills(x, W, hz, H * 0.1, H * 0.02, '#5b2a63', 0.12, pan, 2); hills(x, W, hz, H * 0.08, H * 0.0, '#3a1a4a', 0.3, pan, 5);
      rep(W, sc * 6, pan * 0.2 + t * 18, (px, i) => { x.strokeStyle = 'rgba(30,10,40,.8)'; x.lineWidth = 2; const y = hz - H * (0.3 + hash(i) * 0.2); x.beginPath(); x.moveTo(px - 8, y); x.quadraticCurveTo(px - 3, y - 6, px, y); x.quadraticCurveTo(px + 3, y - 6, px + 8, y); x.stroke(); }); } },
    night: { n: 'Noc w mieście', sky: ['#04061a', '#1a2266'], gnd: ['#1d2146', '#0c0f26'], line: 'rgba(120,150,255,.14)', draw(x, W, H, hz, sc, pan, t) {
      for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + 0.6 * hash(i + 3) * (0.6 + 0.4 * sin(t * 2 + i))})`; x.fillRect(hash(i) * W, hash(i + 40) * hz * 0.85, 2, 2); }
      x.fillStyle = '#f6f1d3'; x.beginPath(); x.arc(W * 0.8 - pan * 0.02, hz - H * 0.4, sc * 0.35, 0, 7); x.fill(); x.fillStyle = '#1a2266'; x.beginPath(); x.arc(W * 0.8 - pan * 0.02 + sc * 0.12, hz - H * 0.4 - sc * 0.05, sc * 0.32, 0, 7); x.fill();
      [[0.25, '#0d1030'], [0.55, '#131845']].forEach(([par, col], L) => rep(W, sc * 1.4, pan * par, (px, i) => { const bh = sc * (1.4 + hash(i + L * 7) * 2.4), bw = sc * 1.2; x.fillStyle = col; x.fillRect(px - bw / 2, hz - bh, bw, bh + 3); for (let wy = hz - bh + 10; wy < hz - 8; wy += sc * 0.3) for (let wx = px - bw / 2 + 8; wx < px + bw / 2 - 10; wx += sc * 0.26) if (hash(wx * 0.1 + wy * 0.3 + i) > 0.55) { x.fillStyle = hash(wx + wy) > 0.5 ? '#ffd86b' : '#ff9ad5'; x.fillRect(wx, wy, sc * 0.1, sc * 0.14); } })); } },
    street: { n: 'Ulica', sky: ['#a9c7e6', '#e9f2fb'], gnd: ['#5a5f6b', '#3a3e48'], line: 'rgba(255,255,255,.2)', draw(x, W, H, hz, sc, pan, t) {
      [[0.2, '#8d9bb0', 0], [0.45, '#6e7c93', 5]].forEach(([par, col, sd]) => rep(W, sc * 1.8, pan * par, (px, i) => { const bh = sc * (2 + hash(i + sd) * 2.2), bw = sc * 1.6; x.fillStyle = col; x.fillRect(px - bw / 2, hz - bh, bw, bh + 3); x.fillStyle = 'rgba(255,255,255,.55)'; for (let wy = hz - bh + 12; wy < hz - 14; wy += sc * 0.42) for (let wx = px - bw / 2 + 10; wx < px + bw / 2 - 14; wx += sc * 0.4) x.fillRect(wx, wy, sc * 0.2, sc * 0.26); }));
      x.fillStyle = '#8b8f99'; x.fillRect(0, hz, W, H * 0.025); } },
    beach: { n: 'Plaża', sky: ['#4cb8ff', '#d9f4ff'], gnd: ['#f2d79a', '#d9b46c'], line: 'rgba(255,255,255,.18)', draw(x, W, H, hz, sc, pan, t) {
      sun(x, W * 0.2 - pan * 0.02, hz - H * 0.3, sc * 0.3, '#fffbe0', 'rgba(255,240,170,.5)');
      grad(x, W, hz - H * 0.09, hz, ['#2aa3d6', '#1b84bd']); x.fillRect(0, hz - H * 0.09, W, H * 0.09);
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; for (let r = 0; r < 4; r++) { x.beginPath(); for (let px = 0; px <= W; px += 12) x.lineTo(px, hz - H * (0.015 + 0.02 * r) + sin(px * 0.02 + t * 2 + r) * 3); x.stroke(); }
      rep(W, sc * 5, pan * 0.5, (px, i) => { const th = sc * (1.8 + hash(i) * 0.6), y = hz + H * 0.03; x.strokeStyle = '#6b4a2e'; x.lineWidth = sc * 0.1; x.beginPath(); x.moveTo(px, y); x.quadraticCurveTo(px + sc * 0.2, y - th * 0.5, px + sc * 0.05, y - th); x.stroke(); x.fillStyle = '#2f9e4f'; for (let k = 0; k < 6; k++) { const a = k / 6 * 7 + sin(t + i) * 0.1; x.beginPath(); x.ellipse(px + sc * 0.05 + cos(a) * sc * 0.4, y - th + sin(a) * sc * 0.2, sc * 0.45, sc * 0.1, a, 0, 7); x.fill(); } }); } },
    room: { n: 'Pokój', sky: ['#e7d9c4', '#d7c3a5'], gnd: ['#b5834f', '#8a5d33'], line: 'rgba(60,30,10,.22)', draw(x, W, H, hz, sc, pan, t) {
      x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, hz - H * 0.03, W, H * 0.03);
      rep(W, sc * 4.5, pan * 0.9, (px, i) => { x.fillStyle = '#bde4ff'; x.fillRect(px - sc * 0.8, hz - sc * 2.3, sc * 1.6, sc * 1.5); x.strokeStyle = '#fff'; x.lineWidth = sc * 0.07; x.strokeRect(px - sc * 0.8, hz - sc * 2.3, sc * 1.6, sc * 1.5); x.beginPath(); x.moveTo(px, hz - sc * 2.3); x.lineTo(px, hz - sc * 0.8); x.moveTo(px - sc * 0.8, hz - sc * 1.55); x.lineTo(px + sc * 0.8, hz - sc * 1.55); x.stroke(); x.fillStyle = hash(i) > 0.5 ? '#c85b5b' : '#5b8fc8'; x.fillRect(px + sc * 1.7, hz - sc * 2.1, sc * 0.7, sc * 0.9); });
      x.fillStyle = '#8a5d33'; x.fillRect(0, hz - H * 0.025, W, H * 0.025); } },
    stadium: { n: 'Stadion', sky: ['#0f1a3d', '#34508f'], gnd: ['#3da34d', '#2a7a37'], line: 'rgba(255,255,255,.35)', draw(x, W, H, hz, sc, pan, t) {
      grad(x, W, hz - H * 0.3, hz, ['#1b2142', '#2b3566']); x.fillRect(0, hz - H * 0.3, W, H * 0.3);
      for (let r = 0; r < 5; r++) for (let px = 0; px < W; px += sc * 0.16) { const wx = px + pan * 0.3; x.fillStyle = `hsl(${Math.floor(hash(Math.floor(wx / (sc * 0.16)) + r * 91) * 360)},65%,${55 + 10 * sin(t * 3 + px)}%)`; x.fillRect(px, hz - H * (0.06 + 0.05 * r), sc * 0.1, sc * 0.1); }
      rep(W, sc * 4, pan * 0.3, (px) => { x.fillStyle = '#fff'; x.fillRect(px - 3, hz - H * 0.42, 6, H * 0.12); const g = x.createRadialGradient(px, hz - H * 0.42, 2, px, hz - H * 0.42, sc * 1.4); g.addColorStop(0, 'rgba(255,255,230,.8)'); g.addColorStop(1, 'rgba(255,255,230,0)'); x.fillStyle = g; x.fillRect(px - sc * 1.4, hz - H * 0.42 - sc * 1.4, sc * 2.8, sc * 2.8); }); } },
    studio: { n: 'Studio', sky: ['#2c3150', '#5a6396'], gnd: ['#252a44', '#171b30'], line: 'rgba(140,160,255,.18)', draw(x, W, H, hz, sc, pan) { const g = x.createRadialGradient(W / 2, hz - H * 0.15, 10, W / 2, hz - H * 0.15, W * 0.55); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, hz); } },
    space: { n: 'Kosmos', sky: ['#05030f', '#1b0f3d'], gnd: ['#1a1440', '#09061c'], line: 'rgba(110,255,230,.28)', draw(x, W, H, hz, sc, pan, t) {
      for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + 0.7 * hash(i + 5)})`; x.fillRect(((hash(i) * W * 1.3 - pan * (0.05 + 0.1 * hash(i + 2))) % W + W) % W, hash(i + 40) * hz, 1 + hash(i + 7) * 1.8, 1 + hash(i + 7) * 1.8); }
      const px = W * 0.7 - pan * 0.04, py = hz - H * 0.32, r = sc * 0.8; const g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r); g.addColorStop(0, '#ff9ad5'); g.addColorStop(1, '#5b2a9c'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,220,255,.6)'; x.lineWidth = 3; x.beginPath(); x.ellipse(px, py, r * 1.6, r * 0.35, -0.3, 0, 7); x.stroke(); } },
    snow: { n: 'Śnieg', sky: ['#8fb0d3', '#e9f2fb'], gnd: ['#f4f8fc', '#cfdcec'], line: 'rgba(100,140,190,.2)', draw(x, W, H, hz, sc, pan, t) {
      hills(x, W, hz, H * 0.12, H * 0.05, '#dce8f5', 0.12, pan, 4); hills(x, W, hz, H * 0.08, H * 0.0, '#f2f7fc', 0.3, pan, 8);
      rep(W, sc * 2.4, pan * 0.5, (px, i) => { const th = sc * (1.4 + hash(i) * 0.9); x.fillStyle = '#2a6b4b'; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(px, hz - th + k * th * 0.28 - th * 0.02); x.lineTo(px - sc * (0.35 + k * 0.17), hz - th * 0.55 + k * th * 0.28); x.lineTo(px + sc * (0.35 + k * 0.17), hz - th * 0.55 + k * th * 0.28); x.closePath(); x.fill(); } });
      x.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 70; i++) { x.beginPath(); x.arc((hash(i) * W + sin(t + i) * 12 - pan * 0.1) % W, ((hash(i + 30) * H + t * (40 + hash(i + 9) * 50)) % H), 1.5 + hash(i + 4) * 2, 0, 7); x.fill(); } } },
  };
  const BG_LIST = Object.keys(BGS);

  /* ---------- rysowanie postaci ---------- */
  function buildParts(J, look, P) {
    const r = B, c = look, rob = c.hs === 'robot', skin = c.skin, sh = c.shirt, pa = c.pants, shoe = rob ? '#1e293b' : '#1f1f2b', parts = [];
    const cap = (a, b, rad, col, tag) => parts.push({ t: 'c', a: a.slice(), b: b.slice(), r: rad, col, tag });
    const sph = (a, rad, col, tag) => parts.push({ t: 's', a: a.slice(), b: a.slice(), r: rad, col, tag });
    for (const k of ['L', 'R']) {
      cap(J['hp' + k], J['kn' + k], r.legR + 0.01, pa); cap(J['kn' + k], J['an' + k], r.legR, pa); cap(J['an' + k], J['to' + k], 0.065, shoe);
      cap(J['sh' + k], J['el' + k], r.armR + 0.006, sh); cap(J['el' + k], J['wr' + k], r.armR - 0.004, rob ? '#8fa0b3' : skin); sph(J['wr' + k], 0.058, rob ? '#8fa0b3' : skin);
    }
    cap(J.pel, J.chest, r.torsoR, sh, 'torso'); cap(J.pel, mix3(J.pel, J.chest, 0.35), r.torsoR - 0.015, pa); sph(J.pel, 0.115, pa);
    cap(J.chest, J.neck, 0.05, skin); sph(J.head, r.headR, skin, 'head');
    if (c.hs === 'long') cap(J.hairBack, mix3(J.hairBack, J.neck, 0.9), 0.1, c.hair, 'hairback');
    return parts;
  }
  const mix3 = (a, b, k) => lerp3(a, b, k);
  function drawChar(x, cam, i, ev, look, sc, J, P) {
    const parts = buildParts(J, look, P), flat = sc.style === '2d';
    return { parts, J, P, look, flat, ev, i };
  }
  function groundShift(items) {
    for (const it of items) {
      let mnY = 1e9; for (const p of it.parts) mnY = MN(mnY, MN(p.a[1], p.b[1]) - p.r);
      const dy = -mnY + it.P.air; if (it.ev.noGround) continue;
      it.parts.forEach((p) => { p.a[1] += dy; p.b[1] += dy; }); Object.values(it.J).forEach((v) => { if (Array.isArray(v) && v.length === 3 && v !== it.J.fwd && v !== it.J.up && v !== it.J.rgt) v[1] += dy; });
      it.dy = dy;
    }
  }
  const OUT = '#14121c';
  function paintPart(x, cam, p, flat, W) {
    const pa = cam.project(p.a), pb = cam.project(p.b), mid = lerp3(p.a, p.b, 0.5), pr = cam.rad(mid, p.r), ow = MX(1.2, pr * 0.16);
    const lit = flat ? p.col : p.col;
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (p.t === 'c') {
      x.strokeStyle = OUT; x.lineWidth = pr * 2 + ow * 2; x.beginPath(); x.moveTo(pa[0], pa[1]); x.lineTo(pb[0], pb[1]); x.stroke();
      x.strokeStyle = lit; x.lineWidth = pr * 2; x.beginPath(); x.moveTo(pa[0], pa[1]); x.lineTo(pb[0], pb[1]); x.stroke();
      if (!flat) { x.strokeStyle = mixc(typeof lit === 'string' && lit[0] === '#' ? lit : '#888888', '#ffffff', 0.28); x.globalAlpha = 0.55; x.lineWidth = pr * 0.7; x.beginPath(); x.moveTo(pa[0] - pr * 0.35, pa[1] - pr * 0.3); x.lineTo(pb[0] - pr * 0.35, pb[1] - pr * 0.3); x.stroke(); x.globalAlpha = 1; }
    } else {
      x.fillStyle = OUT; x.beginPath(); x.arc(pa[0], pa[1], pr + ow, 0, 7); x.fill();
      if (flat) { x.fillStyle = lit; x.beginPath(); x.arc(pa[0], pa[1], pr, 0, 7); x.fill(); }
      else { const g = x.createRadialGradient(pa[0] - pr * 0.35, pa[1] - pr * 0.4, pr * 0.1, pa[0], pa[1], pr); g.addColorStop(0, mixc(lit[0] === '#' ? lit : '#888888', '#ffffff', 0.35)); g.addColorStop(0.55, lit); g.addColorStop(1, mixc(lit[0] === '#' ? lit : '#888888', '#000000', 0.3)); x.fillStyle = g; x.beginPath(); x.arc(pa[0], pa[1], pr, 0, 7); x.fill(); }
    }
  }
  function drawHeadExtras(x, cam, it) {
    const { J, P, look } = it, hp = cam.project(J.head), hr = cam.rad(J.head, B.headR), cdir = cam.three ? nrm(sub(cam.pos, J.head)) : [0, 0, 1];
    const facing = dot(J.fwd, cdir), rob = look.hs === 'robot', up = [0, 0, 0];
    const topP = cam.project(add(J.head, mul(J.up, B.headR))), backP = cam.project(sub(J.head, mul(J.fwd, B.headR)));
    const ux = (topP[0] - hp[0]) / hr, uy = (topP[1] - hp[1]) / hr, bx = (backP[0] - hp[0]) / hr, by = (backP[1] - hp[1]) / hr; void up;
    /* włosy / czapka / antena */
    if (look.hs !== 'none') {
      x.save(); x.beginPath(); x.arc(hp[0], hp[1], hr, 0, 7); x.clip();
      const away = cl((-facing - 0.22) / 0.6, 0, 1);
      if (!rob) {
        x.fillStyle = look.hs === 'cap' ? '#e53935' : look.hair;
        x.beginPath(); x.arc(hp[0] + (ux * 0.95 + bx * (0.55 + away * 0.6)) * hr, hp[1] + (uy * 0.95 + by * (0.55 + away * 0.6)) * hr, hr * (1.05 + away * 0.9), 0, 7); x.fill();
        if (away > 0.5) { x.fillStyle = look.hs === 'cap' ? '#e53935' : look.hair; x.beginPath(); x.arc(hp[0], hp[1], hr, 0, 7); x.fill(); }
      }
      x.restore();
      if (look.hs === 'bun') { const bp = cam.project(add(J.top, mul(J.up, B.headR * 0.25))); x.fillStyle = OUT; x.beginPath(); x.arc(bp[0], bp[1], hr * 0.42, 0, 7); x.fill(); x.fillStyle = look.hair; x.beginPath(); x.arc(bp[0], bp[1], hr * 0.34, 0, 7); x.fill(); }
      if (look.hs === 'cap') { const f2 = cam.project(add(J.head, add(mul(J.fwd, B.headR * 1.25), mul(J.up, B.headR * 0.45)))); x.strokeStyle = OUT; x.lineWidth = hr * 0.42; x.lineCap = 'round'; x.beginPath(); x.moveTo(hp[0] + ux * hr * 0.55, hp[1] + uy * hr * 0.55); x.lineTo(f2[0], f2[1]); x.stroke(); x.strokeStyle = '#b71c1c'; x.lineWidth = hr * 0.3; x.beginPath(); x.moveTo(hp[0] + ux * hr * 0.55, hp[1] + uy * hr * 0.55); x.lineTo(f2[0], f2[1]); x.stroke(); }
      if (rob) { const ap = cam.project(add(J.top, mul(J.up, B.headR * 0.8))); x.strokeStyle = OUT; x.lineWidth = hr * 0.12; x.beginPath(); x.moveTo(topP[0], topP[1]); x.lineTo(ap[0], ap[1]); x.stroke(); x.fillStyle = '#ef4444'; x.beginPath(); x.arc(ap[0], ap[1], hr * 0.2, 0, 7); x.fill(); }
    }
    if (facing < -0.38) return;
    const eL = cam.project(J.eyeL), eR = cam.project(J.eyeR), er = hr * 0.19, vis = cl((facing + 0.38) * 3, 0, 1);
    x.save(); x.globalAlpha = vis;
    const eye = (e, side) => {
      const ex = e[0], ey = e[1]; x.lineWidth = MX(1.5, er * 0.35); x.lineCap = 'round'; x.strokeStyle = '#14121c';
      if (P.eyes === 'closed') { x.beginPath(); x.arc(ex, ey + er * 0.2, er * 0.8, 0.15 * PI, 0.85 * PI); x.stroke(); }
      else if (P.eyes === 'happy') { x.beginPath(); x.arc(ex, ey + er * 0.5, er * 0.9, 1.15 * PI, 1.85 * PI); x.stroke(); }
      else if (P.eyes === 'x') { x.beginPath(); x.moveTo(ex - er, ey - er); x.lineTo(ex + er, ey + er); x.moveTo(ex + er, ey - er); x.lineTo(ex - er, ey + er); x.stroke(); }
      else if (rob) { x.fillStyle = '#7dd3fc'; x.fillRect(ex - er, ey - er * 0.7, er * 2, er * 1.4); x.strokeRect(ex - er, ey - er * 0.7, er * 2, er * 1.4); }
      else { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, er * 1.05, er * 1.25, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#14121c'; x.beginPath(); x.arc(ex + er * 0.15, ey + er * 0.1, er * 0.6, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + er * 0.3, ey - er * 0.1, er * 0.2, 0, 7); x.fill(); }
      if (P.brow !== 0 && P.eyes !== 'x') { const sd = side, tilt = P.brow * er * 0.9; x.beginPath(); x.moveTo(ex - er * 1.2, ey - er * 1.8 - (sd > 0 ? tilt : -tilt) * 0.5); x.lineTo(ex + er * 1.2, ey - er * 1.8 + (sd > 0 ? tilt : -tilt) * 0.5); x.stroke(); }
    };
    eye(eL, 1); eye(eR, -1);
    const m = cam.project(J.mouth); x.strokeStyle = '#14121c'; x.lineWidth = MX(1.5, er * 0.32);
    if (P.mouth > 0.18) { x.fillStyle = '#7a1520'; x.beginPath(); x.ellipse(m[0], m[1] + er * 0.2, er * (0.7 + P.mouth * 0.4), er * (0.3 + P.mouth * 1.1), 0, 0, 7); x.fill(); x.stroke(); }
    else { x.beginPath(); const sm0 = P.smile; x.moveTo(m[0] - er * 1.0, m[1]); x.quadraticCurveTo(m[0], m[1] + er * 1.4 * sm0 + er * 0.1, m[0] + er * 1.0, m[1]); x.stroke(); }
    x.restore();
  }

  /* ---------- efekty ---------- */
  const FONT = '900 {S}px Bangers, Anton, Impact, "Arial Black", sans-serif';
  function star(x, cx, cy, ro, ri, n, rot) { x.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro, a = rot + i * PI / n; x.lineTo(cx + cos(a) * r, cy + sin(a) * r); } x.closePath(); }
  function fxDraw(x, cam, ev, u, t, items, W, H) {
    const it = items[ev.who]; if (!it && ev.k !== 'confetti') return;
    const jt = it ? (it.J[ev.j === 'pel' ? 'pel' : ev.j === 'chest' ? 'chest' : 'head']) : null, hp = jt ? cam.project(jt) : [W / 2, H / 2], hr = it ? cam.rad(it.J.head, B.headR) : H * 0.06;
    x.save();
    switch (ev.k) {
      case 'burst': {
        const pop = u < 0.2 ? sm(u / 0.2) * 1.25 : 1.25 - 0.25 * sm((u - 0.2) / 0.2), al = 1 - ss(u, 0.7, 1), S = hr * 2.1 * MX(0, pop), bx = hp[0] + hr * 1.5 * (it && sin(it.h) >= 0 ? 1 : -1), by = hp[1] - hr * 1.7;
        x.globalAlpha = al; x.translate(bx, by); x.rotate(-0.12); x.fillStyle = '#ffe600'; x.strokeStyle = '#d9001b'; x.lineWidth = MX(2, S * 0.08); star(x, 0, 0, S, S * 0.62, 11, 0.3); x.fill(); x.stroke();
        x.font = FONT.replace('{S}', Math.round(S * 0.62)); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = MX(3, S * 0.1); x.strokeStyle = '#7a0010'; x.fillStyle = '#fff'; x.strokeText(ev.text || 'BAM!', 0, S * 0.04); x.fillText(ev.text || 'BAM!', 0, S * 0.04); break;
      }
      case 'shock': { x.globalAlpha = (1 - u) * 0.9; x.strokeStyle = '#fff'; x.lineWidth = MX(2, hr * 0.14 * (1 - u)); x.beginPath(); x.arc(hp[0], hp[1], hr * (0.6 + u * 2.4), 0, 7); x.stroke(); for (let k = 0; k < 10; k++) { const a = k * PI / 5 + 0.2, r1 = hr * (1 + u * 1.5), r2 = r1 + hr * 0.7 * (1 - u); x.beginPath(); x.moveTo(hp[0] + cos(a) * r1, hp[1] + sin(a) * r1); x.lineTo(hp[0] + cos(a) * r2, hp[1] + sin(a) * r2); x.stroke(); } break; }
      case 'stars': { x.globalAlpha = 1 - ss(u, 0.75, 1); const cy = hp[1] - hr * 1.35; for (let k = 0; k < 4; k++) { const a = t * 7 + k * PI / 2; x.fillStyle = k % 2 ? '#ffe600' : '#ffb800'; x.strokeStyle = '#7a4b00'; x.lineWidth = 1.5; star(x, hp[0] + cos(a) * hr * 1.1, cy + sin(a) * hr * 0.32, hr * 0.28, hr * 0.12, 5, a); x.fill(); x.stroke(); } break; }
      case 'hearts': { for (let k = 0; k < 6; k++) { const v = (u * 1.2 + k / 6) % 1, px = hp[0] + sin(v * 6 + k) * hr * 1.2 + (k - 2.5) * hr * 0.35, py = hp[1] - hr * 1.2 - v * hr * 3.2, s = hr * (0.35 + 0.2 * hash(k)); x.globalAlpha = sin(PI * v); x.fillStyle = k % 2 ? '#ff4d79' : '#ff8fb0'; x.beginPath(); x.moveTo(px, py + s * 0.4); x.bezierCurveTo(px - s, py - s * 0.3, px - s * 0.5, py - s, px, py - s * 0.45); x.bezierCurveTo(px + s * 0.5, py - s, px + s, py - s * 0.3, px, py + s * 0.4); x.fill(); } break; }
      case 'tears': { const ec = [cam.project(it.J.eyeL), cam.project(it.J.eyeR)]; x.fillStyle = '#5ec8ff'; for (let e = 0; e < 2; e++) for (let k = 0; k < 3; k++) { const v = (t * 1.4 + k / 3 + e * 0.17) % 1; x.globalAlpha = 1 - v; x.beginPath(); x.ellipse(ec[e][0] + (e ? 1 : -1) * v * hr * 0.35, ec[e][1] + v * hr * 1.8, hr * 0.07, hr * 0.12, 0, 0, 7); x.fill(); } break; }
      case 'zzz': { x.fillStyle = '#e8eeff'; x.strokeStyle = '#2b3a8f'; x.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const v = (t * 0.5 + k / 3) % 1; x.globalAlpha = sin(PI * v); x.font = `900 ${Math.round(hr * (0.6 + v * 0.7))}px Bangers, Arial Black, sans-serif`; x.strokeText('Z', hp[0] + hr * (1.2 + v * 1.2), hp[1] - hr * (0.6 + v * 2)); x.fillText('Z', hp[0] + hr * (1.2 + v * 1.2), hp[1] - hr * (0.6 + v * 2)); } break; }
      case 'sweat': { x.fillStyle = '#7fd4ff'; for (let k = 0; k < 3; k++) { const v = (t * 1.2 + k / 3) % 1; x.globalAlpha = 1 - v; x.beginPath(); x.ellipse(hp[0] + (k - 1) * hr * 1.1, hp[1] - hr * 0.6 + v * hr * 1.4, hr * 0.1, hr * 0.17, 0, 0, 7); x.fill(); } break; }
      case 'steam': { for (let k = 0; k < 6; k++) { const v = (t * 1.5 + k / 6) % 1; x.globalAlpha = 0.65 * sin(PI * v); x.fillStyle = k % 2 ? '#ff5a4d' : '#ffb199'; x.beginPath(); x.arc(hp[0] + (k - 2.5) * hr * 0.4, hp[1] - hr * 1.2 - v * hr * 1.8, hr * (0.18 + 0.28 * v), 0, 7); x.fill(); } break; }
      case 'notes': { x.fillStyle = '#ffffff'; x.font = `900 ${Math.round(hr * 0.9)}px Arial, sans-serif`; for (let k = 0; k < 3; k++) { const v = (t * 0.6 + k / 3) % 1; x.globalAlpha = sin(PI * v); x.fillText(k % 2 ? '♪' : '♫', hp[0] + (k - 1) * hr * 1.4 + sin(v * 5) * hr * 0.4, hp[1] - hr * 1.2 - v * hr * 2.2); } break; }
      case 'question': { x.fillStyle = '#fff'; x.strokeStyle = '#14121c'; x.lineWidth = 3; x.font = `900 ${Math.round(hr * 1.4)}px Bangers, Arial Black, sans-serif`; x.textAlign = 'center'; x.strokeText('?', hp[0], hp[1] - hr * 1.7 + sin(t * 4) * hr * 0.1); x.fillText('?', hp[0], hp[1] - hr * 1.7 + sin(t * 4) * hr * 0.1); break; }
      case 'confetti': { x.globalAlpha = 1 - ss(u, 0.8, 1); for (let k = 0; k < 70; k++) { const v = (t * (0.5 + hash(k) * 0.5) + hash(k + 3)) % 1; x.save(); x.translate(hash(k + 9) * W, v * H); x.rotate(t * 3 + k); x.fillStyle = `hsl(${hash(k + 1) * 360},90%,60%)`; x.fillRect(-4, -2, 8, 4); x.restore(); } break; }
      case 'dust': { x.globalAlpha = 0.6 * (1 - u); x.fillStyle = '#d9d2c0'; const g = cam.project([it.J.pel[0], 0, it.J.pel[2]]); for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(g[0] + (k - 2) * hr * 0.7 * (0.5 + u), g[1] - hr * 0.2 - u * hr * 0.6, hr * (0.25 + 0.3 * u), 0, 7); x.fill(); } break; }
      case 'bubble': {
        const txt = String(ev.text || '...').slice(0, 60), fs = Math.round(hr * 0.5), x0 = hp[0], y0 = hp[1] - hr * 2.3; x.font = `800 ${fs}px Manrope, Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
        const lines = []; let cur = ''; txt.split(' ').forEach((w) => { if ((cur + ' ' + w).length > 16 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
        const wd = MX(...lines.map((l) => x.measureText(l).width)) + fs, ht = lines.length * fs * 1.15 + fs * 0.6, pop = sm(u * 6);
        x.translate(x0, y0); x.scale(pop, pop); x.fillStyle = '#fff'; x.strokeStyle = '#14121c'; x.lineWidth = 3; x.beginPath(); if (x.roundRect) x.roundRect(-wd / 2, -ht / 2, wd, ht, fs * 0.6); else x.rect(-wd / 2, -ht / 2, wd, ht); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(-fs * 0.3, ht / 2 - 1); x.lineTo(-fs * 0.1, ht / 2 + fs * 0.8); x.lineTo(fs * 0.4, ht / 2 - 1); x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillRect(-fs * 0.28, ht / 2 - 3, fs * 0.66, 4);
        x.fillStyle = '#14121c'; lines.forEach((l, i2) => x.fillText(l, 0, -ht / 2 + fs * 0.3 + fs * 0.575 + i2 * fs * 1.15)); break;
      }
      case 'ball': {
        const a = items[ev.who], b = items[ev.to]; if (!a || !b) break; const p0 = a.J.wrR, p1 = add(b.J.head, [0, -0.15, 0]), q = lerp3(p0, p1, u); q[1] += sin(PI * u) * 0.5; const bp = cam.project(q), r = cam.rad(q, 0.11);
        x.fillStyle = '#fff'; x.strokeStyle = '#14121c'; x.lineWidth = 2; x.beginPath(); x.arc(bp[0], bp[1], r, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(bp[0] - r, bp[1]); x.lineTo(bp[0] + r, bp[1]); x.moveTo(bp[0], bp[1] - r); x.lineTo(bp[0], bp[1] + r); x.stroke(); break;
      }
      case 'chair': { const g = cam.project([it.J.pel[0], 0, it.J.pel[2]]), hh = cam.rad(it.J.pel, 0.5), w = cam.rad(it.J.pel, 0.3); x.fillStyle = '#9a6a3a'; x.strokeStyle = OUT; x.lineWidth = 2; const sy = g[1] - hh + cam.rad(it.J.pel, 0.04); x.fillRect(g[0] - w, sy, w * 2, hh * 0.12); x.strokeRect(g[0] - w, sy, w * 2, hh * 0.12); x.fillRect(g[0] - w * 0.9, sy, w * 0.14, hh); x.fillRect(g[0] + w * 0.76, sy, w * 0.14, hh); break; }
      default: break;
    }
    x.restore();
  }

  /* ---------- rysowanie sceny ---------- */
  function draw(x, W, H, sc, t) {
    const C = get(sc), cam = camera(sc, C, t, W, H), bg = BGS[sc.bg] || BGS.park, hz = cam.hz;
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.shadowBlur = 0;
    grad(x, W, 0, hz, bg.sky); x.fillRect(0, 0, W, MX(hz, 0) + 1);
    bg.draw(x, W, H, hz, cam.sc, cam.pan, t);
    grad(x, W, hz, H, bg.gnd); x.fillRect(0, hz, W, H - hz);
    /* siatka podłoża */
    x.strokeStyle = bg.line; x.lineWidth = 1.5;
    if (cam.three) {
      const gx0 = Math.floor(cam.cx / 2) * 2; for (let gz = -14; gz <= 14; gz += 2) { const a = cam.project([gx0 - 40, 0, gz]), b = cam.project([gx0 + 40, 0, gz]); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
      for (let gx = gx0 - 24; gx <= gx0 + 24; gx += 2) { const a = cam.project([gx, 0, -16]), b = cam.project([gx, 0, 14]); if (a[2] > 0.3 && b[2] > 0.3) { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); } else { const b2 = cam.project([gx, 0, MN(14, -16 + (14 + 16) * 0.55)]); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b2[0], b2[1]); x.stroke(); } }
    } else { for (let k = 1; k <= 4; k++) { const y = hz + (H - hz) * (k / 5) ** 1.5; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } }
    const items = sc.chars.map((ch, i) => {
      const ev = evalChar(C, sc, i, t), J = solve(ev.P, ev), look = ch.type === 'robot' ? Object.assign({}, ROBOT, ch, { hs: 'robot' }) : ch;
      const it = drawChar(x, cam, i, ev, look, sc, J, ev.P); it.h = ev.h; return it;
    });
    groundShift(items);
    /* cienie */
    items.forEach((it) => { const g = cam.project([it.J.pel[0], 0, it.J.pel[2]]), r = cam.rad([it.J.pel[0], 0, it.J.pel[2]], 0.45) * (1 - MN(0.5, it.P.air * 0.4)); x.fillStyle = 'rgba(0,0,0,' + (0.3 - MN(0.18, it.P.air * 0.2)).toFixed(3) + ')'; x.beginPath(); x.ellipse(g[0], g[1], r, r * (cam.three ? 0.32 : 0.22), 0, 0, 7); x.fill(); });
    /* krzesła pod postaciami (wymagają pozycji) rysowane jako efekty „chair” przed częściami */
    C.fx.filter((e) => e.k === 'chair' && t >= e.t && items[e.who] && items[e.who].ev.seg && items[e.who].ev.seg.act === 'sit').forEach((e) => fxDraw(x, cam, e, 0, t, items, W, H));
    const all = []; items.forEach((it) => it.parts.forEach((p) => all.push({ it, p, d: cam.project(lerp3(p.a, p.b, 0.5))[2] + (p.tag === 'hairback' ? 0.05 : 0) + (p.tag === 'head' ? -0.02 : 0) })));
    all.sort((a, b) => b.d - a.d);
    all.forEach(({ it, p }) => { paintPart(x, cam, p, it.flat, W); if (p.tag === 'head') drawHeadExtras(x, cam, it); });
    items.forEach((it) => { if (it.P.ball) { const q = it.J[it.P.ball.hand], bp = cam.project(q), r = cam.rad(q, 0.11); x.fillStyle = '#fff'; x.strokeStyle = OUT; x.lineWidth = 2; x.beginPath(); x.arc(bp[0], bp[1] - r, r, 0, 7); x.fill(); x.stroke(); } });
    C.fx.forEach((e) => { if (e.k === 'chair') return; if (t >= e.t && t <= e.t + e.d) fxDraw(x, cam, e, cl((t - e.t) / MX(0.01, MN(e.d, 50)), 0, 1), t, items, W, H); });
    x.restore();
  }

  function sanitize(o, fallbackN) {
    if (!o || typeof o !== 'object') return null;
    const n = cl(Array.isArray(o.chars) ? o.chars.length : (fallbackN || 1), 1, 4), sc = newScene({ n });
    sc.style = o.style === '2d' ? '2d' : '3d'; sc.bg = BGS[o.bg] ? o.bg : 'park'; sc.cam = ['auto', 'wide', 'close'].includes(o.cam) ? o.cam : 'auto'; sc.prompt = String(o.prompt || '').slice(0, 800);
    if (Array.isArray(o.chars)) o.chars.slice(0, 4).forEach((c, i) => { if (!c) return; const d = sc.chars[i], col = (v, dv) => (/^#[0-9a-f]{6}$/i.test(v) ? v : dv); Object.assign(d, { name: String(c.name || d.name).slice(0, 24), type: c.type === 'robot' ? 'robot' : 'human', skin: col(c.skin, d.skin), shirt: col(c.shirt, d.shirt), pants: col(c.pants, d.pants), hair: col(c.hair, d.hair), hs: ['short', 'long', 'bun', 'cap', 'none'].includes(c.hs) ? c.hs : d.hs }); });
    const ids = sc.chars.map((c) => c.id);
    sc.steps = (Array.isArray(o.steps) ? o.steps : []).slice(0, 80).map((s) => ({ at: cl(+s.at || 0, 0, 120), dur: s.dur > 0 ? cl(+s.dur, 0.2, 15) : 0, who: ids.includes(s.who) ? s.who : ids[0], act: ACTS[s.act] ? s.act : 'idle', target: ids.includes(s.target) ? s.target : null, text: s.text ? String(s.text).slice(0, 60) : '', gap: s.gap > 0 ? cl(+s.gap, 0.3, 4) : 0 }));
    return sc;
  }
  return { ACTS, ACT_LIST, HIT_ACTS, BGS, BG_LIST, LOOKS, ROBOT, newScene, compile: get, duration, draw, sanitize, startPos, speedOf, DEF };
})();
