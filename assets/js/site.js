/* ==========================================================================
   NPJOE — Site configuration
   Edit this file to change organisation-wide details in one place.
   ========================================================================== */

window.NPJOE = {
  org: {
    nameDe: "Nepalesische Progressive Jugendorganisation e.V.",
    nameEn: "Nepalese Progressive Youth Organisation (Germany)",
    short: "NPJOE",
    register: "VR 84826 – Amtsgericht Darmstadt",
    seat: "Darmstadt, Hessen, Deutschland",
    founded: "2026",
    statutesDate: "19. Mai 2026",
    partner: "Nepalese Progressive Youth Organisation (NPYO) Nepal",
    website: "www.progressive-youth.de",
    email: "info@progressive-youth.de",
    emailMembership: "mitglied@progressive-youth.de",
    emailVolunteer: "volunteer@progressive-youth.de",
    emailDonation: "spenden@progressive-youth.de",
    phone: "+49 (0) 6151 000000",
    address: {
      street: "— Vereinsanschrift bitte ergänzen —",
      zip: "64283",
      city: "Darmstadt",
      country: "Deutschland"
    },
    board: {
      chair: "Kesilal Sunchauri",
      secretary: "Durga Sunchauri"
    },
    bank: {
      holder: "Nepalesische Progressive Jugendorganisation e.V.",
      iban: "DE00 0000 0000 0000 0000 00",
      bic: "XXXXDEXXXXX",
      bank: "— Bank bitte ergänzen —"
    },
    fee: { monthly: 5, currency: "EUR" },
    social: {
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
      youtube: "https://youtube.com/",
      linkedin: "https://linkedin.com/",
      tiktok: "https://tiktok.com/"
    }
  },

  /* Where form submissions go.
     mode: "auto"  -> try the local API, fall back to download/e-mail
           "api"   -> always POST to apiBase
           "offline" -> never call the network (download JSON + open mail client) */
  forms: {
    mode: "auto",
    apiBase: "/api",
    fallbackEmail: "info@progressive-youth.de"
  },

  /* Impact figures shown on the site — update as the programmes grow. */
  impact: {
    schoolsTarget: 100,
    schoolsReached: 12,
    studentsTrained: 1450,
    teachersCertified: 68,
    volunteers: 214,
    countries: 17,
    donationsEur: 8420,
    donationGoalEur: 25000
  }
};
