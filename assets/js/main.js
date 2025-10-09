import { initNavigation } from './nav.js';
import { initUpload } from './upload.js';
import { initRecognition } from './recognition.js';
import { initTranspose } from './transpose.js';
import { initExport } from './export.js';

// 初始化順序：上傳 -> 辨識 -> 移調 -> 匯出 -> 導覽 (導覽最後可正確計算寬度)
(function(){
  const d=document, g=window;
  // 全域共享文字狀態：單一真實來源（Single Source of Truth）
  if(!g.__CHORD_TEXT_STATE__){
    g.__CHORD_TEXT_STATE__ = { text: '', source: '', updatedAt: 0 };
  }
  g.getSharedText = function(){ return g.__CHORD_TEXT_STATE__?.text || ''; };
  g.setSharedText = function(text, source){
    try {
      g.__CHORD_TEXT_STATE__ = { text: String(text ?? ''), source: source || g.__CHORD_TEXT_STATE__.source || '', updatedAt: Date.now() };
    } catch(_){}
  };
  // 分頁進入回呼註冊點
  if(!g.__onEnterView){ g.__onEnterView = {}; }

  // 全域樣式套用：統一等寬/粗體偏好到三頁的 textarea / pre
  g.__applySharedTextStyle = function(){
    const d=document, g=window;
    try{
      const prefMono = localStorage.getItem('chordapp.pref.mono');
      const prefBold = localStorage.getItem('chordapp.pref.bold');
      const useMono = prefMono ? (prefMono==='1') : (document.getElementById('export-mono-toggle')?.checked !== false);
      const useBold = prefBold ? (prefBold==='1') : !!document.getElementById('export-bold-toggle')?.checked;
      const FONT_SANS = '"Microsoft JhengHei","微軟正黑體","Noto Sans TC","PingFang TC","Segoe UI",Arial,sans-serif';
      const FONT_MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';
      const apply = (el)=>{ if(!el) return; el.style.fontFamily = useMono?FONT_MONO:FONT_SANS; el.style.fontWeight = useBold?'700':'400'; };
      apply(document.getElementById('text-editor'));
      apply(document.getElementById('transpose-output'));
      apply(document.getElementById('export-preview-text'));
    }catch(_){ }
  };
  try { initUpload(g,d); } catch(e){ console.warn('[initUpload] fail', e); }
  try { initRecognition(g,d); } catch(e){ console.warn('[initRecognition] fail', e); }
  try { initTranspose(g,d); } catch(e){ console.warn('[initTranspose] fail', e); }
  try { initExport(g,d); } catch(e){ console.warn('[initExport] fail', e); }
  try { initNavigation(g,d); } catch(e){ console.warn('[initNavigation] fail', e); }
})();