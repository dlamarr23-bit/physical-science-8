// Builds the review pages (flashcards, live games, Class Pass, the leaderboard) into the physical science site's
// app/ folder, and the site's server into /_worker.js and /_routes.json at the top of the site.
// No packages needed: node app-source/build.mjs (from the top of the repository, or node build.mjs in this folder).
// Run it after changing content/site.mjs, lib/*.mjs, server/*.js or any file in app/assets/, then push.
// The sets are not in here: they are saved on Cloudflare (KV) from the Review page, so they never need a rebuild.
//
// These pages were the vocabulary site (vocabulary-room901.pages.dev) until 2026-11-19, when Donny moved everything
// into physical-science-8. The site's own pages show them in a frame under its top bar: /flashcards (Review),
// /join (Join a game) and /leaderboard. So every page here lives at /app/<its old address>.
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { site } from './content/site.mjs';
import { iconsScript } from './lib/icons.mjs';
import { esc } from './lib/render.mjs';
import { renderEditMoved, renderFlashcardIndex, renderOwnSetShell, defaultLibrary, renderDrawTest } from './lib/flashcards.mjs';
import { renderLiveHost, renderLiveJoin } from './lib/live.mjs';
import { renderRoyaleHost, renderRoyalePlay, renderQuestionSetPage } from './lib/royale.mjs';
import { renderSurgeHost, renderSurgePlay } from './lib/surge.mjs';
import { renderMoleHost, renderMolePlay, renderMoleRemote } from './lib/molehunt.mjs';
import { renderLeaderboard, renderSignIn, renderBridge } from './lib/leaderboard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const OUT = join(ROOT, 'app');

// Keep assets, replace every generated page.
for (const entry of existsSync(OUT) ? readdirSync(OUT) : []) {
  if (entry === 'assets') continue;
  rmSync(join(OUT, entry), { recursive: true, force: true });
}
mkdirSync(OUT, { recursive: true });

const write = (rel, body, base = OUT) => {
  const file = join(base, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
};

// /app/ itself opens the Review page.
write('index.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=/flashcards">
<title>${esc(site.title)}</title>
</head>
<body><p><a href="/flashcards">Open the Review page</a></p></body>
</html>
`);
write('assets/icons.js', iconsScript);

// No starter sets: the library begins empty and the teacher fills it.
const library = defaultLibrary([], [], {});
write('assets/flashcard-library.json', JSON.stringify(library) + '\n');
write('assets/flashcard-sets.json', '[]\n');
write('assets/glossary.json', '[]\n');
write('flashcards/index.html', renderFlashcardIndex([], library));
write('flashcards/my/set/index.html', renderOwnSetShell([]));
write('flashcards/draw-test/index.html', renderDrawTest([]));
write('edit/index.html', renderEditMoved());
write('live/index.html', renderLiveHost([], [], {}));
write('join/index.html', renderLiveJoin([]));
write('royale/index.html', renderRoyaleHost([]));
write('flashcards/questions/index.html', renderQuestionSetPage([]));
write('royale/play/index.html', renderRoyalePlay([]));
// Surge Showdown (Donny, 2026-11-04: moved here from its own site).
write('surge/index.html', renderSurgeHost([]));
write('surge/play/index.html', renderSurgePlay([]));
// Mole Hunt (Donny, 2026-11-15): the teacher's screen, the students' screen and the Teacher Remote.
write('molehunt/index.html', renderMoleHost([]));
write('molehunt/play/index.html', renderMolePlay([]));
write('molehunt/remote/index.html', renderMoleRemote([]));
write('leaderboard/index.html', renderLeaderboard());
write('signin/index.html', renderSignIn());
write('bridge/index.html', renderBridge());

// The server (Cloudflare Pages runs /_worker.js, and then no functions/ folder): the Class Pass link previews
// (server/pass-preview.js, which was functions/pass/index.js) in front of server/worker.js, with this site's name.
const preview = readFileSync(join(here, 'server/pass-preview.js'), 'utf8');
const server = readFileSync(join(here, 'server/worker.js'), 'utf8')
  .split("' | __SITE_TITLE__'").join(JSON.stringify(' | ' + site.title));
// The preview's names stay inside its own block, so they never clash with the worker's.
write('_worker.js', '// Built by app-source/build.mjs from app-source/server/pass-preview.js and app-source/server/worker.js. Edit those, not this.\n\n' +
  'const passPreview = (() => {\n' + preview + '\nreturn passPreview;\n})();\n\n' + server, ROOT);
write('_routes.json', JSON.stringify({
  version: 1,
  include: ['/api/*', '/app/flashcards', '/app/flashcards/*', '/app/live', '/app/live/*', '/pass', '/pass/', '/app-source/*', '/game-server/*'],
  exclude: []
}, null, 2) + '\n', ROOT);
// The headers for /app/* (only this site may frame these pages, and search engines skip them) are in the site's
// _headers, which class-tools publishes (class-pass/_headers there), so they are not written here.

console.log(`Built the review pages into app/, and _worker.js and _routes.json.`);
