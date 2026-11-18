/* Sincronizzazione con Google Drive (cartella riservata dell'app, scope drive.appdata) */
const GK=()=>({id:localStorage.getItem('studio.gcid')||'',sec:localStorage.getItem('studio.gsec')||''});
const GT={get:()=>JSON.parse(localStorage.getItem('studio.gtok')||'null'),set:t=>localStorage.setItem('studio.gtok',JSON.stringify(t)),clear:()=>localStorage.removeItem('studio.gtok')};
const REDIR='http://localhost:8600/api/drive-sync/oauth-callback',SCOPE='https://www.googleapis.com/auth/drive.appdata',DR='https://www.googleapis.com/drive/v3',UP='https://www.googleapis.com/upload/drive/v3';
const SYNC={busy:false};
function markMod(){if(S.view=='read'&&S.cur){const d=S.docs.find(o=>o.id==S.cur);if(d)d.mod=Date.now()}}
async function tokenReq(p){const k=GK(),r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:k.id,client_secret:k.sec,...p})}),j=await r.json();if(!r.ok)throw new Error(j.error_description||j.error||'Errore '+r.status);return j}
async function gAuth(){const k=GK();if(!k.id||!k.sec)throw new Error('Inserisci ID client e segreto del client.');const T=window.__TAURI__;if(!T||!T.core)throw new Error("L'accesso funziona solo nell'app, non nel browser.");
 const state=Math.random().toString(36).slice(2),wait=T.core.invoke('oauth_wait',{port:8600,path:'/api/drive-sync/oauth-callback'});
 const url='https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:k.id,redirect_uri:REDIR,response_type:'code',scope:SCOPE,access_type:'offline',prompt:'consent',state});
 if(!(T.opener&&T.opener.openUrl))throw new Error('Impossibile aprire il browser.');await T.opener.openUrl(url);
 const line=await wait,q=new URLSearchParams(((line.split(' ')[1]||'').split('?')[1])||'');if(q.get('error'))throw new Error('Accesso negato: '+q.get('error'));if(q.get('state')!==state||!q.get('code'))throw new Error('Risposta di Google non valida.');
 const tk=await tokenReq({code:q.get('code'),redirect_uri:REDIR,grant_type:'authorization_code'});if(!tk.refresh_token)throw new Error('Google non ha restituito il permesso di accesso continuo: riprova.');GT.set({refresh:tk.refresh_token,access:tk.access_token,exp:Date.now()+tk.expires_in*1000-60000})}
async function gTok(){const t=GT.get();if(!t)throw new Error("Non hai effettuato l'accesso.");if(Date.now()<t.exp)return t.access;const j=await tokenReq({refresh_token:t.refresh,grant_type:'refresh_token'});GT.set({refresh:t.refresh,access:j.access_token,exp:Date.now()+j.expires_in*1000-60000});return j.access_token}
async function gapi(url,o={}){const r=await fetch(url,{...o,headers:{Authorization:'Bearer '+await gTok(),...(o.headers||{})}});if(!r.ok)throw new Error('Drive '+r.status+': '+(await r.text()).slice(0,160));return r}
async function dList(){const out=[];let pt='';do{const j=await(await gapi(`${DR}/files?spaces=appDataFolder&pageSize=200&fields=nextPageToken,files(id,name,modifiedTime)${pt?'&pageToken='+pt:''}`)).json();out.push(...j.files);pt=j.nextPageToken}while(pt);return out}
async function dPut(name,data,type,id){const b='stb'+Math.random().toString(36).slice(2),enc=new TextEncoder(),meta=id?{}:{name,parents:['appDataFolder']},
 body=new Blob([enc.encode(`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${type}\r\n\r\n`),data,enc.encode(`\r\n--${b}--`)]);
 return(await(await gapi(`${UP}/files${id?'/'+id:''}?uploadType=multipart&fields=id`,{method:id?'PATCH':'POST',headers:{'Content-Type':`multipart/related; boundary=${b}`},body})).json()).id}
const dGet=async id=>(await gapi(`${DR}/files/${id}?alt=media`)).arrayBuffer(),dDel=async id=>{await gapi(`${DR}/files/${id}`,{method:'DELETE'})};
const snapshot=()=>({ver:1,docs:S.docs.map(d=>d.kind=='pdf'?{...d,paras:undefined,missing:undefined}:d),decks:S.decks,cols:S.cols||[],del:S.del||[]});
const hsh=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return s.length+':'+h};
function mergeQ(base,other){const m=new Map((other.q||[]).map(q=>[q.id,q]));return{...base,q:(base.q||[]).map(q=>{const o=m.get(q.id);return o&&(o.lm||0)>(q.lm||0)?o:q})}}
function mergeRemote(R){let ch=false;const del=new Map();[...(S.del||[]),...(R.del||[])].forEach(x=>del.set(x.id,Math.max(del.get(x.id)||0,x.t)));S.del=[...del].map(([id,t])=>({id,t}));
 const before=S.docs.length;S.docs=S.docs.filter(d=>!(del.has(d.id)&&del.get(d.id)>=(d.mod||0)));if(S.docs.length!==before)ch=true;
 for(const rd of R.docs||[]){if(del.has(rd.id)&&del.get(rd.id)>=(rd.mod||0))continue;const i=S.docs.findIndex(d=>d.id==rd.id);
  if(i<0){S.docs.push({...rd,paras:rd.paras||[]});ch=true;continue}const ld=S.docs[i];if((rd.mod||0)>(ld.mod||0)){const mg=mergeQ(rd,ld);mg.paras=ld.paras&&ld.paras.length?ld.paras:(rd.paras||[]);S.docs[i]=mg;ch=true}else if((rd.mod||0)<(ld.mod||0)){const mg=mergeQ(ld,rd);if(JSON.stringify(mg.q)!==JSON.stringify(ld.q)){S.docs[i]=mg;ch=true}}}
 const dd=S.decks.length;S.decks=S.decks.filter(k=>!(del.has(k.id)&&del.get(k.id)>=(k.mod||0)));if(S.decks.length!==dd)ch=true;
 for(const rk of R.decks||[]){if(del.has(rk.id)&&del.get(rk.id)>=(rk.mod||0))continue;const i=S.decks.findIndex(k=>k.id==rk.id);if(i<0){S.decks.push(rk);ch=true}else if((rk.mod||0)>(S.decks[i].mod||0)){S.decks[i]=rk;ch=true}}const cc=S.cols.length;S.cols=S.cols.filter(k=>!(del.has(k.id)&&del.get(k.id)>=(k.mod||0)));if(S.cols.length!==cc)ch=true;for(const rk of R.cols||[]){if(del.has(rk.id)&&del.get(rk.id)>=(rk.mod||0))continue;const i=S.cols.findIndex(k=>k.id==rk.id);if(i<0){S.cols.push(rk);ch=true}else if((rk.mod||0)>(S.cols[i].mod||0)){S.cols[i]=rk;ch=true}}return ch}
async function pullPdf(d,f){const buf=await dGet(f.id),r=await readPdf(buf,d.title);await idbSet('f'+d.id,buf);await idbSet('m'+d.id,r.model);if(r.thumb)await idbSet('t'+d.id,r.thumb);d.paras=r.paras;d.pages=r.pages;d.missing=false;if(PV.id==d.id){PV.id=null}delete PS[d.id];delete PL[d.id]}
async function syncNow(manual){if(SYNC.busy)return;SYNC.busy=true;const msg=t=>{S.syncmsg=t;if(S.modal=='sync')render()};msg('Sincronizzazione in corso…');
 try{const files=await dList(),by=n=>files.find(f=>f.name==n),sf=by('state.json');let ch=false;
  if(sf){const R=JSON.parse(new TextDecoder().decode(await dGet(sf.id)));ch=mergeRemote(R)}
  for(const d of S.docs.filter(x=>x.kind=='pdf')){const has=await idbGet('f'+d.id),rf=by('pdf-'+d.id+'.pdf');
   if(!has&&rf){msg('Scarico «'+d.title+'»…');await pullPdf(d,rf);ch=true}else if(has&&!rf){msg('Carico «'+d.title+'»…');await dPut('pdf-'+d.id+'.pdf',new Blob([has]),'application/pdf')}}
  for(const x of S.del||[]){const rf=by('pdf-'+x.id+'.pdf');if(rf)await dDel(rf.id)}
  const js=JSON.stringify(snapshot()),h=hsh(js);if(!sf||h!==localStorage.getItem('studio.gh')){await dPut('state.json',new Blob([js]),'application/json',sf&&sf.id);localStorage.setItem('studio.gh',h)}
  localStorage.setItem('studio.gsync',Date.now());msg('Sincronizzato.');if(ch){READY&&flush();render()}
 }catch(e){msg('Errore: '+e.message)}SYNC.busy=false;if(S.modal=='sync')render()}
let SST=0;function syncSoon(){if(!GT.get())return;clearTimeout(SST);SST=setTimeout(()=>syncNow(false),45000)}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&GT.get())syncNow(false)});
setTimeout(()=>{if(GT.get())syncNow(false)},5000);
function syncKeys(){const a=document.getElementById('gci'),b=document.getElementById('gcs');if(a)localStorage.setItem('studio.gcid',a.value.trim());if(b)localStorage.setItem('studio.gsec',b.value.trim())}
async function syncLogin(){syncKeys();S.syncmsg='Si apre il browser: accedi e consenti l\'accesso, poi torna qui…';render();try{await gAuth();S.syncmsg='Accesso riuscito.';render();await syncNow(true)}catch(e){S.syncmsg='Errore: '+e.message;render()}}
function syncOut(){GT.clear();localStorage.removeItem('studio.gh');S.syncmsg='Disconnesso. I dati su Drive restano.';render()}
function modalSync(){if(S.modal!='sync')return'';const k=GK(),t=GT.get(),last=+localStorage.getItem('studio.gsync')||0;
 return`<div class=ov onclick="A('close')"></div><div class=modal><h2>Sincronizzazione Drive</h2><div class="mono mut">${t?'Collegato a Google':'Non collegato'}${last?' · ultimo: '+new Date(last).toLocaleString('it-IT'):''}</div>${S.syncmsg?`<p>${esc(S.syncmsg)}</p>`:''}<div class=lab style="margin-top:12px">ID client</div><input id=gci value="${esc(k.id)}" placeholder="…apps.googleusercontent.com"><div class=lab>Segreto del client</div><input id=gcs type=password value="${esc(k.sec)}"><p class=mut>Usa lo stesso client di NutriEvolution (Google Cloud Console → API e servizi → Credenziali). Indirizzo di ritorno usato: http://localhost:8600/api/drive-sync/oauth-callback. Su PC chiudi NutriEvolution mentre accedi. Studio vede solo la propria cartella riservata su Drive; ID e segreto restano su questo dispositivo.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class=pri onclick="syncLogin()">Accedi con Google</button>${t?`<button onclick="syncKeys();syncNow(true)">Sincronizza ora</button><button onclick="syncOut()">Esci</button>`:''}<button onclick="syncKeys();A('close')">Chiudi</button></div></div>`}
