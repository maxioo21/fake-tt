'use strict';
/* ============================================================
   Kadr Animator — planer (opis po polsku → scenariusz), łączniki do dowolnego AI (opcjonalnie),
   panel „AI” w lewym menu i edytor sceny w inspektorze.
   Domyślnie wszystko działa lokalnie i za darmo (bez Claude i bez kredytów).
   ============================================================ */
const Planner = (() => {
  const nz = (s) => String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const VERBS = [
    ['mine', /\b(kilof\w*|wykopuj\w*|wydobywa\w*|kopie dol\w*|kopie blok\w*|kopie w ziemi)\b/], ['build', /\b(buduj\w*|zbuduj\w*|zbudowa\w*|stawia\w*|postaw\w*|stawiaj\w*)\b/], ['explode', /\b(wybuch\w*|eksplod\w*|wysadz\w*)\b/], ['sword', /\b(miecz\w*|walczy|walcz\w*|szermier\w*|tnie|atakuje)\b/],
    ['slap', /(z liscia|liscia|policzk\w*|spoliczk\w*|plaskacz\w*|z plaska)/], ['kick', /\b(kopn\w*|kopi\w*|kopie|kopa\w*|kopniak\w*)\b/],
    ['punch', /\b(uderz\w*|bije|bij\w*|wali|przywal\w*|lupi|tlucze|boksuj\w*|pieszcz\w*|cios\w*)\b/], ['push', /\b(pchn\w*|popchn\w*|pcha|popycha\w*|odpycha\w*)\b/],
    ['hug', /\b(przytul\w*|obejm\w*|usciska\w*|usciski)\b/], ['kiss', /\b(calu\w*|buziak\w*|buzi\w*)\b/], ['throw', /\b(rzuc\w*|wyrzuc\w*|rzut\w*|pilk\w*)\b/],
    ['approach', /\b(podchodz\w*|podejdz\w*|zbliza\w*|zblizy\w*|nadchodzi)\b/], ['runto', /\b(podbieg\w*|dobieg\w*)\b/], ['flee', /\b(ucieka\w*|uciek\w*|zwiewa\w*)\b/],
    ['run', /\b(biegn\w*|biega\w*|pedz\w*|sprint\w*)\b/], ['walk', /\b(idzie|ida|chodzi|chodza|spacerowa\w*|spaceruj\w*|maszeruj\w*|kroczy|przechodzi)\b/],
    ['jump', /\b(skacz\w*|skok\w*|podskakuj\w*|podskoczy\w*|hopsa\w*)\b/], ['flip', /\b(salto\w*|fikolek\w*|backflip\w*|fika\w*|koziolek\w*)\b/],
    ['spin', /\b(krec\w* sie|obraca\w* sie|wiruj\w*|piruet\w*)\b/], ['wave', /\b(macha\w*|machn\w*|wita\w*|pozdrawi\w*|zegna\w*)\b/],
    ['dance', /\b(tancz\w*|taniec|tanczy|tanc\w*)\b/], ['clap', /\b(klaszcz\w*|oklask\w*|brawa)\b/], ['laugh', /\b(smie\w*|smiej\w*|smiech\w*|chichocz\w*|rechocz\w*|parska\w*)\b/],
    ['cry', /\b(placz\w*|rozplak\w*|lzy|szlocha\w*|lkaj\w*)\b/], ['angry', /\b(zlosci\w*|wsciek\w*|zly|zla|gniewa\w*|irytuj\w*|denerwuj\w*)\b/],
    ['sit', /\b(siada\w*|usiad\w*|siedzi\w*)\b/], ['sleep', /\b(spi|spia|zasyp\w*|zasn\w*|drzem\w*)\b/], ['fall', /\b(upada\w*|przewraca\w*|pada|padaj\w*|wywraca\w*|potyka\w*|przewroci\w*)\b/],
    ['getup', /\b(wstaje|wstan\w*|podnosi sie)\b/], ['point', /\b(wskazuje|wskaz\w*|pokazuje palcem)\b/], ['nod', /\b(kiwa\w*|przytak\w*|zgadza sie)\b/],
    ['shake', /\b(kreci glowa|przeczy|zaprzecza)\b/], ['bow', /\b(klania sie|uklon\w*)\b/], ['celebrate', /\b(swietuj\w*|cieszy\w*|raduj\w*|triumf\w*|wiwat\w*|wygryw\w*|wygral\w*|zwyciez\w*)\b/],
    ['think', /\b(mysli|mysla|zastanawia\w*|medytuj\w*|rozmysla\w*)\b/], ['shout', /\b(krzycz\w*|krzyk\w*|wrzesz\w*|wola)\b/], ['shrug', /\b(wzrusz\w*|nie wie)\b/],
    ['facepalm', /\b(facepalm|lapie sie za glowe|dlon w twarz|zaslania twarz)\b/], ['scared', /\b(boi sie|przestraszy\w*|przerazi\w*|drzy|przerazon\w*|straszy\w*|wystraszy\w*)\b/],
    ['say', /\b(mowi\w*|powiedz\w*|odpowiad\w*|pyta\w*|szepcze|rozmawia\w*|gada\w*|opowiad\w*)\b/], ['look', /\b(patrzy\w*|spoglada\w*|obserwuj\w*|gapi\w*|wpatruj\w*)\b/],
    ['turn', /\b(odwraca\w*|obroc\w*|odwroci\w*)\b/], ['idle', /\b(stoi\w*|czeka\w*|stoja)\b/],
  ];
  const BGKEY = [['voxellava', /\blaw\w*|nether|piekl/], ['voxelcave', /jaskin|kopaln|podziem/], ['beach', /plaz|morz|ocean|wakacj/], ['night', /\bnoc\w*|nocy|ksiezyc/], ['sunset', /zachod\w* slonca|zachod|zmierzch|wschod/], ['street', /\bulic\w*|miast\w*|chodnik/], ['room', /pokoj|\bdom\b|\bdomu\b|mieszkan|salon|kuchni/],
    ['stadium', /stadion|boisk|mecz|pilkars|\bgol\b/], ['space', /kosmos|kosmicz|planet/], ['snow', /snieg|\bzim[aeoy]\b|zimow/], ['studio', /studio|neutraln|bialym tle/], ['park', /\bpark\w*|trawa|\blak\w*|\blas\w*/]];
  const findVerbs = (cl) => {
    const found = [];
    VERBS.forEach(([act, re]) => { const g = new RegExp(re.source, 'g'); let m; while ((m = g.exec(cl))) { found.push({ act, idx: m.index, end: m.index + m[0].length }); if (m.index === g.lastIndex) g.lastIndex++; } });
    let out = found.filter((v) => !(v.act === 'punch' && found.some((o) => o.act === 'slap' && o.idx >= v.idx && o.idx - v.idx < 24)));
    if (out.some((v) => v.act === 'throw')) out = out.filter((v) => v.act !== 'kick');
    out = out.filter((v) => !(v.act === 'kick' && found.some((o) => o.act === 'mine' && Math.abs(o.idx - v.idx) < 16)));
    out = out.filter((v) => !(v.act === 'say' && out.some((o) => o.act === 'shout' && Math.abs(o.idx - v.idx) < 12)));
    out.sort((a, b) => a.idx - b.idx);
    return out.filter((v, i) => !i || (v.idx >= out[i - 1].end - 1 && !(v.act === out[i - 1].act && v.idx - out[i - 1].idx < 24)) || (v.act !== out[i - 1].act && v.idx >= out[i - 1].end - 1));
  };
  function plan(raw) {
    const notes = [], quotes = [];
    const txt = String(raw || '').replace(/[„"“”«»]([^„"“”«»]+)[„"“”«»]/g, (_, q) => { quotes.push(q.trim()); return ' qqq' + (quotes.length - 1) + ' '; });
    const n = nz(txt).replace(/\bpo(?=(mach|skacz|tancz|biegn|biega|placz|klaszcz|smie|wskaz|krzycz|kiw|krec|patrz|mysl|spiew|kopie|kopn))/g, '');
    const NAMED = (w) => (/^(steve|steva|steav\w*|steve\w*|stiv\w*)$/.test(w) ? 'n:steve' : /^alex\w*$/.test(w) ? 'n:alex' : null);
    /* obsada */
    const words = n.split(/[^a-z0-9]+/).filter(Boolean);
    const ordMax = words.reduce((m, w) => { const i = /^pierwsz/.test(w) ? 0 : /^drug/.test(w) ? 1 : /^trzec/.test(w) ? 2 : /^czwart/.test(w) ? 3 : -1; return MX(m, i); }, -1);
    const kinds = []; words.forEach((w) => { const k = NAMED(w) || (/^(chlopak|facet|mezczyzn|gosc|pan)\w*$/.test(w) && w !== 'panie' ? 'm' : /^(dziewczyn|kobiet|laska|pani)\w*$/.test(w) ? 'f' : /^robot\w*$/.test(w) ? 'r' : /^zombi\w*$/.test(w) ? 'z' : /^szkielet\w*$/.test(w) ? 'k' : /^(potwor\w*|creeper\w*|stwor(?:ek|ki|ka|ze|em|y)?)$/.test(w) ? 'g' : null); if (k && !kinds.includes(k)) kinds.push(k); });
    let cnt = /\b(dwie|dwoje|dwoch|dwa|dwie postacie|2 postacie)\b/.test(n) ? 2 : /\b(trzy|troje|trzech|3 postacie)\b/.test(n) ? 3 : /\b(cztery|czworo|czterech|4 postacie)\b/.test(n) ? 4 : 0;
    const hasOther = /\b(drugiej|drugiego|drugiemu|drugich|niej|niego|jego|jej|go|ja|mu|jemu|ich|kogos|siebie|kolege|kolezanke|kolegi|kolezanki|kolega|przyjaciel\w*)\b/.test(n);
    let N = MX(cnt, ordMax + 1, kinds.length || 0, 1); if (hasOther && N < 2) N = 2; N = cl4(N);
    const cast = []; for (let i = 0; i < N; i++) cast.push({ k: kinds[i] || null });
    if (ordMax < 0 && kinds.length < N && !cnt) { /* brak określeń */ }
    const KL = { m: Anim.LOOKS[0], f: Anim.LOOKS[1], r: Anim.ROBOT, z: { skin: '#6fa85a', shirt: '#2d7aa8', pants: '#3b3f8f', hair: '#2a3a22', hs: 'none' }, k: { skin: '#e8e8e8', shirt: '#d9d9d9', pants: '#c4c4c4', hair: '#bbbbbb', hs: 'none' }, g: { skin: '#4ade80', shirt: '#22c55e', pants: '#16a34a', hair: '#14532d', hs: 'none' },
      'n:steve': { skin: '#c4916b', shirt: '#2aa7a7', pants: '#3a3a9c', hair: '#4a3220', hs: 'short' }, 'n:alex': { skin: '#e6b895', shirt: '#6dbb5f', pants: '#6a4a2c', hair: '#c9742b', hs: 'long' } };
    const KN = { m: 'Chłopak', f: 'Dziewczyna', r: 'Robot', z: 'Zombie', k: 'Szkielet', g: 'Potwór', 'n:steve': 'Steve', 'n:alex': 'Alex' };
    const looks = cast.map((c, i) => Object.assign({}, c.k ? KL[c.k] : Anim.LOOKS[i % 4]));
    const names = cast.map((c, i) => (c.k ? KN[c.k] : 'Postać ' + (i + 1)));
    const blockKw = /minecraft|klock\w*|blokow\w*|voxel|kosteczk\w*|z kostek|\bskin\w*/.test(n) || kinds.some((k) => k.startsWith('n:'));
    const idxOfKind = (k) => cast.findIndex((c) => c.k === k);
    /* otoczenie, styl, kamera, tempo */
    let style = /\b3d\b|trojwymiar|przestrzenn/.test(n) ? '3d' : /\b2d\b|plask|kreskowk|bajk\w*|anime|rysunk/.test(n) ? '2d' : '3d';
    let bg = 'park', bestIdx = 1e9; BGKEY.forEach(([id, re]) => { const m = re.exec(n); if (m && m.index < bestIdx) { bestIdx = m.index; bg = id; } });
    if (blockKw) { if (bg === 'park') bg = 'voxel'; else if (bg === 'night') bg = 'voxelnight'; if (bg === 'voxel' && /noc\w*|nocy/.test(n)) bg = 'voxelnight'; notes.push('Styl blokowy inspirowany grami z klockami (własne klocki — bez oficjalnych postaci, nazw i tekstur).'); }
    const cam = /z bliska|zblizeni|\bclose\b|blisko|detal/.test(n) ? 'close' : /z daleka|szerok|cala scen|szeroki/.test(n) ? 'wide' : 'auto';
    const slow = /zwolnion\w* tempie|slow ?mo|w zwolnieniu|powoli/.test(n) ? 1.7 : 1;
    const dm = /(\d+(?:[.,]\d+)?)\s*(sek\w*|s\b|minut\w*|min\b)/.exec(n), target = dm ? MX(1, Math.min(180, parseFloat(dm[1].replace(',', '.')) * (/^min/.test(dm[2]) ? 60 : 1))) : 0;
    /* klauzule */
    const clauses = n.split(/\s*(?:[.;!?]+|,|\bi potem\b|\ba potem\b|\bpotem\b|\bnastepnie\b|\bpo czym\b|\bwtedy\b|\bnagle\b|\bi\b|\ba\b|\boraz\b|\bale\b)\s*/).map((s) => s.trim()).filter(Boolean);
    const pos = cast.map((c, i) => { const sp = Anim.startPos(N, i); return [sp.x, sp.z]; }), ct = cast.map(() => 0.3), steps = [];
    let T = 0.3, lastSubj = [0], lastTarget = -1, pending = [];
    const classify = (cl) => {
      const verbs = findVerbs(cl), v0 = verbs.length ? verbs[0].idx : 1e9, men = [], re = /[a-z0-9]+/g; let m;
      while ((m = re.exec(cl))) {
        const w = m[0], at = m.index; let idx = -1, role = 'amb';
        if (/^pierwsz/.test(w)) idx = 0; else if (/^drug/.test(w)) idx = 1; else if (/^trzec/.test(w)) idx = 2; else if (/^czwart/.test(w)) idx = 3;
        if (idx >= 0 && /(ej|ego|emu|ym|ich)$/.test(w)) role = 'obj';
        if (idx < 0) {
          if (NAMED(w)) idx = idxOfKind(NAMED(w)); else if (/^(chlopak|facet|mezczyzn|gosc)\w*$/.test(w)) idx = idxOfKind('m'); else if (/^(dziewczyn|kobiet|laska|pani)\w*$/.test(w)) idx = idxOfKind('f'); else if (/^robot\w*$/.test(w)) idx = idxOfKind('r'); else if (/^zombi\w*$/.test(w)) idx = idxOfKind('z'); else if (/^szkielet\w*$/.test(w)) idx = idxOfKind('k'); else if (/^(potwor\w*|creeper\w*|stwor(?:ek|ki|ka|ze|em|y)?)$/.test(w)) idx = idxOfKind('g');
          else if (/^(on|ona|ono|oni|one)$/.test(w)) { role = 'subj'; idx = w === 'ona' ? idxOfKind('f') : w === 'on' ? idxOfKind('m') : -2; if (idx === -1) idx = -5; }
          else if (/^(go|jego|niego|mu|jemu)$/.test(w)) { role = 'obj'; idx = idxOfKind('m'); if (idx < 0) idx = -3; } else if (/^(ja|jej|niej)$/.test(w)) { role = 'obj'; idx = idxOfKind('f'); if (idx < 0) idx = -3; }
          else if (/^(postac|postaci|ludzik\w*|czlowiek\w*|bohater\w*|kolega|kolege|kolezank\w*)$/.test(w)) idx = -4;
        }
        if (idx === -1 && !/^(pierwsz|drug|trzec|czwart)/.test(w)) continue;
        if (idx === -1) continue;
        if (role === 'amb') role = at < v0 ? 'subj' : 'obj';
        men.push({ i: idx, role, at });
      }
      return { verbs, men, all: /\b(oboje|obie|obaj|wszyscy|wszystkie|razem|jednoczesnie|wspolnie|oni|one)\b/.test(cl) };
    };
    const other = (s) => { const c = []; for (let i = 0; i < N; i++) if (i !== s) c.push(i); return c; };
    clauses.forEach((cl) => {
      const { verbs, men, all } = classify(cl); const q = /qqq(\d+)/.exec(cl);
      let subj = [...new Set(men.filter((x) => x.role === 'subj' && x.i >= 0).map((x) => x.i))], tgt = (men.filter((x) => x.role === 'obj' && x.i >= 0)[0] || {}).i;
      if (tgt == null && men.some((x) => x.role === 'obj' && x.i < 0)) tgt = -9;           /* „go/ją” bez znanej płci */
      const generic = men.some((x) => x.i === -4 && x.role === 'subj');
      if (!verbs.length && q) verbs.push({ act: 'say', idx: 0 });
      if (!verbs.length) { if (subj.length) pending = pending.concat(subj); else if (/[a-z]/.test(cl) && !/^qqq/.test(cl) && cl.length > 3 && !/\b(w|na|nad|pod|przy|przez|do)\b/.test(cl.split(' ')[0]) && !/zeby|skin|minecraft|trwa|okolo|styl|animacj|stworz|zrob|prosze|chce|klock|sek\b|sekund/.test(cl)) notes.push('Nie rozpoznałem czynności w: „' + cl + '”'); return; }
      if (all) subj = cast.map((_, i) => i);
      if (!subj.length && men.some((x) => x.i === -5) && lastTarget >= 0) subj = [lastTarget];
      if (!subj.length && generic) { subj = tgt >= 0 ? other(tgt).slice(0, 1) : lastSubj.slice(); }
      if (pending.length) { subj = [...new Set(pending.concat(subj))]; pending = []; }
      if (!subj.length) subj = tgt >= 0 ? other(tgt).slice(0, 1) : tgt === -9 ? [lastSubj[0] || 0] : lastSubj.slice();
      subj = subj.filter((i) => i < N); if (!subj.length) subj = [0];
      let clauseEnd = T;
      subj.forEach((s) => {
        let at = MX(T, ct[s]);
        verbs.forEach((v, vi) => {
          let actId = v.act === 'flee' ? 'run' : v.act; const a = Anim.ACTS[actId]; if (!a) return;
          let tg = tgt != null && tgt >= 0 ? tgt : -1;
          const needsT = a.tgt || ['approach', 'runto'].includes(actId) || v.act === 'flee';
          if (needsT && tg < 0) { const o = other(s); tg = lastTarget >= 0 && lastTarget !== s ? lastTarget : (o[0] != null ? o[0] : -1); }
          if (actId === 'walk' && tgt != null && tgt >= 0) actId = 'approach'; if (actId === 'run' && tgt != null && tgt >= 0 && v.act !== 'flee') actId = 'runto';
          const A = Anim.ACTS[actId], st = { at: +at.toFixed(2), who: 'ABCD'[s], act: actId, target: tg >= 0 ? 'ABCD'[tg] : null };
          let dur = A.dur, to = null;
          if (A.mv || v.act === 'flee') {
            const from = pos[s], tp = tg >= 0 ? pos[tg] : null, sp = Anim.speedOf(A.mv || 'run');
            if (v.act === 'flee' && tp) { const dx = from[0] - tp[0], dz = from[1] - tp[1], d = Math.hypot(dx, dz) || 1; to = [from[0] + dx / d * 6, from[1] + dz / d * 6]; }
            else if (tp && (actId === 'approach' || actId === 'runto')) {
              const nx = verbs[vi + 1], ng = nx && Anim.ACTS[nx.act] && Anim.ACTS[nx.act].gap ? Anim.ACTS[nx.act].gap : A.gap, dx = tp[0] - from[0], dz = tp[1] - from[1], d = Math.hypot(dx, dz) || 1;
              to = d > ng ? [tp[0] - dx / d * ng, tp[1] - dz / d * ng] : [from[0], from[1]]; st.gap = ng;
              if (tg !== s && ct[tg] <= at) { steps.push({ at: st.at, who: 'ABCD'[tg], act: 'turn', target: 'ABCD'[s], dur: 0.6 }); ct[tg] = at + 0.6; }
            } else { const dir = tp ? [tp[0] - from[0], tp[1] - from[1]] : [Anim.startPos(N, s).face, 0], d = Math.hypot(dir[0], dir[1]) || 1, L = A.mv === 'run' ? 5 : 3; to = [from[0] + dir[0] / d * L, from[1] + dir[1] / d * L]; }
            st.to = to.map((z) => +z.toFixed(2)); dur = MX(0.4, Math.hypot(to[0] - from[0], to[1] - from[1]) / sp); pos[s] = to;
          }
          st.dur = +dur.toFixed(2);
          if (['say', 'shout'].includes(actId)) st.text = q ? quotes[+q[1]] : (actId === 'shout' ? 'HEJ!' : '');
          steps.push(st);
          let end = at + dur;
          if (A.react && tg >= 0) {
            const hit = at + A.hitAt * dur, R = Anim.ACTS[A.react]; ct[tg] = MX(ct[tg], hit + A.reactDur); end = MX(end, hit + A.reactDur * 0.9);
            if (R && R.knock) { const dx = pos[tg][0] - pos[s][0], dz = pos[tg][1] - pos[s][1], d = Math.hypot(dx, dz) || 1; pos[tg] = [pos[tg][0] + dx / d * R.knock, pos[tg][1] + dz / d * R.knock]; }
          }
          if (tg >= 0) lastTarget = tg;
          at = at + dur; ct[s] = at; clauseEnd = MX(clauseEnd, end);
        });
      });
      lastSubj = subj; T = clauseEnd + 0.15;
    });
    if (!steps.length) { notes.push('Nie rozpoznałem żadnej czynności — dodałem proste powitanie. Spróbuj np.: „pierwsza postać podchodzi do drugiej i uderza ją z liścia”.'); cast.forEach((_, i) => steps.push({ at: 0.4, who: 'ABCD'[i], act: 'wave', target: null, dur: 1.9 })); }
    if (slow !== 1) steps.forEach((s) => { s.at = +(s.at * slow).toFixed(2); s.dur = +(s.dur * slow).toFixed(2); });
    if (target) fitSteps(steps, target - 0.7);
    const scene = Anim.newScene({ n: N, looks, over: { style, bg, cam, prompt: raw } });
    scene.chars.forEach((c, i) => { c.name = names[i]; c.type = looks[i].hs === 'robot' ? 'robot' : 'human'; c.model = blockKw || ['z', 'k', 'g'].includes(cast[i].k) ? 'block' : 'round'; });
    scene.steps = steps; scene.target = target || undefined;
    const SKN = { 'n:steve': ['MHF_Steve', 'steve'], 'n:alex': ['MHF_Alex', 'alex'] };
    cast.forEach((c, i) => { const sk = SKN[c.k]; if (sk) { scene.chars[i].skinName = sk[0]; scene.chars[i].skinTex = Anim.proceduralSkinURL(sk[1]); scene.chars[i].slim = sk[1] === 'alex'; } });
    const ex = [...String(raw).matchAll(/(?:skin\w*|nick\w*|gracz\w*)\s+(?:gracza\s+|o\s+nicku\s+|nick\w*\s+)?([A-Za-z0-9_]{3,16})\b/gi)].map((m) => m[1]).filter((w) => !/^(z|do|minecraft|steve|alex|dla|oraz)$/i.test(w));
    ex.forEach((nm, j) => { const i = scene.chars.findIndex((c) => !c.skinName); if (i >= 0) { scene.chars[i].skinName = nm; scene.chars[i].model = 'block'; } });
    const report = { chars: scene.chars.map((c) => ({ name: c.name, model: c.model, skin: c.skinName || null })), style: scene.style, bg: scene.bg, target: target || 0, steps: steps.length };
    return { scene, notes, report };
  }
  const LOOP_ACTS = new Set(['wave', 'dance', 'clap', 'laugh', 'cry', 'angry', 'think', 'say', 'idle', 'scared', 'celebrate', 'shout', 'look', 'nod', 'shake', 'sleep', 'kiss', 'point', 'spin', 'jump', 'mine']);
  /* dopasowanie długości do żądanej: czynności „powtarzalne” (machanie, taniec…) rozciągają się, reszta zostaje */
  function fitSteps(steps, goal) {
    const end = steps.reduce((m, s) => MX(m, s.at + s.dur), 0); if (end <= 0 || goal <= 0.3) return;
    if (goal < end - 0.05) { const f = MX(0.45, goal / end); steps.forEach((s) => { s.at = +(s.at * f).toFixed(2); s.dur = +(s.dur * f).toFixed(2); }); return; }
    const extra = goal - end, loops = steps.filter((s) => LOOP_ACTS.has(s.act)), tot = loops.reduce((m, s) => m + s.dur, 0);
    if (!loops.length || tot <= 0) { const f = Math.min(1.6, goal / end); steps.forEach((s) => { s.at = +(s.at * f).toFixed(2); s.dur = +(s.dur * f).toFixed(2); }); return; }
    const warp = (t) => t + loops.reduce((m, s) => m + extra * (s.dur / tot) * Math.max(0, Math.min(1, (t - s.at) / s.dur)), 0);
    steps.forEach((s) => { const a = warp(s.at), b = warp(s.at + s.dur); s.at = +a.toFixed(2); s.dur = +(b - a).toFixed(2); });
  }
  const MX = Math.max, cl4 = (n) => Math.max(1, Math.min(4, n));
  const auto = (text) => {
    const n = nz(text), verbs = findVerbs(n).length, mo = Motion.plan(text);
    if (mo && !verbs) return mo;
    const r = plan(text);
    if (mo && r.notes.some((x) => /Nie rozpoznałem żadnej czynności/.test(x))) return mo;
    return r;
  };
  const verbsIn = (text) => findVerbs(nz(text)).map((v) => (v.act === 'flee' ? 'run' : v.act));
  return { plan, auto, verbsIn, EXAMPLES: [
    'Stwórz animację w stylu Minecraft, gdzie Alex pomacha do Steve’a, ze skinami z gry, około 5 sekund',
    'Odliczanie od 1 do 100 w około 3 sekundy',
    'Pasek ładowania „Wczytywanie gry” przez 5 sekund',
    'Tytuł „MÓJ FILM” z konfetti',
    'Pierwsza postać podchodzi do drugiej i uderza ją z liścia',
    'Chłopak tańczy w parku, potem skacze i robi salto',
    'Dziewczyna płacze, a chłopak podchodzi i ją przytula',
    'Robot biegnie przez plażę i macha do drugiej postaci',
    'Chłopak kopie kilofem w jaskini z klocków, potem buduje klocek',
    'Zielony potwór podchodzi do chłopaka i wybucha w świecie z klocków',
    'Szkielet walczy mieczem z zombie na klockowej łące',
    'Pierwsza postać popycha drugą, a druga upada, potem pierwsza się śmieje',
    'Facet kopie piłkę do kolegi na stadionie, potem świętuje',
    'W nocy w mieście w 2D: pierwsza postać kopie drugą, a druga upada',
  ] };
})();

/* ---------- łączniki do dowolnego AI (opcjonalne; klucze zostają tylko na Twoim urządzeniu) ---------- */
const AIProv = {
  cfg: (() => { try { return Object.assign({ provider: 'local', url: '', key: '', model: '' }, JSON.parse(localStorage.getItem('kadr.ai') || '{}')); } catch (e) { return { provider: 'local', url: '', key: '', model: '' }; } })(),
  save() { try { localStorage.setItem('kadr.ai', JSON.stringify(this.cfg)); } catch (e) { /* ok */ } },
  PROVIDERS: [
    ['local', 'Lokalny planer (bez AI, za darmo)'], ['ollama', 'Ollama (AI lokalnie na Twoim komputerze, za darmo)'], ['gemini', 'Google Gemini (darmowy klucz API)'],
    ['openai', 'OpenAI-kompatybilne (OpenRouter, Groq, LM Studio, OpenAI…)'],
  ],
  DEFAULTS: { ollama: { url: 'http://localhost:11434', model: 'llama3.1' }, gemini: { url: '', model: 'gemini-2.0-flash' }, openai: { url: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct:free' } },
  system() {
    const acts = Anim.ACT_LIST.filter((q) => !['slapped', 'punched', 'kicked', 'pushed', 'hit', 'hugged'].includes(q));
    return `You are the animation director of a small 2D/3D animation engine. Convert the user's request (any language) into ONE JSON object and nothing else. Think carefully and follow EVERY detail of the request (names, order of actions, style, duration, numbers, texts). First decide "kind":
(A) "characters": people/robots/mobs acting in a scene. Schema: {"kind":"characters","understanding":"one sentence in Polish","assumptions":["..."],"style":"3d"|"2d","bg":${JSON.stringify(Anim.BG_LIST)},"cam":"auto"|"wide"|"close","chars":[{"id":"A","name":"...","type":"human"|"robot","mcSkin":"Minecraft nickname, or steve, or alex, or null","skin":"#rrggbb skin tone","shirt":"#rrggbb","pants":"#rrggbb","hair":"#rrggbb","hs":"short"|"long"|"bun"|"cap"|"none","model":"round"|"block"}],"steps":[{"at":seconds,"dur":seconds,"who":"A","act":${JSON.stringify(acts)},"target":"B"|null,"text":"optional speech"}]}.
Rules: 1-4 characters with ids A,B,C,D; two characters start ~4.6 m apart facing each other; walking 1.45 m/s, running 3.6 m/s ("approach" from the start takes ~3 s). Different characters' steps may overlap; one character's steps must not. Acts needing a target (approach, slap, punch, kick, push, hug, kiss, throw, point, look, shout, sword) must set "target". Victim reactions are automatic — do NOT add them. For a block-world / voxel-game / Minecraft-like request use "model":"block", a voxel* background, and for Minecraft's Steve/Alex set "mcSkin":"steve"/"alex" (the app downloads the real skin by nickname). Respect the requested total duration: all steps must end about 0.7 s before it. If no listed act fits, invent a NEW move: act "custom", "n":"short name", "dur":seconds, "keys": 3-10 keyframes [{"t":0..1,"lean":rad,"twist":rad,"roll":rad,"hp":rad,"hy":rad,"hr":rad,"rootY":m,"air":m,"bp":rad,"L":[pitch,roll,elbow],"R":[pitch,roll,elbow],"LL":[pitch,roll,knee],"RL":[pitch,roll,knee],"eyes":"open|closed|happy|x","mouth":0..1,"smile":-1..1,"brow":-1..1}] (radians; arm pitch forward +, arm roll outward + (2.5 = overhead), leg pitch forward +, knee flex +, lean forward +, hp + = nod, bp -1.5 = lying on the back).
(B) "motion": motion graphics — counters, countdowns, timers, progress/loading bars, titles, quotes, charts, particles, abstract shapes, anything flat 2D. Schema: {"kind":"motion","understanding":"...","assumptions":[],"dur":seconds,"bg":{"type":"gradient","colors":["#hex",...],"angle":deg},"bgfx":[{"type":"stars|bokeh|rays|grid|vignette","count":n,"color":"css"}],"layers":[{"type":"text|rect|circle|line|ring|bar|emoji|poly|particles","at":sec,"dur":sec,"x":0..1,"y":0..1,"opacity":1,"rot":deg,"scale":1,"copies":n,"blend":"lighter"}]}.
Every numeric property may be a number or an EXPRESSION string evaluated each frame. Variables: t (scene seconds), u (t/dur), lt (seconds since layer start), lu (0..1 over the layer's life), i (copy index), n (copies), f (i/(n-1)), W, H. Functions: sin cos abs min max floor round sqrt pow lerp(a,b,k) clamp(v,a,b) map(v,a,b,c,d) fract mod ease easeIn easeOut easeInOut easeOutBack easeOutBounce easeOutElastic rand(seed) noise(x) hsl(h,s,l) pad(n,len) fmt(n) pct(v) time(sec) timecc(sec) typed(str,k) upper. Operators + - * / % ** < > <= >= == != && || ?: . Text uses {expression} templates, e.g. "{round(lerp(1,100,lu))}". Colors can be an expression when prefixed with "=", e.g. "=hsl(lt*90,90,60)". Layer props: text{text,size(fraction of height),color,font,weight,glow,glowColor,stroke{w,color},spacing,align}; rect{w,h,radius,color,color2}; circle{r,color,fill,stroke{w,color}}; line{x2,y2,width}; ring{r,width,value,trackColor}; bar{w,h,value,trackColor,radius}; emoji{char,size}; poly{points:[[x,y],...] in height units relative to the center,closed}; particles{count,life,speed,gravity,size,shape:circle|square|star,direction:up|down|burst|out,spreadX,spreadY,colors:[...]}. Positions are fractions of the frame (0..1). Fonts: ${Motion.FONTS.join(', ')}. Make it polished: easing, glow, secondary elements.
Output valid JSON only.`;
  },
  reviewSystem() { return 'You are a meticulous reviewer of animation scenarios. You get the USER REQUEST and a DRAFT JSON built for the animation engine described earlier. Check EVERY requirement against the draft: characters and their names/skins, the order and meaning of actions, targets, style, background, duration (steps should end ~0.7 s before it), numbers and texts. Fix every mismatch, keep the same JSON schema (kind characters or motion) and return the corrected COMPLETE JSON only. If the draft is already perfect, return it unchanged.'; },
  /* w aplikacji desktopowej zapytania idą przez proces główny (bez blokad CORS); w przeglądarce zwykły fetch */
  async net(url, opt = {}, ms = 60000) {
    const nat = window.kadrNative;
    if (nat && nat.fetch) {
      const r = await nat.fetch(url, { method: opt.method, headers: opt.headers, body: opt.body, timeout: ms });
      return new Response([101, 204, 205, 304].includes(r.status) ? null : r.body, { status: r.status, statusText: r.statusText, headers: r.headers });
    }
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms);
    try { return await fetch(url, Object.assign({}, opt, { signal: ctl.signal })); } finally { clearTimeout(tm); }
  },
  niceError(e) {
    const m = String((e && e.message) || e), raw = m.replace(/^Error invoking remote method '[^']*': (Error: )?/, '');
    if (e && e.name === 'AbortError' || /TIMEOUT/.test(raw)) return 'przekroczono czas oczekiwania';
    if (/ECONNREFUSED/.test(raw)) return 'nikt nie odpowiada pod tym adresem (czy Ollama / serwer jest uruchomiony?)';
    if (/ENOTFOUND|EAI_AGAIN/.test(raw)) return 'nie znaleziono serwera — sprawdź adres i internet';
    if (/Failed to fetch|NetworkError|Load failed|FETCH_FAILED/.test(raw)) return window.kadrNative ? 'brak połączenia z internetem lub serwerem' : 'brak połączenia lub blokada CORS (użyj aplikacji desktopowej)';
    return raw;
  },
  async fetchJson(url, opt, ms = 60000) {
    try { const r = await this.net(url, opt, ms); if (!r.ok) { let b = ''; try { b = (await r.text()).slice(0, 160); } catch (e) { /* ok */ } throw new Error('HTTP ' + r.status + (b ? ' ' + b : '')); } return await r.json(); }
    catch (e) { throw new Error(this.niceError(e)); }
  },
  async complete(userText, sysOverride) {
    const c = this.cfg, d = this.DEFAULTS[c.provider] || {}, model = c.model || d.model, sys = sysOverride || this.system();
    if (c.provider === 'ollama') { const j = await this.fetchJson((c.url || d.url).replace(/\/$/, '') + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, stream: false, format: 'json', messages: [{ role: 'system', content: sys }, { role: 'user', content: userText }] }) }, 180000); return j.message && j.message.content; }
    if (c.provider === 'gemini') { if (!c.key) throw new Error('podaj klucz API Gemini'); const j = await this.fetchJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(c.key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: [{ text: userText }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } }) }); return j.candidates && j.candidates[0] && j.candidates[0].content.parts[0].text; }
    if (c.provider === 'openai') {
      const url = (c.url || d.url).replace(/\/$/, '') + '/chat/completions', hd = { 'Content-Type': 'application/json' }; if (c.key) hd.Authorization = 'Bearer ' + c.key;
      const body = { model, temperature: 0.4, messages: [{ role: 'system', content: sys }, { role: 'user', content: userText }] };
      let j; try { j = await this.fetchJson(url, { method: 'POST', headers: hd, body: JSON.stringify(Object.assign({ response_format: { type: 'json_object' } }, body)) }); } catch (e) { if (!/HTTP 4/.test(e.message)) throw e; j = await this.fetchJson(url, { method: 'POST', headers: hd, body: JSON.stringify(body) }); }
      return j.choices && j.choices[0] && j.choices[0].message.content;
    }
    throw new Error('nie wybrano dostawcy AI');
  },
  async plan(text) {
    const parse = (out) => { const m = /\{[\s\S]*\}/.exec(String(out || '')); if (!m) throw new Error('odpowiedź nie jest JSON-em'); return JSON.parse(m[0]); };
    const build = (o) => {
      if (o && (o.kind === 'motion' || (!o.chars && o.layers))) { const sc = Motion.sanitize(o); if (!sc) throw new Error('AI zwróciło pustą grafikę'); sc.prompt = text; return sc; }
      const sc = Anim.sanitize(o); if (!sc || !sc.steps.length) throw new Error('AI nie zaplanowało żadnych czynności'); sc.prompt = text; return sc;
    };
    let o = parse(await this.complete(text)), sc = build(o), reviewed = false;
    if (this.cfg.review !== false) { try { const o2 = parse(await this.complete('USER REQUEST:\n' + text + '\n\nDRAFT JSON:\n' + JSON.stringify(o), this.reviewSystem())), sc2 = build(o2); sc = sc2; o = o2; reviewed = true; } catch (e) { /* zostaje szkic */ } }
    sc.understanding = String(o.understanding || '').slice(0, 500); sc.assumptions = Array.isArray(o.assumptions) ? o.assumptions.slice(0, 6).map((q) => String(q).slice(0, 160)) : []; sc.reviewed = reviewed;
    return sc;
  },
  /* obraz AI z darmowego Pollinations (bez klucza); wymaga internetu */
  async image(prompt, w = 1280, h = 720) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random() * 1e6)}`;
    try { const r = await this.net(url, {}, 90000); if (!r.ok) throw new Error('HTTP ' + r.status); const b = await r.blob(); if (!/^image\//.test(b.type)) throw new Error('to nie obraz'); return b; }
    catch (e) { throw new Error(this.niceError(e)); }
  },
};

/* ---------- skiny (układ 64×64 jak w grach z klockami) ---------- */
const SkinLib = {
  hosts: { api: 'https://api.mojang.com', session: 'https://sessionserver.mojang.com', alt: 'https://minotar.net' },
  blobURL(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('nie udało się odczytać obrazu')); r.readAsDataURL(b); }); },
  /* oficjalne serwery Mojang: nick → identyfikator → profil → adres tekstury skina */
  async official(nick) {
    const r1 = await AIProv.fetchJson(`${this.hosts.api}/users/profiles/minecraft/${encodeURIComponent(nick)}`, {}, 20000);
    if (!r1 || !r1.id) throw new Error('nie ma gracza o takim nicku');
    const r2 = await AIProv.fetchJson(`${this.hosts.session}/session/minecraft/profile/${r1.id}`, {}, 20000), tex = ((r2 && r2.properties) || []).find((q) => q.name === 'textures');
    if (!tex) throw new Error('profil bez skina');
    const j = JSON.parse(atob(tex.value)), sk = j.textures && j.textures.SKIN; if (!sk || !sk.url) throw new Error('gracz nie ma własnego skina');
    const r = await AIProv.net(String(sk.url).replace(/^http:\/\/textures\.minecraft\.net/, 'https://textures.minecraft.net'), {}, 20000); if (!r.ok) throw new Error('HTTP ' + r.status);
    return { url: await this.blobURL(await r.blob()), slim: !!(sk.metadata && sk.metadata.model === 'slim'), source: 'Mojang' };
  },
  async mirror(nick) { const r = await AIProv.net(`${this.hosts.alt}/skin/${encodeURIComponent(nick)}.png`, {}, 20000); if (!r.ok) throw new Error('HTTP ' + r.status); const b = await r.blob(); if (!/^image\//.test(b.type)) throw new Error('to nie obraz'); return { url: await this.blobURL(b), slim: false, source: 'Minotar' }; },
  async fetch(nick) { try { return await this.official(nick); } catch (e1) { try { return await this.mirror(nick); } catch (e2) { throw new Error(AIProv.niceError(e1)); } } },
  async fromFile(file) { if (!/^image\//.test(file.type || 'image/png')) throw new Error('to nie jest obraz PNG'); return this.blobURL(file); },
  async ready(url) { Anim.skinPrep(url); for (let i = 0; i < 60; i++) { if (Anim.skinPrep(url).ready) return true; await new Promise((r) => setTimeout(r, 50)); } return false; },
};
/* „research” skinów: dla postaci z nickiem pobieramy prawdziwy skin; bez internetu zostaje uproszczony wzór */
async function resolveSkins(scene, notes) {
  for (const ch of scene.chars) {
    if (!ch.skinName) continue;
    const kk = String(ch.skinName).toLowerCase().replace(/^mhf_/, ''); if (!ch.skinTex && (kk === 'steve' || kk === 'alex')) { ch.skinTex = Anim.proceduralSkinURL(kk); ch.slim = kk === 'alex'; ch.skinName = 'MHF_' + (kk === 'steve' ? 'Steve' : 'Alex'); ch.model = 'block'; }
    try { const r = await SkinLib.fetch(ch.skinName); ch.skinTex = r.url; ch.slim = r.slim; notes.push(`Skin „${ch.name}” (${ch.skinName}): pobrałem prawdziwy skin z serwerów ${r.source}.`); }
    catch (e) { notes.push(ch.skinTex ? `Skin „${ch.name}”: nie udało się go pobrać (${e.message}) — używam uproszczonego wzoru własnego.` : `Skin „${ch.skinName}”: nie udało się go pobrać (${e.message}). Wgraj plik .png ze skinem w „Edytuj → Scena”.`); }
    if (ch.skinTex) await SkinLib.ready(ch.skinTex);
  }
}
/* przyciski skina dla jednej postaci */
function skinControls(ch, after) {
  const fi = h('input', { type: 'file', accept: 'image/png,image/*', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { ch.skinTex = await SkinLib.fromFile(f); ch.skinName = ''; ch.model = 'block'; await SkinLib.ready(ch.skinTex); const sk = Anim.skinPrep(ch.skinTex); ch.slim = sk.slim; toast('Wgrano skin „' + f.name + '”'); } catch (er) { toast(er.message, 'err'); } after(); } });
  const nickIn = h('input', { type: 'text', class: 'txt', placeholder: 'nick gracza, np. Notch', value: ch.skinName && !/^MHF_/.test(ch.skinName) ? ch.skinName : '' });
  return h('div', { class: 'skinrow' }, fi,
    F.btn(ch.skinTex ? 'Zmień skin (.png)' : 'Wgraj skin (.png)', () => fi.click(), 'sm', 'upload'),
    h('div', { class: 'nickrow' }, nickIn, F.btn('Pobierz skin', async () => { const nick = nickIn.value.trim().replace(/[^A-Za-z0-9_]/g, ''); if (!nick) { toast('Wpisz nick gracza (np. Notch, MHF_Steve, MHF_Alex)'); return; } toast('Pobieram skin…'); try { const r = await SkinLib.fetch(nick); ch.skinTex = r.url; ch.slim = r.slim; ch.skinName = nick; ch.model = 'block'; await SkinLib.ready(r.url); toast('Pobrano skin: ' + nick); } catch (er) { toast('Nie udało się: ' + er.message, 'err'); } after(); }, 'sm', 'download')),
    ch.skinTex ? F.btn('Usuń skin', () => { ch.skinTex = ''; ch.skinName = ''; after(); }, 'sm', 'x') : null);
}

/* ---------- dodawanie sceny na oś ---------- */
function addSceneClip(scene) {
  const sc = clone(scene), dur = Anim.duration(sc), lane = 'v1';
  const start = clips.some((c) => c.lane === 'v1') ? laneEnd('v1') : 0;
  const c = newClip('scene', { lane, start: resolveStart({ id: '' }, lane, start, dur), dur, scene: sc });
  c.animIn = { id: 'none', dur: 0.6 }; addClip(c); preloadScene(sc).catch(() => {}); return c;
}

/* ---------- panel „AI” ---------- */
UI.tabs.splice(UI.tabs.findIndex((t) => t.id === 'tools'), 0, { id: 'ai', label: 'AI', ic: 'bot' });
UI._ai = { target: 0, text: '', style: 'auto', bg: 'auto', cam: 'auto', model: 'auto', busy: false, scene: null, notes: [], img: '', imgBusy: false, imgMsg: '', testMsg: '' };
const _renderPanel = UI.renderPanel;
UI.renderPanel = function (keepScroll) {
  if (S.tab !== 'ai') return _renderPanel.call(this, keepScroll);
  const box = $('#panel'), sc = box.scrollTop; box.innerHTML = ''; this.pAI(box); if (keepScroll) box.scrollTop = sc;
};
/* opis zrozumiałego dla człowieka podsumowania sceny */
function describeScene(sc) {
  const out = [];
  if (sc.kind === 'motion') { out.push(`Rodzaj: grafika ruchoma · ${sc.dur.toFixed(1)} s · ${sc.layers.length} warstw.`); sc.layers.filter((l) => l.type === 'text').slice(0, 3).forEach((l) => out.push('Tekst: ' + String(l.text).slice(0, 70))); return out; }
  out.push('Postacie: ' + sc.chars.map((c) => c.name + (c.model === 'block' ? ' (klockowa' + (c.skinName ? ', skin ' + c.skinName : c.skinTex ? ', własny skin' : '') + ')' : '')).join(', '));
  out.push(`Styl: ${sc.style.toUpperCase()} · tło: ${(Anim.BGS[sc.bg] || {}).n} · kamera: ${{ auto: 'automatyczna', wide: 'szeroka', close: 'z bliska' }[sc.cam] || sc.cam}`);
  out.push(`Czas: ${Anim.duration(sc).toFixed(1)} s` + (sc.target ? ` (żądane ok. ${sc.target} s)` : ''));
  return out;
}
/* „inna wersja”: ta sama treść, ale inna kamera, tło, kolory lub czcionki */
function variantOf(sc, k) {
  const s = clone(sc);
  if (s.kind === 'motion') {
    s.bg.type = 'gradient'; const old = (s.bg.colors || [])[1] || '#fff', pal = Motion.PALS[(k * 3 + (s.prompt || '').length) % Motion.PALS.length], acc = Motion.ACC[(k + 2) % Motion.ACC.length], fonts = ['Anton', 'Bebas Neue', 'Orbitron', 'Righteous', 'Archivo Black', 'Oswald'];
    s.bg.colors = pal.slice(); s.bg.angle = (s.bg.angle || 90) + 40 * k; s.bgfx = [{ type: ['stars', 'bokeh', 'rays', 'grid'][k % 4], count: 50, color: 'rgba(255,255,255,.5)' }];
    s.layers.forEach((l, i) => { if (l.glowColor) l.glowColor = acc; if (l.type === 'bar' && l.color) l.color = acc; if (l.type === 'ring' && l.color) l.color = acc; if (l.type === 'line' && l.color) l.color = acc; if (l.type === 'text' && l.font && (l.size || 0) > 0.1) l.font = fonts[(i + k) % fonts.length]; }); void old;
    return s;
  }
  const blk = s.chars.some((c) => c.model === 'block'), pool = Anim.BG_LIST.filter((id) => (id.startsWith('voxel') ? blk : !blk)), i0 = Math.max(0, pool.indexOf(s.bg));
  s.bg = pool[(i0 + k) % pool.length]; s.cam = ['auto', 'close', 'wide'][k % 3]; if (k % 2) s.style = s.style === '3d' ? '2d' : '3d';
  return s;
}
async function preloadScene(sc) {
  if (sc.kind === 'motion') { await Motion.preload(sc); return; }
  await Promise.all(sc.chars.filter((c) => c.skinTex).map((c) => SkinLib.ready(c.skinTex)));
}
/* renderuje scenę do prawdziwego pliku wideo (MP4/WebM) — można go potem montować jak każde wideo */
async function renderSceneVideo(scene, cb) {
  if (!(window.VideoEncoder && window.VideoFrame)) throw new Error('ta przeglądarka nie koduje wideo (użyj aplikacji desktopowej, Chrome lub Edge)');
  await preloadScene(scene);
  const [W, H] = canvasSize(P.aspect, 720), fps = 30, dur = Anim.duration(scene), info = await Exporter.pickCodecs(W, H, fps, Exporter.bitrate(W, H, fps, 1), false);
  if (info.fail) throw new Error(info.label);
  const vopt = { codec: info.video.mux, width: W, height: H, frameRate: fps }, cont = info.video.container;
  const muxer = cont === 'mp4' ? new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: vopt, fastStart: 'in-memory', firstTimestampBehavior: 'offset' }) : new WebMMuxer.Muxer({ target: new WebMMuxer.ArrayBufferTarget(), video: vopt, firstTimestampBehavior: 'offset' });
  let err = null; const enc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { err = e; } }); enc.configure(info.video.cfg);
  const cv = mkCanvas(W, H), x = cv.getContext('2d'), total = Math.max(1, Math.ceil(dur * fps));
  for (let i = 0; i < total; i++) {
    if (err) throw err; Anim.draw(x, W, H, scene, i / fps);
    const vf = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) }); enc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close();
    while (enc.encodeQueueSize > 8) await sleep(4);
    if (i % 6 === 0) { if (cb) cb(i / total); await sleep(0); }
  }
  await enc.flush(); if (err) throw err; muxer.finalize();
  return { blob: new Blob([muxer.target.buffer], { type: cont === 'mp4' ? 'video/mp4' : 'video/webm' }), container: cont, w: W, h: H };
}
UI.aiGenerate = async function (variant) {
  const st = this._ai, text = st.text.trim();
  if (!text) { toast('Opisz najpierw, co mam zrobić'); return; }
  const prev = st.scene; st.busy = true; st.notes = []; st.report = null; if (!variant) { st.variantN = 0; st.scene = null; } this.renderPanel(true);
  let scene = null, base = variant && st.base ? st.base : null;
  if (!base) {
    if (AIProv.cfg.provider !== 'local') { try { scene = await AIProv.plan(text); st.notes.push(`Scenariusz ułożył zewnętrzny model AI (${AIProv.cfg.provider}${scene.reviewed ? ', po sprawdzeniu i poprawce' : ''}).`); } catch (e) { st.notes.push('AI nie odpowiedziało (' + e.message + ') — użyłem lokalnego planera.'); } }
    if (!scene) { const r = Planner.auto(text); scene = r.scene; st.notes.push(...r.notes); st.report = r.report; }
    if (scene.kind !== 'motion') {
      const have = new Set(scene.steps.map((q) => q.act)); const miss = [...new Set(Planner.verbsIn(text))].filter((a) => !have.has(a) && !(a === 'approach' && have.has('runto')));
      if (miss.length && AIProv.cfg.provider !== 'local') st.notes.push('Uwaga: w opisie widzę czynności (' + miss.map((a) => (Anim.ACTS[a] || {}).n || a).join(', ') + '), których nie ma w scenariuszu — sprawdź listę kroków.');
      if (st.style !== 'auto') scene.style = st.style; if (st.bg !== 'auto') scene.bg = st.bg; if (st.cam !== 'auto') scene.cam = st.cam; if (st.model !== 'auto') scene.chars.forEach((c) => { c.model = st.model; });
      try { await resolveSkins(scene, st.notes); } catch (e) { /* ok */ }
    }
    if (st.target > 0) scene.target = st.target;
    scene.prompt = text; st.base = scene;
  } else scene = base;
  if (variant) { st.variantN = (st.variantN || 0) + 1; scene = variantOf(st.base, st.variantN); st.notes.push('Inna wersja #' + st.variantN + ': zmieniona kamera/tło/kolory — treść ta sama.'); }
  if (scene.kind === 'motion' && st.target > 0) { scene.dur = st.target; }
  try { await preloadScene(scene); } catch (e) { /* ok */ }
  st.scene = scene; st.busy = false; this.renderPanel(true); void prev;
};
UI.aiPreview = function (cv, scene) {
  const t0 = performance.now(), dur = Anim.duration(scene) + 0.6, x = cv.getContext('2d');
  const loop = (now) => { if (!cv.isConnected || this._ai.scene !== scene) return; Anim.draw(x, cv.width, cv.height, scene, ((now - t0) / 1000) % dur); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
};
UI.pAI = function (box) {
  const st = this._ai, A = AIProv.cfg;
  box.append(h('div', { class: 'p-head' }, h('h3', {}, 'AI Studio'), h('span', { class: 'badge' }, 'NOWE')));
  box.append(h('div', { class: 'card2' }, h('h5', {}, 'Animator scen 2D / 3D'),
    F.hint('Opisz scenę po polsku — np. „pierwsza postać podchodzi do drugiej i uderza ją z liścia”. Własny silnik narysuje animację 2D lub 3D z kamerą, efektami i tłem. Działa lokalnie i za darmo: bez Claude, bez kredytów.'),
    h('p', { class: 'hint' }, 'Planer: ' + (AIProv.PROVIDERS.find((p) => p[0] === A.provider) || [])[1] + '. Zewnętrzne AI (np. darmowy Gemini albo Ollama) włączysz niżej w ustawieniach — wtedy układa dłuższe, bardziej swobodne scenariusze.'),
    h('textarea', { class: 'txt', rows: 4, placeholder: 'Opisz scenę… np. Dziewczyna płacze, a chłopak podchodzi i ją przytula', oninput: (e) => { st.text = e.target.value; } }, st.text),
    h('div', { class: 'chips ex' }, Planner.EXAMPLES.map((e) => h('button', { class: 'chip', onclick: () => { st.text = e; this.renderPanel(true); } }, e.length > 44 ? e.slice(0, 42) + '…' : e))),
    F.seg('Styl', [['auto', 'Auto'], ['3d', '3D'], ['2d', '2D']], () => st.style, (v) => { st.style = v; setTimeout(() => this.renderPanel(true), 0); }),
    F.select('Tło', [['auto', 'Dobierz z opisu'], ...Anim.BG_LIST.map((id) => [id, Anim.BGS[id].n])], () => st.bg, (v) => { st.bg = v; }),
    F.seg('Kamera', [['auto', 'Auto'], ['wide', 'Szeroko'], ['close', 'Blisko']], () => st.cam, (v) => { st.cam = v; setTimeout(() => this.renderPanel(true), 0); }),
    h('label', { class: 'ctl' }, h('div', { class: 'cl' }, h('span', {}, 'Docelowa długość (s) — puste = automatycznie')), h('input', { type: 'number', min: 1, max: 180, step: 0.5, class: 'txt', value: st.target || '', placeholder: 'np. 5', onchange: (e) => { st.target = +e.target.value || 0; } })),
    F.seg('Postacie', [['auto', 'Auto'], ['round', 'Okrągłe'], ['block', 'Klockowe']], () => st.model, (v) => { st.model = v; setTimeout(() => this.renderPanel(true), 0); }),
    F.btn(st.busy ? 'Układam scenariusz…' : 'Generuj animację', () => { if (!st.busy) this.aiGenerate(); }, 'primary block', 'sparkles')));
  if (st.notes.length) box.append(h('div', { class: 'note' }, st.notes.map((n) => h('div', {}, n))));
  if (st.scene) {
    const sc = st.scene, asp = (ASPECTS[P.aspect] || [16, 9]), W = 320, Hh = Math.round(W * asp[1] / asp[0]);
    const cv = h('canvas', { class: 'aiprev', width: W * 2, height: Hh * 2, style: `aspect-ratio:${asp[0]}/${asp[1]}` });
    const lst = sc.kind === 'motion' ? h('ol', { class: 'steps' }, sc.layers.slice(0, 12).map((l) => h('li', {}, h('b', {}, { text: 'Tekst', rect: 'Prostokąt', circle: 'Koło', line: 'Linia', ring: 'Pierścień', bar: 'Pasek', emoji: 'Emoji', poly: 'Wielokąt', particles: 'Cząsteczki' }[l.type] || l.type), l.type === 'text' ? ' „' + String(l.text).slice(0, 40) + '”' : '')))
      : h('ol', { class: 'steps' }, sc.steps.slice().sort((a, b) => a.at - b.at).map((s) => h('li', {}, h('b', {}, (sc.chars.find((c) => c.id === s.who) || {}).name || s.who), ' — ' + (s.act === 'custom' ? 'własny ruch: ' + (s.name || '') : (Anim.ACTS[s.act] || {}).n.toLowerCase()) + (s.target ? ' ' + ((sc.chars.find((c) => c.id === s.target) || {}).name || s.target) : '') + (s.text ? ' „' + s.text + '”' : '') + ' (' + (+s.at).toFixed(1) + ' s)')));
    box.append(h('div', { class: 'card2' }, h('h5', {}, 'Zrozumiałem'), h('ul', { class: 'steps' }, [...describeScene(sc), ...(sc.understanding ? ['AI: ' + sc.understanding] : []), ...((sc.assumptions || []).map((q) => 'Założenie: ' + q))].map((q) => h('li', {}, q)))));
    box.append(h('div', { class: 'card2' }, h('h5', {}, 'Podgląd (' + Anim.duration(sc).toFixed(1) + ' s)'), cv, lst,
      ...(sc.kind === 'motion' ? [] : sc.chars.filter((c) => c.model === 'block').map((c) => h('div', { class: 'skinbox' }, h('b', {}, c.name + (c.skinName ? ' — skin: ' + c.skinName : (c.skinTex ? ' — własny skin' : ' — bez skina'))), skinControls(c, () => UI.renderPanel(true))))),
      h('div', { class: 'row2' }, F.btn('Dodaj na oś', () => { const c = addSceneClip(sc); UI.insTab = 'ovl'; commit(); Engine.seek(c.start); try { TL.scroll.scrollLeft = Math.max(0, TL.px(c.start) - 60); } catch (e) { /* ok */ } toast('Dodano animację na oś czasu. Edytuj ją w „Edytuj → Scena”.'); }, 'primary', 'plus'), F.btn('Inna wersja', () => { if (!st.busy) this.aiGenerate(true); }, '', 'repeat')),
      F.btn(st.vidBusy ? 'Renderuję wideo… ' + Math.round((st.vidP || 0) * 100) + '%' : 'Zrób z tego wideo i dodaj do montażu', async () => {
        if (st.vidBusy) return; st.vidBusy = true; st.vidP = 0; UI.renderPanel(true);
        try {
          const r = await renderSceneVideo(sc, (p2) => { st.vidP = p2; const b2 = document.querySelector('#vidbtn span'); if (b2) b2.textContent = 'Renderuję wideo… ' + Math.round(p2 * 100) + '%'; });
          const name = 'Animacja AI ' + String(sc.prompt || '').replace(/[^\w\- ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '').slice(0, 26).trim() + '.' + r.container, f = new File([r.blob], name, { type: r.blob.type }), m = await importFile(f);
          st.lastVideo = { name, blob: r.blob };
          if (m) { App.addMedia(m); toast('Wideo dodane do montażu (zakładka Media i oś czasu).'); }
        } catch (e) { toast('Nie udało się wyrenderować wideo: ' + e.message, 'err'); }
        st.vidBusy = false; UI.renderPanel(true);
      }, 'block', 'film'), st.lastVideo ? F.btn('Zapisz ostatnie wideo na dysk', async () => { if (await saveFile(st.lastVideo.name, st.lastVideo.blob)) toast('Zapisano ' + st.lastVideo.name); }, 'sm', 'download') : null));
    { const fb = [...box.querySelectorAll('.btn')].find((q) => /wideo/.test(q.textContent) && /montażu|Renderuję/.test(q.textContent)); if (fb) fb.id = 'vidbtn'; }
    this.aiPreview(cv, sc);
  }
  /* obraz AI */
  box.append(h('div', { class: 'card2' }, h('h5', {}, 'Obraz AI (darmowy)'),
    F.hint('Generuje obraz z opisu (usługa Pollinations, bez klucza, wymaga internetu) i dodaje go do biblioteki — np. jako tło lub zdjęcie. Nie działa w trybie bez internetu.'),
    h('input', { type: 'text', class: 'txt', placeholder: 'np. neonowe miasto nocą, styl anime', value: st.img, oninput: (e) => { st.img = e.target.value; } }),
    F.btn(st.imgBusy ? 'Generuję obraz…' : 'Generuj obraz', async () => {
      if (st.imgBusy || !st.img.trim()) return; st.imgBusy = true; st.imgMsg = ''; this.renderPanel(true);
      try { const [cw, ch] = canvasSize(P.aspect, 720), b = await AIProv.image(st.img.trim(), cw, ch), f = new File([b], 'AI ' + st.img.trim().slice(0, 24) + '.jpg', { type: b.type }); const m = await importFile(f, { gen: true }); st.imgMsg = m ? 'Dodano do biblioteki (zakładka Media).' : 'Nie udało się wczytać obrazu.'; }
      catch (e) { st.imgMsg = 'Nie udało się: ' + e.message; }
      st.imgBusy = false; this.renderPanel(true);
    }, 'block', 'image'), st.imgMsg ? h('p', { class: 'hint' }, st.imgMsg) : null));
  /* ustawienia dostawcy */
  const d = AIProv.DEFAULTS[A.provider] || {};
  box.append(h('div', { class: 'card2' }, h('h5', {}, 'Ustawienia AI (opcjonalne)'),
    window.kadrNative ? h('p', { class: 'hint' }, 'Aplikacja desktopowa: połączenia z AI idą przez aplikację, więc nic ich nie blokuje, a ustawienia zostają po zamknięciu.') : null,
    F.hint('Domyślnie nie potrzebujesz żadnego AI. Jeśli chcesz, aby AI układało scenariusze, wybierz dostawcę. Ollama działa lokalnie i jest darmowa; Gemini i OpenRouter mają darmowe plany. Klucz jest zapisany tylko w tej przeglądarce/aplikacji i nie trafia do nas.'),
    F.select('Dostawca', AIProv.PROVIDERS, () => A.provider, (v) => { A.provider = v; AIProv.save(); UI.renderPanel(true); }),
    A.provider !== 'local' ? h('div', { class: 'aiform' },
      A.provider !== 'gemini' ? h('input', { type: 'text', class: 'txt', placeholder: 'Adres: ' + (d.url || ''), value: A.url, onchange: (e) => { A.url = e.target.value.trim(); AIProv.save(); } }) : null,
      A.provider !== 'ollama' ? h('input', { type: 'password', class: 'txt', placeholder: 'Klucz API', value: A.key, onchange: (e) => { A.key = e.target.value.trim(); AIProv.save(); } }) : null,
      h('input', { type: 'text', class: 'txt', placeholder: 'Model: ' + (d.model || ''), value: A.model, onchange: (e) => { A.model = e.target.value.trim(); AIProv.save(); } }),
      F.btn('Przetestuj połączenie', async () => { st.testMsg = 'Łączę…'; UI.renderPanel(true); try { const sc = await AIProv.plan('Dwie postacie: pierwsza macha do drugiej.'); st.testMsg = 'Działa! Model zwrócił scenariusz (' + sc.steps.length + ' kroków).'; } catch (e) { st.testMsg = 'Błąd: ' + e.message; } UI.renderPanel(true); }, 'sm', 'bolt'),
      st.testMsg ? h('p', { class: 'hint' }, st.testMsg) : null) : null));
  box.append(F.hint('Wskazówka: po dodaniu na oś kliknij animację i otwórz „Edytuj → Scena”, aby zmienić postacie, kroki, tło i kamerę. Animacja wchodzi do eksportu jak zwykły klip.'));
};

/* ---------- inspektor sceny ---------- */
const _insOverlay = UI.insOverlay;
const _tabs6 = UI.insTabsFor;
UI.insTabsFor = function (c) { if (c && c.type === 'scene') return [['ovl', 'Scena'], ['basic', 'Pozycja'], ['anim', 'Animacje'], ['adjust', 'Dostosuj'], ['fxs', 'Efekty']]; return _tabs6.call(this, c); };
UI.insOverlay = function (b, c) {
  if (c.type !== 'scene') return _insOverlay.call(this, b, c);
  if (c.scene.kind === 'motion') return UI.insMotion.call(this, b, c);
  const sc = c.scene, ids = sc.chars.map((x) => x.id), nameOf = (id) => (sc.chars.find((x) => x.id === id) || {}).name || id;
  const sel = (opts, val, fn) => h('select', { class: 'mini', onchange: (e) => fn(e.target.value) }, opts.map(([v, t]) => h('option', { value: v, selected: v === val }, t)));
  b.append(h('div', { class: 'card2' }, h('h5', {}, 'Opis sceny'),
    h('textarea', { class: 'txt', rows: 3, oninput: (e) => { sc.prompt = e.target.value; } }, sc.prompt || ''),
    F.btn('Ułóż scenariusz od nowa z opisu', async () => {
      const text = (sc.prompt || '').trim(); if (!text) { toast('Wpisz opis'); return; }
      let ns = null; if (AIProv.cfg.provider !== 'local') { try { ns = await AIProv.plan(text); } catch (e) { toast('AI nie odpowiedziało – użyłem lokalnego planera'); } }
      if (!ns) { const r = Planner.plan(text); ns = r.scene; if (r.notes.length) toast(r.notes[0]); }
      Object.assign(sc, { style: ns.style, bg: ns.bg, cam: ns.cam, chars: ns.chars, steps: ns.steps, prompt: text }); c.dur = Anim.duration(sc); commit();
    }, 'sm', 'sparkles')));
  b.append(F.seg('Styl', [['3d', '3D'], ['2d', '2D']], () => sc.style, (v) => { sc.style = v; }), F.select('Tło', Anim.BG_LIST.map((id) => [id, Anim.BGS[id].n]), () => sc.bg, (v) => { sc.bg = v; }), F.seg('Kamera', [['auto', 'Auto'], ['wide', 'Szeroko'], ['close', 'Blisko']], () => sc.cam, (v) => { sc.cam = v; }));
  b.append(F.title('Postacie'));
  sc.chars.forEach((ch) => {
    b.append(h('div', { class: 'card2' }, h('div', { class: 'row2' }, h('input', { class: 'txt', value: ch.name, onchange: (e) => { ch.name = e.target.value.slice(0, 24); commit(); } }), sel([['human', 'Człowiek'], ['robot', 'Robot']], ch.type, (v) => { ch.type = v; commit(); }), sel([['round', 'Okrągły'], ['block', 'Klockowy']], ch.model || 'round', (v) => { ch.model = v; commit(); })),
      sel([['short', 'Krótkie włosy'], ['long', 'Długie włosy'], ['bun', 'Kok'], ['cap', 'Czapka'], ['none', 'Łysy']], ch.hs === 'robot' ? 'none' : ch.hs, (v) => { ch.hs = v; commit(); }),
      ch.model === 'block' ? skinControls(ch, () => commit()) : null, ch.model === 'block' && ch.skinTex ? F.toggle('Smukłe ręce (jak Alex)', () => !!ch.slim, (v) => { ch.slim = v; }) : null,
      F.color('Koszulka', () => ch.shirt, (v) => { ch.shirt = v; }), F.color('Spodnie', () => ch.pants, (v) => { ch.pants = v; }), F.color('Skóra', () => ch.skin, (v) => { ch.skin = v; }), F.color('Włosy', () => ch.hair, (v) => { ch.hair = v; })));
  });
  b.append(F.title('Scenariusz'));
  const acts = Anim.ACT_LIST.filter((a) => !['slapped', 'punched', 'kicked', 'pushed', 'hit', 'hugged', 'custom'].includes(a)).map((a) => [a, Anim.ACTS[a].n]), list = h('div', { class: 'steps2' });
  sc.steps.map((s, i) => [s, i]).sort((a, b2) => (a[0].at || 0) - (b2[0].at || 0)).forEach(([s, i]) => {
    const A = Anim.ACTS[s.act] || {}, row = h('div', { class: 'strow' },
      h('div', { class: 'r1' }, sel(ids.map((id) => [id, nameOf(id)]), s.who, (v) => { s.who = v; commit(); }), s.act === 'custom' ? h('span', { class: 'hint' }, 'Własny ruch AI: ' + (s.name || 'bez nazwy') + ' (' + ((s.keys || []).length) + ' klatek)') : sel(acts, s.act, (v) => { s.act = v; commit(); }),
        (A.tgt || A.mv) ? sel([['', '—'], ...ids.filter((id) => id !== s.who).map((id) => [id, nameOf(id)])], s.target || '', (v) => { s.target = v || null; commit(); }) : null),
      h('div', { class: 'r2' }, h('label', {}, 'od', h('input', { type: 'number', step: 0.1, min: 0, value: +(s.at || 0).toFixed(2), onchange: (e) => { s.at = Math.max(0, +e.target.value || 0); commit(); } }), 's'),
        h('label', {}, 'czas', h('input', { type: 'number', step: 0.1, min: 0, value: +(s.dur || 0).toFixed(2), onchange: (e) => { s.dur = Math.max(0, +e.target.value || 0); commit(); }, title: '0 = automatycznie' }), 's'),
        h('button', { class: 'tb', title: 'Usuń krok', onclick: () => { sc.steps.splice(i, 1); commit(); }, html: icon('trash', 14) })),
      ['say', 'shout'].includes(s.act) ? h('input', { class: 'txt', placeholder: 'Tekst w dymku', value: s.text || '', onchange: (e) => { s.text = e.target.value.slice(0, 60); commit(); } }) : null);
    list.append(row);
  });
  b.append(list, F.hint('Reakcje (np. potknięcie po uderzeniu) dodają się same. „Czas 0” = silnik dobiera go sam (np. do długości marszu).'),
    h('div', { class: 'row2' }, F.btn('Dodaj krok', () => { const last = sc.steps.reduce((m, s) => Math.max(m, (s.at || 0) + (s.dur || 1.5)), 0.3); sc.steps.push({ at: +last.toFixed(2), dur: 0, who: ids[0], act: 'wave', target: null, text: '' }); commit(); }, 'sm', 'plus'),
      F.btn('Dopasuj długość klipu', () => { c.dur = Anim.duration(sc); commit(); toast('Długość klipu: ' + c.dur.toFixed(1) + ' s'); }, 'sm', 'fit')));
};

/* ---------- edytor grafiki ruchomej ---------- */
UI.insMotion = function (b, c) {
  const sc = c.scene;
  b.append(h('div', { class: 'card2' }, h('h5', {}, 'Opis grafiki'),
    h('textarea', { class: 'txt', rows: 3, oninput: (e) => { sc.prompt = e.target.value; } }, sc.prompt || ''),
    F.btn('Zbuduj od nowa z opisu', async () => {
      const text = (sc.prompt || '').trim(); if (!text) { toast('Wpisz opis'); return; }
      let ns = null; if (AIProv.cfg.provider !== 'local') { try { ns = await AIProv.plan(text); } catch (e) { toast('AI nie odpowiedziało – użyłem lokalnego planera'); } }
      if (!ns) { const r = Planner.auto(text); ns = r.scene; if (r.notes.length) toast(r.notes[0]); }
      if (ns.kind !== 'motion') { toast('Ten opis to scena z postaciami — wygeneruj ją w zakładce AI i dodaj osobno.'); return; }
      Object.keys(sc).forEach((k) => delete sc[k]); Object.assign(sc, ns); c.dur = Anim.duration(sc); commit();
    }, 'sm', 'sparkles')));
  b.append(F.sn('Długość animacji', () => sc.dur, (v) => { sc.dur = v; c.dur = v; }, 0.5, 60, 0.1, 1, ' s'));
  b.append(F.title('Tło'));
  (sc.bg.colors || [sc.bg.color || '#000000']).forEach((col, i) => b.append(F.color(i === 0 ? 'Kolor 1' : 'Kolor ' + (i + 1), () => (sc.bg.colors ? sc.bg.colors[i] : sc.bg.color), (v) => { if (sc.bg.colors) sc.bg.colors[i] = v; else sc.bg.color = v; })));
  b.append(F.title('Warstwy'));
  const NAMES = { text: 'Tekst', rect: 'Prostokąt', circle: 'Koło', line: 'Linia', ring: 'Pierścień', bar: 'Pasek', emoji: 'Emoji', poly: 'Wielokąt', particles: 'Cząsteczki' };
  sc.layers.forEach((L, i) => {
    const card = h('div', { class: 'card2' }, h('div', { class: 'row2' }, h('b', {}, NAMES[L.type] || L.type), h('button', { class: 'tb', title: 'Usuń warstwę', onclick: () => { sc.layers.splice(i, 1); commit(); }, html: icon('trash', 14) })));
    if (L.type === 'text') card.append(h('input', { class: 'txt', value: L.text == null ? '' : L.text, title: 'Możesz używać wstawek {wyrażenie}, np. {round(lerp(1,100,lu))}', onchange: (e) => { L.text = e.target.value.slice(0, 300); commit(); } }),
      F.select('Czcionka', Motion.FONTS.map((f) => [f, f]), () => L.font || 'Anton', (v) => { L.font = v; }));
    if (typeof L.color === 'string' && L.color[0] === '#') card.append(F.color('Kolor', () => L.color, (v) => { L.color = v; }));
    if (L.type === 'text' && typeof L.size === 'number') card.append(F.sn('Rozmiar', () => L.size, (v) => { L.size = v; }, 0.02, 0.9, 0.005, 100, '%'));
    b.append(card);
  });
  b.append(F.title('Zaawansowane: cała scena jako tekst (JSON)'));
  const ta = h('textarea', { class: 'txt code', rows: 8, spellcheck: 'false' }, JSON.stringify({ dur: sc.dur, bg: sc.bg, bgfx: sc.bgfx, layers: sc.layers }, null, 1));
  b.append(ta, F.btn('Zastosuj zmiany z tekstu', () => { try { const o = JSON.parse(ta.value), ns = Motion.sanitize(Object.assign({}, o, { prompt: sc.prompt })); if (!ns) throw new Error('brak poprawnych warstw'); Object.keys(sc).forEach((k) => delete sc[k]); Object.assign(sc, ns); c.dur = Math.max(c.dur, 0.5); commit(); toast('Zastosowano'); } catch (e) { toast('Błąd w JSON: ' + e.message, 'err'); } }, 'sm', 'check'),
    F.hint('Wartości liczbowe mogą być wyrażeniami zależnymi od czasu (np. "lerp(0,1,lu)"), a teksty mogą zawierać {wyrażenia}. Funkcje: sin, cos, lerp, clamp, ease, easeOutBack, rand, fmt, time…'));
};
