/* Physical Science 8 — chapter-specific illustrated science visuals */
(function(){
  "use strict";

  var PAGES = {
    "index.html": ["Physical Science 8","course","Six different branches of physical science connect through a few big ideas: forces, energy, waves, fields, heat, and matter."],
    "glossary.html": ["Science Vocabulary","glossary","Key science words become easier to remember when they are linked to a concrete model, diagram, or real-world event."],

    "u1.html": ["Energy of Motion","u1","The crash sequence ties the unit together: motion before impact, forces during impact, and energy transfer as the vehicle stops."],
    "u1-t1.html": ["Frames of Reference","u1t1","Inside the moving car, the passenger and dashboard appear still relative to each other. From the sidewalk, both move past the observer. The motion description changes with the reference point."],
    "u1-t2.html": ["Speed and Distance/Time Graphs","u1t2","The runner and cyclist cover distance at different rates. On the graph, the steeper line represents the faster object because distance changes more each second."],
    "u1-t3.html": ["Inertia and Net Forces","u1t3","The person pushes the box to the right. Gravity and the floor balance vertically, while the push is larger than friction horizontally, so the net force — and acceleration — point right."],
    "u1-t4.html": ["Energy Transfer via Friction","u1t4","When the bicycle brakes, friction at the brake pads and tire-road contact slows the bike and transfers some motion energy into thermal energy."],
    "u1-t5.html": ["Mass and Acceleration","u1t5","With the same applied force, the lighter cart accelerates more than the heavier cart. This is the relationship summarized by F = ma."],
    "u1-t6.html": ["Collisions and Newton’s Third Law","u1t6","During a collision, the blue cart pushes the red cart and the red cart pushes the blue cart with equal-size forces in opposite directions."],

    "u2.html": ["Gravity & Energy Related to Position","u2","As the coaster climbs, energy is stored by position. On the descent, gravitational potential energy changes into kinetic energy."],
    "u2-t1.html": ["Gravitational Potential Energy","u2t1","The higher shelf gives the same object more gravitational potential energy. More height means more stored energy relative to the floor."],
    "u2-t2.html": ["Universal Law of Gravity","u2t2","Both objects pull on each other. Greater mass strengthens gravitational attraction, while greater separation weakens it."],
    "u2-t3.html": ["Gravitational Potential Energy to Kinetic Energy","u2t3","At the top, the skater has more gravitational potential energy and less kinetic energy. As the skater moves downhill, height decreases while speed increases."],

    "u3.html": ["Electricity & Magnetism","u3","Electric current in a coil creates a magnetic field. That connection is the basis of electromagnets, motors, speakers, and many everyday devices."],
    "u3-t1.html": ["Magnetism","u3t1","Iron filings line up with the magnetic field around a bar magnet. The curved pattern shows the field extending through the space around the magnet."],
    "u3-t2.html": ["Electromagnetic Fields","u3t2","Closing the switch lets current flow through the coil, creating a magnetic field that turns the iron nail into a temporary electromagnet."],

    "u4.html": ["Waves Transmitting Energy & Information","u4","A phone converts information into a signal, waves carry that signal through space or a cable, and another device converts it back into sound or images."],
    "u4-t1.html": ["Intro to Wave Properties","u4t1","Amplitude is the height from the resting position, wavelength is the distance from crest to crest, and frequency tells how many waves pass each second."],
    "u4-t2.html": ["Light Waves","u4t2","White light entering a prism bends and separates into colors because different wavelengths refract by different amounts."],
    "u4-t3.html": ["Waves & Information Technology","u4t3","The analog signal varies continuously, while the digital signal records distinct values. Digital encoding can make information easier to copy and recover from noise."],

    "u5.html": ["Thermal Energy & Heat Flow","u5","Thermal energy naturally transfers from the warmer mug to the cooler surroundings until their temperatures move toward equilibrium."],
    "u5-t1.html": ["Energy Transfer and Temperature","u5t1","The hot metal block transfers thermal energy to the cooler block. The arrows shrink as their temperatures move toward thermal equilibrium."],
    "u5-t2.html": ["Changes in Energy at the Molecular Level","u5t2","Particles in the warmer sample move faster on average than particles in the cooler sample. Temperature reflects average particle kinetic energy."],
    "u5-t3.html": ["Phase Changes and Energy Transfer","u5t3","Heating changes how particles move and how freely they can separate: tightly packed in a solid, mobile in a liquid, and widely spaced in a gas."],

    "u6.html": ["Chemical Energy & Reactions","u6","A chemical reaction rearranges atoms into new combinations. The atoms are conserved even though the substances and their properties can change."],
    "u6-t1.html": ["Molecular Composition","u6t1","Water and carbon dioxide contain different kinds and numbers of atoms. Molecular formulas and models both show composition."],
    "u6-t2.html": ["Physical and Chemical Properties","u6t2","Melting changes a substance’s state without changing its identity, while rusting forms a new substance with different properties."],
    "u6-t3.html": ["Conservation of Matter","u6t3","The sealed reaction starts and ends with the same atoms. They are rearranged into new molecules, so total matter is conserved."],
    "u6-t4.html": ["Synthetic vs. Natural","u6t4","A material’s origin does not by itself tell you whether it is useful or safe. Natural and synthetic materials should be compared by composition, properties, and evidence."]
  };

  var CSS = `
  .science-visual{margin:28px 0 34px;background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:var(--shadow);}
  .science-visual-stage{background:linear-gradient(145deg,#fbfcff,var(--accent-tint));padding:14px;}
  .science-visual svg{display:block;width:100%;height:auto;border-radius:14px;background:#fff;font-family:'Poppins',system-ui,sans-serif;}
  .science-visual figcaption{padding:14px 18px 16px;border-top:1px solid var(--line);font-size:.9rem;line-height:1.6;color:var(--ink-soft);background:#fff;}
  .science-visual figcaption strong{color:var(--ink);}
  .science-visual .sv-title{font-weight:800;fill:#172033}
  .science-visual .sv-label{font-weight:700;fill:#263149}
  .science-visual .sv-small{font-size:20px;font-weight:600;fill:#44506a}
  .science-visual .sv-note{font-size:18px;font-weight:600;fill:#59637a}
  @media(max-width:760px){.science-visual{margin:22px 0 28px;border-radius:16px}.science-visual-stage{padding:8px}.science-visual figcaption{font-size:.82rem;padding:12px 14px 14px}}
  `;

  function file(){
    var p=location.pathname.split('/').filter(Boolean), f=p[p.length-1]||'index.html';
    return f.indexOf('.')<0?'index.html':f;
  }
  function safe(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function defs(){
    return `<defs>
      <marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ef476f"/></marker>
      <marker id="arrB" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#118ab2"/></marker>
      <marker id="arrG" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2a9d6f"/></marker>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dff3ff"/><stop offset="1" stop-color="#f8fbff"/></linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity=".12"/></filter>
    </defs>`;
  }
  function svg(inner,label){
    return `<svg viewBox="0 0 1000 520" role="img" aria-label="${safe(label)}" xmlns="http://www.w3.org/2000/svg">${defs()}${inner}</svg>`;
  }
  function t(x,y,text,cls,anchor){
    return `<text x="${x}" y="${y}" class="${cls||'sv-label'}" font-family="Poppins, sans-serif"${anchor?` text-anchor="${anchor}"`:''}>${safe(text)}</text>`;
  }
  function car(x,y,c){
    return `<g transform="translate(${x} ${y})"><rect x="0" y="38" width="180" height="58" rx="16" fill="${c}"/><path d="M36 38 L70 4 H132 L160 38Z" fill="${c}" opacity=".78"/><rect x="78" y="12" width="44" height="24" rx="4" fill="#dff3ff"/><circle cx="42" cy="100" r="18" fill="#263149"/><circle cx="142" cy="100" r="18" fill="#263149"/><circle cx="42" cy="100" r="8" fill="#a9b3c8"/><circle cx="142" cy="100" r="8" fill="#a9b3c8"/></g>`;
  }
  function person(x,y,scale,shirt){
    return `<g transform="translate(${x} ${y}) scale(${scale||1})"><circle cx="0" cy="-58" r="20" fill="#f2c9a5"/><path d="M-18 -38 Q0 -50 18 -38 L24 18 H-24Z" fill="${shirt||'#4361ee'}"/><path d="M-20 -22 L-58 10" stroke="#f2c9a5" stroke-width="13" stroke-linecap="round"/><path d="M18 -20 L58 4" stroke="#f2c9a5" stroke-width="13" stroke-linecap="round"/><path d="M-12 18 L-28 72 M12 18 L34 72" stroke="#263149" stroke-width="14" stroke-linecap="round"/></g>`;
  }

  var SCENE = {};

  SCENE.course=function(){return svg(`
    <rect width="1000" height="520" fill="#f8fbff"/>
    ${t(500,52,"One course — six connected ideas","sv-title", "middle")}
    <g filter="url(#shadow)">
      <g transform="translate(80 110)"><rect width="250" height="135" rx="22" fill="#ffe4e8"/><circle cx="58" cy="66" r="30" fill="#e63946"/><path d="M112 82h85" stroke="#e63946" stroke-width="10" marker-end="url(#arr)"/>${t(150,42,"FORCES","sv-label","middle")}</g>
      <g transform="translate(375 110)"><rect width="250" height="135" rx="22" fill="#eee7f8"/><path d="M42 92 Q74 30 106 92 T170 92 T218 92" fill="none" stroke="#6a4c93" stroke-width="8"/>${t(150,42,"WAVES","sv-label","middle")}</g>
      <g transform="translate(670 110)"><rect width="250" height="135" rx="22" fill="#def6ff"/><path d="M72 38v54M102 28v72M132 44v44" stroke="#1982c4" stroke-width="10" stroke-linecap="round"/>${t(162,42,"FIELDS","sv-label","middle")}</g>
      <g transform="translate(80 285)"><rect width="250" height="135" rx="22" fill="#fff0dc"/><circle cx="82" cy="72" r="26" fill="#f77f00"/><path d="M120 72h78" stroke="#f77f00" stroke-width="10" marker-end="url(#arr)"/>${t(150,42,"ENERGY","sv-label","middle")}</g>
      <g transform="translate(375 285)"><rect width="250" height="135" rx="22" fill="#fff6df"/><circle cx="80" cy="70" r="10" fill="#ff9f1c"/><circle cx="118" cy="46" r="10" fill="#ff9f1c"/><circle cx="154" cy="82" r="10" fill="#ff9f1c"/><circle cx="192" cy="56" r="10" fill="#ff9f1c"/>${t(150,42,"HEAT","sv-label","middle")}</g>
      <g transform="translate(670 285)"><rect width="250" height="135" rx="22" fill="#e5f8ef"/><circle cx="92" cy="70" r="20" fill="#2a9d6f"/><circle cx="132" cy="70" r="20" fill="#8bd3b2"/><circle cx="172" cy="70" r="20" fill="#2a9d6f"/>${t(150,42,"MATTER","sv-label","middle")}</g>
    </g>`,"Course overview showing forces, waves, fields, energy, heat, and matter");};

  SCENE.glossary=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfbff"/>
    ${t(500,54,"Build meaning by connecting words to models","sv-title","middle")}
    <g transform="translate(90 110)">
      <rect width="820" height="320" rx="28" fill="#fff" stroke="#e6e8f0" stroke-width="3"/>
      <g transform="translate(80 62)"><circle r="42" fill="#ffe4e8"/>${t(0,8,"F","sv-title","middle")} ${t(0,74,"force","sv-small","middle")}</g>
      <g transform="translate(250 62)"><circle r="42" fill="#eee7f8"/>${t(0,8,"E","sv-title","middle")} ${t(0,74,"energy","sv-small","middle")}</g>
      <g transform="translate(420 62)"><circle r="42" fill="#def6ff"/>${t(0,8,"W","sv-title","middle")} ${t(0,74,"wave","sv-small","middle")}</g>
      <g transform="translate(590 62)"><circle r="42" fill="#fff0dc"/>${t(0,8,"T","sv-title","middle")} ${t(0,74,"thermal","sv-small","middle")}</g>
      <g transform="translate(730 62)"><circle r="42" fill="#e5f8ef"/>${t(0,8,"M","sv-title","middle")} ${t(0,74,"matter","sv-small","middle")}</g>
      <path d="M80 150 C220 250 330 170 420 235 S650 220 730 150" fill="none" stroke="#9aa5bb" stroke-width="4" stroke-dasharray="10 12"/>
      ${t(410,280,"A glossary is a map of connected ideas, not just a word list.","sv-note","middle")}
    </g>`,"Science vocabulary connected to visual models");};

  SCENE.u1=function(){return svg(`
    <rect width="1000" height="520" fill="url(#sky)"/>
    ${t(500,50,"Crash sequence: motion → forces → energy transfer","sv-title","middle")}
    <rect x="0" y="370" width="1000" height="150" fill="#d6d7dc"/>
    <rect x="0" y="410" width="1000" height="8" fill="#fff" opacity=".8"/>
    ${car(110,245,"#e63946")} ${car(390,245,"#ff8fa3")}
    <rect x="780" y="215" width="36" height="210" rx="10" fill="#6c757d"/>
    <path d="M280 300 H360" stroke="#ef476f" stroke-width="10" marker-end="url(#arr)"/>
    <path d="M570 292 C660 285 720 270 770 260" fill="none" stroke="#118ab2" stroke-width="7" stroke-dasharray="10 10" marker-end="url(#arrB)"/>
    ${t(250,205,"moving","sv-label","middle")} ${t(510,205,"impact","sv-label","middle")} ${t(800,180,"stop","sv-label","middle")}
  `,"Unit 1 crash sequence showing motion, impact, and stopping");};

  SCENE.u1t1=function(){return svg(`
    <rect width="1000" height="520" fill="#f8fbff"/>
    ${t(500,48,"Same event, two frames of reference","sv-title","middle")}
    <rect x="45" y="82" width="430" height="365" rx="26" fill="#fff" stroke="#dfe4ec" stroke-width="3"/>
    <rect x="525" y="82" width="430" height="365" rx="26" fill="#fff" stroke="#dfe4ec" stroke-width="3"/>
    ${t(260,118,"VIEW 1 — INSIDE THE CAR","sv-small","middle")}
    ${t(740,118,"VIEW 2 — FROM THE SIDEWALK","sv-small","middle")}
    <g transform="translate(85 145)">
      <rect x="0" y="180" width="350" height="100" rx="20" fill="#edf1f7"/>
      <circle cx="98" cy="112" r="28" fill="#f2c9a5"/><path d="M70 150 Q98 124 126 150 L135 218 H62Z" fill="#4361ee"/>
      <rect x="210" y="128" width="105" height="38" rx="12" fill="#263149"/>
      <circle cx="260" cy="192" r="42" fill="none" stroke="#263149" stroke-width="12"/>
      <path d="M150 80 h150" stroke="#2a9d6f" stroke-width="8" marker-end="url(#arrG)"/>
      ${t(225,65,"dashboard stays in same place","sv-note","middle")}
      ${t(175,315,"Passenger: “I’m not moving relative to the car.”","sv-note","middle")}
    </g>
    <g transform="translate(555 145)">
      <rect x="0" y="250" width="370" height="36" rx="8" fill="#d5d7dd"/>
      ${car(62,122,"#e63946")}
      <circle cx="330" cy="76" r="18" fill="#f2c9a5"/><path d="M315 100h30l12 65h-54z" fill="#ffd166"/><path d="M319 166l-10 62M341 166l13 62" stroke="#263149" stroke-width="10"/>
      <path d="M82 100 h190" stroke="#ef476f" stroke-width="9" marker-end="url(#arr)"/>
      ${t(178,82,"car moves right","sv-note","middle")}
      ${t(185,315,"Observer: “The car and passenger are moving.”","sv-note","middle")}
    </g>
  `,"Split perspective view of a moving car from inside and from the sidewalk");};

  SCENE.u1t2=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Distance–time graphs turn motion into a picture","sv-title","middle")}
    <g transform="translate(55 95)">
      <rect width="360" height="330" rx="24" fill="#eaf7ff"/>
      ${person(110,188,.72,"#4361ee")} ${person(250,178,.72,"#ff7f50")}
      <path d="M70 275 H300" stroke="#8c96a8" stroke-width="5" stroke-dasharray="12 10"/>
      <path d="M115 104 h74" stroke="#118ab2" stroke-width="8" marker-end="url(#arrB)"/>
      <path d="M255 92 h106" stroke="#ef476f" stroke-width="8" marker-end="url(#arr)"/>
      ${t(120,315,"runner","sv-small","middle")} ${t(260,315,"cyclist","sv-small","middle")}
    </g>
    <g transform="translate(470 95)">
      <rect width="470" height="330" rx="24" fill="#fff" stroke="#e6e8f0" stroke-width="3"/>
      <path d="M72 265 V55 M72 265 H420" stroke="#263149" stroke-width="4"/>
      <path d="M72 250 L390 145" fill="none" stroke="#118ab2" stroke-width="7"/>
      <path d="M72 250 L330 75" fill="none" stroke="#ef476f" stroke-width="7"/>
      ${t(216,304,"time →","sv-small","middle")} <text x="28" y="170" class="sv-small" transform="rotate(-90 28 170)" font-family="Poppins, sans-serif">distance →</text>
      ${t(348,122,"faster = steeper","sv-note","middle")} ${t(342,181,"slower","sv-note","middle")}
    </g>
  `,"Runner and cyclist compared with distance-time graph slopes");};

  SCENE.u1t3=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,46,"Net force is the vector sum of all forces","sv-title","middle")}
    <rect x="0" y="390" width="1000" height="130" fill="#ece8df"/>
    ${person(250,320,1.05,"#4361ee")}
    <rect x="430" y="250" width="190" height="140" rx="18" fill="#ffd166" stroke="#d59b00" stroke-width="4"/>
    <path d="M320 305 H430" stroke="#f2c9a5" stroke-width="18" stroke-linecap="round"/>
    <path d="M525 236 H760" stroke="#ef476f" stroke-width="11" marker-end="url(#arr)"/>
    <path d="M525 404 H390" stroke="#118ab2" stroke-width="8" marker-end="url(#arrB)"/>
    <path d="M525 248 V120" stroke="#2a9d6f" stroke-width="9" marker-end="url(#arrG)"/>
    <path d="M525 390 V500" stroke="#6a4c93" stroke-width="9" marker-end="url(#arrB)"/>
    ${t(772,232,"applied force","sv-label")} ${t(280,418,"friction","sv-label")} ${t(550,110,"normal force","sv-label")} ${t(550,492,"gravity","sv-label")}
    <rect x="690" y="318" width="245" height="90" rx="18" fill="#ffe4e8"/>
    ${t(812,352,"NET FORCE →","sv-label","middle")} ${t(812,382,"box accelerates right","sv-note","middle")}
  `,"Person pushing a box with applied force, friction, normal force, and gravity vectors");};

  SCENE.u1t4=function(){return svg(`
    <rect width="1000" height="520" fill="url(#sky)"/>
    ${t(500,48,"Friction transfers motion energy into thermal energy","sv-title","middle")}
    <rect y="380" width="1000" height="140" fill="#cfd3da"/>
    <g transform="translate(210 120)">
      <circle cx="120" cy="245" r="72" fill="none" stroke="#263149" stroke-width="16"/><circle cx="365" cy="245" r="72" fill="none" stroke="#263149" stroke-width="16"/>
      <path d="M120 245 L220 120 L300 245 H120Z" fill="none" stroke="#4361ee" stroke-width="14"/>
      <path d="M220 120 L365 245 L300 245" fill="none" stroke="#4361ee" stroke-width="14"/>
      <circle cx="220" cy="120" r="18" fill="#263149"/>
      <path d="M350 178 q32 10 18 46" fill="none" stroke="#ef476f" stroke-width="12"/>
      <path d="M355 165 q22 -26 44 -5M373 153 q20 -26 40 -3" fill="none" stroke="#f77f00" stroke-width="7" stroke-linecap="round"/>
    </g>
    <path d="M170 205 H85" stroke="#118ab2" stroke-width="8" marker-end="url(#arrB)"/>
    <path d="M710 212 H850" stroke="#f77f00" stroke-width="9" marker-end="url(#arr)"/>
    ${t(90,184,"slowing","sv-label")} ${t(850,188,"heat","sv-label","middle")} ${t(500,470,"Brake pads and tire-road friction oppose motion.","sv-note","middle")}
  `,"Bicycle braking with friction and thermal energy indicated");};

  SCENE.u1t5=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Same force — different acceleration","sv-title","middle")}
    <rect y="395" width="1000" height="125" fill="#e7e9ee"/>
    <g transform="translate(95 190)">
      <rect width="245" height="130" rx="20" fill="#bde0fe" stroke="#118ab2" stroke-width="4"/><circle cx="55" cy="140" r="22" fill="#263149"/><circle cx="190" cy="140" r="22" fill="#263149"/>
      ${t(122,72,"20 kg","sv-title","middle")}<path d="M245 65 H390" stroke="#ef476f" stroke-width="10" marker-end="url(#arr)"/>${t(320,48,"100 N","sv-small","middle")}
      <path d="M95 185 H285" stroke="#2a9d6f" stroke-width="10" marker-end="url(#arrG)"/>${t(190,225,"larger acceleration","sv-small","middle")}
    </g>
    <g transform="translate(555 190)">
      <rect width="300" height="130" rx="20" fill="#d7c3f1" stroke="#6a4c93" stroke-width="4"/><circle cx="65" cy="140" r="22" fill="#263149"/><circle cx="235" cy="140" r="22" fill="#263149"/>
      ${t(150,72,"60 kg","sv-title","middle")}<path d="M300 65 H400" stroke="#ef476f" stroke-width="10" marker-end="url(#arr)"/>${t(350,48,"100 N","sv-small","middle")}
      <path d="M80 185 H180" stroke="#2a9d6f" stroke-width="10" marker-end="url(#arrG)"/>${t(145,225,"smaller acceleration","sv-small","middle")}
    </g>
  `,"Light and heavy carts pushed by the same force with different acceleration arrows");};

  SCENE.u1t6=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Newton’s Third Law during a collision","sv-title","middle")}
    <rect y="365" width="1000" height="155" fill="#e5e7ec"/>
    <g transform="translate(165 190)"><rect width="270" height="120" rx="22" fill="#52b6ff"/><circle cx="55" cy="130" r="24" fill="#263149"/><circle cx="215" cy="130" r="24" fill="#263149"/></g>
    <g transform="translate(565 190)"><rect width="270" height="120" rx="22" fill="#ff7b89"/><circle cx="55" cy="130" r="24" fill="#263149"/><circle cx="215" cy="130" r="24" fill="#263149"/></g>
    <path d="M505 220 H365" stroke="#118ab2" stroke-width="12" marker-end="url(#arrB)"/>
    <path d="M495 280 H635" stroke="#ef476f" stroke-width="12" marker-end="url(#arr)"/>
    ${t(340,205,"force on blue cart","sv-small","middle")} ${t(660,322,"force on red cart","sv-small","middle")}
    <rect x="330" y="80" width="340" height="72" rx="18" fill="#fff3d9" stroke="#f0cb72" stroke-width="3"/>
    ${t(500,124,"equal size • opposite direction","sv-label","middle")}
  `,"Two carts colliding with equal and opposite force arrows");};

  SCENE.u2=function(){return svg(`
    <rect width="1000" height="520" fill="url(#sky)"/>
    ${t(500,48,"A roller coaster trades height for speed","sv-title","middle")}
    <path d="M50 410 C130 405 175 110 310 120 S470 425 610 330 S760 120 950 250" fill="none" stroke="#6a4c93" stroke-width="18"/>
    <rect y="430" width="1000" height="90" fill="#e5e0d8"/>
    <g transform="translate(260 88)"><rect width="78" height="45" rx="8" fill="#ffd166"/><circle cx="18" cy="48" r="9" fill="#263149"/><circle cx="60" cy="48" r="9" fill="#263149"/></g>
    <g transform="translate(560 304) rotate(-18)"><rect width="78" height="45" rx="8" fill="#ff8fa3"/><circle cx="18" cy="48" r="9" fill="#263149"/><circle cx="60" cy="48" r="9" fill="#263149"/></g>
    ${t(300,78,"high PE","sv-label","middle")} ${t(605,290,"more KE","sv-label","middle")}
    <path d="M345 125 C430 150 490 235 535 300" fill="none" stroke="#ef476f" stroke-width="8" marker-end="url(#arr)"/>
  `,"Roller coaster showing gravitational potential energy changing to kinetic energy");};

  SCENE.u2t1=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Higher position = more gravitational potential energy","sv-title","middle")}
    <rect x="140" y="110" width="55" height="330" rx="16" fill="#c9a67b"/><rect x="195" y="125" width="520" height="32" rx="10" fill="#d7b78c"/><rect x="195" y="270" width="520" height="32" rx="10" fill="#d7b78c"/><rect x="195" y="410" width="520" height="32" rx="10" fill="#d7b78c"/>
    <rect x="320" y="65" width="110" height="60" rx="12" fill="#6a4c93"/><rect x="320" y="210" width="110" height="60" rx="12" fill="#9c83bd"/><rect x="320" y="350" width="110" height="60" rx="12" fill="#c7b8da"/>
    <path d="M770 408 V128" stroke="#ef476f" stroke-width="9" marker-end="url(#arr)"/>
    ${t(805,270,"height","sv-label")} ${t(520,102,"more stored energy","sv-label")} ${t(520,390,"less stored energy","sv-label")}
  `,"Same object on shelves at different heights showing different gravitational potential energy");};

  SCENE.u2t2=function(){return svg(`
    <rect width="1000" height="520" fill="#050b24"/>
    ${t(500,48,"Every mass attracts every other mass","sv-title","middle")}
    <circle cx="270" cy="265" r="120" fill="#3a86ff"/><path d="M200 230 q55 -45 120 0 q-25 55 -80 60 q-45 -12 -40 -60" fill="#52b788" opacity=".9"/>
    <circle cx="750" cy="265" r="58" fill="#ffd166"/>
    <path d="M420 265 H575" stroke="#ef476f" stroke-width="10" marker-end="url(#arr)"/>
    <path d="M600 300 H445" stroke="#118ab2" stroke-width="10" marker-end="url(#arrB)"/>
    ${t(270,430,"larger mass","sv-small","middle")} ${t(750,355,"smaller mass","sv-small","middle")}
    ${t(500,190,"gravitational attraction","sv-label","middle")}
    <path d="M400 410 H620" stroke="#fff" stroke-width="4" stroke-dasharray="10 10"/>
    ${t(510,448,"greater distance → weaker force","sv-note","middle")}
  `,"Two masses pulling toward one another with gravity arrows");};

  SCENE.u2t3=function(){return svg(`
    <rect width="1000" height="520" fill="url(#sky)"/>
    ${t(500,48,"As height falls, speed rises","sv-title","middle")}
    <path d="M80 390 Q260 130 480 130 Q690 130 920 390" fill="none" stroke="#6a4c93" stroke-width="18"/>
    <circle cx="260" cy="180" r="34" fill="#ffd166"/><circle cx="500" cy="133" r="34" fill="#ff9f1c"/><circle cx="770" cy="252" r="34" fill="#ef476f"/>
    <path d="M292 180 H350" stroke="#118ab2" stroke-width="7" marker-end="url(#arrB)"/>
    <path d="M804 250 H920" stroke="#ef476f" stroke-width="12" marker-end="url(#arr)"/>
    ${t(260,110,"more PE","sv-label","middle")} ${t(770,195,"more KE","sv-label","middle")} ${t(500,445,"energy shifts form as the object moves","sv-note","middle")}
  `,"Object moving downhill with potential energy decreasing and kinetic energy increasing");};

  SCENE.u3=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Electric current can create a magnetic field","sv-title","middle")}
    <rect x="110" y="220" width="170" height="95" rx="18" fill="#e7edf5"/><rect x="130" y="238" width="130" height="58" rx="12" fill="#d0d8e5"/>${t(195,275,"BATTERY","sv-small","middle")}
    <path d="M280 268 H410" stroke="#263149" stroke-width="8"/>
    <g transform="translate(410 195)"><rect x="0" y="50" width="230" height="45" rx="20" fill="#adb5bd"/><path d="M20 20 q20 60 40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#e76f51" stroke-width="12"/></g>
    <path d="M650 268 H835 V340 H195 V315" fill="none" stroke="#263149" stroke-width="8"/>
    <path d="M500 170 C650 85 790 130 840 250" fill="none" stroke="#1982c4" stroke-width="5" stroke-dasharray="10 10"/>
    <path d="M500 360 C650 445 790 400 840 280" fill="none" stroke="#1982c4" stroke-width="5" stroke-dasharray="10 10"/>
    ${t(625,118,"magnetic field around coil","sv-label","middle")}
  `,"Battery and coil creating a magnetic field");};

  SCENE.u3t1=function(){return svg(`
    <rect width="1000" height="520" fill="#fffaf4"/>
    ${t(500,48,"Magnetic fields fill the space around a magnet","sv-title","middle")}
    <rect x="390" y="205" width="220" height="100" rx="18" fill="#fff" stroke="#263149" stroke-width="4"/><rect x="390" y="205" width="110" height="100" rx="18" fill="#e63946"/><rect x="500" y="205" width="110" height="100" rx="18" fill="#1982c4"/>
    ${t(445,268,"N","sv-title","middle")} ${t(555,268,"S","sv-title","middle")}
    <path d="M385 225 C250 120 180 150 160 255 C180 355 250 390 385 286" fill="none" stroke="#6a4c93" stroke-width="5"/>
    <path d="M615 225 C750 120 820 150 840 255 C820 355 750 390 615 286" fill="none" stroke="#6a4c93" stroke-width="5"/>
    <path d="M390 190 C420 110 580 110 610 190" fill="none" stroke="#6a4c93" stroke-width="5"/>
    <path d="M390 320 C420 400 580 400 610 320" fill="none" stroke="#6a4c93" stroke-width="5"/>
    <g fill="#6a4c93" opacity=".65"><circle cx="260" cy="195" r="5"/><circle cx="235" cy="270" r="5"/><circle cx="270" cy="335" r="5"/><circle cx="740" cy="195" r="5"/><circle cx="765" cy="270" r="5"/><circle cx="730" cy="335" r="5"/></g>
    ${t(500,452,"Field lines show direction and shape, not physical strings.","sv-note","middle")}
  `,"Bar magnet with curved magnetic field lines and iron filings");};

  SCENE.u3t2=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"A current-carrying coil becomes an electromagnet","sv-title","middle")}
    <rect x="105" y="310" width="150" height="85" rx="18" fill="#eef1f5" stroke="#adb5bd" stroke-width="3"/>${t(180,362,"BATTERY","sv-small","middle")}
    <circle cx="338" cy="352" r="26" fill="#fff" stroke="#263149" stroke-width="6"/><path d="M318 352 H358" stroke="#263149" stroke-width="6"/>
    <path d="M255 352 H312 M364 352 H440" stroke="#263149" stroke-width="7"/>
    <g transform="translate(440 215)"><rect x="0" y="70" width="250" height="46" rx="22" fill="#9da8b6"/><path d="M20 20 q20 78 40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#e76f51" stroke-width="12"/></g>
    <path d="M690 352 H845 V395 H180" fill="none" stroke="#263149" stroke-width="7"/>
    <path d="M485 205 C610 95 770 125 815 250" fill="none" stroke="#1982c4" stroke-width="5" stroke-dasharray="9 10"/>
    <path d="M485 385 C610 475 770 440 815 305" fill="none" stroke="#1982c4" stroke-width="5" stroke-dasharray="9 10"/>
    <g fill="#8c96a8"><circle cx="770" cy="275" r="9"/><circle cx="815" cy="315" r="9"/><circle cx="740" cy="340" r="9"/></g>
    ${t(500,175,"current through coil","sv-label","middle")} ${t(805,220,"magnetic field","sv-label","middle")}
  `,"Electromagnet circuit with battery, switch, coil, iron core, and magnetic field");};

  SCENE.u4=function(){return svg(`
    <rect width="1000" height="520" fill="#f8fbff"/>
    ${t(500,48,"Information rides on waves","sv-title","middle")}
    <g transform="translate(90 130)"><rect width="180" height="260" rx="28" fill="#263149"/><rect x="18" y="24" width="144" height="190" rx="16" fill="#dff3ff"/><circle cx="90" cy="235" r="12" fill="#8793a8"/>${t(90,120,"HELLO","sv-title","middle")}</g>
    <path d="M300 260 Q340 185 380 260 T460 260 T540 260 T620 260" fill="none" stroke="#00a0c4" stroke-width="10"/>
    <g transform="translate(700 130)"><rect width="180" height="260" rx="28" fill="#263149"/><rect x="18" y="24" width="144" height="190" rx="16" fill="#dff3ff"/><circle cx="90" cy="235" r="12" fill="#8793a8"/>${t(90,120,"HELLO","sv-title","middle")}</g>
    ${t(500,420,"sender → wave signal → receiver","sv-label","middle")}
  `,"Two phones communicating with a wave signal");};

  SCENE.u4t1=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Three ways to describe a wave","sv-title","middle")}
    <line x1="70" y1="270" x2="930" y2="270" stroke="#aab3c1" stroke-width="3" stroke-dasharray="10 10"/>
    <path d="M70 270 Q145 110 220 270 T370 270 T520 270 T670 270 T820 270 T930 270" fill="none" stroke="#00a0c4" stroke-width="9"/>
    <path d="M145 270 V110" stroke="#ef476f" stroke-width="7" marker-end="url(#arr)"/>${t(165,182,"amplitude","sv-label")}
    <path d="M145 90 H445" stroke="#118ab2" stroke-width="6" marker-end="url(#arrB)"/><path d="M445 90 H155" stroke="#118ab2" stroke-width="6" marker-end="url(#arrB)"/>${t(300,72,"wavelength","sv-label","middle")}
    <rect x="715" y="335" width="190" height="90" rx="18" fill="#e5f8ef"/>${t(810,370,"frequency","sv-label","middle")}${t(810,398,"waves per second","sv-note","middle")}
  `,"Wave labeled with amplitude, wavelength, and frequency");};

  SCENE.u4t2=function(){return svg(`
    <rect width="1000" height="520" fill="#071224"/>
    ${t(500,48,"A prism separates white light by wavelength","sv-title","middle")}
    <circle cx="120" cy="250" r="58" fill="#ffd166"/>
    <path d="M175 250 H405" stroke="#fff" stroke-width="14"/>
    <path d="M455 120 L590 380 L355 380Z" fill="#dff3ff" opacity=".55" stroke="#b5dfff" stroke-width="5"/>
    <path d="M480 250 L900 135" stroke="#e63946" stroke-width="10"/>
    <path d="M480 255 L900 185" stroke="#ff9f1c" stroke-width="10"/>
    <path d="M480 260 L900 235" stroke="#ffd166" stroke-width="10"/>
    <path d="M480 265 L900 285" stroke="#52b788" stroke-width="10"/>
    <path d="M480 270 L900 335" stroke="#3a86ff" stroke-width="10"/>
    <path d="M480 275 L900 385" stroke="#8338ec" stroke-width="10"/>
    ${t(230,225,"white light","sv-label","middle")} ${t(755,455,"visible spectrum","sv-label","middle")}
  `,"White light entering a prism and separating into a visible color spectrum");};

  SCENE.u4t3=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Analog and digital encode information differently","sv-title","middle")}
    <rect x="60" y="105" width="410" height="315" rx="24" fill="#fff" stroke="#e6e8f0" stroke-width="3"/>
    <rect x="530" y="105" width="410" height="315" rx="24" fill="#fff" stroke="#e6e8f0" stroke-width="3"/>
    ${t(265,145,"ANALOG","sv-small","middle")} ${t(735,145,"DIGITAL","sv-small","middle")}
    <path d="M95 280 Q140 175 185 280 T275 280 T365 280 T435 280" fill="none" stroke="#00a0c4" stroke-width="8"/>
    <path d="M565 320 V220 H635 V320 H705 V200 H775 V320 H845 V235 H905" fill="none" stroke="#6a4c93" stroke-width="8"/>
    <path d="M120 350 q40 -65 80 0 t80 0 t80 0" fill="none" stroke="#ef476f" stroke-width="3" stroke-dasharray="8 8" opacity=".6"/>
    <g class="sv-small" fill="#263149" font-family="Poppins, sans-serif"><text x="590" y="382">0</text><text x="655" y="382">1</text><text x="725" y="382">0</text><text x="795" y="382">1</text><text x="865" y="382">0</text></g>
  `,"Side-by-side analog and digital signal diagrams");};

  SCENE.u5=function(){return svg(`
    <rect width="1000" height="520" fill="#fffaf4"/>
    ${t(500,48,"Thermal energy moves from warmer to cooler","sv-title","middle")}
    <g transform="translate(245 145)"><rect x="0" y="40" width="270" height="180" rx="26" fill="#fff" stroke="#ded9d1" stroke-width="4"/><path d="M270 88 q95 -20 95 65 q0 85 -95 55" fill="none" stroke="#ded9d1" stroke-width="24"/><path d="M60 30 q-25 -70 20 -100 M130 30 q-25 -70 20 -100 M200 30 q-25 -70 20 -100" fill="none" stroke="#f77f00" stroke-width="8" stroke-linecap="round"/></g>
    <path d="M540 250 H810" stroke="#f77f00" stroke-width="12" marker-end="url(#arr)"/>
    ${t(660,225,"thermal energy","sv-label","middle")} ${t(355,410,"hot cocoa","sv-label","middle")} ${t(835,260,"cool room","sv-label","middle")}
  `,"Hot mug transferring thermal energy to cooler surrounding air");};

  SCENE.u5t1=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Heat flows until temperatures move toward equilibrium","sv-title","middle")}
    <rect x="130" y="170" width="245" height="220" rx="24" fill="#ffb36b" stroke="#f77f00" stroke-width="4"/>
    <rect x="625" y="170" width="245" height="220" rx="24" fill="#a7d8ff" stroke="#1982c4" stroke-width="4"/>
    ${t(252,265,"80°C","sv-title","middle")} ${t(748,265,"20°C","sv-title","middle")}
    <path d="M400 240 H590" stroke="#f77f00" stroke-width="12" marker-end="url(#arr)"/>
    <path d="M400 310 H540" stroke="#f2a65a" stroke-width="8" marker-end="url(#arr)"/>
    ${t(500,205,"thermal energy","sv-label","middle")}
    <rect x="335" y="410" width="330" height="65" rx="18" fill="#e5f8ef"/>${t(500,451,"eventually: temperatures become closer","sv-note","middle")}
  `,"Hot block transferring thermal energy to cold block toward equilibrium");};

  SCENE.u5t2=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Temperature reflects average particle motion","sv-title","middle")}
    <rect x="85" y="110" width="380" height="330" rx="26" fill="#dff3ff" stroke="#1982c4" stroke-width="4"/>
    <rect x="535" y="110" width="380" height="330" rx="26" fill="#fff0dc" stroke="#f77f00" stroke-width="4"/>
    ${t(275,150,"COOLER","sv-small","middle")} ${t(725,150,"WARMER","sv-small","middle")}
    <g fill="#1982c4"><circle cx="180" cy="230" r="16"/><circle cx="300" cy="210" r="16"/><circle cx="230" cy="330" r="16"/><circle cx="365" cy="325" r="16"/></g>
    <g stroke="#1982c4" stroke-width="5"><path d="M180 205l18 -10"/><path d="M300 185l12 -8"/><path d="M230 305l14 -5"/><path d="M365 300l10 -7"/></g>
    <g fill="#f77f00"><circle cx="630" cy="225" r="16"/><circle cx="770" cy="205" r="16"/><circle cx="690" cy="340" r="16"/><circle cx="840" cy="320" r="16"/></g>
    <g stroke="#ef476f" stroke-width="7"><path d="M630 190l42 -25"/><path d="M770 170l55 -18"/><path d="M690 305l50 -30"/><path d="M840 285l40 -38"/></g>
    ${t(275,405,"shorter motion arrows","sv-note","middle")} ${t(725,405,"longer motion arrows","sv-note","middle")}
  `,"Cooler and warmer particle samples with different motion arrow lengths");};

  SCENE.u5t3=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Heating changes particle arrangement and freedom of motion","sv-title","middle")}
    <g transform="translate(45 120)"><rect width="270" height="315" rx="24" fill="#e8f3ff"/>${t(135,42,"SOLID","sv-small","middle")}<g fill="#1982c4"><circle cx="70" cy="110" r="16"/><circle cx="120" cy="110" r="16"/><circle cx="170" cy="110" r="16"/><circle cx="70" cy="160" r="16"/><circle cx="120" cy="160" r="16"/><circle cx="170" cy="160" r="16"/><circle cx="70" cy="210" r="16"/><circle cx="120" cy="210" r="16"/><circle cx="170" cy="210" r="16"/></g>${t(135,278,"packed + vibrating","sv-note","middle")}</g>
    <g transform="translate(365 120)"><rect width="270" height="315" rx="24" fill="#eaf9f1"/>${t(135,42,"LIQUID","sv-small","middle")}<g fill="#2a9d6f"><circle cx="66" cy="180" r="16"/><circle cx="118" cy="145" r="16"/><circle cx="168" cy="195" r="16"/><circle cx="205" cy="135" r="16"/><circle cx="95" cy="235" r="16"/><circle cx="190" cy="245" r="16"/></g>${t(135,278,"close + sliding","sv-note","middle")}</g>
    <g transform="translate(685 120)"><rect width="270" height="315" rx="24" fill="#fff3df"/>${t(135,42,"GAS","sv-small","middle")}<g fill="#f77f00"><circle cx="60" cy="110" r="16"/><circle cx="210" cy="92" r="16"/><circle cx="150" cy="190" r="16"/><circle cx="72" cy="250" r="16"/><circle cx="220" cy="245" r="16"/></g>${t(135,278,"far apart + fast","sv-note","middle")}</g>
    <path d="M318 280 H350" stroke="#ef476f" stroke-width="8" marker-end="url(#arr)"/><path d="M638 280 H670" stroke="#ef476f" stroke-width="8" marker-end="url(#arr)"/>
  `,"Particle diagrams for solid, liquid, and gas with heating arrows");};

  SCENE.u6=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Chemical reactions rearrange atoms","sv-title","middle")}
    <g transform="translate(110 190)"><circle cx="0" cy="0" r="38" fill="#2a9d6f"/><circle cx="78" cy="0" r="38" fill="#ffd166"/></g>
    <text x="300" y="205" font-size="56" font-weight="800" fill="#263149" font-family="Poppins, sans-serif">+</text>
    <g transform="translate(390 190)"><circle cx="0" cy="0" r="38" fill="#2a9d6f"/><circle cx="78" cy="0" r="38" fill="#ffd166"/></g>
    <path d="M520 190 H675" stroke="#ef476f" stroke-width="10" marker-end="url(#arr)"/>
    <g transform="translate(760 190)"><circle cx="0" cy="0" r="38" fill="#2a9d6f"/><circle cx="68" cy="-35" r="38" fill="#ffd166"/><circle cx="68" cy="35" r="38" fill="#ffd166"/><circle cx="136" cy="0" r="38" fill="#2a9d6f"/></g>
    ${t(500,390,"same atoms • new arrangement • new substances","sv-label","middle")}
  `,"Chemical reaction showing atoms rearranging but being conserved");};

  SCENE.u6t1=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Molecular models show which atoms are present","sv-title","middle")}
    <g transform="translate(110 120)"><rect width="350" height="320" rx="26" fill="#eaf7ff"/>${t(175,45,"WATER — H₂O","sv-small","middle")}<circle cx="175" cy="170" r="62" fill="#1982c4"/><circle cx="95" cy="130" r="40" fill="#f8f9fa" stroke="#aab3c1" stroke-width="3"/><circle cx="255" cy="130" r="40" fill="#f8f9fa" stroke="#aab3c1" stroke-width="3"/>${t(175,178,"O","sv-title","middle")}${t(95,138,"H","sv-title","middle")}${t(255,138,"H","sv-title","middle")}</g>
    <g transform="translate(540 120)"><rect width="350" height="320" rx="26" fill="#fff2e1"/>${t(175,45,"CARBON DIOXIDE — CO₂","sv-small","middle")}<circle cx="175" cy="170" r="55" fill="#495057"/><circle cx="70" cy="170" r="52" fill="#e63946"/><circle cx="280" cy="170" r="52" fill="#e63946"/>${t(175,178,"C","sv-title","middle")}${t(70,178,"O","sv-title","middle")}${t(280,178,"O","sv-title","middle")}</g>
  `,"Molecular models of water and carbon dioxide with labeled atoms");};

  SCENE.u6t2=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Physical change vs. chemical change","sv-title","middle")}
    <rect x="55" y="100" width="420" height="340" rx="28" fill="#eaf7ff" stroke="#cde8f7" stroke-width="3"/>
    <rect x="525" y="100" width="420" height="340" rx="28" fill="#fff0dc" stroke="#f7d7ad" stroke-width="3"/>
    ${t(265,145,"PHYSICAL CHANGE","sv-small","middle")} ${t(735,145,"CHEMICAL CHANGE","sv-small","middle")}
    <rect x="130" y="205" width="105" height="105" rx="16" fill="#bde0fe"/><path d="M275 258 H365" stroke="#118ab2" stroke-width="8" marker-end="url(#arrB)"/><path d="M375 220 q45 40 0 80 q-45 -40 0 -80" fill="#7cc8f8"/>
    ${t(265,365,"ice melts → still H₂O","sv-note","middle")}
    <rect x="600" y="210" width="80" height="120" rx="10" fill="#adb5bd"/><path d="M600 245 q40 -45 80 0 v85 h-80z" fill="#c46a2d" opacity=".75"/><path d="M720 258 H815" stroke="#ef476f" stroke-width="8" marker-end="url(#arr)"/>
    ${t(735,365,"iron rusts → new substance","sv-note","middle")}
  `,"Side-by-side melting ice and rusting iron to compare physical and chemical changes");};

  SCENE.u6t3=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Count the atoms before and after","sv-title","middle")}
    <rect x="75" y="105" width="360" height="330" rx="28" fill="#fff" stroke="#dfe4ec" stroke-width="4"/>
    <rect x="565" y="105" width="360" height="330" rx="28" fill="#fff" stroke="#dfe4ec" stroke-width="4"/>
    ${t(255,145,"BEFORE","sv-small","middle")} ${t(745,145,"AFTER","sv-small","middle")}
    <g fill="#2a9d6f"><circle cx="175" cy="235" r="34"/><circle cx="325" cy="315" r="34"/></g><g fill="#ffd166"><circle cx="250" cy="235" r="34"/><circle cx="250" cy="315" r="34"/></g>
    <g fill="#2a9d6f"><circle cx="665" cy="235" r="34"/><circle cx="825" cy="315" r="34"/></g><g fill="#ffd166"><circle cx="740" cy="235" r="34"/><circle cx="750" cy="315" r="34"/></g>
    <path d="M450 270 H545" stroke="#ef476f" stroke-width="9" marker-end="url(#arr)"/>
    <rect x="330" y="455" width="340" height="46" rx="16" fill="#e5f8ef"/>${t(500,486,"2 green atoms + 2 yellow atoms on both sides","sv-note","middle")}
  `,"Before-and-after reaction diagram with the same atom counts");};

  SCENE.u6t4=function(){return svg(`
    <rect width="1000" height="520" fill="#fbfcff"/>
    ${t(500,48,"Compare materials by evidence, not by the label alone","sv-title","middle")}
    <rect x="65" y="100" width="390" height="335" rx="28" fill="#e9f7f1" stroke="#bfe7d3" stroke-width="3"/>
    <rect x="545" y="100" width="390" height="335" rx="28" fill="#eee7f8" stroke="#d8c7eb" stroke-width="3"/>
    ${t(260,145,"NATURAL SOURCE","sv-small","middle")} ${t(740,145,"SYNTHETIC SOURCE","sv-small","middle")}
    <path d="M220 330 C170 260 180 190 260 175 C330 205 320 285 260 350Z" fill="#52b788"/><path d="M260 188 V345" stroke="#2a9d6f" stroke-width="7"/>
    <path d="M675 200 h130 l55 120 q12 45 -38 70 h-165 q-50 -25 -38 -70z" fill="#cdb4db" stroke="#6a4c93" stroke-width="4"/><path d="M710 200 v-45 h60 v45" fill="none" stroke="#6a4c93" stroke-width="14"/>
    <path d="M455 270 H545" stroke="#263149" stroke-width="5" stroke-dasharray="10 10"/>
    ${t(500,250,"compare","sv-label","middle")} ${t(500,300,"composition • properties • evidence","sv-note","middle")}
  `,"Natural and synthetic material sources compared using composition and properties");};

  function style(){
    if(document.getElementById('science-visual-style')) return;
    var s=document.createElement('style'); s.id='science-visual-style'; s.textContent=CSS; document.head.appendChild(s);
  }
  function run(){
    var f=file(), cfg=PAGES[f]; if(!cfg || document.querySelector('.science-visual')) return;
    var fn=SCENE[cfg[1]]; if(!fn) return;
    var main=document.querySelector('main.container'); if(!main) return;
    style();
    var fig=document.createElement('figure'); fig.className='science-visual';
    fig.innerHTML='<div class="science-visual-stage">'+fn()+'</div><figcaption><strong>'+safe(cfg[0])+':</strong> '+safe(cfg[2])+'</figcaption>';
    var callout=main.querySelector(':scope > .callout');
    if(callout) callout.insertAdjacentElement('afterend',fig); else main.insertBefore(fig,main.firstChild);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
