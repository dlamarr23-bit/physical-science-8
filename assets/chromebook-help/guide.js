/* Chromebook Help: step-by-step guides (Donny, 2026-11-11).

   Every <div class="cbg" data-guide="name" data-no-edit> on chromebook-help.html becomes a guide: a Start
   screen, then one step per screen at the student's pace, then "Did it work?". Each step shows a drawing of a
   Chromebook (Chrome, the shelf, Quick Settings, Settings, the screenshot bar, ...) that starts with the
   whole screen, zooms in on the spot, and plays the click, keys or words with a pointer and a yellow box.
   The words and the screens for each guide are in guides.js (window.cbGuides).
   A silent teaching drawing: nothing here changes the student's Chromebook. */
(function(){
  "use strict";
  var W = 1200, H = 675;
  var GUIDES = window.cbGuides || {};

  /* ---------- small drawings ---------- */
  var SVG = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M14.6 14.6 20 20" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
    showwin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="13" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M18.5 8v8M21.5 9.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3" fill="currentColor"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M13.7 2.5l.4 2.4c.6.2 1.1.5 1.6.9l2.3-.9 1.7 3-1.9 1.5c.1.6.1 1.2 0 1.8l1.9 1.5-1.7 3-2.3-.9c-.5.4-1 .7-1.6.9l-.4 2.4h-3.4l-.4-2.4c-.6-.2-1.1-.5-1.6-.9l-2.3.9-1.7-3 1.9-1.5a6 6 0 0 1 0-1.8L2.3 7.9l1.7-3 2.3.9c.5-.4 1-.7 1.6-.9l.4-2.4zM12 8.6a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z" transform="translate(0 1)"/></svg>',
    power: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v8M7.2 6.3a7 7 0 1 0 9.6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 1.5 8.5a15 15 0 0 1 21 0z" fill="currentColor"/></svg>',
    battery: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="9" y="8" width="6" height="11" rx="1" fill="currentColor"/></svg>',
    speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 8.5h8M8 11.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3.5L9 5h6l1.5 2H20v12H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    video: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 10.5 21 7.5v9l-5-3z" fill="currentColor"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    part: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8V5h3M18 5h3v3M21 16v3h-3M6 19H3v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="8" y="9" width="8" height="6" fill="currentColor"/></svg>',
    window: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18" stroke="currentColor" stroke-width="2"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM19 5v14L9 12z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM5 5v14l10-7z" fill="currentColor"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4.8L15.8 4.6a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L8.8 18.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    smile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 14a5 5 0 0 0 8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="9.5" r="1.3" fill="currentColor"/><circle cx="15" cy="9.5" r="1.3" fill="currentColor"/></svg>'
  };

  // The hint beside each step: what the student's hands do.
  function pad(dots, extra){
    return '<svg viewBox="0 0 52 40" aria-hidden="true"><rect x="2" y="3" width="48" height="34" rx="7" fill="#eef1f6" stroke="#8a97ab" stroke-width="2.5"/>' +
      dots.map(function(d){ return '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="6" fill="#ffd21f" stroke="#8a6d00" stroke-width="1.5"/>'; }).join("") + (extra || "") + '</svg>';
  }
  var SCREEN = '<rect x="4" y="2" width="44" height="36" rx="5" fill="#eef1f6" stroke="#8a97ab" stroke-width="2.5"/><rect x="9" y="7" width="34" height="26" rx="2" fill="#fff"/>';
  var KEYS = '<svg viewBox="0 0 52 40" aria-hidden="true"><rect x="2" y="6" width="48" height="28" rx="5" fill="#eef1f6" stroke="#8a97ab" stroke-width="2.5"/><rect x="8" y="12" width="9" height="7" rx="1.5" fill="#ffd21f"/><rect x="21" y="12" width="9" height="7" rx="1.5" fill="#c5cedb"/><rect x="34" y="12" width="9" height="7" rx="1.5" fill="#ffd21f"/><rect x="13" y="23" width="26" height="6" rx="1.5" fill="#c5cedb"/></svg>';
  var HOW = {
    tap1: pad([[26, 20]]),
    tap2: pad([[19, 20], [33, 20]]),
    drag: pad([[14, 20]], '<path d="M23 20h17m-5-5 5 5-5 5" fill="none" stroke="#52607a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
    keys: KEYS, type: KEYS,
    touch: '<svg viewBox="0 0 52 40" aria-hidden="true">' + SCREEN + '<circle cx="26" cy="20" r="6" fill="#ffd21f" stroke="#8a6d00" stroke-width="1.5"/></svg>',
    hold: '<svg viewBox="0 0 52 40" aria-hidden="true">' + SCREEN + '<circle cx="26" cy="20" r="10" fill="none" stroke="#ffd21f" stroke-width="3"/><circle cx="26" cy="20" r="5" fill="#ffd21f" stroke="#8a6d00" stroke-width="1.5"/></svg>',
    talk: '<span class="cbg-how-mic">' + SVG.mic + '</span>'
  };

  // One key in the black box that shows what is pressed.
  function keycap(k){
    if (k === "Search") return '<span class="cbg-kc" title="Search">' + SVG.search + '</span>';
    if (k === "ShowWin") return '<span class="cbg-kc" title="Show windows">' + SVG.showwin + '</span>';
    if (k === "click") return '<span class="cbg-kc word">click</span>';
    return '<span class="cbg-kc">' + k + '</span>';
  }

  /* ---------- the drawing ---------- */
  var MINI_DOC = '<div class="cbd-mini"><h4>Weekend weather</h4><i style="width:70%"></i><div class="t"><span></span><span></span><span></span><span></span><span></span><span></span></div><i style="width:55%"></i></div>';
  var MINI_FORM = '<div class="cbd-mini"><h4>Weekend weather</h4><i style="width:60%"></i></div><div class="cbd-mini"><p class="fq">Which day was warmer? Explain your answer.</p><i style="width:55%;margin-top:18px;background:#9aa0a6;height:2px"></i></div>';
  var SPLIT_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 5v14" stroke="currentColor" stroke-width="2"/></svg>';

  var DESK =
  '<div class="cbd" data-k="desk">' +
  '<div class="cbd-wall"></div>' +

  /* Chrome, full screen */
  '<div class="cbd-win" data-k="win" data-on>' +
    '<div class="cbd-tabs">' +
      '<span class="cbd-tab" data-k="tab1"><i class="cbd-ic" data-k="tab-ic"></i><span data-k="tab-name"></span><b>&times;</b></span>' +
      '<span class="cbd-tab back" data-k="tab2" data-sc><i class="cbd-ic form"></i><span>Weather answers - Google Forms</span><b>&times;</b></span>' +
      '<span class="cbd-tab cbd-tabsplit" data-k="tab-split" data-sc><span><i class="cbd-ic"></i>Weekend weather</span><span><i class="cbd-ic form"></i>Weather answers</span><b>&times;</b></span>' +
      '<span class="cbd-newtab">+</span><span class="cbd-ctl"><i>&minus;</i><i>&#9633;</i><i>&times;</i></span>' +
    '</div>' +
    '<div class="cbd-bar"><span>&larr;</span><span>&rarr;</span><span>&#8635;</span><div class="cbd-url" data-k="url"></div><span class="cbd-avatar">S</span><span>&#8942;</span></div>' +
    '<div class="cbd-menu cbd-tabmenu" data-k="tabmenu" data-sc><span>New tab to the right</span><span data-k="tm-split"><span class="cbd-tm-ic">' + SPLIT_IC + 'Add tab to new split view</span></span><span>Add tab to group<em>&rsaquo;</em></span><span>Move tab to new window</span><hr>' +
      '<span>Reload<em>Ctrl+R</em></span><span>Duplicate</span><span>Pin</span><span>Mute site</span><hr><span>Close<em>Ctrl+W</em></span><span>Close other tabs</span><span>Close tabs to the right</span></div>' +
    '<div class="cbd-content">' +

      /* Google Docs */
      '<div class="cbd-pg cbd-docpg" data-k="pg-doc">' +
        '<div class="cbd-dhead"><i class="cbd-bigdoc"></i><div><b data-k="doc-title" data-d="Weekend weather">Weekend weather</b>' +
          '<div class="cbd-menus">File &nbsp; Edit &nbsp; View &nbsp; Insert &nbsp; Format &nbsp; <span class="cbd-mtools" data-k="m-tools">Tools' +
            '<span class="cbd-menu cbd-tools" data-k="tools-menu" data-sc><span>Spelling and grammar</span><span>Word count</span><span>Review suggested edits</span><hr><span>Compare documents</span><span>Citations</span><span>Translate document</span><span data-k="tools-voice">Voice typing<em>Ctrl+Shift+S</em></span><hr><span>Preferences</span><span>Accessibility</span></span>' +
          '</span> &nbsp; Extensions &nbsp; Help</div></div><span class="cbd-share">Share</span></div>' +
        '<div class="cbd-dbar">&#8630; &nbsp; &#8631; &nbsp; 100% &nbsp; | &nbsp; Normal text &nbsp; | &nbsp; Arial &nbsp; | &nbsp; 11 &nbsp; | &nbsp; <b>B</b> <i style="font-style:italic">I</i> <u>U</u></div>' +
        '<div class="cbd-paper">' +
          '<div class="cbd-assign" data-k="doc-assign" data-on><h3>Weekend weather</h3><p>Read the table. Then answer the question.</p>' +
            '<table><tr><th>Day</th><th>Temperature</th></tr><tr><td>Saturday</td><td>18 &deg;C</td></tr><tr><td>Sunday</td><td>20 &deg;C</td></tr></table>' +
            '<p><span class="cbd-rd" data-k="rd"></span></p><p class="q">Which day was warmer?</p></div>' +
          '<div class="cbd-assign" data-k="doc-line" data-sc><h3>Weather answers</h3><p style="display:flex;align-items:center;gap:1px"><span data-k="doc-typed" data-d=""></span><i class="cbd-caret"></i></p></div>' +
        '</div>' +
        '<div class="cbd-dmic" data-k="docs-mic" data-sc><span class="x">&times;</span><small>English (US)</small><span class="cbd-micbtn" data-k="dm-btn">' + SVG.mic + '</span><small data-k="dm-status" data-d="Click to speak">Click to speak</small></div>' +
      '</div>' +

      /* Google Forms */
      '<div class="cbd-pg cbd-formpg" data-k="pg-form">' +
        '<div class="cbd-fcol">' +
          '<div class="cbd-fcard head"><h3 data-es="El tiempo del fin de semana">Weekend weather</h3><p data-es="Usa la tabla de tu tarea para responder.">Use the table in your assignment to answer.</p></div>' +
          '<div class="cbd-fcard"><p class="cbd-fq" data-es="&iquest;Qu&eacute; d&iacute;a fue m&aacute;s c&aacute;lido? Explica tu respuesta.">Which day was warmer? Explain your answer.</p>' +
            '<div class="cbd-answer" data-k="form-answer"><span data-k="answer-text" data-d=""></span><i class="cbd-caret" data-k="answer-caret" data-sc></i><span class="cbd-ph" data-k="answer-ph" data-on data-es="Tu respuesta">Your answer</span>' +
              '<span class="cbd-dict" data-k="dict" data-sc><i class="cbd-dict-mic">' + SVG.mic + '</i><span>Listening</span></span></div>' +
          '</div>' +
          '<span class="cbd-submit" data-es="Enviar">Submit</span>' +
        '</div>' +
      '</div>' +

      /* a published page */
      '<div class="cbd-pg cbd-pubpg" data-k="pg-pub">' +
        '<div class="cbd-pubbar">Published using Google Docs</div>' +
        '<div class="cbd-pub"><h3>Weekend weather</h3><p>Read the <mark data-k="mark">weather</mark> table.</p>' +
          '<table><tr><th>Day</th><th>Temperature</th></tr><tr><td>Saturday</td><td>18 &deg;C</td></tr><tr><td>Sunday</td><td>20 &deg;C</td></tr></table>' +
          '<p>Which day had warmer <mark data-k="mark">weather</mark>?</p><p>Write one sentence about the <mark data-k="mark">weather</mark>.</p></div>' +
      '</div>' +

      /* Gmail */
      '<div class="cbd-pg cbd-mailpg" data-k="pg-mail">' +
        '<div class="cbd-mtop"><i class="cbd-mlogo">M</i><b>Gmail</b><span class="cbd-msearch">Search mail</span></div>' +
        '<div class="cbd-mside"><span class="cbd-compose">Compose</span><span class="sel">Inbox</span><span>Starred</span><span>Sent</span><span>Drafts</span></div>' +
        '<div class="cbd-mlist"><div><b>Mr. LaMarr</b>Weekend weather assignment</div><div><b>Google Classroom</b>New assignment: Weather answers</div><div><b>Library</b>Your book is due Friday</div></div>' +
        '<div class="cbd-mnew" data-k="mail-new"><div class="cbd-mnew-h">New Message<span>&minus; &nbsp; &times;</span></div>' +
          '<div class="cbd-mrow">To &nbsp;<b style="font-weight:500">Mr. LaMarr</b></div><div class="cbd-mrow">My screenshot</div>' +
          '<div class="cbd-mbody" data-k="mail-body"><p>Here is my screenshot.</p><i class="cbd-caret" data-k="mail-caret" data-sc></i><div class="cbd-pasted" data-k="pasted" data-sc>' + MINI_DOC + '</div></div>' +
          '<div class="cbd-mfoot"><span class="cbd-send">Send</span></div></div>' +
      '</div>' +

      /* Chrome split view: two tabs side by side in one window */
      '<div class="cbd-split" data-k="split" data-sc>' +
        '<div class="cbd-pane" data-k="pane-a"><div class="cbd-panebody doc">' + MINI_DOC + '</div></div>' +
        '<span class="cbd-splitbar" data-k="split-bar"><i></i></span>' +
        '<div class="cbd-pane" data-k="pane-b"><div class="cbd-panebody form">' + MINI_FORM + '</div></div>' +
      '</div>' +

      '<i class="cbd-empty" data-k="empty-spot"></i>' +
      '<div class="cbd-menu cbd-ctx" data-k="ctx" data-sc><span>Back<em>Alt+Left arrow</em></span><span class="off">Forward<em>Alt+Right arrow</em></span><span>Reload<em>Ctrl+R</em></span><hr>' +
        '<span>Save as...<em>Ctrl+S</em></span><span>Print...<em>Ctrl+P</em></span><span>Cast...</span><hr>' +
        '<span data-k="ctx-tr">Translate to English</span><span>Open in reading mode</span><hr><span>View page source<em>Ctrl+U</em></span><span>Inspect</span></div>' +
      '<div class="cbd-find" data-k="find" data-sc><span class="cbd-find-q" data-k="find-q" data-d=""></span><span class="cbd-find-n" data-k="find-n" data-d="0/0">0/0</span><span>&#8963;</span><span>&#8964;</span><span>&times;</span></div>' +
      '<div class="cbd-tr" data-k="tr" data-sc>' +
        '<div class="cbd-tr-h"><b>Google Translate</b><span class="cbd-tr-dots" data-k="tr-dots">&#8942;</span><span>&times;</span></div>' +
        '<div class="cbd-tr-tabs"><span class="on" data-k="tr-en">English</span><span data-k="tr-es-tab" data-sc>Spanish</span></div>' +
        '<div class="cbd-menu cbd-tr-more" data-k="tr-more" data-sc><span data-k="tr-other">Choose another language</span><span>Page is not in English</span><span>Never translate English</span><span>Never translate this site</span></div>' +
        '<div class="cbd-tr-choice" data-k="tr-choice" data-sc><small>Translate to</small><div class="cbd-tr-select" data-k="tr-select"><span data-k="tr-select-text" data-d="Choose a language">Choose a language</span><b>&#9662;</b></div>' +
          '<div class="cbd-tr-go"><span>Cancel</span><span class="cbd-tr-btn" data-k="tr-go">Translate</span></div>' +
          '<div class="cbd-menu cbd-tr-opts" data-k="tr-options" data-sc><span>Slovenian</span><span>Somali</span><span data-k="tr-es">Spanish</span><span>Sundanese</span><span>Swahili</span></div></div>' +
      '</div>' +
    '</div>' +
  '</div>' +

  /* tablet: the keyboard on the screen */
  '<div class="cbd-osk" data-k="osk" data-sc><div class="cbd-osk-bar"><i>' + SVG.smile + '</i><i data-k="osk-pen">' + SVG.pen + '</i><i>' + SVG.mic + '</i><i>' + SVG.gear + '</i><b>&#8964;</b></div>' +
    '<div class="cbd-osk-rows" data-k="osk-rows" data-on></div>' +
    '<div class="cbd-ink" data-k="ink" data-sc><small>Write here</small><svg data-k="ink-svg" viewBox="0 0 420 85" preserveAspectRatio="xMinYMid meet">' +
      '<path class="cbd-stroke" d="M10 30c3 14 5 30 9 36 4-10 8-22 12-26 4 4 7 18 11 26 5-8 9-26 12-38"/>' +
      '<path class="cbd-stroke" d="M84 46c-6-8-20-6-22 6s8 16 16 10c4-4 6-12 6-16 0 8 0 16 6 18"/>' +
      '<path class="cbd-stroke" d="M104 40c2 8 2 18 2 24 0-14 6-24 18-22"/>' +
      '<path class="cbd-stroke" d="M136 64V42c4-4 14-6 16 2v20m0-20c4-6 14-6 16 2v18"/>' +
      '<path class="cbd-stroke" d="M190 52h20c0-10-10-14-16-10s-8 16-2 20 14 2 18-2"/>' +
      '<path class="cbd-stroke" d="M226 40c2 8 2 18 2 24 0-14 6-24 18-22"/></svg></div>' +
  '</div>' +

  /* Select-to-speak buttons */
  '<div class="cbd-s2s" data-k="s2s-bar" data-sc><i>' + SVG.prev + '</i><i class="big">' + SVG.pause + '</i><i>' + SVG.next + '</i><span>1x</span><i>' + SVG.stop + '</i></div>' +

  /* the shelf */
  '<div class="cbd-shelf"><span class="cbd-launch"></span>' +
    '<div class="cbd-apps"><i class="cbd-app chrome"></i><i class="cbd-app files"></i><i class="cbd-app docs"></i><i class="cbd-app gmail"></i><i class="cbd-app yt"></i></div>' +
    '<div class="cbd-tray"><span class="cbd-pill" data-k="sts-s2s" data-sc>' + SVG.speak + '</span><span class="cbd-pill" data-k="sts-mic" data-sc>' + SVG.mic + '</span>' +
      '<span class="cbd-pill">Nov 11</span><span class="cbd-pill" data-k="clock">' + SVG.wifi + SVG.battery + '10:42</span></div>' +
  '</div>' +

  /* Quick Settings */
  '<div class="cbd-qs" data-k="qs" data-sc>' +
    '<div class="cbd-qs-top"><span class="d">85%</span><span class="cbd-qs-out">Sign out</span><i class="cbd-qs-ic">' + SVG.power + '</i><i class="cbd-qs-ic" data-k="qs-gear">' + SVG.gear + '</i></div>' +
    '<div class="cbd-qs-tiles"><span class="on">Wi-Fi<small>School Wi-Fi</small></span><span class="on">Bluetooth<small>On</small></span><span>Notifications<small>On</small></span><span>Do not disturb<small>Off</small></span><span>Screen capture</span><span>Night Light<small>Off</small></span></div>' +
    '<div class="cbd-qs-sl"><b></b></div><div class="cbd-qs-sl b2"><b></b></div>' +
    '<div class="cbd-qs-foot"><span>Wed, Nov 11</span><span>About 6 hours left</span></div>' +
  '</div>' +

  /* the Settings app */
  '<div class="cbd-set" data-k="set" data-sc>' +
    '<div class="cbd-set-h"><b>Settings</b><div class="cbd-set-search" data-k="set-search">' + SVG.search + '<span data-k="set-ph" data-on>Search settings</span><span data-k="set-q" data-d=""></span><i class="cbd-caret" data-k="set-caret" data-sc></i></div><span class="cbd-ctl"><i>&minus;</i><i>&#9633;</i><i>&times;</i></span></div>' +
    '<div class="cbd-set-results" data-k="set-results" data-sc><span data-k="set-res"><b>Select-to-speak</b><small>Accessibility &rsaquo; Text-to-Speech</small></span><span><b>Select-to-speak settings</b><small>Accessibility &rsaquo; Text-to-Speech</small></span></div>' +
    '<div class="cbd-set-nav"><span data-k="nav-net">Network</span><span>Bluetooth</span><span>Connected devices</span><span>Accounts</span><span>Device</span><span>Personalization</span><span>Privacy and security</span><span>Apps</span><span data-k="nav-a11y">Accessibility</span><span>System preferences</span><span data-k="nav-about">About ChromeOS</span></div>' +
    '<div class="cbd-set-main">' +
      '<div data-k="set-home" data-on><div class="cbd-set-title">Network</div><div class="cbd-set-card"><div class="cbd-row"><div>Wi-Fi<small>School Wi-Fi</small></div><span class="cbd-toggle is-on"></span></div><div class="cbd-row"><div>Ethernet<small>Not connected</small></div><span class="go">&rsaquo;</span></div><div class="cbd-row"><div>VPN<small>Not connected</small></div><span class="go">&rsaquo;</span></div></div></div>' +
      '<div data-k="set-tts" data-sc><div class="cbd-set-title">&larr; &nbsp;Text-to-Speech</div><div class="cbd-set-card">' +
        '<div class="cbd-row"><div>ChromeVox<small>Spoken feedback for people who are blind or have low vision</small></div><span class="cbd-toggle"></span></div>' +
        '<div class="cbd-row" data-k="s2s-row"><div>Select-to-speak<small>Highlight words, then press Search + S to hear them</small></div><span class="cbd-toggle" data-k="s2s-toggle"></span></div>' +
        '<div class="cbd-row"><div>Text-to-Speech voice settings</div><span class="go">&rsaquo;</span></div></div></div>' +
      '<div data-k="set-about" data-sc><div class="cbd-set-title">About ChromeOS</div><div class="cbd-set-card">' +
        '<div class="cbd-row"><span class="cbd-logo"></span><div style="font-size:16px">ChromeOS</div></div>' +
        '<div class="cbd-row" data-k="about-status"><span class="cbd-aicon" data-k="about-icon"></span><div><span data-k="about-heading" data-d="Your Chromebook is up to date">Your Chromebook is up to date</span><small data-k="about-detail" data-d="Version 142">Version 142</small></div><span class="cbd-abtn" data-k="about-action" data-d="Check for updates">Check for updates</span></div>' +
        '<div class="cbd-row"><div>Get help with ChromeOS</div><span class="go">&rsaquo;</span></div><div class="cbd-row"><div>Report an issue</div><span class="go">&rsaquo;</span></div><div class="cbd-row"><div>Additional details</div><span class="go">&rsaquo;</span></div></div></div>' +
    '</div>' +
  '</div>' +

  /* screen capture */
  '<div class="cbd-capdim" data-k="cap-dim" data-sc></div>' +
  '<div class="cbd-capsel" data-k="cap-sel" data-sc></div>' +
  '<span class="cbd-capbtn" data-k="cap-btn" data-sc>' + SVG.camera + 'Capture</span>' +
  '<div class="cbd-capbar" data-k="cap-bar" data-sc><i class="on">' + SVG.camera + '</i><i>' + SVG.video + '</i><b></b><i>' + SVG.full + '</i><i class="on">' + SVG.part + '</i><i>' + SVG.window + '</i><b></b><i>' + SVG.gear + '</i><i style="font-size:22px">&times;</i></div>' +
  '<div class="cbd-toast" data-k="cap-toast" data-sc>' + MINI_DOC + '<div><b>Screenshot taken</b><small>Copied to clipboard</small></div></div>' +

  /* the highlight, the pointer, clicks and fingers */
  '<div class="cbd-spot cb-hide" data-k="spot"><span class="cbd-tag" data-k="spot-tag">Click here</span></div>' +
  '<span class="cbd-ripple" data-k="ripple"></span>' +
  '<svg class="cbd-pointer" data-k="pointer" viewBox="0 0 26 32"><path d="M3.5 2.5v22.4l6.1-5.7 4.3 9.5 4-1.8-4.3-9.4h8.6z" fill="#fff" stroke="#111" stroke-width="1.9" stroke-linejoin="round"/></svg>' +
  '<svg class="cbd-pointer cbd-cross cb-hide" data-k="cross" viewBox="0 0 30 30"><path d="M15 2v26M2 15h26" fill="none" stroke="#fff" stroke-width="5"/><path d="M15 2v26M2 15h26" fill="none" stroke="#111" stroke-width="2"/></svg>' +
  '<span class="cbd-touch cb-hide" data-k="touch1"></span><span class="cbd-touch cb-hide" data-k="touch2"></span>' +
  '</div>';

  var PAGES = {
    doc: ["Weekend weather - Google Docs", "docs.google.com/document/d/weekend-weather/edit", ""],
    form: ["Weather answers - Google Forms", "docs.google.com/forms/d/e/weather-answers/viewform", "form"],
    pub: ["Weekend weather", "docs.google.com/document/d/e/weekend-weather/pub", ""],
    mail: ["Inbox - Gmail", "mail.google.com/mail/u/0/#inbox?compose=new", "mail"]
  };
  var READ = "Saturday was 18 degrees Celsius. Sunday was 20 degrees Celsius.";

  /* ---------- one guide ---------- */
  function Guide(root){
    var id = root.getAttribute("data-guide"), guide = GUIDES[id];
    if (!guide) return;
    var steps = guide.steps, unit = guide.unit || "Step";
    var index = 0, timers = [], run = 0, camera = null, pointerAt = [930, 430], built = false;
    var stage, desk, tray;

    root.innerHTML =
      '<div class="cbg-card" role="group" aria-label="Step-by-step guide: ' + guide.title + '">' +
        '<div class="cbg-panel cbg-start">' +
          (guide.ready ? '<div class="cbg-ready"><h3>Before you start</h3><ul>' + guide.ready.map(function(line){ return '<li><span class="cbg-tick" aria-hidden="true"></span>' + line + '</li>'; }).join("") + '</ul></div>' : '') +
          '<div class="cbg-go"><button type="button" class="cbg-btn primary big" data-a="start">Start</button><span>' + steps.length + ' ' + unit.toLowerCase() + 's</span></div>' +
        '</div>' +
        '<div class="cbg-panel cbg-step cb-hide">' +
          '<div class="cbg-progress"><span class="cbg-ptext"></span><ol class="cbg-dots" aria-hidden="true"></ol></div>' +
          '<div class="cbg-inst" aria-live="polite"><span class="cbg-num" aria-hidden="true"></span>' +
            '<div><h3 class="cbg-title" tabindex="-1"></h3><p class="cbg-where"></p></div>' +
            '<p class="cbg-how"><span class="cbg-how-ic" aria-hidden="true"></span><span class="cbg-how-text"></span></p></div>' +
          '<div class="cbg-wrap"><div class="cbg-label"></div><div class="cbg-stage" aria-hidden="true"></div></div>' +
          '<div class="cbg-controls"><button type="button" class="cbg-btn" data-a="back">&larr; Back</button><button type="button" class="cbg-btn quiet" data-a="again">&#8635; Watch again</button><button type="button" class="cbg-btn primary" data-a="next">Next &rarr;</button></div>' +
        '</div>' +
        '<div class="cbg-panel cbg-end cb-hide">' +
          '<div class="cbg-end-ask"><h3 tabindex="-1">' + guide.ask + '</h3><p class="cbg-lede">' + (guide.askLede || "") + '</p>' +
            '<div class="cbg-choice"><button type="button" class="cbg-btn primary big" data-a="yes">Yes</button><button type="button" class="cbg-btn big" data-a="no">Not yet</button></div>' +
            '<button type="button" class="cbg-btn link" data-a="endback">&larr; Back to ' + unit.toLowerCase() + ' ' + steps.length + '</button></div>' +
          '<div class="cbg-end-yes cb-hide"><span class="cbg-done" aria-hidden="true"></span><h3 tabindex="-1">' + guide.yes + '</h3><button type="button" class="cbg-btn" data-a="over">Start over</button></div>' +
          '<div class="cbg-end-no cb-hide"><h3 tabindex="-1">Try these, then check again</h3><ul class="cbg-try">' + guide.no.map(function(line){ return '<li>' + line + '</li>'; }).join("") + '</ul>' +
            '<p class="cbg-lede">Still stuck? Ask your teacher.</p><button type="button" class="cbg-btn primary" data-a="retry">Go through the steps again</button></div>' +
        '</div>' +
      '</div>';

    var card = root.querySelector(".cbg-card");
    function part(sel){ return root.querySelector(sel); }
    var panels = { start: part(".cbg-start"), step: part(".cbg-step"), end: part(".cbg-end") };
    stage = part(".cbg-stage");

    /* the drawing's parts, by name */
    function q(k){ return desk.querySelector('[data-k~="' + k + '"]'); }
    function qa(k){ return Array.prototype.slice.call(desk.querySelectorAll('[data-k~="' + k + '"]')); }
    function hide(el, on){ el.classList.toggle("cb-hide", on); }

    var ui = {
      $: q, $$: qa,
      show: function(k, on){ qa(k).forEach(function(el){ hide(el, on === false); }); return ui; },
      text: function(k, v){ qa(k).forEach(function(el){ el.textContent = v; }); return ui; },
      cls: function(k, name, on){ qa(k).forEach(function(el){ el.classList.toggle(name, on !== false); }); return ui; },
      page: function(name){
        qa("pg-doc").concat(qa("pg-form"), qa("pg-pub"), qa("pg-mail")).forEach(function(el){ hide(el, el.getAttribute("data-k") !== "pg-" + name); });
        var p = PAGES[name];
        q("tab-name").textContent = p[0]; q("url").textContent = p[1]; q("tab-ic").className = "cbd-ic " + p[2];
        return ui;
      },
      doc: function(which){ hide(q("doc-assign"), which !== "assign"); hide(q("doc-line"), which !== "line"); return ui; },
      spanish: function(on){
        Array.prototype.forEach.call(desk.querySelectorAll("[data-es]"), function(el){
          if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.textContent);
          el.textContent = on ? el.getAttribute("data-es") : el.getAttribute("data-en");
        });
        return ui;
      },
      // Split view: where the bar between the two pages is (x in the drawing).
      splitAt: function(x){ q("pane-a").style.flex = "0 0 " + (x - 12) + "px"; return ui; },
      scale: function(k, f){ q(k).style.transform = f === 1 ? "" : "scale(" + f + ")"; return ui; },
      // Select-to-speak: the words are highlighted, then each one lights up as it is read.
      selectAll: function(){ return ui.cls("rw", "is-sel"); },
      read: function(){
        var words = qa("rw"), n = 0;
        ui.cls("rw", "is-sel", false).cls("rd", "is-reading");
        (function tick(){ words.forEach(function(w, i){ w.classList.toggle("is-lit", i === n % words.length); }); n += 1; later(480, tick); })();
        return ui;
      },
      quiet: function(){ return ui.cls("rw", "is-lit", false).cls("rd", "is-reading", false); },
      found: function(n){
        ui.show("find").text("find-q", "weather").cls("find-q", "is-typed").text("find-n", n + "/3").cls("mark", "is-hit").cls("mark", "is-cur", false);
        qa("mark")[n - 1].classList.add("is-cur");
        return ui;
      },
      about: function(state){
        var t = {
          idle: ["Your Chromebook is up to date", "Version 142", "Check for updates"],
          checking: ["Checking for updates...", "This can take a few minutes.", "Check for updates"],
          restart: ["Nearly up to date!", "Restart your Chromebook to finish updating.", "Restart"]
        }[state];
        ui.text("about-heading", t[0]).text("about-detail", t[1]).text("about-action", t[2]);
        ui.cls("about-icon", "is-spin", state === "checking").cls("about-icon", "is-up", state === "restart");
        return ui.cls("about-action", "is-dim", state === "checking").cls("about-action", "is-primary", state === "restart");
      },
      // The screenshot box drawn around a part of the screen, with Capture in its middle.
      capBox: function(k){
        var r = rectOf(k), m = 14, sel = q("cap-sel");
        sel.style.left = r.x - m + "px"; sel.style.top = r.y - m + "px"; sel.style.width = r.w + m * 2 + "px"; sel.style.height = r.h + m * 2 + "px";
        hide(sel, false); ui.show("cap-dim", false).show("cap-btn");
        var b = q("cap-btn"); b.style.left = r.x + r.w / 2 - b.offsetWidth / 2 + "px"; b.style.top = r.y + r.h / 2 - b.offsetHeight / 2 + "px";
        return ui;
      }
    };

    function build(){
      stage.innerHTML = DESK + '<div class="cbg-tray cb-hide"></div>';
      desk = stage.querySelector(".cbd"); tray = stage.querySelector(".cbg-tray");
      q("rd").innerHTML = READ.split(" ").map(function(w, i, all){ return '<span class="cbd-w" data-k="rw">' + w + (i < all.length - 1 ? " " : "") + '</span>'; }).join("");
      q("osk-rows").innerHTML = ["qwertyuiop", "asdfghjkl", "zxcvbnm"].map(function(row){ return '<div>' + row.split("").map(function(c){ return '<i>' + c + '</i>'; }).join("") + '</div>'; }).join("") +
        '<div><i class="wide">?123</i><i class="space"></i><i class="wide">enter</i></div>';
      new ResizeObserver(function(){ desk.style.transition = "none"; applyCamera(); void desk.offsetWidth; desk.style.transition = ""; }).observe(stage);
      built = true;
    }

    function reset(){
      Array.prototype.forEach.call(desk.querySelectorAll("[data-sc]"), function(el){ hide(el, true); });
      Array.prototype.forEach.call(desk.querySelectorAll("[data-on]"), function(el){ hide(el, false); });
      Array.prototype.forEach.call(desk.querySelectorAll("[data-d]"), function(el){ el.textContent = el.getAttribute("data-d"); });
      Array.prototype.forEach.call(desk.querySelectorAll('[class*="is-"]'), function(el){
        Array.prototype.slice.call(el.classList).forEach(function(c){ if (c.indexOf("is-") === 0 && !el.closest('[data-k="set-home"]')) el.classList.remove(c); });
      });
      ui.spanish(false).doc("assign").scale("pg-pub", 1);
      q("pane-a").style.flex = "";
      q("cap-sel").style.cssText = ""; q("cap-btn").style.cssText = "";
      qa("ink-svg")[0].querySelectorAll(".cbd-stroke").forEach(function(p){ var n = p.getTotalLength(); p.style.strokeDasharray = n; p.style.strokeDashoffset = n; });
      ["spot", "touch1", "touch2", "cross"].forEach(function(k){ hide(q(k), true); });
      hide(tray, true);
      q("touch1").className = "cbd-touch cb-hide";
      hide(q("pointer"), false); q("pointer").style.transition = "";
    }

    /* ---------- camera, pointer and the yellow box ---------- */
    // Where a part is inside the 1200 x 675 drawing, whatever the zoom.
    function rectOf(t){
      if (Array.isArray(t)) return { x: t[0], y: t[1], w: t[2], h: t[3] };
      var el = typeof t === "string" ? q(t) : t, d = desk.getBoundingClientRect(), r = el.getBoundingClientRect(), k = d.width / W || 1;
      return { x: (r.left - d.left) / k, y: (r.top - d.top) / k, w: r.width / k, h: r.height / k };
    }
    function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }
    function applyCamera(){
      var sw = stage.clientWidth, sh = stage.clientHeight, base = sw / W, z = 1, tx = 0, ty = 0;
      if (camera){
        z = camera.zoom;
        var a = camera.anchor || [0.5, 0.5];
        tx = clamp(sw * a[0] - camera.cx * base * z, sw - W * base * z, 0);
        ty = clamp(sh * a[1] - camera.cy * base * z, sh - H * base * z, 0);
      }
      desk.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + base * z + ")";
    }
    // On a phone-sized stage, zoom to the thing itself instead of its whole group.
    function zoomTo(focus, padding, maxZoom, anchor, near){
      if (!focus || focus === "out"){ camera = null; applyCamera(); return; }
      var small = stage.clientWidth < 520 && near, f = rectOf(small ? near : focus), p = small ? [110, 60] : (padding || [40, 40]);
      var z = Math.max(1, Math.min((maxZoom || 2) * (small ? 1.5 : 1), W / (f.w + p[0] * 2), H / (f.h + p[1] * 2)));
      camera = { cx: f.x + f.w / 2, cy: f.y + f.h / 2, zoom: z, anchor: small ? null : anchor };
      applyCamera();
    }
    function movePointer(x, y){
      pointerAt = [x, y];
      ["pointer", "cross", "touch1"].forEach(function(k){ q(k).style.transform = "translate(" + x + "px," + y + "px)"; });
    }
    function placeSpot(target, side, text){
      var spot = q("spot");
      if (!target){ hide(spot, true); return; }
      var r = rectOf(target), m = 5;
      spot.style.left = r.x - m + "px"; spot.style.top = r.y - m + "px"; spot.style.width = r.w + m * 2 + "px"; spot.style.height = r.h + m * 2 + "px";
      spot.className = "cbd-spot" + (side && side !== "above" ? " " + side : "");
      q("spot-tag").textContent = text;
    }

    function later(ms, fn){ var token = run; timers.push(setTimeout(function(){ if (token === run) fn(); }, ms)); }
    function stop(){ run += 1; timers.forEach(clearTimeout); timers = []; if (desk) q("ripple").className = "cbd-ripple"; }
    function ease(p){ return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
    // Run fn(progress from 0 to 1) on every frame for ms, then done().
    function animate(ms, fn, done){
      var token = run, start = performance.now();
      (function frame(now){
        if (token !== run) return;
        var p = Math.min(1, (now - start) / ms);
        fn(ease(p));
        if (p < 1) requestAnimationFrame(frame); else done();
      })(start);
    }
    function ring(x, y, kind){
      var r = q("ripple");
      r.style.left = x + "px"; r.style.top = y + "px";
      r.className = "cbd-ripple"; void r.offsetWidth; r.className = "cbd-ripple go " + (kind || "");
    }
    function tipOf(a){ var r = rectOf(a.target), t = a.tip || [0.5, 0.5]; return [r.x + r.w * t[0], r.y + r.h * t[1]]; }
    function showTray(html, top){ tray.innerHTML = html; hide(tray, false); tray.classList.toggle("top", Boolean(top)); }
    function tagFor(a){ return a.tagText || ({ tap: "Tap here", hold: "Hold here", drag: "Drag", select: "Start here" }[a.type]) || "Click here"; }

    /* ---------- what a step can play ---------- */
    var ACTIONS = {
      click: function(a, step, done, kind){
        var xy = tipOf(a);
        movePointer(xy[0], xy[1]);
        later(1000, function(){ q(a.target).classList.add("is-pressed"); ring(xy[0], xy[1], kind); });
        later(1500, done);
      },
      right: function(a, step, done){ ACTIONS.click(a, step, done, "alt"); },
      // Hold alt, then click: a right-click on a Chromebook.
      altclick: function(a, step, done){
        var xy = tipOf(a);
        showTray(keycap("alt") + "<i>+</i>" + keycap("click"), step.trayTop);
        var caps = tray.querySelectorAll(".cbg-kc");
        movePointer(xy[0], xy[1]);
        later(450, function(){ caps[0].classList.add("on"); });
        later(1150, function(){ caps[1].classList.add("on"); ring(xy[0], xy[1], "alt"); });
        later(1650, done);
        later(2000, function(){ caps[0].classList.remove("on"); caps[1].classList.remove("on"); });
      },
      keys: function(a, step, done){
        showTray(a.keys.map(keycap).join("<i>+</i>"), step.trayTop);
        var caps = Array.prototype.slice.call(tray.querySelectorAll(".cbg-kc"));
        caps.forEach(function(cap, i){ later(350 + i * 750, function(){ cap.classList.add("on"); }); });
        var pressed = 350 + (caps.length - 1) * 750;
        later(pressed + 450, done);
        later(pressed + 900, function(){ caps.forEach(function(cap){ cap.classList.remove("on"); }); });
      },
      type: function(a, step, done){
        var el = q(a.el); el.textContent = "";
        a.text.split("").forEach(function(_, i){ later(300 + i * 150, function(){ el.textContent = a.text.slice(0, i + 1); }); });
        later(300 + a.text.length * 150 + 300, done);
      },
      // The student talks (say); the words show up (text).
      talk: function(a, step, done){
        var el = q(a.el), words = a.text.split(" "), said = a.say || a.text;
        showTray('<span class="cbg-tray-mic">' + SVG.mic + '</span><span class="cbg-say">"' + said + '"</span>', step.trayTop);
        words.forEach(function(_, i){ later(500 + i * 450, function(){ el.textContent = words.slice(0, i + 1).join(" "); }); });
        later(500 + words.length * 450 + 300, done);
      },
      drag: function(a, step, done){
        var from = a.from, to = a.to, box = Boolean(a.box);
        if (box){
          var r = rectOf(a.box), m = 14;
          from = [r.x - m, r.y - m]; to = [r.x + r.w + m, r.y + r.h + m];
          hide(q("cross"), false); hide(q("pointer"), true);
        }
        movePointer(from[0], from[1]);
        later(1000, function(){
          ring(from[0], from[1]); hide(q("spot"), true);
          if (box){ ui.show("cap-dim", false); hide(q("cap-sel"), false); }
          ["pointer", "cross"].forEach(function(k){ q(k).style.transition = "none"; });
          animate(a.ms || 1800, function(p){
            var x = from[0] + (to[0] - from[0]) * p, y = from[1] + (to[1] - from[1]) * p;
            movePointer(x, y);
            if (box){ var s = q("cap-sel").style; s.left = from[0] + "px"; s.top = from[1] + "px"; s.width = x - from[0] + "px"; s.height = y - from[1] + "px"; }
            if (a.move) a.move(ui, p, x, y);
          }, function(){ ["pointer", "cross"].forEach(function(k){ q(k).style.transition = ""; }); later(500, done); });
        });
      },
      // Drag across a line of words to highlight them.
      select: function(a, step, done){
        var words = qa(a.words).map(function(w){ return { el: w, r: rectOf(w) }; });
        var first = words[0].r, last = words[words.length - 1].r, y = first.y + first.h * 0.75;
        var from = [first.x + 1, y], to = [last.x + last.w - 2, y];
        movePointer(from[0], from[1]);
        later(1000, function(){
          ring(from[0], from[1]); hide(q("spot"), true);
          q("pointer").style.transition = "none";
          animate(2000, function(p){
            var x = from[0] + (to[0] - from[0]) * p;
            movePointer(x, y);
            words.forEach(function(w){ w.el.classList.toggle("is-sel", x >= w.r.x + w.r.w * 0.45); });
          }, function(){ q("pointer").style.transition = ""; later(500, done); });
        });
      },
      tap: function(a, step, done){
        var xy = tipOf(a), t = q("touch1");
        movePointer(xy[0], xy[1]); t.className = "cbd-touch";
        later(250, function(){ ring(xy[0], xy[1]); if (a.press) q(a.target).classList.add("is-pressed"); });
        later(900, function(){ hide(t, true); done(); });
      },
      hold: function(a, step, done){
        var xy = tipOf(a), t = q("touch1");
        movePointer(xy[0], xy[1]); t.className = "cbd-touch holding";
        later(1500, function(){ t.className = "cbd-touch cb-hide"; ring(xy[0], xy[1]); done(); });
      },
      spread: function(a, step, done){
        var t1 = q("touch1"), t2 = q("touch2");
        [t1, t2].forEach(function(el){ el.className = "cbd-touch"; });
        function put(el, xy){ el.style.transform = "translate(" + xy[0] + "px," + xy[1] + "px)"; }
        put(t1, a.a[0]); put(t2, a.b[0]);
        later(700, function(){
          animate(1900, function(p){
            put(t1, [a.a[0][0] + (a.a[1][0] - a.a[0][0]) * p, a.a[0][1] + (a.a[1][1] - a.a[0][1]) * p]);
            put(t2, [a.b[0][0] + (a.b[1][0] - a.b[0][0]) * p, a.b[0][1] + (a.b[1][1] - a.b[0][1]) * p]);
            a.move(ui, p);
          }, function(){ later(600, function(){ hide(t1, true); hide(t2, true); done(); }); });
        });
      },
      // Handwriting: draw the strokes one after another, with a fingertip on the end of the line.
      write: function(a, step, done){
        var svg = q(a.el), paths = Array.prototype.slice.call(svg.querySelectorAll(".cbd-stroke"));
        var lengths = paths.map(function(p){ return p.getTotalLength(); }), total = lengths.reduce(function(s, n){ return s + n; }, 0);
        var box = rectOf(svg), view = svg.viewBox.baseVal, k = Math.min(box.w / view.width, box.h / view.height);
        var ox = box.x - view.x * k, oy = box.y + (box.h - view.height * k) / 2 - view.y * k, t = q("touch1");
        t.className = "cbd-touch small";
        animate(4000, function(p){
          var left = total * p;
          paths.forEach(function(path, i){
            var drawn = Math.max(0, Math.min(lengths[i], left));
            path.style.strokeDashoffset = lengths[i] - drawn;
            if (left > 0 && (left <= lengths[i] || i === paths.length - 1)){
              var pt = path.getPointAtLength(drawn);
              t.style.transform = "translate(" + (ox + pt.x * k) + "px," + (oy + pt.y * k) + "px)";
            }
            left -= lengths[i];
          });
        }, function(){ later(600, function(){ hide(t, true); done(); }); });
      }
    };

    // The whole screen first so they know where to look, then zoom in, play it, and hold on the result.
    function play(){
      stop(); reset();
      var step = steps[index], first = step.do[0];
      step.scene(ui);
      placeSpot(first.target, first.tag, tagFor(first));
      if (step.touch) hide(q("pointer"), true);
      camera = null; applyCamera();
      movePointer(pointerAt[0], pointerAt[1]);
      later(1100, function(){ zoomTo(step.focus, step.pad, step.maxZoom, step.anchor, first.target); });
      function act(n){
        var a = step.do[n];
        ACTIONS[a.type](a, step, function(){
          later(250, function(){
            if (a.after) a.after(ui);
            if (a.zoom) zoomTo(a.zoom, a.zoomPad, step.maxZoom || 2, null, a.ring);
            if (a.ring !== undefined) placeSpot(a.ring, a.ringSide, a.ringText || tagFor(step.do[n + 1] || a));
            if (step.do[n + 1]) later(1300, function(){ act(n + 1); });
          });
        });
      }
      later(2200, function(){ act(0); });
    }

    /* ---------- screens ---------- */
    // As large as the window allows, without pushing Next below the bottom of the window.
    function fit(){
      var wrap = part(".cbg-wrap");
      if (panels.step.classList.contains("cb-hide")) return;
      if (innerWidth < 820){ wrap.style.width = "100%"; return; }
      var bar = document.querySelector(".topbar"), top = bar ? bar.getBoundingClientRect().height : 64;
      var other = card.offsetHeight - stage.offsetHeight, room = innerHeight - top - 28 - other;
      wrap.style.width = Math.max(440, Math.min(card.clientWidth - 36, room * 16 / 9)) + "px";
    }
    function show(name){
      Object.keys(panels).forEach(function(p){ panels[p].classList.toggle("cb-hide", p !== name); });
      if (name !== "step") stop();
    }
    function bringIntoView(){
      var r = card.getBoundingClientRect(), bar = document.querySelector(".topbar"), top = bar ? bar.getBoundingClientRect().height : 64;
      if (r.top < top + 8 || r.bottom > innerHeight - 8) card.scrollIntoView({ block: r.height > innerHeight - top ? "start" : "nearest", behavior: "smooth" });
    }

    function goTo(i){
      index = i;
      var step = steps[i];
      if (!built) build();
      show("step");
      part(".cbg-ptext").textContent = unit + " " + (i + 1) + " of " + steps.length;
      part(".cbg-num").textContent = i + 1;
      part(".cbg-title").innerHTML = step.title;
      part(".cbg-where").textContent = step.where;
      part(".cbg-how-ic").innerHTML = HOW[step.how.kind];
      part(".cbg-how-text").textContent = step.how.text;
      part(".cbg-dots").innerHTML = steps.map(function(_, n){ return '<li class="' + (n < i ? "done" : n === i ? "now" : "") + '"></li>'; }).join("");
      part('[data-a="next"]').innerHTML = i === steps.length - 1 ? "Done &rarr;" : "Next &rarr;";
      part(".cbg-label").textContent = step.label;
      fit();
      part(".cbg-title").focus({ preventScroll: true });
      bringIntoView();
      play();
    }
    function end(which){
      show("end");
      ["ask", "yes", "no"].forEach(function(p){ part(".cbg-end-" + p).classList.toggle("cb-hide", p !== which); });
      part(".cbg-end-" + which + " h3").focus({ preventScroll: true });
      bringIntoView();
    }
    function begin(){ pointerAt = [930, 430]; goTo(0); }

    root.addEventListener("click", function(e){
      var b = e.target.closest("[data-a]");
      if (!b) return;
      ({
        start: begin, retry: begin,
        back: function(){ if (index === 0) show("start"); else goTo(index - 1); },
        next: function(){ if (index === steps.length - 1) end("ask"); else goTo(index + 1); },
        again: play,
        yes: function(){ end("yes"); }, no: function(){ end("no"); },
        endback: function(){ goTo(steps.length - 1); },
        over: function(){ show("start"); root.querySelector('[data-a="start"]').focus(); }
      })[b.getAttribute("data-a")]();
    });
    root.addEventListener("keydown", function(e){
      if (panels.step.classList.contains("cb-hide") || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight"){ e.preventDefault(); part('[data-a="next"]').click(); }
      if (e.key === "ArrowLeft"){ e.preventDefault(); part('[data-a="back"]').click(); }
    });
    addEventListener("resize", fit);
  }

  function start(){ Array.prototype.forEach.call(document.querySelectorAll(".cbg[data-guide]"), function(el){ new Guide(el); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
