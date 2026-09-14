/* Physical Science 8 — shared chapter infographic cards */
(function(){
  "use strict";

  var PAGE = {
    "index.html":{type:"overview",title:"Physical Science 8",icons:["u1-t3","u2-t2","u3-t1","u4-t1","u5-t1","u6-t1"],labels:["Motion","Gravity","Fields","Waves","Heat","Matter"],caption:"Six big ideas connect the course. Energy, forces, and interactions appear in different forms in every unit."},
    "glossary.html":{type:"overview",title:"Science Vocabulary Map",icons:["u1-t2","u2-t1","u3-t2","u4-t2","u5-t2","u6-t3"],labels:["Motion","Energy","Fields","Light","Particles","Reactions"],caption:"Vocabulary is easier to remember when terms are connected to the system they describe. Use this map to link words back to the six units."},

    "u1.html":{type:"overview",title:"Energy of Motion",icons:["u1-t1","u1-t2","u1-t3","u1-t4","u1-t5","u1-t6"],labels:["Reference","Speed","Forces","Friction","Acceleration","Collisions"],caption:"A crash is a chain of motion, forces, friction, acceleration, and collision forces. Each chapter explains one piece of the event."},
    "u1-t1.html":{title:"Frames of Reference",icon:"u1-t1",labels:["reference point","direction","relative motion"],caption:"The same car can be still relative to a passenger but moving quickly relative to the road. Motion only has meaning when a reference point is named."},
    "u1-t2.html":{title:"Speed and Distance/Time Graphs",icon:"u1-t2",labels:["distance","time","slope = speed"],caption:"On a distance–time graph, a steeper line means faster motion. A flat line means distance is not changing."},
    "u1-t3.html":{title:"Inertia and Net Forces",icon:"u1-t3",labels:["inertia","net force","change in motion"],caption:"When a vehicle stops suddenly, an unrestrained object keeps moving until another force changes its motion."},
    "u1-t4.html":{title:"Energy Transfer via Friction",icon:"u1-t4",labels:["friction","motion energy","thermal energy"],caption:"Friction transforms organized motion energy into thermal energy, which is why brakes, tires, and sliding surfaces can heat up."},
    "u1-t5.html":{title:"Mass and Acceleration",icon:"u1-t5",labels:["force","mass","acceleration"],caption:"For the same push, a smaller mass accelerates more. For the same mass, a larger net force produces more acceleration: F = ma."},
    "u1-t6.html":{title:"Collisions and Newton’s Third Law",icon:"u1-t6",labels:["action","reaction","equal + opposite"],caption:"During a collision, each object pushes on the other with an equal-size force in the opposite direction."},

    "u2.html":{type:"overview",title:"Gravity & Energy Related to Position",icons:["u2-t1","u2-t2","u2-t3"],labels:["Potential Energy","Gravity","Energy Change"],caption:"Height can store gravitational potential energy. As an object falls, gravity transfers that stored energy into motion."},
    "u2-t1.html":{title:"Gravitational Potential Energy",icon:"u2-t1",labels:["mass","height","stored energy"],caption:"Gravitational potential energy increases when mass or height increases. Lifting an object stores energy in the object–Earth system."},
    "u2-t2.html":{title:"Universal Law of Gravity",icon:"u2-t2",labels:["mass","distance","attraction"],caption:"Every pair of masses attracts. More mass makes gravity stronger; more distance makes the gravitational force weaker."},
    "u2-t3.html":{title:"Potential Energy → Kinetic Energy",icon:"u2-t3",labels:["height decreases","speed increases","energy conserved"],caption:"As a falling object loses height, gravitational potential energy decreases while kinetic energy increases. Energy changes form rather than disappearing."},

    "u3.html":{type:"overview",title:"Electricity & Magnetism",icons:["u3-t1","u3-t2"],labels:["Magnetism","Electromagnetic Fields"],caption:"Magnets and electric currents create fields that can push or pull without touching. Electromagnets show how electricity and magnetism connect."},
    "u3-t1.html":{title:"Magnetism",icon:"u3-t1",labels:["north + south","field lines","push / pull"],caption:"Magnetic fields surround magnets. Field direction and strength explain why magnetic objects can attract or repel without touching."},
    "u3-t2.html":{title:"Electromagnetic Fields",icon:"u3-t2",labels:["electric current","coil","magnetic field"],caption:"Current flowing through a coil creates a magnetic field. More turns and an iron core can make an electromagnet stronger."},

    "u4.html":{type:"overview",title:"Waves Transmitting Energy & Information",icons:["u4-t1","u4-t2","u4-t3"],labels:["Wave Properties","Light","Digital Information"],caption:"Waves carry energy and information. Their amplitude, wavelength, frequency, and speed determine how they behave."},
    "u4-t1.html":{title:"Wave Properties",icon:"u4-t1",labels:["amplitude","wavelength","frequency"],caption:"Amplitude measures wave height, wavelength measures spacing, and frequency tells how often waves pass a point."},
    "u4-t2.html":{title:"Light Waves",icon:"u4-t2",labels:["wavelength","refraction","spectrum"],caption:"White light contains many wavelengths. A prism bends different wavelengths by different amounts, separating the visible spectrum."},
    "u4-t3.html":{title:"Waves & Information Technology",icon:"u4-t3",labels:["signal","0s + 1s","noise resistance"],caption:"Digital systems encode information as distinct values such as 0s and 1s, helping signals survive noise and be copied accurately."},

    "u5.html":{type:"overview",title:"Thermal Energy & Heat Flow",icons:["u5-t1","u5-t2","u5-t3"],labels:["Temperature","Particle Motion","Phase Change"],caption:"Thermal energy moves from warmer objects to cooler ones. At the particle level, heating usually means more vigorous motion."},
    "u5-t1.html":{title:"Energy Transfer and Temperature",icon:"u5-t1",labels:["hot → cold","temperature","equilibrium"],caption:"Heat flows from higher temperature to lower temperature until objects approach thermal equilibrium."},
    "u5-t2.html":{title:"Energy at the Molecular Level",icon:"u5-t2",labels:["particles","kinetic energy","temperature"],caption:"Warmer matter has faster-moving particles on average. Cooling removes thermal energy, so particle motion slows."},
    "u5-t3.html":{title:"Phase Changes and Energy Transfer",icon:"u5-t3",labels:["solid","liquid","gas"],caption:"During melting or boiling, added energy changes particle arrangement and freedom of motion instead of immediately raising temperature."},

    "u6.html":{type:"overview",title:"Chemical Energy & Reactions",icons:["u6-t1","u6-t2","u6-t3","u6-t4"],labels:["Molecules","Properties","Conservation","Natural / Synthetic"],caption:"Chemistry tracks which atoms are present, how they are connected, and how those connections change during reactions."},
    "u6-t1.html":{title:"Molecular Composition",icon:"u6-t1",labels:["elements","atom count","arrangement"],caption:"A molecule’s composition tells which elements are present and how many atoms of each are connected. Arrangement helps determine properties."},
    "u6-t2.html":{title:"Physical and Chemical Properties",icon:"u6-t2",labels:["observe","measure","react"],caption:"Physical properties can be observed without making a new substance. Chemical properties describe how a substance can react and form new substances."},
    "u6-t3.html":{title:"Conservation of Matter",icon:"u6-t3",labels:["same atoms","new arrangement","matter conserved"],caption:"Chemical reactions rearrange atoms; they do not create or destroy them. The total amount of matter stays the same."},
    "u6-t4.html":{title:"Synthetic vs. Natural",icon:"u6-t4",labels:["origin","composition","properties"],caption:"“Natural” describes origin and “synthetic” describes how a material was made. Both should be compared using evidence about their actual properties."}
  };

  var CSS = `
  .science-visual{margin:28px 0 34px;background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden;box-shadow:var(--shadow);}
  .science-visual-stage{position:relative;min-height:330px;padding:42px 28px 26px;background:radial-gradient(circle at 18% 20%,var(--accent-tint),transparent 34%),linear-gradient(145deg,#fff 35%,var(--accent-tint));display:flex;align-items:center;justify-content:center;}
  .science-visual-badge{position:absolute;top:16px;left:18px;padding:6px 11px;border-radius:999px;background:rgba(255,255,255,.94);border:1px solid var(--line);font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-dark);box-shadow:var(--shadow-sm);}
  .science-visual-grid{width:100%;display:grid;grid-template-columns:minmax(220px,.9fr) minmax(320px,1.25fr);gap:28px;align-items:center;}
  .science-visual-core{position:relative;min-height:235px;display:grid;place-items:center;}
  .science-visual-orb{width:190px;height:190px;border-radius:50%;display:grid;place-items:center;color:var(--accent);background:linear-gradient(145deg,#fff,var(--accent-tint));border:1px solid var(--line);box-shadow:0 18px 45px -20px rgba(20,25,50,.35);}
  .science-visual-orb svg{width:132px;height:132px;}
  .science-visual-ring{position:absolute;width:230px;height:230px;border:2px dashed color-mix(in srgb,var(--accent) 40%,transparent);border-radius:50%;}
  .science-visual-title{text-align:center;font-size:1.1rem;font-weight:800;color:var(--ink);margin-top:12px;}
  .science-concepts{display:grid;gap:12px;}
  .science-concept{display:grid;grid-template-columns:42px 1fr;gap:12px;align-items:center;padding:13px 15px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.88);box-shadow:var(--shadow-sm);font-weight:700;color:var(--ink);}
  .science-concept .n{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--accent);color:#fff;font-weight:800;}
  .science-flow{display:flex;align-items:center;gap:8px;color:var(--accent-dark);font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin:4px 0 2px 54px;}
  .science-flow:after{content:'→';font-size:1.2rem;}
  .science-visual figcaption{padding:14px 18px 16px;border-top:1px solid var(--line);font-size:.9rem;line-height:1.55;color:var(--ink-soft);background:#fff;}
  .science-visual figcaption strong{color:var(--ink);}
  .science-overview{width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:14px;align-items:stretch;}
  .science-overview-item{min-height:180px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 10px;text-align:center;box-shadow:var(--shadow-sm);}
  .science-overview-item .oi{width:78px;height:78px;border-radius:22px;background:var(--accent-tint);color:var(--accent);display:grid;place-items:center;}
  .science-overview-item .oi svg{width:58px;height:58px;}
  .science-overview-item span{font-size:.82rem;font-weight:800;color:var(--ink);line-height:1.25;}
  @media(max-width:760px){.science-visual{border-radius:16px;margin:22px 0 28px}.science-visual-stage{min-height:0;padding:48px 14px 18px}.science-visual-grid{grid-template-columns:1fr;gap:10px}.science-visual-core{min-height:205px}.science-visual-orb{width:160px;height:160px}.science-visual-orb svg{width:110px;height:110px}.science-visual-ring{width:195px;height:195px}.science-overview{grid-template-columns:repeat(2,1fr)}.science-overview-item{min-height:145px}.science-visual figcaption{font-size:.82rem;padding:12px 14px 14px}}
  @media(prefers-reduced-motion:no-preference){.science-visual{animation:svIn .4s ease both}.science-visual-ring{animation:svSpin 18s linear infinite}.science-visual-orb{animation:svFloat 3.2s ease-in-out infinite alternate}}
  @keyframes svIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes svSpin{to{transform:rotate(360deg)}}@keyframes svFloat{to{transform:translateY(-6px)}}`;

  function file(){var p=location.pathname.split('/').filter(Boolean);var f=p[p.length-1]||'index.html';return f.indexOf('.')<0?'index.html':f;}
  function safe(s){return String(s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
  function icon(k){return (window.ICONS&&window.ICONS[k])||'';}
  function style(){if(document.getElementById('science-visual-style'))return;var s=document.createElement('style');s.id='science-visual-style';s.textContent=CSS;document.head.appendChild(s);}
  function topicHTML(c){var rows=c.labels.map(function(x,i){return '<div class="science-concept"><span class="n">'+(i+1)+'</span><span>'+safe(x)+'</span></div>'+(i<c.labels.length-1?'<div class="science-flow">connects to</div>':'');}).join('');return '<div class="science-visual-grid"><div><div class="science-visual-core"><div class="science-visual-ring"></div><div class="science-visual-orb">'+icon(c.icon)+'</div></div><div class="science-visual-title">'+safe(c.title)+'</div></div><div class="science-concepts">'+rows+'</div></div>';}
  function overviewHTML(c){return '<div class="science-overview">'+c.icons.map(function(k,i){return '<div class="science-overview-item"><div class="oi">'+icon(k)+'</div><span>'+safe(c.labels[i]||'')+'</span></div>';}).join('')+'</div>';}
  function run(){var c=PAGE[file()];if(!c||document.querySelector('.science-visual'))return;var main=document.querySelector('main.container');if(!main)return;style();var fig=document.createElement('figure');fig.className='science-visual';fig.innerHTML='<div class="science-visual-stage"><div class="science-visual-badge">Visual Guide</div>'+(c.type==='overview'?overviewHTML(c):topicHTML(c))+'</div><figcaption><strong>'+safe(c.title)+':</strong> '+safe(c.caption)+'</figcaption>';var callout=main.querySelector(':scope > .callout');if(callout)callout.insertAdjacentElement('afterend',fig);else main.insertBefore(fig,main.firstChild);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
