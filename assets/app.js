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
      termDiv.textContent = el.textContent;
      var defDiv = document.createElement("p");
      defDiv.className = "pt-def";
      // innerHTML (not textContent): definitions may contain a real <sub> tag
      // for chemical formulas (e.g. H<sub>2</sub>O) that needs to render as markup.
      defDiv.innerHTML = el.getAttribute("data-def") || "";
      pop.appendChild(closeBtn);
      pop.appendChild(termDiv);
      pop.appendChild(defDiv);

      if(isDesktop()){
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

  document.addEventListener("DOMContentLoaded", function(){
    injectIcons();
    initDrawer();
    initVocab();
    initRailNav();
    initGlossaryTerms();
    initQuizzes();
    initCastItems();
    initCharts();
    var bodyChapter = document.body.getAttribute("data-chapter-id");
    if(bodyChapter) markVisited(bodyChapter);
    paintNavChecks();
  });
})();
