/* The Review page (/flashcards) and the Join a game page (/join) show the review pages (app/: flashcard sets and the
   live class games) in a frame under this site's top bar.

   Where they are (Donny, 2026-11-19: "I want all pages to be in my site"): the review pages were their own site,
   vocabulary-room901.pages.dev, until 2026-11-19. Now they are this site's app/ folder, so a page there is /app/<its
   old address> (/app/flashcards/, /app/join/, /app/molehunt/play/), and the old site only sends visitors here.

   The Review page (it was called Flashcards until 2026-10-20; its address stays /flashcards, so old links work).
   Each flashcard set has its own address here by its name: /flashcards/frame-of-reference/ opens that set,
   /flashcards/frame-of-reference/#learn opens it in Learn, /flashcards#folder-<id> opens a folder, and older
   /flashcards/my/<set id>/ links still work. (_redirects serves flashcards.html at every /flashcards/... address.)
   The review pages say which page is open (app/assets/book.js), and the address follows along.
   The Class Pass menu in the top bar links to /flashcards?go=live (Host a game) and /flashcards?go=join.

   Join a game (/join, join.html, 2026-11-19): the address a game's join screen shows the class
   (physical-science-8.pages.dev/join). /join#ABC123 or /join?code=ABC123 opens that game's join screen. It has no
   sign-in screen of its own, so a guest can still join a game that lets guests in; a student signs in on the join
   screen with Class Pass, the same sign-in as the rest of the site.

   Light or dark: the frame opens in this site's mode (?theme=), and hears this site's mode ({vocabTheme}) each
   time one of its pages opens and when the Class Pass menu switches it. */
(function(){
  var APP = "/app";
  var frame = document.getElementById("vocabFrame");
  if(!frame) return;
  var onJoin = /^\/join(?:\.html)?\/?$/.test(location.pathname);
  var pageTitle = document.title, siteName = pageTitle.split(" · ").pop();
  function theme(){ return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function tellTheme(){ try { frame.contentWindow.postMessage({vocabTheme: theme()}, location.origin); } catch(e){ /* still loading */ } }
  // student view (the Class Pass menu, 2026-11-10): the teacher sees the framed page the way a student does
  function sv(){ try { return localStorage.getItem("ps8-student-view") === "1" ? "1" : "0"; } catch(e){ return "0"; } }
  // Each game has its own address here (Donny, 2026-11-18: "it would be nice if all the games had their own url"):
  // /flashcards?go=mole-hunt opens Mole Hunt's setup, ?go=blast opens Host a game with Blast picked, and so on.
  // A student in a game shows /join?code=ABC123 (or /flashcards?go=join&code=ABC123 on the Review page), so
  // reloading the page goes back into that game. ?go=live is the older name for Host a game.
  var GAMES = {
    "host": ["/live/", "Host a game"], "live": ["/live/", "Host a game"],
    "vocab-live": ["/live/?game=volley", "Vocab Live"], "blast": ["/live/?game=blast", "Blast"], "match": ["/live/?game=match", "Match"],
    "battle-royale": ["/royale/", "Battle Royale"], "surge-showdown": ["/surge/", "Surge Showdown"], "mole-hunt": ["/molehunt/", "Mole Hunt"],
    "join": ["/join/", "Join a game"], "leaderboard": ["/leaderboard/", "Leaderboard"]
  };
  // The address for a review page (its address without /app), or "" for one with no address of its own.
  function gameName(info){
    var path = info.path, search = typeof info.search === "string" ? info.search : "";
    if(path === "/join/" || /^\/(royale|surge|molehunt)\/play\/$/.test(path)) return "join";
    if(path === "/live/"){
      var g = (search.match(/[?&]game=(volley|blast|match)\b/) || [])[1];
      return g ? {volley: "vocab-live", blast: "blast", match: "match"}[g] : "host";
    }
    return {"/royale/": "battle-royale", "/surge/": "surge-showdown", "/molehunt/": "mole-hunt", "/leaderboard/": "leaderboard"}[path] || "";
  }
  function codeIn(text, re){ return ((text || "").match(re) || [])[1] || ""; }
  function open(){
    var go = onJoin ? "join" : codeIn(location.search, /[?&]go=([a-z-]+)/);
    var code = codeIn(location.search, /[?&]code=([A-Za-z2-9]{6})\b/) || (onJoin ? codeIn(location.hash, /^#([A-Za-z2-9]{6})$/) : "");
    if(go && GAMES.hasOwnProperty(go)){
      var to = GAMES[go][0];
      frame.src = APP + to + (to.indexOf("?") < 0 ? "?" : "&") + "theme=" + theme() + "&sv=" + sv() + (go === "join" && code ? "&code=" + code.toUpperCase() : "");
      return;
    }
    var m = location.pathname.match(/^\/flashcards(\/[\w\/.-]*)?$/);
    frame.src = APP + "/flashcards" + (m && m[1] ? m[1] : "/") + "?theme=" + theme() + "&sv=" + sv() + location.hash;
  }
  open();
  // a link to another folder or study mode of the same page changes only the part after #
  window.addEventListener("hashchange", open);
  window.addEventListener("ps8:theme", tellTheme);

  window.addEventListener("message", function(e){
    if(e.origin !== location.origin || e.source !== frame.contentWindow) return;
    var info = e.data && e.data.vocabSite;
    if(!info || typeof info.path !== "string") return;
    // a review page just opened: it shows this site's mode
    tellTheme();
    var inside = /^\/flashcards\/[\w\/.-]+$/.test(info.path);
    var hash = typeof info.hash === "string" && /^#[\w-]*$/.test(info.hash) ? info.hash : "";
    // a game has its own address (above); other pages outside the flashcards (signing in) keep the plain one
    var game = inside ? "" : gameName(info);
    var code = game === "join" ? (codeIn(hash, /^#([A-Za-z2-9]{6})$/) || codeIn(typeof info.search === "string" ? info.search : "", /[?&]code=([A-Za-z2-9]{6})\b/)) : "";
    var address = game === "join" && onJoin ? "/join" + (code ? "?code=" + code.toUpperCase() : "")
      : game ? "/flashcards?go=" + game + (code ? "&code=" + code.toUpperCase() : "")
      : (inside ? info.path : "/flashcards") + (inside || /^#folder-/.test(hash) ? hash : "");
    // replace, not push: the frame's own move is already a step in the Back button's history
    if(location.pathname + location.search + location.hash !== address) history.replaceState(null, "", address);
    var playing = {"/royale/play/": "Battle Royale", "/surge/play/": "Surge Showdown", "/molehunt/play/": "Mole Hunt"}[info.path];
    var name = inside && typeof info.title === "string" ? info.title.split(" | ")[0].trim().slice(0, 120) : game ? playing || GAMES[game][1] : "";
    document.title = name ? name + " · " + siteName : pageTitle;
  });
})();
