/* Physical Science 8 — approved chapter-specific poster loader */
(function(){
  'use strict';

  var page=(location.pathname.split('/').pop()||'');
  var chapter=/^u[1-6]-t[1-6]\.html$/.test(page) ? page.replace('.html','') : null;

  function removeOldVisuals(){
    document.querySelectorAll('.science-visual,.rich-visual,.chapter-infographic,.science-overview,.visual-guide').forEach(function(el){el.remove();});
  }

  if(!chapter){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removeOldVisuals);
    else removeOldVisuals();
    return;
  }

  var captions={
    'u1-t1':'Frames of Reference: the same motion can be described differently from different reference points.',
    'u1-t2':'Speed and Distance-Time Graphs: graph slope shows how quickly distance changes with time.',
    'u1-t3':'Inertia and Net Forces: balanced and unbalanced forces explain when motion changes.',
    'u1-t4':'Energy Transfer via Friction: friction can slow motion and convert motion energy into thermal energy.',
    'u1-t5':'Mass and Acceleration: acceleration depends on both applied force and mass.',
    'u1-t6':'Collisions and Newton’s Third Law: interaction forces come in equal-size, opposite-direction pairs.',
    'u2-t1':'Gravitational Potential Energy: greater height and mass can mean more stored gravitational energy.',
    'u2-t2':'Universal Law of Gravity: every mass attracts every other mass, with strength depending on mass and distance.',
    'u2-t3':'Potential Energy to Kinetic Energy: as height decreases, gravitational potential energy can become kinetic energy.',
    'u3-t1':'Magnetism: magnetic fields, poles, attraction, repulsion, and real-world magnetic effects.',
    'u3-t2':'Electromagnetic Fields: electric current in a coil can create a controllable magnetic field.',
    'u4-t1':'Wave Properties: amplitude, wavelength, frequency, and the transfer of energy by waves.',
    'u4-t2':'Light Waves: visible light contains different wavelengths that can be separated into colors.',
    'u4-t3':'Waves and Information Technology: communication systems encode and transmit information using waves.',
    'u5-t1':'Energy Transfer and Temperature: thermal energy moves from warmer objects toward cooler objects.',
    'u5-t2':'Energy at the Molecular Level: higher temperature corresponds to greater average particle motion.',
    'u5-t3':'Phase Changes and Energy Transfer: adding or removing energy can change a substance’s state.',
    'u6-t1':'Molecular Composition: different substances contain different combinations and arrangements of atoms.',
    'u6-t2':'Physical and Chemical Properties: physical changes differ from chemical changes that form new substances.',
    'u6-t3':'Conservation of Matter: chemical reactions rearrange atoms without creating or destroying matter.',
    'u6-t4':'Synthetic vs. Natural: materials should be compared by properties and evidence, not by origin alone.'
  };

  function insert(){
    removeOldVisuals();
    var main=document.querySelector('main.container');
    if(!main) return;
    var fig=document.createElement('figure');
    fig.className='chapter-infographic';
    fig.style.cssText='margin:28px 0 34px;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow)';
    var img=document.createElement('img');
    img.src='./assets/chapter-posters/'+chapter+'.webp';
    img.alt=captions[chapter]||'Chapter science infographic';
    img.loading='eager'; img.decoding='async';
    img.style.cssText='display:block;width:100%;height:auto;background:#fff';
    var cap=document.createElement('figcaption');
    cap.textContent=captions[chapter]||'';
    cap.style.cssText='padding:12px 16px 14px;font-family:Poppins,system-ui,sans-serif;font-size:.9rem;line-height:1.55;color:var(--ink-soft);border-top:1px solid var(--line)';
    fig.appendChild(img); fig.appendChild(cap);
    var callout=main.querySelector(':scope > .callout');
    if(callout) callout.insertAdjacentElement('afterend',fig); else main.insertBefore(fig,main.firstChild);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',insert); else insert();
})();
