# Schultheis Coiffures: conceptsite

Preview voor `schultheis.workflowautomations.nl`. Losse statische bestanden, geen backend en geen
build-stap: wat in deze repo staat, is de site.

## Online zetten (Cloudflare Pages)

Koppel deze repo in Cloudflare Pages met:

| Instelling | Waarde |
| --- | --- |
| Productiebranch | `main` |
| Framework-preset | None |
| Build-commando | leeg laten |
| Build-uitvoermap | `/` |

Elke push naar `main` staat daarna vanzelf online. Het subdomein koppel je in Pages onder
*Custom domains*.

Lokaal bekijken: open `index.html` direct in de browser, of draai `python3 -m http.server` in deze map.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| `index.html` | Alle content en structuur |
| `styles.css` | Vormgeving, kleuren en fonts staan als variabelen bovenin |
| `app.js` | Smooth scroll, menu, de meeschuivende grote letters, openingstijden; laadt het 3D-deootje pas als de productsectie in beeld komt |
| `deo3d.js` | Het Loveli-deootje in 3D met three.js r186 (MIT), gebundeld en geminificeerd (ca. 140 kB gzip) |
| `src/deo3d.js` | Bron van `deo3d.js` (zie hieronder) |
| `lenis.min.js` | Lenis 1.3.26 (MIT) voor smooth scroll, lokaal zodat er geen externe CDN nodig is |
| `img/` | Beelden als webp, stockbeelden in een grote en een kleine (`-s`) variant |

De boekingslink (`https://schultheis.thera.nl`) en de openingstijden staan bovenin `app.js`.

### Het 3D-deootje opnieuw bouwen

Alleen nodig als je `src/deo3d.js` aanpast:

```sh
npm i --no-save three@0.186.1 esbuild
npx esbuild src/deo3d.js --bundle --minify --format=iife --global-name=SchultheisDeo --loader:.png=dataurl --outfile=deo3d.js
```

## Bronnen

- **Logo:** het bestaande logo van schultheis.nl, alleen omgekleurd voor een witte achtergrond. De koppen
  gebruiken Bebas Neue, het font van dat logo; de lopende tekst Open Sans, het font van de tagline.
- **Teksten, tarieven, openingstijden en de ansichtkaart van de Gierstraat:** schultheis.nl. De
  tarieven komen van de huidige site en moeten nog door de salon worden bevestigd.
- **Loveli:** logo en de deodorantfoto (terugval als 3D niet kan) van loveli.care. Het 3D-deootje is zelf
  gemodelleerd naar de echte verpakking.
- **O'right:** schultheis.nl noemt het naast Loveli als merk dat ze verkopen. Nog navragen of dat klopt.
- **Foto van Jeroen en Marlies en van de salon:** aangeleverd. Beide zijn klein (396 en 678 px breed);
  grotere versies maken de site direct scherper.
- **Haarfoto's:** Pexels (gratis licentie, geen naamsvermelding verplicht). Pexels-id's: 7440128 (hero),
  6503329 (tarieven).
