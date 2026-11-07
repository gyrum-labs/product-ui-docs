/* Arcade mockup pack — six treatments of one live dataset.
   The server holds the credentials; this page only ever sees /api/state. */
(function(){
'use strict';

var STAGES=[
  {key:'waiting',                label:'Waiting for processing', short:'Waiting',   color:'#6f8fd0'},
  {key:'waiting fixed',          label:'Waiting fixed',           short:'Fixed',     color:'#e0543f'},
  {key:'in testing',             label:'In testing',              short:'Testing',   color:'#f0a832'},
  {key:'passed',                 label:'Passed',                  short:'Passed',    color:'#8fce4f'},
  {key:'waiting for deployment', label:'Waiting for deployment',  short:'Deploying', color:'#5ad1d8'},
  {key:'deployed',               label:'Deployed',                short:'Deployed',  color:'#d9558b'},
  {key:'done',                   label:'Done',                    short:'Done',      color:'#9aa6bd'}
];
var BOARD='#161e2c', PANEL='#1e2839', PANEL2='#263349', CREAM='#f2e9d8';

var state=null, prIndex={}, lastPrIndex={}, screens={};

/* ── helpers ─────────────────────────────────────────────── */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function rrect(g,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  g.beginPath();
  if(g.roundRect){ g.roundRect(x,y,w,h,r); return; }
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}
function shadow(g,blur,color,dx,dy){
  g.shadowColor=color; g.shadowBlur=blur; g.shadowOffsetX=dx||0; g.shadowOffsetY=dy||0;
}
function noshadow(g){ g.shadowBlur=0; g.shadowOffsetX=0; g.shadowOffsetY=0; g.shadowColor='transparent'; }
function lcg(seed){ var s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function nowMs(){ return performance.now(); }
function ago(iso){
  if(!iso) return '—';
  var s=(Date.now()-new Date(iso))/1000;
  if(s<60) return Math.round(s)+'s ago';
  if(s<3600) return Math.round(s/60)+'m ago';
  if(s<86400) return Math.round(s/3600)+'h ago';
  return Math.round(s/86400)+'d ago';
}
function stageCounts(){
  var out=[];
  for(var i=0;i<STAGES.length;i++){
    out.push(((state&&state.phases&&state.phases[STAGES[i].key])||[]).length);
  }
  return out;
}
function buildIndex(){
  var idx={};
  for(var i=0;i<STAGES.length;i++){
    var list=(state&&state.phases&&state.phases[STAGES[i].key])||[];
    for(var j=0;j<list.length;j++) idx[list[j].pr]=i;
  }
  prIndex=idx;
}
function rowsOf(stageIdx){
  var list=(state&&state.phases&&state.phases[STAGES[stageIdx].key])||[];
  return list;
}
/* a board background: a lit panel with a soft vignette */
function boardBg(g,w,h,tint){
  var grd=g.createLinearGradient(0,0,0,h);
  grd.addColorStop(0, tint||PANEL2); grd.addColorStop(1,BOARD);
  g.fillStyle=grd; g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(255,255,255,.035)'; g.lineWidth=1;
  for(var y=0;y<h;y+=28){ g.beginPath(); g.moveTo(0,y+.5); g.lineTo(w,y+.5); g.stroke(); }
  var vg=g.createRadialGradient(w/2,h/2,Math.min(w,h)*0.25,w/2,h/2,Math.max(w,h)*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.45)');
  g.fillStyle=vg; g.fillRect(0,0,w,h);
}
function label(g,text,x,y,size,color,align,weight){
  g.font=(weight||'600')+' '+(size||12)+'px Inter,system-ui,sans-serif';
  g.textAlign=align||'left'; g.textBaseline='middle';
  g.fillStyle=color||CREAM; g.fillText(text,x,y);
}
function plate(g,text,x,y,size,color){
  g.font='600 '+(size||12)+'px Inter,system-ui,sans-serif';
  var w=g.measureText(text).width+16, h=(size||12)+11;
  rrect(g,x-w/2,y-h/2,w,h,5); g.fillStyle='rgba(10,16,26,.72)'; g.fill();
  g.strokeStyle='rgba(255,255,255,.10)'; g.lineWidth=1; g.stroke();
  label(g,text,x,y,(size||12),color||CREAM,'center');
}
function marble(g,x,y,r,color,alpha){
  g.globalAlpha=alpha==null?1:alpha;
  g.beginPath(); g.ellipse(x,y+r*0.9,r*0.95,r*0.35,0,0,Math.PI*2);
  g.fillStyle='rgba(0,0,0,.35)'; g.fill();
  var grd=g.createRadialGradient(x-r*0.35,y-r*0.4,r*0.1,x,y,r);
  grd.addColorStop(0,'rgba(255,255,255,.95)');
  grd.addColorStop(0.28,color);
  grd.addColorStop(1,shade(color,-0.45));
  g.beginPath(); g.arc(x,y,r,0,Math.PI*2);
  g.fillStyle=grd; g.fill();
  g.globalAlpha=1;
}
function shade(hex,amt){
  var m=hex.replace('#','');
  if(m.length===3) m=m[0]+m[0]+m[1]+m[1]+m[2]+m[2];
  var n=parseInt(m,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function f(v){ v=Math.round(v+(amt<0?v*amt:255*amt)); return Math.max(0,Math.min(255,v)); }
  return 'rgb('+f(r)+','+f(g)+','+f(b)+')';
}

/* ════════════════════════════════════════════════════════════
   01 — THE MARBLE RUN
   ════════════════════════════════════════════════════════════ */
var MR={tok:{},bowls:[],segs:[],drum:null,gates:{},scroll:0};
function mrBuild(){
  MR.bowls=[]; MR.segs=[];
  for(var i=0;i<STAGES.length;i++){
    MR.bowls.push({i:i, x:150+i*150, y:128+i*82, r:46});
  }
  for(var k=0;k<MR.bowls.length-1;k++){
    var a=MR.bowls[k], b=MR.bowls[k+1];
    var p1={x:a.x+a.r-6,y:a.y+12}, p2={x:b.x-b.r+8,y:b.y-4};
    var mx=(p1.x+p2.x)/2, my=(p1.y+p2.y)/2+16;
    MR.segs.push([p1,{x:mx-34,y:my},{x:mx,y:my+6},{x:mx+34,y:my},p2]);
  }
  var seg=MR.segs[1];                       /* the segment into "in testing" */
  MR.drum={x:seg[2].x,y:seg[2].y-4,r:32,a:0};
  MR.drum.exit=Math.PI*0.30;
}
function mrRest(i,k,n){
  var b=MR.bowls[i], per=6, row=Math.floor(k/per), col=k%per;
  var cols=n<=per?n:per;
  var x=b.x-(cols-1)*8.4+col*16.8+(k%2?1.2:-1.2);
  var y=b.y-6-row*15.5;
  var jitter=(k*37)%7-3;
  return {x:x+jitter*0.6,y:y};
}
function mrSync(){
  buildIndex();
  var counts=stageCounts();
  var seen={};
  for(var pr in prIndex){
    seen[pr]=true;
    var st=prIndex[pr];
    var m=MR.tok[pr];
    if(!m){
      var r=mrRest(st,0,1);
      MR.tok[pr]={pr:pr,stage:st,mode:'rest',x:r.x,y:r.y,path:null,pi:0,spinT:0};
      continue;
    }
    if(m.stage!==st && m.mode==='rest'){
      if(st>m.stage){
        var path=[];
        for(var s=m.stage;s<st;s++) path=path.concat(MR.segs[s]);
        m.path=path; m.pi=0; m.mode='roll'; m.to=st;
        MR.gates[m.stage]=nowMs();
      } else {
        m.mode='lift'; m.to=st; m.liftT=0;
      }
    }
  }
  for(var pr2 in MR.tok) if(!seen[pr2]) MR.tok[pr2].gone=nowMs();
}
function mrStep(dt){
  for(var pr in MR.tok){
    var m=MR.tok[pr];
    if(m.gone){ if(nowMs()-m.gone>400) delete MR.tok[pr]; continue; }
    if(m.mode==='roll'&&m.path){
      var tgt=m.path[m.pi];
      if(!tgt){ m.mode='rest'; m.stage=m.to; m.to=null; m.placed=false; continue; }
      var dx=tgt.x-m.x, dy=tgt.y-m.y, d=Math.hypot(dx,dy);
      var sp=132*dt;
      if(d<=sp){ m.x=tgt.x; m.y=tgt.y; m.pi++; }
      else { m.x+=dx/d*sp; m.y+=dy/d*sp; m.roll=(m.roll||0)+sp; }
      /* the drum catches the marble and carries it round */
      if(MR.drum&&m.pi>=2&&m.pi<=3){
        var dd=Math.hypot(m.x-MR.drum.x,m.y-MR.drum.y);
        if(dd<MR.drum.r+12){
          m.mode='spin';
          m.ang=Math.atan2(m.y-MR.drum.y,m.x-MR.drum.x);
          m.spinT=0;
        }
      }
    } else if(m.mode==='spin'){
      m.spinT+=dt;
      m.ang+=2.9*dt;
      m.x=MR.drum.x+Math.cos(m.ang)*MR.drum.r;
      m.y=MR.drum.y+Math.sin(m.ang)*MR.drum.r;
      var rel=Math.atan2(Math.sin(m.ang-MR.drum.exit),Math.cos(m.ang-MR.drum.exit));
      if(rel>0&&m.spinT>0.55){ m.mode='roll'; }
    } else if(m.mode==='lift'){
      m.liftT=(m.liftT||0)+dt;
      var b0=MR.bowls[0], target=MR.bowls[m.to];
      var k=Math.min(1,m.liftT/1.5);
      var e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      if(k<0.55){ m.x=46; m.y=m.y0+(b0.y-46)*e; }
      else { m.x=46+(target.x-46)*((k-0.55)/0.45); m.y=target.y-14; }
      if(k>=1){ m.mode='rest'; m.stage=m.to; }
    }
  }
}
function mrSettle(){
  var counts=stageCounts();
  var per={};
  for(var pr in MR.tok){
    var m=MR.tok[pr];
    if(m.mode!=='rest') continue;
    per[m.stage]=(per[m.stage]||0)+1;
    var idx=per[m.stage]-1;
    var shown=idx<18;
    m.hidden=!shown;
    var r=mrRest(m.stage,idx,counts[m.stage]);
    m.restX=r.x; m.restY=r.y;
    if(m.mode==='rest'){ m.x=r.x; m.y=r.y; }
  }
}
function mrDraw(g,w,h){
  mrSettle();
  boardBg(g,w,h,'#1b2434');
  /* the wall's mounting rails */
  g.strokeStyle='rgba(255,255,255,.05)'; g.lineWidth=2;
  for(var x=40;x<w;x+=90){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke(); }
  /* the track */
  for(var s=0;s<MR.segs.length;s++){
    var pts=MR.segs[s];
    g.lineCap='round'; g.lineJoin='round';
    g.strokeStyle='rgba(0,0,0,.4)'; g.lineWidth=16;
    g.beginPath(); g.moveTo(pts[0].x,pts[0].y+3);
    for(var i=1;i<pts.length;i++) g.lineTo(pts[i].x,pts[i].y+3);
    g.stroke();
    g.strokeStyle='#5d6a80'; g.lineWidth=14;
    g.beginPath(); g.moveTo(pts[0].x,pts[0].y);
    for(var j=1;j<pts.length;j++) g.lineTo(pts[j].x,pts[j].y);
    g.stroke();
    g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=2;
    g.beginPath(); g.moveTo(pts[0].x,pts[0].y-5);
    for(var k=1;k<pts.length;k++) g.lineTo(pts[k].x,pts[k].y-5);
    g.stroke();
  }
  /* the return lift shaft */
  g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=2; g.setLineDash([6,7]);
  g.beginPath(); g.moveTo(46,MR.bowls[0].y); g.lineTo(46,MR.bowls[MR.bowls.length-1].y+30); g.stroke();
  g.setLineDash([]);
  /* the bowls */
  var counts=stageCounts();
  for(var b=0;b<MR.bowls.length;b++){
    var bo=MR.bowls[b];
    g.beginPath(); g.arc(bo.x,bo.y,bo.r,0,Math.PI,false);
    g.closePath();
    var grd=g.createLinearGradient(bo.x,bo.y-bo.r,bo.x,bo.y);
    grd.addColorStop(0,'rgba(255,255,255,.06)'); grd.addColorStop(1,'rgba(0,0,0,.35)');
    g.fillStyle=grd; g.fill();
    g.strokeStyle=shade(STAGES[b].color,-0.1); g.lineWidth=3; g.stroke();
    /* the gate flap at the outlet */
    var open=MR.gates[b]&&(nowMs()-MR.gates[b])<900;
    var ga=open? -0.9 : 0.05;
    g.save(); g.translate(bo.x+bo.r-4,bo.y+4); g.rotate(ga);
    g.fillStyle=open?shade(STAGES[b].color,0.05):'#8a95a8';
    rrect(g,0,-3,26,6,3); g.fill();
    g.restore();
  }
  /* the bucket at the top */
  var bk=MR.bowls[0];
  g.beginPath();
  g.moveTo(bk.x-78,bk.y-bo.r-18); g.lineTo(bk.x+78,bk.y-bo.r-18);
  g.lineTo(bk.x+40,bk.y-bo.r+10); g.lineTo(bk.x-40,bk.y-bo.r+10); g.closePath();
  g.fillStyle='rgba(255,255,255,.05)'; g.fill();
  g.strokeStyle='#7b879c'; g.lineWidth=3; g.stroke();
  label(g,'THE BUCKET',bk.x,bk.y-bo.r-30,11,'#9aa6bd','center',700);
  /* the drum */
  if(MR.drum){
    var d=MR.drum;
    g.save(); g.translate(d.x,d.y); g.rotate(d.a);
    g.beginPath(); g.arc(0,0,d.r,0,Math.PI*2);
    g.fillStyle='rgba(20,28,42,.9)'; g.fill();
    g.strokeStyle='#8a95a8'; g.lineWidth=3; g.stroke();
    for(var p=0;p<4;p++){
      g.rotate(Math.PI/2);
      g.strokeStyle='rgba(242,233,216,.5)'; g.lineWidth=5;
      g.beginPath(); g.moveTo(d.r-4,0); g.lineTo(d.r+8,0); g.stroke();
    }
    g.restore();
    g.beginPath(); g.arc(d.x,d.y,6,0,Math.PI*2);
    g.fillStyle='#f0a832'; g.fill();
  }
  /* the marbles */
  for(var pr3 in MR.tok){
    var m=MR.tok[pr3];
    if(m.gone){ continue; }
    if(m.hidden) continue;
    var col=STAGES[m.mode==='rest'?m.stage:(m.to==null?m.stage:m.to)].color;
    marble(g,m.x,m.y,8,col,m.gone?Math.max(0,1-(nowMs()-m.gone)/400):1);
  }
  /* the signs go on last, so a full bowl never hides its own count */
  for(var b2=0;b2<MR.bowls.length;b2++){
    var bo2=MR.bowls[b2];
    plate(g,STAGES[b2].short+'  '+counts[b2],bo2.x,bo2.y-bo2.r-16,12,STAGES[b2].color);
  }
  if(MR.drum){MR.drum.a+=1.5*0.016;}
}

/* ════════════════════════════════════════════════════════════
   02 — THE HEAP
   ════════════════════════════════════════════════════════════ */
var HP={tok:{},belts:[],heap:[],scroll:0};
function hpBuild(){
  HP.belts=[];
  var counts=stageCounts();
  for(var i=0;i<STAGES.length-1;i++){
    var len=Math.max(120,Math.min(430,70+counts[i]*4.2));
    HP.belts.push({i:i,y:104+i*86,x0:78,len:len});
  }
}
function hpSync(){
  buildIndex();
  var seen={};
  for(var pr in prIndex){
    seen[pr]=true;
    var st=prIndex[pr];
    var c=HP.tok[pr];
    if(!c){
      HP.tok[pr]={pr:pr,stage:st,off:Math.random()*200,mode:'ride',x:0,y:0};
      continue;
    }
    if(c.stage!==st&&c.mode==='ride'){
      c.mode='hop'; c.from=c.stage; c.to=st; c.hopT=0; c.fromX=c.x; c.fromY=c.y;
    }
  }
  for(var pr2 in HP.tok) if(!seen[pr2]) HP.tok[pr2].gone=nowMs();
}
function hpStep(dt){
  HP.scroll=(HP.scroll+34*dt)%1000;
  for(var pr in HP.tok){
    var c=HP.tok[pr];
    if(c.gone){ if(nowMs()-c.gone>500) delete HP.tok[pr]; continue; }
    if(c.mode==='ride'){
      var b=HP.belts[Math.min(c.stage,HP.belts.length-1)];
      if(!b) continue;
      c.off+=26*dt;
      c.x=b.x0+((c.off+b.len)%b.len);
      c.y=b.y;
    } else if(c.mode==='hop'){
      c.hopT+=dt;
      var k=Math.min(1,c.hopT/0.85);
      var e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      var tb=HP.belts[Math.min(c.to,HP.belts.length-1)];
      if(!tb){ c.mode='ride'; continue; }
      var fx=c.fromX, fy=c.fromY;
      c.x=fx+(tb.x0+18-fx)*e;
      c.y=fy+(tb.y-fy)*e-Math.sin(k*Math.PI)*46;
      if(k>=1){ c.mode='ride'; c.stage=c.to; }
    }
  }
}
function hpDraw(g,w,h){
  boardBg(g,w,h,'#1a2231');
  /* the floor */
  g.strokeStyle='rgba(255,255,255,.04)'; g.lineWidth=1;
  for(var fy=0;fy<h;fy+=40){ g.beginPath(); g.moveTo(0,fy+.5); g.lineTo(w,fy+.5); g.stroke(); }
  var counts=stageCounts();
  /* the belts */
  for(var i=0;i<HP.belts.length;i++){
    var b=HP.belts[i];
    /* the frame */
    g.fillStyle='#39445a'; rrect(g,b.x0-8,b.y-16,b.len+16,26,7); g.fill();
    g.fillStyle='#20293a'; rrect(g,b.x0-4,b.y-11,b.len+8,16,5); g.fill();
    /* the tread */
    g.strokeStyle='rgba(242,233,216,.13)'; g.lineWidth=2;
    for(var t=0;t<b.len;t+=14){
      var tx=b.x0+((t+HP.scroll)%b.len);
      g.beginPath(); g.moveTo(tx,b.y-9); g.lineTo(tx,b.y+9); g.stroke();
    }
    /* the stage sign and the count */
    plate(g,STAGES[i].short+'  '+counts[i],b.x0+b.len/2,b.y-34,12,STAGES[i].color);
    /* the transfer arm to the next belt */
    if(i<HP.belts.length-1){
      var nx=HP.belts[i+1];
      g.strokeStyle='rgba(242,233,216,.22)'; g.lineWidth=2; g.setLineDash([5,6]);
      g.beginPath(); g.moveTo(b.x0+b.len+6,b.y); g.lineTo(b.x0+b.len+6,nx.y);
      g.lineTo(nx.x0+6,nx.y); g.stroke(); g.setLineDash([]);
      g.beginPath();
      g.moveTo(nx.x0+2,nx.y-5); g.lineTo(nx.x0+11,nx.y); g.lineTo(nx.x0+2,nx.y+5);
      g.fillStyle='rgba(242,233,216,.35)'; g.fill();
    }
  }
  /* the crates */
  for(var pr in HP.tok){
    var c=HP.tok[pr];
    if(c.gone) continue;
    var st=STAGES[c.mode==='hop'?c.to:c.stage];
    var alpha=c.gone?Math.max(0,1-(nowMs()-c.gone)/500):1;
    g.globalAlpha=alpha;
    /* the crate */
    var bw=19,bh=15;
    g.fillStyle=shade(st.color,-0.55);
    rrect(g,c.x-bw/2,c.y-bh/2,bw,bh,2.5); g.fill();
    g.strokeStyle=st.color; g.lineWidth=1.6; g.stroke();
    g.fillStyle=st.color;
    g.fillRect(c.x-bw/2,c.y-1.2,bw,2.4);
    g.globalAlpha=1;
  }
  /* the heap */
  var heapN=counts[STAGES.length-1];
  var hx=w-96, hy=h-52;
  g.fillStyle='rgba(0,0,0,.3)';
  g.beginPath(); g.ellipse(hx,hy+8,74,17,0,0,Math.PI*2); g.fill();
  var per=6;
  for(var k=0;k<heapN;k++){
    var row=Math.floor(k/per), col=k%per;
    var rows=Math.ceil(heapN/per);
    var bx=hx-58+col*19+((row%2)?9:0)+(k*13%5-2);
    var by=hy-6-row*15;
    var st2=STAGES[STAGES.length-1];
    g.fillStyle=shade(st2.color,-0.52);
    rrect(g,bx-9.5,by-7.5,19,15,2.5); g.fill();
    g.strokeStyle=shade(st2.color,-0.15); g.lineWidth=1.5; g.stroke();
    g.fillStyle=shade(st2.color,-0.05);
    g.fillRect(bx-9.5,by-1.2,19,2.4);
  }
  plate(g,'THE HEAP  '+heapN,hx,hy-14-counts[STAGES.length-1]*0-((Math.ceil(heapN/per))*15)-14,12,STAGES[STAGES.length-1].color);
  label(g,'done',hx,hy+26,11,'#9aa6bd','center');
}

/* ════════════════════════════════════════════════════════════
   03 — THE CITY
   ════════════════════════════════════════════════════════════ */
var CT={GRASS:0,ROAD:1,WALK:2,CROSS:3,LOT:4};
var CITY={T:22,TW:54,TH:31,OX:6,OY:9,
          av:[3,12,21,30,39,48], st:[2,10,18,26],
          tiles:null,blocks:[],blds:[],doors:{},ground:null,agents:{},cars:[],night:0};
function ctl(x,y){
  if(x<0||y<0||x>=CITY.TW||y>=CITY.TH) return CT.GRASS;
  return CITY.tiles[y*CITY.TW+x];
}
function cityBuild(){
  var W=CITY.TW,H=CITY.TH;
  CITY.tiles=new Uint8Array(W*H);
  CITY.av.forEach(function(ax){ for(var y=0;y<H;y++) CITY.tiles[y*W+ax]=CT.ROAD; });
  CITY.st.forEach(function(sy){ for(var x=0;x<W;x++) CITY.tiles[sy*W+x]=CT.ROAD; });
  for(var y=0;y<H;y++) for(var x=0;x<W;x++){
    if(CITY.tiles[y*W+x]!==CT.GRASS) continue;
    if(ctl(x-1,y)===CT.ROAD||ctl(x+1,y)===CT.ROAD||ctl(x,y-1)===CT.ROAD||ctl(x,y+1)===CT.ROAD)
      CITY.tiles[y*W+x]=CT.WALK;
  }
  CITY.av.forEach(function(ax){ CITY.st.forEach(function(sy){
    [[ax-1,sy],[ax+1,sy],[ax,sy-1],[ax,sy+1]].forEach(function(p){
      if(p[0]>=0&&p[1]>=0&&p[0]<W&&p[1]<H&&ctl(p[0],p[1])===CT.ROAD)
        CITY.tiles[p[1]*W+p[0]]=CT.CROSS;
    });
  });});
  CITY.blocks=[];
  for(var i=0;i<CITY.av.length-1;i++) for(var j=0;j<CITY.st.length-1;j++)
    CITY.blocks.push({i:i,j:j,x0:CITY.av[i]+1,y0:CITY.st[j]+1,x1:CITY.av[i+1]-1,y1:CITY.st[j+1]-1});
  /* the districts, the plant and the yard */
  var plan=[
    {stage:0, block:[0,1], kind:'block'},
    {stage:1, block:[1,0], kind:'block'},
    {stage:2, block:[2,2], kind:'block'},
    {stage:3, block:[3,1], kind:'block'},
    {stage:4, block:[4,2], kind:'block'},
    {stage:5, block:[4,0], kind:'block'},
    {stage:6, block:[2,0], kind:'block'},
    {stage:-1, block:[0,3], kind:'plant'},
    {stage:-2, block:[1,3], kind:'yard'}
  ];
  CITY.blds=[]; CITY.doors={};
  plan.forEach(function(p){
    var b=CITY.blocks[p.block[1]*5+p.block[0]];
    if(!b) return;
    var bw=b.x1-b.x0-1, bh=b.y1-b.y0-1;
    var bld={kind:p.kind, stage:p.stage, bx:b.x0+1, by:b.y0+1, bw:bw, bh:bh,
             door:{x:b.x0, y:b.y0+2}};
    CITY.blds.push(bld);
    if(p.stage>=0) CITY.doors[p.stage]=bld.door;
  });
  cityGround();
  /* the traffic */
  CITY.cars=[];
  var rnd=lcg(9182736);
  for(var c=0;c<26;c++){
    var rx=1+Math.floor(rnd()*(W-2)), ry=1+Math.floor(rnd()*(H-2));
    if(ctl(rx,ry)!==CT.ROAD) continue;
    CITY.cars.push({x:rx,y:ry,dx:1,dy:0,v:26+rnd()*22});
  }
}
function cityGround(){
  var T=CITY.T, W=CITY.TW, H=CITY.TH;
  var cv=document.createElement('canvas');
  cv.width=W*T; cv.height=H*T;
  var g=cv.getContext('2d');
  var rnd=lcg(5150);
  /* grass */
  g.fillStyle='#4e6b46'; g.fillRect(0,0,cv.width,cv.height);
  for(var p=0;p<1400;p++){
    var x=rnd()*cv.width, y=rnd()*cv.height, s=6+rnd()*26;
    g.fillStyle=rnd()<0.5?'rgba(90,120,78,.35)':'rgba(64,88,58,.35)';
    g.fillRect(x,y,s,s*0.6);
  }
  /* the blocks that are parks */
  CITY.blds.forEach(function(b){});
  /* sidewalks */
  for(var y=0;y<H;y++) for(var x=0;x<W;x++){
    if(ctl(x,y)!==CT.WALK) continue;
    g.fillStyle='#8d8f92'; g.fillRect(x*T,y*T,T,T);
  }
  /* asphalt */
  for(var y2=0;y2<H;y2++) for(var x2=0;x2<W;x2++){
    if(ctl(x2,y2)!==CT.ROAD) continue;
    g.fillStyle='#3f4348'; g.fillRect(x2*T,y2*T,T,T);
  }
  /* lane dashes */
  g.strokeStyle='rgba(240,233,216,.35)'; g.lineWidth=1.6; g.setLineDash([7,9]);
  CITY.av.forEach(function(ax){
    g.beginPath(); g.moveTo(ax*T+T/2,0); g.lineTo(ax*T+T/2,cv.height); g.stroke();
  });
  CITY.st.forEach(function(sy){
    g.beginPath(); g.moveTo(0,sy*T+T/2); g.lineTo(cv.width,sy*T+T/2); g.stroke();
  });
  g.setLineDash([]);
  /* crossings */
  g.fillStyle='rgba(240,233,216,.62)';
  CITY.av.forEach(function(ax){ CITY.st.forEach(function(sy){
    [[ax-1,sy],[ax+1,sy]].forEach(function(p){
      for(var k=0;k<4;k++) g.fillRect(p[0]*T+2+k*5, sy*T+3, 3, T-6);
    });
    [[ax,sy-1],[ax,sy+1]].forEach(function(p){
      for(var k=0;k<4;k++) g.fillRect(p[0]*T+3, p[1]*T+2+k*5, T-6, 3);
    });
  });});
  /* the yard's lot */
  CITY.blds.forEach(function(b){
    if(b.kind!=='yard') return;
    g.fillStyle='#4a4e54';
    g.fillRect(b.bx*T, b.by*T, b.bw*T, b.bh*T);
    g.strokeStyle='rgba(240,233,216,.45)'; g.lineWidth=1.4;
    for(var s=0;s<=b.bw;s++){
      g.beginPath(); g.moveTo((b.bx+s)*T, b.by*T); g.lineTo((b.bx+s)*T, (b.by+b.bh)*T); g.stroke();
    }
  });
  /* trees in the empty blocks */
  for(var by=0;by<H;by++) for(var bx=0;bx<W;bx++){
    if(ctl(bx,by)!==CT.GRASS) continue;
    var inBlock=false;
    CITY.blocks.forEach(function(b){
      if(bx>b.x0&&bx<b.x1&&by>b.y0&&by<b.y1) inBlock=true;
    });
    if(!inBlock) continue;
    if(rnd()<0.30){
      var tx=bx*T+T/2+(rnd()*8-4), ty=by*T+T/2+(rnd()*8-4);
      g.beginPath(); g.ellipse(tx+3,ty+4,8,5,0,0,Math.PI*2); g.fillStyle='rgba(0,0,0,.22)'; g.fill();
      g.beginPath(); g.arc(tx,ty,7.5,0,Math.PI*2); g.fillStyle='#3f6b3c'; g.fill();
      g.beginPath(); g.arc(tx-2,ty-2,4.5,0,Math.PI*2); g.fillStyle='#4f8349'; g.fill();
    }
  }
  CITY.ground=cv;
}
function cityWalkable(x,y){
  var t=ctl(x,y);
  return t===CT.WALK||t===CT.CROSS;
}
function cityPath(sx,sy,gx,gy){
  var W=CITY.TW,H=CITY.TH,N=W*H;
  if(sx<0||sy<0||sx>=W||sy>=H||gx<0||gy<0||gx>=W||gy>=H) return null;
  var start=sy*W+sx, goal=gy*W+gx;
  if(start===goal) return [{x:sx,y:sy}];
  var prev=new Int32Array(N); prev.fill(-1);
  var seen=new Uint8Array(N); seen[start]=1;
  var q=[start],head=0;
  while(head<q.length){
    var cur=q[head++], cx=cur%W, cy=(cur-(cur%W))/W;
    var nb=[[1,0],[-1,0],[0,1],[0,-1]];
    for(var d=0;d<4;d++){
      var nx=cx+nb[d][0], ny=cy+nb[d][1];
      if(nx<0||ny<0||nx>=W||ny>=H) continue;
      if(!cityWalkable(nx,ny)) continue;
      var ni=ny*W+nx;
      if(seen[ni]) continue;
      seen[ni]=1; prev[ni]=cur;
      if(ni===goal){
        var path=[], c=goal;
        while(c!==-1){ path.push({x:c%W,y:(c-(c%W))/W}); c=prev[c]; }
        path.reverse(); return path;
      }
      q.push(ni);
    }
  }
  return null;
}
function citySync(){
  buildIndex();
  var seen={};
  for(var pr in prIndex){
    seen[pr]=true;
    var st=prIndex[pr];
    var a=CITY.agents[pr];
    var door=CITY.doors[st]||{x:3,y:3};
    if(!a){
      CITY.agents[pr]={pr:pr,stage:st,tx:door.x,ty:door.y,x:door.x,y:door.y,
                       path:null,pi:0,wait:Math.random()*0.4};
      continue;
    }
    if(a.stage!==st&&!a.path){
      var path=cityPath(a.tx,a.ty,door.x,door.y);
      if(path&&path.length>1){ a.path=path; a.pi=0; a.to=st; }
      else { a.stage=st; a.tx=door.x; a.ty=door.y; }
    }
  }
  for(var pr2 in CITY.agents) if(!seen[pr2]) CITY.agents[pr2].gone=nowMs();
}
function cityStep(dt){
  for(var pr in CITY.agents){
    var a=CITY.agents[pr];
    if(a.gone){ if(nowMs()-a.gone>500) delete CITY.agents[pr]; continue; }
    if(a.path&&a.pi<a.path.length){
      var t=a.path[a.pi];
      var dx=t.x-a.x, dy=t.y-a.y, d=Math.hypot(dx,dy);
      var sp=1.9*dt;
      if(d<=sp){ a.x=t.x; a.y=t.y; a.pi++; }
      else { a.x+=dx/d*sp; a.y+=dy/d*sp; a.walk=1; }
      if(a.pi>=a.path.length){ a.path=null; a.stage=a.to; a.to=null; a.walk=0; }
    } else {
      a.wait-=dt;
      if(a.wait<=0){ a.wait=1.2+Math.random()*2.2; a.jx=(Math.random()*0.8-0.4); a.jy=(Math.random()*0.8-0.4); }
    }
  }
  /* the traffic */
  for(var c=0;c<CITY.cars.length;c++){
    var car=CITY.cars[c];
    var nx=car.x+car.dx, ny=car.y+car.dy;
    if(ctl(nx,ny)!==CT.ROAD){
      var turn=Math.random()<0.5;
      if(turn){ var tdx=car.dx; car.dx=car.dy; car.dy=-tdx; }
      else { var tdy=car.dy; car.dy=car.dx; car.dx=-tdy; }
      nx=car.x+car.dx; ny=car.y+car.dy;
      if(ctl(nx,ny)!==CT.ROAD){ car.dx=-car.dx; car.dy=-car.dy; nx=car.x; ny=car.y; }
    }
    car.x=nx; car.y=ny;
  }
  /* the light of day */
  var d=new Date(), hr=d.getHours()+d.getMinutes()/60;
  var daylight=Math.max(0,Math.sin((hr-6)/12*Math.PI));
  CITY.night=Math.max(0,Math.min(1,1-daylight*1.5));
}
function cityDraw(g,w,h){
  var T=CITY.T;
  g.fillStyle=BOARD; g.fillRect(0,0,w,h);
  if(CITY.ground){
    g.save(); g.translate(CITY.OX,CITY.OY);
    g.drawImage(CITY.ground,0,0);
    g.restore();
  }
  var counts=stageCounts();
  var night=CITY.night;
  /* the buildings */
  CITY.blds.forEach(function(b){
    var x=CITY.OX+b.bx*T, y=CITY.OY+b.by*T, bw=b.bw*T, bh=b.bh*T;
    var count=b.stage>=0?counts[b.stage]:0;
    var growth=b.stage>=0?Math.min(1,count/40):1;
    var col=b.kind==='plant'?'#8a6a52':(b.kind==='yard'?'#5d6472':STAGES[b.stage].color);
    /* shadow */
    g.fillStyle='rgba(0,0,0,.32)'; g.fillRect(x+7,y+9,bw,bh);
    if(b.kind==='yard'){
      g.fillStyle='#565d6b'; g.fillRect(x,y,bw,bh);
      /* the parked cars */
      var pool=((state&&state.fleet&&state.fleet.pool)||[]);
      for(var i=0;i<pool.length&&i<b.bw*b.bh;i++){
        var cxp=x+16+(i%b.bw)*(bw/b.bw)*0+ (i%b.bw)*(T-4)+6;
        var cyp=y+12+Math.floor(i/b.bw)*(T-2);
        if(cyp>y+bh-8) break;
        var busy=pool[i]&&pool[i].busy;
        g.fillStyle=busy?'#e0543f':'#8e9bb0';
        rrect(g,cxp,cyp,T-9,T-7,2); g.fill();
      }
      plate(g,'RUNNER YARD  '+(state&&state.fleet&&state.fleet.pool?state.fleet.pool.length:0),x+bw/2,y-12,11,'#9aa6bd');
      return;
    }
    /* the block: roof */
    g.fillStyle=shade(col,-0.18); g.fillRect(x,y,bw,bh);
    g.fillStyle=shade(col,0.06); g.fillRect(x+3,y+3,bw-6,bh-8);
    /* the front face, which grows with the stage */
    var faceH=8+growth*26;
    g.fillStyle=shade(col,-0.5); g.fillRect(x,y+bh-4,bw,faceH);
    g.fillStyle='rgba(255,255,255,.10)';
    for(var wnd=0;wnd<Math.floor(bw/16);wnd++){
      var lit=night>0.25 && ((wnd+b.stage)%3!==0);
      g.fillStyle=lit?'rgba(255,214,140,.95)':'rgba(20,30,48,.55)';
      g.fillRect(x+7+wnd*16,y+bh+2,8,Math.max(3,faceH-8));
    }
    /* the roof plant */
    g.fillStyle='rgba(0,0,0,.25)';
    g.fillRect(x+10,y+10,14,10); g.fillRect(x+bw-26,y+14,12,9);
    if(b.kind==='plant'){
      /* chimneys */
      g.fillStyle='#6f5a49';
      g.fillRect(x+12,y-26,12,30); g.fillRect(x+34,y-20,10,24);
      g.fillStyle='#4d3f34';
      g.fillRect(x+10,y-30,16,6); g.fillRect(x+32,y-24,14,6);
      /* the load lamp */
      var held=!!(state&&state.train&&(state.train.entries||[]).length&&
        (state.train.entries||[]).some(function(e){return e.status==='in_progress';}));
      g.beginPath(); g.arc(x+bw-20,y-12,6,0,Math.PI*2);
      g.fillStyle=held?'#f0a832':'#8fce4f'; g.fill();
      plate(g,'THE HEAVY PLANT',x+bw/2,y-44,11,'#f0a832');
    }
  });
  /* the residents */
  for(var pr in CITY.agents){
    var a=CITY.agents[pr];
    if(a.gone) continue;
    var col=STAGES[a.stage].color;
    var px=CITY.OX+(a.x+0.5+(a.jx||0))*T;
    var py=CITY.OY+(a.y+0.5+(a.jy||0))*T;
    var bob=a.walk?Math.sin(nowMs()/70+a.pr)*1.1:0;
    g.beginPath(); g.ellipse(px,py+3,3,1.4,0,0,Math.PI*2);
    g.fillStyle='rgba(0,0,0,.3)'; g.fill();
    g.beginPath(); g.arc(px,py+bob,3.4,0,Math.PI*2);
    g.fillStyle=col; g.fill();
    g.strokeStyle='rgba(255,255,255,.55)'; g.lineWidth=0.9; g.stroke();
  }
  /* the cars */
  CITY.cars.forEach(function(car){
    var px=CITY.OX+(car.x+0.5)*T, py=CITY.OY+(car.y+0.5)*T;
    g.save(); g.translate(px,py); g.rotate(Math.atan2(car.dy,car.dx));
    g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-5,-2,10,5);
    g.fillStyle='#cfd6e2'; g.fillRect(-5,-2.6,10,5.2);
    g.fillStyle='#7d8798'; g.fillRect(-1.6,-2.2,4,4.4);
    g.restore();
  });
  /* the dusk wash */
  if(night>0.02){
    g.fillStyle='rgba(14,22,48,'+(night*0.46).toFixed(3)+')';
    g.fillRect(0,0,w,h);
    /* the lamps */
    CITY.av.forEach(function(ax){ CITY.st.forEach(function(sy){
      var lx=CITY.OX+(ax+0.5)*T, ly=CITY.OY+(sy+0.5)*T;
      var lg=g.createRadialGradient(lx,ly,1,lx,ly,26);
      lg.addColorStop(0,'rgba(255,206,130,'+(night*0.55).toFixed(3)+')');
      lg.addColorStop(1,'rgba(255,206,130,0)');
      g.fillStyle=lg; g.fillRect(lx-26,ly-26,52,52);
    });});
  }
  /* the district signs */
  CITY.blds.forEach(function(b){
    if(b.stage<0) return;
    var x=CITY.OX+b.bx*T, y=CITY.OY+b.by*T;
    plate(g,STAGES[b.stage].short+'  '+counts[b.stage],x+b.bw*T/2,y-12,11,STAGES[b.stage].color);
  });
}

/* ════════════════════════════════════════════════════════════
   04 — THE PINBALL BOARD
   ════════════════════════════════════════════════════════════ */
var PB={tok:{},bands:[],pegs:[],t:0};
function pbBuild(){
  var counts=stageCounts();
  var total=counts.reduce(function(a,b){return a+b;},0)||1;
  var top=54, avail=600;
  PB.bands=[];
  for(var i=0;i<STAGES.length;i++){
    var h=Math.max(30,Math.round(avail*(counts[i]/total)));
    PB.bands.push({i:i, top:top, h:h, floor:top+h});
    top+=h;
  }
  /* the pegs, indexed by band so a ball only tests its own */
  PB.pegs=[]; PB.byBand={};
  PB.bands.forEach(function(b){
    PB.byBand[b.i]=[];
    for(var y=b.top+16;y<b.floor-14;y+=26){
      for(var x=290;x<910;x+=30){
        var peg={x:x+(y%52?15:0),y:y,b:b.i};
        PB.pegs.push(peg); PB.byBand[b.i].push(peg);
      }
    }
  });
}
function pbSync(){
  buildIndex();
  var counts=stageCounts();
  var seen={};
  for(var pr in prIndex){
    seen[pr]=true;
    var st=prIndex[pr];
    var b=PB.tok[pr];
    if(!b){
      PB.tok[pr]={pr:pr,band:st,x:300+Math.random()*600,y:PB.bands[st].top+10,vx:(Math.random()*2-1)*30,vy:0};
      continue;
    }
    if(b.band!==st){
      b.band=st; b.y=PB.bands[st].top+6; b.vy=20; b.vx=(Math.random()*2-1)*40;
    }
  }
  for(var pr2 in PB.tok) if(!seen[pr2]) PB.tok[pr2].gone=nowMs();
}
function pbStep(dt){
  for(var pr in PB.tok){
    var b=PB.tok[pr];
    if(b.gone) continue;
    var band=PB.bands[b.band];
    b.vy+=520*dt;
    b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(b.x<266){ b.x=266; b.vx=Math.abs(b.vx); }
    if(b.x>934){ b.x=934; b.vx=-Math.abs(b.vx); }
    if(b.y>band.floor-7){ b.y=band.floor-7; b.vy=0; b.vx*=0.86; if(Math.abs(b.vx)<4) b.vx=0; }
    if(b.y<band.top+7){ b.y=band.top+7; b.vy=Math.abs(b.vy)*0.4; }
    /* the pegs */
    var pegs=PB.byBand[b.band]||[];
    for(var i=0;i<pegs.length;i++){
      var p=pegs[i];
      var dx=b.x-p.x, dy=b.y-p.y, d=Math.hypot(dx,dy);
      if(d<12&&d>0.01){
        var nx=dx/d, ny=dy/d;
        b.x=p.x+nx*12.5; b.y=p.y+ny*12.5;
        var dot=b.vx*nx+b.vy*ny;
        b.vx-=2*dot*nx; b.vy-=2*dot*ny;
        b.vx*=0.86; b.vy*=0.86;
      }
    }
  }
}
function pbDraw(g,w,h){
  boardBg(g,w,h,'#1c2436');
  PB.t=PB.t+0.016;
  var counts=stageCounts();
  /* the board */
  g.fillStyle='#141b28'; g.fillRect(258,26,684,624);
  g.strokeStyle='rgba(242,233,216,.18)'; g.lineWidth=2; g.strokeRect(258,26,684,624);
  /* the bands */
  PB.bands.forEach(function(b){
    var st=STAGES[b.i];
    g.fillStyle='rgba(255,255,255,.025)'; g.fillRect(262,b.top,676,b.h);
    g.strokeStyle='rgba(242,233,216,.10)'; g.lineWidth=1;
    g.beginPath(); g.moveTo(262,b.floor+.5); g.lineTo(938,b.floor+.5); g.stroke();
    /* the rail with the name */
    g.fillStyle=shade(st.color,-0.45); g.fillRect(262,b.top,48,b.h);
    g.fillStyle=st.color; g.fillRect(262,b.top,4,b.h);
    g.save(); g.translate(278,b.top+b.h/2); g.rotate(-Math.PI/2);
    label(g,st.short.toUpperCase(),0,0,11,st.color,'center',700);
    g.restore();
    /* the count on the rail */
    label(g,String(counts[b.i]),296,b.top+b.h-16,11,'rgba(242,233,216,.55)','center');
    /* the gate */
    g.fillStyle=shade(st.color,-0.2);
    g.fillRect(600,b.floor-4,48,8);
  });
  /* the pegs */
  PB.pegs.forEach(function(p){
    g.beginPath(); g.arc(p.x,p.y,3.4,0,Math.PI*2);
    g.fillStyle='rgba(242,233,216,.28)'; g.fill();
    g.beginPath(); g.arc(p.x-0.8,p.y-0.8,1.5,0,Math.PI*2);
    g.fillStyle='rgba(255,255,255,.35)'; g.fill();
  });
  /* the balls */
  for(var pr in PB.tok){
    var b=PB.tok[pr];
    if(b.gone) continue;
    var col=STAGES[b.band].color;
    var grd=g.createRadialGradient(b.x-2.5,b.y-3,1,b.x,b.y,8);
    grd.addColorStop(0,'#ffffff'); grd.addColorStop(0.3,col); grd.addColorStop(1,shade(col,-0.55));
    g.beginPath(); g.arc(b.x,b.y,7.6,0,Math.PI*2); g.fillStyle=grd; g.fill();
  }
  /* the backlight */
  var lg=g.createRadialGradient(600,340,60,600,340,460);
  lg.addColorStop(0,'rgba(255,236,190,.07)'); lg.addColorStop(1,'rgba(0,0,0,.25)');
  g.fillStyle=lg; g.fillRect(258,26,684,624);
  label(g,'THE BOARD — band height is the size of the stage',600,676,11,'rgba(242,233,216,.45)','center');
}

/* ════════════════════════════════════════════════════════════
   05 — THE PRODUCTION LINE
   ════════════════════════════════════════════════════════════ */
var LN={tok:{},mach:[],scroll:0,arm:null};
function lnBuild(){
  var counts=stageCounts();
  LN.mach=[];
  for(var i=0;i<STAGES.length;i++){
    LN.mach.push({i:i, x:52+i*162, w:140, h:80+Math.min(280,counts[i]*4.2)});
  }
}
function lnSync(){
  buildIndex();
  var seen={};
  for(var pr in prIndex){
    seen[pr]=true;
    var st=prIndex[pr];
    var c=LN.tok[pr];
    if(!c){ LN.tok[pr]={pr:pr,stage:st,off:Math.random()*1600,mode:'ride',x:0,y:0}; continue; }
    if(c.stage!==st&&c.mode==='ride'){ c.mode='hop'; c.from=c.stage; c.to=st; c.hopT=0; c.fx=c.x; c.fy=c.y; }
  }
  for(var pr2 in LN.tok) if(!seen[pr2]) LN.tok[pr2].gone=nowMs();
}
function lnStep(dt){
  LN.scroll=(LN.scroll+48*dt)%1600;
  for(var pr in LN.tok){
    var c=LN.tok[pr];
    if(c.gone) continue;
    if(c.mode==='ride'){
      c.off+=48*dt;
      var m=LN.mach[c.stage];
      c.x=m.x+((c.off+m.w)%(LN.mach.length*162))-20;
      c.y=520;
    } else if(c.mode==='hop'){
      c.hopT+=dt;
      var k=Math.min(1,c.hopT/0.8);
      var e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      var tm=LN.mach[c.to];
      var tx=tm.x+tm.w/2, ty=520;
      c.x=c.fx+(tx-c.fx)*e;
      c.y=c.fy+(ty-c.fy)*e-Math.sin(k*Math.PI)*70;
      if(k>=1){ c.mode='ride'; c.stage=c.to; }
    }
  }
}
function lnDraw(g,w,h){
  boardBg(g,w,h,'#192130');
  /* the floor */
  g.fillStyle='#11161f'; g.fillRect(0,548,w,h-548);
  g.strokeStyle='rgba(240,233,216,.09)'; g.lineWidth=2;
  for(var fx=0;fx<w;fx+=44){ g.beginPath(); g.moveTo(fx,548); g.lineTo(fx-26,h); g.stroke(); }
  var counts=stageCounts();
  /* the belt */
  g.fillStyle='#39445a'; g.fillRect(0,506,w,20);
  g.fillStyle='#20293a'; g.fillRect(0,509,w,14);
  g.strokeStyle='rgba(240,233,216,.13)'; g.lineWidth=2;
  for(var t=0;t<w;t+=16){
    var tx=(t+LN.scroll)%w;
    g.beginPath(); g.moveTo(tx,510); g.lineTo(tx,522); g.stroke();
  }
  /* the machines */
  LN.mach.forEach(function(m){
    var st=STAGES[m.i], x=m.x, y=506-m.h, w=m.w;
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+8,y+10,w,m.h);
    g.fillStyle='#2b3549'; g.fillRect(x,y,w,m.h);
    g.fillStyle='#333f56'; g.fillRect(x+6,y+6,w-12,m.h-12);
    /* the readout */
    g.fillStyle='#0d1420'; g.fillRect(x+12,y+14,w-24,42);
    g.fillStyle=shade(st.color,-0.15); g.fillRect(x+14,y+16,w-28,38);
    g.fillStyle='#0b1119';
    g.font='700 21px ui-monospace,Menlo,monospace'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText(String(counts[m.i]),x+w/2,y+35);
    /* the warning lamp: the heavy gate's truth */
    var heavy=heavyStateOf(m.i);
    g.beginPath(); g.arc(x+w-20,y+24,5.5,0,Math.PI*2);
    g.fillStyle=heavy==='failed'?'#e0543f':(heavy==='running'||heavy==='queued'?'#f0a832':(heavy==='passed'?'#8fce4f':'#4a5568'));
    g.fill();
    /* the tray */
    g.fillStyle='#46526b'; g.fillRect(x+8,506-12,w-16,12);
    /* the sign */
    plate(g,st.short,x+w/2,y-16,12,st.color);
    /* the arm */
    g.strokeStyle='rgba(240,233,216,.22)'; g.lineWidth=3;
    g.beginPath(); g.moveTo(x+w-14,y+40); g.lineTo(x+w-14,y+96); g.stroke();
  });
  /* the crates */
  for(var pr in LN.tok){
    var c=LN.tok[pr];
    if(c.gone) continue;
    var st2=STAGES[c.mode==='hop'?c.to:c.stage];
    var alpha=c.gone?Math.max(0,1-(nowMs()-c.gone)/500):1;
    g.globalAlpha=alpha;
    g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(c.x-9,c.y+6,18,4);
    g.fillStyle=shade(st2.color,-0.55); rrect(g,c.x-10,c.y-9,20,15,3); g.fill();
    g.strokeStyle=st2.color; g.lineWidth=1.6; g.stroke();
    g.fillStyle=st2.color; g.fillRect(c.x-10,c.y-1.4,20,2.8);
    g.globalAlpha=1;
  }
  label(g,'THE LINE — machine height is the size of the stage',w/2,678,11,'rgba(242,233,216,.4)','center');
}
function heavyStateOf(stageIdx){
  var ph=(state&&state.phases&&state.phases[STAGES[stageIdx].key])||[];
  var live=0, failed=0, none=0, passed=0;
  ph.forEach(function(r){
    var h=r.heavy;
    if(!h) none++;
    else if(h==='success') passed++;
    else if(h==='failure'||h==='cancelled') failed++;
    else live++;
  });
  if(live) return 'running';
  if(failed) return 'failed';
  if(passed) return 'passed';
  return 'none';
}

/* ════════════════════════════════════════════════════════════
   06 — THE ARCADE CABINETS
   ════════════════════════════════════════════════════════════ */
var CB={cab:[],sel:0,t:0};
function cbBuild(){
  var counts=stageCounts();
  CB.cab=[];
  for(var i=0;i<STAGES.length;i++){
    CB.cab.push({i:i, x:44+i*124, w:104, h:120+Math.min(300,counts[i]*4.0)});
  }
}
function cbDraw(g,w,h){
  boardBg(g,w,h,'#1a2130');
  CB.t+=0.016;
  var counts=stageCounts();
  var floor=604;
  /* the arcade floor */
  g.fillStyle='#121822'; g.fillRect(0,floor,w,h-floor);
  g.strokeStyle='rgba(240,233,216,.08)'; g.lineWidth=2;
  for(var fx=-40;fx<w;fx+=56){ g.beginPath(); g.moveTo(fx,floor); g.lineTo(fx-34,h); g.stroke(); }
  CB.cab.forEach(function(c){
    var st=STAGES[c.i], x=c.x, w=c.w, top=floor-c.h;
    var sel=(c.i===CB.sel);
    /* the body */
    g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(x+6,top+8,w,c.h);
    g.fillStyle=sel?'#2d3a52':'#232c3d'; g.fillRect(x,top,w,c.h);
    /* the side art */
    g.fillStyle=shade(st.color,-0.62); g.fillRect(x+6,top+58,w-12,c.h-64);
    g.fillStyle=shade(st.color,-0.2); g.fillRect(x+6,top+58,w-12,6);
    /* the marquee */
    g.fillStyle=shade(st.color,-0.5); g.fillRect(x+3,top+18,w-6,36);
    g.fillStyle=shade(st.color,-0.05); g.fillRect(x+6,top+21,w-12,30);
    /* the chasing lamps */
    for(var k=0;k<10;k++){
      var on=((Math.floor(CB.t*7)+k)%10)<(sel?4:2);
      g.beginPath(); g.arc(x+12+k*((w-24)/9),top+15,2.6,0,Math.PI*2);
      g.fillStyle=on?'rgba(255,226,150,.95)':'rgba(255,226,150,.14)'; g.fill();
    }
    label(g,st.short.toUpperCase(),x+w/2,top+36,11,'#0d1420','center',700);
    /* the screen */
    g.fillStyle='#05080d'; g.fillRect(x+12,top+62,w-24,54);
    var grd=g.createLinearGradient(x,top+62,x,top+116);
    grd.addColorStop(0,'rgba(120,190,255,.10)'); grd.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grd; g.fillRect(x+12,top+62,w-24,54);
    g.font='700 24px ui-monospace,Menlo,monospace'; g.textAlign='center'; g.textBaseline='middle';
    g.fillStyle=st.color; g.fillText(String(counts[c.i]),x+w/2,top+82);
    g.font='600 8px Inter,sans-serif'; g.fillStyle='rgba(242,233,216,.45)';
    g.fillText('PULL REQUESTS',x+w/2,top+106);
    /* the control deck */
    g.fillStyle='#1a2230'; g.fillRect(x+8,floor-34,w-16,18);
    g.fillStyle=st.color; g.fillRect(x+18,floor-29,12,6);
    g.fillStyle='#e0543f'; g.beginPath(); g.arc(x+w-26,floor-26,5,0,Math.PI*2); g.fill();
    g.fillStyle='#f0a832'; g.beginPath(); g.arc(x+w-44,floor-26,5,0,Math.PI*2); g.fill();
    /* the selection glow */
    if(sel){
      g.strokeStyle='rgba(242,233,216,.55)'; g.lineWidth=2;
      g.strokeRect(x-3,top-3,w+6,c.h+6);
    }
  });
  /* the preview panel */
  var px=902, pw=282;
  g.fillStyle='rgba(10,15,24,.72)'; rrect(g,px,40,pw,540,10); g.fill();
  g.strokeStyle='rgba(242,233,216,.14)'; g.lineWidth=1; g.stroke();
  var st=STAGES[CB.sel];
  label(g,'PREVIEW',px+16,64,11,'rgba(242,233,216,.5)','left',700);
  label(g,st.label.toUpperCase(),px+16,90,15,st.color,'left',700);
  label(g,counts[CB.sel]+' pull requests',px+16,112,12,'rgba(242,233,216,.72)');
  g.strokeStyle='rgba(242,233,216,.12)'; g.beginPath(); g.moveTo(px+16,128); g.lineTo(px+pw-16,128); g.stroke();
  var rows=rowsOf(CB.sel).slice(0,9);
  rows.forEach(function(r,i){
    var y=150+i*30;
    g.fillStyle=st.color; g.fillRect(px+16,y-5,3,16);
    label(g,'#'+r.pr,px+26,y+2,11,'rgba(242,233,216,.85)','left',700);
    var t=(r.title||'').replace(/^\[ID:warp#\d+\]:\s*/,'');
    label(g,t.slice(0,32),px+74,y+2,10.5,'rgba(242,233,216,.5)');
  });
  if(!rows.length) label(g,'nothing here',px+16,152,12,'rgba(242,233,216,.4)');
  /* the high score */
  var sy=430;
  g.strokeStyle='rgba(242,233,216,.12)'; g.beginPath(); g.moveTo(px+16,sy-16); g.lineTo(px+pw-16,sy-16); g.stroke();
  label(g,'HIGH SCORE',px+16,sy+2,11,'rgba(242,233,216,.5)','left',700);
  var stats=(state&&state.stats)||{};
  var tp=stats.throughput||{};
  label(g,'throughput',px+16,sy+26,11,'rgba(242,233,216,.5)');
  label(g,(tp.completed_60m!=null?tp.completed_60m+' jobs/hour':'—'),px+pw-16,sy+26,12,'#8fce4f','right',700);
  label(g,'concurrency',px+16,sy+48,11,'rgba(242,233,216,.5)');
  label(g,String((stats.concurrency&&stats.concurrency.current)!=null?stats.concurrency.current:'—'),px+pw-16,sy+48,12,'#5ad1d8','right',700);
  label(g,'runners',px+16,sy+70,11,'rgba(242,233,216,.5)');
  var pool=((state&&state.fleet&&state.fleet.pool)||[]);
  label(g,pool.length+' online',px+pw-16,sy+70,12,'#f0a832','right',700);
  label(g,'THE ARCADE — cabinet height is the size of the stage',px+pw/2,604,11,'rgba(242,233,216,.4)','center');
}

/* ════════════════════════════════════════════════════════════
   boot
   ════════════════════════════════════════════════════════════ */
var SCREENS=[
  {id:'marble',  cv:'c-marble',   build:mrBuild, sync:mrSync, step:mrStep, draw:mrDraw, chip:'chips-marble'},
  {id:'heap',    cv:'c-heap',     build:hpBuild, sync:hpSync, step:hpStep, draw:hpDraw, chip:'chips-heap'},
  {id:'city',    cv:'c-city',     build:cityBuild, sync:citySync, step:cityStep, draw:cityDraw, chip:'chips-city'},
  {id:'pinball', cv:'c-pinball',  build:pbBuild, sync:pbSync, step:pbStep, draw:pbDraw, chip:'chips-pinball'},
  {id:'line',    cv:'c-line',     build:lnBuild, sync:lnSync, step:lnStep, draw:lnDraw, chip:'chips-line'},
  {id:'cabinets',cv:'c-cabinets', build:cbBuild, sync:function(){}, step:function(){}, draw:cbDraw, chip:'chips-cabinets'}
];
function buildChips(){
  SCREENS.forEach(function(s){
    var host=$(s.chip); if(!host) return;
    host.innerHTML=STAGES.map(function(st){
      return '<span class="chip"><i style="background:'+st.color+'"></i>'+esc(st.short)+'</span>';
    }).join('');
  });
}
var lastSig='';
function onState(){
  var sig=stageCounts().join(',');
  var changed=(sig!==lastSig);
  lastSig=sig;
  SCREENS.forEach(function(s){
    if(changed) s.build();
    else if(!s.built){ s.build(); s.built=true; }
    try{ s.sync(); }catch(e){}
  });
  /* the header */
  var tr=(state&&state.train)||{}, entries=tr.entries||[];
  var held=entries.filter(function(e){return e.status==='in_progress';}).length;
  var pop=stageCounts().reduce(function(a,b){return a+b;},0);
  set('lb-state','live');
  set('lb-pop',pop+' pull requests');
  set('lb-slot',held?('held by '+held):'free');
  var tp=(state&&state.stats&&state.stats.throughput)||{};
  set('lb-tp',tp.completed_60m!=null?tp.completed_60m+'/hour':'—');
  set('lb-read',tr.read_at?String(tr.read_at).replace('T',' ').replace('Z',''):'—');
  var ver=(state&&state.version)||{};
  set('f-ver',(ver.tag||'—')+' · '+(ver.sha||'—'));
  set('f-built',ver.built_at||'—');
  set('f-read',state&&state.generated_at?state.generated_at:'—');
}
function set(id,v){ var el=$(id); if(el) el.textContent=v; }
function poll(){
  fetch('/api/state',{cache:'no-store'}).then(function(r){return r.json();})
    .then(function(j){ state=j; onState(); })
    .catch(function(){ set('lb-state','snapshot unavailable'); });
}
function loop(){
  var last=performance.now(), frames=0;
  /* ?still=1 paints a bounded number of frames and stops. The animation is
     continuous by design, which keeps a headless capture waiting forever;
     the still mode is how a screen gets screenshotted or measured. */
  var STILL=/[?&]still=1/.test(location.search);
  var sig=document.createElement('canvas'); sig.width=64; sig.height=36;
  function paintSig(g,cv){
    var sc=sig.getContext('2d');
    sc.clearRect(0,0,64,36);
    sc.drawImage(cv,0,0,64,36);
    var d=sc.getImageData(0,0,64,36).data, h=0, kinds={};
    for(var i=0;i<d.length;i+=4){
      h=(h*31+d[i]+d[i+1]*3+d[i+2]*7)>>>0;
      kinds[(d[i]>>4)+','+(d[i+1]>>4)+','+(d[i+2]>>4)]=1;
    }
    return h+':'+Object.keys(kinds).length;
  }
  function tick(now){
    var dt=Math.min(0.05,(now-last)/1000); last=now;
    frames++;
    for(var i=0;i<SCREENS.length;i++){
      var s=SCREENS[i];
      try{
        var cv=$(s.cv); if(!cv) continue;
        var g=cv.getContext('2d');
        if(s.step) s.step(dt);
        g.clearRect(0,0,cv.width,cv.height);
        s.draw(g,cv.width,cv.height);
        if(STILL||frames%20===0) cv.dataset.paint=paintSig(g,cv);
      }catch(e){}
    }
    if(STILL&&frames>=45&&state) return;
    if(STILL&&frames>=400) return;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
(function init(){
  buildChips();
  /* ?only=<id> shows a single screen on its own — a slide-sized view for a
     designer, and a screen that captures cleanly. */
  var only=null;
  try{
    var q=new URLSearchParams(location.search).get('only');
    if(q) only=q.toLowerCase();
  }catch(e){}
  if(only){
    Array.prototype.forEach.call(document.querySelectorAll('section.scr'),function(s){
      if(s.id!==only) s.style.display='none';
    });
    var keep=document.getElementById(only);
    if(keep){ keep.style.marginTop='0'; }
    var hd=document.querySelector('header.top'), nm=document.querySelector('nav.jump');
    if(hd) hd.style.display='none';
    if(nm) nm.style.display='none';
  }
  poll();
  setInterval(poll,25000);
  loop();
  /* the cabinets are clickable */
  var cabcv=$('c-cabinets');
  if(cabcv){
    cabcv.addEventListener('click',function(ev){
      var r=cabcv.getBoundingClientRect();
      var sx=(ev.clientX-r.left)*(cabcv.width/r.width);
      for(var i=0;i<CB.cab.length;i++){
        var c=CB.cab[i];
        if(sx>=c.x-4&&sx<=c.x+c.w+4){ CB.sel=i; break; }
      }
    });
  }
})();
})();
