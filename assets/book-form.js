/* Physical Science 8: the Extra Credit book forms (Donny, 2026-11-11).

   extra-credit-fiction.html and extra-credit-nonfiction.html (styles in book-form.css). A student who read a book
   from the Extra Credit list and passed its AR test answers guided questions about it instead of typing a one-page,
   double-spaced summary, and adds a picture of the AR test. Each answer box has its own word goal; together they come
   to about one page (GOAL_WORDS).

   - The book questions come from the sheet's Questions tab (Donny, 2026-11-11: "I also want to be able to edit the
     questions directly"); see "the questions" below. Every [data-col] is one answer: its id (the sheet finds the column
     by it) and data-head (the question, which titles the column). .bf-q.req boxes must be filled in; a textarea's
     data-min is its fewest words.
   - Name and period come from the Class Pass sign-in (PS8Pass.view().me) when the boxes are empty.
   - The book is picked from the Extra Credit list (the same Google Sheet extra-credit.html reads, with that page's
     saved copy as the fallback), only books of this form's kind; "My book isn't on the list" takes a typed title.
     extra-credit-fiction?book=<title> picks that book.
   - The AR test picture: click, drag it in, or paste a screenshot (Ctrl + V). It is shrunk to MAX_SIDE pixels as a JPG
     before sending (a picture the browser can't open, like an iPhone HEIC, goes as it is if it is under 6 MB).
   - Everything is kept in this browser as it is typed (ps8-bookform-v1:<kind>) and cleared once the form is turned in.
     It keeps the Class Pass name too, and a different student signed in on the same computer starts with a blank form.
     Text pasted into an answer stays text; a picture pasted anywhere else becomes the AR test picture.
   - A signed-in student's answers are also kept in their Class Pass account (Donny, 2026-11-11: "if a student does not
     finish the form, will it save their progress if they open another computer?"), so they can finish on any
     computer they sign in on. See "the student's Class Pass account" below.
   - Submit sends one JSON message (text/plain, so no preflight) to the Extra Credit Book Forms sheet's web app
     (class-tools/book-forms/Code.gs, EXEC_URL below). The id stays the same until it is saved, so a second click
     or a retry is saved only once.
   - The teacher (Class Pass, not Student view) sees a strip with Fill in sample answers, to test the sheet. */
(function(){
  "use strict";

  // The Extra Credit Book Forms sheet's web app: its Deploy > Web app URL, ending in /exec.
  // Empty = not set up yet: the form keeps the answers in this browser and says it can't be turned in yet.
  var EXEC_URL = "https://script.google.com/macros/s/AKfycbyH-o6gciZBDU4KkVKz9-d8JHyI2vikBkZETnkSADd8v7a-BNlcFeUALnk89AJ6XMwB/exec";
  // The sheet itself, "Extra Credit Book Forms" (shown only to the teacher, as a link; students can't open it)
  var SHEET_URL = "https://docs.google.com/spreadsheets/d/18FEuPeSee8-cH4XhsaxaIJjlPlTEff8WVJlqB7i-OjI/edit";

  var BOOK_SHEET = "16h2wTYYexj-FZ1xxdlCBCwt7WLL8cUBFWkaQ7KjwA2Y"; // the Extra Credit book list, as in extra-credit.html
  var GOAL_WORDS = 250;      // about one page, double-spaced
  var MAX_SIDE = 1600;       // pixels on the picture's long side
  var MAX_RAW = 6 * 1024 * 1024;
  var DRAFT = "ps8-bookform-v1:";
  var PERIODS = ["1", "2", "3", "4", "5", "6", "7"];

  var root = document.querySelector(".bf");
  if(!root) return;
  var kind = root.getAttribute("data-kind") === "nonfiction" ? "nonfiction" : "fiction";
  var GENRE = kind === "fiction" ? "Fiction" : "Non-fiction";
  var KIND_NAME = kind === "fiction" ? "Fiction" : "Nonfiction";

  function $(s, el){ return (el || root).querySelector(s); }
  function $$(s, el){ return Array.prototype.slice.call((el || root).querySelectorAll(s)); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function countWords(s){ return String(s || "").split(/\s+/).filter(function(w){ return /[A-Za-z0-9]/.test(w); }).length; }
  function newId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function fmtPts(n){ return n == null || n === "" ? "" : String(Math.round(Number(n) * 10) / 10); }

  /* ---------------- what the student has done so far ---------------- */
  // A draft is {v, id, t, who, book, own, fields, picture}: t = when the student last changed it (that computer's
  // clock), who = their Class Pass name. The same draft is kept on this computer and in their Class Pass account.
  var state = blank();
  function blank(){ return {v: 1, id: newId(), book: null, own: false, picture: null}; }
  var changedAt = 0;

  var saveTimer = null;
  // the student changed something: keep it on this computer at once, and in their account soon
  function save(){
    changedAt = Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 350);
    cloud.dirty = true;
    cloudSoon();
    paintSaved();
  }
  // who is signed in to Class Pass, so a shared computer doesn't show one student's answers to the next
  function passName(){
    var v = window.PS8Pass && window.PS8Pass.view ? window.PS8Pass.view() : null;
    return v && v.me && v.me.name ? String(v.me.name) : "";
  }
  // answers to questions not on the page right now (the Questions tab changed): kept in the draft until it is turned in
  var extraFields = {};
  function draftData(){
    var d = {v: 1, id: state.id, t: changedAt, who: passName(), book: state.book, own: state.own, fields: {}};
    Object.keys(extraFields).forEach(function(k){ d.fields[k] = extraFields[k]; });
    $$("[data-keep]").forEach(function(el){
      var k = el.getAttribute("data-keep");
      d.fields[k] = el.type === "checkbox" ? el.checked : el.value;
    });
    $$("[data-col].bf-chips, [data-col].bf-stars").forEach(function(g){ d.fields["pick:" + g.getAttribute("data-col")] = g.getAttribute("data-value") || ""; });
    return d;
  }
  function saveNow(){
    var d = draftData();
    d.picture = state.picture;
    try { localStorage.setItem(DRAFT + kind, JSON.stringify(d)); }
    catch(e){ // most likely the picture is too big to keep here: keep the words
      try { d.picture = null; localStorage.setItem(DRAFT + kind, JSON.stringify(d)); } catch(e2){ /* no storage here */ }
    }
  }
  function readLocal(){
    var d;
    try { d = JSON.parse(localStorage.getItem(DRAFT + kind)); } catch(e){ d = null; }
    if(!d || d.v !== 1) return null;
    var now = passName();
    if(d.who && now && d.who !== now) return null; // another student's answers: start fresh (theirs are replaced on the first save)
    return d;
  }
  function applyDraft(d){
    state.id = d.id || newId();
    state.own = Boolean(d.own);
    state.book = d.book || null;
    state.picture = d.picture || null;
    changedAt = Number(d.t) || 0;
    var f = d.fields || {};
    extraFields = {};
    Object.keys(f).forEach(function(k){ extraFields[k] = f[k]; });
    restoreFields(f);
  }
  function clearDraft(){ try { localStorage.removeItem(DRAFT + kind); } catch(e){ /* nothing kept */ } }
  // words written in a draft's answers (to choose between two different forms, one from each computer)
  function draftWords(d){
    var f = (d && d.fields) || {}, n = 0;
    texts.forEach(function(t){ n += countWords(f[t.getAttribute("data-keep")]); });
    return n;
  }
  function hasWork(){ return Boolean(changedAt || state.book || state.own || state.picture || totalWords()); }

  /* ---------------- the student's Class Pass account: finish on any computer ----------------
     A signed-in student's draft is also kept with their Class Pass sign-in on the vocabulary site (the bridge's
     formDraft / saveFormDraft / formDone, its /api/pass/draft): CLOUD_FIRST after a change, then at most every
     CLOUD_EVERY while they type, and at once when the page is hidden. The picture goes only when it changes.
     When the page opens, the form waits (inert) until the account answers, then takes the newer draft: the same
     form by its time, two different forms by the one with more words. A form turned in on another computer
     (doneId) isn't picked up again here. The teacher and guests keep drafts on this computer only. */
  var FORM = "book-" + kind;
  var CLOUD_FIRST = 4000, CLOUD_EVERY = 15000, CLOUD_RETRY = 30000;
  var PIC_CLOUD_MAX = 1750000; // characters; the account holds up to 1.8 million
  var cloud = {on: false, loaded: false, loading: false, timer: null, busy: false, dirty: false, sentPic: null, last: 0, saved: 0, error: "", bigPic: false};
  function isStudent(v){ return Boolean(v && v.me && !v.teacher && !v.student && window.PS8Pass && window.PS8Pass.ask); }
  function picKey(p){ return p ? p.data.length + ":" + p.data.slice(-48) : ""; }
  function clock(ms){ try { return new Date(ms).toLocaleTimeString([], {hour: "numeric", minute: "2-digit"}); } catch(e){ return ""; } }
  function cloudSoon(wait){
    if(!cloud.on || !cloud.loaded || cloud.timer || !cloud.dirty) return;
    var w = wait != null ? wait : Math.max(CLOUD_FIRST, CLOUD_EVERY - (Date.now() - cloud.last));
    cloud.timer = setTimeout(function(){ cloud.timer = null; cloudSave(); }, w);
  }
  function cloudSave(){
    if(!cloud.on || !cloud.loaded || !cloud.dirty || root.classList.contains("is-done")) return;
    if(cloud.busy) return; // it saves again when this one is back
    cloud.busy = true;
    cloud.dirty = false;
    var p = state.picture, key = picKey(p), big = Boolean(p && p.data.length > PIC_CLOUD_MAX);
    var msg = {type: "saveFormDraft", form: FORM, draftId: state.id, data: JSON.stringify(draftData())};
    if(key !== cloud.sentPic && !big) msg.picture = p ? JSON.stringify(p) : "";
    window.PS8Pass.ask(msg, 60000).then(function(r){
      if(r.turnedIn){ alreadyTurnedIn(); return; }
      if("picture" in msg) cloud.sentPic = key;
      cloud.saved = r.saved || Date.now();
      cloud.error = "";
      cloud.bigPic = big;
    }, function(err){
      cloud.dirty = true;
      cloud.error = err && err.status === 401 ? "signed-out" : "offline";
    }).then(function(){
      cloud.busy = false;
      cloud.last = Date.now();
      paintSaved();
      if(cloud.dirty) cloudSoon(cloud.error ? CLOUD_RETRY : undefined);
    });
  }
  function cloudLoad(){
    if(cloud.loaded || cloud.loading || !isStudent(window.PS8Pass && window.PS8Pass.view())) return;
    cloud.loading = true;
    cloud.on = true;
    var form = $(".bf-form");
    form.inert = true;
    root.classList.add("is-loading");
    note("Looking for answers you saved on another computer...", "wait");
    var told = "";
    window.PS8Pass.ask({type: "formDraft", form: FORM}, 20000).then(function(r){
      var server = null;
      if(r.draft){ try { server = JSON.parse(r.draft); if(r.picture) server.picture = JSON.parse(r.picture); } catch(e){ server = null; } }
      if(server && server.v !== 1) server = null;
      if(r.doneId && r.doneId === state.id && hasWork()){
        startOver();
        told = "You already turned in this form on another computer, so this is a new, blank one.";
      }
      var take = false;
      if(server){
        if(!hasWork()) take = true;
        else if(server.id === state.id) take = (Number(server.t) || 0) > changedAt;
        else take = draftWords(server) > totalWords();
      }
      if(take){
        applyDraft(server);
        paintAll();
        saveNow();
        cloud.sentPic = picKey(state.picture);
        cloud.saved = r.saved || 0;
        told = "Welcome back! Your answers saved " + (r.saved ? "at " + clock(r.saved) + " " : "") + "are here, so you can keep going.";
      } else if(hasWork()){
        cloud.dirty = true; // this computer has the newer answers: they go to the account
      }
      cloud.loaded = true;
    }, function(err){
      if(err && err.status === 401){ cloud.on = false; told = "Sign in with Class Pass again to save your answers to your account. For now they save on this computer."; }
      else told = "Couldn't check your account for saved answers. Your answers still save on this computer; reload the page to try again.";
      cloud.on = false;
    }).then(function(){
      cloud.loading = false;
      form.inert = false;
      root.classList.remove("is-loading");
      note(told);
      paintSaved();
      cloudSoon(CLOUD_FIRST);
    });
  }
  // another computer already turned this form in: start a new one here
  function alreadyTurnedIn(){
    startOver();
    note("You already turned in this form on another computer, so this is a new, blank one.");
    root.scrollIntoView({block: "start", behavior: "smooth"});
  }
  function paintSaved(){
    var s = $(".bf-saved");
    if(!s) return;
    var t = "";
    if(cloud.on && cloud.loaded){
      if(cloud.error === "signed-out") t = "Saved on this computer only. Sign in with Class Pass again to save to your account.";
      else if(cloud.error) t = "Saved on this computer. Couldn't reach your account just now; it will try again.";
      else if(cloud.dirty || cloud.busy) t = "Saving to your Class Pass account...";
      else if(cloud.saved) t = "Saved to your Class Pass account at " + clock(cloud.saved) + ". You can finish on any computer." +
        (cloud.bigPic ? " (Your picture is too big to save there: add it again if you switch computers.)" : "");
    } else if(changedAt) t = "Your answers are saved on this computer.";
    s.textContent = t;
  }
  // a note at the top of the form (welcome back, still loading, ...)
  function note(text, how){
    var n = $(".bf-note");
    if(!n){
      n = document.createElement("div");
      n.className = "bf-note";
      n.setAttribute("role", "status");
      n.setAttribute("data-no-edit", "");
      var at = $(".bf-required-note");
      at.parentNode.insertBefore(n, at);
    }
    n.textContent = text || "";
    n.className = "bf-note" + (text ? " show" : "") + (how === "wait" ? " wait" : "");
  }
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "hidden" && cloud.dirty && cloud.loaded){ clearTimeout(cloud.timer); cloud.timer = null; cloudSave(); }
  });

  /* ---------------- name and period from Class Pass ---------------- */
  var first = $("[data-student=first]"), last = $("[data-student=last]"), period = $("[data-student=period]");
  function ensureOption(sel, v){
    if(!v || sel.querySelector("option[value=\"" + String(v).replace(/"/g, "") + "\"]")) return;
    var o = document.createElement("option"); o.value = o.textContent = v; sel.appendChild(o);
  }
  PERIODS.forEach(function(p){ ensureOption(period, p); });
  function fromPass(v){
    if(!v || !v.me) return;
    var me = v.me, name = String(me.name || "").trim(), f = String(me.first || "").trim(), l = "";
    if(f && name.toLowerCase().indexOf(f.toLowerCase() + " ") === 0) l = name.slice(f.length).trim();
    else {
      var parts = name.split(/\s+/).filter(Boolean);
      if(!f) f = parts[0] || "";
      l = parts.slice(1).join(" ");
    }
    // Class Pass names a student "Maya R." (the leaderboard's short name): an initial isn't a last name
    if(/^[^\s.]{1,3}\.$/.test(l)) l = "";
    var changed = false;
    if(!first.value.trim() && f){ first.value = f; changed = true; }
    if(!last.value.trim() && l){ last.value = l; changed = true; }
    if(!period.value && me.period){ ensureOption(period, String(me.period)); period.value = String(me.period); changed = true; }
    if(changed){ $$(".bf-q.bad").forEach(recheck); saveNow(); } // filled in for them: not a change of theirs
  }
  function teacherLook(v){
    var t = Boolean(v && v.teacher && !v.student);
    root.classList.toggle("is-teacher", t);
    var link = $(".bf-teacher a.bf-sheet");
    if(link){ link.hidden = !SHEET_URL; if(SHEET_URL) link.href = SHEET_URL; }
  }

  /* ---------------- the questions (the sheet's Questions tab) ----------------
     The questions after "Your book and AR test" come from the Extra Credit Book Forms sheet's Questions tab
     (EXEC_URL?questions=1, the sheet's doGet), one list per form: {part, partNote, q, hint, starter, type, choices,
     min, required, id}. The page draws the last list it got (QKEY, this browser) or the built-in one
     (.bf-default-questions, made by class-tools/book-forms/build.js from questions.json), then the sheet's list as
     soon as it answers, keeping what the student has written (answers are kept by question id). */
  var QKEY = "ps8-bookform-questions-v1:" + kind;
  var STAR_SAY = ["", "Not for me", "It was OK", "Good", "Really good", "Loved it!"];
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
  var texts = [], questionsShown = "";
  function goodList(l){
    return Array.isArray(l) && l.length > 0 && l.every(function(q){ return q && typeof q.id === "string" && q.id && typeof q.q === "string" && q.q && typeof q.type === "string"; });
  }
  function builtInQuestions(){ try { var l = JSON.parse($(".bf-default-questions").textContent); return goodList(l) ? l : []; } catch(e){ return []; } }
  function cachedQuestions(){ try { var l = JSON.parse(localStorage.getItem(QKEY)); return goodList(l) ? l : null; } catch(e){ return null; } }
  function sheetQuestions(){
    if(!EXEC_URL) return Promise.resolve(null);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function(){ if(ctl) ctl.abort(); }, 15000);
    return fetch(EXEC_URL + "?questions=1", {cache: "no-store", signal: ctl ? ctl.signal : undefined})
      .then(function(r){ return r.json(); })
      .then(function(j){ var l = j && j.ok && j.questions && j.questions[kind]; return goodList(l) ? l : null; })
      .catch(function(){ return null; })
      .then(function(l){ clearTimeout(timer); return l; });
  }
  function qHTML(q, n){
    var tid = "t-q" + n, id = esc(q.id), head = esc(q.q), min = Math.max(0, Number(q.min) || 0);
    var choices = Array.isArray(q.choices) ? q.choices : [];
    var top = '<div class="bf-q' + (q.required === false ? "" : " req") + '">' +
      '<p class="bf-title" id="' + tid + '">' + head + "</p>" +
      (q.hint ? '<p class="bf-help">' + esc(q.hint) + "</p>" : "") +
      (q.starter ? '<p class="bf-starter">Try starting with: <i>' + esc(q.starter) + "</i></p>" : "");
    var keep = ' data-col="' + id + '" data-keep="' + id + '" data-head="' + head + '"';
    if(q.type === "Choice") return top + '<div class="bf-chips" data-col="' + id + '" data-head="' + head + '" aria-labelledby="' + tid + '">' +
      choices.map(function(c){ return '<button class="bf-chip" type="button">' + esc(c) + "</button>"; }).join("") + "</div></div>";
    if(q.type === "Stars") return top + '<div class="bf-stars" data-col="' + id + '" data-head="' + head + '" aria-labelledby="' + tid + '"></div></div>';
    if(q.type === "Short answer") return top + '<input class="bf-input bf-short"' + keep + ' aria-labelledby="' + tid + '" placeholder="Your answer" maxlength="300"></div>';
    if(q.type === "Several answers") return top + '<div class="bf-multi">' + choices.map(function(c, i){
      var sub = esc(q.id + " " + (i + 1)), subHead = esc(q.q + " (" + c + ")");
      return '<div><label for="' + tid + "-" + i + '">' + esc(c) + '</label><textarea class="bf-text" id="' + tid + "-" + i + '" data-col="' + sub +
        '" data-keep="' + sub + '" data-head="' + subHead + '" data-min="' + min + '" placeholder="Your answer" maxlength="1000"></textarea></div>';
    }).join("") + "</div></div>";
    return top + '<textarea class="bf-text' + (min >= 30 ? " big" : "") + '"' + keep + ' data-min="' + min + '" aria-labelledby="' + tid + '" placeholder="Your answer" maxlength="4000"></textarea></div>';
  }
  function renderQuestions(list){
    var box = $(".bf-questions");
    if(!box) return;
    var html = "", part = null, num = 2;
    list.forEach(function(q, n){
      if(q.part !== part){
        part = q.part;
        num++;
        html += '<div class="bf-part"><span class="bf-part-num">' + num + "</span><h2>" + esc(part || "Questions") + "</h2></div>" +
          (q.partNote ? '<p class="bf-part-help">' + esc(q.partNote) + "</p>" : "");
      }
      html += qHTML(q, n);
    });
    box.innerHTML = html;
    var lastNum = $(".bf-last-num");
    if(lastNum) lastNum.textContent = num + 1;
    $$("textarea.bf-text", box).forEach(function(t){
      var c = document.createElement("div");
      c.className = "bf-count";
      t.insertAdjacentElement("afterend", c);
      t._count = c;
    });
    $$(".bf-stars[data-col]", box).forEach(function(g){
      g.setAttribute("role", "radiogroup");
      var h = "";
      for(var i = 1; i <= 5; i++) h += '<button type="button" class="bf-star-btn" role="radio" aria-checked="false" data-v="' + i + '" aria-label="' + i + (i === 1 ? " star" : " stars") + '">' + STAR + "</button>";
      g.innerHTML = h + '<span class="bf-stars-say"></span>';
    });
    $$(".bf-chips[data-col]", box).forEach(function(g){
      g.setAttribute("role", "radiogroup");
      $$(".bf-chip", g).forEach(function(b){ b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false"); b.setAttribute("data-v", b.textContent.trim()); });
    });
    addErrs(box);
    texts = $$("textarea.bf-text");
    questionsShown = JSON.stringify(list);
  }
  // the sheet's questions changed while the page was open: draw them again, keeping every answer by its question id
  function redrawQuestions(list){
    var keep = draftData().fields;
    renderQuestions(list);
    restoreFields(keep);
    paintAll();
  }
  function restoreFields(f){
    $$("[data-keep]").forEach(function(el){
      var k = el.getAttribute("data-keep");
      if(!(k in f)) return;
      if(el.type === "checkbox") el.checked = Boolean(f[k]);
      else { if(el.tagName === "SELECT") ensureOption(el, f[k]); el.value = f[k]; }
    });
    $$("[data-col].bf-chips, [data-col].bf-stars").forEach(function(g){
      var k = "pick:" + g.getAttribute("data-col");
      if(k in f) setPick(g, f[k] || "");
    });
  }
  function addErrs(inside){
    $$(".bf-q.req", inside).forEach(function(q){
      if(!$(".bf-err", q)){ var e = document.createElement("div"); e.className = "bf-err"; e.setAttribute("role", "alert"); q.appendChild(e); }
    });
  }
  renderQuestions(cachedQuestions() || builtInQuestions());

  /* ---------------- answer boxes: growing, word counts ---------------- */
  function grow(t){ t.style.height = "auto"; t.style.height = (t.scrollHeight + 2) + "px"; }
  root.addEventListener("input", function(e){
    var t = e.target;
    if(!t.classList || !t.classList.contains("bf-text")) return;
    grow(t); paintCount(t); paintMeter();
  });
  function paintCount(t){
    if(!t._count) return;
    var n = countWords(t.value), min = Number(t.getAttribute("data-min")) || 0;
    var met = min ? n >= min : n > 0;
    t._count.classList.toggle("met", met && n > 0);
    t._count.textContent = n + (n === 1 ? " word" : " words") + (min && !met ? ", at least " + min : "");
  }
  function totalWords(){ return texts.reduce(function(s, t){ return s + countWords(t.value); }, 0); }
  function paintMeter(){
    var n = totalWords();
    var m = $(".bf-meter");
    if(!m) return;
    $(".bf-meter-n").textContent = n;
    $(".bf-meter-fill").style.width = Math.min(100, n / GOAL_WORDS * 100) + "%";
    m.classList.toggle("met", n >= GOAL_WORDS);
    $(".bf-meter-say").textContent = n >= GOAL_WORDS ? "That's a full page. Nice work!" : "Goal: about " + GOAL_WORDS + " words (one page, double-spaced)";
  }

  /* ---------------- one-pick buttons and stars ---------------- */
  function setPick(g, v){
    g.setAttribute("data-value", v);
    if(g.classList.contains("bf-stars")){
      var n = Number(v) || 0;
      $$(".bf-star-btn", g).forEach(function(b){ var i = Number(b.getAttribute("data-v")); b.classList.toggle("on", i <= n); b.setAttribute("aria-checked", String(i === n)); });
      $(".bf-stars-say", g).textContent = n ? n + " out of 5: " + STAR_SAY[n] : "";
    } else {
      $$(".bf-chip", g).forEach(function(b){ b.setAttribute("aria-checked", String(b.getAttribute("data-v") === v)); });
    }
  }
  root.addEventListener("click", function(e){
    var b = e.target.closest(".bf-chip, .bf-star-btn");
    if(!b) return;
    var g = b.closest("[data-col]");
    setPick(g, b.getAttribute("data-v"));
    recheck(g.closest(".bf-q"));
    save();
  });
  // arrow keys move along the buttons, as in a radio group
  root.addEventListener("keydown", function(e){
    var b = e.target.closest && e.target.closest(".bf-chip, .bf-star-btn");
    if(!b || ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
    var all = $$(".bf-chip, .bf-star-btn", b.closest("[data-col]"));
    var i = all.indexOf(b) + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
    if(i < 0 || i >= all.length) return;
    e.preventDefault();
    all[i].focus();
    all[i].click();
  });

  /* ---------------- the book ---------------- */
  var bookQ = $(".bf-q[data-book]");
  var search = $(".bf-picker input", bookQ), list = $(".bf-list", bookQ), picker = $(".bf-picker", bookQ);
  var books = [], hi = -1, shown = [];
  var COL = {title: 1, pages: 2, author: 3, points: 4, level: 5, genre: 6, img: 8};
  function normGenre(g){ return /^non/i.test(String(g || "").trim()) ? "Non-fiction" : (String(g || "").trim() ? "Fiction" : ""); }
  function parseGviz(json){
    var out = [];
    (json.table.rows || []).forEach(function(r){
      var c = r.c || [];
      function cell(i){ var x = c[i]; return x == null ? null : (x.v == null ? null : x.v); }
      var title = cell(COL.title), author = cell(COL.author);
      if(!title || !author || String(title).trim() === "Title") return;
      var pts = parseFloat(cell(COL.points));
      out.push({title: String(title).trim(), author: String(author).trim(), points: isNaN(pts) ? null : pts,
        genre: normGenre(cell(COL.genre)), img: String(cell(COL.img) || "").trim()});
    });
    return out.filter(function(b){ return b.points != null; });
  }
  function live(){
    var base = "https://docs.google.com/spreadsheets/d/" + BOOK_SHEET + "/gviz/tq?tqx=out:json";
    return fetch(base).then(function(r){ if(!r.ok) throw 0; return r.text(); })
      .then(function(t){ return parseGviz(JSON.parse(t.substring(t.indexOf("(") + 1, t.lastIndexOf(")")))); })
      .catch(function(){
        return new Promise(function(res, rej){
          var cb = "__bfgv_" + Math.random().toString(36).slice(2);
          var s = document.createElement("script");
          var timer = setTimeout(function(){ done(); rej(0); }, 12000);
          function done(){ clearTimeout(timer); delete window[cb]; s.remove(); }
          window[cb] = function(json){ done(); try { res(parseGviz(json)); } catch(e){ rej(e); } };
          s.src = base + ";responseHandler:" + cb;
          s.onerror = function(){ done(); rej(0); };
          document.head.appendChild(s);
        });
      });
  }
  function saved(){ // the copy kept in extra-credit.html
    return fetch("./extra-credit.html").then(function(r){ return r.text(); }).then(function(t){
      var m = t.match(/<script id="book-data" type="application\/json">([\s\S]*?)<\/script>/);
      return m ? JSON.parse(m[1]).map(function(b){ return {title: b.title, author: b.author, points: b.points, genre: normGenre(b.genre), img: b.img || ""}; }) : [];
    });
  }
  function useBooks(all){
    if(!all || !all.length) return;
    books = all.filter(function(b){ return b.genre === GENRE; }).sort(function(a, b){ return a.title.localeCompare(b.title); });
    if(picker.classList.contains("open")) renderList();
    pickFromAddress();
  }
  var gotLive = false;
  saved().then(function(b){ if(!gotLive) useBooks(b); }).catch(function(){});
  live().then(function(b){ if(b && b.length){ gotLive = true; useBooks(b); } }).catch(function(){});

  function cover(b, cls){
    return b.img ? '<img src="' + esc(b.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer"' + (cls ? ' class="' + cls + '"' : "") + ">" : '<span class="ph"></span>';
  }
  function renderList(){
    var q = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    shown = books.filter(function(b){
      var hay = (b.title + " " + b.author).toLowerCase();
      return q.every(function(w){ return hay.indexOf(w) >= 0; });
    }).slice(0, 80);
    hi = shown.length ? 0 : -1;
    if(!books.length) list.innerHTML = '<div class="bf-list-note">Loading the book list...</div>';
    else if(!shown.length) list.innerHTML = '<div class="bf-list-note">No ' + KIND_NAME.toLowerCase() + ' book on the list matches that. Check the spelling, or click "My book isn\'t on the list".</div>';
    else list.innerHTML = shown.map(function(b, i){
      return '<div class="bf-opt' + (i === hi ? " hi" : "") + '" role="option" id="bfopt' + i + '" data-i="' + i + '" aria-selected="' + (i === hi) + '">' + cover(b) +
        '<span><span class="t">' + esc(b.title) + '</span><span class="a">' + esc(b.author) + "</span></span>" +
        '<span class="p">' + fmtPts(b.points) + " pts</span></div>";
    }).join("");
    search.setAttribute("aria-activedescendant", hi >= 0 ? "bfopt" + hi : "");
  }
  function openList(open){
    picker.classList.toggle("open", open);
    search.setAttribute("aria-expanded", String(open));
    if(open) renderList();
  }
  function moveHi(by){
    if(!shown.length) return;
    hi = (hi + by + shown.length) % shown.length;
    $$(".bf-opt", list).forEach(function(o, i){ o.classList.toggle("hi", i === hi); o.setAttribute("aria-selected", String(i === hi)); });
    var el = $("#bfopt" + hi, list);
    if(el) el.scrollIntoView({block: "nearest"});
    search.setAttribute("aria-activedescendant", "bfopt" + hi);
  }
  search.addEventListener("focus", function(){ openList(true); });
  search.addEventListener("input", function(){ openList(true); });
  search.addEventListener("blur", function(){ setTimeout(function(){ openList(false); }, 120); });
  search.addEventListener("keydown", function(e){
    if(e.key === "ArrowDown"){ e.preventDefault(); if(!picker.classList.contains("open")) openList(true); else moveHi(1); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); moveHi(-1); }
    else if(e.key === "Enter"){ e.preventDefault(); if(hi >= 0 && shown[hi]) chooseBook(shown[hi]); }
    else if(e.key === "Escape"){ openList(false); }
  });
  list.addEventListener("mousedown", function(e){ e.preventDefault(); }); // keep the box focused while clicking
  list.addEventListener("click", function(e){
    var o = e.target.closest(".bf-opt");
    if(o) chooseBook(shown[Number(o.getAttribute("data-i"))]);
  });
  function chooseBook(b){
    if(!b) return;
    state.book = {title: b.title, author: b.author, points: b.points, img: b.img || ""};
    state.own = false;
    openList(false);
    search.value = "";
    paintBook();
    recheck(bookQ);
    save();
    var next = $("[data-ar-score]");
    if(next && !next.value) next.focus();
  }
  function paintBook(){
    bookQ.classList.toggle("own-book", state.own);
    bookQ.classList.toggle("has-book", Boolean(state.book) && !state.own);
    var c = $(".bf-chosen", bookQ);
    if(state.book){
      $(".cover", c).innerHTML = cover(state.book);
      $(".t", c).textContent = state.book.title;
      $(".a", c).textContent = "by " + state.book.author;
      $(".p", c).textContent = fmtPts(state.book.points) + " points";
    }
  }
  $(".bf-change", bookQ).addEventListener("click", function(){
    state.book = null; paintBook(); save(); search.focus();
  });
  $(".bf-own-open", bookQ).addEventListener("click", function(){
    state.own = true; paintBook(); save(); $("[data-keep=ownTitle]").focus();
  });
  $(".bf-own-close", bookQ).addEventListener("click", function(){
    state.own = false; paintBook(); save(); if(!state.book) search.focus();
  });
  var askedFor = (function(){ try { return new URLSearchParams(location.search).get("book") || ""; } catch(e){ return ""; } })();
  function pickFromAddress(){
    if(!askedFor || state.book || state.own) return;
    var want = askedFor.toLowerCase().trim();
    var b = books.filter(function(x){ return x.title.toLowerCase() === want; })[0];
    if(b){ state.book = {title: b.title, author: b.author, points: b.points, img: b.img || ""}; paintBook(); save(); }
    askedFor = "";
  }

  /* ---------------- the AR test picture ---------------- */
  var picQ = $(".bf-q[data-picture]");
  var fileIn = $("input[type=file]", picQ), drop = $(".bf-drop", picQ);
  drop.addEventListener("click", function(){ fileIn.click(); });
  $(".bf-pic-replace", picQ).addEventListener("click", function(){ fileIn.click(); });
  $(".bf-pic-remove", picQ).addEventListener("click", function(){ state.picture = null; paintPicture(); save(); drop.focus(); });
  fileIn.addEventListener("change", function(){ takeFile(fileIn.files && fileIn.files[0]); fileIn.value = ""; });
  ["dragenter", "dragover"].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function(t){ drop.addEventListener(t, function(){ drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function(e){ e.preventDefault(); takeFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
  // a screenshot on the clipboard (Chromebook: Ctrl + Show windows copies one) pastes anywhere on the page
  document.addEventListener("paste", function(e){
    if(root.classList.contains("is-done")) return;
    var items = (e.clipboardData && e.clipboardData.items) || [];
    var typing = e.target && e.target.closest && e.target.closest("textarea, input");
    if(typing && e.clipboardData.types && Array.prototype.indexOf.call(e.clipboardData.types, "text/plain") >= 0) return; // words pasted into an answer
    for(var i = 0; i < items.length; i++){
      if(items[i].kind === "file" && /^image\//.test(items[i].type)){
        e.preventDefault();
        takeFile(items[i].getAsFile());
        picQ.scrollIntoView({block: "center", behavior: "smooth"});
        return;
      }
    }
  });
  function picError(text){
    picQ.classList.add("bad");
    $(".bf-err", picQ).textContent = text;
  }
  function takeFile(file){
    if(!file) return;
    var isPic = /^image\//.test(file.type) || /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name || "");
    if(!isPic){ picError("That file isn't a picture. Choose a screenshot or a photo of your AR test."); return; }
    picQ.classList.add("pic-busy");
    shrink(file).catch(function(){ return raw(file); }).then(function(p){
      state.picture = p;
      paintPicture();
      recheck(picQ);
      save();
    }).catch(function(err){
      picError(err && err.message ? err.message : "That picture couldn't be opened. Try a screenshot instead.");
    }).then(function(){ picQ.classList.remove("pic-busy"); });
  }
  function shrink(file){
    return new Promise(function(res, rej){
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function(){
        var w = img.naturalWidth, h = img.naturalHeight;
        if(!w || !h){ URL.revokeObjectURL(url); rej(); return; }
        // smaller and a little softer until it fits in the student's account (a busy phone photo can be big)
        var side = MAX_SIDE, q = 0.85, d = "";
        for(var tries = 0; tries < 4; tries++){
          var s = Math.min(1, side / Math.max(w, h));
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
          var g = c.getContext("2d");
          g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          d = c.toDataURL("image/jpeg", q);
          if(d.length - d.indexOf(",") - 1 <= PIC_CLOUD_MAX) break;
          side = Math.round(side * 0.8); q = Math.max(0.6, q - 0.08);
        }
        URL.revokeObjectURL(url);
        res({type: "image/jpeg", data: d.slice(d.indexOf(",") + 1), name: file.name || "screenshot.jpg", shown: true});
      };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(); };
      img.src = url;
    });
  }
  function raw(file){ // a picture this browser can't open (an iPhone HEIC): send it as it is
    return new Promise(function(res, rej){
      if(file.size > MAX_RAW){ rej(new Error("That picture is too big. Take a screenshot of your AR test instead.")); return; }
      var type = file.type || (/\.heif$/i.test(file.name) ? "image/heif" : "image/heic");
      if(!/^image\/(jpeg|png|gif|webp|heic|heif)$/.test(type)){ rej(new Error("That kind of picture can't be sent. Take a screenshot (PNG or JPG) instead.")); return; }
      var r = new FileReader();
      r.onload = function(){ var d = String(r.result); res({type: type, data: d.slice(d.indexOf(",") + 1), name: file.name || "picture", shown: false}); };
      r.onerror = function(){ rej(); };
      r.readAsDataURL(file);
    });
  }
  function paintPicture(){
    var p = state.picture;
    picQ.classList.toggle("has-pic", Boolean(p));
    var img = $(".bf-shot img", picQ), note = $(".bf-shot .name", picQ);
    if(!p){ img.removeAttribute("src"); return; }
    if(p.shown){ img.hidden = false; img.src = "data:" + p.type + ";base64," + p.data; }
    else { img.hidden = true; img.removeAttribute("src"); }
    note.textContent = p.shown ? "" : "(" + p.name + ": it can't be shown here, but it will be sent)";
  }

  /* ---------------- checking before it is sent ---------------- */
  var REQUIRED = "This is a required question.";
  function problem(q){
    if(q.hasAttribute("data-book")){
      if(state.own){
        var t = $("[data-keep=ownTitle]").value.trim(), a = $("[data-keep=ownAuthor]").value.trim();
        return t && a ? "" : "Type your book's title and author.";
      }
      return state.book ? "" : "Pick your book from the list, or click \"My book isn't on the list\".";
    }
    if(q.hasAttribute("data-picture")) return state.picture ? "" : "Add a picture of your AR test.";
    var score = $("[data-ar-score]", q);
    if(score){
      var n = Number(score.value);
      if(score.value.trim() === "") return REQUIRED;
      return isFinite(n) && n >= 0 && n <= 100 ? "" : "Type your score as a number from 0 to 100.";
    }
    var own = $("[data-own-words]", q);
    if(own) return own.checked ? "" : "Check the box to turn in your form.";
    var pick = $(".bf-chips[data-col], .bf-stars[data-col]", q);
    if(pick) return pick.getAttribute("data-value") ? "" : (pick.classList.contains("bf-stars") ? "Pick a number of stars." : "Pick one.");
    var short = $$(".bf-input, .bf-select", q).filter(function(el){ return !el.value.trim(); });
    if(short.length) return REQUIRED;
    var boxes = $$("textarea.bf-text", q);
    var shortOnes = boxes.filter(function(t){ return countWords(t.value) < (Number(t.getAttribute("data-min")) || 1); });
    if(!shortOnes.length) return "";
    if(boxes.length > 1){
      var each = Number(boxes[0].getAttribute("data-min")) || 0;
      return each > 1 ? "Each one needs at least " + each + " words." : "Each one needs an answer.";
    }
    var have = countWords(shortOnes[0].value);
    return have ? "Write a little more: at least " + shortOnes[0].getAttribute("data-min") + " words (you have " + have + ")." : REQUIRED;
  }
  function recheck(q){
    if(!q || !q.classList.contains("bad")) return;
    var p = problem(q);
    if(!p) q.classList.remove("bad"); else $(".bf-err", q).textContent = p;
  }
  $$(".bf-q.req").forEach(function(q){
    if(!$(".bf-err", q)){ var e = document.createElement("div"); e.className = "bf-err"; e.setAttribute("role", "alert"); q.appendChild(e); }
  });
  function checkAll(){
    var bad = [];
    $$(".bf-q.req").forEach(function(q){
      var p = problem(q);
      q.classList.toggle("bad", Boolean(p));
      if(p){ $(".bf-err", q).textContent = p; bad.push(q); }
    });
    return bad;
  }
  ["input", "change"].forEach(function(type){
    root.addEventListener(type, function(e){
      if(e.target === search || e.target === fileIn) return; // looking for a book, or the picture (saved once it is ready)
      var q = e.target.closest && e.target.closest(".bf-q");
      if(q) recheck(q);
      save();
    });
  });

  /* ---------------- sending ---------------- */
  var submit = $(".bf-submit"), msg = $(".bf-msg");
  function say(text){ msg.textContent = text; msg.className = "bf-msg" + (text ? " show bad" : ""); }
  function answers(){
    return $$("[data-col]").map(function(el){
      var col = el.getAttribute("data-col"), v;
      if(el.classList.contains("bf-stars")) v = el.getAttribute("data-value") ? el.getAttribute("data-value") + " out of 5" : "";
      else if(el.classList.contains("bf-chips")) v = el.getAttribute("data-value") || "";
      else v = el.value.trim();
      // col = the question's id (the sheet finds its column by it); head = the question, which titles that column
      return {col: col, head: el.getAttribute("data-head") || col, value: v};
    });
  }
  function message(){
    var book = state.own
      ? {title: $("[data-keep=ownTitle]").value.trim(), author: $("[data-keep=ownAuthor]").value.trim(), points: "", onList: false}
      : {title: state.book.title, author: state.book.author, points: state.book.points, onList: true};
    return {
      app: "book-forms", kind: kind, id: state.id, page: location.pathname,
      student: {first: first.value.trim(), last: last.value.trim(), period: period.value},
      book: book, arScore: Number($("[data-ar-score]").value), words: totalWords(), answers: answers(),
      picture: {name: state.picture.name, type: state.picture.type, data: state.picture.data}
    };
  }
  submit.addEventListener("click", function(){
    say("");
    var bad = checkAll();
    if(bad.length){
      say(bad.length === 1 ? "One answer still needs work. It's marked in red." : bad.length + " answers still need work. They're marked in red.");
      bad[0].scrollIntoView({block: "center", behavior: "smooth"});
      var f = $("textarea, input:not([type=file]), select, button", bad[0]);
      if(f) setTimeout(function(){ try { f.focus({preventScroll: true}); } catch(e){ f.focus(); } }, 350);
      return;
    }
    if(!EXEC_URL){
      say("This form isn't connected to Mr. LaMarr's sheet yet, so it can't be turned in today. Your answers are saved on this computer: come back to this page later and click Submit again.");
      return;
    }
    send();
  });
  function send(){
    submit.disabled = true;
    submit.textContent = "Sending...";
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function(){ if(ctl) ctl.abort(); }, 90000);
    var sent = message();
    fetch(EXEC_URL, {method: "POST", body: JSON.stringify(sent), signal: ctl ? ctl.signal : undefined})
      .then(function(r){ return r.text(); })
      .then(function(t){
        var j;
        try { j = JSON.parse(t); } catch(e){ throw new Error("Mr. LaMarr's sheet sent back something unexpected. Click Submit again."); }
        if(!j.ok) throw new Error(j.error || "The sheet didn't save it. Click Submit again.");
        turnedIn(sent);
      })
      .catch(function(e){
        if(e && e.name === "AbortError") say("The sheet took too long to answer. Click Submit again (your answers are still here).");
        else if(e && e.message && !/fetch|network|load failed/i.test(e.message)) say(e.message);
        else say("Couldn't reach Mr. LaMarr's sheet. Check that you're online, then click Submit again. Your answers are still here.");
      })
      .then(function(){ clearTimeout(timer); submit.disabled = false; submit.textContent = "Submit"; });
  }
  function turnedIn(sent){
    clearTimeout(saveTimer);
    clearDraft();
    clearTimeout(cloud.timer);
    cloud.timer = null;
    cloud.dirty = false;
    if(cloud.on){ // forget it in the account too, so another computer doesn't bring it back (one retry if offline)
      var done = function(){ return window.PS8Pass.ask({type: "formDone", form: FORM, draftId: sent.id}, 30000); };
      done().catch(function(){ setTimeout(function(){ done().catch(function(){}); }, 10000); });
    }
    var d = $(".bf-done");
    $("h2", d).textContent = "Turned in! Thanks, " + sent.student.first + ".";
    $(".bf-done-book", d).textContent = sent.book.title;
    $(".bf-done-pts", d).textContent = sent.book.onList ? fmtPts(sent.book.points) + " extra credit points" : "your extra credit points (once your book is approved)";
    root.classList.add("is-done");
    root.scrollIntoView({block: "start", behavior: "smooth"});
  }
  // a new, blank form (the name and period stay)
  function startOver(){
    var keep = {first: first.value, last: last.value, period: period.value};
    state = blank();
    changedAt = 0;
    extraFields = {};
    $$(".bf-short").forEach(function(el){ el.value = ""; });
    cloud.sentPic = null;
    cloud.dirty = false;
    cloud.saved = 0;
    $$("textarea.bf-text, [data-ar-score], [data-keep=ownTitle], [data-keep=ownAuthor]").forEach(function(el){ el.value = ""; });
    $$("[data-own-words]").forEach(function(el){ el.checked = false; });
    $$("[data-col].bf-chips, [data-col].bf-stars").forEach(function(g){ g.removeAttribute("data-value"); setPick(g, ""); });
    first.value = keep.first; last.value = keep.last; period.value = keep.period;
    $$(".bf-q.bad").forEach(function(q){ q.classList.remove("bad"); });
    paintAll();
    say("");
    root.classList.remove("is-done");
    saveNow();
    paintSaved();
  }
  $(".bf-again").addEventListener("click", function(){
    startOver();
    note("");
    root.scrollIntoView({block: "start", behavior: "smooth"});
  });

  /* ---------------- the teacher's test button ---------------- */
  var sampleBtn = $(".bf-sample");
  if(sampleBtn) sampleBtn.addEventListener("click", function(){
    if(!first.value) first.value = "Test";
    if(!last.value) last.value = "Student";
    if(!period.value) period.value = PERIODS[0];
    if(!state.book && books[0]) state.book = {title: books[0].title, author: books[0].author, points: books[0].points, img: books[0].img || ""};
    state.own = false;
    $("[data-ar-score]").value = "90";
    texts.forEach(function(t){
      if(countWords(t.value) >= (Number(t.getAttribute("data-min")) || 1)) return;
      var s = "This is a sample answer from Mr. LaMarr to test the form.";
      var out = [];
      while(countWords(out.join(" ")) < (Number(t.getAttribute("data-min")) || 10)) out.push(s);
      t.value = out.join(" ");
    });
    $$(".bf-short").forEach(function(el){ if(!el.value.trim()) el.value = "Sample answer"; });
    $$("[data-col].bf-chips").forEach(function(g){ if(!g.getAttribute("data-value") && $(".bf-chip", g)) setPick(g, $(".bf-chip", g).getAttribute("data-v")); });
    $$("[data-col].bf-stars").forEach(function(g){ if(!g.getAttribute("data-value")) setPick(g, "4"); });
    $$("[data-own-words]").forEach(function(el){ el.checked = true; });
    if(!state.picture){
      var c = document.createElement("canvas"); c.width = 640; c.height = 360;
      var g = c.getContext("2d");
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, 640, 360);
      g.fillStyle = "#123C5E"; g.font = "bold 34px Poppins, sans-serif"; g.fillText("Sample AR test picture", 40, 90);
      g.font = "24px Poppins, sans-serif"; g.fillText("Percent correct: 90%", 40, 160); g.fillText(new Date().toLocaleString(), 40, 210);
      var d = c.toDataURL("image/jpeg", 0.85);
      state.picture = {type: "image/jpeg", data: d.slice(d.indexOf(",") + 1), name: "sample.jpg", shown: true};
    }
    paintAll();
    $$(".bf-q.bad").forEach(recheck);
    save();
  });

  /* ---------------- start ---------------- */
  function paintAll(){
    paintBook();
    paintPicture();
    texts.forEach(function(t){ grow(t); paintCount(t); });
    paintMeter();
  }
  var local = readLocal();
  if(local) applyDraft(local);
  paintAll();
  paintSaved();
  // the Questions tab's questions, if they differ from the ones drawn
  sheetQuestions().then(function(list){
    if(!list) return;
    try { localStorage.setItem(QKEY, JSON.stringify(list)); } catch(e){ /* drawn now, fetched again next time */ }
    if(JSON.stringify(list) !== questionsShown) redrawQuestions(list);
  });
  if(window.PS8Pass){
    var v = window.PS8Pass.view();
    fromPass(v); teacherLook(v); cloudLoad();
    if(window.PS8Pass.onChange) window.PS8Pass.onChange(function(nv){
      fromPass(nv); teacherLook(nv);
      if(isStudent(nv)){ if(cloud.loaded) cloud.on = true; else cloudLoad(); }
      else cloud.on = false; // signed out, or the teacher: this computer only
      paintSaved();
    });
  }
  window.addEventListener("resize", function(){ texts.forEach(grow); });
  // a textarea measured while the page was hidden (the Class Pass sign-in screen) is measured again once it shows
  if(window.ResizeObserver){
    var lastWidth = 0;
    new ResizeObserver(function(){
      var w = root.clientWidth;
      if(w && w !== lastWidth){ lastWidth = w; texts.forEach(grow); }
    }).observe(root);
  }
})();
