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

- **Oś czasu**: 3 ścieżki wideo/nakładek + 2 ścieżki dźwięku, przeciąganie, przycinanie krawędzi, podział, duplikowanie, przyciąganie do krawędzi, znaczników i głowicy, cofnij/ponów, zoom.
- **Efekty (22)**: Glitch, RGB, VHS, Stary TV, Retro DV, Mozaika, Lustro, Kalejdoskop, Fala, Echo, Puls, Trzęsienie, Soczewka, Poświata, Błysk, Stroboskop, Wyciek światła i inne. Na klip albo jako warstwa na osi.
- **Przejścia (27)**: zanikanie, przez czerń/biel, rozmycie, zoom, obrót, przewrót, przesuwanie, przykrywanie, wycieraczki, koło, kostki, żaluzje, glitch, RGB, mozaika, wstrząs.
- **Animacje**: 17 wejść/wyjść (plus „maszyna do pisania” dla tekstu) oraz 13 pętli (puls, serce, Ken Burns, panorama…). Najechanie na kafelek pokazuje podgląd w ruchu.
- **Filtry (21)** i ręczna korekcja: jasność, kontrast, nasycenie, temperatura, odcień, rozmycie, winieta, ziarno.
- **Usuń tło**: AI (człowiek, lokalnie w przeglądarce) albo klucz koloru (zielony ekran, pipeta, auto z rogów).
- **Tekst** (14 stylów, 10 czcionek, obrys, cień, tło, maszyna do pisania) i **naklejki** (emoji).
- **Ustawienia filmu**: proporcje (16:9, 9:16, 1:1, 4:5, 3:4, 4:3, 21:9), rozmyte tło, klatkaż, rozdzielczość do 4K, jakość.
- **Narzędzia**: usuwanie tła ze zdjęcia (PNG), asystent Claude (napisy, hooki, opis i hasztagi), auto-rytm (znaczniki na uderzeniach), odłączanie dźwięku, zatrzymanie klatki, zrzut klatki.
- **Eksport**: MP4 (H.264) lub WebM (VP9/VP8) przez WebCodecs. Każda klatka jest renderowana osobno, a dźwięk miksowany offline.

## Skróty

| Klawisz | Akcja |
| --- | --- |
| Spacja | odtwarzaj / pauza |
| S | podziel klip w miejscu głowicy |
| Delete | usuń zaznaczone |
| Ctrl+D | duplikuj |
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
