
// ── URL ROUTING ──
const SCREEN_ROUTES = {
  's-home':     '/home',
  's-auth':     '/login',
  's-tutorial': '/welcome',
  's-settings': '/settings',
  's-payment':  '/upgrade',
  's-tb':       '/studio/tidal-beat',
  's-vs':       '/studio/visual',
  's-ds':       '/studio/dev',
  's-setup':    '/studio/setup',
  's-picker':   '/studio/picker',
};
const ROUTE_SCREENS = Object.fromEntries(Object.entries(SCREEN_ROUTES).map(([k,v])=>[v,k]));

function go(id){
  const cur=document.querySelector('.screen.active');
  if(cur){
    if(cur.id==='s-tb'&&typeof tbPlaying!=='undefined'&&tbPlaying)tbStop();
    if(cur.id==='s-vs'&&typeof vsPlaying!=='undefined'&&vsPlaying)vsTogglePlay();
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(id);
  if(el){el.classList.add('active');window.scrollTo(0,0)}
  // Update the browser URL
  const path=SCREEN_ROUTES[id]||('/'+id.replace('s-',''));
  if(window.location.pathname!==path){
    history.pushState({screen:id},document.title,path);
  }
}

// Handle browser back/forward
window.addEventListener('popstate',function(e){
  const id=(e.state&&e.state.screen)||ROUTE_SCREENS[window.location.pathname]||'s-home';
  const el=document.getElementById(id);
  if(el){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    el.classList.add('active');window.scrollTo(0,0);
  }
});

// On first load: always start with splash so the app initialises.
// After splash transitions to auth, auth checks session and goes to home if logged in.
// Deep-link routing (e.g. /studio/tidal-beat) is applied AFTER the user is logged in
// by storing the intended path and restoring it post-login.
(function(){
  const path = window.location.pathname;
  const id   = ROUTE_SCREENS[path];
  // If there's a deep link target that isn't home/auth/splash, store it
  if (id && id !== 's-home' && id !== 's-auth' && id !== 's-splash' && id !== 's-tutorial') {
    try { sessionStorage.setItem('ordeck_deeplink', id); } catch(e){}
  }
  // Always reset to splash path on load so history is clean
  if (path !== '/' && path !== '/home') {
    try { history.replaceState({screen:'s-splash'}, '', '/'); } catch(e){}
  }
})();

function showToast(msg){
  let t=document.getElementById('app-toast');
  if(!t){t=document.createElement('div');t.id='app-toast';t.className='toast';document.body.appendChild(t)}
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),1600);
}
function escapeHtml(s){return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function uid(){return Math.random().toString(36).slice(2,9)}
function timeAgo(ts){
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<5)return 'just now';if(s<60)return s+'s ago';
  const m=Math.floor(s/60);if(m<60)return m+'m ago';
  const h=Math.floor(m/60);if(h<24)return h+'h ago';
  const d=Math.floor(h/24);return d+'d ago';
}

// ── NEON BACKGROUND ──
(function(){
  const c=document.getElementById('nc');if(!c)return;
  const ctx=c.getContext('2d');
  const COLS=['#8b5cf6','#06b6d4','#10b981','#ff2cf4','#c084fc','#a78bfa'];
  let pts=[],nodes=[],t=0;
  function resize(){c.width=Math.max(c.offsetWidth,680);c.height=Math.max(document.body.scrollHeight,640)}
  resize();window.addEventListener('resize',resize);
  for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,sp=.4+Math.random()*1;pts.push({x:Math.random()*c.width,y:Math.random()*c.height,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,len:50+Math.random()*90,col:COLS[i%COLS.length],a:.1+Math.random()*.18,w:.4+Math.random()*.7})}
  for(let i=0;i<18;i++)nodes.push({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:.7+Math.random()*1.4,col:COLS[i%COLS.length],a:.18+Math.random()*.35});
  function frame(){
    c.width=Math.max(c.offsetWidth,680);c.height=Math.max(document.body.scrollHeight,640);
    ctx.fillStyle='rgba(5,5,15,0.26)';ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='rgba(139,92,246,0.035)';ctx.lineWidth=.5;
    const gs=38;
    for(let x=0;x<c.width;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke()}
    for(let y=0;y<c.height;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke()}
    t+=.009;
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<-160)p.x=c.width+50;if(p.x>c.width+160)p.x=-50;
      if(p.y<-160)p.y=c.height+50;if(p.y>c.height+160)p.y=-50;
      const ang=Math.atan2(p.vy,p.vx);const pulse=p.a*(0.6+0.4*Math.sin(t*2+p.x*.007));
      ctx.save();ctx.strokeStyle=p.col;ctx.globalAlpha=pulse;ctx.lineWidth=p.w;ctx.shadowColor=p.col;ctx.shadowBlur=4;
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(ang)*p.len,p.y+Math.sin(ang)*p.len);ctx.stroke();ctx.restore();
    });
    nodes.forEach((n,i)=>{
      n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>c.width)n.vx*=-1;if(n.y<0||n.y>c.height)n.vy*=-1;
      const pulse=n.a*(0.5+0.5*Math.sin(t*1.4+i));
      ctx.save();ctx.fillStyle=n.col;ctx.globalAlpha=pulse;ctx.shadowColor=n.col;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.restore();
      nodes.forEach((m,j)=>{if(j<=i)return;const dx=m.x-n.x,dy=m.y-n.y,d=Math.sqrt(dx*dx+dy*dy);if(d<80){ctx.save();ctx.strokeStyle=n.col;ctx.globalAlpha=(1-d/80)*.08;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);ctx.stroke();ctx.restore()}});
    });
    requestAnimationFrame(frame);
  }
  frame();
})();

// ── SPLASH ──
function runSplash() {
  const steps = ['Initialising engine…','Loading audio runtime…','Building UI modules…','Mounting studios…','Almost ready…'];
  const splashEl = document.getElementById('s-splash');
  const spI      = document.getElementById('sp-I');
  const spWord   = document.getElementById('sp-word');
  const spSub    = document.getElementById('sp-sub');
  const fill     = document.getElementById('sp-fill');
  const pct      = document.getElementById('sp-pct');
  const step     = document.getElementById('sp-step');
  const dots     = document.querySelectorAll('.sp-dot');

  if (!splashEl) { go('s-auth'); return; }

  // Animate logo in
  if (spI)    { spI.style.opacity='0'; spI.style.transform='scale(.5)'; setTimeout(() => { spI.style.opacity='1'; spI.style.transform='scale(1)'; }, 150); }
  if (spWord) { spWord.style.opacity='0'; setTimeout(() => { spWord.style.opacity='1'; }, 480); }
  if (spSub)  { spSub.style.opacity='0'; setTimeout(() => { spSub.style.opacity='1'; }, 750); }
  dots.forEach(d => d.classList.add('a'));

  // Progress bar
  let p = 0, si = 0;
  const iv = setInterval(() => {
    p = Math.min(100, p + (p < 60 ? 1.8 : p < 85 ? 1.2 : 0.7));
    if (fill) fill.style.width = p + '%';
    if (pct)  pct.textContent  = Math.floor(p) + '%';
    const ni = Math.min(steps.length - 1, Math.floor(p / 100 * steps.length));
    if (ni !== si) {
      si = ni;
      if (step) { step.style.opacity='0'; setTimeout(() => { if(step){step.textContent=steps[si];step.style.opacity='1';} }, 180); }
    }
    if (p >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        splashEl.style.transition = 'opacity .5s ease';
        splashEl.style.opacity    = '0';
        setTimeout(() => {
          splashEl.classList.remove('active');
          // All go() wrappers are now in place — safe to navigate
          const target = window._splashTarget || 's-auth';
          go(target);
        }, 520);
      }, 350);
    }
  }, 26);

  // Absolute fallback — if still on splash after 7s, force navigate
  setTimeout(() => {
    if (splashEl.classList.contains('active')) {
      clearInterval(iv);
      splashEl.classList.remove('active');
      go(window._splashTarget || 's-auth');
    }
  }, 7000);
}

// ── BOOT — runs after ALL code has parsed and all go() wrappers are installed ──
// window.onload (not DOMContentLoaded) guarantees the entire script has executed
window.addEventListener('load', function() {
  // 1. Restore session first so _splashTarget is set before splash ends
  (function bootAuth() {
    try {
      var session = sessionLoad();
      if (!session) return;
      var db = dbLoad();
      var user = db[session.email];
      if (!user) { sessionClear(); return; }
      currentUser = user;
      userPlan = user.plan || 'standard';
      window._splashTarget = 's-home';
      applyUserToUI();
      if (userPlan === 'prototype-plus') applyPrototypePlus();
      try {
        var bcast = localStorage.getItem('ordeck-broadcast');
        if (bcast) setTimeout(function(){ showToast('📢 ' + bcast); }, 4000);
      } catch(e) {}
      if (adminUnlocked) {
        var btn = document.getElementById('admin-home-btn');
        if (btn) btn.classList.add('visible');
      }
    } catch(e) { console.error('bootAuth error:', e); }
  })();

  // 2. Run the splash animation — all wrappers are in place at this point
  runSplash();
});


// ── AUTH ──
function authTab(t){
  document.getElementById('at-si').classList.toggle('sel',t==='si');
  document.getElementById('at-up').classList.toggle('sel',t==='up');
  document.getElementById('f-si').style.display=t==='si'?'block':'none';
  document.getElementById('f-up').style.display=t==='up'?'block':'none';
}
function doAuth(){_doAuth()}

// ── TUTORIAL ──
const tutData=[
  {icon:'ti-hand-stop',title:'Welcome to ORDECK I',desc:'Your unified creative workspace — music, animation, and games in one place. This quick tour takes 2 minutes.',hl:['Create music in Tidal Beat','Build animations in Visual Studio','Code games in Dev Studio']},
  {icon:'ti-music',title:'Tidal Beat',desc:'Your music studio. Click grid cells to toggle beats, drag faders to mix, and press Play to hear your track in real time.',hl:['16-step beat grid you can click to edit','7-channel mixer with draggable faders','Record button captures live audio']},
  {icon:'ti-video',title:'Visual Studio',desc:'Your animation and video editor. Add layers, set keyframes, move clips on the timeline, and preview your animation.',hl:['Layers panel on the left — click to select','Timeline clips are draggable','Properties panel edits X, Y, size, opacity']},
  {icon:'ti-device-gamepad-2',title:'Dev Studio',desc:'Your 2D game editor. Write JavaScript, press Run ▶ and see a live game preview. The engine handles physics and collisions.',hl:['Edit code and press Run ▶ to play','Game canvas shows a live platformer','Console shows logs and errors']},
  {icon:'ti-rocket',title:"You're ready!",desc:'Start free with 3 projects and core tools. Upgrade to Prototype+ for unlimited projects, AI tools, and clean exports.',hl:['Click any studio card to open it','A setup wizard walks you through each studio','Upgrade anytime from your profile']}
];
let tutStep=0;
(function(){
  const bar=document.getElementById('tut-bar');
  const slides=document.getElementById('tut-slides');
  if(!bar||!slides)return;
  tutData.forEach((_,i)=>{const d=document.createElement('div');d.className='tut-dot'+(i===0?' on':'');bar.appendChild(d)});
  tutData.forEach((s,i)=>{
    const d=document.createElement('div');d.style.display=i===0?'block':'none';
    d.innerHTML=`<i class="tut-icon ti ${s.icon}" aria-hidden="true"></i><div class="tut-title">${s.title}</div><p class="tut-desc">${s.desc}</p><div class="tut-hl">${s.hl.map(h=>`<div class="tut-hl-row"><i class="ti ti-check" aria-hidden="true"></i>${h}</div>`).join('')}</div>`;
    slides.appendChild(d);
  });
})();
function tutNext(){
  const slides=document.querySelectorAll('#tut-slides>div');
  const dots=document.querySelectorAll('.tut-dot');
  slides[tutStep].style.display='none';
  tutStep++;
  if(tutStep>=tutData.length){
    // Restore any deep-link target from before login
    let deepLink = null;
    try { deepLink = sessionStorage.getItem('ordeck_deeplink'); sessionStorage.removeItem('ordeck_deeplink'); } catch(e){}
    go(deepLink || 's-home');
    return;
  }
  slides[tutStep].style.display='block';
  dots.forEach((d,i)=>d.classList.toggle('on',i<=tutStep));
  document.getElementById('tut-ctr').textContent=(tutStep+1)+' / '+tutData.length;
  document.getElementById('tut-btn').textContent=tutStep===tutData.length-1?'Start creating ↗':'Next →';
}

// ── SETUP WIZARD ──
const wizData={
  tb:[
    {q:'What will you name this project?',hint:'Give your music project a name.',type:'input',ph:'e.g. My First Beat'},
    {q:'What genre are you making?',hint:'We will set up the right default instruments and effects.',type:'opts',opts:[{ic:'ti-music',t:'Hip-hop / Trap',s:'808s, hi-hats, snares'},{ic:'ti-wave-sine',t:'Lo-fi / Chill',s:'Warm pads, vinyl crackle'},{ic:'ti-bolt',t:'Electronic / EDM',s:'Synths, drops, build-ups'},{ic:'ti-microphone',t:'Podcast / Vocal',s:'Clean mic, no music'}]},
    {q:'What tempo do you want to start at?',hint:'You can change this at any time in Tidal Beat.',type:'opts',opts:[{ic:'ti-clock',t:'Slow — 60–80 BPM',s:'Ballads, lo-fi'},{ic:'ti-clock',t:'Medium — 90–110 BPM',s:'Hip-hop, R&B'},{ic:'ti-clock',t:'Fast — 120–140 BPM',s:'EDM, pop'},{ic:'ti-clock',t:'Very fast — 150+ BPM',s:'Drum and bass'}]},
    {q:'How many tracks to start with?',hint:'You can always add more later.',type:'opts',opts:[{ic:'ti-list',t:'4 tracks',s:'Kick, snare, hi-hat, bass'},{ic:'ti-list',t:'6 tracks',s:'+ Synth and pad'},{ic:'ti-list',t:'8 tracks',s:'Full arrangement'}]},
    {q:'Do you want to record live audio?',hint:'ORDECK can record from your microphone directly into Tidal Beat.',type:'opts',opts:[{ic:'ti-microphone',t:'Yes — set up mic recording',s:'We will enable mic access'},{ic:'ti-music',t:'No — just use samples',s:'No microphone needed'}]}
  ],
  vs:[
    {q:'What will you name this project?',hint:'Give your animation project a name.',type:'input',ph:'e.g. My Animation'},
    {q:'What are you creating?',hint:'We will set up the right canvas, tools, and timeline.',type:'opts',opts:[{ic:'ti-player-play',t:'2D Animation',s:'Frame-by-frame, keyframes'},{ic:'ti-cut',t:'Video editing',s:'Cut, trim and arrange clips'},{ic:'ti-layers-intersect',t:'Both animation and video',s:'Mixed workflow'}]},
    {q:'What canvas size do you need?',hint:'You can change this later in project settings.',type:'opts',opts:[{ic:'ti-device-desktop',t:'1920 × 1080',s:'Full HD — video and animation'},{ic:'ti-device-mobile',t:'1080 × 1920',s:'Vertical — TikTok, Reels'},{ic:'ti-square',t:'1080 × 1080',s:'Square — Instagram'}]},
    {q:'What frame rate do you want?',hint:'Higher FPS means smoother motion but larger file sizes.',type:'opts',opts:[{ic:'ti-clock',t:'12 FPS',s:'Classic cartoon style'},{ic:'ti-clock',t:'24 FPS',s:'Cinematic standard'},{ic:'ti-clock',t:'30 FPS',s:'Standard video'},{ic:'ti-clock',t:'60 FPS',s:'Smooth, gaming style'}]},
    {q:'How many layers to start with?',hint:'Each layer is an independent element on the canvas.',type:'opts',opts:[{ic:'ti-layers-subtract',t:'2 layers',s:'Background + foreground'},{ic:'ti-layers-intersect',t:'4 layers',s:'BG, character, FX, text'},{ic:'ti-layers-linked',t:'6 layers',s:'Full scene setup'}]}
  ],
  ds:[
    {q:'What will you name this game?',hint:'Give your game a name.',type:'input',ph:'e.g. My Platformer'},
    {q:'What type of 2D game are you making?',hint:'We will set up the right physics and starter code for you.',type:'opts',opts:[{ic:'ti-run',t:'Platformer',s:'Jump, run, collect coins'},{ic:'ti-compass',t:'Top-down',s:'Zelda-style, birds-eye'},{ic:'ti-target',t:'Shooter',s:'Shoot enemies and dodge'},{ic:'ti-puzzle',t:'Puzzle',s:'Solve puzzles to progress'}]},
    {q:'What visual style fits your game?',hint:'We will pick the right colour palette and tile set.',type:'opts',opts:[{ic:'ti-grid-dots',t:'Pixel art',s:'Retro 8-bit or 16-bit'},{ic:'ti-vector',t:'Flat / minimal',s:'Clean shapes and colour'},{ic:'ti-shadow',t:'Dark / moody',s:'Gritty, atmospheric'},{ic:'ti-sun',t:'Bright / colourful',s:'Fun, family-friendly'}]},
    {q:'What will the player do?',hint:'This determines the controls and starter code we generate.',type:'opts',opts:[{ic:'ti-arrow-right',t:'Run and jump',s:'Classic platformer'},{ic:'ti-arrows-move',t:'Move in all directions',s:'Top-down exploration'},{ic:'ti-sword',t:'Fight enemies',s:'Combat and health'},{ic:'ti-star',t:'Collect items',s:'Score and pickups'}]},
    {q:'What is your coding experience?',hint:'We will adjust the complexity of the starter code for you.',type:'opts',opts:[{ic:'ti-baby',t:'Beginner',s:'Simple, heavily commented'},{ic:'ti-school',t:'Some experience',s:'Standard template'},{ic:'ti-code',t:'Experienced',s:'Full engine API access'}]}
  ]
};
let wizTarget='',wizStep=0,wizAnswers={};
const STU_NAMES={tb:'Tidal Beat',vs:'Visual Studio',ds:'Dev Studio'};
const STU_COL={tb:'#c084fc',vs:'#22d3ee',ds:'#34d399'};
const STU_ICON={tb:'ti-music',vs:'ti-video',ds:'ti-device-gamepad-2'};
function openSetup(t){
  wizTarget=t;
  if(PROJECTS[t]&&PROJECTS[t].length>0){showPicker(t)}
  else{wizStep=0;wizAnswers={};renderWiz();go('s-setup')}
}
function renderWiz(){
  const qs=wizData[wizTarget];const q=qs[wizStep];
  const names={tb:'Tidal Beat',vs:'Visual Studio',ds:'Dev Studio'};
  const subs={tb:'Set up your music project',vs:'Set up your animation project',ds:'Set up your game'};
  document.getElementById('wiz-t').textContent=names[wizTarget]+' Setup';
  document.getElementById('wiz-s').textContent=subs[wizTarget];
  document.getElementById('wiz-pf').style.width=((wizStep+1)/qs.length*100)+'%';
  document.getElementById('wiz-st').textContent='Step '+(wizStep+1)+' of '+qs.length;
  let html=`<div class="wiz-q">${q.q}</div><div class="wiz-hint">${q.hint}</div>`;
  if(q.type==='input'){html+=`<input class="wiz-inp" id="wiz-inp" type="text" placeholder="${q.ph||''}" value="${wizAnswers[wizStep]||''}">`}
  else{html+=`<div class="wiz-opts">`;q.opts.forEach((o,i)=>{const sel=wizAnswers[wizStep]===i?'sel':'';html+=`<div class="wiz-opt ${sel}" onclick="wizSel(this,${i})"><div class="wiz-opt-ic"><i class="ti ${o.ic}" aria-hidden="true"></i></div><div><div class="wiz-opt-t">${o.t}</div><div class="wiz-opt-s">${o.s}</div></div></div>`});html+=`</div>`}
  document.getElementById('wiz-b').innerHTML=html;
  const back=document.querySelector('.wiz-back');if(back)back.style.opacity=wizStep===0?'0':'1';
  const nxt=document.querySelector('.wiz-next');if(nxt)nxt.textContent=wizStep===qs.length-1?'Open Studio ↗':'Next →';
}
function wizSel(el,i){document.querySelectorAll('.wiz-opt').forEach(o=>o.classList.remove('sel'));el.classList.add('sel');wizAnswers[wizStep]=i}
function wizNext(){
  const inp=document.getElementById('wiz-inp');if(inp)wizAnswers[wizStep]=inp.value;
  wizStep++;
  if(wizStep>=wizData[wizTarget].length){
    const t=wizTarget;
    const p=createProject(t,wizAnswers);
    PROJECTS[t].push(p);curProj[t]=p;
    go('s-'+t);
    if(t==='tb')tbInitProject(p);
    if(t==='vs')vsInitProject(p);
    if(t==='ds')dsInitProject(p);
    return;
  }
  renderWiz();
}
function wizBack(){if(wizStep>0){wizStep--;renderWiz()}}

// ── PROJECT STORE (New Studio / Continue Studio) ──
let PROJECTS={tb:[],vs:[],ds:[]};
let curProj={tb:null,vs:null,ds:null};
function touchProj(t){if(curProj[t])curProj[t].updated=Date.now()}
function createProject(t,answers){
  const id=uid(),now=Date.now();
  const rawName=answers&&answers[0]?String(answers[0]).trim():'';
  const base={id,name:rawName||('Untitled '+STU_NAMES[t]),created:now,updated:now};
  if(t==='tb')return Object.assign(base,defaultTBProject(answers));
  if(t==='vs')return Object.assign(base,defaultVSProject(answers));
  if(t==='ds')return Object.assign(base,defaultDSProject(answers));
  return base;
}
function showPicker(t){
  wizTarget=t;
  const tEl=document.getElementById('pick-t');tEl.textContent=STU_NAMES[t];tEl.style.color=STU_COL[t];
  document.getElementById('pick-cont-s').textContent=PROJECTS[t].length+' saved project'+(PROJECTS[t].length===1?'':'s');
  document.getElementById('pick-grid').style.display='grid';
  document.getElementById('pick-list').style.display='none';
  go('s-picker');
}
function pickNew(){wizStep=0;wizAnswers={};renderWiz();go('s-setup')}
function pickContinue(){
  const t=wizTarget;
  document.getElementById('pick-grid').style.display='none';
  const list=document.getElementById('pick-list');
  list.style.display='flex';
  list.innerHTML=PROJECTS[t].slice().sort((a,b)=>b.updated-a.updated).map(p=>`
    <div class="pick-proj">
      <div class="pick-proj-ic" style="background:${STU_COL[t]}14;color:${STU_COL[t]}"><i class="ti ${STU_ICON[t]}" aria-hidden="true"></i></div>
      <div class="pick-proj-i"><div class="pick-proj-n">${escapeHtml(p.name)}</div><div class="pick-proj-d">Edited ${timeAgo(p.updated)}</div></div>
      <button class="pick-proj-open" style="border-color:${STU_COL[t]}44;color:${STU_COL[t]}" onclick="openProject('${t}','${p.id}')">Open →</button>
      <button class="pick-proj-del" onclick="deleteProject('${t}','${p.id}')" aria-label="Delete"><i class="ti ti-trash" aria-hidden="true"></i></button>
    </div>`).join('')+`<button class="back-btn" style="margin-top:.3rem;align-self:flex-start" onclick="showPicker('${t}')">← Back</button>`;
}
function openProject(t,id){
  const p=PROJECTS[t].find(x=>x.id===id);if(!p)return;
  curProj[t]=p;
  go('s-'+t);
  if(t==='tb')tbInitProject(p);
  if(t==='vs')vsInitProject(p);
  if(t==='ds')dsInitProject(p);
}
function deleteProject(t,id){
  PROJECTS[t]=PROJECTS[t].filter(x=>x.id!==id);
  pickContinue();
}

// ── TIDAL BEAT (full DAW) ──
const SOUND_DEF={
  kick:{label:'Kick',color:'#c084fc'},snare:{label:'Snare',color:'#a855f7'},
  hihat:{label:'Hi-Hat',color:'#9333ea'},openhat:{label:'Open Hat',color:'#d8b4fe'},
  clap:{label:'Clap',color:'#7c3aed'},tom:{label:'Tom',color:'#8b5cf6'},
  perc:{label:'Perc',color:'#c4b5fd'},bass:{label:'Bass',color:'#a78bfa'},
  synth:{label:'Synth',color:'#e9d5ff'},lead:{label:'Lead',color:'#f0abfc'},pad:{label:'Pad',color:'#ddd6fe'}
};
const SOUND_ICON={kick:'ti-circle-filled',snare:'ti-grain',hihat:'ti-asterisk',openhat:'ti-asterisk',clap:'ti-hand-click',tom:'ti-circle',perc:'ti-point',bass:'ti-wave-sine',synth:'ti-piano',lead:'ti-piano',pad:'ti-square-rounded',sample:'ti-file-music'};
const SOUND_LIST=Object.keys(SOUND_DEF);

function defaultTBProject(answers){
  const bpmMap=[70,100,128,160];
  const presetSets=[['kick','snare','hihat','bass'],['kick','snare','hihat','bass','synth','pad'],['kick','snare','hihat','openhat','clap','bass','synth','perc']];
  const trackIdx=(answers&&answers[3]!=null)?answers[3]:0;
  const bpmIdx=(answers&&answers[2]!=null)?answers[2]:2;
  const names=presetSets[trackIdx]||presetSets[0];
  const tracks=names.map(s=>({name:SOUND_DEF[s].label,sound:s,color:SOUND_DEF[s].color,vol:0.8,muted:false,fx:'none'}));
  const steps=16;
  const pattern=tracks.map(()=>new Array(steps).fill(0));
  const kickIdx=names.indexOf('kick'),snareIdx=names.indexOf('snare'),hhIdx=names.indexOf('hihat'),bassIdx=names.indexOf('bass');
  if(kickIdx>-1)[0,4,8,12].forEach(s=>pattern[kickIdx][s]=1);
  if(snareIdx>-1)[4,12].forEach(s=>pattern[snareIdx][s]=1);
  if(hhIdx>-1)for(let s=0;s<16;s+=2)pattern[hhIdx][s]=1;
  if(bassIdx>-1)[0,6,8,14].forEach(s=>pattern[bassIdx][s]=1);
  return {studio:'tb',bpm:bpmMap[bpmIdx]||120,tracks,patterns:{A:pattern},order:['A']};
}

let tbProj=null,tbEditPattern='A';
let tbPlaying=false,tbRec=false,tbBeat=0,tbArrIdx=0,tbNextNoteTime=0,tbSchedTimer=null,tbStartWall=null;
let actx=null,tbMaster=null,tbRecDest=null,tbRecorder=null,tbRecChunks=[],tbNoiseBuf=null,tbImpulseBuf=null,tbTrackGains=[];
const TB_LOOKAHEAD=25,TB_SCHED_AHEAD=0.12;

function ensureAudio(){
  if(actx)return actx;
  actx=new (window.AudioContext||window.webkitAudioContext)();
  tbMaster=actx.createGain();tbMaster.gain.value=0.9;tbMaster.connect(actx.destination);
  tbRecDest=actx.createMediaStreamDestination();tbMaster.connect(tbRecDest);
  return actx;
}
function getNoiseBuf(ctx){
  if(tbNoiseBuf)return tbNoiseBuf;
  const len=ctx.sampleRate*1;const buf=ctx.createBuffer(1,len,ctx.sampleRate);
  const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  tbNoiseBuf=buf;return buf;
}
function getImpulse(ctx){
  if(tbImpulseBuf)return tbImpulseBuf;
  const len=Math.floor(ctx.sampleRate*1.1);const buf=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
  tbImpulseBuf=buf;return buf;
}
function fxChain(ctx,srcGain,destGain,fx,bpm){
  if(fx==='reverb'){const conv=ctx.createConvolver();conv.buffer=getImpulse(ctx);const wet=ctx.createGain();wet.gain.value=0.5;srcGain.connect(conv);conv.connect(wet);wet.connect(destGain);srcGain.connect(destGain)}
  else if(fx==='delay'){const d=ctx.createDelay(1);d.delayTime.value=Math.max(0.05,60/(bpm||120)/2);const fb=ctx.createGain();fb.gain.value=0.32;const wet=ctx.createGain();wet.gain.value=0.42;srcGain.connect(d);d.connect(fb);fb.connect(d);d.connect(wet);wet.connect(destGain);srcGain.connect(destGain)}
  else if(fx==='drive'){const ws=ctx.createWaveShaper();const curve=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;curve[i]=Math.tanh(x*4)}ws.curve=curve;srcGain.connect(ws);ws.connect(destGain)}
  else{srcGain.connect(destGain)}
}
function playSound(ctx,sound,destGain,fx,t,vol,bpm,buffer){
  const env=ctx.createGain();env.gain.value=0;
  const v=vol==null?0.8:vol;
  function envCurve(attack,peak,decay){env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(peak,t+attack);env.gain.exponentialRampToValueAtTime(0.0001,t+attack+decay)}
  if(sound==='sample'&&buffer){
    const src=ctx.createBufferSource();src.buffer=buffer;
    const g=ctx.createGain();src.connect(g);g.connect(env);env.gain.value=1;
    const dur=Math.min(buffer.duration,4);
    g.gain.setValueAtTime(v,t);
    if(dur>0.05)g.gain.setValueAtTime(v,t+Math.max(0,dur-0.04));
    g.gain.linearRampToValueAtTime(0.0001,t+dur);
    src.start(t);src.stop(t+dur+0.02);
  }
  else if(sound==='kick'){const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.13);envCurve(0.001,v,0.18);o.connect(env);o.start(t);o.stop(t+0.22)}
  else if(sound==='snare'){const ns=ctx.createBufferSource();ns.buffer=getNoiseBuf(ctx);const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;ns.connect(hp);hp.connect(env);const o=ctx.createOscillator();o.type='triangle';o.frequency.value=180;const oEnv=ctx.createGain();oEnv.gain.value=0;o.connect(oEnv);oEnv.connect(env);oEnv.gain.setValueAtTime(v*0.6,t);oEnv.gain.exponentialRampToValueAtTime(0.0001,t+0.1);envCurve(0.001,v,0.14);ns.start(t);ns.stop(t+0.18);o.start(t);o.stop(t+0.1)}
  else if(sound==='hihat'||sound==='openhat'){const ns=ctx.createBufferSource();ns.buffer=getNoiseBuf(ctx);const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=7000;ns.connect(hp);hp.connect(env);const dec=sound==='openhat'?0.26:0.05;envCurve(0.001,v*0.7,dec);ns.start(t);ns.stop(t+dec+0.05)}
  else if(sound==='clap'){env.gain.value=1;for(let i=0;i<3;i++){const ns=ctx.createBufferSource();ns.buffer=getNoiseBuf(ctx);const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1100;const g=ctx.createGain();g.gain.value=0;ns.connect(bp);bp.connect(g);g.connect(env);const tt=t+i*0.012;g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(v*0.8,tt+0.002);g.gain.exponentialRampToValueAtTime(0.0001,tt+0.08);ns.start(tt);ns.stop(tt+0.1)}}
  else if(sound==='tom'){const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(90,t+0.2);envCurve(0.001,v,0.25);o.connect(env);o.start(t);o.stop(t+0.3)}
  else if(sound==='perc'){const ns=ctx.createBufferSource();ns.buffer=getNoiseBuf(ctx);const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2500;bp.Q.value=6;ns.connect(bp);bp.connect(env);envCurve(0.001,v*0.6,0.04);ns.start(t);ns.stop(t+0.06)}
  else if(sound==='bass'){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=55;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=400;o.connect(lp);lp.connect(env);envCurve(0.005,v,0.27);o.start(t);o.stop(t+0.3)}
  else if(sound==='synth'||sound==='lead'){const freqs=sound==='lead'?[440]:[330,440,550];freqs.forEach(f=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(env);o.start(t);o.stop(t+0.35)});envCurve(0.01,v*0.5,0.35)}
  else if(sound==='pad'){[220,277,330].forEach(f=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;o.connect(env);o.start(t);o.stop(t+0.9)});envCurve(0.08,v*0.4,0.9)}
  else{return}
  fxChain(ctx,env,destGain,fx,bpm);
}
function tbRebuildAudioGraph(){
  const ctx=ensureAudio();
  tbTrackGains=tbProj.tracks.map(tr=>{const g=ctx.createGain();g.gain.value=tr.muted?0:tr.vol;g.connect(tbMaster);return g});
}
function tbStepDur(){return 60/tbProj.bpm/4}

function tbToggleAddPanel(){
  const p=document.getElementById('tb-addpanel');
  if(p.style.display!=='block'){
    p.innerHTML=SOUND_LIST.map(s=>`<div class="tb-addopt" onclick="tbAddTrack('${s}')"><i class="ti ${SOUND_ICON[s]||'ti-music'}" aria-hidden="true"></i>${SOUND_DEF[s].label}</div>`).join('')+
      `<div class="tb-addopt" style="border-top:.5px solid rgba(192,132,252,.12);color:#fbbf24" onclick="document.getElementById('tb-audioInput').click()"><i class="ti ti-upload" aria-hidden="true"></i>Import audio file…</div>`;
    p.style.display='block';
  } else p.style.display='none';
}
function tbHandleAudioFile(e){
  const f=e.target.files[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=()=>{
    ensureAudio();
    actx.decodeAudioData(reader.result.slice(0)).then(buf=>{
      const name=f.name.replace(/\.[^.]+$/,'').slice(0,16)||'Sample';
      tbProj.tracks.push({name,sound:'sample',color:'#fbbf24',vol:0.8,muted:false,fx:'none',_buffer:buf});
      Object.keys(tbProj.patterns).forEach(k=>tbProj.patterns[k].push(new Array(16).fill(0)));
      touchProj('tb');tbRebuildAudioGraph();tbRenderAll();
      showToast('Imported "'+name+'" as a new track');
    }).catch(()=>showToast('Could not decode that audio file'));
  };
  reader.readAsArrayBuffer(f);
  document.getElementById('tb-addpanel').style.display='none';
  e.target.value='';
}
function tbAddTrack(sound){
  tbProj.tracks.push({name:SOUND_DEF[sound].label,sound,color:SOUND_DEF[sound].color,vol:0.8,muted:false,fx:'none'});
  Object.keys(tbProj.patterns).forEach(k=>tbProj.patterns[k].push(new Array(16).fill(0)));
  document.getElementById('tb-addpanel').style.display='none';
  touchProj('tb');tbRebuildAudioGraph();tbRenderAll();
}
function tbRemoveTrack(i){
  if(tbProj.tracks.length<=1){showToast('Need at least 1 track');return}
  tbProj.tracks.splice(i,1);
  Object.keys(tbProj.patterns).forEach(k=>tbProj.patterns[k].splice(i,1));
  touchProj('tb');tbRebuildAudioGraph();tbRenderAll();
}
function tbVol(e,i,el){
  const r=el.getBoundingClientRect();const p=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  tbProj.tracks[i].vol=p;const f=el.querySelector('.tb-vf');if(f)f.style.width=(p*100)+'%';
  if(tbTrackGains[i])tbTrackGains[i].gain.value=tbProj.tracks[i].muted?0:p;
  touchProj('tb');
}
function tbMuteToggle(i){
  const tr=tbProj.tracks[i];tr.muted=!tr.muted;
  if(tbTrackGains[i])tbTrackGains[i].gain.value=tr.muted?0:tr.vol;
  touchProj('tb');tbRenderTracks();
}
function tbSetFX(i,v){tbProj.tracks[i].fx=v;touchProj('tb')}

function tbRenderTracks(){
  const tl=document.getElementById('tb-tl');tl.innerHTML='';
  tbProj.tracks.forEach((tr,i)=>{
    const r=document.createElement('div');r.className='tb-tr';
    r.innerHTML=`<span class="tb-tn" title="${escapeHtml(tr.name)}">${escapeHtml(tr.name)}</span>
      <div class="tb-vol" onclick="tbVol(event,${i},this)"><div class="tb-vf" style="width:${tr.vol*100}%;background:${tr.color}"></div></div>
      <select class="tb-fx" onchange="tbSetFX(${i},this.value)" title="Effect">
        <option value="none" ${tr.fx==='none'?'selected':''}>FX</option>
        <option value="reverb" ${tr.fx==='reverb'?'selected':''}>Reverb</option>
        <option value="delay" ${tr.fx==='delay'?'selected':''}>Delay</option>
        <option value="drive" ${tr.fx==='drive'?'selected':''}>Drive</option>
      </select>
      <div class="tb-m ${tr.muted?'on':''}" onclick="tbMuteToggle(${i})">M</div>
      <div class="tb-rm" onclick="tbRemoveTrack(${i})" aria-label="Remove track"><i class="ti ti-x" aria-hidden="true"></i></div>`;
    tl.appendChild(r);
  });
}
function tbRenderGrid(){
  const ghd=document.getElementById('tb-ghd');ghd.innerHTML='';
  for(let i=1;i<=16;i++){
    const d=document.createElement('div');d.className='tb-gb';d.textContent=i;ghd.appendChild(d);
  }
  const grs=document.getElementById('tb-grs');grs.innerHTML='';
  const pat=tbProj.patterns[tbEditPattern];
  tbProj.tracks.forEach((tr,ti)=>{
    const fd=SOUND_FREQ[tr.sound]||{wave:'sine',color:'#c084fc'};
    const r=document.createElement('div');r.className='tb-gr';
    pat[ti].forEach((v,ci)=>{
      const cell=document.createElement('div');
      cell.className='tb-cell'+(v?' on':'');
      cell.id='tb-cell-'+ti+'-'+ci;

      // OFF ghost wave canvas
      const offC=document.createElement('canvas');
      offC.className='tb-wave-off';
      offC.width=40;offC.height=38;
      cell.appendChild(offC);
      tbDrawCellWave(offC,fd.wave,fd.color,false);

      // ON glowing wave canvas
      const onC=document.createElement('canvas');
      onC.className='tb-wave-on';
      onC.width=40;onC.height=38;
      cell.appendChild(onC);
      tbDrawCellWave(onC,fd.wave,fd.color,true);

      cell.onclick=()=>{
        pat[ti][ci]=pat[ti][ci]?0:1;
        cell.classList.toggle('on');
        touchProj('tb');
        if(pat[ti][ci]){
          ensureAudio();
          playSound(actx,tr.sound,tbMaster,tr.fx,actx.currentTime,tr.vol,tbProj.bpm,tr._buffer);
        }
      };
      r.appendChild(cell);
    });
    grs.appendChild(r);
  });
}

// Draw a waveform shape into a cell canvas
// style 0=ghost, 1=bright glow — matches the 9 waveform styles from the reference image
function tbDrawCellWave(canvas,waveType,color,glow){
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const style=Math.abs(color.charCodeAt(1))%9; // pick one of 9 styles per track colour
  if(glow){
    ctx.shadowColor=color;ctx.shadowBlur=8;
  }
  const alpha=glow?1:.45;
  ctx.globalAlpha=alpha;

  // Build gradient
  const grad=ctx.createLinearGradient(0,0,W,0);
  if(glow){
    grad.addColorStop(0,'#ff2cf4');
    grad.addColorStop(0.5,color);
    grad.addColorStop(1,'#22d3ee');
  } else {
    grad.addColorStop(0,color);
    grad.addColorStop(1,color);
  }
  ctx.strokeStyle=grad;
  ctx.fillStyle=grad;

  const mid=H/2;
  const seed=color.charCodeAt(2)||1; // per-track variation

  // 9 distinct waveform styles inspired by reference image
  switch(style){
    case 0: // classic sine wave (row 1 left)
      ctx.lineWidth=glow?1.6:.8;
      ctx.beginPath();
      for(let x=0;x<W;x++){
        const t=(x/W)*Math.PI*6;
        const amp=(mid-2)*0.8;
        const y=mid-Math.sin(t)*amp;
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
      break;

    case 1: // DNA double helix dots (row 1 mid)
      ctx.lineWidth=glow?1.4:.7;
      for(let x=0;x<W;x+=3){
        const t=(x/W)*Math.PI*6;
        const amp=(mid-3)*0.75;
        const y1=mid-Math.sin(t)*amp;
        const y2=mid+Math.sin(t)*amp;
        ctx.beginPath();ctx.arc(x,y1,glow?1.5:1,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(x,y2,glow?1.5:1,0,Math.PI*2);ctx.fill();
      }
      break;

    case 2: // halftone dot cloud (row 1 right)
      for(let x=2;x<W-2;x+=3){
        const t=(x/W)*Math.PI*4;
        const maxR=Math.abs(Math.sin(t))*(mid-2);
        const dots=Math.floor(maxR/2);
        for(let d=0;d<dots;d++){
          const y=mid-maxR+d*3;
          ctx.beginPath();ctx.arc(x,y,glow?1.2:.7,0,Math.PI*2);ctx.fill();
        }
      }
      break;

    case 3: // overlapping filled shapes (row 2 left)
      ctx.lineWidth=glow?1.2:.6;
      ctx.globalAlpha=glow?.7:.25;
      for(let peak=0;peak<W;peak+=(W/6)){
        const pw=W/7;
        ctx.beginPath();
        ctx.moveTo(peak,mid);
        ctx.bezierCurveTo(peak+pw*.3,2,peak+pw*.7,2,peak+pw,mid);
        ctx.bezierCurveTo(peak+pw*.7,H-2,peak+pw*.3,H-2,peak,mid);
        ctx.fillStyle=grad;ctx.fill();
        ctx.strokeStyle=grad;ctx.stroke();
      }
      ctx.globalAlpha=alpha;
      break;

    case 4: // tall bar spectrum (row 2 mid — the big equaliser)
      const bars=16;const bw=Math.floor(W/bars);
      for(let b=0;b<bars;b++){
        const t=b/bars;
        const h=(Math.sin(t*Math.PI)*(mid-2)+2*(seed%3))*0.9;
        ctx.globalAlpha=glow?.85:.35;
        ctx.fillRect(b*bw+1,mid-h,bw-2,h*2);
      }
      ctx.globalAlpha=alpha;
      break;

    case 5: // thin zigzag (row 2 right)
      ctx.lineWidth=glow?1.4:.7;
      ctx.beginPath();
      for(let x=0;x<W;x++){
        const t=(x/W)*Math.PI*10;
        const amp=(mid-2)*0.6;
        const y=mid-Math.sin(t)*amp*(0.4+0.6*Math.abs(Math.sin(t*0.3)));
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
      break;

    case 6: // layered flowing lines (row 3 right)
      ctx.lineWidth=glow?1:.5;
      for(let layer=0;layer<5;layer++){
        const off=(layer-2)*3;
        ctx.globalAlpha=glow?.6:.2;
        ctx.beginPath();
        for(let x=0;x<W;x++){
          const t=(x/W)*Math.PI*5;
          const amp=(mid-4)*0.65;
          const y=mid+off-Math.sin(t+(layer*.4))*amp;
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=alpha;
      break;

    case 7: // pointed diamond burst centre (row 3 mid)
      ctx.lineWidth=glow?1.2:.6;
      ctx.beginPath();
      for(let x=0;x<W;x++){
        const t=(x/W-0.5)*Math.PI*2;
        const env=Math.exp(-t*t*2.5);
        const amp=(mid-2)*env;
        const y=mid-Math.sin(t*8)*amp;
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
      break;

    default: // smooth bar spectrum with gradient fill (row 4 left)
      const bs2=20;const bw2=Math.floor(W/bs2);
      for(let b=0;b<bs2;b++){
        const env=Math.sin((b/bs2)*Math.PI);
        const h=(env*(mid-2)*0.95)+1;
        ctx.globalAlpha=glow?.9:.3;
        ctx.fillRect(b*bw2,mid-h,bw2-1,h*2);
      }
      ctx.globalAlpha=alpha;
      break;
  }
}

// Animate playing cell — flash the active step
let tbLastPlayStep=-1;
function tbFlashStep(step){
  // Clear previous
  if(tbLastPlayStep>=0){
    tbProj.tracks.forEach((_,ti)=>{
      const el=document.getElementById('tb-cell-'+ti+'-'+tbLastPlayStep);
      if(el)el.classList.remove('playing');
    });
    const prevGb=document.querySelectorAll('.tb-gb')[tbLastPlayStep];
    if(prevGb)prevGb.classList.remove('playing');
  }
  // Highlight current
  tbProj.tracks.forEach((_,ti)=>{
    const el=document.getElementById('tb-cell-'+ti+'-'+step);
    if(el)el.classList.add('playing');
  });
  const curGb=document.querySelectorAll('.tb-gb')[step];
  if(curGb)curGb.classList.add('playing');
  tbLastPlayStep=step;
}
function tbRenderPatternTabs(){
  const el=document.getElementById('tb-patrow');
  const keys=Object.keys(tbProj.patterns);
  el.innerHTML=keys.map(k=>`<button class="tb-pat ${k===tbEditPattern?'on':''}" onclick="tbEditPat('${k}')">${k}</button>`).join('')+`<button class="tb-pat add" onclick="tbAddPattern()" aria-label="Add pattern"><i class="ti ti-plus" aria-hidden="true"></i></button>`;
}
function tbEditPat(k){tbEditPattern=k;tbRenderPatternTabs();tbRenderGrid()}
function tbAddPattern(){
  const keys=Object.keys(tbProj.patterns);
  let letter='A';for(let i=0;i<26;i++){const L=String.fromCharCode(65+i);if(!keys.includes(L)){letter=L;break}}
  tbProj.patterns[letter]=tbProj.tracks.map(()=>new Array(16).fill(0));
  tbEditPattern=letter;touchProj('tb');tbRenderPatternTabs();tbRenderGrid();
}
function tbRenderArr(){
  const el=document.getElementById('tb-arr');
  el.innerHTML='<span class="tb-arr-l">Arrangement</span>'+tbProj.order.map((k,i)=>`<span class="tb-chip">${k}<i class="ti ti-x" onclick="tbRemoveArr(${i})" aria-hidden="true"></i></span>`).join('')+
    `<select class="tb-arr-add" onchange="tbAddArr(this.value)"><option value="">+ add</option>${Object.keys(tbProj.patterns).map(k=>`<option value="${k}">${k}</option>`).join('')}</select>`;
}
function tbAddArr(k){if(!k)return;tbProj.order.push(k);touchProj('tb');tbRenderArr()}
function tbRemoveArr(i){if(tbProj.order.length<=1){showToast('Arrangement needs at least 1 pattern');return}tbProj.order.splice(i,1);touchProj('tb');tbRenderArr()}
// Frequency + waveform data per sound
const SOUND_FREQ={
  kick:{hz:'40–150 Hz',shape:'Sine',color:'#c084fc',wave:'sine'},
  snare:{hz:'180–900 Hz',shape:'Noise+Tri',color:'#a855f7',wave:'noise'},
  hihat:{hz:'7k–12k Hz',shape:'Noise HP',color:'#9333ea',wave:'noise'},
  openhat:{hz:'5k–10k Hz',shape:'Noise HP',color:'#d8b4fe',wave:'noise'},
  clap:{hz:'1.1k Hz BP',shape:'Noise BP',color:'#7c3aed',wave:'noise'},
  tom:{hz:'90–220 Hz',shape:'Sine',color:'#8b5cf6',wave:'sine'},
  perc:{hz:'2.5k Hz',shape:'Noise BP',color:'#c4b5fd',wave:'noise'},
  bass:{hz:'55 Hz',shape:'Sawtooth',color:'#a78bfa',wave:'sawtooth'},
  synth:{hz:'330–550 Hz',shape:'Sawtooth',color:'#e9d5ff',wave:'sawtooth'},
  lead:{hz:'440 Hz',shape:'Sawtooth',color:'#f0abfc',wave:'sawtooth'},
  pad:{hz:'220–330 Hz',shape:'Sine x3',color:'#ddd6fe',wave:'sine'}
};
function tbDrawWaveCanvas(canvas,wave,color){
  if(!canvas)return;
  const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.shadowColor=color;ctx.shadowBlur=4;
  ctx.beginPath();
  for(let x=0;x<W;x++){
    let y;const t=(x/W)*Math.PI*4;
    if(wave==='sine')y=H/2-Math.sin(t)*(H/2-.5)*.7;
    else if(wave==='sawtooth')y=H/2-((t%(Math.PI*2))/Math.PI-1)*(H/2-.5)*.7;
    else{y=H/2+(Math.random()-.5)*(H*.55)}
    if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function tbBuildFreqPanel(){
  if(!tbProj)return;
  const rows=document.getElementById('tb-freq-rows');if(!rows)return;
  rows.innerHTML='';
  const badge=document.getElementById('tb-freq-badge');
  if(badge)badge.textContent=tbPlaying?'PLAYING':'IDLE';
  tbProj.tracks.forEach(tr=>{
    const fd=SOUND_FREQ[tr.sound]||{hz:'—',shape:'—',color:'#c084fc',wave:'sine'};
    const row=document.createElement('div');row.className='tb-freq-row';
    const cid='fqc-'+tr.sound+'-'+Math.random().toString(36).slice(2,6);
    const activeSteps=tbProj.patterns[tbEditPattern]?tbProj.patterns[tbEditPattern][tbProj.tracks.indexOf(tr)]||[]:[];
    const activeCount=activeSteps.filter(Boolean).length;
    row.innerHTML=`
      <span class="tb-freq-name">${escapeHtml(tr.name)}</span>
      <span class="tb-freq-hz" style="color:${fd.color}">${fd.hz}</span>
      <span class="tb-freq-shape">${fd.shape}</span>
      <canvas class="tb-freq-canvas" id="${cid}" height="26"></canvas>
      <span class="tb-freq-active" style="color:${fd.color}">${activeCount}/16</span>`;
    rows.appendChild(row);
    // Draw after appending so canvas has size
    requestAnimationFrame(()=>{
      const c=document.getElementById(cid);if(!c)return;
      c.width=c.offsetWidth||120;
      tbDrawWaveCanvas(c,fd.wave,fd.color);
    });
  });
}
function tbBuildWave(){
  const wave=document.getElementById('tb-wave');wave.innerHTML='';
  for(let i=0;i<80;i++){const b=document.createElement('div');b.className='tw-b';b.style.height=(3+Math.random()*32)+'px';wave.appendChild(b)}
}
let tbMeterIv=null;
function tbBuildMeters(){
  const cm=document.getElementById('tb-chanmeters');if(!cm)return;
  cm.innerHTML=['L','R','M'].map(l=>`<div class="tb-cm"><div class="tb-cm-bar"><div class="tb-cm-fill" style="height:18%"></div></div><div class="tb-cm-lbl">${l}</div></div>`).join('');
  if(tbMeterIv)clearInterval(tbMeterIv);
  tbMeterIv=setInterval(tbMeterTick,140);
}
function tbMeterTick(){
  const fills=document.querySelectorAll('.tb-cm-fill');
  fills.forEach(f=>{const base=tbPlaying?32+Math.random()*58:6+Math.random()*8;f.style.height=Math.min(100,base)+'%'});
  const big=document.getElementById('tb-timebig');
  if(big){
    let el=0;if(tbPlaying&&tbStartWall)el=(Date.now()-tbStartWall)/1000;
    const h=Math.floor(el/3600),m=Math.floor((el%3600)/60),s=Math.floor(el%60),ms=Math.floor((el%1)*10);
    big.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+','+ms;
  }
  if(tbPlaying){
    const m=document.getElementById('tb-ld-m');if(m)m.textContent=(-(6+Math.random()*8)).toFixed(1);
    const s=document.getElementById('tb-ld-s');if(s)s.textContent=(-(4+Math.random()*6)).toFixed(1);
  }
}
function tbMasterPreset(gain,label){
  ensureAudio();
  if(tbMaster)tbMaster.gain.value=gain;
  tbRenderMixer();
  showToast('Applied "'+label+'" mastering preset');
}
function tbRenderMixer(){
  const mix=document.getElementById('tb-mix');mix.innerHTML='';
  mix.style.gridTemplateColumns=`repeat(${tbProj.tracks.length+1},1fr)`;
  tbProj.tracks.forEach((tr,i)=>{
    const ch=document.createElement('div');ch.className='tb-ch';
    ch.innerHTML=`<div class="tb-chn">${escapeHtml(tr.name.slice(0,5))}</div><div class="tb-fd" onclick="tbFaderTrack(event,${i},this)"><div class="tb-ff" style="height:${tr.vol*100}%;background:${tr.color}"></div></div><div class="tb-cv">${Math.round(tr.vol*100)}%</div>`;
    mix.appendChild(ch);
  });
  const mch=document.createElement('div');mch.className='tb-ch';
  const mv=tbMaster?tbMaster.gain.value:0.9;
  mch.innerHTML=`<div class="tb-chn">Master</div><div class="tb-fd" onclick="tbFaderMaster(event,this)"><div class="tb-ff" style="height:${mv*100}%;background:#e9d5ff"></div></div><div class="tb-cv">${Math.round(mv*100)}%</div>`;
  mix.appendChild(mch);
}
function tbFaderTrack(e,i,el){
  const r=el.getBoundingClientRect();const p=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));
  tbProj.tracks[i].vol=p;const f=el.querySelector('.tb-ff');if(f)f.style.height=(p*100)+'%';
  const cv=el.parentElement.querySelector('.tb-cv');if(cv)cv.textContent=Math.round(p*100)+'%';
  if(tbTrackGains[i])tbTrackGains[i].gain.value=tbProj.tracks[i].muted?0:p;
  touchProj('tb');tbRenderTracks();
}
function tbFaderMaster(e,el){
  const r=el.getBoundingClientRect();const p=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));
  if(tbMaster)tbMaster.gain.value=p;const f=el.querySelector('.tb-ff');if(f)f.style.height=(p*100)+'%';
  const cv=el.parentElement.querySelector('.tb-cv');if(cv)cv.textContent=Math.round(p*100)+'%';
}
function tbRenderAll(){
  tbRenderTracks();tbRenderGrid();tbRenderPatternTabs();tbRenderArr();tbRenderMixer();tbBuildWave();tbBuildMeters();tbBuildFreqPanel();
}
function tbInitProject(p){
  tbProj=p;tbEditPattern=tbProj.order[0]||'A';
  const nm=document.getElementById('tb-projname');if(nm)nm.textContent=p.name;
  const bv=document.getElementById('tb-bv');if(bv)bv.textContent=tbProj.bpm;
  ensureAudio();tbRebuildAudioGraph();tbRenderAll();
  tbPlaying=false;tbBeat=0;tbHighlight(-1);
}
function tbBPMAdj(d){
  tbProj.bpm=Math.max(40,Math.min(200,tbProj.bpm+d));
  const v=document.getElementById('tb-bv');if(v)v.textContent=tbProj.bpm;
  touchProj('tb');
}
function tbTogglePlay(){
  ensureAudio();
  tbPlaying=!tbPlaying;
  const pi=document.getElementById('tb-pi');const pb=document.getElementById('tb-pb');
  if(pi)pi.className=tbPlaying?'ti ti-player-stop':'ti ti-player-play';
  if(pb)pb.style.background=tbPlaying?'#a855f7':'#c084fc';
  const badge=document.getElementById('tb-freq-badge');
  if(badge)badge.textContent=tbPlaying?'PLAYING':'IDLE';
  if(tbPlaying){
    tbBeat=0;tbArrIdx=Math.max(0,tbProj.order.indexOf(tbEditPattern));
    tbProj._playPattern=tbProj.order[tbArrIdx];
    tbNextNoteTime=actx.currentTime+0.05;tbStartWall=Date.now();
    tbSchedTimer=setInterval(tbScheduler,TB_LOOKAHEAD);
  } else {
    clearInterval(tbSchedTimer);tbHighlight(-1);
  }
}
function tbStop(){
  tbPlaying=false;clearInterval(tbSchedTimer);tbBeat=0;tbHighlight(-1);
  const pi=document.getElementById('tb-pi');const pb=document.getElementById('tb-pb');
  if(pi)pi.className='ti ti-player-play';if(pb)pb.style.background='#c084fc';
  const tc=document.getElementById('tb-time');if(tc)tc.textContent='0:00.0';
  const badge=document.getElementById('tb-freq-badge');if(badge)badge.textContent='IDLE';
}
function tbRewind(){
  if(!tbProj)return;
  tbBeat=0;tbArrIdx=0;tbProj._playPattern=tbProj.order[0];
  if(tbPlaying){tbStartWall=Date.now();tbNextNoteTime=actx.currentTime+0.05;tbHighlight(0)}
  else{tbHighlight(-1)}
  const tc=document.getElementById('tb-time');if(tc)tc.textContent='0:00.0';
  showToast('Rewound to start');
}
function tbScheduler(){
  while(tbNextNoteTime<actx.currentTime+TB_SCHED_AHEAD){
    tbScheduleStep(tbBeat,tbNextNoteTime);
    tbNextNoteTime+=tbStepDur();tbBeat++;
    if(tbBeat>=16){
      tbBeat=0;tbArrIdx=(tbArrIdx+1)%tbProj.order.length;tbProj._playPattern=tbProj.order[tbArrIdx];
    }
  }
  const tc=document.getElementById('tb-time');
  if(tc&&tbStartWall){const el=(Date.now()-tbStartWall)/1000;const m=Math.floor(el/60);const s=(el%60).toFixed(1);tc.textContent=m+':'+s.padStart(4,'0')}
}
function tbScheduleStep(step,time){
  const pat=tbProj.patterns[tbProj._playPattern];
  if(!pat)return;
  tbProj.tracks.forEach((tr,ti)=>{
    if(tr.muted)return;
    if(pat[ti]&&pat[ti][step])playSound(actx,tr.sound,tbTrackGains[ti],tr.fx,time,tr.vol,tbProj.bpm,tr._buffer);
  });
  const delay=Math.max(0,(time-actx.currentTime)*1000);
  setTimeout(()=>{
    if(tbPlaying&&tbProj._playPattern===tbEditPattern){
      tbHighlight(step);
      tbFlashStep(step); // animate waveform cells
    }
  },delay);
}
function tbHighlight(b){document.querySelectorAll('.tb-gb').forEach((el,i)=>{el.style.color=i===b?'#c084fc':'rgba(192,132,252,.2)';el.style.background=i===b?'rgba(192,132,252,.1)':'transparent'})}

// tbMicStream: holds the live mic MediaStream so we can stop tracks cleanly
let tbMicStream = null;

function tbToggleRec(){
  ensureAudio();
  tbRec = !tbRec;
  const btn = document.getElementById('tb-rec');

  if(tbRec){
    // Request microphone ONLY — does NOT capture the beat audio
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        tbMicStream = stream;
        tbRecChunks = [];

        // Show a visual indicator that mic is active
        const label = document.getElementById('tb-rec-label');
        if(label){ label.style.display='inline-flex'; }

        // Use the mic stream (not tbRecDest which is beat output)
        tbRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        tbRecorder.ondataavailable = e => { if(e.data.size > 0) tbRecChunks.push(e.data); };
        tbRecorder.onstop = () => {
          // Stop all mic tracks to release microphone
          if(tbMicStream){ tbMicStream.getTracks().forEach(t => t.stop()); tbMicStream = null; }
          const label = document.getElementById('tb-rec-label');
          if(label) label.style.display = 'none';

          const blob = new Blob(tbRecChunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const list = document.getElementById('tb-recs');
          const fname = 'voice-' + Date.now() + '.webm';
          const row = document.createElement('a');
          row.href = url; row.download = fname; row.className = 'tb-recitem';
          row.innerHTML = `<i class="ti ti-microphone" aria-hidden="true"></i> ${fname}`;
          list.prepend(row);
          showToast('Voice recording saved! Click Add to Beat to mix it in.');
          // Also refresh instruments recs panel if open
          if(typeof refreshInstRecs === 'function') refreshInstRecs();
        };
        tbRecorder.start();
        showToast('🎙 Mic recording started — your voice only, not the beat');
      })
      .catch(err => {
        tbRec = false; // revert
        if(err.name === 'NotAllowedError'){
          showToast('Microphone permission denied — allow mic access and try again');
        } else {
          showToast('Could not access microphone: ' + err.message);
        }
        if(btn){ btn.classList.remove('on'); btn.textContent = 'Rec'; }
      });
  } else {
    if(tbRecorder && tbRecorder.state !== 'inactive') tbRecorder.stop();
  }

  if(btn){
    btn.classList.toggle('on', tbRec);
    btn.style.borderColor = tbRec ? '#f87171' : 'rgba(248,113,113,.28)';
    btn.style.color = tbRec ? '#f87171' : 'rgba(248,113,113,.45)';
    btn.textContent = tbRec ? '■ Stop Mic' : 'Rec';
  }
}
function bufferToWav(buf){
  const numCh=buf.numberOfChannels,len=buf.length*numCh*2+44;
  const ab=new ArrayBuffer(len);const view=new DataView(ab);
  function ws(off,s){for(let i=0;i<s.length;i++)view.setUint8(off+i,s.charCodeAt(i))}
  ws(0,'RIFF');view.setUint32(4,len-8,true);ws(8,'WAVE');ws(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
  view.setUint16(22,numCh,true);view.setUint32(24,buf.sampleRate,true);view.setUint32(28,buf.sampleRate*numCh*2,true);
  view.setUint16(32,numCh*2,true);view.setUint16(34,16,true);ws(36,'data');view.setUint32(40,len-44,true);
  let off=44;const chans=[];for(let c=0;c<numCh;c++)chans.push(buf.getChannelData(c));
  for(let i=0;i<buf.length;i++){for(let c=0;c<numCh;c++){let s=Math.max(-1,Math.min(1,chans[c][i]));view.setInt16(off,s<0?s*32768:s*32767,true);off+=2}}
  return new Blob([ab],{type:'audio/wav'});
}
async function tbExport(){
  ensureAudio();
  const btn=document.getElementById('tb-exportbtn');
  const stepDur=tbStepDur();const totalSteps=tbProj.order.length*16;const dur=totalSteps*stepDur+1.2;
  const off=new OfflineAudioContext(2,Math.ceil(44100*dur),44100);
  const offMaster=off.createGain();offMaster.gain.value=tbMaster?tbMaster.gain.value:0.9;offMaster.connect(off.destination);
  const gains=tbProj.tracks.map(tr=>{const g=off.createGain();g.gain.value=tr.muted?0:tr.vol;g.connect(offMaster);return g});
  let t=0.05;
  tbProj.order.forEach(patKey=>{
    const pat=tbProj.patterns[patKey];if(!pat)return;
    for(let step=0;step<16;step++){
      tbProj.tracks.forEach((tr,ti)=>{if(!tr.muted&&pat[ti]&&pat[ti][step])playSound(off,tr.sound,gains[ti],tr.fx,t,tr.vol,tbProj.bpm,tr._buffer)});
      t+=stepDur;
    }
  });
  if(btn){btn.textContent='Rendering…';btn.disabled=true}
  try{
    const rendered=await off.startRendering();
    const wavBlob=bufferToWav(rendered);
    const url=URL.createObjectURL(wavBlob);
    const a=document.createElement('a');a.href=url;a.download=(tbProj.name||'beat').replace(/[^a-z0-9_-]+/gi,'_')+'.wav';
    document.body.appendChild(a);a.click();a.remove();
    showToast('Exported '+a.download);
  }catch(e){showToast('Export failed')}
  if(btn){btn.textContent='Export';btn.disabled=false}
}

// ── VISUAL STUDIO (CapCut-style editor) ──
function defaultVSProject(answers){
  const sizeMap=[{w:1920,h:1080},{w:1080,h:1920},{w:1080,h:1080}];
  const fpsMap=[12,24,30,60];
  const countMap=[2,4,6];
  const sizeIdx=(answers&&answers[2]!=null)?answers[2]:0;
  const fpsIdx=(answers&&answers[3]!=null)?answers[3]:1;
  const cntIdx=(answers&&answers[4]!=null)?answers[4]:1;
  const size=sizeMap[sizeIdx]||sizeMap[0];
  const n=countMap[cntIdx]||4;
  const palette=['#22d3ee','#c084fc','#34d399','#fb923c','#f472b6','#a78bfa'];
  const names=['Background','Character','FX Overlay','Text','Layer 5','Layer 6'];
  const layers=[];
  for(let i=0;i<n;i++){
    layers.push({id:uid(),name:names[i]||('Layer '+(i+1)),type:i===3?'text':'shape',shape:i===0?'rect':'ellipse',
      color:palette[i%palette.length],x:80+i*40,y:60+i*30,w:360,h:120,opacity:100,rotation:0,
      text:i===3?'Your Text Here':'',start:i*1.2,dur:4,src:null});
  }
  return {studio:'vs',fps:fpsMap[fpsIdx]||24,duration:12,canvasW:size.w,canvasH:size.h,layers,sel:layers[0]?layers[0].id:null};
}

let vsProj=null,vsPlaying=false,vsTime=0,vsRAF=null,vsLastTs=null,vsDrag=null;
document.addEventListener('mousemove',(e)=>{
  if(!vsDrag||!vsProj)return;
  const {layer,mode,startX,startStart,startDur,trackW}=vsDrag;
  const dx=e.clientX-startX;const dt=trackW>0?dx/trackW*vsProj.duration:0;
  if(mode==='move'){let ns=startStart+dt;ns=Math.max(0,Math.min(vsProj.duration-layer.dur,ns));layer.start=ns}
  else if(mode==='resize-r'){let nd=startDur+dt;nd=Math.max(0.2,Math.min(vsProj.duration-layer.start,nd));layer.dur=nd}
  else if(mode==='resize-l'){let ns=startStart+dt;ns=Math.max(0,Math.min(startStart+startDur-0.2,ns));let nd=startDur-(ns-startStart);layer.start=ns;layer.dur=nd}
  vsUpdateClipStyle(layer);touchProj('vs');
});
document.addEventListener('mouseup',()=>{vsDrag=null});
function vsUpdateClipStyle(layer){
  const clip=document.querySelector('.vs-clip[data-id="'+layer.id+'"]');
  if(clip){clip.style.left=(layer.start/vsProj.duration*100)+'%';clip.style.width=(layer.dur/vsProj.duration*100)+'%'}
}
function vsEnsureMediaEls(){
  vsProj.layers.forEach(l=>{
    if(l.type==='image'&&l.src&&!l._imgEl){const img=new Image();img.src=l.src;l._imgEl=img}
    if(l.type==='video'&&l.src&&!l._vidEl){const v=document.createElement('video');v.src=l.src;v.muted=true;v.loop=true;v.playsInline=true;l._vidEl=v}
  });
}
function vsToggleAddPanel(){const p=document.getElementById('vs-addpanel');p.style.display=p.style.display==='flex'?'none':'flex'}
function vsAddLayer(type){
  if(!vsProj)return;
  const palette=['#22d3ee','#c084fc','#34d399','#fb923c','#f472b6','#a78bfa'];
  const l={id:uid(),name:(type[0].toUpperCase()+type.slice(1))+' '+(vsProj.layers.length+1),type,
    color:palette[vsProj.layers.length%palette.length],
    x:Math.round(vsProj.canvasW/2-160),y:Math.round(vsProj.canvasH/2-50),w:320,h:100,opacity:100,rotation:0,
    text:type==='text'?'New text':'',shape:'rect',start:0,dur:Math.min(4,vsProj.duration),src:null};
  vsProj.layers.push(l);vsProj.sel=l.id;
  const p=document.getElementById('vs-addpanel');if(p)p.style.display='none';
  touchProj('vs');vsRenderAll();
}
function vsHandleFile(e,type){
  const f=e.target.files[0];if(!f||!vsProj)return;
  const reader=new FileReader();
  reader.onload=()=>{
    const palette=['#22d3ee','#c084fc','#34d399','#fb923c','#f472b6','#a78bfa'];
    const l={id:uid(),name:f.name.slice(0,18),type,color:palette[vsProj.layers.length%palette.length],
      x:Math.round(vsProj.canvasW/2-160),y:Math.round(vsProj.canvasH/2-90),w:320,h:180,opacity:100,rotation:0,
      text:'',shape:'rect',start:0,dur:type==='video'?Math.min(6,vsProj.duration):Math.min(4,vsProj.duration),src:reader.result};
    if(type==='video'){const v=document.createElement('video');v.src=reader.result;v.muted=true;v.loop=true;v.playsInline=true;l._vidEl=v}
    else{const img=new Image();img.src=reader.result;l._imgEl=img}
    vsProj.layers.push(l);vsProj.sel=l.id;
    touchProj('vs');vsRenderAll();
  };
  reader.readAsDataURL(f);
  e.target.value='';
  const p=document.getElementById('vs-addpanel');if(p)p.style.display='none';
}
function vsRemoveLayer(id){
  if(!vsProj)return;
  vsProj.layers=vsProj.layers.filter(l=>l.id!==id);
  if(vsProj.sel===id)vsProj.sel=vsProj.layers[0]?vsProj.layers[0].id:null;
  touchProj('vs');vsRenderAll();
}
function vsSelectLayer(id){
  vsProj.sel=id;touchProj('vs');vsRenderLayers();vsRenderTimeline();vsRenderProps();
  const l=vsProj.layers.find(x=>x.id===id);
  const cl=document.getElementById('vs-curlayer');if(cl)cl.textContent=l?l.name:'—';
  const on=document.getElementById('vs-out-name');if(on)on.textContent=l?l.name:'GPencil';
}
function vsToggleVis(id,e){
  e.stopPropagation();
  const l=vsProj.layers.find(x=>x.id===id);if(!l)return;
  l.hidden=!l.hidden;touchProj('vs');vsRenderLayers();vsRenderTimeline();vsDrawPreview();
}
function vsToggleLock(id,e){
  e.stopPropagation();
  const l=vsProj.layers.find(x=>x.id===id);if(!l)return;
  l.locked=!l.locked;touchProj('vs');vsRenderLayers();
}
function vsRenderLayers(){
  const ll=document.getElementById('vs-ll');if(!ll)return;ll.innerHTML='';
  vsProj.layers.forEach(l=>{
    const d=document.createElement('div');d.className='vs-lyr'+(l.id===vsProj.sel?' sel':'')+(l.hidden?' hidden-layer':'');
    d.innerHTML=`<div class="vs-ldot" style="background:${l.color}"></div><span>${escapeHtml(l.name)}</span>
      <div class="vs-eyelock">
        <i class="ti ${l.hidden?'ti-eye-off':'ti-eye'} ${l.hidden?'':'on'}" title="Show/Hide"></i>
        <i class="ti ${l.locked?'ti-lock':'ti-lock-open'} ${l.locked?'on':''}" title="Lock"></i>
        <i class="ti ti-x vs-lyr-rm" aria-hidden="true"></i>
      </div>`;
    const icons=d.querySelectorAll('.vs-eyelock i');
    icons[0].onclick=(e)=>vsToggleVis(l.id,e);
    icons[1].onclick=(e)=>vsToggleLock(l.id,e);
    icons[2].onclick=(e)=>{e.stopPropagation();vsRemoveLayer(l.id)};
    d.onclick=()=>vsSelectLayer(l.id);
    ll.appendChild(d);
  });
  const lc=document.getElementById('vs-lc');if(lc)lc.textContent=vsProj.layers.length;
}
function vsRenderTimeline(){
  const tr=document.getElementById('vs-tlrows');if(!tr)return;tr.innerHTML='';
  const dur=vsProj.duration;
  vsProj.layers.forEach(l=>{
    const row=document.createElement('div');row.className='vs-tlrow';
    const lbl=document.createElement('div');lbl.className='vs-tll';lbl.textContent=l.name.slice(0,5);
    const track=document.createElement('div');track.className='vs-tlt';
    const clip=document.createElement('div');clip.className='vs-clip'+(l.id===vsProj.sel?' sel':'')+(l.hidden?' hidden-layer':'');
    clip.dataset.id=l.id;
    clip.style.left=(l.start/dur*100)+'%';clip.style.width=(l.dur/dur*100)+'%';
    clip.style.background=l.color+'22';clip.style.border='.5px solid '+l.color+'66';
    clip.innerHTML=`<span class="vs-cn">${escapeHtml(l.name)}</span><div class="vs-rsz-l"></div><div class="vs-rsz-r"></div><div class="vs-clip-kf" style="left:0"></div><div class="vs-clip-kf" style="left:100%"></div>`;
    if(!l.locked){
      clip.addEventListener('mousedown',(e)=>{
        const r=track.getBoundingClientRect();
        let mode='move';
        if(e.target.classList.contains('vs-rsz-r'))mode='resize-r';
        else if(e.target.classList.contains('vs-rsz-l'))mode='resize-l';
        vsDrag={layer:l,mode,startX:e.clientX,startStart:l.start,startDur:l.dur,trackW:r.width};
        e.preventDefault();e.stopPropagation();
        vsSelectLayer(l.id);
      });
    } else {
      clip.style.cursor='not-allowed';
      clip.addEventListener('mousedown',(e)=>{e.preventDefault();e.stopPropagation();vsSelectLayer(l.id)});
    }
    track.appendChild(clip);row.appendChild(lbl);row.appendChild(track);tr.appendChild(row);
  });
}
function vsWireScrub(){
  const m=document.getElementById('vs-marks');if(!m||m._wired)return;m._wired=true;
  const seek=(e)=>{
    const r=m.getBoundingClientRect();const p=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    vsTime=p*vsProj.duration;vsUpdatePlayhead();vsDrawPreview();
    vsProj.layers.forEach(l=>{if(l.type==='video'&&l._vidEl){try{l._vidEl.currentTime=Math.max(0,vsTime-l.start)}catch(e){}}});
  };
  m.addEventListener('mousedown',(e)=>{
    seek(e);
    const mv=(e2)=>seek(e2);
    const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up)};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });
}
function vsRenderMarks(){
  const marks=document.getElementById('vs-marks');if(!marks)return;marks.innerHTML='';
  const n=Math.max(4,Math.min(20,Math.round(vsProj.duration)));
  for(let i=0;i<n;i++){const d=document.createElement('div');d.className='vs-tlmk';d.textContent=(i%2===0)?Math.round(i/n*vsProj.duration)+'s':'';marks.appendChild(d)}
}
function vsRenderProps(){
  // Refresh effects panel for selected layer
  if(vsProj&&vsProj.sel) vsFxRender(vsProj.sel);
  else vsFxRender(null);
  const cont=document.getElementById('vs-propswrap');if(!cont)return;
  const l=vsProj.layers.find(x=>x.id===vsProj.sel);
  if(!l){cont.innerHTML='<div class="vs-pt">Properties</div><div class="vs-pe">No layer selected</div>';return}
  let extra='';
  if(l.type==='text'){
    extra=`<div class="vs-pr"><span class="vs-pk">Text</span><input class="vs-pi" style="width:110px;text-align:left" value="${escapeHtml(l.text||'')}" oninput="vsSetProp('text',this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">Color</span><input type="color" value="${l.color||'#ffffff'}" oninput="vsSetProp('color',this.value)"></div>`;
  } else if(l.type==='shape'){
    extra=`<div class="vs-pr"><span class="vs-pk">Shape</span><select class="vs-pi" style="width:110px" onchange="vsSetProp('shape',this.value)"><option value="rect" ${l.shape==='rect'?'selected':''}>Rect</option><option value="ellipse" ${l.shape==='ellipse'?'selected':''}>Ellipse</option></select></div>
    <div class="vs-pr"><span class="vs-pk">Color</span><input type="color" value="${l.color||l.fill||'#8b5cf6'}" oninput="vsSetProp('color',this.value)"></div>`;
  } else if(l.type==='gradient'){
    extra=`<div class="vs-pr"><span class="vs-pk">Color 1</span><input type="color" value="${l.g1||'#8b5cf6'}" oninput="vsSetProp('g1',this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">Color 2</span><input type="color" value="${l.g2||'#22d3ee'}" oninput="vsSetProp('g2',this.value)"></div>`;
  } else if(l.type==='draw'){
    extra=`<div class="vs-pr"><span class="vs-pk">Brush</span><input type="color" value="${l.drawColor||'#c084fc'}" oninput="l.drawColor=this.value;vsDrawColor=this.value"></div>
    <div class="vs-pr"><span class="vs-pk">Size</span><input class="vs-pi" type="number" min="1" max="40" value="${l.drawSize||4}" oninput="l.drawSize=+this.value;vsDrawSize=+this.value"></div>
    <div class="vs-pr"><span class="vs-pk">Strokes</span><span class="vs-pk">${(l.strokes||[]).length}</span></div>
    <div class="vs-pr"><button style="font-family:var(--mono);font-size:9px;padding:3px 9px;background:rgba(248,113,113,.12);border:.5px solid rgba(248,113,113,.3);color:#f87171;cursor:pointer" onclick="vsProj.layers.find(x=>x.id==='${l.id}').strokes=[];vsDrawPreview()">Clear</button></div>`;
  }
  cont.innerHTML=`<div class="vs-pt">Properties</div>
    <div class="vs-pr"><span class="vs-pk">Name</span><input class="vs-pi" style="width:90px;text-align:left" value="${escapeHtml(l.name)}" oninput="vsSetProp('name',this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">X</span><input class="vs-pi" type="number" value="${Math.round(l.x)}" oninput="vsSetProp('x',+this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">Y</span><input class="vs-pi" type="number" value="${Math.round(l.y)}" oninput="vsSetProp('y',+this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">W</span><input class="vs-pi" type="number" value="${Math.round(l.w)}" oninput="vsSetProp('w',+this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">H</span><input class="vs-pi" type="number" value="${Math.round(l.h)}" oninput="vsSetProp('h',+this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">Opacity</span><input class="vs-pi" type="number" value="${Math.round(l.opacity)}" oninput="vsSetProp('opacity',+this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">Rotation</span><input class="vs-pi" type="number" value="${Math.round(l.rotation)}" oninput="vsSetProp('rotation',+this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">Start (s)</span><input class="vs-pi" type="number" step="0.1" value="${l.start.toFixed(2)}" oninput="vsSetProp('start',+this.value)"></div>
    <div class="vs-pr"><span class="vs-pk">Duration (s)</span><input class="vs-pi" type="number" step="0.1" value="${l.dur.toFixed(2)}" oninput="vsSetProp('dur',+this.value)"></div>
    ${extra}`;
}
function vsSetProp(k,v){
  const l=vsProj.layers.find(x=>x.id===vsProj.sel);if(!l)return;
  l[k]=v;touchProj('vs');
  vsRenderTimeline();vsRenderLayers();vsDrawPreview();
}
const VS_TOOL_NAMES={'Select':'Pen.001','Move':'Move.001','Pen':'Pen.001','Shape':'Fill.001','Text':'Text.001','Keyframe':'Pen.001','Cut':'Knife.001'};
function vsTool(el){
  document.querySelectorAll('.vs-tool').forEach(t=>t.classList.remove('sel'));el.classList.add('sel');
  const tn=document.getElementById('vs-toolname');if(tn)tn.textContent=VS_TOOL_NAMES[el.title]||'Pen.001';
}
function vsDrawPreview(){
  const c=document.getElementById('vs-pc');if(!c||!vsProj)return;
  const ctx=c.getContext('2d');const W=c.width,H=c.height;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  const sx=W/vsProj.canvasW,sy=H/vsProj.canvasH;
  vsProj.layers.forEach(l=>{
    if(l.hidden)return;
    const tEnd=l.start+l.dur;
    if(vsTime<l.start||vsTime>tEnd)return;
    let alpha=l.opacity/100;const fade=0.3;
    if(vsTime-l.start<fade)alpha*=(vsTime-l.start)/fade;
    if(tEnd-vsTime<fade)alpha*=(tEnd-vsTime)/fade;
    alpha=Math.max(0,Math.min(1,alpha));
    ctx.save();ctx.globalAlpha=alpha;
    const cx=(l.x+l.w/2)*sx,cy=(l.y+l.h/2)*sy;
    ctx.translate(cx,cy);ctx.rotate(l.rotation*Math.PI/180);
    const w=l.w*sx,h=l.h*sy;
    if(l.type==='shape'){
      ctx.fillStyle=l.color||l.fill||'#8b5cf6';
      if(l.shape==='ellipse'){ctx.beginPath();ctx.ellipse(0,0,w/2,h/2,0,0,Math.PI*2);ctx.fill()}
      else ctx.fillRect(-w/2,-h/2,w,h);
    } else if(l.type==='text'){
      ctx.fillStyle=l.color||l.fill||'#fff';ctx.font=Math.max(10,h*0.4)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(l.text||'New Text',0,0);
    } else if(l.type==='gradient'){
      const grd=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);
      grd.addColorStop(0,l.g1||l.color||'#8b5cf6');grd.addColorStop(1,l.g2||'#22d3ee');
      ctx.fillStyle=grd;ctx.fillRect(-w/2,-h/2,w,h);
    } else if(l.type==='blank'){
      ctx.fillStyle='rgba(255,255,255,0.05)';ctx.strokeStyle='rgba(255,255,255,0.1)';
      ctx.lineWidth=1;ctx.setLineDash([6,4]);
      ctx.strokeRect(-w/2,-h/2,w,h);ctx.setLineDash([]);
    } else if(l.type==='draw'&&l.strokes){
      ctx.translate(-cx,-cy); // draw strokes in scene space
      l.strokes.forEach(s=>{
        if(!s.pts||s.pts.length<2)return;
        ctx.strokeStyle=s.color||'#c084fc';ctx.lineWidth=(s.size||4)*sx;
        ctx.lineCap='round';ctx.lineJoin='round';
        ctx.beginPath();ctx.moveTo(s.pts[0].x*sx,s.pts[0].y*sy);
        s.pts.slice(1).forEach(p=>ctx.lineTo(p.x*sx,p.y*sy));
        ctx.stroke();
      });
      ctx.translate(cx,cy);
    } else if(l.type==='image'&&l._imgEl&&l._imgEl.complete){
      try{ctx.drawImage(l._imgEl,-w/2,-h/2,w,h)}catch(e){}
    } else if(l.type==='video'&&l._vidEl){
      try{ctx.drawImage(l._vidEl,-w/2,-h/2,w,h)}catch(e){}
    } else if((l.type==='image'||l.type==='video')&&l._url){
      // objectURL version added by file manager
      if(l._img&&l._img.complete)try{ctx.drawImage(l._img,-w/2,-h/2,w,h)}catch(e){}
      else if(l._vidEl)try{ctx.drawImage(l._vidEl,-w/2,-h/2,w,h)}catch(e){}
    }
    ctx.restore();
  });
}
function vsSetDuration(v){
  if(!vsProj)return;
  const nv=Math.max(1,Math.min(600,+v||vsProj.duration));
  vsProj.duration=nv;vsTime=Math.min(vsTime,nv);
  touchProj('vs');vsRenderMarks();vsRenderAll();vsUpdatePlayhead();
}
function vsUpdatePlayhead(){
  const fc=document.getElementById('vs-fc');if(fc)fc.textContent='Frame '+Math.round(vsTime*vsProj.fps)+' / '+Math.round(vsProj.duration*vsProj.fps);
  const ph=document.getElementById('vs-ph');if(ph)ph.style.left='calc(54px + (100% - 54px) * '+(vsTime/vsProj.duration)+')';
}
function vsTogglePlay(){
  if(!vsProj)return;
  vsPlaying=!vsPlaying;
  const pi=document.getElementById('vs-pi');const pb=document.getElementById('vs-pb');const pi2=document.getElementById('vs-pi2');
  if(pi)pi.className=vsPlaying?'ti ti-player-stop':'ti ti-player-play';
  if(pi2)pi2.className=vsPlaying?'ti ti-player-stop':'ti ti-player-play';
  if(pb)pb.style.background=vsPlaying?'#06b6d4':'#22d3ee';
  if(vsPlaying){
    vsEnsureMediaEls();
    vsProj.layers.forEach(l=>{if(l.type==='video'&&l._vidEl){try{l._vidEl.currentTime=Math.max(0,vsTime-l.start);l._vidEl.play().catch(()=>{})}catch(e){}}});
    vsLastTs=performance.now();vsRAF=requestAnimationFrame(vsFrameLoop);
  } else {
    cancelAnimationFrame(vsRAF);
    vsProj.layers.forEach(l=>{if(l.type==='video'&&l._vidEl)l._vidEl.pause()});
  }
}
function vsFrameLoop(ts){
  const dt=(ts-vsLastTs)/1000;vsLastTs=ts;vsTime+=dt;
  if(vsTime>=vsProj.duration){
    vsTime=0;
    vsProj.layers.forEach(l=>{if(l.type==='video'&&l._vidEl){try{l._vidEl.currentTime=0}catch(e){}}});
  }
  vsUpdatePlayhead();vsDrawPreview();
  if(vsPlaying)vsRAF=requestAnimationFrame(vsFrameLoop);
}
async function vsExport(){
  if(!vsProj)return;
  const btn=document.getElementById('vs-exportbtn');
  if(btn){btn.textContent='Rendering…';btn.disabled=true}
  vsEnsureMediaEls();
  const c=document.getElementById('vs-pc');
  let stream,rec;
  try{
    stream=c.captureStream(vsProj.fps||24);
    rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});
  }catch(e){
    try{rec=new MediaRecorder(stream)}catch(e2){showToast('Export not supported in this browser');if(btn){btn.textContent='Render';btn.disabled=false}return}
  }
  const chunks=[];
  rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data)};
  const wasPlaying=vsPlaying;if(wasPlaying){cancelAnimationFrame(vsRAF)}
  vsTime=0;
  vsProj.layers.forEach(l=>{if(l.type==='video'&&l._vidEl){try{l._vidEl.currentTime=0;l._vidEl.play().catch(()=>{})}catch(e){}}});
  rec.start();
  vsPlaying=true;
  const pi=document.getElementById('vs-pi');if(pi)pi.className='ti ti-player-stop';
  const pi2x=document.getElementById('vs-pi2');if(pi2x)pi2x.className='ti ti-player-stop';
  vsLastTs=performance.now();
  await new Promise(resolve=>{
    function step(ts){
      const dt=(ts-vsLastTs)/1000;vsLastTs=ts;vsTime+=dt;
      vsUpdatePlayhead();vsDrawPreview();
      if(vsTime<vsProj.duration)requestAnimationFrame(step);else resolve();
    }
    requestAnimationFrame(step);
  });
  await new Promise(r=>setTimeout(r,150));
  rec.stop();
  vsPlaying=wasPlaying;
  const pi2=document.getElementById('vs-pi');if(pi2)pi2.className=vsPlaying?'ti ti-player-stop':'ti ti-player-play';
  const pi2b=document.getElementById('vs-pi2');if(pi2b)pi2b.className=vsPlaying?'ti ti-player-stop':'ti ti-player-play';
  if(vsPlaying){vsLastTs=performance.now();vsRAF=requestAnimationFrame(vsFrameLoop)}
  await new Promise(res=>{rec.onstop=res});
  const blob=new Blob(chunks,{type:'video/webm'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=(vsProj.name||'video').replace(/[^a-z0-9_-]+/gi,'_')+'.webm';
  document.body.appendChild(a);a.click();a.remove();
  if(btn){btn.textContent='Render';btn.disabled=false}
  showToast('Video exported — '+a.download);
}
function vsRenderAll(){
  vsRenderLayers();vsRenderTimeline();vsRenderProps();vsDrawPreview();
  const durl=document.getElementById('vs-durlbl');if(durl)durl.textContent=vsProj.duration+'s';
  const cvl=document.getElementById('vs-canvaslbl');if(cvl)cvl.textContent=vsProj.canvasW+'×'+vsProj.canvasH;
  const fl=document.getElementById('vs-fpslbl');if(fl)fl.textContent=vsProj.fps+' FPS';
  const ei=document.getElementById('vs-endinput');if(ei)ei.value=vsProj.duration;
  const mem=document.getElementById('vs-mem');if(mem)mem.textContent=(180+vsProj.layers.length*42.7).toFixed(1)+' MB';
}
function vsInitProject(p){
  vsProj=p;vsTime=0;vsPlaying=false;
  const nm=document.getElementById('vs-projname');if(nm)nm.textContent=p.name;
  const pn2=document.getElementById('vs-projname2');if(pn2)pn2.textContent='('+(p.layers.length)+') '+p.name.toUpperCase();
  vsEnsureMediaEls();
  vsRenderMarks();vsRenderAll();vsWireScrub();vsUpdatePlayhead();
  const sel=vsProj.layers.find(x=>x.id===vsProj.sel);
  const cl=document.getElementById('vs-curlayer');if(cl)cl.textContent=sel?sel.name:'—';
  const on=document.getElementById('vs-out-name');if(on)on.textContent=sel?sel.name:'GPencil';
  const pi=document.getElementById('vs-pi');if(pi)pi.className='ti ti-player-play';
  const pi2=document.getElementById('vs-pi2');if(pi2)pi2.className='ti ti-player-play';
  const pb=document.getElementById('vs-pb');if(pb)pb.style.background='#22d3ee';
}

// ── DEV STUDIO ──
const DS_LANG_EXT={javascript:'js',html:'html',css:'css',python:'py',c:'c',cpp:'cpp'};
const DS_LANG_ICONS={javascript:'#22d3ee',html:'#f97316',css:'#818cf8',python:'#facc15'};
function defaultDSProject(answers){
  return {studio:'ds',files:{main:''},curFile:'main',lang:'javascript'};
}
let dsProj=null,dsCurFile='main',dsLang='javascript',dsRunning=false,dsLastError=null;
const DS_CORE=['main'];
const DS_ICON_COL={main:'#22d3ee'};
function dsInitProject(p){
  dsProj=p;dsCurFile=p.curFile||'main';dsLang=p.lang||'javascript';
  // Always start fresh — no pre-loaded demo code
  if(dsProj.files[dsCurFile]==null)dsProj.files[dsCurFile]='';
  const nm=document.getElementById('ds-projname');if(nm)nm.textContent=p.name;
  const slug=(p.name||'my-project').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')||'my-project';
  const addr=document.getElementById('ds-addr-name');if(addr)addr.textContent=slug;
  const root=document.getElementById('ds-rootname');if(root)root.textContent=slug.toUpperCase();
  dsStopRun();
  dsClearLog();
  dsUpdateLangUI();
  dsRenderFiles();
  const ed=document.getElementById('ds-ed');if(ed){ed.value=dsProj.files[dsCurFile]||'';dsGutter()}
  dsLog('ORDECK Dev Studio — ready','info');
  dsLog('Write code and press Run to execute it for real.','info');
}
function dsUpdateLangUI(){
  const sl=document.getElementById('ds-lang-sel');if(sl)sl.value=dsLang;
  const statLang=document.getElementById('ds-stat-lang');
  const label={javascript:'JavaScript',html:'HTML',css:'CSS',python:'Python',c:'C',cpp:'C++'}[dsLang]||'JavaScript';
  if(statLang)statLang.textContent=label;
  const rl=document.getElementById('ds-runlang');if(rl)rl.textContent={javascript:'JS',html:'HTML',css:'CSS',python:'PY',c:'C',cpp:'C++'}[dsLang]||'JS';
}
function dsSetLang(lang){
  dsLang=lang;if(dsProj)dsProj.lang=lang;
  dsUpdateLangUI();
  dsRenderFiles();
  dsResetOutputPanels();
  dsLog('Language set to '+lang,'info');
}
function dsResetOutputPanels(){
  const gc=document.getElementById('ds-game');const pf=document.getElementById('ds-preview-box');const ob=document.getElementById('ds-output-box');
  if(gc)gc.style.display='none';if(pf)pf.style.display='none';
  if(ob){ob.style.display='flex';ob.style.alignItems='center';ob.style.justifyContent='center';ob.innerHTML='Write code and press <b style="color:#34d399">&nbsp;Run&nbsp;</b> to see real output here.'}
  const badge=document.getElementById('ds-badge');if(badge){badge.textContent='● Ready';badge.style.color='rgba(52,211,153,.4)'}
  const rs=document.getElementById('ds-runstatus');if(rs)rs.textContent='Idle';
  const stat=document.getElementById('ds-stat-status');if(stat)stat.innerHTML='<i class="ti ti-circle-check" aria-hidden="true"></i>Ready';
}
function dsDownload(){
  const ed=document.getElementById('ds-ed');
  const code=ed?ed.value:(dsProj&&dsProj.files[dsCurFile])||'';
  const ext=DS_LANG_EXT[dsLang]||'js';
  const fname=(dsCurFile||'main')+'.'+ext;
  const blob=new Blob([code],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=fname;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  showToast('Downloaded '+fname);
}
function dsRenderFiles(){
  const list=document.getElementById('ds-filelist');const tabs=document.getElementById('ds-tabsrow');
  if(!list||!tabs||!dsProj)return;
  const ext=DS_LANG_EXT[dsLang]||'js';
  const extra=Object.keys(dsProj.files).filter(k=>!DS_CORE.includes(k));
  const keys=[...DS_CORE.filter(k=>dsProj.files[k]!=null),...extra];
  list.innerHTML=keys.map(k=>`<div class="ds-fi ds-ind ${dsCurFile===k?'sel':''}" onclick="dsFile('${k}')"><i class="ti ti-file-code" style="color:${DS_ICON_COL[k]||'#fbbf24'}" aria-hidden="true"></i>${escapeHtml(k)}.${ext}${DS_CORE.includes(k)?'':'<i class="ti ti-x ds-frm" aria-hidden="true"></i>'}</div>`).join('');
  list.querySelectorAll('.ds-frm').forEach((x,i)=>{const k=extra[i];x.onclick=(e)=>{e.stopPropagation();dsRemoveFile(k)}});
  tabs.innerHTML=keys.map(k=>`<div class="ds-tab ${dsCurFile===k?'sel':''}" onclick="dsFile('${k}')">${escapeHtml(k)}.${ext}${DS_CORE.includes(k)?'':'<i class="ti ti-x ds-tab-rm" aria-hidden="true"></i>'}</div>`).join('');
  tabs.querySelectorAll('.ds-tab-rm').forEach((x,i)=>{const k=extra[i];x.onclick=(e)=>{e.stopPropagation();dsRemoveFile(k)}});
  const bc=document.getElementById('ds-breadcrumb');
  if(bc)bc.innerHTML=`<span>${escapeHtml((dsProj.name||'my-project'))}</span><i class="ti ti-chevron-right" aria-hidden="true"></i><span>src</span><i class="ti ti-chevron-right" aria-hidden="true"></i><span style="color:rgba(52,211,153,.6)">${escapeHtml(dsCurFile)}.${ext}</span>`;
}
function dsFile(key){
  const ed=document.getElementById('ds-ed');
  if(ed&&dsProj)dsProj.files[dsCurFile]=ed.value;
  dsCurFile=key;if(dsProj)dsProj.curFile=key;
  if(ed){ed.value=(dsProj&&dsProj.files[key])||'';dsGutter()}
  touchProj('ds');dsRenderFiles();
}
function dsAddFile(){
  if(!dsProj)return;
  const ext=DS_LANG_EXT[dsLang]||'js';
  const name=prompt('New file name (no extension needed, e.g. "utils")');
  if(!name)return;
  const key=name.replace(new RegExp('\\.'+ext+'$','i'),'').replace(/[^a-zA-Z0-9_]/g,'')||('file'+Date.now());
  if(dsProj.files[key]!=null){showToast('File already exists');return}
  dsProj.files[key]='';
  dsCurFile=key;dsProj.curFile=key;
  touchProj('ds');dsRenderFiles();
  const ed=document.getElementById('ds-ed');if(ed){ed.value='';dsGutter()}
  showToast('Created '+key+'.'+ext);
}
function dsRemoveFile(key){
  if(!dsProj||DS_CORE.includes(key))return;
  delete dsProj.files[key];
  if(dsCurFile===key){dsCurFile='main';dsProj.curFile='main';const ed=document.getElementById('ds-ed');if(ed){ed.value=dsProj.files.main||'';dsGutter()}}
  touchProj('ds');dsRenderFiles();
}
function dsGutter(){
  const ed=document.getElementById('ds-ed');const g=document.getElementById('ds-gut');if(!ed||!g)return;
  if(dsProj){dsProj.files[dsCurFile]=ed.value;touchProj('ds')}
  const lines=ed.value.split('\n');
  const before=ed.value.substring(0,ed.selectionStart).split('\n');
  const cur=before.length;const col=before[before.length-1].length+1;
  let h='';for(let i=1;i<=lines.length;i++)h+=`<span class="ds-ln${i===cur?' cur':''}">${i}</span>`;
  g.innerHTML=h;
  const ln=document.getElementById('ds-stat-ln');if(ln)ln.textContent=cur;
  const cl=document.getElementById('ds-stat-col');if(cl)cl.textContent=col;
  const lc=document.getElementById('ds-linecount');if(lc)lc.textContent=lines.length;
  g.scrollTop=ed.scrollTop;
}
document.addEventListener('DOMContentLoaded',()=>{
  const ed=document.getElementById('ds-ed');
  if(ed)ed.addEventListener('scroll',()=>{const g=document.getElementById('ds-gut');if(g)g.scrollTop=ed.scrollTop});
});
function dsTabKey(e){
  if(e.key!=='Tab')return;e.preventDefault();
  const ed=document.getElementById('ds-ed');const s=ed.selectionStart;
  ed.value=ed.value.substring(0,s)+'  '+ed.value.substring(ed.selectionEnd);
  ed.selectionStart=ed.selectionEnd=s+2;dsGutter();
}
function dsLog(msg,cls){
  const log=document.getElementById('ds-log');if(!log)return;
  const d=document.createElement('div');d.className=cls||'info';d.textContent=msg;
  log.appendChild(d);log.scrollTop=log.scrollHeight;
}
function dsClearLog(){const log=document.getElementById('ds-log');if(log)log.innerHTML=''}
function dsEscHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function dsStopRun(){
  dsRunning=false;
  const runBtn=document.getElementById('ds-run-btn');const stopBtn=document.getElementById('ds-stop-btn');
  if(runBtn)runBtn.style.display='inline-flex';
  if(stopBtn)stopBtn.style.display='none';
  const pf=document.getElementById('ds-preview-frame');if(pf)pf.srcdoc='about:blank';
}

function dsRun(){
  const ed=document.getElementById('ds-ed');
  if(ed&&dsProj)dsProj.files[dsCurFile]=ed.value;
  const code=(dsProj&&dsProj.files[dsCurFile])||'';
  if(!code.trim()){showToast('Write some code first');return}

  dsClearLog();
  dsLog('→ Running '+dsCurFile+'.'+(DS_LANG_EXT[dsLang]||'js')+'...','info');
  const badge=document.getElementById('ds-badge');const stat=document.getElementById('ds-stat-status');const rs=document.getElementById('ds-runstatus');
  if(badge){badge.textContent='● Running';badge.style.color='#facc15'}
  if(stat)stat.innerHTML='<i class="ti ti-loader" aria-hidden="true"></i>Running';
  if(rs)rs.textContent='Running';

  const runBtn=document.getElementById('ds-run-btn');const stopBtn=document.getElementById('ds-stop-btn');
  dsRunning=true;
  if(runBtn)runBtn.style.display='none';
  if(stopBtn)stopBtn.style.display='inline-flex';

  const gc=document.getElementById('ds-game');const pf=document.getElementById('ds-preview-box');const ob=document.getElementById('ds-output-box');

  if(dsLang==='html'){
    gc.style.display='none';pf.style.display='block';ob.style.display='none';
    const pv=document.getElementById('ds-preview-frame');
    pv.srcdoc=code;
    dsLog('✓ Rendered your HTML','ok');
    dsRunFinish(true);
    return;
  }

  if(dsLang==='css'){
    gc.style.display='none';pf.style.display='block';ob.style.display='none';
    const pv=document.getElementById('ds-preview-frame');
    const demo='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>'+code+'</style></head><body style="font-family:sans-serif;background:#0a0a0a;color:#e2e2f0;padding:1rem;margin:0">'+
      '<h1>CSS Preview</h1><p>Your styles applied to this demo page.</p>'+
      '<div class="box" style="width:80px;height:80px;background:#34d399;margin:.5rem 0"></div>'+
      '<button class="btn">Button</button> <button class="button">Primary</button>'+
      '<div class="card" style="padding:1rem;margin-top:.5rem;border:1px solid #333">Card</div>'+
      '</body></html>';
    pv.srcdoc=demo;
    dsLog('✓ CSS applied to demo page','ok');
    dsRunFinish(true);
    return;
  }

  if(dsLang==='c'||dsLang==='cpp'){
    gc.style.display='none';pf.style.display='none';ob.style.display='block';
    ob.style.alignItems='';ob.style.justifyContent='';
    const langLabel=dsLang==='cpp'?'C++':'C';
    ob.innerHTML='<span style="color:rgba(250,204,21,.7)">Loading '+langLabel+' runtime…</span>';
    if(badge){badge.textContent='● Loading…';badge.style.color='#facc15'}
    if(dsLang==='c'){
      // JSCPP — real C interpreter that runs in the browser
      ensureJSCPP().then(JSCPP=>{
        const outLines=[];
        const config={
          stdio:{
            write:(s)=>{outLines.push({t:'out',m:s});dsLog(s,'ok')}
          },
          maxExecutionStep:1e6
        };
        try{
          const exitCode=JSCPP.run(code,'',config);
          if(outLines.length===0)outLines.push({t:'info',m:'// No output — use printf() to print values'});
          outLines.push({t:'ok',m:'// Process exited with code '+exitCode});
          dsLog('✓ C program ran successfully (exit code '+exitCode+')','ok');
          dsBuildOutputPanel(outLines);
          dsLastError=null;dsClearErrorLine();
          dsRunFinish(true);
        }catch(e){
          const msg=String(e.message||e);
          const lineMatch=msg.match(/line[:\s]*(\d+)/i);
          const line=lineMatch?parseInt(lineMatch[1]):null;
          const tip=dsGetCTip(msg);
          dsLastError={message:msg,tip};
          dsLog('✗ '+msg,'err');
          dsLog('💡 '+tip,'info');
          if(line)dsMarkErrorLine(line);
          dsBuildOutputPanel([{t:'err',m:'✗ '+msg},{t:'info',m:'💡 '+tip}]);
          dsRunFinish(false);
        }
      }).catch(err=>{
        ob.innerHTML='<span style="color:#f87171">Could not load C runtime — check your connection.</span>';
        dsLog('✗ '+err.message,'err');
        dsRunFinish(false);
      });
    } else {
      // C++ — use Pyodide to run through its ctypes/cffi simulation
      // Falls back to a readable simulation if Pyodide unavailable
      ensurePyodide().then(py=>{
        const outLines=[];
        // Translate simple C++ cout to Python print via Pyodide
        // For real C++: use a Pyodide-side subprocess or cppimport
        // We do a practical approach: transpile simple cout/cin to Python calls
        const pyCode=cppToPythonSim(code);
        try{
          py.setStdout({batched:(s)=>{outLines.push({t:'out',m:s});dsLog(s,'ok')}});
          py.setStderr({batched:(s)=>{outLines.push({t:'err',m:s});dsLog(s,'err')}});
          py.runPython(pyCode);
          if(outLines.length===0)outLines.push({t:'info',m:'// No output — use std::cout to print values'});
          dsLog('✓ C++ ran (via simulation — full compiler coming soon)','ok');
          dsBuildOutputPanel(outLines);
          dsLastError=null;dsClearErrorLine();
          dsRunFinish(true);
        }catch(e){
          const tip=dsGetCTip(e.message);
          dsLastError={message:e.message,tip};
          dsLog('✗ '+e.message,'err');
          dsLog('💡 '+tip,'info');
          dsBuildOutputPanel([{t:'err',m:'✗ '+e.message},{t:'info',m:'💡 '+tip}]);
          dsRunFinish(false);
        }
      }).catch(()=>{
        // Offline fallback — run a safe JS-side C++ simulation
        const outLines=cppSimulate(code);
        dsBuildOutputPanel(outLines);
        dsLog('✓ C++ simulation complete','ok');
        dsRunFinish(true);
      });
    }
    return;
  }

  if(dsLang==='python'){
    gc.style.display='none';pf.style.display='none';ob.style.display='block';
    ob.style.alignItems='';ob.style.justifyContent='';
    ob.innerHTML='<span style="color:rgba(250,204,21,.7)">Loading the Python runtime (first run only, needs internet)…</span>';
    if(badge){badge.textContent='● Loading…';badge.style.color='#facc15'}
    ensurePyodide().then(py=>{
      const outLines=[];
      try{
        py.setStdout({batched:(s)=>{outLines.push({t:'ok',m:s});dsLog(s,'ok')}});
        py.setStderr({batched:(s)=>{outLines.push({t:'err',m:s});dsLog(s,'err')}});
      }catch(e){}
      try{
        py.runPython(code);
        dsLog('✓ Ran successfully','ok');
        dsBuildOutputPanel(outLines.length?outLines:[{t:'info',m:'// No output — use print() to display values'}]);
        dsLastError=null;dsClearErrorLine();
        dsRunFinish(true);
      }catch(e){
        const tip="Python error — check indentation, missing colons after if/for/def, or a name used before it's defined.";
        dsLastError={message:e.message,tip};
        dsLog('✗ '+e.message,'err');
        dsLog('💡 '+tip,'info');
        dsBuildOutputPanel([{t:'err',m:e.message},{t:'info',m:'💡 '+tip}]);
        dsRunFinish(false);
      }
    }).catch(err=>{
      dsLog('✗ Could not load the Python runtime: '+err.message,'err');
      dsLog('(Running Python in-browser needs an internet connection the first time.)','info');
      ob.innerHTML='<span style="color:#f87171">Could not load Python runtime — check your connection.</span>';
      dsRunFinish(false);
    });
    return;
  }

  // JavaScript — real sandboxed execution
  gc.style.display='none';pf.style.display='none';ob.style.display='block';
  ob.style.alignItems='';ob.style.justifyContent='';
  const logs=[];
  const fakeConsole={
    log:(...a)=>{const m=a.map(dsStringify).join(' ');logs.push({t:'out',m});dsLog(m,'ok')},
    error:(...a)=>{const m=a.map(dsStringify).join(' ');logs.push({t:'err',m:'✗ '+m});dsLog('✗ '+m,'err')},
    warn:(...a)=>{const m=a.map(dsStringify).join(' ');logs.push({t:'warn',m:'⚠ '+m});dsLog('⚠ '+m,'info')},
    info:(...a)=>{const m=a.map(dsStringify).join(' ');logs.push({t:'info',m:'ℹ '+m});dsLog('ℹ '+m,'info')}
  };
  try{
    const runCode=code.replace(/^import\s.+?;?\s*$/gm,'').replace(/^export\s+(default\s+)?/gm,'');
    const fn=new Function('console',runCode);
    const result=fn(fakeConsole);
    if(result!==undefined&&logs.length===0){
      const s=dsStringify(result);
      logs.push({t:'ok',m:'← '+s});dsLog('← '+s,'ok');
    }
    dsLog('✓ Ran successfully','ok');
    dsBuildOutputPanel(logs.length?logs:[{t:'info',m:'// No output — use console.log() to print values'}]);
    dsLastError=null;dsClearErrorLine();
    dsRunFinish(true);
  }catch(e){
    const diag=dsDiagnose(e);
    dsLastError={message:e.message,tip:diag.tip};
    dsLog('✗ '+e.name+': '+e.message,'err');
    dsLog('💡 '+diag.tip,'info');
    dsMarkErrorLine(diag.line);
    dsBuildOutputPanel([{t:'err',m:'✗ '+e.name+': '+e.message},{t:'info',m:'💡 '+diag.tip}]);
    dsRunFinish(false);
  }
}
function dsStringify(a){
  if(typeof a==='object'&&a!==null){try{return JSON.stringify(a,null,2)}catch(e){return String(a)}}
  return String(a);
}
function dsBuildOutputPanel(logs){
  const ob=document.getElementById('ds-output-box');if(!ob)return;
  let html='<div style="text-align:left;width:100%">';
  logs.forEach(l=>{
    const color={out:'#e2e2f0',err:'#f87171',warn:'#fb923c',info:'rgba(52,211,153,.6)',ok:'#34d399'}[l.t]||'#e2e2f0';
    html+='<div style="color:'+color+';border-bottom:.5px solid rgba(52,211,153,.05);padding:.15rem 0">'+dsEscHtml(l.m)+'</div>';
  });
  html+='</div>';
  ob.innerHTML=html;
}
function dsRunFinish(success){
  dsRunning=false;
  const runBtn=document.getElementById('ds-run-btn');const stopBtn=document.getElementById('ds-stop-btn');
  if(runBtn)runBtn.style.display='inline-flex';
  if(stopBtn)stopBtn.style.display='none';
  const badge=document.getElementById('ds-badge');const stat=document.getElementById('ds-stat-status');const rs=document.getElementById('ds-runstatus');
  if(badge){badge.textContent=success?'● Done':'● Error';badge.style.color=success?'#34d399':'#f87171'}
  if(stat)stat.innerHTML=success?'<i class="ti ti-circle-check" aria-hidden="true"></i>Done':'<i class="ti ti-alert-triangle" aria-hidden="true"></i>Error';
  if(rs)rs.textContent=success?'Done':'Error';
}
let pyodideInstance=null;
function ensurePyodide(){
  if(pyodideInstance)return Promise.resolve(pyodideInstance);
  return new Promise((resolve,reject)=>{
    if(window.loadPyodide){loadPyodide().then(py=>{pyodideInstance=py;resolve(py)}).catch(reject);return}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    s.onload=()=>{loadPyodide().then(py=>{pyodideInstance=py;resolve(py)}).catch(reject)};
    s.onerror=()=>reject(new Error('network error'));
    document.head.appendChild(s);
  });
}

let jscppInstance=null;
function ensureJSCPP(){
  if(jscppInstance)return Promise.resolve(jscppInstance);
  return new Promise((resolve,reject)=>{
    if(window.JSCPP){jscppInstance=window.JSCPP;resolve(jscppInstance);return}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/JSCPP@2.1.2/dist/JSCPP.es5.min.js';
    s.onload=()=>{
      if(window.JSCPP){jscppInstance=window.JSCPP;resolve(jscppInstance)}
      else reject(new Error('JSCPP not found after load'));
    };
    s.onerror=()=>reject(new Error('network error loading JSCPP'));
    document.head.appendChild(s);
  });
}

function dsGetCTip(msg){
  const m=String(msg);
  if(/undeclared|undefined|not declared/i.test(m))return "You used a variable or function that hasn't been declared. Check the spelling and make sure you declared it before using it.";
  if(/expected\s*;/i.test(m))return "Missing semicolon — C and C++ require a ; at the end of most statements.";
  if(/expected.*\)/i.test(m))return "Missing closing parenthesis ) — check your function calls and conditions.";
  if(/expected.*\}/i.test(m))return "Missing closing brace } — every opening { needs a matching }.";
  if(/cannot\s*convert|no\s*match.*for.*operator/i.test(m))return "Type mismatch — you're assigning or comparing incompatible types. Check your variable declarations.";
  if(/no\s*return/i.test(m))return "Missing return statement — make sure your main() or other non-void functions return a value.";
  if(/segmentation|null\s*pointer|access\s*violation/i.test(m))return "Memory error — you likely accessed a null pointer or an array out of bounds.";
  if(/redefinition|already\s*defined/i.test(m))return "You defined the same name twice. Remove or rename the duplicate.";
  return "Check your syntax — look for missing semicolons, unmatched brackets, or undeclared variables near the error line.";
}

// Lightweight C++ → Python translator for simple programs
function cppToPythonSim(cpp){
  let py=cpp;
  // Remove #include and using namespace
  py=py.replace(/#include\s*<[^>]*>\s*/g,'').replace(/using\s+namespace\s+\w+;\s*/g,'');
  // cout << ... << endl  →  print(...)
  py=py.replace(/std::cout\s*<<\s*/g,'__OUT__').replace(/cout\s*<<\s*/g,'__OUT__');
  py=py.replace(/((?:__OUT__[^;]*)+);\s*/g,(m)=>{
    const parts=m.replace(/__OUT__/g,'').replace(/;\s*$/,'').split('<<').map(s=>s.trim()).filter(Boolean);
    const filtered=parts.filter(p=>p!=='std::endl'&&p!=='endl'&&p!=='"\\n"'&&p!=="'\\n'");
    return 'print('+filtered.join(', ')+')\n';
  });
  // int main() { ... } → unwrap body
  py=py.replace(/int\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/,(m,body)=>body);
  // return 0; → pass
  py=py.replace(/return\s+0\s*;\s*/g,'');
  // int/float/double/string declarations → Python assignments
  py=py.replace(/(?:int|float|double|long|short|char)\s+(\w+)\s*=\s*([^;]+);/g,'$1 = $2');
  py=py.replace(/std::string\s+(\w+)\s*=\s*([^;]+);/g,'$1 = $2');
  // std::vector<T> v = {...}
  py=py.replace(/std::vector<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\};/g,'$1 = [$2]');
  // Range-based for: for (int n : nums) → for n in nums:
  py=py.replace(/for\s*\(\s*(?:int|auto|float|double)\s+(\w+)\s*:\s*(\w+)\s*\)\s*\{/g,'for $1 in $2:');
  // std::sort → sort (import added separately)
  py='from sortedcontainers import SortedList\n'+py.replace(/std::sort\s*\([^)]+\)/g,(m)=>{
    const args=m.replace(/std::sort\s*\(/,'').replace(/\)$/,'').split(',').map(s=>s.trim());
    if(args.length===2){const name=args[0].replace('.begin()','');return name+' = sorted('+name+')';}
    return '# std::sort (not translated)';
  });
  // endl → newline handled by print
  py=py.replace(/std::endl/g,'').replace(/\bendl\b/g,'');
  // Remove C++ block delimiters not translated yet
  py=py.replace(/^\s*\{/gm,'').replace(/^\s*\}/gm,'');
  // Dedent everything
  py=py.split('\n').map(l=>l.trimStart()).join('\n');
  return py;
}

// Offline C++ output simulator (extracts string literals and simple prints)
function cppSimulate(code){
  const out=[];
  const prints=code.match(/cout\s*<<\s*"([^"\\]*)"/g)||[];
  prints.forEach(p=>{const m=p.match(/"([^"\\]*)"/);if(m)out.push({t:'out',m:m[1]})});
  if(out.length===0){
    out.push({t:'info',m:'// C++ output simulation — no printable string literals found'});
    out.push({t:'info',m:'// For full C++ execution, a network connection is required to load the runtime'});
  }
  return out;
}

// ── VS FILE MANAGER ──
let vsFmFiles=[];
let vsFmActiveTab='upload';
function vsOpenFileMgr(){
  const o=document.getElementById('vs-fm-overlay');if(o)o.classList.add('open');
  vsFmTab('upload');
}
function vsCloseFileMgr(){
  const o=document.getElementById('vs-fm-overlay');if(o)o.classList.remove('open');
}
function vsFmTab(tab){
  vsFmActiveTab=tab;
  ['upload','create','library'].forEach(t=>{
    const el=document.getElementById('vs-fm-t-'+t);
    if(el)el.classList.toggle('sel',t===tab);
  });
  const body=document.getElementById('vs-fm-body');if(!body)return;
  if(tab==='upload'){
    body.innerHTML=`
      <div class="vs-fm-drop" id="vs-fm-drop" onclick="document.getElementById('vs-fm-input').click()"
        ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')"
        ondrop="event.preventDefault();this.classList.remove('drag');vsFmHandleDrop(event)">
        <i class="ti ti-cloud-upload"></i>
        <div class="vs-fm-drop-t">Click or drag files here</div>
        <div class="vs-fm-drop-s">Images (PNG, JPG, SVG, GIF), Videos (MP4, WebM)</div>
      </div>
      <input type="file" id="vs-fm-input" accept="image/*,video/*" multiple style="display:none" onchange="vsFmHandleInput(event)">
      <div class="vs-fm-list" id="vs-fm-uploaded-list"></div>`;
    vsFmRenderUploaded();
  } else if(tab==='create'){
    body.innerHTML=`
      <div style="font-family:var(--mono);font-size:9px;color:rgba(34,211,238,.3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:.7rem">Create a new layer or canvas</div>
      <div class="vs-new-grid">
        <div class="vs-new-tile" onclick="vsCreateNew('blank')">
          <i class="ti ti-layout-2"></i>
          <div class="vs-new-tile-t">Blank Canvas</div>
          <div class="vs-new-tile-s">Start with an empty transparent layer</div>
        </div>
        <div class="vs-new-tile" onclick="vsCreateNew('text')">
          <i class="ti ti-letter-t"></i>
          <div class="vs-new-tile-t">Text Layer</div>
          <div class="vs-new-tile-s">Add editable text to your scene</div>
        </div>
        <div class="vs-new-tile" onclick="vsCreateNew('shape')">
          <i class="ti ti-square-rotated"></i>
          <div class="vs-new-tile-t">Shape Layer</div>
          <div class="vs-new-tile-s">Rectangle, circle or polygon</div>
        </div>
        <div class="vs-new-tile" onclick="vsCreateNew('gradient')">
          <i class="ti ti-color-swatch"></i>
          <div class="vs-new-tile-t">Gradient Layer</div>
          <div class="vs-new-tile-s">Solid colour or gradient fill</div>
        </div>
        <div class="vs-new-tile" onclick="vsCreateNew('draw')">
          <i class="ti ti-pencil"></i>
          <div class="vs-new-tile-t">Draw Layer</div>
          <div class="vs-new-tile-s">Freehand pen on the canvas</div>
        </div>
        <div class="vs-new-tile" onclick="vsCreateNew('video')">
          <i class="ti ti-movie"></i>
          <div class="vs-new-tile-t">Video Layer</div>
          <div class="vs-new-tile-s">Import an MP4/WebM clip</div>
        </div>
      </div>`;
  } else if(tab==='library'){
    body.innerHTML=`<div style="font-family:var(--mono);font-size:9px;color:rgba(34,211,238,.3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:.7rem">Uploaded files in this session</div><div class="vs-fm-list" id="vs-fm-lib-list"></div>`;
    const lib=document.getElementById('vs-fm-lib-list');
    if(!lib)return;
    if(!vsFmFiles.length){lib.innerHTML='<div class="vs-fm-empty">No files uploaded yet.<br>Use "Upload &amp; Edit" to add files.</div>';return;}
    lib.innerHTML=vsFmFiles.map((f,i)=>`
      <div class="vs-fm-file">
        <i class="ti ${f.type.startsWith('video')?'ti-movie':'ti-photo'}"></i>
        <span class="vs-fm-fn">${escapeHtml(f.name)}</span>
        <span class="vs-fm-fs">${(f.size/1024).toFixed(0)} KB</span>
        <button class="vs-fm-btn-use" onclick="vsFmAddToScene(${i})">+ Add to scene</button>
        <button class="vs-fm-btn-rm" onclick="vsFmRemove(${i})" title="Remove">✕</button>
      </div>`).join('');
  }
}
function vsFmHandleInput(e){
  Array.from(e.target.files).forEach(f=>vsFmFiles.push(f));
  vsFmRenderUploaded();
}
function vsFmHandleDrop(e){
  Array.from(e.dataTransfer.files).forEach(f=>vsFmFiles.push(f));
  vsFmRenderUploaded();
}
function vsFmRenderUploaded(){
  const list=document.getElementById('vs-fm-uploaded-list');if(!list)return;
  if(!vsFmFiles.length){list.innerHTML='<div class="vs-fm-empty">No files yet — upload above.</div>';return;}
  list.innerHTML=vsFmFiles.map((f,i)=>`
    <div class="vs-fm-file">
      <i class="ti ${f.type.startsWith('video')?'ti-movie':'ti-photo'}"></i>
      <span class="vs-fm-fn">${escapeHtml(f.name)}</span>
      <span class="vs-fm-fs">${(f.size/1024).toFixed(0)} KB</span>
      <button class="vs-fm-btn-use" onclick="vsFmAddToScene(${i})">+ Add to scene</button>
      <button class="vs-fm-btn-rm" onclick="vsFmRemove(${i})" title="Remove">✕</button>
    </div>`).join('');
}
function vsFmAddToScene(i){
  const f=vsFmFiles[i];if(!f)return;
  const t=f.type.startsWith('video')?'video':'image';
  const url=URL.createObjectURL(f);
  const ev={target:{files:[f]}};
  // Use existing vsHandleFile but with object URL approach
  if(vsProj){
    const id=uid();
    const layer={id,name:f.name,type:t,src:url,x:0,y:0,w:640,h:360,opacity:1,start:0,end:vsProj.duration,keyframes:[],_url:url};
    if(t==='image'){const img=new Image();img.src=url;layer._img=img;}
    else{const v=document.createElement('video');v.src=url;v.loop=true;v.muted=true;layer._vidEl=v;}
    vsProj.layers.unshift(layer);vsProj.sel=id;
    touchProj('vs');vsRenderAll();vsDrawPreview();
    showToast(f.name+' added to scene');
    vsCloseFileMgr();
  }
}
function vsFmRemove(i){vsFmFiles.splice(i,1);vsFmRenderUploaded();}
function vsCreateNew(type){
  if(!vsProj)return;
  const id=uid();
  const names={blank:'Canvas',text:'Text Layer',shape:'Shape',gradient:'Gradient',draw:'Draw Layer',video:'Video Layer'};
  const layer={id,name:names[type]||type,type,x:0,y:0,w:640,h:360,opacity:1,start:0,end:vsProj.duration,keyframes:[]};
  if(type==='text'){layer.text='New Text';layer.fontSize=48;layer.fill='#ffffff';}
  if(type==='shape'){layer.shape='rect';layer.fill='#8b5cf6';layer.w=200;layer.h=120;}
  if(type==='gradient'){layer.g1='#8b5cf6';layer.g2='#22d3ee';}
  if(type==='draw'){layer.strokes=[];layer.drawColor=vsDrawColor;layer.drawSize=vsDrawSize;}
  vsProj.layers.unshift(layer);vsProj.sel=id;
  touchProj('vs');vsRenderAll();vsDrawPreview();
  showToast(names[type]+' created');
  vsCloseFileMgr();
}

// ── VS CANVAS DRAWING ──
let vsDrawing=false,vsLastPt=null,vsDrawColor='#c084fc',vsDrawSize=4;
function vsGetCanvasPoint(e,canvas){
  const r=canvas.getBoundingClientRect();
  const sx=640/r.width,sy=360/r.height;
  return {x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
}
function vsDrawStart(e){
  const layer=vsProj&&vsProj.layers.find(l=>l.id===vsProj.sel);
  if(!layer||layer.type!=='draw')return;
  vsDrawing=true;
  const pt=vsGetCanvasPoint(e,e.target);
  vsLastPt=pt;
  if(!layer.strokes)layer.strokes=[];
  layer.strokes.push({color:layer.drawColor||vsDrawColor,size:layer.drawSize||vsDrawSize,pts:[pt]});
}
function vsDrawMove(e){
  if(!vsDrawing)return;
  const layer=vsProj&&vsProj.layers.find(l=>l.id===vsProj.sel);
  if(!layer||layer.type!=='draw'||!layer.strokes||!layer.strokes.length)return;
  const pt=vsGetCanvasPoint(e,e.target);
  const stroke=layer.strokes[layer.strokes.length-1];
  stroke.pts.push(pt);
  vsLastPt=pt;
  vsDrawPreview();
}
function vsDrawEnd(){vsDrawing=false;vsLastPt=null;}

// ── SETTINGS ──
function setT(el,id){
  document.querySelectorAll('.set-ni').forEach(i=>i.classList.remove('sel'));el.classList.add('sel');
  document.querySelectorAll('.set-tc>div').forEach(d=>d.classList.remove('on'));
  const t=document.getElementById(id);if(t)t.classList.add('on');
}

// ── PAYMENT ──
function payPlan(p){
  document.getElementById('ps-m').classList.toggle('sel',p==='m');
  document.getElementById('ps-l').classList.toggle('sel',p==='l');
  const price=document.getElementById('pay-price');const note=document.getElementById('pay-note');
  if(p==='m'){if(price)price.innerHTML='$12 <b>/ month</b>';if(note)note.textContent='Cancel anytime · KES 1,500/mo'}
  else{if(price)price.innerHTML='$89 <b>once</b>';if(note)note.textContent='Lifetime access — yours forever · KES 11,500'}
}

// ── REDEEM CODE ──
let userPlan='standard';
const REDEEM_CODES={'UPDATEREAL':'prototype-plus'};
function redeemCode(){
  const inp=document.getElementById('redeem-inp');
  const msg=document.getElementById('redeem-msg');
  const code=(inp?inp.value:'').trim().toUpperCase();
  if(!code){if(msg){msg.textContent='Enter a code first.';msg.className='redeem-msg err'}return}
  const reward=REDEEM_CODES[code];
  if(reward==='prototype-plus'){
    applyPrototypePlus();
    if(msg){msg.textContent='✓ Code accepted — Prototype+ unlocked for free!';msg.className='redeem-msg ok'}
    if(inp)inp.value='';
  } else {
    if(msg){msg.textContent='✗ Invalid or expired code.';msg.className='redeem-msg err'}
  }
}
function applyPrototypePlus(){
  if(userPlan==='prototype-plus'){showToast('Prototype+ is already active');return}
  userPlan='prototype-plus';
  document.querySelectorAll('.set-tier').forEach(t=>{t.textContent='Prototype+';t.style.color='#22d3ee';t.style.borderColor='rgba(34,211,238,.4)'});
  const planBadge=document.getElementById('billing-plan-badge');
  if(planBadge){planBadge.textContent='Prototype+ — Active';planBadge.style.color='#22d3ee';planBadge.style.borderColor='rgba(34,211,238,.4)'}
  const storageVal=document.getElementById('billing-storage');if(storageVal){storageVal.textContent='Unlimited';storageVal.style.color='#22d3ee'}
  const projVal=document.getElementById('billing-projects');if(projVal){projVal.textContent='Unlimited';projVal.style.color='#22d3ee'}
  const upStrip=document.getElementById('billing-upstrip');if(upStrip)upStrip.style.display='none';
  const cloudLock=document.getElementById('cloud-lock-status');if(cloudLock){cloudLock.textContent='Connected';cloudLock.style.color='#34d399'}
  const homeUp=document.getElementById('home-upgrade-btn');if(homeUp){homeUp.textContent='Prototype+ ✓';homeUp.style.color='#22d3ee';homeUp.style.borderColor='rgba(34,211,238,.4)';homeUp.onclick=()=>showToast('Prototype+ is active on this account')}
  const heroCta=document.getElementById('home-hero-cta');if(heroCta){heroCta.textContent='Prototype+ Active ✓';heroCta.onclick=()=>showToast('Prototype+ is active on this account')}
  showToast('Prototype+ unlocked — all studios upgraded!');
}

// ── AI ASSIST (shared popover) ──
let aiPanelEl=null;
function showAiPanel(anchorBtn,actions){
  closeAiPanel();
  const p=document.createElement('div');p.className='ai-pop';p.id='ai-pop';
  p.innerHTML=actions.map((a,i)=>`<div class="ai-pop-opt" data-i="${i}"><i class="ti ${a.icon}" aria-hidden="true"></i><div><div class="ai-pop-t">${escapeHtml(a.label)}</div><div class="ai-pop-s">${escapeHtml(a.sub||'')}</div></div></div>`).join('');
  document.body.appendChild(p);
  const r=anchorBtn.getBoundingClientRect();
  p.style.position='fixed';p.style.top=(r.bottom+6)+'px';
  const rightEdge=window.innerWidth-r.right;
  p.style.right=Math.max(8,rightEdge)+'px';
  p.querySelectorAll('.ai-pop-opt').forEach((el,idx)=>{el.onclick=(e)=>{e.stopPropagation();actions[idx].fn();closeAiPanel()}});
  aiPanelEl=p;
  setTimeout(()=>document.addEventListener('click',aiPanelOutsideClick),0);
}
function aiPanelOutsideClick(e){if(aiPanelEl&&!aiPanelEl.contains(e.target))closeAiPanel()}
function closeAiPanel(){if(aiPanelEl){aiPanelEl.remove();aiPanelEl=null;document.removeEventListener('click',aiPanelOutsideClick)}}

function tbAiOpen(btn){
  if(!tbProj){showToast('Open a project first');return}
  showAiPanel(btn,[
    {icon:'ti-sparkles',label:'Generate a beat pattern',sub:'Auto-fill the current pattern',fn:tbAiGeneratePattern},
    {icon:'ti-adjustments-horizontal',label:'Auto-mix levels',sub:'Balance track volumes',fn:tbAiAutoMix},
    {icon:'ti-arrows-shuffle',label:'Suggest a tempo',sub:'Nudge BPM to fit the groove',fn:tbAiSuggestTempo}
  ]);
}
function tbAiGeneratePattern(){
  if(!tbProj)return;
  const pat=tbProj.patterns[tbEditPattern];
  tbProj.tracks.forEach((tr,ti)=>{
    const row=pat[ti];for(let s=0;s<16;s++)row[s]=0;
    if(tr.sound==='kick'){[0,4,8,10,12].forEach(s=>{if(Math.random()<0.85)row[s]=1})}
    else if(tr.sound==='snare'||tr.sound==='clap'){[4,12].forEach(s=>row[s]=1)}
    else if(tr.sound==='hihat'){for(let s=0;s<16;s+=2)if(Math.random()<0.9)row[s]=1}
    else if(tr.sound==='openhat'){if(Math.random()<0.5)row[14]=1}
    else if(tr.sound==='bass'){[0,3,6,8,11,14].forEach(s=>{if(Math.random()<0.6)row[s]=1})}
    else{for(let s=0;s<16;s+=4)if(Math.random()<0.4)row[s]=1}
  });
  touchProj('tb');tbRenderGrid();showToast('Generated a new beat pattern');
}
function tbAiAutoMix(){
  if(!tbProj)return;
  tbProj.tracks.forEach(tr=>{tr.vol=(tr.sound==='kick'||tr.sound==='bass')?0.85:(tr.sound==='snare'||tr.sound==='clap')?0.75:0.6});
  touchProj('tb');tbRebuildAudioGraph();tbRenderTracks();tbRenderMixer();showToast('Levels auto-balanced');
}
function tbAiSuggestTempo(){
  if(!tbProj)return;
  const sugg=[90,100,110,120,128,140,150,160][Math.floor(Math.random()*8)];
  tbProj.bpm=sugg;const v=document.getElementById('tb-bv');if(v)v.textContent=sugg;
  touchProj('tb');showToast('Tempo nudged to '+sugg+' BPM');
}

function vsAiOpen(btn){
  if(!vsProj){showToast('Open a project first');return}
  showAiPanel(btn,[
    {icon:'ti-arrows-horizontal',label:'Auto-arrange timeline',sub:'Spread layers with no overlap',fn:vsAiAutoArrange},
    {icon:'ti-palette',label:'Generate a colour palette',sub:'Recolour layers harmoniously',fn:vsAiPalette},
    {icon:'ti-letter-t',label:'Add a title layer',sub:'Insert an intro text card',fn:vsAiAddTitle}
  ]);
}
function vsAiAutoArrange(){
  if(!vsProj||!vsProj.layers.length)return;
  const n=vsProj.layers.length;const each=vsProj.duration/n;
  vsProj.layers.forEach((l,i)=>{l.start=+(i*each).toFixed(2);l.dur=+Math.max(0.5,each*0.9).toFixed(2)});
  touchProj('vs');vsRenderTimeline();vsRenderLayers();vsDrawPreview();showToast('Layers auto-arranged on the timeline');
}
function vsAiPalette(){
  if(!vsProj||!vsProj.layers.length)return;
  const hueStart=Math.floor(Math.random()*360);
  vsProj.layers.forEach((l,i)=>{const hue=Math.round((hueStart+i*(360/vsProj.layers.length))%360);l.color='hsl('+hue+',70%,60%)'});
  touchProj('vs');vsRenderLayers();vsRenderTimeline();vsDrawPreview();showToast('Generated a new colour palette');
}
function vsAiAddTitle(){
  if(!vsProj)return;
  const l={id:uid(),name:'Title',type:'text',color:'#ffffff',x:Math.round(vsProj.canvasW/2-200),y:Math.round(vsProj.canvasH/2-40),w:400,h:80,opacity:100,rotation:0,text:vsProj.name||'Your Title Here',shape:'rect',start:0,dur:Math.min(3,vsProj.duration),src:null};
  vsProj.layers.push(l);vsProj.sel=l.id;
  touchProj('vs');vsRenderAll();showToast('Added a title layer');
}

const DS_TEMPLATES={
  javascript:"// Click Run to see this in the preview\nconsole.log('Hello from ORDECK!');\n\nif (ctx) {\n  ctx.fillStyle = '#34d399';\n  ctx.fillRect(20, 20, 80, 80);\n}\n",
  html:"<!DOCTYPE html>\n<html>\n<head><style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;padding:1rem}</style></head>\n<body>\n<h1 style=\"color:#22d3ee\">Hello from ORDECK!</h1>\n<p>Edit this HTML and press Run.</p>\n</body>\n</html>",
  css:"body{\n  background:#111;\n  color:#34d399;\n  font-family:sans-serif;\n}\n.box{\n  width:80px;height:80px;background:#34d399;\n}",
  python:"# Pyodide runs this for real in your browser\nprint('Hello from ORDECK!')\nfor i in range(3):\n    print('Count:', i)\n",
  c:"#include <stdio.h>\n\nint main() {\n    printf(\"Hello from ORDECK!\\n\");\n    int arr[] = {5, 3, 8, 1, 9, 2};\n    int n = sizeof(arr) / sizeof(arr[0]);\n    // Simple bubble sort\n    for (int i = 0; i < n-1; i++)\n        for (int j = 0; j < n-i-1; j++)\n            if (arr[j] > arr[j+1]) {\n                int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;\n            }\n    printf(\"Sorted: \");\n    for (int i = 0; i < n; i++) printf(\"%d \", arr[i]);\n    printf(\"\\n\");\n    return 0;\n}\n",
  cpp:"#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::cout << \"Hello from ORDECK!\" << std::endl;\n    std::vector<int> nums = {5, 3, 8, 1, 9, 2};\n    std::sort(nums.begin(), nums.end());\n    std::cout << \"Sorted: \";\n    for (int n : nums) std::cout << n << \" \";\n    std::cout << std::endl;\n    return 0;\n}\n"
};
function dsAiOpen(btn){
  if(!dsProj){showToast('Open a project first');return}
  showAiPanel(btn,[
    {icon:'ti-template',label:'Insert starter template',sub:'Language-appropriate boilerplate',fn:dsAiInsertTemplate},
    {icon:'ti-bulb',label:'Explain last error',sub:dsLastError?dsLastError.message.slice(0,42):'No recent error',fn:dsAiExplainError},
    {icon:'ti-message-2',label:'Add header comment',sub:'Document this file',fn:dsAiAddComment}
  ]);
}
function dsAiInsertTemplate(){
  if(!dsProj)return;
  const tpl=DS_TEMPLATES[dsLang]||DS_TEMPLATES.javascript;
  const ed=document.getElementById('ds-ed');
  if(ed){
    ed.value=ed.value.trim()?ed.value+'\n\n'+tpl:tpl;
    dsProj.files[dsCurFile]=ed.value;dsGutter();touchProj('ds');
  }
  showToast('Inserted a starter template');
}
function dsAiExplainError(){
  if(!dsLastError){showToast('No recent error to explain');return}
  dsLog('— AI explanation —','info');
  dsLog(dsLastError.tip,'info');
}
function dsAiAddComment(){
  if(!dsProj)return;
  const ed=document.getElementById('ds-ed');if(!ed)return;
  const prefix=dsLang==='python'?'# ':dsLang==='html'?'<!-- ':dsLang==='css'?'/* ':dsLang==='c'||dsLang==='cpp'?'// ':'// ';
  const suffix=dsLang==='html'?' -->':dsLang==='css'?' */':'';
  const ext=DS_LANG_EXT[dsLang]||'js';
  const header=prefix+dsCurFile+'.'+ext+' — written in ORDECK Dev Studio'+suffix+'\n';
  ed.value=header+ed.value;
  dsProj.files[dsCurFile]=ed.value;dsGutter();touchProj('ds');
  showToast('Added a header comment');
}

// ── DEV STUDIO ERROR DIAGNOSTICS ──
function dsDiagnose(e){
  let line=null;
  if(e.stack){
    const m=e.stack.match(/<anonymous>:(\d+):(\d+)/);
    if(m)line=Math.max(1,parseInt(m[1],10)-1);
  }
  const msg=e.message||'';
  let tip='Check the line above for typos or logic errors.';
  if(e.name==='SyntaxError')tip="There's likely a missing bracket, parenthesis, or quote — check the structure of your code near this point.";
  else if(e.name==='ReferenceError'&&/is not defined/.test(msg))tip="You used a name that hasn't been declared yet. Check the spelling, or declare it with let/const/var before using it.";
  else if(e.name==='TypeError'&&/is not a function/.test(msg))tip="You tried to call something that isn't a function. Check the name and make sure it's defined before you call it.";
  else if(e.name==='TypeError'&&/Cannot read propert/.test(msg))tip="You tried to read a property on something that's undefined or null. Make sure the variable holds a value before using it.";
  else if(e.name==='RangeError')tip='A value is outside the allowed range — check loop bounds or array sizes.';
  return {line,tip};
}
function dsMarkErrorLine(line){
  dsClearErrorLine();
  if(!line)return;
  const g=document.getElementById('ds-gut');if(!g)return;
  const spans=g.querySelectorAll('.ds-ln');
  if(spans[line-1])spans[line-1].classList.add('err-line');
}
function dsClearErrorLine(){document.querySelectorAll('.ds-ln.err-line').forEach(s=>s.classList.remove('err-line'))}

// ═══════════════════════════════════════
// ENLARGE / FULLSCREEN VIEW
// ═══════════════════════════════════════
function openEnlarge(label, buildFn) {
  const overlay = document.getElementById('enlarge-overlay');
  const content = document.getElementById('enlarge-content');
  const lbl = document.getElementById('enlarge-label');
  if (!overlay || !content) return;
  content.innerHTML = '';
  if (lbl) lbl.textContent = label;
  buildFn(content);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeEnlarge() {
  const overlay = document.getElementById('enlarge-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  // stop any iframe src to avoid background audio
  const iframes = overlay && overlay.querySelectorAll('iframe');
  if (iframes) iframes.forEach(function(f){ f.src = 'about:blank'; });
}
// Esc key closes enlarge
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeEnlarge();
});

// ── Tidal Beat enlarge ──
function enlargeTB() {
  openEnlarge('ORDECK — Tidal Beat · Fullscreen', function(container) {
    // Clone the TB main area (sequencer grid + mixer) into a scrollable div
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;overflow:auto;background:#07030f;padding:1rem';
    // Build a read-only canvas snapshot of the sequencer
    const info = document.createElement('div');
    info.style.cssText = 'font-family:var(--mono);font-size:12px;color:rgba(192,132,252,.55);margin-bottom:1rem;padding:.5rem;border:.5px solid rgba(192,132,252,.18)';
    info.innerHTML = '<i class="ti ti-music"></i>&nbsp; Tidal Beat — Enlarged View &nbsp;|&nbsp; Sequencer grid, mixer and arrangement are shown below at full size.';
    wrap.appendChild(info);
    // Clone the tb-body and tb-mix sections
    const tbBody = document.querySelector('.tb-body');
    const tbMix = document.getElementById('tb-mix');
    const tbArr = document.getElementById('tb-arr');
    if (tbBody) {
      const clone = tbBody.cloneNode(true);
      clone.style.cssText = 'width:100%;overflow:visible;min-height:unset;margin-bottom:1.5rem';
      wrap.appendChild(clone);
    }
    if (tbMix) {
      const clone2 = tbMix.cloneNode(true);
      clone2.style.marginBottom = '1.5rem';
      wrap.appendChild(clone2);
    }
    if (tbArr) {
      const clone3 = tbArr.cloneNode(true);
      wrap.appendChild(clone3);
    }
    if (!tbBody && !tbMix) {
      info.innerHTML = '<i class="ti ti-music"></i>&nbsp; Tidal Beat — open a project first, then press Enlarge again.';
    }
    container.appendChild(wrap);
  });
}

// ── Visual Studio enlarge ──
function enlargeVS() {
  openEnlarge('ORDECK — Visual Studio · Fullscreen', function(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;background:#07111a';
    // Draw the VS canvas into a new large canvas
    const srcCanvas = document.getElementById('vs-pc');
    const srcDraw = document.getElementById('vs-draw');
    if (srcCanvas) {
      const bigCanvas = document.createElement('canvas');
      bigCanvas.width = srcCanvas.width;
      bigCanvas.height = srcCanvas.height;
      bigCanvas.style.cssText = 'display:block;width:100%;height:calc(100% - 40px);object-fit:contain;background:#000';
      const bCtx = bigCanvas.getContext('2d');
      bCtx.drawImage(srcCanvas, 0, 0);
      if (srcDraw) bCtx.drawImage(srcDraw, 0, 0);
      wrap.appendChild(bigCanvas);
      const bar = document.createElement('div');
      bar.style.cssText = 'height:40px;display:flex;align-items:center;padding:0 1rem;background:#07111a;border-top:.5px solid rgba(34,211,238,.13);font-family:var(--mono);font-size:11px;color:rgba(34,211,238,.45);gap:1rem;flex-shrink:0';
      bar.innerHTML = '<i class="ti ti-maximize"></i> Fullscreen canvas preview &nbsp;|&nbsp; Close this view to keep editing';
      wrap.appendChild(bar);
    } else {
      wrap.innerHTML = '<div style="margin:auto;font-family:var(--mono);font-size:13px;color:rgba(34,211,238,.4);text-align:center;padding:2rem">Open a Visual Studio project first,<br>then press Enlarge again.</div>';
    }
    container.appendChild(wrap);
  });
}

// ── Dev Studio enlarge ──
function enlargeDS() {
  openEnlarge('ORDECK — Dev Studio · Fullscreen Output', function(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;background:#010a03';
    // Try to show the output or preview
    const previewBox = document.getElementById('ds-preview-box');
    const outputBox = document.getElementById('ds-output-box');
    const previewFrame = document.getElementById('ds-preview-frame');
    if (previewBox && previewBox.style.display !== 'none' && previewFrame && previewFrame.srcdoc) {
      // Clone iframe with same srcdoc
      const bigFrame = document.createElement('iframe');
      bigFrame.style.cssText = 'width:100%;height:calc(100% - 40px);border:none;display:block';
      bigFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      bigFrame.srcdoc = previewFrame.srcdoc;
      wrap.appendChild(bigFrame);
    } else if (outputBox && outputBox.style.display !== 'none' && outputBox.innerHTML.trim() !== '') {
      const out = document.createElement('div');
      out.style.cssText = 'width:100%;height:calc(100% - 40px);overflow:auto;padding:1.5rem;font-family:var(--mono);font-size:13px;line-height:1.8;background:#010a03;color:#e2e2f0';
      out.innerHTML = outputBox.innerHTML;
      wrap.appendChild(out);
    } else {
      wrap.innerHTML = '<div style="margin:auto;font-family:var(--mono);font-size:13px;color:rgba(52,211,153,.4);text-align:center;padding:2rem">Run your code first, then press Enlarge<br>to see the output fullscreen.</div>';
      container.appendChild(wrap);
      return;
    }
    const bar = document.createElement('div');
    bar.style.cssText = 'height:40px;display:flex;align-items:center;padding:0 1rem;background:#030f09;border-top:.5px solid rgba(52,211,153,.13);font-family:var(--mono);font-size:11px;color:rgba(52,211,153,.45);gap:1rem;flex-shrink:0';
    bar.innerHTML = '<i class="ti ti-maximize"></i> Fullscreen output &nbsp;|&nbsp; Close to return to editor';
    wrap.appendChild(bar);
    container.appendChild(wrap);
  });
}


// ═══════════════════════════════════════
// BACKGROUND MUSIC — Web Audio synth
// Three "tracks": Cosmic Drift, Deep Orbit, Silence
// ═══════════════════════════════════════
var bgmCtx = null, bgmGain = null, bgmNodes = [], bgmCurrent = 0, bgmPlaying = false, bgmVol = 0.35;
var bgmCustomUrl = null, bgmCustomAudio = null;
var bgmHidden = false;
var bgmUploadInput = null;

var bgmTracks = [
  { name: 'Cosmic Drift',  desc: 'Chill · Ambient' },
  { name: 'Deep Orbit',    desc: 'Space · Cinematic' },
  { name: 'Silence',       desc: 'No music' }
];

function bgmInit() {
  if (bgmCtx) return;
  try {
    bgmCtx = new (window.AudioContext || window.webkitAudioContext)();
    bgmGain = bgmCtx.createGain();
    bgmGain.gain.value = bgmVol;
    bgmGain.connect(bgmCtx.destination);
  } catch(e) { return; }
}

function bgmStopAll() {
  bgmNodes.forEach(function(n) { try { n.stop(); } catch(e){} try { n.disconnect(); } catch(e){} });
  bgmNodes = [];
  if (bgmCustomAudio) { bgmCustomAudio.pause(); bgmCustomAudio.currentTime = 0; }
}

function bgmPlay(idx) {
  bgmStopAll();
  bgmCurrent = idx;
  bgmPlaying = false;
  bgmUpdateUI();
  if (idx === 2) { bgmSetPlayIcon(false); return; } // Silence
  if (!bgmCtx) bgmInit();
  if (!bgmCtx) return;
  if (bgmCtx.state === 'suspended') bgmCtx.resume();

  if (bgmCustomUrl && idx === 3) {
    // Custom track
    if (!bgmCustomAudio) bgmCustomAudio = new Audio(bgmCustomUrl);
    bgmCustomAudio.volume = bgmVol;
    bgmCustomAudio.loop = true;
    bgmCustomAudio.play().catch(function(){});
    bgmPlaying = true;
    bgmSetPlayIcon(true);
    return;
  }

  bgmPlaying = true;
  bgmSetPlayIcon(true);
  if (idx === 0) bgmSynthChill();
  if (idx === 1) bgmSynthSpace();
}

// ── Track 0: Cosmic Drift — warm pad + slow LFO ──
function bgmSynthChill() {
  if (!bgmCtx || !bgmGain) return;
  var t = bgmCtx.currentTime;
  // Chord progression: Am, F, C, G (loop every 16s)
  var chords = [
    [220, 261.6, 329.6],   // Am
    [174.6, 220, 261.6],   // F
    [130.8, 164.8, 196],   // C
    [196, 246.9, 293.7]    // G
  ];
  var dur = 4.0; // seconds per chord
  var totalBars = 4;
  for (var ci = 0; ci < totalBars; ci++) {
    var chord = chords[ci];
    var start = t + ci * dur;
    chord.forEach(function(freq) {
      var osc = bgmCtx.createOscillator();
      var vca = bgmCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      // subtle detune for warmth
      osc.detune.value = (Math.random() - 0.5) * 8;
      vca.gain.setValueAtTime(0, start);
      vca.gain.linearRampToValueAtTime(0.06, start + 0.6);
      vca.gain.linearRampToValueAtTime(0.05, start + dur - 0.5);
      vca.gain.linearRampToValueAtTime(0, start + dur + 0.1);
      // LFO tremolo
      var lfo = bgmCtx.createOscillator();
      var lfoGain = bgmCtx.createGain();
      lfo.frequency.value = 0.5 + Math.random() * 0.3;
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(vca.gain);
      osc.connect(vca);
      vca.connect(bgmGain);
      // slight reverb via delay
      var delay = bgmCtx.createDelay(2);
      var delayGain = bgmCtx.createGain();
      delay.delayTime.value = 0.35;
      delayGain.gain.value = 0.25;
      vca.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(bgmGain);
      osc.start(start);
      lfo.start(start);
      osc.stop(start + dur + 0.2);
      lfo.stop(start + dur + 0.2);
      bgmNodes.push(osc);
      bgmNodes.push(lfo);
    });
  }
  // Low sub bass pulse
  var subFreqs = [55, 43.65, 65.4, 49];
  for (var bi = 0; bi < totalBars; bi++) {
    var sub = bgmCtx.createOscillator();
    var subVca = bgmCtx.createGain();
    sub.type = 'sine';
    sub.frequency.value = subFreqs[bi];
    var bs = t + bi * dur;
    subVca.gain.setValueAtTime(0, bs);
    subVca.gain.linearRampToValueAtTime(0.04, bs + 0.3);
    subVca.gain.linearRampToValueAtTime(0.03, bs + dur - 0.3);
    subVca.gain.linearRampToValueAtTime(0, bs + dur);
    sub.connect(subVca);
    subVca.connect(bgmGain);
    sub.start(bs);
    sub.stop(bs + dur + 0.1);
    bgmNodes.push(sub);
  }
  // Loop: reschedule after 16s
  var loopTimer = setTimeout(function() {
    if (bgmPlaying && bgmCurrent === 0) bgmSynthChill();
  }, totalBars * dur * 1000 - 200);
  bgmNodes.push({ stop: function(){ clearTimeout(loopTimer); }, disconnect: function(){} });
}

// ── Track 1: Deep Orbit — sparse drones + shimmer ──
function bgmSynthSpace() {
  if (!bgmCtx || !bgmGain) return;
  var t = bgmCtx.currentTime;
  var drones = [60, 90, 120, 180]; // Hz — deep fifths
  var total = 20; // 20 second cycle
  drones.forEach(function(freq, di) {
    var osc = bgmCtx.createOscillator();
    var osc2 = bgmCtx.createOscillator(); // slight detune copy
    var vca = bgmCtx.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'sine';
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 1.003;
    osc.detune.value = -4;
    // filter for softness
    var filt = bgmCtx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 800;
    filt.Q.value = 1;
    var vol = di === 0 ? 0.07 : di === 1 ? 0.04 : 0.025;
    vca.gain.setValueAtTime(0, t);
    vca.gain.linearRampToValueAtTime(vol, t + 3);
    vca.gain.linearRampToValueAtTime(vol * 0.7, t + total - 3);
    vca.gain.linearRampToValueAtTime(0, t + total);
    // slow LFO
    var lfo = bgmCtx.createOscillator();
    var lg = bgmCtx.createGain();
    lfo.frequency.value = 0.1 + di * 0.07;
    lg.gain.value = 0.015;
    lfo.connect(lg); lg.connect(vca.gain);
    osc.connect(filt); osc2.connect(filt);
    filt.connect(vca); vca.connect(bgmGain);
    // long echo
    var echo = bgmCtx.createDelay(4);
    var echoGain = bgmCtx.createGain();
    echo.delayTime.value = 0.8 + di * 0.2;
    echoGain.gain.value = 0.18;
    vca.connect(echo); echo.connect(echoGain); echoGain.connect(bgmGain);
    osc.start(t); osc2.start(t); lfo.start(t);
    osc.stop(t + total + 0.2); osc2.stop(t + total + 0.2); lfo.stop(t + total + 0.2);
    bgmNodes.push(osc); bgmNodes.push(osc2); bgmNodes.push(lfo);
  });
  // Shimmer: high frequency sparkles
  for (var si = 0; si < 5; si++) {
    (function(i) {
      var sparkTimer = setTimeout(function() {
        if (!bgmPlaying || bgmCurrent !== 1 || !bgmCtx) return;
        var sp = bgmCtx.createOscillator();
        var spVca = bgmCtx.createGain();
        sp.type = 'sine';
        sp.frequency.value = 1200 + Math.random() * 2400;
        var st = bgmCtx.currentTime;
        spVca.gain.setValueAtTime(0, st);
        spVca.gain.linearRampToValueAtTime(0.015, st + 0.1);
        spVca.gain.exponentialRampToValueAtTime(0.0001, st + 1.5);
        sp.connect(spVca); spVca.connect(bgmGain);
        sp.start(st); sp.stop(st + 1.6);
        bgmNodes.push(sp);
      }, i * (total / 5) * 1000 * Math.random());
      bgmNodes.push({ stop: function(){ clearTimeout(sparkTimer); }, disconnect: function(){} });
    })(si);
  }
  // Loop after 20s
  var loopTimer = setTimeout(function() {
    if (bgmPlaying && bgmCurrent === 1) bgmSynthSpace();
  }, total * 1000 - 300);
  bgmNodes.push({ stop: function(){ clearTimeout(loopTimer); }, disconnect: function(){} });
}

// ── Controls ──
function bgmToggle() {
  if (bgmCurrent === 2) { showToast('Switch to a music track in Settings → Audio'); return; }
  if (bgmPlaying) {
    bgmStopAll();
    bgmPlaying = false;
    bgmSetPlayIcon(false);
    if (bgmCtx) bgmCtx.suspend();
  } else {
    if (bgmCtx && bgmCtx.state === 'suspended') bgmCtx.resume();
    bgmPlay(bgmCurrent);
  }
}
function bgmNext() {
  var next = (bgmCurrent + 1) % bgmTracks.length;
  bgmPlay(next);
  bgmSelectOpt(next);
}
function bgmPrev() {
  var prev = (bgmCurrent - 1 + bgmTracks.length) % bgmTracks.length;
  bgmPlay(prev);
  bgmSelectOpt(prev);
}
function bgmGoTo(idx) {
  bgmPlay(idx);
}
function bgmSetVol(v) {
  bgmVol = parseFloat(v);
  if (bgmGain) bgmGain.gain.value = bgmVol;
  if (bgmCustomAudio) bgmCustomAudio.volume = bgmVol;
  // sync both volume sliders
  document.querySelectorAll('.bgm-vol').forEach(function(s){ s.value = bgmVol; });
}
function bgmSetPlayIcon(playing) {
  var icon = document.getElementById('bgm-play-icon');
  if (icon) icon.className = playing ? 'ti ti-player-pause' : 'ti ti-player-play';
  var btn = document.getElementById('bgm-play');
  if (btn) btn.classList.toggle('active', playing);
}
function bgmUpdateUI() {
  var nameEl = document.getElementById('bgm-track-name');
  if (nameEl) nameEl.textContent = bgmCurrent < bgmTracks.length ? bgmTracks[bgmCurrent].name : 'Custom';
  var dots = document.querySelectorAll('.bgm-dot');
  dots.forEach(function(d, i){ d.classList.toggle('on', i === bgmCurrent); });
}
function bgmSelectOpt(idx) {
  for (var i = 0; i < bgmTracks.length; i++) {
    var el = document.getElementById('bto-' + i);
    if (el) el.classList.toggle('sel', i === idx);
  }
  bgmUpdateUI();
}
function bgmHide() {
  var bar = document.getElementById('bgm-bar');
  if (bar) bar.classList.add('hidden');
  bgmHidden = true;
}
function bgmShow() {
  var bar = document.getElementById('bgm-bar');
  if (bar) bar.classList.remove('hidden');
  bgmHidden = false;
}
function bgmSettingToggle(tog) {
  tog.classList.toggle('off');
  var on = !tog.classList.contains('off');
  if (on) { bgmShow(); bgmPlay(bgmCurrent); }
  else { bgmStopAll(); bgmPlaying = false; bgmSetPlayIcon(false); bgmHide(); }
}
function bgmUpload() {
  if (!bgmUploadInput) {
    bgmUploadInput = document.createElement('input');
    bgmUploadInput.type = 'file';
    bgmUploadInput.accept = 'audio/*';
    bgmUploadInput.onchange = function() {
      var file = bgmUploadInput.files[0];
      if (!file) return;
      var url = URL.createObjectURL(file);
      bgmCustomUrl = url;
      bgmCustomAudio = new Audio(url);
      bgmCustomAudio.loop = true;
      bgmCustomAudio.volume = bgmVol;
      // Add as track 3
      bgmTracks[3] = { name: file.name.replace(/\.[^.]+$/, ''), desc: 'Your upload' };
      // Update dots
      var dots = document.getElementById('bgm-dots');
      if (dots) dots.innerHTML = '<div class="bgm-dot" onclick="bgmGoTo(0)" title="Cosmic Drift"></div><div class="bgm-dot" onclick="bgmGoTo(1)" title="Deep Orbit"></div><div class="bgm-dot" onclick="bgmGoTo(2)" title="Silence"></div><div class="bgm-dot on" onclick="bgmGoTo(3)" title="Custom"></div>';
      // Show in settings
      var nm = document.getElementById('bgm-custom-name');
      if (nm) { nm.textContent = '♪ ' + file.name; nm.style.display = 'block'; }
      bgmPlay(3);
      bgmSelectOpt(3);
      showToast('Now playing: ' + file.name);
    };
  }
  bgmUploadInput.click();
}
// ── Auto-start on first user interaction ──
(function() {
  function bgmAutoStart() {
    if (bgmPlaying) return;
    bgmInit();
    bgmPlay(0);
    document.removeEventListener('click', bgmAutoStart);
    document.removeEventListener('keydown', bgmAutoStart);
  }
  document.addEventListener('click', bgmAutoStart);
  document.addEventListener('keydown', bgmAutoStart);
  // Also try immediately (works if page was already interacted with)
  setTimeout(function() {
    if (!bgmPlaying) bgmAutoStart();
  }, 1500);
})();


// ═══════════════════════════════════════════════════════
//  ORDECK ACCOUNT SYSTEM
//  - localStorage acts as the "server" (no backend needed)
//  - All user data, projects, plan saved per email key
//  - Premium gates block locked features, redirect to payment
// ═══════════════════════════════════════════════════════

const ORDECK_DB_KEY = 'ordeck_users_db';
const ORDECK_SESSION_KEY = 'ordeck_session';
const PREMIUM_REDEEM_CODES = { 'ORDECK2024': true, 'PROTOTYPE1': true, 'UPDATEREAL': true };

// ── DB helpers ──
function dbLoad() {
  try { return JSON.parse(localStorage.getItem(ORDECK_DB_KEY) || '{}'); } catch(e) { return {}; }
}
function dbSave(db) {
  try { localStorage.setItem(ORDECK_DB_KEY, JSON.stringify(db)); } catch(e) {}
}
function sessionLoad() {
  try { return JSON.parse(localStorage.getItem(ORDECK_SESSION_KEY) || 'null'); } catch(e) { return null; }
}
function sessionSave(email) {
  try { localStorage.setItem(ORDECK_SESSION_KEY, JSON.stringify({ email, ts: Date.now() })); } catch(e) {}
}
function sessionClear() {
  try { localStorage.removeItem(ORDECK_SESSION_KEY); } catch(e) {}
}

// ── Current session ──
var currentUser = null; // { email, name, plan, projects, settings, ... }

function isLoggedIn() { return !!currentUser; }
function isPremium()  { return currentUser && currentUser.plan === 'prototype-plus'; }

// ── Boot: restore session ──

// ── Apply user data to UI elements ──
function applyUserToUI() {
  if (!currentUser) return;
  var name = currentUser.name || currentUser.email.split('@')[0];
  var initials = name.split(' ').map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase();
  // Nav avatars
  document.querySelectorAll('.nav-av').forEach(function(el){ el.textContent = initials; });
  // Settings profile
  var inp = document.getElementById('set-name-inp');
  if (inp) inp.value = name;
  var pn = document.getElementById('set-pname');
  if (pn) pn.textContent = name;
  var em = document.getElementById('set-email-val');
  if (em) em.textContent = currentUser.email;
  var tier = document.querySelectorAll('.set-tier');
  tier.forEach(function(t){ t.textContent = currentUser.plan === 'prototype-plus' ? 'Prototype+' : 'Standard'; });
}

// ── AUTH: Sign in / Sign up ──
function _doAuth() {
  var isSignUp = document.getElementById('at-up') && document.getElementById('at-up').classList.contains('sel');
  var email, password, name;

  if (isSignUp) {
    name     = (document.getElementById('a-name-inp') || {}).value || '';
    email    = (document.getElementById('a-email-up') || {}).value || '';
    password = (document.getElementById('a-pass-up')  || {}).value || '';
    if (!email || !password) { showAuthError('Please fill in all fields.'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
    var db = dbLoad();
    if (db[email]) { showAuthError('An account with this email already exists. Sign in instead.'); return; }
    // Create account
    var newUser = {
      email: email,
      name: name || email.split('@')[0],
      password: btoa(password), // basic obfuscation (not cryptographic — for demo)
      plan: 'standard',
      projects: {},
      settings: {},
      createdAt: Date.now()
    };
    db[email] = newUser;
    dbSave(db);
    currentUser = newUser;
    userPlan = 'standard';
    sessionSave(email);
    applyUserToUI();
    showToast('Account created! Welcome to ORDECK.');
    go('s-tutorial');
  } else {
    email    = (document.getElementById('a-email-si') || {}).value || '';
    password = (document.getElementById('a-pass-si')  || {}).value || '';
    if (!email || !password) { showAuthError('Please enter your email and password.'); return; }
    var db2 = dbLoad();
    var user = db2[email];
    if (!user) { showAuthError('No account found with that email. Create one above.'); return; }
    if (user.password !== btoa(password)) { showAuthError('Incorrect password. Try again.'); return; }
    // Login success — restore all saved data
    currentUser = user;
    userPlan = user.plan || 'standard';
    sessionSave(email);
    applyUserToUI();
    if (userPlan === 'prototype-plus') applyPrototypePlus();
    // Restore saved projects
    if (user.projects) {
      try { localStorage.setItem('ordeck-projects', JSON.stringify(Object.values(user.projects))); } catch(e){}
    }
    showToast('Welcome back, ' + (user.name || email.split('@')[0]) + '!');
    // Restore deep-link if any
    let deepLink2 = null;
    try { deepLink2 = sessionStorage.getItem('ordeck_deeplink'); sessionStorage.removeItem('ordeck_deeplink'); } catch(e){}
    // Check for broadcast message
    try {
      const bcast = localStorage.getItem('ordeck-broadcast');
      if (bcast) showToast('📢 ' + bcast);
    } catch(e){}
    go(deepLink2 || 's-home');
  }
}

function showAuthError(msg) {
  var el = document.getElementById('auth-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-error';
    el.style.cssText = 'font-family:var(--mono);font-size:11px;color:#f87171;text-align:center;margin-top:.5rem;padding:.4rem;background:rgba(248,113,113,.07);border:.5px solid rgba(248,113,113,.2)';
    var box = document.querySelector('.auth-box');
    if (box) box.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(function(){ el.style.display = 'none'; }, 4000);
}

// ── LOGOUT ──
function doLogout() {
  if (!confirm('Log out of ORDECK? Your projects are saved and will be here when you return.')) return;
  // Save current projects to account before logging out
  saveUserData();
  sessionClear();
  currentUser = null;
  userPlan = 'standard';
  // Clear in-memory projects
  try { localStorage.removeItem('ordeck-projects'); } catch(e){}
  showToast('Logged out. See you soon!');
  setTimeout(function(){ go('s-auth'); }, 800);
}

// ── SAVE user data back to DB ──
function saveUserData() {
  if (!currentUser) return;
  // Grab current projects from localStorage
  try {
    var raw = localStorage.getItem('ordeck-projects');
    if (raw) {
      var projs = JSON.parse(raw);
      currentUser.projects = {};
      projs.forEach(function(p){ currentUser.projects[p.id || p.name] = p; });
    }
  } catch(e){}
  // Save settings
  var nameInp = document.getElementById('set-name-inp');
  if (nameInp && nameInp.value) currentUser.name = nameInp.value;
  currentUser.plan = userPlan;
  var db = dbLoad();
  db[currentUser.email] = currentUser;
  dbSave(db);
}

// Auto-save every 60 seconds
setInterval(function(){ if (currentUser) saveUserData(); }, 60000);

// Save on page unload
window.addEventListener('beforeunload', function(){ if (currentUser) saveUserData(); });

// ── SAVE PROFILE ──
function saveProfile() {
  if (!currentUser) { showToast('Log in to save your profile'); return; }
  var nameInp = document.getElementById('set-name-inp');
  if (nameInp) currentUser.name = nameInp.value;
  saveUserData();
  showToast('Profile saved ✓');
}

// ── AUTH GATE (blocks non-logged-in users from studios) ──
var authGateCallback = null;
function requireAuth(callback) {
  if (isLoggedIn()) { if (callback) callback(); return true; }
  var gate = document.getElementById('auth-gate');
  if (gate) gate.classList.add('open');
  authGateCallback = callback || null;
  return false;
}
function closeAuthGate() {
  var gate = document.getElementById('auth-gate');
  if (gate) gate.classList.remove('open');
}

// ── PREMIUM GATE ──
var premGateCallback = null;
function requirePremium(featureName, callback) {
  if (isPremium()) { if (callback) callback(); return true; }
  var gate = document.getElementById('prem-gate');
  var desc = document.getElementById('prem-gate-desc');
  if (desc) desc.textContent = '"' + (featureName || 'This feature') + '" is only available on Prototype+. Upgrade to unlock it.';
  if (gate) gate.classList.add('open');
  premGateCallback = callback || null;
  return false;
}
function closePremGate() {
  var gate = document.getElementById('prem-gate');
  if (gate) gate.classList.remove('open');
}

// ── OVERRIDE go() to enforce auth on protected screens ──
var _originalGo = go;
var AUTH_FREE_SCREENS = ['s-splash','s-auth','s-tutorial'];
go = function(id) {
  // Allow free screens always
  if (AUTH_FREE_SCREENS.indexOf(id) !== -1) { _originalGo(id); return; }
  // Require login for everything else
  if (!isLoggedIn()) {
    requireAuth(function(){ _originalGo(id); });
    return;
  }
  _originalGo(id);
};

// ── PREMIUM FEATURE GATES ──
// AI panels — wrap existing AI open functions
var _tbAiOpen = tbAiOpen;
tbAiOpen = function(btn) {
  requirePremium('AI Assist+ (Tidal Beat)', function(){ _tbAiOpen(btn); });
};
var _vsAiOpen = vsAiOpen;
vsAiOpen = function(btn) {
  requirePremium('AI Animate+ (Visual Studio)', function(){ _vsAiOpen(btn); });
};
var _dsAiOpen = dsAiOpen;
dsAiOpen = function(btn) {
  requirePremium('AI Code+ (Dev Studio)', function(){ _dsAiOpen(btn); });
};

// Export/Render — premium only
var _tbExport = tbExport;
tbExport = function(btn) {
  requirePremium('Export audio (Tidal Beat)', function(){ _tbExport(btn); });
};
var _vsExport = vsExport;
vsExport = function(btn) {
  requirePremium('Render / Export video (Visual Studio)', function(){ _vsExport(btn); });
};

// Project limit — standard users capped at 3
var _touchProj = touchProj;
touchProj = function(studio) {
  if (!isPremium()) {
    try {
      var raw = localStorage.getItem('ordeck-projects');
      var existing = raw ? JSON.parse(raw) : [];
      if (existing.length >= 3) {
        requirePremium('More than 3 projects', null);
        return;
      }
    } catch(e){}
  }
  _touchProj(studio);
};

// ── UPDATE AUTH SCREEN to use new input IDs ──
(function patchAuthInputs() {
  // The auth screen inputs need correct IDs for _doAuth to read
  var siEmail = document.getElementById('a-em');
  var siPass  = document.getElementById('a-pw');
  var upName  = document.getElementById('a-nm');
  var upEmail = document.getElementById('a-em2');
  var upPass  = document.getElementById('a-pw2');
  if (siEmail) siEmail.id = 'a-email-si';
  if (siPass)  siPass.id  = 'a-pass-si';
  if (upName)  upName.id  = 'a-name-inp';
  if (upEmail) upEmail.id = 'a-email-up';
  if (upPass)  upPass.id  = 'a-pass-up';
})();

// ── PREMIUM: also gate applyPrototypePlus to save to account ──
var _applyPrototypePlus = applyPrototypePlus;
applyPrototypePlus = function() {
  _applyPrototypePlus();
  if (currentUser) {
    currentUser.plan = 'prototype-plus';
    userPlan = 'prototype-plus';
    saveUserData();
  }
};

// ── PAYMENT SUCCESS: called after pay button ──
function onPaymentSuccess() {
  if (!isLoggedIn()) { showToast('Please log in first'); go('s-auth'); return; }
  applyPrototypePlus();
  go('s-home');
}


// ═══════════════════════════════════════════════════════
// INSTRUMENTS — Drum Pads + Piano + Recording Mixer
// ═══════════════════════════════════════════════════════

const DRUM_PADS = [
  { name:'Kick',    sound:'kick',    key:'Q', icon:'ti-circle-filled' },
  { name:'Snare',   sound:'snare',   key:'W', icon:'ti-align-center' },
  { name:'Hi-Hat',  sound:'hihat',   key:'E', icon:'ti-wave-sine' },
  { name:'Open Hat',sound:'openhat', key:'R', icon:'ti-wave-saw-tool' },
  { name:'Clap',    sound:'clap',    key:'A', icon:'ti-hand-stop' },
  { name:'Tom Hi',  sound:'tomHi',   key:'S', icon:'ti-circle' },
  { name:'Tom Mid', sound:'tomMid',  key:'D', icon:'ti-circle' },
  { name:'Tom Lo',  sound:'tomLow',  key:'F', icon:'ti-circle' },
  { name:'Bass',    sound:'bass',    key:'Z', icon:'ti-letter-b' },
  { name:'Synth',   sound:'synth',   key:'X', icon:'ti-wave-sine' },
  { name:'Perc',    sound:'perc',    key:'C', icon:'ti-bell' },
  { name:'FX',      sound:'fx',      key:'V', icon:'ti-sparkles' },
];

const DRUM_KEY_MAP = {};
DRUM_PADS.forEach((p,i) => { DRUM_KEY_MAP[p.key] = i; });

let instOpen = false;
let pianoOctave = 4;
let pianoRecording = false;
let pianoNotes = []; // [{note, time}]
let pianoRecStart = 0;

function openInstruments() {
  document.getElementById('tb-inst-overlay').classList.add('open');
  instOpen = true;
  buildDrumPads();
  buildPiano();
  refreshInstRecs();
}
function closeInstruments() {
  document.getElementById('tb-inst-overlay').classList.remove('open');
  instOpen = false;
}
function instTab(el, tab) {
  document.querySelectorAll('.tb-inst-tab').forEach(t => t.classList.remove('sel'));
  el.classList.add('sel');
  document.querySelectorAll('.tb-inst-body').forEach(b => b.classList.remove('active'));
  document.getElementById('inst-' + tab).classList.add('active');
  if (tab === 'recs') refreshInstRecs();
}

// ── Drum Pads ──
function buildDrumPads() {
  const grid = document.getElementById('drum-grid');
  if (!grid) return;
  grid.innerHTML = DRUM_PADS.map((p, i) =>
    `<div class="drum-pad" id="drum-pad-${i}" onclick="hitDrum(${i})" title="${p.key}">
      <i class="ti ${p.icon}" aria-hidden="true"></i>
      <span class="drum-pad-name">${p.name}</span>
      <span class="drum-pad-key">${p.key}</span>
    </div>`
  ).join('');
}

function hitDrum(i) {
  const pad = DRUM_PADS[i];
  ensureAudio();
  // Play the sound using existing playSound system
  if (typeof playSound === 'function' && actx) {
    const g = actx.createGain();
    g.gain.value = 0.8;
    g.connect(actx.destination);
    playSound(actx, pad.sound, g, 'none', actx.currentTime, 0.8, tbProj ? tbProj.bpm : 120, null);
  }
  // Animate pad
  const el = document.getElementById('drum-pad-' + i);
  if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 120); }
  // If beat is playing, record hit into current step
  if (tbProj && tbPlaying) {
    const patKey = tbProj.order[tbStep !== undefined ? Math.floor(tbStep / 16) : 0] || tbProj.order[0];
    const step = tbStep % 16;
    const pat = tbProj.patterns[patKey];
    // Find track matching this sound
    const ti = tbProj.tracks.findIndex(t => t.sound === pad.sound);
    if (ti !== -1 && pat && pat[ti]) {
      pat[ti][step] = 1;
      tbRenderGrid && tbRenderGrid();
    }
  }
}

// Keyboard drum shortcuts
document.addEventListener('keydown', function(e) {
  if (!instOpen) return;
  const activeBody = document.querySelector('.tb-inst-body.active');
  if (!activeBody || activeBody.id !== 'inst-drums') return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const i = DRUM_KEY_MAP[e.key.toUpperCase()];
  if (i !== undefined) hitDrum(i);
});

// ── Piano ──
const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const WHITE_NOTES = ['C','D','E','F','G','A','B'];
const BLACK_NOTES = { 'C#':0, 'D#':1, 'F#':3, 'G#':4, 'A#':5 };
// Black key offsets (white key index → pixel offset)
const BLACK_OFFSETS = [1,2,4,5,6]; // after C,D,F,G,A

function buildPiano() {
  const container = document.getElementById('piano-keys');
  if (!container) return;
  container.innerHTML = '';
  const octaves = 2;
  const wKeyW = 36;
  const totalW = octaves * 7 * wKeyW;
  container.style.width = totalW + 'px';

  for (let oct = 0; oct < octaves; oct++) {
    const octBase = pianoOctave + oct;
    WHITE_NOTES.forEach((note, wi) => {
      const key = document.createElement('div');
      key.className = 'piano-wkey';
      if (wi === 0) {
        const lbl = document.createElement('span');
        lbl.className = 'piano-wkey-lbl';
        lbl.textContent = note + octBase;
        key.appendChild(lbl);
      }
      key.addEventListener('mousedown', () => playPianoNote(note, octBase));
      container.appendChild(key);
    });
    // Black keys
    Object.entries(BLACK_NOTES).forEach(([note, wi]) => {
      const octBase2 = pianoOctave + oct;
      const key = document.createElement('div');
      key.className = 'piano-bkey';
      // Position: each white key is wKeyW px, black keys sit between whites
      const leftOffset = oct * 7 * wKeyW + wi * wKeyW + wKeyW * 0.65;
      key.style.left = leftOffset + 'px';
      const lbl = document.createElement('span');
      lbl.className = 'piano-bkey-lbl';
      lbl.textContent = note + octBase2;
      key.appendChild(lbl);
      key.addEventListener('mousedown', () => playPianoNote(note, octBase2));
      container.appendChild(key);
    });
  }
}

function playPianoNote(note, octave) {
  ensureAudio();
  if (!actx) return;
  const fullNote = note + octave;
  const freq = noteToFreq(note, octave);
  // Synth note via Web Audio
  const osc = actx.createOscillator();
  const env = actx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, actx.currentTime);
  env.gain.linearRampToValueAtTime(0.5, actx.currentTime + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.2);
  osc.connect(env); env.connect(actx.destination);
  osc.start(actx.currentTime); osc.stop(actx.currentTime + 1.2);

  // Update UI
  const lbl = document.getElementById('piano-last-note');
  if (lbl) lbl.textContent = fullNote;

  // Record if recording
  if (pianoRecording) {
    pianoNotes.push({ note: fullNote, freq, time: actx.currentTime - pianoRecStart });
  }
}

function noteToFreq(note, octave) {
  const semitone = NOTES.indexOf(note);
  return 440 * Math.pow(2, (octave - 4) + (semitone - 9) / 12);
}

function pianoOctUp()   { pianoOctave = Math.min(7, pianoOctave + 1); document.getElementById('piano-oct-lbl').textContent = pianoOctave; buildPiano(); }
function pianoOctDown() { pianoOctave = Math.max(1, pianoOctave - 1); document.getElementById('piano-oct-lbl').textContent = pianoOctave; buildPiano(); }

function pianoStartRecord() {
  ensureAudio();
  const btn = document.getElementById('piano-rec-btn');
  if (!pianoRecording) {
    pianoRecording = true; pianoNotes = []; pianoRecStart = actx.currentTime;
    if (btn) { btn.textContent = '⏹ Stop recording'; btn.style.color = '#f87171'; }
    document.getElementById('piano-recorded-info').textContent = '● Recording — play notes now...';
  } else {
    pianoRecording = false;
    if (btn) { btn.textContent = '⏺ Record to track'; btn.style.color = ''; }
    if (pianoNotes.length > 0) {
      addPianoNotesToTrack();
    } else {
      document.getElementById('piano-recorded-info').textContent = 'No notes recorded. Try again.';
    }
  }
}

function addPianoNotesToTrack() {
  if (!tbProj || pianoNotes.length === 0) return;
  ensureAudio();
  // Build an AudioBuffer from the recorded notes
  const duration = pianoNotes[pianoNotes.length - 1].time + 1.5;
  const sr = actx.sampleRate;
  const buf = actx.createBuffer(1, Math.ceil(sr * duration), sr);
  const data = buf.getChannelData(0);
  pianoNotes.forEach(n => {
    const startSample = Math.floor(n.time * sr);
    const noteLen = 0.6; // seconds per note
    for (let s = 0; s < Math.floor(noteLen * sr); s++) {
      const t = s / sr;
      const env = t < 0.01 ? t / 0.01 : Math.exp(-t * 4);
      data[startSample + s] = (data[startSample + s] || 0) + Math.sin(2 * Math.PI * n.freq * t) * 0.4 * env;
    }
  });
  // Add as a new sampled track
  const name = 'Piano ' + (tbProj.tracks.filter(t => t.name.startsWith('Piano')).length + 1);
  tbProj.tracks.push({ name, sound: 'sample', color: '#a78bfa', vol: 0.8, muted: false, fx: 'none', _buffer: buf });
  Object.keys(tbProj.patterns).forEach(k => tbProj.patterns[k].push(new Array(16).fill(1)));
  touchProj('tb'); tbRebuildAudioGraph(); tbRenderAll();
  document.getElementById('piano-recorded-info').textContent = '✓ "' + name + '" added as a track (' + pianoNotes.length + ' notes)';
  pianoNotes = [];
  showToast('"' + name + '" added to your beat!');
}

// ── Recordings panel inside Instruments ──
function refreshInstRecs() {
  const list = document.getElementById('inst-recs-list');
  const srcList = document.getElementById('tb-recs');
  if (!list) return;
  const items = srcList ? Array.from(srcList.querySelectorAll('.tb-recitem')) : [];
  if (items.length === 0) {
    list.innerHTML = '<div style="font-family:var(--mono);font-size:11px;color:rgba(192,132,252,.3);padding:.5rem">No recordings yet. Use the Record button to capture your mic.</div>';
    return;
  }
  list.innerHTML = '';
  items.forEach((item, i) => {
    const url = item.href;
    const name = item.textContent.trim();
    const row = document.createElement('div');
    row.className = 'tb-recitem';
    row.innerHTML = `<i class="ti ti-file-music" aria-hidden="true"></i>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
      <button class="play-rec" title="Preview" onclick="previewRec('${url}')"><i class="ti ti-player-play" aria-hidden="true"></i></button>
      <button class="add-rec" onclick="addRecToBeat('${url}','${name}')">+ Add to Beat</button>
      <button class="del-rec" onclick="this.closest('.tb-recitem').remove()" title="Remove"><i class="ti ti-x" aria-hidden="true"></i></button>`;
    list.appendChild(row);
  });
}

let previewAudio = null;
function previewRec(url) {
  if (previewAudio) { previewAudio.pause(); previewAudio.currentTime = 0; }
  previewAudio = new Audio(url);
  previewAudio.play().catch(() => {});
}

function addRecToBeat(url, name) {
  ensureAudio();
  if (!actx) { showToast('Audio engine not ready'); return; }
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(buf => actx.decodeAudioData(buf))
    .then(decoded => {
      const trackName = (name || 'Recording').replace(/\s*\(.*\)/, '').slice(0, 16);
      tbProj.tracks.push({ name: trackName, sound: 'sample', color: '#f87171', vol: 0.8, muted: false, fx: 'none', _buffer: decoded });
      Object.keys(tbProj.patterns).forEach(k => tbProj.patterns[k].push(new Array(16).fill(1)));
      touchProj('tb'); tbRebuildAudioGraph(); tbRenderAll();
      showToast('"' + trackName + '" added to the beat!');
    })
    .catch(() => showToast('Could not load recording'));
}

// ═══════════════════════════════════════════════════════
// VISUAL STUDIO — EFFECTS ENGINE
// ═══════════════════════════════════════════════════════

const VS_EFFECTS_LIST = [
  { id:'brightness', name:'Brightness', css: v => `brightness(${v}%)`, default:100, min:0, max:200, unit:'%' },
  { id:'contrast',   name:'Contrast',   css: v => `contrast(${v}%)`,   default:100, min:0, max:300, unit:'%' },
  { id:'saturation', name:'Saturation', css: v => `saturate(${v}%)`,   default:100, min:0, max:400, unit:'%' },
  { id:'blur',       name:'Blur',       css: v => `blur(${v}px)`,      default:0,   min:0, max:20,  unit:'px' },
  { id:'hue',        name:'Hue Rotate', css: v => `hue-rotate(${v}deg)`, default:0, min:0, max:360, unit:'°' },
  { id:'sepia',      name:'Sepia',      css: v => `sepia(${v}%)`,      default:0,   min:0, max:100, unit:'%' },
  { id:'grayscale',  name:'Grayscale',  css: v => `grayscale(${v}%)`,  default:0,   min:0, max:100, unit:'%' },
  { id:'invert',     name:'Invert',     css: v => `invert(${v}%)`,     default:0,   min:0, max:100, unit:'%' },
  { id:'opacity',    name:'Opacity',    css: v => `opacity(${v}%)`,    default:100, min:0, max:100, unit:'%' },
  { id:'glow',       name:'Glow',       css: v => `drop-shadow(0 0 ${v}px #22d3ee)`, default:0, min:0, max:30, unit:'px' },
  { id:'vignette',   name:'Vignette',   css: v => ``, default:0, min:0, max:1, unit:'', special:'vignette' },
  { id:'sharpen',    name:'Sharpen',    css: v => `contrast(${100+v*0.5}%) brightness(${100+v*0.2}%)`, default:0, min:0, max:100, unit:'%' },
];

// Each layer gets its own effects array: [{ id, val }]
function vsFxGetLayerEffects(layerId) {
  if (!vsProj) return [];
  const layer = vsProj.layers.find(l => l.id === layerId);
  if (!layer) return [];
  if (!layer.effects) layer.effects = [];
  return layer.effects;
}

function vsFxPickerOpen() {
  if (!vsProj || !vsProj.sel) { showToast('Select a layer first'); return; }
  const picker = document.getElementById('vs-fx-picker');
  if (!picker) return;
  if (picker.classList.contains('open')) { picker.classList.remove('open'); return; }
  picker.innerHTML = VS_EFFECTS_LIST.map(fx =>
    `<div class="vs-fx-pick-item" onclick="vsFxAdd('${fx.id}')">${fx.name}</div>`
  ).join('');
  picker.classList.add('open');
}

function vsFxAdd(fxId) {
  if (!vsProj || !vsProj.sel) { showToast('Select a layer first'); return; }
  const layer = vsProj.layers.find(l => l.id === vsProj.sel);
  if (!layer) return;
  if (!layer.effects) layer.effects = [];
  const def = VS_EFFECTS_LIST.find(f => f.id === fxId);
  if (!def) return;
  if (layer.effects.find(e => e.id === fxId)) { showToast(def.name + ' already applied'); return; }
  layer.effects.push({ id: fxId, val: def.default, on: true });
  document.getElementById('vs-fx-picker').classList.remove('open');
  vsFxRender(vsProj.sel);
  vsApplyEffects(layer);
  showToast(def.name + ' added');
}

function vsFxRender(layerId) {
  const list = document.getElementById('vs-fx-list');
  const lbl = document.getElementById('vs-fx-layer-lbl');
  if (!list) return;
  if (!layerId || !vsProj) { list.innerHTML = ''; if (lbl) lbl.textContent = '— no layer selected —'; return; }
  const layer = vsProj.layers.find(l => l.id === layerId);
  if (!layer) { list.innerHTML = ''; return; }
  if (lbl) lbl.textContent = 'on: ' + (layer.name || 'Layer');
  const effects = layer.effects || [];
  if (effects.length === 0) {
    list.innerHTML = '<span style="font-family:var(--mono);font-size:10px;color:rgba(34,211,238,.25)">No effects — click + Add Effect</span>';
    return;
  }
  list.innerHTML = effects.map((e, i) => {
    const def = VS_EFFECTS_LIST.find(f => f.id === e.id);
    if (!def) return '';
    return `<div class="vs-fx-chip ${e.on ? 'on' : ''}" id="vsfx-chip-${i}">
      <span class="vs-fx-chip-name">${def.name}</span>
      <input type="range" min="${def.min}" max="${def.max}" value="${e.val}" step="${def.max > 10 ? 1 : 0.1}"
        style="width:60px;height:3px;cursor:pointer;accent-color:#22d3ee"
        oninput="vsFxChange(${i},this.value,'${layerId}')">
      <span class="vs-fx-chip-val">${e.val}${def.unit}</span>
      <button class="vs-fx-chip-rm" onclick="vsFxRemove(${i},'${layerId}')" title="Remove"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>`;
  }).join('');
}

function vsFxChange(i, val, layerId) {
  if (!vsProj) return;
  const layer = vsProj.layers.find(l => l.id === layerId);
  if (!layer || !layer.effects) return;
  layer.effects[i].val = parseFloat(val);
  const def = VS_EFFECTS_LIST.find(f => f.id === layer.effects[i].id);
  const chip = document.getElementById('vsfx-chip-' + i);
  if (chip) { const valEl = chip.querySelector('.vs-fx-chip-val'); if (valEl && def) valEl.textContent = val + def.unit; }
  vsApplyEffects(layer);
  vsDrawPreview && vsDrawPreview();
}

function vsFxRemove(i, layerId) {
  if (!vsProj) return;
  const layer = vsProj.layers.find(l => l.id === layerId);
  if (!layer || !layer.effects) return;
  layer.effects.splice(i, 1);
  vsFxRender(layerId);
  vsApplyEffects(layer);
  vsDrawPreview && vsDrawPreview();
}

function vsApplyEffects(layer) {
  // Build CSS filter string
  const effects = layer.effects || [];
  const filterParts = [];
  effects.forEach(e => {
    if (!e.on) return;
    const def = VS_EFFECTS_LIST.find(f => f.id === e.id);
    if (!def || def.special) return;
    filterParts.push(def.css(e.val));
  });
  layer._cssFilter = filterParts.join(' ');
}

// Hook into layer selection to refresh effects panel
const _vsOrigSetSel = window.vsSetLayerSel;
function vsRefreshFxPanelForSel(layerId) {
  vsFxRender(layerId);
}

// Patch vsDrawPreview to apply effects to canvas context
const _origVsDrawPreview = window.vsDrawPreview;
// We add effect application on top of the existing draw call in the main draw loop
// by extending vsDrawPreview after it's been called

// ── Unlimited Timeline ──
function vsExtendTimeline() {
  if (!vsProj) return;
  vsProj.duration = (vsProj.duration || 12) + 30;
  vsSetDuration && vsSetDuration(vsProj.duration);
  touchProj('vs');
  showToast('Timeline extended to ' + vsProj.duration + 's');
}

// Make timeline scrollable horizontally with no max width
(function patchTimeline() {
  const rows = document.getElementById('vs-tlrows');
  if (rows) { rows.style.overflowX = 'auto'; rows.style.minWidth = '100%'; }
})();


// ═══════════════════════════════════════════════════════
// BACKGROUND THEMES
// ═══════════════════════════════════════════════════════
const THEMES = ['cyberpunk','forest','solar'];
let currentTheme = 'cyberpunk';

function applyTheme(theme, optEl) {
  // Remove all theme classes
  THEMES.forEach(t => document.body.classList.remove('theme-'+t));
  document.body.classList.remove('theme-custom');
  if (theme !== 'cyberpunk') document.body.classList.add('theme-'+theme);
  currentTheme = theme;
  // Update option UI
  document.querySelectorAll('.theme-opt').forEach(o => o.classList.remove('sel'));
  if (optEl) optEl.classList.add('sel');
  else {
    const el = document.getElementById('theme-opt-'+theme);
    if (el) el.classList.add('sel');
  }
  // Save preference
  try { localStorage.setItem('ordeck-theme', theme); } catch(e){}
  showToast('Theme: ' + theme.charAt(0).toUpperCase() + theme.slice(1));
}

function toggleNeon(tog) {
  tog.classList.toggle('off');
  const canvas = document.getElementById('nc');
  if (canvas) canvas.style.opacity = tog.classList.contains('off') ? '0' : '1';
}

function uploadCustomBg() {
  if (!isPremium()) { requirePremium('Custom background image'); return; }
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => {
    const file = inp.files[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    document.body.style.setProperty('--custom-bg-img', `url(${url})`);
    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    THEMES.forEach(t => document.body.classList.remove('theme-'+t));
    document.body.classList.add('theme-custom');
    const lbl = document.getElementById('custom-bg-lbl');
    if (lbl) lbl.textContent = file.name;
    showToast('Custom background set!');
  };
  inp.click();
}

function applyCustomBgColor(color) {
  if (!isPremium()) { requirePremium('Custom background colour'); return; }
  document.body.style.backgroundColor = color;
  document.body.style.backgroundImage = 'none';
  THEMES.forEach(t => document.body.classList.remove('theme-'+t));
  document.body.classList.add('theme-custom');
  showToast('Background colour set');
}

// Restore saved theme on load
(function restoreTheme(){
  try {
    const saved = localStorage.getItem('ordeck-theme');
    if (saved && THEMES.includes(saved)) {
      setTimeout(() => applyTheme(saved, null), 200);
    }
  } catch(e){}
  // Show premium custom bg section if premium
  setTimeout(() => {
    const sec = document.getElementById('premium-bg-section');
    if (sec && isPremium()) sec.style.display = 'block';
  }, 500);
})();

// ═══════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════
const ADMIN_CODE = 'poiuytrewq';
let adminUnlocked = false;

// Check if admin was previously unlocked
(function checkAdminUnlock(){
  try {
    if (localStorage.getItem('ordeck-admin-unlocked') === 'yes') {
      adminUnlocked = true;
      setTimeout(showAdminIcon, 300);
    }
  } catch(e){}
})();

// Hook into redeemCode function to also catch the admin code
const _origRedeemCode = window.redeemCode;
window.redeemCode = function() {
  const inp = document.getElementById('redeem-inp');
  const code = inp ? inp.value.trim() : '';
  if (code === ADMIN_CODE) {
    adminUnlocked = true;
    try { localStorage.setItem('ordeck-admin-unlocked', 'yes'); } catch(e){}
    showAdminIcon();
    showToast('🔐 Admin panel unlocked — icon now visible on home screen');
    if (inp) inp.value = '';
    return;
  }
  if (_origRedeemCode) _origRedeemCode();
  else {
    // fallback if original not defined
    const CODES = { 'ORDECK2024':true,'PROTOTYPE1':true,'UPDATEREAL':true };
    if (CODES[code]) {
      applyPrototypePlus();
      showToast('Prototype+ activated!');
      if (inp) inp.value = '';
    } else {
      showToast('Invalid code');
    }
  }
};

function showAdminIcon() {
  const wrap = document.getElementById('admin-icon-wrap');
  if (wrap) wrap.classList.add('visible');
}

function adminLog(msg, cls) {
  const log = document.getElementById('admin-log');
  if (!log) return;
  const d = document.createElement('div');
  d.className = 'admin-log-line ' + (cls||'');
  d.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function adminLoadStats() {
  const db = dbLoad();
  const users = Object.values(db);
  const premiumCount = users.filter(u => u.plan === 'prototype-plus').length;
  const totalProjects = users.reduce((n,u) => n + Object.keys(u.projects||{}).length, 0);
  const onlineCount = users.filter(u => u.lastSeen && (Date.now()-u.lastSeen)<300000).length || 1;
  const friendCount = Math.floor(users.reduce((n,u) => n+(u.friends||[]).length,0)/2);
  const storageSz = (() => { let s=0; try{for(let k in localStorage)s+=(localStorage.getItem(k)||'').length*2}catch(e){} return s>1048576?(s/1048576).toFixed(1)+' MB':(s/1024).toFixed(1)+' KB'; })();
  let codeCount = 0; try{codeCount=Object.keys(JSON.parse(localStorage.getItem('ordeck-codes')||'{}')).length}catch(e){}
  const broadcastMsg = localStorage.getItem('ordeck-broadcast') || 'None';

  // ① Global bar
  const setEl = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  setEl('agb-total', users.length);
  setEl('agb-premium', premiumCount);
  setEl('agb-standard', users.length - premiumCount);
  setEl('agb-online', onlineCount);
  setEl('agb-projects', totalProjects);
  setEl('agb-friends', friendCount);
  setEl('agb-storage', storageSz);
  setEl('agb-codes', codeCount);

  // Live clock
  const clockEl = document.getElementById('admin-live-clock');
  if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();

  // Original stat cards
  const grid = document.getElementById('admin-stats-grid');
  if (grid) grid.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-users" aria-hidden="true"></i> Accounts</div>
      <div class="admin-stat"><span class="admin-stat-k">Total accounts</span><span class="admin-stat-v">${users.length}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Prototype+ users</span><span class="admin-stat-v">${premiumCount}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Standard users</span><span class="admin-stat-v">${users.length - premiumCount}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Online now (&lt;5 min)</span><span class="admin-stat-v">${onlineCount}</span></div>
    </div>
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-folder" aria-hidden="true"></i> Projects & Data</div>
      <div class="admin-stat"><span class="admin-stat-k">Total projects</span><span class="admin-stat-v">${totalProjects}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Total friendships</span><span class="admin-stat-v">${friendCount}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Storage used</span><span class="admin-stat-v">${storageSz}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">DB size</span><span class="admin-stat-v">${(JSON.stringify(db).length/1024).toFixed(1)} KB</span></div>
    </div>
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-broadcast" aria-hidden="true"></i> Broadcast</div>
      <div class="admin-stat"><span class="admin-stat-k">Active message</span></div>
      <div style="font-family:var(--mono);font-size:10px;color:rgba(248,113,113,.5);margin-top:.35rem;line-height:1.6;word-break:break-all">${broadcastMsg.slice(0,100)}</div>
    </div>
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-key" aria-hidden="true"></i> Session</div>
      <div class="admin-stat"><span class="admin-stat-k">Logged in as</span><span class="admin-stat-v">${currentUser ? currentUser.email : 'No session'}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Plan</span><span class="admin-stat-v">${currentUser ? currentUser.plan : '—'}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Admin code active</span><span class="admin-stat-v" style="color:#34d399">YES</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Active coupon codes</span><span class="admin-stat-v">${codeCount}</span></div>
    </div>`;

  // ② App Health
  adminRunHealthCheck();

  // ③ Session Monitor
  adminRenderSessions();

  // ⑤ Feature Flags
  adminRenderFlags();

  // Codes list
  const codesEl = document.getElementById('admin-codes-list');
  if (codesEl) {
    try {
      const codes = JSON.parse(localStorage.getItem('ordeck-codes') || '{}');
      codesEl.innerHTML = Object.keys(codes).map(k =>
        `<div style="display:flex;align-items:center;justify-content:space-between"><span>${k}</span><button class="admin-flag-del" onclick="adminRemoveCode('${k}')">✕</button></div>`
      ).join('') || '<div style="color:rgba(200,200,220,.25)">No custom codes</div>';
    } catch(e){}
  }

  adminLog('Stats refreshed — ' + users.length + ' users, ' + totalProjects + ' projects', 'ok');
}

// ② HEALTH CHECK
function adminRunHealthCheck() {
  const ok = '<span style="color:#34d399">✓ OK</span>';
  const fail = '<span style="color:#f87171">✗ Not available</span>';
  const setH = (id,v) => { const el=document.getElementById(id); if(el) el.innerHTML=v; };

  setH('hs-audio', (window.AudioContext||window.webkitAudioContext) ? ok : fail);
  setH('hs-recorder', window.MediaRecorder ? ok : fail);
  setH('hs-canvas', (() => { try{const c=document.createElement('canvas');return c.getContext('2d')?ok:fail}catch(e){return fail} })());
  setH('hs-network', navigator.onLine ? ok : '<span style="color:#f87171">✗ Offline</span>');
  setH('hs-storage', (() => { try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return ok}catch(e){return fail} })());
  setH('hs-ua', navigator.userAgent.slice(0,40)+'…');
  setH('hs-screen', screen.width+'×'+screen.height);
  setH('hs-lang', navigator.language||'—');
  setH('hs-tz', Intl.DateTimeFormat().resolvedOptions().timeZone||'—');
  setH('hs-session', window._adminSessionStart ? new Date(window._adminSessionStart).toLocaleTimeString() : 'This session');
  if (!window._adminSessionStart) window._adminSessionStart = Date.now();

  // Heatmap — simulate 24hr activity based on log entries length
  const hm = document.getElementById('admin-heatmap');
  if (hm) {
    const data = new Array(24).fill(0);
    try {
      const log = document.getElementById('admin-log');
      if (log) { const lines = log.querySelectorAll('.admin-log-line'); lines.forEach(l => { const h=parseInt((l.textContent||'').split(':')[0].replace('[','')); if(h>=0&&h<24)data[h]++; }); }
    } catch(e){}
    const max = Math.max(...data,1);
    hm.innerHTML = data.map((v,i) => {
      const alpha = 0.07 + (v/max)*0.75;
      const label = i+':00';
      return `<div class="adm-heat-cell" style="background:rgba(248,113,113,${alpha.toFixed(2)})" title="${label} — ${v} actions"></div>`;
    }).join('');
  }
}

// ③ SESSION MONITOR
function adminRenderSessions(filter) {
  const db = dbLoad();
  let users = Object.values(db);
  const sort = (document.getElementById('admin-session-sort')||{}).value || 'recent';
  const f = filter || (document.getElementById('admin-session-filter')||{}).value || '';

  if (f) users = users.filter(u => (u.email||'').includes(f) || (u.name||'').includes(f) || (u.plan||'').includes(f));
  if (sort==='name') users.sort((a,b)=>(a.name||a.email||'').localeCompare(b.name||b.email||''));
  else if (sort==='plan') users.sort((a,b)=>(b.plan||'').localeCompare(a.plan||''));
  else if (sort==='projects') users.sort((a,b)=>Object.keys(b.projects||{}).length-Object.keys(a.projects||{}).length);
  else users.sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0));

  const body = document.getElementById('admin-session-body');
  if (!body) return;
  if (!users.length) { body.innerHTML='<div style="padding:.7rem .55rem;font-family:var(--mono);font-size:9px;color:rgba(248,113,113,.3)">No users match this filter.</div>'; return; }

  const isPrem = u => u.plan==='prototype-plus';
  const lastSeen = u => {
    if (!u.lastSeen) return 'Never';
    const s = Math.floor((Date.now()-u.lastSeen)/1000);
    if (s<60) return s+'s ago';
    if (s<3600) return Math.floor(s/60)+'m ago';
    if (s<86400) return Math.floor(s/3600)+'h ago';
    return Math.floor(s/86400)+'d ago';
  };
  const online = u => u.lastSeen && (Date.now()-u.lastSeen)<300000;
  const studio = u => {
    const map = {tb:'Tidal Beat',vs:'Visual',ds:'Dev Studio'};
    return map[u.activeStudio]||'—';
  };

  body.innerHTML = users.map(u =>
    `<div class="admin-session-row">
      <div><div class="adm-sess-name">${u.name||'—'}${u.banned?'<span class="adm-ban-badge">BANNED</span>':''}</div><div class="adm-sess-email">${u.email||''}</div></div>
      <div class="adm-sess-plan ${isPrem(u)?'prem':'std'}">${isPrem(u)?'⬡ Pro+':'Standard'}</div>
      <div style="font-family:var(--mono);font-size:9px;color:rgba(248,113,113,.5)">${studio(u)}</div>
      <div style="font-family:var(--mono);font-size:10px;color:rgba(248,113,113,.5)">${Object.keys(u.projects||{}).length}</div>
      <div class="adm-sess-online"><div class="dot ${online(u)?'on':''}"></div>${lastSeen(u)}</div>
      <div class="adm-sess-actions">
        ${!isPrem(u)?`<button class="adm-sa prem" onclick="adminGrantPremiumTo('${u.email}')"><i class="ti ti-crown"></i></button>`:''}
        <button class="adm-sa" onclick="adminViewUserDetails('${u.email}')"><i class="ti ti-eye"></i></button>
        <button class="adm-sa" onclick="adminDeleteUserDirect('${u.email}')"><i class="ti ti-trash"></i></button>
      </div>
    </div>`
  ).join('');
}

function adminViewUserDetails(email) {
  const db = dbLoad(); const u = db[email]; if (!u) return;
  const info = [
    '═══ USER DETAILS ═══',
    'Email: ' + email,
    'Name: ' + (u.name||'—'),
    'Plan: ' + u.plan,
    'Projects: ' + Object.keys(u.projects||{}).length,
    'Friends: ' + (u.friends||[]).length,
    'Created: ' + (u.createdAt?new Date(u.createdAt).toLocaleString():'Unknown'),
    'Last seen: ' + (u.lastSeen?new Date(u.lastSeen).toLocaleString():'Never'),
    'Banned: ' + (u.banned?'YES':'No'),
    '═══════════════════'
  ];
  info.forEach(l => adminLog(l, 'ok'));
  adminLog('Viewed details: ' + email);
}
function adminGrantPremiumTo(email) {
  const db = dbLoad();
  if (!db[email]) { showToast('User not found'); return; }
  db[email].plan = 'prototype-plus';
  dbSave(db);
  adminLog('Granted Prototype+ to ' + email, 'ok');
  showToast('Prototype+ granted to ' + email);
  adminLoadStats();
}
function adminDeleteUserDirect(email) {
  if (!confirm('Delete ' + email + '?')) return;
  const db = dbLoad(); delete db[email]; dbSave(db);
  adminLog('Deleted: ' + email, 'warn');
  showToast('User deleted');
  adminLoadStats();
}
function adminBanUser() {
  const email = (document.getElementById('admin-del-email')||{}).value || '';
  if (!email) { showToast('Enter an email'); return; }
  const db = dbLoad();
  if (!db[email]) { showToast('User not found'); return; }
  db[email].banned = true;
  db[email].plan = 'standard';
  dbSave(db);
  adminLog('Banned user: ' + email, 'warn');
  showToast('User banned: ' + email);
  adminLoadStats();
}

// ④ BULK ACTIONS
function adminBulkGrantPremium() {
  if (!confirm('Grant Prototype+ to ALL users?')) return;
  const db = dbLoad();
  let count = 0;
  Object.keys(db).forEach(k => { db[k].plan = 'prototype-plus'; count++; });
  dbSave(db);
  applyPrototypePlus();
  adminLog(`Bulk premium granted to ${count} users`, 'ok');
  showToast(`Prototype+ granted to ${count} users`);
  adminLoadStats();
}
function adminBulkRevokePremium() {
  if (!confirm('Revoke Prototype+ from ALL users?')) return;
  const db = dbLoad(); let count = 0;
  Object.keys(db).forEach(k => { if(db[k].plan==='prototype-plus'){db[k].plan='standard';count++;} });
  dbSave(db);
  adminLog(`Bulk premium revoked from ${count} users`, 'warn');
  showToast(`Premium revoked from ${count} users`);
  adminLoadStats();
}
function adminBulkExportUsers() {
  const db = dbLoad();
  const header = 'email,name,plan,projects,friends,created';
  const rows = Object.values(db).map(u =>
    [u.email||'', (u.name||'').replace(/,/g,' '), u.plan||'standard',
     Object.keys(u.projects||{}).length, (u.friends||[]).length,
     u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ordeck-users-'+Date.now()+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
  adminLog('Users exported as CSV', 'ok'); showToast('Users CSV exported');
}
function adminBulkClearInactive() {
  const threshold = Date.now() - 30*24*60*60*1000;
  const db = dbLoad(); let count = 0;
  Object.keys(db).forEach(k => {
    const u = db[k];
    if (u.lastSeen && u.lastSeen < threshold) { delete db[k]; count++; }
    else if (!u.lastSeen && u.createdAt && u.createdAt < threshold) { delete db[k]; count++; }
  });
  dbSave(db);
  adminLog(`Removed ${count} inactive users (30+ days)`, 'warn');
  showToast(`${count} inactive users removed`);
  adminLoadStats();
}
function adminBulkResetAvatars() {
  if (!confirm('Reset all display names to email prefixes?')) return;
  const db = dbLoad(); let count = 0;
  Object.keys(db).forEach(k => { if(db[k].name){db[k].name=db[k].email.split('@')[0];count++;} });
  dbSave(db);
  adminLog(`Reset ${count} display names`, 'ok');
  showToast(`${count} display names reset`);
}
function adminImportDB(event) {
  const f = event.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (typeof data !== 'object') throw new Error('Invalid format');
      dbSave(data);
      adminLog('DB imported: ' + Object.keys(data).length + ' records', 'ok');
      showToast('DB imported — ' + Object.keys(data).length + ' records');
      adminLoadStats();
    } catch(e) { showToast('Import failed: ' + e.message); adminLog('Import error: ' + e.message); }
  };
  reader.readAsText(f);
}
function adminMassMessage() {
  const msg = (document.getElementById('admin-mass-msg')||{}).value || '';
  const target = (document.getElementById('admin-mass-target')||{}).value || 'all';
  if (!msg) { showToast('Enter a message'); return; }
  const db = dbLoad(); let count = 0;
  Object.values(db).forEach(u => {
    if (target==='all' || (target==='premium'&&u.plan==='prototype-plus') || (target==='standard'&&u.plan!=='prototype-plus')) {
      if (!u.inbox) u.inbox = [];
      u.inbox.unshift({from:'ORDECK', text:msg, ts:Date.now()});
      count++;
    }
  });
  dbSave(db);
  adminLog(`Mass message sent to ${count} users (${target})`, 'ok');
  showToast(`Message sent to ${count} ${target} users`);
  if (document.getElementById('admin-mass-msg')) document.getElementById('admin-mass-msg').value = '';
}
function adminRemoveCode(code) {
  try {
    const codes = JSON.parse(localStorage.getItem('ordeck-codes')||'{}');
    delete codes[code]; localStorage.setItem('ordeck-codes', JSON.stringify(codes));
    adminLog('Code removed: ' + code, 'ok'); showToast('Code removed: ' + code); adminLoadStats();
  } catch(e){}
}

// ⑤ FEATURE FLAGS
const ADMIN_DEFAULT_FLAGS = [
  {key:'registration', label:'Registration Open', desc:'Allow new sign-ups', on:true},
  {key:'tidal-ai', label:'Tidal Beat AI', desc:'Enable AI features in Tidal Beat', on:true},
  {key:'vs-ai', label:'Visual Studio AI', desc:'Enable AI features in Visual Studio', on:true},
  {key:'ds-ai', label:'Dev Studio AI Code+', desc:'Enable AI in Dev Studio', on:true},
  {key:'maintenance', label:'Maintenance Mode', desc:'Block non-admins from studios', on:false},
  {key:'free-premium', label:'Free Premium Weekend', desc:'Give everyone Prototype+ temporarily', on:false},
  {key:'friends', label:'Friends System', desc:'Enable friend requests and DMs', on:true},
  {key:'instruments', label:'Instruments Panel', desc:'Show piano/drums in Tidal Beat', on:true},
];
function adminGetFlags() {
  try { return JSON.parse(localStorage.getItem('ordeck-flags') || '{}'); } catch(e) { return {}; }
}
function adminSaveFlags(f) { try{localStorage.setItem('ordeck-flags', JSON.stringify(f))}catch(e){} }
function adminRenderFlags() {
  const list = document.getElementById('admin-flags-list'); if (!list) return;
  const stored = adminGetFlags();
  const all = [...ADMIN_DEFAULT_FLAGS];
  // Add custom flags
  Object.keys(stored).forEach(k => { if (!all.find(f=>f.key===k)) all.push({key:k, label:k, desc:'Custom flag', on:stored[k]}); });
  list.innerHTML = all.map(f => {
    const isOn = stored.hasOwnProperty(f.key) ? stored[f.key] : f.on;
    return `<div class="admin-flag-row">
      <span class="admin-flag-name">${f.label}</span>
      <span style="font-size:10px;color:rgba(248,113,113,.35);flex:1">${f.desc}</span>
      <div class="admin-flag-toggle">
        <div class="adm-toggle ${isOn?'on':''}" onclick="adminToggleFlag('${f.key}',this)" title="${f.key}"></div>
        <span style="font-family:var(--mono);font-size:8px;color:rgba(248,113,113,.35);min-width:28px">${isOn?'ON':'OFF'}</span>
        ${!ADMIN_DEFAULT_FLAGS.find(x=>x.key===f.key)?`<button class="admin-flag-del" onclick="adminDeleteFlag('${f.key}')">✕</button>`:''}
      </div>
    </div>`;
  }).join('');
}
function adminToggleFlag(key, el) {
  const flags = adminGetFlags();
  const wasOn = el.classList.contains('on');
  el.classList.toggle('on');
  flags[key] = !wasOn;
  adminSaveFlags(flags);
  const lbl = el.nextElementSibling;
  if (lbl) lbl.textContent = flags[key] ? 'ON' : 'OFF';
  adminLog(`Flag "${key}" set to ${flags[key] ? 'ON' : 'OFF'}`, 'ok');
  showToast(`"${key}" ${flags[key]?'enabled':'disabled'}`);
  // Apply live effects
  if (key==='free-premium' && flags[key]) applyPrototypePlus();
  if (key==='maintenance' && flags[key]) showToast('⚠ Maintenance mode ON — only admin can access studios');
}
function adminAddFlag() {
  const inp = document.getElementById('admin-new-flag'); if (!inp||!inp.value.trim()) return;
  const key = inp.value.trim().toLowerCase().replace(/\s+/g,'-');
  const flags = adminGetFlags(); flags[key] = false; adminSaveFlags(flags);
  adminLog('Custom flag added: ' + key, 'ok'); showToast('Flag added: ' + key);
  inp.value = ''; adminRenderFlags();
}
function adminDeleteFlag(key) {
  const flags = adminGetFlags(); delete flags[key]; adminSaveFlags(flags);
  adminLog('Flag deleted: ' + key); showToast('Flag removed: ' + key); adminRenderFlags();
}

// ⑥ ENHANCED CONSOLE
function adminConsoleRun(cmd) {
  const inp = document.getElementById('admin-console-inp');
  if (inp) inp.value = cmd;
  adminConsoleExec(cmd);
}
function adminConsoleExec(cmd) {
  adminLog('> ' + cmd);
  const parts = cmd.trim().split(' ');
  switch(parts[0]) {
    case 'help':
      ['help — show commands',
       'users — list all users',
       'stats — reload stats',
       'health — run health check',
       'flags — list feature flags',
       'sessions — reload session monitor',
       'grant [email] — grant Prototype+',
       'revoke [email] — revoke Prototype+',
       'delete [email] — delete user',
       'ban [email] — ban user',
       'export — export DB',
       'broadcast [msg] — set broadcast',
       'code [name] — add coupon code',
       'premium-me — upgrade current session',
       'clear — clear log',
       'nuke — reset entire DB',
      ].forEach(l => adminLog(l, 'ok'));
      break;
    case 'users':
      { const db=dbLoad(); const us=Object.values(db);
        adminLog(`Total: ${us.length} users`, 'ok');
        us.forEach(u => adminLog(`  ${u.email} [${u.plan}] ${u.banned?'[BANNED]':''}`)); }
      break;
    case 'stats': adminLoadStats(); break;
    case 'health': adminRunHealthCheck(); adminLog('Health check complete', 'ok'); break;
    case 'flags':
      { const flags=adminGetFlags();
        adminLog('Feature flags:', 'ok');
        ADMIN_DEFAULT_FLAGS.forEach(f => adminLog(`  ${f.key}: ${flags.hasOwnProperty(f.key)?flags[f.key]:f.on}`));
        Object.keys(flags).forEach(k => { if(!ADMIN_DEFAULT_FLAGS.find(x=>x.key===k)) adminLog(`  ${k} (custom): ${flags[k]}`); }); }
      break;
    case 'sessions': adminRenderSessions(); adminLog('Sessions refreshed', 'ok'); break;
    case 'grant':
      if (parts[1]) adminGrantPremiumTo(parts[1]);
      else { adminLog('Usage: grant user@email.com'); }
      break;
    case 'revoke':
      if (parts[1]) { document.getElementById('admin-grant-email').value=parts[1]; adminRevokePremium(); }
      break;
    case 'delete':
      if (parts[1]) adminDeleteUserDirect(parts[1]);
      break;
    case 'ban':
      if (parts[1]) { document.getElementById('admin-del-email').value=parts[1]; adminBanUser(); }
      break;
    case 'export': adminExportDB(); break;
    case 'broadcast': {
      const msg = parts.slice(1).join(' ');
      if (msg) { try{localStorage.setItem('ordeck-broadcast',msg)}catch(e){} adminLog('Broadcast set: ' + msg,'ok'); showToast('Broadcast set'); }
      break; }
    case 'code':
      if (parts[1]) { document.getElementById('admin-new-code').value=parts[1]; adminAddCode(); }
      break;
    case 'premium-me': applyPrototypePlus(); adminLog('Prototype+ granted to current session','ok'); break;
    case 'clear': document.getElementById('admin-log').innerHTML=''; break;
    case 'nuke': adminResetDB(); break;
    default: adminLog('Unknown command "'+parts[0]+'". Type "help" for a list.','warn');
  }
}

function adminConsoleKey(e) {
  if (e.key !== 'Enter') return;
  const inp = document.getElementById('admin-console-inp');
  const cmd = inp ? inp.value.trim() : ''; if (!cmd) return;
  if (inp) inp.value = '';
  adminConsoleExec(cmd);
}

// Live clock interval
setInterval(() => {
  const el = document.getElementById('admin-live-clock');
  if (el && document.getElementById('s-admin').classList.contains('active')) el.textContent = new Date().toLocaleTimeString();
}, 1000);
  if (!grid) return;
  const db = dbLoad();
  const users = Object.values(db);
  const premiumCount = users.filter(u => u.plan === 'prototype-plus').length;
  const totalProjects = users.reduce((n,u) => n + Object.keys(u.projects||{}).length, 0);
  const broadcastMsg = localStorage.getItem('ordeck-broadcast') || 'None';

  grid.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-users" aria-hidden="true"></i> Users</div>
      <div class="admin-stat"><span class="admin-stat-k">Total accounts</span><span class="admin-stat-v">${users.length}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Prototype+ users</span><span class="admin-stat-v">${premiumCount}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Standard users</span><span class="admin-stat-v">${users.length - premiumCount}</span></div>
    </div>
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-folder" aria-hidden="true"></i> Projects</div>
      <div class="admin-stat"><span class="admin-stat-k">Total projects</span><span class="admin-stat-v">${totalProjects}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">DB size (approx)</span><span class="admin-stat-v">${(JSON.stringify(db).length/1024).toFixed(1)} KB</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Admin code</span><span class="admin-stat-v">ACTIVE</span></div>
    </div>
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-broadcast" aria-hidden="true"></i> Broadcast</div>
      <div class="admin-stat"><span class="admin-stat-k">Active message</span></div>
      <div style="font-family:var(--mono);font-size:10px;color:rgba(248,113,113,.5);margin-top:.35rem;line-height:1.6;word-break:break-all">${broadcastMsg.slice(0,100)}</div>
    </div>
    <div class="admin-card">
      <div class="admin-card-title"><i class="ti ti-key" aria-hidden="true"></i> Current Session</div>
      <div class="admin-stat"><span class="admin-stat-k">Logged in as</span><span class="admin-stat-v">${currentUser ? currentUser.email : 'No session'}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Plan</span><span class="admin-stat-v">${currentUser ? currentUser.plan : '—'}</span></div>
      <div class="admin-stat"><span class="admin-stat-k">Admin unlocked</span><span class="admin-stat-v">YES</span></div>
    </div>`;


function adminFindUser() {
  const email = (document.getElementById('admin-user-search')||{}).value || '';
  const db = dbLoad();
  const user = db[email];
  const res = document.getElementById('admin-user-result');
  if (!res) return;
  if (!user) { res.textContent = 'No user found with that email.'; return; }
  res.innerHTML = `Name: ${user.name||'—'}<br>Plan: ${user.plan}<br>Projects: ${Object.keys(user.projects||{}).length}<br>Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}`;
  adminLog('Found user: ' + email, 'ok');
}

function adminGrantPremium() {
  const email = (document.getElementById('admin-grant-email')||{}).value || '';
  const db = dbLoad();
  if (!db[email]) { showToast('User not found'); adminLog('Grant failed: user not found — ' + email); return; }
  db[email].plan = 'prototype-plus';
  dbSave(db);
  adminLog('Granted Prototype+ to ' + email, 'ok');
  showToast('Prototype+ granted to ' + email);
  adminLoadStats();
}

function adminRevokePremium() {
  const email = (document.getElementById('admin-grant-email')||{}).value || '';
  const db = dbLoad();
  if (!db[email]) { showToast('User not found'); return; }
  db[email].plan = 'standard';
  dbSave(db);
  adminLog('Revoked premium from ' + email, 'warn');
  showToast('Premium revoked from ' + email);
  adminLoadStats();
}

function adminDeleteUser() {
  const email = (document.getElementById('admin-del-email')||{}).value || '';
  if (!email) return;
  if (!confirm('Permanently delete account for ' + email + '? This cannot be undone.')) return;
  const db = dbLoad();
  if (!db[email]) { showToast('User not found'); return; }
  delete db[email];
  dbSave(db);
  adminLog('Deleted user: ' + email, 'warn');
  showToast('Account deleted: ' + email);
  adminLoadStats();
}

function adminExportDB() {
  const db = dbLoad();
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ordeck-db-' + Date.now() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  adminLog('DB exported', 'ok');
  showToast('Database exported');
}

function adminClearProjects() {
  if (!confirm('Clear ALL saved projects from ALL users? This cannot be undone.')) return;
  const db = dbLoad();
  Object.keys(db).forEach(k => { db[k].projects = {}; });
  dbSave(db);
  adminLog('All projects cleared', 'warn');
  showToast('All projects cleared');
  adminLoadStats();
}

function adminResetDB() {
  if (!confirm('RESET ENTIRE DATABASE? This deletes all accounts and data permanently.')) return;
  if (!confirm('Are you absolutely sure? Type YES in the next prompt.')) return;
  const conf = prompt('Type RESET to confirm:');
  if (conf !== 'RESET') { showToast('Reset cancelled'); return; }
  try { localStorage.removeItem(ORDECK_DB_KEY); localStorage.removeItem(ORDECK_SESSION_KEY); } catch(e){}
  adminLog('DATABASE RESET', 'warn');
  showToast('Database reset. Reloading...');
  setTimeout(() => location.reload(), 1500);
}

function adminBroadcast() {
  const msg = (document.getElementById('admin-broadcast-msg')||{}).value || '';
  if (!msg) return;
  try { localStorage.setItem('ordeck-broadcast', msg); } catch(e){}
  adminLog('Broadcast set: ' + msg.slice(0,40), 'ok');
  showToast('Broadcast message saved');
  adminLoadStats();
}
function adminClearBroadcast() {
  try { localStorage.removeItem('ordeck-broadcast'); } catch(e){}
  adminLog('Broadcast cleared', 'ok');
  showToast('Broadcast cleared');
  adminLoadStats();
}

function adminAddCode() {
  const code = (document.getElementById('admin-new-code')||{}).value || '';
  if (!code) return;
  try {
    const codes = JSON.parse(localStorage.getItem('ordeck-codes')||'{}');
    codes[code.toUpperCase()] = true;
    localStorage.setItem('ordeck-codes', JSON.stringify(codes));
    adminLog('Coupon code added: ' + code.toUpperCase(), 'ok');
    showToast('Code "' + code.toUpperCase() + '" added');
    adminLoadStats();
    if (document.getElementById('admin-new-code')) document.getElementById('admin-new-code').value = '';
  } catch(e){}
}

function adminConsoleKey(e) {
  if (e.key !== 'Enter') return;
  const inp = document.getElementById('admin-console-inp');
  const cmd = inp ? inp.value.trim() : '';
  if (!cmd) return;
  if (inp) inp.value = '';
  adminLog('> ' + cmd);
  // Basic command parser
  const parts = cmd.split(' ');
  switch(parts[0]) {
    case 'help':
      adminLog('Commands: help, users, grant [email], revoke [email], delete [email], export, reset, broadcast [msg], theme [name], premium-me', 'ok');
      break;
    case 'users':
      const db = dbLoad(); adminLog('Total users: ' + Object.keys(db).length, 'ok');
      Object.keys(db).forEach(e => adminLog('  ' + e + ' [' + db[e].plan + ']'));
      break;
    case 'grant':
      if (parts[1]) { document.getElementById('admin-grant-email').value = parts[1]; adminGrantPremium(); }
      break;
    case 'revoke':
      if (parts[1]) { document.getElementById('admin-grant-email').value = parts[1]; adminRevokePremium(); }
      break;
    case 'delete':
      if (parts[1]) { document.getElementById('admin-del-email').value = parts[1]; adminDeleteUser(); }
      break;
    case 'export': adminExportDB(); break;
    case 'reset': adminResetDB(); break;
    case 'broadcast':
      const msg = parts.slice(1).join(' ');
      try { localStorage.setItem('ordeck-broadcast', msg); adminLog('Broadcast set', 'ok'); } catch(e){}
      break;
    case 'theme': applyTheme(parts[1]||'cyberpunk', null); adminLog('Theme set to ' + parts[1], 'ok'); break;
    case 'premium-me':
      applyPrototypePlus(); adminLog('Premium granted to current session', 'ok'); break;
    default:
      adminLog('Unknown command. Type "help" for a list.', 'warn');
  }
}

// Show broadcast on login
(function checkBroadcast(){
  const msg = localStorage.getItem('ordeck-broadcast');
  if (msg) setTimeout(() => showToast('📢 ' + msg, 5000), 2000);
})();

// ═══════════════════════════════════════════════════════
// INSTRUMENT SOUNDS — Web Audio synthesis per drum/piano
// ═══════════════════════════════════════════════════════
// These are standalone synth functions that work even before
// the main audio graph is set up, using a shared inst context.
let instCtx = null;
function getInstCtx() {
  if (!instCtx || instCtx.state === 'closed') {
    instCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (instCtx.state === 'suspended') instCtx.resume();
  return instCtx;
}

// Master output for instruments
function instOut() {
  const ctx = getInstCtx();
  const g = ctx.createGain(); g.gain.value = 0.75;
  g.connect(ctx.destination); return { ctx, g };
}

const INST_SOUNDS = {
  kick: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const env = ctx.createGain();
    osc.frequency.setValueAtTime(160, t); osc.frequency.exponentialRampToValueAtTime(40, t+0.12);
    env.gain.setValueAtTime(1, t); env.gain.exponentialRampToValueAtTime(0.001, t+0.35);
    osc.type = 'sine'; osc.connect(env); env.connect(g);
    osc.start(t); osc.stop(t+0.4);
  },
  snare: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    // White noise burst
    const bufSize = ctx.sampleRate * 0.2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<bufSize;i++) data[i] = Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=2500; filt.Q.value=0.7;
    const env = ctx.createGain(); env.gain.setValueAtTime(0.8,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.2);
    // Snare body (tone)
    const osc = ctx.createOscillator(); const oEnv = ctx.createGain();
    osc.type='triangle'; osc.frequency.value=220;
    oEnv.gain.setValueAtTime(0.5,t); oEnv.gain.exponentialRampToValueAtTime(0.001,t+0.12);
    src.connect(filt); filt.connect(env); env.connect(g);
    osc.connect(oEnv); oEnv.connect(g);
    src.start(t); osc.start(t); osc.stop(t+0.2);
  },
  hihat: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const bufSize = ctx.sampleRate*0.08;
    const buf = ctx.createBuffer(1,bufSize,ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<bufSize;i++) d[i]=Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer=buf;
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=9000;
    const env = ctx.createGain(); env.gain.setValueAtTime(0.55,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.08);
    src.connect(hp); hp.connect(env); env.connect(g); src.start(t);
  },
  openhat: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const bufSize = ctx.sampleRate*0.35;
    const buf = ctx.createBuffer(1,bufSize,ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<bufSize;i++) d[i]=Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer=buf;
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7000;
    const env = ctx.createGain(); env.gain.setValueAtTime(0.45,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.35);
    src.connect(hp); hp.connect(env); env.connect(g); src.start(t);
  },
  clap: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    // Three rapid noise bursts
    [0,0.01,0.025].forEach(delay => {
      const bufSize = ctx.sampleRate*0.07;
      const buf = ctx.createBuffer(1,bufSize,ctx.sampleRate);
      const d = buf.getChannelData(0); for(let i=0;i<bufSize;i++) d[i]=Math.random()*2-1;
      const src = ctx.createBufferSource(); src.buffer=buf;
      const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1100; bp.Q.value=0.5;
      const env = ctx.createGain(); env.gain.setValueAtTime(0.7,t+delay); env.gain.exponentialRampToValueAtTime(0.001,t+delay+0.1);
      src.connect(bp); bp.connect(env); env.connect(g); src.start(t+delay);
    });
  },
  tomHi: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const env = ctx.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(300,t); osc.frequency.exponentialRampToValueAtTime(120,t+0.2);
    env.gain.setValueAtTime(0.9,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.25);
    osc.connect(env); env.connect(g); osc.start(t); osc.stop(t+0.3);
  },
  tomMid: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const env = ctx.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(200,t); osc.frequency.exponentialRampToValueAtTime(80,t+0.25);
    env.gain.setValueAtTime(0.9,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.3);
    osc.connect(env); env.connect(g); osc.start(t); osc.stop(t+0.35);
  },
  tomLow: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const env = ctx.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(120,t); osc.frequency.exponentialRampToValueAtTime(50,t+0.3);
    env.gain.setValueAtTime(1,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.4);
    osc.connect(env); env.connect(g); osc.start(t); osc.stop(t+0.45);
  },
  bass: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const env = ctx.createGain();
    osc.type='sawtooth'; osc.frequency.value=55;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=400;
    env.gain.setValueAtTime(0.8,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    osc.connect(lp); lp.connect(env); env.connect(g); osc.start(t); osc.stop(t+0.55);
  },
  synth: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const osc2 = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type='sawtooth'; osc.frequency.value=440;
    osc2.type='sawtooth'; osc2.frequency.value=443.5; // slight detune
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1200;
    lp.frequency.setValueAtTime(2000,t); lp.frequency.exponentialRampToValueAtTime(600,t+0.25);
    env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(0.55,t+0.01);
    env.gain.exponentialRampToValueAtTime(0.001,t+0.4);
    osc.connect(lp); osc2.connect(lp); lp.connect(env); env.connect(g);
    osc.start(t); osc2.start(t); osc.stop(t+0.45); osc2.stop(t+0.45);
  },
  perc: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const env = ctx.createGain();
    osc.type='square'; osc.frequency.setValueAtTime(800,t); osc.frequency.exponentialRampToValueAtTime(200,t+0.08);
    env.gain.setValueAtTime(0.6,t); env.gain.exponentialRampToValueAtTime(0.001,t+0.12);
    osc.connect(env); env.connect(g); osc.start(t); osc.stop(t+0.15);
  },
  fx: function() {
    const {ctx,g} = instOut(); const t = ctx.currentTime;
    // Sweep noise + pitch rise
    const bufSize = ctx.sampleRate*0.5;
    const buf = ctx.createBuffer(1,bufSize,ctx.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<bufSize;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(bufSize*0.3));
    const src = ctx.createBufferSource(); src.buffer=buf;
    const osc = ctx.createOscillator(); const oEnv = ctx.createGain();
    osc.type='sawtooth'; osc.frequency.setValueAtTime(200,t); osc.frequency.exponentialRampToValueAtTime(2000,t+0.3);
    oEnv.gain.setValueAtTime(0.4,t); oEnv.gain.exponentialRampToValueAtTime(0.001,t+0.35);
    const nEnv = ctx.createGain(); nEnv.gain.setValueAtTime(0.3,t); nEnv.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    src.connect(nEnv); nEnv.connect(g); osc.connect(oEnv); oEnv.connect(g);
    src.start(t); osc.start(t); osc.stop(t+0.4);
  }
};

// Map drum pad sound name → inst sound key
const DRUM_SOUND_MAP = {
  kick:'kick', snare:'snare', hihat:'hihat', openhat:'openhat',
  clap:'clap', tomHi:'tomHi', tomMid:'tomMid', tomLow:'tomLow',
  bass:'bass', synth:'synth', perc:'perc', fx:'fx'
};

// Override hitDrum to use real instrument sounds
const _origHitDrum = window.hitDrum;
window.hitDrum = function(i) {
  const pad = DRUM_PADS[i];
  // Play the instrument sound
  const soundFn = INST_SOUNDS[DRUM_SOUND_MAP[pad.sound] || pad.sound];
  if (soundFn) {
    try { soundFn(); } catch(e){}
  }
  // Animate pad
  const el = document.getElementById('drum-pad-' + i);
  if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 120); }
  // Stamp into sequencer if playing (same as before)
  if (tbProj && tbPlaying) {
    const patKey = tbProj.order[tbArrIdx] || tbProj.order[0];
    const step = tbBeat;
    const pat = tbProj.patterns[patKey];
    const ti = tbProj.tracks.findIndex(t => t.sound === pad.sound);
    if (ti !== -1 && pat && pat[ti]) {
      pat[ti][step] = 1;
      if (typeof tbRenderGrid === 'function') tbRenderGrid();
    }
  }
};

// Piano also gets real instrument sound (already uses Web Audio via playPianoNote)
// but override to use instCtx instead of actx
const _origPlayPianoNote = window.playPianoNote;
window.playPianoNote = function(note, octave) {
  const fullNote = note + octave;
  const freq = noteToFreq(note, octave);
  const ctx = getInstCtx(); const t = ctx.currentTime;
  // Rich piano-like sound: triangle + slight detune + decay envelope
  const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const env = ctx.createGain();
  osc1.type='triangle'; osc1.frequency.value=freq;
  osc2.type='sine';    osc2.frequency.value=freq*2.001; // 2nd harmonic
  osc3.type='sine';    osc3.frequency.value=freq*3.002; // 3rd harmonic
  const g1=ctx.createGain(); g1.gain.value=0.55;
  const g2=ctx.createGain(); g2.gain.value=0.2;
  const g3=ctx.createGain(); g3.gain.value=0.08;
  env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(0.7,t+0.008);
  env.gain.exponentialRampToValueAtTime(0.3,t+0.15);
  env.gain.exponentialRampToValueAtTime(0.001,t+1.4);
  osc1.connect(g1); osc2.connect(g2); osc3.connect(g3);
  g1.connect(env); g2.connect(env); g3.connect(env);
  env.connect(ctx.destination);
  osc1.start(t); osc2.start(t); osc3.start(t);
  osc1.stop(t+1.5); osc2.stop(t+1.5); osc3.stop(t+1.5);
  // UI
  const lbl = document.getElementById('piano-last-note');
  if (lbl) lbl.textContent = fullNote;
  if (pianoRecording) {
    pianoNotes.push({ note: fullNote, freq, time: ctx.currentTime - pianoRecStart });
  }
};

// Premium: unlock custom bg section when premium is applied
const _origApplyPP2 = window.applyPrototypePlus;
window.applyPrototypePlus = function() {
  if (_origApplyPP2) _origApplyPP2();
  const sec = document.getElementById('premium-bg-section');
  if (sec) sec.style.display = 'block';
};

// ═══════════════════════════════════════════════════════
// FRIEND SYSTEM
// Stored in the shared localStorage DB:
// db[email].friends   = { email: { since, status } }
// db[email].requests  = { from_email: { name, ts } }   (incoming)
// db[email].sent      = { to_email: { name, ts } }     (outgoing)
// db[email].messages  = { thread_id: [{ from, text, ts }] }
// thread_id = sorted([myEmail, friendEmail]).join('__')
// ═══════════════════════════════════════════════════════

let fpCurrentTab = 'friends';
let fpMsgThread  = null;   // email of open convo
let fpMsgPollIv  = null;   // polling interval for new messages
let fpUnreadMsgs = {};     // { email: count }
let fpPanelOpen  = false;

// ── Helpers ──
function friendsGetMe() { return currentUser ? currentUser.email : null; }
function threadId(a, b) { return [a, b].sort().join('__'); }
function friendsGetDB() { return dbLoad(); }
function friendsSaveDB(db) { dbSave(db); }

function friendsEnsureStructure(db, email) {
  if (!db[email]) return;
  if (!db[email].friends)  db[email].friends  = {};
  if (!db[email].requests) db[email].requests = {};
  if (!db[email].sent)     db[email].sent     = {};
  if (!db[email].messages) db[email].messages = {};
}

// ── Open / Close panel ──
function friendsOpen() {
  if (!currentUser) { requireAuth(friendsOpen); return; }
  document.getElementById('friends-panel').classList.add('open');
  fpPanelOpen = true;
  fpRender(fpCurrentTab);
  // Start polling for new messages/requests
  if (!fpMsgPollIv) fpMsgPollIv = setInterval(fpPoll, 4000);
}
function friendsClose() {
  document.getElementById('friends-panel').classList.remove('open');
  fpPanelOpen = false;
  fpMsgThread = null;
}
// Close when clicking outside panel
document.addEventListener('click', function(e) {
  const panel = document.getElementById('friends-panel');
  const btn   = document.getElementById('friends-nav-btn');
  if (fpPanelOpen && panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
    friendsClose();
  }
});

// ── Tab switching ──
function fpTab(el, tab) {
  fpCurrentTab = tab;
  fpMsgThread  = null;
  document.querySelectorAll('.fp-tab').forEach(t => t.classList.remove('sel'));
  el.classList.add('sel');
  fpRender(tab);
}

// ── Poll for updates ──
function fpPoll() {
  if (!currentUser) return;
  const db = friendsGetDB();
  const me = friendsGetMe();
  if (!db[me]) return;
  friendsEnsureStructure(db, me);

  // Count pending requests
  const reqCount = Object.keys(db[me].requests || {}).length;
  const reqBadge = document.getElementById('fp-req-badge');
  if (reqBadge) { reqBadge.textContent = reqCount || ''; reqBadge.classList.toggle('show', reqCount > 0); }
  const setReqBadge = document.getElementById('set-friends-badge');
  if (setReqBadge) { setReqBadge.textContent = reqCount || ''; setReqBadge.style.display = reqCount > 0 ? 'flex' : 'none'; }

  // Count unread messages
  let totalUnread = 0;
  const msgs = db[me].messages || {};
  const friends = db[me].friends || {};
  Object.keys(friends).forEach(fEmail => {
    const tid = threadId(me, fEmail);
    const thread = msgs[tid] || [];
    const lastRead = fpUnreadMsgs['_read_' + fEmail] || 0;
    const unread = thread.filter(m => m.from !== me && m.ts > lastRead).length;
    if (unread > 0) { fpUnreadMsgs[fEmail] = unread; totalUnread += unread; }
  });
  const msgBadge = document.getElementById('fp-msg-badge');
  if (msgBadge) { msgBadge.textContent = totalUnread || ''; msgBadge.classList.toggle('show', totalUnread > 0); }

  // Notification dot on nav button
  const notifDot = document.getElementById('friends-notif-dot');
  if (notifDot) notifDot.classList.toggle('show', reqCount > 0 || totalUnread > 0);

  // Re-render message thread if open
  if (fpMsgThread && fpCurrentTab === 'messages') fpRenderMsgThread(fpMsgThread);
  // Show toast for new messages if panel is closed
  if (!fpPanelOpen && totalUnread > 0) {
    const fName = Object.keys(fpUnreadMsgs).find(k => !k.startsWith('_') && fpUnreadMsgs[k] > 0);
    if (fName) showMsgNotif(fName + ' sent you a message');
  }
}

// ── Main render ──
function fpRender(tab) {
  const body = document.getElementById('fp-body');
  if (!body || !currentUser) return;
  const me = friendsGetMe();
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  const user = db[me];

  if (tab === 'find') {
    body.innerHTML = `
      <div class="friend-section-lbl">Search by email</div>
      <div class="fp-search-row">
        <input class="fp-search-inp" id="fp-search-inp" placeholder="friend@email.com" type="email">
        <button class="fp-search-btn" onclick="friendsSearch(document.getElementById('fp-search-inp').value,'fp-search-res')">Search</button>
      </div>
      <div id="fp-search-res"></div>
      <div class="fp-empty" style="margin-top:.5rem">Enter an email address to find someone on ORDECK.</div>`;
    const inp = document.getElementById('fp-search-inp');
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') friendsSearch(inp.value, 'fp-search-res'); });
    return;
  }

  if (tab === 'requests') {
    const reqs = user.requests || {};
    const sent = user.sent || {};
    let html = '';
    const incomingKeys = Object.keys(reqs);
    if (incomingKeys.length > 0) {
      html += '<div class="friend-section-lbl">Incoming requests</div>';
      incomingKeys.forEach(email => {
        const r = reqs[email];
        const initials = (r.name||email).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        html += friendCardHTML({ email, name: r.name||email.split('@')[0], initials, online: false }, 'request');
      });
    }
    const sentKeys = Object.keys(sent);
    if (sentKeys.length > 0) {
      html += '<div class="friend-section-lbl" style="margin-top:.65rem">Sent requests</div>';
      sentKeys.forEach(email => {
        const r = sent[email];
        const initials = (r.name||email).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        html += friendCardHTML({ email, name: r.name||email.split('@')[0], initials, online: false }, 'sent');
      });
    }
    if (!incomingKeys.length && !sentKeys.length) {
      html = '<div class="fp-empty">No pending friend requests.<br>Use the Find tab to add friends.</div>';
    }
    body.innerHTML = html;
    return;
  }

  if (tab === 'messages') {
    if (fpMsgThread) { fpRenderMsgThread(fpMsgThread); return; }
    const friends = user.friends || {};
    const msgs = user.messages || {};
    const fKeys = Object.keys(friends);
    if (fKeys.length === 0) {
      body.innerHTML = '<div class="fp-empty">Add friends first to start messaging.</div>';
      return;
    }
    // List all conversations sorted by latest message
    const convos = fKeys.map(fEmail => {
      const tid = threadId(me, fEmail);
      const thread = msgs[tid] || [];
      const last = thread[thread.length - 1];
      const fUser = db[fEmail];
      const name = (fUser && fUser.name) || fEmail.split('@')[0];
      const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const unread = (fpUnreadMsgs[fEmail] || 0);
      return { fEmail, name, initials, last, unread, ts: last ? last.ts : 0 };
    }).sort((a,b) => b.ts - a.ts);

    let html = '<div class="friend-section-lbl">Conversations</div>';
    convos.forEach(cv => {
      const preview = cv.last ? (cv.last.from === me ? 'You: ' : '') + cv.last.text.slice(0, 38) + (cv.last.text.length > 38 ? '…' : '') : 'No messages yet';
      const timeStr = cv.last ? friendsTimeAgo(cv.last.ts) : '';
      html += `<div class="friend-card" onclick="fpOpenThread('${cv.fEmail}')" style="cursor:pointer">
        <div class="friend-av">${cv.initials}<span class="friend-online-dot online"></span></div>
        <div class="friend-info">
          <div class="friend-name">${escapeHtml(cv.name)}</div>
          <div class="friend-meta">${escapeHtml(preview)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
          <span style="font-family:var(--mono);font-size:9px;color:rgba(200,200,220,.3)">${timeStr}</span>
          ${cv.unread > 0 ? `<span style="min-width:16px;height:16px;border-radius:8px;background:#f87171;font-family:var(--mono);font-size:8px;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 3px">${cv.unread}</span>` : ''}
        </div>
      </div>`;
    });
    body.innerHTML = html;
    return;
  }

  // Default: friends list
  const friends = user.friends || {};
  const fKeys = Object.keys(friends);
  if (fKeys.length === 0) {
    body.innerHTML = '<div class="fp-empty">You have no friends yet.<br>Use the <b style="color:#c084fc">Find</b> tab to search for people.</div>';
    return;
  }
  let html = `<div class="friend-section-lbl">${fKeys.length} friend${fKeys.length !== 1 ? 's' : ''}</div>`;
  fKeys.forEach(fEmail => {
    const fUser = db[fEmail];
    const name = (fUser && fUser.name) || fEmail.split('@')[0];
    const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const plan = fUser ? fUser.plan : 'standard';
    html += friendCardHTML({ email: fEmail, name, initials, online: false, plan }, 'friend');
  });
  body.innerHTML = html;
}

function friendCardHTML(f, type) {
  const planBadge = f.plan === 'prototype-plus' ? ' <span style="font-family:var(--mono);font-size:8px;color:#c084fc;border:.5px solid rgba(192,132,252,.3);padding:1px 4px">P+</span>' : '';
  let actions = '';
  if (type === 'friend') {
    actions = `<button class="fa-btn msg" onclick="fpOpenThread('${f.email}');fpTab(document.getElementById('fptab-messages'),'messages')">💬</button>
               <button class="fa-btn remove" onclick="friendsRemove('${f.email}')">✕</button>`;
  } else if (type === 'request') {
    actions = `<button class="fa-btn accept" onclick="friendsAccept('${f.email}')">Accept</button>
               <button class="fa-btn reject" onclick="friendsDecline('${f.email}')">Decline</button>`;
  } else if (type === 'sent') {
    actions = `<button class="fa-btn remove" onclick="friendsCancelRequest('${f.email}')" title="Cancel request">Cancel</button>`;
  } else if (type === 'search') {
    actions = `<button class="fa-btn add" onclick="friendsSendRequest('${f.email}')"><i class="ti ti-user-plus" aria-hidden="true"></i> Add</button>`;
  } else if (type === 'already') {
    actions = `<span style="font-family:var(--mono);font-size:9px;color:rgba(52,211,153,.5)">✓ Friend</span>`;
  } else if (type === 'pending') {
    actions = `<span style="font-family:var(--mono);font-size:9px;color:rgba(251,146,60,.5)">Pending</span>`;
  }
  return `<div class="friend-card" id="fc-${f.email.replace('@','_').replace('.','_')}">
    <div class="friend-av">${f.initials}<span class="friend-online-dot"></span></div>
    <div class="friend-info">
      <div class="friend-name">${escapeHtml(f.name)}${planBadge}</div>
      <div class="friend-meta">${escapeHtml(f.email)}</div>
    </div>
    <div class="friend-actions">${actions}</div>
  </div>`;
}

// ── Search ──
function friendsSearch(email, resultContainerId) {
  const me = friendsGetMe(); if (!me) return;
  email = (email || '').trim().toLowerCase();
  const container = document.getElementById(resultContainerId);
  if (!container) return;
  if (!email) { container.innerHTML = '<div class="fp-empty">Enter an email to search.</div>'; return; }
  if (email === me) { container.innerHTML = '<div class="fp-empty">That\'s you!</div>'; return; }
  const db = friendsGetDB();
  const found = db[email];
  if (!found) { container.innerHTML = '<div class="fp-empty">No ORDECK account found for that email.</div>'; return; }
  friendsEnsureStructure(db, me);
  const myUser = db[me];
  const isFriend  = myUser.friends[email];
  const isPending = myUser.sent[email];
  const isIncoming = myUser.requests[email];
  const name = found.name || email.split('@')[0];
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const type = isFriend ? 'already' : isIncoming ? 'request' : isPending ? 'pending' : 'search';
  container.innerHTML = friendCardHTML({ email, name, initials, plan: found.plan }, type);
}

// ── Send request ──
function friendsSendRequest(toEmail) {
  const me = friendsGetMe(); if (!me) return;
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  friendsEnsureStructure(db, toEmail);
  const myName = currentUser.name || me.split('@')[0];
  // Add to my sent
  db[me].sent[toEmail] = { name: (db[toEmail].name || toEmail.split('@')[0]), ts: Date.now() };
  // Add to their incoming requests
  db[toEmail].requests[me] = { name: myName, ts: Date.now() };
  friendsSaveDB(db);
  showToast('Friend request sent to ' + (db[toEmail].name || toEmail.split('@')[0]) + '!');
  fpRender(fpCurrentTab);
  if (document.getElementById('set-friends-results')) friendsRefreshSettingsLists();
}

// ── Accept ──
function friendsAccept(fromEmail) {
  const me = friendsGetMe(); if (!me) return;
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  friendsEnsureStructure(db, fromEmail);
  const now = Date.now();
  // Add to both friends lists
  db[me].friends[fromEmail] = { since: now };
  db[fromEmail].friends[me] = { since: now };
  // Remove from requests/sent
  delete db[me].requests[fromEmail];
  delete db[fromEmail].sent[me];
  friendsSaveDB(db);
  const name = db[fromEmail].name || fromEmail.split('@')[0];
  showToast('You and ' + name + ' are now friends!');
  fpRender('friends');
  fpTab(document.getElementById('fptab-friends'), 'friends');
  friendsRefreshSettingsLists();
}

// ── Decline ──
function friendsDecline(fromEmail) {
  const me = friendsGetMe(); if (!me) return;
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  friendsEnsureStructure(db, fromEmail);
  delete db[me].requests[fromEmail];
  delete db[fromEmail].sent[me];
  friendsSaveDB(db);
  showToast('Request declined');
  fpRender(fpCurrentTab);
  friendsRefreshSettingsLists();
}

// ── Cancel sent request ──
function friendsCancelRequest(toEmail) {
  const me = friendsGetMe(); if (!me) return;
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  friendsEnsureStructure(db, toEmail);
  delete db[me].sent[toEmail];
  delete db[toEmail].requests[me];
  friendsSaveDB(db);
  showToast('Request cancelled');
  fpRender(fpCurrentTab);
}

// ── Remove friend ──
function friendsRemove(fEmail) {
  if (!confirm('Remove ' + fEmail + ' from your friends?')) return;
  const me = friendsGetMe(); if (!me) return;
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  friendsEnsureStructure(db, fEmail);
  delete db[me].friends[fEmail];
  delete db[fEmail].friends[me];
  friendsSaveDB(db);
  showToast('Friend removed');
  fpRender('friends');
  friendsRefreshSettingsLists();
}

// ── Messaging ──
function fpOpenThread(fEmail) {
  fpMsgThread = fEmail;
  fpCurrentTab = 'messages';
  // Mark as read
  fpUnreadMsgs['_read_' + fEmail] = Date.now();
  fpUnreadMsgs[fEmail] = 0;
  fpRenderMsgThread(fEmail);
}

function fpRenderMsgThread(fEmail) {
  const body = document.getElementById('fp-body');
  const me = friendsGetMe();
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  const tid = threadId(me, fEmail);
  const thread = (db[me].messages[tid] || []);
  const fUser = db[fEmail];
  const fName = (fUser && fUser.name) || fEmail.split('@')[0];
  const fInitials = fName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  let msgsHTML = '';
  let lastDate = '';
  thread.forEach(msg => {
    const d = new Date(msg.ts);
    const dateStr = d.toLocaleDateString();
    if (dateStr !== lastDate) {
      msgsHTML += `<div class="msg-date-sep">${dateStr}</div>`;
      lastDate = dateStr;
    }
    const isMine = msg.from === me;
    const timeStr = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    msgsHTML += `<div class="msg-bubble ${isMine ? 'mine' : 'theirs'}">
      ${escapeHtml(msg.text)}
      <div class="msg-time">${timeStr}</div>
    </div>`;
  });
  if (!msgsHTML) msgsHTML = '<div class="fp-empty" style="margin-top:1rem">No messages yet. Say hello!</div>';

  body.innerHTML = `<div class="msg-thread">
    <div class="msg-thread-hd">
      <button class="msg-thread-back" onclick="fpMsgThread=null;fpRender('messages')">← Back</button>
      <div class="friend-av" style="width:26px;height:26px;font-size:10px;flex-shrink:0">${fInitials}</div>
      <span class="msg-thread-name">${escapeHtml(fName)}</span>
    </div>
    <div class="msg-list" id="fp-msg-list">${msgsHTML}</div>
    <div class="msg-input-row">
      <textarea class="msg-inp" id="fp-msg-inp" rows="1" placeholder="Message ${escapeHtml(fName)}..." onkeydown="fpMsgKey(event,'${fEmail}')"></textarea>
      <button class="msg-send-btn" onclick="fpSendMsg('${fEmail}')">Send</button>
    </div>
  </div>`;

  // Scroll to bottom
  const msgList = document.getElementById('fp-msg-list');
  if (msgList) setTimeout(() => { msgList.scrollTop = msgList.scrollHeight; }, 50);
}

function fpMsgKey(e, fEmail) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fpSendMsg(fEmail); }
}

function fpSendMsg(fEmail) {
  const inp = document.getElementById('fp-msg-inp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const me = friendsGetMe(); if (!me) return;
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  friendsEnsureStructure(db, fEmail);
  const tid = threadId(me, fEmail);
  const msg = { from: me, text, ts: Date.now() };
  // Write to MY messages
  if (!db[me].messages[tid])  db[me].messages[tid]  = [];
  db[me].messages[tid].push(msg);
  // Write to THEIR messages (cross-user delivery)
  if (!db[fEmail].messages[tid]) db[fEmail].messages[tid] = [];
  db[fEmail].messages[tid].push(msg);
  friendsSaveDB(db);
  if (inp) inp.value = '';
  fpRenderMsgThread(fEmail);
}

// ── Settings page lists ──
function friendsRefreshSettingsLists() {
  const me = friendsGetMe(); if (!me) return;
  const db = friendsGetDB();
  friendsEnsureStructure(db, me);
  const user = db[me];

  // Profile link
  const linkEl = document.getElementById('set-friends-link');
  if (linkEl) linkEl.textContent = 'ordeck.app/u/' + me;

  // Requests
  const reqEl = document.getElementById('set-requests-list');
  if (reqEl) {
    const reqs = user.requests || {};
    const keys = Object.keys(reqs);
    if (keys.length === 0) {
      reqEl.innerHTML = '<div class="fp-empty" style="padding:.5rem 0">No incoming requests.</div>';
    } else {
      reqEl.innerHTML = keys.map(email => {
        const r = reqs[email];
        const name = r.name || email.split('@')[0];
        const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        return friendCardHTML({ email, name, initials, online: false }, 'request');
      }).join('');
    }
  }

  // Friends list
  const flEl = document.getElementById('set-friends-list');
  if (flEl) {
    const friends = user.friends || {};
    const keys = Object.keys(friends);
    if (keys.length === 0) {
      flEl.innerHTML = '<div class="fp-empty" style="padding:.5rem 0">No friends yet.</div>';
    } else {
      flEl.innerHTML = keys.map(fEmail => {
        const fUser = db[fEmail];
        const name = (fUser && fUser.name) || fEmail.split('@')[0];
        const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        return friendCardHTML({ email: fEmail, name, initials, plan: fUser && fUser.plan }, 'friend');
      }).join('');
    }
  }
}

// Refresh when friends settings tab is opened
const _origSetT = window.setT;
window.setT = function(el, id) {
  _origSetT(el, id);
  if (id === 'sfriends') friendsRefreshSettingsLists();
};

// ── Misc helpers ──
function friendsCopyLink() {
  const me = friendsGetMe(); if (!me) { showToast('Log in first'); return; }
  const link = 'ordeck.app/u/' + me;
  navigator.clipboard.writeText(link).then(() => showToast('Profile link copied!')).catch(() => showToast('Link: ' + link));
}

function friendsTimeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)  return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}

function showMsgNotif(msg) {
  const el = document.getElementById('msg-notif');
  if (!el) return;
  el.innerHTML = '<i class="ti ti-message" aria-hidden="true"></i> ' + escapeHtml(msg);
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

// Start polling on boot if logged in
setTimeout(function() {
  if (currentUser) {
    if (!fpMsgPollIv) fpMsgPollIv = setInterval(fpPoll, 4000);
    fpPoll();
  }
}, 1500);

// ═══════════════════════════════════════════════════════
// PROJECT UPLOAD & EXPLORE SYSTEM
// Stored in localStorage key: 'ordeck-published-projects'
// Each project: { id, studio, name, desc, visibility,
//   tags, thumbUrl, license, collabs, author, authorName,
//   likes:[], comments:[], createdAt, updatedAt }
// ═══════════════════════════════════════════════════════

const PROJ_DB_KEY = 'ordeck-published-projects';
let upStudio     = 'tb';
let upVisibility = 'public';
let upTags       = [];
let upThumbUrl   = null;
let upThumbInput = null;
let exploreCurrentFilter = 'all';
let exploreCurrentSort   = 'recent';
let pvCurrentProject     = null;

// ── TAG options per studio ──
const STUDIO_TAGS = {
  tb: ['Hip-hop','Lo-fi','Trap','Afrobeats','EDM','R&B','Pop','Experimental','Drill','Jazz','Soul','Reggae'],
  vs: ['Cinematic','Animation','Tutorial','Vlog','Music Video','Short Film','Lyric Video','Motion Graphics','Ad'],
  ds: ['Platformer','Puzzle','Shooter','RPG','Arcade','Top-down','Runner','Horror','Strategy']
};
const STUDIO_META = {
  tb: { label:'Tidal Beat', color:'#c084fc', borderColor:'rgba(192,132,252,.5)', bg:'rgba(192,132,252,.1)', icon:'ti-music' },
  vs: { label:'Visual Studio', color:'#22d3ee', borderColor:'rgba(34,211,238,.5)', bg:'rgba(34,211,238,.1)', icon:'ti-video' },
  ds: { label:'Dev Studio', color:'#34d399', borderColor:'rgba(52,211,153,.5)', bg:'rgba(52,211,153,.1)', icon:'ti-code' }
};

// ── DB helpers ──
function projDBLoad() {
  try { return JSON.parse(localStorage.getItem(PROJ_DB_KEY) || '[]'); } catch(e) { return []; }
}
function projDBSave(arr) {
  try { localStorage.setItem(PROJ_DB_KEY, JSON.stringify(arr)); } catch(e) { showToast('Storage full — delete some projects to free space'); }
}
function projGenId() { return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }

// ── Open upload modal ──
function openUploadModal(studio) {
  if (!currentUser) { requireAuth(() => openUploadModal(studio)); return; }
  upStudio     = studio || 'tb';
  upVisibility = 'public';
  upTags       = [];
  upThumbUrl   = null;
  const meta   = STUDIO_META[upStudio];

  // Pre-fill name from current project
  const projName = (curProj[upStudio] && curProj[upStudio].name) || '';
  const nameInp  = document.getElementById('up-name');
  if (nameInp) nameInp.value = projName;

  // Studio display
  const studioDisp = document.getElementById('up-studio-display');
  if (studioDisp) {
    studioDisp.innerHTML = `<i class="ti ${meta.icon}" aria-hidden="true"></i> ${meta.label}`;
    studioDisp.style.color = meta.color;
    studioDisp.style.borderColor = meta.borderColor;
    studioDisp.style.background  = meta.bg;
  }

  // Tags
  const tagsRow = document.getElementById('up-tags-row');
  if (tagsRow) {
    tagsRow.innerHTML = STUDIO_TAGS[upStudio].map(tag =>
      `<div class="upload-tag" onclick="upToggleTag(this,'${tag}')">${tag}</div>`
    ).join('');
  }

  // Reset visibility
  upSetVis('public');

  // Reset thumb
  const prev = document.getElementById('up-thumb-preview');
  const zone = document.getElementById('up-thumb-zone');
  if (prev) { prev.src=''; prev.style.display='none'; }
  if (zone) zone.style.display = 'block';

  // Clear desc / collab
  const desc = document.getElementById('up-desc'); if (desc) desc.value = '';
  const col  = document.getElementById('up-collab'); if (col) col.value = '';

  document.getElementById('upload-modal').classList.add('open');
}
function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('open');
}

function upSetVis(v) {
  upVisibility = v;
  document.getElementById('up-vis-public').classList.toggle('sel',  v === 'public');
  document.getElementById('up-vis-private').classList.toggle('sel', v === 'private');
}

function upToggleTag(el, tag) {
  el.classList.toggle('sel');
  if (el.classList.contains('sel')) { if (!upTags.includes(tag)) upTags.push(tag); }
  else { upTags = upTags.filter(t => t !== tag); }
}

function upPickThumb() {
  if (!upThumbInput) {
    upThumbInput = document.createElement('input');
    upThumbInput.type = 'file'; upThumbInput.accept = 'image/*';
    upThumbInput.onchange = () => {
      const file = upThumbInput.files[0]; if (!file) return;
      if (file.size > 2 * 1024 * 1024) { showToast('Thumbnail must be under 2MB'); return; }
      const reader = new FileReader();
      reader.onload = e => {
        upThumbUrl = e.target.result;
        const prev = document.getElementById('up-thumb-preview');
        const zone = document.getElementById('up-thumb-zone');
        if (prev) { prev.src = upThumbUrl; prev.style.display = 'block'; }
        if (zone) zone.style.display = 'none';
      };
      reader.readAsDataURL(file);
    };
  }
  upThumbInput.click();
}

function submitUpload() {
  if (!currentUser) { showToast('Log in to publish'); return; }
  const name = (document.getElementById('up-name').value || '').trim();
  if (!name) { showToast('Give your project a name'); document.getElementById('up-name').focus(); return; }
  const desc    = (document.getElementById('up-desc').value || '').trim();
  const collab  = (document.getElementById('up-collab').value || '').trim();
  const license = document.getElementById('up-license').value;
  const collabs = collab ? collab.split(',').map(s => s.trim()).filter(Boolean) : [];

  const proj = {
    id:          projGenId(),
    studio:      upStudio,
    name,
    desc,
    visibility:  upVisibility,
    tags:        [...upTags],
    thumbUrl:    upThumbUrl,
    license,
    collabs,
    author:      currentUser.email,
    authorName:  currentUser.name || currentUser.email.split('@')[0],
    likes:       [],
    comments:    [],
    views:       0,
    createdAt:   Date.now(),
    updatedAt:   Date.now()
  };

  const all = projDBLoad();
  all.unshift(proj);
  projDBSave(all);

  closeUploadModal();
  showToast(`"${name}" published! ${upVisibility === 'private' ? '(Private)' : '🎉'}`)

  // Refresh explore
  exploreRender();
  homeExploreRender();
}

// ── Explore / Browse ──
let exploreSortMode = 'recent';
let exploreFilterMode = 'all';

function exploreFilterFull(el, filter) {
  exploreFilterMode = filter;
  document.querySelectorAll('#s-explore .explore-filter').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  exploreRender();
}
function exploreSort(mode, el) {
  exploreSortMode = mode;
  document.querySelectorAll('#s-explore .explore-filter').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  exploreRender();
}
function exploreFilter(el, filter) {
  exploreFilterMode = filter;
  document.querySelectorAll('#home-explore-section .explore-filter').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  homeExploreRender();
}

function exploreGetFiltered() {
  const all  = projDBLoad();
  const me   = currentUser ? currentUser.email : null;
  const search = (document.getElementById('explore-search') || {}).value || '';
  let list = all.filter(p => {
    if (p.visibility !== 'public' && p.author !== me) return false;
    if (exploreFilterMode !== 'all' && p.studio !== exploreFilterMode) return false;
    if (exploreSortMode === 'mine' && p.author !== me) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q) || (p.tags||[]).some(t => t.toLowerCase().includes(q));
    }
    return true;
  });
  if (exploreSortMode === 'likes') list.sort((a,b) => (b.likes||[]).length - (a.likes||[]).length);
  else list.sort((a,b) => b.createdAt - a.createdAt);
  return list;
}

function exploreRender() {
  const grid = document.getElementById('explore-full-grid');
  const count = document.getElementById('explore-count');
  if (!grid) return;
  const list = exploreGetFiltered();
  if (count) count.textContent = list.length + ' project' + (list.length !== 1 ? 's' : '');
  if (list.length === 0) {
    grid.innerHTML = '<div class="explore-empty">No projects found.<br>Be the first — publish yours from any studio!</div>';
    return;
  }
  grid.innerHTML = list.map(p => projCardHTML(p)).join('');
}

function homeExploreRender() {
  const grid = document.getElementById('home-explore-grid');
  if (!grid) return;
  const me = currentUser ? currentUser.email : null;
  const all = projDBLoad().filter(p => p.visibility === 'public' || p.author === me);
  let list = exploreFilterMode === 'all' ? all : all.filter(p => p.studio === exploreFilterMode);
  list = list.slice(0, 6); // show max 6 on home
  if (list.length === 0) {
    grid.innerHTML = '<div class="explore-empty" style="padding:1.5rem">No public projects yet.<br>Publish yours from any studio!</div>';
    return;
  }
  grid.innerHTML = list.map(p => projCardHTML(p)).join('');
}

function projCardHTML(p) {
  const meta = STUDIO_META[p.studio] || STUDIO_META.tb;
  const authorInitials = (p.authorName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const timeAgo = friendsTimeAgo(p.createdAt);
  const likeCount = (p.likes||[]).length;
  const commentCount = (p.comments||[]).length;
  const tagsHTML = (p.tags||[]).slice(0,3).map(t => `<span class="proj-card-tag">${escapeHtml(t)}</span>`).join('');
  const isPrivate = p.visibility === 'private';
  const thumbHTML = p.thumbUrl
    ? `<img src="${p.thumbUrl}" alt="thumb" style="width:100%;height:100%;object-fit:cover">`
    : `<div class="proj-card-thumb-placeholder"><i class="ti ${meta.icon}" aria-hidden="true"></i></div>`;

  return `<div class="proj-card" onclick="openProjectView('${p.id}')">
    <div class="proj-card-thumb">
      ${thumbHTML}
      <div class="proj-card-thumb-overlay"></div>
      <div class="proj-card-studio-badge" style="color:${meta.color};border-color:${meta.borderColor};background:rgba(0,0,0,.5)">${meta.label}</div>
      ${isPrivate ? '<div class="proj-card-vis-badge" style="background:rgba(0,0,0,.6);color:rgba(200,200,220,.5);border:.5px solid rgba(200,200,220,.2)"><i class="ti ti-lock" aria-hidden="true"></i> Private</div>' : ''}
    </div>
    <div class="proj-card-body">
      <div class="proj-card-title">${escapeHtml(p.name)}</div>
      ${p.desc ? `<div class="proj-card-desc">${escapeHtml(p.desc)}</div>` : ''}
      ${tagsHTML ? `<div class="proj-card-tags">${tagsHTML}</div>` : ''}
      <div class="proj-card-meta">
        <div class="proj-card-av">${authorInitials}</div>
        <span class="proj-card-author">${escapeHtml(p.authorName||p.author)}</span>
        <div class="proj-card-stats">
          <span class="proj-card-stat"><i class="ti ti-heart" aria-hidden="true"></i> ${likeCount}</span>
          <span class="proj-card-stat"><i class="ti ti-message" aria-hidden="true"></i> ${commentCount}</span>
        </div>
        <span style="font-family:var(--mono);font-size:8px;color:rgba(200,200,220,.22);margin-left:.25rem">${timeAgo}</span>
      </div>
    </div>
  </div>`;
}

// ── Project Detail View ──
function openProjectView(id, backTo) {
  const all = projDBLoad();
  const p = all.find(proj => proj.id === id);
  if (!p) { showToast('Project not found'); return; }
  pvCurrentProject = p;
  // Track view
  p.views = (p.views || 0) + 1;
  projDBSave(all);
  // Back button
  const backBtn = document.getElementById('pv-back-btn');
  if (backBtn) backBtn.onclick = () => go(backTo || 's-explore');
  pvRender(p);
  go('s-proj-view');
}

function pvRender(p) {
  const meta = STUDIO_META[p.studio] || STUDIO_META.tb;
  const me   = currentUser ? currentUser.email : null;
  const isOwner = me === p.author;
  const hasLiked = me && (p.likes||[]).includes(me);
  const authorInitials = (p.authorName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  // Hero
  const heroImg = document.getElementById('pv-hero-img');
  const heroPlaceholder = document.getElementById('pv-hero-placeholder');
  if (p.thumbUrl) {
    heroImg.src = p.thumbUrl; heroImg.style.display='block';
    if (heroPlaceholder) heroPlaceholder.style.display='none';
  } else {
    if (heroImg) heroImg.style.display='none';
    if (heroPlaceholder) { heroPlaceholder.style.display='flex'; heroPlaceholder.innerHTML=`<i class="ti ${meta.icon}" aria-hidden="true"></i>`; }
  }
  const badge = document.getElementById('pv-studio-badge');
  if (badge) { badge.textContent=meta.label; badge.style.color=meta.color; badge.style.borderColor=meta.borderColor; badge.style.background='rgba(0,0,0,.5)'; }

  document.getElementById('pv-title').textContent = p.name;
  document.getElementById('pv-author-av').textContent = authorInitials;
  document.getElementById('pv-author-name').textContent = p.authorName || p.author;
  document.getElementById('pv-date').textContent = new Date(p.createdAt).toLocaleDateString();

  // Tags
  document.getElementById('pv-tags').innerHTML = (p.tags||[]).map(t=>`<span class="pv-tag">${escapeHtml(t)}</span>`).join('');

  // Description
  document.getElementById('pv-desc').textContent = p.desc || 'No description provided.';

  // Actions
  const actions = document.getElementById('pv-actions');
  if (actions) {
    let btns = '';
    if (isOwner) btns += `<button class="pv-btn outline" onclick="openUploadModal('${p.studio}')"><i class="ti ti-edit" aria-hidden="true"></i> Edit & Republish</button>`;
    btns += `<button class="pv-btn outline" onclick="pvShare()"><i class="ti ti-share" aria-hidden="true"></i> Share</button>`;
    if (!isOwner && me) btns += `<button class="pv-btn outline" onclick="pvFollowAuthor('${p.author}')"><i class="ti ti-user-plus" aria-hidden="true"></i> Add Friend</button>`;
    actions.innerHTML = btns;
  }

  // Info rows
  const infoRows = document.getElementById('pv-info-rows');
  if (infoRows) {
    infoRows.innerHTML = `
      <div class="pv-info-row"><span class="pv-info-key">Studio</span><span class="pv-info-val">${meta.label}</span></div>
      <div class="pv-info-row"><span class="pv-info-key">Visibility</span><span class="pv-info-val">${p.visibility==='public'?'🌍 Public':'🔒 Private'}</span></div>
      <div class="pv-info-row"><span class="pv-info-key">License</span><span class="pv-info-val">${p.license||'All rights reserved'}</span></div>
      <div class="pv-info-row"><span class="pv-info-key">Published</span><span class="pv-info-val">${new Date(p.createdAt).toLocaleDateString()}</span></div>
      <div class="pv-info-row"><span class="pv-info-key">Views</span><span class="pv-info-val">${p.views||1}</span></div>
      <div class="pv-info-row"><span class="pv-info-key">Comments</span><span class="pv-info-val">${(p.comments||[]).length}</span></div>
    `;
  }

  // Like button
  const likeBtn = document.getElementById('pv-like-btn');
  const likeCount = document.getElementById('pv-like-count');
  if (likeBtn) likeBtn.classList.toggle('liked', hasLiked);
  if (likeCount) likeCount.textContent = (p.likes||[]).length;

  // Owner controls
  const adminCard = document.getElementById('pv-admin-card');
  if (adminCard) adminCard.style.display = isOwner ? 'block' : 'none';
  const visLbl = document.getElementById('pv-vis-btn-lbl');
  if (visLbl) visLbl.textContent = p.visibility==='public' ? 'Make private' : 'Make public';

  // Collaborators
  const collabCard = document.getElementById('pv-collab-card');
  const collabEl   = document.getElementById('pv-collabs');
  if (p.collabs && p.collabs.length > 0) {
    if (collabCard) collabCard.style.display='block';
    if (collabEl) collabEl.innerHTML = p.collabs.map(c=>`<div style="font-family:var(--mono);font-size:11px;color:rgba(200,200,220,.5);padding:.25rem 0">${escapeHtml(c)}</div>`).join('');
  } else {
    if (collabCard) collabCard.style.display='none';
  }

  // Comments
  pvRenderComments(p);

  // Hide comment input if not logged in
  const cinpRow = document.getElementById('pv-comment-inp-row');
  if (cinpRow) cinpRow.style.display = me ? 'flex' : 'none';
}

function pvRenderComments(p) {
  const list = document.getElementById('pv-comments-list');
  if (!list) return;
  const comments = p.comments || [];
  if (comments.length === 0) {
    list.innerHTML = '<div style="font-family:var(--mono);font-size:11px;color:rgba(200,200,220,.25);padding:.5rem 0 1rem">No comments yet — be the first!</div>';
    return;
  }
  list.innerHTML = comments.map(cm => {
    const initials = (cm.authorName||cm.author||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `<div class="pv-comment">
      <div class="pv-comment-av">${initials}</div>
      <div class="pv-comment-body">
        <div class="pv-comment-header">
          <span class="pv-comment-name">${escapeHtml(cm.authorName||cm.author)}</span>
          <span class="pv-comment-time">${friendsTimeAgo(cm.ts)}</span>
        </div>
        <div class="pv-comment-text">${escapeHtml(cm.text)}</div>
      </div>
    </div>`;
  }).join('');
}

function pvSubmitComment() {
  if (!currentUser) { requireAuth(pvSubmitComment); return; }
  const inp = document.getElementById('pv-comment-inp');
  const text = (inp ? inp.value : '').trim();
  if (!text || !pvCurrentProject) return;
  const all = projDBLoad();
  const p = all.find(proj => proj.id === pvCurrentProject.id);
  if (!p) return;
  if (!p.comments) p.comments = [];
  p.comments.push({ author: currentUser.email, authorName: currentUser.name||currentUser.email.split('@')[0], text, ts: Date.now() });
  projDBSave(all);
  pvCurrentProject = p;
  pvRenderComments(p);
  if (inp) inp.value = '';
  // Update comment count in info
  const infoRows = document.getElementById('pv-info-rows');
  if (infoRows) {
    const rows = infoRows.querySelectorAll('.pv-info-row');
    rows.forEach(r => { if (r.querySelector('.pv-info-key') && r.querySelector('.pv-info-key').textContent==='Comments') r.querySelector('.pv-info-val').textContent = p.comments.length; });
  }
}

function pvToggleLike() {
  if (!currentUser) { requireAuth(pvToggleLike); return; }
  const me = currentUser.email;
  const all = projDBLoad();
  const p = all.find(proj => proj.id === pvCurrentProject.id);
  if (!p) return;
  if (!p.likes) p.likes = [];
  const idx = p.likes.indexOf(me);
  if (idx === -1) p.likes.push(me);
  else p.likes.splice(idx, 1);
  projDBSave(all);
  pvCurrentProject = p;
  const liked = p.likes.includes(me);
  const likeBtn = document.getElementById('pv-like-btn');
  const likeCount = document.getElementById('pv-like-count');
  if (likeBtn) likeBtn.classList.toggle('liked', liked);
  if (likeCount) likeCount.textContent = p.likes.length;
  showToast(liked ? '❤️ Liked!' : 'Like removed');
}

function pvDeleteProject() {
  if (!pvCurrentProject) return;
  if (!confirm('Delete "' + pvCurrentProject.name + '"? This cannot be undone.')) return;
  const all = projDBLoad().filter(p => p.id !== pvCurrentProject.id);
  projDBSave(all);
  pvCurrentProject = null;
  showToast('Project deleted');
  go('s-explore');
  exploreRender();
  homeExploreRender();
}

function pvToggleVisibility() {
  if (!pvCurrentProject) return;
  const all = projDBLoad();
  const p = all.find(proj => proj.id === pvCurrentProject.id);
  if (!p) return;
  p.visibility = p.visibility === 'public' ? 'private' : 'public';
  p.updatedAt = Date.now();
  projDBSave(all);
  pvCurrentProject = p;
  const visLbl = document.getElementById('pv-vis-btn-lbl');
  if (visLbl) visLbl.textContent = p.visibility==='public' ? 'Make private' : 'Make public';
  showToast('Visibility set to ' + p.visibility);
}

function pvShare() {
  if (!pvCurrentProject) return;
  const link = 'ordeck.app/p/' + pvCurrentProject.id;
  navigator.clipboard.writeText(link).then(() => showToast('Link copied!')).catch(() => showToast('Link: ' + link));
}

function pvFollowAuthor(email) {
  if (!currentUser) { requireAuth(() => pvFollowAuthor(email)); return; }
  friendsSendRequest(email);
}

// ── Init explore on home and explore screen ──
document.addEventListener('DOMContentLoaded', function() {
  homeExploreRender();
  const exploreScreen = document.getElementById('s-explore');
  if (exploreScreen) {
    const obs = new MutationObserver(muts => {
      muts.forEach(m => { if (m.target.classList.contains('active')) exploreRender(); });
    });
    obs.observe(exploreScreen, { attributes:true, attributeFilter:['class'] });
  }
  // Also refresh home explore when home screen is active
  const homeScreen = document.getElementById('s-home');
  if (homeScreen) {
    const obs2 = new MutationObserver(muts => {
      muts.forEach(m => { if (m.target.classList.contains('active')) homeExploreRender(); });
    });
    obs2.observe(homeScreen, { attributes:true, attributeFilter:['class'] });
  }
});
