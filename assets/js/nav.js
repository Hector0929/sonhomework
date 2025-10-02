// Navigation & view switching
export function initNavigation(win, doc){
  const g = win, d = doc;
  g.switchView = function(view){
    const order=['upload','recognition','transpose','export'];
    const idx = order.indexOf(view);
    if(idx<0){ console.warn('[switchView] unknown view', view); return; }
    const track = d.getElementById('flow-track');
    if(track){ ['upload-section','recognition-section','transpose-section','export-section'].forEach(id=>{ const el=d.getElementById(id); if(el && el.parentElement!==track) track.appendChild(el); }); }
    if(track){
      const container = d.getElementById('flow-container');
      const gapValue = 40;
      const pages = track.querySelectorAll('.flow-page');
      if(container && pages.length){
        const pageWidth = pages[0].getBoundingClientRect().width;
        const offset = idx * (pageWidth + gapValue);
        const centerAdjust = (container.clientWidth - pageWidth)/2;
        track.style.transform = `translateX(${-(offset - centerAdjust)}px)`;
      } else {
        track.style.transform = `translateX(-${idx*100}%)`;
      }
    }
    d.querySelectorAll('#app-tabs .tab-btn-modern').forEach(btn=>{
      const active = btn.getAttribute('data-view')===view;
      btn.setAttribute('aria-selected', active?'true':'false');
    });
    try{ localStorage.setItem('chordapp.activeView',view);}catch(_){ }
    if(view==='export'){
      try { win.refreshExportPreview && win.refreshExportPreview(); } catch(e){ console.warn('[switchView] refresh export fail', e); }
    }
  };
  d.querySelectorAll('#app-tabs .tab-btn-modern').forEach(btn=>{
    if(btn.__wired) return; btn.addEventListener('click',()=>{ const v=btn.getAttribute('data-view'); g.switchView(v); }); btn.__wired=true; });
  // restore
  (function(){
    let first='upload';
    try{ const last=localStorage.getItem('chordapp.activeView'); if(last) first=last; }catch(_){ }
    g.switchView(first);
  })();
  g.addEventListener('resize',()=>{ try{ const current = localStorage.getItem('chordapp.activeView')||'upload'; g.switchView(current);}catch(_){ } });
  g.addEventListener('keydown', (e)=>{
    if(e.altKey || e.metaKey || e.ctrlKey) return;
    const order=['upload','recognition','transpose','export'];
    const current = (localStorage.getItem('chordapp.activeView')||'upload');
    const idx = order.indexOf(current);
    if(e.key==='ArrowRight' && idx < order.length-1){ e.preventDefault(); g.switchView(order[idx+1]); }
    else if(e.key==='ArrowLeft' && idx>0){ e.preventDefault(); g.switchView(order[idx-1]); }
  });
}