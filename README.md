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
- **Przeciąganie jak w CapCut:** efekty, filtry, animacje, przejścia, looki, krzywe prędkości, nakładki, napisy, naklejki i kształty możesz przeciągnąć na klip (na osi albo na podglądzie), na styk dwóch klipów (przejścia) albo na ścieżkę. Kursor pokazuje, co się stanie, a nieprawidłowy cel jest oznaczony na czerwono. Na telefonie dotknij kafelka.
- **Menu pod prawym przyciskiem myszy** na klipie (podziel, duplikuj, kopiuj/wklej, odłącz dźwięk, zatrzymaj klatkę, usuń efekty…).
- Oś czasu: 3 ścieżki wideo/nakładek + 2 ścieżki audio, **magnetyczna ścieżka główna** (klipy zawsze stykają się, przeciągnięcie zmienia kolejność, usunięcie zamyka lukę), przycinanie krawędzi, podział, duplikowanie, kopiuj/wklej, zaznaczanie wielu klipów (Shift/Ctrl), przyciąganie z widoczną prowadnicą, ukrywanie, wyciszanie i blokowanie ścieżek, cofnij/ponów.
- **Klatki kluczowe** (pozycja, skala, obrót, krycie) i przeciąganie po podglądzie, które je zapisuje.
- **Maski** (koło, serce, gwiazda, romb, pasy…), **tryby mieszania** (15), przycinanie, odbicia.
- **Krzywe prędkości** (Montaż, Bohater, Bullet time, Jump cut, Flash in/out i inne), z dźwiękiem zmieniającym tempo.
- **Usuń tło**: AI (człowiek, lokalnie w przeglądarce) albo klucz koloru (zielony ekran, pipeta, auto z rogów).
- Płynny podgląd: zegar czeka na bufor wideo, a jakość podglądu sama się obniża, gdy komputer nie nadąża (eksport zawsze w pełnej jakości).

**Biblioteka efektów (wszystko własnym kodem)**
- **67 efektów**: Glitch (blokowy, RGB, datamosh…), Retro (VHS, Retro DV, CCTV, stary film, półton, Polaroid…), Ruch (uderzenie zoom, wstrząsy, kamera z ręki, rozmycie radialne…), Światło (flara, promienie, bokeh, neon…), Kolor (duotone, cyberpunk, noktowizor…).
- **61 przejść**: zoom-rozmycie, przepalenie taśmy, wyciek światła, błysk, odsłanianie (zegar, serce, romb, szachownica), rozbicie, glitch, przewijanie VHS i inne.
- **53 filtry**, **82 animacje wejścia/wyjścia** i **53 pętle** (odsłanianie, guma, galaretka, tornado, pieczątka…).
- **305 stylów tekstu** w 18 kategoriach (szablony z animacją, **przezroczyste (szkło)**, **zmienne kolory**, **galaktyka i brokat**, sport/edit, neon, poświata, rozmyte, gradient, metaliczne, 3D/cień, komiks, retro, elegancja, zabawa, etykiety, napisy) i 32 czcionki. **Ustawienia jak w CapCut:** rozmiar, odstęp liter i wierszy, B/I/U; wypełnienie jednolite / gradient z kątem / **zmieniające się kolory** (do 3 kolorów, szybkość i rozciągnięcie) / tęcza / **galaktyka** i **brokat** (gęstość i kolor iskier); **przezroczystość tekstu**; obrys (i drugi obrys, także zmieniający kolor); **poświata** (kolor, intensywność, rozmiar, także zmieniająca kolor); **cień** (kolor, krycie, rozmycie, odległość, kąt) i twardy cień 3D; **rozmycie tekstu**; tło (zaokrąglenie i odstęp). Pola liczbowe obok suwaków.
- **Animacje tekstu** (16 wejścia/wyjścia, 8 pętli): maszyna z kursorem, szyfr, litery pop/zoom/obrót/przewrót, neon zapala się, glitch liter, rozmycie liter, słowa po kolei i inne.
- **39 kształtów** wektorowych (strzałki, ramki, celowniki, kreski) i emoji w 12 kategoriach.

**Wyszukiwarki (w każdym panelu i w ustawieniach napisów)**
- Efekty, przejścia, filtry, naklejki, teksty, animacje (w prawym panelu), looki, krzywe prędkości, nakładki i szablony mają pole „Szukaj”. Rozumie polskie odmiany i synonimy: wpisz **„rozmazanie”** (albo „blur”, „nieostre”), a znajdzie rozmycie, smugę ruchu, bokeh i animacje z rozmyciem; **„światło”**, **„trzęsienie”**, **„szkło”**, **„poświata”** działają tak samo. Pod polem widać, jak zrozumiałem zapytanie (np. „Rozmycie — zmiękcza obraz…”).
- Ustawienia napisu mają własną wyszukiwarkę: wpisz „poświata” albo „rozmazanie”, kliknij wynik, a przeskoczę do właściwej zakładki i podświetlę suwak.

**AI Studio: animacje 2D/3D z opisu (zakładka „AI”)**
- Opisujesz scenę po polsku, np. „pierwsza postać podchodzi do drugiej i uderza ją z liścia”, a **własny silnik** rysuje animację 2D lub 3D: postacie szkieletowe (chód, bieg, 40 czynności: uderzenia, kopnięcia, przytulanie, taniec, salto, płacz, śmiech, sen…), kamera z najazdem na uderzenia i wstrząsem, 10 teł (park, plaża, noc w mieście, stadion, kosmos, śnieg…), efekty komiksowe (PLASK!, gwiazdki, serduszka, konfetti, dymki z tekstem). Wynik to zwykły klip na osi (edytujesz postacie, kroki, tło i kamerę w „Edytuj → Scena”) i wchodzi do eksportu MP4/WebM.
- **Działa lokalnie i za darmo** — bez Claude i bez kredytów. Lokalny planer rozumie polskie czasowniki i wyrażenia (kto, co, do kogo, potem, razem…), ale to nie jest model językowy: zna ograniczony zestaw czynności i postaci-patyczaków.
- **Styl klockowy** (jak w grach z klockami, ale własne klocki — bez oficjalnych postaci, nazw i tekstur): postacie z sześcianów, świat z klocków (dzień, noc, jaskinia, lawa), czynności „kopie kilofem”, „buduje”, „walczy mieczem”, „wybucha” oraz gotowe wyglądy: zombie, szkielet, zielony potwór. Wystarczy napisać np. „szkielet walczy mieczem z zombie na klockowej łące”.
- **Własne ruchy wymyślane przez AI:** gdy do opisu nie pasuje żadna z gotowych czynności, podłączone AI (patrz niżej) może zaprojektować nowy ruch jako klatki kluczowe (kąty stawów w czasie). Silnik go zagra, więc nie jesteś ograniczony do wbudowanej listy.
- **Opcjonalnie dowolne AI** (AI → Ustawienia AI): Ollama (lokalnie, za darmo), Google Gemini (darmowy klucz), dowolne API zgodne z OpenAI (OpenRouter, Groq, LM Studio…). Model układa swobodniejszy scenariusz, a ten sam silnik go rysuje. Klucze zostają tylko na Twoim urządzeniu. Gdy AI nie odpowie, używany jest planer lokalny.
- **W aplikacji desktopowej** połączenia z AI idą przez proces aplikacji, więc nie blokuje ich CORS (Ollama, Gemini, OpenRouter i inne działają bez dodatkowej konfiguracji), a ustawienia (adres, klucz, model) zostają po zamknięciu programu — aplikacja ma stały adres wewnętrzny. W przeglądarce/PWA część usług może być zablokowana przez CORS.
- **Skiny i „research”:** napisz np. „Alex macha do Steve’a, ze skinami z Minecraft, około 5 sekund”. Planer rozpoznaje imiona Steve i Alex oraz „skin <nick>”, pobiera prawdziwy skin z serwerów Mojang (w aplikacji desktopowej; bez internetu używa uproszczonego, własnego wzoru) i nakłada go na klockową postać w proporcjach jak w grze (także druga warstwa: kapelusz, kurtka, rękawy; smukłe ręce Alex). Własny skin wgrasz jako plik .png albo pobierzesz po nicku w „Edytuj → Scena”.
- **Dokładność:** po wygenerowaniu widzisz kartę „Zrozumiałem” (postacie, skiny, styl, czas, kroki), a przy zewnętrznym AI scenariusz jest dodatkowo sprawdzany i poprawiany w drugim zapytaniu. Można podać docelową długość (np. „około 5 sek” albo pole „Docelowa długość”) — czynności powtarzalne rozciągają się, by ją wypełnić.
- **Grafika ruchoma (nie tylko postacie):** odliczanie i liczniki („od 1 do 100 w 3 sekundy”), stoper/minutnik, paski ładowania, tytuły z animacją i konfetti, fajerwerki, śnieg… Własny, bezpieczny silnik wyrażeń (zależnych od czasu) pozwala AI zbudować dowolną płaską kompozycję: tekst, kształty, pierścienie, paski, cząsteczki, kopie z indeksem, easing. Edytujesz ją w „Edytuj → Scena” (teksty, kolory, tło, JSON).
- **Inna wersja** naprawdę zmienia kamerę, tło, styl lub kolory; **„Zrób z tego wideo i dodaj do montażu”** renderuje prawdziwy plik MP4/WebM (też do zapisania na dysk), który montujesz jak każde wideo.
- **Obraz AI** (Pollinations, bezpłatnie, wymaga internetu): generuje obraz z opisu i dodaje go do biblioteki.
- Asystent napisów/haszatagów może korzystać z tego samego podłączonego AI zamiast Claude.

**Zakładka „Gotowe”: szablony edytów, looki, napisy z piosenki**
- **Szablony (12 gotowych edytów)**: Football edit, Velocity, Glitch, Hype, Neonowa noc, Retro VHS, Kinowy trailer, Sny, Podróż/vlog, Lo-fi, Złoty hype, Mroczny edit. Jeden klik tnie klipy na rytm muzyki (albo co stały czas), nadaje każdemu ujęciu animację, efekty, krzywą prędkości i przejście oraz dodaje warstwę efektów. Wszystko to zwykłe klipy na osi — dalej edytujesz je ręcznie. Cofnięcie: Ctrl+Z.
- **Napisy z piosenki**: wklej tekst (linijka = napis) albo wczytaj plik `.lrc` / `.srt` z czasami. Wybierz styl, animację, pozycję i tryb (linijka lub słowo po słowie). Napisy wchodzą na oś jako zwykłe klipy tekstowe — przesuwasz je i zmieniasz im styl. Można je dołączyć od razu do szablonu.
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
