# NPJOE — Website & Mitgliederverwaltung

Website der **Nepalesischen Progressiven Jugendorganisation e.V.** (VR 84826, Amtsgericht
Darmstadt) mit Online-Beitrittserklärung, Volunteer-Registrierung, Spendenformular,
Kontaktformularen und einem internen Vorstandsbereich zur Verwaltung aller Eingänge.

Zweisprachig **Deutsch / Englisch**, hell/dunkel, ohne Build-Schritt, ohne externe
Abhängigkeiten — weder im Frontend noch im Server.

---

## Schnellstart

```bash
node server/server.js
```

Danach im Browser öffnen:

| Adresse | Inhalt |
| --- | --- |
| http://localhost:4173 | Website |
| http://localhost:4173/admin.html | Vorstandsbereich (Passwort: `npjoe-admin`) |

> **Vor dem Livegang unbedingt das Admin-Passwort ändern** (siehe „Konfiguration“).

Die Website funktioniert auch **ohne Server**: Einfach `index.html` im Browser öffnen.
Formulare schalten dann automatisch in den Offline-Modus (siehe unten).

---

## Seitenübersicht

| Datei | Seite |
| --- | --- |
| `index.html` | Startseite: sieben kurze Tiles — Hero, Flaggschiff, zwei Programme, Berufsfeld-Rail, Mitgliedschaft, News, Wegweiser |
| `mitmachen.html` | Die vier Wege im Vergleich: Mitgliedschaft, Volunteering, Spenden, Partnerschaft — mit Voraussetzungen, Aufwand, Kosten und den fünf Kernzielen des Beschlusses |
| `wirkung.html` | Ablauf eines Einsatzes, Aufgabenteilung NPJOE / NPYO, Trainingsinhalte, Zielgruppen, sechs Nachhaltigkeitsmechanismen |
| `ueber-uns.html` | Wer wir sind, die neun Satzungszwecke, Vorstand & Organe, Partnerschaft NPYO, Zeitstrahl |
| `satzung.html` | Vollständige Satzung §§ 1–13 mit Sprungnavigation und Druckansicht |
| `programme.html` | Projektbeschluss NPJOE-2026-001: alle drei Programme, Satzungszuordnung, Beschlüsse 1–5 |
| `one-day-for-nation.html` | Programm 01 — Volunteering, 12 Berufsfelder mit Filter, Ablauf |
| `erste-hilfe-kampagne.html` | Programm 02 — Flaggschiff, Trainingsinhalte, Zielgruppen, Nachhaltigkeit |
| `one-euro-for-nation.html` | Programm 03 — Spendeninitiative, Spendenstufen, Weg der Spende |
| `mitglied-werden.html` | **Beitrittserklärung** — 4-stufiges Formular mit Unterschriftsfeld |
| `volunteer.html` | **Volunteer-Registrierung** — 4-stufiges Formular nach Berufsfeld |
| `spenden.html` | **Spendenformular** mit Wirkungsrechner und Bankverbindung |
| `kontakt.html` | **Kontaktformular** + Formular für Partner, Schulen und Förderer |
| `veranstaltungen.html` | Termine mit Filter, Suche und `.ics`-Download |
| `news.html` | Feed mit 11 Beiträgen, ausklappbaren Volltexten, Filter, Suche und Newsletter |
| `galerie.html` | Bildergalerie mit Lightbox und Filter |
| `transparenz.html` | Mittelherkunft und -verwendung, Kontrollmechanismen, Berichte |
| `faq.html` | 39 Fragen und Antworten, nach Kategorie filterbar und durchsuchbar |
| `impressum.html` | Impressum nach § 5 DDG |
| `datenschutz.html` | Datenschutzerklärung nach DSGVO (15 Abschnitte) |
| `admin.html` | Vorstandsbereich: Eingänge, Status, Notizen, CSV-Export |
| `404.html` | Fehlerseite |

---

## Formulare

Fünf Formulartypen, alle mit derselben Engine (`assets/js/forms.js`):

| Typ | Seite | Besonderheiten |
| --- | --- | --- |
| `membership` | Mitglied werden | 4 Schritte, Unterschriftsfeld, fortlaufende Mitgliedsnummer |
| `volunteer` | Volunteer werden | 4 Schritte, 12 Berufsfelder, Einsatzdauer |
| `donation` | Spenden | Wirkungsrechner, Verwendungszweck als Referenz |
| `contact` / `partner` | Kontakt | Themenauswahl, Kooperationsanfragen |
| `newsletter` | Footer, News | Einzelfeld |

**Gemeinsame Funktionen**

- Feldvalidierung auf Deutsch und Englisch (E-Mail, Telefon, PLZ, IBAN, Mindestalter)
- Mehrstufige Formulare mit Fortschrittsanzeige und Prüfschritt vor dem Absenden
- Automatische Entwurfsspeicherung im Browser (30 Tage), auf Wunsch verwerfbar
- Unterschrift per Maus oder Finger, gespeichert als Bild
- Spamschutz per Honeypot-Feld und serverseitigem Rate-Limit
- Referenznummer für jede Einsendung (z. B. `MIT-2026-BAYQ`)

**Offline-Modus.** Läuft kein Server (z. B. bei reinem Static-Hosting), wird die Einsendung
als JSON-Datei heruntergeladen und das E-Mail-Programm mit vorausgefüllter Nachricht
geöffnet. Steuerbar über `assets/js/site.js`:

```js
forms: {
  mode: "auto",     // "auto" = Server versuchen, sonst Offline · "api" = nur Server · "offline" = nie Netzwerk
  apiBase: "/api",
  fallbackEmail: "info@progressive-youth.de"
}
```

---

## Vorstandsbereich

Der Bereich hat zwei Register: **Eingänge** und **Inhalte pflegen**.

### Register 1 — Eingänge

`admin.html` zeigt alle Eingänge und erlaubt:

- Kennzahlen je Formulartyp (gesamt / neu / letzte 7 Tage)
- Filtern nach Status und Volltextsuche
- Detailansicht inklusive Unterschrift
- Status setzen (`neu`, `in Prüfung`, `angenommen`, `abgelehnt`, `erledigt`) plus interne Notiz
- **CSV-Export** — geeignet für die Mitgliederliste nach § 8 der Satzung

### Register 2 — Inhalte pflegen

Damit der Vorstand die Website ohne Entwickler:in aktuell halten kann, lassen sich hier
bearbeiten:

| Bereich | Wirkt auf |
| --- | --- |
| **Veranstaltungen** | Startseite und Terminseite, inklusive Kalender-Download |
| **News** | Feed auf der Startseite und unter „News“, mit ausklappbarem Volltext |
| **FAQ** | FAQ-Seite und die Auszüge auf Programm- und Mitmachen-Seiten |
| **Wirkungszahlen** | Startseite, Wirkung, Erste-Hilfe-Kampagne, Spenden, Transparenz |
| **Kontakt- und Bankdaten** | Kopf- und Fußzeile, Kontaktseite, Spendenformular |

Jeder Eintrag lässt sich anlegen, bearbeiten, duplizieren, verschieben und löschen — jeweils
zweisprachig. Änderungen sind sofort auf der Website sichtbar; ein Deployment ist nicht nötig.

**Bewusst nicht über den Browser änderbar:** Satzung, Impressum, Datenschutzerklärung sowie
Aufbau und Gestaltung der Seiten. Diese Texte ändern sich selten, haben rechtliches Gewicht
und gehören in die Hand einer Person, die den Zusammenhang prüft.

**Sicherheitsnetze**

- Vor jedem Speichern wird die vorherige Fassung gesichert; die letzten 20 bleiben erhalten
  (`server/data/content-backups/`)
- Der Server prüft Datumsformate, Pflichtfelder und Zahlenwerte und lehnt Fehlerhaftes ab
- Wer gespeichert hat, wird mitprotokolliert
- Beim Verlassen der Seite mit ungespeicherten Änderungen warnt der Browser

Die gepflegten Inhalte liegen in `server/data/content.json`. Fehlt die Datei — etwa bei
reinem Static-Hosting — verwendet die Website die eingebauten Inhalte aus
`assets/js/content.js`; sie funktioniert also weiterhin vollständig.

### Register 3 — Dokumente

Vier druckfertige A4-Dokumente, die der Verein laut Satzung und Projektbeschluss ausstellt:

| Dokument | Grundlage | Daten aus |
| --- | --- | --- |
| **Mitgliedsbestätigung** | § 5 der Satzung, mit Mitgliedsnummer | Beitrittserklärung |
| **Volunteer-Zertifikat** | „Offizielles NPJOE-Zertifikat nach jedem Einsatz“ | Volunteer-Registrierung |
| **Schulzertifikat „Erste-Hilfe-Schule“** | Erste-Hilfe-Kampagne | manuell |
| **Zuwendungsbestätigung** | § 10b EStG, § 5 Abs. 1 Nr. 9 KStG | Spendenzusage |

Die Angaben werden auf Wunsch aus einem Eingang übernommen; der Rest wird ergänzt. Der
Druckknopf bleibt gesperrt, solange Pflichtfelder fehlen. Gedruckt wird nur das Dokument,
nicht die Verwaltungsoberfläche — Format A4, Ränder bereits gesetzt.

Die Zuwendungsbestätigung enthält die gesetzlich vorgeschriebenen Formulierungen samt
Haftungs- und Fünfjahreshinweis und nennt den Betrag zusätzlich in Buchstaben.

> **Wichtig:** Für den Abzug beim Finanzamt ist der amtlich vorgeschriebene Vordruck
> maßgeblich. Lassen Sie die Fassung vor dem ersten Versand einmalig steuerlich prüfen und
> tragen Sie Finanzamt, Steuernummer und Datum des Freistellungsbescheids ein.

### Register 4 — Auskunft & Löschung

Die Datenschutzerklärung sagt zu, Anfragen nach Art. 15 und Art. 17 DSGVO innerhalb eines
Monats zu beantworten. Dieses Register macht das praktisch möglich:

- **Suchen** über alle sechs Formularsammlungen hinweg nach E-Mail oder Namen
- **Auskunft** als Datei zum Aushändigen (Art. 15), mit Rechtsgrundlage und Verantwortlichem
- **Löschen** — mit einer Vorschau, was dabei geschieht

Beim Löschen wird unterschieden, weil zwei Pflichten kollidieren:

| Datenart | Was passiert | Warum |
| --- | --- | --- |
| Kontakt, Volunteer, Newsletter, Partner | vollständig gelöscht | keine Aufbewahrungspflicht |
| Beitrittserklärung | **eingeschränkt** statt gelöscht | § 147 AO (Beitragsbuchhaltung) |
| Spendenzusage | **eingeschränkt** statt gelöscht | § 50 EStDV (Zuwendungsbestätigung) |

Eingeschränkte Datensätze behalten nur, was die Aufbewahrungspflicht wirklich braucht —
Name, Nummer, Betrag, Zweck. Anschrift, Geburtsdatum, E-Mail, Beruf, Interessen und
Freitexte werden entfernt. Jeder Datensatz vermerkt Grund und Aufbewahrungsjahr.

Jede Löschung wird protokolliert (Art. 5 Abs. 2). Im Protokoll steht die Person nur als
Einwegkennung — die E-Mail-Adresse selbst wird dort nicht gespeichert.

### Antwortvorlagen

Nach jeder Entscheidung folgt ein Brief — der am häufigsten wiederholte Handgriff im
Vorstand und die leichteste Stelle, Mitgliedsnummer, Beitrag oder Bankverbindung zu
vergessen. In der Detailansicht eines Eingangs steht deshalb eine passende Vorlage bereit:

| Vorlage | Für |
| --- | --- |
| Aufnahme bestätigen | Mitgliedsnummer, Beitrag, Bankverbindung, Verwendungszweck, § 5 und § 9 — vollständig, nichts zu ergänzen |
| Rückfrage stellen · Ablehnung mitteilen | Beitrittserklärungen |
| Registrierung bestätigen · Einsatz anbieten | Volunteers |
| Spende bestätigen | mit Verwendungszweck und, falls gewünscht, Hinweis auf die Zuwendungsbestätigung |
| Allgemeine Antwort | alles Übrige |

Der Brief erscheint in der Sprache, die die Person im Formular gewählt hat; sonst in der,
in der sie die Website benutzt hat. Stellen, die der Vorstand noch schreiben muss, stehen
in eckigen Klammern. Text kopieren oder direkt im Mail-Programm öffnen — bei sehr langen
Briefen weist die Oberfläche darauf hin, dass Kopieren der verlässliche Weg ist.

### Benachrichtigungen

Ohne Meldung bleibt eine Beitrittserklärung liegen, bis sich jemand anmeldet. Setzen Sie
beim Serverstart:

```bash
NPJOE_WEBHOOK_URL='https://hooks.slack.com/services/…' node server/server.js
```

Funktioniert mit allem, was JSON per POST annimmt — Slack, Discord, ein Telegram-Relay,
n8n, Zapier. **Die Meldung enthält bewusst keine personenbezogenen Daten**, nur Formularart
und Referenz. Alles andere wäre eine neue Datenübermittlung an Dritte, häufig außerhalb der
EU, die die Datenschutzerklärung nicht abdeckt. Fällt der Webhook aus, merkt die Person am
Formular nichts davon.

Im Vorstandsbereich zeigt „Eingänge“ den Zustellstatus der letzten Meldungen und erlaubt
eine Testnachricht.

### Anmeldung

Die Anmeldung nutzt ein serverseitiges Passwort, eine HttpOnly-Session (8 Stunden) und ein
Limit von 8 Versuchen pro 5 Minuten.

---

## Konfiguration

### Vereinsdaten

Alle Angaben stehen zentral in **`assets/js/site.js`** — Name, Anschrift, E-Mail-Adressen,
Bankverbindung, Beitragshöhe, Social-Media-Links und die auf der Website gezeigten
Wirkungszahlen. Änderungen dort wirken auf allen Seiten (Kopf- und Fußzeile, Formulare).

### Inhalte

Termine, News, FAQ, Wirkungszahlen und Kontaktdaten pflegt der Vorstand im Browser unter
`admin.html` → **Inhalte pflegen**. Ein Eingriff in den Code ist dafür nicht nötig.

**`assets/js/content.js`** enthält die Ausgangsfassung dieser Inhalte sowie die Dinge, die
nur im Code stehen: die zwölf Berufsfelder, die Galerie und die Spendenstufen — jeweils
zweisprachig. Was hier steht, gilt so lange, bis es über den Vorstandsbereich überschrieben
wird, und dient als Rückfallebene, wenn kein Server läuft.

### Serverpasswort und Datenverzeichnis

```bash
NPJOE_ADMIN_PASSWORD='ein-langes-eigenes-passwort' PORT=8080 node server/server.js
```

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `PORT` | `4173` | Port des Servers |
| `NPJOE_ADMIN_PASSWORD` | `npjoe-admin` | Passwort für den Vorstandsbereich |
| `NPJOE_DATA_DIR` | `server/data` | Ablage der Einsendungen — auf einem Plattform-Host **zwingend** außerhalb des Anwendungsordners |
| `NPJOE_WEBHOOK_URL` | leer | Meldung bei neuen Eingängen |
| `NODE_ENV` | leer | `production` schaltet HSTS ein |
| `HOST` | `0.0.0.0` | Netzwerkschnittstelle |

Einsendungen liegen als JSON Lines (`server/data/*.jsonl`) — eine Zeile pro Eingang, mit
jedem Texteditor lesbar und leicht zu sichern.

---

## Noch zu ergänzen (vor der Veröffentlichung)

Diese Stellen sind bewusst als Platzhalter markiert, weil sie amtliche Angaben brauchen:

1. **Impressum** — Straße, Hausnummer, Telefonnummer, Steuernummer / Freistellungsbescheid
2. **Bankverbindung** — IBAN und BIC in `assets/js/site.js` sowie auf `spenden.html`
3. **Datenschutzerklärung** — Anschrift ergänzen; falls ein Hosting-Anbieter, Newsletter-
   Dienst oder Zahlungsdienstleister hinzukommt, die betreffenden Abschnitte anpassen
4. **Fotos** — die Galerie nutzt derzeit generierte Platzhaltergrafiken
5. **Zahlen** — Wirkungszahlen in `assets/js/site.js` und auf `transparenz.html` sind
   Planungsstände und sollten durch geprüfte Werte ersetzt werden
6. **E-Mail-Adressen** — die vier Postfächer (`info@`, `mitglied@`, `volunteer@`, `spenden@`)
   müssen beim Hoster eingerichtet sein

Eine anwaltliche Prüfung von Impressum und Datenschutzerklärung ist empfehlenswert.

---

## Veröffentlichen

### Auf Render (empfohlen)

Render führt Node-Dienste aus, stellt HTTPS bereit und kann aus der mitgelieferten
`render.yaml` alles Nötige selbst anlegen.

**1. Code zu GitHub bringen**

```bash
git init && git add . && git commit -m "NPJOE Website"
git branch -M main
git remote add origin https://github.com/<konto>/<repository>.git
git push -u origin main
```

**2. In Render anlegen**

Dashboard → **New** → **Blueprint** → dieses Repository wählen. Render liest `render.yaml`
und richtet ein:

| Was | Wert | Warum |
| --- | --- | --- |
| Dienst | Web Service, Node | führt `node server/server.js` aus |
| Region | Frankfurt | innerhalb der EU, passend zur Datenschutzerklärung |
| Health Check | `/healthz` | Render erkennt, ob der Dienst lebt |
| Disk | 1 GB unter `/var/data` | **hier liegen die Daten dauerhaft** |
| `NPJOE_ADMIN_PASSWORD` | von Render erzeugt | steht nirgends im Repository |
| `NODE_ENV` | `production` | schaltet den HSTS-Header ein |

**3. Zwei Dinge im Dashboard nachtragen**

- `NPJOE_WEBHOOK_URL` — falls Meldungen bei neuen Eingängen gewünscht sind
- Das erzeugte Admin-Passwort unter **Environment** ablesen und sicher verwahren

**4. Prüfen**

```
https://<dienst>.onrender.com/healthz
```

Antwortet `{"ok":true,"persistentStorage":true}`, ist alles richtig verkabelt.

> ### Der Fallstrick, der alles kostet
>
> Renders Dateisystem ist **flüchtig**: Bei jedem Deploy und jedem Neustart wird es
> zurückgesetzt. Ohne den Disk aus `render.yaml` wären sämtliche Beitrittserklärungen,
> Spendenzusagen und gepflegten Inhalte danach spurlos verschwunden — ohne Fehlermeldung.
>
> Deshalb: **Plan `starter` oder höher**, denn der kostenlose Plan bietet keinen Disk.
> Läuft der Dienst dennoch ohne Disk, schreibt der Server bei jedem Start eine
> unübersehbare Warnung ins Log, und `node server/preflight.js` meldet es als Blocker.

**Was Render sonst noch bedeutet**

- HTTPS und Zertifikat kommen automatisch; eine eigene Domain lässt sich im Dashboard
  verbinden
- Der Free-Plan schläft nach 15 Minuten ohne Zugriff ein; der erste Aufruf danach dauert
  etwa eine Minute. Für einen Verein meist verschmerzbar — nur eben nicht zusammen mit den
  Daten auf demselben Plan
- Sicherungen: `server/data/` liegt auf dem Disk. Über den Vorstandsbereich lassen sich
  Eingänge als CSV exportieren; für ein vollständiges Backup den Disk in Render sichern

### Auf einem eigenen Server

Auf jedem Host mit Node.js (z. B. ein kleiner vServer, Uberspace):

Auf jedem Host mit Node.js (z. B. ein kleiner vServer, Uberspace, Render, Railway):

```bash
NPJOE_ADMIN_PASSWORD='...' NODE_ENV=production PORT=8080 \
NPJOE_DATA_DIR=/var/lib/npjoe node server/server.js
```

Davor gehört ein Reverse Proxy (nginx, Caddy) mit **HTTPS** — ohne TLS dürfen keine
personenbezogenen Formulardaten übertragen werden. Für den Dauerbetrieb bietet sich ein
systemd-Service oder `pm2` an. Das Datenverzeichnis regelmäßig sichern und außerhalb des
Anwendungsordners halten, damit ein Update es nicht überschreibt.

### Ohne Server (reines Static-Hosting)

Alle Dateien außer `server/` auf einen Webspace, GitHub Pages, Netlify oder Vercel laden.
Die Website funktioniert vollständig; Formulare arbeiten im Offline-Modus. Alternativ lassen
sich die Formulare an einen Dienst wie Formspree hängen, indem in `site.js`
`apiBase` auf dessen Endpunkt zeigt.

---

## Gestaltung

Die Seiten folgen dem Aufbau, den Apple auf seinen Produktseiten verwendet: Jede Seite ist ein
Stapel randloser **Tiles**, die zwischen weiß, Pergament (`#f5f5f7`) und dunkel wechseln — der
Farbwechsel ersetzt Trennlinien. Dazu kommen die typografischen Kennwerte dieses Stils:

- Fließtext **17 px**, Überschriften im Gewicht **600**, negative Laufweite ab 17 px aufwärts
- Große, zentrierte Aussagen mit viel Luft (80 px und mehr pro Tile)
- Als Handlungsaufforderung ein ruhiger **Chevron-Link** („Mehr erfahren ›“) statt bunter Buttons
- Eine einzige Akzentfarbe für alles Interaktive — hier das Vereinsrot statt Apples Blau
- **Sticky Sub-Navigation** auf den langen Seiten (`mitmachen.html`, `wirkung.html`)
- **Karten-Rail** mit Schnappscrollen und Pfeiltasten für die zwölf Berufsfelder
- Sanftes Einblenden beim Scrollen (`.reveal-scale`), abgeschaltet bei `prefers-reduced-motion`

Alles davon steckt in `assets/css/main.css` (Abschnitte 29–34) und ist über die Tokens am
Dateianfang anpassbar.

## Aufbau

```
.
├── index.html … 404.html        21 Seiten, je zweisprachig DE/EN
├── assets/
│   ├── css/main.css             Designsystem: Tokens, Komponenten, Dark Mode, Druck
│   ├── js/site.js               Vereinsdaten & Formular-Modus  ← hier anpassen
│   ├── js/layout.js             Kopfzeile, Navigation, Fußzeile (an einer Stelle gepflegt)
│   ├── js/main.js               Sprache, Theme, Navigation, Filter, Animationen
│   ├── js/forms.js              Validierung, Assistent, Entwürfe, Unterschrift, Versand
│   ├── js/content.js            Ausgangsinhalte + Berufsfelder, Galerie, Spendenstufen
│   ├── js/admin-content.js      Inhaltseditor des Vorstandsbereichs
│   ├── js/documents.js          Vorlagen der vier Urkunden + Betrag in Worten
│   ├── js/admin-docs.js         Dokumentenausgabe im Vorstandsbereich
│   ├── js/admin-dsgvo.js        Auskunft und Löschung im Vorstandsbereich
│   ├── js/correspondence.js     Antwortvorlagen (DE/EN)
│   └── img/logo.svg             Logo / Favicon
├── server/
│   ├── server.js                Webserver + Formular-API + Admin-API + Inhalts-API
│   ├── preflight.js             Prüfung vor dem Livegang
│   └── data/                    Einsendungen (JSON Lines), content.json, Sicherungen
├── package.json · render.yaml   Start-Skripte und Render-Blueprint
├── test/                        Testsuite (node test/run.js)
├── robots.txt · sitemap.xml
└── README.md
```

Kopfzeile und Fußzeile stehen **nur** in `assets/js/layout.js`. Ein neuer Menüpunkt wird dort
im Array `NAV` ergänzt und erscheint auf allen 21 Seiten.

---

## Technische Hinweise

- **Zweisprachigkeit** ohne Übersetzungsdateien: Jeder Text steht als
  `<span data-lang="de">…</span><span data-lang="en">…</span>` im Markup, CSS blendet die
  nicht gewählte Sprache aus. Die Wahl bleibt im Browser gespeichert, `?lang=en` erzwingt sie.
- **Barrierefreiheit**: Sprunglink, Fokusrahmen, `aria`-Auszeichnungen an Navigation und
  Formularen, Fehlermeldungen mit `aria-invalid`, Bedienung per Tastatur, `prefers-reduced-motion`.
- **Datenschutz**: keine Tracking-Cookies, keine externen Schriften, keine Analysedienste,
  keine Social-Media-Plugins. Lokal gespeichert werden nur Sprache, Theme und Formularentwürfe.
- **Sicherheit**: Honeypot, Rate-Limits (12 Einsendungen / 10 Min., 8 Login-Versuche / 5 Min.),
  Längenbegrenzung der Felder, Pseudonymisierung der IP-Adresse, Schutz gegen
  Verzeichniswechsel beim Dateiausliefern und gegen Formelinjektion im CSV-Export.
- **Browser**: alle aktuellen Versionen von Chrome, Firefox, Safari und Edge.

---

## Vor dem Livegang

```bash
node server/preflight.js
```

Sucht die Platzhalter und Voreinstellungen, die im öffentlichen Betrieb gefährlich sind.
Zwei davon scheitern lautlos:

- das **voreingestellte Vorstandspasswort** gibt jede Beitrittserklärung samt Anschrift,
  Geburtsdatum und Unterschrift frei
- die **Platzhalter-IBAN** lässt Überweisungen von Spender:innen ins Leere laufen

Blocker verhindern eine Veröffentlichung, Warnungen sollten vorher geklärt sein. Der Server
gibt die offenen Blocker bei jedem Start aus, und der Vorstandsbereich zeigt sie oben an.
Sind alle Platzhalter gefüllt, verstummt die Prüfung vollständig.

## Sicherheits-Header

Jede Antwort — Seiten, Assets und API gleichermaßen — trägt `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy` und eine **Content Security Policy**. Da die Website
nichts von fremden Servern lädt (kein CDN, keine Schriftarten, keine Analyse), kann die
Richtlinie streng sein: `default-src 'self'`, kein Framing, keine Plugins, Formulare nur an
die eigene Herkunft. Unter `NODE_ENV=production` kommt HSTS hinzu.

## Barrierefreiheit

- Überschriften folgen einer lückenlosen Rangfolge; gleichrangige Karten tragen denselben
  Rang. Wo eine Überschrift kleiner aussehen soll, tut das eine Größenklasse (`.t-h4`),
  nicht ein falscher Rang.
- Jedes sichtbare Feld hat ein Label, jede Schaltfläche einen Namen, jede Grafik entweder
  eine Beschreibung oder `aria-hidden`.
- Fehlermeldungen werden mit `aria-invalid` markiert, in einer Live-Region angesagt und der
  Fokus springt auf das erste beanstandete Feld.
- Sichtbarer Fokusrahmen, Sprunglink, keine positiven `tabindex`-Werte.
- Beide Themes erfüllen WCAG AA (schlechtester gemessener Wert 4,57:1).
- Bewegung respektiert `prefers-reduced-motion`.

Nicht automatisch prüfbar und daher offen: ein Durchgang mit einem echten Screenreader
sowie die Bedienung ausschließlich per Tastatur durch eine Person.

## Tests

```bash
node test/run.js
```

359 Prüfungen ohne jede Abhängigkeit. Der Testlauf startet einen eigenen Server auf Port
4188 mit einem temporären Datenverzeichnis — die echten Daten unter `server/data/` werden
nicht angefasst.

Geprüft werden:

| Gruppe | Beispiele |
| --- | --- |
| **Seitenstruktur** | Alle Seiten laden dieselben Skripte, haben eine Meta-Beschreibung und Sprachauszeichnung |
| **Zweisprachigkeit** | Zu jedem deutschen Textbaustein existiert ein englischer |
| **Markup** | Keine doppelten IDs, kein Markup in `<option>`, alle Sprungmarken existieren |
| **Verlinkung** | Kein Link zeigt auf eine fehlende Datei |
| **Stylesheet** | Klammern balanciert; keine Regel kann Inhalte dauerhaft unsichtbar machen |
| **Formulare** | Alle sechs Typen nehmen gültige Eingaben an und lehnen ungültige ab |
| **Einwilligungen** | Ohne DSGVO-Häkchen wird die Beitrittserklärung abgelehnt |
| **Missbrauchsschutz** | Honeypot, Rate-Limit und Größenbegrenzung greifen nachweislich |
| **Vorstandsbereich** | Anmeldung, Session-Cookie, Statuswechsel, CSV-Export |
| **CSV-Sicherheit** | Zellen wie `=cmd|…` werden entschärft (Formel-Injektion) |
| **Inhaltspflege** | Speichern, Validierung, Sicherungen, Wiederherstellen |
| **Zugriffsschutz** | `server/data/` ist über HTTP nicht erreichbar |
| **Browser-Logik** | Scroll-Sequenz, Inhalts-Merge, Formular-Engine |
| **Dokumente** | Beträge in Worten (1–3000 geprüft), Pflichtangaben der Zuwendungsbestätigung, A4-Druckmaße |
| **DSGVO** | Auskunft findet alles, Löschung entfernt das Richtige, Aufbewahrungspflichten bleiben gewahrt |
| **Benachrichtigung** | Meldung erreicht einen Empfänger und enthält nachweislich keine personenbezogenen Daten |
| **Livegang-Prüfung** | schlägt bei Platzhaltern an und verstummt bei gepflegten Daten |
| **Barrierefreiheit** | Überschriftenrangfolge, Labels, Namen, Fokus, Alternativtexte |
| **Antwortvorlagen** | enthalten Nummer, Beitrag und Bankverbindung; folgen der gewünschten Sprache |
| **Deployment** | Health Check, Sicherheits-Header auf jeder Seite, Daten auf dem Disk, sauberes Herunterfahren bei SIGTERM |

Die Suite wurde gegen absichtlich eingebaute Fehler geprüft — jeder davon ein Fehler, der in
diesem Projekt tatsächlich einmal auftrat — und meldet sie alle. Zwei Prüfungen waren dabei
selbst fehlerhaft (eine übersah die in JavaScript erzeugte Markup-Variante, eine prüfte gar
nichts) und wurden repariert.

Der Testlauf sucht sich freie Ports selbst, damit parallele Läufe oder ein vergessener
Entwicklungsserver ihn nicht scheitern lassen. Zwanzig aufeinanderfolgende Läufe,
einschließlich paralleler, liefen ohne Ausreißer durch.

**Vor jeder Änderung und danach ausführen.** Rückgabewert 0 heißt bestanden.
