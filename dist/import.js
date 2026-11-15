const AB=/(?:\b(?:al|Fig|Figs|Tab|vs|cfr|es|ecc|Dr|Prof|Sig|pag|pp|ca)|\b[A-Z])\.$/;
function split(p){const r=p.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9“"'(\[])/),o=[];for(const t of r){if(o.length&&AB.test(o[o.length-1]))o[o.length-1]+=' '+t;else o.push(t)}return o.map(t=>t+' ')}
function splitR(t){const out=[],re=/([.!?]+["”)\]]*)\s+(?=[A-ZÀ-Ý0-9“"'(\[])|\n+/g;let s=0,brk=true,m;
 while((m=re.exec(t))){const e=m.index+(m[1]?m[1].length:0);if(m[1]&&AB.test(t.slice(s,e).trim()))continue;if(t.slice(s,e).trim())out.push([s,e,brk]);brk=/\n/.test(m[0]);s=m.index+m[0].length}
 if(t.slice(s).trim())out.push([s,t.length,brk]);return out}
const PS={},PL={},PV={};let PM=null,PJ=null,PEND=null;
const IDB=new Promise(r=>{const q=indexedDB.open('studio',1);q.onupgradeneeded=()=>q.result.createObjectStore('f');q.onsuccess=()=>r(q.result)});
const idbSet=async(k,v)=>{const db=await IDB;return new Promise(r=>{const t=db.transaction('f','readwrite');t.objectStore('f').put(v,k);t.oncomplete=r})};
const idbGet=async k=>{const db=await IDB;return new Promise(r=>{const q=db.transaction('f').objectStore('f').get(k);q.onsuccess=()=>r(q.result)})};
async function pj(){if(!PJ){PJ=await import('./vendor/pdf.min.mjs');PJ.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.mjs'}return PJ}
async function pageModel(pg){const vp=pg.getViewport({scale:1}),tc=await pg.getTextContent(),T=PJ.Util.transform;let text='',items=[],last=null;
 for(const it of tc.items){if(!it.str)continue;const m=T(vp.transform,it.transform),x=m[4],yb=m[5],h=Math.abs(it.height)||Math.hypot(m[2],m[3])||10,w=it.width||0;
  if(last){if(Math.abs(yb-last.yb)<last.h*.5){if(x-(last.x+last.w)>h*.18&&!/\s$/.test(text)&&!/^\s/.test(it.str))text+=' '}else{const g=yb-last.yb;text+=(g>last.h*1.7||g<0)?'\n':' '}}
  const s=text.length;text+=it.str;items.push([x,yb-h,w,h,s,text.length]);last={x,w,yb,h}}
 return{w:vp.width,h:vp.height,text,items}}
async function readPdf(buf,name){const lib=await pj(),pdf=await lib.getDocument({data:new Uint8Array(buf.slice(0))}).promise,mi=((await pdf.getMetadata().catch(()=>null))||{}).info||{},pages=[],sents=[];let pi=-1;
 for(let n=1;n<=pdf.numPages;n++){const pm=await pageModel(await pdf.getPage(n));pages.push(pm);let first=true;for(const[s,e,b]of splitR(pm.text)){if(b||first)pi++;first=false;sents.push([n-1,s,e,pi])}}
 const paras=[];sents.forEach(([pg,s,e,p])=>{const t=pages[pg].text.slice(s,e).trim();paras[p]=(paras[p]?paras[p]+' ':'')+t});
 const y=(mi.CreationDate||'').match(/D:(\d{4})/);let thumb='';try{const p1=await pdf.getPage(1),v=p1.getViewport({scale:.5}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;await p1.render({canvasContext:c.getContext('2d'),viewport:v}).promise;thumb=c.toDataURL('image/jpeg',.7)}catch(e){}
 return{title:mi.Title||name.replace(/\.pdf$/i,''),authors:(mi.Author||'').split(/[;,]/).map(a=>a.trim()).filter(Boolean),year:y?y[1]:'',pages:pdf.numPages,paras,model:{pages,sents},buf,thumb}}
function lineList(mod,ps){const out=[];mod.pages.forEach((p,n)=>{let cur=null;p.items.forEach(([x,y,w,h,s,e])=>{if(cur&&Math.abs(cur.y-y)<h*.5)cur.e=e;else{if(cur)out.push(cur);cur={pg:n,s,e,y}}});if(cur)out.push(cur)});return out.map(l=>{const sp=ps.find(q=>q.pg==l.pg&&l.s>=q.s&&l.s<=q.e)||ps[0];return{pg:l.pg,s:l.s,e:l.e,pi:sp?sp.pi:0,t:mod.pages[l.pg].text.slice(l.s,l.e).trim()+' '}}).filter(l=>l.t.trim())}
function sentList(mod){return mod.sents.map(([pg,s,e,pi])=>({pg,s,e,pi,t:mod.pages[pg].text.slice(s,e).trim()+' '}))}
async function pickFile(f){if(!f)return;S.err=null;S.busy=true;S.modal='file';render();
 try{let r;const ex=((f.name.match(/\.(\w+)$/)||[])[1]||'').toLowerCase(),tt=f.name.replace(/\.\w+$/,''),mk=ps=>({title:tt,authors:[],year:'',pages:0,paras:ps.map(s=>s.trim()).filter(Boolean)});if(ex=='pdf'){r=await readPdf(await f.arrayBuffer(),f.name);if(!r.paras.length){r.paras=await ocrPdf(r.buf);delete r.model}}else if(ex=='docx'){await loadJs('vendor/mammoth.browser.min.js');r=mk((await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value.split(/\n+/))}else if(ex=='pptx')r=mk(await readPptx(await f.arrayBuffer()));else r=mk((await f.text()).split(/\n+/));
  if(!r.paras.length)throw new Error("Nessun testo trovato: potrebbe essere una scansione (l'OCR non è ancora disponibile).");PEND=r;S.modal='det'}catch(e){S.err=e.message}
 S.busy=false;render()}
async function addFile(){const r=PEND,id=Date.now(),d={id,title:$('#ft').value.trim()||r.title,authors:$('#fa').value.split(',').map(s=>s.trim()).filter(Boolean),year:$('#fy').value.trim(),pages:r.pages,paras:r.paras,kw:[],q:[],n:[],s:[]};
 if(r.model){await idbSet('f'+id,r.buf);await idbSet('m'+id,r.model);d.kind='pdf';if(r.thumb)await idbSet('t'+id,r.thumb)}S.docs.push(d);PEND=null;S.modal=null;save();render()}
function modalX(){if(S.modal=='file')return`<div class=ov onclick="A('close')"></div><div class=modal><h2>Aggiungi un file</h2><label class=card style="display:block;text-align:center;border-style:dashed;cursor:pointer;padding:30px" ondragover="event.preventDefault()" ondrop="event.preventDefault();pickFile(event.dataTransfer.files[0])">${S.busy?(S.msg||'Lettura in corso…'):`<div class=ic style="color:var(--ac)">${I('file-plus')}</div>Tocca per scegliere un file<div class=mut>PDF, DOCX, PPTX o TXT</div>`}<input type=file hidden accept=".pdf,.docx,.pptx,.txt,.md" onchange="pickFile(this.files[0])"></label>${S.err?`<p style="color:#ff8f8f">${esc(S.err)}</p>`:''}<p><button onclick="A('close')">Annulla</button></p></div>`;
 if(S.modal=='det'&&PEND){const r=PEND;return`<div class=ov></div><div class=modal><h2>Modifica i dettagli</h2><div class=mut>${r.paras.length} paragrafi${r.pages?' · '+r.pages+' pagine':''}</div><div class=lab style="margin-top:10px">Titolo</div><input id=ft value="${esc(r.title)}"><div class=lab>Anno</div><input id=fy value="${esc(r.year)}" placeholder="es. 2019"><div class=lab>Autori (separati da virgola)</div><input id=fa value="${esc(r.authors.join(', '))}"><button onclick="A('close')">Annulla</button> <button class=pri onclick="addFile()">${I('check')}Carica in libreria</button></div>`}return''}
/* ---- lettore PDF ---- */
async function loadDoc(id){const d=S.docs.find(x=>x.id==id);if(!d||d.kind!='pdf'||(PV.id==id&&PS[id]))return;const lib=await pj(),buf=await idbGet('f'+id),mod=await idbGet('m'+id);
 if(!buf||!mod){d.kind='text';save();return}
 PM=mod;PS[id]=sentList(mod);PL[id]=lineList(mod,PS[id]);PV.pdf=await lib.getDocument({data:new Uint8Array(buf.slice(0))}).promise;PV.id=id;PV.scale=0;PV.zoom=1;
 const el=PV.el=document.createElement('div');PV.shells=[];PV.io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&drawPage(+e.target.dataset.pg)),{root:el,rootMargin:'800px'});
 mod.pages.forEach((_,n)=>{const w=document.createElement('div');w.className='pgw';w.dataset.pg=n;el.append(w);PV.shells.push(w)});
 el.ondblclick=()=>{lastSel=getSelection().toString().trim();A('kw')};
 el.onclick=e=>{if(getSelection().toString())return;const w=e.target.closest('.pgw');if(!w)return;const r=w.getBoundingClientRect();pickSent(+w.dataset.pg,(e.clientX-r.left)/PV.scale,(e.clientY-r.top)/PV.scale)};
 new ResizeObserver(fitPages).observe(el);
 let pd=0,pl=0,ar=null;const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
 el.addEventListener('touchstart',e=>{if(e.touches.length==2)pd=pl=dist(e.touches)},{passive:true});el.addEventListener('touchmove',e=>{if(e.touches.length==2)pl=dist(e.touches)},{passive:true});
 el.addEventListener('touchend',e=>{if(pd&&e.touches.length<2){const f=pl/pd;pd=0;if(Math.abs(f-1)>.05)pdfZ(f)}},{passive:true});
 el.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();pdfZ(e.deltaY<0?1.1:.9)}},{passive:false});
 el.addEventListener('pointerdown',e=>{if(!S.area)return;const w=e.target.closest('.pgw');if(!w)return;e.preventDefault();const r=w.getBoundingClientRect();ar={w,x:e.clientX-r.left,y:e.clientY-r.top,b:Object.assign(document.createElement('div'),{className:'band'})};w.append(ar.b);w.setPointerCapture(e.pointerId)});
 el.addEventListener('pointermove',e=>{if(!ar)return;const r=ar.w.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;Object.assign(ar.b.style,{left:Math.min(ar.x,x)+'px',top:Math.min(ar.y,y)+'px',width:Math.abs(x-ar.x)+'px',height:Math.abs(y-ar.y)+'px'})});
 el.addEventListener('pointerup',async e=>{if(!ar)return;const a=ar;ar=null;const r=a.w.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,X=Math.min(a.x,x),Y=Math.min(a.y,y),W=Math.abs(x-a.x),H=Math.abs(y-a.y);a.b.remove();if(W<12||H<12)return;
  const cv=a.w.querySelector('.cv'),k=cv.width/r.width,c=document.createElement('canvas');c.width=W*k;c.height=H*k;c.getContext('2d').drawImage(cv,X*k,Y*k,W*k,H*k,0,0,W*k,H*k);
  const id=Date.now(),d=doc();await idbSet('i'+id,c.toDataURL('image/jpeg',.85));(d.img=d.img||[]).push({id,t:S.area,pg:+a.w.dataset.pg+1});S.panel=S.area;S.area=null;save();render()})}
const pdfToggle=()=>{const d=doc();return d&&d.kind=='pdf'?`<button class="${S.pdfText?'on':''}" title="Testo estratto" onclick="A('pt')">${I('align-left')}</button>`:''};
function pdfSlot(d){if(d.kind!='pdf'||S.pdfText)return'';if(!PS[d.id]||PV.id!=d.id){if(!PV.loading){PV.loading=1;loadDoc(d.id).then(()=>{PV.loading=0;render()})}return'<div class="card empty" style="flex:1">Apertura del PDF…</div>'}return'<div id=pdfv></div>'}
function mountPdf(){const ph=document.getElementById('pdfv');if(!ph||!PV.el)return;PV.el.className='pdfv'+(S.area?' sel':'');ph.replaceWith(PV.el);PV.el.scrollTop=PV.top||0;fitPages();paintAll()}
function fitPages(){if(!PV.el||!PM||!PV.el.clientWidth)return;const sc=Math.min(3.5,Math.min(1.8,(PV.el.clientWidth-24)/Math.max(...PM.pages.map(p=>p.w)))*(PV.zoom||1));if(PV.scale&&Math.abs(sc-PV.scale)<.02)return;const rr=PV.scale?sc/PV.scale:1,st=PV.el.scrollTop,sl=PV.el.scrollLeft;PV.scale=sc;
 PV.shells.forEach((w,n)=>{const p=PM.pages[n];w.style.width=p.w*sc+'px';w.style.height=p.h*sc+'px';w.innerHTML='<canvas class=cv></canvas><div class=hl></div><div class=textLayer></div><canvas class=ov></canvas>';w.dataset.done='';PV.io.unobserve(w);PV.io.observe(w)});PV.el.scrollTop=st*rr;PV.el.scrollLeft=sl*rr;paintAll()}
async function drawPage(n){const w=PV.shells[n];if(!w||w.dataset.done)return;w.dataset.done=1;const pg=await PV.pdf.getPage(n+1),sc=PV.scale,dpr=Math.min(2,devicePixelRatio||1),vp=pg.getViewport({scale:sc*dpr}),cv=w.querySelector('.cv');if(!cv)return;cv.width=vp.width;cv.height=vp.height;
 await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;const tl=w.querySelector('.textLayer');if(!tl)return;tl.style.setProperty('--scale-factor',sc);tl.style.setProperty('--total-scale-factor',sc);
 new PJ.TextLayer({textContentSource:pg.streamTextContent(),container:tl,viewport:pg.getViewport({scale:sc})}).render()}
function rects(n,list){const out=[];for(const q of list)for(const[x,y,w,h,s,e]of PM.pages[n].items){if(e<=q.s||s>=q.e)continue;const a=Math.max(s,q.s),b=Math.min(e,q.e),L=e-s||1;out.push({x:x+w*(a-s)/L,y,w:w*(b-a)/L,h})}return out}
function paintAll(){if(!PV.el||!PM||!PV.scale)return;const d=doc(),L=d&&PS[d.id]&&sents(d);if(!L||!L.length)return;const cur=L[Math.min(S.i,L.length-1)],sel=S.gran=='par'?L.filter(x=>x.pi==cur.pi):[cur],sc=PV.scale,
 re=d.kw.length?new RegExp(d.kw.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gi'):null;
 PV.shells.forEach((w,n)=>{const p=PM.pages[n],ov=w.querySelector('.ov'),hl=w.querySelector('.hl');if(!ov)return;ov.width=p.w*sc;ov.height=p.h*sc;const g=ov.getContext('2d'),R=rects(n,sel.filter(x=>x.pg==n));
  if(S.focus){g.fillStyle='rgba(6,8,18,.8)';g.fillRect(0,0,ov.width,ov.height);R.forEach(r=>g.clearRect((r.x-4)*sc,(r.y-2)*sc,(r.w+8)*sc,(r.h+4)*sc))}else{g.fillStyle='rgba(120,140,255,.28)';R.forEach(r=>g.fillRect(r.x*sc,r.y*sc,r.w*sc,r.h*sc))}
  let h='';if(re){const ks=[];let m;re.lastIndex=0;while((m=re.exec(p.text)))ks.push({s:m.index,e:m.index+m[0].length});rects(n,ks).forEach(r=>h+=`<i style="left:${r.x*sc}px;top:${r.y*sc}px;width:${r.w*sc}px;height:${r.h*sc}px"></i>`)}hl.innerHTML=h});
 if(PV.sc){PV.sc=0;const k=PM.pages.findIndex((_,n)=>sel.some(x=>x.pg==n));if(k>=0){const r=rects(k,sel.filter(x=>x.pg==k))[0];if(r){const y=PV.shells[k].offsetTop+r.y*sc;if(y<PV.el.scrollTop+40||y>PV.el.scrollTop+PV.el.clientHeight-140)PV.el.scrollTo({top:y-PV.el.clientHeight*.35,behavior:'smooth'})}}}}
function pickSent(n,px,py){const L=sents(doc());for(const[x,y,w,h,s,e]of PM.pages[n].items){if(px>=x&&px<=x+w&&py>=y-2&&py<=y+h+2){const c=s+(px-x)/(w||1)*(e-s),k=L.findIndex(q=>q.pg==n&&c>=q.s&&c<=q.e);if(k>=0){S.i=k;save();render();return}}}}
/* ---- DOCX/PPTX, modifica/eliminazione, aree, zoom ---- */
const loadJs=src=>new Promise((ok,ko)=>{if(document.querySelector(`script[src="${src}"]`))return ok();const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>ko(new Error('Libreria non trovata'));document.head.append(s)});
async function readPptx(buf){await loadJs('vendor/jszip.min.js');const z=await JSZip.loadAsync(buf),out=[];
 for(const n of Object.keys(z.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>a.match(/\d+/)-b.match(/\d+/))){const x=new DOMParser().parseFromString(await z.files[n].async('string'),'application/xml');
  for(const p of x.getElementsByTagName('a:p'))out.push([...p.getElementsByTagName('a:t')].map(t=>t.textContent).join(''))}return out}
const acts=(t,k,ne)=>`<span class=acts>${ne?'':`<button onclick="event.stopPropagation();A('ed',['${t}',${k}])">${I('pencil')}</button>`}<button onclick="event.stopPropagation();A('rm',['${t}',${k}])">${I('trash-2')}</button></span>`;
function imgList(d,t){const pdf=d.kind=='pdf'&&!S.pdfText;return[pdf?`<button class="${S.area==t?'pri':''}" style="width:100%" onclick="A('area','${t}')">${I('maximize')}${S.area==t?'Trascina sulla pagina…':'Seleziona area'}</button>`:`<div class=mut>Disponibile nei PDF, nella vista pagine.</div>`,...(d.img||[]).filter(o=>o.t==t).map(o=>`<div class=item><img class=thumb data-i=${o.id}><div class=mut>pag. ${o.pg}</div>${acts('img',o.id,1)}</div>`)]}
async function fillImgs(){for(const im of document.querySelectorAll('img[data-i]'))idbGet('i'+im.dataset.i).then(u=>{if(u)im.src=u})}
function pdfZ(f){PV.zoom=Math.max(.6,Math.min(4,(PV.zoom||1)*f));fitPages()}
const pdfZoomBtns=d=>d.kind=='pdf'&&!S.pdfText?`<button onclick="pdfZ(.8)">${I('minus')}</button><button onclick="pdfZ(1.25)">${I('plus')}</button>`:'';
