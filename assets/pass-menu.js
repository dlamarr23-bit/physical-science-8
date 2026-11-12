/* Physical Science 8: the Class Pass button in the top bar (Donny, 2026-10-20).

   Class Pass and the leaderboard live on the vocabulary site (vocabulary-room901.pages.dev), which the Review
   and Leaderboard pages show in a frame with its own top bar hidden. So this site's top bar has the button:
   - signed out: "Class Pass / Sign in", with a menu: Sign in, Leaderboard, Teacher sign in;
   - a student: a round button with their first letter; the menu says who is signed in, links to the
     Leaderboard and Review, and signs out;
   - the teacher (the teacher password, the same one that edits flashcard sets): Mr. LaMarr's picture; the
     menu adds Edit this page (page-text.js), Assignment Launchpad (launchpad.html) and Host a game.

   How this page knows who is signed in: every page keeps the vocabulary site's bridge/ page in a hidden
   frame (its assets/book-bridge.js). That page tells this one who is signed in there, now and whenever it
   changes, and does the signing in and out and the saving of changed words for this page. The sign-in
   window opens from here (a frame cannot open one from a button out here) with a random number, and the
   bridge picks the sign-in up under that number. What the bridge said last is kept in this browser
   (ps8-pass-view-v1: a name, a period, and whether it is the teacher) so the button is right at once.

   The sign-in screen (Donny, 2026-11-03): students sign in with Class Pass to use this site. A line in each
   page's <head> puts html.cp-gate-on on (every page but the Chromebook help page and the teacher's
   Launchpad), and html.cp-locked too when this browser has no sign-in on record, which hides the page
   (style.css) before it draws. This file then shows the sign-in screen (.cp-gate) until a student, the
   teacher or a guest is signed in. A guest is a teacher from another school with the guest code, which
   Donny sees and changes from this menu (Guest code); the bridge keeps the guest's key. The page's words
   are still in its file, so this keeps out visitors, not someone who reads the files.

   Every menu also has the Dark mode switch. The choice is kept in this browser (ps8-theme = "dark"; light is
   the default), and a line in each page's <head> puts html[data-theme="dark"] on before the page draws.
   Pages that show something in a frame hear about a change from the "ps8:theme" event (sims.html). The sims have
   no light/dark button of their own (Donny, 2026-11-11), so a chapter's links to them carry the mode (?theme=).

   Student view (Donny, 2026-11-10): the teacher's menu has Student view. The teacher stays signed in, but every
   page acts as if a student were looking: view() says {student: true} and no teacher, so Edit this page, the
   Launchpad, the Guest code and Host a game are gone, the Launchpad is locked, and the framed Review and Leaderboard
   pages hide the teacher's tools (their address gets ?sv=1, see the vocabulary site's editor.js). The menu then says
   STUDENT VIEW with Leave student view; the button keeps the teacher's picture with an orange ring. The choice is kept
   in this browser (ps8-student-view = "1") and the page reloads when it changes, so everything on it redraws.

   Report bugs & feedback (Donny, 2026-11-11): every menu but the teacher's has it, and so does the end of each page's
   footer. It opens the panel in assets/feedback.js, which sends a report or an idea through the bridge; the teacher
   reads them on feedback.html (Feedback inbox, in his menu). Special permission (the same day): an account that is not
   on the class list can still sign in when it is in SPECIAL in the vocabulary site's game-server/src/board.js.
   Site check (the same day): the teacher's menu links to site-check.html, the nightly check of the book's videos and
   links (replacements to pick) and how much of each free limit the site has used.

   window.PS8Pass: view(), onChange(fn), ask(message) (a question for the bridge; resolves with its answer),
   theme(), setTheme("light" | "dark"), studentView(), setStudentView(on), feedback() (opens the panel). */
(function(){
  "use strict";

  var VOCAB = "https://vocabulary-room901.pages.dev";
  var VIEW_KEY = "ps8-pass-view-v1";

  function readView(){
    try { var v = JSON.parse(localStorage.getItem(VIEW_KEY)); if(v && typeof v === "object") return {me: v.me || null, teacher: Boolean(v.teacher), guest: Boolean(v.guest)}; } catch(e){ /* no storage */ }
    return {me: null, teacher: false, guest: false};
  }
  function signedIn(v){ return Boolean(v.me || v.teacher || v.guest || v.student); }
  function saveView(v){ try { localStorage.setItem(VIEW_KEY, JSON.stringify(v)); } catch(e){ /* a per-browser convenience only */ } }

  /* ---------- student view: the teacher, looking the way a student does ---------- */
  var SV_KEY = "ps8-student-view";
  function svChosen(){ try { return localStorage.getItem(SV_KEY) === "1"; } catch(e){ return false; } }
  function studentView(){ return Boolean(view.teacher && svChosen()); }
  // what the pages are told: in student view nobody is the teacher, but someone is signed in (so no sign-in screen)
  function shown(){ return studentView() ? {me: null, teacher: false, guest: false, student: true} : view; }
  function setStudentView(on){
    try { if(on) localStorage.setItem(SV_KEY, "1"); else localStorage.removeItem(SV_KEY); } catch(e){ /* this page only */ }
    location.reload();
  }
  // changed in another tab of this site
  window.addEventListener("storage", function(e){ if(e.key === SV_KEY && view.teacher) location.reload(); });

  var view = readView();
  var listeners = [];
  var bridge = null, bridgeReady = false, queue = [], waiting = {}, nextId = 1;

  /* ---------- dark mode ---------- */
  var THEME_KEY = "ps8-theme";
  function theme(){ return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function showTheme(t){
    if(t === theme()) return;
    if(t === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    draw();
    window.dispatchEvent(new CustomEvent("ps8:theme", {detail: t}));
  }
  function setTheme(t){
    t = t === "dark" ? "dark" : "light";
    try { if(t === "dark") localStorage.setItem(THEME_KEY, "dark"); else localStorage.removeItem(THEME_KEY); } catch(e){ /* this page only */ }
    showTheme(t);
  }
  // switched in another tab of this site
  window.addEventListener("storage", function(e){
    if(e.key === THEME_KEY) showTheme(e.newValue === "dark" ? "dark" : "light");
  });
  // a chapter's links to the sim library open the sim in this site's mode (the sims read ?theme=)
  function themeSimLinks(){
    var links = document.querySelectorAll('a[href^="https://sim-library-87y.pages.dev/"]');
    for(var i = 0; i < links.length; i++){
      try { var u = new URL(links[i].href); u.searchParams.set("theme", theme()); links[i].href = u.href; } catch(e){ /* leave it */ }
    }
  }
  window.addEventListener("ps8:theme", themeSimLinks);

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }
  // the site's own links are written "./x.html" on most pages and "/x.html" on the framed ones
  function prefix(){
    var home = document.querySelector(".topbar .brand");
    return home && /^\.\//.test(home.getAttribute("href") || "") ? "./" : "/";
  }

  /* ---------- talking to the bridge ---------- */
  function send(msg){
    if(!bridgeReady){ queue.push(msg); return; }
    try { bridge.contentWindow.postMessage({vocabBridge: msg}, VOCAB); } catch(e){ /* the frame went away */ }
  }
  function ask(msg, ms){
    return new Promise(function(resolve, reject){
      var id = String(nextId++);
      var timer = setTimeout(function(){
        delete waiting[id];
        reject(new Error("Class Pass did not answer. Check the internet connection, then try again."));
      }, ms || 20000);
      waiting[id] = function(r){
        clearTimeout(timer);
        delete waiting[id];
        if(r.ok) resolve(r.data || {});
        else { var err = new Error(r.error || "That did not work. Try again."); err.status = r.status || 0; reject(err); }
      };
      msg.id = id;
      send(msg);
    });
  }
  function startBridge(){
    if(bridge) return;
    bridge = document.createElement("iframe");
    bridge.src = VOCAB + "/bridge/";
    bridge.title = "Class Pass";
    bridge.setAttribute("aria-hidden", "true");
    bridge.tabIndex = -1;
    bridge.style.display = "none";
    document.body.appendChild(bridge);
  }
  window.addEventListener("message", function(e){
    if(e.origin !== VOCAB || !bridge || e.source !== bridge.contentWindow) return;
    var m = e.data && e.data.vocabBridge;
    if(!m) return;
    if(m.type === "state"){
      if(!bridgeReady){
        bridgeReady = true;
        queue.splice(0).forEach(send);
      }
      var me = m.me && typeof m.me === "object" ? {name: String(m.me.name || ""), first: String(m.me.first || ""), period: m.me.period ? String(m.me.period) : ""} : null;
      // a browser that blocks the bridge's storage forgets a sign-in there on every page: this site's own record stands
      var keep = m.kept === false;
      // until the bridge has asked the site about the teacher password, keep what this browser knew
      var next = {me: me || (keep ? view.me : null), teacher: m.checked ? Boolean(m.teacher) : view.teacher, guest: Boolean(m.guest) || (keep && view.guest)};
      if(m.checked || next.me || next.guest) saveView(next);
      setView(next);
    } else if(m.type === "reply" && waiting[m.id]){
      waiting[m.id](m);
    }
  });

  function setView(v){
    var was = JSON.stringify(shown());
    var changed = JSON.stringify(v) !== JSON.stringify(view);
    view = v;
    if(!changed) return;
    draw(); gate();
    if(JSON.stringify(shown()) !== was) listeners.forEach(function(fn){ try { fn(shown()); } catch(e){ /* one listener's problem */ } });
  }

  /* ---------- signing in and out ---------- */
  function nonce(){
    var a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function(x){ return ("0" + x.toString(16)).slice(-2); }).join("");
  }
  var signingIn = null;
  function signIn(){
    if(signingIn && signingIn.win && !signingIn.win.closed){ try { signingIn.win.focus(); } catch(e){} return; }
    var n = nonce(), win = null;
    try { win = window.open(VOCAB + "/signin/?n=" + n, "classpass", "popup,width=520,height=700"); } catch(e){ win = null; }
    if(!win){
      toast("Your browser blocked the sign-in window. Allow pop-ups for this site, then press Sign in again.", true);
      gateMsg("Your browser blocked the sign-in window. Allow pop-ups for this site, then press Sign in again.", true);
      return;
    }
    gateMsg("Finish signing in in the window that opened.");
    var job = {win: win, done: false};
    signingIn = job;
    // closed without finishing: one more look a few seconds later (the bridge keeps asking), then stop
    var closedAt = 0;
    var watch = setInterval(function(){
      if(job.done){ clearInterval(watch); return; }
      if(win.closed && !closedAt) closedAt = Date.now();
      if(closedAt && Date.now() - closedAt > 6000){ clearInterval(watch); send({type: "stop"}); }
    }, 1000);
    ask({type: "claim", nonce: n}, 11 * 60 * 1000).then(function(me){
      job.done = true;
      toast("Signed in as " + ((me && me.name) || "you") + ". Your games and practice count on the leaderboard.");
    }, function(err){
      job.done = true;
      if(!win.closed) try { win.close(); } catch(e){}
      toast(err.message, true);
      gateMsg(err.message, true);
    }).then(function(){ if(signingIn === job) signingIn = null; });
  }
  function signOut(){
    try { localStorage.removeItem(SV_KEY); } catch(e){ /* nothing kept */ }
    if(view.me) send({type: "signOut"});
    if(view.guest) send({type: "guestOut"});
    if(view.teacher){
      ask({type: "logout"}).catch(function(err){ toast(err.message, true); });
    }
    setView({me: null, teacher: false, guest: false});
    saveView(view);
  }

  // A small window over the page: its tag, title and words, a box to type in, a line for messages and a
  // button. d.close() takes it away (so do the X, Escape and a click outside it).
  function dialog(o){
    var old = document.querySelector(".cp-dlg-back");
    if(old) old.remove();
    var back = el("div", "cp-dlg-back");
    var box = el("form", "cp-dlg");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "cpDlgTitle");
    var x = el("button", "cp-dlg-x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    box.appendChild(x);
    box.appendChild(el("span", "cp-tag", "Teacher"));
    var h = el("h2", "cp-dlg-title", o.title);
    h.id = "cpDlgTitle";
    box.appendChild(h);
    box.appendChild(el("p", "cp-dlg-text", o.text));
    var input = el("input", "cp-dlg-input");
    input.type = o.password ? "password" : "text";
    if(o.password) input.autocomplete = "current-password";
    else { input.autocomplete = "off"; input.spellcheck = false; }
    input.setAttribute("aria-label", o.label);
    box.appendChild(input);
    var msg = el("p", "cp-msg");
    msg.setAttribute("role", "status");
    box.appendChild(msg);
    var go = el("button", "btn cp-dlg-go", o.button);
    go.type = "submit";
    box.appendChild(go);
    back.appendChild(box);
    document.body.appendChild(back);
    input.focus();
    function close(){ back.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e){ if(e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    x.addEventListener("click", close);
    back.addEventListener("click", function(e){ if(e.target === back) close(); });
    function say(text, bad){ msg.className = "cp-msg" + (bad ? " bad" : ""); msg.textContent = text; }
    return {box: box, input: input, go: go, say: say, close: close};
  }

  // The teacher password: a small window on this page; the bridge sends it to the vocabulary site,
  // which keeps the sign-in (60 days on this device, inside this site).
  function teacherDialog(){
    var d = dialog({title: "Teacher sign in", text: "Type the teacher password, the same one that edits the flashcard sets. Then you can change the words on this site's pages.",
      label: "Teacher password", password: true, button: "Sign in"});
    var box = d.box, input = d.input, go = d.go, close = d.close;
    input.required = true;
    box.addEventListener("submit", function(e){
      e.preventDefault();
      if(!input.value) return;
      go.disabled = true;
      d.say("Checking...");
      ask({type: "login", password: input.value}).then(function(r){
        if(!r.teacher) throw new Error("That did not sign in. Try again.");
        close();
        toast("Signed in as the teacher. Open the menu and choose Edit this page to change the words on a page.");
      }).catch(function(err){
        go.disabled = false;
        d.say(err.message, true);
        input.select();
      });
    });
  }

  // The guest code (teacher only): a teacher from another school types it once on the sign-in screen.
  // A new code signs out everyone who used the old one; an empty code turns guests off.
  var CODE_WORDS = ["wave", "magnet", "rocket", "photon", "atom", "orbit", "spark", "prism", "comet", "quark", "joule", "newton"];
  function newCode(){
    var a = new Uint32Array(3), n = CODE_WORDS.length;
    crypto.getRandomValues(a);
    var first = a[0] % n, second = (first + 1 + a[1] % (n - 1)) % n; // two different words
    return CODE_WORDS[first] + "-" + CODE_WORDS[second] + "-" + (1000 + a[2] % 9000);
  }
  function guestCodeDialog(){
    var d = dialog({title: "Guest code", text: "A teacher from another school types this code once on the sign-in screen to use this site. Change it to sign out everyone who used the old one. Empty means no guests.",
      label: "Guest code", button: "Save"});
    var saved = null;
    var fresh = el("button", "cp-dlg-new", "Make a new code");
    fresh.type = "button";
    d.box.insertBefore(fresh, d.go);
    fresh.addEventListener("click", function(){ d.input.value = newCode(); d.say("Press Save to use this code."); d.input.focus(); });
    d.input.disabled = d.go.disabled = true;
    d.say("Loading...");
    ask({type: "guestCode"}).then(function(r){
      saved = String(r.code || "");
      d.input.value = saved;
      d.input.disabled = d.go.disabled = false;
      d.say(saved ? "Guests can use this code now." : "No guest code yet, so no guests can sign in. Make one, then press Save.");
      d.input.focus();
    }, function(err){ d.say(err.message, true); });
    d.box.addEventListener("submit", function(e){
      e.preventDefault();
      if(saved === null) return;
      d.go.disabled = true;
      d.say("Saving...");
      ask({type: "saveGuestCode", code: d.input.value}).then(function(r){
        saved = String(r.code || "");
        d.input.value = saved;
        d.go.disabled = false;
        d.say(saved ? "Saved. Give a guest this code: " + saved : "Saved. Guests are turned off.");
      }, function(err){
        d.go.disabled = false;
        d.say(err.message, true);
      });
    });
  }

  /* ---------- the button and its menu ---------- */
  var wrap = null;
  function draw(){
    wrap = wrap || document.getElementById("cpMenu");
    if(!wrap) return;
    var p = prefix();
    var open = wrap.classList.contains("open");
    wrap.textContent = "";
    var sv = studentView();
    var who = view.teacher ? "the teacher" : view.me ? (view.me.name + (view.me.period ? ", period " + view.me.period : "")) : view.guest ? "a guest" : "";
    var btn;
    if(!signedIn(view)){
      btn = el("button", "cp-chip");
      btn.appendChild(el("span", "cp-tag", "Class Pass"));
      btn.appendChild(el("span", "cp-who", "Sign in"));
      btn.setAttribute("aria-label", "Class Pass: sign in for the leaderboard. Open the menu.");
    } else {
      btn = el("button", "cp-avatar" + (view.teacher ? " cp-avatar-teacher" : "") + (sv ? " cp-avatar-sv" : ""));
      if(view.teacher){
        var pic = el("img", "cp-avatar-pic");
        pic.src = p + "assets/teacher-avatar.png";
        pic.alt = "";
        btn.appendChild(pic);
      } else if(view.me){
        btn.textContent = ((view.me.first || view.me.name || "?").trim().charAt(0) || "?").toUpperCase();
      } else {
        btn.textContent = "G";
      }
      btn.setAttribute("aria-label", sv ? "Student view: you see the site the way a student does. Open the menu." : "Class Pass: signed in as " + who + ". Open the menu.");
      if(sv) btn.title = "Student view";
    }
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", String(open));
    wrap.appendChild(btn);

    var drop = el("div", "cp-drop");
    var head = el("div", "cp-drop-who");
    head.appendChild(el("span", "cp-tag" + (sv ? " cp-tag-sv" : ""), sv ? "Student view" : "Class Pass"));
    head.appendChild(el("p", null, sv ? "You see the site the way a student does. You are still signed in." : who ? "Signed in as " + who : "Sign in with your school Google account so your games count on the leaderboard."));
    drop.appendChild(head);
    function item(text, href, cls){
      var a = el(href ? "a" : "button", "cp-drop-item" + (cls ? " " + cls : ""), text);
      if(href) a.href = href; else a.type = "button";
      drop.appendChild(a);
      return a;
    }
    // the switch stays in the open menu, so the reader sees it move
    function darkItem(){
      var b = item("", null, "cp-drop-dark");
      b.appendChild(el("span", null, "Dark mode"));
      b.appendChild(el("span", "cp-switch"));
      b.setAttribute("aria-pressed", String(theme() === "dark"));
      b.addEventListener("click", function(e){
        e.stopPropagation(); // the menu is drawn again, so this click would look like one outside it
        setTheme(theme() === "dark" ? "light" : "dark");
        var again = wrap.querySelector(".cp-drop-dark");
        if(again) again.focus();
      });
    }
    function feedbackItem(){
      item("Report bugs & feedback", null, "cp-drop-fb").addEventListener("click", function(){ closeMenu(); openFeedback(); });
    }
    if(sv){
      item("Leaderboard", p + "leaderboard.html");
      item("Review sets", p + "flashcards.html");
      darkItem();
      feedbackItem();
      item("Leave student view", null, "cp-drop-leave").addEventListener("click", function(){ closeMenu(); setStudentView(false); });
    } else if(!signedIn(view)){
      item("Sign in").addEventListener("click", function(){ closeMenu(); signIn(); });
      item("Leaderboard", p + "leaderboard.html");
      darkItem();
      feedbackItem();
      item("Teacher sign in", null, "cp-drop-quiet").addEventListener("click", function(){ closeMenu(); teacherDialog(); });
    } else {
      if(view.teacher && window.PS8Text && window.PS8Text.canEdit()){
        item("Edit this page", null, "cp-drop-edit").addEventListener("click", function(){ closeMenu(); window.PS8Text.edit(); });
      }
      if(view.teacher) item("Assignment Launchpad", p + "launchpad.html");
      if(view.teacher) item("Feedback inbox", p + "feedback.html");
      if(view.teacher) item("Site check", p + "site-check.html");
      if(view.teacher) item("Student view").addEventListener("click", function(){ closeMenu(); setStudentView(true); });
      if(view.teacher) item("Guest code").addEventListener("click", function(){ closeMenu(); guestCodeDialog(); });
      if(view.me || view.teacher) item("Leaderboard", p + "leaderboard.html");
      item("Review sets", p + "flashcards.html");
      if(view.teacher) item("Host a game", p + "flashcards.html?go=live");
      darkItem();
      if(!view.teacher) feedbackItem();
      item("Sign out", null, "cp-drop-out").addEventListener("click", function(){ closeMenu(); signOut(); });
    }
    wrap.appendChild(drop);
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      if(wrap.classList.contains("open")) closeMenu(); else openMenu();
    });
  }
  function openMenu(){ wrap.classList.add("open"); var b = wrap.querySelector("button"); if(b) b.setAttribute("aria-expanded", "true"); }
  function closeMenu(){
    if(!wrap) return;
    wrap.classList.remove("open");
    var b = wrap.querySelector("button");
    if(b) b.setAttribute("aria-expanded", "false");
    // a mouse still over the button would keep the menu open (hover); let it go after a click
    wrap.classList.add("cp-shut");
    setTimeout(function(){ if(wrap) wrap.classList.remove("cp-shut"); }, 400);
  }

  var toastTimer = 0;
  function toast(text, bad){
    var old = document.querySelector(".cp-toast");
    if(old) old.remove();
    var t = el("div", "cp-toast" + (bad ? " bad" : ""), text);
    t.setAttribute("role", "status");
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){ t.remove(); }, 400); }, bad ? 9000 : 6000);
  }

  /* ---------- the sign-in screen ---------- */
  // Covers a page with html.cp-gate-on (the line in its <head>) until someone is signed in.
  var cover = null, coverMsg = null;
  // Google's "G" (its four colors), drawn here so the button needs no picture file
  var GOOGLE_G = '<svg viewBox="0 0 48 48" width="22" height="22" focusable="false">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  function gate(){
    var root = document.documentElement;
    if(!root.classList.contains("cp-gate-on")) return;
    if(signedIn(view)){ root.classList.remove("cp-locked"); return; }
    root.classList.add("cp-locked");
    if(!cover && document.body) buildCover();
  }
  function gateMsg(text, bad){
    if(!coverMsg) return;
    coverMsg.className = "cp-msg" + (bad ? " bad" : "");
    coverMsg.textContent = text;
  }
  function buildCover(){
    var p = prefix();
    cover = el("section", "cp-gate");
    cover.setAttribute("aria-labelledby", "cpGateTitle");
    var card = el("div", "cp-gate-card");
    var pic = el("img", "cp-gate-pic");
    pic.src = p + "assets/mascot.png";
    pic.alt = "";
    card.appendChild(pic);
    var h = el("h1", "cp-gate-title", "Sign in to use this site");
    h.id = "cpGateTitle";
    card.appendChild(h);
    card.appendChild(el("p", "cp-gate-text", "Mr. LaMarr’s Physical Science Classroom is for his students. Sign in with your school Google account."));
    // the button ends in Google's G on a white circle, like Google's own sign-in button (Donny, 2026-11-11)
    var go = el("button", "btn cp-gate-go");
    go.appendChild(el("span", "cp-gate-go-text", "Sign in with Class Pass"));
    var g = el("span", "cp-gate-g");
    g.setAttribute("aria-hidden", "true");
    g.innerHTML = GOOGLE_G;
    go.appendChild(g);
    go.type = "button";
    go.addEventListener("click", signIn);
    card.appendChild(go);
    coverMsg = el("p", "cp-msg");
    coverMsg.setAttribute("role", "status");
    card.appendChild(coverMsg);
    var help = el("a", "cp-gate-help", "Trouble signing in?");
    help.href = p + "chromebook-help.html";
    card.appendChild(help);

    // a teacher from another school, with the guest code
    var form = el("form", "cp-gate-guest");
    var label = el("label", null, "Visiting teacher? Type your guest code.");
    label.htmlFor = "cpGuestCode";
    form.appendChild(label);
    var row = el("div", "cp-gate-row");
    var input = el("input", "cp-dlg-input");
    input.id = "cpGuestCode";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    row.appendChild(input);
    var enter = el("button", "btn secondary", "Enter");
    enter.type = "submit";
    row.appendChild(enter);
    form.appendChild(row);
    var guestMsg = el("p", "cp-msg");
    guestMsg.setAttribute("role", "status");
    form.appendChild(guestMsg);
    form.addEventListener("submit", function(e){
      e.preventDefault();
      if(!input.value.trim()) return;
      enter.disabled = true;
      guestMsg.className = "cp-msg";
      guestMsg.textContent = "Checking...";
      // the bridge tells this page the guest is in before it answers, so the page has opened by then
      ask({type: "guest", code: input.value}).then(function(){
        enter.disabled = false;
        guestMsg.textContent = "";
        input.value = "";
        toast("Welcome! You are signed in as a guest on this device.");
      }, function(err){
        enter.disabled = false;
        guestMsg.className = "cp-msg bad";
        guestMsg.textContent = err.message;
        input.select();
      });
    });
    card.appendChild(form);

    var teacher = el("button", "cp-gate-teacher", "Teacher sign in");
    teacher.type = "button";
    teacher.addEventListener("click", teacherDialog);
    card.appendChild(teacher);
    cover.appendChild(card);
    var bar = document.querySelector(".topbar");
    document.body.insertBefore(cover, bar ? bar.nextSibling : document.body.firstChild);
  }

  /* ---------- Report bugs & feedback (Donny, 2026-11-11) ---------- */
  // The panel lives in assets/feedback.js, fetched the first time someone opens it. The menu (everyone but the
  // teacher, who has Feedback inbox there) and a link at the end of each page's footer open it.
  var fbLoading = false;
  function openFeedback(){
    if(window.PS8Feedback) { window.PS8Feedback.open(); return; }
    if(fbLoading) return;
    fbLoading = true;
    var s = document.createElement("script");
    s.src = prefix() + "assets/feedback.js";
    s.onload = function(){ fbLoading = false; if(window.PS8Feedback) window.PS8Feedback.open(); };
    s.onerror = function(){ fbLoading = false; s.remove(); toast("The feedback form did not open. Check the internet connection, then try again.", true); };
    document.head.appendChild(s);
  }
  function footerLink(){
    var line = document.querySelector("footer .container") || document.querySelector("footer");
    if(!line || line.querySelector(".fb-foot")) return;
    line.appendChild(document.createTextNode(" · "));
    var b = el("button", "fb-foot", "Report bugs & feedback");
    b.type = "button";
    b.addEventListener("click", openFeedback);
    line.appendChild(b);
  }

  window.PS8Pass = {
    view: function(){ return shown(); },
    studentView: studentView,
    setStudentView: setStudentView,
    onChange: function(fn){ listeners.push(fn); },
    ask: ask,
    toast: toast,
    teacherSignIn: teacherDialog,
    theme: theme,
    setTheme: setTheme,
    feedback: openFeedback
  };

  function init(){
    draw();
    gate();
    footerLink();
    themeSimLinks();
    document.addEventListener("click", function(e){ if(wrap && !wrap.contains(e.target)) closeMenu(); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeMenu(); });
    startBridge();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
