// Export + preflight stats
export function initExport(win, doc){
  const g=win,d=doc;
  const FONT_FAMILY = '"Microsoft JhengHei","微軟正黑體","Noto Sans TC","PingFang TC","Segoe UI",Arial,sans-serif';
  const FONT_SANS = '"Microsoft JhengHei","微軟正黑體","Noto Sans TC","PingFang TC","Segoe UI",Arial,sans-serif';
  const FONT_MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';
  function ensureExportLibs(){
    if(!g.html2canvas){ const s=d.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; d.head.appendChild(s); }
    if(!g.jspdf){ const s2=d.createElement('script'); s2.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'; d.head.appendChild(s2); }
  }
  function gatherCurrentContent(){
    // 忠實保留原文空白，不做 trim
    try{ const shared = win.getSharedText ? win.getSharedText() : ''; if(shared !== undefined && shared !== null && shared !== '') return shared; }catch(_){ }
    const transOut=d.getElementById('transpose-output')?.value;
    const editor=d.getElementById('text-editor')?.value;
    const raw=d.getElementById('recognize-output')?.textContent;
    return (transOut ?? editor ?? raw ?? '');
  }
  g.refreshExportPreview=function(){
    const box=d.getElementById('export-preview-text');
    if(box){ box.value=gatherCurrentContent(); }
    // 檢視區統一字型與粗細
    try{
      // 套用共享樣式，保持與移調頁一致
      if(typeof g.__applySharedTextStyle === 'function') g.__applySharedTextStyle();
    }catch(_){ }
    try {
      const txt = box ? box.value : '';
      const lines = txt.split(/\n/).length;
      const chars = txt.length;
      const chordMatches = txt.match(/\b([A-G](?:#|b)?(?:m|maj7|maj|dim|aug|sus2|sus4|add9|m7|7|m9|9|m6|6|dim7)?(?:\/[A-G](?:#|b)?)?)\b/g) || [];
      const estPages = Math.max(1, Math.ceil(lines / 60));
      const infoEl = d.getElementById('export-info');
      if(infoEl){ infoEl.innerHTML = `字元數: ${chars} | 行數: ${lines} | 偵測和弦: ${chordMatches.length} | 預估 PDF 頁數: ${estPages}`; }
    } catch(err){ console.warn('[export preflight] fail', err); }
    ensureExportLibs();
  };
  const refreshBtn=d.getElementById('export-refresh'); refreshBtn && !refreshBtn.__wired && (refreshBtn.addEventListener('click',g.refreshExportPreview), refreshBtn.__wired=true);
  function createExportWrap(text){
    const pre=d.createElement('pre');
    pre.textContent=text;
    pre.style.margin='0';
    pre.style.whiteSpace='pre';
    pre.style.tabSize='4';
  const useMono = d.getElementById('export-mono-toggle')?.checked !== false;
  pre.style.fontFamily = useMono ? FONT_MONO : FONT_SANS;
    pre.style.fontSize = '14px';
    pre.style.lineHeight = '1.55';
    const bold = !!d.getElementById('export-bold-toggle')?.checked;
    pre.style.fontWeight = bold ? '700' : '400';
    const wrap=d.createElement('div');
    // 使匯出寬度與預覽框一致，避免因寬度不同導致換行或視覺差異
    const previewEl = d.getElementById('export-preview-text');
    const w = previewEl ? Math.max(1, previewEl.clientWidth) : 860;
    wrap.style.position='fixed';wrap.style.left='-9999px';wrap.style.top='0';wrap.style.width=w+'px';wrap.style.padding='32px';wrap.style.background='#fff';wrap.style.boxSizing='border-box';
    wrap.appendChild(pre); return wrap; }
  const dlPng=d.getElementById('export-download-png');
  dlPng && !dlPng.__wired && (dlPng.addEventListener('click', async ()=>{ g.refreshExportPreview(); await new Promise(r=>setTimeout(r,50)); if(!g.html2canvas){alert('html2canvas 載入中，稍後再試');return;} const txt=d.getElementById('export-preview-text'); const wrap=createExportWrap(txt.value); d.body.appendChild(wrap); const canvas=await g.html2canvas(wrap,{scale:2,backgroundColor:'#ffffff'}); d.body.removeChild(wrap); const a=d.createElement('a'); const title=(d.getElementById('song-title')?.value||'chords').replace(/\s+/g,'_'); const key=(d.getElementById('to-key')?.value||d.getElementById('from-key')?.value||'C'); a.href=canvas.toDataURL('image/png'); a.download=`${title}_${key}_export.png`; a.click(); }), dlPng.__wired=true);
  // 下載 JPG（以 JPEG 匯出，忠實保留排版）
  const dlJpg=d.getElementById('export-download-jpg');
  dlJpg && !dlJpg.__wired && (dlJpg.addEventListener('click', async ()=>{ g.refreshExportPreview(); await new Promise(r=>setTimeout(r,50)); if(!g.html2canvas){alert('html2canvas 載入中，稍後再試');return;} const txt=d.getElementById('export-preview-text'); const wrap=createExportWrap(txt.value); d.body.appendChild(wrap); const canvas=await g.html2canvas(wrap,{scale:2,backgroundColor:'#ffffff'}); d.body.removeChild(wrap); const a=d.createElement('a'); const title=(d.getElementById('song-title')?.value||'chords').replace(/\s+/g,'_'); const key=(d.getElementById('to-key')?.value||d.getElementById('from-key')?.value||'C'); a.href=canvas.toDataURL('image/jpeg',0.95); a.download=`${title}_${key}_export.jpg`; a.click(); }), dlJpg.__wired=true);
  const dlPdf=d.getElementById('export-download-pdf');
  dlPdf && !dlPdf.__wired && (dlPdf.addEventListener('click', async ()=>{ g.refreshExportPreview(); await new Promise(r=>setTimeout(r,50)); if(!g.jspdf || !g.html2canvas){alert('匯出函式庫載入中，稍後再試');return;} const { jsPDF }=g.jspdf; const txtEl=d.getElementById('export-preview-text'); const wrap=createExportWrap(txtEl.value); d.body.appendChild(wrap); const canvas=await g.html2canvas(wrap,{scale:2,backgroundColor:'#ffffff'}); d.body.removeChild(wrap); const pdf=new jsPDF({unit:'pt',format:'a4'}); const pageWidth=pdf.internal.pageSize.getWidth(); const margin=40; const imgWidth=pageWidth-margin*2; const imgHeight=canvas.height * (imgWidth/canvas.width); const sliceHeight=pdf.internal.pageSize.getHeight() - margin*2; if(imgHeight <= sliceHeight){ pdf.addImage(canvas.toDataURL('image/png'),'PNG',margin,margin,imgWidth,imgHeight); } else { let position=0; while(position < canvas.height){ const pageCanvas=d.createElement('canvas'); pageCanvas.width=canvas.width; const slicePx=Math.min(canvas.height-position, Math.floor(sliceHeight*(canvas.width/imgWidth))); pageCanvas.height=slicePx; const ctx=pageCanvas.getContext('2d'); ctx.drawImage(canvas,0,position,canvas.width,slicePx,0,0,canvas.width,slicePx); const pageImg=pageCanvas.toDataURL('image/png'); if(position>0) pdf.addPage(); pdf.addImage(pageImg,'PNG',margin,margin,imgWidth,slicePx*(imgWidth/canvas.width)); position+=slicePx; } } const title=(d.getElementById('song-title')?.value||'chords').replace(/\s+/g,'_'); const key=(d.getElementById('to-key')?.value||d.getElementById('from-key')?.value||'C'); pdf.save(`${title}_${key}_export.pdf`); }), dlPdf.__wired=true);

  // 匯出預覽輸入同步：使用者若在匯出頁手動排版，寫回 shared state
  try{
    const box=d.getElementById('export-preview-text');
    if(box && !box.__wired){
      box.addEventListener('input', ()=>{ try{ win.setSharedText && win.setSharedText(box.value, 'export-edit'); }catch(_){ } });
      box.__wired=true;
    }
  }catch(_){ }

  // 監聽樣式切換並保存偏好，廣播套用到其他頁
  try{
    const mono = d.getElementById('export-mono-toggle');
    const bold = d.getElementById('export-bold-toggle');
    const saveAndApply = ()=>{
      try{
        if(mono) localStorage.setItem('chordapp.pref.mono', mono.checked ? '1' : '0');
        if(bold) localStorage.setItem('chordapp.pref.bold', bold.checked ? '1' : '0');
      }catch(_){ }
      if(typeof g.__applySharedTextStyle === 'function') g.__applySharedTextStyle();
    };
    if(mono && !mono.__wired){ mono.addEventListener('change', saveAndApply); mono.__wired=true; }
    if(bold && !bold.__wired){ bold.addEventListener('change', saveAndApply); bold.__wired=true; }
    // 初始時依照偏好設定切到正確狀態
    try{
      const prefMono = localStorage.getItem('chordapp.pref.mono');
      const prefBold = localStorage.getItem('chordapp.pref.bold');
      if(mono && (prefMono=== '0' || prefMono === '1')) mono.checked = (prefMono==='1');
      if(bold && (prefBold=== '0' || prefBold === '1')) bold.checked = (prefBold==='1');
      if(typeof g.__applySharedTextStyle === 'function') g.__applySharedTextStyle();
    }catch(_){ }
  }catch(_){ }

  // 註冊分頁進入鉤子：當切到 export 時回填共享內容
  try{
    if(g.__onEnterView){
      g.__onEnterView.export = function(){ g.refreshExportPreview && g.refreshExportPreview(); };
    }
  }catch(_){ }
}