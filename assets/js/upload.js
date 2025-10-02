// Upload & preview
export function initUpload(win, doc){
  const d=doc,g=win;
  async function renderPdfFirstPage(file){
    try {
      // 動態載入 PDF.js (使用 CDN 免安裝)；若未連網會 fallback 文字提示
      const base = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67';
      const pdfjsUrl = base + '/pdf.min.mjs';
      const workerUrl = base + '/pdf.worker.min.mjs';
      const pdfjs = await import(/* @vite-ignore */ pdfjsUrl);
      // 設定 workerSrc 避免 "No GlobalWorkerOptions.workerSrc" 錯誤
      try { if(pdfjs?.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = workerUrl; } catch(_) {}
      const pdfData = await file.arrayBuffer();
      let pdf;
      try {
        pdf = await pdfjs.getDocument({ data: pdfData }).promise;
      } catch(firstErr){
        // 若 worker 仍失敗，嘗試退回不使用 worker 的模式
        try {
          if(pdfjs?.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = '';
          pdf = await pdfjs.getDocument({ data: pdfData, useWorkerFetch:false }).promise;
        } catch(secondErr){ throw firstErr; }
      }
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/png');
    } catch (err){
      console.warn('[PDF 預覽失敗]', err);
      return null;
    }
  }
  async function syncPreview(file){
    const heroBox = d.getElementById('hero-preview');
    const uploadBox = d.getElementById('upload-preview-box');
    const empty1 = d.getElementById('upload-preview-empty');
    if(!file){
      empty1 && (empty1.style.display='');
      if(heroBox) heroBox.innerHTML = '<div class="hero__placeholder"><div style="font-size:46px;opacity:.12;">🎼</div><span>等待上傳樂譜影像</span></div>';
      if(uploadBox) uploadBox.innerHTML = '<div id="upload-preview-empty" style="text-align:center;color:var(--color-text-secondary);font-size:14px;"><div style="font-size:46px;opacity:.15;">🎼</div>尚未選擇檔案</div>';
      return;
    }
    let imgHTML = '';
    if(file.type==='application/pdf'){
      if(heroBox) heroBox.innerHTML = '<div style="padding:24px;text-align:center;font-size:13px;color:var(--color-text-secondary);">PDF 載入中...</div>';
      if(uploadBox) uploadBox.innerHTML = '<div style="padding:24px;text-align:center;font-size:13px;color:var(--color-text-secondary);">PDF 載入中...</div>';
      const dataUrl = await renderPdfFirstPage(file);
      if(dataUrl){
        imgHTML = `<img src="${dataUrl}" alt="pdf page 1" style="max-width:100%;height:auto;display:block;">`;
        g.__PDF_FIRST_PAGE_DATAURL__ = dataUrl;
      } else {
        imgHTML = '<div style="text-align:center;color:var(--color-text-secondary);font-size:13px;">PDF 預覽失敗，將於辨識時直接上傳原檔。</div>';
      }
    } else {
      const url = URL.createObjectURL(file);
      imgHTML = `<img src="${url}" alt="preview" style="max-width:100%;height:auto;display:block;">`;
    }
    if(heroBox){ heroBox.innerHTML = `<div style="padding:12px;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${imgHTML}</div>`; }
    if(uploadBox){ uploadBox.innerHTML = `<div style="width:100%;">${imgHTML}</div>`; }
  }
  function enableRecognize(enable){
    const btns=[ 'recognize-btn','recognize-btn-secondary','recognize-ai-btn' ].map(id=>d.getElementById(id)).filter(Boolean);
    btns.forEach(b=>{ b.disabled=!enable; if(!enable) b.setAttribute('disabled',''); else b.removeAttribute('disabled'); });
  }
  const fi=d.getElementById('file-input');
  if(fi && !fi.__wired){
  fi.addEventListener('change',()=>{ const f=fi.files && fi.files[0]; syncPreview(f); enableRecognize(!!f); });
    fi.__wired=true;
  }
  if(fi && fi.files && fi.files[0]){ syncPreview(fi.files[0]); enableRecognize(true); }
  g.__syncPreview = syncPreview; // debug / reuse
}