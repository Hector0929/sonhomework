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
  const pages = Array.from(track.querySelectorAll('.flow-page'));
  pages.forEach((p,i)=>{ if(i===idx) p.setAttribute('data-active','true'); else p.removeAttribute('data-active'); });
      if(container && pages.length){
        const target = pages[idx];
        // 目標頁面中心位置 - 容器中心位置
        const containerWidth = container.clientWidth;
        const targetMid = target.offsetLeft + target.offsetWidth/2;
        // track 左邊 padding 會反映在 offsetLeft，因此直接用差值即可
        const translate = (containerWidth/2) - targetMid;
        track.style.transform = `translateX(${translate}px)`;
      } else {
        track.style.transform = `translateX(-${idx*100}%)`;
      }
    }
    d.querySelectorAll('#app-tabs .tab-btn-modern').forEach(btn=>{
      const active = btn.getAttribute('data-view')===view;
      btn.setAttribute('aria-selected', active?'true':'false');
    });
    try{ localStorage.setItem('chordapp.activeView',view);}catch(_){ }
    // 觸發該頁的進入鉤子（用於同步共享內容）
    try{ if(g.__onEnterView && typeof g.__onEnterView[view]==='function'){ g.__onEnterView[view](); } }catch(_){ }
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
    // 新規則：必須按住 Shift + 左右 才切換頁面；單純左右讓給文字編輯區
    if(e.altKey || e.metaKey || e.ctrlKey) return;
    if(!(e.shiftKey && (e.key==='ArrowLeft' || e.key==='ArrowRight'))) return;
    // 若焦點在可編輯輸入框，且沒有 Shift 則不攔截（上面已 return）；有 Shift 則允許切換
    const activeEl = doc.activeElement;
    if(activeEl && /^(INPUT|TEXTAREA)$/i.test(activeEl.tagName) && !e.shiftKey) return;
    const order=['upload','recognition','transpose','export'];
    const current = (localStorage.getItem('chordapp.activeView')||'upload');
    const idx = order.indexOf(current);
    if(e.key==='ArrowRight' && idx < order.length-1){ e.preventDefault(); g.switchView(order[idx+1]); }
    else if(e.key==='ArrowLeft' && idx>0){ e.preventDefault(); g.switchView(order[idx-1]); }
  });
}