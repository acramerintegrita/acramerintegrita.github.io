# Website Integrita – Audit & Advisory

Quellcode der Website **https://acramerintegrita.github.io**.
GitHub baut die Seite nach jeder Änderung automatisch neu (Jekyll, 1–2 Minuten).

## Wo ändere ich was?

| Was | Datei |
|---|---|
| Kontaktdaten, Adresse, USt-IdNr., LinkedIn, Adresse des Kontaktformulars | `_config.yml` |
| Leistungen (Mandate, Audits, Advisory, Schulung) | `_data/leistungen.yml` |
| Themen & Regulatorik | `_data/themen.yml` |
| Menü | `_data/navigation.yml` |
| Startseite, Über mich, Netzwerk, Kontakt | `index.html`, `ueber-mich.html`, `netzwerk.html`, `kontakt.html` |
| Impressum, Datenschutzerklärung | `impressum.html`, `datenschutz.html` |
| Externe Dienste mit Einwilligung | `_data/consent.yml` (+ Datenschutzerklärung) |
| Farben, Abstände, Schriften | `assets/css/main.css` |
| Logo (`assets/images/logo/`), Favicons (`favicon.*`, `apple-touch-icon.png`, `icon-*.png`) | Kopien aus dem Design-Repo `integrita-design` – dort ändern und neu kopieren, nicht hier bearbeiten |

Gelb markierte Stellen auf der Website (z. B. `[E-Mail einfügen]`) sind noch nicht ausgefüllte Angaben aus `_config.yml`.

## Fotos

Foto mit genau diesem Namen nach `assets/images/` hochladen – es erscheint automatisch anstelle des Platzhalters:

| Datei | Wo |
|---|---|
| `andreas-cramer-hero.jpg` | Startseite (Hochformat, ca. 560 × 720 px) |
| `andreas-cramer-portrait.jpg` | Über mich (Hochformat, ca. 520 × 640 px) |
| `beirat.jpg` | Über mich, Kasten „Governance aus der Praxis“ |
| `schulung.jpg` | Leistungen → Schulung |

## Neuer Insights-Artikel

1. `_drafts/vorlage-artikel.md` kopieren nach `_posts/JJJJ-MM-TT-kurzer-titel.md`
2. Titel und Text anpassen, speichern – fertig.

## Kontaktformular einrichten

Anbieter: [Formspring](https://formspring.io) (Pixel & Process UG, Lübeck; Server in Deutschland; AVV nach Art. 28 DSGVO).

1. Konto bei formspring.io anlegen, **New form → Empty form**.
2. Benachrichtigungs-E-Mail und bei „Allowed origins“ `https://acramerintegrita.github.io` eintragen. Captcha, Akismet und KI-Funktionen **aus** lassen.
3. Die vollständige Formular-Adresse (z. B. `https://frmsp.io/f/…`) in `_config.yml` bei `kontaktformular_url` eintragen.

Beim Aufruf der Kontaktseite wird keine Verbindung zu Formspring aufgebaut, erst beim Absenden.
Eine Einwilligung ist dafür nicht nötig. Soll das Formular trotzdem erst nach Zustimmung nutzbar sein,
in `_data/consent.yml` einen Eintrag mit `id: kontaktformular` und `pflicht: false` anlegen.
Die Content-Security-Policy übernimmt den Server automatisch aus dieser Adresse. Bei einem Anbieterwechsel Abschnitt 5 in `datenschutz.html` anpassen.

## Sicherheit

- Keine Passwörter, Schlüssel oder privaten Dokumente ins Repository – es ist öffentlich.
- Private Unterlagen gehören in den Ordner `_privat/` (wird nie hochgeladen, siehe `.gitignore`).
- Die Content-Security-Policy steht in `_includes/head.html`. Neue externe Dienste müssen dort freigegeben werden.

## Lokale Vorschau (optional, mit Docker)

```bash
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e BUNDLE_PATH=/srv/vendor/bundle \
  -p 4000:4000 -v "$PWD":/srv -w /srv ruby:3.3 \
  sh -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
```

Dann http://localhost:4000 öffnen.

## Lizenzen

Schriften „Inter“ und „Cinzel“: SIL Open Font License 1.1 (`assets/fonts/LICENSE-*.txt`).
