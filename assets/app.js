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

  /* ---------- load approved chapter-specific visual guides ---------- */
  function loadVisuals(){
    if(document.querySelector('script[data-science-visuals]')) return;
    var script = document.createElement('script');
    script.src = './assets/visuals-rich.js';
    script.defer = true;
    script.setAttribute('data-science-visuals','true');
    document.head.appendChild(script);
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
      if(!Array.isArray(questions) || !questions.length) return;

      var idx = 0, score = 0, answered = false;
      var qEl = quizEl.querySelector(".qtext");
      var optsEl = quizEl.querySelector(".options");
      var feedbackEl = quizEl.querySelector(".feedback");
      var nextBtn = quizEl.querySelector(".nextQ");
      var resetBtn = quizEl.querySelector(".resetQ");
      var scoreEl = quizEl.querySelector(".score");
      var progressEl = quizEl.querySelector(".qprogress");

      function render(){
        if(idx >= questions.length){
          qEl.textContent = "Quiz complete!";
          optsEl.innerHTML = "";
          feedbackEl.textContent = "You scored " + score + " out of " + questions.length + ".";
          nextBtn.style.display = "none";
          resetBtn.style.display = "inline-flex";
          scoreEl.textContent = score + "/" + questions.length;
          progressEl.textContent = questions.length + "/" + questions.length;
          var prev = getProgress()[chapterId];
          var best = prev && typeof prev.best === "number" ? Math.max(prev.best, score) : score;
          setProgress(chapterId, {visited:true, best:best, total:questions.length});
          paintNavChecks();
          return;
        }
        answered = false;
        feedbackEl.textContent = "";
        nextBtn.disabled = true;
        resetBtn.style.display = "none";
        var q = questions[idx];
        qEl.textContent = q.q;
        optsEl.innerHTML = "";
        q.options.forEach(function(opt, i){
          var b = document.createElement("button");
          b.type = "button";
          b.className = "option";
          b.textContent = opt;
          b.addEventListener("click", function(){
            if(answered) return;
            answered = true;
            optsEl.querySelectorAll("button").forEach(function(x){ x.disabled = true; });
            if(i === q.answer){
              score++;
              b.classList.add("correct");
              feedbackEl.textContent = q.explain || "Correct.";
            }else{
              b.classList.add("wrong");
              var buttons = optsEl.querySelectorAll("button");
              if(buttons[q.answer]) buttons[q.answer].classList.add("correct");
              feedbackEl.textContent = q.explain || "Not quite.";
            }
            scoreEl.textContent = score + "/" + questions.length;
            nextBtn.disabled = false;
          });
          optsEl.appendChild(b);
        });
        scoreEl.textContent = score + "/" + questions.length;
        progressEl.textContent = (idx+1) + "/" + questions.length;
      }

      nextBtn.addEventListener("click", function(){ if(answered){ idx++; render(); } });
      resetBtn.addEventListener("click", function(){ idx = 0; score = 0; render(); });
      render();
    });
  }

  /* ---------- glossary live filter ---------- */
  function initGlossaryFilter(){
    var search = document.getElementById("glossarySearch");
    if(!search) return;
    var entries = Array.prototype.slice.call(document.querySelectorAll(".glossary-entry"));
    search.addEventListener("input", function(){
      var needle = search.value.toLowerCase().trim();
      entries.forEach(function(entry){
        entry.style.display = !needle || entry.textContent.toLowerCase().indexOf(needle) !== -1 ? "" : "none";
      });
    });
  }

  /* ---------- vocabulary glossary links ---------- */
  function initGlossaryTerms(){
    document.querySelectorAll("[data-glossary]").forEach(function(el){
      el.addEventListener("click", function(){
        var term = el.getAttribute("data-glossary");
        if(term) window.location.href = "glossary.html#" + encodeURIComponent(term);
      });
    });
  }

  /* ---------- print helper ---------- */
  function initPrint(){
    document.querySelectorAll("[data-print]").forEach(function(btn){ btn.addEventListener("click", function(){ window.print(); }); });
  }

  /* ---------- active page + visited state ---------- */
  function initProgress(){
    var id = document.body.getAttribute("data-chapter");
    markVisited(id);
    paintNavChecks();
  }

  document.addEventListener("DOMContentLoaded", function(){
    injectIcons();
    loadVisuals();
    initDrawer();
    initVocab();
    initQuizzes();
    initGlossaryFilter();
    initGlossaryTerms();
    initPrint();
    initProgress();
  });
})();
