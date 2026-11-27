/* ============================================================
   The game's name in the lobby (Donny, 2026-11-27: "on the game screen I
   want to see the name of the game so if I accidentally click the wrong
   one, I can change it before we start").

   Each host page (live/, royale/, surge/, molehunt/) has an empty bar above
   its join box, <div class="hn-bar" data-pics="..."> (live.mjs nameBar), and
   calls IS8HostName.show(bar, info) each time its lobby is drawn:

     info = { kind, code, title, count, unit, flash, qset, players, end }

   The bar shows the game's picture and name and the set. Change game lists
   all six games: picking one ends this game (info.end) and opens the new
   game's settings page with the same set, so its own settings can be picked.
   Vocab Live, Blast and Match need a flashcard set.
   ============================================================ */
(function () {
  'use strict';

  var GAMES = [
    ['volley', 'Vocab Live'], ['blast', 'Blast'], ['match', 'Match'],
    ['royale', 'Battle Royale'], ['surge', 'Surge Showdown'], ['molehunt', 'Mole Hunt']
  ];
  var NAME = {};
  GAMES.forEach(function (g) { NAME[g[0]] = g[1]; });
  var FLASH_ONLY = { volley: true, blast: true, match: true };

  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pics(bar) {
    try { return JSON.parse(bar.getAttribute('data-pics')) || {}; } catch (e) { return {}; }
  }
  function picFor(bar, kind, cls) {
    var span = mk('span', cls);
    var src = pics(bar)[kind];
    if (src) {
      var img = mk('img');
      img.src = src;
      img.alt = '';
      span.appendChild(img);
    }
    return span;
  }

  // Every host page is one folder down from the app's top (live/, royale/...).
  function settingsPage(kind, info) {
    if (FLASH_ONLY[kind]) return '../live/?game=' + kind + '#' + encodeURIComponent(info.flash);
    return '../' + kind + '/' + (info.qset ? '#qset=' + encodeURIComponent(info.qset) : '#set=' + encodeURIComponent(info.flash || ''));
  }

  function show(bar, info) {
    if (!bar || !info || !NAME[info.kind]) return;
    bar._info = info;
    var key = [info.kind, info.code, info.title, info.count].join('|');
    if (info.code) document.title = NAME[info.kind] + ' · ' + info.code;
    bar.hidden = false;
    if (bar._key === key) return;
    bar._key = key;
    bar.textContent = '';
    bar.appendChild(picFor(bar, info.kind, 'hn-pic'));
    var text = mk('span', 'hn-text');
    text.appendChild(mk('span', 'hn-eyebrow', 'You are hosting'));
    text.appendChild(mk('strong', 'hn-name', NAME[info.kind]));
    if (info.title) {
      var count = info.count ? ' · ' + info.count + ' ' + (info.unit || (info.qset ? 'questions' : 'terms')) : '';
      text.appendChild(mk('span', 'hn-set', 'with ' + info.title + count));
    }
    bar.appendChild(text);
    var side = mk('span', 'hn-side');
    side.appendChild(mk('span', 'hn-wrong', 'Wrong game?'));
    var change = mk('button', 'btn secondary hn-change', 'Change game');
    change.type = 'button';
    change.addEventListener('click', function () { openChange(bar); });
    side.appendChild(change);
    bar.appendChild(side);
  }
  function hide(bar) { if (bar) bar.hidden = true; }

  function openChange(bar) {
    var info = bar._info;
    if (!info) return;
    var d = mk('dialog', 'fc-dialog hn-dialog');
    var h = mk('h2', 'fc-dialog-title', 'Change the game');
    h.id = 'hnDlgTitle';
    d.setAttribute('aria-labelledby', h.id);
    d.appendChild(h);
    var n = info.players || 0;
    d.appendChild(mk('p', 'fc-dialog-note', n
      ? n + (n === 1 ? ' student has' : ' students have') + ' joined. Changing the game ends this one, so they join again with the new game’s code.'
      : 'Pick the game you meant. You will see its settings with the same set, then get a new code.'));
    var grid = mk('div', 'hn-games');
    GAMES.forEach(function (g) {
      var kind = g[0];
      var now = kind === info.kind;
      var can = !now && (info.flash || !FLASH_ONLY[kind]);
      var b = mk('button', 'hn-game' + (now ? ' on' : ''));
      b.type = 'button';
      b.disabled = !can;
      b.appendChild(picFor(bar, kind, 'hn-game-pic'));
      var t = mk('span', 'hn-game-text');
      t.appendChild(mk('strong', null, g[1]));
      if (now) t.appendChild(mk('small', null, 'Playing now'));
      else if (!can) t.appendChild(mk('small', null, 'Needs a flashcard set'));
      b.appendChild(t);
      b.addEventListener('click', function () {
        grid.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        b.classList.add('on');
        var go = function () { location.href = settingsPage(kind, info); };
        try { Promise.resolve(info.end && info.end()).then(function () { setTimeout(go, 200); }, go); } catch (e) { go(); }
      });
      grid.appendChild(b);
    });
    d.appendChild(grid);
    var row = mk('div', 'fx-dialog-actions');
    var keep = mk('button', 'btn secondary fc-small', 'Keep ' + NAME[info.kind]);
    keep.type = 'button';
    keep.addEventListener('click', function () { d.close(); });
    row.appendChild(keep);
    d.appendChild(row);
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () { d.remove(); });
    document.body.appendChild(d);
    d.showModal();
    keep.focus();
  }

  // Ends a game through its host connection and waits for the message to leave.
  function closeVia(ws) {
    return new Promise(function (done) {
      if (!ws || ws.readyState !== 1) { done(); return; }
      try { ws.send(JSON.stringify({ t: 'close' })); } catch (e) { done(); return; }
      var tries = 0;
      (function wait() {
        if (ws.bufferedAmount === 0 || tries++ > 20) done();
        else setTimeout(wait, 50);
      })();
    });
  }

  window.IS8HostName = { show: show, hide: hide, name: function (k) { return NAME[k] || ''; }, closeVia: closeVia, settingsPage: settingsPage };
})();
