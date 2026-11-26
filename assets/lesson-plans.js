/* ============================================================
   Lesson Plans (lesson-plans.html), Donny 2026-11-25.

   His day-by-day lesson plans, moved here from his LESSON PLANS Google Doc, for the teacher only. Layout 5 of the
   mockups he picked ("Shelf + day list", update 1): a link shelf on the left (Quick links, the holding tray, and every
   link of each topic, to drag onto a day as a copy) and the school days down the right.

   - Lessons are kept in order by school day (lesson 1 = school day 1). Each school year is a first day of school, a
     last day, a list of days off and a list of date notes, so every lesson lands on its own date and steps around the
     holidays. Adding a day off moves every lesson after it one school day later. The + year button adds the next year
     from the usual pattern (makeYear), flagged "best guess" until he says the dates are right.
   - Date notes (Student of the Month, Progress Reports, End of Quarter) belong to a date and stay put when lessons
     move. Links and notes inside a day belong to the lesson and move with it.
   - Editing on: drag a link to move it (hold Ctrl to copy), click to pick, Ctrl+C / Ctrl+V (also links copied from a
     Google Doc, which keep their names), Delete, double-click to rename, x to remove, Undo (Ctrl+Z).
   - The plan is saved on the site (KV, /api/lesson-plans, teacher only) through the Class Pass bridge
     (PS8Pass.ask lessonPlans / saveLessonPlans / lessonPlansEarlier), a moment after each change. It is never in a
     file anyone can read: the first copy comes from a file he picks (Import), and Backup downloads one.
   ============================================================ */
(function(){
  "use strict";
  if(!document.getElementById("lp")) return;

  var SWATCHES = ["#e03131","#e8590c","#f59f00","#5c940d","#2f9e44","#0c8599","#1971c2","#4263eb","#7048e8","#9c36b5","#c2255c","#868e96"];
  // highlights (Donny 2026-11-25): any link can have one (item.h = a color, or "none"); tests get the test color unless he picks another
  var HL = ["#ffd43b","#ff922b","#ff6b6b","#f06595","#cc5de8","#845ef7","#4dabf7","#38d9a9","#69db7c","#adb5bd"];
  var TEST_COLOR = "#ff922b";
  var HL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4l5 5-8 8H7v-5z"/><path d="M7 12l5 5"/><path d="M4 21h9"/></svg>';
  var isColor = function(v){ return /^#[0-9a-f]{6}$/i.test(String(v || "")); };
  var KINDS = [
    {re:/docs\.google\.com\/document/, name:"Doc", bg:"#4285f4", g:"D"},
    {re:/docs\.google\.com\/spreadsheets/, name:"Sheet", bg:"#0f9d58", g:"S"},
    {re:/docs\.google\.com\/presentation/, name:"Slides", bg:"#e8a200", g:"P"},
    {re:/docs\.google\.com\/drawings/, name:"Drawing", bg:"#db4437", g:"Dr"},
    {re:/docs\.google\.com\/forms|forms\.gle/, name:"Form", bg:"#7248b9", g:"F"},
    {re:/script\.google\.com/, name:"Web app", bg:"#5f6368", g:"App"},
    {re:/drive\.google\.com/, name:"Drive file", bg:"#6b7280", g:"▶"},
    {re:/edpuzzle\.com/, name:"Edpuzzle", e:"\u{1F9E9}"},
    {re:/peardeck\.com|edulastic\.com/, name:"Pear", e:"\u{1F350}"},
    {re:/gimkit\.com/, name:"Gimkit", e:"\u{1F48E}"},
    {re:/blooket\.com/, name:"Blooket", e:"\u{1F4D8}"},
    {re:/kahoot\./, name:"Kahoot", e:"\u{1F989}"},
    {re:/quizlet\.com/, name:"Quizlet", bg:"#4255ff", g:"Q"},
    {re:/wayground\.com|quizizz\.com/, name:"Wayground", bg:"#8854c0", g:"W"},
    {re:/ixl\.com/, name:"IXL", bg:"#00883a", g:"IXL"},
    {re:/youtube\.com|youtu\.be/, name:"YouTube", bg:"#e62117", g:"▶"},
    {re:/phet\.colorado/, name:"PhET", bg:"#2a6ebb", g:"Ph"},
    {re:/sites\.google\.com/, name:"Google Site", bg:"#3367d6", g:"Si"},
    {re:/classroom\.google\.com/, name:"Classroom", bg:"#1e8e3e", g:"C"},
    {re:/physical-science-8\.pages\.dev/, name:"Class site", bg:"#081C2B", g:"8"}
  ];
  var TEST = {name:"Test", e:"\u{1F4DD}"}, NOTE = {name:"Note", e:"✎"}, LINK = {name:"Web page", bg:"#3A4650", g:"↗"};
  var DOW = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
  var nid = function(){ return "i" + Math.random().toString(36).slice(2, 10); };
  var safeUrl = function(u){ return /^https?:\/\/[^\s"'<>]+$/i.test(String(u || "")) ? String(u) : ""; };
  var store = { get: function(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set: function(k, v){ try { localStorage.setItem(k, v); } catch(e){ /* this device only */ } } };

  /* ---------------- dates ---------------- */
  var pad = function(n){ return String(n).padStart(2, "0"); };
  var D = function(s){ return new Date(s + "T00:00:00Z"); };
  var isoOf = function(d){ return d.toISOString().slice(0, 10); };
  var addDays = function(s, n){ return isoOf(new Date(D(s).getTime() + n * 864e5)); };
  var dow = function(s){ return D(s).getUTCDay(); };
  var monday = function(s){ return addDays(s, 1 - dow(s)); };
  var fmt = function(s, o){ return D(s).toLocaleDateString("en-US", Object.assign({timeZone:"UTC"}, o)); };
  var fShort = function(s){ return fmt(s, {weekday:"short", month:"short", day:"numeric"}); };
  var fMD = function(s){ return fmt(s, {month:"short", day:"numeric"}); };
  var fLong = function(s){ return fmt(s, {weekday:"long", month:"long", day:"numeric", year:"numeric"}); };
  var TODAY = (function(){ var n = new Date(); return n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate()); })();
  function nth(y, m, wd, n){ /* the nth weekday wd (0 Sun..6 Sat) of month m (1-12); n = -1 is the last one */
    var d;
    if(n < 0){ d = new Date(Date.UTC(y, m, 0)); while(d.getUTCDay() !== wd) d.setUTCDate(d.getUTCDate() - 1); return isoOf(d); }
    d = new Date(Date.UTC(y, m - 1, 1)); while(d.getUTCDay() !== wd) d.setUTCDate(d.getUTCDate() + 1); d.setUTCDate(d.getUTCDate() + 7 * (n - 1)); return isoOf(d);
  }
  var yearKey = function(y0){ return y0 + "-" + String(y0 + 1).slice(2); };
  var weekdaysIn = function(a, b){ var n = 0; for(var x = a; x <= b; x = addDays(x, 1)){ var w = dow(x); if(w && w < 6) n++; } return n; };
  var rangeText = function(a, b){ return a === b ? fShort(a) : fMD(a) + " to " + fMD(b); };

  // A new school year from the usual pattern (his doc's days off). Keep it like makeYear() in the import script.
  function makeYear(y0){
    var y1 = y0 + 1, off = [], notes = [];
    var o = function(a, b, t){ off.push({id:nid(), a:a, b:b || a, t:t}); }, note = function(d, t){ notes.push({id:nid(), d:d, t:t}); };
    o(nth(y0, 9, 1, 1), 0, "Labor Day");
    o(nth(y0, 10, 1, 1), 0, "Fall Break: Non-Student/Teacher Day");
    var v = y0 + "-11-11", vw = dow(v); o(vw === 6 ? addDays(v, -1) : vw === 0 ? addDays(v, 1) : v, 0, "Veterans Day");
    var th = nth(y0, 11, 4, 4); o(addDays(th, -3), addDays(th, 1), "Thanksgiving Break");
    var d22 = y0 + "-12-22", w22 = dow(d22), ws = w22 === 0 ? addDays(d22, 1) : w22 === 6 ? addDays(d22, 2) : monday(d22);
    o(addDays(ws, -3), 0, "Student Free Day");
    o(ws, addDays(ws, 18), "Winter Break");
    o(nth(y1, 1, 1, 3), 0, "Martin Luther King Jr. Day");
    var pd = nth(y1, 2, 1, 3); o(addDays(pd, -3), pd, "Presidents' Day Holiday");
    var sb = nth(y1, 4, 1, 2); o(sb, addDays(sb, 4), "Spring Break");
    o(nth(y1, 5, 1, -1), 0, "Memorial Day");
    var isOff = function(d){ return off.some(function(r){ return r.a <= d && d <= r.b; }); };
    [[y0,9],[y0,10],[y0,11],[y0,12],[y1,1],[y1,2],[y1,3],[y1,4],[y1,5]].forEach(function(p){ var f = nth(p[0], p[1], 5, 1); while(isOff(f)) f = addDays(f, 7); note(f, "Student of the Month"); });
    note(nth(y0, 9, 5, 2), "Progress Reports");
    note(nth(y0, 10, 5, 3), "End of 1st Quarter");
    note(nth(y0, 11, 5, 2), "Progress Reports");
    note(addDays(ws, -4), "End of 2nd Quarter");
    note(addDays(sb, -17), "End of 3rd Quarter");
    var y = {first:nth(y0, 8, 1, 2), last:"", off:off, notes:notes, est:true}; /* school starts the 2nd Monday of August */
    y.last = schoolDayDate(y, 180);
    return y;
  }
  function offMap(C){ var m = {}; C.off.forEach(function(r){ for(var x = r.a; x <= r.b; x = addDays(x, 1)) m[x] = r; }); return m; }
  function schoolDayDate(C, k){ var off = offMap(C), x = C.first, n = 0; for(var g = 0; g < 1200; g++, x = addDays(x, 1)){ var w = dow(x); if(w && w < 6 && !off[x] && ++n === k) return x; } return ""; }

  /* ---------------- state ---------------- */
  var S = null, base = 0, year = null, editing = store.get("lp-editing") !== "off";
  var undo = [], sel = new Set(), selShelf = false, active = null, clip = null, drag = null;
  var ui = {shelfQ:"", open:{quick:true, tray:true}, scrollInit:true, shelfClosed:store.get("lp-shelf") === "closed"};
  var loaded = false, loading = false;
  var years = function(){ return Object.keys(S.cal).sort(); };
  function pickYear(){ /* the year today falls in, else the newest one that has started, else the first */
    var ys = years(), now = ys.filter(function(y){ var C = S.cal[y]; return C.first <= TODAY && (!C.last || TODAY <= addDays(C.last, 60)); });
    if(now.length) return now[now.length - 1];
    var started = ys.filter(function(y){ return S.cal[y].first <= TODAY; });
    return started.length ? started[started.length - 1] : ys[0];
  }
  // Only the parts the page uses, each checked like the site does when it saves (a backup file could have anything in it).
  function fixPlan(p){
    p = p && typeof p === "object" ? p : {};
    var okId = function(v){ return /^[A-Za-z0-9]{1,24}$/.test(String(v || "")) ? String(v) : nid(); };
    var okDate = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : ""; };
    var str = function(v, max){ return typeof v === "string" ? v.slice(0, max) : ""; };
    var objs = function(a){ return (Array.isArray(a) ? a : []).filter(function(x){ return x && typeof x === "object"; }); };
    var items = function(a){ return objs(a).map(function(x){ var it = {id:okId(x.id), t:str(x.t, 500), u:safeUrl(x.u)}; if(x.h === "none" || isColor(x.h)) it.h = x.h; return it; }).filter(function(x){ return x.t || x.u; }); };
    var ps = p.settings && typeof p.settings === "object" ? p.settings : {};
    var q = {v:1, settings:{testColor:ps.testColor === "none" || isColor(ps.testColor) ? ps.testColor : TEST_COLOR}, quick:items(p.quick), tray:items(p.tray), cal:{}};
    q.topics = objs(p.topics).map(function(t){ return {id:okId(t.id), emoji:str(t.emoji, 16), name:str(t.name, 120) || "Topic", color:/^#[0-9a-f]{6}$/i.test(t.color) ? t.color : "#868e96"}; });
    q.lessons = objs(p.lessons).map(function(l){ return {id:okId(l.id), topic:/^[A-Za-z0-9]{1,24}$/.test(String(l.topic || "")) ? String(l.topic) : "", items:items(l.items)}; });
    Object.keys(p.cal && typeof p.cal === "object" ? p.cal : {}).forEach(function(k){
      var C = p.cal[k]; if(!/^\d{4}-\d{2}$/.test(k) || !C || !okDate(C.first)) return;
      var y = {first:okDate(C.first), last:okDate(C.last), est:Boolean(C.est)};
      y.off = objs(C.off).filter(function(o){ return okDate(o.a); }).map(function(o){ var a = okDate(o.a), b = okDate(o.b); return {id:okId(o.id), a:a, b:b && b >= a ? b : a, t:str(o.t, 120) || "No School"}; });
      y.notes = objs(C.notes).filter(function(n){ return okDate(n.d) && str(n.t, 120); }).map(function(n){ return {id:okId(n.id), d:okDate(n.d), t:str(n.t, 120)}; });
      if(!y.last) y.last = schoolDayDate(y, 180);
      q.cal[k] = y;
    });
    if(!Object.keys(q.cal).length){ var y0 = new Date().getFullYear() - (new Date().getMonth() < 6 ? 1 : 0); q.cal[yearKey(y0)] = makeYear(y0); }
    return q;
  }

  /* ---------------- calendar ---------------- */
  var CAL;
  function calFor(y){
    var C = S.cal[y], off = offMap(C), notes = {};
    C.notes.forEach(function(nt){ (notes[nt.d] = notes[nt.d] || []).push(nt); });
    var school = [], x = C.first, need = S.lessons.length + 5, guard = 0;
    while((school.length < need || x <= C.last) && guard++ < 3000){ var w = dow(x); if(w > 0 && w < 6 && !off[x]) school.push(x); x = addDays(x, 1); }
    var dayNum = {}; school.forEach(function(d, i){ dayNum[d] = i + 1; });
    return {C:C, off:off, notes:notes, school:school, dayNum:dayNum, lessonDate:S.lessons.map(function(_, i){ return school[i]; })};
  }
  function info(d){
    var n = CAL.dayNum[d] || null, li = n ? n - 1 : null;
    return {d:d, w:dow(d), off:CAL.off[d] ? CAL.off[d].t : null, n:n, li:(li != null && li < S.lessons.length) ? li : null,
      notes:CAL.notes[d] || [], today:d === TODAY, late:Boolean(CAL.C.last && d > CAL.C.last), first:d === CAL.C.first, last:d === CAL.C.last};
  }
  function buildCal(){
    CAL = calFor(year);
    var L = CAL.lessonDate, end = CAL.C.last || CAL.C.first;
    if(L.length && L[L.length - 1] > end) end = L[L.length - 1];
    var start = monday(CAL.C.first); end = addDays(monday(end), 4);
    CAL.days = [];
    for(var d = start; d <= end; d = addDays(d, 1)){ var w = dow(d); if(w && w < 6) CAL.days.push(info(d)); }
    CAL.weeks = [];
    CAL.days.forEach(function(x){ var m = monday(x.d), wk = CAL.weeks[CAL.weeks.length - 1]; if(!wk || wk.mon !== m){ wk = {mon:m, days:[]}; CAL.weeks.push(wk); } wk.days.push(x); });
  }
  var offRangeOf = function(d){ return S.cal[year].off.filter(function(o){ return o.a <= d && d <= o.b; })[0]; };

  /* ---------------- helpers ---------------- */
  function topicOf(id){ return S.topics.filter(function(t){ return t.id === id; })[0] || {id:"", emoji:"", name:"No topic", color:"#868e96"}; }
  function onColor(hex){
    var h = String(hex || "#868e96").replace("#", "");
    var c = [0, 2, 4].map(function(i){ var v = parseInt(h.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    var L = .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
    return 1.05 / (L + .05) >= 3.6 ? "#ffffff" : "#111111";
  }
  var tv = function(id){ var t = topicOf(id); return "--tc:" + t.color + ";--on:" + onColor(t.color); };
  var tpill = function(id){ var t = topicOf(id); return '<em class="tpill" style="' + tv(id) + '">' + esc(t.emoji) + " " + esc(t.name) + "</em>"; };
  function kindOf(it){
    var u = it.u || "";
    if(!u) return NOTE;
    if(/peardeck|edulastic/.test(u) && /\btest\b/i.test(it.t || "")) return TEST;
    for(var i = 0; i < KINDS.length; i++) if(KINDS[i].re.test(u)) return KINDS[i];
    return LINK;
  }
  var badge = function(k){ return k.e ? '<i class="b e" aria-hidden="true">' + k.e + "</i>" : '<i class="b" style="background:' + k.bg + '" aria-hidden="true">' + esc(k.g) + "</i>"; };
  function getList(c){ if(c === "tray") return S.tray; if(c === "quick") return S.quick; if(c && c[0] === "L"){ var l = S.lessons[+c.slice(1)]; return l ? l.items : null; } return null; }
  function findItem(id){
    var conts = ["tray", "quick"].concat(S.lessons.map(function(_, i){ return "L" + i; }));
    for(var k = 0; k < conts.length; k++){ var l = getList(conts[k]); for(var i = 0; i < l.length; i++) if(l[i].id === id) return {c:conts[k], list:l, i:i, it:l[i]}; }
    return null;
  }
  var findNote = function(id){ return S.cal[year].notes.filter(function(n){ return n.id === id; })[0]; };
  var plural = function(n, w){ return n + " " + w + (n === 1 ? "" : "s"); };
  var dayLabel = function(li){ return CAL.lessonDate[li] ? fShort(CAL.lessonDate[li]) : "lesson " + (li + 1); };
  var contName = function(c){ return c[0] === "L" ? dayLabel(+c.slice(1)) : c === "quick" ? "Quick links" : "the holding tray"; };

  function hlOf(it, k){ /* the highlight a link shows: his pick, else the test color for a test */
    if(it.h === "none") return "";
    if(isColor(it.h)) return it.h;
    var tc = S.settings && S.settings.testColor;
    return k === TEST && isColor(tc) ? tc : "";
  }
  function itemHTML(it, o){
    o = o || {};
    var k = kindOf(it), name = it.t || k.name, url = safeUrl(it.u), hl = hlOf(it, k);
    var cls = "it" + (url ? "" : " note") + (k === TEST ? " test" : "") + (hl ? " hl" : "") + (sel.has(it.id) ? " sel" : "");
    var st = hl ? ' style="--hl:' + hl + '"' : "";
    var inner = badge(k) + '<span class="tt">' + esc(name) + '</span><small class="kn">' + esc(k.name) + "</small>";
    if(!editing){
      return url ? '<a class="' + cls + '"' + st + ' data-id="' + it.id + '" href="' + esc(url) + '" target="_blank" rel="noopener" title="' + esc(name) + '">' + inner + "</a>"
        : '<span class="' + cls + '"' + st + ' data-id="' + it.id + '" title="' + esc(name) + '">' + inner + "</span>";
    }
    var acts = (url ? '<a class="go" href="' + esc(url) + '" target="_blank" rel="noopener" title="Open link" aria-label="Open link" draggable="false">↗</a>' : "") +
      (o.copy ? "" : '<button class="hlb" data-lpa="hl" data-id="' + it.id + '" title="Highlight" aria-label="Highlight ' + esc(name) + '">' + HL_ICON + "</button>" +
        '<button class="rm" data-lpa="rm" data-id="' + it.id + '" title="Remove" aria-label="Remove ' + esc(name) + '">×</button>');
    // open, highlight and remove float over the right end on hover (.acts), so pointing at a link never moves anything
    return '<div class="' + cls + '"' + st + ' data-id="' + it.id + '" draggable="true" tabindex="0" title="' + esc(name) + '">' + inner + (acts ? '<span class="acts">' + acts + "</span>" : "") + "</div>";
  }
  function itemsHTML(c, cls, o){
    o = o || {};
    var list = getList(c) || [], h = list.map(function(x){ return itemHTML(x); }).join("");
    if(!list.length && (o.emptyText || !editing)) h += '<span class="empty">' + esc(o.emptyText || "Nothing planned yet") + "</span>";
    if(editing && !o.noAdd) h += '<button class="add" data-lpa="add" data-c="' + c + '">+ Add</button>';
    return '<div class="items ' + cls + (active === c ? " active" : "") + '" data-drop="' + c + '">' + h + "</div>";
  }
  var noteHTML = function(n){
    return '<i class="flag" data-note="' + n.id + '"' + (editing ? ' draggable="true" tabindex="0"' : "") + ' title="Date note: it stays on this date when lessons move.' +
      (editing ? " Drag it to another date. Double-click to rename." : "") + '">' + esc(n.t) +
      (editing ? '<button class="x" data-lpa="rmnote" data-id="' + n.id + '" aria-label="Remove ' + esc(n.t) + '">×</button>' : "") + "</i>";
  };
  var flags = function(d){
    return (d.today ? '<i class="today">Today</i>' : "") + (d.first ? '<i class="flag fixed">First day of school</i>' : "") +
      (d.last ? '<i class="flag fixed">Last day of school</i>' : "") + d.notes.map(noteHTML).join("");
  };
  function topicPicker(li){
    var L = S.lessons[li];
    return '<div class="tpick" role="group" aria-label="Topic">' + S.topics.map(function(t){
      return '<button style="' + tv(t.id) + '" class="' + (t.id === L.topic ? "on" : "") + '" data-lpa="settopic" data-li="' + li + '" data-t="' + t.id + '"><i></i>' + esc(t.name) + "</button>";
    }).join("") + "</div>";
  }

  /* ---------------- the planner: shelf + day list ---------------- */
  function uniqueLinks(tid){
    var seen = new Set(), out = [];
    S.lessons.forEach(function(l){ if(l.topic !== tid) return; l.items.forEach(function(it){ if(!safeUrl(it.u) || seen.has(it.u)) return; seen.add(it.u); out.push(it); }); });
    return out;
  }
  function planner(){
    var det = function(k, label, body, count, dot){
      var open = ui.open[k] || ui.shelfQ;
      return '<details data-k="' + k + '"' + (open ? " open" : "") + "><summary>" + (dot || "") + label + "<small>" + count + "</small></summary>" + (open ? body() : "") + "</details>";
    };
    var shelf = ui.shelfClosed
      ? '<aside class="shelf rail" aria-label="Link shelf, folded"><button class="railbtn" data-lpa="shelf" data-flip title="Open the link shelf" aria-label="Open the link shelf">»</button><span class="railtxt" data-lpa="shelf">Link shelf</span></aside>'
      : '<aside class="shelf" data-keep="shelf" aria-label="Link shelf"><div class="shead"><h2>Link shelf</h2><button class="lp-btn sm" data-lpa="shelf" title="Fold the shelf away">« Hide</button></div>' +
        '<input type="search" id="lpShelfQ" placeholder="Find a link" value="' + esc(ui.shelfQ) + '" aria-label="Find a link"><p class="lp-hint">Drag any link onto a day. Links in the topic groups are copied, so they stay on the shelf.</p>' +
        det("quick", "Quick links", function(){ return (editing ? '<button class="add wide" data-lpa="add" data-c="quick">+ Add a quick link</button>' : "") + itemsHTML("quick", "stack slim", {noAdd:true, emptyText:"No quick links yet."}); }, S.quick.length) +
        det("tray", "Holding tray", function(){ return itemsHTML("tray", "stack slim", {noAdd:true, emptyText:"Drag links here to keep them handy."}); }, S.tray.length) +
        S.topics.map(function(t){
          var ls = uniqueLinks(t.id);
          return ls.length ? det(t.id, esc(t.emoji) + " " + esc(t.name), function(){ return '<div class="items stack slim" data-shelf-copy>' + ls.map(function(x){ return itemHTML(x, {copy:true}); }).join("") + "</div>"; }, ls.length, '<i class="dot" style="' + tv(t.id) + '"></i>') : "";
        }).join("") + "</aside>";
    var dots = function(act, key, val, label){ return editing ? '<button class="dots" data-lpa="' + act + '" data-' + key + '="' + val + '" title="' + label + '" aria-label="' + label + '">⋯</button>' : ""; };
    // the month buttons, and a heading for each week
    var months = [], target = targetWeek();
    CAL.weeks.forEach(function(w){ var k = addDays(w.mon, 3).slice(0, 7); if(!months.length || months[months.length - 1] !== k) months.push(k); });
    var ag = '<div class="agenda" data-keep="agenda"><nav class="mbar" aria-label="Months">' +
      '<button class="lp-btn sm" data-lpa="today" title="Go to this week">Today</button>' +
      months.map(function(k){ return '<button data-lpa="jump" data-to="lpm-' + k + '">' + fmt(k + "-01", {month:"short"}) + "</button>"; }).join("") + "</nav>";
    var seenMonth = {}, lateShown = false;
    CAL.weeks.forEach(function(w){
      var k = addDays(w.mon, 3).slice(0, 7), anchor = seenMonth[k] ? "" : ' id="lpm-' + k + '"'; seenMonth[k] = 1;
      var ts = []; w.days.forEach(function(d){ if(d.li != null && ts.indexOf(S.lessons[d.li].topic) < 0) ts.push(S.lessons[d.li].topic); });
      ag += '<h3 class="week"' + anchor + ' data-week="' + w.mon + '"' + (w.mon === target ? " data-target" : "") + ">Week of " + fMD(w.mon) + " " + ts.map(tpill).join("") + "</h3>";
      w.days.forEach(function(d){
        // right above the first lesson that falls after the last day of school
        if(!lateShown && d.late && d.li != null){ lateShown = true; ag += '<h3 class="lateh">After the last day of school (' + fShort(CAL.C.last) + "). These lessons don't fit in " + esc(year) + ".</h3>"; }
        if(d.off){ ag += '<div class="offrow" data-date="' + d.d + '"><b>' + fShort(d.d) + "</b> \u{1F5D3}️ No School: " + esc(d.off) + " " + flags(d) + dots("offmenu", "d", d.d, "Day off options") + "</div>"; return; }
        if(d.li == null){ ag += '<div class="offrow" data-date="' + d.d + '"><b>' + fShort(d.d) + "</b> " + (d.late ? "After the last day of school" : "No lesson planned") + " " + flags(d) + "</div>"; return; }
        var L = S.lessons[d.li];
        ag += '<article class="day' + (d.late ? " late" : "") + '" style="' + tv(L.topic) + '" data-daybox="' + d.li + '" data-date="' + d.d + '"><div class="date"><span>' + DOW[d.w] + "</span><b>" + (+d.d.slice(8)) + "</b><span>" + fmt(d.d, {month:"short"}).toUpperCase() + "</span></div>" +
          '<div class="body"><div class="top">' + tpill(L.topic) + "<small>School day " + d.n + "</small>" + flags(d) + dots("daymenu", "li", d.li, "Day options") + "</div>" + itemsHTML("L" + d.li, "list") + "</div></article>";
      });
    });
    if(!S.lessons.length) ag += '<p class="lp-hint">No lessons yet. Use + Add a lesson day in a day\'s menu, or Backup &gt; Restore from a backup file.</p>';
    return '<div class="planner' + (ui.shelfClosed ? " closed" : "") + '">' + shelf + ag + "</div></div>";
  }
  function targetWeek(){
    var t = TODAY, w = dow(t);
    if(w === 0) t = addDays(t, 1); else if(w === 6) t = addDays(t, 2);
    var m = monday(t);
    if(CAL.weeks.some(function(x){ return x.mon === m; })) return m;
    return t < CAL.weeks[0].mon ? CAL.weeks[0].mon : CAL.weeks[CAL.weeks.length - 1].mon;
  }
  function filterShelf(){
    var q = ui.shelfQ.trim().toLowerCase();
    $$(".shelf .it").forEach(function(el){ el.hidden = Boolean(q) && el.textContent.toLowerCase().indexOf(q) < 0; });
  }
  function scrollToWeek(mon, smooth){
    var ag = $(".agenda"), t = ag && (mon ? $('[data-week="' + mon + '"]', ag) : $("[data-target]", ag));
    if(!t) return;
    var sc = ag.scrollHeight > ag.clientHeight + 2 ? ag : window;
    var bar = $(".mbar", ag), off = bar ? bar.offsetHeight + 6 : 8;
    if(sc === window){ t.scrollIntoView({block:"start", behavior:smooth ? "smooth" : "auto"}); return; }
    ag.scrollTo({top:ag.scrollTop + t.getBoundingClientRect().top - ag.getBoundingClientRect().top - off, behavior:smooth ? "smooth" : "auto"});
  }

  /* ---------------- the frame around it ---------------- */
  function hintText(){
    if(!editing) return "Editing is off: links open when you click them.";
    if(sel.size) return plural(sel.size, "link") + " picked. Ctrl+C copies, Delete removes, or drag to move. Double-click to rename.";
    if(active) return "Day picked. Ctrl+V pastes here, or use + Add.";
    return "Drag a link to move it. Hold Ctrl when you drop to copy. Point at a link to open ↗, highlight or remove × it.";
  }
  function renderToolbar(){
    var ys = years(), next = yearKey(+ys[ys.length - 1].slice(0, 4) + 1);
    $("#lpTb").innerHTML = '<div class="seg" role="group" aria-label="School year"><span class="lp-lbl">School year</span>' +
      ys.map(function(y){ return '<button data-lpa="year" data-y="' + y + '" aria-pressed="' + (y === year) + '">' + y + "</button>"; }).join("") +
      '<button class="addy" data-lpa="addyear" title="Add the ' + next + ' school year">+ ' + next + "</button></div>" +
      '<button class="lp-btn" data-lpa="calendar">School calendar</button>' +
      '<label class="sw"><input type="checkbox" id="lpEditSw"' + (editing ? " checked" : "") + "><span>Editing</span></label>" +
      '<button class="lp-btn" data-lpa="topics" title="Topic colors and the test highlight">Colors</button>' +
      '<button class="lp-btn" data-lpa="undo"' + (undo.length ? "" : " disabled") + ">Undo</button>" +
      '<button class="lp-btn" data-lpa="backup">Backup</button>' +
      '<span class="save" id="lpSave"></span>' +
      '<span class="hint" id="lpHint">' + hintText() + "</span>";
    drawSave();
  }
  function renderBanner(){
    var C = S.cal[year], b = $("#lpBanner");
    b.hidden = !C.est;
    if(C.est) b.innerHTML = "<span><b>Check the " + esc(year) + " dates once.</b> The first day of school (" + fShort(C.first) + "), the last day (" + (C.last ? fShort(C.last) : "not set") +
      ") and the days off are a best guess from the usual pattern. Fix anything the district calendar says differently.</span>" +
      '<button class="lp-btn" data-lpa="calendar">Open School calendar</button><button class="lp-btn" data-lpa="datesok">The dates are right</button>';
  }
  function render(){
    if(!S) return;
    if(!S.cal[year]) year = pickYear();
    buildCal();
    var cv = $("#lpCanvas"), keep = {};
    $$("[data-keep]", cv).forEach(function(el){ keep[el.dataset.keep] = el.scrollTop; });
    cv.innerHTML = planner();
    if(ui.scrollInit){ ui.scrollInit = false; scrollToWeek(null); }
    else $$("[data-keep]", cv).forEach(function(el){ if(keep[el.dataset.keep] != null) el.scrollTop = keep[el.dataset.keep]; });
    filterShelf(); renderToolbar(); renderBanner();
    if(!$("#lpDlg").hidden) drawCal();
  }
  function paintSel(){
    $$(".it[data-id]").forEach(function(el){ el.classList.toggle("sel", sel.has(el.dataset.id)); });
    $$("[data-drop]").forEach(function(el){ el.classList.toggle("active", el.dataset.drop === active); });
    var h = $("#lpHint"); if(h) h.textContent = hintText();
  }

  /* ---------------- saving ---------------- */
  var saveTimer = null, saving = false, dirty = false, saveState = "saved", saveMsg = "";
  function drawSave(){
    var el = $("#lpSave"); if(!el) return;
    el.className = "save " + saveState;
    if(saveState === "saved") el.innerHTML = "✓ Saved";
    else if(saveState === "wait" || saveState === "saving") el.textContent = "Saving...";
    else if(saveState === "conflict") el.innerHTML = 'Changed on another device. <button class="lp-btn sm" data-lpa="reload">Reload it</button><button class="lp-btn sm" data-lpa="keepmine">Keep mine</button>';
    else if(saveState === "signedout") el.innerHTML = 'Not saved: signed out. <button class="lp-btn sm" data-lpa="signin">Teacher sign in</button>';
    else el.innerHTML = "Not saved: " + esc(saveMsg) + ' <button class="lp-btn sm" data-lpa="retry">Try again</button>';
  }
  function setSave(st, msg){ saveState = st; saveMsg = msg || ""; drawSave(); }
  function queueSave(){ dirty = true; if(saveState !== "conflict" && saveState !== "signedout") setSave("wait"); clearTimeout(saveTimer); saveTimer = setTimeout(function(){ saveNow(false); }, 1200); }
  function saveNow(force){
    clearTimeout(saveTimer);
    if(saving || (!dirty && !force)) return;
    if(saveState === "conflict" && !force) return;
    saving = true; dirty = false; setSave("saving");
    window.PS8Pass.ask({type:"saveLessonPlans", plan:S, base:base, force:Boolean(force)}, 45000).then(function(d){
      saving = false; base = d.saved || base;
      if(dirty) saveNow(false); else setSave("saved");
    }, function(err){
      saving = false; dirty = true;
      if(err.status === 409) setSave("conflict");
      else if(err.status === 401) setSave("signedout");
      else { setSave("error", err.message || "the site did not answer."); saveTimer = setTimeout(function(){ saveNow(false); }, 20000); }
    });
  }
  window.addEventListener("beforeunload", function(e){ if(S && (dirty || saving)){ e.preventDefault(); e.returnValue = ""; } });

  /* ---------------- changes ---------------- */
  function snapshot(){ undo.push(JSON.stringify(S)); if(undo.length > 40) undo.shift(); }
  function change(fn, msg){ snapshot(); fn(); render(); queueSave(); if(msg) toast(msg, true); }
  function doUndo(){ if(!undo.length) return; S = JSON.parse(undo.pop()); sel.clear(); render(); queueSave(); toast("Undone"); }
  function moveItems(ids, to, idx, copy){
    var target = getList(to); if(!target) return;
    change(function(){
      var moved = [];
      ids.forEach(function(id){ var f = findItem(id); if(f) moved.push(copy ? {id:nid(), t:f.it.t, u:f.it.u, h:f.it.h} : f.it); });
      if(!copy) ids.forEach(function(id){ var f = findItem(id); if(!f) return; if(f.list === target && f.i < idx) idx--; f.list.splice(f.i, 1); });
      target.splice(Math.max(0, Math.min(idx, target.length)), 0, ...moved);
      if(copy){ sel = new Set(moved.map(function(m){ return m.id; })); selShelf = false; }
    }, (copy ? "Copied " : "Moved ") + plural(ids.length, "link") + " to " + contName(to) + ".");
  }
  function removeItem(id){
    var f = findItem(id); if(!f) return;
    var name = f.it.t || kindOf(f.it).name; sel.delete(id);
    change(function(){ var g = findItem(id); if(g) g.list.splice(g.i, 1); }, "Removed " + name + " from " + contName(f.c) + ".");
  }
  function addLessonDay(at, topic, msg){ change(function(){ S.lessons.splice(at, 0, {id:nid(), topic:topic, items:[]}); }, msg); }
  function removeDay(li){
    var n = S.lessons[li].items.length;
    change(function(){ var x = S.lessons.splice(li, 1)[0]; S.tray.push.apply(S.tray, x.items); },
      "Removed that lesson day" + (n ? ". Its " + plural(n, "link") + " went to the holding tray" : "") + ". Every lesson after it moved one school day earlier.");
  }
  function addOff(a, b, t){
    if(b < a){ var x = a; a = b; b = x; }
    change(function(){ S.cal[year].off.push({id:nid(), a:a, b:b, t:t}); }, rangeText(a, b) + " is now a day off (" + t + "). Every lesson from then on moved later.");
  }
  function makeSchoolDay(d){
    var r = offRangeOf(d); if(!r) return;
    change(function(){
      var C = S.cal[year]; C.off = C.off.filter(function(o){ return o.id !== r.id; });
      if(r.a < d) C.off.push({id:nid(), a:r.a, b:addDays(d, -1), t:r.t});
      if(d < r.b) C.off.push({id:nid(), a:addDays(d, 1), b:r.b, t:r.t});
    }, fShort(d) + " is a school day now. Every lesson after it moved one school day earlier.");
  }
  function removeOff(id){
    var r = S.cal[year].off.filter(function(o){ return o.id === id; })[0]; if(!r) return;
    change(function(){ var C = S.cal[year]; C.off = C.off.filter(function(o){ return o.id !== id; }); }, "Removed " + r.t + " (" + rangeText(r.a, r.b) + "). Those are school days now, and lessons moved earlier.");
  }
  function moveNote(id, d){ var n = findNote(id); if(!n || n.d === d) return; change(function(){ findNote(id).d = d; }, "Moved " + n.t + " to " + fShort(d) + ". Date notes stay on their date when lessons move."); }
  function removeNote(id){ var n = findNote(id); if(!n) return; change(function(){ var C = S.cal[year]; C.notes = C.notes.filter(function(x){ return x.id !== id; }); }, "Removed " + n.t + " from " + fShort(n.d) + "."); }
  function setClip(items){ var plain = items.map(function(x){ return x.u ? (x.t ? x.t + " " + x.u : x.u) : x.t; }).join("\n"); clip = {items:items.map(function(x){ return {t:x.t, u:x.u, h:x.h}; }), sig:plain}; return plain; }
  function parseClip(html, txt){
    var out = [];
    if(html && /<a\s/i.test(html)){
      var doc = new DOMParser().parseFromString(html, "text/html");
      $$("a[href]", doc).forEach(function(a){
        var u = safeUrl(a.getAttribute("href")); if(!u || out.some(function(o){ return o.u === u; })) return;
        var t = a.textContent.replace(/\s+/g, " ").trim(); if(/^https?:/i.test(t)) t = "";
        out.push({t:t || kindOf({u:u}).name, u:u});
      });
    }
    if(!out.length && txt) txt.split(/\r?\n/).map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 60).forEach(function(s){
      var m = s.match(/https?:\/\/[^\s"'<>]+/);
      if(m){ var t = s.replace(m[0], "").replace(/[\s|:/-]+$/, "").trim(); out.push({t:t || kindOf({u:m[0]}).name, u:m[0]}); }
      else out.push({t:s.slice(0, 500), u:""});
    });
    return out;
  }
  function pasteDest(){
    if(active && getList(active)) return {c:active, i:getList(active).length};
    if(sel.size && !selShelf){ var f = findItem(Array.from(sel).pop()); if(f) return {c:f.c, i:f.i + 1}; }
    return null;
  }
  function pasteItems(dest, items){
    if(!items.length){ toast("Nothing to paste."); return; }
    change(function(){
      var made = items.map(function(x){ var it = {id:nid(), t:x.t, u:safeUrl(x.u)}; if(x.h === "none" || isColor(x.h)) it.h = x.h; return it; });
      getList(dest.c).splice.apply(getList(dest.c), [dest.i, 0].concat(made));
      sel = new Set(made.map(function(m){ return m.id; })); selShelf = false;
    }, "Pasted " + plural(items.length, "link") + " into " + contName(dest.c) + ".");
  }
  function deleteSel(){
    if(selShelf){ toast("Shelf links are copies of what is in your days. Remove them from the day instead."); return; }
    var ids = Array.from(sel); sel.clear();
    change(function(){ ids.forEach(function(id){ var f = findItem(id); if(f) f.list.splice(f.i, 1); }); }, "Removed " + plural(ids.length, "link") + ".");
  }
  function replacePlan(p, msg){ change(function(){ S = fixPlan(p); if(!S.cal[year]) year = pickYear(); }, msg); }

  /* ---------------- popovers ---------------- */
  var popOpener = null, topicsDirty = false;
  function openPop(anchor, html, mount){
    var p = $("#lpPop"); p.innerHTML = '<div class="pi"></div>'; var w = p.firstChild; w.innerHTML = html; p.hidden = false; popOpener = anchor;
    var r = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
    var x = Math.max(12, Math.min(r.left, innerWidth - pw - 12)), y = r.bottom + 6; if(y + ph > innerHeight - 12) y = Math.max(12, r.top - ph - 6);
    p.style.left = x + "px"; p.style.top = y + "px"; if(mount) mount(w);
  }
  function closePop(){ var p = $("#lpPop"); if(!p.hidden){ p.hidden = true; p.innerHTML = ""; popOpener = null; } }
  function openEdit(anchor, c, id){
    var f = id ? findItem(id) : null, it = f ? f.it : {t:"", u:""};
    openPop(anchor, "<form><h4>" + (f ? "Edit link" : "Add to " + esc(contName(c))) + "</h4>" +
      '<label>Link<input type="url" id="lpPfU" value="' + esc(it.u) + '" placeholder="Paste a link, or leave empty for a note"></label><div class="kd" id="lpPfK"></div>' +
      '<label>Name<input type="text" id="lpPfT" value="' + esc(it.t) + '" placeholder="What it should say"></label>' +
      '<div class="row"><button class="primary" type="submit">' + (f ? "Save" : "Add") + "</button>" + (f ? '<button class="lp-btn danger" type="button" data-pf="del">Remove</button>' : "") +
      '<button class="lp-btn" type="button" data-pf="x">Cancel</button></div>' + (f ? "" : '<p class="tip">Tip: to add many at once, click the day and press Ctrl+V.</p>') + "</form>", function(w){
      var u = $("#lpPfU", w), t = $("#lpPfT", w), k = $("#lpPfK", w);
      var sk = function(){ var v = u.value.trim(), kk = kindOf({u:v, t:t.value}); k.innerHTML = badge(kk) + " " + (!v ? "No link: this will be a note" : safeUrl(v) ? "This is a " + esc(kk.name) + " link" : "That link has to start with https://"); };
      sk(); u.addEventListener("input", sk); (f ? t : u).focus();
      $("form", w).addEventListener("submit", function(e){
        e.preventDefault();
        var raw = u.value.trim(), nu = safeUrl(raw), nt = t.value.trim();
        if(raw && !nu){ sk(); u.focus(); return; }
        closePop(); if(!nu && !nt) return;
        if(f) change(function(){ var g = findItem(id); if(g){ g.it.t = nt || kindOf({u:nu}).name; g.it.u = nu; } }, "Saved.");
        else change(function(){ getList(c).push({id:nid(), t:nt || kindOf({u:nu, t:nt}).name, u:nu}); }, "Added to " + contName(c) + ".");
      });
      w.addEventListener("click", function(e){ var b = e.target.closest("[data-pf]"); if(!b) return; closePop(); if(b.dataset.pf === "del") removeItem(id); });
    });
  }
  function openNoteEdit(anchor, date, id){
    var n = id ? findNote(id) : null;
    openPop(anchor, "<form><h4>" + (n ? "Date note" : "Add a date note") + "</h4>" +
      '<label>Date<input type="date" id="lpNeD" value="' + (n ? n.d : date) + '"></label>' +
      '<label>Note<input type="text" id="lpNeT" value="' + esc(n ? n.t : "") + '" placeholder="Like Student of the Month or Minimum Day"></label>' +
      '<div class="row"><button class="primary" type="submit">Save</button>' + (n ? '<button class="lp-btn danger" type="button" data-ne="del">Remove</button>' : "") + '<button class="lp-btn" type="button" data-ne="x">Cancel</button></div>' +
      '<p class="tip">Date notes stay on their date when lessons move. You can also drag one to another date.</p></form>', function(w){
      $("#lpNeT", w).focus();
      $("form", w).addEventListener("submit", function(e){
        e.preventDefault(); var d = $("#lpNeD", w).value, t = $("#lpNeT", w).value.trim(); closePop(); if(!d || !t) return;
        if(n) change(function(){ var m = findNote(id); m.d = d; m.t = t; }, "Saved.");
        else change(function(){ S.cal[year].notes.push({id:nid(), d:d, t:t}); }, "Added " + t + " on " + fShort(d) + ".");
      });
      w.addEventListener("click", function(e){ var b = e.target.closest("[data-ne]"); if(!b) return; closePop(); if(b.dataset.ne === "del") removeNote(id); });
    });
  }
  function openMakeOff(anchor, d){
    openPop(anchor, "<form><h4>Make " + fShort(d) + ' a day off</h4><label>Name<input type="text" id="lpMoT" value="No School" placeholder="Like Staff Development Day"></label>' +
      '<div class="row"><button class="primary" type="submit">Make it a day off</button><button class="lp-btn" type="button" data-mo="x">Cancel</button></div>' +
      '<p class="tip">The lesson on that day, and every lesson after it, moves one school day later.</p></form>', function(w){
      var t = $("#lpMoT", w); t.focus(); t.select();
      $("form", w).addEventListener("submit", function(e){ e.preventDefault(); var name = t.value.trim() || "No School"; closePop(); addOff(d, d, name); });
      w.addEventListener("click", function(e){ if(e.target.closest("[data-mo]")) closePop(); });
    });
  }
  function openDayMenu(anchor, li){
    var d = CAL.lessonDate[li];
    openPop(anchor, '<div class="pm"><h4>' + fShort(d) + " · School day " + (li + 1) + "</h4>" + topicPicker(li) + "<hr>" +
      '<button data-dm="copy">Copy this day\'s links</button><button data-dm="paste"' + (clip ? "" : " disabled") + ">Paste " + (clip ? plural(clip.items.length, "link") : "links") + " here</button><hr>" +
      '<button data-dm="note">Add a date note on ' + fMD(d) + '</button><button data-dm="off">Make ' + fMD(d) + " a day off (no school)</button><hr>" +
      '<button data-dm="before">Add a lesson day before this one</button><button data-dm="after">Add a lesson day after this one</button>' +
      '<button data-dm="remove" class="danger">Remove this lesson day (its links go to the tray)</button></div>', function(w){
      w.addEventListener("click", function(e){
        var b = e.target.closest('[data-dm],[data-lpa="settopic"]'); if(!b) return; e.stopPropagation();
        if(b.dataset.lpa === "settopic"){ closePop(); ACT.settopic(b); return; }
        var L = S.lessons[li], m = b.dataset.dm; closePop();
        if(m === "copy"){ if(!L.items.length){ toast("That day has no links yet."); return; } setClip(L.items); toast("Copied " + plural(L.items.length, "link") + ". Pick a day, then press Ctrl+V or use Paste here in its ⋯ menu."); }
        if(m === "paste" && clip) pasteItems({c:"L" + li, i:L.items.length}, clip.items);
        if(m === "note") openNoteEdit(anchor, d, null);
        if(m === "off") openMakeOff(anchor, d);
        if(m === "before") addLessonDay(li, L.topic, "Added an empty lesson day on " + dayLabel(li) + ". Every lesson after it moved one school day later.");
        if(m === "after") addLessonDay(li + 1, L.topic, "Added an empty lesson day after it. Every lesson after it moved one school day later.");
        if(m === "remove") removeDay(li);
      });
    });
  }
  function openOffMenu(anchor, d){
    var r = offRangeOf(d); if(!r) return;
    var n = weekdaysIn(r.a, r.b), multi = n > 1;
    openPop(anchor, "<form><h4>" + fShort(d) + " · day off</h4><label>Name" + (multi ? " (all " + n + " days of this break)" : "") + '<input type="text" id="lpOmT" value="' + esc(r.t) + '"></label>' +
      '<div class="row"><button class="primary" type="submit">Rename</button></div></form>' +
      '<div class="pm"><hr><button data-om="school">Make ' + fMD(d) + " a school day</button>" + (multi ? '<button data-om="all">Remove the whole break (' + rangeText(r.a, r.b) + ")</button>" : "") +
      '<button data-om="note">Add a date note on ' + fMD(d) + "</button></div>", function(w){
      $("form", w).addEventListener("submit", function(e){
        e.preventDefault(); var t = $("#lpOmT", w).value.trim(); closePop(); if(!t || t === r.t) return;
        change(function(){ S.cal[year].off.forEach(function(o){ if(o.id === r.id) o.t = t; }); }, "Renamed to " + t + ".");
      });
      w.addEventListener("click", function(e){
        var b = e.target.closest("[data-om]"); if(!b) return; e.stopPropagation(); closePop();
        if(b.dataset.om === "school") makeSchoolDay(d);
        if(b.dataset.om === "all") removeOff(r.id);
        if(b.dataset.om === "note") openNoteEdit(anchor, d, null);
      });
    });
  }
  // a row of highlight colors; attr is "hl" (the links picked) or "tc" (every test); auto adds a first button that means "no pick"
  function hlRow(attr, chosen, auto){
    return '<div class="pt-sw">' + (auto ? '<button type="button" class="none' + (chosen === "" ? " on" : "") + '" data-' + attr + '="">' + auto + "</button>" : "") +
      '<button type="button" class="none' + (chosen === "none" ? " on" : "") + '" data-' + attr + '="none">None</button>' +
      HL.map(function(c){ return '<button type="button" data-' + attr + '="' + c + '" style="--c:' + c + '" class="' + (chosen === c ? "on" : "") + '" aria-label="Color ' + c + '"></button>'; }).join("") +
      '<input type="color" data-' + attr + '-pick value="' + (isColor(chosen) ? chosen : "#ffd43b") + '" aria-label="Any color" title="Any color"></div>';
  }
  function openHighlight(anchor, id){
    var ids = sel.has(id) && !selShelf ? Array.from(sel) : [id];
    var targets = ids.map(findItem).filter(Boolean).map(function(f){ return f.it; });
    if(!targets.length) return;
    var hasTest = targets.some(function(it){ return kindOf(it) === TEST; });
    var one = targets.length === 1 ? targets[0] : null;
    var chosen = one ? (one.h || (hasTest ? "" : "none")) : null;
    openPop(anchor, "<h4>Highlight " + (one ? esc(one.t || kindOf(one).name) : plural(targets.length, "link")) + "</h4>" + hlRow("hl", chosen, hasTest ? "Test color" : "") +
      (hasTest ? '<h5>Every test</h5><p class="tip">Tests get this color unless you pick a different one above.</p>' + hlRow("tc", S.settings.testColor, "") : "") +
      '<p class="tip">The highlight stays with the link when you move or copy it. To highlight several at once, Ctrl+click them first.</p>', function(w){
      var setH = function(v){
        change(function(){ ids.forEach(function(i){ var f = findItem(i); if(!f) return; if(!v || (v === "none" && kindOf(f.it) !== TEST)) delete f.it.h; else f.it.h = v; }); },
          v === "none" ? "Highlight taken off." : v ? "Highlighted." : "Back to the test color.");
      };
      var setT = function(v){ change(function(){ S.settings.testColor = v; }, v === "none" ? "Tests are not highlighted now." : "Every test has that highlight now."); };
      w.addEventListener("click", function(e){
        e.stopPropagation(); var b = e.target.closest("[data-hl],[data-tc]"); if(!b || b.tagName === "INPUT") return;
        closePop(); if(b.hasAttribute("data-hl")) setH(b.dataset.hl); else setT(b.dataset.tc);
      });
      w.addEventListener("change", function(e){
        var t = e.target; if(!isColor(t.value)) return;
        if(t.hasAttribute("data-hl-pick")){ closePop(); setH(t.value); }
        if(t.hasAttribute("data-tc-pick")){ closePop(); setT(t.value); }
      });
    });
  }
  function openTopics(anchor, focus){
    topicsDirty = false;
    var draw = function(){
      return "<h4>Colors</h4><h5>Every test</h5>" + hlRow("tc", S.settings.testColor, "") + '<p class="tip">To highlight any other link, point at it and click the highlighter.</p><h5>Topics</h5>' + S.topics.map(function(t, i){
        return '<div class="pt-row" data-i="' + i + '"><div class="pt-top"><input type="text" class="pt-emoji" data-f="emoji" value="' + esc(t.emoji) + '" aria-label="Emoji"><input type="text" data-f="name" value="' + esc(t.name) + '" aria-label="Topic name"></div>' +
          '<div class="pt-sw">' + SWATCHES.map(function(c){ return '<button type="button" data-sw="' + c + '" style="--c:' + c + '" class="' + (c === t.color ? "on" : "") + '" aria-label="Color ' + c + '"></button>'; }).join("") +
          '<input type="color" data-f="color" value="' + esc(t.color) + '" aria-label="Any color" title="Any color"></div></div>';
      }).join("") + '<div class="row"><button class="lp-btn" type="button" data-pt="add">+ New topic</button></div><p class="tip">The color shows up everywhere: the days, the week headings and the shelf.</p>';
    };
    openPop(anchor, draw(), function(w){
      var mark = function(){ if(!topicsDirty){ snapshot(); topicsDirty = true; } };
      if(focus){ var i0 = S.topics.findIndex(function(t){ return t.id === focus; }), row = $('.pt-row[data-i="' + i0 + '"]', w); if(row) row.scrollIntoView({block:"nearest"}); }
      w.addEventListener("input", function(e){
        if(e.target.hasAttribute("data-tc-pick") && isColor(e.target.value)){ mark(); S.settings.testColor = e.target.value; $$("[data-tc]", w).forEach(function(b){ b.classList.remove("on"); }); render(); queueSave(); return; }
        var f = e.target.dataset.f; if(!f) return; var i = +e.target.closest(".pt-row").dataset.i; mark();
        S.topics[i][f] = f === "name" ? e.target.value.slice(0, 120) : e.target.value; render(); queueSave();
        if(f === "color") $$('.pt-row[data-i="' + i + '"] [data-sw]', w).forEach(function(b){ b.classList.toggle("on", b.dataset.sw === e.target.value); });
      });
      w.addEventListener("click", function(e){
        e.stopPropagation();
        var tb = e.target.closest("[data-tc]");
        if(tb && tb.tagName !== "INPUT"){ mark(); S.settings.testColor = tb.dataset.tc; $$("[data-tc]", w).forEach(function(b){ b.classList.toggle("on", b === tb); }); render(); queueSave(); return; }
        var sw = e.target.closest("[data-sw]");
        if(sw){ var row = sw.closest(".pt-row"), i = +row.dataset.i; mark(); S.topics[i].color = sw.dataset.sw; $$("[data-sw]", row).forEach(function(b){ b.classList.toggle("on", b === sw); }); $('[data-f="color"]', row).value = sw.dataset.sw; render(); queueSave(); return; }
        if(e.target.closest('[data-pt="add"]')){ mark(); S.topics.push({id:nid(), emoji:"⭐", name:"New topic", color:SWATCHES[S.topics.length % SWATCHES.length]}); w.innerHTML = draw(); render(); queueSave(); toast("Added a topic. Pick it from any day's ⋯ menu."); }
      });
    });
  }
  function openBackup(anchor){
    openPop(anchor, '<div class="pm"><h4>Backup</h4><button data-bk="down">Download a backup file</button><button data-bk="up">Restore from a backup file</button>' +
      '<button data-bk="earlier">Go back to the copy from before today</button><p class="tip">The site also keeps the copy from before today by itself. A backup file has every link in it, so keep it to yourself.</p></div>', function(w){
      w.addEventListener("click", function(e){
        var b = e.target.closest("[data-bk]"); if(!b) return; e.stopPropagation(); closePop();
        if(b.dataset.bk === "down") downloadBackup();
        if(b.dataset.bk === "up"){ var f = $("#lpFile"); f.value = ""; f.dataset.mode = "restore"; f.click(); }
        if(b.dataset.bk === "earlier") earlierCopy(anchor);
      });
    });
  }
  function downloadBackup(){
    var blob = new Blob([JSON.stringify({lessonPlans:1, made:TODAY, plan:S})], {type:"application/json"});
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Lesson plans backup " + TODAY + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    toast("Downloaded Lesson plans backup " + TODAY + ".json (in your Downloads folder).");
  }
  function earlierCopy(anchor){
    toast("Getting the copy from before today...");
    window.PS8Pass.ask({type:"lessonPlansEarlier"}).then(function(d){
      if(!d.plan){ toast("There is no earlier copy yet. The site keeps one from the first change of each day."); return; }
      var when = new Date(d.saved).toLocaleString("en-US", {weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
      openPop(anchor, '<div class="pm"><h4>The copy from ' + esc(when) + "</h4><p class=\"tip\">It has " + plural(d.plan.lessons.length, "lesson day") + ". Going back replaces what you see now (Undo brings this back).</p>" +
        '<div class="row"><button class="primary" data-eg="go">Go back to it</button><button class="lp-btn" data-eg="x">Cancel</button></div></div>', function(w){
        w.addEventListener("click", function(e){ var b = e.target.closest("[data-eg]"); if(!b) return; e.stopPropagation(); closePop(); if(b.dataset.eg === "go") replacePlan(d.plan, "Went back to the copy from " + when + "."); });
      });
    }, function(err){ toast(err.message || "That did not work. Try again."); });
  }
  function readPlanFile(file, then){
    var r = new FileReader();
    r.onload = function(){
      var j = null; try { j = JSON.parse(String(r.result || "")); } catch(e){ j = null; }
      var p = j && (j.plan || j);
      if(!p || !Array.isArray(p.lessons)){ toast("That file is not a lesson plans file. Pick the .json file it came in."); return; }
      p.lessons.forEach(function(l){ (l.items || []).forEach(function(it){ it.u = safeUrl(it.u); }); });
      then(p);
    };
    r.readAsText(file);
  }

  /* ---------------- the school calendar ---------------- */
  var DLG = $("#lpDlg");
  function openCal(){ closePop(); DLG.hidden = false; drawCal(); var b = $('[data-lpa="closedlg"]', DLG); if(b) b.focus(); }
  function closeCal(){ DLG.hidden = true; DLG.innerHTML = ""; }
  function drawCal(){
    if(DLG.hidden) return;
    var C = S.cal[year];
    var offs = C.off.slice().sort(function(a, b){ return a.a < b.a ? -1 : 1; }), notes = C.notes.slice().sort(function(a, b){ return a.d < b.d ? -1 : 1; });
    var box = $(".dlg", DLG), keepScroll = box ? box.scrollTop : 0;
    DLG.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="lpDlgT"><div class="dlg-h"><h2 id="lpDlgT">' + esc(year) + ' school calendar</h2><button class="lp-btn" data-lpa="closedlg">Done</button></div>' +
      (C.est ? '<p class="warn">A best guess from the usual pattern. Check it against the district calendar and fix anything that is different, then press The dates are right.</p>' : '<p class="lp-hint">Each change moves your lessons right away. Undo works here too.</p>') +
      '<div class="fields"><label class="fld">First day of school <input type="date" id="lpCFirst" value="' + C.first + '"></label><label class="fld">Last day of school <input type="date" id="lpCLast" value="' + (C.last || "") + '"></label></div>' +
      "<h3>Days off (" + offs.length + ")</h3>" +
      offs.map(function(r){ return '<div class="crow" data-oid="' + r.id + '"><span class="when">' + (r.a === r.b ? fShort(r.a) : fShort(r.a) + " to " + fShort(r.b)) + '</span><input type="text" data-of="t" value="' + esc(r.t) + '" aria-label="Name"><button class="rmb" data-lpa="rmoff" data-id="' + r.id + '" title="Remove this day off" aria-label="Remove ' + esc(r.t) + '">×</button></div>'; }).join("") +
      '<form class="addrow" id="lpCAddOff"><input type="date" id="lpCA" required aria-label="First day off"><span>to</span><input type="date" id="lpCB" aria-label="Last day off (leave empty for one day)"><input type="text" id="lpCT" placeholder="Name, like Spring Break" aria-label="Name"><button class="primary" type="submit">Add day off</button></form>' +
      "<h3>Date notes (" + notes.length + ")</h3>" +
      notes.map(function(n){ return '<div class="crow" data-nid="' + n.id + '"><input type="date" data-nf="d" value="' + n.d + '" aria-label="Date"><input type="text" data-nf="t" value="' + esc(n.t) + '" aria-label="Note"><button class="rmb" data-lpa="rmnote" data-id="' + n.id + '" title="Remove this note" aria-label="Remove ' + esc(n.t) + '">×</button></div>'; }).join("") +
      '<form class="addrow" id="lpCAddNote"><input type="date" id="lpCND" required aria-label="Date"><input type="text" id="lpCNT" required placeholder="Note, like Minimum Day" aria-label="Note"><button class="primary" type="submit">Add date note</button></form>' +
      (C.est ? '<div class="row end"><button class="primary" data-lpa="datesok">The dates are right</button></div>' : "") + "</div>";
    $(".dlg", DLG).scrollTop = keepScroll;
  }
  DLG.addEventListener("click", function(e){ if(e.target === DLG) closeCal(); });
  DLG.addEventListener("change", function(e){
    var t = e.target, C = S.cal[year], v;
    if(t.id === "lpCFirst" && t.value){ if(t.value !== C.first) change(function(){ S.cal[year].first = t.value; }, "First day of school is now " + fShort(t.value) + ". Every lesson moved with it."); return; }
    if(t.id === "lpCLast"){ if(t.value !== C.last) change(function(){ S.cal[year].last = t.value; }, t.value ? "Last day of school is now " + fShort(t.value) + "." : "No last day set."); return; }
    if(t.dataset.of){ var oid = t.closest("[data-oid]").dataset.oid; v = t.value.trim(); if(v) change(function(){ S.cal[year].off.forEach(function(o){ if(o.id === oid) o.t = v; }); }, "Renamed to " + v + "."); return; }
    if(t.dataset.nf){
      var nid2 = t.closest("[data-nid]").dataset.nid; v = t.value.trim(); if(!v) return;
      if(t.dataset.nf === "d") change(function(){ findNote(nid2).d = v; }, "Moved the note to " + fShort(v) + ".");
      else change(function(){ findNote(nid2).t = v; }, "Renamed to " + v + ".");
    }
  });
  DLG.addEventListener("submit", function(e){
    e.preventDefault(); var f = e.target;
    if(f.id === "lpCAddOff"){ var a = $("#lpCA").value, b = $("#lpCB").value || a, t = $("#lpCT").value.trim() || "No School"; if(a) addOff(a, b, t); }
    if(f.id === "lpCAddNote"){ var d = $("#lpCND").value, tt = $("#lpCNT").value.trim(); if(d && tt) change(function(){ S.cal[year].notes.push({id:nid(), d:d, t:tt}); }, "Added " + tt + " on " + fShort(d) + "."); }
  });

  /* ---------------- actions ---------------- */
  var ACT = {
    year: function(b){ if(b.dataset.y === year) return; year = b.dataset.y; ui.scrollInit = true; render(); toast("Showing " + year + ". Every lesson kept its place in line and moved to its new date."); },
    addyear: function(){ var y0 = +years().pop().slice(0, 4) + 1, k = yearKey(y0); change(function(){ S.cal[k] = makeYear(y0); }); year = k; ui.scrollInit = true; render(); toast("Added " + k + " from the usual pattern. Open School calendar to check it against the district calendar.", true); },
    calendar: function(){ openCal(); },
    closedlg: function(){ closeCal(); },
    datesok: function(){ change(function(){ S.cal[year].est = false; }, "Great. The " + year + " dates are set."); closeCal(); },
    rmoff: function(b){ removeOff(b.dataset.id); },
    rmnote: function(b){ removeNote(b.dataset.id); },
    rm: function(b){ removeItem(b.dataset.id); },
    hl: function(b){ openHighlight(b, b.dataset.id); },
    offmenu: function(b){ openOffMenu(b, b.dataset.d); },
    shelf: function(){ ui.shelfClosed = !ui.shelfClosed; store.set("lp-shelf", ui.shelfClosed ? "closed" : "open"); closePop(); render(); },
    topics: function(b){ openTopics(b, b.dataset.t); },
    undo: function(){ doUndo(); },
    backup: function(b){ openBackup(b); },
    add: function(b){ openEdit(b, b.dataset.c, null); },
    daymenu: function(b){ openDayMenu(b, +b.dataset.li); },
    settopic: function(b){ var li = +b.dataset.li, t = b.dataset.t; if(S.lessons[li].topic === t) return; change(function(){ S.lessons[li].topic = t; }, dayLabel(li) + " is now " + topicOf(t).name + "."); },
    today: function(){ scrollToWeek(null, true); },
    jump: function(b){ var el = document.getElementById(b.dataset.to); if(el) scrollToWeek(el.dataset.week, true); },
    reload: function(){ location.reload(); },
    keepmine: function(){ saveNow(true); },
    retry: function(){ saveNow(true); },
    signin: function(){ window.PS8Pass.teacherSignIn(); }
  };

  document.addEventListener("click", function(e){
    if(!S) return;
    var t = e.target;
    if(!$("#lpPop").hidden && !t.closest("#lpPop") && !(popOpener && popOpener.contains(t))) closePop();
    var act = t.closest("[data-lpa]"), it = t.closest(".it[data-id]");
    if(editing && it && !t.closest(".go") && (!act || act.contains(it))){
      e.preventDefault();
      var id = it.dataset.id, shelf = Boolean(it.closest("[data-shelf-copy]"));
      if((e.shiftKey || e.ctrlKey || e.metaKey) && selShelf === shelf){ if(sel.has(id)) sel.delete(id); else sel.add(id); } else sel = new Set([id]);
      selShelf = shelf; active = null; paintSel(); return;
    }
    if(!editing && it && (!act || act.contains(it))) return;
    if(act && ACT[act.dataset.lpa] && !act.disabled){ e.preventDefault(); ACT[act.dataset.lpa](act, e); return; }
    if(!editing) return;
    var box = t.closest("[data-drop]") || (t.closest("[data-daybox]") && $("[data-drop]", t.closest("[data-daybox]")));
    if(box && t.closest("#lpCanvas")){ active = box.dataset.drop; sel.clear(); paintSel(); return; }
    if(t.closest("#lpCanvas") && (sel.size || active)){ sel.clear(); active = null; paintSel(); }
  });
  document.addEventListener("dblclick", function(e){
    if(!S || !editing) return;
    var nt = e.target.closest("[data-note]"); if(nt && !e.target.closest(".x")){ e.preventDefault(); openNoteEdit(nt, null, nt.dataset.note); return; }
    var it = e.target.closest(".it[data-id]"); if(it && !it.closest("[data-shelf-copy]")){ e.preventDefault(); var f = findItem(it.dataset.id); if(f) openEdit(it, f.c, f.it.id); }
  });
  document.addEventListener("change", function(e){
    if(e.target.id === "lpEditSw"){ editing = e.target.checked; store.set("lp-editing", editing ? "on" : "off"); sel.clear(); active = null; closePop(); render(); }
    if(e.target.id === "lpFile" && e.target.files && e.target.files[0]){
      var mode = e.target.dataset.mode;
      readPlanFile(e.target.files[0], function(p){
        if(mode === "import"){ startWith(p, true); return; }
        replacePlan(p, "Restored from the backup file (" + plural(p.lessons.length, "lesson day") + "). Undo brings back what was here.");
      });
    }
  });
  document.addEventListener("input", function(e){
    if(e.target.id === "lpShelfQ"){
      ui.shelfQ = e.target.value;
      if(ui.shelfQ && $$(".shelf details:not([open])").length){ var pos = e.target.selectionStart; render(); var q = $("#lpShelfQ"); q.focus(); q.setSelectionRange(pos, pos); }
      else filterShelf();
    }
  });
  document.addEventListener("toggle", function(e){
    var d = e.target; if(!S || !d.matches || !d.matches(".shelf details[data-k]") || ui.shelfQ) return;
    var was = Boolean(ui.open[d.dataset.k]); ui.open[d.dataset.k] = d.open;
    if(d.open && !was) render(); /* its links are drawn when it opens */
  }, true);
  var typing = function(t){ return Boolean(t && t.closest && t.closest("input,textarea,select,[contenteditable]")); };
  var pasteTimer = null;
  document.addEventListener("keydown", function(e){
    if(!S) return;
    if(e.key === "Escape"){ if(!$("#lpPop").hidden){ closePop(); return; } if(!DLG.hidden){ closeCal(); return; } if(sel.size || active){ sel.clear(); active = null; paintSel(); } return; }
    if(typing(e.target)) return;
    var mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if(mod && k === "z"){ e.preventDefault(); doUndo(); return; }
    if(!editing || !DLG.hidden) return;
    if(mod && k === "v"){ /* backup for browsers that never send a paste event */
      var dest = pasteDest(); if(!dest){ toast("Click a day first, then press Ctrl+V."); return; }
      clearTimeout(pasteTimer); pasteTimer = setTimeout(function(){ pasteTimer = null; if(clip) pasteItems(dest, clip.items); else toast("Copy a link first (click it, then Ctrl+C)."); }, 120); return;
    }
    if((e.key === "Delete" || e.key === "Backspace") && sel.size){ e.preventDefault(); deleteSel(); return; }
    if(e.key === "Enter"){
      var nt = e.target.closest && e.target.closest("[data-note]"); if(nt){ e.preventDefault(); openNoteEdit(nt, null, nt.dataset.note); return; }
      var it = e.target.closest && e.target.closest(".it[data-id]"); if(it && !it.closest("[data-shelf-copy]")){ e.preventDefault(); var f = findItem(it.dataset.id); if(f) openEdit(it, f.c, f.it.id); }
    }
    if(mod && (k === "c" || k === "x") && sel.size){
      if(k === "x" && selShelf) return;
      var items = Array.from(sel).map(findItem).filter(Boolean).map(function(f){ return f.it; }); setClip(items);
      try { if(navigator.clipboard) navigator.clipboard.writeText(clip.sig).catch(function(){}); } catch(err){ /* the copy event writes it */ }
      if(k === "x") deleteSel(); else toast("Copied " + plural(items.length, "link") + ". Click a day, then press Ctrl+V.");
    }
  });
  document.addEventListener("copy", function(e){
    if(!S || typing(e.target) || !editing || !sel.size || !e.clipboardData) return;
    var items = Array.from(sel).map(findItem).filter(Boolean).map(function(f){ return f.it; }); if(!items.length) return;
    e.preventDefault(); var plain = setClip(items);
    e.clipboardData.setData("text/plain", plain);
    e.clipboardData.setData("text/html", items.map(function(x){ var u = safeUrl(x.u); return u ? '<a href="' + esc(u) + '">' + esc(x.t || u) + "</a>" : esc(x.t); }).join("<br>"));
  });
  document.addEventListener("paste", function(e){
    if(!S || typing(e.target) || !editing || !DLG.hidden) return;
    clearTimeout(pasteTimer); pasteTimer = null;
    var dest = pasteDest(); if(!dest) return;
    e.preventDefault();
    var cd = e.clipboardData, txt = cd ? cd.getData("text/plain") : "", html = cd ? cd.getData("text/html") : "";
    pasteItems(dest, (clip && (txt === clip.sig || !txt.trim())) ? clip.items : parseClip(html, txt));
  });

  /* ---------------- drag and drop ---------------- */
  var flipTimer = null, flipEl = null;
  function clearMarks(){ $$(".drop-on,.drop-before,.drop-after,.drop-date,.drop-x").forEach(function(el){ el.classList.remove("drop-on", "drop-before", "drop-after", "drop-date", "drop-x"); }); }
  function endDrag(){ drag = null; clearMarks(); $$(".dragging").forEach(function(el){ el.classList.remove("dragging"); }); clearTimeout(flipTimer); flipEl = null; }
  function dropBox(t){ if(!t || !t.closest) return null; var b = t.closest("[data-drop]"); if(b) return b; var db = t.closest("[data-daybox]"); return db ? $("[data-drop]", db) : null; }
  // where a drop lands: next to the nearest link (left or right of it when the links run in columns, above or below when not)
  function dropPos(box, e){
    var items = $$(":scope > .it", box).filter(function(x){ return !x.classList.contains("dragging"); });
    if(!items.length) return {el:null};
    var rects = items.map(function(x){ return x.getBoundingClientRect(); });
    var cols = rects.length > 1 && Math.abs(rects[0].top - rects[1].top) < 3;
    var last = rects[rects.length - 1];
    if(e.clientY > last.bottom + 3) return {el:null};
    var best = 0, bd = Infinity;
    rects.forEach(function(r, i){
      var dx = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0;
      var dy = e.clientY < r.top ? r.top - e.clientY : e.clientY > r.bottom ? e.clientY - r.bottom : 0;
      var d = dx * dx + dy * dy * 9; if(d < bd){ bd = d; best = i; }
    });
    var r = rects[best];
    return {el:items[best], cols:cols, after:cols ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2};
  }
  document.addEventListener("dragstart", function(e){
    if(!S || !editing) return;
    var t = e.target.closest ? e.target : e.target.parentElement;
    var nt = t.closest("[data-note]");
    if(nt){ drag = {type:"note", id:nt.dataset.note}; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", nt.textContent.replace("×", "").trim()); requestAnimationFrame(function(){ nt.classList.add("dragging"); }); return; }
    var it = t.closest(".it[data-id]");
    if(it){
      var id = it.dataset.id, shelf = Boolean(it.closest("[data-shelf-copy]")), ids = sel.has(id) && selShelf === shelf ? Array.from(sel) : [id];
      drag = {type:"items", ids:ids, shelf:shelf}; e.dataTransfer.effectAllowed = "copyMove";
      var f = findItem(id); e.dataTransfer.setData("text/plain", f ? (f.it.u || f.it.t) : "");
      requestAnimationFrame(function(){ ids.forEach(function(i){ $$('.it[data-id="' + i + '"]').forEach(function(el){ el.classList.add("dragging"); }); }); });
    }
  });
  document.addEventListener("dragover", function(e){
    if(!drag) return;
    var fl = e.target.closest && e.target.closest("[data-flip]");
    if(fl && drag.type === "items"){ e.preventDefault(); if(fl !== flipEl){ clearTimeout(flipTimer); flipEl = fl; flipTimer = setTimeout(function(){ if(ui.shelfClosed) ACT.shelf(); flipEl = null; }, 500); } return; }
    clearMarks();
    if(drag.type === "note"){
      var row = e.target.closest && e.target.closest("[data-date]"); if(!row) return;
      e.preventDefault(); e.dataTransfer.dropEffect = "move"; row.classList.add("drop-date"); return;
    }
    var box = dropBox(e.target); if(!box) return;
    e.preventDefault(); e.dataTransfer.dropEffect = (drag.shelf || e.ctrlKey || e.altKey || e.metaKey) ? "copy" : "move";
    box.classList.add("drop-on"); var p = dropPos(box, e); if(p.el){ p.el.classList.add(p.after ? "drop-after" : "drop-before"); if(p.cols) p.el.classList.add("drop-x"); }
    // near the top or bottom of the day list, scroll it
    var ag = $(".agenda"); if(ag){ var r = ag.getBoundingClientRect(); if(e.clientY < r.top + 50) ag.scrollTop -= 18; else if(e.clientY > r.bottom - 50) ag.scrollTop += 18; }
  });
  document.addEventListener("drop", function(e){
    if(!drag) return; e.preventDefault();
    var d = drag; endDrag();
    if(d.type === "note"){ var row = e.target.closest && e.target.closest("[data-date]"); if(row) moveNote(d.id, row.dataset.date); return; }
    var box = dropBox(e.target); if(!box) return;
    var c = box.dataset.drop, list = getList(c); if(!list) return;
    var p = dropPos(box, e), idx = list.length;
    if(p.el){ var k = list.findIndex(function(x){ return x.id === p.el.dataset.id; }); if(k >= 0) idx = k + (p.after ? 1 : 0); }
    moveItems(d.ids, c, idx, d.shelf || e.ctrlKey || e.altKey || e.metaKey);
  });
  document.addEventListener("dragend", endDrag);
  document.addEventListener("mousedown", function(){ if(drag) endDrag(); });

  /* ---------------- toast ---------------- */
  function toast(msg, canUndo){
    var t = $("#lpToast");
    t.innerHTML = "<span>" + esc(msg) + "</span>" + (canUndo && undo.length ? '<button data-lpa="undo">Undo</button>' : "");
    t.classList.add("show"); clearTimeout(toast.tm); toast.tm = setTimeout(function(){ t.classList.remove("show"); }, 5000);
  }

  /* ---------------- who is looking, loading, importing ---------------- */
  function status(text, bad){ var s = $("#lpStatus"); s.className = "cp-msg" + (bad ? " bad" : ""); s.textContent = text || ""; s.hidden = !text; }
  function show(which){ ["lpLocked", "lpEmpty", "lpApp"].forEach(function(id){ $("#" + id).hidden = id !== which; }); }
  function locked(){
    S = null; loaded = false; undo = []; closePop(); closeCal();
    var sv = Boolean(window.PS8Pass.studentView && window.PS8Pass.studentView());
    $("#lpLockedText").textContent = sv ? "You are in student view, and students can't open this page. Leave student view to see your lesson plans."
      : "This page is only for Mr. LaMarr. Sign in with the teacher password to see your lesson plans.";
    $("#lpSignIn").textContent = sv ? "Leave student view" : "Teacher sign in";
    show("lpLocked"); status("");
  }
  function load(){
    if(loading) return; loading = true;
    status("Opening your lesson plans...");
    window.PS8Pass.ask({type:"lessonPlans"}).then(function(d){
      loaded = true; status("");
      if(!d.plan){ show("lpEmpty"); return; }
      base = d.saved || 0; startWith(d.plan, false);
    }, function(err){
      if(err.status === 401) return locked();
      status((err.message || "The site did not answer.") + " Reload the page to try again.", true);
    }).then(function(){ loading = false; });
  }
  function startWith(p, fresh){
    S = fixPlan(p); year = pickYear(); ui.scrollInit = true; undo = []; sel.clear(); active = null;
    buildCal(); /* open the shelf group of the topic being taught now */
    var now = CAL.lessonDate.findIndex(function(d){ return d >= TODAY; });
    if(now >= 0) ui.open[S.lessons[now].topic] = true;
    show("lpApp"); render();
    if(fresh){ dirty = true; saveNow(false); toast("Your lesson plans are on the site now: " + plural(S.lessons.length, "lesson day") + ". Next, check the " + year + " dates."); }
  }
  function look(v){
    if(v && v.teacher){ if(!loaded) load(); else if(S && saveState === "signedout") saveNow(false); return; }
    if(v && v.checked === false) return; /* the bridge has not said yet */
    if(S && (dirty || saving || saveState === "signedout")){ setSave("signedout"); return; } /* keep unsaved work: sign in again to save it */
    locked();
  }
  $("#lpSignIn").addEventListener("click", function(){
    if(window.PS8Pass.studentView && window.PS8Pass.studentView()) window.PS8Pass.setStudentView(false);
    else window.PS8Pass.teacherSignIn();
  });
  $("#lpImport").addEventListener("click", function(){ var f = $("#lpFile"); f.value = ""; f.dataset.mode = "import"; f.click(); });
  $("#lpStartEmpty").addEventListener("click", function(){ startWith({lessons:[{id:nid(), topic:"", items:[]}]}, true); });

  // pass-menu.js is deferred and runs before this file: start once the page has loaded
  function start(){ window.PS8Pass.onChange(look); look(window.PS8Pass.view()); }
  if(window.PS8Pass) start(); else document.addEventListener("DOMContentLoaded", start);
})();
