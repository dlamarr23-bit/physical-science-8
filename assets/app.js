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
    // the top bar's links as a row of buttons at the top of the drawer
    var links = document.querySelector(".topbar nav.inline-links");
    var title = drawer.querySelector("h3");
    if(links && title && !drawer.querySelector(".drawer-links")){
      var row = document.createElement("nav");
      row.className = "drawer-links";
      row.setAttribute("aria-label", "Site");
      links.querySelectorAll("a").forEach(function(a){
        var copy = a.cloneNode(true);
        copy.className = a.classList.contains("active") ? "active" : "";
        row.appendChild(copy);
      });
      title.insertAdjacentElement("afterend", row);
    }
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
      // no "Design the Experiment" pill in the box: the heading bar above it already says so (2026-11-11)
      var scenario = document.createElement("p");
      scenario.className = "lab-scenario";
      scenario.innerHTML = data.scenario || "";
      el.appendChild(scenario);

      // a picture of the setup, when the lab has one; click to open it full size
      if(data.image && data.image.src){
        var fig = document.createElement("figure");
        fig.className = "lab-figure";
        var link = document.createElement("a");
        link.href = data.image.src;
        link.target = "_blank";
        link.rel = "noopener";
        var pic = document.createElement("img");
        pic.src = data.image.src;
        pic.alt = data.image.alt || "";
        if(data.image.width){ pic.width = data.image.width; pic.height = data.image.height; }
        pic.loading = "lazy";
        pic.decoding = "async";
        link.appendChild(pic);
        fig.appendChild(link);
        el.appendChild(fig);
      }

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
    // reader: the vocabulary pop-out opens below the nav when one is open.
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

  // The glossary supplies the definitions and chapter memberships for this pass.
  // Match longest phrases first, and never put a second control inside an existing one.
  var CHAPTER_GLOSSARY = {"terms":[{"term":"Absolute Zero","definition":"The lowest temperature possible, 0 K or about -273 degrees Celsius, where particle motion is at its absolute minimum."},{"term":"Absorption","definition":"When a material takes in a wave's energy instead of reflecting or transmitting it, often converting it into heat."},{"term":"Acceleration","definition":"The rate at which an object's speed or direction changes over time."},{"term":"Acceleration Due to Gravity","definition":"The rate at which gravity speeds up a falling object, about 9.8 meters per second squared near Earth's surface, the same for all masses in a vacuum."},{"term":"Action-Reaction Pair","definition":"Two equal, opposite forces that occur when two objects interact, each acting on a different object."},{"term":"Air Resistance","definition":"A force caused by air pushing back against a moving object, which can slow falling objects depending on their shape and surface area."},{"term":"Airbag","definition":"A safety device that inflates during a crash to slow a passenger's motion more gently and absorb energy."},{"term":"Alternating Current","definition":"Electric current that reverses direction many times each second. It is the kind of current supplied to homes."},{"term":"AM (Amplitude Modulation)","definition":"Encoding a signal by varying the height, or amplitude, of a carrier wave."},{"term":"Amorphous","definition":"Describing a solid material whose atoms or molecules are arranged in a disordered, non-repeating way, like glass or plastic."},{"term":"Amplitude","definition":"The height of a wave from its resting position to its peak; bigger amplitude means the wave carries more energy."},{"term":"Analog Signal","definition":"A signal that represents information as a smooth, continuously varying wave, like the vibration of a guitar string or the grooves on a vinyl record."},{"term":"Applied Force","definition":"A force put on an object by a person or another object that is pushing or pulling on it directly."},{"term":"Atom","definition":"The smallest basic unit of an element, like a single tiny building block of matter."},{"term":"Attract","definition":"To pull toward something else, like opposite magnetic poles pulling toward each other."},{"term":"Attractive Force","definition":"A force that pulls objects toward each other rather than pushing them apart; gravity is always attractive."},{"term":"Aurora","definition":"A natural light display near Earth's magnetic poles, caused by charged particles from the Sun colliding with atoms high in the atmosphere."},{"term":"Average Speed","definition":"The total distance traveled divided by the total time taken, which smooths out any speeding up and slowing down along the way."},{"term":"Balanced Chemical Equation","definition":"A chemical equation where the same number of each type of atom appears on both sides of the arrow."},{"term":"Balanced Forces","definition":"Forces acting on an object that cancel each other out, resulting in no change in motion."},{"term":"Biodegradable","definition":"Able to break down naturally into harmless substances over time through the action of living organisms."},{"term":"Bit","definition":"The smallest unit of digital information, represented as either a 1 or a 0."},{"term":"Braking Distance","definition":"The distance a vehicle travels while slowing to a stop."},{"term":"Carrier Wave","definition":"The steady wave a station broadcasts, which is then altered to carry a signal."},{"term":"Catalyst","definition":"A substance that speeds up a chemical reaction without being used up or permanently changed by it."},{"term":"Chemical Energy","definition":"Energy stored in the bonds between atoms, released when those bonds are broken and new ones form."},{"term":"Chemical Makeup","definition":"The specific type of particles a substance is made of, which determines properties like the temperature at which it changes state."},{"term":"Chemical Property","definition":"A trait that only shows up when a substance undergoes a chemical change, such as flammability or reactivity with acid."},{"term":"Chemical Reaction","definition":"A process where atoms rearrange to form one or more new substances with different properties than the starting materials."},{"term":"Circuit","definition":"A complete path that allows electric current to flow from a power source, through components, and back again."},{"term":"Closed System","definition":"A system where no matter can enter or leave, allowing an accurate before-and-after mass comparison."},{"term":"Coefficient","definition":"The large number written in front of a chemical formula, showing how many whole units of that substance take part. Only coefficients may be changed when balancing."},{"term":"Collision","definition":"An event in which two or more objects strike each other, often transferring energy and force between them."},{"term":"Collision Damage","definition":"The harm caused during an impact, influenced heavily by speed and, to a lesser degree, mass."},{"term":"Compass","definition":"A tool with a free-spinning magnetized needle that lines up with Earth's magnetic field to point toward magnetic north."},{"term":"Compressional Wave","definition":"A wave in which the matter of the medium moves forward and backward along the same direction the wave travels."},{"term":"Concentration","definition":"How much of a substance is present in a given volume. Higher concentration usually speeds up a reaction."},{"term":"Condensation","definition":"The phase change from gas to liquid as particles lose energy and pull closer together."},{"term":"Conductor","definition":"A material, like most metals, that allows thermal energy to flow through it quickly and easily."},{"term":"Constant Speed","definition":"Moving the same distance in each equal time interval, shown as a straight line on a distance vs. time graph."},{"term":"Constants","definition":"Every factor deliberately kept the same in all trials of an experiment, so the test stays fair."},{"term":"Control","definition":"The trial where the independent variable is left unchanged, used as a baseline to compare the other trials against."},{"term":"Controlled Experiment","definition":"An experiment that changes one factor and observes its effect on another, while keeping every other factor the same."},{"term":"Core","definition":"A piece of material, often iron, placed inside a coil of wire to strengthen the magnetic field it produces."},{"term":"Covalent Bond","definition":"A chemical bond formed when nonmetal atoms share electrons rather than transferring them."},{"term":"Crumple Zone","definition":"A part of a car designed to crush during a crash, absorbing and spreading out kinetic energy to protect passengers."},{"term":"Crystal Lattice","definition":"A repeating, orderly 3D pattern of atoms or ions, like the structure found in table salt or diamond."},{"term":"Crystalline Structure","definition":"A solid material with atoms or ions arranged in an orderly, repeating 3D pattern."},{"term":"Data","definition":"Recorded measurements, like distance and time, used to study and predict motion."},{"term":"Deceleration","definition":"A decrease in speed over time, a type of acceleration in the opposite direction of motion."},{"term":"Density","definition":"How much mass is packed into a given amount of space (mass divided by volume). Water is unusual because its solid form, ice, is less dense than its liquid form."},{"term":"Dependent Variable","definition":"The factor you measure in an experiment, which changes in response to the independent variable. Also called the responding variable."},{"term":"Deposition","definition":"When a gas turns directly into a solid without becoming a liquid first, like frost forming on a cold window."},{"term":"Design Constraint","definition":"A limit an engineer must work within when building something, such as cost, size, or available materials."},{"term":"Design Criteria","definition":"The specific requirements a device must meet to be considered successful, such as \"keeps ice from melting for 6 hours.\""},{"term":"Digital Signal","definition":"A signal that represents information as a sequence of discrete values, usually 1s and 0s (bits)."},{"term":"Direct Current","definition":"Electric current that flows in only one direction, such as the current from a battery."},{"term":"Displacement","definition":"The difference in position between an object's starting point and ending point, including the direction. It ignores the path taken in between."},{"term":"Distance","definition":"The total length of the path an object travels, no matter which way it turns."},{"term":"Distance vs. Time Graph","definition":"A graph that shows how an object's distance from a starting point changes over time."},{"term":"Electric Charge","definition":"A basic property of matter (positive or negative) that causes electric and magnetic forces between objects."},{"term":"Electric Current","definition":"The flow of electric charge through a wire or circuit, usually carried by moving electrons."},{"term":"Electric Field","definition":"The invisible region of space around a charged object where it can push or pull on other charged objects."},{"term":"Electrical Energy","definition":"Energy carried by moving electric charges."},{"term":"Electromagnet","definition":"A magnet created by electric current flowing through a coil of wire, which can be turned on and off and adjusted in strength."},{"term":"Electromagnetic Spectrum","definition":"The full range of electromagnetic waves, from long, low-frequency radio waves to short, high-frequency gamma rays."},{"term":"Electromagnetic Wave","definition":"A wave made of vibrating electric and magnetic fields that can travel through empty space without a medium."},{"term":"Encode","definition":"To convert information, like sound or images, into a pattern a wave can carry."},{"term":"Endothermic Reaction","definition":"A chemical reaction that absorbs thermal energy, making its surroundings feel colder."},{"term":"Energy","definition":"The ability to cause change. Whenever a change happens, energy is being transferred."},{"term":"Energy Transfer","definition":"The movement of energy from one object or form to another."},{"term":"Energy Transformation","definition":"The process of energy changing from one form into another, such as potential energy changing into kinetic energy."},{"term":"Equal and Opposite","definition":"Describes two forces that have the same strength but point in opposite directions."},{"term":"Evaporation/Boiling","definition":"The phase change from liquid to gas as particles gain enough energy to escape each other's attraction."},{"term":"Evidence of Energy Transfer","definition":"Observable clues, such as changes in motion, temperature, or sound, that show energy has moved between objects."},{"term":"Exothermic Reaction","definition":"A chemical reaction that releases thermal energy, making its surroundings feel warmer."},{"term":"Ferromagnetic Material","definition":"A material, such as iron, nickel, or cobalt, whose electrons can line up to make the material strongly magnetic."},{"term":"Fiber Optic Cable","definition":"A thin strand of glass that transmits digital information as pulses of light over long distances."},{"term":"Field","definition":"An invisible region of space around an object where its force, like gravity, magnetism, or electric charge, can affect other objects without touching them."},{"term":"Flammability","definition":"A chemical property describing whether a substance will catch fire and burn."},{"term":"FM (Frequency Modulation)","definition":"Encoding a signal by varying the frequency of a carrier wave."},{"term":"Force","definition":"A push or a pull that can change an object's motion."},{"term":"Force Diagram","definition":"A drawing that uses arrows to show the direction and relative strength of forces acting on an object."},{"term":"Frame of Reference","definition":"A reference point plus a direction, used together to fully describe an object's motion."},{"term":"Free Fall","definition":"Motion in which gravity is the only force acting on an object."},{"term":"Freezing","definition":"The phase change from liquid to solid as particles lose energy and lock into fixed positions."},{"term":"Frequency","definition":"The number of complete waves that pass a point in one second, measured in hertz (Hz)."},{"term":"Friction","definition":"A force that resists motion between two surfaces that are touching, often turning some kinetic energy into heat."},{"term":"Gas","definition":"A state of matter in which particles move freely with large spaces between them, expanding to fill any container."},{"term":"Gas Pressure","definition":"The force created when gas particles collide with the surfaces of their container; caused by particle motion."},{"term":"Generator","definition":"A device that uses a magnetic field to change kinetic energy into electrical energy."},{"term":"Gravitational Field","definition":"The invisible region of space around any object with mass where it can pull other masses toward it."},{"term":"Gravitational Potential Energy (GPE)","definition":"Stored energy an object has because of its height above the ground; the higher it is, the more it has."},{"term":"Gravity","definition":"The pulling force that pulls objects toward each other, and toward Earth in particular near its surface."},{"term":"Heat","definition":"Thermal energy that is moving from a hotter object to a cooler object."},{"term":"Height","definition":"The vertical distance an object is above a chosen starting point, usually the ground."},{"term":"Independent Variable","definition":"The one factor the experimenter deliberately changes. Also called the manipulated variable."},{"term":"Induction","definition":"The process by which a changing magnetic field near a wire can create, or induce, an electric current in that wire."},{"term":"Inertia","definition":"The tendency of an object to resist changes to its motion, staying at rest or continuing in motion unless a force acts on it."},{"term":"Instantaneous Speed","definition":"How fast an object is moving at one exact moment, which is what a speedometer shows."},{"term":"Insulator","definition":"A material, like foam, wood, or air, that resists the flow of thermal energy and slows it down."},{"term":"Inverse Relationship","definition":"A pattern where one quantity goes down as another goes up, such as gravitational force decreasing as distance increases."},{"term":"Ion","definition":"An atom that is no longer neutral because it has lost or gained one or more electrons."},{"term":"Ionic Bond","definition":"A chemical bond formed by the attraction between a positive ion and a negative ion, after electrons have been transferred."},{"term":"Joule (J)","definition":"The unit scientists use to measure energy, including gravitational potential energy."},{"term":"Kelvin Scale","definition":"A temperature scale that starts at absolute zero. Kelvin degrees are the same size as Celsius degrees: K equals degrees Celsius plus 273."},{"term":"Kinetic Energy","definition":"The energy an object or particle has because it is moving. It depends on both mass and speed, and it grows rapidly as speed increases."},{"term":"Latent Heat","definition":"The thermal energy absorbed or released during a phase change that goes into rearranging particles rather than changing temperature."},{"term":"Law of Conservation of Energy","definition":"Energy is never created or destroyed. It only changes form or moves from one object to another."},{"term":"Law of Conservation of Matter","definition":"The scientific rule stating that matter cannot be created or destroyed in a chemical reaction, only rearranged."},{"term":"Law of Conservation of Momentum","definition":"The total momentum of a group of objects stays the same unless an outside force acts on the group."},{"term":"Law of Reflection","definition":"When light reflects off a surface, the angle of incidence equals the angle of reflection."},{"term":"Liquid","definition":"A state of matter in which particles are close together but can slide past one another, so it holds a fixed volume but takes the shape of its container."},{"term":"Magnetic Domain","definition":"A tiny region inside a magnetic material where groups of electrons spin in the same direction, acting like a mini magnet."},{"term":"Magnetic Field","definition":"The invisible region of space around a magnet where its force can be felt by other magnetic objects."},{"term":"Magnetic Force","definition":"An attractive or repulsive force between magnets or magnetic materials that, like gravity, can act at a distance."},{"term":"Magnetic Potential Energy","definition":"Stored energy in a system of magnetic objects that depends on how they are positioned and how far apart they are."},{"term":"Magnetism","definition":"A force caused by moving electric charges (like spinning electrons) that lets certain materials push or pull on each other without touching."},{"term":"Magnetosphere","definition":"The region of space around Earth where Earth's magnetic field is felt, which deflects most of the charged particles streaming from the Sun."},{"term":"Magnitude","definition":"The size or amount of something, such as how large a force or amount of damage is."},{"term":"Manufacturing","definition":"The process of using energy and chemical processes to turn raw materials into new, useful products."},{"term":"Mass","definition":"The amount of matter in an object. More mass means more inertia, a stronger gravitational pull, more stored energy at the same height, and more energy needed to warm the object up or change its state."},{"term":"Mechanical Wave","definition":"A wave that needs a material, called a medium, to travel through. Sound and water waves are mechanical waves."},{"term":"Medium","definition":"The material, like air, water, or a solid, that a mechanical wave travels through."},{"term":"Melting","definition":"The phase change from solid to liquid as particles gain enough energy to break free of fixed positions."},{"term":"Melting Point / Boiling Point","definition":"The specific temperature at which a substance changes from solid to liquid, or liquid to gas."},{"term":"Microplastic","definition":"A tiny fragment of plastic, often smaller than a grain of rice, that forms as larger plastic items break down."},{"term":"Molecule","definition":"Two or more atoms bonded together, like O<sub>2</sub> (two oxygen atoms) or H<sub>2</sub>O (water)."},{"term":"Momentum","definition":"A property of a moving object based on its mass and velocity, which is transferred and conserved during collisions."},{"term":"Monomer","definition":"A small molecule that links with many others of its kind to form a polymer."},{"term":"Motion","definition":"A change in an object's position over time, compared to a reference point."},{"term":"Natural Material","definition":"A material that occurs in nature and is used with little or no chemical alteration, like wood, cotton, or wool."},{"term":"Natural Resource","definition":"A material or substance from the Earth, like petroleum, minerals, or plants, that people use to make other things."},{"term":"Newton (N)","definition":"The unit used to measure force, written as N; one newton is roughly the force it takes to hold up a small apple."},{"term":"Newton's First Law of Motion","definition":"If the net force on an object is zero, it stays at rest, or keeps moving in a straight line at constant speed. Also called the law of inertia."},{"term":"Newton's Second Law of Motion","definition":"The acceleration of an object equals the net force divided by its mass, in the direction of the net force. Often written as net force = mass × acceleration."},{"term":"Newton's Third Law","definition":"The scientific law stating that for every action force, there is an equal and opposite reaction force."},{"term":"Noise","definition":"Unwanted interference or errors that distort a signal during transmission."},{"term":"Nonrenewable Resource","definition":"A natural resource, like fossil fuels, that is used up much faster than it can be replaced by nature."},{"term":"Normal Force","definition":"The push a surface gives an object resting on it, always at a right angle to that surface."},{"term":"Opaque","definition":"A material that lets no light pass through it, so you cannot see objects behind it."},{"term":"Organic Chemistry","definition":"The study of carbon compounds, which are unusually varied because carbon forms four bonds and links readily to other carbon atoms."},{"term":"Oxidation","definition":"A chemical reaction, like rusting, where a substance reacts with oxygen to form a new compound."},{"term":"Particle Motion","definition":"The constant movement (vibrating, sliding, or flying) of the tiny particles that make up all matter."},{"term":"Perspective","definition":"The particular point of view from which someone observes and describes motion."},{"term":"Petroleum","definition":"A natural, oily liquid found underground that is refined into fuels and used as a raw material for plastics."},{"term":"Phase Change","definition":"A transformation of a substance between solid, liquid, and gas states, caused by adding or removing thermal energy."},{"term":"Physical Change","definition":"A change in a substance's form or state (like melting or tearing) where no new substance is created."},{"term":"Physical Property","definition":"A trait of a substance you can observe or measure without changing what the substance is, such as color, odor, density, or boiling point."},{"term":"Pitch","definition":"How high or low a sound seems, determined by the frequency of the sound wave."},{"term":"Plasma","definition":"A fourth state of matter that forms at extremely high temperatures. It is rare on Earth but common in stars, lightning, and neon lights."},{"term":"Pole","definition":"One of the two ends of a magnet (north or south) where the magnetic field is strongest."},{"term":"Polymer","definition":"A material made of long chains of repeating molecular units, common in plastics."},{"term":"Position","definition":"Where an object is at a certain moment, described by comparing it to a reference point, such as how high it sits above the ground."},{"term":"Potential Energy","definition":"Energy that is stored and waiting to be used, rather than energy that's currently making something move."},{"term":"Prediction","definition":"A scientific estimate about what will happen, based on patterns in data."},{"term":"Primary Colors of Light","definition":"Red, green, and blue. Mixing these three in different amounts can produce nearly any color of light."},{"term":"Prism","definition":"A transparent object that splits white light into its full spectrum of colors by refracting each wavelength differently."},{"term":"Product","definition":"A substance produced by a chemical reaction, written to the right of the arrow in a chemical equation."},{"term":"Proportional Relationship","definition":"A relationship where one quantity changes at the same rate as another, like how kinetic energy doubles when mass doubles."},{"term":"Protective Feature","definition":"A design element, like a seatbelt or crumple zone, meant to reduce injury during a collision."},{"term":"Radiant Energy","definition":"The energy carried by light."},{"term":"Radio Wave","definition":"A low-frequency electromagnetic wave commonly used to transmit information wirelessly, such as for wifi or cell phones."},{"term":"Rate of Heating/Cooling","definition":"How quickly a material's temperature changes when it gains or loses thermal energy, which differs by material type."},{"term":"Rate of Reaction","definition":"How quickly a chemical reaction takes place."},{"term":"Raw Material","definition":"A natural resource, like petroleum, sand, or plant matter, that is processed to make other products."},{"term":"Reactant","definition":"A starting substance in a chemical reaction, written to the left of the arrow in a chemical equation."},{"term":"Rearrange","definition":"To connect atoms in a different pattern or combination, without creating or destroying any of them."},{"term":"Reference Point","definition":"A fixed object or location you compare other things to, such as the spot you use to tell whether something is moving or the level you measure height from."},{"term":"Reflection","definition":"When a wave bounces off a surface instead of passing through it."},{"term":"Refraction","definition":"The bending of a wave as it passes from one material into another and changes speed, like light bending as it goes from air into water."},{"term":"Relative Motion","definition":"How an object's movement appears to change depending on what you compare it to."},{"term":"Repel","definition":"To push away from something else, like two like magnetic poles pushing apart."},{"term":"Restraint","definition":"A device, like a seatbelt, that applies a force to keep an object moving together with another object."},{"term":"Rolling Friction","definition":"The friction that acts when an object rolls across a surface. It is usually much smaller than sliding friction between the same two surfaces."},{"term":"Sliding Friction","definition":"The friction that slows down an object that is already sliding across a surface."},{"term":"Slope","definition":"The steepness of a line on a graph; on a distance vs. time graph, slope equals speed."},{"term":"Solenoid","definition":"A coil of wire, often wrapped around a core, that produces a magnetic field when electric current flows through it."},{"term":"Solid","definition":"A state of matter in which particles are packed tightly and mostly vibrate in fixed positions, giving it a definite shape."},{"term":"Sound Energy","definition":"Energy carried by vibrations traveling through the air, produced when objects collide or shake."},{"term":"Speed","definition":"How fast an object's position changes, calculated as distance divided by time."},{"term":"Squared Relationship","definition":"A relationship where one quantity increases with the square of another, like how kinetic energy quadruples when speed doubles."},{"term":"State of Matter","definition":"One of the forms matter can take, commonly solid, liquid, or gas, determined by how particles move and how far apart they are."},{"term":"Static Friction","definition":"The friction that prevents an object from starting to move when a force is applied to it."},{"term":"Stationary","definition":"Not moving relative to a chosen reference point."},{"term":"Subscript","definition":"The small lowered number in a chemical formula, showing how many atoms of an element are in one unit of the substance. Changing it changes the substance itself."},{"term":"Sustainability","definition":"Meeting human needs in a way that doesn't damage the environment or use up resources for future generations."},{"term":"Synthetic Material","definition":"A material made through a human-designed chemical process, usually starting from a natural raw material."},{"term":"System","definition":"A group of objects studied together, especially to see how they interact and exchange energy, such as a truck and everything on it, or a ball and Earth."},{"term":"Temperature","definition":"A measure of the average kinetic energy (average speed) of the particles in a substance: basically, how fast the particles are jiggling or zooming around on average."},{"term":"Thermal Energy","definition":"The total kinetic energy of all the moving, vibrating particles in a substance. It increases as the temperature increases, and friction often produces it."},{"term":"Thermal Expansion","definition":"The expansion of a material when it is heated, and its contraction when cooled, caused by particles moving farther apart or closer together."},{"term":"Total Internal Reflection","definition":"The way light bounces repeatedly off the inner walls of a fiber optic cable, keeping it traveling forward instead of escaping."},{"term":"Transformer","definition":"A device that uses two coils around an iron core to raise or lower the voltage of an alternating current with very little energy lost."},{"term":"Translucent","definition":"A material that lets only some light pass through, like frosted glass or waxed paper, so objects behind it are visible but not clear."},{"term":"Transmission","definition":"When a wave passes through a material, like light passing through clear glass."},{"term":"Transparent","definition":"A material that lets nearly all light pass through it, like clear glass, so objects behind it are seen clearly."},{"term":"Transverse Wave","definition":"A wave in which the matter of the medium moves at right angles to the direction the wave travels."},{"term":"Unbalanced (Net) Force","definition":"The overall force remaining after all forces on an object are combined, causing a change in motion."},{"term":"Universal Law of Gravitation","definition":"The rule that any two objects with mass attract each other, with the force depending on their masses and the distance between them."},{"term":"Vacuum","definition":"A space completely empty of matter; light can travel through it, but sound cannot."},{"term":"Velocity","definition":"The speed of an object together with the direction it is moving. Velocity changes if the speed changes, the direction changes, or both."},{"term":"Visible Light","definition":"The narrow band of the electromagnetic spectrum that human eyes can detect, seen as the colors of the rainbow."},{"term":"Wave","definition":"A disturbance that carries energy from one place to another without permanently moving the matter it travels through."},{"term":"Wave Speed","definition":"How fast a wave travels, found by multiplying its frequency by its wavelength."},{"term":"Wavelength","definition":"The distance from one point on a wave to the exact same point on the next wave, like peak to peak."},{"term":"Weight","definition":"The force of gravity pulling on an object, measured in newtons. Weight changes with location; mass does not."},{"term":"Weightlessness","definition":"The condition in free fall where an object's weight seems to be zero, even though gravity is still acting on it."}],"pages":{"energy-transfer-and-temperature.html":[0,38,53,54,94,100,105,106,189,190],"light-waves.html":[1,65,66,111,140,156,157,170,194,195,196,200,202],"mass-and-acceleration.html":[2,22,33,49,106,119,121,135,206],"universal-law-of-gravity.html":[3,5,15,78,82,84,101,121,199,207],"collisions-and-newtons-third-law.html":[4,6,32,72,110,128,136,160],"electromagnetic-fields.html":[7,29,43,56,60,61,62,64,90,91,97,177,193],"waves-and-information-technology.html":[8,11,21,23,55,67,77,80,137,162,192],"conservation-of-matter.html":[9,18,30,31,47,109,120,152,158,165,166,185],"intro-to-wave-properties.html":[10,11,35,86,122,123,149,169,170,197,203,204,205],"inertia-and-net-forces.html":[12,19,81,98,121,133,134,139,173,188,198],"molecular-composition.html":[13,44,46,50,68,75,102,103,125,127,148],"magnetism.html":[14,16,34,76,113,114,116,117,118,151,172],"speed-and-distance-time-graphs.html":[17,39,48,58,59,99,155,176,180,201],"synthetic-vs-natural.html":[20,126,129,131,132,138,141,145,186,187],"physical-and-chemical-properties.html":[24,27,28,36,79,142,147,148,164,167],"gravitational-potential-energy.html":[25,63,69,92,93,95,104,121,153,154,161,168,190],"changes-in-energy-at-the-molecular-level.html":[26,88,89,106,112,143,150,178,182,191],"phase-changes-and-energy-transfer.html":[37,50,52,73,85,107,121,124,146,163],"frames-of-reference.html":[40,41,42,51,57,58,83,96,130,144,153,168,171,184],"energy-transfer-via-friction.html":[45,70,74,87,106,174,175,179,183,190],"gravitational-potential-energy-to-kinetic-energy.html":[71,87,106,108,115,159,181,188]},"chapters":{"u5-t1":[0,38,53,54,94,100,105,106,189,190],"u4-t2":[1,65,66,111,140,156,157,170,194,195,196,200,202],"u1-t5":[2,22,33,49,106,119,121,135,206],"u2-t2":[3,5,15,78,82,84,101,121,199,207],"u1-t6":[4,6,32,72,110,128,136,160],"u3-t2":[7,29,43,56,60,61,62,64,90,91,97,177,193],"u4-t3":[8,11,21,23,55,67,77,80,137,162,192],"u6-t3":[9,18,30,31,47,109,120,152,158,165,166,185],"u4-t1":[10,11,35,86,122,123,149,169,170,197,203,204,205],"u1-t3":[12,19,81,98,121,133,134,139,173,188,198],"u6-t1":[13,44,46,50,68,75,102,103,125,127,148],"u3-t1":[14,16,34,76,113,114,116,117,118,151,172],"u1-t2":[17,39,48,58,59,99,155,176,180,201],"u6-t4":[20,126,129,131,132,138,141,145,186,187],"u6-t2":[24,27,28,36,79,142,147,148,164,167],"u2-t1":[25,63,69,92,93,95,104,121,153,154,161,168,190],"u5-t2":[26,88,89,106,112,143,150,178,182,191],"u5-t3":[37,50,52,73,85,107,121,124,146,163],"u1-t1":[40,41,42,51,57,58,83,96,130,144,153,168,171,184],"u1-t4":[45,70,74,87,106,174,175,179,183,190],"u2-t3":[71,87,106,108,115,159,181,188]}};
  function glossaryKey(text){
    return text.toLowerCase().replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  }
  function glossaryVariants(term){
    var base = term.replace(/\s*\([^)]*\)/g, '').trim();
    var variants = [term, base];
    if(base.indexOf('/') >= 0) variants = variants.concat(base.split('/').map(function(s){return s.trim();}));
    if(base === 'Unbalanced Force') variants.push('net force', 'unbalanced forces');
    if(base === 'AM') variants.push('amplitude modulation');
    if(base === 'FM') variants.push('frequency modulation');
    if(base === 'Compressional Wave') variants.push('longitudinal wave', 'longitudinal waves');
    // Do not turn letter abbreviations (AM, J, N...) into matches for ordinary words.
    variants = variants.filter(function(v){return v.length > 2 && !/^[A-Z]{2,3}$/.test(v);});
    return variants.concat(variants.map(function(v){
      if(/[^aeiou]y$/i.test(v)) return v.slice(0,-1) + 'ies';
      if(/s$/i.test(v)) return v;
      return v + 's';
    }));
  }
  var chapterGlossary = null;
  function getChapterGlossary(){
    if(chapterGlossary) return chapterGlossary;
    var quiz = document.querySelector('.quiz[data-chapter]');
    var chapter = document.body.getAttribute('data-chapter-id') || (quiz && quiz.getAttribute('data-chapter'));
    var ids = CHAPTER_GLOSSARY.chapters[chapter];
    if(!ids) return null;
    var byPhrase = Object.create(null);
    ids.forEach(function(id){
      glossaryVariants(CHAPTER_GLOSSARY.terms[id].term).forEach(function(phrase){
        var key = glossaryKey(phrase);
        if(byPhrase[key] === undefined) byPhrase[key] = id;
      });
    });
    var phrases = Object.keys(byPhrase).sort(function(a,b){return b.length - a.length;});
    var patterns = phrases.map(function(phrase){
      return phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\  /* ---------- in-text glossary terms: click to pop out a definition ---------- */').replace(/'/g, "['’‘]").replace(/-/g, '[-–—]').replace(/ /g, '\\s+');
    });
    chapterGlossary = {ids:ids, byPhrase:byPhrase, pattern:new RegExp('(^|[^A-Za-z0-9])(' + patterns.join('|') + ')(?=$|[^A-Za-z0-9])', 'gi')};
    return chapterGlossary;
  }
  function markGlossaryWords(root){
    var data = getChapterGlossary();
    if(!data || !root) return;
    var skip = '.gloss-term,a,button,input,textarea,select,label,script,style,nav,.vcard,#marginRail,.term-popout,[contenteditable="true"]';
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode:function(node){
        return node.parentElement && !node.parentElement.closest(skip) && node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], node;
    while((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function(node){
      var text = node.textContent, match, last = 0;
      var fragment = document.createDocumentFragment();
      data.pattern.lastIndex = 0;
      while((match = data.pattern.exec(text))){
        var start = match.index + match[1].length;
        var id = data.byPhrase[glossaryKey(match[2])];
        fragment.appendChild(document.createTextNode(text.slice(last,start)));
        var term = document.createElement('span');
        term.className = 'gloss-term';
        term.textContent = match[2];
        term.setAttribute('data-def',CHAPTER_GLOSSARY.terms[id].definition);
        term.setAttribute('data-glossary-id',id);
        fragment.appendChild(term);
        last = start + match[2].length;
      }
      if(last){
        fragment.appendChild(document.createTextNode(text.slice(last)));
        node.replaceWith(fragment);
      }
    });
  }
  function addMissingGlossaryTerms(){
    var data = getChapterGlossary();
    if(!data) return;
    var grid = document.querySelector('.vocab-grid');
    if(!grid) return;
    var old = document.querySelector('.chapter-glossary-extra');
    if(old) old.remove();
    var found = Object.create(null);
    document.querySelectorAll('.chapter-body .gloss-term').forEach(function(el){
      var id = el.getAttribute('data-glossary-id');
      if(id === null) id = data.byPhrase[glossaryKey(el.textContent)];
      if(id !== undefined && id !== null) found[id] = true;
    });
    var missing = data.ids.filter(function(id){return !found[id];});
    if(!missing.length) return;
    var extra = document.createElement('div');
    extra.className = 'chapter-glossary-extra';
    extra.setAttribute('aria-label','More glossary terms in this chapter');
    extra.style.cssText = 'margin:16px 0 24px;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:baseline;';
    var label = document.createElement('span');
    label.textContent = 'More glossary terms:';
    extra.appendChild(label);
    missing.forEach(function(id){
      var term = document.createElement('span');
      term.className = 'gloss-term';
      term.textContent = CHAPTER_GLOSSARY.terms[id].term;
      term.setAttribute('data-def',CHAPTER_GLOSSARY.terms[id].definition);
      term.setAttribute('data-glossary-id',id);
      extra.appendChild(term);
      if(wireTerm) wireTerm(term);
    });
    grid.insertAdjacentElement('afterend',extra);
  }
  function completeChapterGlossary(){
    document.querySelectorAll('.chapter-body .prose').forEach(markGlossaryWords);
    var data = getChapterGlossary();
    if(data) document.querySelectorAll('.chapter-body .gloss-term').forEach(function(el){
      var id = data.byPhrase[glossaryKey(el.textContent)];
      if(id !== undefined){
        el.setAttribute('data-glossary-id',id);
        el.setAttribute('data-def',CHAPTER_GLOSSARY.terms[id].definition);
      }
    });
    addMissingGlossaryTerms();
  }

  /* ---------- in-text glossary terms: click to pop out a definition ---------- */
  var wireTerm = null; // set below, so words the teacher changed after the page opened (page-text.js) work too
  function initGlossaryTerms(){
    completeChapterGlossary();
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
          // Keep the section navigation in place; definitions open below it.
          sticky.appendChild(pop);
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

    wireTerm = function(el){
      if(el._ps8Wired) return;
      el._ps8Wired = true;
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-expanded", "false");
      el.addEventListener("click", function(e){ e.stopPropagation(); openPopout(el); });
      el.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openPopout(el); }
      });
    };
    terms.forEach(wireTerm);

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
      document.querySelectorAll("#drawer .unit-block a[href]").forEach(function(a){
        var href = a.getAttribute("href");
        if(/^\.\/[\w-]+\.html$/.test(href) && !seen[href]){ seen[href] = true; list.push(href); }
      });
      return list; // unit and chapter pages only; the glossary has its own search box
    }

    var SEP = "\u2029"; // marks where one block (paragraph, list item, card) ends and the next begins

    // Reads a page's banner and main content into plain text, one section per h2.
    // The title and the "Unit 1: Energy of Motion > Chapter 3" trail are kept apart so they don't count
    // as mentions on every page that shares a unit name.
    function readPage(href, order, html){
      var doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("script, style, template, .jump-bar, .chapter-nav, .zoom-hint, .hint").forEach(function(el){ el.remove(); });
      var h1 = doc.querySelector("h1"), eyebrow = doc.querySelector(".crumbs, .eyebrow");
      // the trail without its Home step, e.g. "Unit 1: Energy of Motion > Chapter 3"
      var where = "";
      if(eyebrow && eyebrow.classList.contains("crumbs")){
        where = Array.prototype.slice.call(eyebrow.querySelectorAll("a, [aria-current]"), 1)
          .map(function(c){ return c.textContent.replace(/\s+/g, " ").trim(); }).join(" › ");
      } else if(eyebrow){
        where = eyebrow.textContent.replace(/\s+/g, " ").trim();
      }
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
          } else if(!node.parentNode.closest("h1, .crumbs, .eyebrow")){
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
        where: where
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

  /* ---------- words put in after the page started (the teacher's changes, page-text.js) ---------- */
  var glossaryRefreshTimer = null;
  window.PS8App = {
    refresh: function(box){
      if(box.closest(".chapter-body .prose")) markGlossaryWords(box);
      window.clearTimeout(glossaryRefreshTimer);
      glossaryRefreshTimer = window.setTimeout(addMissingGlossaryTerms,0);
      if(wireTerm) box.querySelectorAll(".gloss-term").forEach(wireTerm);
      if(box.tagName === "H2" && box.id){
        var link = document.querySelector('.rail-nav a[href="#' + box.id + '"]');
        if(link) link.textContent = box.textContent;
      }
    }
  };

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
