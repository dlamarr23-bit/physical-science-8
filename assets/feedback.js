/* Physical Science 8: Report bugs & feedback (Donny, 2026-11-11).

   A panel that slides in from the right: "Something is wrong" or "I have an idea", what the student was trying to
   do, whether they could finish it, what happened, and a screenshot of the page if they want (the browser asks to
   share this tab; school computers that block that can add a picture file instead). pass-menu.js loads this file
   the first time someone opens the panel (Class Pass menu > Report bugs & feedback, or the link in the footer).

   Sending: PS8Pass.ask({type: "sendFeedback", ...}) hands it to the Class Pass bridge (the vocabulary site's
   book-bridge.js), which adds whoever is signed in there and saves it with the class leaderboard
   (/api/pass/feedback). The page's address, its title and the window size go with it; the server adds the browser.
   Mr. LaMarr reads them on feedback.html (Feedback inbox, in his Class Pass menu).

   What was typed stays while the panel is closed and opened again, until it is sent.

   window.PS8Feedback: open(), close(). */
(function(){
  "use strict";
  if(window.PS8Feedback) return;

  var TASKS = [
    "Sign in with Class Pass",
    "Read a lesson page",
    "Use a sim",
    "Study flashcards (Learn, Match or Test)",
    "Play a live game",
    "Play a review game",
    "Do a Self-Check or Video Check",
    "Look at the leaderboard",
    "Fill out an Extra Credit form",
    "Something else"
  ];
  var FINISHED = [["yes", "Yes"], ["hard", "Yes, but it was hard"], ["no", "No"]];
  var WORDS = {
    bug: {task: "What were you trying to do?", text: "Tell us what happened", hint: "What did you click, and what went wrong?",
      shot: "A screenshot helps show the problem (optional)", need: "Tell us what happened first."},
    idea: {task: "What is your idea about?", text: "Tell us your idea", hint: "What would make this site better for you?",
      shot: "A screenshot helps show what you mean (optional)", need: "Tell us your idea first."}
  };
  var PICTURE_MAX = 1400000; // the most a screenshot can be once it is turned into text (the server takes 1.5 MB)

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }
  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  var root = null, panel, form, thanks, x;
  var kindBtns = {}, task, taskLabel, doneWrap, done, text, textLabel, shotLabel, shotBtn, how, pic, picImg, file, who, msg, send;
  var kind = "bug", picture = "", capturing = false, sending = false, lastFocus = null, sentOne = false;

  function field(labelText, control, id){
    var wrap = el("div", "fb-field");
    var label = el("label", "fb-label", labelText);
    label.htmlFor = id;
    control.id = id;
    wrap.appendChild(label);
    wrap.appendChild(control);
    return {wrap: wrap, label: label};
  }
  function select(first, options){
    var s = el("select", "fb-input");
    s.appendChild(new Option(first, ""));
    options.forEach(function(o){ s.appendChild(Array.isArray(o) ? new Option(o[1], o[0]) : new Option(o, o)); });
    return s;
  }

  function build(){
    root = el("div", "fb");
    root.hidden = true;
    var back = el("div", "fb-back");
    back.addEventListener("click", close);
    root.appendChild(back);

    panel = el("section", "fb-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "fbTitle");
    var head = el("div", "fb-head");
    var h = el("h2", "fb-title", "Report bugs & feedback");
    h.id = "fbTitle";
    head.appendChild(h);
    x = el("button", "fb-x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    x.addEventListener("click", close);
    head.appendChild(x);
    panel.appendChild(head);

    form = el("form", "fb-body");
    form.noValidate = true;

    // what they are sending
    var kLabel = el("p", "fb-label", "What would you like to send?");
    kLabel.id = "fbKindLabel";
    form.appendChild(kLabel);
    var kinds = el("div", "fb-kinds");
    kinds.setAttribute("role", "group");
    kinds.setAttribute("aria-labelledby", "fbKindLabel");
    [["bug", "Something is wrong"], ["idea", "I have an idea"]].forEach(function(k){
      var b = el("button", "fb-kind", k[1]);
      b.type = "button";
      b.addEventListener("click", function(){ setKind(k[0]); });
      kindBtns[k[0]] = b;
      kinds.appendChild(b);
    });
    form.appendChild(kinds);

    task = select("Choose one", TASKS);
    var f1 = field(WORDS.bug.task, task, "fbTask");
    taskLabel = f1.label;
    form.appendChild(f1.wrap);

    done = select("Choose one", FINISHED);
    var f2 = field("Were you able to finish it?", done, "fbDone");
    doneWrap = f2.wrap;
    form.appendChild(doneWrap);

    text = el("textarea", "fb-input fb-text");
    text.rows = 5;
    text.maxLength = 4000;
    var f3 = field(WORDS.bug.text, text, "fbText");
    textLabel = f3.label;
    form.appendChild(f3.wrap);
    form.appendChild(el("p", "fb-note", "Please don't type passwords or anything private."));

    // the screenshot
    shotLabel = el("p", "fb-label", WORDS.bug.shot);
    form.appendChild(shotLabel);
    shotBtn = el("button", "fb-shot");
    shotBtn.type = "button";
    shotBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 5h18v11H3zM8 20h8M12 16v4"/></svg>';
    shotBtn.appendChild(el("span", null, "Take a screenshot of this page"));
    shotBtn.addEventListener("click", screenshot);
    form.appendChild(shotBtn);
    how = el("p", "fb-note");
    how.appendChild(document.createTextNode("Your browser will ask to share this tab. Press "));
    how.appendChild(el("b", null, "Allow"));
    how.appendChild(document.createTextNode(" (or pick "));
    how.appendChild(el("b", null, "This tab"));
    how.appendChild(document.createTextNode(", then "));
    how.appendChild(el("b", null, "Share"));
    how.appendChild(document.createTextNode(")."));
    form.appendChild(how);

    pic = el("div", "fb-pic");
    pic.hidden = true;
    picImg = el("img");
    picImg.alt = "Your screenshot";
    pic.appendChild(picImg);
    var picBtns = el("div", "fb-pic-btns");
    var again = el("button", "fb-link", "Take it again");
    again.type = "button";
    again.addEventListener("click", screenshot);
    var remove = el("button", "fb-link", "Remove");
    remove.type = "button";
    remove.addEventListener("click", function(){ setPicture(""); shotBtn.focus(); });
    picBtns.appendChild(again);
    picBtns.appendChild(remove);
    pic.appendChild(picBtns);
    form.appendChild(pic);

    // a school computer can block screenshots: a picture file works too (a Chromebook screenshot, for one)
    file = el("input");
    file.type = "file";
    file.accept = "image/*";
    file.hidden = true;
    file.addEventListener("change", function(){
      var f = file.files && file.files[0];
      file.value = "";
      if(f) fromFile(f);
    });
    form.appendChild(file);
    var add = el("button", "fb-link fb-add", "Or add a picture from this computer");
    add.type = "button";
    add.addEventListener("click", function(){ file.click(); });
    form.appendChild(add);

    who = el("p", "fb-who");
    form.appendChild(who);

    var foot = el("div", "fb-send-row");
    msg = el("p", "cp-msg fb-msg");
    msg.setAttribute("role", "status");
    foot.appendChild(msg);
    send = el("button", "btn fb-send", "Send");
    send.type = "submit";
    foot.appendChild(send);
    form.appendChild(foot);
    form.addEventListener("submit", function(e){ e.preventDefault(); submit(); });
    panel.appendChild(form);

    // after sending
    thanks = el("div", "fb-thanks");
    thanks.hidden = true;
    thanks.setAttribute("tabindex", "-1");
    thanks.appendChild(el("p", "fb-thanks-big", "Thank you!"));
    thanks.appendChild(el("p", "fb-thanks-text", "Mr. LaMarr got it. Reports like yours help fix the site for everyone."));
    var row = el("div", "fb-thanks-btns");
    var more = el("button", "btn secondary", "Send another");
    more.type = "button";
    more.addEventListener("click", function(){ reset(); thanks.hidden = true; form.hidden = false; kindBtns[kind].focus(); });
    var shut = el("button", "btn", "Close");
    shut.type = "button";
    shut.addEventListener("click", close);
    row.appendChild(more);
    row.appendChild(shut);
    thanks.appendChild(row);
    panel.appendChild(thanks);

    root.appendChild(panel);
    document.body.appendChild(root);
    root.addEventListener("keydown", function(e){
      if(e.key === "Escape"){ e.stopPropagation(); close(); return; }
      // keep Tab inside the panel
      if(e.key !== "Tab") return;
      var stops = Array.prototype.filter.call(panel.querySelectorAll("button, select, textarea, input:not([hidden])"), function(n){ return !n.disabled && n.offsetParent !== null; });
      if(!stops.length) return;
      var first = stops[0], last = stops[stops.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });
    setKind("bug");
  }

  function setKind(k){
    kind = k;
    var w = WORDS[k];
    Object.keys(kindBtns).forEach(function(n){ kindBtns[n].setAttribute("aria-pressed", String(n === k)); });
    taskLabel.textContent = w.task;
    textLabel.textContent = w.text;
    text.placeholder = w.hint;
    shotLabel.textContent = w.shot;
    doneWrap.hidden = k !== "bug";
    say("");
  }

  function say(t, bad){ msg.className = "cp-msg fb-msg" + (bad ? " bad" : ""); msg.textContent = t || ""; }

  function whoLine(){
    var v = window.PS8Pass ? window.PS8Pass.view() : {};
    if(v.student) return "You are in student view. This goes to your own inbox.";
    if(v.teacher) return "You are signed in as the teacher. This goes to your own inbox.";
    if(v.me) return ("Mr. LaMarr will see that this came from " + (v.me.name || "you") + ".").replace(/\.\.$/, ".");
    if(v.guest) return "This goes to Mr. LaMarr from a guest (you are signed in with the guest code).";
    return "You are not signed in, so Mr. LaMarr won't know who sent this.";
  }

  /* ---------- the screenshot ---------- */
  function setPicture(data){
    picture = data || "";
    pic.hidden = !picture;
    shotBtn.hidden = how.hidden = Boolean(picture);
    if(picture) picImg.src = picture; else picImg.removeAttribute("src");
  }
  // a canvas as a JPEG small enough to send
  function toJpeg(source, w, h){
    var sizes = [1600, 1200, 900], quality = [0.78, 0.62];
    for(var i = 0; i < sizes.length; i++){
      for(var j = 0; j < quality.length; j++){
        var scale = Math.min(1, sizes[i] / w);
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * scale));
        c.height = Math.max(1, Math.round(h * scale));
        var g = c.getContext("2d");
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(source, 0, 0, c.width, c.height);
        var data = c.toDataURL("image/jpeg", quality[j]);
        if(data.length <= PICTURE_MAX) return data;
      }
    }
    return "";
  }
  function screenshot(){
    if(capturing || sending) return;
    var md = navigator.mediaDevices;
    if(!md || !md.getDisplayMedia){
      say("This browser can't take a screenshot here. Add a picture from this computer instead, or send without one.", true);
      return;
    }
    say("");
    capturing = true;
    // the panel steps aside so the screenshot shows the page
    root.classList.add("fb-away");
    var stream = null;
    md.getDisplayMedia({video: {displaySurface: "browser"}, audio: false, preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude", monitorTypeSurfaces: "exclude"})
      .then(function(s){
        stream = s;
        var video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = s;
        return video.play().then(function(){ return wait(450); }).then(function(){
          if(!video.videoWidth) throw new Error("no picture");
          var data = toJpeg(video, video.videoWidth, video.videoHeight);
          if(!data) throw new Error("too big");
          setPicture(data);
          say("Screenshot added. You can send it now.");
        });
      })
      .catch(function(err){
        var name = err && err.name;
        if(name === "NotAllowedError" || name === "AbortError") say("No screenshot was taken (it was canceled, or this computer doesn't allow it). You can add a picture from this computer instead, or send without one.", true);
        else say("The screenshot didn't work. You can add a picture from this computer instead, or send without one.", true);
      })
      .then(function(){
        if(stream) stream.getTracks().forEach(function(t){ t.stop(); });
        capturing = false;
        root.classList.remove("fb-away");
        (picture ? send : shotBtn).focus();
      });
  }
  function fromFile(f){
    if(!/^image\//.test(f.type || "")){ say("That file is not a picture. Pick a picture file.", true); return; }
    if(f.size > 20 * 1024 * 1024){ say("That picture is too big. Pick a smaller one.", true); return; }
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function(){
      var data = toJpeg(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      if(!data){ say("That picture could not be used. Try another one.", true); return; }
      setPicture(data);
      say("Picture added. You can send it now.");
    };
    img.onerror = function(){ URL.revokeObjectURL(url); say("That picture could not be opened. Try another one.", true); };
    img.src = url;
  }

  /* ---------- sending ---------- */
  function submit(){
    if(capturing || sending) return;
    var words = text.value.trim();
    if(kind === "bug" && !task.value){ say("Pick what you were trying to do.", true); flag(task); return; }
    if(words.length < 3){ say(WORDS[kind].need, true); flag(text); return; }
    if(!window.PS8Pass){ say("The page is still opening. Try again in a moment.", true); return; }
    sending = true;
    send.disabled = true;
    say("Sending...");
    var page = location.origin + location.pathname + location.search + location.hash;
    window.PS8Pass.ask({
      type: "sendFeedback",
      kind: kind,
      task: task.value,
      finished: kind === "bug" ? done.value : "",
      text: words,
      page: page.slice(0, 300),
      title: document.title.slice(0, 200),
      screen: window.innerWidth + " x " + window.innerHeight,
      picture: picture
    }, 60000).then(function(){
      sentOne = true;
      say("");
      form.hidden = true;
      thanks.hidden = false;
      // closed while it was sending: say so on the page
      if(root.hidden){ if(window.PS8Pass.toast) window.PS8Pass.toast("Sent. Thank you! Mr. LaMarr got it."); }
      else thanks.focus();
    }, function(err){
      var why = (err && err.message) || "That did not send. Try again in a minute.";
      say(why, true);
      if(root.hidden && window.PS8Pass.toast) window.PS8Pass.toast("Your report did not send: " + why, true);
    }).then(function(){
      sending = false;
      send.disabled = false;
    });
  }
  // a box still to fill in turns red until it is filled (the message is down by Send, which may be out of view)
  function flag(box){
    box.setAttribute("aria-invalid", "true");
    box.focus();
    var clear = function(){ box.removeAttribute("aria-invalid"); box.removeEventListener("input", clear); box.removeEventListener("change", clear); };
    box.addEventListener("input", clear);
    box.addEventListener("change", clear);
  }
  function reset(){
    form.reset();
    [task, text].forEach(function(b){ b.removeAttribute("aria-invalid"); });
    setPicture("");
    setKind("bug");
    sentOne = false;
  }

  /* ---------- opening and closing ---------- */
  function open(){
    if(!root) build();
    if(!root.hidden) return;
    lastFocus = document.activeElement;
    // sent last time: start fresh
    if(sentOne){ reset(); thanks.hidden = true; form.hidden = false; }
    who.textContent = whoLine();
    root.hidden = false;
    document.documentElement.classList.add("fb-open");
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ root.classList.add("show"); }); });
    (thanks.hidden ? kindBtns[kind] : thanks).focus();
  }
  function close(){
    if(!root || root.hidden || capturing) return;
    root.classList.remove("show");
    document.documentElement.classList.remove("fb-open");
    setTimeout(function(){ if(!root.classList.contains("show")) root.hidden = true; }, 260);
    if(lastFocus && lastFocus.focus && document.contains(lastFocus)) try { lastFocus.focus(); } catch(e){ /* gone */ }
  }

  window.PS8Feedback = {open: open, close: close};
})();
