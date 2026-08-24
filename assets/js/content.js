/* ==========================================================================
   NPJOE — Content data & renderers
   Single source of truth for volunteer fields, events, news, FAQ, gallery,
   donation tiers. Edit here; every page updates.
   ========================================================================== */
(function () {
  "use strict";

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function bi(de, en) { return '<span data-lang="de">' + de + '</span><span data-lang="en">' + en + "</span>"; }

  /* ------------------------------------------------- 12 volunteer fields */
  var FIELDS = [
    {
      key: "health", emoji: "🏥", tag: "gesundheit",
      de: "Gesundheit & Medizin", en: "Health & Medicine",
      rolesDe: "Ärzt:innen, Krankenpfleger:innen, Apotheker:innen, Sanitäter:innen, Physiotherapeut:innen, Psychiater:innen, Ernährungsberater:innen",
      rolesEn: "Doctors, nurses, pharmacists, paramedics, physiotherapists, psychiatrists, nutritionists",
      exDe: "Gesundheitscamps, Ernährungsberatung, Augenuntersuchungen, Aufklärung zu psychischer Gesundheit, Zahnmedizin-Camps, Impfaufklärung",
      exEn: "Health camps, nutrition counselling, eye check-ups, mental-health awareness, dental camps, vaccination education"
    },
    {
      key: "education", emoji: "🎓", tag: "bildung",
      de: "Bildung & Unterricht", en: "Education & Teaching",
      rolesDe: "Lehrer:innen, Professor:innen, Tutor:innen, Sprachlehrer:innen, Sonderpädagog:innen, Berufsberater:innen",
      rolesEn: "Teachers, professors, tutors, language teachers, special educators, career counsellors",
      exDe: "Englisch-, Mathe- und Naturwissenschaftsunterricht, Lehrerfortbildung, Berufsberatung Klassen 9–12, Alphabetisierung für Erwachsene",
      exEn: "English, maths and science teaching, teacher training, career guidance for grades 9–12, adult literacy"
    },
    {
      key: "tech", emoji: "💻", tag: "technik",
      de: "Technologie & IT", en: "Technology & IT",
      rolesDe: "Softwareentwickler:innen, IT-Spezialist:innen, Datenwissenschaftler:innen, UX-Designer:innen, Netzwerk- und Cybersecurity-Fachleute",
      rolesEn: "Software developers, IT specialists, data scientists, UX designers, network and cybersecurity experts",
      exDe: "Computer-Grundkenntnisse in Schulen, Coding-Workshops für Jugendliche, Schul-IT warten, Websites für NGOs erstellen, digitale Lernplattformen einführen",
      exEn: "Basic computer skills in schools, coding workshops for youth, maintaining school IT, building NGO websites, introducing digital learning platforms"
    },
    {
      key: "engineering", emoji: "🏗️", tag: "technik",
      de: "Ingenieurwesen & Bau", en: "Engineering & Construction",
      rolesDe: "Bauingenieur:innen, Architekt:innen, Elektroingenieur:innen, Wasserbauexpert:innen, Umweltingenieur:innen",
      rolesEn: "Civil engineers, architects, electrical engineers, water engineers, environmental engineers",
      exDe: "Schulgebäude sicherheitstechnisch bewerten, Solaranlagen installieren, Sanitärsysteme verbessern, Erdbebensicherheit prüfen, Wasserleitungen planen",
      exEn: "Assessing school buildings for safety, installing solar systems, improving sanitation, checking earthquake resilience, planning water pipes"
    },
    {
      key: "law", emoji: "⚖️", tag: "soziales",
      de: "Recht & Soziales", en: "Law & Social Work",
      rolesDe: "Rechtsanwält:innen, Sozialarbeiter:innen, Psycholog:innen, Menschenrechtsexpert:innen, Berater:innen",
      rolesEn: "Lawyers, social workers, psychologists, human rights experts, counsellors",
      exDe: "Rechtliche Aufklärung, Kinder- und Frauenrechte, psychosoziale Beratung, NGO-Compliance, Gemeinschaftsmediation",
      exEn: "Legal awareness, children's and women's rights, psychosocial counselling, NGO compliance, community mediation"
    },
    {
      key: "arts", emoji: "🎨", tag: "kultur",
      de: "Kunst, Kultur & Kreativität", en: "Arts, Culture & Creativity",
      rolesDe: "Künstler:innen, Musiker:innen, Fotograf:innen, Filmemacher:innen, Designer:innen, Schriftsteller:innen, Tänzer:innen",
      rolesEn: "Artists, musicians, photographers, filmmakers, designers, writers, dancers",
      exDe: "Schulkunstprojekte, Wandmalereien, Musik- und Tanzworkshops, Schulzeitungen gestalten, nepalesisches Kulturerbe dokumentieren",
      exEn: "School art projects, murals, music and dance workshops, designing school newspapers, documenting Nepali heritage"
    },
    {
      key: "sports", emoji: "⚽", tag: "sport",
      de: "Sport & Bewegung", en: "Sports & Physical Education",
      rolesDe: "Sportlehrer:innen, Trainer:innen, Fitnesstrainer:innen, Yogalehrer:innen, Physiotherapeut:innen",
      rolesEn: "PE teachers, coaches, fitness trainers, yoga instructors, physiotherapists",
      exDe: "Fußball-, Volleyball- und Cricket-Coaching, Sportturniere organisieren, Yoga und mentale Stärke, Inklusionssport",
      exEn: "Football, volleyball and cricket coaching, organising tournaments, yoga and mental strength, inclusive sports"
    },
    {
      key: "environment", emoji: "🌿", tag: "umwelt",
      de: "Umwelt & Landwirtschaft", en: "Environment & Agriculture",
      rolesDe: "Agronom:innen, Umweltwissenschaftler:innen, Forstwirt:innen, Biolog:innen, Nachhaltigkeitsexpert:innen",
      rolesEn: "Agronomists, environmental scientists, foresters, biologists, sustainability experts",
      exDe: "Gemeinschaftsgärten, Baumpflanzaktionen, nachhaltige Landwirtschaft lehren, Schulumweltprojekte, Mülltrennung, Wasseraufklärung",
      exEn: "Community gardens, tree planting, teaching sustainable agriculture, school environment projects, waste separation, water awareness"
    },
    {
      key: "business", emoji: "💰", tag: "wirtschaft",
      de: "Wirtschaft & Finanzen", en: "Business & Finance",
      rolesDe: "Betriebswirt:innen, Buchhalter:innen, Unternehmensberater:innen, Marketing-Fachleute, Finanzexpert:innen",
      rolesEn: "Business administrators, accountants, management consultants, marketing professionals, finance experts",
      exDe: "Finanzkompetenz für Familien, Kleinunternehmen-Coaching, NGO-Budgetverwaltung, Unternehmergeist für Jugendliche",
      exEn: "Financial literacy for families, small-business coaching, NGO budget management, entrepreneurship for youth"
    },
    {
      key: "media", emoji: "📸", tag: "medien",
      de: "Medien & Kommunikation", en: "Media & Communications",
      rolesDe: "Journalist:innen, PR-Expert:innen, Social-Media-Manager:innen, Übersetzer:innen, Moderator:innen",
      rolesEn: "Journalists, PR experts, social media managers, translators, moderators",
      exDe: "Medienkompetenz für Schüler:innen, Schulradio und -zeitung aufbauen, Kommunikationstraining für NGOs, Projektdokumentation",
      exEn: "Media literacy for students, building school radio and newspapers, communication training for NGOs, project documentation"
    },
    {
      key: "nutrition", emoji: "🍳", tag: "gesundheit",
      de: "Ernährung & Hauswirtschaft", en: "Nutrition & Home Economics",
      rolesDe: "Ernährungswissenschaftler:innen, Köch:innen, Oecotropholog:innen, Gesundheitspädagog:innen",
      rolesEn: "Nutritionists, chefs, home economists, health educators",
      exDe: "Ernährungsworkshops, gesunde Kochkurse mit lokalen Zutaten, Lebensmittelhygiene, Schulküchenprojekte",
      exEn: "Nutrition workshops, healthy cooking with local ingredients, food hygiene, school kitchen projects"
    },
    {
      key: "mentalhealth", emoji: "🧘", tag: "gesundheit",
      de: "Psychische Gesundheit & Wohlbefinden", en: "Mental Health & Wellbeing",
      rolesDe: "Psycholog:innen, Psychiater:innen, Coaches, Therapeut:innen, Sozialpädagog:innen",
      rolesEn: "Psychologists, psychiatrists, coaches, therapists, social educators",
      exDe: "Anti-Mobbing-Programme, Stressmanagement für Schüler:innen und Lehrkräfte, Trauma-Aufklärung nach Naturkatastrophen, Elternberatung",
      exEn: "Anti-bullying programmes, stress management for students and teachers, trauma awareness after natural disasters, parent counselling"
    }
  ];

  /* --------------------------------------------------------------- Events */
  var EVENTS = [
    {
      id: "ev-2026-09-kickoff", date: "2026-09-19", time: "14:00–19:00",
      de: "Kick-off: One Day for Nation — Volunteer-Briefing", en: "Kick-off: One Day for Nation — volunteer briefing",
      placeDe: "Darmstadt, Hessen + Online", placeEn: "Darmstadt, Hesse + online",
      tags: "volunteer online", type: "volunteer",
      descDe: "Vorstellung des Programms, Matching-Verfahren mit NPYS-N, Fragen und Antworten zu Einsätzen ab einem Tag.",
      descEn: "Programme introduction, the matching process with NPYS-N, and Q&A on assignments from one day upwards."
    },
    {
      id: "ev-2026-10-erstehilfe", date: "2026-10-11", time: "10:00–16:00",
      de: "Erste-Hilfe-Trainer:innen-Schulung (Train-the-Trainer)", en: "First Aid train-the-trainer session",
      placeDe: "Frankfurt am Main", placeEn: "Frankfurt am Main",
      tags: "erste-hilfe bildung", type: "training",
      descDe: "Für medizinische Fachkräfte und ausgebildete Ersthelfer:innen, die in Nepal Klassen 9–12 schulen möchten.",
      descEn: "For medical professionals and certified first-aiders who want to train grades 9–12 in Nepal."
    },
    {
      id: "ev-2026-11-kultur", date: "2026-11-08", time: "17:00–22:00",
      de: "Interkulturelles Herbstfest & Spendenabend", en: "Intercultural autumn festival & fundraising evening",
      placeDe: "Darmstadt", placeEn: "Darmstadt",
      tags: "kultur spenden", type: "culture",
      descDe: "Musik, Tanz und nepalesische Küche — offen für die gesamte Öffentlichkeit. Erlös fließt in One Euro for Nation.",
      descEn: "Music, dance and Nepali cuisine — open to the general public. Proceeds go to One Euro for Nation."
    },
    {
      id: "ev-2026-12-mv", date: "2026-12-06", time: "11:00–15:00",
      de: "Ordentliche Mitgliederversammlung 2026", en: "Annual general meeting 2026",
      placeDe: "Darmstadt + Videokonferenz", placeEn: "Darmstadt + video conference",
      tags: "verein mitglieder", type: "governance",
      descDe: "Jahresbericht, Kassenprüfungsbericht, Haushalt und Wahlen gemäß § 9 der Satzung. Einladung erfolgt schriftlich mit zwei Wochen Frist.",
      descEn: "Annual report, audit report, budget and elections under § 9 of the statutes. Invitations are sent in writing two weeks in advance."
    },
    {
      id: "ev-2027-01-sport", date: "2027-01-24", time: "09:00–18:00",
      de: "NPJOE Winter-Cup: Fußball & Cricket", en: "NPJOE Winter Cup: football & cricket",
      placeDe: "Rhein-Main-Gebiet", placeEn: "Rhine-Main region",
      tags: "sport jugend", type: "sport",
      descDe: "Turnier für Jugendteams der Diaspora — Integration und Teilhabe durch Sport nach § 3(g) der Satzung.",
      descEn: "Tournament for diaspora youth teams — integration and participation through sport under § 3(g) of the statutes."
    },
    {
      id: "ev-2027-03-visa", date: "2027-03-14", time: "18:00–20:00",
      de: "Online-Seminar: Studium, Ausbildung & Visum in Deutschland", en: "Online seminar: study, training & visa in Germany",
      placeDe: "Online (Zoom)", placeEn: "Online (Zoom)",
      tags: "bildung online integration", type: "seminar",
      descDe: "Praxisseminar für neu angekommene Nepalis: Anerkennung von Abschlüssen, Sprachkurse, Bewerbung und Behördengänge.",
      descEn: "Practical seminar for newly arrived Nepalis: recognition of qualifications, language courses, applications and authorities."
    }
  ];

  /* ----------------------------------------------------------------- News */
  var NEWS = [
    {
      id: "n1", date: "2026-08-01", tag: "verein",
      de: "Projektbeschluss NPJOE-2026-001 einstimmig angenommen",
      en: "Project resolution NPJOE-2026-001 adopted unanimously",
      exDe: "Der Vorstand hat die drei Kernprogramme für 2026–2030 beschlossen: One Day for Nation, die Nationale Erste-Hilfe-Kampagne und One Euro for Nation.",
      exEn: "The board adopted the three core programmes for 2026–2030: One Day for Nation, the National First Aid Campaign and One Euro for Nation.",
      bodyDe: "Der Beschluss gilt als offizieller Vereinsbeschluss und bildet die Grundlage für alle Aktivitäten, Kooperationen und Förderanträge im Rahmen dieser Initiative. Er definiert eine Laufzeit vom 1. Januar 2026 bis zum 31. Dezember 2030 und richtet sich ausdrücklich an alle Nepalis weltweit, die im Ausland leben — nicht nur an die Gemeinschaft in Deutschland. Zusätzlich verpflichtet sich der Verein in Beschluss 5 zur jährlichen öffentlichen Berichterstattung über alle Programmaktivitäten.",
      bodyEn: "The resolution serves as the official organisational resolution and forms the basis for all activities, cooperations and funding applications within this initiative. It defines a term from 1 January 2026 to 31 December 2030 and is expressly aimed at all Nepalis worldwide living abroad — not only the community in Germany. In resolution 5 the association additionally commits to annual public reporting on all programme activities."
    },
    {
      id: "n2", date: "2026-08-15", tag: "partner",
      de: "MOU mit NPYS-N für die drei Kernprogramme unterzeichnet",
      en: "MOU with NPYS-N signed for the three core programmes",
      exDe: "Beide Vorsitzenden unterzeichneten das Memorandum of Understanding im Online-Meeting. Es gilt vom 15. August 2026 bis 31. Dezember 2030.",
      exEn: "Both chairpersons signed the Memorandum of Understanding during an online meeting. It runs from 15 August 2026 to 31 December 2030.",
      bodyDe: "Das MOU regelt die gemeinsame Umsetzung von One Day for Nation, der Erste-Hilfe-Kampagne und One Euro for Nation. NPJOE rekrutiert und zertifiziert Volunteers, stellt Trainer:innen und verwaltet Spenden; NPYS-N koordiniert Einsätze, wählt Schulen und Gemeinschaften aus und legt geprüfte Projektvorschläge sowie Verwendungsnachweise vor. Vereinbart sind unter anderem Quartalsberichte, Einzelbelege innerhalb von 30 Tagen, zehnjährige Aufbewahrung der Finanzunterlagen und mindestens zwei Koordinationstreffen pro Jahr.",
      bodyEn: "The MOU governs joint delivery of One Day for Nation, the First Aid Campaign and One Euro for Nation. NPJOE recruits and certifies volunteers, provides trainers and manages fundraising; NPYS-N coordinates deployments, identifies schools and communities, and submits verified project proposals and expense reports. The safeguards include quarterly reporting, itemised receipts within 30 days, ten-year retention of financial records and at least two coordination meetings per year."
    },
    {
      id: "n3", date: "2026-06-20", tag: "erste-hilfe",
      de: "Erste-Hilfe-Kampagne: Lehrmaterial auf Nepali fertiggestellt",
      en: "First Aid Campaign: Nepali training materials completed",
      exDe: "Handbücher, Poster und Übungsmaterial liegen nun vollständig auf Nepali vor — ohne Sprachbarrieren für Schüler:innen und Lehrkräfte.",
      exEn: "Manuals, posters and practice materials are now fully available in Nepali — no language barriers for students and teachers."
    },
    {
      id: "n4", date: "2026-06-10", tag: "verein",
      de: "Aktuelle Satzung vom 10. Juni 2026 — Eintragung unter VR 84826",
      en: "Current statutes dated 10 June 2026 — registered under VR 84826",
      exDe: "Der Verein ist beim Amtsgericht Darmstadt eingetragen und verfolgt ausschließlich gemeinnützige und mildtätige Zwecke nach §§ 52, 53 AO.",
      exEn: "The association is registered at Darmstadt district court and exclusively pursues charitable and benevolent purposes under §§ 52, 53 AO."
    },
    {
      id: "n5", date: "2026-04-09", tag: "spenden",
      de: "One Euro for Nation startet: erste 1.000 € für Schulmaterialien",
      en: "One Euro for Nation launches: first €1,000 for school materials",
      exDe: "Hunderte Kleinspenden aus sieben Ländern finanzieren Hefte, Stifte und Bücher für Schüler:innen aus benachteiligten Familien.",
      exEn: "Hundreds of small donations from seven countries finance notebooks, pens and books for students from disadvantaged families."
    },
    {
      id: "n6", date: "2026-03-02", tag: "volunteer",
      de: "Über 200 Volunteers aus 17 Ländern registriert",
      en: "More than 200 volunteers registered from 17 countries",
      exDe: "Von Ärzt:innen über Softwareentwickler:innen bis zu Yogalehrer:innen — die Diaspora bringt ihre Berufe ein.",
      exEn: "From doctors to software developers to yoga instructors — the diaspora is contributing its professions.",
      bodyDe: "Nach den ersten Monaten der Registrierung zeigt sich, wie breit die beruflichen Hintergründe der Diaspora sind. Am stärksten vertreten sind Gesundheit und Medizin, Bildung sowie Technologie und IT — genau die Bereiche, in denen NPYS-N den größten Bedarf meldet. Registrierungen kommen aus Deutschland, Österreich, der Schweiz, Großbritannien, den USA, Kanada, Australien, Japan, Südkorea und den Golfstaaten. Jede Registrierung ist kostenlos und unverbindlich: Erst beim Matching entscheiden Volunteer und Partnerorganisation gemeinsam, ob ein Einsatz zustande kommt.",
      bodyEn: "After the first months of registration it is clear how broad the professional backgrounds of the diaspora are. Health and medicine, education, and technology and IT are the strongest fields — exactly where NPYS-N reports the greatest need. Registrations come from Germany, Austria, Switzerland, the UK, the USA, Canada, Australia, Japan, South Korea and the Gulf states. Every registration is free and non-binding: only at the matching stage do the volunteer and the partner organisation jointly decide whether an assignment goes ahead."
    },
    {
      id: "n7", date: "2026-08-10", tag: "erste-hilfe",
      de: "Zwölfte Schule in das Kampagnenprogramm aufgenommen",
      en: "Twelfth school admitted to the campaign programme",
      exDe: "Damit sind rund 1.450 Schüler:innen der Klassen 9–12 geschult und 68 Lehrkräfte zu dauerhaften Trainer:innen ausgebildet.",
      exEn: "Around 1,450 students in grades 9–12 have now been trained and 68 teachers certified as permanent trainers.",
      bodyDe: "Die Auswahl der Schulen trifft NPYS-N nach drei Kriterien: Erreichbarkeit für Volunteer-Teams, Bereitschaft der Schulleitung, mindestens eine Lehrkraft dauerhaft als Trainer:in freizustellen, und der Anteil von Schüler:innen aus benachteiligten Familien. Jede aufgenommene Schule erhält ein zertifiziertes Erste-Hilfe-Kit, Handbücher und Übungsmaterial auf Nepali sowie einen jährlichen Auffrischungsbesuch. Ziel des Beschlusses NPJOE-2026-001 sind 100 Schulen bis Ende 2030.",
      bodyEn: "NPYS-N selects schools by three criteria: accessibility for volunteer teams, the school management's willingness to permanently release at least one teacher as a trainer, and the share of students from disadvantaged families. Every admitted school receives a certified First Aid kit, manuals and practice material in Nepali, plus an annual refresher visit. Resolution NPJOE-2026-001 targets 100 schools by the end of 2030."
    },
    {
      id: "n8", date: "2026-07-28", tag: "verein",
      de: "Seminarreihe zu Visum, Ausbildung und Studium startet im Herbst",
      en: "Seminar series on visas, training and study starts in autumn",
      exDe: "Kostenlose Online-Formate für neu angekommene Nepalis — zu Anerkennung von Abschlüssen, Sprachkursen, Bewerbungen und Behördengängen.",
      exEn: "Free online formats for newly arrived Nepalis — on recognition of qualifications, language courses, applications and dealing with authorities.",
      bodyDe: "§ 3(b) der Satzung verpflichtet uns zu Seminaren, Workshops und Online-Formaten in Deutschland zu Themen wie Visa, Ausbildung, Studium, Sprache, Integration und Leben in Deutschland. Die Reihe richtet sich an Menschen, die neu in Deutschland sind, und an alle, die ihre Angehörigen dabei unterstützen. Die Teilnahme ist kostenlos und steht auch Nichtmitgliedern offen; Aufzeichnungen stellen wir Mitgliedern anschließend zur Verfügung.",
      bodyEn: "§ 3(b) of the statutes commits us to seminars, workshops and online formats in Germany on topics such as visas, vocational training, study, language, integration and life in Germany. The series is aimed at people new to Germany and at everyone supporting relatives through the process. Participation is free and open to non-members; recordings are afterwards made available to members."
    },
    {
      id: "n9", date: "2026-06-05", tag: "spenden",
      de: "One Euro for Nation erreicht 34 Prozent des Jahresziels",
      en: "One Euro for Nation reaches 34 per cent of the annual goal",
      exDe: "8.420 € von 25.000 € — finanziert wurden bislang 168 Erste-Hilfe-Kits und rund 2.400 Hefte und Stifte.",
      exEn: "€8,420 of €25,000 — funding 168 First Aid kits and around 2,400 notebooks and pens so far.",
      bodyDe: "Die Initiative lebt von vielen kleinen Beiträgen: Der häufigste Spendenbetrag liegt unter zehn Euro. Alle Spenden werden über das einheitliche Vereinskonto verwaltet, über das Schatzmeister:in und Vorsitz nur gemeinsam verfügen dürfen (§ 10 der Satzung). Wo möglich, wird Material lokal in Nepal beschafft — das stärkt die regionale Wirtschaft und senkt Transportkosten.",
      bodyEn: "The initiative lives on many small contributions: the most common donation is under ten euros. All donations are managed through the single association account, over which the treasurer and chair may only dispose jointly (§ 10 of the statutes). Where possible, materials are procured locally in Nepal — this strengthens the regional economy and lowers transport costs."
    },
    {
      id: "n10", date: "2026-05-30", tag: "partner",
      de: "Erste Lehrkräfte schließen die Train-the-Trainer-Ausbildung ab",
      en: "First teachers complete the train-the-trainer programme",
      exDe: "Sie führen die Erste-Hilfe-Kurse an ihrer Schule künftig eigenständig durch — das Programm läuft weiter, wenn die Volunteer-Teams abgereist sind.",
      exEn: "They will run the first aid courses at their school independently — the programme continues once the volunteer teams have left.",
      bodyDe: "Nachhaltigkeit ist kein Zusatz, sondern in das Programm eingebaut. Ausgebildete Lehrkräfte werden zu zertifizierten Trainer:innen, ausgebildete Schüler:innen werden Mentor:innen für die nächste Klasse. Sämtliche Materialien liegen auf Nepali vor, damit keine Sprachbarriere entsteht. NPYS-N besucht jede Schule jährlich zur Auffrischung und dokumentiert, wie viele Personen erreicht wurden.",
      bodyEn: "Sustainability is not an add-on but built into the programme. Trained teachers become certified trainers, trained students become mentors for the next class. All materials are in Nepali so that no language barrier arises. NPYS-N visits each school annually for refreshers and documents how many people were reached."
    },
    {
      id: "n11", date: "2026-04-18", tag: "kultur",
      de: "Kulturfest in Hessen: offen für die gesamte Öffentlichkeit",
      en: "Cultural festival in Hesse: open to the general public",
      exDe: "Musik, Tanz und nepalesische Küche — interkulturelle Begegnung nach § 3(c) der Satzung, ausdrücklich nicht nur für die Diaspora.",
      exEn: "Music, dance and Nepali cuisine — intercultural encounter under § 3(c) of the statutes, expressly not only for the diaspora.",
      bodyDe: "Unsere Kulturarbeit hat zwei Richtungen: Sie bewahrt die Verbindung der hier aufwachsenden Generation zu ihrer Herkunft, und sie öffnet diese Kultur für Nachbarschaft, Schulen und Vereine vor Ort. Deshalb sind alle Kulturveranstaltungen öffentlich. Der Erlös des Abends fließt vollständig in die Spendeninitiative One Euro for Nation.",
      bodyEn: "Our cultural work runs in two directions: it preserves the connection of the generation growing up here to their origins, and it opens that culture to neighbours, schools and local associations. That is why all cultural events are public. The evening's proceeds go entirely to the One Euro for Nation donation initiative."
    },
    {
      id: "n12", date: "2024-10-05", tag: "kultur",
      de: "Dashain-Feier 2024: Kultur, Begegnung und Gemeinschaft",
      en: "Dashain celebration 2024: culture, connection and community",
      exDe: "Am 5. Oktober 2024 kamen Mitglieder, Freund:innen und Gäste zu einem gemeinsamen Dashain-Fest mit Bühnenprogramm, Ehrungen und nepalesischem Essen zusammen.",
      exEn: "On 5 October 2024, members, friends and guests came together for a Dashain celebration with a stage programme, presentations and Nepali food.",
      bodyDe: "Die Fotodokumentation zeigt den Empfang und die Anmeldung, Beiträge auf der Bühne, die Pokal- und Medaillenübergabe sowie viele Begegnungen beim gemeinsamen Essen. Alle 16 Bilder und ein kurzer Videoclip sind in der Galerie zu sehen.",
      bodyEn: "The photo story covers reception and registration, contributions on stage, the trophy and medal presentation, and community moments over a shared meal. All 16 photographs and a short video clip are available in the gallery.",
      image: "assets/media/dashain-2024/trophy-presentation.jpg",
      imageAltDe: "Pokalübergabe bei der Dashain-Feier der NPJOE am 5. Oktober 2024",
      imageAltEn: "Trophy presentation at the NPJOE Dashain celebration on 5 October 2024",
      href: "galerie.html#dashain-2024"
    }
  ];

  /* ------------------------------------------------------------------ FAQ */
  var FAQ = [
    { cat: "mitglied", qDe: "Wer kann Mitglied werden?", qEn: "Who can become a member?",
      aDe: "Nach § 5 der Satzung kann jede natürliche Person Mitglied werden — unabhängig von Herkunft, Staatsangehörigkeit oder Wohnort. Über die Aufnahme entscheidet der Vorstand; die Mitgliedschaft beginnt mit dem Vorstandsbeschluss.",
      aEn: "Under § 5 of the statutes, any natural person may become a member — regardless of origin, nationality or place of residence. The board decides on admission; membership begins with the board's resolution." },
    { cat: "mitglied", qDe: "Was kostet die Mitgliedschaft?", qEn: "What does membership cost?",
      aDe: "Der monatliche Mitgliedsbeitrag beträgt derzeit 5,00 €. Die Höhe wird von der Mitgliederversammlung festgelegt und in einer Beitragsordnung geregelt (§ 7 der Satzung).",
      aEn: "The monthly membership fee is currently €5.00. The amount is set by the general meeting and regulated in a fee schedule (§ 7 of the statutes)." },
    { cat: "mitglied", qDe: "Wie kann ich die Mitgliedschaft beenden?", qEn: "How can I end my membership?",
      aDe: "Durch schriftliche Austrittserklärung an den Vorstand mit einer Frist von einem Monat (§ 6 der Satzung). Eine formlose E-Mail an unsere Mitglieder-Adresse genügt.",
      aEn: "By written notice of withdrawal to the board with one month's notice (§ 6 of the statutes). An informal e-mail to our membership address is sufficient." },
    { cat: "volunteer", qDe: "Muss ich Nepali sein, um mitzumachen?", qEn: "Do I have to be Nepali to take part?",
      aDe: "One Day for Nation richtet sich ausdrücklich an alle Nepalis weltweit. Unterstützer:innen anderer Herkunft sind bei Spenden, Mitgliedschaft und vielen Projekten ebenfalls herzlich willkommen — sprechen Sie uns an.",
      aEn: "One Day for Nation is expressly aimed at all Nepalis worldwide. Supporters of other backgrounds are equally welcome for donations, membership and many projects — just get in touch." },
    { cat: "volunteer", qDe: "Wie lange dauert ein Einsatz?", qEn: "How long is a deployment?",
      aDe: "Mindestens ein Tag. Längere Einsätze sind ausdrücklich willkommen und hinterlassen mehr Wirkung. Sie geben Ihre Verfügbarkeit bei der Registrierung an.",
      aEn: "At least one day. Longer assignments are expressly welcome and leave a greater impact. You state your availability during registration." },
    { cat: "volunteer", qDe: "Mein Beruf steht nicht auf der Liste — kann ich trotzdem helfen?", qEn: "My profession isn't listed — can I still help?",
      aDe: "Ja. Die zwölf Bereiche sind Beispiele, keine Grenzen. Kein Beruf ist ausgeschlossen. Wählen Sie im Formular „Sonstiges“ und beschreiben Sie kurz Ihre Qualifikation.",
      aEn: "Yes. The twelve fields are examples, not limits. No profession is excluded. Select 'Other' in the form and briefly describe your qualification." },
    { cat: "volunteer", qDe: "Wer übernimmt Reise- und Unterkunftskosten?", qEn: "Who covers travel and accommodation?",
      aDe: "Die Registrierung ist kostenlos. Reise und Unterkunft organisieren Volunteers in der Regel selbst; NPYS-N unterstützt bei der Planung vor Ort und bei der Auswahl erreichbarer Schulen.",
      aEn: "Registration is free of charge. Volunteers usually arrange travel and accommodation themselves; NPYS-N supports local planning and the selection of accessible schools." },
    { cat: "volunteer", qDe: "Bekomme ich einen Nachweis über meinen Einsatz?", qEn: "Do I receive proof of my deployment?",
      aDe: "Ja — nach jedem Einsatz und dem Abschlussbericht erhalten Sie ein offizielles NPJOE-Zertifikat, das Sie auch für Bewerbungen nutzen können.",
      aEn: "Yes — after each assignment and the final report you receive an official NPJOE certificate, which you can also use for job applications." },
    { cat: "spenden", qDe: "Ist meine Spende steuerlich absetzbar?", qEn: "Is my donation tax-deductible?",
      aDe: "Spenden werden durch NPJOE e.V. in Deutschland verwaltet und sind in Deutschland steuerlich absetzbar. Eine Zuwendungsbestätigung stellen wir auf Wunsch aus — bitte Adresse im Verwendungszweck oder per E-Mail angeben.",
      aEn: "Donations are managed by NPJOE e.V. in Germany and are tax-deductible in Germany. We issue a donation receipt on request — please provide your address in the reference field or by e-mail." },
    { cat: "spenden", qDe: "Wofür wird mein Geld konkret verwendet?", qEn: "What exactly is my money used for?",
      aDe: "Für Erste-Hilfe-Kits, Trainingsmaterialien auf Nepali, Schulmaterialien, Hygienekits und Transportkosten zu abgelegenen Schulen. Jährlich veröffentlichen wir einen öffentlichen Bericht mit Zahlen.",
      aEn: "For First Aid kits, Nepali training materials, school supplies, hygiene kits and transport to remote schools. We publish an annual public report with figures." },
    { cat: "spenden", qDe: "Kann ich für ein bestimmtes Projekt spenden?", qEn: "Can I donate to a specific project?",
      aDe: "Ja. Geben Sie den Projektnamen im Verwendungszweck an — zum Beispiel „Erste-Hilfe-Kampagne“. Auf Wunsch erhalten Sie einen Projektbericht.",
      aEn: "Yes. State the project name in the reference field — for example 'First Aid Campaign'. On request you will receive a project report." },
    { cat: "programme", qDe: "Warum liegt der Fokus auf den Klassen 9–12?", qEn: "Why the focus on grades 9–12?",
      aDe: "Diese Altersgruppe kann Erste Hilfe verantwortlich anwenden, bleibt mehrere Jahre an der Schule und gibt Wissen an jüngere Jahrgänge weiter. So multipliziert sich die Wirkung in der ganzen Gemeinde.",
      aEn: "This age group can apply first aid responsibly, stays at school for several years and passes knowledge on to younger classes. The impact multiplies across the whole community." },
    { cat: "programme", qDe: "Was passiert nach dem Einsatz an einer Schule?", qEn: "What happens after a deployment at a school?",
      aDe: "Ausgebildete Lehrkräfte werden zu dauerhaften Trainer:innen, die Schule erhält ein zertifiziertes Erste-Hilfe-Kit und Materialien, und NPYS-N besucht die Schule jährlich zur Auffrischung.",
      aEn: "Trained teachers become permanent trainers, the school receives a certified First Aid kit and materials, and NPYS-N visits annually for refreshers." },
    { cat: "verein", qDe: "Wie ist der Verein organisiert?", qEn: "How is the association organised?",
      aDe: "Organe sind die Mitgliederversammlung und der Vorstand (§ 12). Der Vorstand besteht aus Vorsitz, stellvertretendem Vorsitz, Schatzmeister:in, Schriftführer:in und drei bis fünf Beisitzer:innen. Vertreten wird der Verein durch zwei Vorstandsmitglieder gemeinsam (§ 26 BGB).",
      aEn: "The bodies are the general meeting and the board (§ 12). The board consists of chair, deputy chair, treasurer, secretary and three to five assessors. Two board members jointly represent the association (§ 26 BGB)." },
    { cat: "verein", qDe: "Gibt es Zweigstellen in anderen Städten?", qEn: "Are there branches in other cities?",
      aDe: "Ja, § 11 der Satzung erlaubt Zweigstellen im gesamten Bundesgebiet. Sie haben keine eigene Rechtspersönlichkeit, führen keine eigenen Kassen und sind organisatorisch an den Hauptverein angebunden.",
      aEn: "Yes, § 11 of the statutes allows branches throughout Germany. They have no separate legal personality, keep no separate accounts and are organisationally attached to the main association." },
    { cat: "verein", qDe: "Wie geht ihr mit meinen Daten um?", qEn: "How do you handle my data?",
      aDe: "Personenbezogene Daten werden ausschließlich für Vereinszwecke gemäß DSGVO verarbeitet. Sie können jederzeit Auskunft, Berichtigung und Löschung verlangen — siehe Datenschutzerklärung.",
      aEn: "Personal data is processed exclusively for association purposes in accordance with the GDPR. You may request access, correction and deletion at any time — see our privacy policy." },

    { cat: "mitglied", qDe: "Ich bin unter 18 — kann ich trotzdem Mitglied werden?", qEn: "I am under 18 — can I still become a member?",
      aDe: "Ja. Die Satzung schließt niemanden nach Alter aus. Unser Online-Formular setzt ein Mindestalter von 14 Jahren; bei Minderjährigen benötigen wir zusätzlich die schriftliche Einwilligung der Erziehungsberechtigten, die Sie uns formlos per E-Mail senden können.",
      aEn: "Yes. The statutes exclude nobody by age. Our online form sets a minimum age of 14; for minors we additionally need the written consent of a parent or guardian, which you can send us informally by e-mail." },
    { cat: "mitglied", qDe: "Ich kann mir 5 € im Monat nicht leisten.", qEn: "I cannot afford €5 a month.",
      aDe: "Das soll niemanden ausschließen. Für Schüler:innen, Studierende und Personen ohne Einkommen kann der Vorstand den Beitrag reduzieren oder erlassen. Kreuzen Sie im Formular einfach „Ermäßigung beantragen“ an — es entstehen Ihnen keinerlei Nachteile bei Aufnahme oder Stimmrecht.",
      aEn: "That should exclude nobody. For pupils, students and people without income the board can reduce or waive the fee. Simply tick 'request a reduction' in the form — this puts you at no disadvantage regarding admission or voting rights." },
    { cat: "mitglied", qDe: "Wie lange dauert es, bis ich Bescheid bekomme?", qEn: "How long until I hear back?",
      aDe: "In der Regel innerhalb von zwei Wochen. Über die Aufnahme entscheidet der Vorstand (§ 5); die Mitgliedschaft beginnt mit diesem Beschluss. Sie erhalten eine Bestätigung mit Ihrer Mitgliedsnummer und den Zahlungsdaten per E-Mail.",
      aEn: "Usually within two weeks. The board decides on admission (§ 5); membership begins with that resolution. You receive a confirmation with your membership number and payment details by e-mail." },
    { cat: "mitglied", qDe: "Welche Rechte habe ich als Mitglied?", qEn: "What rights do I have as a member?",
      aDe: "Stimmrecht in der Mitgliederversammlung, die über Vorstandswahlen, Haushalt, Beitragshöhe, Satzungsänderungen und die Auflösung entscheidet (§ 9). Sie können Anträge stellen — sie müssen eine Woche vor Versammlungsbeginn schriftlich beim Vorstand eingehen. Ein Fünftel aller Mitglieder kann außerdem eine außerordentliche Versammlung erzwingen.",
      aEn: "Voting rights in the general meeting, which decides on board elections, the budget, fee levels, amendments to the statutes and dissolution (§ 9). You may submit motions — they must reach the board in writing one week before the meeting begins. One fifth of all members can also compel an extraordinary meeting." },
    { cat: "mitglied", qDe: "Kann ich Mitglied sein, wenn ich nicht in Deutschland lebe?", qEn: "Can I be a member if I do not live in Germany?",
      aDe: "Ja. § 5 der Satzung stellt allein auf natürliche Personen ab, nicht auf den Wohnort. Beachten Sie nur, dass Einladungen und Abstimmungen in der Regel in Deutschland stattfinden; die Mitgliederversammlung wird jedoch auch per Videokonferenz zugeschaltet.",
      aEn: "Yes. § 5 of the statutes refers only to natural persons, not to place of residence. Please note that invitations and votes usually take place in Germany; the general meeting is, however, also available by video conference." },

    { cat: "volunteer", qDe: "Ich kann nicht nach Nepal reisen — kann ich trotzdem helfen?", qEn: "I cannot travel to Nepal — can I still help?",
      aDe: "Ja. Wählen Sie bei der Registrierung „Remote-Unterstützung“. Gebraucht werden Übersetzungen, Websites für Partnerorganisationen, Online-Nachhilfe, Grafikdesign, Fördermittelanträge und Lehrerfortbildung per Video.",
      aEn: "Yes. Choose 'remote support' when registering. We need translations, websites for partner organisations, online tutoring, graphic design, grant applications and teacher training by video." },
    { cat: "volunteer", qDe: "Brauche ich Nepali-Kenntnisse?", qEn: "Do I need to speak Nepali?",
      aDe: "Nicht zwingend. Sämtliche Trainingsmaterialien liegen auf Nepali vor, und NPYS-N stellt bei Bedarf Übersetzung vor Ort. Nepali-Kenntnisse erleichtern den direkten Kontakt mit Schüler:innen und Gemeinden aber erheblich.",
      aEn: "Not necessarily. All training materials exist in Nepali and NPYS-N provides translation on site where needed. Nepali does, however, make direct contact with students and communities considerably easier." },
    { cat: "volunteer", qDe: "Wie läuft das Matching konkret ab?", qEn: "How exactly does matching work?",
      aDe: "Nach Ihrer Registrierung übermitteln wir die für das Matching nötigen Angaben an NPYS-N. Der Partner ordnet Sie einer Schule oder einem Projekt zu, das zu Berufsfeld, Qualifikation und Verfügbarkeit passt. Rund zwei Wochen vor dem Einsatz erhalten Sie ein Briefing zu Inhalten, Erwartungen, Material und Sicherheit.",
      aEn: "After your registration we transmit the details needed for matching to NPYS-N. The partner assigns you to a school or project fitting your field, qualification and availability. About two weeks before the assignment you receive a briefing on content, expectations, materials and safety." },
    { cat: "volunteer", qDe: "Kann ich als Gruppe oder mit meiner Familie kommen?", qEn: "Can we come as a group or as a family?",
      aDe: "Ja, Gruppeneinsätze sind willkommen und für Schulen oft besonders wirkungsvoll. Melden Sie sich einzeln an und vermerken Sie die Gruppe im Feld „Motivation“, damit NPYS-N Sie gemeinsam einplanen kann.",
      aEn: "Yes, group deployments are welcome and are often particularly effective for schools. Register individually and note the group in the 'motivation' field so NPYS-N can plan you together." },
    { cat: "volunteer", qDe: "Welche Berufe werden derzeit am dringendsten gebraucht?", qEn: "Which professions are most urgently needed right now?",
      aDe: "Für die Erste-Hilfe-Kampagne: Sanitäter:innen, Ärzt:innen, Pflegekräfte und zertifizierte Erste-Hilfe-Trainer:innen. Darüber hinaus melden die Partnerschulen besonderen Bedarf bei Lehrkräften für Englisch, Mathematik und Naturwissenschaften sowie bei IT-Fachleuten für Computer-Grundkenntnisse.",
      aEn: "For the First Aid Campaign: paramedics, doctors, nurses and certified first aid trainers. Beyond that, partner schools report particular need for teachers of English, mathematics and science, and for IT specialists to teach basic computer skills." },

    { cat: "spenden", qDe: "Löst das Spendenformular eine Zahlung aus?", qEn: "Does the donation form trigger a payment?",
      aDe: "Nein. Sie erhalten anschließend unsere Bankverbindung mit einem persönlichen Verwendungszweck, damit wir Ihre Spende eindeutig zuordnen können. Die Überweisung nehmen Sie selbst über Ihre Bank vor.",
      aEn: "No. You then receive our bank details with a personal payment reference so we can allocate your donation unambiguously. You make the transfer yourself through your bank." },
    { cat: "spenden", qDe: "Kann ich regelmäßig statt einmalig spenden?", qEn: "Can I give regularly instead of once?",
      aDe: "Ja — wählen Sie im Formular monatlich oder jährlich und richten Sie bei Ihrer Bank einen Dauerauftrag ein. Regelmäßige Spenden sind für die Planung der Kampagne besonders wertvoll, weil sie Materialbestellungen im Voraus ermöglichen.",
      aEn: "Yes — choose monthly or annually in the form and set up a standing order with your bank. Regular donations are especially valuable for planning the campaign because they allow materials to be ordered in advance." },
    { cat: "spenden", qDe: "Kann ich Sachspenden statt Geld geben?", qEn: "Can I give goods instead of money?",
      aDe: "Ja. § 3(i) der Satzung nennt ausdrücklich Beschaffung, Transport und Verteilung von Hilfs- und Unterrichtsmaterialien, Hygienekits und medizinischen Sachspenden. Bitte fragen Sie vorab an, damit wir Transport und Bedarf mit NPYS-N abstimmen können.",
      aEn: "Yes. § 3(i) of the statutes expressly mentions procuring, transporting and distributing aid and teaching materials, hygiene kits and medical in-kind donations. Please ask in advance so we can coordinate transport and need with NPYS-N." },
    { cat: "spenden", qDe: "Wie viel meiner Spende kommt tatsächlich an?", qEn: "How much of my donation actually arrives?",
      aDe: "Der Verein ist selbstlos tätig; Mittel dürfen nur für satzungsmäßige Zwecke verwendet werden, und Mitglieder erhalten keine Zuwendungen (§ 4). Verwaltungskosten wie Porto, Kontoführung und Software machen derzeit rund vier Prozent aus, der Rest fließt in Material, Trainingsunterlagen und Transport zu abgelegenen Schulen.",
      aEn: "The association acts selflessly; funds may only be used for statutory purposes and members receive no allocations (§ 4). Administrative costs such as postage, banking and software currently account for around four per cent; the rest goes into materials, training documents and transport to remote schools." },

    { cat: "programme", qDe: "Was genau lernen die Schüler:innen im Erste-Hilfe-Kurs?", qEn: "What exactly do students learn in the first aid course?",
      aDe: "Grundversorgung von Wunden und Verbandstechniken, CPR für Erwachsene und Kinder, Reaktion auf Ersticken und Atemwegssicherung, Verbrennungen, Frakturen und Notfallstabilisierung, Verhalten bei Erdbeben und Überschwemmungen sowie psychologische Erste Hilfe — Beruhigung und Krisenunterstützung.",
      aEn: "Basic wound care and bandaging, CPR for adults and children, choking response and airway management, burns, fractures and emergency stabilisation, behaviour during earthquakes and floods, plus psychological first aid — calming and crisis support." },
    { cat: "programme", qDe: "Was erhält eine teilnehmende Schule?", qEn: "What does a participating school receive?",
      aDe: "Ein zertifiziertes Erste-Hilfe-Kit, Trainingsmaterialien und Handbücher auf Nepali, mindestens eine ausgebildete Lehrkraft als dauerhafte:n Schultrainer:in, einen jährlichen Auffrischungsbesuch durch NPYS-N und das offizielle Schulzertifikat „Erste-Hilfe-Schule“.",
      aEn: "A certified First Aid kit, training materials and manuals in Nepali, at least one trained teacher as permanent school trainer, an annual refresher visit by NPYS-N, and the official school certificate 'First Aid School'." },
    { cat: "programme", qDe: "Wie werden die Schulen ausgewählt?", qEn: "How are schools selected?",
      aDe: "Die Auswahl trifft NPYS-N als Partner vor Ort — nach Erreichbarkeit für Volunteer-Teams, der Bereitschaft der Schulleitung, eine Lehrkraft dauerhaft als Trainer:in freizustellen, und dem Anteil von Schüler:innen aus benachteiligten Familien. Vorschläge aus der Diaspora sind ausdrücklich willkommen.",
      aEn: "NPYS-N, as partner on the ground, makes the selection — by accessibility for volunteer teams, the school management's willingness to permanently release a teacher as trainer, and the share of students from disadvantaged families. Suggestions from the diaspora are expressly welcome." },
    { cat: "programme", qDe: "Gibt es auch Gesundheitscamps für die ganze Gemeinde?", qEn: "Are there health camps for the whole community?",
      aDe: "Ja, wenn medizinische Volunteers verfügbar sind. § 3(e) der Satzung sieht kostenfreie Gesundheitscamps sowie Aufklärungs- und Präventionsmaßnahmen in ländlichen Regionen Nepals vor, ergänzt um Unterstützung bedürftiger Personen beim Zugang zu medizinischer Versorgung.",
      aEn: "Yes, when medical volunteers are available. § 3(e) of the statutes provides for free health camps plus awareness and prevention measures in rural regions of Nepal, complemented by support for people in need in accessing medical care." },
    { cat: "programme", qDe: "Warum finanziert One Euro for Nation die Erste-Hilfe-Kampagne?", qEn: "Why does One Euro for Nation finance the First Aid Campaign?",
      aDe: "Weil die drei Programme ineinandergreifen: Programm 3 sammelt die Mittel, Programm 2 setzt sie in Kits, Handbücher und Hygienekits um, und Programm 1 liefert die Menschen, die schulen. So trägt sich das System selbst, ohne von einzelnen Großspenden abzuhängen.",
      aEn: "Because the three programmes interlock: programme 3 raises the funds, programme 2 turns them into kits, manuals and hygiene kits, and programme 1 supplies the people who train. This makes the system self-supporting without depending on individual large donations." },

    { cat: "verein", qDe: "Kann ich in meiner Stadt eine Zweigstelle gründen?", qEn: "Can I start a branch in my city?",
      aDe: "Ja, § 11 der Satzung erlaubt Zweigstellen im gesamten Bundesgebiet; über Errichtung und Auflösung entscheidet der Vorstand. Zweigstellen haben keine eigene Rechtspersönlichkeit und führen keine eigenen Kassen — die Finanzverwaltung bleibt zentral beim Hauptverein.",
      aEn: "Yes, § 11 of the statutes allows branches throughout Germany; the board decides on establishment and dissolution. Branches have no separate legal personality and keep no separate accounts — financial administration remains centrally with the main association." },
    { cat: "verein", qDe: "Wer kontrolliert die Finanzen?", qEn: "Who checks the finances?",
      aDe: "Die Schatzmeisterei legt dem Vorstand bis zum 1. März den Rechnungsabschluss vor. Zwei von der Mitgliederversammlung gewählte Kassenprüfer:innen — die dem Vorstand nicht angehören dürfen — prüfen die Kasse jährlich und berichten schriftlich. Über das Vereinskonto verfügen Schatzmeister:in und Vorsitz nur gemeinsam.",
      aEn: "The treasurer presents the annual accounts to the board by 1 March. Two auditors elected by the general meeting — who may not belong to the board — audit the accounts annually and report in writing. The treasurer and chair may only dispose of the association account jointly." },
    { cat: "verein", qDe: "Ist der Verein politisch oder religiös gebunden?", qEn: "Is the association politically or religiously affiliated?",
      aDe: "Nein. Der Verein verfolgt ausschließlich und unmittelbar gemeinnützige und mildtätige Zwecke nach §§ 52, 53 AO und ist selbstlos tätig. Die Förderung des Ehrenamts gilt ausdrücklich dem Ehrenamt als solchem — unabhängig von Interessen des eigenen Vereins.",
      aEn: "No. The association exclusively and directly pursues charitable and benevolent purposes under §§ 52, 53 AO and acts selflessly. Support for volunteering expressly applies to volunteering as such — independent of the association's own interests." },
    { cat: "verein", qDe: "Was passiert, wenn der Verein aufgelöst wird?", qEn: "What happens if the association is dissolved?",
      aDe: "Die Auflösung erfordert eine Dreiviertelmehrheit in der Mitgliederversammlung. Das Vermögen fällt anschließend an eine juristische Person des öffentlichen Rechts oder eine andere steuerbegünstigte Körperschaft — zweckgebunden für Entwicklungszusammenarbeit oder Völkerverständigung (§ 13).",
      aEn: "Dissolution requires a three-quarters majority in the general meeting. The assets then pass to a legal entity under public law or another tax-privileged corporation — earmarked for development cooperation or international understanding (§ 13)." }
  ];

  /* -------------------------------------------------------------- Gallery */
  var GALLERY = [
    { tag: "dashain kultur ehrung", src: "assets/media/dashain-2024/trophy-and-medals.jpg", width: 1920, height: 1280, de: "Pokal und Medaillen vor Beginn der Feier", en: "Trophy and medals before the celebration begins" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/welcome-team.jpg", width: 1920, height: 1280, de: "Das Empfangsteam bereitet die Anmeldung vor", en: "The welcome team prepares registration" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/opening-address.jpg", width: 1920, height: 1280, de: "Begrüßung und Eröffnung des Dashain-Programms", en: "Welcome and opening of the Dashain programme" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/event-team.jpg", width: 1920, height: 1280, de: "Mitglieder des Veranstaltungsteams", en: "Members of the event team" },
    { tag: "dashain kultur deko", src: "assets/media/dashain-2024/dashain-banner.jpg", width: 1920, height: 1280, de: "Festbanner der NPJOE zur Dashain-Feier", en: "NPJOE celebration banner for Dashain" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/guest-speech.jpg", width: 1920, height: 1280, de: "Ein Beitrag aus dem Kreis der Gäste", en: "A contribution from one of the guests" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/community-meal.jpg", width: 1920, height: 1280, de: "Begegnung und Gespräche beim gemeinsamen Essen", en: "Connection and conversation over a shared meal" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/welcome-address.jpg", width: 1920, height: 1280, de: "Ansprache des Moderationsteams", en: "Address by the hosting team" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/guest-registration.jpg", width: 1920, height: 1280, de: "Gäste tragen sich am Empfang ein", en: "Guests sign in at reception" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/friends-at-meal.jpg", width: 1920, height: 1280, de: "Freund:innen und Mitglieder beim Festessen", en: "Friends and members enjoying the festival meal" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/stage-programme.jpg", width: 1920, height: 1280, de: "Das Bühnenprogramm der Dashain-Feier", en: "The Dashain celebration stage programme" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/sel-roti-moment.jpg", width: 1920, height: 1280, de: "Gemeinsamer Moment am Buffet mit Sel Roti", en: "A shared moment at the buffet with sel roti" },
    { tag: "dashain kultur ehrung buehne", src: "assets/media/dashain-2024/honour-presentation.jpg", width: 1920, height: 1280, de: "Ehrung im Rahmen des Festprogramms", en: "A presentation during the festival programme" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/evening-welcome-desk.jpg", width: 1920, height: 1283, de: "Anmeldung und Organisation am Empfangstisch", en: "Registration and organisation at the welcome desk" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/festival-food.jpg", width: 1920, height: 1280, de: "Nepalesische Speisen und Sel Roti für die Gäste", en: "Nepali food and sel roti for the guests" },
    { tag: "dashain kultur ehrung buehne", src: "assets/media/dashain-2024/trophy-presentation.jpg", width: 1920, height: 1280, de: "Übergabe des Pokals zum Abschluss des Programmpunkts", en: "Trophy presentation concluding a programme segment" }
  ];

  /* ------------------------------------------------------- Donation tiers */
  var TIERS = [
    { amount: 1, de: "Schulmaterialien für eine:n Schüler:in", en: "School materials for one student" },
    { amount: 10, de: "Hygienekit für eine Schulklasse", en: "Hygiene kit for one classroom" },
    { amount: 50, de: "Vollständiges Erste-Hilfe-Kit für eine Schule", en: "Complete First Aid kit for one school" },
    { amount: 100, de: "Komplette Trainingsmaterialien für eine Schule", en: "Complete training materials for one school" }
  ];

  /* ----------------------------------------------------------- Renderers */
  function fmtDate(iso, lang) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(lang === "en" ? "en-GB" : "de-DE", { day: "2-digit", month: "long", year: "numeric" });
  }

  function renderFields(sel, opts) {
    var host = document.querySelector(sel);
    if (!host) return;
    opts = opts || {};
    host.innerHTML = FIELDS.map(function (f) {
      return '<article class="field-card reveal" data-tags="' + f.tag + " " + f.key + '">' +
        '<span class="field-emoji" aria-hidden="true">' + f.emoji + "</span>" +
        "<h3>" + bi(f.de, f.en) + "</h3>" +
        '<p class="field-roles">' + bi(esc(f.rolesDe), esc(f.rolesEn)) + "</p>" +
        '<p class="field-examples"><strong>' + bi("Beispiele:", "Examples:") + "</strong> " + bi(esc(f.exDe), esc(f.exEn)) + "</p>" +
        (opts.cta ? '<p class="mt-2"><a class="text-sm" href="volunteer.html?field=' + f.key + '">' + bi("In diesem Bereich helfen →", "Volunteer in this field →") + "</a></p>" : "") +
        "</article>";
    }).join("");
  }

  function renderFieldOptions(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = FIELDS.map(function (f) {
      return '<label class="check"><input type="checkbox" name="bereiche" value="' + f.key + '">' +
        "<span><strong>" + f.emoji + " " + bi(f.de, f.en) + "</strong>" +
        '<span class="hint">' + bi(esc(f.rolesDe.split(",").slice(0, 3).join(", ")), esc(f.rolesEn.split(",").slice(0, 3).join(", "))) + "</span></span></label>";
    }).join("") +
      '<label class="check"><input type="checkbox" name="bereiche" value="sonstiges">' +
      "<span><strong>⭐ " + bi("Sonstiges / anderer Beruf", "Other / different profession") + "</strong>" +
      '<span class="hint">' + bi("Kein Beruf ist ausgeschlossen.", "No profession is excluded.") + "</span></span></label>";
  }

  function renderEvents(sel, limit) {
    var host = document.querySelector(sel);
    if (!host) return;
    var lang = window.npjoeLang ? window.npjoeLang() : "de";
    var list = EVENTS.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (limit) list = list.slice(0, limit);
    host.innerHTML = list.map(function (ev) {
      var d = new Date(ev.date + "T00:00:00");
      var months = { de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
      return '<article class="event-row reveal" data-tags="' + ev.tags + '">' +
        '<div class="event-date"><div class="m">' + bi(months.de[d.getMonth()], months.en[d.getMonth()]) + "</div>" +
        '<div class="d">' + String(d.getDate()).padStart(2, "0") + '</div><div class="y">' + d.getFullYear() + "</div></div>" +
        '<div><h3 class="t-h4">' + bi(ev.de, ev.en) + "</h3>" +
        '<p class="text-sm text-muted mt-1">' + bi(ev.descDe, ev.descEn) + "</p>" +
        '<div class="event-meta"><span>🕒 ' + ev.time + "</span><span>📍 " + bi(ev.placeDe, ev.placeEn) + "</span></div>" +
        '<div class="flex mt-2" style="gap:.5rem">' +
        '<a class="btn btn-sm btn-ghost" href="kontakt.html?betreff=' + encodeURIComponent(lang === "en" ? ev.en : ev.de) + '">' + bi("Anmelden", "Register") + "</a>" +
        '<button class="btn btn-sm btn-ghost" type="button" data-ics="' + ev.id + '">' + bi("Kalender (.ics)", "Calendar (.ics)") + "</button>" +
        "</div></div></article>";
    }).join("");

    host.querySelectorAll("[data-ics]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ev = EVENTS.filter(function (e) { return e.id === btn.getAttribute("data-ics"); })[0];
        if (!ev) return;
        var lang2 = window.npjoeLang ? window.npjoeLang() : "de";
        var dt = ev.date.replace(/-/g, "");
        var ics = [
          "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NPJOE//Events//DE", "CALSCALE:GREGORIAN",
          "BEGIN:VEVENT", "UID:" + ev.id + "@progressive-youth.de",
          "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
          "DTSTART;VALUE=DATE:" + dt, "DTEND;VALUE=DATE:" + dt,
          "SUMMARY:" + (lang2 === "en" ? ev.en : ev.de),
          "DESCRIPTION:" + (lang2 === "en" ? ev.descEn : ev.descDe),
          "LOCATION:" + (lang2 === "en" ? ev.placeEn : ev.placeDe),
          "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");
        if (window.npjoeDownload) window.npjoeDownload(ev.id + ".ics", ics, "text/calendar");
      });
    });
  }

  var TAG_LABEL = {
    verein: ["Verein", "Association"], partner: ["Partnerschaft", "Partnership"],
    "erste-hilfe": ["Erste Hilfe", "First aid"], volunteer: ["Volunteering", "Volunteering"],
    spenden: ["Spenden", "Donations"], kultur: ["Kultur", "Culture"]
  };

  function tagBadge(tag) {
    var l = TAG_LABEL[tag] || [tag, tag];
    return '<span class="badge badge-navy">' + bi(l[0], l[1]) + "</span>";
  }

  /* Feed cards. Entries carrying a long body get an inline "read more". */
  function renderNews(sel, limit, opts) {
    var host = document.querySelector(sel);
    if (!host) return;
    opts = opts || {};
    var lang = window.npjoeLang ? window.npjoeLang() : "de";
    var list = NEWS.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (limit) list = list.slice(0, limit);

    host.innerHTML = list.map(function (n, i) {
      var featured = opts.featureFirst && i === 0;
      var media = n.image
        ? '<a class="news-media" href="' + esc(n.href || "#") + '"><img src="' + esc(n.image) + '" width="1920" height="1280" loading="lazy" decoding="async" alt="' + esc(lang === "en" ? n.imageAltEn : n.imageAltDe) + '" data-de-alt="' + esc(n.imageAltDe) + '" data-en-alt="' + esc(n.imageAltEn) + '"></a>'
        : "";
      var body = n.bodyDe
        ? '<details class="news-more mt-3"><summary>' +
            bi("Weiterlesen", "Read more") + "</summary>" +
            '<div class="news-body">' + bi(esc(n.bodyDe), esc(n.bodyEn)) + "</div></details>"
        : "";
      return '<article class="card card-hover reveal-scale news-card' + (featured ? " is-featured" : "") +
        '" data-tags="' + n.tag + '">' +
        media +
        '<div class="flex" style="gap:.5rem;margin-bottom:.75rem">' +
          '<span class="badge badge-outline">' + fmtDate(n.date, lang) + "</span>" + tagBadge(n.tag) +
        "</div>" +
        (featured ? '<h3>' : '<h3 class="t-h4">') + bi(esc(n.de), esc(n.en)) + "</h3>" +
        '<p class="news-lead mt-2">' + bi(esc(n.exDe), esc(n.exEn)) + "</p>" +
        body + (n.href ? '<p class="mt-3"><a class="clink clink-sm" href="' + esc(n.href) + '">' + bi("Fotos und Video ansehen", "View photos and video") + "</a></p>" : "") + "</article>";
    }).join("");
  }

  /* Horizontal snap rail of the twelve volunteer fields. */
  function renderFieldsRail(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = FIELDS.map(function (f) {
      return '<article class="rail-card" data-tags="' + f.tag + " " + f.key + '">' +
        '<span class="rail-emoji" aria-hidden="true">' + f.emoji + "</span>" +
        "<h3>" + bi(f.de, f.en) + "</h3>" +
        '<p class="rail-roles">' + bi(esc(f.rolesDe), esc(f.rolesEn)) + "</p>" +
        '<p class="rail-ex"><strong>' + bi("Zum Beispiel:", "For example:") + "</strong> " +
          bi(esc(f.exDe), esc(f.exEn)) + "</p>" +
        '<p class="mt-2"><a class="clink clink-sm" href="volunteer.html?field=' + f.key + '">' +
          bi("Mitmachen", "Take part") + "</a></p>" +
        "</article>";
    }).join("");
  }

  function renderFaq(sel, cat) {
    var host = document.querySelector(sel);
    if (!host) return;
    var list = cat ? FAQ.filter(function (f) { return f.cat === cat; }) : FAQ;
    host.innerHTML = list.map(function (f) {
      return '<details class="acc-item reveal" data-tags="' + f.cat + '"><summary>' + bi(esc(f.qDe), esc(f.qEn)) + "</summary>" +
        '<div class="acc-body">' + bi(esc(f.aDe), esc(f.aEn)) + "</div></details>";
    }).join("");
  }

  function renderGallery(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    var lang = window.npjoeLang ? window.npjoeLang() : "de";
    host.innerHTML = GALLERY.map(function (g) {
      var current = lang === "en" ? g.en : g.de;
      var openDe = "Bild vergrößern: " + g.de;
      var openEn = "Enlarge image: " + g.en;
      var img = '<img src="' + esc(g.src) + '" width="' + g.width + '" height="' + g.height + '" loading="lazy" decoding="async" alt="' + esc(current) + '" data-de-alt="' + esc(g.de) + '" data-en-alt="' + esc(g.en) + '">';
      return '<figure data-lightbox data-tags="' + g.tag + '" role="button" tabindex="0" aria-label="' + esc(lang === "en" ? openEn : openDe) + '" data-de-aria-label="' + esc(openDe) + '" data-en-aria-label="' + esc(openEn) + '">' + img +
        "<figcaption>" + bi(esc(g.de), esc(g.en)) + "</figcaption></figure>";
    }).join("");
  }

  function renderTiers(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = TIERS.map(function (t, i) {
      return '<label class="opt"><input type="radio" name="betrag" value="' + t.amount + '"' + (i === 2 ? " checked" : "") + ">" +
        '<span class="opt-body"><span class="opt-amount">' + t.amount + " €</span>" +
        '<span class="opt-desc">' + bi(t.de, t.en) + "</span></span></label>";
    }).join("") +
      '<label class="opt"><input type="radio" name="betrag" value="custom">' +
      '<span class="opt-body"><span class="opt-amount">…</span><span class="opt-desc">' +
      bi("Eigener Betrag", "Custom amount") + "</span></span></label>";
  }

  function renderTierCards(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = TIERS.map(function (t) {
      return '<div class="card card-hover center reveal"><div class="stat-num">' + t.amount + " €</div>" +
        '<p class="text-sm mt-1">' + bi(t.de, t.en) + "</p></div>";
    }).join("");
  }

  /* ------------------------------------------------- board-edited overrides
     The board maintains events, news, FAQ, figures and organisation details
     through the admin area. Those are fetched once and merged over the
     built-in defaults below. If no server is reachable — static hosting, or
     the file opened directly — the defaults simply stand.
  ------------------------------------------------------------------------- */
  function applyOverrides(data) {
    if (!data || typeof data !== "object") return;
    if (Array.isArray(data.events) && data.events.length) EVENTS.splice(0, EVENTS.length, ...data.events);
    if (Array.isArray(data.news) && data.news.length) NEWS.splice(0, NEWS.length, ...data.news);
    if (Array.isArray(data.faq) && data.faq.length) FAQ.splice(0, FAQ.length, ...data.faq);
    if (data.figures && window.NPJOE) Object.assign(window.NPJOE.impact, data.figures);
    if (data.org && window.NPJOE) {
      var bank = data.org.bank, address = data.org.address;
      var rest = Object.assign({}, data.org);
      delete rest.bank; delete rest.address;
      Object.assign(window.NPJOE.org, rest);
      if (bank) Object.assign(window.NPJOE.org.bank, bank);
      if (address) Object.assign(window.NPJOE.org.address, address);
    }
    window.NPJOEContent.updatedAt = data.updatedAt || null;
    window.NPJOEContent.hasOverrides = true;
  }

  var apiBase = (window.NPJOE && window.NPJOE.forms && window.NPJOE.forms.apiBase) || "/api";
  var offline = window.NPJOE && window.NPJOE.forms && window.NPJOE.forms.mode === "offline";

  /* Resolves either way — the page must never wait on a failed request. */
  var ready = offline || typeof fetch !== "function"
    ? Promise.resolve()
    : fetch(apiBase + "/content", { headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(applyOverrides)
        .catch(function () { /* defaults stand */ });

  window.NPJOEContent = {
    ready: ready,
    FIELDS: FIELDS, EVENTS: EVENTS, NEWS: NEWS, FAQ: FAQ, GALLERY: GALLERY, TIERS: TIERS,
    renderFields: renderFields,
    renderFieldOptions: renderFieldOptions,
    renderEvents: renderEvents,
    renderNews: renderNews,
    renderFieldsRail: renderFieldsRail,
    renderFaq: renderFaq,
    renderGallery: renderGallery,
    renderTiers: renderTiers,
    renderTierCards: renderTierCards
  };
})();
