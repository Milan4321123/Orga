/* ==========================================================================
   NPJOE — Content data & renderers
   Single source of truth for volunteer fields, events, news, FAQ, gallery,
   donation tiers. Edit here; every page updates.
   ========================================================================== */
(function () {
  "use strict";

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  /* ne is optional; an untranslated string falls back to English. */
  function bi(de, en, ne) {
    return '<span data-lang="de">' + de + '</span><span data-lang="en">' + en + "</span>" +
           '<span data-lang="ne">' + (ne || en) + "</span>";
  }

  /* ------------------------------------------------- 12 volunteer fields */
  var FIELDS = [
    {
      key: "health", emoji: "🏥", tag: "gesundheit",
      de: "Gesundheit & Medizin", en: "Health & Medicine", ne: "स्वास्थ्य तथा चिकित्सा",
      rolesDe: "Ärzt:innen, Krankenpfleger:innen, Apotheker:innen, Sanitäter:innen, Physiotherapeut:innen, Psychiater:innen, Ernährungsberater:innen",
      rolesEn: "Doctors, nurses, pharmacists, paramedics, physiotherapists, psychiatrists, nutritionists",
      rolesNe: "चिकित्सक, नर्स, फार्मासिस्ट, स्वास्थ्यकर्मी, फिजियोथेरापिस्ट, मनोचिकित्सक, पोषणविद्",
      exDe: "Gesundheitscamps, Ernährungsberatung, Augenuntersuchungen, Aufklärung zu psychischer Gesundheit, Zahnmedizin-Camps, Impfaufklärung",
      exEn: "Health camps, nutrition counselling, eye check-ups, mental-health awareness, dental camps, vaccination education",
      exNe: "स्वास्थ्य शिविर, पोषण परामर्श, आँखा जाँच, मानसिक स्वास्थ्य जनचेतना, दन्त शिविर, खोपसम्बन्धी शिक्षा"
    },
    {
      key: "education", emoji: "🎓", tag: "bildung",
      de: "Bildung & Unterricht", en: "Education & Teaching", ne: "शिक्षा तथा अध्यापन",
      rolesDe: "Lehrer:innen, Professor:innen, Tutor:innen, Sprachlehrer:innen, Sonderpädagog:innen, Berufsberater:innen",
      rolesEn: "Teachers, professors, tutors, language teachers, special educators, career counsellors",
      rolesNe: "शिक्षक, प्राध्यापक, ट्युटर, भाषा शिक्षक, विशेष शिक्षा शिक्षक, करिअर परामर्शदाता",
      exDe: "Englisch-, Mathe- und Naturwissenschaftsunterricht, Lehrerfortbildung, Berufsberatung Klassen 9–12, Alphabetisierung für Erwachsene",
      exEn: "English, maths and science teaching, teacher training, career guidance for grades 9–12, adult literacy",
      exNe: "अङ्ग्रेजी, गणित र विज्ञान अध्यापन, शिक्षक तालिम, कक्षा ९–१२ मा करिअर परामर्श, वयस्क साक्षरता"
    },
    {
      key: "tech", emoji: "💻", tag: "technik",
      de: "Technologie & IT", en: "Technology & IT", ne: "प्रविधि तथा आईटी",
      rolesDe: "Softwareentwickler:innen, IT-Spezialist:innen, Datenwissenschaftler:innen, UX-Designer:innen, Netzwerk- und Cybersecurity-Fachleute",
      rolesEn: "Software developers, IT specialists, data scientists, UX designers, network and cybersecurity experts",
      rolesNe: "सफ्टवेयर डेभलपर, आईटी विशेषज्ञ, डेटा वैज्ञानिक, UX डिजाइनर, नेटवर्क र साइबर सुरक्षा विशेषज्ञ",
      exDe: "Computer-Grundkenntnisse in Schulen, Coding-Workshops für Jugendliche, Schul-IT warten, Websites für NGOs erstellen, digitale Lernplattformen einführen",
      exEn: "Basic computer skills in schools, coding workshops for youth, maintaining school IT, building NGO websites, introducing digital learning platforms",
      exNe: "विद्यालयमा आधारभूत कम्प्युटर सीप, युवाका लागि कोडिङ कार्यशाला, विद्यालयको आईटी मर्मत, गैरसरकारी संस्थाका वेबसाइट निर्माण, डिजिटल सिकाइ प्लेटफर्म भित्र्याउने"
    },
    {
      key: "engineering", emoji: "🏗️", tag: "technik",
      de: "Ingenieurwesen & Bau", en: "Engineering & Construction", ne: "इन्जिनियरिङ तथा निर्माण",
      rolesDe: "Bauingenieur:innen, Architekt:innen, Elektroingenieur:innen, Wasserbauexpert:innen, Umweltingenieur:innen",
      rolesEn: "Civil engineers, architects, electrical engineers, water engineers, environmental engineers",
      rolesNe: "सिभिल इन्जिनियर, आर्किटेक्ट, इलेक्ट्रिकल इन्जिनियर, जलस्रोत इन्जिनियर, वातावरण इन्जिनियर",
      exDe: "Schulgebäude sicherheitstechnisch bewerten, Solaranlagen installieren, Sanitärsysteme verbessern, Erdbebensicherheit prüfen, Wasserleitungen planen",
      exEn: "Assessing school buildings for safety, installing solar systems, improving sanitation, checking earthquake resilience, planning water pipes",
      exNe: "विद्यालय भवनको सुरक्षा मूल्याङ्कन, सोलार प्रणाली जडान, सरसफाइ प्रणाली सुधार, भूकम्प प्रतिरोध जाँच, खानेपानी पाइप योजना"
    },
    {
      key: "law", emoji: "⚖️", tag: "soziales",
      de: "Recht & Soziales", en: "Law & Social Work", ne: "कानुन तथा सामाजिक कार्य",
      rolesDe: "Rechtsanwält:innen, Sozialarbeiter:innen, Psycholog:innen, Menschenrechtsexpert:innen, Berater:innen",
      rolesEn: "Lawyers, social workers, psychologists, human rights experts, counsellors",
      rolesNe: "अधिवक्ता, समाजसेवी, मनोविद्, मानवअधिकार विशेषज्ञ, परामर्शदाता",
      exDe: "Rechtliche Aufklärung, Kinder- und Frauenrechte, psychosoziale Beratung, NGO-Compliance, Gemeinschaftsmediation",
      exEn: "Legal awareness, children's and women's rights, psychosocial counselling, NGO compliance, community mediation",
      exNe: "कानुनी जनचेतना, बालबालिका र महिला अधिकार, मनोसामाजिक परामर्श, गैरसरकारी संस्थाको अनुपालन, सामुदायिक मध्यस्थता"
    },
    {
      key: "arts", emoji: "🎨", tag: "kultur",
      de: "Kunst, Kultur & Kreativität", en: "Arts, Culture & Creativity", ne: "कला, संस्कृति तथा सिर्जनशीलता",
      rolesDe: "Künstler:innen, Musiker:innen, Fotograf:innen, Filmemacher:innen, Designer:innen, Schriftsteller:innen, Tänzer:innen",
      rolesEn: "Artists, musicians, photographers, filmmakers, designers, writers, dancers",
      rolesNe: "कलाकार, सङ्गीतकार, फोटोग्राफर, चलचित्रकर्मी, डिजाइनर, लेखक, नर्तक",
      exDe: "Schulkunstprojekte, Wandmalereien, Musik- und Tanzworkshops, Schulzeitungen gestalten, nepalesisches Kulturerbe dokumentieren",
      exEn: "School art projects, murals, music and dance workshops, designing school newspapers, documenting Nepali heritage",
      exNe: "विद्यालय कला परियोजना, भित्तेचित्र, सङ्गीत र नृत्य कार्यशाला, विद्यालय पत्रिका डिजाइन, नेपाली सम्पदाको अभिलेखीकरण"
    },
    {
      key: "sports", emoji: "⚽", tag: "sport",
      de: "Sport & Bewegung", en: "Sports & Physical Education", ne: "खेलकुद तथा शारीरिक शिक्षा",
      rolesDe: "Sportlehrer:innen, Trainer:innen, Fitnesstrainer:innen, Yogalehrer:innen, Physiotherapeut:innen",
      rolesEn: "PE teachers, coaches, fitness trainers, yoga instructors, physiotherapists",
      rolesNe: "शारीरिक शिक्षा शिक्षक, प्रशिक्षक, फिटनेस प्रशिक्षक, योग प्रशिक्षक, फिजियोथेरापिस्ट",
      exDe: "Fußball-, Volleyball- und Cricket-Coaching, Sportturniere organisieren, Yoga und mentale Stärke, Inklusionssport",
      exEn: "Football, volleyball and cricket coaching, organising tournaments, yoga and mental strength, inclusive sports",
      exNe: "फुटबल, भलिबल र क्रिकेट प्रशिक्षण, खेल प्रतियोगिता आयोजना, योग र मानसिक बल, समावेशी खेलकुद"
    },
    {
      key: "environment", emoji: "🌿", tag: "umwelt",
      de: "Umwelt & Landwirtschaft", en: "Environment & Agriculture", ne: "वातावरण तथा कृषि",
      rolesDe: "Agronom:innen, Umweltwissenschaftler:innen, Forstwirt:innen, Biolog:innen, Nachhaltigkeitsexpert:innen",
      rolesEn: "Agronomists, environmental scientists, foresters, biologists, sustainability experts",
      rolesNe: "कृषिविद्, वातावरण वैज्ञानिक, वनविद्, जीवशास्त्री, दिगोपन विशेषज्ञ",
      exDe: "Gemeinschaftsgärten, Baumpflanzaktionen, nachhaltige Landwirtschaft lehren, Schulumweltprojekte, Mülltrennung, Wasseraufklärung",
      exEn: "Community gardens, tree planting, teaching sustainable agriculture, school environment projects, waste separation, water awareness",
      exNe: "सामुदायिक बगैँचा, वृक्षरोपण, दिगो कृषि शिक्षण, विद्यालय वातावरण परियोजना, फोहोर छुट्याउने अभ्यास, पानीसम्बन्धी जनचेतना"
    },
    {
      key: "business", emoji: "💰", tag: "wirtschaft",
      de: "Wirtschaft & Finanzen", en: "Business & Finance", ne: "व्यवसाय तथा वित्त",
      rolesDe: "Betriebswirt:innen, Buchhalter:innen, Unternehmensberater:innen, Marketing-Fachleute, Finanzexpert:innen",
      rolesEn: "Business administrators, accountants, management consultants, marketing professionals, finance experts",
      rolesNe: "व्यवस्थापन विशेषज्ञ, लेखापाल, व्यवस्थापन परामर्शदाता, मार्केटिङ पेसाकर्मी, वित्त विशेषज्ञ",
      exDe: "Finanzkompetenz für Familien, Kleinunternehmen-Coaching, NGO-Budgetverwaltung, Unternehmergeist für Jugendliche",
      exEn: "Financial literacy for families, small-business coaching, NGO budget management, entrepreneurship for youth",
      exNe: "परिवारका लागि वित्तीय साक्षरता, साना व्यवसाय परामर्श, गैरसरकारी संस्थाको बजेट व्यवस्थापन, युवामा उद्यमशीलता"
    },
    {
      key: "media", emoji: "📸", tag: "medien",
      de: "Medien & Kommunikation", en: "Media & Communications", ne: "सञ्चार तथा सम्पर्क",
      rolesDe: "Journalist:innen, PR-Expert:innen, Social-Media-Manager:innen, Übersetzer:innen, Moderator:innen",
      rolesEn: "Journalists, PR experts, social media managers, translators, moderators",
      rolesNe: "पत्रकार, जनसम्पर्क विशेषज्ञ, सामाजिक सञ्जाल व्यवस्थापक, अनुवादक, कार्यक्रम सञ्चालक",
      exDe: "Medienkompetenz für Schüler:innen, Schulradio und -zeitung aufbauen, Kommunikationstraining für NGOs, Projektdokumentation",
      exEn: "Media literacy for students, building school radio and newspapers, communication training for NGOs, project documentation",
      exNe: "विद्यार्थीका लागि मिडिया साक्षरता, विद्यालय रेडियो र पत्रिका सुरु गर्ने, गैरसरकारी संस्थाका लागि सञ्चार तालिम, परियोजना अभिलेखीकरण"
    },
    {
      key: "nutrition", emoji: "🍳", tag: "gesundheit",
      de: "Ernährung & Hauswirtschaft", en: "Nutrition & Home Economics", ne: "पोषण तथा गृहविज्ञान",
      rolesDe: "Ernährungswissenschaftler:innen, Köch:innen, Oecotropholog:innen, Gesundheitspädagog:innen",
      rolesEn: "Nutritionists, chefs, home economists, health educators",
      rolesNe: "पोषणविद्, भान्से, गृहविज्ञान विशेषज्ञ, स्वास्थ्य शिक्षक",
      exDe: "Ernährungsworkshops, gesunde Kochkurse mit lokalen Zutaten, Lebensmittelhygiene, Schulküchenprojekte",
      exEn: "Nutrition workshops, healthy cooking with local ingredients, food hygiene, school kitchen projects",
      exNe: "पोषण कार्यशाला, स्थानीय सामग्रीबाट स्वस्थ खाना पकाउने तालिम, खाद्य सरसफाइ, विद्यालय भान्सा परियोजना"
    },
    {
      key: "mentalhealth", emoji: "🧘", tag: "gesundheit",
      de: "Psychische Gesundheit & Wohlbefinden", en: "Mental Health & Wellbeing", ne: "मानसिक स्वास्थ्य तथा सुस्वास्थ्य",
      rolesDe: "Psycholog:innen, Psychiater:innen, Coaches, Therapeut:innen, Sozialpädagog:innen",
      rolesEn: "Psychologists, psychiatrists, coaches, therapists, social educators",
      rolesNe: "मनोविद्, मनोचिकित्सक, कोच, थेरापिस्ट, सामाजिक शिक्षक",
      exDe: "Anti-Mobbing-Programme, Stressmanagement für Schüler:innen und Lehrkräfte, Trauma-Aufklärung nach Naturkatastrophen, Elternberatung",
      exEn: "Anti-bullying programmes, stress management for students and teachers, trauma awareness after natural disasters, parent counselling",
      exNe: "दुर्व्यवहारविरुद्ध कार्यक्रम, विद्यार्थी र शिक्षकका लागि तनाव व्यवस्थापन, प्रकोपपछिको मानसिक आघातबारे चेतना, अभिभावक परामर्श"
    }
  ];

  /* --------------------------------------------------------------- Events */
  var EVENTS = [
    {
      id: "ev-2026-09-kickoff", date: "2026-09-19", time: "14:00–19:00",
      de: "Kick-off: One Day for Nation — Volunteer-Briefing", en: "Kick-off: One Day for Nation — volunteer briefing", ne: "सुरुवात: One Day for Nation — स्वयंसेवक ब्रिफिङ",
      placeDe: "Darmstadt, Hessen + Online", placeEn: "Darmstadt, Hesse + online", placeNe: "डार्मस्टाट, हेसेन + अनलाइन",
      tags: "volunteer online", type: "volunteer",
      descDe: "Vorstellung des Programms, Matching-Verfahren mit NPYS-N, Fragen und Antworten zu Einsätzen ab einem Tag.",
      descEn: "Programme introduction, the matching process with NPYS-N, and Q&A on assignments from one day upwards.",
      descNe: "कार्यक्रमको परिचय, NPYS-N सँगको मिलान प्रक्रिया, र एक दिनदेखिका परिचालनबारे प्रश्नोत्तर।"
    },
    {
      id: "ev-2026-10-erstehilfe", date: "2026-10-11", time: "10:00–16:00",
      de: "Erste-Hilfe-Trainer:innen-Schulung (Train-the-Trainer)", en: "First Aid train-the-trainer session", ne: "प्राथमिक उपचार प्रशिक्षक तालिम (Train-the-Trainer)",
      placeDe: "Frankfurt am Main", placeEn: "Frankfurt am Main", placeNe: "फ्र्याङ्कफर्ट एम माइन",
      tags: "erste-hilfe bildung", type: "training",
      descDe: "Für medizinische Fachkräfte und ausgebildete Ersthelfer:innen, die in Nepal Klassen 9–12 schulen möchten.",
      descEn: "For medical professionals and certified first-aiders who want to train grades 9–12 in Nepal.",
      descNe: "नेपालमा कक्षा ९–१२ लाई तालिम दिन चाहने स्वास्थ्यकर्मी र प्रमाणित प्राथमिक उपचारकर्मीका लागि।"
    },
    {
      id: "ev-2026-11-kultur", date: "2026-11-08", time: "17:00–22:00",
      de: "Interkulturelles Herbstfest & Spendenabend", en: "Intercultural autumn festival & fundraising evening", ne: "अन्तरसांस्कृतिक शरद उत्सव र दान साँझ",
      placeDe: "Darmstadt", placeEn: "Darmstadt", placeNe: "डार्मस्टाट",
      tags: "kultur spenden", type: "culture",
      descDe: "Musik, Tanz und nepalesische Küche — offen für die gesamte Öffentlichkeit. Erlös fließt in One Euro for Nation.",
      descEn: "Music, dance and Nepali cuisine — open to the general public. Proceeds go to One Euro for Nation.",
      descNe: "सङ्गीत, नृत्य र नेपाली परिकार — सर्वसाधारणका लागि खुला। सङ्कलित रकम One Euro for Nation मा जान्छ।"
    },
    {
      id: "ev-2026-12-mv", date: "2026-12-06", time: "11:00–15:00",
      de: "Ordentliche Mitgliederversammlung 2026", en: "Annual general meeting 2026", ne: "नियमित साधारण सभा २०२६",
      placeDe: "Darmstadt + Videokonferenz", placeEn: "Darmstadt + video conference", placeNe: "डार्मस्टाट + भिडियो बैठक",
      tags: "verein mitglieder", type: "governance",
      descDe: "Jahresbericht, Kassenprüfungsbericht, Haushalt und Wahlen gemäß § 9 der Satzung. Einladung erfolgt schriftlich mit zwei Wochen Frist.",
      descEn: "Annual report, audit report, budget and elections under § 9 of the statutes. Invitations are sent in writing two weeks in advance.",
      descNe: "विधानको § ९ अनुसार वार्षिक प्रतिवेदन, लेखापरीक्षण प्रतिवेदन, बजेट र निर्वाचन। निमन्त्रणा दुई हप्ता अगावै लिखित रूपमा पठाइन्छ।"
    },
    {
      id: "ev-2027-01-sport", date: "2027-01-24", time: "09:00–18:00",
      de: "NPJOE Winter-Cup: Fußball & Cricket", en: "NPJOE Winter Cup: football & cricket", ne: "NPJOE विन्टर कप: फुटबल र क्रिकेट",
      placeDe: "Rhein-Main-Gebiet", placeEn: "Rhine-Main region", placeNe: "राइन-माइन क्षेत्र",
      tags: "sport jugend", type: "sport",
      descDe: "Turnier für Jugendteams der Diaspora — Integration und Teilhabe durch Sport nach § 3(g) der Satzung.",
      descEn: "Tournament for diaspora youth teams — integration and participation through sport under § 3(g) of the statutes.",
      descNe: "प्रवासी युवा टोलीका लागि प्रतियोगिता — विधानको § ३(छ) अनुसार खेलमार्फत एकीकरण र सहभागिता।"
    },
    {
      id: "ev-2027-03-visa", date: "2027-03-14", time: "18:00–20:00",
      de: "Online-Seminar: Studium, Ausbildung & Visum in Deutschland", en: "Online seminar: study, training & visa in Germany", ne: "अनलाइन सेमिनार: जर्मनीमा अध्ययन, तालिम र भिसा",
      placeDe: "Online (Zoom)", placeEn: "Online (Zoom)", placeNe: "अनलाइन (Zoom)",
      tags: "bildung online integration", type: "seminar",
      descDe: "Praxisseminar für neu angekommene Nepalis: Anerkennung von Abschlüssen, Sprachkurse, Bewerbung und Behördengänge.",
      descEn: "Practical seminar for newly arrived Nepalis: recognition of qualifications, language courses, applications and authorities.",
      descNe: "नयाँ आएका नेपालीका लागि व्यावहारिक सेमिनार: योग्यताको मान्यता, भाषा कक्षा, आवेदन र सरकारी प्रक्रिया।"
    }
  ];

  /* ----------------------------------------------------------------- News */
  var NEWS = [
    {
      id: "n1", date: "2026-08-01", tag: "verein",
      de: "Projektbeschluss NPJOE-2026-001 einstimmig angenommen",
      en: "Project resolution NPJOE-2026-001 adopted unanimously",
      ne: "परियोजना निर्णय NPJOE-2026-001 सर्वसम्मत पारित",
      exDe: "Der Vorstand hat die drei Kernprogramme für 2026–2030 beschlossen: One Day for Nation, die Nationale Erste-Hilfe-Kampagne und One Euro for Nation.",
      exEn: "The board adopted the three core programmes for 2026–2030: One Day for Nation, the National First Aid Campaign and One Euro for Nation.",
      exNe: "कार्यसमितिले २०२६–२०३० का तीन मुख्य कार्यक्रम पारित गर्‍यो: One Day for Nation, राष्ट्रिय प्राथमिक उपचार अभियान र One Euro for Nation।",
      bodyDe: "Der Beschluss gilt als offizieller Vereinsbeschluss und bildet die Grundlage für alle Aktivitäten, Kooperationen und Förderanträge im Rahmen dieser Initiative. Er definiert eine Laufzeit vom 1. Januar 2026 bis zum 31. Dezember 2030 und richtet sich ausdrücklich an alle Nepalis weltweit, die im Ausland leben — nicht nur an die Gemeinschaft in Deutschland. Zusätzlich verpflichtet sich der Verein in Beschluss 5 zur jährlichen öffentlichen Berichterstattung über alle Programmaktivitäten.",
      bodyEn: "The resolution serves as the official organisational resolution and forms the basis for all activities, cooperations and funding applications within this initiative. It defines a term from 1 January 2026 to 31 December 2030 and is expressly aimed at all Nepalis worldwide living abroad — not only the community in Germany. In resolution 5 the association additionally commits to annual public reporting on all programme activities.",
      bodyNe: "यो निर्णय आधिकारिक संगठनात्मक निर्णय हो र यस अभियानअन्तर्गतका सबै गतिविधि, सहकार्य र अनुदान आवेदनको आधार बन्छ। यसले १ जनवरी २०२६ देखि ३१ डिसेम्बर २०३० सम्मको अवधि तोक्छ र स्पष्ट रूपमा विश्वभर विदेशमा रहेका सबै नेपालीलाई लक्षित गर्छ — जर्मनीको समुदायलाई मात्र होइन। निर्णय ५ मा संस्थाले सबै कार्यक्रम गतिविधिबारे वार्षिक सार्वजनिक प्रतिवेदन दिने थप प्रतिबद्धता जनाएको छ।"
    },
    {
      id: "n2", date: "2026-08-15", tag: "partner",
      de: "MOU mit NPYS-N für die drei Kernprogramme unterzeichnet",
      en: "MOU with NPYS-N signed for the three core programmes",
      ne: "तीन मुख्य कार्यक्रमका लागि NPYS-N सँग समझदारीपत्रमा हस्ताक्षर",
      exDe: "Beide Vorsitzenden unterzeichneten das Memorandum of Understanding im Online-Meeting. Es gilt vom 15. August 2026 bis 31. Dezember 2030.",
      exEn: "Both chairpersons signed the Memorandum of Understanding during an online meeting. It runs from 15 August 2026 to 31 December 2030.",
      exNe: "दुवै अध्यक्षले अनलाइन बैठकमा समझदारीपत्रमा हस्ताक्षर गरे। यो १५ अगस्ट २०२६ देखि ३१ डिसेम्बर २०३० सम्म लागू रहनेछ।",
      bodyDe: "Das MOU regelt die gemeinsame Umsetzung von One Day for Nation, der Erste-Hilfe-Kampagne und One Euro for Nation. NPJOE rekrutiert und zertifiziert Volunteers, stellt Trainer:innen und verwaltet Spenden; NPYS-N koordiniert Einsätze, wählt Schulen und Gemeinschaften aus und legt geprüfte Projektvorschläge sowie Verwendungsnachweise vor. Vereinbart sind unter anderem Quartalsberichte, Einzelbelege innerhalb von 30 Tagen, zehnjährige Aufbewahrung der Finanzunterlagen und mindestens zwei Koordinationstreffen pro Jahr.",
      bodyEn: "The MOU governs joint delivery of One Day for Nation, the First Aid Campaign and One Euro for Nation. NPJOE recruits and certifies volunteers, provides trainers and manages fundraising; NPYS-N coordinates deployments, identifies schools and communities, and submits verified project proposals and expense reports. The safeguards include quarterly reporting, itemised receipts within 30 days, ten-year retention of financial records and at least two coordination meetings per year.",
      bodyNe: "समझदारीपत्रले One Day for Nation, प्राथमिक उपचार अभियान र One Euro for Nation को संयुक्त सञ्चालनलाई नियमन गर्छ। NPJOE ले स्वयंसेवक भर्ना र प्रमाणीकरण गर्छ, प्रशिक्षक उपलब्ध गराउँछ र रकम सङ्कलन व्यवस्थापन गर्छ; NPYS-N ले परिचालनको समन्वय गर्छ, विद्यालय र समुदाय पहिचान गर्छ, अनि प्रमाणित परियोजना प्रस्ताव र खर्च विवरण बुझाउँछ। सुरक्षा उपायमा त्रैमासिक प्रतिवेदन, ३० दिनभित्र विस्तृत रसिद, वित्तीय अभिलेख दस वर्षसम्म सुरक्षित राख्ने व्यवस्था र वर्षमा कम्तीमा दुई समन्वय बैठक पर्छन्।"
    },
    {
      id: "n3", date: "2026-06-20", tag: "erste-hilfe",
      de: "Erste-Hilfe-Kampagne: Lehrmaterial auf Nepali fertiggestellt",
      en: "First Aid Campaign: Nepali training materials completed",
      ne: "प्राथमिक उपचार अभियान: नेपाली तालिम सामग्री तयार",
      exDe: "Handbücher, Poster und Übungsmaterial liegen nun vollständig auf Nepali vor — ohne Sprachbarrieren für Schüler:innen und Lehrkräfte.",
      exEn: "Manuals, posters and practice materials are now fully available in Nepali — no language barriers for students and teachers.",
      exNe: "पुस्तिका, पोस्टर र अभ्यास सामग्री अब पूर्ण रूपमा नेपालीमा उपलब्ध छन् — विद्यार्थी र शिक्षकलाई भाषाको अवरोध छैन।"
    },
    {
      id: "n4", date: "2026-06-10", tag: "verein",
      de: "Aktuelle Satzung vom 10. Juni 2026 — Eintragung unter VR 84826",
      en: "Current statutes dated 10 June 2026 — registered under VR 84826",
      ne: "१० जुन २०२६ को हालको विधान — VR 84826 मा दर्ता",
      exDe: "Der Verein ist beim Amtsgericht Darmstadt eingetragen und verfolgt ausschließlich gemeinnützige und mildtätige Zwecke nach §§ 52, 53 AO.",
      exEn: "The association is registered at Darmstadt district court and exclusively pursues charitable and benevolent purposes under §§ 52, 53 AO.",
      exNe: "संस्था डार्मस्टाट जिल्ला अदालतमा दर्ता छ र AO का §§ ५२, ५३ अनुसार परोपकारी तथा जनहितकारी उद्देश्य मात्र पछ्याउँछ।"
    },
    {
      id: "n5", date: "2026-04-09", tag: "spenden",
      de: "One Euro for Nation startet: erste 1.000 € für Schulmaterialien",
      en: "One Euro for Nation launches: first €1,000 for school materials",
      ne: "One Euro for Nation सुरु: शैक्षिक सामग्रीका लागि पहिलो १,००० युरो",
      exDe: "Hunderte Kleinspenden aus sieben Ländern finanzieren Hefte, Stifte und Bücher für Schüler:innen aus benachteiligten Familien.",
      exEn: "Hundreds of small donations from seven countries finance notebooks, pens and books for students from disadvantaged families.",
      exNe: "सात देशबाट आएका सयौँ साना दानले विपन्न परिवारका विद्यार्थीका लागि कापी, कलम र पुस्तकको खर्च जुटाउँछन्।"
    },
    {
      id: "n6", date: "2026-03-02", tag: "volunteer",
      de: "Über 200 Volunteers aus 17 Ländern registriert",
      en: "More than 200 volunteers registered from 17 countries",
      ne: "१७ देशबाट २०० भन्दा बढी स्वयंसेवक दर्ता",
      exDe: "Von Ärzt:innen über Softwareentwickler:innen bis zu Yogalehrer:innen — die Diaspora bringt ihre Berufe ein.",
      exEn: "From doctors to software developers to yoga instructors — the diaspora is contributing its professions.",
      exNe: "चिकित्सकदेखि सफ्टवेयर डेभलपर र योग प्रशिक्षकसम्म — प्रवासी समुदायले आफ्नो पेसा नै योगदानमा लगाउँदै छ।",
      bodyDe: "Nach den ersten Monaten der Registrierung zeigt sich, wie breit die beruflichen Hintergründe der Diaspora sind. Am stärksten vertreten sind Gesundheit und Medizin, Bildung sowie Technologie und IT — genau die Bereiche, in denen NPYS-N den größten Bedarf meldet. Registrierungen kommen aus Deutschland, Österreich, der Schweiz, Großbritannien, den USA, Kanada, Australien, Japan, Südkorea und den Golfstaaten. Jede Registrierung ist kostenlos und unverbindlich: Erst beim Matching entscheiden Volunteer und Partnerorganisation gemeinsam, ob ein Einsatz zustande kommt.",
      bodyEn: "After the first months of registration it is clear how broad the professional backgrounds of the diaspora are. Health and medicine, education, and technology and IT are the strongest fields — exactly where NPYS-N reports the greatest need. Registrations come from Germany, Austria, Switzerland, the UK, the USA, Canada, Australia, Japan, South Korea and the Gulf states. Every registration is free and non-binding: only at the matching stage do the volunteer and the partner organisation jointly decide whether an assignment goes ahead.",
      bodyNe: "दर्ताका पहिलो केही महिनापछि प्रवासी समुदायको पेसागत पृष्ठभूमि कति फराकिलो रहेछ भन्ने स्पष्ट भएको छ। स्वास्थ्य तथा चिकित्सा, शिक्षा, र प्रविधि तथा आईटी सबैभन्दा बलिया क्षेत्र हुन् — ठ्याक्कै जहाँ NPYS-N ले सबैभन्दा बढी खाँचो रहेको बताउँछ। दर्ता जर्मनी, अस्ट्रिया, स्विट्जरल्यान्ड, बेलायत, अमेरिका, क्यानडा, अस्ट्रेलिया, जापान, दक्षिण कोरिया र खाडी मुलुकबाट आएका छन्। हरेक दर्ता निःशुल्क र बाध्यकारी हुँदैन: परिचालन हुने कि नहुने भन्ने निर्णय मिलान चरणमा स्वयंसेवक र साझेदार संस्थाले संयुक्त रूपमा गर्छन्।"
    },
    {
      id: "n7", date: "2026-08-10", tag: "erste-hilfe",
      de: "Zwölfte Schule in das Kampagnenprogramm aufgenommen",
      en: "Twelfth school admitted to the campaign programme",
      ne: "अभियान कार्यक्रममा बाह्रौँ विद्यालय समावेश",
      exDe: "Damit sind rund 1.450 Schüler:innen der Klassen 9–12 geschult und 68 Lehrkräfte zu dauerhaften Trainer:innen ausgebildet.",
      exEn: "Around 1,450 students in grades 9–12 have now been trained and 68 teachers certified as permanent trainers.",
      exNe: "कक्षा ९–१२ का करिब १,४५० विद्यार्थीले तालिम पाए र ६८ शिक्षक स्थायी प्रशिक्षकका रूपमा प्रमाणित भए।",
      bodyDe: "Die Auswahl der Schulen trifft NPYS-N nach drei Kriterien: Erreichbarkeit für Volunteer-Teams, Bereitschaft der Schulleitung, mindestens eine Lehrkraft dauerhaft als Trainer:in freizustellen, und der Anteil von Schüler:innen aus benachteiligten Familien. Jede aufgenommene Schule erhält ein zertifiziertes Erste-Hilfe-Kit, Handbücher und Übungsmaterial auf Nepali sowie einen jährlichen Auffrischungsbesuch. Ziel des Beschlusses NPJOE-2026-001 sind 100 Schulen bis Ende 2030.",
      bodyEn: "NPYS-N selects schools by three criteria: accessibility for volunteer teams, the school management's willingness to permanently release at least one teacher as a trainer, and the share of students from disadvantaged families. Every admitted school receives a certified First Aid kit, manuals and practice material in Nepali, plus an annual refresher visit. Resolution NPJOE-2026-001 targets 100 schools by the end of 2030.",
      bodyNe: "NPYS-N ले तीन आधारमा विद्यालय छान्छ: स्वयंसेवक टोलीका लागि पहुँच, कम्तीमा एक शिक्षकलाई स्थायी प्रशिक्षकका रूपमा दिन विद्यालय व्यवस्थापन तयार हुनु, र विपन्न परिवारका विद्यार्थीको अनुपात। समावेश भएको हरेक विद्यालयले प्रमाणित प्राथमिक उपचार किट, नेपाली भाषाका पुस्तिका र अभ्यास सामग्री, साथै वार्षिक पुनर्ताजगी भ्रमण पाउँछ। निर्णय NPJOE-2026-001 ले २०३० को अन्त्यसम्म १०० विद्यालयको लक्ष्य राखेको छ।"
    },
    {
      id: "n8", date: "2026-07-28", tag: "verein",
      de: "Seminarreihe zu Visum, Ausbildung und Studium startet im Herbst",
      en: "Seminar series on visas, training and study starts in autumn",
      ne: "भिसा, तालिम र अध्ययनसम्बन्धी सेमिनार शृंखला शरदमा सुरु",
      exDe: "Kostenlose Online-Formate für neu angekommene Nepalis — zu Anerkennung von Abschlüssen, Sprachkursen, Bewerbungen und Behördengängen.",
      exEn: "Free online formats for newly arrived Nepalis — on recognition of qualifications, language courses, applications and dealing with authorities.",
      exNe: "नयाँ आएका नेपालीका लागि निःशुल्क अनलाइन कार्यक्रम — योग्यताको मान्यता, भाषा कक्षा, आवेदन र सरकारी प्रक्रियाबारे।",
      bodyDe: "§ 3(b) der Satzung verpflichtet uns zu Seminaren, Workshops und Online-Formaten in Deutschland zu Themen wie Visa, Ausbildung, Studium, Sprache, Integration und Leben in Deutschland. Die Reihe richtet sich an Menschen, die neu in Deutschland sind, und an alle, die ihre Angehörigen dabei unterstützen. Die Teilnahme ist kostenlos und steht auch Nichtmitgliedern offen; Aufzeichnungen stellen wir Mitgliedern anschließend zur Verfügung.",
      bodyEn: "§ 3(b) of the statutes commits us to seminars, workshops and online formats in Germany on topics such as visas, vocational training, study, language, integration and life in Germany. The series is aimed at people new to Germany and at everyone supporting relatives through the process. Participation is free and open to non-members; recordings are afterwards made available to members.",
      bodyNe: "विधानको § ३(ख) ले हामीलाई जर्मनीमा भिसा, व्यावसायिक तालिम, अध्ययन, भाषा, एकीकरण र जर्मनीको जीवनजस्ता विषयमा सेमिनार, कार्यशाला र अनलाइन कार्यक्रम गर्न प्रतिबद्ध गराउँछ। यो शृंखला जर्मनीमा नयाँ आएका र आफ्ना आफन्तलाई सहयोग गरिरहेका सबैका लागि हो। सहभागिता निःशुल्क छ र गैरसदस्यका लागि पनि खुला छ; रेकर्डिङ पछि सदस्यहरूलाई उपलब्ध गराइन्छ।"
    },
    {
      id: "n9", date: "2026-06-05", tag: "spenden",
      de: "One Euro for Nation erreicht 34 Prozent des Jahresziels",
      en: "One Euro for Nation reaches 34 per cent of the annual goal",
      ne: "One Euro for Nation वार्षिक लक्ष्यको ३४ प्रतिशतमा",
      exDe: "8.420 € von 25.000 € — finanziert wurden bislang 168 Erste-Hilfe-Kits und rund 2.400 Hefte und Stifte.",
      exEn: "€8,420 of €25,000 — funding 168 First Aid kits and around 2,400 notebooks and pens so far.",
      exNe: "२५,००० युरोमध्ये ८,४२० युरो — अहिलेसम्म १६८ प्राथमिक उपचार किट र करिब २,४०० कापी तथा कलमको खर्च जुट्यो।",
      bodyDe: "Die Initiative lebt von vielen kleinen Beiträgen: Der häufigste Spendenbetrag liegt unter zehn Euro. Alle Spenden werden über das einheitliche Vereinskonto verwaltet, über das Schatzmeister:in und Vorsitz nur gemeinsam verfügen dürfen (§ 10 der Satzung). Wo möglich, wird Material lokal in Nepal beschafft — das stärkt die regionale Wirtschaft und senkt Transportkosten.",
      bodyEn: "The initiative lives on many small contributions: the most common donation is under ten euros. All donations are managed through the single association account, over which the treasurer and chair may only dispose jointly (§ 10 of the statutes). Where possible, materials are procured locally in Nepal — this strengthens the regional economy and lowers transport costs.",
      bodyNe: "यो अभियान धेरै साना योगदानमा टिकेको छ: सबैभन्दा धेरै आउने दान दस युरोभन्दा कमको हुन्छ। सबै दान एउटै संस्था खातामार्फत व्यवस्थापन हुन्छ, जसको सञ्चालन कोषाध्यक्ष र अध्यक्षले संयुक्त रूपमा मात्र गर्न सक्छन् (विधानको § १०)। सकेसम्म सामग्री नेपालमै स्थानीय रूपमा किनिन्छ — यसले क्षेत्रीय अर्थतन्त्र बलियो बनाउँछ र ढुवानी खर्च घटाउँछ।"
    },
    {
      id: "n10", date: "2026-05-30", tag: "partner",
      de: "Erste Lehrkräfte schließen die Train-the-Trainer-Ausbildung ab",
      en: "First teachers complete the train-the-trainer programme",
      ne: "पहिलो समूहका शिक्षकले प्रशिक्षक तालिम पूरा गरे",
      exDe: "Sie führen die Erste-Hilfe-Kurse an ihrer Schule künftig eigenständig durch — das Programm läuft weiter, wenn die Volunteer-Teams abgereist sind.",
      exEn: "They will run the first aid courses at their school independently — the programme continues once the volunteer teams have left.",
      exNe: "उहाँहरूले आफ्नै विद्यालयमा प्राथमिक उपचार कक्षा स्वतन्त्र रूपमा चलाउनुहुनेछ — स्वयंसेवक टोली फर्केपछि पनि कार्यक्रम चलिरहन्छ।",
      bodyDe: "Nachhaltigkeit ist kein Zusatz, sondern in das Programm eingebaut. Ausgebildete Lehrkräfte werden zu zertifizierten Trainer:innen, ausgebildete Schüler:innen werden Mentor:innen für die nächste Klasse. Sämtliche Materialien liegen auf Nepali vor, damit keine Sprachbarriere entsteht. NPYS-N besucht jede Schule jährlich zur Auffrischung und dokumentiert, wie viele Personen erreicht wurden.",
      bodyEn: "Sustainability is not an add-on but built into the programme. Trained teachers become certified trainers, trained students become mentors for the next class. All materials are in Nepali so that no language barrier arises. NPYS-N visits each school annually for refreshers and documents how many people were reached.",
      bodyNe: "दिगोपन थपिएको कुरा होइन, कार्यक्रमभित्रै गाँसिएको हो। तालिमप्राप्त शिक्षक प्रमाणित प्रशिक्षक बन्छन्, तालिम पाएका विद्यार्थी अर्को कक्षाका मार्गदर्शक बन्छन्। भाषाको अवरोध नआओस् भनेर सबै सामग्री नेपालीमै छन्। NPYS-N ले पुनर्ताजगीका लागि हरेक विद्यालयमा वार्षिक रूपमा जान्छ र कति जनासम्म पुगियो भन्ने अभिलेख राख्छ।"
    },
    {
      id: "n11", date: "2026-04-18", tag: "kultur",
      de: "Kulturfest in Hessen: offen für die gesamte Öffentlichkeit",
      en: "Cultural festival in Hesse: open to the general public",
      ne: "हेसेनमा सांस्कृतिक पर्व: सर्वसाधारणका लागि खुला",
      exDe: "Musik, Tanz und nepalesische Küche — interkulturelle Begegnung nach § 3(c) der Satzung, ausdrücklich nicht nur für die Diaspora.",
      exEn: "Music, dance and Nepali cuisine — intercultural encounter under § 3(c) of the statutes, expressly not only for the diaspora.",
      exNe: "सङ्गीत, नृत्य र नेपाली परिकार — विधानको § ३(ग) अनुसार अन्तरसांस्कृतिक भेटघाट, प्रवासी समुदायका लागि मात्र होइन।",
      bodyDe: "Unsere Kulturarbeit hat zwei Richtungen: Sie bewahrt die Verbindung der hier aufwachsenden Generation zu ihrer Herkunft, und sie öffnet diese Kultur für Nachbarschaft, Schulen und Vereine vor Ort. Deshalb sind alle Kulturveranstaltungen öffentlich. Der Erlös des Abends fließt vollständig in die Spendeninitiative One Euro for Nation.",
      bodyEn: "Our cultural work runs in two directions: it preserves the connection of the generation growing up here to their origins, and it opens that culture to neighbours, schools and local associations. That is why all cultural events are public. The evening's proceeds go entirely to the One Euro for Nation donation initiative.",
      bodyNe: "हाम्रो सांस्कृतिक काम दुई दिशामा चल्छ: यसले यहाँ हुर्कंदै गरेको पुस्तालाई आफ्नो जरासँग जोडिराख्छ, र त्यही संस्कृति छिमेकी, विद्यालय र स्थानीय संघसंस्थासामु खोल्छ। त्यसैले सबै सांस्कृतिक कार्यक्रम सार्वजनिक हुन्छन्। त्यो साँझबाट सङ्कलित सबै रकम One Euro for Nation दान अभियानमा जान्छ।"
    },
    {
      id: "n12", date: "2024-10-05", tag: "kultur",
      de: "Dashain-Feier 2024: Kultur, Begegnung und Gemeinschaft",
      en: "Dashain celebration 2024: culture, connection and community",
      ne: "दसैँ उत्सव २०२४: संस्कृति, अपनत्व र समुदाय",
      exDe: "Am 5. Oktober 2024 kamen Mitglieder, Freund:innen und Gäste zu einem gemeinsamen Dashain-Fest mit Bühnenprogramm, Ehrungen und nepalesischem Essen zusammen.",
      exEn: "On 5 October 2024, members, friends and guests came together for a Dashain celebration with a stage programme, presentations and Nepali food.",
      exNe: "५ अक्टोबर २०२४ मा सदस्य, साथीभाइ र पाहुनाहरू मञ्चीय कार्यक्रम, सम्मान र नेपाली खानासहितको दसैँ उत्सवमा जुटे।",
      bodyDe: "Die Fotodokumentation zeigt den Empfang und die Anmeldung, Beiträge auf der Bühne, die Pokal- und Medaillenübergabe sowie viele Begegnungen beim gemeinsamen Essen. Alle 16 Bilder und ein kurzer Videoclip sind — jeweils mit Erklärung — im Album zur Dashain-Feier zu sehen.",
      bodyEn: "The photo story covers reception and registration, contributions on stage, the trophy and medal presentation, and community moments over a shared meal. All 16 photographs and a short video clip, each with an explanation, are in the Dashain album.",
      bodyNe: "तस्बिर कथाले स्वागत र दर्ता, मञ्चीय प्रस्तुति, कप तथा पदक वितरण र सामूहिक भोजका सामुदायिक क्षण समेट्छ। व्याख्यासहितका सबै १६ तस्बिर र एउटा छोटो भिडियो दसैँ एल्बममा छन्।",
      image: "assets/media/dashain-2024/trophy-presentation.jpg",
      imageAltDe: "Pokalübergabe bei der Dashain-Feier der NPJOE am 5. Oktober 2024",
      imageAltEn: "Trophy presentation at the NPJOE Dashain celebration on 5 October 2024",
      imageAltNe: "५ अक्टोबर २०२४ को NPJOE दसैँ उत्सवमा कप वितरण",
      href: "dashain-2024.html"
    },
    {
      id: "n13", date: "2026-04-10", tag: "kultur",
      de: "Nepalesisches Neujahr 2026: über 150 Gäste feiern Naya Barsha in Darmstadt",
      en: "Nepali New Year 2026: more than 150 guests celebrate Naya Barsha in Darmstadt",
      ne: "नेपाली नयाँ वर्ष २०२६: डार्मस्टाटमा १५० भन्दा बढी पाहुनासहित नयाँ वर्ष उत्सव",
      exDe: "Am 10. April 2026 feierte die NPJOE in der Knabenschule Darmstadt das nepalesische Neujahr — mit nepalesischer Küche, Livekonzert, Tanzaufführungen und kulturellen Darbietungen.",
      exEn: "On 10 April 2026 the NPJOE celebrated the Nepali New Year at the Knabenschule in Darmstadt — with Nepali cuisine, a live concert, dance performances and cultural presentations.",
      exNe: "१० अप्रिल २०२६ मा NPJOE ले डार्मस्टाटको क्नाबेनशुलेमा नेपाली नयाँ वर्ष मनायो — नेपाली परिकार, लाइभ कन्सर्ट, नृत्य प्रस्तुति र सांस्कृतिक कार्यक्रमसहित।",
      bodyDe: "Das Naya Barsha markiert den Beginn eines neuen Jahres nach dem nepalesischen Kalender und ist ein Fest der Hoffnung, des Neuanfangs und der Gemeinschaft. Mit über 150 Besucherinnen und Besuchern war der Abend eine der größten und lebendigsten Veranstaltungen des Vereins bisher. Interkulturelle Feste, die der gesamten Öffentlichkeit offenstehen, sind nach § 3c der Satzung ausdrücklich Vereinszweck. Zehn Fotos und elf Videoaufnahmen des Abends sind — jeweils mit Erklärung — im Album zur Neujahrsfeier zu sehen.",
      bodyEn: "Naya Barsha marks the beginning of a new year in the Nepali calendar and is a festival of hope, of new beginnings and of community. With more than 150 visitors, the evening was one of the largest and liveliest events the association has held. Intercultural festivals open to the general public are an express purpose of the association under § 3c of the statutes. Ten photographs and eleven video recordings from the evening, each with an explanation, are in the New Year album.",
      bodyNe: "नयाँ वर्षले नेपाली पात्रोमा नयाँ वर्षको सुरुवात जनाउँछ र यो आशा, नयाँ सुरुवात तथा समुदायको चाड हो। १५० भन्दा बढी सहभागीसहित त्यो साँझ संस्थाले गरेका सबैभन्दा ठूला र जीवन्त कार्यक्रममध्ये एक थियो। विधानको § ३ग अनुसार सर्वसाधारणका लागि खुला अन्तरसांस्कृतिक पर्व संस्थाको स्पष्ट उद्देश्य हो। व्याख्यासहित त्यो साँझका दस तस्बिर र एघार भिडियो नयाँ वर्ष एल्बममा छन्।",
      image: "assets/media/naya-barsha-2026/live-concert.jpg",
      imageAltDe: "Livekonzert bei der Neujahrsfeier der NPJOE am 10. April 2026 in Darmstadt",
      imageAltEn: "Live concert at the NPJOE New Year celebration on 10 April 2026 in Darmstadt",
      imageAltNe: "१० अप्रिल २०२६ मा डार्मस्टाटमा भएको NPJOE नयाँ वर्ष उत्सवको लाइभ कन्सर्ट",
      href: "naya-barsha-2026.html"
    }
  ];

  /* ------------------------------------------------------------------ FAQ */
  var FAQ = [
    { cat: "mitglied", qDe: "Wer kann Mitglied werden?", qEn: "Who can become a member?",
      qNe: "सदस्य को बन्न सक्छ?",
      aDe: "Nach § 5 der Satzung kann jede natürliche Person Mitglied werden — unabhängig von Herkunft, Staatsangehörigkeit oder Wohnort. Über die Aufnahme entscheidet der Vorstand; die Mitgliedschaft beginnt mit dem Vorstandsbeschluss.",
      aEn: "Under § 5 of the statutes, any natural person may become a member — regardless of origin, nationality or place of residence. The board decides on admission; membership begins with the board's resolution.",
      aNe: "विधानको § ५ अनुसार कुनै पनि प्राकृतिक व्यक्ति सदस्य बन्न सक्नुहुन्छ — मूल, नागरिकता वा बसोबासको ठाउँ जे भए पनि। सदस्यता स्वीकृतिको निर्णय कार्यसमितिले गर्छ; सोही निर्णयसँगै सदस्यता सुरु हुन्छ।" },
    { cat: "mitglied", qDe: "Was kostet die Mitgliedschaft?", qEn: "What does membership cost?",
      qNe: "सदस्यताको शुल्क कति हो?",
      aDe: "Der monatliche Mitgliedsbeitrag beträgt derzeit 5,00 €. Die Höhe wird von der Mitgliederversammlung festgelegt und in einer Beitragsordnung geregelt (§ 7 der Satzung).",
      aEn: "The monthly membership fee is currently €5.00. The amount is set by the general meeting and regulated in a fee schedule (§ 7 of the statutes).",
      aNe: "मासिक सदस्यता शुल्क हाल ५.०० युरो छ। यो रकम साधारण सभाले तोक्छ र शुल्क नियमावलीमा व्यवस्था गरिन्छ (विधानको § ७)।" },
    { cat: "mitglied", qDe: "Wie kann ich die Mitgliedschaft beenden?", qEn: "How can I end my membership?",
      qNe: "म सदस्यता कसरी अन्त्य गर्न सक्छु?",
      aDe: "Durch schriftliche Austrittserklärung an den Vorstand mit einer Frist von einem Monat (§ 6 der Satzung). Eine formlose E-Mail an unsere Mitglieder-Adresse genügt.",
      aEn: "By written notice of withdrawal to the board with one month's notice (§ 6 of the statutes). An informal e-mail to our membership address is sufficient.",
      aNe: "एक महिनाको सूचनासहित कार्यसमितिलाई लिखित राजीनामा दिएर (विधानको § ६)। हाम्रो सदस्यता ठेगानामा पठाइएको सामान्य इमेल भए पुग्छ।" },
    { cat: "volunteer", qDe: "Muss ich Nepali sein, um mitzumachen?", qEn: "Do I have to be Nepali to take part?",
      qNe: "सहभागी हुन नेपाली नै हुनुपर्छ?",
      aDe: "One Day for Nation richtet sich ausdrücklich an alle Nepalis weltweit. Unterstützer:innen anderer Herkunft sind bei Spenden, Mitgliedschaft und vielen Projekten ebenfalls herzlich willkommen — sprechen Sie uns an.",
      aEn: "One Day for Nation is expressly aimed at all Nepalis worldwide. Supporters of other backgrounds are equally welcome for donations, membership and many projects — just get in touch.",
      aNe: "One Day for Nation स्पष्ट रूपमा विश्वभरका नेपालीलाई लक्षित छ। अन्य पृष्ठभूमिका शुभचिन्तकहरू पनि दान, सदस्यता र धेरै परियोजनाका लागि उत्तिकै स्वागतयोग्य हुनुहुन्छ — बस् सम्पर्क गर्नुहोस्।" },
    { cat: "volunteer", qDe: "Wie lange dauert ein Einsatz?", qEn: "How long is a deployment?",
      qNe: "एउटा परिचालन कति लामो हुन्छ?",
      aDe: "Mindestens ein Tag. Längere Einsätze sind ausdrücklich willkommen und hinterlassen mehr Wirkung. Sie geben Ihre Verfügbarkeit bei der Registrierung an.",
      aEn: "At least one day. Longer assignments are expressly welcome and leave a greater impact. You state your availability during registration.",
      aNe: "कम्तीमा एक दिन। लामो अवधिको परिचालन स्पष्ट रूपमा स्वागतयोग्य छ र त्यसले ठूलो छाप छोड्छ। दर्ता गर्दा तपाईं आफ्नो उपलब्धता उल्लेख गर्नुहुन्छ।" },
    { cat: "volunteer", qDe: "Mein Beruf steht nicht auf der Liste — kann ich trotzdem helfen?", qEn: "My profession isn't listed — can I still help?",
      qNe: "मेरो पेसा सूचीमा छैन — के म पनि सहयोग गर्न सक्छु?",
      aDe: "Ja. Die zwölf Bereiche sind Beispiele, keine Grenzen. Kein Beruf ist ausgeschlossen. Wählen Sie im Formular „Sonstiges“ und beschreiben Sie kurz Ihre Qualifikation.",
      aEn: "Yes. The twelve fields are examples, not limits. No profession is excluded. Select 'Other' in the form and briefly describe your qualification.",
      aNe: "सक्नुहुन्छ। बाह्र क्षेत्र उदाहरण हुन्, सीमा होइनन्। कुनै पनि पेसा बाहिर छैन। फारममा 'अन्य' छान्नुहोस् र आफ्नो योग्यता छोटकरीमा लेख्नुहोस्।" },
    { cat: "volunteer", qDe: "Wer übernimmt Reise- und Unterkunftskosten?", qEn: "Who covers travel and accommodation?",
      qNe: "यात्रा र बसोबासको खर्च कसले व्यहोर्छ?",
      aDe: "Die Registrierung ist kostenlos. Reise und Unterkunft organisieren Volunteers in der Regel selbst; NPYS-N unterstützt bei der Planung vor Ort und bei der Auswahl erreichbarer Schulen.",
      aEn: "Registration is free of charge. Volunteers usually arrange travel and accommodation themselves; NPYS-N supports local planning and the selection of accessible schools.",
      aNe: "दर्ता निःशुल्क छ। यात्रा र बसोबासको व्यवस्था सामान्यतया स्वयंसेवक आफैँले गर्नुहुन्छ; स्थानीय योजना र पहुँचयोग्य विद्यालय छनोटमा NPYS-N ले सहयोग गर्छ।" },
    { cat: "volunteer", qDe: "Bekomme ich einen Nachweis über meinen Einsatz?", qEn: "Do I receive proof of my deployment?",
      qNe: "के मैले आफ्नो परिचालनको प्रमाण पाउँछु?",
      aDe: "Ja — nach jedem Einsatz und dem Abschlussbericht erhalten Sie ein offizielles NPJOE-Zertifikat, das Sie auch für Bewerbungen nutzen können.",
      aEn: "Yes — after each assignment and the final report you receive an official NPJOE certificate, which you can also use for job applications.",
      aNe: "पाउनुहुन्छ — हरेक परिचालन र अन्तिम प्रतिवेदनपछि तपाईंले NPJOE को आधिकारिक प्रमाणपत्र पाउनुहुन्छ, जुन जागिरको आवेदनमा पनि प्रयोग गर्न सकिन्छ।" },
    { cat: "spenden", qDe: "Ist meine Spende steuerlich absetzbar?", qEn: "Is my donation tax-deductible?",
      qNe: "के मेरो दानमा करछुट पाइन्छ?",
      aDe: "Spenden werden durch NPJOE e.V. in Deutschland verwaltet und sind in Deutschland steuerlich absetzbar. Eine Zuwendungsbestätigung stellen wir auf Wunsch aus — bitte Adresse im Verwendungszweck oder per E-Mail angeben.",
      aEn: "Donations are managed by NPJOE e.V. in Germany and are tax-deductible in Germany. We issue a donation receipt on request — please provide your address in the reference field or by e-mail.",
      aNe: "दान जर्मनीमा NPJOE e.V. ले व्यवस्थापन गर्छ र जर्मनीमा करछुट पाइन्छ। अनुरोध गरेमा हामी दान रसिद जारी गर्छौं — कृपया सन्दर्भ महलमा वा इमेलबाट आफ्नो ठेगाना पठाउनुहोस्।" },
    { cat: "spenden", qDe: "Wofür wird mein Geld konkret verwendet?", qEn: "What exactly is my money used for?",
      qNe: "मेरो रकम ठ्याक्कै केमा प्रयोग हुन्छ?",
      aDe: "Für Erste-Hilfe-Kits, Trainingsmaterialien auf Nepali, Schulmaterialien, Hygienekits und Transportkosten zu abgelegenen Schulen. Jährlich veröffentlichen wir einen öffentlichen Bericht mit Zahlen.",
      aEn: "For First Aid kits, Nepali training materials, school supplies, hygiene kits and transport to remote schools. We publish an annual public report with figures.",
      aNe: "प्राथमिक उपचार किट, नेपाली तालिम सामग्री, शैक्षिक सामग्री, सरसफाइ किट र दुर्गम विद्यालयसम्मको ढुवानीमा। हामी तथ्याङ्कसहितको वार्षिक सार्वजनिक प्रतिवेदन प्रकाशित गर्छौं।" },
    { cat: "spenden", qDe: "Kann ich für ein bestimmtes Projekt spenden?", qEn: "Can I donate to a specific project?",
      qNe: "के म कुनै निश्चित परियोजनामा दान गर्न सक्छु?",
      aDe: "Ja. Geben Sie den Projektnamen im Verwendungszweck an — zum Beispiel „Erste-Hilfe-Kampagne“. Auf Wunsch erhalten Sie einen Projektbericht.",
      aEn: "Yes. State the project name in the reference field — for example 'First Aid Campaign'. On request you will receive a project report.",
      aNe: "सक्नुहुन्छ। सन्दर्भ महलमा परियोजनाको नाम लेख्नुहोस् — जस्तै 'प्राथमिक उपचार अभियान'। अनुरोध गरेमा तपाईंले परियोजना प्रतिवेदन पाउनुहुनेछ।" },
    { cat: "programme", qDe: "Warum liegt der Fokus auf den Klassen 9–12?", qEn: "Why the focus on grades 9–12?",
      qNe: "कक्षा ९–१२ मै किन जोड?",
      aDe: "Diese Altersgruppe kann Erste Hilfe verantwortlich anwenden, bleibt mehrere Jahre an der Schule und gibt Wissen an jüngere Jahrgänge weiter. So multipliziert sich die Wirkung in der ganzen Gemeinde.",
      aEn: "This age group can apply first aid responsibly, stays at school for several years and passes knowledge on to younger classes. The impact multiplies across the whole community.",
      aNe: "यो उमेर समूहले प्राथमिक उपचार जिम्मेवारीपूर्वक प्रयोग गर्न सक्छ, धेरै वर्ष विद्यालयमै रहन्छ र सानो कक्षामा ज्ञान हस्तान्तरण गर्छ। प्रभाव सिंगो समुदायभर फैलिन्छ।" },
    { cat: "programme", qDe: "Was passiert nach dem Einsatz an einer Schule?", qEn: "What happens after a deployment at a school?",
      qNe: "विद्यालयमा परिचालन सकिएपछि के हुन्छ?",
      aDe: "Ausgebildete Lehrkräfte werden zu dauerhaften Trainer:innen, die Schule erhält ein zertifiziertes Erste-Hilfe-Kit und Materialien, und NPYS-N besucht die Schule jährlich zur Auffrischung.",
      aEn: "Trained teachers become permanent trainers, the school receives a certified First Aid kit and materials, and NPYS-N visits annually for refreshers.",
      aNe: "तालिमप्राप्त शिक्षक स्थायी प्रशिक्षक बन्छन्, विद्यालयले प्रमाणित प्राथमिक उपचार किट र सामग्री पाउँछ, र NPYS-N पुनर्ताजगीका लागि वार्षिक रूपमा आउँछ।" },
    { cat: "verein", qDe: "Wie ist der Verein organisiert?", qEn: "How is the association organised?",
      qNe: "संस्थाको संरचना कस्तो छ?",
      aDe: "Organe sind die Mitgliederversammlung und der Vorstand (§ 12). Der Vorstand besteht aus Vorsitz, stellvertretendem Vorsitz, Schatzmeister:in, Schriftführer:in und drei bis fünf Beisitzer:innen. Vertreten wird der Verein durch zwei Vorstandsmitglieder gemeinsam (§ 26 BGB).",
      aEn: "The bodies are the general meeting and the board (§ 12). The board consists of chair, deputy chair, treasurer, secretary and three to five assessors. Two board members jointly represent the association (§ 26 BGB).",
      aNe: "संस्थाका अङ्ग साधारण सभा र कार्यसमिति हुन् (§ १२)। कार्यसमितिमा अध्यक्ष, उपाध्यक्ष, कोषाध्यक्ष, सचिव र तीनदेखि पाँच जना सदस्य रहन्छन्। दुई जना कार्यसमिति सदस्यले संयुक्त रूपमा संस्थाको प्रतिनिधित्व गर्छन् (BGB § २६)।" },
    { cat: "verein", qDe: "Gibt es Zweigstellen in anderen Städten?", qEn: "Are there branches in other cities?",
      qNe: "अरू सहरमा शाखा छन्?",
      aDe: "Ja, § 11 der Satzung erlaubt Zweigstellen im gesamten Bundesgebiet. Sie haben keine eigene Rechtspersönlichkeit, führen keine eigenen Kassen und sind organisatorisch an den Hauptverein angebunden.",
      aEn: "Yes, § 11 of the statutes allows branches throughout Germany. They have no separate legal personality, keep no separate accounts and are organisationally attached to the main association.",
      aNe: "छन्, विधानको § ११ ले जर्मनीभर शाखा खोल्न अनुमति दिन्छ। तिनको छुट्टै कानुनी हैसियत हुँदैन, छुट्टै कोष राख्दैनन् र संगठनात्मक रूपमा मुख्य संस्थासँग आबद्ध हुन्छन्।" },
    { cat: "verein", qDe: "Wie geht ihr mit meinen Daten um?", qEn: "How do you handle my data?",
      qNe: "तपाईंहरू मेरो डेटा कसरी व्यवस्थापन गर्नुहुन्छ?",
      aDe: "Personenbezogene Daten werden ausschließlich für Vereinszwecke gemäß DSGVO verarbeitet. Sie können jederzeit Auskunft, Berichtigung und Löschung verlangen — siehe Datenschutzerklärung.",
      aEn: "Personal data is processed exclusively for association purposes in accordance with the GDPR. You may request access, correction and deletion at any time — see our privacy policy.",
      aNe: "व्यक्तिगत डेटा GDPR अनुरूप संस्थाका प्रयोजनका लागि मात्र प्रशोधन गरिन्छ। तपाईं जुनसुकै बेला जानकारी, सच्याउने वा मेटाउने माग गर्न सक्नुहुन्छ — हाम्रो गोपनीयता नीति हेर्नुहोस्।" },

    { cat: "mitglied", qDe: "Ich bin unter 18 — kann ich trotzdem Mitglied werden?", qEn: "I am under 18 — can I still become a member?",
      qNe: "म १८ वर्षमुनिको छु — के म पनि सदस्य बन्न सक्छु?",
      aDe: "Ja. Die Satzung schließt niemanden nach Alter aus. Unser Online-Formular setzt ein Mindestalter von 14 Jahren; bei Minderjährigen benötigen wir zusätzlich die schriftliche Einwilligung der Erziehungsberechtigten, die Sie uns formlos per E-Mail senden können.",
      aEn: "Yes. The statutes exclude nobody by age. Our online form sets a minimum age of 14; for minors we additionally need the written consent of a parent or guardian, which you can send us informally by e-mail.",
      aNe: "सक्नुहुन्छ। विधानले उमेरका आधारमा कसैलाई बाहिर राख्दैन। हाम्रो अनलाइन फारमले न्यूनतम उमेर १४ वर्ष तोकेको छ; नाबालकका हकमा अभिभावक वा संरक्षकको लिखित सहमति पनि चाहिन्छ, जुन तपाईं सामान्य इमेलबाट पठाउन सक्नुहुन्छ।" },
    { cat: "mitglied", qDe: "Ich kann mir 5 € im Monat nicht leisten.", qEn: "I cannot afford €5 a month.",
      qNe: "मैले मासिक ५ युरो तिर्न सक्दिनँ।",
      aDe: "Das soll niemanden ausschließen. Für Schüler:innen, Studierende und Personen ohne Einkommen kann der Vorstand den Beitrag reduzieren oder erlassen. Kreuzen Sie im Formular einfach „Ermäßigung beantragen“ an — es entstehen Ihnen keinerlei Nachteile bei Aufnahme oder Stimmrecht.",
      aEn: "That should exclude nobody. For pupils, students and people without income the board can reduce or waive the fee. Simply tick 'request a reduction' in the form — this puts you at no disadvantage regarding admission or voting rights.",
      aNe: "त्यसले कसैलाई पनि बाहिर राख्नु हुँदैन। विद्यार्थी, अध्ययनरत व्यक्ति र आय नभएकाका लागि कार्यसमितिले शुल्क घटाउन वा छुट दिन सक्छ। फारममा 'छुट अनुरोध' मा चिन्ह लगाए पुग्छ — यसले सदस्यता स्वीकृति वा मताधिकारमा कुनै हानि गर्दैन।" },
    { cat: "mitglied", qDe: "Wie lange dauert es, bis ich Bescheid bekomme?", qEn: "How long until I hear back?",
      qNe: "जवाफ आउन कति समय लाग्छ?",
      aDe: "In der Regel innerhalb von zwei Wochen. Über die Aufnahme entscheidet der Vorstand (§ 5); die Mitgliedschaft beginnt mit diesem Beschluss. Sie erhalten eine Bestätigung mit Ihrer Mitgliedsnummer und den Zahlungsdaten per E-Mail.",
      aEn: "Usually within two weeks. The board decides on admission (§ 5); membership begins with that resolution. You receive a confirmation with your membership number and payment details by e-mail.",
      aNe: "प्रायः दुई हप्ताभित्र। सदस्यता स्वीकृतिको निर्णय कार्यसमितिले गर्छ (§ ५); सोही निर्णयसँगै सदस्यता सुरु हुन्छ। तपाईंले सदस्यता नम्बर र भुक्तानी विवरणसहितको पुष्टि इमेलबाट पाउनुहुन्छ।" },
    { cat: "mitglied", qDe: "Welche Rechte habe ich als Mitglied?", qEn: "What rights do I have as a member?",
      qNe: "सदस्यका रूपमा मेरा के अधिकार हुन्छन्?",
      aDe: "Stimmrecht in der Mitgliederversammlung, die über Vorstandswahlen, Haushalt, Beitragshöhe, Satzungsänderungen und die Auflösung entscheidet (§ 9). Sie können Anträge stellen — sie müssen eine Woche vor Versammlungsbeginn schriftlich beim Vorstand eingehen. Ein Fünftel aller Mitglieder kann außerdem eine außerordentliche Versammlung erzwingen.",
      aEn: "Voting rights in the general meeting, which decides on board elections, the budget, fee levels, amendments to the statutes and dissolution (§ 9). You may submit motions — they must reach the board in writing one week before the meeting begins. One fifth of all members can also compel an extraordinary meeting.",
      aNe: "साधारण सभामा मताधिकार, जसले कार्यसमितिको निर्वाचन, बजेट, शुल्कको दर, विधान संशोधन र विघटनबारे निर्णय गर्छ (§ ९)। तपाईं प्रस्ताव पेस गर्न सक्नुहुन्छ — ती सभा सुरु हुनुभन्दा एक हप्ता अगाडि लिखित रूपमा कार्यसमितिमा पुग्नुपर्छ। कुल सदस्यमध्ये एक-पाँचौँले विशेष सभा बोलाउन पनि बाध्य पार्न सक्छन्।" },
    { cat: "mitglied", qDe: "Kann ich Mitglied sein, wenn ich nicht in Deutschland lebe?", qEn: "Can I be a member if I do not live in Germany?",
      qNe: "म जर्मनीमा बस्दिनँ — के म सदस्य बन्न सक्छु?",
      aDe: "Ja. § 5 der Satzung stellt allein auf natürliche Personen ab, nicht auf den Wohnort. Beachten Sie nur, dass Einladungen und Abstimmungen in der Regel in Deutschland stattfinden; die Mitgliederversammlung wird jedoch auch per Videokonferenz zugeschaltet.",
      aEn: "Yes. § 5 of the statutes refers only to natural persons, not to place of residence. Please note that invitations and votes usually take place in Germany; the general meeting is, however, also available by video conference.",
      aNe: "बन्न सक्नुहुन्छ। विधानको § ५ ले प्राकृतिक व्यक्तिको मात्र कुरा गर्छ, बसोबासको ठाउँको होइन। तर निमन्त्रणा र मतदान प्रायः जर्मनीमै हुन्छ भन्ने ध्यान दिनुहोस्; साधारण सभा भने भिडियो बैठकमार्फत पनि सहभागी हुन सकिन्छ।" },

    { cat: "volunteer", qDe: "Ich kann nicht nach Nepal reisen — kann ich trotzdem helfen?", qEn: "I cannot travel to Nepal — can I still help?",
      qNe: "म नेपाल जान सक्दिनँ — के म पनि सहयोग गर्न सक्छु?",
      aDe: "Ja. Wählen Sie bei der Registrierung „Remote-Unterstützung“. Gebraucht werden Übersetzungen, Websites für Partnerorganisationen, Online-Nachhilfe, Grafikdesign, Fördermittelanträge und Lehrerfortbildung per Video.",
      aEn: "Yes. Choose 'remote support' when registering. We need translations, websites for partner organisations, online tutoring, graphic design, grant applications and teacher training by video.",
      aNe: "सक्नुहुन्छ। दर्ता गर्दा 'टाढैबाट सहयोग' छान्नुहोस्। हामीलाई अनुवाद, साझेदार संस्थाका वेबसाइट, अनलाइन ट्युसन, ग्राफिक डिजाइन, अनुदान आवेदन र भिडियोमार्फत शिक्षक तालिम चाहिन्छ।" },
    { cat: "volunteer", qDe: "Brauche ich Nepali-Kenntnisse?", qEn: "Do I need to speak Nepali?",
      qNe: "मैले नेपाली बोल्न जान्नैपर्छ?",
      aDe: "Nicht zwingend. Sämtliche Trainingsmaterialien liegen auf Nepali vor, und NPYS-N stellt bei Bedarf Übersetzung vor Ort. Nepali-Kenntnisse erleichtern den direkten Kontakt mit Schüler:innen und Gemeinden aber erheblich.",
      aEn: "Not necessarily. All training materials exist in Nepali and NPYS-N provides translation on site where needed. Nepali does, however, make direct contact with students and communities considerably easier.",
      aNe: "अनिवार्य होइन। सबै तालिम सामग्री नेपालीमा छन् र आवश्यक परे NPYS-N ले स्थलगत रूपमा अनुवाद गर्छ। तर नेपाली जान्नुभयो भने विद्यार्थी र समुदायसँग सिधै कुरा गर्न निकै सजिलो हुन्छ।" },
    { cat: "volunteer", qDe: "Wie läuft das Matching konkret ab?", qEn: "How exactly does matching work?",
      qNe: "मिलान प्रक्रिया ठ्याक्कै कसरी हुन्छ?",
      aDe: "Nach Ihrer Registrierung übermitteln wir die für das Matching nötigen Angaben an NPYS-N. Der Partner ordnet Sie einer Schule oder einem Projekt zu, das zu Berufsfeld, Qualifikation und Verfügbarkeit passt. Rund zwei Wochen vor dem Einsatz erhalten Sie ein Briefing zu Inhalten, Erwartungen, Material und Sicherheit.",
      aEn: "After your registration we transmit the details needed for matching to NPYS-N. The partner assigns you to a school or project fitting your field, qualification and availability. About two weeks before the assignment you receive a briefing on content, expectations, materials and safety.",
      aNe: "तपाईंको दर्तापछि हामी मिलानका लागि आवश्यक विवरण NPYS-N लाई पठाउँछौँ। साझेदारले तपाईंको क्षेत्र, योग्यता र उपलब्धतासँग मिल्ने विद्यालय वा परियोजनामा तपाईंलाई राख्छ। परिचालनभन्दा करिब दुई हप्ता अगाडि तपाईंले विषयवस्तु, अपेक्षा, सामग्री र सुरक्षाबारे ब्रिफिङ पाउनुहुन्छ।" },
    { cat: "volunteer", qDe: "Kann ich als Gruppe oder mit meiner Familie kommen?", qEn: "Can we come as a group or as a family?",
      qNe: "के हामी समूह वा परिवारका रूपमा आउन सक्छौँ?",
      aDe: "Ja, Gruppeneinsätze sind willkommen und für Schulen oft besonders wirkungsvoll. Melden Sie sich einzeln an und vermerken Sie die Gruppe im Feld „Motivation“, damit NPYS-N Sie gemeinsam einplanen kann.",
      aEn: "Yes, group deployments are welcome and are often particularly effective for schools. Register individually and note the group in the 'motivation' field so NPYS-N can plan you together.",
      aNe: "सक्नुहुन्छ, समूहगत परिचालन स्वागतयोग्य छ र विद्यालयका लागि प्रायः विशेष प्रभावकारी हुन्छ। छुट्टाछुट्टै दर्ता गर्नुहोस् र 'प्रेरणा' महलमा समूहबारे उल्लेख गर्नुहोस्, ताकि NPYS-N ले तपाईंहरूलाई सँगै योजनामा राख्न सकोस्।" },
    { cat: "volunteer", qDe: "Welche Berufe werden derzeit am dringendsten gebraucht?", qEn: "Which professions are most urgently needed right now?",
      qNe: "अहिले कुन पेसाको सबैभन्दा बढी खाँचो छ?",
      aDe: "Für die Erste-Hilfe-Kampagne: Sanitäter:innen, Ärzt:innen, Pflegekräfte und zertifizierte Erste-Hilfe-Trainer:innen. Darüber hinaus melden die Partnerschulen besonderen Bedarf bei Lehrkräften für Englisch, Mathematik und Naturwissenschaften sowie bei IT-Fachleuten für Computer-Grundkenntnisse.",
      aEn: "For the First Aid Campaign: paramedics, doctors, nurses and certified first aid trainers. Beyond that, partner schools report particular need for teachers of English, mathematics and science, and for IT specialists to teach basic computer skills.",
      aNe: "प्राथमिक उपचार अभियानका लागि: स्वास्थ्यकर्मी, चिकित्सक, नर्स र प्रमाणित प्राथमिक उपचार प्रशिक्षक। त्यसबाहेक साझेदार विद्यालयहरूले अङ्ग्रेजी, गणित र विज्ञान शिक्षक तथा आधारभूत कम्प्युटर सीप सिकाउने आईटी विशेषज्ञको विशेष खाँचो रहेको बताउँछन्।" },

    { cat: "spenden", qDe: "Löst das Spendenformular eine Zahlung aus?", qEn: "Does the donation form trigger a payment?",
      qNe: "के दान फारमले भुक्तानी गर्छ?",
      aDe: "Nein. Sie erhalten anschließend unsere Bankverbindung mit einem persönlichen Verwendungszweck, damit wir Ihre Spende eindeutig zuordnen können. Die Überweisung nehmen Sie selbst über Ihre Bank vor.",
      aEn: "No. You then receive our bank details with a personal payment reference so we can allocate your donation unambiguously. You make the transfer yourself through your bank.",
      aNe: "गर्दैन। त्यसपछि तपाईंले व्यक्तिगत भुक्तानी सन्दर्भसहित हाम्रो बैङ्क विवरण पाउनुहुन्छ, ताकि हामीले तपाईंको दान स्पष्ट रूपमा छुट्याउन सकौँ। रकम तपाईं आफैँले आफ्नो बैङ्कबाट पठाउनुहुन्छ।" },
    { cat: "spenden", qDe: "Kann ich regelmäßig statt einmalig spenden?", qEn: "Can I give regularly instead of once?",
      qNe: "के म एकपटकको सट्टा नियमित दान गर्न सक्छु?",
      aDe: "Ja — wählen Sie im Formular monatlich oder jährlich und richten Sie bei Ihrer Bank einen Dauerauftrag ein. Regelmäßige Spenden sind für die Planung der Kampagne besonders wertvoll, weil sie Materialbestellungen im Voraus ermöglichen.",
      aEn: "Yes — choose monthly or annually in the form and set up a standing order with your bank. Regular donations are especially valuable for planning the campaign because they allow materials to be ordered in advance.",
      aNe: "सक्नुहुन्छ — फारममा मासिक वा वार्षिक छान्नुहोस् र आफ्नो बैङ्कमा स्थायी आदेश राख्नुहोस्। नियमित दान अभियानको योजनाका लागि विशेष मूल्यवान् हुन्छ, किनभने त्यसले सामग्री पहिल्यै अर्डर गर्न सम्भव बनाउँछ।" },
    { cat: "spenden", qDe: "Kann ich Sachspenden statt Geld geben?", qEn: "Can I give goods instead of money?",
      qNe: "के म रकमको सट्टा सामान दिन सक्छु?",
      aDe: "Ja. § 3(i) der Satzung nennt ausdrücklich Beschaffung, Transport und Verteilung von Hilfs- und Unterrichtsmaterialien, Hygienekits und medizinischen Sachspenden. Bitte fragen Sie vorab an, damit wir Transport und Bedarf mit NPYS-N abstimmen können.",
      aEn: "Yes. § 3(i) of the statutes expressly mentions procuring, transporting and distributing aid and teaching materials, hygiene kits and medical in-kind donations. Please ask in advance so we can coordinate transport and need with NPYS-N.",
      aNe: "सक्नुहुन्छ। विधानको § ३(झ) ले राहत तथा शैक्षिक सामग्री, सरसफाइ किट र स्वास्थ्यसम्बन्धी वस्तुगत सहयोगको खरिद, ढुवानी र वितरण स्पष्ट रूपमा उल्लेख गर्छ। कृपया पहिल्यै सोध्नुहोस्, ताकि हामी NPYS-N सँग ढुवानी र आवश्यकताको समन्वय गर्न सकौँ।" },
    { cat: "spenden", qDe: "Wie viel meiner Spende kommt tatsächlich an?", qEn: "How much of my donation actually arrives?",
      qNe: "मेरो दानको कति हिस्सा साँच्चै पुग्छ?",
      aDe: "Der Verein ist selbstlos tätig; Mittel dürfen nur für satzungsmäßige Zwecke verwendet werden, und Mitglieder erhalten keine Zuwendungen (§ 4). Verwaltungskosten wie Porto, Kontoführung und Software machen derzeit rund vier Prozent aus, der Rest fließt in Material, Trainingsunterlagen und Transport zu abgelegenen Schulen.",
      aEn: "The association acts selflessly; funds may only be used for statutory purposes and members receive no allocations (§ 4). Administrative costs such as postage, banking and software currently account for around four per cent; the rest goes into materials, training documents and transport to remote schools.",
      aNe: "संस्थाले निःस्वार्थ रूपमा काम गर्छ; रकम विधानसम्मत उद्देश्यमा मात्र प्रयोग गर्न पाइन्छ र सदस्यहरूले कुनै रकम पाउँदैनन् (§ ४)। हुलाक, बैङ्क र सफ्टवेयरजस्ता प्रशासनिक खर्च हाल करिब चार प्रतिशत छ; बाँकी सबै सामग्री, तालिम कागजात र दुर्गम विद्यालयसम्मको ढुवानीमा जान्छ।" },

    { cat: "programme", qDe: "Was genau lernen die Schüler:innen im Erste-Hilfe-Kurs?", qEn: "What exactly do students learn in the first aid course?",
      qNe: "प्राथमिक उपचार कक्षामा विद्यार्थीले ठ्याक्कै के सिक्छन्?",
      aDe: "Grundversorgung von Wunden und Verbandstechniken, CPR für Erwachsene und Kinder, Reaktion auf Ersticken und Atemwegssicherung, Verbrennungen, Frakturen und Notfallstabilisierung, Verhalten bei Erdbeben und Überschwemmungen sowie psychologische Erste Hilfe — Beruhigung und Krisenunterstützung.",
      aEn: "Basic wound care and bandaging, CPR for adults and children, choking response and airway management, burns, fractures and emergency stabilisation, behaviour during earthquakes and floods, plus psychological first aid — calming and crisis support.",
      aNe: "आधारभूत घाउ हेरचाह र पट्टी बाँध्ने तरिका, वयस्क र बालबालिकाका लागि CPR, घाँटीमा अड्किएको अवस्था र श्वासनली व्यवस्थापन, पोलेको, हाड भाँचिएको र आपत्कालीन स्थिरीकरण, भूकम्प र बाढीका बेला कसरी व्यवहार गर्ने, साथै मनोवैज्ञानिक प्राथमिक उपचार — शान्त पार्ने र सङ्कटमा साथ दिने।" },
    { cat: "programme", qDe: "Was erhält eine teilnehmende Schule?", qEn: "What does a participating school receive?",
      qNe: "सहभागी विद्यालयले के पाउँछ?",
      aDe: "Ein zertifiziertes Erste-Hilfe-Kit, Trainingsmaterialien und Handbücher auf Nepali, mindestens eine ausgebildete Lehrkraft als dauerhafte:n Schultrainer:in, einen jährlichen Auffrischungsbesuch durch NPYS-N und das offizielle Schulzertifikat „Erste-Hilfe-Schule“.",
      aEn: "A certified First Aid kit, training materials and manuals in Nepali, at least one trained teacher as permanent school trainer, an annual refresher visit by NPYS-N, and the official school certificate 'First Aid School'.",
      aNe: "प्रमाणित प्राथमिक उपचार किट, नेपाली भाषामा तालिम सामग्री र पुस्तिका, विद्यालयको स्थायी प्रशिक्षकका रूपमा कम्तीमा एक तालिमप्राप्त शिक्षक, NPYS-N को वार्षिक पुनर्ताजगी भ्रमण, र 'प्राथमिक उपचार विद्यालय' को आधिकारिक प्रमाणपत्र।" },
    { cat: "programme", qDe: "Wie werden die Schulen ausgewählt?", qEn: "How are schools selected?",
      qNe: "विद्यालय कसरी छानिन्छन्?",
      aDe: "Die Auswahl trifft NPYS-N als Partner vor Ort — nach Erreichbarkeit für Volunteer-Teams, der Bereitschaft der Schulleitung, eine Lehrkraft dauerhaft als Trainer:in freizustellen, und dem Anteil von Schüler:innen aus benachteiligten Familien. Vorschläge aus der Diaspora sind ausdrücklich willkommen.",
      aEn: "NPYS-N, as partner on the ground, makes the selection — by accessibility for volunteer teams, the school management's willingness to permanently release a teacher as trainer, and the share of students from disadvantaged families. Suggestions from the diaspora are expressly welcome.",
      aNe: "नेपालमा रहेको साझेदारका रूपमा NPYS-N ले छनोट गर्छ — स्वयंसेवक टोलीका लागि पहुँच, एक शिक्षकलाई स्थायी प्रशिक्षकका रूपमा दिन विद्यालय व्यवस्थापन तयार हुनु, र विपन्न परिवारका विद्यार्थीको अनुपातका आधारमा। प्रवासी समुदायका सुझाव स्पष्ट रूपमा स्वागतयोग्य छन्।" },
    { cat: "programme", qDe: "Gibt es auch Gesundheitscamps für die ganze Gemeinde?", qEn: "Are there health camps for the whole community?",
      qNe: "के सिंगो समुदायका लागि स्वास्थ्य शिविर हुन्छन्?",
      aDe: "Ja, wenn medizinische Volunteers verfügbar sind. § 3(e) der Satzung sieht kostenfreie Gesundheitscamps sowie Aufklärungs- und Präventionsmaßnahmen in ländlichen Regionen Nepals vor, ergänzt um Unterstützung bedürftiger Personen beim Zugang zu medizinischer Versorgung.",
      aEn: "Yes, when medical volunteers are available. § 3(e) of the statutes provides for free health camps plus awareness and prevention measures in rural regions of Nepal, complemented by support for people in need in accessing medical care.",
      aNe: "हुन्छन्, स्वास्थ्यकर्मी स्वयंसेवक उपलब्ध भएका बेला। विधानको § ३(ङ) ले नेपालका ग्रामीण क्षेत्रमा निःशुल्क स्वास्थ्य शिविर तथा जनचेतना र रोकथामका कार्यक्रमको व्यवस्था गर्छ, साथै खाँचोमा परेका व्यक्तिलाई उपचारमा पहुँच पुर्‍याउन सहयोग गर्छ।" },
    { cat: "programme", qDe: "Warum finanziert One Euro for Nation die Erste-Hilfe-Kampagne?", qEn: "Why does One Euro for Nation finance the First Aid Campaign?",
      qNe: "One Euro for Nation ले किन प्राथमिक उपचार अभियानमा खर्च जुटाउँछ?",
      aDe: "Weil die drei Programme ineinandergreifen: Programm 3 sammelt die Mittel, Programm 2 setzt sie in Kits, Handbücher und Hygienekits um, und Programm 1 liefert die Menschen, die schulen. So trägt sich das System selbst, ohne von einzelnen Großspenden abzuhängen.",
      aEn: "Because the three programmes interlock: programme 3 raises the funds, programme 2 turns them into kits, manuals and hygiene kits, and programme 1 supplies the people who train. This makes the system self-supporting without depending on individual large donations.",
      aNe: "किनभने तीनै कार्यक्रम एकआपसमा जोडिएका छन्: कार्यक्रम ३ ले रकम जुटाउँछ, कार्यक्रम २ ले त्यसलाई किट, पुस्तिका र सरसफाइ किटमा बदल्छ, र कार्यक्रम १ ले तालिम दिने जनशक्ति उपलब्ध गराउँछ। यसले ठूला व्यक्तिगत दानमा भर नपरी प्रणाली आफैँ टिक्ने बनाउँछ।" },

    { cat: "verein", qDe: "Kann ich in meiner Stadt eine Zweigstelle gründen?", qEn: "Can I start a branch in my city?",
      qNe: "के म आफ्नो सहरमा शाखा खोल्न सक्छु?",
      aDe: "Ja, § 11 der Satzung erlaubt Zweigstellen im gesamten Bundesgebiet; über Errichtung und Auflösung entscheidet der Vorstand. Zweigstellen haben keine eigene Rechtspersönlichkeit und führen keine eigenen Kassen — die Finanzverwaltung bleibt zentral beim Hauptverein.",
      aEn: "Yes, § 11 of the statutes allows branches throughout Germany; the board decides on establishment and dissolution. Branches have no separate legal personality and keep no separate accounts — financial administration remains centrally with the main association.",
      aNe: "सक्नुहुन्छ, विधानको § ११ ले जर्मनीभर शाखा खोल्न अनुमति दिन्छ; स्थापना र विघटनको निर्णय कार्यसमितिले गर्छ। शाखाको छुट्टै कानुनी हैसियत हुँदैन र तिनले छुट्टै कोष राख्दैनन् — आर्थिक व्यवस्थापन केन्द्रीय रूपमा मुख्य संस्थामै रहन्छ।" },
    { cat: "verein", qDe: "Wer kontrolliert die Finanzen?", qEn: "Who checks the finances?",
      qNe: "आर्थिक कारोबार कसले जाँच्छ?",
      aDe: "Die Schatzmeisterei legt dem Vorstand bis zum 1. März den Rechnungsabschluss vor. Zwei von der Mitgliederversammlung gewählte Kassenprüfer:innen — die dem Vorstand nicht angehören dürfen — prüfen die Kasse jährlich und berichten schriftlich. Über das Vereinskonto verfügen Schatzmeister:in und Vorsitz nur gemeinsam.",
      aEn: "The treasurer presents the annual accounts to the board by 1 March. Two auditors elected by the general meeting — who may not belong to the board — audit the accounts annually and report in writing. The treasurer and chair may only dispose of the association account jointly.",
      aNe: "कोषाध्यक्षले वार्षिक हिसाब १ मार्चभित्र कार्यसमितिसमक्ष पेस गर्छन्। साधारण सभाले चुनेका दुई लेखापरीक्षक — जो कार्यसमितिका सदस्य हुन पाउँदैनन् — ले वार्षिक रूपमा हिसाब जाँची लिखित प्रतिवेदन दिन्छन्। संस्थाको खाता कोषाध्यक्ष र अध्यक्षले संयुक्त रूपमा मात्र सञ्चालन गर्न सक्छन्।" },
    { cat: "verein", qDe: "Ist der Verein politisch oder religiös gebunden?", qEn: "Is the association politically or religiously affiliated?",
      qNe: "के संस्था कुनै राजनीतिक वा धार्मिक पक्षसँग आबद्ध छ?",
      aDe: "Nein. Der Verein verfolgt ausschließlich und unmittelbar gemeinnützige und mildtätige Zwecke nach §§ 52, 53 AO und ist selbstlos tätig. Die Förderung des Ehrenamts gilt ausdrücklich dem Ehrenamt als solchem — unabhängig von Interessen des eigenen Vereins.",
      aEn: "No. The association exclusively and directly pursues charitable and benevolent purposes under §§ 52, 53 AO and acts selflessly. Support for volunteering expressly applies to volunteering as such — independent of the association's own interests.",
      aNe: "छैन। संस्थाले AO का §§ ५२, ५३ अनुसार परोपकारी तथा जनहितकारी उद्देश्य मात्र पूर्ण र प्रत्यक्ष रूपमा पछ्याउँछ र निःस्वार्थ रूपमा काम गर्छ। स्वयंसेवाप्रतिको सहयोग स्वयंसेवा आफैँका लागि हो — संस्थाको आफ्नै स्वार्थसँग नजोडिई।" },
    { cat: "verein", qDe: "Was passiert, wenn der Verein aufgelöst wird?", qEn: "What happens if the association is dissolved?",
      qNe: "संस्था विघटन भएमा के हुन्छ?",
      aDe: "Die Auflösung erfordert eine Dreiviertelmehrheit in der Mitgliederversammlung. Das Vermögen fällt anschließend an eine juristische Person des öffentlichen Rechts oder eine andere steuerbegünstigte Körperschaft — zweckgebunden für Entwicklungszusammenarbeit oder Völkerverständigung (§ 13).",
      aEn: "Dissolution requires a three-quarters majority in the general meeting. The assets then pass to a legal entity under public law or another tax-privileged corporation — earmarked for development cooperation or international understanding (§ 13).",
      aNe: "विघटनका लागि साधारण सभामा तीन-चौथाइ बहुमत चाहिन्छ। त्यसपछि सम्पत्ति सार्वजनिक कानुनअन्तर्गतको कानुनी निकाय वा अर्को करछुटप्राप्त संस्थामा जान्छ — विकास सहकार्य वा अन्तर्राष्ट्रिय समझदारीका लागि तोकिएर (§ १३)।" }
  ];

  /* -------------------------------------------------------------- Gallery */
  var GALLERY = [
    { tag: "dashain kultur ehrung", src: "assets/media/dashain-2024/trophy-and-medals.jpg", width: 1920, height: 1280,
      de: "Pokal und Medaillen vor Beginn der Feier", en: "Trophy and medals before the celebration begins", ne: "उत्सव सुरु हुनुअघि कप र पदक",
      nDe: "Pokal und Medaillen, bereitgelegt vor dem Beginn des Programms. Geehrt werden bei der Dashain-Feier diejenigen, die im zurückliegenden Jahr Zeit für den Verein aufgewendet haben.",
      nEn: "The trophy and medals, laid out before the programme began. The Dashain celebration honours those who have given their time to the association over the past year.", nNe: "कार्यक्रम सुरु हुनुअघि सजाइएका कप र पदक। दसैँ उत्सवमा गत वर्षभर संस्थालाई समय दिनेहरूलाई सम्मान गरिन्छ।" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/welcome-team.jpg", width: 1920, height: 1280,
      de: "Das Empfangsteam bereitet die Anmeldung vor", en: "The welcome team prepares registration", ne: "स्वागत टोलीले दर्ताको तयारी गर्दै",
      nDe: "Das Empfangsteam richtet den Anmeldetisch ein. Der Empfang ist der erste Eindruck, den ein Gast von einem Verein bekommt — entsprechend früh wird er aufgebaut.",
      nEn: "The welcome team setting up the registration desk. Reception is the first impression a guest gets of an association — which is why it is built up well before the doors open.", nNe: "स्वागत टोलीले दर्ता डेस्क तयार गर्दै। पाहुनाले संस्थाबारे पाउने पहिलो छाप स्वागत नै हो — त्यसैले ढोका खुल्नुभन्दा धेरै अगाडि यो तयार पारिन्छ।" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/guest-contribution.jpg", width: 1920, height: 1280,
      de: "Grußwort eines Gastes am Mikrofon", en: "A guest's address at the microphone", ne: "माइकमा एक पाहुनाको मन्तव्य",
      nDe: "Ein Grußwort aus dem Kreis der Gäste — keine Eröffnungsrede des Vorstands, sondern ein Beitrag von jemandem, der eingeladen war. Bei den Feiern der NPJOE steht das Mikrofon bewusst auch den Gästen offen.",
      nEn: "An address from among the guests — not an opening speech by the board, but a contribution from someone who had been invited. At NPJOE celebrations the microphone is deliberately open to guests as well.", nNe: "पाहुनामध्येबाटै आएको मन्तव्य — कार्यसमितिको उद्घाटन भाषण होइन, निम्तो पाएका कसैको प्रस्तुति। NPJOE का उत्सवमा माइक जानाजान पाहुनाका लागि पनि खुला हुन्छ।" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/event-team.jpg", width: 1920, height: 1280,
      de: "Mitglieder des Veranstaltungsteams", en: "Members of the event team", ne: "कार्यक्रम टोलीका सदस्य",
      nDe: "Mitglieder des Veranstaltungsteams. Jede Feier der NPJOE wird von einem wechselnden Team getragen, damit die Arbeit nicht immer an denselben Personen hängen bleibt.",
      nEn: "Members of the event team. Every NPJOE celebration is carried by a changing team, so that the work does not always fall to the same people.", nNe: "कार्यक्रम टोलीका सदस्य। NPJOE को हरेक उत्सव फेरिँदै जाने टोलीले धान्छ, ताकि काम सधैँ उही मान्छेमाथि नपरोस्।" },
    { tag: "dashain kultur deko", src: "assets/media/dashain-2024/dashain-banner.jpg", width: 1920, height: 1280,
      de: "Festbanner der NPJOE zur Dashain-Feier", en: "NPJOE celebration banner for Dashain", ne: "दसैँका लागि NPJOE को उत्सव ब्यानर",
      nDe: "Das Festbanner des Vereins. Es benennt Anlass, Datum und Veranstalter — und wird bei jeder Feier wiederverwendet.",
      nEn: "The association's celebration banner. It names the occasion, the date and the host — and is reused at every celebration.", nNe: "संस्थाको उत्सव ब्यानर। यसमा अवसर, मिति र आयोजक लेखिएको हुन्छ — र हरेक उत्सवमा पुनः प्रयोग हुन्छ।" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/guest-speech.jpg", width: 1920, height: 1280,
      de: "Ein Beitrag aus dem Kreis der Gäste", en: "A contribution from one of the guests", ne: "पाहुनामध्ये एक जनाको प्रस्तुति",
      nDe: "Ein Beitrag aus dem Kreis der Gäste. Das Mikrofon steht bei den Feiern bewusst nicht nur dem Vorstand offen.",
      nEn: "A contribution from one of the guests. At these celebrations the microphone is deliberately not reserved for the board.", nNe: "पाहुनामध्ये एक जनाको प्रस्तुति। यी उत्सवमा माइक जानाजान कार्यसमितिका लागि मात्र छुट्याइँदैन।" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/community-meal.jpg", width: 1920, height: 1280,
      de: "Begegnung und Gespräche beim gemeinsamen Essen", en: "Connection and conversation over a shared meal", ne: "सामूहिक भोजमा अपनत्व र कुराकानी",
      nDe: "Das gemeinsame Essen ist bei Dashain kein Beiwerk, sondern der eigentliche Anlass: Familien und Freunde kommen zusammen, essen miteinander und holen nach, was im Alltag zu kurz kommt.",
      nEn: "At Dashain the shared meal is not an extra but the actual occasion: families and friends come together, eat with one another and catch up on what everyday life leaves no room for.", nNe: "दसैँमा सामूहिक भोज थपिएको कुरा होइन, मूल अवसर नै हो: परिवार र साथीभाइ जुट्छन्, सँगै खान्छन् र दैनिक जीवनमा भन्न नभ्याएका कुरा गर्छन्।" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/welcome-address.jpg", width: 1920, height: 1280,
      de: "Ansprache des Moderationsteams", en: "Address by the hosting team", ne: "सञ्चालन टोलीको मन्तव्य",
      nDe: "Das Moderationsteam führt durch den Abend — zweisprachig, damit auch Gäste ohne Nepali-Kenntnisse dem Programm folgen können.",
      nEn: "The hosting team guides the evening — bilingually, so that guests with no Nepali can follow the programme too.", nNe: "सञ्चालन टोलीले साँझ डोर्‍याउँछ — दुई भाषामा, ताकि नेपाली नबुझ्ने पाहुनाले पनि कार्यक्रम पछ्याउन सकून्।" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/guest-registration.jpg", width: 1920, height: 1280,
      de: "Gäste tragen sich am Empfang ein", en: "Guests sign in at reception", ne: "पाहुनाहरू स्वागत डेस्कमा नाम लेख्दै",
      nDe: "Gäste tragen sich am Empfang ein. Die Feier stand Mitgliedern ebenso offen wie Freundinnen, Freunden und Nachbarn aus Darmstadt und Umgebung.",
      nEn: "Guests signing in at reception. The celebration was open to members as much as to friends and neighbours from Darmstadt and the surrounding area.", nNe: "पाहुनाहरू स्वागत डेस्कमा नाम लेख्दै। उत्सव सदस्यका लागि जति खुला थियो, डार्मस्टाट र वरपरका साथीभाइ तथा छिमेकीका लागि पनि उत्तिकै।" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/friends-at-meal.jpg", width: 1920, height: 1280,
      de: "Freund:innen und Mitglieder beim Festessen", en: "Friends and members enjoying the festival meal", ne: "साथीभाइ र सदस्यहरू उत्सव भोजमा",
      nDe: "Freundinnen, Freunde und Mitglieder am Tisch. Für viele junge Nepalesinnen und Nepalesen in Deutschland ist so ein Abend der Ersatz für das Familienfest, das zu Hause stattfindet.",
      nEn: "Friends and members at the table. For many young Nepalis in Germany an evening like this stands in for the family celebration taking place back home.", nNe: "टेबलमा साथीभाइ र सदस्यहरू। जर्मनीमा रहेका धेरै युवा नेपालीका लागि यस्तो साँझले घरमा भइरहेको पारिवारिक उत्सवको ठाउँ लिन्छ।" },
    { tag: "dashain kultur buehne", src: "assets/media/dashain-2024/stage-programme.jpg", width: 1920, height: 1280,
      de: "Das Bühnenprogramm der Dashain-Feier", en: "The Dashain celebration stage programme", ne: "दसैँ उत्सवको मञ्चीय कार्यक्रम",
      nDe: "Das Bühnenprogramm mischt Ansprachen, Musik- und Tanzbeiträge. Die Auftretenden sind Mitglieder und Gäste, keine gebuchten Ensembles.",
      nEn: "The stage programme mixes addresses with music and dance contributions. Those performing are members and guests, not booked ensembles.", nNe: "मञ्चीय कार्यक्रममा मन्तव्यसँगै सङ्गीत र नृत्य प्रस्तुति मिसिन्छन्। प्रस्तुत गर्नेहरू सदस्य र पाहुना हुन्, भाडामा ल्याइएका कलाकार होइनन्।" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/sel-roti-moment.jpg", width: 1920, height: 1280,
      de: "Gemeinsamer Moment am Buffet mit Sel Roti", en: "A shared moment at the buffet with sel roti", ne: "सेलरोटीसहितको बुफेमा सामूहिक क्षण",
      nDe: "Sel Roti am Buffet — ein süßes, ringförmiges Reisgebäck, das in Nepal zu Dashain und Tihar in fast jedem Haushalt gebacken wird.",
      nEn: "Sel roti at the buffet — a sweet, ring-shaped rice bread baked in almost every Nepali household for Dashain and Tihar.", nNe: "बुफेमा सेलरोटी — दसैँ र तिहारमा झन्डै हरेक नेपाली घरमा पकाइने गुलियो, गोलाकार चामलको रोटी।" },
    { tag: "dashain kultur ehrung buehne", src: "assets/media/dashain-2024/honour-presentation.jpg", width: 1920, height: 1280,
      de: "Ehrung im Rahmen des Festprogramms", en: "A presentation during the festival programme", ne: "उत्सव कार्यक्रममा सम्मान प्रदान",
      nDe: "Eine Ehrung im Festprogramm. Der Verein arbeitet ausschließlich ehrenamtlich — die Anerkennung auf der Bühne ist die Währung, in der er bezahlt.",
      nEn: "A presentation during the festival programme. The association runs entirely on volunteers — recognition on stage is the currency in which it pays.", nNe: "उत्सव कार्यक्रममा सम्मान प्रदान। संस्था पूर्ण रूपमा स्वयंसेवकमै चल्छ — मञ्चको सम्मान नै यसले दिने पारिश्रमिक हो।" },
    { tag: "dashain kultur empfang", src: "assets/media/dashain-2024/evening-welcome-desk.jpg", width: 1920, height: 1283,
      de: "Anmeldung und Organisation am Empfangstisch", en: "Registration and organisation at the welcome desk", ne: "स्वागत डेस्कमा दर्ता र व्यवस्थापन",
      nDe: "Am Empfangstisch laufen Anmeldung, Fragen und Organisation zusammen. Er bleibt den ganzen Abend besetzt, auch während des Programms.",
      nEn: "Registration, questions and organisation all come together at the welcome desk. It stays staffed all evening, including during the programme.", nNe: "दर्ता, जिज्ञासा र व्यवस्थापन सबै स्वागत डेस्कमै जुट्छन्। कार्यक्रम चलिरहेका बेला पनि यो साँझभरि सञ्चालित रहन्छ।" },
    { tag: "dashain kultur gemeinschaft essen", src: "assets/media/dashain-2024/festival-food.jpg", width: 1920, height: 1280,
      de: "Nepalesische Speisen und Sel Roti für die Gäste", en: "Nepali food and sel roti for the guests", ne: "पाहुनाका लागि नेपाली खाना र सेलरोटी",
      nDe: "Nepalesische Speisen für die Gäste. Gekocht wird von Mitgliedern selbst — das hält den Abend bezahlbar und schmeckt näher an zu Hause als jede Catering-Lösung.",
      nEn: "Nepali food for the guests. Members do the cooking themselves — which keeps the evening affordable and tastes closer to home than any catering could.", nNe: "पाहुनाका लागि नेपाली खाना। सदस्यहरू आफैँ पकाउँछन् — यसले साँझलाई किफायती बनाउँछ र कुनै क्याटरिङभन्दा घरकै स्वाद दिन्छ।" },
    { tag: "dashain kultur ehrung buehne", src: "assets/media/dashain-2024/trophy-presentation.jpg", width: 1920, height: 1280,
      de: "Übergabe des Pokals zum Abschluss des Programmpunkts", en: "Trophy presentation concluding a programme segment", ne: "कार्यक्रमको एक खण्ड टुङ्ग्याउँदै कप वितरण",
      nDe: "Die Übergabe des Pokals beschließt den Ehrungsteil des Programms — der Moment, auf den die Aufstellung aus dem ersten Bild hinauslief.",
      nEn: "The trophy presentation closes the honours section of the programme — the moment the arrangement in the first photograph was leading up to.", nNe: "कप वितरणले कार्यक्रमको सम्मान खण्ड टुङ्ग्याउँछ — पहिलो तस्बिरको तयारी यही क्षणका लागि थियो।" }
  ];

  /* ------------------------------- Naya Barsha 2026 — Neujahrsfeier album */
  /* The Nepali New Year celebration of 10 April 2026 in the Knabenschule,
     Darmstadt. `width`/`height` are the real pixel sizes: the renderer reads
     them to decide which frames get a wide tile, and the browser reads them
     to reserve the right box before the file has loaded. */
  var NAYA_BARSHA = [
    { tag: "neujahr buehne musik", src: "assets/media/naya-barsha-2026/live-concert.jpg", width: 1600, height: 1200,
      de: "Livekonzert mit traditionellen und modernen nepalesischen Liedern",
      en: "Live concert with traditional and modern Nepali songs", ne: "परम्परागत र आधुनिक नेपाली गीतसहितको लाइभ कन्सर्ट",
      nDe: "Das Konzert war der musikalische Kern des Abends: traditionelle Lieder, wie sie in Nepal zum Neujahr gehören, neben modernen nepalesischen Stücken. Vor der Bühne blieb bald kaum jemand mehr sitzen.",
      nEn: "The concert was the musical heart of the evening: traditional songs of the kind that belong to New Year in Nepal, alongside modern Nepali material. Before long, almost nobody in front of the stage was still sitting down.", nNe: "कन्सर्ट साँझको सङ्गीतमय केन्द्र थियो: नेपालमा नयाँ वर्षमा गाइने खालका परम्परागत गीतसँगै आधुनिक नेपाली गीत। केही बेरमै मञ्चअगाडि झन्डै कोही पनि बसिरहेको थिएन।" },
    { tag: "neujahr empfang", src: "assets/media/naya-barsha-2026/arriving-guests.jpg", width: 1600, height: 1069,
      de: "Ankommende Gäste am Eingang der Knabenschule Darmstadt",
      en: "Arriving guests at the entrance of the Knabenschule in Darmstadt", ne: "डार्मस्टाटको क्नाबेनशुलेको प्रवेशद्वारमा आइपुग्दै गरेका पाहुना",
      nDe: "Gäste treffen am Eingang der Knabenschule ein. Zum Naya Barsha kleidet man sich festlich, und man kommt als Familie — Großeltern, Eltern und Kinder zusammen.",
      nEn: "Guests arriving at the entrance of the Knabenschule. People dress up for Naya Barsha, and they come as a family — grandparents, parents and children together.", nNe: "क्नाबेनशुलेको प्रवेशद्वारमा आइपुग्दै गरेका पाहुना। नयाँ वर्षमा मानिसहरू सजिएर आउँछन्, र परिवारै आउँछन् — हजुरबा-हजुरआमा, आमाबुबा र बालबालिका सँगै।" },
    { tag: "neujahr empfang", src: "assets/media/naya-barsha-2026/guest-registration.jpg", width: 1600, height: 1069,
      de: "Gäste tragen sich am Anmeldetisch in die Teilnehmerliste ein",
      en: "Guests sign the attendance list at the registration desk", ne: "दर्ता डेस्कमा पाहुनाहरू उपस्थिति पुस्तिकामा हस्ताक्षर गर्दै",
      nDe: "Am Anmeldetisch trugen sich die Besucherinnen und Besucher in die Teilnehmerliste ein. So lässt sich später belegen, wie viele Menschen eine Veranstaltung tatsächlich erreicht hat.",
      nEn: "Visitors signed the attendance list at the registration desk. That is what makes it possible to show afterwards how many people an event actually reached.", nNe: "दर्ता डेस्कमा सहभागीहरूले उपस्थिति पुस्तिकामा हस्ताक्षर गरे। यसैले गर्दा कुनै कार्यक्रम कति जनासम्म पुग्यो भन्ने पछि देखाउन सकिन्छ।" },
    { tag: "neujahr gemeinschaft", src: "assets/media/naya-barsha-2026/guests-at-table.jpg", width: 1600, height: 1069,
      de: "Gäste und Familien an den Tischen im Saal",
      en: "Guests and families at the tables in the hall", ne: "हलका टेबलमा पाहुना र परिवारहरू",
      nDe: "Der Saal war durchgehend bestuhlt, damit auch ältere Gäste und Familien mit kleinen Kindern den ganzen Abend bleiben konnten. Gegessen wurde an den Tischen, während auf der Bühne das Programm weiterlief.",
      nEn: "The hall was seated throughout so that older guests and families with small children could stay for the whole evening. People ate at their tables while the programme carried on on stage.", nNe: "हलभरि बस्ने व्यवस्था थियो, ताकि वृद्ध पाहुना र साना बालबालिका भएका परिवारले पूरै साँझ रहन सकून्। मञ्चमा कार्यक्रम चलिरहँदा मानिसहरूले आ-आफ्नै टेबलमा खाए।" },
    { tag: "neujahr gemeinschaft musik", src: "assets/media/naya-barsha-2026/members-at-concert.jpg", width: 1200, height: 1600,
      de: "Mitglieder vor der Bühne während des Livekonzerts",
      en: "Members in front of the stage during the live concert", ne: "लाइभ कन्सर्टका बेला मञ्चअगाडि सदस्यहरू",
      nDe: "Mitglieder direkt an der Bühne. Die NPJOE ist eine Jugendorganisation, und das war dem Publikum an diesem Abend deutlich anzusehen.",
      nEn: "Members right at the stage. The NPJOE is a youth organisation, and it showed in the audience that evening.", nNe: "मञ्चकै छेउमा सदस्यहरू। NPJOE युवा संगठन हो, र त्यो साँझ दर्शकदीर्घामै देखिन्थ्यो।" },
    { tag: "neujahr buehne musik", src: "assets/media/naya-barsha-2026/band-with-team.jpg", width: 1600, height: 1200,
      de: "Band und Veranstaltungsteam nach dem Konzert auf der Bühne",
      en: "Band and event team on stage after the concert", ne: "कन्सर्टपछि मञ्चमा ब्यान्ड र कार्यक्रम टोली",
      nDe: "Band und Veranstaltungsteam nach dem letzten Stück. Musik und Organisation kamen an diesem Abend aus derselben Gemeinschaft.",
      nEn: "The band and the event team after the final number. The music and the organisation came from the same community that evening.", nNe: "अन्तिम प्रस्तुतिपछि ब्यान्ड र कार्यक्रम टोली। त्यो साँझ सङ्गीत र व्यवस्थापन दुवै एउटै समुदायबाट आएका थिए।" },
    { tag: "neujahr team buehne", src: "assets/media/naya-barsha-2026/organising-team.jpg", width: 1600, height: 900,
      de: "Das Organisationsteam der Neujahrsfeier auf der Bühne",
      en: "The organising team of the New Year celebration on stage", ne: "मञ्चमा नयाँ वर्ष उत्सवको आयोजक टोली",
      nDe: "Das Organisationsteam auf der Bühne. Saal, Technik, Küche, Einlass und Abbau liegen bei ehrenamtlichen Mitgliedern — ein Abend dieser Größe ist mehrere Wochen Vorbereitung.",
      nEn: "The organising team on stage. The hall, the technology, the kitchen, admissions and the get-out are all in the hands of volunteer members — an evening of this size means several weeks of preparation.", nNe: "मञ्चमा आयोजक टोली। हल, प्रविधि, भान्सा, प्रवेश र समापनपछिको सरसफाइ सबै स्वयंसेवक सदस्यकै जिम्मामा हुन्छ — यति ठूलो साँझका लागि धेरै हप्ताको तयारी लाग्छ।" },
    { tag: "neujahr team buehne", src: "assets/media/naya-barsha-2026/team-portrait-stage.jpg", width: 1600, height: 1130,
      de: "Mitglieder des Vereins nach dem Programm auf der Bühne",
      en: "Members of the association on stage after the programme", ne: "कार्यक्रमपछि मञ्चमा संस्थाका सदस्यहरू",
      nDe: "Gruppenbild nach dem offiziellen Teil des Programms — bevor die Bühne für den Tanzabend frei gemacht wurde.",
      nEn: "A group photograph after the official part of the programme — before the stage was cleared for the dancing.", nNe: "कार्यक्रमको औपचारिक भाग सकिएपछिको सामूहिक तस्बिर — नाचका लागि मञ्च खाली गर्नुअघि।" },
    { tag: "neujahr empfang team", src: "assets/media/naya-barsha-2026/welcome-desk-team.jpg", width: 900, height: 1600,
      de: "Das Organisationsteam am Empfangs- und Kassentisch",
      en: "The organising team at the reception and cash desk", ne: "स्वागत र टिकट डेस्कमा आयोजक टोली",
      nDe: "Empfangs- und Kassentisch am Eingang: die erste Station für jeden Gast und für den ganzen Abend besetzt.",
      nEn: "The reception and cash desk at the entrance: the first stop for every guest, and staffed for the whole evening.", nNe: "प्रवेशद्वारको स्वागत र टिकट डेस्क: हरेक पाहुनाको पहिलो बिसौनी, र साँझभरि सञ्चालित।" }
  ];

  /* -------------------------- Naya Barsha 2025 — Neujahrsfeier, 11.04.2025 */
  /* The Nepali New Year celebration of 11 April 2025 in the Knabenschule
     Halle, resolved unanimously by the general meeting. The evening is
     documented almost entirely on video — one photograph and eleven clips. */
  var NAYA_BARSHA_2025 = [
    { tag: "neujahr gemeinschaft team", src: "assets/media/naya-barsha-2025/president-with-members.jpg", width: 1200, height: 1600,
      de: "Der Vorsitzende der NPJOE (rechts) mit Mitgliedern des Vereins",
      en: "The chairperson of the NPJOE (right) with members of the association", ne: "NPJOE का अध्यक्ष (दायाँ) संस्थाका सदस्यहरूसँग",
      nDe: "Der Vorsitzende im Gespräch mit Mitgliedern. Ein Fest wie dieses ist zugleich die Gelegenheit, bei der Vorstand und Mitglieder einander außerhalb von Sitzungen begegnen.",
      nEn: "The chairperson in conversation with members. A celebration like this is also the occasion on which board and members meet each other outside of formal meetings.", nNe: "अध्यक्ष सदस्यहरूसँग कुराकानीमा। यस्तो उत्सव कार्यसमिति र सदस्यहरू औपचारिक बैठकबाहिर भेटिने अवसर पनि हो।" }
  ];

  /* Eleven clips from the same evening, 11 April 2025. `secs` is the real running time and is
     rendered as a badge, so nobody starts a three-minute download by accident;
     the players themselves load nothing until they are pressed. */
  var NAYA_BARSHA_2025_CLIPS = [
    { tag: "musik", base: "assets/media/naya-barsha-2025/live-concert-crowd", secs: 85,
      de: "Livekonzert vor der Bühne, das Publikum feiert mit",
      en: "Live concert at the stage, with the audience joining in", ne: "मञ्चमा लाइभ कन्सर्ट, दर्शक पनि सँगै गाउँदै",
      nDe: "Die längste Konzertaufnahme des Abends. Gut zu hören ist, dass das Publikum die Texte mitsingt — die Lieder sind hier allen bekannt.",
      nEn: "The longest concert recording of the evening. You can hear the audience singing along — these songs are known to everyone in the room.", nNe: "साँझको सबैभन्दा लामो कन्सर्ट भिडियो। दर्शकले सँगै गाएको सुनिन्छ — यी गीत हलमा भएका सबैलाई कण्ठस्थ छन्।" },
    { tag: "musik", base: "assets/media/naya-barsha-2025/vocal-duet", secs: 103,
      de: "Gesangsduett auf der Bühne", en: "A vocal duet on stage", ne: "मञ्चमा युगल गीत",
      nDe: "Ein Duett aus dem Bühnenprogramm. Gesang zu zweit ist in der nepalesischen Volksmusik eine eigene Form — die beiden Stimmen antworten einander Strophe um Strophe.",
      nEn: "A duet from the stage programme. Two-part singing is a form of its own in Nepali folk music — the two voices answer one another verse by verse.", nNe: "मञ्चीय कार्यक्रमको एउटा युगल गीत। नेपाली लोकसङ्गीतमा दोहोरो गायन आफैँमा एउटा विधा हो — दुई स्वरले हरेक अन्तरामा एकअर्कालाई जवाफ दिन्छन्।" },
    { tag: "musik", base: "assets/media/naya-barsha-2025/acoustic-set", secs: 70,
      de: "Akustisches Set der Band vor der Bühne",
      en: "The band's acoustic set in front of the stage", ne: "मञ्चअगाडि ब्यान्डको एकोस्टिक प्रस्तुति",
      nDe: "Ein ruhigeres, akustisches Set direkt vor der Bühne — der Teil des Abends, in dem im Saal tatsächlich zugehört statt getanzt wird.",
      nEn: "A quieter, acoustic set right in front of the stage — the part of the evening where the hall listens rather than dances.", nNe: "मञ्चकै अगाडि शान्त एकोस्टिक प्रस्तुति — साँझको त्यो अंश, जहाँ हल नाच्दैन, सुन्छ।" },
    { tag: "tanz", base: "assets/media/naya-barsha-2025/dancefloor-celebration", secs: 110,
      de: "Tanzfläche: Gäste feiern das neue Jahr",
      en: "Dance floor: guests celebrate the new year", ne: "नाचको ठाउँ: पाहुनाहरू नयाँ वर्ष मनाउँदै",
      nDe: "Die Tanzfläche im vollen Gang. Getanzt wird bei nepalesischen Festen nicht paarweise, sondern im offenen Kreis — wer dazukommt, macht einfach mit.",
      nEn: "The dance floor in full swing. At Nepali celebrations people do not dance in pairs but in an open circle — whoever arrives simply joins in.", nNe: "नाचको ठाउँ पूरै जोसमा। नेपाली उत्सवमा मानिसहरू जोडीमा होइन, खुला घेरामा नाच्छन् — जो आइपुग्यो, त्यही सामेल हुन्छ।" },
    { tag: "tanz", base: "assets/media/naya-barsha-2025/finale-dancefloor", secs: 12,
      de: "Ausgelassenes Finale auf der Tanzfläche",
      en: "The exuberant finale on the dance floor", ne: "नाचको ठाउँमा जोसिलो समापन",
      nDe: "Zwölf Sekunden vom Schluss des Abends — der Moment, an dem Bühne und Tanzfläche endgültig verschmolzen sind.",
      nEn: "Twelve seconds from the end of the night — the point at which stage and dance floor had finally merged into one.", nNe: "रातको अन्त्यका बाह्र सेकेन्ड — जब मञ्च र नाचको ठाउँ अन्ततः एउटै भइसकेका थिए।" },
    { tag: "buehne", base: "assets/media/naya-barsha-2025/stage-performance", secs: 172,
      de: "Auftritt auf der Bühne während des Abendprogramms",
      en: "A performance on stage during the evening programme", ne: "साँझ कार्यक्रममा मञ्चीय प्रस्तुति",
      nDe: "Die längste Aufnahme der Sammlung: ein vollständiger Auftritt aus dem Abendprogramm, von der Ansage bis zum Applaus.",
      nEn: "The longest recording in the set: a complete performance from the evening programme, from the announcement through to the applause.", nNe: "सङ्ग्रहकै सबैभन्दा लामो भिडियो: साँझ कार्यक्रमको एउटा पूरा प्रस्तुति, घोषणादेखि तालीसम्म।" },
    { tag: "buehne", base: "assets/media/naya-barsha-2025/evening-programme", secs: 70,
      de: "Abendprogramm vor vollem Saal",
      en: "The evening programme in front of a full hall", ne: "खचाखच हलअगाडि साँझको कार्यक्रम",
      nDe: "Ein Ausschnitt aus dem moderierten Abendprogramm, aufgenommen aus dem Saal heraus.",
      nEn: "An excerpt from the hosted evening programme, filmed from the floor of the hall.", nNe: "सञ्चालित साँझ कार्यक्रमको एक अंश, हलको भुइँबाट खिचिएको।" },
    { tag: "buehne", base: "assets/media/naya-barsha-2025/hall-during-programme", secs: 90,
      de: "Blick in den Saal während des Bühnenprogramms",
      en: "A view of the hall during the stage programme", ne: "मञ्चीय कार्यक्रमका बेला हलको दृश्य",
      nDe: "Ein Schwenk durch den Saal. Diese Aufnahme gibt den besten Eindruck davon, wie voll der Abend tatsächlich war.",
      nEn: "A pan across the hall. This recording gives the best sense of how full the evening actually was.", nNe: "हलभरि घुमाइएको क्यामेरा। त्यो साँझ वास्तवमै कति भरिएको थियो भन्ने यही भिडियोले सबैभन्दा राम्रो देखाउँछ।" },
    { tag: "buehne musik", base: "assets/media/naya-barsha-2025/solo-vocal-performance", secs: 157,
      de: "Solo-Gesangsauftritt im Abendprogramm",
      en: "A solo vocal performance during the evening programme", ne: "साँझ कार्यक्रममा एकल गायन प्रस्तुति",
      nDe: "Ein Solo-Gesangsauftritt, fast zweieinhalb Minuten lang und ohne Schnitt — der Saal wird dabei hörbar still.",
      nEn: "A solo vocal performance, almost two and a half minutes long and unedited — the hall audibly falls quiet for it.", nNe: "करिब अढाइ मिनेट लामो, सम्पादन नगरिएको एकल गायन प्रस्तुति — यसका लागि हल सुनिने गरी शान्त हुन्छ।" },
    { tag: "essen", base: "assets/media/naya-barsha-2025/shared-meal", secs: 64,
      de: "Nepalesische Spezialitäten am Tisch der Gäste",
      en: "Nepali specialities at the guests' table", ne: "पाहुनाको टेबलमा नेपाली परिकार",
      nDe: "Das Essen am Tisch der Gäste. Zum Neujahr kommen dieselben Gerichte auf den Tisch wie in Nepal — der Abend sollte auch kulinarisch vollständig sein.",
      nEn: "The food at the guests' table. The same dishes are served at New Year as in Nepal — the evening was meant to be complete on the plate as well.", nNe: "पाहुनाको टेबलको खाना। नयाँ वर्षमा नेपालमै पस्किने उही परिकार यहाँ पनि पस्किइन्छ — साँझ थालमा पनि पूरा होस् भन्ने चाहना थियो।" },
    { tag: "team", base: "assets/media/naya-barsha-2025/organising-team-desk", secs: 14,
      de: "Kurzer Gruß des Organisationsteams am Empfangstisch",
      en: "A short greeting from the organising team at the reception desk", ne: "स्वागत डेस्कबाट आयोजक टोलीको छोटो अभिवादन",
      nDe: "Ein kurzer Gruß des Organisationsteams vom Empfangstisch aus — vierzehn Sekunden, mitten im Betrieb aufgenommen.",
      nEn: "A short greeting from the organising team at the reception desk — fourteen seconds, filmed in the middle of the rush.", nNe: "स्वागत डेस्कबाट आयोजक टोलीको छोटो अभिवादन — चौध सेकेन्ड, भीडकै बीचमा खिचिएको।" }
  ];

  /* The single clip from the Dashain evening. Same shape as the Naya Barsha
     clips so both albums can use one renderer. */
  var DASHAIN_CLIPS = [
    { tag: "essen gemeinschaft", base: "assets/media/dashain-2024/community-meal-video", secs: 24,
      de: "Gemeinsames Festessen bei der Dashain-Feier",
      en: "The shared celebration meal at the Dashain evening", ne: "दसैँ साँझको सामूहिक उत्सव भोज",
      nDe: "Vierundzwanzig Sekunden vom gemeinsamen Essen. Sie zeigen den Teil des Abends, den Fotos am schlechtesten wiedergeben: den Geräuschpegel eines Saals, in dem alle gleichzeitig reden.",
      nEn: "Twenty-four seconds of the shared meal. They capture the part of the evening photographs convey worst: the sound of a hall in which everyone is talking at once.", nNe: "सामूहिक भोजका चौबीस सेकेन्ड। तस्बिरले सबैभन्दा कम पुर्‍याउने अंश यही भिडियोले समात्छ: सबै एकैपटक बोलिरहेको हलको आवाज।" }
  ];

  /* ------------------------- Medical camp at the NRNA 9th Football Cup */
  /* Photographs from the stand and from the pitch. The first one is the whole
     point of the campaign in a single frame: the treatment happening while the
     tournament carries on around it. */
  var MEDICAL_CAMP_PHOTOS = [
    { tag: "erstehilfe gemeinschaft", src: "assets/media/erste-hilfe-nrna-cup/pitchside-treatment.jpg", width: 1440, height: 1920,
      de: "Versorgung einer Spielerin am Spielfeldrand", en: "Treating a player at the side of the pitch", ne: "मैदानको छेउमा एक खेलाडीको उपचार",
      nDe: "Ein Knöchel wird direkt am Spielfeldrand getapt, während das Turnier weiterläuft. Genau dafür ist das Medical Camp da: Die Versorgung beginnt dort, wo die Verletzung passiert, und nicht erst eine Autofahrt später.",
      nEn: "An ankle being strapped at the side of the pitch while the tournament carries on. This is exactly what the medical camp is for: care starts where the injury happens, not a car journey later.", nNe: "प्रतियोगिता चलिरहेकै बेला मैदानको छेउमा गोलीगाँठोमा पट्टी बाँधिँदै। स्वास्थ्य शिविर ठ्याक्कै यसैका लागि हो: उपचार चोट लागेकै ठाउँमा सुरु हुन्छ, गाडी चढेर पुगेपछि होइन।" },
    { tag: "erstehilfe gemeinschaft team", src: "assets/media/erste-hilfe-nrna-cup/team-and-stand.jpg", width: 1920, height: 1440,
      de: "Das Team am Stand des Medical Camps", en: "The team at the medical camp stand", ne: "स्वास्थ्य शिविर स्टलमा टोली",
      nDe: "Das Team hinter dem Stand. Verbandsmaterial, Kühlspray und zwei Notfallkoffer liegen griffbereit auf der Bank — der Stand ist Anlaufstelle für Erste Hilfe und zugleich Informationsplatz für die Kampagne in Nepal.",
      nEn: "The team behind the stand. Dressings, cooling spray and two emergency cases lie ready on the bench — the stand is both the place to come for first aid and the information point for the campaign in Nepal.", nNe: "स्टलपछाडिको टोली। ड्रेसिङ, कुलिङ स्प्रे र दुई आपत्कालीन बाकस बेन्चमा तयार छन् — यो स्टल प्राथमिक उपचारको ठाउँ पनि हो र नेपालको अभियानबारे जानकारी दिने केन्द्र पनि।" },
    { tag: "erstehilfe gemeinschaft team", src: "assets/media/erste-hilfe-nrna-cup/campaign-shirt.jpg", width: 1440, height: 1920,
      de: "Das Kampagnen-Shirt „Stay Strong and Together“", en: "The campaign shirt \u201cStay Strong and Together\u201d", ne: "अभियानको टिसर्ट \u201cStay Strong and Together\u201d",
      nDe: "Das Shirt der Kampagne wird am Stand gezeigt. „Stay Strong and Together“ ist der Satz, unter dem die Erste-Hilfe-Ausbildung in Nepal läuft — und der Grund, warum an diesem Tag überhaupt ein Stand aufgebaut wurde.",
      nEn: "The campaign shirt on show at the stand. \u201cStay Strong and Together\u201d is the line the First Aid training in Nepal runs under — and the reason a stand was set up on the day at all.", nNe: "स्टलमा प्रदर्शन गरिएको अभियान टिसर्ट। \u201cStay Strong and Together\u201d नै नेपालमा चल्ने प्राथमिक उपचार तालिमको नारा हो — र त्यो दिन स्टल राख्नुको कारण पनि यही हो।" },
    { tag: "erstehilfe gemeinschaft team", src: "assets/media/erste-hilfe-nrna-cup/stand-wide.jpg", width: 1440, height: 1920,
      de: "Der Stand des Medical Camps beim Turnier", en: "The medical camp stand at the tournament", ne: "प्रतियोगितामा स्वास्थ्य शिविर स्टल",
      nDe: "Der Stand im Ganzen, mit dem Banner der Erste-Hilfe-Kampagne. Wer wegen einer Schürfwunde kam, las im Vorbeigehen, wofür dieselbe Ausrüstung in ländlichen Schulen in Nepal gebraucht wird.",
      nEn: "The stand as a whole, with the banner of the First Aid campaign. Anyone who came over with a graze read, in passing, what the same equipment is needed for in rural schools in Nepal.", nNe: "प्राथमिक उपचार अभियानको ब्यानरसहित सिंगो स्टल। सानो चोट लिएर आउने जोसुकैले जाँदाजाँदै पढ्थे — यही सामग्री नेपालका ग्रामीण विद्यालयमा किन चाहिन्छ भन्ने।" }
  ];


  /* First-aid cover provided by our medical team at the NRNA football
     tournament in Stuttgart, hosted by NFC Stuttgart. One clip. */
  var MEDICAL_CAMP_CLIPS = [
    { tag: "erstehilfe gemeinschaft", base: "assets/media/erste-hilfe-nrna-cup/medical-camp", secs: 220,
      de: "Erste-Hilfe-Betreuung beim NRNA-Fußballturnier in Stuttgart",
      en: "First-aid cover at the NRNA football tournament in Stuttgart", ne: "स्टुटगार्टको NRNA फुटबल प्रतियोगितामा प्राथमिक उपचार सेवा",
      nDe: "Ein Einblick in unser Medical Camp beim 9. NRNA-Fußballpokal in Stuttgart: Unser Team war über das gesamte Turnier hinweg für Erste Hilfe und medizinische Unterstützung ansprechbar.",
      nEn: "A glimpse of our medical camp at the NRNA 9th Football Cup in Stuttgart: our team was on hand for first aid and medical support throughout the tournament.", nNe: "स्टुटगार्टको NRNA नवौँ फुटबल कपमा हाम्रो स्वास्थ्य शिविरको एक झलक: हाम्रो टोली पूरै प्रतियोगिताभर प्राथमिक उपचार र स्वास्थ्य सहयोगका लागि उपस्थित थियो।" }
  ];

  /* ------------------------------------------------------- Donation tiers */
  var TIERS = [
    { amount: 1, de: "Schulmaterialien für eine:n Schüler:in", en: "School materials for one student", ne: "एक विद्यार्थीका लागि शैक्षिक सामग्री" },
    { amount: 10, de: "Hygienekit für eine Schulklasse", en: "Hygiene kit for one classroom", ne: "एक कक्षाका लागि सरसफाइ किट" },
    { amount: 50, de: "Vollständiges Erste-Hilfe-Kit für eine Schule", en: "Complete First Aid kit for one school", ne: "एक विद्यालयका लागि पूरा प्राथमिक उपचार किट" },
    { amount: 100, de: "Komplette Trainingsmaterialien für eine Schule", en: "Complete training materials for one school", ne: "एक विद्यालयका लागि पूरा तालिम सामग्री" }
  ];

  /* ----------------------------------------------------------- Renderers */
  /* Icons are decorative; if icons.js has not loaded the markup simply has no
     glyph rather than a broken one, and the label beside it still reads. */
  function ico(name) {
    return window.NPJOEIcons ? window.NPJOEIcons.icon(name) : "";
  }

  /* The current language as a plain string, for attributes and downloads that
     cannot carry three spans. Nepali falls back to English where untranslated. */
  function cur(de, en, ne) {
    var l = window.npjoeLang ? window.npjoeLang() : "de";
    if (l === "ne") return ne || en;
    return l === "en" ? en : de;
  }

  var LOCALE = { de: "de-DE", en: "en-GB", ne: "ne-NP" };

  function fmtDate(iso, lang) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(LOCALE[lang] || "de-DE", { day: "2-digit", month: "long", year: "numeric" });
  }

  function renderFields(sel, opts) {
    var host = document.querySelector(sel);
    if (!host) return;
    opts = opts || {};
    host.innerHTML = FIELDS.map(function (f) {
      return '<article class="field-card reveal" data-tags="' + f.tag + " " + f.key + '">' +
        '<span class="field-icon" aria-hidden="true">' + ico(f.key) + "</span>" +
        "<h3>" + bi(f.de, f.en, f.ne) + "</h3>" +
        '<p class="field-roles">' + bi(esc(f.rolesDe), esc(f.rolesEn), esc(f.rolesNe || f.rolesEn)) + "</p>" +
        '<p class="field-examples"><strong>' + bi("Beispiele:", "Examples:", "उदाहरण:") + "</strong> " + bi(esc(f.exDe), esc(f.exEn), esc(f.exNe || f.exEn)) + "</p>" +
        (opts.cta ? '<p class="mt-2"><a class="text-sm" href="volunteer.html?field=' + f.key + '">' + bi("In diesem Bereich helfen →", "Volunteer in this field →", "यस क्षेत्रमा सहयोग गर्नुहोस् →") + "</a></p>" : "") +
        "</article>";
    }).join("");
  }

  function renderFieldOptions(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = FIELDS.map(function (f) {
      return '<label class="check"><input type="checkbox" name="bereiche" value="' + f.key + '">' +
        '<span><span class="field-icon field-icon-sm" aria-hidden="true">' + ico(f.key) + "</span>" +
        "<strong>" + bi(f.de, f.en, f.ne) + "</strong>" +
        '<span class="hint">' + bi(esc(f.rolesDe.split(",").slice(0, 3).join(", ")), esc(f.rolesEn.split(",").slice(0, 3).join(", ")), esc((f.rolesNe || f.rolesEn).split(",").slice(0, 3).join(", "))) + "</span></span></label>";
    }).join("") +
      '<label class="check"><input type="checkbox" name="bereiche" value="sonstiges">' +
      "<span><strong>⭐ " + bi("Sonstiges / anderer Beruf", "Other / different profession", "अन्य / फरक पेसा") + "</strong>" +
      '<span class="hint">' + bi("Kein Beruf ist ausgeschlossen.", "No profession is excluded.", "कुनै पनि पेसा बाहिर छैन।") + "</span></span></label>";
  }

  function renderEvents(sel, limit) {
    var host = document.querySelector(sel);
    if (!host) return;
    var lang = window.npjoeLang ? window.npjoeLang() : "de";
    var list = EVENTS.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (limit) list = list.slice(0, limit);
    host.innerHTML = list.map(function (ev) {
      var d = new Date(ev.date + "T00:00:00");
      var months = {
        de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
        en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        ne: ["जन", "फेब", "मार्च", "अप्रि", "मे", "जुन", "जुल", "अग", "सेप", "अक्टो", "नोभे", "डिसे"]
      };
      return '<article class="event-row reveal" data-tags="' + ev.tags + '">' +
        '<div class="event-date"><div class="m">' + bi(months.de[d.getMonth()], months.en[d.getMonth()], months.ne[d.getMonth()]) + "</div>" +
        '<div class="d">' + String(d.getDate()).padStart(2, "0") + '</div><div class="y">' + d.getFullYear() + "</div></div>" +
        '<div><h3 class="t-h4">' + bi(ev.de, ev.en, ev.ne) + "</h3>" +
        '<p class="text-sm text-muted mt-1">' + bi(ev.descDe, ev.descEn, ev.descNe) + "</p>" +
        '<div class="event-meta"><span>' + ico("clock") + ev.time + "</span><span>" +
          ico("pin") + bi(ev.placeDe, ev.placeEn, ev.placeNe) + "</span></div>" +
        '<div class="flex mt-2" style="gap:.5rem">' +
        '<a class="btn btn-sm btn-ghost" href="kontakt.html?betreff=' + encodeURIComponent(lang === "ne" ? (ev.ne || ev.en) : (lang === "en" ? ev.en : ev.de)) + '">' + bi("Anmelden", "Register", "दर्ता गर्नुहोस्") + "</a>" +
        '<button class="btn btn-sm btn-ghost" type="button" data-ics="' + ev.id + '">' + bi("Kalender (.ics)", "Calendar (.ics)", "पात्रो (.ics)") + "</button>" +
        "</div></div></article>";
    }).join("");

    host.querySelectorAll("[data-ics]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ev = EVENTS.filter(function (e) { return e.id === btn.getAttribute("data-ics"); })[0];
        if (!ev) return;
        var dt = ev.date.replace(/-/g, "");
        var ics = [
          "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NPJOE//Events//DE", "CALSCALE:GREGORIAN",
          "BEGIN:VEVENT", "UID:" + ev.id + "@progressive-youth.de",
          "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
          "DTSTART;VALUE=DATE:" + dt, "DTEND;VALUE=DATE:" + dt,
          "SUMMARY:" + cur(ev.de, ev.en, ev.ne),
          "DESCRIPTION:" + cur(ev.descDe, ev.descEn, ev.descNe),
          "LOCATION:" + cur(ev.placeDe, ev.placeEn, ev.placeNe),
          "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");
        if (window.npjoeDownload) window.npjoeDownload(ev.id + ".ics", ics, "text/calendar");
      });
    });
  }

  var TAG_LABEL = {
    verein: ["Verein", "Association", "संगठन"], partner: ["Partnerschaft", "Partnership", "साझेदारी"],
    "erste-hilfe": ["Erste Hilfe", "First aid", "प्राथमिक उपचार"], volunteer: ["Volunteering", "Volunteering", "स्वयंसेवा"],
    spenden: ["Spenden", "Donations", "दान"], kultur: ["Kultur", "Culture", "संस्कृति"]
  };

  function tagBadge(tag) {
    var l = TAG_LABEL[tag] || [tag, tag, tag];
    return '<span class="badge badge-navy">' + bi(l[0], l[1], l[2]) + "</span>";
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
        ? '<a class="news-media" href="' + esc(n.href || "#") + '"><img src="' + esc(n.image) + '" width="1920" height="1280" loading="lazy" decoding="async" alt="' + esc(cur(n.imageAltDe, n.imageAltEn, n.imageAltNe)) + '" data-de-alt="' + esc(n.imageAltDe) + '" data-en-alt="' + esc(n.imageAltEn) + '" data-ne-alt="' + esc(n.imageAltNe || n.imageAltEn) + '"></a>'
        : "";
      var body = n.bodyDe
        ? '<details class="news-more mt-3"><summary>' +
            bi("Weiterlesen", "Read more", "थप पढ्नुहोस्") + "</summary>" +
            '<div class="news-body">' + bi(esc(n.bodyDe), esc(n.bodyEn), esc(n.bodyNe || n.bodyEn)) + "</div></details>"
        : "";
      return '<article class="card card-hover reveal-scale news-card' + (featured ? " is-featured" : "") +
        '" data-tags="' + n.tag + '">' +
        media +
        '<div class="flex" style="gap:.5rem;margin-bottom:.75rem">' +
          '<span class="badge badge-outline">' + fmtDate(n.date, lang) + "</span>" + tagBadge(n.tag) +
        "</div>" +
        (featured ? '<h3>' : '<h3 class="t-h4">') + bi(esc(n.de), esc(n.en), esc(n.ne || n.en)) + "</h3>" +
        '<p class="news-lead mt-2">' + bi(esc(n.exDe), esc(n.exEn), esc(n.exNe || n.exEn)) + "</p>" +
        body + (n.href ? '<p class="mt-3"><a class="clink clink-sm" href="' + esc(n.href) + '">' + bi("Fotos und Video ansehen", "View photos and video", "तस्बिर र भिडियो हेर्नुहोस्") + "</a></p>" : "") + "</article>";
    }).join("");
  }

  /* Horizontal snap rail of the twelve volunteer fields. */
  function renderFieldsRail(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = FIELDS.map(function (f) {
      return '<article class="rail-card" data-tags="' + f.tag + " " + f.key + '">' +
        '<span class="rail-icon" aria-hidden="true">' + ico(f.key) + "</span>" +
        "<h3>" + bi(f.de, f.en, f.ne) + "</h3>" +
        '<p class="rail-roles">' + bi(esc(f.rolesDe), esc(f.rolesEn), esc(f.rolesNe || f.rolesEn)) + "</p>" +
        '<p class="rail-ex"><strong>' + bi("Zum Beispiel:", "For example:", "उदाहरणका लागि:") + "</strong> " +
          bi(esc(f.exDe), esc(f.exEn), esc(f.exNe || f.exEn)) + "</p>" +
        '<p class="mt-2"><a class="clink clink-sm" href="volunteer.html?field=' + f.key + '">' +
          bi("Mitmachen", "Take part", "सहभागी हुनुहोस्") + "</a></p>" +
        "</article>";
    }).join("");
  }

  function renderFaq(sel, cat) {
    var host = document.querySelector(sel);
    if (!host) return;
    var list = cat ? FAQ.filter(function (f) { return f.cat === cat; }) : FAQ;
    host.innerHTML = list.map(function (f) {
      return '<details class="acc-item reveal" data-tags="' + f.cat + '"><summary>' + bi(esc(f.qDe), esc(f.qEn), esc(f.qNe || f.qEn)) + "</summary>" +
        '<div class="acc-body">' + bi(esc(f.aDe), esc(f.aEn), esc(f.aNe || f.aEn)) + "</div></details>";
    }).join("");
  }

  /* Editorial plate layout for the dedicated album pages. Every frame gets a
     numbered caption and a paragraph explaining what is actually happening in
     it — on the album pages the photographs carry the report, so a four-word
     caption under a thumbnail is not enough. The plate alternates sides in CSS;
     the markup order stays picture-then-text, so it reads correctly on a phone
     and in a screen reader. */
  function renderEssay(sel, list) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = list.map(function (g, i) {
      var current = cur(g.de, g.en, g.ne);
      var openDe = "Bild vergrößern: " + g.de;
      var openEn = "Enlarge image: " + g.en;
      var openNe = "तस्बिर ठूलो पार्नुहोस्: " + (g.ne || g.en);
      var no = (i + 1 < 10 ? "0" : "") + (i + 1);
      var shape = g.width >= g.height ? " is-landscape" : " is-portrait";
      return '<figure class="plate' + shape + '" data-lightbox data-tags="' + g.tag + '" role="button" tabindex="0"' +
        ' aria-label="' + esc(cur(openDe, openEn, openNe)) + '"' +
        ' data-de-aria-label="' + esc(openDe) + '" data-en-aria-label="' + esc(openEn) +
        '" data-ne-aria-label="' + esc(openNe) + '">' +
        '<span class="plate-frame">' +
        '<img src="' + esc(g.src) + '" width="' + g.width + '" height="' + g.height + '" loading="lazy" decoding="async"' +
        ' alt="' + esc(current) + '" data-de-alt="' + esc(g.de) + '" data-en-alt="' + esc(g.en) +
        '" data-ne-alt="' + esc(g.ne || g.en) + '">' +
        "</span>" +
        '<figcaption class="plate-copy">' +
        '<span class="plate-no" aria-hidden="true">' + no + "</span>" +
        '<b class="plate-title">' + bi(esc(g.de), esc(g.en), esc(g.ne || g.en)) + "</b>" +
        '<span class="plate-note">' + bi(esc(g.nDe || g.de), esc(g.nEn || g.en), esc(g.nNe || g.nEn || g.en)) + "</span>" +
        "</figcaption></figure>";
    }).join("");
  }

  /* Same idea for the video wall: the clip keeps its running-time badge, and
     the sentence underneath says what the visitor is about to spend that time
     on — before they press play and start the download. */
  /* The board, from site.js. Every page that shows it reads the same list, so
     an election changes one file and not five pages. */
  function renderBoard(sel, opts) {
    var host = document.querySelector(sel);
    if (!host) return;
    var o = (window.NPJOE && window.NPJOE.org) || {};
    var board = o.board;
    if (!Array.isArray(board) || !board.length) return;
    var lang = window.npjoeLang ? window.npjoeLang() : "de";
    var showPhone = !opts || opts.phone !== false;

    host.innerHTML = board.map(function (m) {
      var role = lang === "ne" ? (m.roleNe || m.roleEn || m.roleDe)
        : (lang === "en" ? (m.roleEn || m.roleDe) : (m.roleDe || m.roleEn));
      /* tel: wants no spaces; the printed form keeps them so it can be read
         aloud and dialled by hand. */
      var dial = String(m.phone || "").replace(/[^\d+]/g, "");
      return '<div class="board-member">' +
        '<div class="board-name">' + esc(m.name) +
          (m.alias ? ' <span class="board-alias">(' + esc(m.alias) + ")</span>" : "") +
        "</div>" +
        '<div class="board-role">' + esc(role || "") +
          (m.signing
            ? ' <span class="board-signing" title="' +
              esc(cur("Vertretungsberechtigt nach § 26 BGB", "Authorised to represent under § 26 BGB",
                      "BGB को § २६ अनुसार प्रतिनिधित्व गर्न अधिकारप्राप्त")) +
              '">§ 26</span>'
            : "") +
        "</div>" +
        (showPhone && m.phone
          ? '<a class="board-phone" href="tel:' + esc(dial) + '">' +
            (window.NPJOEIcons ? window.NPJOEIcons.icon("phone") : "") +
            esc(m.phone) + "</a>"
          : "") +
        "</div>";
    }).join("");
  }

  function renderClipEssay(sel, list) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = list.map(function (c) {
      var mp4 = esc(c.base + ".mp4");
      var len = Math.floor(c.secs / 60) + ":" + (c.secs % 60 < 10 ? "0" : "") + (c.secs % 60);
      return '<figure class="clip clip-told" data-tags="' + c.tag + '">' +
        '<video controls playsinline preload="none" poster="' + esc(c.base + "-poster.jpg") + '"' +
        ' aria-label="' + esc(cur(c.de, c.en, c.ne)) + '" data-de-aria-label="' + esc(c.de) +
        '" data-en-aria-label="' + esc(c.en) + '" data-ne-aria-label="' + esc(c.ne || c.en) + '">' +
        '<source src="' + mp4 + '" type="video/mp4">' +
        bi('Ihr Browser kann das Video nicht wiedergeben. <a href="' + mp4 + '">Video herunterladen</a>.',
           'Your browser cannot play this video. <a href="' + mp4 + '">Download the video</a>.',
           'तपाईंको ब्राउजरले यो भिडियो चलाउन सक्दैन। <a href="' + mp4 + '">भिडियो डाउनलोड गर्नुहोस्</a>।') +
        "</video>" +
        '<figcaption><span class="clip-head">' +
        '<span class="clip-title">' + bi(esc(c.de), esc(c.en), esc(c.ne || c.en)) + "</span>" +
        '<span class="clip-len"><span class="sr-only">' + bi("Laufzeit ", "Running time ", "अवधि ") + "</span>" + len + "</span>" +
        "</span>" +
        '<span class="clip-note">' + bi(esc(c.nDe || ""), esc(c.nEn || ""), esc(c.nNe || c.nEn || "")) + "</span>" +
        "</figcaption></figure>";
    }).join("");
  }

  function renderTiers(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = TIERS.map(function (t, i) {
      return '<label class="opt"><input type="radio" name="betrag" value="' + t.amount + '"' + (i === 2 ? " checked" : "") + ">" +
        '<span class="opt-body"><span class="opt-amount">' + t.amount + " €</span>" +
        '<span class="opt-desc">' + bi(t.de, t.en, t.ne) + "</span></span></label>";
    }).join("") +
      '<label class="opt"><input type="radio" name="betrag" value="custom">' +
      '<span class="opt-body"><span class="opt-amount">…</span><span class="opt-desc">' +
      bi("Eigener Betrag", "Custom amount", "आफ्नै रकम") + "</span></span></label>";
  }

  function renderTierCards(sel) {
    var host = document.querySelector(sel);
    if (!host) return;
    host.innerHTML = TIERS.map(function (t) {
      return '<div class="card card-hover center reveal"><div class="stat-num">' + t.amount + " €</div>" +
        '<p class="text-sm mt-1">' + bi(t.de, t.en, t.ne) + "</p></div>";
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
    NAYA_BARSHA: NAYA_BARSHA, NAYA_BARSHA_2025: NAYA_BARSHA_2025,
    NAYA_BARSHA_2025_CLIPS: NAYA_BARSHA_2025_CLIPS, DASHAIN_CLIPS: DASHAIN_CLIPS,
    MEDICAL_CAMP_CLIPS: MEDICAL_CAMP_CLIPS,
    MEDICAL_CAMP_PHOTOS: MEDICAL_CAMP_PHOTOS,
    renderFields: renderFields,
    renderFieldOptions: renderFieldOptions,
    renderEvents: renderEvents,
    renderNews: renderNews,
    renderFieldsRail: renderFieldsRail,
    renderFaq: renderFaq,
    renderEssay: renderEssay,
    renderClipEssay: renderClipEssay,
    renderBoard: renderBoard,
    renderTiers: renderTiers,
    renderTierCards: renderTierCards
  };
})();
