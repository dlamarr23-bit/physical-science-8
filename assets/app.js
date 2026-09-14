/* Physical Science 8 — shared interactivity */
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
    }catch(e){ /* storage unavailable — fail silently, per-viewer convenience only */ }
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
            feedback.textContent = (isCorrect ? "Correct! " : "Not quite. ") + q.explanation;
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
      defDiv.textContent = el.getAttribute("data-def") || "";
      pop.appendChild(closeBtn);
      pop.appendChild(termDiv);
      pop.appendChild(defDiv);

      if(isDesktop()){
        rail.appendChild(pop);
        var railRect = rail.getBoundingClientRect();
        var elRect = el.getBoundingClientRect();
        var top = Math.max(0, (elRect.top - railRect.top) + rail.scrollTop);
        pop.style.top = top + "px";
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
    initGlossaryTerms();
    initQuizzes();
    initCharts();
    var bodyChapter = document.body.getAttribute("data-chapter-id");
    if(bodyChapter) markVisited(bodyChapter);
    paintNavChecks();
  });
})();
