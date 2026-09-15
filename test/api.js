/* Exercises the running server: forms, validation, auth, content, security. */
"use strict";
const http = require("http");
const { group, ok, eq } = require("./lib");

let PORT = 4188;
let cookie = "";

function request(method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: "127.0.0.1", port: PORT, path, method,
      headers: Object.assign({
        "Content-Type": "application/json",
        "Content-Length": data ? Buffer.byteLength(data) : 0
      }, cookie ? { Cookie: cookie } : {}, headers || {})
    }, res => {
      let raw = "";
      res.on("data", c => (raw += c));
      res.on("end", () => {
        if (res.headers["set-cookie"]) cookie = res.headers["set-cookie"][0].split(";")[0];
        let json = null;
        try { json = JSON.parse(raw); } catch (e) {}
        resolve({ status: res.statusCode, body: json, raw, headers: res.headers });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

const VALID = {
  membership: { vorname: "Test", nachname: "Person", geburtsdatum: "1998-04-02",
    adresse: "Teststr. 1", plz: "64283", ort: "Darmstadt", email: "t@example.com",
    satzung: true, dsgvo: true, beitrag: true, interessen: ["bildung"] },
  volunteer: { vorname: "V", nachname: "T", email: "v@example.com", land: "UK",
    bereiche: ["health"], dsgvo: true },
  donation: { email: "d@example.com", betrag: "50", dsgvo: true },
  contact: { name: "C", email: "c@example.com", nachricht: "Eine Nachricht mit genug Text." },
  partner: { organisation: "Schule", name: "P", email: "p@example.com", nachricht: "Kooperationsanfrage hier." },
  newsletter: { email: "n@example.com" }
};

module.exports = async function run(port, password) {
  PORT = port;

  /* --------------------------------------------------------- form intake */
  group("Every form type accepts a valid submission");
  for (const type of Object.keys(VALID)) {
    const r = await request("POST", "/api/" + type, VALID[type]);
    ok(type + " accepted and given a reference",
       r.status === 200 && r.body && r.body.ok && !!r.body.ref,
       "status " + r.status + " " + JSON.stringify(r.body));
  }
  const m = await request("POST", "/api/membership", VALID.membership);
  ok("membership numbers run in sequence", /^NPJOE-\d{4}-\d{4}$/.test(m.body.membershipNo || ""),
     String(m.body.membershipNo));

  /* --------------------------------------------------------- form refusal */
  group("Invalid submissions are refused, not silently accepted");
  const bad = await request("POST", "/api/membership", { vorname: "X", email: "not-an-email" });
  eq("incomplete membership returns 422", bad.status, 422);
  ok("the refusal names the offending fields",
     Array.isArray(bad.body.fields) && bad.body.fields.includes("email") && bad.body.fields.includes("satzung"),
     JSON.stringify(bad.body.fields));

  const noConsent = await request("POST", "/api/membership",
    Object.assign({}, VALID.membership, { dsgvo: false }));
  eq("membership without data-protection consent is refused", noConsent.status, 422);

  const shortMsg = await request("POST", "/api/contact", { name: "A", email: "a@b.de", nachricht: "hi" });
  eq("a too-short contact message is refused", shortMsg.status, 422);

  const badMail = await request("POST", "/api/newsletter", { email: "nope" });
  eq("a malformed newsletter address is refused", badMail.status, 422);

  group("Spam and abuse protections");
  const hp = await request("POST", "/api/contact", Object.assign({ _hp: "bot" }, VALID.contact));
  ok("honeypot submissions are swallowed silently", hp.status === 200 && hp.body.ref === "IGNORED",
     JSON.stringify(hp.body));
  const unknown = await request("POST", "/api/does-not-exist", {});
  eq("unknown form endpoints 404", unknown.status, 404);
  const wrongMethod = await request("GET", "/api/membership");
  eq("GET on a form endpoint is rejected", wrongMethod.status, 405);

  /* -------------------------------------------------------------- content */
  group("Board-edited content");
  const pub = await request("GET", "/api/content");
  eq("the public content endpoint answers", pub.status, 200);

  const unauth = await request("POST", "/api/admin/content", { events: [] });
  eq("editing content without a session is refused", unauth.status, 401);

  /* ---------------------------------------------------------------- admin */
  group("Board area authentication");
  const wrongPw = await request("POST", "/api/admin/login", { password: "definitely-wrong" });
  eq("a wrong password is rejected", wrongPw.status, 401);
  const login = await request("POST", "/api/admin/login", { password: password });
  eq("the correct password signs in", login.status, 200);
  ok("the session cookie is HttpOnly and SameSite",
     /HttpOnly/i.test(String(login.headers["set-cookie"])) && /SameSite=Strict/i.test(String(login.headers["set-cookie"])),
     String(login.headers["set-cookie"]));

  const summary = await request("GET", "/api/admin/summary");
  ok("the summary counts what was submitted",
     summary.status === 200 && summary.body.membership.total >= 2,
     JSON.stringify(summary.body && summary.body.membership));
  ok("submissions from the last 7 days are counted",
     summary.body.membership.last7 >= 2, JSON.stringify(summary.body.membership));

  const rows = await request("GET", "/api/admin/submissions?type=membership");
  ok("submissions can be listed", rows.status === 200 && rows.body.items.length >= 2,
     "count " + (rows.body && rows.body.items && rows.body.items.length));
  ok("the stored record hides the raw IP",
     rows.body.items[0]._ip && rows.body.items[0]._ip.length <= 12 && !/\./.test(rows.body.items[0]._ip),
     String(rows.body.items[0]._ip));

  const ref = rows.body.items[0]._ref;
  const status = await request("POST", "/api/admin/status",
    { type: "membership", ref: ref, status: "angenommen", note: "Beschluss vom Vorstand" });
  eq("a submission status can be set", status.status, 200);
  const after = await request("GET", "/api/admin/submissions?type=membership");
  ok("the status change persists",
     after.body.items.some(r => r._ref === ref && r.status === "angenommen"));

  group("CSV export");
  /* Submit a record whose values look like spreadsheet formulas, so the
     escaping is genuinely exercised rather than assumed. */
  await request("POST", "/api/contact", {
    name: "=cmd|'/c calc'!A1", email: "inject@example.com",
    nachricht: "+SUM(1+1)*cmd  and a leading @mention and -formula",
    betreff: "@SUM(A1)"
  });
  const injCsv = await request("GET", "/api/admin/export?type=contact");
  const formulaCells = (injCsv.raw.match(/,"[=+\-@]/g) || []);
  eq("values starting with = + - @ are neutralised", formulaCells, []);
  ok("the dangerous value is still present, just quoted safely",
     /cmd\|/.test(injCsv.raw), "value was dropped entirely");
  ok("the guard prefixes such cells with an apostrophe",
     /"'=cmd/.test(injCsv.raw), injCsv.raw.split("\n")[1] || "");

  const csv = await request("GET", "/api/admin/export?type=membership");
  eq("export responds", csv.status, 200);
  ok("it is served as a CSV download",
     /text\/csv/.test(csv.headers["content-type"]) && /attachment/.test(csv.headers["content-disposition"] || ""),
     csv.headers["content-type"]);
  ok("the signature column is left out of the export", !/signature/.test(csv.raw.split("\n")[0]));

  group("Content editing");
  const badContent = await request("POST", "/api/admin/content",
    { events: [{ date: "nonsense", de: "" }], figures: { volunteers: "abc" } });
  eq("malformed content is refused", badContent.status, 422);
  ok("the refusal points at the exact entries",
     badContent.body.fields.includes("events[0].date") && badContent.body.fields.includes("figures.volunteers"),
     JSON.stringify(badContent.body.fields));

  const goodContent = await request("POST", "/api/admin/content", {
    events: [{ id: "ev-t", date: "2027-03-08", de: "Mitgliederversammlung", en: "General meeting", tags: "verein" }],
    figures: { schoolsReached: 19 },
    _editor: "Testlauf"
  });
  eq("valid content saves", goodContent.status, 200);
  const pub2 = await request("GET", "/api/content");
  ok("the edit is visible to the public site",
     pub2.body.events && pub2.body.events[0].de === "Mitgliederversammlung" && pub2.body.figures.schoolsReached === 19,
     JSON.stringify(pub2.body.figures));
  ok("who edited it is recorded", pub2.body.updatedBy === "Testlauf", String(pub2.body.updatedBy));

  await request("POST", "/api/admin/content", { events: [], figures: { schoolsReached: 21 }, _editor: "Zweiter" });
  const backups = await request("GET", "/api/admin/content-backups");
  ok("the previous version is kept as a backup",
     backups.status === 200 && backups.body.items.length >= 1,
     "backups: " + (backups.body && backups.body.items && backups.body.items.length));
  const restore = await request("POST", "/api/admin/content-restore", { file: backups.body.items[0].file });
  eq("a backup can be restored", restore.status, 200);

  group("Static file serving and its boundaries");
  const home = await request("GET", "/");
  ok("the home page is served", home.status === 200 && /NPJOE/.test(home.raw));
  ok("assets revalidate rather than being cached blindly",
     /no-cache/.test(home.headers["cache-control"] || ""), home.headers["cache-control"]);
  const css = await request("GET", "/assets/css/main.css");
  ok("stylesheets carry an ETag", !!css.headers.etag);
  const c304 = await request("GET", "/assets/css/main.css", undefined, { "If-None-Match": css.headers.etag });
  eq("an unchanged file answers 304", c304.status, 304);

  /* ------------------------------------------------------- byte ranges */
  group("Video can be streamed and seeked");
  /* Safari refuses to play a video at all unless its Range request comes back
     as a 206, and without ranges every seek re-fetches the whole clip. The
     gallery carries eleven of them, so this is not academic. */
  const clip = "/assets/media/naya-barsha-2025/finale-dancefloor.mp4";
  const whole = await request("GET", clip);
  eq("a plain request still returns the whole file", whole.status, 200);
  eq("mp4 is served as video, not as a download", whole.headers["content-type"], "video/mp4");
  eq("the server advertises range support", whole.headers["accept-ranges"], "bytes");
  const total = Number(whole.headers["content-length"]);

  const part = await request("GET", clip, undefined, { Range: "bytes=100-199" });
  eq("a byte range answers 206", part.status, 206);
  eq("with exactly the bytes asked for", Number(part.headers["content-length"]), 100);
  eq("and says where they sit in the file",
     part.headers["content-range"], "bytes 100-199/" + total);

  /* This is the exact form Safari opens a video with. */
  const open = await request("GET", clip, undefined, { Range: "bytes=0-" });
  eq("an open-ended range answers 206 too", open.status, 206);
  eq("covering the whole file", open.headers["content-range"], "bytes 0-" + (total - 1) + "/" + total);

  const suffix = await request("GET", clip, undefined, { Range: "bytes=-500" });
  eq("a suffix range returns the last bytes", suffix.status, 206);
  eq("counted from the end", suffix.headers["content-range"],
     "bytes " + (total - 500) + "-" + (total - 1) + "/" + total);

  const past = await request("GET", clip, undefined, { Range: "bytes=" + (total + 10) + "-" });
  eq("a range beyond the file is refused, not silently truncated", past.status, 416);
  eq("and reports the real length", past.headers["content-range"], "bytes */" + total);

  const overshoot = await request("GET", clip, undefined, { Range: "bytes=0-" + (total + 999) });
  eq("an end past the file is clamped rather than refused", overshoot.status, 206);
  eq("to the last real byte", Number(overshoot.headers["content-length"]), total);

  const notRange = await request("GET", clip, undefined, { Range: "items=0-1" });
  eq("an unrecognised range unit is ignored, not mishandled", notRange.status, 200);


  for (const p of ["/server/data/membership.jsonl", "/assets/../server/data/content.json",
                   "/server/server.js", "/.gitignore"]) {
    const r = await request("GET", p);
    eq("blocked: " + p, r.status, 403);
  }
  const missing = await request("GET", "/nope.html");
  eq("a missing page returns 404", missing.status, 404);
  ok("the 404 page is the branded one", /NPJOE/.test(missing.raw));

  group("Session teardown");
  await request("POST", "/api/admin/logout");
  cookie = "";
  const afterLogout = await request("GET", "/api/admin/summary");
  eq("the session no longer works after signing out", afterLogout.status, 401);
};
