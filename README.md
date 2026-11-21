# Kadr Studio

Repozytorium: `fake-tt`.

Edytor wideo w przeglądarce i jako aplikacja (PWA / Electron). Obsługa jak w CapCut: biblioteka mediów, wielościeżkowa oś czasu, podgląd z uchwytami, panele efektów, przejść, filtrów, animacji, tekstu i naklejek, usuwanie tła oraz eksport do MP4.

Wszystkie efekty, przejścia, animacje, filtry i style tekstu są **własną implementacją** (Canvas 2D). Płatne zasoby CapCut Premium są zastrzeżone, więc nie ma ich w projekcie. Nazwy i zachowanie są podobne do CapCuta, ale kod jest oryginalny.

## Jak zdobyć aplikację

**1. Programy na komputer (.exe / .dmg / AppImage) – zalecane.** W repozytorium wejdź w *Actions* → *Aplikacje desktopowe* → *Run workflow*, wpisz wersję (np. `v1.0.0`) i uruchom. Po kilku minutach instalatory dla Windows, macOS i Linuksa pojawią się w zakładce *Releases* (https://github.com/maxioo21/fake-tt/releases). Instalatory nie są podpisane, więc Windows i macOS pokażą ostrzeżenie przy pierwszym uruchomieniu. Release powstaje też po wypchnięciu tagu `v*`.

**2. Wersja online (instalowalna PWA).** Włącz GitHub Pages (Settings → Pages → Source: *GitHub Actions*), a potem uruchom ręcznie workflow *Wersja online (GitHub Pages)*. Aplikacja będzie pod `https://maxioo21.github.io/fake-tt/`. W Chrome/Edge kliknij „Zainstaluj aplikację", a na Androidzie: menu przeglądarki → „Dodaj do ekranu głównego".

**3. Lokalnie.**

```bash
node build.js
node electron/serve.js        # http://localhost:8080 (też można zainstalować jako PWA)
```

```bash
npm install
npm start                     # okno Electron
npm run dist                  # instalator w katalogu release/
```

## Co potrafi

**Edycja**
- Oś czasu: 3 ścieżki wideo/nakładek + 2 ścieżki audio, **magnetyczna ścieżka główna** (klipy zawsze stykają się, przeciągnięcie zmienia kolejność, usunięcie zamyka lukę), przycinanie krawędzi, podział, duplikowanie, kopiuj/wklej, zaznaczanie wielu klipów (Shift/Ctrl), przyciąganie z widoczną prowadnicą, ukrywanie, wyciszanie i blokowanie ścieżek, cofnij/ponów.
- **Klatki kluczowe** (pozycja, skala, obrót, krycie) i przeciąganie po podglądzie, które je zapisuje.
- **Maski** (koło, serce, gwiazda, romb, pasy…), **tryby mieszania** (15), przycinanie, odbicia.
- **Krzywe prędkości** (Montaż, Bohater, Bullet time, Jump cut, Flash in/out i inne), z dźwiękiem zmieniającym tempo.
- **Usuń tło**: AI (człowiek, lokalnie w przeglądarce) albo klucz koloru (zielony ekran, pipeta, auto z rogów).
- Płynny podgląd: zegar czeka na bufor wideo, a jakość podglądu sama się obniża, gdy komputer nie nadąża (eksport zawsze w pełnej jakości).

**Biblioteka efektów (wszystko własnym kodem)**
- **67 efektów**: Glitch (blokowy, RGB, datamosh…), Retro (VHS, Retro DV, CCTV, stary film, półton, Polaroid…), Ruch (uderzenie zoom, wstrząsy, kamera z ręki, rozmycie radialne…), Światło (flara, promienie, bokeh, neon…), Kolor (duotone, cyberpunk, noktowizor…).
- **61 przejść**: zoom-rozmycie, przepalenie taśmy, wyciek światła, błysk, odsłanianie (zegar, serce, romb, szachownica), rozbicie, glitch, przewijanie VHS i inne.
- **53 filtry**, **38 animacji wejścia/wyjścia** i **27 pętli**.
- **65 stylów tekstu** w 8 kategoriach (sport/edit, neon, retro, elegancja, zabawa, etykiety, napisy), 32 czcionki, gradient, twardy cień, podwójny obrys, animacje tekstu (maszyna do pisania, litery, słowa, fala, tęcza).
- **39 kształtów** wektorowych (strzałki, ramki, celowniki, kreski) i emoji w 12 kategoriach.

**Zakładka „Gotowe” (bez napisów, do edytów)**
- **Looki**: 35 gotowych kombinacji (CC, glitch hit, złoty edit, velocity, kino, retro…).
- **Prędkość**: 11 krzywych jednym kliknięciem.
- **Montaż na bit**: wykrywa rytm w muzyce, tnie klipy na uderzeniach i dodaje błyski, glitch lub wstrząsy na cięciach.
- **Nakładki**: 30 animowanych nakładek rysowanych na żywo (wycieki światła, błyski, fala uderzeniowa, linie prędkości, iskry, żar, bokeh, deszcz, błyskawice, konfetti…).
- **Pakiety przejść**: jedno przejście (lub losowe) na wszystkich cięciach.

**Narzędzia i eksport**
- Usuwanie tła ze zdjęcia (PNG), asystent Claude (napisy, hooki, opis i hasztagi), auto-rytm, odłączanie dźwięku, zatrzymanie klatki, zrzut klatki.
- Proporcje (16:9, 9:16, 1:1, 4:5, 3:4, 4:3, 21:9), rozmyte tło, klatkaż, eksport MP4/WebM do 4K przez WebCodecs.

## Skróty

| Klawisz | Akcja |
| --- | --- |
| Spacja | odtwarzaj / pauza |
| S | podziel klip w miejscu głowicy |
| Delete | usuń zaznaczone |
| Ctrl+D | duplikuj |
| Ctrl+C / Ctrl+V | kopiuj / wklej klip |
| Ctrl+A | zaznacz wszystko |
| Shift+klik | zaznacz wiele klipów |
| dwuklik na napisie | edycja tekstu na podglądzie |
| Ctrl+Z / Ctrl+Shift+Z | cofnij / ponów |
| M | znacznik |
| ← → | klatka wstecz / w przód (Shift = 1 s) |
| + / − | zoom osi czasu |
| Ctrl+E | eksport |

## Wymagania

Najlepiej Chrome lub Edge (WebCodecs i filtry canvas). Bez WebCodecs eksport jest niedostępny, a bez `ctx.filter` (np. Safari) część korekcji kolorów się nie wyświetla.

## Struktura

```
src/        kod źródłowy (moduły 01–11, style, szablon)
build.js    składa src -> dist/index.html (aplikacja) i dist/artifact.html (wersja do Claude)
vendor/     mp4-muxer, webm-muxer, MediaPipe Selfie Segmentation (Apache-2.0)
electron/   okno desktopowe + prosty serwer statyczny
```
