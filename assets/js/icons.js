/* ==========================================================================
   NPJOE — Icon set
   Emoji were standing in for icons across the site. They are drawn by the
   operating system, so the same page arrived as flat pictograms on Windows,
   glossy 3-D on a Mac and something else again on Android — three different
   visual languages inside one design, none of them ours. They also come in a
   single fixed weight that never matches the text beside them.

   These are line icons on a 24-grid, 1.6 stroke, round caps — one weight, one
   grid, inheriting colour from the text like any other glyph. Purely
   decorative: every one is aria-hidden, and the label beside it does the
   talking for a screen reader.
   ========================================================================== */
(function () {
  "use strict";

  /* Each entry is the inside of a 24×24 viewBox. Strokes, not fills, so an
     icon at 48px and an icon at 20px look like the same family. */
  var PATHS = {
    /* ---- the twelve professional fields ---- */
    health: '<path d="M12 5.5v13M5.5 12h13"/><rect x="3" y="3" width="18" height="18" rx="5"/>',
    education: '<path d="M2.5 8.5 12 4l9.5 4.5L12 13 2.5 8.5Z"/><path d="M6.5 10.8v5.1c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9v-5.1"/><path d="M21.5 8.5v5.6"/>',
    tech: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
    engineering: '<path d="M3 20.5h18"/><path d="M6 20.5V9.5l6-4.5 6 4.5v11"/><path d="M10 20.5v-5h4v5"/>',
    law: '<path d="M12 3.5v17"/><path d="M6 20.5h12"/><path d="M4 8h16"/><path d="M7 8 4.5 14h5L7 8Z"/><path d="M17 8l-2.5 6h5L17 8Z"/>',
    arts: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.8-1.7h1.6a4.3 4.3 0 0 0 4.3-4.3c0-3.8-3.8-6.9-8.5-6.9Z"/><circle cx="7.8" cy="11" r="1.1"/><circle cx="12" cy="8" r="1.1"/><circle cx="16.2" cy="11" r="1.1"/>',
    sports: '<circle cx="12" cy="12" r="8.5"/><path d="m12 7.2 3.6 2.6-1.4 4.2H9.8L8.4 9.8 12 7.2Z"/><path d="M12 3.5v3.7M3.9 9.4l4.5.4M6.9 19.3l2.9-5M17.1 19.3l-2.9-5M20.1 9.4l-4.5.4"/>',
    environment: '<path d="M12 20.5v-7"/><path d="M12 13.5c0-4.4 3.1-8 7-8 0 4.4-3.1 8-7 8Z"/><path d="M12 17c-3.2 0-5.8-2.6-5.8-6 3.2 0 5.8 2.6 5.8 6Z"/>',
    business: '<path d="M3.5 20.5h17"/><path d="M6.5 20.5v-6M11 20.5V8M15.5 20.5v-9M20 20.5V4.5"/>',
    media: '<rect x="2.5" y="6.5" width="19" height="13" rx="2.5"/><circle cx="12" cy="13" r="3.6"/><path d="M8.5 6.5 10 3.5h4l1.5 3"/>',
    nutrition: '<path d="M6 3.5v6a2.5 2.5 0 0 0 5 0v-6"/><path d="M8.5 12v8.5"/><path d="M17.5 3.5c-1.7 1.2-2.5 3-2.5 5.4 0 1.8.8 2.9 2.5 3.1v8.5"/>',
    mentalhealth: '<circle cx="12" cy="6" r="2.5"/><path d="M12 8.5v5"/><path d="M6.5 11c1.5 1.7 3.4 2.5 5.5 2.5s4-.8 5.5-2.5"/><path d="M7 20.5c1.2-2 3-3 5-3s3.8 1 5 3"/>',

    /* ---- homepage panes and quick links ---- */
    /* A day given: an open hand with a heart resting in it. Drawn as two
       separate shapes rather than one clever path — a line icon that tries to
       be a single stroke usually reads as a knot at small sizes. */
    hands: '<path d="M4.5 13.5v3.2c0 2.1 1.7 3.8 3.8 3.8h5.6c2.4 0 4.3-1.9 4.3-4.3v-3.4a1.5 1.5 0 0 0-3 0"/><path d="M15.2 12.8v-1.6a1.5 1.5 0 0 0-3 0v1.4"/><path d="M12.2 12.6v-2.4a1.5 1.5 0 0 0-3 0v3"/><path d="M9.2 13.2v-1a1.5 1.5 0 0 0-3 0v1.3"/><path d="M12 7.2s-2.6-1.4-2.6-3A1.6 1.6 0 0 1 12 3.5a1.6 1.6 0 0 1 2.6.7c0 1.6-2.6 3-2.6 3Z"/>',
    heart: '<path d="M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6c0 5-7.5 9.4-7.5 9.4Z"/>',
    chart: '<path d="M3.5 20.5h17"/><path d="m5.5 15.5 4-4.5 3.5 3 5.5-6.5"/><path d="M15 7.5h3.5V11"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m15.8 15.8 4.7 4.7"/>',
    chat: '<path d="M20.5 12c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.15-2.9-.43L4 20.5l1.6-3.8C4.3 15.4 3.5 13.8 3.5 12c0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4Z"/>',
    bridge: '<path d="M2.5 18.5h19"/><path d="M4.5 18.5V9M19.5 18.5V9"/><path d="M2.5 12c3.5-3.5 6.5-5 9.5-5s6 1.5 9.5 5"/><path d="M9 18.5v-4.2M15 18.5v-4.2"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 7.5 7.3 5a2 2 0 0 0 2.4 0l7.3-5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
    pin: '<path d="M12 21s6.5-5.6 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.4" r="2.4"/>',
    check: '<path d="m5 12.6 4.6 4.6L19 7.8"/>',
    shield: '<path d="M12 3.5 5 6.2v5.3c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6.2L12 3.5Z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
    kit: '<rect x="2.5" y="7" width="19" height="12.5" rx="2.5"/><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7"/><path d="M12 10.8v5M9.5 13.3h5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z"/>',
    users: '<circle cx="9" cy="9" r="3.4"/><path d="M3 19.5c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 6.2a3.4 3.4 0 0 1 0 6.6"/><path d="M17.5 14.9c2 .7 3.5 2.4 3.5 4.6"/>',
    spark: '<path d="M12 3.5 13.7 9l5.8 1.7-5.8 1.7L12 18l-1.7-5.6L4.5 10.7 10.3 9 12 3.5Z"/>',
    mic: '<rect x="9" y="2.8" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.2M8.8 21.2h6.4"/>',
    trophy: '<path d="M7 3.8h10v5a5 5 0 0 1-10 0v-5Z"/><path d="M7 5.5H4.5v1.8A3.2 3.2 0 0 0 7.7 10.5"/><path d="M17 5.5h2.5v1.8a3.2 3.2 0 0 1-3.2 3.2"/><path d="M12 13.8v3.4M8.5 20.2h7M9.8 17.2h4.4l1.3 3H8.5l1.3-3Z"/>',
    meal: '<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z"/><path d="M2.5 20.2h19"/><path d="M7.5 8.2c0-1.4 1.5-1.7 1.5-3.1M12 8.2c0-1.4 1.5-1.7 1.5-3.1M16.5 8.2c0-1.4 1.5-1.7 1.5-3.1"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="2.5"/><path d="M8 10V7.2a4 4 0 0 1 8 0V10"/><path d="M12 14v3"/>',
    cycle: '<path d="M4 12a8 8 0 0 1 13.7-5.6l2.3 2.2"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.4"/><path d="M20.3 4.2v4.4h-4.4M3.7 19.8v-4.4h4.4"/>',
    book: '<path d="M3.5 5.2A3 3 0 0 1 6.5 3.5H11v16H6.5a3 3 0 0 0-3 1.4V5.2Z"/><path d="M20.5 5.2a3 3 0 0 0-3-1.7H13v16h4.5a3 3 0 0 1 3 1.4V5.2Z"/>',
    receipt: '<path d="M5 2.8h14v18.4l-2.3-1.6-2.4 1.6-2.3-1.6-2.3 1.6-2.4-1.6L5 21.2V2.8Z"/><path d="M8.5 7.8h7M8.5 11.5h7M8.5 15.2h4"/>',
    megaphone: '<path d="M3.5 9.8v4.4a1.8 1.8 0 0 0 1.8 1.8h2.2l7.5 4.5V3.5L7.5 8H5.3a1.8 1.8 0 0 0-1.8 1.8Z"/><path d="M7.5 16v4.5h3V17.8"/><path d="M18.5 9.2a4 4 0 0 1 0 5.6"/>',
    clipboard: '<rect x="4.5" y="4.5" width="15" height="16" rx="2.5"/><path d="M9 4.5V3.4a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 3.4v1.1Z"/><path d="M8.5 10.5h7M8.5 14h7M8.5 17.2h4"/>',
    archive: '<rect x="3" y="3.5" width="18" height="5" rx="1.6"/><path d="M4.8 8.5v10.2a1.8 1.8 0 0 0 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8V8.5"/><path d="M9.8 12.5h4.4"/>',
    bandage: '<rect x="1.8" y="7.8" width="20.4" height="8.4" rx="4.2" transform="rotate(-45 12 12)"/><path d="m8.6 8.6 6.8 6.8"/><path d="M10.6 11.4h.01M13.4 12.6h.01M11.4 13.4h.01M12.6 10.6h.01"/>',
    lungs: '<path d="M12 3.5v8.2"/><path d="M12 8.2c-.5-1.4-1.7-2.4-3-2.4-1.8 0-3.3 1.8-3.6 4.2l-.7 5.4c-.2 1.9 1 3.4 2.7 3.4 1.5 0 2.8-1.2 3-2.9l.6-4.6"/><path d="M12 8.2c.5-1.4 1.7-2.4 3-2.4 1.8 0 3.3 1.8 3.6 4.2l.7 5.4c.2 1.9-1 3.4-2.7 3.4-1.5 0-2.8-1.2-3-2.9l-.6-4.6"/>',
    bone: '<path d="M7.4 16.6 16.6 7.4"/><path d="M8.6 5.2a2.4 2.4 0 1 1 3.4 3.4l-3.4 3.4-3.4-3.4a2.4 2.4 0 1 1 3.4-3.4Z"/><path d="M15.4 18.8a2.4 2.4 0 1 1-3.4-3.4l3.4-3.4 3.4 3.4a2.4 2.4 0 1 1-3.4 3.4Z"/>',
    brain: '<path d="M12 4.2v15.6"/><path d="M12 6a2.6 2.6 0 0 0-4.8-1.3A2.5 2.5 0 0 0 4.6 8a2.6 2.6 0 0 0-.9 4.3A2.6 2.6 0 0 0 5 16.6a2.5 2.5 0 0 0 3.5 2.6A2.4 2.4 0 0 0 12 18"/><path d="M12 6a2.6 2.6 0 0 1 4.8-1.3A2.5 2.5 0 0 1 19.4 8a2.6 2.6 0 0 1 .9 4.3A2.6 2.6 0 0 1 19 16.6a2.5 2.5 0 0 1-3.5 2.6A2.4 2.4 0 0 1 12 18"/>',
    news: '<path d="M3.5 5.8h13v14.7H6a2.5 2.5 0 0 1-2.5-2.5V5.8Z"/><path d="M16.5 9h2a2 2 0 0 1 2 2v7a2.5 2.5 0 0 1-4 0"/><path d="M6.3 9h7.4M6.3 12.4h7.4M6.3 15.8h4.4"/>',
    school: '<path d="M2.5 20.5h19"/><path d="M4.5 20.5V9.2L12 5l7.5 4.2v11.3"/><path d="M9.5 20.5v-5.2h5v5.2"/><path d="M12 2.6v2.4"/>',
    euro: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.6a4.2 4.2 0 0 0-6.9 3.4 4.2 4.2 0 0 0 6.9 3.4"/><path d="M7.4 10.8h5.4M7.4 13.3h5.4"/>',
    party: '<path d="m3.5 20.5 4.2-11 6.8 6.8-11 4.2Z"/><path d="m7.7 9.5 6.8 6.8"/><path d="M14.5 4.2c1 1 1 2.6 0 3.6M17.5 2.5c2 2 2 5.2 0 7.2M19.2 12.5h.01M15.8 15.5h.01M12.5 3.5h.01"/>',
    building: '<path d="M3.5 20.5h17"/><rect x="5.5" y="3.5" width="13" height="17" rx="1.8"/><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2"/><path d="M10.5 20.5v-2.8h3v2.8"/>',
    music: '<path d="M9 18V5.5l11-2v12"/><circle cx="6.2" cy="18" r="2.8"/><circle cx="17.2" cy="15.5" r="2.8"/><path d="M9 9.2l11-2"/>',
    dance: '<circle cx="13.5" cy="4.6" r="2.1"/><path d="M13.2 7.2 10 11.5l3.4 2.2-1.6 7"/><path d="m10 11.5-4.2-.8M13.4 13.7l4 3.2M13.4 13.7 17 9.4"/>',
    curry: '<path d="M3.2 11.8h17.6a8.8 8.8 0 0 1-17.6 0Z"/><path d="M2.5 20.4h19"/><path d="M20.8 13.5h1.2M9 8.5c0-1.3 1.4-1.6 1.4-2.9M13.5 8.5c0-1.3 1.4-1.6 1.4-2.9"/>',
    muscle: '<path d="M3.5 17.5c0-3.4 1.6-5.6 4.2-6.6l1.1-4.2a2.3 2.3 0 0 1 4.5.6v3.3h3.4a4.3 4.3 0 0 1 4.3 4.3c0 2.7-2.2 4.6-5.2 4.6H6a2.5 2.5 0 0 1-2.5-2Z"/><path d="M9 11.2c1.7.7 2.8 2 3.3 3.8"/>',
    world: '<circle cx="12" cy="12" r="8.5"/><path d="M4.2 9.5h15.6M4.2 14.5h15.6"/><path d="M12 3.5c2.1 2.4 3.2 5.3 3.2 8.5s-1.1 6.1-3.2 8.5c-2.1-2.4-3.2-5.3-3.2-8.5s1.1-6.1 3.2-8.5Z"/>',
    ambulance: '<path d="M2.5 16.2V8a1.5 1.5 0 0 1 1.5-1.5h9.5V16.2"/><path d="M13.5 9.5h3.6l3.4 3.6v3.1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M9 18h6M2.5 16.2H5M20.5 16.2h1"/><path d="M8 9.5v3.4M6.3 11.2h3.4"/>',
    box: '<path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2V8.2Z"/><path d="m3.5 8.2 8.5 4.3 8.5-4.3M12 12.5V20"/>',
    theatre: '<path d="M3.5 6.5h9v5.8a4.5 4.5 0 0 1-9 0V6.5Z"/><path d="M6 9.2h.01M10 9.2h.01M6.3 14.2c.9.7 2.5.7 3.4 0"/><path d="M11.5 6.5V5.2h9V11a4.5 4.5 0 0 1-4.6 4.5"/><path d="M15 8h.01M19 8h.01"/>'
  };

  /* Returns a decorative SVG. `size` is a CSS length; colour is inherited. */
  function icon(name, cls) {
    var body = PATHS[name];
    if (!body) return "";
    return '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + body + "</svg>";
  }

  function has(name) { return Object.prototype.hasOwnProperty.call(PATHS, name); }

  /* Replaces the contents of every [data-icon] element on the page, so pages
     can ask for an icon in markup without repeating the SVG. */
  function hydrate(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      var name = el.getAttribute("data-icon");
      if (has(name)) el.innerHTML = icon(name);
    });
  }

  window.NPJOEIcons = { icon: icon, has: has, hydrate: hydrate, PATHS: PATHS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { hydrate(); });
  } else {
    hydrate();
  }
})();
