/* ============ 摇晃的世界，稳稳的家 · 交互绘本引擎 ============ */
"use strict";
const $ = s => document.querySelector(s);
const stage = $("#stage"), toastEl = $("#toast");

/* ---------- 音效引擎（Web Audio 合成，无外部音频） ---------- */
let AC = null;
function ac(){ if(!AC) AC = new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended") AC.resume(); return AC; }
function tone(freq, dur, type, vol, when, slideTo){
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = type||"sine"; o.frequency.setValueAtTime(freq, c.currentTime+(when||0));
  if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime+(when||0)+dur);
  g.gain.setValueAtTime(0.0001, c.currentTime+(when||0));
  g.gain.exponentialRampToValueAtTime(vol||0.15, c.currentTime+(when||0)+0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+(when||0)+dur);
  o.connect(g); g.connect(c.destination);
  o.start(c.currentTime+(when||0)); o.stop(c.currentTime+(when||0)+dur+0.05);
}
function noiseBurst(dur, vol, low, when){
  const c = ac(), n = c.sampleRate*dur, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i] = (Math.random()*2-1)*(1-i/n);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type="lowpass"; f.frequency.value = low||400;
  const g = c.createGain(); g.gain.value = vol||0.3;
  s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime+(when||0));
}
const sfx = {
  ding(){ tone(880,.18,"sine",.14); tone(1320,.22,"sine",.09,.05); },
  pop(){ tone(520,.1,"triangle",.16,0,760); },
  knock(){ noiseBurst(.07,.5,900); tone(210,.09,"square",.1); },
  thump(){ tone(120,.28,"sine",.3,0,55); noiseBurst(.2,.25,220); },
  rumble(){ noiseBurst(1.1,.5,140); tone(60,1.0,"sine",.22,0,38); },
  chime(){ [523,659,784,1047].forEach((f,i)=>tone(f,.35,"sine",.12,i*.09)); },
  rescue(){ [392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.4,"triangle",.11,i*.1)); },
  wrong(){ tone(220,.25,"sawtooth",.08,0,180); tone(180,.3,"sawtooth",.07,.12,140); },
  boing(){ tone(300,.28,"sine",.16,0,620); tone(620,.2,"sine",.1,.14,300); },
  step(i){ tone(160+((i%2)*40),.09,"sine",.12,0,90); }
};
function vib(ms){ if(navigator.vibrate) try{navigator.vibrate(ms);}catch(e){} }

/* ---------- 背景音乐（轻柔五声音阶循环） ---------- */
let musicOn = false, musicTimer = null;
const PENTA = [262,294,330,392,440,523,587,659];
function musicLoop(){
  if(!musicOn) return;
  const n = PENTA[Math.floor(Math.random()*PENTA.length)];
  tone(n,.9,"triangle",.035);
  if(Math.random()<.35) tone(n/2,1.2,"sine",.025,.1);
  musicTimer = setTimeout(musicLoop, 620);
}
$("#musicBtn").addEventListener("click", function(){
  musicOn = !musicOn;
  this.classList.toggle("off", !musicOn);
  if(musicOn){ ac(); musicLoop(); toast("🎵 轻柔音乐开启"); } else { clearTimeout(musicTimer); toast("音乐已关闭"); }
});

/* ---------- 配音朗读 ---------- */
function speak(text){
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN"; u.rate = .95; u.pitch = 1.1;
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- 提示 toast ---------- */
let toastT = null;
function toast(msg){
  toastEl.textContent = msg; toastEl.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(()=>toastEl.classList.remove("show"), 2200);
}

/* ---------- 进度与小红花 ---------- */
const TASKS = {
  0:["hand","boy"],
  1:["plates","house","squeeze","shake"],
  2:["lamp","frame","shelf","door"],
  3:["lie","pillow","grab","warn"],
  4:["pipe","phone","cloth"],
  5:["escape"]
};
const done = {}, flowers = [false,false,false,false,false,false];
for(const k in TASKS) done[k] = {};

function task(pageId, taskId){
  if(done[pageId][taskId]) return false;
  done[pageId][taskId] = true;
  const z = document.querySelector(`.zone[data-p="${pageId}"][data-t="${taskId}"]`);
  if(z){ z.classList.add("done"); if(!z.querySelector(".chk")){ const c=document.createElement("div"); c.className="chk"; c.textContent="✓"; z.appendChild(c);} }
  if(TASKS[pageId].every(t => done[pageId][t])) awardFlower(+pageId);
  return true;
}
function awardFlower(i){
  if(flowers[i]) return;
  flowers[i] = true;
  sfx.chime(); vib([30,40,30]);
  renderTray(true);
  toast(`🌸 太棒了！获得第 ${i+1} 朵小红花！`);
  if(flowers.every(Boolean)){
    setTimeout(()=>{ confetti(); speak("恭喜你集齐了所有小红花，成为防震小卫士！快去最后一页领取荣誉证书吧！"); toast("🎉 集齐6朵小红花！证书已解锁！"); }, 900);
  }
}
function renderTray(animLast){
  const tray = $("#tray"); tray.innerHTML = "";
  flowers.forEach((f,i)=>{
    const s = document.createElement("span");
    s.className = "fslot"+(f?" on":""); s.textContent = "🌸";
    if(f && animLast && i === flowers.lastIndexOf(true)) s.style.animation = "popIn .5s cubic-bezier(.2,1.6,.4,1)";
    tray.appendChild(s);
  });
}
function confetti(){
  const emo = ["🌸","⭐","🎈","🧡","💛","🌟"];
  for(let i=0;i<26;i++){
    const c = document.createElement("div");
    c.className = "confetti"; c.textContent = emo[i%emo.length];
    c.style.left = Math.random()*100+"vw";
    c.style.animationDelay = (Math.random()*.8)+"s";
    c.style.fontSize = (16+Math.random()*16)+"px";
    document.body.appendChild(c);
    setTimeout(()=>c.remove(), 3600);
  }
}

/* ---------- 通用组件 ---------- */
function pctRect(el){ const r = el.getBoundingClientRect(); return r; }
function addZone(pageEl, p, opt){
  const z = document.createElement("div");
  z.className = "zone"; z.dataset.p = p; z.dataset.t = opt.id;
  z.style.cssText = `left:${opt.l}%;top:${opt.t}%;width:${opt.w}%;height:${opt.h}%;`;
  if(opt.hint !== false && !done[p][opt.id]) z.innerHTML = '<div class="ring"></div>';
  if(done[p][opt.id]){ z.classList.add("done"); const c=document.createElement("div"); c.className="chk"; c.textContent="✓"; z.appendChild(c); }
  z.addEventListener("pointerup", e => { e.stopPropagation(); opt.onTap(z, e); });
  pageEl.querySelector(".ovl").appendChild(z);
  return z;
}
function bubble(pageEl, xPct, yPct, html, up){
  pageEl.querySelectorAll(".bubble").forEach(b=>b.remove());
  const b = document.createElement("div");
  b.className = "bubble"+(up?" up":"");
  b.innerHTML = html;
  const left = Math.min(Math.max(xPct, 14), 68);
  b.style.left = left+"%";
  if(up) b.style.bottom = (100-yPct+2)+"%"; else b.style.top = yPct+"%";
  b.addEventListener("pointerup", ()=>b.remove());
  pageEl.querySelector(".ovl").appendChild(b);
  setTimeout(()=>{ if(b.parentNode) b.remove(); }, 5200);
  return b;
}
function stickerFx(pageEl, xPct, yPct, text){
  const s = document.createElement("div");
  s.className = "sticker"; s.textContent = text;
  s.style.left = xPct+"%"; s.style.top = yPct+"%";
  pageEl.querySelector(".ovl").appendChild(s);
  setTimeout(()=>s.remove(), 2600);
}
function stampFx(zoneEl, text){
  const s = document.createElement("div");
  s.className = "stamp"; s.textContent = text || "危险！";
  zoneEl.appendChild(s);
}
function pageShake(pageEl, big){
  pageEl.classList.remove("shaking","rumbling"); void pageEl.offsetWidth;
  pageEl.classList.add(big?"shaking":"rumbling");
  setTimeout(()=>pageEl.classList.remove("shaking","rumbling"), big?600:650);
}
function addNarrate(pageEl, text){ pageEl._narrate = text; }
function addTag(pageEl, txt){ pageEl._tag = txt; }
function mountChrome(p){
  const bar = $("#bar2"); bar.innerHTML = "";
  if(p._narrate){
    const n = document.createElement("button");
    n.className = "narrate st"; n.textContent = "🔊 听故事";
    n.addEventListener("click", ()=>{ ac(); speak(p._narrate); });
    bar.appendChild(n);
  }
  if(p._mission){
    p._mission.classList.add("st");
    bar.appendChild(p._mission);
  } else {
    const m = document.createElement("div");
    m.className = "mission st disp";
    m.textContent = "👆 点击画面中发光的圆圈，发现小惊喜";
    bar.appendChild(m);
  }
  if(p._tag){
    const t = document.createElement("span");
    t.className = "page-tag st disp"; t.textContent = p._tag;
    bar.appendChild(t);
  }
}
/* 拖拽元素 */
function makeDrag(pageEl, inner, startL, startT, onDrop){
  const d = document.createElement("div");
  d.className = "drag-el"; d.innerHTML = inner;
  d.style.left = startL+"%"; d.style.top = startT+"%";
  pageEl.querySelector(".ovl").appendChild(d);
  let sx, sy, sl, st, dragging = false;
  d.addEventListener("pointerdown", e=>{
    e.stopPropagation(); dragging = true; d.setPointerCapture(e.pointerId);
    d.classList.remove("snap-anim");
    const r = pageEl.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY; sl = d.offsetLeft; st = d.offsetTop;
    d.style.transform = "scale(1.15)";
  });
  d.addEventListener("pointermove", e=>{
    if(!dragging) return;
    const r = pageEl.getBoundingClientRect();
    d.style.left = (sl + e.clientX - sx)+"px";
    d.style.top = (st + e.clientY - sy)+"px";
  });
  d.addEventListener("pointerup", e=>{
    if(!dragging) return; dragging = false;
    d.style.transform = "";
    const r = pageEl.getBoundingClientRect();
    const cx = d.offsetLeft + d.offsetWidth/2, cy = d.offsetTop + d.offsetHeight/2;
    onDrop(d, cx/r.width*100, cy/r.height*100);
  });
  return d;
}

/* ============ 页面构建 ============ */
function makePage(i, img){
  const p = document.createElement("section");
  p.className = "page"; p.dataset.i = i;
  p.innerHTML = `<img src="assets/${img}" alt="绘本第${i}页" draggable="false"><div class="ovl"></div>`;
  return p;
}

/* ---------- 封面页 ---------- */
function buildP0(p){
  const ovl = p.querySelector(".ovl");
  const sun = document.createElement("div"); sun.className = "sunrise"; ovl.appendChild(sun);
  addTag(p, "封面");
  addNarrate(p, "摇晃的世界，稳稳的家。地震防灾减灾与自救互救科普绘本。");
  addZone(p, 0, { id:"hand", l:2, t:26, w:40, h:42, onTap(z){
    if(task(0,"hand")){
      sfx.chime(); vib(30);
      const g = document.createElement("div");
      g.className = "glow-fx"; g.style.cssText = "left:4%;top:36%;width:44%;height:34%;";
      ovl.appendChild(g); setTimeout(()=>g.remove(), 1200);
      bubble(p, 16, 64, "<b>别怕，有我们在！</b><br>消防员叔叔会一直保护你。", true);
      speak("别怕，有我们在！");
    }
  }});
  addZone(p, 0, { id:"boy", l:40, t:70, w:16, h:24, onTap(z){
    if(task(0,"boy")){
      sfx.pop(); vib(20);
      stickerFx(p, 46, 62, "😊 我会保护好自己的！");
      bubble(p, 30, 30, "点点头，跟着绘本一起学会<b>自救小本领</b>吧！");
    }
  }});
  const nh = document.createElement("div");
  nh.className = "next-hint"; nh.textContent = "➜";
  nh.addEventListener("pointerup", e=>{ e.stopPropagation(); go(cur+1, 1); });
  ovl.appendChild(nh);
}

/* ---------- 第1页 大地为何发脾气 ---------- */
function buildP1(p){
  const ovl = p.querySelector(".ovl");
  addTag(p, "第 1 页 · 地震成因");
  addNarrate(p, "我们的地球表面，其实是由很多大板块拼成的。哎呀，太挤啦！当它们挤得太用力，或者突然错开时，大地就会震动，这就是地震。");
  const spark = ()=>{
    const s = document.createElement("div");
    s.className = "spark"; s.textContent = "💥";
    s.style.cssText = "left:44%;top:44%;";
    ovl.appendChild(s); setTimeout(()=>s.remove(), 900);
  };
  [["L",24,36,26,32],["R",50,30,26,34]].forEach(([k,l,t,w,h])=>{
    addZone(p, 1, { id:"plates", l, t, w, h, onTap(){
      sfx.thump(); vib(60); pageShake(p, true); spark();
      if(task(1,"plates")) bubble(p, 14, 12, "岩石板块宝宝们在<b>「哼哧哼哧」</b>用力挤呀挤！");
    }});
  });
  addZone(p, 1, { id:"house", l:40, t:70, w:20, h:14, onTap(){
    sfx.rumble(); vib([80,40,80]); pageShake(p, false);
    if(task(1,"house")) bubble(p, 20, 52, "轰隆隆——<b>大地晃动起来</b>，小房子都跟着摇啦！");
  }});
  addZone(p, 1, { id:"squeeze", l:12, t:66, w:24, h:12, onTap(){
    sfx.pop();
    if(task(1,"squeeze")) bubble(p, 8, 46, "<b>挤压</b>：板块宝宝互相推挤，力气越攒越大，就像弹簧被压紧！");
  }});
  addZone(p, 1, { id:"shake", l:66, t:48, w:22, h:12, onTap(){
    sfx.pop();
    if(task(1,"shake")) bubble(p, 34, 62, "<b>震动</b>：攒着的力气突然松开，大地就发起抖来，这就是地震！", true);
  }});
  // 彩蛋：地心小精灵
  [[17,37,15,13],[63,26,16,13]].forEach(([l,t,w,h])=>{
    const z = document.createElement("div");
    z.className = "zone"; z.style.cssText = `left:${l}%;top:${t}%;width:${w}%;height:${h}%;`;
    z.addEventListener("pointerup", e=>{
      e.stopPropagation(); sfx.boing(); vib(20);
      stickerFx(p, l+2, t-6, ["呀！被发现了～","地心里好热闹！"][Math.floor(Math.random()*2)]);
    });
    ovl.appendChild(z);
  });
}

/* ---------- 第2页 警报！地震来了（找危险游戏） ---------- */
function buildP2(p){
  const ovl = p.querySelector(".ovl");
  p.classList.add("ambient-shake");
  addTag(p, "第 2 页 · 找危险");
  addNarrate(p, "地震发生往往只有短短几秒到几十秒！如果感觉到晃动，千万不要慌张，更不要盲目往外跑！");
  const mission = document.createElement("div");
  mission.className = "mission disp";
  mission.innerHTML = '🔍 快找出房间里的危险！ <span class="cnt">0 / 4</span>';
  p._mission = mission;
  const updateCnt = ()=>{
    const n = TASKS[2].filter(t=>done[2][t]).length;
    mission.querySelector(".cnt").textContent = `${n} / 4`;
    if(n===4) mission.innerHTML = "🎉 全部找到啦！你真细心！";
  };
  const dangers = [
    { id:"lamp", l:30, t:19, w:17, h:16, tip:"<b>摇晃的吊灯</b>会掉下来砸到人，快躲开！", bx:16, by:38 },
    { id:"frame", l:64, t:24, w:26, h:16, tip:"<b>相框摇摇欲坠</b>，容易被它砸到哦！", bx:40, by:44 },
    { id:"shelf", l:46, t:44, w:32, h:26, tip:"<b>高高的书架会倒</b>，千万不要躲在旁边！", bx:12, by:74, up:true },
    { id:"door", l:82, t:42, w:17, h:34, tip:"<b>门口被堵住了</b>，盲目往外跑很危险！", bx:36, by:30 }
  ];
  dangers.forEach(d=>{
    addZone(p, 2, { id:d.id, l:d.l, t:d.t, w:d.w, h:d.h, onTap(z){
      if(done[2][d.id]) { bubble(p, d.bx, d.by, d.tip, d.up); return; }
      sfx.ding(); vib(30); stampFx(z); task(2, d.id); updateCnt();
      bubble(p, d.bx, d.by, "这里很危险，会被砸到哦！<br>"+d.tip, d.up);
      if(TASKS[2].every(t=>done[2][t])) { p.classList.remove("ambient-shake"); sfx.chime(); }
    }});
  });
  // 吊灯持续摇摆提示
  const sw = document.createElement("div");
  sw.style.cssText = "position:absolute;left:33%;top:19%;width:12%;height:16%;pointer-events:none;transform-origin:50% 0;animation:lampSw 1.4s ease-in-out infinite;";
  ovl.appendChild(sw);
  const st = document.createElement("style");
  st.textContent = "@keyframes lampSw{0%,100%{transform:rotate(-7deg);}50%{transform:rotate(7deg);}}";
  document.head.appendChild(st);
  // 彩蛋：小猫
  const cat = document.createElement("div");
  cat.className = "zone"; cat.style.cssText = "left:71%;top:67%;width:13%;height:11%;";
  cat.addEventListener("pointerup", e=>{ e.stopPropagation(); sfx.boing(); stickerFx(p, 66, 62, "喵～ 我也想躲起来"); });
  ovl.appendChild(cat);
}

/* ---------- 第3页 黄金自救十二字口诀（动作模仿） ---------- */
function buildP3(p){
  const ovl = p.querySelector(".ovl");
  addTag(p, "第 3 页 · 跟我做");
  addNarrate(p, "地震自救黄金十二字口诀：伏地、遮挡、手抓牢。");
  const mission = document.createElement("div");
  mission.className = "mission disp";
  mission.innerHTML = "第①步：点击小男孩，让他趴下";
  p._mission = mission;

  addZone(p, 3, { id:"lie", l:22, t:21, w:56, h:17, onTap(){
    if(task(3,"lie")){
      sfx.pop(); vib(25); pageShake(p, false);
      mission.innerHTML = "第②步：把枕头拖到小男孩头上";
      bubble(p, 14, 39.5, "<b>伏地！</b>趴下，降低重心，不容易摔倒。");
      speak("伏地！趴下，降低重心。");
      spawnPillow();
    }
  }});

  function spawnPillow(){
    const d = makeDrag(p, '<div class="pillow">☁️</div>', 6, 84, (el, x, y)=>{
      if(x>28 && x<58 && y>44 && y<58){
        el.classList.add("snap-anim");
        el.style.left = "36%"; el.style.top = "46.5%";
        el.style.pointerEvents = "none";
        sfx.ding(); vib(25); task(3,"pillow");
        mission.innerHTML = "第③步：拖动小手，紧紧抓住桌腿";
        bubble(p, 30, 61, "<b>遮挡！</b>用枕头护住头和脖子。", true);
        speak("遮挡！护住头和脖子。");
        spawnHand();
      } else {
        el.classList.add("snap-anim");
        el.style.left = "6%"; el.style.top = "84%";
        sfx.boing(); toast("把枕头拖到中间一格的小男孩头上哦");
      }
    });
    const hint = document.createElement("div");
    hint.className = "sticker"; hint.textContent = "👆 拖我";
    hint.style.cssText = "left:22%;top:86%;";
    ovl.appendChild(hint); setTimeout(()=>hint.remove(), 3000);
  }
  function spawnHand(){
    const d = makeDrag(p, '<div class="hand">✋</div>', 80, 84, (el, x, y)=>{
      if(x>56 && x<76 && y>63 && y<80){
        el.classList.add("snap-anim");
        el.style.left = "62%"; el.style.top = "68%";
        el.style.pointerEvents = "none";
        sfx.ding(); vib([25,30,25]); task(3,"grab");
        const sh = document.createElement("div");
        sh.className = "shield";
        sh.style.cssText = "left:22%;top:62%;width:60%;height:20%;";
        ovl.appendChild(sh);
        mission.innerHTML = "🎉 十二字口诀学会啦！";
        bubble(p, 16, 40, "<b>手抓牢！</b>紧紧抓住桌腿，避险成功！🛡️");
        speak("手抓牢！避险成功！你真棒！");
        sfx.chime();
      } else {
        el.classList.add("snap-anim");
        el.style.left = "80%"; el.style.top = "84%";
        sfx.boing(); toast("把小手拖到最下面一格的桌腿上哦");
      }
    });
    const hint = document.createElement("div");
    hint.className = "sticker"; hint.textContent = "👆 拖我抓桌腿";
    hint.style.cssText = "left:48%;top:86%;";
    ovl.appendChild(hint); setTimeout(()=>hint.remove(), 3000);
  }
  // 红色警示条
  addZone(p, 3, { id:"warn", l:6, t:88.5, w:88, h:8.5, onTap(){
    if(task(3,"warn")){
      sfx.wrong(); vib([40,40,40]); pageShake(p, false);
      const f = document.createElement("div");
      f.className = "fall-emo"; f.textContent = "💡";
      f.style.cssText = "left:60%;top:4%;";
      ovl.appendChild(f); setTimeout(()=>f.remove(), 1400);
      bubble(p, 10, 66, "⚠️ <b>千万不要</b>躲在窗户边、吊灯下和没有固定的高大家具旁边！", true);
      speak("千万不要躲在窗户边、吊灯下和没有固定的高大家具旁边！");
    }
  }});
  // 彩蛋：床边提示条
  const tip = document.createElement("div");
  tip.className = "zone"; tip.style.cssText = "left:12%;top:82.5%;width:76%;height:5.5%;";
  tip.addEventListener("pointerup", e=>{
    e.stopPropagation(); sfx.pop();
    bubble(p, 12, 62, "在床上时：用枕头护住头，滚下床，<b>趴在床边</b>最安全。", true);
  });
  ovl.appendChild(tip);
}

/* ---------- 第4页 假如被困住了怎么办（敲击求救） ---------- */
function buildP4(p){
  const ovl = p.querySelector(".ovl");
  addTag(p, "第 4 页 · 被困自救");
  addNarrate(p, "地震被困不要慌，保持体力，捂住口鼻，敲击管道发出求救信号，等待救援。");
  const mission = document.createElement("div");
  mission.className = "mission disp";
  mission.innerHTML = '🔨 救援叔叔在外面，快敲管道！ <span class="cnt">0 / 4</span>';
  p._mission = mission;
  let knocks = 0, rescued = false;
  const doRescue = ()=>{
    if(rescued) return; rescued = true;
    const beam = document.createElement("div");
    beam.className = "beam"; ovl.appendChild(beam);
    sfx.rescue(); vib([40,60,40,60,40]);
    task(4,"pipe");
    mission.innerHTML = "🎉 救援叔叔听到你啦！";
    setTimeout(()=>{
      bubble(p, 18, 46, "🔦 <b>「听到了！这里有人！」</b><br>救援叔叔正朝你走来！");
      speak("听到了！这里有人！坚持住，我们来了！");
    }, 700);
  };
  addZone(p, 4, { id:"pipe", l:36, t:11, w:62, h:20, onTap(z, e){
    sfx.knock(); vib(35);
    const r = p.getBoundingClientRect();
    const k = document.createElement("div");
    k.className = "knock-fx";
    const x = (e.clientX-r.left)/r.width*100, y = (e.clientY-r.top)/r.height*100;
    k.style.cssText = `left:calc(${x}% - 14px);top:calc(${y}% - 14px);width:28px;height:28px;`;
    ovl.appendChild(k); setTimeout(()=>k.remove(), 600);
    if(rescued){ bubble(p, 18, 46, "救援叔叔已经在路上了，<b>保持体力</b>等他们来！"); return; }
    knocks = Math.min(knocks+1, 4);
    mission.querySelector(".cnt").textContent = `${knocks} / 4`;
    if(knocks>=4) doRescue();
    else if(knocks===2) toast("继续敲！「当、当、当」");
  }});
  addZone(p, 4, { id:"phone", l:46, t:60, w:16, h:12, onTap(){
    sfx.pop();
    if(task(4,"phone")) bubble(p, 14, 44, "📱 被困时要<b>节约手机电量</b>，留着电求救，不能玩手机哦。");
  }});
  addZone(p, 4, { id:"cloth", l:26, t:78, w:22, h:11, onTap(){
    sfx.pop();
    if(task(4,"cloth")) bubble(p, 22, 56, "😷 用衣物<b>捂住口鼻</b>，防止灰尘呛到，保护呼吸。", true);
  }});
}

/* ---------- 第5页 震后撤离（分支选择 + 护头小游戏） ---------- */
function buildP5(p){
  const ovl = p.querySelector(".ovl");
  addTag(p, "第 5 页 · 撤离闯关");
  addNarrate(p, "地震晃动停止后，立刻走楼梯撤离到空旷地带！地震后绝对不能乘坐电梯！");
  const mission = document.createElement("div");
  mission.className = "mission disp";
  mission.innerHTML = "🚦 晃动停了！快选择正确的逃生路线";
  p._mission = mission;

  const stair = document.createElement("div");
  stair.className = "choice"; stair.style.cssText = "left:8%;top:47%;width:36%;height:26%;";
  stair.innerHTML = '<div class="pill safe disp">🪜 走楼梯</div>';
  const lift = document.createElement("div");
  lift.className = "choice"; lift.style.cssText = "left:62%;top:38%;width:32%;height:34%;";
  lift.innerHTML = '<div class="pill bad disp">🛗 坐电梯</div>';
  ovl.appendChild(stair); ovl.appendChild(lift);

  lift.addEventListener("pointerup", e=>{
    e.stopPropagation();
    sfx.wrong(); vib([50,50,50]); pageShake(p, true);
    const f = document.createElement("div"); f.className = "flash-red";
    ovl.appendChild(f); setTimeout(()=>f.remove(), 650);
    bubble(p, 22, 14, "⚠️ <b>地震后容易停电被困在电梯里</b>，坐电梯非常危险！换一条路吧！");
    speak("地震后容易停电困梯，坐电梯非常危险！");
  });
  stair.addEventListener("pointerup", e=>{
    e.stopPropagation();
    sfx.pop(); vib(25);
    stair.remove(); lift.remove();
    mission.innerHTML = "🏃 护住头，有序下楼！";
    let i = 0;
    const stepT = setInterval(()=>{ sfx.step(i++); if(i>5){ clearInterval(stepT); startGame(); } }, 260);
    pageShake(p, false);
    bubble(p, 16, 12, "排队下楼，<b>用书包护住头</b>，不推不挤！");
  });

  function startGame(){
    const g = document.createElement("div");
    g.className = "game";
    g.innerHTML = '<div class="gh disp">🧱 滑动安全帽，挡住掉落物！<br>接住 <b>6</b> 个就成功撤离 ｜ 已接住 <b class="sc">0</b> 个</div>';
    ovl.appendChild(g);
    const pad = document.createElement("div");
    pad.className = "paddle"; pad.textContent = "⛑️";
    pad.style.bottom = "6%"; pad.style.left = "42%";
    g.appendChild(pad);
    let padX = 42, caught = 0, missed = 0, running = true;
    const movePad = e=>{
      const r = g.getBoundingClientRect();
      const x = ((e.clientX-r.left)/r.width)*100;
      padX = Math.min(Math.max(x, 6), 86);
      pad.style.left = padX+"%";
    };
    g.addEventListener("pointermove", movePad);
    g.addEventListener("pointerdown", movePad);
    const EMO = ["🧱","📚","🔩","🪨","💡"];
    const objs = [];
    const spawn = ()=>{
      if(!running) return;
      const o = document.createElement("div");
      o.className = "obj"; o.textContent = EMO[Math.floor(Math.random()*EMO.length)];
      const x = 6+Math.random()*80;
      o.style.left = x+"%"; o.style.top = "-8%";
      g.appendChild(o);
      objs.push({el:o, x, y:-8, vy:0.55+Math.random()*0.5+caught*0.04});
      setTimeout(spawn, Math.max(520, 950-caught*60));
    };
    spawn();
    let last = performance.now();
    const loop = now=>{
      if(!running) return;
      const dt = Math.min((now-last)/16.7, 3); last = now;
      for(let i=objs.length-1;i>=0;i--){
        const o = objs[i]; o.y += o.vy*dt;
        o.el.style.top = o.y+"%";
        if(o.y > 82 && o.y < 92 && Math.abs(o.x - padX) < 11){
          o.el.remove(); objs.splice(i,1);
          caught++; sfx.pop(); vib(20);
          g.querySelector(".sc").textContent = caught;
          if(caught>=6){ running = false; winGame(); return; }
        } else if(o.y > 102){
          o.el.remove(); objs.splice(i,1);
          missed++;
          if(missed>=3){ running = false; loseGame(); return; }
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    function loseGame(){
      g.querySelectorAll(".obj").forEach(o=>o.remove());
      const r = document.createElement("div");
      r.className = "retry";
      r.innerHTML = '<div><div style="font-size:34px">😮</div><p style="margin-top:6px;font-size:15px">有东西掉下来了，没关系！<br>记得<b>护住头、靠边走</b>，再试一次吧！</p><button id="retryBtn">再来一次 💪</button></div>';
      g.appendChild(r);
      r.querySelector("#retryBtn").addEventListener("pointerup", ev=>{
        ev.stopPropagation(); sfx.pop(); g.remove(); startGame();
      });
    }
    function winGame(){
      g.remove();
      const s = document.createElement("div");
      s.className = "sunset";
      s.innerHTML = '<div class="win-badge"><div class="big">🏅🌇</div><h3 class="disp">你真棒！成功逃生！</h3><p>走楼梯 · 护头部 · 到空旷地带</p></div>';
      ovl.appendChild(s);
      sfx.rescue(); vib([40,60,40,60,80]);
      task(5,"escape");
      mission.innerHTML = "🏅 闯关成功！你学会安全撤离啦！";
      speak("你真棒！成功逃生！记住：走楼梯，护头部，到空旷地带。");
      setTimeout(()=>{ s.style.transition="opacity .6s"; s.style.opacity="0"; setTimeout(()=>s.remove(), 650); }, 4200);
    }
  }
}

/* ---------- 尾页 亲子打卡 + 荣誉证书 ---------- */
function buildP6(p){
  const ovl = p.querySelector(".ovl");
  p._tag = "尾页 · 亲子打卡";
  const m6 = document.createElement("div");
  m6.className = "mission disp";
  m6.innerHTML = "🏠 和爸爸妈妈完成打卡，领取荣誉证书";
  p._mission = m6;
  const wrap = document.createElement("div");
  wrap.className = "end-scroll";
  wrap.innerHTML = `
    <h2 class="disp">🏠 家庭安全打卡</h2>
    <p class="sub">和爸爸妈妈一起完成线下小任务，把绘本本领用起来！</p>
    <div class="ck-item"><div class="ck-box">✓</div><div class="t">🛋️ 找一找家里的<b>安全三角区</b>（结实桌子旁、承重墙角）</div></div>
    <div class="ck-item"><div class="ck-box">✓</div><div class="t">🔩 检查吊灯、书架、相框<b>是否固定牢固</b></div></div>
    <div class="ck-item"><div class="ck-box">✓</div><div class="t">🗺️ 和家人画一张<b>家庭逃生路线图</b>并演练一次</div></div>
    <div class="ck-item"><div class="ck-box">✓</div><div class="t">🎒 准备<b>家庭应急包</b>：水、食物、手电、口哨、药品</div></div>
    <div class="cert-zone" id="certZone"></div>`;
  ovl.appendChild(wrap);
  let ckCount = 0;
  wrap.querySelectorAll(".ck-item").forEach(it=>{
    it.addEventListener("pointerup", ()=>{
      it.classList.toggle("on");
      if(it.classList.contains("on")){ sfx.ding(); vib(20); ckCount++; } else { ckCount--; }
      if(ckCount===4){ toast("👨‍👩‍👧 家庭打卡完成！你们是安全一家人！"); sfx.chime(); ckCount=5; }
    });
  });
  const renderCert = ()=>{
    const cz = wrap.querySelector("#certZone");
    if(flowers.every(Boolean)){
      cz.innerHTML = `
        <h2 class="disp" style="margin-top:26px">🏆 防震小卫士荣誉证书</h2>
        <p class="sub">写下你的名字，领取属于你的荣誉吧！</p>
        <div class="cert-form"><input id="certName" maxlength="10" placeholder="写下你的名字"></div>
        <button class="big-btn" id="certBtn">✨ 生成荣誉证书</button>
        <div id="certView"><img id="certImg" alt="荣誉证书"><br><a id="certDl" download="防震小卫士荣誉证书.png">⬇️ 保存证书图片</a></div>`;
      cz.querySelector("#certBtn").addEventListener("pointerup", ()=>{
        const name = cz.querySelector("#certName").value.trim() || "防震小卫士";
        drawCert(name);
        cz.querySelector("#certView").style.display = "block";
        confetti(); sfx.rescue();
        speak(`恭喜${name}，荣获防震小卫士称号！`);
      });
    } else {
      const n = flowers.filter(Boolean).length;
      cz.innerHTML = `<div class="cert-lock">🔒 荣誉证书还差一点点！<br>回到前面的页面完成所有互动，集齐 6 朵小红花就能解锁哦（当前 ${n} / 6）</div>`;
    }
  };
  renderCert();
  p._renderCert = renderCert;

  function drawCert(name){
    const cv = document.createElement("canvas");
    cv.width = 960; cv.height = 680;
    const x = cv.getContext("2d");
    x.fillStyle = "#FFFBF0"; x.fillRect(0,0,960,680);
    const grd = x.createLinearGradient(0,0,960,680);
    grd.addColorStop(0,"#FFF3DC"); grd.addColorStop(1,"#FFE3C8");
    x.fillStyle = grd; x.fillRect(14,14,932,652);
    x.strokeStyle = "#F28482"; x.lineWidth = 10; x.strokeRect(26,26,908,628);
    x.strokeStyle = "#FFCE80"; x.lineWidth = 3; x.strokeRect(46,46,868,588);
    x.textAlign = "center";
    x.fillStyle = "#563E79"; x.font = "54px 'ZCOOL KuaiLe','Microsoft YaHei',sans-serif";
    x.fillText("荣 誉 证 书", 480, 140);
    x.font = "30px 'ZCOOL KuaiLe','Microsoft YaHei',sans-serif"; x.fillStyle = "#D94F1E";
    x.fillText("— 防震小卫士 —", 480, 190);
    x.font = "bold 58px 'Microsoft YaHei',sans-serif"; x.fillStyle = "#5a4232";
    x.fillText(name, 480, 320);
    x.font = "26px 'Microsoft YaHei',sans-serif"; x.fillStyle = "#7a6250";
    x.fillText("已学会地震避险与自救互救本领", 480, 385);
    x.fillText("特发此证，以资鼓励！", 480, 425);
    x.font = "44px serif";
    for(let i=0;i<6;i++) x.fillText("🌸", 300+i*72, 500);
    x.font = "22px 'Microsoft YaHei',sans-serif"; x.fillStyle = "#a08a76";
    x.fillText(new Date().toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric"}), 480, 580);
    const url = cv.toDataURL("image/png");
    $("#certImg").src = url;
    $("#certDl").href = url;
  }
}

/* ============ 组装与导航 ============ */
const builders = [buildP0, buildP1, buildP2, buildP3, buildP4, buildP5, buildP6];
const imgs = ["p0.jpg","p1.jpg","p2.jpg","p3.jpg","p4.jpg","p5.jpg",null];
const pages = [];
let cur = 0;

builders.forEach((b, i)=>{
  const pg = makePage(i, imgs[i] || "p0.jpg");
  if(!imgs[i]) pg.querySelector("img").remove();
  stage.appendChild(pg);
  b(pg);
  pages.push(pg);
});

const dotsBox = $("#dots");
pages.forEach((_, i)=>{
  const d = document.createElement("span");
  d.className = "dot"; d.addEventListener("click", ()=>go(i, i>cur?1:-1));
  dotsBox.appendChild(d);
});

function go(n, dir){
  if(n < 0 || n >= pages.length || n === cur) return;
  try{ speechSynthesis.cancel(); }catch(e){}
  const old = pages[cur];
  old.classList.add(dir>0 ? "exit-l" : "exit-r");
  setTimeout(()=>{ old.classList.remove("active","exit-l","exit-r"); }, 380);
  cur = n;
  const pg = pages[cur];
  pg.classList.add("active");
  mountChrome(pg);
  if(pg._renderCert) pg._renderCert();
  updateNav();
  window.scrollTo({top:0, behavior:"smooth"});
}
function updateNav(){
  $("#prevBtn").disabled = cur === 0;
  $("#nextBtn").disabled = cur === pages.length-1;
  $("#nextBtn").innerHTML = cur === pages.length-1 ? "🎉 读完啦" : "下一页 ›";
  document.querySelectorAll(".dot").forEach((d,i)=>d.classList.toggle("on", i===cur));
}
$("#prevBtn").addEventListener("click", ()=>{ sfx.pop(); go(cur-1,-1); });
$("#nextBtn").addEventListener("click", ()=>{ sfx.pop(); go(cur+1, 1); });
document.addEventListener("keydown", e=>{
  if(e.key === "ArrowLeft") go(cur-1,-1);
  if(e.key === "ArrowRight") go(cur+1, 1);
});
/* 滑动翻页 */
let swX = null, swY = null;
stage.addEventListener("pointerdown", e=>{ swX = e.clientX; swY = e.clientY; }, {passive:true});
stage.addEventListener("pointerup", e=>{
  if(swX === null) return;
  const dx = e.clientX - swX, dy = e.clientY - swY;
  swX = null;
  if(Math.abs(dx) > 70 && Math.abs(dy) < 50){
    if(dx < 0) go(cur+1, 1); else go(cur-1, -1);
  }
}, {passive:true});

/* 初始化 */
renderTray(false);
pages[0].classList.add("active");
mountChrome(pages[0]);
updateNav();
setTimeout(()=>toast("👋 欢迎来到绘本！点击发光圆圈、跟着提示一起玩吧"), 800);
