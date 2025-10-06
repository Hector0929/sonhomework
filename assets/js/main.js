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
  try { initUpload(g,d); } catch(e){ console.warn('[initUpload] fail', e); }
  try { initRecognition(g,d); } catch(e){ console.warn('[initRecognition] fail', e); }
  try { initTranspose(g,d); } catch(e){ console.warn('[initTranspose] fail', e); }
  try { initExport(g,d); } catch(e){ console.warn('[initExport] fail', e); }
  try { initNavigation(g,d); } catch(e){ console.warn('[initNavigation] fail', e); }
})();