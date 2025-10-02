import { initNavigation } from './nav.js';
import { initUpload } from './upload.js';
import { initRecognition } from './recognition.js';
import { initTranspose } from './transpose.js';
import { initExport } from './export.js';

// 初始化順序：上傳 -> 辨識 -> 移調 -> 匯出 -> 導覽 (導覽最後可正確計算寬度)
(function(){
  const d=document, g=window;
  try { initUpload(g,d); } catch(e){ console.warn('[initUpload] fail', e); }
  try { initRecognition(g,d); } catch(e){ console.warn('[initRecognition] fail', e); }
  try { initTranspose(g,d); } catch(e){ console.warn('[initTranspose] fail', e); }
  try { initExport(g,d); } catch(e){ console.warn('[initExport] fail', e); }
  try { initNavigation(g,d); } catch(e){ console.warn('[initNavigation] fail', e); }
})();