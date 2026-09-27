/* Physical Science 8: shared interactivity */
(function(){
  "use strict";

  /* ---------- inject icons wherever a placeholder exists ---------- */
  function injectIcons(){
    document.querySelectorAll("[data-icon]").forEach(function(el){
      var key = el.getAttribute("data-icon");
      if (window.ICONS && window.ICONS[key]) el.innerHTML = window.ICONS[key];
    });
  }

  /* ---------- progress tracking (localStorage) ---------- */
  var STORE_KEY = "ps8-progress-v1";
  function getProgress(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(e){ return {}; }
  }
  function setProgress(id, data){
    try{
      var p = getProgress();
      p[id] = Object.assign(p[id]||{}, data);
      localStorage.setItem(STORE_KEY, JSON.stringify(p));
    }catch(e){ /* storage unavailable; fail silently, per-viewer convenience only */ }
  }
  function markVisited(id){ if(id) setProgress(id, {visited:true}); }

  function paintNavChecks(){
    var progress = getProgress();
    document.querySelectorAll(".check[data-chapter]").forEach(function(el){
      var id = el.getAttribute("data-chapter");
      var rec = progress[id];
      var done = rec && (rec.visited || (typeof rec.best === "number"));
      el.classList.toggle("done", !!done);
    });
  }

  /* ---------- mobile / TOC drawer ---------- */
  function initDrawer(){
    var openBtn = document.getElementById("openDrawer");
    var closeBtn = document.getElementById("closeDrawer");
    var drawer = document.getElementById("drawer");
    var backdrop = document.getElementById("drawerBackdrop");
    if(!drawer) return;
    function open(){ drawer.classList.add("open"); backdrop.classList.add("open"); }
    function close(){ drawer.classList.remove("open"); backdrop.classList.remove("open"); }
    if(openBtn) openBtn.addEventListener("click", open);
    if(closeBtn) closeBtn.addEventListener("click", close);
    if(backdrop) backdrop.addEventListener("click", close);
  }

  /* ---------- vocabulary flip cards ---------- */
  function initVocab(){
    document.querySelectorAll(".vcard").forEach(function(card){
      card.addEventListener("click", function(){ card.classList.toggle("flipped"); });
      card.setAttribute("tabindex","0");
      card.setAttribute("role","button");
      card.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); card.classList.toggle("flipped"); }
      });
    });
  }

  /* ---------- quiz engine ---------- */
  function initQuizzes(){
    document.querySelectorAll(".quiz").forEach(function(quizEl){
      var chapterId = quizEl.getAttribute("data-chapter");
      var dataEl = document.getElementById(quizEl.getAttribute("data-source"));
      if(!dataEl) return;
      var questions;
      try { questions = JSON.parse(dataEl.textContent); } catch(e){ return; }

      var checkBtn = quizEl.querySelector(".js-check");
      var retryBtn = quizEl.querySelector(".js-retry");
      var scoreEl = quizEl.querySelector(".quiz-score");
      var checked = false;

      function grade(){
        if(checked) return;
        checked = true;
        var correctCount = 0;
        questions.forEach(function(q, i){
          var qEl = quizEl.querySelector('.quiz-q[data-index="'+i+'"]');
          var chosen = qEl.querySelector('input[name="q'+i+'-'+chapterId+'"]:checked');
          var choiceEls = qEl.querySelectorAll(".qchoice");
          var feedback = qEl.querySelector(".qfeedback");
          var isCorrect = chosen && parseInt(chosen.value,10) === q.answerIndex;
          if(isCorrect) correctCount++;
          choiceEls.forEach(function(cEl, idx){
            cEl.classList.remove("correct","incorrect");
            if(idx === q.answerIndex) cEl.classList.add("correct");
            else if(chosen && parseInt(chosen.value,10) === idx) cEl.classList.add("incorrect");
            cEl.style.pointerEvents = "none";
          });
          if(feedback){
            // innerHTML: explanation text may contain a real <sub> tag for a chemical formula.
            feedback.innerHTML = (isCorrect ? "Correct! " : "Not quite. ") + q.explanation;
            feedback.classList.add("show", isCorrect ? "right" : "wrong");
          }
        });
        var pct = Math.round((correctCount/questions.length)*100);
        scoreEl.textContent = "You scored " + correctCount + " / " + questions.length + " (" + pct + "%)";
        scoreEl.classList.add(pct >= 60 ? "good" : "bad");
        checkBtn.style.display = "none";
        retryBtn.style.display = "inline-block";

        var prevBest = (getProgress()[chapterId] || {}).best || 0;
        setProgress(chapterId, {visited:true, best: Math.max(prevBest, correctCount), total: questions.length});
        paintNavChecks();
      }

      function reset(){
        checked = false;
        questions.forEach(function(q,i){
          var qEl = quizEl.querySelector('.quiz-q[data-index="'+i+'"]');
          qEl.querySelectorAll('input[type="radio"]').forEach(function(r){ r.checked = false; });
          qEl.querySelectorAll(".qchoice").forEach(function(cEl){ cEl.classList.remove("correct","incorrect"); cEl.style.pointerEvents=""; });
          var feedback = qEl.querySelector(".qfeedback");
          if(feedback){ feedback.classList.remove("show","right","wrong"); }
        });
        scoreEl.textContent = "";
        scoreEl.classList.remove("good","bad");
        checkBtn.style.display = "inline-block";
        retryBtn.style.display = "none";
      }

      if(checkBtn) checkBtn.addEventListener("click", grade);
      if(retryBtn) retryBtn.addEventListener("click", reset);
    });
  }

  /* ---------- CAST-style practice item: single question, check + reveal explanation ---------- */
  /* ---------- design-the-experiment challenge ----------
     Rendered from JSON rather than hand-written markup: every chapter carries
     the same four-part structure (testable question, independent variable,
     dependent variable, constants/control), so the page only supplies data. */
  function initLabItems(){
    document.querySelectorAll(".lab-item").forEach(function(el){
      var dataEl = document.getElementById(el.getAttribute("data-source"));
      if(!dataEl) return;
      var data;
      try { data = JSON.parse(dataEl.textContent); } catch(e){ return; }
      if(!data.parts || !data.parts.length) return;

      var id = el.getAttribute("data-source");
      var badge = document.createElement("span");
      badge.className = "lab-badge";
      badge.textContent = "Design the Experiment";
      el.appendChild(badge);

      var scenario = document.createElement("p");
      scenario.className = "lab-scenario";
      scenario.innerHTML = data.scenario || "";
      el.appendChild(scenario);

      // the shared vocabulary, on every chapter, tappable for a definition
      var kit = document.createElement("div");
      kit.className = "lab-toolkit";
      kit.innerHTML =
        '<p class="lab-toolkit-title">Variables toolkit</p>' +
        '<p>In a <span class="gloss-term" data-def="An experiment that changes one factor and observes its effect on another, while keeping every other factor the same.">controlled experiment</span> you change one thing on purpose. ' +
        'The <span class="gloss-term" data-def="The one factor the experimenter deliberately changes. Also called the manipulated variable.">independent variable</span> (or manipulated variable) is what you change. ' +
        'The <span class="gloss-term" data-def="The factor you measure, which changes in response to the independent variable. Also called the responding variable.">dependent variable</span> (or responding variable) is what you measure. ' +
        'The <span class="gloss-term" data-def="Every factor deliberately kept the same in all trials, so the test stays fair.">constants</span> are everything you deliberately keep the same, and the ' +
        '<span class="gloss-term" data-def="The trial where the independent variable is left unchanged, used as a baseline to compare the other trials against.">control</span> is the trial you leave unchanged to compare against.</p>';
      el.appendChild(kit);

      var parts = [];
      data.parts.forEach(function(part, i){
        var wrap = document.createElement("div");
        wrap.className = "lab-q";
        var q = document.createElement("p");
        q.className = "qtext";
        if(part.tag){
          var tag = document.createElement("span");
          tag.className = "qtag";
          tag.textContent = part.tag;
          q.appendChild(tag);
        }
        q.appendChild(document.createTextNode((i + 1) + ". " + part.prompt));
        wrap.appendChild(q);

        var choices = document.createElement("div");
        choices.className = "quiz-choices";
        part.choices.forEach(function(text, idx){
          var label = document.createElement("label");
          label.className = "qchoice";
          var input = document.createElement("input");
          input.type = "radio";
          input.name = "lab" + i + "-" + id;
          input.value = idx;
          label.appendChild(input);
          label.appendChild(document.createTextNode(" " + text));
          choices.appendChild(label);
        });
        wrap.appendChild(choices);

        var fb = document.createElement("div");
        fb.className = "qfeedback";
        wrap.appendChild(fb);
        el.appendChild(wrap);
        parts.push({wrap: wrap, feedback: fb, data: part});
      });

      var actions = document.createElement("div");
      actions.className = "quiz-actions";
      var checkBtn = document.createElement("button");
      checkBtn.className = "btn";
      checkBtn.textContent = "Check My Answers";
      var retryBtn = document.createElement("button");
      retryBtn.className = "btn secondary";
      retryBtn.textContent = "Try Again";
      retryBtn.style.display = "none";
      var scoreEl = document.createElement("span");
      scoreEl.className = "lab-score";
      actions.appendChild(checkBtn);
      actions.appendChild(retryBtn);
      actions.appendChild(scoreEl);
      el.appendChild(actions);

      checkBtn.addEventListener("click", function(){
        var correctCount = 0;
        parts.forEach(function(p, i){
          var chosen = p.wrap.querySelector('input[name="lab' + i + '-' + id + '"]:checked');
          var choiceEls = p.wrap.querySelectorAll(".qchoice");
          var isCorrect = chosen && parseInt(chosen.value, 10) === p.data.answerIndex;
          if(isCorrect) correctCount++;
          choiceEls.forEach(function(cEl, idx){
            cEl.classList.remove("correct", "incorrect");
            if(idx === p.data.answerIndex) cEl.classList.add("correct");
            else if(chosen && parseInt(chosen.value, 10) === idx) cEl.classList.add("incorrect");
            cEl.style.pointerEvents = "none";
          });
          p.feedback.innerHTML = (isCorrect ? "Correct! " : "Not quite. ") + p.data.explanation;
          p.feedback.classList.add("show", isCorrect ? "right" : "wrong");
        });
        var pct = Math.round((correctCount / parts.length) * 100);
        scoreEl.textContent = "You scored " + correctCount + " / " + parts.length + " (" + pct + "%)";
        scoreEl.classList.add(pct >= 60 ? "good" : "bad");
        checkBtn.style.display = "none";
        retryBtn.style.display = "inline-block";
      });

      retryBtn.addEventListener("click", function(){
        parts.forEach(function(p){
          p.wrap.querySelectorAll('input[type="radio"]').forEach(function(r){ r.checked = false; });
          p.wrap.querySelectorAll(".qchoice").forEach(function(cEl){
            cEl.classList.remove("correct", "incorrect");
            cEl.style.pointerEvents = "";
          });
          p.feedback.classList.remove("show", "right", "wrong");
          p.feedback.innerHTML = "";
        });
        scoreEl.textContent = "";
        scoreEl.classList.remove("good", "bad");
        checkBtn.style.display = "inline-block";
        retryBtn.style.display = "none";
      });
    });
  }

  function initCastItems(){
    document.querySelectorAll(".cast-item").forEach(function(el){
      var dataEl = document.getElementById(el.getAttribute("data-source"));
      if(!dataEl) return;
      var data;
      try { data = JSON.parse(dataEl.textContent); } catch(e){ return; }

      var checkBtn = el.querySelector(".js-cast-check");
      var retryBtn = el.querySelector(".js-cast-retry");
      var feedback = el.querySelector(".qfeedback");
      var choiceEls = el.querySelectorAll(".qchoice");

      function grade(){
        var chosen = el.querySelector('input[type="radio"]:checked');
        if(!chosen) return;
        var chosenIndex = parseInt(chosen.value, 10);
        var isCorrect = chosenIndex === data.answerIndex;
        choiceEls.forEach(function(cEl, idx){
          cEl.classList.remove("correct", "incorrect");
          if(idx === data.answerIndex) cEl.classList.add("correct");
          else if(idx === chosenIndex) cEl.classList.add("incorrect");
          cEl.style.pointerEvents = "none";
        });
        feedback.innerHTML = (isCorrect ? "Correct! " : "Not quite. ") + data.explanation;
        feedback.classList.add("show", isCorrect ? "right" : "wrong");
        checkBtn.style.display = "none";
        retryBtn.style.display = "inline-block";
      }

      function reset(){
        el.querySelectorAll('input[type="radio"]').forEach(function(r){ r.checked = false; });
        choiceEls.forEach(function(cEl){ cEl.classList.remove("correct", "incorrect"); cEl.style.pointerEvents = ""; });
        feedback.classList.remove("show", "right", "wrong");
        feedback.innerHTML = "";
        checkBtn.style.display = "inline-block";
        retryBtn.style.display = "none";
      }

      if(checkBtn) checkBtn.addEventListener("click", grade);
      if(retryBtn) retryBtn.addEventListener("click", reset);
    });
  }

  /* ---------- margin rail: sticky section nav, highlighted as you scroll ---------- */
  function initRailNav(){
    var rail = document.getElementById("marginRail");
    if(!rail) return;

    // Everything in the rail lives in this sticky block so it travels with the
    // reader: the vocabulary pop-out slots in above the nav when one is open.
    var sticky = document.createElement("div");
    sticky.className = "rail-sticky";
    rail.appendChild(sticky);

    var prose = document.querySelector(".chapter-body .prose");
    if(!prose) return;
    var heads = prose.querySelectorAll("h2");
    if(heads.length < 2) return; // a single section isn't worth a nav

    var nav = document.createElement("nav");
    nav.className = "rail-nav";
    nav.setAttribute("aria-label", "Sections in this chapter");
    var title = document.createElement("p");
    title.className = "rail-nav-title";
    title.textContent = "In this chapter";
    nav.appendChild(title);

    var list = document.createElement("ol");
    var links = [];
    heads.forEach(function(h){
      if(!h.id){
        var base = (h.textContent || "section").toLowerCase()
          .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
        // headings repeat across chapters, so keep the id unique on this page
        var id = base, n = 2;
        while(document.getElementById(id)){ id = base + "-" + n; n++; }
        h.id = id;
      }
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
      links.push({a: a, h: h});
    });
    nav.appendChild(list);
    sticky.appendChild(nav);

    // scroll spy: the active section is the last heading to pass under the topbar
    var ticking = false;
    function spy(){
      ticking = false;
      var active = links[0];
      links.forEach(function(item){
        if(item.h.getBoundingClientRect().top <= 100) active = item;
      });
      links.forEach(function(item){
        item.a.classList.toggle("active", item === active);
        if(item === active) item.a.setAttribute("aria-current", "true");
        else item.a.removeAttribute("aria-current");
      });
    }
    function onScroll(){
      if(!ticking){ ticking = true; window.requestAnimationFrame(spy); }
    }
    window.addEventListener("scroll", onScroll, {passive:true});
    window.addEventListener("resize", onScroll);
    spy();
  }

  // Vocabulary words are shown with each word capitalized ("Frame of Reference"), small
  // words like "of" kept lowercase and acronyms like AM left alone, as in the glossary.
  var MINOR_WORDS = {a:1, an:1, the:1, and:1, but:1, or:1, nor:1, "for":1, of:1, "in":1, on:1, at:1, to:1, by:1, "vs.":1, vs:1, per:1, via:1};
  function titleCase(s){
    var first = true;
    return s.replace(/\S+/g, function(word){
      var out = word.split(/([-\/])/).map(function(part, i){
        var m = part.match(/^([^A-Za-z]*)([A-Za-z][\s\S]*)?$/);
        if(!m || !m[2]) return part;
        var core = m[2];
        if(/^[A-Z0-9]{2,}/.test(core)) return part;
        if(!(first && i === 0) && MINOR_WORDS[core.toLowerCase()]) return m[1] + core.toLowerCase();
        return m[1] + core.charAt(0).toUpperCase() + core.slice(1);
      }).join("");
      first = false;
      return out;
    });
  }

  /* ---------- in-text glossary terms: click to pop out a definition ---------- */
  function initGlossaryTerms(){
    var terms = document.querySelectorAll(".gloss-term");
    if(!terms.length) return;
    var rail = document.getElementById("marginRail");
    var backdrop = document.createElement("div");
    backdrop.className = "term-popout-backdrop";
    document.body.appendChild(backdrop);
    var current = null; // {el, popout}

    function isDesktop(){
      return !!rail && window.matchMedia("(min-width: 981px)").matches;
    }

    function closePopout(){
      if(current){
        current.popout.remove();
        current.el.classList.remove("active");
        current.el.setAttribute("aria-expanded", "false");
        current = null;
      }
      backdrop.classList.remove("show");
    }

    function openPopout(el){
      if(current && current.el === el){ closePopout(); return; }
      closePopout();
      var pop = document.createElement("div");
      pop.className = "term-popout";
      var closeBtn = document.createElement("button");
      closeBtn.className = "pt-close";
      closeBtn.setAttribute("aria-label", "Close definition");
      closeBtn.innerHTML = "&times;";
      closeBtn.addEventListener("click", function(e){ e.stopPropagation(); closePopout(); });
      var termDiv = document.createElement("div");
      termDiv.className = "pt-term";
      termDiv.textContent = titleCase(el.textContent.replace(/\s+/g, " ").trim());
      var defDiv = document.createElement("p");
      defDiv.className = "pt-def";
      // innerHTML (not textContent): definitions may contain a real <sub> tag
      // for chemical formulas (e.g. H<sub>2</sub>O) that needs to render as markup.
      defDiv.innerHTML = el.getAttribute("data-def") || "";
      pop.appendChild(closeBtn);
      pop.appendChild(termDiv);
      pop.appendChild(defDiv);

      if(isDesktop() && el.closest(".chapter-body")){
        var sticky = rail.querySelector(".rail-sticky");
        if(sticky){
          // ride above the section nav inside the sticky block, so the definition
          // stays beside the reader instead of scrolling away up the rail
          sticky.insertBefore(pop, sticky.firstChild);
        } else {
          rail.appendChild(pop);
          var railRect = rail.getBoundingClientRect();
          var elRect = el.getBoundingClientRect();
          var top = Math.max(0, (elRect.top - railRect.top) + rail.scrollTop);
          pop.style.top = top + "px";
        }
      } else if(window.matchMedia("(min-width: 981px)").matches){
        // below the reading (Design the Experiment, CAST...) the rail has scrolled out of
        // sight, so the definition opens right under the word instead
        pop.classList.add("floating");
        document.body.appendChild(pop);
        var r = el.getBoundingClientRect();
        var w = Math.min(380, window.innerWidth - 24);
        pop.style.width = w + "px";
        pop.style.left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12)) + window.scrollX + "px";
        var below = r.bottom + 8, h = pop.offsetHeight;
        var top = (below + h > window.innerHeight - 8 && r.top - h - 8 > 0) ? r.top - h - 8 : below;
        pop.style.top = top + window.scrollY + "px";
      } else {
        pop.classList.add("mobile");
        document.body.appendChild(pop);
        backdrop.classList.add("show");
      }
      el.classList.add("active");
      el.setAttribute("aria-expanded", "true");
      current = {el: el, popout: pop};
    }

    terms.forEach(function(el){
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-expanded", "false");
      el.addEventListener("click", function(e){ e.stopPropagation(); openPopout(el); });
      el.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openPopout(el); }
      });
    });

    backdrop.addEventListener("click", closePopout);
    document.addEventListener("click", function(e){
      if(current && !current.popout.contains(e.target) && e.target !== current.el) closePopout();
    });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") closePopout(); });
    window.addEventListener("resize", closePopout);
  }

  /* ---------- simple line/heating-curve/bar charts (Chart.js, if config present) ---------- */
  function initCharts(){
    if(typeof Chart === "undefined") return;
    document.querySelectorAll("canvas[data-chart]").forEach(function(canvas){
      var cfgEl = document.getElementById(canvas.getAttribute("data-chart"));
      if(!cfgEl) return;
      try{
        var cfg = JSON.parse(cfgEl.textContent);
        new Chart(canvas.getContext("2d"), cfg);
      }catch(e){ console.warn("chart config error", e); }
    });
  }

  /* ---------- back-to-top button, shown once the reader is well down the page ---------- */
  function initToTop(){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "Back to top of page");
    btn.innerHTML = '<span aria-hidden="true">&uarr;</span> Top';
    btn.addEventListener("click", function(){
      window.scrollTo({top: 0, behavior: "smooth"});
      // keyboard users land at the page title instead of on a button that hides itself
      var h1 = document.querySelector("h1");
      if(h1){ h1.setAttribute("tabindex", "-1"); h1.focus({preventScroll: true}); }
    });
    document.body.appendChild(btn);
    var ticking = false;
    function update(){ ticking = false; btn.classList.toggle("show", window.scrollY > 600); }
    window.addEventListener("scroll", function(){
      if(!ticking){ ticking = true; window.requestAnimationFrame(update); }
    }, {passive: true});
    update();
  }

  /* ---------- home page search: every page that uses a word ---------- */
  // The pages are fetched and read the first time someone searches, so the results
  // always match what is on the site now; there is no index file to keep up to date.
  function initSiteSearch(){
    var form = document.getElementById("siteSearch");
    if(!form) return;
    var input = document.getElementById("siteSearchInput");
    var out = document.getElementById("siteSearchResults");
    var pages = null, loading = null, timer = null;
    var INLINE = {A:1, B:1, STRONG:1, EM:1, I:1, SUP:1, SUB:1, MARK:1, SMALL:1, CODE:1, ABBR:1};

    function esc(s){ return s.replace(/[&<>"]/g, function(c){ return {"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]; }); }

    function pageList(){
      var seen = {}, list = [];
      document.querySelectorAll("#drawer a[href]").forEach(function(a){
        var href = a.getAttribute("href");
        if(/^\.\/u\d+(-t\d+)?\.html$/.test(href) && !seen[href]){ seen[href] = true; list.push(href); }
      });
      return list; // unit and chapter pages only; the glossary has its own search box
    }

    var SEP = "\u2029"; // marks where one block (paragraph, list item, card) ends and the next begins

    // Reads a page's banner and main content into plain text, one section per h2.
    // The title and the "Unit 1, Chapter 3" label are kept apart so they don't count
    // as mentions on every page that shares a unit name.
    function readPage(href, order, html){
      var doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("script, style, template, .jump-bar, .chapter-nav, .zoom-hint, .hint").forEach(function(el){ el.remove(); });
      var h1 = doc.querySelector("h1"), eyebrow = doc.querySelector(".eyebrow");
      var sections = [], cur = {head: "", text: ""};
      [doc.querySelector(".hero"), doc.querySelector("main")].forEach(function(root){
        if(!root) return;
        var walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        var node;
        while((node = walker.nextNode())){
          if(node.nodeType === 1){
            if(node.tagName === "H2"){
              sections.push(cur);
              cur = {head: node.textContent.replace(/\s+/g, " ").trim(), text: ""};
            }
            // a span is part of the sentence unless it is laid out as its own line or label
            var inline = INLINE[node.tagName] || (node.tagName === "SPAN" && (!node.className || node.className === "gloss-term"));
            if(!inline) cur.text += SEP;
          } else if(!node.parentNode.closest("h1, .eyebrow")){
            cur.text += node.nodeValue;
          }
        }
      });
      sections.push(cur);
      sections.forEach(function(s){
        s.text = s.text.replace(/\s+/g, function(ws){ return ws.indexOf(SEP) === -1 ? " " : SEP; })
          .replace(/^\s+|\s+$/g, "");
        s.lower = s.text.toLowerCase();
        s.show = s.text.replace(/\u2029/g, " ");
      });
      return {
        href: href, order: order, sections: sections.filter(function(s){ return s.text; }),
        title: h1 ? h1.textContent.replace(/\s+/g, " ").trim() : href,
        where: eyebrow ? eyebrow.textContent.replace(/\s+/g, " ").trim() : ""
      };
    }

    function load(){
      if(!loading){
        var list = pageList();
        loading = Promise.all(list.map(function(href, i){
          return fetch(href).then(function(r){ return r.ok ? r.text() : ""; })
            .then(function(html){ return html ? readPage(href, i, html) : null; })
            .catch(function(){ return null; });
        })).then(function(all){ pages = all.filter(Boolean); return pages; });
      }
      return loading;
    }

    function snippet(s, i, len){
      var t = s.show, start = Math.max(0, i - 70), end = Math.min(t.length, i + len + 90);
      if(start > 0){ var a = t.lastIndexOf(" ", start); start = a === -1 ? 0 : a + 1; }
      if(end < t.length){ var b = t.indexOf(" ", end); end = b === -1 ? t.length : b; }
      return (start > 0 ? "&hellip; " : "") + esc(t.slice(start, i)) +
        "<mark>" + esc(t.slice(i, i + len)) + "</mark>" +
        esc(t.slice(i + len, end)) + (end < t.length ? " &hellip;" : "");
    }

    function run(){
      var q = input.value.replace(/\s+/g, " ").trim();
      if(q.length < 2){ out.innerHTML = q ? '<p class="sr-summary">Type at least two letters.</p>' : ""; return; }
      if(!pages){ out.innerHTML = '<p class="sr-summary">Searching every page&hellip;</p>'; }
      load().then(function(){
        if(input.value.replace(/\s+/g, " ").trim() !== q) return; // the reader kept typing
        var needle = q.toLowerCase(), hits = [];
        pages.forEach(function(p){
          var count = p.title.toLowerCase().indexOf(needle) === -1 ? 0 : 1, first = null;
          p.sections.forEach(function(s){
            for(var i = s.lower.indexOf(needle); i !== -1; i = s.lower.indexOf(needle, i + needle.length)){
              count++;
              if(!first) first = {s: s, i: i};
            }
          });
          if(count) hits.push({p: p, count: count, at: first});
        });
        hits.sort(function(a, b){ return b.count - a.count || a.p.order - b.p.order; });
        if(!hits.length){
          out.innerHTML = '<p class="sr-summary">No pages use &ldquo;' + esc(q) + '&rdquo;. Check the spelling, or try a shorter word.</p>';
          return;
        }
        var html = '<p class="sr-summary">' + hits.length + (hits.length === 1 ? " page uses" : " pages use") +
          " &ldquo;" + esc(q) + "&rdquo;. Most mentions first.</p><ul class=\"sr-list\">";
        hits.forEach(function(h){
          // ?find= makes the page highlight the word and scroll to it (see initFindOnPage)
          html += '<li><a class="sr-item" href="' + esc(h.p.href + "?find=" + encodeURIComponent(q)) + '">' +
            (h.p.where ? '<span class="sr-where">' + esc(h.p.where) + "</span>" : "") +
            '<span class="sr-title">' + esc(h.p.title) + "</span>" +
            '<span class="sr-count">' + h.count + (h.count === 1 ? " mention" : " mentions") + "</span>" +
            (h.at ? '<span class="sr-snip">' + snippet(h.at.s, h.at.i, needle.length) + "</span>" : "") + "</a></li>";
        });
        out.innerHTML = html + "</ul>";
      });
    }

    input.addEventListener("focus", load, {once: true});
    input.addEventListener("input", function(){ clearTimeout(timer); timer = setTimeout(run, 250); });
    form.addEventListener("submit", function(e){ e.preventDefault(); clearTimeout(timer); run(); });
  }

  /* ---------- arriving from a search: highlight the word and scroll to it ---------- */
  function initFindOnPage(){
    var q = "";
    try{ q = (new URLSearchParams(window.location.search).get("find") || "").replace(/\s+/g, " ").trim(); }catch(e){ return; }
    var main = document.querySelector("main");
    if(q.length < 2 || !main) return;
    var needle = q.toLowerCase(), marks = [];
    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        return n.parentNode.closest("script, style, textarea, .jump-bar, .find-bar") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(node){
      var text = node.nodeValue, lower = text.toLowerCase(), i = lower.indexOf(needle);
      if(i === -1) return;
      var frag = document.createDocumentFragment(), last = 0;
      for(; i !== -1; i = lower.indexOf(needle, i + needle.length)){
        frag.appendChild(document.createTextNode(text.slice(last, i)));
        var m = document.createElement("mark");
        m.className = "find-hit";
        m.textContent = text.slice(i, i + needle.length);
        frag.appendChild(m);
        marks.push(m);
        last = i + needle.length;
      }
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    if(!marks.length) return;

    var bar = document.createElement("div");
    bar.className = "find-bar";
    bar.setAttribute("role", "status");
    bar.innerHTML = '<span class="find-count"></span>' +
      '<button type="button" class="find-next">Next &darr;</button>' +
      '<button type="button" class="find-close" aria-label="Clear the highlights">&times;</button>';
    document.body.appendChild(bar);
    var countEl = bar.querySelector(".find-count"), at = -1;

    // marks inside a hidden flip-card face or closed panel can't be scrolled to; skip them
    function shown(m){ return m.getClientRects().length > 0 && m.offsetParent !== null; }
    function go(step){
      var tries = marks.length;
      do { at = (at + step + marks.length) % marks.length; tries--; } while(tries > 0 && !shown(marks[at]));
      marks.forEach(function(m, k){ m.classList.toggle("current", k === at); });
      marks[at].scrollIntoView({block: "center", behavior: "smooth"});
      countEl.innerHTML = (at + 1) + " of " + marks.length + " &ldquo;" + q.replace(/[&<>"]/g, "") + "&rdquo;";
    }
    bar.querySelector(".find-next").addEventListener("click", function(){ go(1); });
    bar.querySelector(".find-close").addEventListener("click", function(){
      marks.forEach(function(m){ m.replaceWith(document.createTextNode(m.textContent)); });
      main.normalize();
      bar.remove();
      if(window.history.replaceState) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    });
    // wait a beat so images above the word have their size before we scroll
    window.setTimeout(function(){ go(1); }, 150);
  }

  document.addEventListener("DOMContentLoaded", function(){
    injectIcons();
    initToTop();
    initSiteSearch();
    initDrawer();
    initVocab();
    initRailNav();
    initLabItems();   // renders before the glossary pass, so its terms get wired up
    initGlossaryTerms();
    initQuizzes();
    initCastItems();
    initCharts();
    var bodyChapter = document.body.getAttribute("data-chapter-id");
    if(bodyChapter) markVisited(bodyChapter);
    paintNavChecks();
    initFindOnPage(); // last, once every section has been rendered
  });
})();
