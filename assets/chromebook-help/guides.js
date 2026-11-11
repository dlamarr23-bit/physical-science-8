/* Chromebook Help: what each guide says and what its example screen shows (Donny, 2026-11-11).
   guide.js draws and plays them. A silent teaching drawing of a made-up assignment.

   A guide has: title, lede, ready (the "Before you start" list), unit ("Step" unless set), ask / askLede / yes / no
   (the "Did it work?" screen), and steps.
   A step has: title (with the words to look for in <b>), where (one short line under it), how ({kind, text}: the hint
   for the student's hands; kinds are tap1, tap2, drag, keys, type, talk, touch, hold), label (what the example screen is),
   scene(ui) (how the screen looks when the step begins), focus / pad / maxZoom / anchor (where it zooms in),
   touch (hide the pointer), trayTop (keys box at the top), and do: one or more actions played in order.
   An action has a type (click, right, altclick, keys, type, talk, drag, select, tap, hold, spread, write), usually a
   target (a part of the drawing, by its data-k name), tip (where on it the pointer lands, 0 to 1), tag / tagText
   (the yellow label), after(ui) (what the screen shows once it is done), zoom (where to look after), and
   ring / ringText / ringSide (what the yellow box points at after). */
(function(){
  "use strict";
  var TAP = { kind: "tap1", text: "Tap the touchpad once." };
  var TWO = { kind: "tap2", text: "Tap the touchpad with two fingers." };
  var MENU = { zoom: "ctx", zoomPad: [150, 26], ring: null };
  var SPOT = { focus: "empty-spot", pad: [250, 130], maxZoom: 2 };
  var ANSWER = { focus: "form-answer", pad: [70, 130], maxZoom: 1.9 };

  /* scenes that several steps share */
  function answering(ui){ return ui.page("form").cls("form-answer", "is-focus").show("answer-caret").show("answer-ph", false); }
  function voiceDoc(ui){ return ui.page("doc").doc("line").text("doc-title", "Weather answers"); }
  function listening(ui){ return voiceDoc(ui).show("docs-mic").cls("dm-btn", "is-listening").text("dm-status", "Listening..."); }
  function bubble(ui){ return ui.page("form").show("tr"); }
  function pub(ui){ return ui.page("pub"); }
  function qsOpen(ui){ return ui.page("doc").show("qs").cls("clock", "is-pressed"); }
  function settings(ui){ return ui.page("doc").show("set").cls("nav-net", "is-current"); }
  function searching(ui){ return settings(ui).cls("set-search", "is-focus").show("set-ph", false).text("set-q", "select to speak").show("set-caret").show("set-results"); }
  function ttsPage(ui){ return settings(ui).cls("nav-net", "is-current", false).cls("nav-a11y", "is-current").show("set-home", false).show("set-tts").show("set-ph", false).text("set-q", "select to speak"); }
  function aboutPage(ui, state){ return settings(ui).cls("nav-net", "is-current", false).cls("nav-about", "is-current").show("set-home", false).show("set-about").about(state); }
  function s2sDoc(ui){ return ui.page("doc").show("sts-s2s"); }
  function dictForm(ui){ return ui.page("form").show("sts-mic"); }
  function twoTabs(ui){ return ui.page("doc").show("tab2"); }
  function floating(ui){ return ui.page("doc").show("snap-a").place("snap-a", 300, 200); }

  // Click the time, then the gear: the first two steps of Settings.
  var OPEN_SETTINGS = [
    {
      title: "Click the <b>time</b>", where: "It is in the bottom right corner of the screen.", how: TAP,
      label: "ChromeOS, with Chrome open", scene: function(ui){ return ui.page("doc"); }, focus: "clock", pad: [200, 110], maxZoom: 2.4,
      do: [{ type: "click", target: "clock", tip: [0.72, 0.55], tag: "left", after: function(ui){ ui.show("qs"); }, zoom: "qs", zoomPad: [40, 30], ring: "qs-gear", ringText: "The gear is next", ringSide: "left" }]
    },
    {
      title: "Click the <b>gear</b>", where: "It opens Settings.", how: TAP,
      label: "ChromeOS Quick Settings", scene: qsOpen, focus: "qs", pad: [40, 30], maxZoom: 2,
      do: [{ type: "click", target: "qs-gear", tip: [0.5, 0.5], tag: "left", after: function(ui){ ui.show("qs", false).cls("clock", "is-pressed", false).show("set").cls("nav-net", "is-current"); }, zoom: "out", ring: null }]
    }
  ];

  window.cbGuides = {
    rightclick: {
      title: "Right-click, three ways",
      unit: "Way",
      ask: "Did the menu open?",
      yes: "That is a right-click.",
      no: ["Use an empty spot, not a word or a picture.", "On the touchpad, tap with both fingers at the same time.", "Using a mouse? Press its right button."],
      steps: [
        {
          title: "Touchpad: tap with <b>two fingers</b>", where: "A menu opens next to the pointer.",
          how: { kind: "tap2", text: "One quick tap with both fingers. Do not press down." },
          label: "Chrome: a Google Form", scene: function(ui){ return ui.page("form"); }, focus: SPOT.focus, pad: SPOT.pad, maxZoom: SPOT.maxZoom,
          do: [{ type: "right", target: "empty-spot", tagText: "Right-click here", after: function(ui){ ui.show("ctx"); }, zoom: MENU.zoom, zoomPad: MENU.zoomPad, ring: null }]
        },
        {
          title: "Hold <b>alt</b> and click", where: "The same menu opens.",
          how: { kind: "keys", text: "Hold alt. Then tap the touchpad once." },
          label: "Chrome: a Google Form", scene: function(ui){ return ui.page("form"); }, focus: SPOT.focus, pad: SPOT.pad, maxZoom: SPOT.maxZoom,
          do: [{ type: "altclick", target: "empty-spot", tagText: "Alt + click here", after: function(ui){ ui.show("ctx"); }, zoom: MENU.zoom, zoomPad: MENU.zoomPad, ring: null }]
        },
        {
          title: "Touchscreen: <b>press and hold</b>", where: "Let go and the menu opens. For Chromebooks with a touchscreen.",
          how: { kind: "hold", text: "Hold one finger still for about one second." },
          label: "Chrome: a Google Form", scene: function(ui){ return ui.page("form"); }, focus: SPOT.focus, pad: SPOT.pad, maxZoom: SPOT.maxZoom, touch: true,
          do: [{ type: "hold", target: "empty-spot", tagText: "Hold here", after: function(ui){ ui.show("ctx"); }, zoom: MENU.zoom, zoomPad: MENU.zoomPad, ring: null }]
        }
      ]
    },

    helpers: {
      title: "Turn on a helper",
      ready: ["You only do this one time."],
      ask: "Is the switch blue?",
      yes: "Select-to-speak is on. It stays on, even after you sign out.",
      no: ["Check the spelling in the search box.", "A gray switch that will not move means the school controls it. Tell your teacher."],
      steps: OPEN_SETTINGS.concat([
        {
          title: "Type <b>select to speak</b> in the search box", where: "Click the search box at the top first.",
          how: { kind: "type", text: "For Talk instead of type, type dictation." },
          label: "ChromeOS Settings", scene: settings, focus: "set-search", pad: [130, 110], maxZoom: 2.1,
          do: [
            { type: "click", target: "set-search", tip: [0.35, 0.5], tag: "below", after: function(ui){ ui.cls("set-search", "is-focus").show("set-ph", false).show("set-caret"); } },
            { type: "type", el: "set-q", text: "select to speak", after: function(ui){ ui.show("set-results"); }, ring: "set-res", ringText: "Your helper shows up here", ringSide: "below" }
          ]
        },
        {
          title: "Click <b>Select-to-speak</b>", where: "It is first in the list.", how: TAP,
          label: "ChromeOS Settings", scene: searching, focus: "set-results", pad: [130, 60], maxZoom: 2,
          do: [{ type: "click", target: "set-res", tip: [0.25, 0.4], tag: "side", after: function(ui){ ui.show("set-results", false).show("set-caret", false).cls("set-search", "is-focus", false).cls("nav-net", "is-current", false).cls("nav-a11y", "is-current").show("set-home", false).show("set-tts"); }, zoom: "s2s-row", zoomPad: [80, 90], ring: "s2s-toggle", ringText: "The switch", ringSide: "left" }]
        },
        {
          title: "Click the <b>switch</b> to turn it on", where: "It turns blue.", how: TAP,
          label: "ChromeOS Settings", scene: ttsPage, focus: "s2s-row", pad: [80, 90], maxZoom: 2,
          do: [{ type: "click", target: "s2s-toggle", tip: [0.8, 0.85], tag: "left", after: function(ui){ ui.cls("s2s-toggle", "is-on").show("sts-s2s"); }, ring: "s2s-toggle", ringText: "On", ringSide: "left" }]
        }
      ])
    },

    reading: {
      title: "Read aloud",
      ready: ["Turn on Select-to-speak first. See Turn on a helper.", "Put on your headphones."],
      ask: "Is it reading to you?",
      yes: "Press ctrl any time to stop it.",
      no: ["Turn on Select-to-speak first. See Turn on a helper.", "Highlight the words first. Then press Search + S.", "Turn the volume up and push your headphones all the way in."],
      steps: [
        {
          title: "Drag across the <b>words</b>", where: "They turn blue. Start at the first word and let go after the last one.",
          how: { kind: "drag", text: "Press the touchpad down and slide." },
          label: "Chrome: Google Docs", scene: s2sDoc, focus: "rd", pad: [60, 90], maxZoom: 2,
          do: [{ type: "select", target: "rd", words: "rw", tagText: "These words", tip: [0, 0.5] }]
        },
        {
          title: "Press <b>Search + S</b>", where: "It reads the words out loud. Each word lights up.",
          how: { kind: "keys", text: "Hold Search. Then tap S." },
          label: "ChromeOS Select-to-speak", scene: function(ui){ return s2sDoc(ui).selectAll(); }, focus: "rd", pad: [60, 90], maxZoom: 2, trayTop: true,
          do: [{ type: "keys", keys: ["Search", "S"], after: function(ui){ ui.read().show("s2s-bar"); }, zoom: [240, 300, 720, 330], zoomPad: [40, 20], ring: "s2s-bar", ringText: "Pause or stop here", ringSide: "above" }]
        },
        {
          title: "Press <b>ctrl</b> to stop", where: "Or click the square at the bottom of the screen.",
          how: { kind: "keys", text: "Tap ctrl once." },
          label: "ChromeOS Select-to-speak", scene: function(ui){ return s2sDoc(ui).read().show("s2s-bar"); }, focus: [240, 300, 720, 330], pad: [40, 20], maxZoom: 2, trayTop: true,
          do: [{ type: "keys", keys: ["ctrl"], after: function(ui){ ui.quiet().show("s2s-bar", false); } }]
        }
      ]
    },

    dictation: {
      title: "Talk instead of type",
      ready: ["Turn on Dictation first. See Turn on a helper."],
      ask: "Did your words show up?",
      yes: "Press Search + D any time you want to talk.",
      no: ["Turn on Dictation first. See Turn on a helper.", "Click inside the answer box first.", "Nothing happens? The school may have turned Dictation off. Tell your teacher."],
      steps: [
        {
          title: "Click inside the <b>answer box</b>", where: "A blinking line shows up.", how: TAP,
          label: "Chrome: a Google Form", scene: dictForm, focus: "form-answer", pad: [60, 120], maxZoom: 1.9,
          do: [{ type: "click", target: "form-answer", tip: [0.3, 0.6], after: answering }]
        },
        {
          title: "Press <b>Search + D</b>", where: "A small microphone box opens. You can also click the microphone next to the time.",
          how: { kind: "keys", text: "Hold Search. Then tap D." },
          label: "ChromeOS Dictation", scene: function(ui){ return answering(ui).show("sts-mic"); }, focus: ANSWER.focus, pad: ANSWER.pad, maxZoom: ANSWER.maxZoom,
          do: [{ type: "keys", keys: ["Search", "D"], after: function(ui){ ui.show("dict").cls("sts-mic", "is-listening"); }, ring: "dict", ringText: "It is listening", ringSide: "side" }]
        },
        {
          title: "Say your answer", where: 'Say "period" to end a sentence.',
          how: { kind: "talk", text: "Talk at your normal speed." },
          label: "ChromeOS Dictation", scene: function(ui){ return answering(ui).show("sts-mic").show("dict").cls("sts-mic", "is-listening"); }, focus: ANSWER.focus, pad: ANSWER.pad, maxZoom: ANSWER.maxZoom, trayTop: true,
          do: [{ type: "talk", el: "answer-text", say: "Sunday was warmer than Saturday period", text: "Sunday was warmer than Saturday." }]
        },
        {
          title: "Press <b>Search + D</b> again to stop", where: "Then read what it typed and fix wrong words.",
          how: { kind: "keys", text: "Hold Search. Then tap D." },
          label: "ChromeOS Dictation", scene: function(ui){ return answering(ui).show("sts-mic").show("dict").cls("sts-mic", "is-listening").text("answer-text", "Sunday was warmer than Saturday."); }, focus: ANSWER.focus, pad: ANSWER.pad, maxZoom: ANSWER.maxZoom,
          do: [{ type: "keys", keys: ["Search", "D"], after: function(ui){ ui.show("dict", false).cls("sts-mic", "is-listening", false); } }]
        }
      ]
    },

    docvoice: {
      title: "Talk in Google Docs",
      ask: "Did your words show up?",
      yes: "Read what it typed and fix wrong words.",
      no: ["Click in the Doc where the words should go.", "If Chrome asks to use your microphone, click Allow.", "The microphone turns red when it is listening."],
      steps: [
        {
          title: "Click <b>Tools</b>", where: "It is in the row of menus under the title.", how: TAP,
          label: "Chrome: Google Docs", scene: voiceDoc, focus: "m-tools", pad: [230, 95], maxZoom: 2.4,
          do: [{ type: "click", target: "m-tools", tip: [0.6, 0.7], tag: "below", after: function(ui){ ui.show("tools-menu"); } }]
        },
        {
          title: "Click <b>Voice typing</b>", where: "A box with a microphone opens beside the page.", how: TAP,
          label: "Chrome: Google Docs", scene: function(ui){ return voiceDoc(ui).show("tools-menu").cls("m-tools", "is-pressed"); }, focus: "tools-menu", pad: [150, 20], maxZoom: 2,
          do: [{ type: "click", target: "tools-voice", tip: [0.8, 0.55], tag: "side", after: function(ui){ ui.show("tools-menu", false).cls("m-tools", "is-pressed", false).show("docs-mic"); }, zoom: "docs-mic", zoomPad: [240, 90], ring: "dm-btn", ringText: "The microphone", ringSide: "side" }]
        },
        {
          title: "Click the <b>microphone</b>", where: "If Chrome asks to use your microphone, click Allow.", how: TAP,
          label: "Chrome: Google Docs", scene: function(ui){ return voiceDoc(ui).show("docs-mic"); }, focus: "docs-mic", pad: [240, 90], maxZoom: 2.2,
          do: [{ type: "click", target: "dm-btn", tip: [0.62, 0.62], tag: "side", after: function(ui){ ui.cls("dm-btn", "is-listening").text("dm-status", "Listening..."); } }]
        },
        {
          title: "Say your sentence", where: "Your words show up in the Doc.",
          how: { kind: "talk", text: "Talk at your normal speed." },
          label: "Chrome: Google Docs", scene: listening, focus: [130, 200, 800, 300], maxZoom: 1.5,
          do: [{ type: "talk", el: "doc-typed", say: "Sunday was two degrees warmer than Saturday period", text: "Sunday was two degrees warmer than Saturday." }]
        },
        {
          title: "Click the <b>microphone</b> again to stop", where: "Read what it typed and fix wrong words.", how: TAP,
          label: "Chrome: Google Docs", scene: function(ui){ return listening(ui).text("doc-typed", "Sunday was two degrees warmer than Saturday."); }, focus: [130, 200, 800, 300], maxZoom: 1.5,
          do: [{ type: "click", target: "dm-btn", tip: [0.62, 0.62], tag: "side", after: function(ui){ ui.cls("dm-btn", "is-listening", false).text("dm-status", "Click to speak"); } }]
        }
      ]
    },

    translate: {
      title: "Translate the page",
      ready: ["Type your answers in English. The checker grades English words."],
      ask: "Is the page in your language?",
      yes: "To go back, click English in the small box.",
      no: ["Right-click an empty spot, not a word or a picture.", "Closed the small box? Click the translate button at the right end of the address bar."],
      steps: [
        {
          title: "Right-click an <b>empty spot</b> on the page", where: "Not on a word or a picture.", how: TWO,
          label: "Chrome: a Google Form", scene: function(ui){ return ui.page("form"); }, focus: SPOT.focus, pad: SPOT.pad, maxZoom: SPOT.maxZoom,
          do: [{ type: "right", target: "empty-spot", tagText: "Right-click here", after: function(ui){ ui.show("ctx"); }, zoom: MENU.zoom, zoomPad: MENU.zoomPad, ring: "ctx-tr", ringText: "Then this", ringSide: "side" }]
        },
        {
          title: "Click <b>Translate to English</b>", where: "A small box opens at the top of the page.", how: TAP,
          label: "Chrome: the right-click menu", scene: function(ui){ return ui.page("form").show("ctx"); }, focus: "ctx", pad: [150, 26], maxZoom: 2,
          do: [{ type: "click", target: "ctx-tr", tip: [0.75, 0.55], tag: "side", after: function(ui){ ui.show("ctx", false).show("tr"); }, zoom: "tr", zoomPad: [170, 110], ring: "tr-dots", ringText: "The 3 dots", ringSide: "left" }]
        },
        {
          title: "Click the <b>3 dots</b>", where: "They are in the small box at the top.", how: TAP,
          label: "Chrome: Google Translate", scene: bubble, focus: "tr", pad: [170, 110], maxZoom: 2.2,
          do: [{ type: "click", target: "tr-dots", tip: [0.5, 0.55], tag: "left", after: function(ui){ ui.show("tr-more"); } }]
        },
        {
          title: "Click <b>Choose another language</b>", where: "It is first in the list.", how: TAP,
          label: "Chrome: Google Translate", scene: function(ui){ return bubble(ui).show("tr-more").cls("tr-dots", "is-pressed"); }, focus: "tr-more", pad: [190, 90], maxZoom: 2.2,
          do: [{ type: "click", target: "tr-other", tip: [0.8, 0.55], tag: "left" }]
        },
        {
          title: "Open the list and click <b>your language</b>", where: "This example picks Spanish.", how: TAP,
          label: "Chrome: Google Translate", scene: function(ui){ return bubble(ui).show("tr-choice"); }, focus: "tr", pad: [190, 120], maxZoom: 2.1,
          do: [
            { type: "click", target: "tr-select", tip: [0.85, 0.6], tag: "left", tagText: "Open the list", after: function(ui){ ui.show("tr-options"); }, ring: "tr-es", ringText: "Then your language", ringSide: "left" },
            { type: "click", target: "tr-es", tip: [0.75, 0.55], after: function(ui){ ui.show("tr-options", false).text("tr-select-text", "Spanish"); }, ring: null }
          ]
        },
        {
          title: "Click <b>Translate</b>", where: "The page changes to your language.", how: TAP,
          label: "Chrome: Google Translate", scene: function(ui){ return bubble(ui).show("tr-choice").text("tr-select-text", "Spanish"); }, focus: "tr", pad: [190, 120], maxZoom: 2.1,
          do: [{ type: "click", target: "tr-go", tip: [0.6, 0.6], tag: "left", after: function(ui){ ui.show("tr-choice", false).show("tr-es-tab").cls("tr-es-tab", "is-on").cls("tr-en", "is-off").spanish(true); }, zoom: [250, 84, 720, 300], ring: null }]
        }
      ]
    },

    find: {
      title: "Find a word",
      ask: "Did you find your word?",
      yes: "Press esc to close the search box.",
      no: ["Check the spelling of your word.", "Click the page first. Then press ctrl + F."],
      steps: [
        {
          title: "Press <b>ctrl + F</b>", where: "A search box opens at the top right.",
          how: { kind: "keys", text: "Hold ctrl. Then tap F." },
          label: "Chrome: a published assignment", scene: pub, focus: [250, 84, 860, 330], maxZoom: 1.6,
          do: [{ type: "keys", keys: ["ctrl", "F"], after: function(ui){ ui.show("find"); }, ring: "find", ringText: "It opens here", ringSide: "left" }]
        },
        {
          title: "Type your word", where: "Every match on the page lights up.",
          how: { kind: "type", text: "This example types weather." },
          label: "Chrome: a published assignment", scene: function(ui){ return pub(ui).show("find"); }, focus: [250, 84, 860, 330], maxZoom: 1.6,
          do: [{ type: "type", el: "find-q", text: "weather", after: function(ui){ ui.found(1); } }]
        },
        {
          title: "Press <b>enter</b> to jump to the next one", where: "The orange one is where you are.",
          how: { kind: "keys", text: "Tap enter once for each jump." },
          label: "Chrome: a published assignment", scene: function(ui){ return pub(ui).found(1); }, focus: [250, 84, 860, 330], maxZoom: 1.6,
          do: [
            { type: "keys", keys: ["enter"], after: function(ui){ ui.found(2); } },
            { type: "keys", keys: ["enter"], after: function(ui){ ui.found(3); } }
          ]
        }
      ]
    },

    screenshot: {
      title: "Take a screenshot",
      ask: "Is your screenshot there?",
      yes: "Check who the email is going to before you send it.",
      no: ["Take the screenshot again. Then paste it right away.", "Your screenshots are also in the Files app, in Downloads."],
      steps: [
        {
          title: "Press <b>ctrl + shift + Show windows</b>", where: "The screen goes dim and a bar opens at the bottom.",
          how: { kind: "keys", text: "Hold ctrl and shift. Then tap Show windows." },
          label: "ChromeOS, with Google Docs open", scene: function(ui){ return ui.page("doc"); }, trayTop: true,
          do: [{ type: "keys", keys: ["ctrl", "shift", "ShowWin"], after: function(ui){ ui.show("cap-dim").show("cap-bar"); }, ring: "cap-bar", ringText: "Screenshot tools", ringSide: "above" }]
        },
        {
          title: "Drag a box around what you want", where: "Start at one corner. Let go at the opposite corner.",
          how: { kind: "drag", text: "Press the touchpad down and slide." },
          label: "ChromeOS screen capture", scene: function(ui){ return ui.page("doc").show("cap-dim").show("cap-bar"); }, focus: "doc-assign", pad: [150, 40], maxZoom: 1.5,
          do: [{ type: "drag", box: "doc-assign", after: function(ui){ ui.capBox("doc-assign"); }, ring: "cap-btn", ringText: "Then click Capture", ringSide: "side" }]
        },
        {
          title: "Click <b>Capture</b>", where: "It is in the middle of your box.", how: TAP,
          label: "ChromeOS screen capture", scene: function(ui){ return ui.page("doc").show("cap-bar").capBox("doc-assign"); }, focus: "cap-btn", pad: [220, 130], maxZoom: 1.8,
          do: [{ type: "click", target: "cap-btn", tip: [0.5, 0.55], tag: "side", after: function(ui){ ui.show("cap-sel", false).show("cap-btn", false).show("cap-bar", false).show("cap-toast"); }, zoom: "out", ring: "cap-toast", ringText: "It is copied", ringSide: "left" }]
        },
        {
          title: "Click where the picture should go", where: "This example uses an email to your teacher.", how: TAP,
          label: "Chrome: Gmail", scene: function(ui){ return ui.page("mail"); }, focus: "mail-new", pad: [60, 14], maxZoom: 1.6,
          do: [{ type: "click", target: "mail-body", tip: [0.4, 0.45], tag: "left", after: function(ui){ ui.show("mail-caret"); } }]
        },
        {
          title: "Press <b>ctrl + V</b>", where: "Your screenshot shows up.",
          how: { kind: "keys", text: "Hold ctrl. Then tap V." },
          label: "Chrome: Gmail", scene: function(ui){ return ui.page("mail").show("mail-caret"); }, focus: "mail-new", pad: [60, 14], maxZoom: 1.6, trayTop: true,
          do: [{ type: "keys", keys: ["ctrl", "V"], after: function(ui){ ui.show("mail-caret", false).show("pasted"); } }]
        }
      ]
    },

    "side-by-side": {
      title: "Side by side",
      ready: ["Open both pages in Chrome."],
      ask: "Are both pages showing?",
      yes: "To make one full screen again, click it and press alt + =.",
      no: ["Drag the tab all the way off the row of tabs before you let go.", "Click the window you want to move first.", "Only one window moved? Click the other one and press alt + ] to put it on the right."],
      steps: [
        {
          title: "Drag a tab down, off the row of tabs", where: "It turns into its own window.",
          how: { kind: "drag", text: "Press the touchpad down and slide." },
          label: "Chrome, with two tabs open", scene: twoTabs,
          do: [{
            type: "drag", from: [400, 20], to: [450, 215], target: "tab2", tag: "below", tagText: "Drag this tab",
            move: function(ui, p, x, y){ if (p > 0.12) ui.show("tab2", false).show("snap-a").place("snap-a", x - 150, y - 15); }
          }]
        },
        {
          title: "Press <b>alt + [</b>", where: "The window fills the left half.",
          how: { kind: "keys", text: "Hold alt. Then tap [ (left bracket)." },
          label: "ChromeOS", scene: floating,
          do: [{ type: "keys", keys: ["alt", "["], after: function(ui){ ui.place("snap-a").cls("snap-a", "is-half").show("win", false).show("snap-shade"); }, ring: "snap-pick", ringText: "Your other windows", ringSide: "above" }]
        },
        {
          title: "Click the <b>other window</b>", where: "It fills the right half.", how: TAP,
          label: "ChromeOS", scene: function(ui){ return ui.page("doc").show("snap-a").cls("snap-a", "is-half").show("win", false).show("snap-shade"); }, focus: "snap-pick", pad: [140, 110], maxZoom: 1.6,
          do: [{ type: "click", target: "snap-pick", tip: [0.6, 0.6], after: function(ui){ ui.show("snap-shade", false).show("snap-b"); }, zoom: "out", ring: null }]
        }
      ]
    },

    tablet: {
      title: "No keyboard?",
      unit: "Tip",
      ask: "Did those work?",
      yes: "These work any time the screen is folded back.",
      no: ["Fold the screen all the way back.", "No keyboard on the screen? Tap inside the answer box again."],
      steps: [
        {
          title: "Tap an <b>answer box</b> to type", where: "A keyboard pops up on the screen.",
          how: { kind: "touch", text: "Tap once with one finger." },
          label: "Chrome: a Google Form", scene: function(ui){ return ui.page("form"); }, focus: "form-answer", pad: [60, 120], maxZoom: 1.9, touch: true,
          do: [{ type: "tap", target: "form-answer", tip: [0.3, 0.6], tagText: "Tap here", after: function(ui){ answering(ui).show("osk"); }, zoom: "out", ring: "osk-rows", ringText: "Tap the keys to type", ringSide: "above" }]
        },
        {
          title: "Tap the <b>pen</b>, then write with your finger", where: "Your writing turns into typing.",
          how: { kind: "touch", text: "Write in the big white box." },
          label: "ChromeOS handwriting", scene: function(ui){ return answering(ui).show("osk"); }, focus: [200, 250, 800, 377], maxZoom: 1.5, touch: true,
          do: [
            { type: "tap", target: "osk-pen", tagText: "The pen", press: true, after: function(ui){ ui.show("osk-rows", false).show("ink"); }, ring: null },
            { type: "write", el: "ink-svg", after: function(ui){ ui.text("answer-text", "warmer"); }, ring: "form-answer", ringText: "It turns into typing", ringSide: "side" }
          ]
        },
        {
          title: "Spread two fingers to zoom in", where: "Pinch them together to zoom back out.",
          how: { kind: "touch", text: "Put two fingers on the screen." },
          label: "Chrome: a published assignment", scene: pub, touch: true,
          do: [{ type: "spread", a: [[560, 330], [420, 260]], b: [[640, 380], [790, 460]], move: function(ui, p){ ui.scale("pg-pub", 1 + 0.45 * p); } }]
        },
        {
          title: "<b>Press and hold</b> to right-click", where: "Let go and the menu opens.",
          how: { kind: "hold", text: "Hold one finger still for about one second." },
          label: "Chrome: a Google Form", scene: function(ui){ return ui.page("form"); }, focus: SPOT.focus, pad: SPOT.pad, maxZoom: SPOT.maxZoom, touch: true,
          do: [{ type: "hold", target: "empty-spot", tagText: "Hold here", after: function(ui){ ui.show("ctx"); }, zoom: MENU.zoom, zoomPad: MENU.zoomPad, ring: null }]
        }
      ]
    },

    updates: {
      title: "Update your Chromebook",
      ready: ["Save your work.", "Plug in your charger."],
      ask: "Did it work?",
      askLede: "After the restart, your Chromebook should open like normal.",
      yes: "Your Chromebook is up to date.",
      no: ["Plug in your charger.", "Check that Wi-Fi is on.", "Wait for the download to finish. It can take a while."],
      steps: OPEN_SETTINGS.concat([
        {
          title: "Click <b>About ChromeOS</b>", where: "It is last in the list on the left.", how: TAP,
          label: "ChromeOS Settings", scene: settings, focus: "nav-about", pad: [90, 105], maxZoom: 2.3, anchor: [0.3, 0.72],
          do: [{ type: "click", target: "nav-about", tip: [0.55, 0.5], tag: "side", after: function(ui){ ui.cls("nav-net", "is-current", false).cls("nav-about", "is-current").show("set-home", false).show("set-about").about("idle"); }, zoom: "about-status", zoomPad: [26, 64], ring: "about-action", ringText: "Next, this button", ringSide: "left" }]
        },
        {
          title: "Click <b>Check for updates</b>", where: "Then wait. The download can take a few minutes.", how: TAP,
          label: "ChromeOS Settings", scene: function(ui){ return aboutPage(ui, "idle"); }, focus: "about-status", pad: [26, 64], maxZoom: 1.9,
          do: [{ type: "click", target: "about-action", tip: [0.6, 0.6], tag: "left", after: function(ui){ ui.about("checking"); } }]
        },
        {
          title: "Click <b>Restart</b>", where: "If it says Your Chromebook is up to date, you are done.",
          how: { kind: "tap1", text: "Save your work first." },
          label: "ChromeOS Settings", scene: function(ui){ return aboutPage(ui, "restart"); }, focus: "about-status", pad: [26, 64], maxZoom: 1.9,
          do: [{ type: "click", target: "about-action", tip: [0.55, 0.6], tag: "left" }]
        }
      ])
    }
  };
})();
