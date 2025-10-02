// Upload & preview
export function initUpload(win, doc){
  const d=doc,g=win;
  function syncPreview(file){
    const heroBox = d.getElementById('hero-preview');
    const uploadBox = d.getElementById('upload-preview-box');
    const empty1 = d.getElementById('upload-preview-empty');
    if(!file){
      empty1 && (empty1.style.display='');
      if(heroBox) heroBox.innerHTML = '<div class="hero__placeholder"><div style="font-size:46px;opacity:.12;">🎼</div><span>等待上傳樂譜影像</span></div>';
      if(uploadBox) uploadBox.innerHTML = '<div id="upload-preview-empty" style="text-align:center;color:var(--color-text-secondary);font-size:14px;"><div style="font-size:46px;opacity:.15;">🎼</div>尚未選擇檔案</div>';
      return;
    }
    const url = URL.createObjectURL(file);
    const imgHTML = file.type==='application/pdf'
      ? '<div style="text-align:center;color:var(--color-text-secondary);font-size:13px;">PDF 已選擇，稍後於辨識頁預覽第一頁。</div>'
      : `<img src="${url}" alt="preview" style="max-width:100%;height:auto;display:block;">`;
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