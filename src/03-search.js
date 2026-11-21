'use strict';
/* ============================================================
   Kadr Studio — wyszukiwarka: rozumie polskie odmiany i synonimy.
   Wpisz „rozmazanie”, „blur”, „nieostre” — dostaniesz wszystko, co rozmywa.
   ============================================================ */
const Search = (() => {
  const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9&+ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  /* [nazwa pojęcia, rdzenie słów (bez polskich znaków), krótki opis] */
  const RAW = [
    ['Rozmycie', 'rozmaz rozmyc rozmyt blur nieostr zmiekcz zamgl mgla mgle', 'Zmiękcza obraz, litery lub krawędzie (nieostrość, rozmazanie).'],
    ['Poświata i blask', 'poswiat swiec swiec blask glow aura halo lsni rozjasn', 'Miękki blask wokół obrazu lub liter.'],
    ['Neon', 'neon fluor swietlowk cyber', 'Jaskrawe, świecące kolory jak neony.'],
    ['Trzęsienie i drgania', 'trzes trzas wstrzas dryg drzen shake wibr jitter chwiej chybot kolysan telep', 'Szybkie drgania kamery lub elementu, mocne uderzenia.'],
    ['Zoom', 'zoom przyblizen oddalen powiekszen pomniejsz najazd zblizen dolly lupa soczew', 'Przybliża lub oddala kadr.'],
    ['Glitch i zakłócenia', 'glitch zaklocen usterk awari rgb aberrac datamosh szum static sniezen', 'Cyfrowe usterki: rozjechane kolory, paski, szum.'],
    ['Retro i VHS', 'vhs retro stary stare staro kaset tasm ziarn crt kineskop telewiz polaroid vintage lata nostalg lofi kurz rysy przepal grain dust', 'Wygląd starej kasety, taśmy filmowej lub telewizora.'],
    ['Błysk i stroboskop', 'blysk blysn rozblysk flash strob migot flicker disco przeswietl', 'Krótkie rozbłyski i migotanie światła.'],
    ['Światło', 'swiatl swietl flar promien wyciek leak ray lens slonc', 'Wycieki, flary i promienie światła.'],
    ['Obrót i wir', 'obrot obracan krec spin skret rotat tornado swirl zakret orbit', 'Obracanie, skręcanie i wiry.'],
    ['Przesuwanie', 'przesun wjazd wjezdz slide push swipe wsun lewej prawej gory dolu', 'Element wjeżdża lub wyjeżdża z wybranej strony.'],
    ['Odsłanianie', 'odslon odkryw wycierac wipe kurtyn zaluz okien', 'Obraz odsłania się jak spod wycieraczki lub kurtyny.'],
    ['Zanikanie i krycie', 'zanik fade przezroc znika pojawi wygas krycie wyblakl opacity', 'Płynne pojawianie się i znikanie.'],
    ['Odbicie i sprężyna', 'odbici skok skacz podskok bounce guma gumk elast sprez galaret jelly rubber wyskok hop', 'Sprężyste, skaczące ruchy.'],
    ['Litery i słowa', 'liter slow znak maszyn pisan type klawiatur kursor szyfr scramble wiersz', 'Animacje, które działają na pojedyncze litery lub słowa.'],
    ['Kolory', 'kolor barw tecz rainbow hue duotone palet odcien', 'Zmiany i zestawy kolorów.'],
    ['Czerń i biel', 'czarno czern noir mono szar srebr tusz', 'Obraz bez kolorów, czarno-biały.'],
    ['Ciepło i zimno', 'ciepl zimn mroz lodow arkty zachod jesien pustyn sloneczn', 'Ciepłe (pomarańcz) lub zimne (błękit) barwy.'],
    ['Kino', 'kino film cinema hollywood blockbuster teal orange pasy letterbox anamorf matrix kodak fuji', 'Filmowy, kinowy wygląd z pasami i korekcją kolorów.'],
    ['Cząsteczki i pogoda', 'iskr brokat konfet snieg sniez deszcz czastecz glitter sparkle ogien piorun blyskaw burz embers', 'Iskry, brokat, konfetti, śnieg, deszcz.'],
    ['Prędkość', 'predkos tempo szybk wolno zwoln przyspiesz slow velocity speed ramp bullet krzyw', 'Zmiana tempa wideo w czasie (slow-mo, przyspieszenie).'],
    ['Puls i rytm', 'puls rytm beat serce bicie tetn oddych bass muzyk', 'Ruch zgrany z rytmem lub biciem serca.'],
    ['Lustro i symetria', 'lustr mirror kalejd symetr kafelk podwojn', 'Odbicia lustrzane i powtarzane kadry.'],
    ['Pikselizacja', 'piksel pixel mozaik kostk blok cenzur', 'Mozaika z kwadratów, cenzura.'],
    ['Ramki i kształty', 'ramk ksztalt strzal celown wizjer', 'Ramki, celowniki, strzałki i inne kształty.'],
    ['Ruch kamery', 'kamer panoram handheld burns dryf unosz plyn', 'Naśladuje ruch kamery: dryf, panorama, drżenie z ręki.'],
    ['Cień i 3D', 'cien 3d glebi shadow relief wyciet', 'Cień pod napisem lub twardy cień 3D.'],
    ['Obrys', 'obrys kontur stroke outline', 'Linia wokół liter.'],
    ['Szkło i przezroczystość', 'szklo szkl glass transparent folia przezroczyst', 'Półprzezroczyste, szklane napisy.'],
    ['Gradient i galaktyka', 'gradient ombre galakt galaxy kosmos nebula', 'Płynne przejścia kolorów i kosmiczne wzory.'],
    ['Złoto i metal', 'zlot gold metal chrom mosiad krysztal', 'Złote, srebrne i metaliczne wykończenia.'],
    ['Ognisty', 'ogien plomien ogniow fire zar goraco', 'Ogień i żar.'],
    ['Edit i wideo na bit', 'edit montaz velocity football pilk sport', 'Efekty pod szybkie edity na rytm.'],
  ];
  const CON = RAW.map(([name, w, desc]) => ({ name, desc, words: [...new Set(norm(w).split(' ').filter(Boolean))] }));
  /* dodatkowe słowa dla pozycji, których nazwa nie zdradza, co robią (klucz = id) */
  const TAGS = {
    crt: 'telewizor tv kineskop stary monitor', echo: 'duchy powtorzenia smuga sladowanie', wave: 'falowanie woda znieksztalcenie',
    kaleido: 'lustra symetria wzor', pulse: 'bicie serca rytm', zoomlens: 'soczewka rybie oko wybrzuszenie powiekszenie',
    strobe: 'disco migajace', leak: 'wyciek swiatla cieply przepalenie', datamosh: 'smuga rozmazanie ruch rozmazany', tvstatic: 'szum zaklocenia sniezenie telewizor',
    chromab: 'rgb rozdzielenie kolorow blad', spinzoom: 'wir kręcenie zoom obrot', bokeh: 'rozmazanie rozmyte swiatla nieostre kola',
    sparkle: 'iskry brokat blyszczace', overexpose: 'przeswietlenie jasny bialy blask', hueshift: 'tecza zmiana kolorow', satpulse: 'pulsujace kolory nasycenie',
    bleach: 'wyplowialy kontrast blady', frame: 'ramka obramowanie', split2: 'dwa kadry podzial ekranu collage', tile4: 'cztery kadry collage kafelki',
    letterbox: 'czarne pasy kino kinowe 21:9', blurpulse: 'rozmazanie pulsujace nieostre', pixel: 'pikselizacja cenzura mozaika', glitchcolor: 'glitch kolorowy rozjechane kolory',
    dipblack: 'przez czern zaciemnienie', dipwhite: 'blysk bialy rozblysk', whip: 'smagniecie szybki ruch rozmazanie', zoomblur: 'rozmazanie zoom blur',
    shatter: 'rozbicie szklo kawalki', pageturn: 'kartka ksiazka', cube: 'szescian 3d obrot', clock: 'zegar wskazowka', blinds: 'zaluzje paski',
    dream: 'sen marzenie miekki rozmazany', soft: 'miekki rozmycie', hdr: 'kontrast ostry detale', crisp: 'ostry wyrazny', frost: 'mroz zimno lod',
    matcha: 'zielony', miami: 'rozowy niebieski retro lata 80', toxic: 'zielony kwasowy', cyber: 'cyberpunk neon rozowy niebieski', glow: 'blask swiecenie poswiata',
    ghost: 'duch przezroczysty widmo', ripple: 'fala rozchodzaca woda', stamp: 'pieczatka uderzenie', typewriter: 'maszyna do pisania litery',
    wave2: 'fala falowanie', rainbow: 'teczowy tekst kolory', colorCycle: 'zmiana koloru kolory zmieniajace', neonFlicker: 'migotanie neon', glowPulse: 'poswiata pulsujaca blask',
    blurPulse: 'rozmazanie pulsujace', vignetteOv: 'winieta ciemne rogi', shockwave: 'fala uderzeniowa wybuch', speedRadial: 'linie predkosci anime szybkosc', embers: 'zar iskry ogien',
    lightning: 'blyskawica burza piorun', fireGlow: 'ogien plomien', montage: 'velocity edit predkosc', hero: 'slowmo bohater zwolnienie', bullet: 'bullet time zwolnienie matrix', jumpcut: 'skoki ciecia',
    flashin: 'flash blysk', flashout: 'flash blysk', rampup: 'przyspieszanie szybciej', rampdown: 'zwalnianie wolniej', slowmid: 'zwolnienie srodek', beat: 'beat drop rytm uderzenie', pulsecurve: 'pulsowanie',
    vhs: 'kaseta kamera retro', vhs2: 'kaseta mocny', dv: 'kamera cyfrowa retro 2000', cctv: 'monitoring kamera przemyslowa', halftone: 'polton komiks kropki', polaroid: 'zdjecie ramka biala',
    handheld: 'z reki kamera drzaca', slowzoom: 'powolne zblizenie najazd', heavyshake: 'mocne trzesienie wstrzas', lensflare: 'flara obiektyw promienie', rays: 'promienie swiatla slonce',
    prism: 'pryzmat teczowe krawedzie', vigpulse: 'winieta puls ciemne rogi', lightflicker: 'migotanie swiatla', duotone: 'dwa kolory fiolet', sunsetduo: 'dwa kolory zachod', cyberpunk: 'neon rozowy niebieski miasto',
    nightvision: 'noktowizor zielony noc', splitcolor: 'dwa kolory', tilt: 'przechyl pochylenie', hop: 'podskok skok', jitter: 'drgania', mirror: 'lustro odbicie symetria', kaleido2: 'kalejdoskop',
    popRotate: 'wyskok obrot', bounceU: 'odbicie dol', elastic: 'gumka sprezyna', swing: 'wahadlo huśtawka kolysanie',
  };
  const _tagNorm = {}; Object.keys(TAGS).forEach((k) => { _tagNorm[k] = norm(TAGS[k]); });

  const hit = (hay, toks, w) => (w.length < 4 ? toks.some((t) => t.startsWith(w)) : hay.includes(w));
  /* dokument pozycji: {id, name, cat, tags} → {hay, toks, nameToks} */
  const docCache = new Map();
  function mkDoc(d) {
    const key = d.id + '|' + d.name + '|' + (d.cat || '') + '|' + (d.tags || '');
    let r = docCache.get(key); if (r) return r;
    const nameN = norm(d.name), core = norm([d.name, d.id, d.tags, _tagNorm[d.id] || ''].join(' ')), hay = norm(core + ' ' + (d.cat || ''));
    r = { hay, toks: hay.split(' '), core, ctoks: core.split(' '), nameToks: nameN.split(' '), concepts: null };
    if (docCache.size > 3000) docCache.clear();
    docCache.set(key, r); return r;
  }
  /* które pojęcia opisują pozycję (do podpowiedzi) */
  function conceptsOf(d) {
    const doc = mkDoc(d); if (doc.concepts) return doc.concepts;
    return (doc.concepts = CON.filter((c) => c.words.some((w) => hit(doc.core, doc.ctoks, w))).map((c) => c.name));
  }
  /* pojęcia wywołane zapytaniem */
  function expand(qt) {
    const trig = new Set();
    const alts = qt.map((t) => {
      const a = new Set([t]);
      CON.forEach((c) => { if (c.words.some((w) => w === t || (t.length >= 4 && w.startsWith(t)) || (w.length >= 4 && t.startsWith(w)))) { trig.add(c); c.words.forEach((w) => a.add(w)); } });
      return a;
    });
    return { alts, trig: [...trig] };
  }
  function run(q, items, docOf) {
    const qt = norm(q).split(' ').filter(Boolean);
    if (!qt.length) return { list: items, concepts: [], q: '', n: items.length };
    const { alts, trig } = expand(qt);
    const scored = [];
    items.forEach((it, idx) => {
      const doc = mkDoc(docOf(it));
      let score = 0;
      for (let i = 0; i < qt.length; i++) {
        const t = qt[i];
        let s = 0;
        if (doc.nameToks.some((x) => x.startsWith(t))) s = 6;
        else if (t.length >= 3 && doc.hay.includes(t)) s = 3;
        else { for (const w of alts[i]) { if (hit(doc.core, doc.ctoks, w)) { s = 1; break; } } }
        if (!s) { score = 0; break; }
        score += s;
      }
      if (score) scored.push([score, idx, it]);
    });
    scored.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    return { list: scored.map((x) => x[2]), concepts: trig, q: qt.join(' '), n: scored.length };
  }
  const suggest = (n = 8) => CON.slice(0, n).map((c) => c.name.split(' ')[0].toLowerCase());
  return { norm, run, conceptsOf, mkDoc, CON, TAGS, suggest };
})();
