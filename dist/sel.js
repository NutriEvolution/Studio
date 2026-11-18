/* sel.js: selezione sul PDF. Un tocco sceglie la parola, trascinando da una parola selezionata si estende. Nessun menu di Android. */
const WCH=/[\p{L}\p{N}_’'\-]/u;
function wordAt(n,k){const t=PM.pages[n].text;if(k==null||k<0||k>=t.length)return null;if(!WCH.test(t[k])){if(k>0&&WCH.test(t[k-1]))k--;else return null}let s=k,e=k+1;while(s>0&&WCH.test(t[s-1]))s--;while(e<t.length&&WCH.test(t[e]))e++;return{s,e}}
function kAt(n,px,py){const pm=PM.pages[n];let best=null,bd=1e9;for(const it of pm.items){const[x,y,w,h,s,e]=it,cy=y+h/2,dy=Math.abs(cy-py);if(px>=x-1&&px<=x+w+1&&dy<h*.75){let lo=s,hi=e;while(lo<hi){const mid=(lo+hi)>>1;if(xAt(it,pm.text,mid+1)<px)lo=mid+1;else hi=mid}return Math.min(lo,e-1)}}return null}
function paintSel(){if(!PV.shells)return;const sc=PV.scale;PV.shells.forEach((w,n)=>{const sl=w.querySelector('.sl');if(!sl)return;const s=PV.sl;sl.innerHTML=s&&s.pg==n?lineBoxes(rects(n,[s])).map(b=>`<i style="left:${b.x0*sc}px;top:${b.y*sc}px;width:${(b.x1-b.x0)*sc}px;height:${b.h*sc}px"></i>`).join(''):''})}
function showSb(){const s=PV.sl;if(!s)return;const t=PM.pages[s.pg].text.slice(s.s,s.e).replace(/\s+/g,' ').trim();if(!t){clearSel();return}lastSel=t;lastPos={pg:s.pg,s:s.s,e:s.e};
 const bs=lineBoxes(rects(s.pg,[s])),w=PV.shells[s.pg].getBoundingClientRect(),sc=PV.scale,top=Math.min(...bs.map(b=>b.y)),bot=Math.max(...bs.map(b=>b.y+b.h)),left=Math.min(...bs.map(b=>b.x0)),sb=$('#sb');sb.style.display='flex';const H=sb.offsetHeight,W=sb.offsetWidth;
 let y=w.top+bot*sc+12;if(y+H>innerHeight-64)y=Math.max(60,w.top+top*sc-H-12);sb.style.top=y+'px';sb.style.left=Math.max(8,Math.min(innerWidth-W-8,w.left+left*sc))+'px'}
function clearSel(){PV.sl=null;lastSel='';lastPos=null;if(PV.shells)paintSel();const sb=$('#sb');if(sb)sb.style.display='none'}
function focusAt(){const s=PV.sl;if(!s)return;const L=sents(doc()),k=L.findIndex(z=>z.pg==s.pg&&z.e>s.s);if(k>=0){S.i=k;S.focus=true;PV.sc=1;save()}clearSel();render()}
function copySel(){try{navigator.clipboard.writeText(lastSel)}catch(e){}clearSel()}
function selBind(el){let D=null;const pgp=e=>{const w=e.target.closest&&e.target.closest('.pgw');if(!w||!PV.scale)return null;const r=w.getBoundingClientRect();return{n:+w.dataset.pg,px:(e.clientX-r.left)/PV.scale,py:(e.clientY-r.top)/PV.scale}};
 el.addEventListener('pointerdown',e=>{if(S.area||S.tool||(e.pointerType=='touch'&&e.isPrimary===false))return;const p=pgp(e);if(!p||e.button>0){return}const k=kAt(p.n,p.px,p.py),sl=PV.sl;D={x:e.clientX,y:e.clientY,n:p.n,pt:e.pointerType,mv:false,ext:false,drag:false};
  if(sl&&sl.pg==p.n&&k!=null&&k>=sl.s-2&&k<=sl.e+1){D.ext=true}else if(e.pointerType=='mouse'){const wd=wordAt(p.n,k);if(wd){PV.sl={pg:p.n,s:wd.s,e:wd.e,as:wd.s,ae:wd.e};D.drag=true;paintSel()}else clearSel()}});
 el.addEventListener('pointermove',e=>{if(!D)return;if(Math.hypot(e.clientX-D.x,e.clientY-D.y)>6)D.mv=true;if(!(D.ext||D.drag)||!D.mv)return;const p=pgp(e);if(!p||p.n!=D.n)return;const k=kAt(p.n,p.px,p.py);if(k==null)return;const sl=PV.sl,wd=wordAt(p.n,k)||{s:k,e:k+1};if(k>=sl.as){sl.s=sl.as;sl.e=Math.max(sl.ae,wd.e)}else{sl.s=wd.s;sl.e=sl.ae}paintSel()});
 el.addEventListener('pointerup',e=>{if(!D)return;const d=D;D=null;if(d.pt!='mouse'&&!d.mv&&!d.ext){const p=pgp(e),k=p?kAt(p.n,p.px,p.py):null,wd=p&&k!=null?wordAt(p.n,k):null;if(wd){PV.sl={pg:p.n,s:wd.s,e:wd.e,as:wd.s,ae:wd.e};paintSel();showSb()}else clearSel();return}if(PV.sl&&(d.drag||d.ext))showSb()});
 el.addEventListener('pointercancel',()=>{D=null});
 el.addEventListener('touchmove',e=>{if(D&&D.ext&&e.touches.length==1)e.preventDefault()},{passive:false});
 el.addEventListener('contextmenu',e=>e.preventDefault())}
