/* Physical Science 8: the teacher can change the words on a page (Donny, 2026-10-20).

   This site is plain files, so the changes are kept on the vocabulary site (KV entry book-text:<page>,
   see its server/worker.js), and every page asks for its own as it opens:
   GET https://vocabulary-room901.pages.dev/api/book-text/<page>  ->  { edits: { <box>: <words> }, saved }
   Saving goes through the Class Pass bridge (pass-menu.js), which holds the teacher sign-in.

   A "box" is one heading, paragraph, list item, caption or table cell that holds only words (no pictures,
   lists or other boxes inside). Its name is its kind and a short code made from its words as they are in the
   files, e.g. p-1x9k2c (p-1x9k2c-2 for a second paragraph with the very same words). So a change stays with
   its paragraph when other paragraphs move, and comes off by itself if that paragraph is rewritten in the
   files. Changes are put in with only plain formatting: bold, italic, underline, links, glossary terms.

   This runs before app.js (both are deferred, this one first), so the changes are in before app.js wires up
   the glossary terms; changes that arrive later are wired up through PS8App.refresh(box). The last changes
   seen are kept in this browser (ps8-text-v1:<page>), so a page opened before shows them at once.

   Teacher: Class Pass menu > Edit this page. Click any words to change them, then Save.

   window.PS8Text: canEdit(), edit(). */
(function(){
  "use strict";

  var VOCAB = "https://vocabulary-room901.pages.dev";
  var CACHE = "ps8-text-v1:";
  var BOX = "h1, h2, h3, h4, p, li, figcaption, dt, dd, td, th, blockquote, .eyebrow, .connection-note > span";
  // not words to edit: widgets, the parts this site's scripts write, and boxes made by a script
  var SKIP = "script, style, template, nav, form, button, select, textarea, label, .quiz, .cast-item, .lab-item, " +
    ".vcard, .jump-bar, .chapter-nav, .margin-rail, .sr-only, .find-bar, .chapter-figure figcaption, .rw-hint, " +
    ".standards, .term-popout, .drawer, .topbar, [data-no-edit], [data-icon]";
  // a box with any of these inside is not only words (the editor would lose them)
  var INSIDE = BOX + ", div, ul, ol, table, figure, img, svg, picture, video, audio, iframe, canvas, input, select, " +
    "textarea, button, label, dl, details, [data-icon]";

  var page = (function(){
    var m = location.pathname.match(/([A-Za-z0-9-]+)(?:\.html)?\/?$/);
    return (m ? m[1] : "index").toLowerCase();
  })();

  function hash(s){
    var h = 0x811c9dc5;
    for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(36);
  }
  function words(el){ return (el.textContent || "").replace(/\s+/g, " ").trim(); }

  /* ---------- cleaning: only plain formatting goes in or out ---------- */
  var KEEP = {A:1, B:1, STRONG:1, I:1, EM:1, U:1, S:1, SUB:1, SUP:1, BR:1, SPAN:1, SMALL:1, ABBR:1, CODE:1};
  var DROP = {SCRIPT:1, STYLE:1, IFRAME:1, OBJECT:1, EMBED:1, TEMPLATE:1, SVG:1, MATH:1, IMG:1, VIDEO:1, AUDIO:1,
    CANVAS:1, INPUT:1, BUTTON:1, SELECT:1, TEXTAREA:1, FORM:1, LINK:1, META:1, NOSCRIPT:1};
  var RUNTIME = {active:1, current:1, show:1, "find-hit":1};
  function classes(v){
    return String(v || "").split(/\s+/).filter(function(c){ return /^[a-z][a-z0-9-]*$/.test(c) && !RUNTIME[c]; }).join(" ");
  }
  // a glossary definition is shown as HTML (app.js), so it may only hold sub, sup, b and i
  function cleanDef(v){
    return String(v || "").replace(/<(?!\/?(?:sub|sup|b|i|em|strong)>)[^>]*>/gi, "");
  }
  function cleanNode(parent){
    var kids = Array.prototype.slice.call(parent.childNodes);
    kids.forEach(function(n){
      if(n.nodeType === 3) return;
      if(n.nodeType !== 1){ n.remove(); return; }
      var tag = n.tagName.toUpperCase();
      if(DROP[tag]){ n.remove(); return; }
      cleanNode(n);
      if(!KEEP[tag]){
        // anything else (a pasted div, a mark from a search) keeps only its words
        while(n.firstChild) parent.insertBefore(n.firstChild, n);
        n.remove();
        return;
      }
      var keep = {};
      if(tag === "A"){
        var href = n.getAttribute("href") || "";
        if(/^(https?:\/\/|mailto:|#|\.{0,2}\/|[\w-]+\.html)/i.test(href) && !/^\s*javascript:/i.test(href)) keep.href = href;
        if(n.getAttribute("target") === "_blank"){ keep.target = "_blank"; keep.rel = "noopener"; }
        if(n.getAttribute("title")) keep.title = n.getAttribute("title");
      }
      if(tag === "ABBR" && n.getAttribute("title")) keep.title = n.getAttribute("title");
      if(tag === "SPAN" && n.hasAttribute("data-def")) keep["data-def"] = cleanDef(n.getAttribute("data-def"));
      if(tag === "SPAN" || tag === "A"){ var c = classes(n.getAttribute("class")); if(c) keep["class"] = c; }
      Array.prototype.slice.call(n.attributes).forEach(function(a){ n.removeAttribute(a.name); });
      Object.keys(keep).forEach(function(k){ n.setAttribute(k, keep[k]); });
      // a span left with nothing to say is just its words
      if(tag === "SPAN" && !n.attributes.length){
        while(n.firstChild) parent.insertBefore(n.firstChild, n);
        n.remove();
      }
    });
  }
  function clean(html){
    var t = document.createElement("template");
    t.innerHTML = String(html == null ? "" : html);
    cleanNode(t.content);
    return t.innerHTML.replace(/(<br>\s*)+$/, "").replace(/^\s+|\s+$/g, "");
  }

  /* ---------- finding the boxes ---------- */
  var boxes = [];
  function scan(){
    var seen = {};
    [document.querySelector(".hero"), document.querySelector("main")].forEach(function(root){
      if(!root) return;
      Array.prototype.forEach.call(root.querySelectorAll(BOX), function(el){
        if(el.closest(SKIP) || el.querySelector(INSIDE)) return;
        var w = words(el);
        if(!w) return;
        var base = el.tagName.toLowerCase() + "-" + hash(w);
        seen[base] = (seen[base] || 0) + 1;
        boxes.push({el: el, key: seen[base] > 1 ? base + "-" + seen[base] : base, raw: el.innerHTML, applied: null});
      });
    });
  }

  /* ---------- putting the changes in ---------- */
  function readCache(){
    try { var c = JSON.parse(localStorage.getItem(CACHE + page)); if(c && c.edits) return c; } catch(e){ /* no storage */ }
    return null;
  }
  function writeCache(c){
    try {
      if(c && Object.keys(c.edits).length) localStorage.setItem(CACHE + page, JSON.stringify(c));
      else localStorage.removeItem(CACHE + page);
    } catch(e){ /* a convenience only */ }
  }
  function apply(c){
    var changed = [];
    boxes.forEach(function(b){
      var want = Object.prototype.hasOwnProperty.call(c.edits, b.key) ? clean(c.edits[b.key]) : null;
      if(want === b.applied) return;
      b.el.innerHTML = want == null ? b.raw : want;
      b.applied = want;
      changed.push(b.el);
    });
    if(changed.length && window.PS8App && window.PS8App.refresh) changed.forEach(window.PS8App.refresh);
  }

  function load(){
    // the teacher always gets the newest (pass-menu.js keeps who is signed in); students may get a copy
    // up to 20 seconds old
    var teacher = false;
    try { teacher = Boolean((JSON.parse(localStorage.getItem("ps8-pass-view-v1")) || {}).teacher); } catch(e){ /* no storage */ }
    fetch(VOCAB + "/api/book-text/" + page + (teacher ? "?t=" + Date.now() : ""), {credentials: "omit"})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if(!d || !d.edits || typeof d.edits !== "object" || editing) return;
        var c = {edits: d.edits, saved: Number(d.saved) || 0};
        apply(c);
        writeCache(c);
      })
      .catch(function(){ /* the words in the files stay */ });
  }

  /* ---------- editing (the teacher) ---------- */
  var editing = false, bar = null, focused = null;

  function onPaste(e){
    if(!e.target.closest || !e.target.closest("[data-pt-box]")) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, text);
  }
  function onKey(e){
    if(!e.target.closest || !e.target.closest("[data-pt-box]")) return;
    // one box is one paragraph: Enter does not start another (Shift+Enter breaks the line)
    if(e.key === "Enter"){
      e.preventDefault();
      if(e.shiftKey) document.execCommand("insertLineBreak");
    }
  }
  // inside the boxes, a link or glossary word is just words while editing
  function onClick(e){
    if(e.target.closest && e.target.closest("[data-pt-box]")){
      if(e.target.closest("a")) e.preventDefault();
      e.stopPropagation();
    }
  }
  function onFocus(e){
    var el = e.target.closest && e.target.closest("[data-pt-box]");
    focused = el ? boxFor(el) : focused;
    update();
  }
  function onLeave(e){
    if(!dirty()) return;
    e.preventDefault();
    e.returnValue = "";
  }
  function boxFor(el){ for(var i = 0; i < boxes.length; i++) if(boxes[i].el === el) return boxes[i]; return null; }
  function original(b){ return clean(b.raw); }
  function current(b){ return clean(b.el.innerHTML); }
  function dirty(){ return boxes.some(function(b){ return current(b) !== clean(b.before); }); }

  function update(){
    if(!bar) return;
    var n = 0;
    boxes.forEach(function(b){
      var mine = current(b) !== original(b);
      if(mine) n++;
      b.el.toggleAttribute("data-pt-changed", mine);
    });
    bar.querySelector(".pt-count").textContent = n ? n + (n === 1 ? " box changed" : " boxes changed") + " on this page" : "No changes on this page yet";
    var put = bar.querySelector(".pt-restore");
    put.hidden = !(focused && current(focused) !== original(focused));
  }

  function edit(){
    if(editing || !boxes.length) return;
    editing = true;
    document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})); // closes an open definition
    document.body.classList.add("pt-editing");
    boxes.forEach(function(b){
      b.before = b.el.innerHTML;
      b.el.setAttribute("data-pt-box", "");
      b.el.setAttribute("contenteditable", "true");
      b.el.setAttribute("spellcheck", "true");
    });
    bar = document.createElement("div");
    bar.className = "pt-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Editing this page");
    bar.innerHTML =
      '<div class="pt-bar-text"><b>Editing this page.</b> Click any words to change them. ' +
      '<span class="pt-keys">Ctrl+B bold, Ctrl+I italic, Shift+Enter new line.</span> <span class="pt-count"></span></div>' +
      '<div class="pt-bar-btns"><button type="button" class="btn secondary pt-restore" hidden>Put back the original words</button>' +
      '<button type="button" class="btn secondary pt-cancel">Cancel</button>' +
      '<button type="button" class="btn pt-save">Save</button></div>' +
      '<p class="pt-msg" role="status"></p>';
    document.body.appendChild(bar);
    bar.querySelector(".pt-save").addEventListener("click", save);
    bar.querySelector(".pt-cancel").addEventListener("click", cancel);
    bar.querySelector(".pt-restore").addEventListener("mousedown", function(e){ e.preventDefault(); }); // keep the box focused
    bar.querySelector(".pt-restore").addEventListener("click", function(){
      if(!focused) return;
      focused.el.innerHTML = focused.raw;
      update();
    });
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("input", update);
    window.addEventListener("beforeunload", onLeave);
    update();
  }

  function stop(){
    editing = false;
    document.body.classList.remove("pt-editing");
    boxes.forEach(function(b){
      b.el.removeAttribute("data-pt-box");
      b.el.removeAttribute("data-pt-changed");
      b.el.removeAttribute("contenteditable");
      b.el.removeAttribute("spellcheck");
    });
    document.removeEventListener("paste", onPaste, true);
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("focusin", onFocus);
    document.removeEventListener("input", update);
    window.removeEventListener("beforeunload", onLeave);
    if(bar) bar.remove();
    bar = null;
    focused = null;
  }

  function cancel(){
    if(dirty() && !window.confirm("Leave without saving? Your changes on this page will be lost.")) return;
    boxes.forEach(function(b){
      if(b.el.innerHTML !== b.before) b.el.innerHTML = b.before;
    });
    stop();
    refreshAll();
  }
  // glossary words in boxes put back from words wired up again, and the chapter's side list follows the headings
  function refreshAll(){
    if(window.PS8App && window.PS8App.refresh) boxes.forEach(function(b){ window.PS8App.refresh(b.el); });
  }

  function save(){
    var msg = bar.querySelector(".pt-msg"), btn = bar.querySelector(".pt-save");
    var edits = {};
    // changes kept for boxes this page no longer has (rewritten in the files) are left out
    boxes.forEach(function(b){
      var now = current(b);
      if(now !== original(b)) edits[b.key] = now;
    });
    if(!window.PS8Pass){ msg.textContent = "Saving needs the Class Pass button in the top bar. Reload the page and try again."; return; }
    btn.disabled = true;
    msg.className = "pt-msg";
    msg.textContent = "Saving...";
    window.PS8Pass.ask({type: "saveText", page: page, edits: edits}).then(function(d){
      var c = {edits: edits, saved: Number(d && d.saved) || Date.now()};
      boxes.forEach(function(b){
        var want = Object.prototype.hasOwnProperty.call(edits, b.key) ? edits[b.key] : null;
        // the box shows the saved words exactly as students will see them
        var html = want == null ? b.raw : want;
        if(current(b) !== clean(html)) b.el.innerHTML = html;
        b.applied = want;
      });
      writeCache(c);
      stop();
      refreshAll();
      window.PS8Pass.toast("Saved. Students see the new words the next time they open this page.");
    }, function(err){
      btn.disabled = false;
      msg.className = "pt-msg bad";
      if(err.status === 401 || err.status === 403){
        msg.textContent = "The teacher sign-in ran out on this device. Sign in again (your changes stay here), then press Save.";
        window.PS8Pass.teacherSignIn();
      } else msg.textContent = err.message;
    });
  }

  window.PS8Text = {
    canEdit: function(){ return boxes.length > 0; },
    edit: edit
  };

  scan();
  var cached = readCache();
  if(cached) apply(cached);
  load();
})();
