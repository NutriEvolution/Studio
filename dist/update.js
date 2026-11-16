const APPV=()=>window.__TAURI__&&window.__TAURI__.app&&window.__TAURI__.app.getVersion?window.__TAURI__.app.getVersion():Promise.resolve(window.APP_VERSION||'0.0.0');
const vcmp=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0};
let UPD=null;
async function checkUpdate(manual){try{const cur=await APPV(),last=+localStorage.getItem('studio.updchk')||0;if(!manual&&Date.now()-last<6*3600e3)return;localStorage.setItem('studio.updchk',Date.now());
 const r=await fetch('https://api.github.com/repos/NutriEvolution/Studio/releases/latest',{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error('GitHub ha risposto '+r.status);const j=await r.json(),v=(j.tag_name||'').replace(/^v/,'');
 if(v&&vcmp(v,cur)>0){const apk=/Android/i.test(navigator.userAgent),a=(j.assets||[]).find(x=>apk?/\.apk$/i.test(x.name):/setup\.exe$/i.test(x.name))||(j.assets||[])[0];if(!manual&&localStorage.getItem('studio.updskip')==v)return;UPD={v,cur,url:a?a.browser_download_url:j.html_url};render()}
 else if(manual)await tell('Sei aggiornato: versione '+cur+'.')}catch(e){if(manual)await tell('Impossibile controllare gli aggiornamenti: '+e.message)}}
const updBanner=()=>UPD?`<section class=upd><div><span class="tag hi">Aggiornamento</span><div style="margin-top:6px"><b>Versione ${UPD.v}</b> disponibile <span class="mono mut">(hai la ${UPD.cur})</span></div></div><div style="display:flex;gap:8px"><button onclick="updSkip()">Più tardi</button><button class=pri onclick="updGo()">${I('download')}Scarica</button></div></section>`:'';
function updGo(){const u=UPD.url,o=window.__TAURI__&&window.__TAURI__.opener;if(o&&o.openUrl)o.openUrl(u);else window.open(u,'_blank')}
function updSkip(){localStorage.setItem('studio.updskip',UPD.v);UPD=null;render()}
setTimeout(()=>checkUpdate(false),2500);
