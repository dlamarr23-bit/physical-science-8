/* LINK PREVIEWS for Class Pass student links (Donny, 2026-11-13).
   Every student link is /pass/?app=<deployment ID>, the same page for every assignment, so the picture Google Classroom
   shows next to a link can't be written into pass/index.html. This Pages Function adds it on the way out:
   og:image (one of /assets/previews/<type>.jpg), og:title and the <title>, then serves the page as before.

   Which picture: ?kind=sim on the link wins (sim, lab, reading, practice-set, self-check, review-game, escape-room,
   video-check). Otherwise the sheet is asked (classPass, the same question the page asks) and its title decides when it
   starts with a type ("Sim: Sled Collisions"), else the sheet's code kind (friction-sim-lab = Sim, ...). Self-Check otherwise.
   The answer is kept in Cloudflare's cache for 30 days, so the sheet is asked about once per assignment.
   Students never wait long for this: a link preview fetcher waits up to 8 s for the sheet, a person at most 1.5 s, and
   the page opens with the Self-Check picture if the sheet is slower (the answer is still saved for next time). */

const TYPES = ["sim", "lab", "reading", "practice-set", "self-check", "review-game", "escape-room", "video-check"];
const WORDS = {
  "sim": "sim", "simulation": "sim", "lab": "lab", "reading": "reading", "article": "reading",
  "practice set": "practice-set", "practice": "practice-set", "self-check": "self-check", "self check": "self-check",
  "review game": "review-game", "review": "review-game", "game": "review-game",
  "escape room": "escape-room", "escape": "escape-room", "video check": "video-check", "video": "video-check",
};
const BY_CODE = {
  "friction-sim-lab": "sim", "friction-speed-lab": "lab", "friction-article": "reading", "reading-activity": "reading",
  "review-game": "review-game", "net-force-escape-room": "escape-room", "video-check": "video-check",
  "auto-grading-activity": "self-check",
};
const NAMES = {
  "sim": "Sim", "lab": "Lab", "reading": "Reading", "practice-set": "Practice Set", "self-check": "Self-Check",
  "review-game": "Review Game", "escape-room": "Escape Room", "video-check": "Video Check",
};
// Link preview programs. Google's (Classroom's thumbnails included) say "Google" or "HeadlessChrome"; a student's Chrome or
// Chromebook never does.
const BOT = /google|headless|bot\b|bot\/|crawl|spider|preview|facebookexternalhit|slack|discord|embed|whatsapp|skype|teams/i;
const CACHE_DAYS = 30;

function typeOf(word) {
  const w = String(word || "").trim().toLowerCase().replace(/[_]+/g, " ");
  if (TYPES.includes(w.replace(/ /g, "-"))) return w.replace(/ /g, "-");
  return WORDS[w] || "";
}
function fromSheet(info) {
  const m = /^\s*([A-Za-z][A-Za-z -]{1,18}?)\s*[:|–—-]\s+/.exec(String(info.title || ""));
  return (m && typeOf(m[1])) || BY_CODE[String(info.kind || "")] || "";
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** {title, kind} from the sheet, from the cache when it's there; null when the sheet doesn't answer. */
async function askSheet(app, origin, ctx) {
  const key = new Request(origin + "/__preview/" + app);
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return { cached: true, info: await hit.json() };
  const work = (async () => {
    const r = await fetch("https://script.google.com/macros/s/" + app + "/exec", {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fn: "classPass", args: [] }), redirect: "follow",
    });
    if (!r.ok) return null;
    let out = null;
    try { out = JSON.parse(await r.text()); } catch (e) { return null; }
    if (!out || !out.ok || !out.result) return null;
    const info = { title: String(out.result.title || "").slice(0, 200), kind: String(out.result.kind || "").slice(0, 60) };
    await cache.put(key, new Response(JSON.stringify(info), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=" + CACHE_DAYS * 86400 },
    }));
    return info;
  })().catch(() => null);
  ctx.waitUntil(work);
  return { cached: false, work };
}

export async function onRequestGet(ctx) {
  const { request } = ctx;
  const page = await ctx.next();
  const type0 = (page.headers.get("Content-Type") || "").includes("text/html");
  if (!type0 || page.status !== 200) return page;

  const url = new URL(request.url);
  const bot = BOT.test(request.headers.get("User-Agent") || "");
  const app = url.searchParams.get("app") || "";
  let type = typeOf(url.searchParams.get("kind"));
  let title = "";

  if (/^AKfycb[\w-]{20,120}$/.test(app)) {
    try {
      const got = await askSheet(app, url.origin, ctx);
      let info = got.info;
      if (!got.cached) {
        const wait = bot ? 8000 : 1500;
        info = await Promise.race([got.work, new Promise((r) => setTimeout(() => r(null), wait))]);
      }
      if (info) {
        title = info.title;
        type = type || fromSheet(info);
      }
    } catch (e) { /* the page still opens, with the default picture */ }
  }
  type = type || "self-check";

  const image = url.origin + "/assets/previews/" + type + ".jpg";
  const shown = title || NAMES[type];
  const tags =
    `<meta property="og:type" content="website">` +
    `<meta property="og:site_name" content="Physical Science 8">` +
    `<meta property="og:title" content="${esc(shown)}">` +
    `<meta property="og:description" content="${esc(NAMES[type] + " · Physical Science 8")}">` +
    `<meta property="og:image" content="${esc(image)}">` +
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` +
    `<meta property="og:image:alt" content="${esc(NAMES[type])}">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:image" content="${esc(image)}">`;

  // Classroom makes its thumbnail from a picture of the page, not only from og:image. So a preview program (or ?preview=1,
  // to see it) gets a page that is just the picture; students get the real Class Pass page.
  if (bot || url.searchParams.get("preview") === "1") {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(shown)}</title>` +
      `<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">${tags}` +
      `<style>html,body{margin:0;height:100%;background:#f4efe4}img{display:block;width:100vw;height:100vh;object-fit:cover}</style>` +
      `</head><body><img src="${esc(image)}" alt="${esc(NAMES[type])}"></body></html>`;
    return new Response(html, { headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY",
      "Content-Security-Policy": "frame-ancestors 'none'", "Referrer-Policy": "strict-origin-when-cross-origin", "Vary": "User-Agent" } });
  }

  const out = new HTMLRewriter()
    .on("title", { element(el) { if (title) el.setInnerContent(title + " (Class Pass)"); } })
    .on("head", { element(el) { el.append(tags, { html: true }); } })
    .transform(page);

  // the same headers _headers gives /pass/* (kept here too, in case a Function's answer doesn't get them)
  const res = new Response(out.body, out);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
