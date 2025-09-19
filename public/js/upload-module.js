(function(){
  if (window.UploadModule) return; // 避免重複載入

  const DEFAULTS = {
    input: '#file-input',
    dropArea: '#drop-area',
    previewArea: '#file-preview-area',
    previewContainer: '#file-preview-container',
    fileName: '#file-name',
    fileSize: '#file-size',
    recognizeBtn: '#recognize-btn'
  };

  function formatSize(bytes){
    if(!bytes && bytes !== 0) return '';
    const units=['B','KB','MB','GB'];
    let i=0, n=bytes;
    while(n>=1024 && i<units.length-1){ n/=1024; i++; }
    return n.toFixed(n<10&&i>0?2:0)+units[i];
  }

  function init(options={}){
    const cfg = { ...DEFAULTS, ...(options||{}) };
    const els = Object.fromEntries(Object.entries(cfg).map(([k,sel])=>[k, document.querySelector(sel)]));
    if(!els.input) return { error:'input not found', destroy(){}, config:cfg };

    window.AppState = window.AppState || { rawURL:null, preURL:null, tokens:[] };

    function clearPreview(){
      if(els.previewContainer) els.previewContainer.innerHTML='';
      if(els.previewArea) els.previewArea.classList.add('hidden');
      if(els.fileName) els.fileName.textContent='未選擇檔案';
      if(els.fileSize) els.fileSize.textContent='';
      if(els.recognizeBtn){ els.recognizeBtn.disabled=true; }
      window.AppState.rawURL=null;
    }

    function handleFiles(fileList){
      const file = fileList && fileList[0];
      if(!file){ clearPreview(); return; }
      if(els.fileName) els.fileName.textContent=file.name;
      if(els.fileSize) els.fileSize.textContent=formatSize(file.size);
      const reader = new FileReader();
      reader.onload = (e)=>{
        const url = e.target.result;
        window.AppState.rawURL = url;
        if(els.previewContainer){
          els.previewContainer.innerHTML='';
          const img=document.createElement('img');
          img.alt='預覽';
            img.style.maxWidth='100%';
          img.src=url;
          els.previewContainer.appendChild(img);
        }
        if(els.previewArea) els.previewArea.classList.remove('hidden');
        if(els.recognizeBtn) els.recognizeBtn.disabled=false;
        document.dispatchEvent(new CustomEvent('upload:ready', { detail:{ file, dataURL:url }}));
      };
      reader.readAsDataURL(file);
    }

    function onChange(e){
      handleFiles(e.target.files);
    }

    els.input.addEventListener('change', onChange);

    // 點擊 dropArea 代理 input
    if(els.dropArea){
      els.dropArea.addEventListener('click', ()=> els.input && els.input.click());
      // 拖曳支援
      ['dragenter','dragover'].forEach(ev=> els.dropArea.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); els.dropArea.classList.add('dragging'); }));
      ['dragleave','drop'].forEach(ev=> els.dropArea.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); els.dropArea.classList.remove('dragging'); }));
      els.dropArea.addEventListener('drop', e=>{
        const dt = e.dataTransfer;
        if(dt && dt.files && dt.files.length){ handleFiles(dt.files); }
      });
    }

    const controller = {
      config: cfg,
      elements: els,
      clear: clearPreview,
      simulateFile(file){ handleFiles([file]); }, // 測試用
      destroy(){
        els.input && els.input.removeEventListener('change', onChange);
        if(els.dropArea){
          els.dropArea.replaceWith(els.dropArea.cloneNode(true)); // 粗略移除所有監聽
        }
      }
    };

    return controller;
  }

  function autoInit(){
    if(autoInit._done) return;
    autoInit._done = true;
    const ctrl = init();
    window.UploadModule.controller = ctrl;
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(autoInit,0));
  } else {
    setTimeout(autoInit,0);
  }

  window.UploadModule = { init, autoInit };
})();

