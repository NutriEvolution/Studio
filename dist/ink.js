/* ink.js: penne (a sfera, stilografica, pennarello, matita), evidenziatore, gomma fine e testo sulle pagine del PDF */
const INK={u:[],r:[],cancel:null};
const INKW={bp:[.8,1.3,2,3],ft:[1.4,2.2,3.4,5],mk:[2.4,4,6,9],pc:[1,1.8,2.8,4],hl:[9,14,20,28]},INKR=[6,10,16,24],INKT=[10,14,20,28],INKK={bp:'b',ft:'f',mk:'m',pc:'c',hl:'h',er:'e',tx:'t'};
const PENC=['#1b1b1f','#e8334a','#f08a24','#16a34a','#2563eb','#7c3aed','#ffffff'],HLC=['#ffd233','#7ff7a6','#7fd6ff','#ffadb8','#ffc4a3','#c7b3ff'];
const inkDef=()=>({on:false,k:'bp',dock:'b',bz:1,fz:1,mz:1,cz:1,hz:2,ez:1,tz:1,bc:'#1b1b1f',fc:'#1c2a6b',mc:'#e8334a',cc:'#3a3a42',hc:'#ffd233',tc:'#1b1b1f',fin:false});
function smooth(g,P){g.beginPath();g.moveTo(P[0][0],P[0][1]);if(P.length==1){g.lineTo(P[0][0]+.01,P[0][1]);return}for(let i=1;i<P.length-1;i++){const mx=(P[i][0]+P[i+1][0])/2,my=(P[i][1]+P[i+1][1])/2;g.quadraticCurveTo(P[i][0],P[i][1],mx,my)}g.lineTo(P[P.length-1][0],P[P.length-1][1])}
function drawItem(g,s){if(s.k=='tx'){g.save();g.font=`${s.sz}px Inter,sans-serif`;g.fillStyle=s.c;g.textBaseline='top';s.t.split('\n').forEach((ln,i)=>g.fillText(ln,s.x,s.y+i*s.sz*1.25));g.restore();return}
 const P=s.p;if(!P||!P.length)return;const k=s.k=='pen'?'bp':s.k;g.save();g.strokeStyle=s.c;g.lineJoin='round';g.lineCap='round';g.lineWidth=s.w;
 if(k=='hl'){g.lineCap='square';g.globalAlpha=.38;smooth(g,P);g.stroke()}
 else if(k=='ft'){if(P.length==1){smooth(g,P);g.stroke()}else for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],f=.4+.95*Math.abs(Math.sin(Math.atan2(b[1]-a[1],b[0]-a[0])-.8));g.lineWidth=s.w*f;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()}}
 else if(k=='pc'){g.globalAlpha=.72;smooth(g,P);g.stroke();g.globalAlpha=.38;g.lineWidth=s.w*.5;g.translate(.35,.25);smooth(g,P);g.stroke()}
 else if(k=='mk'){g.globalAlpha=.88;smooth(g,P);g.stroke()}
 else{smooth(g,P);g.stroke()}g.restore()}
function paintInk(n,live){const w=PV.shells&&PV.shells[n],cv=w&&w.querySelector('.ik'),d=doc();if(!cv||!d||!PM)return;const sc=PV.scale,pm=PM.pages[n],k=Math.min(2,devicePixelRatio||1);
 cv.width=Math.round(pm.w*sc*k);cv.height=Math.round(pm.h*sc*k);const g=cv.getContext('2d');g.scale(sc*k,sc*k);((d.ink&&d.ink[n])||[]).forEach(s=>drawItem(g,s));if(live)drawItem(g,live)}
const inkPush=op=>{INK.u.push(op);INK.r=[]};
const inkList=(d,n)=>((d.ink=d.ink||{})[n]=(d.ink[n]||[]));
function inkUndo(){const op=INK.u.pop();if(!op)return;const d=doc();inkList(d,op.n);d.ink[op.n]=op.b.slice();INK.r.push(op);d.mod=Date.now();save();paintInk(op.n);render()}
function inkRedo(){const op=INK.r.pop();if(!op)return;const d=doc();inkList(d,op.n);d.ink[op.n]=op.a.slice();INK.u.push(op);d.mod=Date.now();save();paintInk(op.n);render()}
const dseg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((p.x-a[0])*dx+(p.y-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p.x-(a[0]+t*dx),p.y-(a[1]+t*dy))};
const txBox=s=>{const ls=s.t.split('\n');return{x:s.x,y:s.y,w:Math.max(...ls.map(l=>l.length))*s.sz*.6,h:ls.length*s.sz*1.25}};
const hitText=(s,p,r)=>{const b=txBox(s);return p.x>=b.x-r&&p.x<=b.x+b.w+r&&p.y>=b.y-r&&p.y<=b.y+b.h+r};
const resample=(P,step)=>{const o=[P[0]];for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let j=1;j<=n;j++)o.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}return o};
/* gomma fine: toglie solo il tratto sotto il cursore e divide il resto */
let ERS=null;
function eraseAt(p){const d=doc(),L=inkList(d,p.n),r=INKR[S.ink.ez];if(!ERS||ERS.n!=p.n)ERS={n:p.n,b:L.slice()};let ch=false;const out=[];
 for(const s of L){if(s.k=='tx'){if(hitText(s,p,r*.5)){ch=true;continue}out.push(s);continue}
  const R=r+s.w*.25;if(!s.p.some((q,i)=>Math.hypot(q[0]-p.x,q[1]-p.y)<R+2||(s.p[i+1]&&dseg(p,q,s.p[i+1])<R))){out.push(s);continue}
  const pts=resample(s.p,Math.max(.4,r/4)),runs=[];let cur=[];for(const q of pts){if(Math.hypot(q[0]-p.x,q[1]-p.y)<R){if(cur.length)runs.push(cur);cur=[]}else cur.push([+q[0].toFixed(1),+q[1].toFixed(1)])}if(cur.length)runs.push(cur);
  if(runs.length==1&&runs[0].length==pts.length){out.push(s)}else{ch=true;runs.forEach(rn=>out.push({...s,id:Date.now()+Math.random(),p:rn}))}}
 if(ch){d.ink[p.n]=out;ERS.changed=true;d.mod=Date.now();paintInk(p.n)}}
function eraseEnd(){if(ERS&&ERS.changed){const d=doc();inkPush({n:ERS.n,b:ERS.b,a:(d.ink[ERS.n]||[]).slice()});save();render()}ERS=null;eraserCur(null)}
function eraserCur(e){let c=document.getElementById('ercur');if(!e||!S.ink||!S.ink.on||S.ink.k!='er'){if(c)c.style.display='none';return}if(!c){c=document.createElement('div');c.id='ercur';document.body.append(c)}const s=INKR[S.ink.ez]*2*PV.scale;c.style.cssText=`display:block;width:${s}px;height:${s}px;left:${e.clientX-s/2}px;top:${e.clientY-s/2}px`}
async function textAt(p){const d=doc(),L=inkList(d,p.n),ex=L.find(s=>s.k=='tx'&&hitText(s,p,2)),r=await form(ex?'Modifica il testo':'Aggiungi testo',[{l:'Testo (vuoto per eliminare)',v:ex?ex.t:'',rows:3}],ex?'Salva':'Aggiungi');if(!r)return;const t=r[0].trim(),b=L.slice();
 if(ex){const i=L.indexOf(ex);if(!t)L.splice(i,1);else L[i]={...ex,t}}else if(t)L.push({id:Date.now()+Math.random(),k:'tx',x:+p.x.toFixed(1),y:+p.y.toFixed(1),t,sz:INKT[S.ink.tz],c:S.ink.tc});else return;
 inkPush({n:p.n,b,a:L.slice()});d.mod=Date.now();save();paintInk(p.n);render()}
function inkBind(el){let CUR=null,ER=false,PAN=null,LP=null;INK.cancel=()=>{CUR=null;ER=false;PAN=null;ERS=null};
 const pos=e=>{const w=e.target.closest&&e.target.closest('.pgw');if(!w||!PV.scale)return null;const r=w.getBoundingClientRect();return{n:+w.dataset.pg,x:(e.clientX-r.left)/PV.scale,y:(e.clientY-r.top)/PV.scale}};
 const eraseTo=e=>{const p=pos(e);if(!p)return;if(LP&&LP.n==p.n){const dd=Math.hypot(p.x-LP.x,p.y-LP.y),st=Math.max(.5,INKR[S.ink.ez]/2),n=Math.ceil(dd/st);for(let i=1;i<=n;i++)eraseAt({n:p.n,x:LP.x+(p.x-LP.x)*i/n,y:LP.y+(p.y-LP.y)*i/n})}else eraseAt(p);LP=p};
 el.addEventListener('pointerdown',e=>{const I_=S.ink;if(!I_||!I_.on)return;if(e.pointerType=='touch'&&e.isPrimary===false){INK.cancel();return}const draws=e.pointerType!='touch'||I_.fin;if(!draws){PAN={x:e.clientX,y:e.clientY};return}
  const p=pos(e);if(!p||e.button>0)return;e.preventDefault();if(I_.k=='er'){ER=true;LP=null;eraseTo(e);eraserCur(e);return}if(I_.k=='tx'){textAt(p);return}
  const kk=INKK[I_.k];CUR={n:p.n,b:inkList(doc(),p.n).slice(),s:{id:Date.now()+Math.random(),k:I_.k,c:I_[kk+'c'],w:INKW[I_.k][I_[kk+'z']],p:[[+p.x.toFixed(1),+p.y.toFixed(1)]]}};try{el.setPointerCapture(e.pointerId)}catch(x){}paintInk(p.n,CUR.s)});
 el.addEventListener('pointermove',e=>{const I_=S.ink;if(PAN&&e.pointerType=='touch'){el.scrollTop-=e.clientY-PAN.y;el.scrollLeft-=e.clientX-PAN.x;PAN.x=e.clientX;PAN.y=e.clientY;return}
  if(I_&&I_.on&&I_.k=='er'&&e.pointerType!='touch'||ER)eraserCur(e);if(ER){eraseTo(e);return}if(!CUR)return;const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e],w=PV.shells[CUR.n].getBoundingClientRect();
  for(const q of evs){const x=(q.clientX-w.left)/PV.scale,y=(q.clientY-w.top)/PV.scale,L=CUR.s.p[CUR.s.p.length-1];if(Math.hypot(x-L[0],y-L[1])>.3)CUR.s.p.push([+x.toFixed(1),+y.toFixed(1)])}paintInk(CUR.n,CUR.s)});
 const up=()=>{PAN=null;if(ER){ER=false;LP=null;eraseEnd();return}if(!CUR)return;const c=CUR;CUR=null;const d=doc(),L=inkList(d,c.n);L.push(c.s);inkPush({n:c.n,b:c.b,a:L.slice()});d.mod=Date.now();save();paintInk(c.n);render()};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',()=>INK.cancel());el.addEventListener('pointerleave',e=>{if(!ER)eraserCur(null)})}
const INKTOOLS=[['bp','pen','Penna a sfera'],['ft','pen-tool','Stilografica'],['mk','brush','Pennarello'],['pc','pencil','Matita'],['hl','highlighter','Evidenziatore'],['er','eraser','Gomma'],['tx','type','Testo']];
function inkBar(){const I_=S.ink;if(!I_||!I_.on||S.view!='read')return'';const k=I_.k,kk=INKK[k],z=I_[kk+'z'];
 const dots=[0,1,2,3].map(i=>{const px=[7,10,14,18][i];return`<i class="szd${i==z?' on':''}" style="width:${px}px;height:${px}px" onclick="inkSize(${i})"></i>`}).join(''),pal=k=='er'?'':(k=='hl'?HLC:PENC).map(c=>`<i class="inkc${c==I_[kk+'c']?' on':''}" style="background:${c}" onclick="inkColor('${c}')"></i>`).join('');
 return`<div class="inkbar dk-${I_.dock||'b'}" id=inkbar><div class=ig>${INKTOOLS.map(([t,ic,l])=>`<button class="${k==t?'on':''}" title="${l}" onclick="inkTool('${t}')">${I(ic)}</button>`).join('')}</div><div class=ig><span class=szg>${dots}</span></div>${pal?`<div class="ig ic">${pal}</div>`:''}<div class=ig><button title="Annulla" onclick="inkUndo()" ${INK.u.length?'':'disabled'}>${I('undo-2')}</button><button title="Ripeti" onclick="inkRedo()" ${INK.r.length?'':'disabled'}>${I('redo-2')}</button><button class="${I_.fin?'on':''}" title="Disegna con il dito" onclick="inkFin()">${I('hand')}</button><button title="Chiudi" onclick="inkClose()">${I('x')}</button></div></div>`}
const inkTool=k=>{S.ink.k=k;eraserCur(null);render()},inkSize=i=>{S.ink[INKK[S.ink.k]+'z']=i;render()},inkColor=c=>{S.ink[INKK[S.ink.k]+'c']=c;render()},inkFin=()=>{S.ink.fin=!S.ink.fin;render()},inkClose=()=>{S.ink.on=false;S.tool=null;eraserCur(null);render()};
function inkOpen(){const d=doc();S.menu=null;if(!d||d.kind!='pdf'||S.pdfText||!PV.scale){render();return tell('Le penne funzionano sui PDF visti a pagine.')}S.ink=Object.assign(inkDef(),S.ink||{},{on:true});if(S.ink.k=='pen')S.ink.k='bp';S.tool='ink';S.panel=null;clearSel();render()}
/* barra spostabile: tieni premuto ~1,5 secondi, poi trascinala su un bordo */
(function(){let T=0,D=null,snz=null;const near=e=>{const d={l:e.clientX,r:innerWidth-e.clientX,t:e.clientY,b:innerHeight-e.clientY};return Object.keys(d).sort((a,b)=>d[a]-d[b])[0]};
 const zones=()=>{if(!snz){snz=document.createElement('div');snz.id='snz';snz.innerHTML='<i class=l></i><i class=r></i><i class=t></i><i class=b></i>';document.body.append(snz)}return snz};
 document.addEventListener('pointerdown',e=>{const bar=e.target.closest&&e.target.closest('.inkbar');if(!bar)return;D={x:e.clientX,y:e.clientY,on:false,bar,id:e.pointerId};clearTimeout(T);T=setTimeout(()=>{if(!D)return;D.on=true;bar.classList.add('moving');try{bar.setPointerCapture(D.id)}catch(x){}zones().classList.add('on');if(navigator.vibrate)navigator.vibrate(25)},1500)},true);
 addEventListener('pointermove',e=>{if(!D)return;if(!D.on){if(Math.hypot(e.clientX-D.x,e.clientY-D.y)>10){clearTimeout(T);D=null}return}e.preventDefault();const b=D.bar,r=b.getBoundingClientRect();b.style.cssText=`left:${e.clientX-r.width/2}px;top:${e.clientY-r.height/2}px;bottom:auto;right:auto;transform:none`;const z=zones();z.querySelectorAll('i').forEach(i=>i.classList.toggle('on',i.className.split(' ')[0]==near(e)))},true);
 const end=e=>{clearTimeout(T);if(!D)return;const d=D;D=null;if(snz)snz.classList.remove('on');if(!d.on)return;window.__inkdrag=Date.now();d.bar.classList.remove('moving');d.bar.removeAttribute('style');S.ink.dock=near(e);save();render()};
 addEventListener('pointerup',end,true);addEventListener('pointercancel',end,true);
 document.addEventListener('click',e=>{if(Date.now()-(window.__inkdrag||0)<400&&e.target.closest&&e.target.closest('.inkbar')){e.stopPropagation();e.preventDefault()}},true)})();
