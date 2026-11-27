/* ============================================================
   Battle Royale: the teacher's screen (royale/), Donny 2026-10-29.

   Setup: pick a question set (or a flashcard set), the starting HP, how many
   students face off at once, the time per question and an optional game
   clock. Question sets are made here: import a Wayground quiz or a Google
   Sheet by its link, paste rows, or open a file; they are kept on the site
   (/api/qsets) for next time. Answers can have pictures (the Google Sheets
   template has a picture column for the question and every answer). In the
   editor every question is a card with its pictures: Show all, Edit, Delete
   and Add a question, with pictures pasted, dropped, uploaded or searched
   for (Donny, 2026-11-26).

   Then the board: the join code, the students and their heroes, and each
   round as it happens (the groups, the question, the results), with the
   round's highlights down the left side. The clock and the group size can be
   changed at any time, so a game always ends with a winner before the bell.

   The game itself runs on the game server (game-server/src/royale.js).
   Address extras from the Host a game page: #qset=<id> or #set=<id> picks
   that set, #new opens a new question set.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var ED = window.IS8Editor;
  var AV = window.SuperAvatars;
  var STEPS = ['rbGate', 'rbSetup', 'rbLobby', 'rbPlay', 'rbDone'];
  var COLORS = ['#e8590c', '#1c7ed6', '#2f9e44', '#e03131'];
  // The Google Sheets template Surge Showdown uses (Make a copy), and the same
  // template as a file for Excel.
  var TEMPLATE = 'https://docs.google.com/spreadsheets/d/1id9tjF6A5Ua9x3r4QxDGTu7DRMpviwWUOj8LGmud1eU/copy';
  var ws = null, game = null, board = null, leaving = false, retries = 0, pingTimer = null, qrFor = '', skew = null;

  // The body names the step showing, so the game screens can fill the whole screen (royale.css).
  document.body.classList.add('rb-body');
  function show(id) {
    STEPS.forEach(function (s) { $(s).hidden = s !== id; });
    document.body.setAttribute('data-rb-step', id);
  }
  function status(text) { $('rbStatus').textContent = text || ''; }
  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function toast(text) {
    var t = $('rbToast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function readSaved() {
    try { return JSON.parse(localStorage.getItem('is8-royale-v1')) || {}; } catch (e) { return {}; }
  }
  function writeSaved(v) {
    try { localStorage.setItem('is8-royale-v1', JSON.stringify(v)); } catch (e) { /* private window */ }
  }
  function keep(fn) { var s = readSaved(); fn(s); writeSaved(s); }

  function call(path, method, body) {
    var headers = { 'X-IS8-Editor': '1' };
    if (body) headers['content-type'] = 'application/json';
    return fetch('/api/' + path, { method: method || 'GET', headers: headers, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (d) {
          if (!res.ok || !d) {
            var err = new Error((d && d.error) || 'The site did not answer. Check the internet connection and try again.');
            err.data = d || {};
            throw err;
          }
          return d;
        });
      });
  }

  /* ---------------- hero pictures and HP ---------------- */

  var heroByKey = {};
  (AV ? AV.list : []).forEach(function (h) { heroByKey[h.key] = h; });
  var heroSrc = {};
  var NO_HERO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="16" y="28" width="168" height="164" rx="30" fill="#c5c9d6"/><text x="100" y="135" font-family="Arial" font-weight="700" font-size="80" fill="#fff" text-anchor="middle">?</text></svg>');
  // Each picture is its own little image, so the same hero can show twice.
  function heroURL(key) {
    if (!heroByKey[key]) return NO_HERO;
    if (!heroSrc[key]) heroSrc[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(AV.render(heroByKey[key]));
    return heroSrc[key];
  }
  // An eliminated student's hero is grayed out.
  function heroImg(key, cls, gone) {
    var img = mk('img', 'rb-hero' + (cls ? ' ' + cls : '') + (gone ? ' gray' : ''));
    img.alt = heroByKey[key] ? heroByKey[key].name : '';
    img.src = heroURL(key);
    return img;
  }
  // HP as hearts (a number past 6).
  function hearts(n, of) {
    var box = mk('span', 'rb-hp');
    box.setAttribute('aria-label', n + ' HP');
    box.title = n + ' HP';
    if (of > 6 || n > 6) { box.textContent = '❤️ ' + n; return box; }
    for (var i = 0; i < Math.max(n, of || 0); i++) box.appendChild(mk('span', i < n ? 'on' : 'off', '❤️'));
    return box;
  }
  function secs(ms) { return (ms / 1000).toFixed(2) + 's'; }
  function ordinal(n) { var t = n % 100, o = n % 10; return n + (t > 10 && t < 14 ? 'th' : o === 1 ? 'st' : o === 2 ? 'nd' : o === 3 ? 'rd' : 'th'); }

  $('rbTemplate').href = TEMPLATE;

  /* ---------------- getting in ---------------- */

  function gate() {
    if (!ED) { $('rbGateText').textContent = 'This page did not load properly. Reload it to try again.'; return; }
    ED.session().then(function (s) {
      if (!s.cloud) $('rbGateText').textContent = 'Saving to the site is not switched on, so games cannot run yet.';
      else if (!s.live) $('rbGateText').textContent = 'Games need one more Cloudflare setting. The steps are in the README, steps 4 and 5.';
      else if (!s.editor) {
        ED.forgetHint();
        $('rbGateText').textContent = 'Only your teacher can host a game. Teacher: sign in with the teacher password.';
        ED.signInForm($('rbSignIn'), function () { $('rbSignIn').textContent = ''; setup(); });
      } else {
        ED.rememberHint();
        setup();
      }
    });
  }

  var qsets = [], flashSets = [];
  var DEFAULT_SELECTS = ['rbEnergy', 'rbSize', 'rbSeconds', 'rbClock'];
  var DEFAULT_CHECKS = ['rbComeback', 'rbShield'];

  /* ---------------- a question set's own page (Donny, 2026-11-27) ----------------
     flashcards/questions/#<id> (#new&folder=<f> for a new one in a folder) is
     this page with only the question set editor showing, under the set's
     name, its Review folder and the three games that play it. */
  var QPAGE = !!document.querySelector('[data-qpage]');
  var qFolder = '';
  function qpageSetup() {
    show('rbSetup');
    var hash = location.hash;
    var id = (hash.match(/^#(q[0-9a-f]{10})\b/) || [])[1] || '';
    qFolder = (hash.match(/[#&]folder=(f-[a-z0-9-]+)/) || [])[1] || '';
    $('rbEdCancel').textContent = 'Back to Review';
    qpageHead(id);
    openEditor(id);
    loadQsets(id).then(function () { qpageHead(id); });
  }
  function qpageHead(id) {
    var s = qsets.filter(function (x) { return x.id === id; })[0];
    if (s && s.folder) qFolder = s.folder;
    var title = s ? s.title : (id ? 'Question set' : 'New question set');
    $('rbQTitle').textContent = title;
    $('rbQMeta').textContent = s ? s.count + (s.count === 1 ? ' question' : ' questions') + ' ·' : (id ? '' : 'Not saved yet ·');
    document.title = title + ' | ' + document.title.split(' | ').slice(-1)[0];
    $('rbQPlay').hidden = !s;
    ['royale', 'surge', 'molehunt'].forEach(function (k) { $('rbQGo-' + k).href = '../../' + k + '/#qset=' + encodeURIComponent(id); });
    $('rbQFolder').href = '../' + (qFolder ? '#folder-' + qFolder : '');
    $('rbQFolderBit').hidden = true;
    if (qFolder && ED && ED.library) {
      ED.library().then(function (lib) {
        var f = (lib.folders || []).filter(function (x) { return x.id === qFolder; })[0];
        if (!f) return;
        $('rbQFolder').textContent = f.name;
        $('rbQFolderBit').hidden = false;
      }, function () { /* the folder name is only a nicety */ });
    }
  }
  function backToReview() { location.href = '../' + (qFolder ? '#folder-' + qFolder : ''); }
  // Another set's address typed in (or Back to one) opens that set.
  if (QPAGE) window.addEventListener('hashchange', function () { location.reload(); });

  function setup() {
    if (QPAGE) { qpageSetup(); return; }
    show('rbSetup');
    musicFor('');
    var saved = readSaved();
    var d = saved.defaults;
    if (d) {
      DEFAULT_SELECTS.forEach(function (id) { if (d[id]) $(id).value = d[id]; });
      DEFAULT_CHECKS.forEach(function (id) { if (typeof d[id] === 'boolean') $(id).checked = d[id]; });
      if (d.source) document.querySelector('input[name="rbSource"][value="' + d.source + '"]').checked = true;
      if (d.who === 'guests') document.querySelector('input[name="rbWho"][value="guests"]').checked = true;
    }
    // The class periods from the Leaderboard page; the last one picked first.
    if (window.IS8Roster) window.IS8Roster.fillPeriods($('rbPeriod'), window.IS8Roster.last());
    $('rbSaveDefault').checked = !!d;
    // From the Host a game page: the set picked there.
    var hash = location.hash;
    var wantQ = (hash.match(/[#&]qset=([\w-]+)/) || [])[1] || (d && d.qset);
    var wantF = (hash.match(/[#&]set=([\w-]+)/) || [])[1] || (d && d.flash);
    if (/[#&]qset=/.test(hash)) document.querySelector('input[name="rbSource"][value="qset"]').checked = true;
    if (/[#&]set=/.test(hash)) document.querySelector('input[name="rbSource"][value="flash"]').checked = true;
    syncSource();
    if (saved.host && Date.now() - saved.host.at < 6 * 60 * 1000) {
      $('rbResumeText').textContent = 'Your game ' + saved.host.code + ' may still be running.';
      $('rbResume').hidden = false;
    }
    loadQsets(wantQ);
    call('sets').then(function (r) {
      flashSets = (r.list || []).filter(function (s) { return s && s.id; });
      var sel = $('rbFlash');
      sel.textContent = '';
      flashSets.forEach(function (s) {
        var o = mk('option', '', s.title + (s.count ? ' (' + s.count + ' terms)' : ''));
        o.value = s.id;
        sel.appendChild(o);
      });
      if (wantF && flashSets.some(function (s) { return s.id === wantF; })) sel.value = wantF;
    }, function () { /* the flashcard list is only needed for that choice */ });
    if (/[#&]new\b/.test(hash)) openEditor('');
  }

  function loadQsets(want) {
    return call('qsets').then(function (r) {
      qsets = r.sets || [];
      var sel = $('rbQset');
      var was = want || sel.value;
      sel.textContent = '';
      if (!qsets.length) {
        var none = mk('option', '', 'No question sets yet: click New set');
        none.value = '';
        sel.appendChild(none);
      }
      qsets.forEach(function (s) {
        var o = mk('option', '', s.title + ' (' + s.count + (s.count === 1 ? ' question)' : ' questions)'));
        o.value = s.id;
        sel.appendChild(o);
      });
      if (was && qsets.some(function (s) { return s.id === was; })) sel.value = was;
      $('rbQsetEdit').disabled = $('rbQsetDelete').disabled = $('rbQsetCsv').disabled = !qsets.length;
      $('rbQsetMerge').disabled = qsets.length < 2;
      $('rbQsetNote').textContent = qsets.length ? '' : 'Make your first set with New set. You can import a Wayground, Kahoot, Blooket or Gimkit quiz, or a Google Sheet.';
      fillAddSets();
    }, function (err) { $('rbQsetNote').textContent = err.message; });
  }

  function source() { var r = document.querySelector('input[name="rbSource"]:checked'); return r ? r.value : 'qset'; }
  function syncSource() {
    var q = source() === 'qset';
    $('rbQsetRow').hidden = !q;
    $('rbQsetNote').hidden = !q;
    $('rbFlashRow').hidden = q;
    $('rbFlashNote').hidden = q;
  }
  [].forEach.call(document.querySelectorAll('input[name="rbSource"]'), function (r) { r.addEventListener('change', syncSource); });

  /* ---------------- making a question set ---------------- */

  // Rows from a paste or a file: tabs (Google Sheets), commas (a .csv file,
  // with "quoted" cells) or " | " between the parts.
  function rows(text) {
    text = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    if (text.indexOf('\t') >= 0) return splitQuoted(text, '\t');
    // A CSV from Download CSV (its top row starts "Question,").
    if (/^"?question"?,/i.test(text)) return splitQuoted(text, ',');
    if (/ \| /.test(text)) return text.split('\n').map(function (l) { return l.split('|').map(function (c) { return c.trim(); }); });
    if (text.indexOf(',') >= 0) return splitQuoted(text, ',');
    return text.split('\n').map(function (l) { return [l.trim()]; });
  }
  // Spreadsheet text: a cell in "quotes" may hold the separator, a line
  // break, or "" for a quote mark.
  function splitQuoted(text, sep) {
    var out = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"' && cell === '') q = true;
      else if (ch === sep) { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n') { row.push(cell.trim()); out.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    row.push(cell.trim());
    out.push(row);
    return out;
  }

  // Pictures, as Surge Showdown reads them: a picture column, an
  // [img: link] tag in any cell, or a bare picture link. A Google Drive share
  // link becomes a picture link.
  var IMG_TAG = /\[img:\s*([^\]\s]+)\s*\]/i;
  // An empty question or right answer in an unfinished line, written so the
  // cells after it keep their places (questionRows).
  var BLANK = '[blank]';
  function fixImg(u) {
    u = String(u || '').trim();
    var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/i);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000' : u;
  }
  function splitImg(cell) {
    var t = String(cell == null ? '' : cell).trim(), img = '', bare = false;
    var m = t.match(IMG_TAG);
    if (m) { img = m[1]; t = t.replace(IMG_TAG, '').trim(); }
    else if (t.toLowerCase() === BLANK) t = '';
    else if (/^https?:\/\/\S+$/i.test(t) && (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|#|$)/i.test(t) || /drive\.google\.com|googleusercontent\.com|imgur\.com|wikimedia\.org|unsplash\.com|quizizz\.com|wayground\.com/i.test(t))) { img = t; t = ''; bare = true; }
    return { t: t, img: fixImg(img), bare: bare };
  }
  // A top row of labels (the template's: Question, Question Image, Correct
  // Answer, Correct Image, Wrong Answer 1, Wrong 1 Image ...): what each column holds.
  function headerRoles(row) {
    var cells = row.map(function (c) { return String(c || '').trim().toLowerCase(); });
    if (!cells.some(function (c) { return /^question/.test(c); })) return null;
    // Every cell of a top row is a short label, so a question that starts
    // with the word "Question" is not taken for one (Donny, 2026-11-26).
    var labels = cells.filter(Boolean);
    if (labels.length < 2 || !labels.every(function (c) { return c.length <= 40 && /question|answer|correct|right|wrong|incorrect|option|distractor|choice|image|picture|img|photo|pic\b|time|type|#/.test(c); })) return null;
    var w = -1;
    return cells.map(function (c) {
      var pic = /image|picture|img|photo|pic\b/.test(c);
      if (/^question/.test(c)) return pic ? ['qImg'] : ['q'];
      if (/correct|right answer/.test(c) && !/incorrect/.test(c)) return pic ? ['cImg'] : ['correct'];
      if (/wrong|incorrect|distractor|option|answer/.test(c)) {
        if (pic) return ['wImg', Math.max(0, w)];
        w++;
        return ['wrong', w];
      }
      return null;
    });
  }

  // Questions from the rows. A Wayground or Blooket spreadsheet (numbered
  // options and the right one's number) is read by its top row; so is the
  // template; otherwise the columns are question, right answer, then up to 3
  // wrong answers. Each question: q, img, a, ai, w, wi.
  // items is every line in order, { x, ok, line }: a line the game cannot use
  // yet (no wrong answer, say) is there too, as a card to finish or delete.
  // skipped is the lines left out on purpose (not multiple choice).
  function parse(text) {
    var list = rows(text).filter(function (r) { return r.some(function (c) { return c; }); });
    var head = -1, cols = null;
    for (var i = 0; i < Math.min(3, list.length); i++) {
      var low = list[i].map(function (c) { return c.toLowerCase(); });
      var qi = low.findIndex(function (c) { return /question text|^question$/.test(c); });
      var opts = [];
      low.forEach(function (c, j) { if (/^(option|answer) ?\d/.test(c)) opts.push(j); });
      var right = low.findIndex(function (c) { return /^correct answer\(?s?\)?($|\s*\(only)/.test(c) || c === 'correct answer'; });
      var numbered = right >= 0 && list.slice(i + 1, i + 4).some(function (r) { return /^\d+([,;]\s*\d+)*$/.test(String(r[right] || '').trim()); });
      if (qi >= 0 && opts.length >= 2 && numbered) {
        head = i;
        cols = { q: qi, opts: opts, right: right, type: low.findIndex(function (c) { return /question type/.test(c); }), img: low.findIndex(function (c) { return /image/.test(c); }) };
        break;
      }
    }
    var questions = [], skipped = [], items = [], roles = null;
    var take = function (x, line) {
      var w = [], wi = [];
      x.w.forEach(function (t, j) {
        var p = x.wi[j] || '';
        if ((!t && !p) || w.length >= 3 || (t && t.toLowerCase() === (x.a || '').toLowerCase())) return;
        w.push(t || '');
        wi.push(p);
      });
      var one = { q: x.q || '', img: x.img || '', a: x.a || '', ai: x.ai || '', w: w, wi: wi };
      var ok = !!((one.q || one.img) && (one.a || one.ai) && w.length);
      items.push({ x: one, ok: ok, line: line });
      if (ok) questions.push(one);
    };
    list.forEach(function (raw, i) {
      if (i <= head) return;
      var r = raw.map(function (c) { return String(c == null ? '' : c).trim(); });
      if (cols) {
        if (cols.type >= 0 && r[cols.type] && !/multiple|checkbox/i.test(r[cols.type])) { skipped.push(i + 1); return; }
        var options = cols.opts.map(function (j) { return splitImg(r[j] || ''); });
        var n = parseInt(String(r[cols.right] || '').split(/[,;]/)[0], 10);
        var qf = splitImg(r[cols.q] || '');
        var good = options[n - 1] || { t: '', img: '' };
        var rest = options.filter(function (o, j) { return (o.t || o.img) && j !== n - 1; });
        take({ q: qf.t, img: (cols.img >= 0 && r[cols.img] ? fixImg(r[cols.img]) : '') || qf.img, a: good.t, ai: good.img,
          w: rest.map(function (o) { return o.t; }), wi: rest.map(function (o) { return o.img; }) }, i + 1);
        return;
      }
      var hr = headerRoles(r);
      if (hr) { roles = hr; return; }
      // Gimkit's template has rows of instructions; its picture links say gimkit too, so links do not count.
      if (/gimkit/i.test(String(r[0]).replace(IMG_TAG, '').replace(/https?:\/\/\S+/g, '')) || /^(example|instructions?)\b/i.test(r[0])) return;
      var x = { q: '', img: '', a: '', ai: '', w: [], wi: [] };
      if (roles) {
        r.forEach(function (cell, j) {
          var role = roles[j];
          if (!role || !cell) return;
          var f = splitImg(cell);
          if (role[0] === 'q') { x.q = f.t; if (f.img) x.img = f.img; }
          else if (role[0] === 'qImg') x.img = fixImg(cell);
          else if (role[0] === 'correct') { x.a = f.t; if (f.img) x.ai = f.img; }
          else if (role[0] === 'cImg') x.ai = fixImg(cell);
          else if (role[0] === 'wrong') { x.w[role[1]] = f.t; if (f.img) x.wi[role[1]] = f.img; }
          else if (role[0] === 'wImg') x.wi[role[1]] = fixImg(cell);
        });
        var n2 = Math.max(x.w.length, x.wi.length);
        var w = [], wi = [];
        for (var k = 0; k < n2; k++) if (x.w[k] || x.wi[k]) { w.push(x.w[k] || ''); wi.push(x.wi[k] || ''); }
        x.w = w;
        x.wi = wi;
      } else {
        // Plain columns: a bare picture link goes with the cell before it.
        var fields = [];
        r.forEach(function (cell) {
          if (!cell) return;
          var f = splitImg(cell);
          if (f.bare && fields.length && !fields[fields.length - 1].img) fields[fields.length - 1].img = f.img;
          else fields.push(f);
        });
        if (!fields.length) return;
        if (fields.length < 2) { take({ q: fields[0].t, img: fields[0].img, a: '', ai: '', w: [], wi: [] }, i + 1); return; }
        x = { q: fields[0].t, img: fields[0].img, a: fields[1].t, ai: fields[1].img,
          w: fields.slice(2).map(function (f) { return f.t; }), wi: fields.slice(2).map(function (f) { return f.img; }) };
      }
      if (/^question$/i.test(x.q)) return;
      take(x, i + 1);
    });
    return { questions: questions, skipped: skipped, items: items };
  }

  // Questions as lines for the box, a tab between cells, pictures as [img: link].
  function cellText(c) { c = String(c == null ? '' : c); return /[\t\n"]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }
  function withPic(t, img) { return [t || '', img ? '[img: ' + img + ']' : ''].filter(Boolean).join(' '); }
  function questionRows(list) {
    return list.map(function (x) {
      var w = (x.w || []).map(function (t, i) { return withPic(t, (x.wi || [])[i]); }).filter(Boolean);
      var cells = [withPic(x.q, x.img) || BLANK, withPic(x.a, x.ai) || BLANK].concat(w);
      while (cells.length > 1 && cells[cells.length - 1] === BLANK) cells.pop();
      return cells.map(cellText).join('\t');
    }).join('\n');
  }
  function sheetRows(list) { return list.map(function (r) { return r.map(cellText).join('\t'); }).join('\n'); }

  var editing = '';
  function openEditor(id) {
    editing = id || '';
    $('rbEditorTitle').textContent = id ? 'Edit question set' : 'New question set';
    $('rbEdError').textContent = '';
    $('rbEdName').value = '';
    $('rbEdText').value = '';
    $('rbEdLink').value = '';
    warnedSave = '';
    $('rbImportHelp').hidden = true;
    $('rbEditor').hidden = false;
    fillAddSets();
    preview();
    // On a question set's own page the editor is already the page; its name and games stay in view.
    if (!QPAGE) $('rbEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!id) { $('rbEdName').focus({ preventScroll: QPAGE }); return; }
    $('rbEdCount').textContent = 'Opening...';
    call('qsets/' + id).then(function (s) {
      $('rbEdName').value = s.title;
      $('rbEdText').value = questionRows(s.questions);
      preview();
    }, function (err) { $('rbEdError').textContent = err.message; });
  }
  /* ---------------- the question cards (Donny, 2026-11-26) ----------------
     Every question in the box is a card with its pictures (the question's
     big). Show all opens the whole list; each card has Edit and Delete, and
     Add a question makes a new one. A picture can be pasted (Ctrl+V) or
     dropped on any line, uploaded, found with a picture search, or come from
     a web address; it is copied to this site like a flashcard's picture.
     The box above is still what is saved: a card's change is written back
     into it as rows. A line the game cannot use yet (no wrong answer, say)
     is a red card to finish or delete, so nothing pasted is lost. */

  var SHOW_FIRST = 4;
  var edItems = [], cardsAll = !!readSaved().showAll, openForm = null, warnedSave = '';

  function picImg(src, cls) {
    var i = mk('img', cls);
    i.alt = '';
    i.loading = 'lazy';
    i.referrerPolicy = 'no-referrer';
    i.title = 'Click to see it bigger';
    i.addEventListener('error', function () {
      var bad = mk('span', 'rb-pic-bad', 'Picture did not load');
      bad.title = src;
      if (i.parentNode) i.parentNode.replaceChild(bad, i);
    });
    i.addEventListener('click', function () { zoomPic(src); });
    i.src = src;
    return i;
  }
  function zoomPic(src) {
    var d = $('rbPicZoom');
    if (!d) {
      d = mk('dialog', 'rb-zoom');
      d.id = 'rbPicZoom';
      d.addEventListener('click', function () { d.close(); });
      document.body.appendChild(d);
    }
    d.textContent = '';
    var im = mk('img');
    im.alt = 'The picture, bigger';
    im.referrerPolicy = 'no-referrer';
    im.src = src;
    d.appendChild(im);
    d.appendChild(mk('p', 'rb-zoom-note', 'Click anywhere to close it.'));
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }

  function preview() {
    var r = parse($('rbEdText').value);
    edItems = r.items;
    var n = r.questions.length, bad = r.items.length - n;
    var t = [];
    if (n) t.push(n + (n === 1 ? ' question' : ' questions'));
    if (bad) t.push(bad + (bad === 1 ? ' is' : ' are') + ' not finished yet (the red ' + (bad === 1 ? 'card' : 'cards') + ' below)');
    if (r.skipped.length) t.push('Skipped line' + (r.skipped.length === 1 ? ' ' : 's ') + r.skipped.slice(0, 8).join(', ') + (r.skipped.length > 8 ? '...' : '') + ' (not multiple choice)');
    $('rbEdCount').textContent = t.length ? t.join('. ') + '.' : '';
    drawCards();
    return r;
  }
  // A change from the cards, back into the box.
  function writeItems(list) {
    $('rbEdText').value = questionRows(list);
    warnedSave = '';
    return preview();
  }
  function itemList() { return edItems.map(function (it) { return it.x; }); }
  function cardAt(i) { return $('rbEdPreview').querySelector('.rb-pq[data-i="' + i + '"]'); }

  function drawCards() {
    openForm = null;
    var box = $('rbEdPreview');
    box.textContent = '';
    var upTo = cardsAll ? edItems.length : Math.min(edItems.length, SHOW_FIRST);
    for (var i = 0; i < upTo; i++) box.appendChild(card(edItems[i], i));
    var foot = mk('div', 'rb-pq-foot');
    if (edItems.length > SHOW_FIRST) {
      var more = mk('button', 'btn secondary fc-small rb-pq-more', cardsAll ? 'Show only the first ' + SHOW_FIRST : 'Show all ' + edItems.length + ' questions');
      more.type = 'button';
      more.setAttribute('aria-expanded', String(cardsAll));
      more.addEventListener('click', function () {
        if (!leaveForm()) return;
        cardsAll = !cardsAll;
        keep(function (s) { s.showAll = cardsAll; });
        drawCards();
        var again = box.querySelector('.rb-pq-more');
        if (!cardsAll) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
        if (again) again.focus({ preventScroll: !cardsAll });
      });
      foot.appendChild(more);
    }
    var add = mk('button', 'btn fc-small rb-pq-add', '+ Add a question');
    add.type = 'button';
    add.addEventListener('click', addCard);
    foot.appendChild(add);
    box.appendChild(foot);
  }

  function card(it, i) {
    var x = it.x;
    var c = mk('div', 'rb-pq' + (it.ok ? '' : ' bad'));
    c.setAttribute('data-i', i);
    var head = mk('div', 'rb-pq-head');
    head.appendChild(mk('p', 'rb-pq-q', (i + 1) + '. ' + (x.q || (x.img ? '' : '(no question yet)'))));
    var btns = mk('div', 'rb-pq-btns');
    var ed = mk('button', 'btn secondary fc-small rb-pq-edit', 'Edit');
    ed.type = 'button';
    ed.setAttribute('aria-label', 'Edit question ' + (i + 1));
    ed.addEventListener('click', function () { editCard(i); });
    var del = mk('button', 'btn secondary fc-small rb-danger', 'Delete');
    del.type = 'button';
    del.setAttribute('aria-label', 'Delete question ' + (i + 1));
    del.addEventListener('click', function () { sureThen(del, 'Delete', function () { removeItem(i); }); });
    btns.appendChild(ed);
    btns.appendChild(del);
    head.appendChild(btns);
    c.appendChild(head);
    if (x.img) {
      var qp = mk('div', 'rb-pq-qpic');
      qp.appendChild(picImg(x.img, 'rb-pq-pic'));
      c.appendChild(qp);
    }
    var ans = mk('div', 'rb-pq-a');
    var one = function (cls, mark, said, t, img) {
      var s = mk('span', 'rb-pq-opt ' + cls);
      var m = mk('span', 'rb-pq-mark', mark);
      m.setAttribute('aria-hidden', 'true');
      s.appendChild(m);
      s.appendChild(mk('span', 'rb-sr', said));
      if (t) s.appendChild(mk('span', '', t));
      if (img) s.appendChild(picImg(img, 'rb-pq-apic'));
      ans.appendChild(s);
    };
    if (x.a || x.ai) one('rb-ok', '✔', 'Right answer: ', x.a, x.ai);
    x.w.forEach(function (w, j) { one('rb-no', '✖', 'Wrong answer: ', w, x.wi[j]); });
    c.appendChild(ans);
    if (!it.ok) c.appendChild(mk('p', 'rb-pq-warn', 'Not in the game yet: it needs ' + needs(x) + '. Click Edit to finish it, or Delete.'));
    return c;
  }
  function needs(x) {
    var n = [];
    if (!x.q && !x.img) n.push('a question');
    if (!x.a && !x.ai) n.push('a right answer');
    if (!x.w.length) n.push('a wrong answer');
    return n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0];
  }
  // A button that asks "Click again" first, like Delete for a whole set.
  function sureThen(btn, label, fn) {
    if (!btn.classList.contains('sure')) {
      btn.classList.add('sure');
      btn.textContent = 'Click again to delete';
      setTimeout(function () { btn.classList.remove('sure'); btn.textContent = label; }, 3000);
      return;
    }
    fn();
  }
  function removeItem(i) {
    if (openForm && openForm.index !== i && !leaveForm()) return;
    var list = itemList();
    list.splice(i, 1);
    writeItems(list);
    var near = cardAt(Math.min(i, edItems.length - 1));
    if (near) near.querySelector('.rb-pq-edit').focus({ preventScroll: true });
    toast('Deleted question ' + (i + 1) + '. Click Save set to keep the change.');
  }

  function editCard(i) {
    if (openForm && openForm.index === i) { openForm.focus(); return; }
    if (!leaveForm()) return;
    var c = cardAt(i);
    if (!c) return;
    var f = questionForm(edItems[i].x, i);
    c.parentNode.replaceChild(f.node, c);
    openForm = f;
    f.focus();
  }
  function addCard() {
    if (openForm && openForm.index < 0) { openForm.focus(); return; }
    if (!leaveForm()) return;
    var box = $('rbEdPreview');
    var f = questionForm(null, -1);
    box.insertBefore(f.node, box.querySelector('.rb-pq-foot'));
    openForm = f;
    f.focus();
  }
  // Leaving the open card (for another card, Save set, an import...): with
  // no change it just closes; a change is kept when the question is complete;
  // otherwise it stays open and says what is missing.
  function leaveForm() {
    if (!openForm) return true;
    if (!openForm.changed()) { drawCards(); return true; }
    return openForm.apply(false);
  }

  // One question's form: the question, the right answer and 3 wrong answers,
  // each with its own picture.
  function questionForm(x, index) {
    x = x || { q: '', img: '', a: '', ai: '', w: [], wi: [] };
    var node = mk('div', 'rb-qf');
    var name = index < 0 ? 'New question' : 'Question ' + (index + 1);
    node.setAttribute('role', 'group');
    node.setAttribute('aria-label', name);
    node.appendChild(mk('p', 'rb-qf-title', name));
    node.appendChild(mk('p', 'rb-qf-tip', 'To add a picture, click + Picture, or paste one (Ctrl+V) in a box, or drop one on a line.'));
    var lines = [], pending = 0;
    var msg = mk('p', 'rb-qf-msg');
    msg.setAttribute('role', 'status');
    function say(t, bad) { msg.textContent = t || ''; msg.classList.toggle('bad', !!bad); }

    function addLine(kind, label, text, img) {
      var L = { kind: kind, label: label, img: img || '', busy: false, picker: null };
      var row = mk('div', 'rb-qf-row rb-qf-' + kind);
      var lab = mk('label', 'rb-qf-field');
      var cap = mk('span', 'rb-qf-label');
      if (kind !== 'q') {
        var mark = mk('span', 'rb-qf-mark', kind === 'a' ? '✔' : '✖');
        mark.setAttribute('aria-hidden', 'true');
        cap.appendChild(mark);
      }
      cap.appendChild(document.createTextNode(label));
      lab.appendChild(cap);
      var input = mk(kind === 'q' ? 'textarea' : 'input');
      if (kind === 'q') input.rows = 2; else input.type = 'text';
      input.maxLength = kind === 'q' ? 600 : 200;
      input.value = text || '';
      lab.appendChild(input);
      row.appendChild(lab);
      var slot = mk('div', 'rb-qf-pic');
      row.appendChild(slot);
      L.row = row;
      L.input = input;
      L.draw = function () {
        slot.textContent = '';
        if (L.busy) { slot.appendChild(mk('span', 'rb-qf-busy', 'Adding the picture...')); return; }
        if (L.img) {
          slot.appendChild(picImg(L.img, 'rb-qf-img'));
          var acts = mk('span', 'rb-qf-pic-acts');
          var change = mk('button', 'linkbtn', 'Change');
          change.type = 'button';
          change.setAttribute('aria-label', 'Change the picture for ' + label.toLowerCase());
          change.addEventListener('click', function () { togglePicker(L); });
          var remove = mk('button', 'linkbtn', 'Remove');
          remove.type = 'button';
          remove.setAttribute('aria-label', 'Remove the picture for ' + label.toLowerCase());
          remove.addEventListener('click', function () { L.img = ''; closePicker(L); L.draw(); });
          acts.appendChild(change);
          acts.appendChild(remove);
          slot.appendChild(acts);
          return;
        }
        var add = mk('button', 'btn secondary fc-small rb-qf-addpic', '+ Picture');
        add.type = 'button';
        add.setAttribute('aria-label', 'Add a picture for ' + label.toLowerCase());
        add.addEventListener('click', function () { togglePicker(L); });
        slot.appendChild(add);
      };
      L.draw();
      // A picture pasted in the line's box, or dropped on the line, is its picture.
      input.addEventListener('paste', function (e) {
        var file = clipImage(e.clipboardData);
        if (!file) return;
        e.preventDefault();
        takePic(L, picFromFile(file));
      });
      row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('drop'); });
      row.addEventListener('dragleave', function (e) { if (!row.contains(e.relatedTarget)) row.classList.remove('drop'); });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        row.classList.remove('drop');
        var p = dropPic(e.dataTransfer);
        if (p) takePic(L, p);
        else say('Nothing to add there. Drop a picture file, or a picture from another web page.', true);
      });
      node.appendChild(row);
      lines.push(L);
    }

    function takePic(L, promise) {
      L.busy = true;
      pending++;
      L.draw();
      say('Adding the picture...');
      promise.then(function (url) {
        L.busy = false;
        L.img = url;
        L.draw();
        closePicker(L);
        say('Picture added.');
      }, function (err) {
        L.busy = false;
        L.draw();
        say(err.message, true);
      }).then(function () { pending--; });
    }
    function closePicker(L) {
      if (L.picker) { L.picker.remove(); L.picker = null; }
    }
    // Upload a file, paste a picture or its address, or search for one.
    function togglePicker(L) {
      if (L.picker) { closePicker(L); return; }
      lines.forEach(closePicker);
      var p = mk('div', 'rb-qf-picker');
      L.picker = p;
      p.appendChild(mk('p', 'rb-qf-pick-title', 'Picture for ' + L.label.toLowerCase()));
      var top = mk('div', 'rb-qf-pick-row');
      var file = mk('input');
      file.type = 'file';
      file.accept = 'image/*';
      file.hidden = true;
      file.addEventListener('change', function () { if (file.files[0]) takePic(L, picFromFile(file.files[0])); file.value = ''; });
      var up = mk('button', 'btn fc-small', 'Upload a picture');
      up.type = 'button';
      up.addEventListener('click', function () { file.click(); });
      var paste = mk('input', 'rb-qf-paste');
      paste.type = 'text';
      paste.placeholder = 'Or paste a picture or its web address here';
      paste.setAttribute('aria-label', 'Paste a picture or its web address');
      paste.addEventListener('paste', function (e) {
        var f = clipImage(e.clipboardData);
        if (f) { e.preventDefault(); takePic(L, picFromFile(f)); return; }
        var t = ((e.clipboardData && e.clipboardData.getData('text')) || '').trim();
        if (t) { e.preventDefault(); paste.value = t; takePic(L, picFromAddress(t)); }
      });
      paste.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (paste.value.trim()) takePic(L, picFromAddress(paste.value.trim()));
      });
      var shut = mk('button', 'linkbtn', 'Close');
      shut.type = 'button';
      shut.addEventListener('click', function () { closePicker(L); L.input.focus(); });
      top.appendChild(up);
      top.appendChild(file);
      top.appendChild(paste);
      top.appendChild(shut);
      p.appendChild(top);

      // Free pictures, the same search the flashcards use (/api/images/search).
      var bar = mk('form', 'fc-find-bar');
      var q = mk('input');
      q.type = 'search';
      q.placeholder = 'Search for free pictures';
      q.setAttribute('aria-label', 'Search words for pictures');
      var words = (L.input.value.trim() || (lines[0].input.value.trim()));
      q.value = words.length <= 40 ? words : '';
      var go = mk('button', 'btn secondary fc-small', 'Search');
      go.type = 'submit';
      var google = mk('a', 'btn secondary fc-small', 'Google Images');
      google.target = '_blank';
      google.rel = 'noopener noreferrer';
      var setGoogle = function () { google.href = 'https://www.google.com/search?tbm=isch&safe=active&q=' + encodeURIComponent(q.value.trim() || words.slice(0, 80) || 'science'); };
      setGoogle();
      q.addEventListener('input', setGoogle);
      bar.appendChild(q);
      bar.appendChild(go);
      bar.appendChild(google);
      p.appendChild(bar);
      var fmsg = mk('p', 'fc-find-msg', 'From Google Images: right-click a picture, choose Copy image, then paste it in the box above.');
      fmsg.setAttribute('role', 'status');
      p.appendChild(fmsg);
      var grid = mk('div', 'fc-find-grid');
      p.appendChild(grid);
      var more = mk('button', 'btn secondary fc-small', 'Show 5 more');
      more.type = 'button';
      more.hidden = true;
      p.appendChild(more);
      var page = 1, busy = false;
      function search(next) {
        var w = q.value.trim();
        if (w.length < 2) { fmsg.textContent = 'Type a word to search for.'; q.focus(); return; }
        if (busy) return;
        busy = true;
        page = next ? page + 1 : 1;
        if (!next) grid.textContent = '';
        more.hidden = true;
        fmsg.textContent = 'Finding pictures...';
        ED.imageSearch(w, page).then(function (r) {
          var list = (r && r.results) || [];
          list.forEach(function (found) {
            var b = mk('button', 'fc-find-pick');
            b.type = 'button';
            b.title = found.credit || '';
            b.setAttribute('aria-label', 'Use this picture: ' + (found.title || ''));
            var im = mk('img');
            im.src = found.preview;
            im.alt = '';
            b.appendChild(im);
            b.addEventListener('click', function () { takePic(L, picFromChoices(found.urls || [])); });
            grid.appendChild(b);
          });
          var checked = (r && r.checked) || {};
          var down = Object.keys(checked).length && Object.keys(checked).every(function (k) { return /^failed/.test(checked[k]); });
          if (!grid.children.length) fmsg.textContent = down ? 'The picture sites did not answer just now. Try again in a moment.' : 'No pictures found for "' + w + '". Try other words.';
          else fmsg.textContent = list.length ? 'Click a picture to use it. They are free to use.' : 'No more pictures for "' + w + '".';
          more.hidden = list.length < 5;
        }, function (err) { fmsg.textContent = err.message; }).then(function () { busy = false; });
      }
      bar.addEventListener('submit', function (e) { e.preventDefault(); search(false); });
      more.addEventListener('click', function () { search(true); });
      L.row.parentNode.insertBefore(p, L.row.nextSibling);
      paste.focus();
    }

    addLine('q', 'Question', x.q, x.img);
    addLine('a', 'Right answer', x.a, x.ai);
    for (var k = 0; k < 3; k++) addLine('w', 'Wrong answer ' + (k + 1), (x.w || [])[k], (x.wi || [])[k]);
    node.appendChild(msg);

    function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
    function read() {
      var y = { q: clean(lines[0].input.value), img: lines[0].img, a: clean(lines[1].input.value), ai: lines[1].img, w: [], wi: [] };
      for (var k = 2; k < lines.length; k++) {
        var t = clean(lines[k].input.value), p = lines[k].img;
        if (t || p) { y.w.push(t); y.wi.push(p); }
      }
      return y;
    }
    var start = JSON.stringify(read());
    function problem(y) {
      if (!y.q && !y.img) return [0, 'Type the question, or add a picture for it.'];
      if (!y.a && !y.ai) return [1, 'Type the right answer, or add a picture for it.'];
      if (!y.w.length) return [2, 'Add at least one wrong answer.'];
      for (var k = 2; k < lines.length; k++) {
        var t = clean(lines[k].input.value);
        if (t && y.a && t.toLowerCase() === y.a.toLowerCase()) return [k, 'Wrong answer ' + (k - 1) + ' is the same as the right answer.'];
      }
      return null;
    }
    function apply(another) {
      if (pending) { say('Wait a moment: a picture is still being added.', true); node.scrollIntoView({ block: 'nearest' }); return false; }
      var y = read();
      var bad = problem(y);
      if (bad) {
        say(bad[1], true);
        lines[bad[0]].input.focus();
        return false;
      }
      var list = itemList();
      if (index < 0) list.push(y); else list[index] = y;
      var at = index < 0 ? list.length - 1 : index;
      if (at >= SHOW_FIRST) cardsAll = true;
      writeItems(list);
      var c = cardAt(at);
      if (c) {
        c.classList.add('flash');
        if (!another) { c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); c.querySelector('.rb-pq-edit').focus({ preventScroll: true }); }
      }
      toast((index < 0 ? 'Added question ' : 'Changed question ') + (at + 1) + '. Click Save set to keep it.');
      if (another) addCard();
      return true;
    }
    function cancel() {
      drawCards();
      var c = index < 0 ? null : cardAt(index);
      var back = c ? c.querySelector('.rb-pq-edit') : $('rbEdPreview').querySelector('.rb-pq-add');
      if (back) back.focus();
    }
    var acts = mk('div', 'rb-qf-acts');
    var button = function (text, cls, fn) {
      var b = mk('button', cls, text);
      b.type = 'button';
      b.addEventListener('click', fn);
      acts.appendChild(b);
      return b;
    };
    if (index < 0) {
      button('Add question', 'btn fc-small', function () { apply(false); });
      button('Add and start another', 'btn secondary fc-small', function () { apply(true); });
      button('Cancel', 'btn secondary fc-small', cancel);
    } else {
      button('Done', 'btn fc-small', function () { apply(false); });
      button('Cancel', 'btn secondary fc-small', cancel);
      var del = button('Delete question', 'btn secondary fc-small rb-danger rb-qf-del', function () {
        sureThen(del, 'Delete question', function () { openForm = null; removeItem(index); });
      });
    }
    node.appendChild(acts);
    // Ctrl+Enter is the same as Done.
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); apply(false); }
    });

    return {
      node: node,
      index: index,
      changed: function () { return pending > 0 || JSON.stringify(read()) !== start; },
      apply: apply,
      focus: function () { node.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); lines[0].input.focus({ preventScroll: true }); }
    };
  }

  /* ---------------- pictures for the questions (Donny, 2026-11-26) ---------------- */

  // Each picture is copied to this site (/api/images, like a flashcard's), so
  // it never disappears from another website. A big photo is made smaller
  // first (at most 1200 pixels across), so it loads fast on every
  // Chromebook; GIFs and SVGs are kept as they are.
  var BIG_PIC = 1200;
  function shrinkBlob(src) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () {
        try {
          var s = Math.min(1, BIG_PIC / Math.max(im.naturalWidth, im.naturalHeight));
          var cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(im.naturalWidth * s));
          cv.height = Math.max(1, Math.round(im.naturalHeight * s));
          var g = cv.getContext('2d');
          g.drawImage(im, 0, 0, cv.width, cv.height);
          cv.toBlob(function (b) {
            if (b && b.type === 'image/webp') { resolve(b); return; }
            g.globalCompositeOperation = 'destination-over';
            g.fillStyle = '#fff';
            g.fillRect(0, 0, cv.width, cv.height);
            cv.toBlob(function (j) { if (j) resolve(j); else reject(new Error('That picture could not be made smaller.')); }, 'image/jpeg', 0.86);
          }, 'image/webp', 0.85);
        } catch (err) { reject(err); }
      };
      im.onerror = function () { reject(new Error('That picture could not be opened.')); };
      im.src = src;
    });
  }
  function upload(blob) { return ED.uploadImage(blob).then(function (r) { return r.url; }); }
  function picFromFile(file) {
    if (!ED) return Promise.reject(new Error('This page did not load properly. Reload it to try again.'));
    if (!file || !/^image\//.test(file.type)) return Promise.reject(new Error('That file is not a picture. Use a PNG, JPG, GIF, WebP or SVG.'));
    if (/gif|svg/.test(file.type) || file.size < 300000) return upload(file);
    var u = URL.createObjectURL(file);
    return shrinkBlob(u).then(function (b) { return upload(b.size < file.size ? b : file); }, function () { return upload(file); })
      .then(function (url) { URL.revokeObjectURL(u); return url; }, function (err) { URL.revokeObjectURL(u); throw err; });
  }
  // A picture from its web address: copied to the site. If the site cannot
  // copy it but this browser can show it (a Google Drive picture only the
  // school can see, say), the question links to it instead.
  function picFromAddress(address) {
    address = String(address || '').trim();
    var tag = address.match(IMG_TAG);
    if (tag) address = tag[1];
    if (/^data:image\//i.test(address)) return fetch(address).then(function (r) { return r.blob(); }).then(picFromFile);
    if (/^\/api\/images\/[0-9a-f]{64}$/.test(address)) return Promise.resolve(address);
    address = fixImg(address);
    if (!/^https?:\/\//i.test(address)) return Promise.reject(new Error('Paste a picture, or a web address that starts with https://'));
    if (!ED) return Promise.reject(new Error('This page did not load properly. Reload it to try again.'));
    return ED.imageFromUrl(address).then(function (r) {
      if (r.bytes > 400000 && !r.animated && !/svg|gif/.test(r.type || '')) {
        return shrinkBlob(r.url).then(upload).then(null, function () { return r.url; });
      }
      return r.url;
    }, function (err) {
      return canShow(address).then(function (ok) {
        if (ok && /^https:\/\//i.test(address)) return address;
        throw err;
      });
    });
  }
  // A search result has a few addresses for its picture; the first one that copies is used.
  function picFromChoices(urls) {
    var left = urls.slice();
    return (function next(lastErr) {
      var u = left.shift();
      if (!u) return Promise.reject(lastErr || new Error('That picture could not be copied. Pick another.'));
      return picFromAddress(u).then(null, next);
    })();
  }
  function canShow(u) {
    return new Promise(function (resolve) {
      var im = new Image();
      var t = setTimeout(function () { resolve(false); }, 8000);
      im.referrerPolicy = 'no-referrer';
      im.onload = function () { clearTimeout(t); resolve(im.naturalWidth > 0); };
      im.onerror = function () { clearTimeout(t); resolve(false); };
      im.src = u;
    });
  }
  function clipImage(cd) {
    var items = (cd && cd.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) return items[i].getAsFile();
    }
    return null;
  }
  // A dropped file, or a picture dragged in from another tab (it comes as an address).
  function dropPic(dt) {
    if (!dt) return null;
    if (dt.files && dt.files.length) return picFromFile(dt.files[0]);
    var html = dt.getData('text/html');
    var m = html && /<img[^>]+src=["']([^"']+)["']/i.exec(html);
    var url = m ? m[1].replace(/&amp;/g, '&') : (dt.getData('text/uri-list') || '').split(/\r?\n/).filter(function (l) { return l && l.charAt(0) !== '#'; })[0] || '';
    return /^(https?:|data:image\/)/i.test(url) ? picFromAddress(url) : null;
  }

  $('rbEdText').addEventListener('input', function () { warnedSave = ''; preview(); });
  $('rbEdFile').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      $('rbEdText').value = String(reader.result || '');
      if (!$('rbEdName').value) $('rbEdName').value = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120);
      preview();
    };
    reader.readAsText(f);
    this.value = '';
  });

  /* ---------------- merging and downloading (Donny, 2026-11-04) ---------------- */

  // Questions added to the ones already in the box (an import, or a saved
  // set), so several links or sets become one set. The same question with the
  // same right answer is only kept once.
  function sameKey(x) { return [x.q, x.img, x.a, x.ai].map(function (v) { return String(v || '').trim().toLowerCase(); }).join('|'); }
  function addQuestions(list, title) {
    leaveForm();
    // Unfinished lines stay too, as their red cards.
    var had = parse($('rbEdText').value).items;
    var seen = {};
    had.forEach(function (it) { if (it.ok) seen[sameKey(it.x)] = true; });
    var fresh = list.filter(function (x) { var k = sameKey(x); if (seen[k]) return false; seen[k] = true; return true; });
    writeItems(had.map(function (it) { return it.x; }).concat(fresh));
    if (title && !$('rbEdName').value) $('rbEdName').value = title;
    var dupes = list.length - fresh.length;
    var total = edItems.filter(function (it) { return it.ok; }).length;
    return { added: fresh.length, total: total, dupes: dupes };
  }
  function addedText(r) {
    return (r.added ? 'Added ' + r.added + (r.added === 1 ? ' question' : ' questions') : 'No new questions') +
      (r.dupes ? ' (' + r.dupes + ' already in the set)' : '') + '. ' + r.total + (r.total === 1 ? ' question' : ' questions') + ' in the set now.';
  }
  function fillAddSets() {
    var sel = $('rbEdAddSet');
    sel.textContent = '';
    if (!qsets.length) { var none = mk('option', '', 'No saved sets yet'); none.value = ''; sel.appendChild(none); }
    qsets.forEach(function (s) {
      if (s.id === editing) return;
      var o = mk('option', '', s.title + ' (' + s.count + ')');
      o.value = s.id;
      sel.appendChild(o);
    });
    $('rbEdAdd').disabled = !sel.value;
  }
  $('rbEdAddSet').addEventListener('change', function () { $('rbEdAdd').disabled = !this.value; });
  $('rbEdAdd').addEventListener('click', function () {
    var id = $('rbEdAddSet').value;
    if (!id) return;
    if (!leaveForm()) { $('rbEdError').textContent = 'Finish the question that is open (or click its Cancel) first.'; return; }
    var btn = this;
    btn.disabled = true;
    call('qsets/' + id).then(function (s) {
      toast(addedText(addQuestions(s.questions || [], '')) + ' (from "' + s.title + '")');
    }, function (err) { $('rbEdError').textContent = err.message; }).then(function () { btn.disabled = false; });
  });
  // Merge sets: a new set, then add each saved set to it.
  $('rbQsetMerge').addEventListener('click', function () {
    openEditor('');
    $('rbEdName').value = 'Merged set';
    toast('Pick a saved set and click Add its questions. Add as many as you like, then Save set.');
    $('rbEdAddSet').focus();
  });

  // Download as a spreadsheet (CSV) with the template's columns, so it opens
  // in Google Sheets or Excel, and comes back in with Open a file or Import.
  var CSV_HEAD = ['Question', 'Question Image', 'Correct Answer', 'Correct Image', 'Wrong Answer 1', 'Wrong 1 Image', 'Wrong Answer 2', 'Wrong 2 Image', 'Wrong Answer 3', 'Wrong 3 Image'];
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function downloadCsv(title, list) {
    var lines = [CSV_HEAD].concat(list.map(function (x) {
      var row = [x.q, x.img, x.a, x.ai];
      for (var i = 0; i < 3; i++) row.push((x.w || [])[i] || '', (x.wi || [])[i] || '');
      return row;
    })).map(function (r) { return r.map(csvCell).join(','); });
    // The mark at the start tells Excel the file is UTF-8 (accents, symbols).
    var blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    var a = mk('a');
    a.href = URL.createObjectURL(blob);
    a.download = (String(title || 'Question set').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Question set') + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  $('rbEdCsv').addEventListener('click', function () {
    if (!leaveForm()) return;
    var r = parse($('rbEdText').value);
    if (!r.questions.length) { $('rbEdError').textContent = 'There are no questions to download yet.'; return; }
    downloadCsv($('rbEdName').value.trim(), r.questions);
  });
  $('rbQsetCsv').addEventListener('click', function () {
    var id = $('rbQset').value;
    if (!id) return;
    call('qsets/' + id).then(function (s) { downloadCsv(s.title, s.questions || []); toast('Downloaded "' + s.title + '". Change it in Google Sheets or Excel, then Edit, Open a file.'); }, function (err) { toast(err.message); });
  });

  // Import from a link: a Wayground, Kahoot, Blooket or Gimkit quiz, or a
  // Google Sheet (the site reads it). A sheet shared only inside the school is
  // read here instead, with the Google account signed in to this browser (as
  // Surge Showdown does). What comes in is added to the questions already here.
  $('rbEdImport').addEventListener('click', function () {
    var link = $('rbEdLink').value.trim();
    var help = $('rbImportHelp');
    var btn = this;
    help.hidden = true;
    $('rbEdError').textContent = '';
    if (!/^https?:\/\//.test(link)) { $('rbEdError').textContent = 'Paste the whole link, starting with https://'; return; }
    if (!leaveForm()) { $('rbEdError').textContent = 'Finish the question that is open (or click its Cancel) first.'; return; }
    btn.disabled = true;
    btn.textContent = 'Importing...';
    var done = function () { btn.disabled = false; btn.textContent = 'Import'; };
    var put = function (text, title) {
      var got = parse(text).questions;
      if (!got.length) { toast('No questions found in that link.'); return; }
      toast(addedText(addQuestions(got, title)) + ' Check them, then click Save set.');
      $('rbEdLink').value = '';
    };
    call('qsets/import', 'POST', { url: link }).then(function (r) {
      done();
      if (r.kind === 'quiz') {
        put(questionRows(r.questions), r.title);
        var from = r.site || 'Wayground';
        if (r.skipped) $('rbEdCount').textContent += ' ' + r.skipped + ' ' + from + (r.skipped === 1 ? ' question was' : ' questions were') + ' skipped (not multiple choice).';
      } else put(r.text, 'Google Sheet set');
    }, function (err) {
      if (!err.data || !err.data.private) { done(); $('rbEdError').textContent = err.message; return; }
      sheetViaBrowser(link).then(function (rws) {
        done();
        if (rws && rws.length) { put(sheetRows(rws), 'Google Sheet set'); return; }
        help.innerHTML = '<strong>Could not open that sheet.</strong> Either:<ol><li>In the sheet, click <strong>Share</strong>, set General access to <strong>Anyone with the link</strong> (Viewer), then click Import again.</li>' +
          '<li>Or select the rows in the sheet, copy (Ctrl+C), click in the box below and paste (Ctrl+V).</li></ol>';
        help.hidden = false;
      });
    });
  });
  function sheetViaBrowser(link) {
    var id = (link.match(/\/spreadsheets\/d\/([\w-]{20,})/) || [])[1];
    if (!id || id === 'e') return Promise.resolve(null);
    var gid = (link.match(/[#&?]gid=(\d+)/) || [])[1];
    function once(user) {
      return new Promise(function (resolve) {
        var cb = '__rbSheet' + Math.random().toString(36).slice(2);
        var s = document.createElement('script');
        var t = setTimeout(function () { finish(null); }, 7000);
        function finish(v) { clearTimeout(t); try { delete window[cb]; } catch (e) { window[cb] = undefined; } s.remove(); resolve(v); }
        window[cb] = function (res) {
          finish(res && res.status !== 'error' && res.table ? (res.table.rows || []).map(function (r) {
            return (r.c || []).map(function (c) { return c == null ? '' : String(c.f != null ? c.f : c.v != null ? c.v : ''); });
          }) : null);
        };
        s.onerror = function () { finish(null); };
        s.src = 'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:json;responseHandler:' + cb + '&headers=0' + (gid ? '&gid=' + gid : '') + (user ? '&authuser=' + user : '');
        document.head.appendChild(s);
      });
    }
    // Each Google account signed in to this browser, in turn.
    return once(0).then(function (r) { return r || once(1); }).then(function (r) { return r || once(2); });
  }

  $('rbQsetNew').addEventListener('click', function () { openEditor(''); });
  $('rbQsetEdit').addEventListener('click', function () { if ($('rbQset').value) openEditor($('rbQset').value); });
  $('rbEdCancel').addEventListener('click', function () {
    if (QPAGE) { backToReview(); return; }
    $('rbEditor').hidden = true;
  });
  $('rbEdSave').addEventListener('click', function () {
    // A card still open is kept first (or says what it is missing).
    if (!leaveForm()) { $('rbEdError').textContent = 'Finish the question that is open (or click its Cancel), then click Save set.'; return; }
    var r = preview();
    var title = $('rbEdName').value.trim();
    $('rbEdError').textContent = '';
    if (!title) { $('rbEdError').textContent = 'Give the set a name.'; $('rbEdName').focus(); return; }
    if (!r.questions.length) { $('rbEdError').textContent = 'Add at least one question with its right answer and a wrong answer.'; return; }
    // Red cards: one warning, then a second click saves without them.
    var bad = r.items.length - r.questions.length;
    if (bad && warnedSave !== $('rbEdText').value) {
      warnedSave = $('rbEdText').value;
      cardsAll = true;
      drawCards();
      var first = $('rbEdPreview').querySelector('.rb-pq.bad');
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      $('rbEdError').textContent = bad + (bad === 1 ? ' question is' : ' questions are') + ' not finished (the red ' + (bad === 1 ? 'card' : 'cards') + '). Fix or delete ' + (bad === 1 ? 'it' : 'them') + ', or click Save set again to save without ' + (bad === 1 ? 'it.' : 'them.');
      return;
    }
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Saving...';
    var payload = { title: title, questions: r.questions };
    // A new set made on its own page starts in the Review folder it was made from.
    if (QPAGE && !editing && qFolder) payload.folder = qFolder;
    call(editing ? 'qsets/' + editing : 'qsets', editing ? 'PUT' : 'POST', payload).then(function (s) {
      if (QPAGE) {
        // The editor stays open on its own page; a new set gets its address.
        editing = s.id;
        warnedSave = '';
        if (location.hash !== '#' + s.id) { try { history.replaceState(null, '', location.pathname + location.search + '#' + s.id); } catch (e) { /* the address stays */ } }
        toast('Saved "' + s.title + '" with ' + s.count + (s.count === 1 ? ' question.' : ' questions.'));
        return loadQsets(s.id).then(function () { qpageHead(s.id); });
      }
      $('rbEditor').hidden = true;
      document.querySelector('input[name="rbSource"][value="qset"]').checked = true;
      syncSource();
      toast('Saved "' + s.title + '" with ' + s.count + (s.count === 1 ? ' question.' : ' questions.'));
      return loadQsets(s.id);
    }, function (err) { $('rbEdError').textContent = err.message; }).then(function () {
      btn.disabled = false;
      btn.textContent = 'Save set';
    });
  });
  $('rbQsetDelete').addEventListener('click', function () {
    var id = $('rbQset').value;
    var set = qsets.filter(function (s) { return s.id === id; })[0];
    if (!set) return;
    var btn = this;
    if (!btn.classList.contains('sure')) {
      btn.classList.add('sure');
      btn.textContent = 'Click again to delete';
      setTimeout(function () { btn.classList.remove('sure'); btn.textContent = 'Delete'; }, 3000);
      return;
    }
    btn.classList.remove('sure');
    btn.textContent = 'Delete';
    call('qsets/' + id, 'DELETE').then(function () { toast('Deleted "' + set.title + '".'); loadQsets(''); }, function (err) { toast(err.message); });
  });

  /* ---------------- starting a game ---------------- */

  function opts() {
    return {
      energy: Number($('rbEnergy').value),
      size: Number($('rbSize').value),
      seconds: Number($('rbSeconds').value),
      limit: Number($('rbClock').value),
      // Who can join (Class Pass only, or guests too) and the period playing.
      who: whoPicked(),
      period: $('rbPeriod').value,
      comeback: $('rbComeback').checked,
      shield: $('rbShield').checked,
      demo: $('rbDemo').checked
    };
  }
  function whoPicked() {
    var r = document.querySelector('input[name="rbWho"]:checked');
    return r && r.value === 'guests' ? 'guests' : 'pass';
  }
  $('rbCreate').addEventListener('click', function () {
    var q = source() === 'qset';
    var body = { kind: 'royale', opts: opts() };
    if (window.IS8Roster) window.IS8Roster.remember(body.opts.period);
    if (q) body.qsetId = $('rbQset').value; else body.setId = $('rbFlash').value;
    $('rbSetupError').textContent = '';
    if (q && !body.qsetId) { $('rbSetupError').textContent = 'Make a question set first (New set), or pick a flashcard set.'; return; }
    if (!q && !body.setId) { $('rbSetupError').textContent = 'Pick a flashcard set.'; return; }
    keep(function (s) {
      if ($('rbSaveDefault').checked) {
        var d = { source: source(), qset: $('rbQset').value, flash: $('rbFlash').value, who: whoPicked() };
        DEFAULT_SELECTS.forEach(function (id) { d[id] = $(id).value; });
        DEFAULT_CHECKS.forEach(function (id) { d[id] = $(id).checked; });
        s.defaults = d;
      } else delete s.defaults;
    });
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Making the game...';
    call('live/create', 'POST', body).then(function (r) {
      game = { code: r.code, key: r.hostKey };
      // The set is kept too, for the lobby's Change game.
      keep(function (s) { s.host = { code: r.code, key: r.hostKey, at: Date.now(), qset: body.qsetId || '', flash: body.setId || '' }; });
      $('rbResume').hidden = true;
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      connect();
    }, function (err) { $('rbSetupError').textContent = err.message; }).then(function () {
      btn.disabled = false;
      btn.textContent = 'Create game';
    });
  });
  $('rbResumeBtn').addEventListener('click', function () {
    var h = readSaved().host;
    if (!h) return;
    game = { code: h.code, key: h.key };
    $('rbResume').hidden = true;
    connect();
  });

  /* ---------------- the connection ---------------- */

  function retire() {
    clearInterval(pingTimer);
    if (ws) { var old = ws; old.onopen = old.onmessage = old.onclose = null; try { old.close(); } catch (e) { /* closed */ } }
    ws = null;
  }
  function connect() {
    retire();
    leaving = false;
    status('Connecting...');
    var sock = ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/api/live/' + game.code + '/ws?host=' + encodeURIComponent(game.key));
    ws.onopen = function () {
      if (sock !== ws) return;
      retries = 0;
      status('');
      pingTimer = setInterval(function () { if (ws && ws.readyState === 1) ws.send('ping'); }, 25000);
    };
    ws.onmessage = function (e) {
      if (sock !== ws || e.data === 'pong') return;
      var m;
      try { m = JSON.parse(e.data); } catch (err) { return; }
      if (m.t === 'board') {
        keep(function (s) { if (s.host && s.host.code === game.code) s.host.at = Date.now(); });
        draw(m);
      } else if (m.t === 'over' || m.t === 'error') {
        leaving = true;
        retire();
        keep(function (s) { delete s.host; });
        game = null;
        board = null;
        setup();
        $('rbResume').hidden = true;
        if (m.msg) toast(m.msg);
      }
    };
    ws.onclose = function () {
      if (sock !== ws || leaving) return;
      clearInterval(pingTimer);
      retries += 1;
      status('Lost the connection. Trying again...');
      setTimeout(function () { if (game && !leaving) connect(); }, Math.min(6000, 700 * retries));
    };
  }
  function send(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }

  function heard(serverNow) { var d = serverNow - Date.now(); if (skew === null || d > skew) skew = d; }
  function local(t) { return t - (skew || 0); }

  /* ---------------- the board ---------------- */

  function draw(b) {
    var was = board;
    board = b;
    heard(b.now);
    [].forEach.call(document.querySelectorAll('.rb-mini-code'), function (n) { n.textContent = b.code; });
    [].forEach.call(document.querySelectorAll('.rb-join-url'), function (n) { n.textContent = location.host + '/join'; });
    if (b.phase === 'lobby') { show('rbLobby'); drawLobby(b); }
    else if (b.phase === 'play') { show('rbPlay'); drawPlay(b, was); }
    else if (b.phase === 'done') { show('rbDone'); drawDone(b, was); }
    musicFor(b.phase);
    if (rosterOpen) drawRoster(b);
  }

  function joinLink(code) { return location.origin + '/join#' + code; }
  var seen = {};

  // The bar above the code that names the game and set, with Change game (host-name.js).
  function endForChange() {
    leaving = true;
    keep(function (s) { delete s.host; });
    return window.IS8HostName.closeVia(ws);
  }
  function drawLobby(b) {
    $('rbCode').textContent = b.code;
    if (window.IS8HostName) {
      var h = readSaved().host || {};
      var q = h.code === b.code ? h.qset : '';
      if (!q && !b.setId) q = (qsets.filter(function (s) { return s.title === b.title; })[0] || {}).id || '';
      window.IS8HostName.show($('rbNameBar'), {
        kind: 'royale', code: b.code, title: b.title, count: b.questions,
        unit: b.setId ? (b.questions === 1 ? 'term' : 'terms') : (b.questions === 1 ? 'question' : 'questions'),
        qset: b.setId ? '' : q, flash: b.setId || (h.code === b.code ? h.flash : '') || '',
        players: b.players.filter(function (p) { return !p.bot; }).length, end: endForChange
      });
    }
    if (qrFor !== b.code && window.qrcode) {
      try {
        var qr = window.qrcode(0, 'M');
        qr.addData(joinLink(b.code));
        qr.make();
        $('rbQr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
        qrFor = b.code;
      } catch (e) { /* no QR code: the code is enough */ }
    }
    var n = b.players.length;
    var passed = b.players.filter(function (p) { return p.pass; }).length;
    var picking = b.players.filter(function (p) { return !p.hero; }).length;
    $('rbCount').textContent = n ? n + (n === 1 ? ' student has joined.' : ' students have joined.') + (passed && passed < n ? ' ' + passed + ' signed in with Class Pass.' : '') +
      (picking ? ' ' + picking + ' still picking a hero.' : '') : 'Waiting for students to join...';
    $('rbStart').disabled = n < 2;
    $('rbStart').title = n < 2 ? 'Battle Royale needs at least 2 players.' : '';
    drawLobbyOpts(b);
    var list = $('rbPlayers');
    list.textContent = '';
    b.players.forEach(function (p) {
      // Only a student who just joined pops in.
      var li = mk('li', 'rb-player' + (p.on || p.bot ? '' : ' gone') + (seen[p.id] ? '' : ' new'));
      seen[p.id] = true;
      li.appendChild(heroImg(p.hero));
      li.appendChild(mk('span', 'rb-player-name', p.name));
      if (p.guest) li.appendChild(mk('span', 'lv-guest-tag', 'Guest'));
      if (!p.hero) li.appendChild(mk('span', 'rb-picking', 'picking a hero'));
      var x = mk('button', 'rb-x', '×');
      x.type = 'button';
      x.title = 'Take ' + p.name + ' out of the game';
      x.setAttribute('aria-label', x.title);
      x.addEventListener('click', function () { send({ t: 'kick', id: p.id }); });
      li.appendChild(x);
      list.appendChild(li);
    });
  }

  var SIZES = [[2, '2 (one on one)'], [3, '3 players'], [4, '4 players'], [5, '5 players']];
  // The choices that can still change while students join.
  function drawLobbyOpts(b) {
    var box = $('rbLobbyOpts');
    drawRoll(b);
    var key = JSON.stringify([b.opts.energy, b.opts.size, b.opts.seconds, b.opts.limit, b.opts.comeback, b.opts.shield]);
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    box.textContent = '';
    function row(label, values, now, change) {
      var l = mk('label', 'rb-lo');
      l.appendChild(mk('span', '', label));
      var sel = mk('select');
      values.forEach(function (v) { var o = mk('option', '', v[1]); o.value = String(v[0]); sel.appendChild(o); });
      sel.value = String(now);
      sel.addEventListener('change', function () { change(sel.value); });
      l.appendChild(sel);
      box.appendChild(l);
    }
    row('Starting HP', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return [n, n + ' HP']; }), b.opts.energy, function (v) { send({ t: 'settings', opts: { energy: Number(v) } }); });
    row('Face-offs', SIZES, b.opts.size || 2, function (v) { send({ t: 'settings', opts: { size: Number(v) } }); });
    row('Time per question', [[10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds'], [60, '1 minute']], b.opts.seconds, function (v) { send({ t: 'settings', opts: { seconds: Number(v) } }); });
    row('Game clock', CLOCKS, b.opts.limit, function (v) { send({ t: 'clock', minutes: Number(v) }); });
    [['comeback', 'Revives'], ['shield', 'Shield streaks']].forEach(function (x) {
      var l = mk('label', 'rb-lo fc-switch');
      l.appendChild(mk('span', '', x[1]));
      var cb = mk('input');
      cb.type = 'checkbox';
      cb.checked = !!b.opts[x[0]];
      cb.addEventListener('change', function () { var o = {}; o[x[0]] = cb.checked; send({ t: 'settings', opts: o }); });
      l.appendChild(cb);
      box.appendChild(l);
    });
  }
  // Who can join and the class period, changed any time in the lobby, and the
  // period's class list: who has joined and who has not (assets/live-roster.js).
  var rollPeriods = false;
  function drawRoll(b) {
    var o = b.opts || {};
    if (document.activeElement !== $('rbLobbyWho')) $('rbLobbyWho').value = o.who || (o.pass === false ? 'guests' : 'pass');
    var sel = $('rbLobbyPeriod');
    if (!window.IS8Roster) return;
    if (!rollPeriods) { rollPeriods = true; window.IS8Roster.fillPeriods(sel, o.period || ''); }
    else if (document.activeElement !== sel && sel.value !== (o.period || '') && [].some.call(sel.options, function (x) { return x.value === (o.period || ''); })) sel.value = o.period || '';
    window.IS8Roster.draw($('rbRoll'), o.period || '', b.players);
  }
  $('rbLobbyWho').addEventListener('change', function () { send({ t: 'who', who: this.value }); });
  $('rbLobbyPeriod').addEventListener('change', function () {
    if (window.IS8Roster) window.IS8Roster.remember(this.value);
    send({ t: 'period', period: this.value });
  });
  var CLOCKS = [[0, 'No clock'], [1, '1 minute'], [2, '2 minutes'], [3, '3 minutes'], [4, '4 minutes'], [5, '5 minutes'], [7, '7 minutes'], [10, '10 minutes'], [15, '15 minutes'], [20, '20 minutes'], [30, '30 minutes']];

  $('rbStart').addEventListener('click', function () { send({ t: 'start' }); });
  $('rbCopy').addEventListener('click', function () {
    if (!board) return;
    var link = joinLink(board.code);
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { toast('Copied the join link.'); }, function () { toast(link); });
  });

  /* ---------------- the game ---------------- */

  var tickTimer = null;
  function drawPlay(b) {
    var r = b.round || {};
    var alive = b.players.filter(function (p) { return !p.out; }).length;
    $('rbRound').textContent = r.n ? 'Round ' + r.n : 'Battle Royale';
    $('rbLeft').textContent = alive + ' of ' + b.players.length + ' heroes left';
    $('rbPause').textContent = b.paused ? 'Resume' : 'Pause';
    $('rbPause').classList.toggle('on', !!b.paused);
    if (document.activeElement !== $('rbSizeNow')) $('rbSizeNow').value = String(b.opts.size || 2);
    drawClockSet(b);
    drawSpot(b);
    var banner = $('rbBanner');
    var say = b.paused ? 'Paused. Press Resume to go on.'
      : b.timeUp ? 'Time is up! This is the last round.'
        : r.sudden && r.stage === 'results' ? 'Sudden death! Everyone left missed it, so nobody is eliminated this round.' : '';
    banner.hidden = !say;
    banner.textContent = say;
    banner.classList.toggle('rb-banner-time', !!b.timeUp && !b.paused);
    var key = [r.n, r.stage, b.paused].join('|');
    // A picture open full screen closes when its question is over.
    if (window.rbZoom && r.stage !== 'question') rbZoom.close();
    var stage = $('rbStage');
    if (stage.dataset.key !== key) {
      stage.dataset.key = key;
      stage.textContent = '';
      stage.className = 'rb-stage rb-stage-' + (r.stage || 'none');
      if (r.stage === 'vs') drawVs(stage, b, r);
      else if (r.stage === 'question') drawQuestion(stage, b, r);
      else if (r.stage === 'results') drawResults(stage, b, r);
    }
    // The count of answers changes without a new stage.
    var got = $('rbGot');
    if (got) {
      got.textContent = '';
      got.appendChild(mk('strong', '', r.answered + ' of ' + r.of));
      got.appendChild(document.createTextNode('answered'));
    }
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, 200);
    tick();
  }

  // The clocks: the game clock in the top bar, and the countdown on the stage.
  function tick() {
    var b = board;
    if (!b || b.phase !== 'play') { clearInterval(tickTimer); return; }
    var now = Date.now();
    var left = b.paused ? b.pausedLeft : b.endsAt ? Math.max(0, local(b.endsAt) - now) : 0;
    var clock = $('rbClock2');
    var on = !!b.endsAt || (b.paused && b.pausedLeft > 0);
    $('rbMinus').hidden = $('rbPlus').hidden = !on;
    clock.hidden = !on && !b.timeUp;
    if (on) {
      var s = Math.ceil(left / 1000);
      clock.textContent = b.timeUp ? '0:00' : Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
      clock.classList.toggle('low', s <= 30 && !b.paused);
    }
    var r = b.round || {};
    var cd = $('rbCountdown');
    if (!cd || b.paused) return;
    var to = r.stage === 'vs' ? r.qAt : r.stage === 'question' ? r.endsAt : r.stage === 'results' ? r.nextAt : 0;
    var n = Math.max(0, Math.ceil((local(to) - now) / 1000));
    cd.textContent = String(n);
    if (window.rbZoom) rbZoom.clock(r.stage === 'question' ? n : '', n <= 5);
    var bar = $('rbTimeBar');
    if (bar && r.stage === 'question') bar.style.width = Math.max(0, Math.min(100, (local(r.endsAt) - now) / (r.seconds * 10))) + '%';
  }

  function drawClockSet(b) {
    var sel = $('rbClockSet');
    var key = (b.endsAt || b.pausedLeft) ? 'on' : 'off';
    if (sel.dataset.key === key) return;
    sel.dataset.key = key;
    sel.textContent = '';
    var first = mk('option', '', key === 'on' ? 'Change the clock' : '⏱ Add a clock');
    first.value = '';
    sel.appendChild(first);
    CLOCKS.forEach(function (c) {
      if (c[0] === 0 && key === 'off') return;
      var o = mk('option', '', c[0] ? c[1] + ' from now' : 'Take the clock away');
      o.value = String(c[0]);
      sel.appendChild(o);
    });
  }
  $('rbClockSet').addEventListener('change', function () {
    if (this.value === '') return;
    send({ t: 'clock', minutes: Number(this.value) });
    this.value = '';
  });
  $('rbSizeNow').addEventListener('change', function () {
    send({ t: 'settings', opts: { size: Number(this.value) } });
    toast('From the next round, ' + (this.value === '2' ? 'students face off one on one.' : this.value + ' students face off at once. The fastest right answer wins.'));
    this.blur();
  });
  $('rbMinus').addEventListener('click', function () { send({ t: 'time', seconds: -60 }); });
  $('rbPlus').addEventListener('click', function () { send({ t: 'time', seconds: 60 }); });
  $('rbPause').addEventListener('click', function () { if (board) send({ t: board.paused ? 'resume' : 'pause' }); });
  $('rbSkip').addEventListener('click', function () { send({ t: 'skip' }); });
  twice($('rbEnd'), 'End game', 'Click again to end', function () { send({ t: 'end' }); });

  function twice(btn, label, ask, go) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('sure')) { btn.classList.remove('sure'); btn.textContent = label; go(); return; }
      btn.classList.add('sure');
      btn.textContent = ask;
      setTimeout(function () { btn.classList.remove('sure'); btn.textContent = label; }, 3000);
    });
  }

  // The round's highlights, down the left side: name, hero, what they did.
  function drawSpot(b) {
    var box = $('rbSpot');
    var key = JSON.stringify(b.spot.map(function (x) { return [x.id, x.what]; }));
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    box.textContent = '';
    box.appendChild(mk('h3', 'rb-spot-title', 'Highlights'));
    if (!b.spot.length) { box.appendChild(mk('p', 'rb-spot-wait', 'Shown after each round.')); return; }
    b.spot.forEach(function (x) {
      var card = mk('div', 'rb-spot-card');
      card.appendChild(mk('span', 'rb-spot-name', x.name));
      card.appendChild(heroImg(x.hero, '', !!x.out));
      card.appendChild(mk('span', 'rb-spot-what', x.what));
      box.appendChild(card);
    });
  }

  function person(p, extra) {
    var box = mk('div', 'rb-fighter' + (extra ? ' ' + extra : ''));
    if (!p) { box.appendChild(mk('span', 'rb-fighter-name', 'Left the game')); return box; }
    box.appendChild(heroImg(p.hero, '', !!p.out));
    var t = mk('div', 'rb-fighter-text');
    t.appendChild(mk('span', 'rb-fighter-name', p.name));
    var e = mk('span', 'rb-hp-line');
    e.appendChild(hearts(p.energy, board.opts.energy));
    if (p.shield) { var s = mk('span', 'rb-shield', '🛡️'); s.title = 'Shield: blocks the next lost HP'; e.appendChild(s); }
    t.appendChild(e);
    box.appendChild(t);
    return box;
  }
  // A group's card: its students with VS between them, or one student
  // against the ghost of another.
  function groupCard(x, fill) {
    var card = mk('div', 'rb-matchup' + (x.people.length > 2 ? ' wide' : '') + (x.ghost ? ' rb-ghost-card' : ''));
    var all = x.people.slice();
    all.forEach(function (p, i) {
      if (i) card.appendChild(mk('span', 'rb-vs-word', 'VS'));
      card.appendChild(fill(p, i === all.length - 1 && all.length === 2 && !x.ghost ? 'right' : ''));
    });
    if (x.ghost) {
      card.appendChild(mk('span', 'rb-vs-word', 'VS'));
      var g = fill(x.ghost, 'right ghost', true);
      // "Ghost" on its own small line, so the student's name has the room (2026-11-04).
      var gn = g.querySelector('.rb-fighter-name');
      gn.textContent = x.ghost.name;
      gn.parentNode.insertBefore(mk('span', 'rb-ghost-tag', '👻 Ghost'), gn);
      card.appendChild(g);
    }
    return card;
  }

  function drawVs(stage, b, r) {
    var head = mk('div', 'rb-vs-head');
    head.appendChild(mk('span', 'rb-vs-title', 'Round ' + r.n + ' starts in'));
    var cd = mk('span', 'rb-countdown');
    cd.id = 'rbCountdown';
    head.appendChild(cd);
    stage.appendChild(head);
    if (r.size > 2) stage.appendChild(mk('p', 'rb-size-note', r.size + ' heroes per face-off: the fastest right answer wins, everyone else loses 1 HP.'));
    var grid = mk('div', 'rb-matchups' + (r.groups.length > 10 ? ' many' : ''));
    r.groups.forEach(function (x) { grid.appendChild(groupCard(x, function (p, extra) { return person(p, extra); })); });
    stage.appendChild(grid);
  }

  // An answer's words and picture.
  function answerBody(box, text, img) {
    if (img) { var i = mk('img', 'rb-tile-img'); i.alt = ''; i.src = img; i.referrerPolicy = 'no-referrer'; box.appendChild(i); }
    if (text) box.appendChild(mk('span', 'rb-tile-text', text));
  }
  // Big answer words, a bit smaller when an answer is long so all four still fit (Donny, 2026-11-05).
  function answerFit(opts) {
    var n = Math.max.apply(null, (opts || []).map(function (o) { return String(o || '').length; }).concat([0]));
    return n <= 24 ? 1 : n <= 40 ? 0.85 : n <= 64 ? 0.75 : n <= 100 ? 0.65 : 0.55;
  }
  function answerTiles(r, settled) {
    var box = mk('div', 'rb-tiles');
    box.style.setProperty('--fit', String(answerFit(r.q.opts)));
    var most = settled && r.counts ? Math.max.apply(null, r.counts.concat([1])) : 1;
    r.q.opts.forEach(function (o, i) {
      var tile = mk('div', 'rb-tile' + (settled ? (i === r.c ? ' right' : ' wrong') : '') + ((r.q.imgs || [])[i] ? ' has-img' : ''));
      tile.style.setProperty('--tile', COLORS[i % 4]);
      var inner = mk('span', 'rb-tile-body');
      answerBody(inner, o, (r.q.imgs || [])[i]);
      tile.appendChild(inner);
      if (settled && r.counts) {
        tile.appendChild(mk('span', 'rb-tile-count', (i === r.c ? '✔ ' : '') + r.counts[i]));
        var fill = mk('span', 'rb-tile-fill');
        fill.style.width = Math.round(100 * r.counts[i] / most) + '%';
        tile.appendChild(fill);
      }
      box.appendChild(tile);
    });
    return box;
  }

  function drawQuestion(stage, b, r) {
    var top = mk('div', 'rb-q-top');
    var qbox = mk('div', 'rb-q');
    qbox.appendChild(mk('p', 'rb-q-text', r.q.text));
    if (r.q.img) {
      var img = mk('img', 'rb-q-img'); img.alt = ''; img.src = r.q.img; img.referrerPolicy = 'no-referrer';
      qbox.appendChild(img);
      if (window.rbZoom) rbZoom.wrap(img);
    }
    top.appendChild(qbox);
    var side = mk('div', 'rb-q-side');
    var cd = mk('span', 'rb-countdown rb-countdown-q');
    cd.id = 'rbCountdown';
    side.appendChild(cd);
    var got = mk('span', 'rb-got');
    got.id = 'rbGot';
    side.appendChild(got);
    top.appendChild(side);
    stage.appendChild(top);
    var bar = mk('div', 'rb-timebar');
    var fill = mk('span');
    fill.id = 'rbTimeBar';
    bar.appendChild(fill);
    stage.appendChild(bar);
    stage.appendChild(answerTiles(r, false));
  }

  // The badge on a student in the results.
  function badge(f, r, id, lost) {
    f = f.querySelector('.rb-fighter-text') || f;
    if (r.out.indexOf(id) >= 0) f.appendChild(mk('span', 'rb-ko', 'Eliminated'));
    else if (r.blocked.indexOf(id) >= 0) f.appendChild(mk('span', 'rb-blocked', '🛡️ blocked'));
    else if (lost) f.appendChild(mk('span', 'rb-minus', '−1 HP'));
    else if (r.earned.indexOf(id) >= 0) f.appendChild(mk('span', 'rb-earned', '+ 🛡️'));
  }
  function drawResults(stage, b, r) {
    var top = mk('div', 'rb-res-top');
    var qbox = mk('div', 'rb-q rb-q-small');
    qbox.appendChild(mk('p', 'rb-q-text', r.q.text));
    top.appendChild(qbox);
    top.appendChild(answerTiles(r, true));
    stage.appendChild(top);
    var head = mk('div', 'rb-vs-head');
    head.appendChild(mk('span', 'rb-vs-title', r.last ? 'Final results' : 'Results'));
    var cd = mk('span', 'rb-countdown rb-countdown-small');
    cd.id = 'rbCountdown';
    head.appendChild(cd);
    stage.appendChild(head);
    // Students who were eliminated and got 3 practice questions right in a row.
    if (r.back.length) {
      var back = mk('div', 'rb-back-list');
      back.appendChild(mk('strong', '', 'Revived! Back in next round:'));
      r.back.forEach(function (p) {
        var chip = mk('span', 'rb-back-chip');
        chip.appendChild(heroImg(p.hero));
        chip.appendChild(document.createTextNode(p.name));
        back.appendChild(chip);
      });
      stage.appendChild(back);
    }
    var grid = mk('div', 'rb-matchups rb-results' + (r.groups.length > 10 ? ' many' : ''));
    r.groups.forEach(function (x) {
      grid.appendChild(groupCard(x, function (p, extra, isGhost) {
        var won = !isGhost && x.win === p.id;
        var lost = !isGhost && x.lost.indexOf(p.id) >= 0;
        var f = person(p, (extra || '') + (won ? ' won' : lost ? ' lost' : ''));
        var how = mk('span', 'rb-how', p.ok ? '✔ ' + secs(p.ms) : p.answered ? '✖ wrong' : '✖ no answer');
        f.querySelector('.rb-fighter-text').appendChild(how);
        if (!isGhost) badge(f, r, p.id, lost);
        return f;
      }));
    });
    stage.appendChild(grid);
  }

  /* ---------------- the players list during a game ---------------- */

  var rosterOpen = false;
  function openRoster(yes) {
    rosterOpen = yes;
    $('rbRoster').hidden = $('rbRosterBack').hidden = !yes;
    $('rbRosterBtn').setAttribute('aria-expanded', String(yes));
    if (yes && board) drawRoster(board);
  }
  $('rbRosterBtn').addEventListener('click', function () { openRoster(!rosterOpen); });
  $('rbRosterClose').addEventListener('click', function () { openRoster(false); });
  $('rbRosterBack').addEventListener('click', function () { openRoster(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && rosterOpen) openRoster(false); });
  function drawRoster(b) {
    var body = $('rbRosterBody');
    var key = JSON.stringify([b.players.map(function (p) { return [p.id, p.energy, p.out, p.on]; }), b.blocked]);
    if (body.dataset.key === key) return;
    body.dataset.key = key;
    body.textContent = '';
    var list = mk('ul', 'rb-roster-list');
    b.players.slice().sort(function (x, y) { return (x.out ? 1 : 0) - (y.out ? 1 : 0) || y.energy - x.energy; }).forEach(function (p) {
      var li = mk('li', 'rb-roster-row' + (p.out ? ' out' : ''));
      li.appendChild(heroImg(p.hero, '', !!p.out));
      li.appendChild(mk('span', 'rb-player-name', p.name + (p.on || p.bot ? '' : ' (away)')));
      li.appendChild(p.out ? mk('span', 'rb-out-tag', 'eliminated') : hearts(p.energy, b.opts.energy));
      var x = mk('button', 'btn secondary fc-small', 'Remove');
      x.type = 'button';
      twice(x, 'Remove', 'Sure?', function () { send({ t: 'kick', id: p.id }); });
      var blk = mk('button', 'btn secondary fc-small rb-danger', 'Remove and block');
      blk.type = 'button';
      twice(blk, 'Remove and block', 'Sure?', function () { send({ t: 'kick', id: p.id, block: true }); });
      li.appendChild(x);
      li.appendChild(blk);
      list.appendChild(li);
    });
    body.appendChild(list);
    if (b.blocked.length) {
      body.appendChild(mk('h3', '', 'Blocked'));
      b.blocked.forEach(function (x) {
        var row = mk('p', 'rb-roster-row');
        row.appendChild(mk('span', 'rb-player-name', x.name));
        var un = mk('button', 'btn secondary fc-small', 'Let back in');
        un.type = 'button';
        un.addEventListener('click', function () { send({ t: 'unblock', id: x.id }); });
        row.appendChild(un);
        body.appendChild(row);
      });
    }
  }

  /* ---------------- the winners ---------------- */

  function drawDone(b, was) {
    clearInterval(tickTimer);
    var ranked = b.players.slice().sort(function (x, y) { return (x.place || 999) - (y.place || 999); });
    var pod = $('rbPodium');
    pod.textContent = '';
    // Second, first, third, like a real podium.
    [ranked[1], ranked[0], ranked[2]].forEach(function (p) {
      if (!p) return;
      var li = mk('li', 'rb-step rb-step-' + p.place);
      li.appendChild(heroImg(p.hero, 'big'));
      li.appendChild(mk('span', 'rb-step-name', p.name));
      li.appendChild(mk('span', 'rb-step-wins', p.wins + (p.wins === 1 ? ' win' : ' wins')));
      li.appendChild(mk('span', 'rb-step-place', ordinal(p.place)));
      pod.appendChild(li);
    });
    var list = $('rbFinal');
    list.textContent = '';
    ranked.forEach(function (p) {
      var li = mk('li', 'rb-final-row');
      li.appendChild(mk('span', 'rb-final-place', ordinal(p.place)));
      li.appendChild(heroImg(p.hero, '', !!p.out));
      li.appendChild(mk('span', 'rb-player-name', p.name));
      li.appendChild(mk('span', 'rb-final-stat', (p.out ? 'Eliminated in round ' + p.out : p.energy + ' HP left') + ', ' +
        p.wins + (p.wins === 1 ? ' win, ' : ' wins, ') + p.right + ' right'));
      list.appendChild(li);
    });
    var missed = $('rbMissed');
    missed.textContent = '';
    $('rbMissedBox').hidden = !b.missed.length;
    b.missed.forEach(function (x) {
      var li = mk('li');
      li.appendChild(mk('span', 'rb-missed-q', x.q));
      li.appendChild(mk('span', 'rb-missed-a', 'Answer: ' + x.a));
      li.appendChild(mk('span', 'rb-missed-n', x.w + ' of ' + (x.r + x.w) + ' missed it'));
      missed.appendChild(li);
    });
    if (was && was.phase === 'play') celebrate();
  }
  $('rbAgain').addEventListener('click', function () { send({ t: 'again' }); });

  // Download results (Donny, 2026-10-29): one row per student, one column per
  // question that came up, for Google Sheets or Excel. Pretend students are
  // left out. A question asked more than once shows each answer in turn.
  $('rbDownload').addEventListener('click', function () {
    var res = board && board.results;
    if (!res) return;
    var word = { R: 'right', W: 'wrong', N: 'no answer' };
    var csv = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rws = res.rows.filter(function (p) { return !p.bot; });
    // A demo game with only pretend students: show them, so the file can be tried.
    if (!rws.length) rws = res.rows;
    var head = ['Place', 'Student', 'Email', 'HP left', 'Eliminated in round', 'Wins', 'Right', 'Wrong or no answer', 'Percent right', 'Average right answer (seconds)', 'Revived in round']
      .concat(res.questions.map(function (q, i) { return 'Q' + (i + 1) + ': ' + q.q + ' (answer: ' + q.a + ')'; }));
    var lines = [head];
    rws.forEach(function (p) {
      // Every answer counts here, practice ones after being eliminated too.
      var marks = p.qa.join('');
      var right = (marks.match(/R/g) || []).length, all = marks.length;
      lines.push([p.place, p.name, p.email, p.energy, p.out || '', p.wins, right, all - right, all ? Math.round(100 * right / all) + '%' : '',
        p.avg ? (p.avg / 1000).toFixed(2) : '', p.back || ''].concat(p.qa.map(function (s) { return s.split('').map(function (c) { return word[c] || c; }).join(', '); })));
    });
    // The class, question by question: who got it right.
    var pct = ['', 'Class percent right', '', '', '', '', '', '', '', '', ''].concat(res.questions.map(function (q, i) {
      var r = 0, n = 0;
      rws.forEach(function (p) { (p.qa[i] || '').split('').forEach(function (c) { n += 1; if (c === 'R') r += 1; }); });
      return n ? Math.round(100 * r / n) + '%' : '';
    }));
    lines.push([]);
    lines.push(pct);
    var text = '﻿' + lines.map(function (l) { return l.map(csv).join(','); }).join('\r\n');
    var day = new Date(res.at || Date.now());
    var stamp = day.getFullYear() + '-' + ('0' + (day.getMonth() + 1)).slice(-2) + '-' + ('0' + day.getDate()).slice(-2);
    var a = mk('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = ('Battle Royale ' + res.title + ' ' + stamp).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
  $('rbNew').addEventListener('click', function () {
    send({ t: 'close' });
    leaving = true;
    retire();
    keep(function (s) { delete s.host; });
    game = null;
    qrFor = '';
    setup();
    $('rbResume').hidden = true;
  });

  /* ---------------- music (this screen only) ---------------- */

  var SONGS = {
    lobby: [['competition-briefing', 'Competition Briefing'], ['cartoon-lobby-music-3', 'Cartoon Lobby Music 3'], ['cartoon-lobby-music-10', 'Cartoon Lobby Music 10'],
      ['video-game-music', 'Video Game Music'], ['elevator-music', 'Elevator Music'], ['lounge-jazz', 'Lounge Jazz'], ['waiting-room-calm', 'Waiting Room (Calm)']],
    game: [['game-heroic-battle-orchestra', 'Heroic Battle Orchestra'], ['game-quiz-master', 'Quiz Master'], ['game-pixel-chiptune', 'Pixel Chiptune'],
      ['game-retro-game-arcade', 'Retro Game Arcade'], ['game-arcadia', 'Arcadia'], ['game-rise-above', 'Rise Above'], ['game-airland-jazz', 'Airland Jazz']]
  };
  var saved0 = readSaved();
  var music = { lobby: saved0.lobbyMusic || '', game: saved0.gameMusic || '', volume: typeof saved0.volume === 'number' ? saved0.volume : 60, muted: !!saved0.muted, part: '', player: null };
  [['lobby', 'rbLobbyMusic'], ['game', 'rbGameMusic']].forEach(function (x) {
    var sel = $(x[1]);
    var off = mk('option', '', 'No music');
    off.value = '';
    sel.appendChild(off);
    SONGS[x[0]].forEach(function (s) { var o = mk('option', '', s[1]); o.value = s[0]; sel.appendChild(o); });
    sel.value = music[x[0]];
    sel.addEventListener('change', function () {
      music[x[0]] = sel.value;
      keep(function (s) { s[x[0] + 'Music'] = sel.value; });
    });
  });
  $('rbVolume').value = music.volume;
  function musicFor(phase) {
    var part = phase === 'lobby' ? 'lobby' : phase === 'play' ? 'game' : '';
    $('rbMusic').hidden = !part || !music[part];
    $('rbMusicLabel').textContent = part === 'game' ? 'Game music' : 'Lobby music';
    $('rbMute').textContent = music.muted ? 'Unmute' : 'Mute';
    $('rbMute').setAttribute('aria-pressed', String(music.muted));
    if (!part || !music[part] || music.muted) { if (music.player) music.player.pause(); music.part = part; return; }
    if (!music.player) { music.player = new Audio(); music.player.loop = true; }
    var src = '../assets/music/' + music[part] + '.mp3';
    if (music.player.getAttribute('src') !== src) music.player.setAttribute('src', src);
    music.player.volume = music.volume / 100;
    music.part = part;
    if (music.player.paused) {
      var go = music.player.play();
      if (go && go.catch) go.catch(function () { /* the browser wants a click first */ });
    }
  }
  $('rbMute').addEventListener('click', function () {
    music.muted = !music.muted;
    keep(function (s) { s.muted = music.muted; });
    musicFor(board ? board.phase : '');
  });
  $('rbVolume').addEventListener('input', function () {
    music.volume = Number(this.value);
    if (music.player) music.player.volume = music.volume / 100;
    keep(function (s) { s.volume = music.volume; });
  });
  function celebrate() {
    if (window.IS8Celebrate) try { IS8Celebrate.start({}); } catch (e) { /* only confetti */ }
    if (music.muted) return;
    var win = new Audio('../assets/music/winning.mp3');
    win.volume = music.volume / 100;
    var go = win.play();
    if (go && go.catch) go.catch(function () { /* the browser blocked it */ });
  }

  /* ---------------- full screen and ending ---------------- */

  var fsButtons = [].slice.call(document.querySelectorAll('[data-fullscreen]'));
  var canFull = !!(document.documentElement.requestFullscreen && document.fullscreenEnabled !== false);
  fsButtons.forEach(function (btn) {
    btn.hidden = !canFull;
    btn.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen().catch(function () { /* already out */ });
      else document.documentElement.requestFullscreen().catch(function () { toast('This browser would not go full screen. Try pressing F11.'); });
    });
  });
  document.addEventListener('fullscreenchange', function () {
    document.body.classList.toggle('rb-full', !!document.fullscreenElement);
    fsButtons.forEach(function (btn) { btn.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });
  });
  [].forEach.call(document.querySelectorAll('[data-close]'), function (btn) {
    twice(btn, 'End game', 'Click again to end', function () {
      if (ws && ws.readyState === 1) send({ t: 'close' });
      else { keep(function (s) { delete s.host; }); location.reload(); }
    });
  });

  gate();
})();
