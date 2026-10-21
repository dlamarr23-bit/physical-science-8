/* Physical Science 8: the Class Pass button in the top bar (Donny, 2026-10-20).

   Class Pass and the leaderboard live on the vocabulary site (vocabulary-room901.pages.dev), which the Review
   and Leaderboard pages show in a frame with its own top bar hidden. So this site's top bar has the button:
   - signed out: "Class Pass / Sign in", with a menu: Sign in, Leaderboard, Teacher sign in;
   - a student: a round button with their first letter; the menu says who is signed in, links to the
     Leaderboard and Review, and signs out;
   - the teacher (the teacher password, the same one that edits flashcard sets): Mr. LaMarr's picture; the
     menu adds Edit this page (page-text.js) and Host a game.

   How this page knows who is signed in: every page keeps the vocabulary site's bridge/ page in a hidden
   frame (its assets/book-bridge.js). That page tells this one who is signed in there, now and whenever it
   changes, and does the signing in and out and the saving of changed words for this page. The sign-in
   window opens from here (a frame cannot open one from a button out here) with a random number, and the
   bridge picks the sign-in up under that number. What the bridge said last is kept in this browser
   (ps8-pass-view-v1: a name, a period, and whether it is the teacher) so the button is right at once.

   Every menu also has the Dark mode switch. The choice is kept in this browser (ps8-theme = "dark"; light is
   the default), and a line in each page's <head> puts html[data-theme="dark"] on before the page draws.
   Pages that show something in a frame hear about a change from the "ps8:theme" event (sims.html).

   window.PS8Pass: view(), onChange(fn), ask(message) (a question for the bridge; resolves with its answer),
   theme(), setTheme("light" | "dark"). */
(function(){
  "use strict";

  var VOCAB = "https://vocabulary-room901.pages.dev";
  var VIEW_KEY = "ps8-pass-view-v1";

  function readView(){
    try { var v = JSON.parse(localStorage.getItem(VIEW_KEY)); if(v && typeof v === "object") return v; } catch(e){ /* no storage */ }
    return {me: null, teacher: false};
  }
  function saveView(v){ try { localStorage.setItem(VIEW_KEY, JSON.stringify(v)); } catch(e){ /* a per-browser convenience only */ } }

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
      // until the bridge has asked the site about the teacher password, keep what this browser knew
      var next = {me: me, teacher: m.checked ? Boolean(m.teacher) : view.teacher};
      if(m.checked) saveView(next);
      setView(next);
    } else if(m.type === "reply" && waiting[m.id]){
      waiting[m.id](m);
    }
  });

  function setView(v){
    var changed = JSON.stringify(v) !== JSON.stringify(view);
    view = v;
    if(changed){ draw(); listeners.forEach(function(fn){ try { fn(view); } catch(e){ /* one listener's problem */ } }); }
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
    if(!win){ toast("Your browser blocked the sign-in window. Allow pop-ups for this site, then press Sign in again.", true); return; }
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
    }).then(function(){ if(signingIn === job) signingIn = null; });
  }
  function signOut(){
    if(view.me) send({type: "signOut"});
    if(view.teacher){
      ask({type: "logout"}).catch(function(err){ toast(err.message, true); });
    }
    setView({me: null, teacher: false});
    saveView(view);
  }

  // The teacher password: a small window on this page; the bridge sends it to the vocabulary site,
  // which keeps the sign-in (60 days on this device, inside this site).
  function teacherDialog(){
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
    var h = el("h2", "cp-dlg-title", "Teacher sign in");
    h.id = "cpDlgTitle";
    box.appendChild(h);
    box.appendChild(el("p", "cp-dlg-text", "Type the teacher password, the same one that edits the flashcard sets. Then you can change the words on this site's pages."));
    var input = el("input", "cp-dlg-input");
    input.type = "password";
    input.autocomplete = "current-password";
    input.setAttribute("aria-label", "Teacher password");
    input.required = true;
    box.appendChild(input);
    var msg = el("p", "cp-msg");
    msg.setAttribute("role", "status");
    box.appendChild(msg);
    var go = el("button", "btn cp-dlg-go", "Sign in");
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
    box.addEventListener("submit", function(e){
      e.preventDefault();
      if(!input.value) return;
      go.disabled = true;
      msg.className = "cp-msg";
      msg.textContent = "Checking...";
      ask({type: "login", password: input.value}).then(function(d){
        if(!d.teacher) throw new Error("That did not sign in. Try again.");
        close();
        toast("Signed in as the teacher. Open the menu and choose Edit this page to change the words on a page.");
      }).catch(function(err){
        go.disabled = false;
        msg.className = "cp-msg bad";
        msg.textContent = err.message;
        input.select();
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
    var who = view.teacher ? "the teacher" : view.me ? (view.me.name + (view.me.period ? ", period " + view.me.period : "")) : "";
    var btn;
    if(!view.teacher && !view.me){
      btn = el("button", "cp-chip");
      btn.appendChild(el("span", "cp-tag", "Class Pass"));
      btn.appendChild(el("span", "cp-who", "Sign in"));
      btn.setAttribute("aria-label", "Class Pass: sign in for the leaderboard. Open the menu.");
    } else {
      btn = el("button", "cp-avatar" + (view.teacher ? " cp-avatar-teacher" : ""));
      if(view.teacher){
        var pic = el("img", "cp-avatar-pic");
        pic.src = p + "assets/teacher-avatar.png";
        pic.alt = "";
        btn.appendChild(pic);
      } else {
        btn.textContent = ((view.me.first || view.me.name || "?").trim().charAt(0) || "?").toUpperCase();
      }
      btn.setAttribute("aria-label", "Class Pass: signed in as " + who + ". Open the menu.");
    }
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", String(open));
    wrap.appendChild(btn);

    var drop = el("div", "cp-drop");
    var head = el("div", "cp-drop-who");
    head.appendChild(el("span", "cp-tag", "Class Pass"));
    head.appendChild(el("p", null, who ? "Signed in as " + who : "Sign in with your school Google account so your games count on the leaderboard."));
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
    if(!view.teacher && !view.me){
      item("Sign in").addEventListener("click", function(){ closeMenu(); signIn(); });
      item("Leaderboard", p + "leaderboard.html");
      darkItem();
      item("Teacher sign in", null, "cp-drop-quiet").addEventListener("click", function(){ closeMenu(); teacherDialog(); });
    } else {
      if(view.teacher && window.PS8Text && window.PS8Text.canEdit()){
        item("Edit this page", null, "cp-drop-edit").addEventListener("click", function(){ closeMenu(); window.PS8Text.edit(); });
      }
      item("Leaderboard", p + "leaderboard.html");
      item("Review sets", p + "flashcards.html");
      if(view.teacher) item("Host a game", p + "flashcards.html?go=live");
      darkItem();
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

  window.PS8Pass = {
    view: function(){ return view; },
    onChange: function(fn){ listeners.push(fn); },
    ask: ask,
    toast: toast,
    teacherSignIn: teacherDialog,
    theme: theme,
    setTheme: setTheme
  };

  function init(){
    draw();
    document.addEventListener("click", function(e){ if(wrap && !wrap.contains(e.target)) closeMenu(); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeMenu(); });
    startBridge();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
