/* focus.js: il focus parte dal primo elemento della pagina che stai guardando */
function visPage(){const h=PV.el.getBoundingClientRect();let best=0,bo=-1e9;PV.shells.forEach((w,n)=>{const r=w.getBoundingClientRect(),o=Math.min(r.bottom,h.bottom)-Math.max(r.top,h.top);if(o>bo){bo=o;best=n}});return best}
function firstOnPage(pg){const k=sents(doc()).findIndex(z=>z.pg>=pg);return k<0?0:k}
function focusVisible(){const d=doc(),L=sents(d),c=L[S.i];if(!c)return false;
 if(d.kind=='pdf'&&!S.pdfText&&PV.el&&PV.scale){const w=PV.shells[c.pg];if(!w)return false;const R=rects(c.pg,[c])[0];if(!R)return false;const wr=w.getBoundingClientRect(),h=PV.el.getBoundingClientRect(),y=wr.top+R.y*PV.scale;return y>=h.top-5&&y<=h.bottom-20}
 const el=document.querySelector('.pg .s.on');if(!el)return false;const r=el.getBoundingClientRect();return r.top>=60&&r.top<=innerHeight-90}
function anchorFocus(){const d=doc(),L=sents(d);if(!L.length)return;
 if(d.kind=='pdf'&&!S.pdfText&&PV.el&&PV.scale){S.i=firstOnPage(visPage());PV.sc=0;return}
 const e=[...document.querySelectorAll('.pg .s')].find(x=>{const r=x.getBoundingClientRect();return r.top>=64&&r.bottom<=innerHeight-90});if(e){let k=+e.dataset.k;if(S.gran=='par'&&L[k]){const pi=L[k].pi;k=L.findIndex(z=>z.pi==pi)}S.i=Math.max(0,k)}}
function focusGuard(){if(!S.focus||S.view!='read'||focusVisible())return false;anchorFocus();return true}
