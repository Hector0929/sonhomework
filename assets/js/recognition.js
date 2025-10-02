// AI recognition & text editing
export function initRecognition(win, doc){
  const g=win,d=doc;
  const fi = d.getElementById('file-input');
  const apiKeyInput = d.getElementById('api-key');
  const aliasKey = d.getElementById('gemini-api-key');
  const showKeyChk = d.getElementById('show-key');
  const detectedKeyInput = d.getElementById('detected-key');
  const origImgBox = d.getElementById('recognition-original');

  // toggle key visibility
  if(showKeyChk && apiKeyInput && !showKeyChk.__wired){
    showKeyChk.addEventListener('change',()=>{ apiKeyInput.type = showKeyChk.checked ? 'text':'password'; });
    showKeyChk.__wired = true;
  }
  // alias sync
  apiKeyInput && apiKeyInput.addEventListener('input',()=>{ if(aliasKey) aliasKey.value = apiKeyInput.value; });
  aliasKey && aliasKey.addEventListener('input',()=>{ if(apiKeyInput) apiKeyInput.value = aliasKey.value; });

  function formatDisplay(raw){
    return String(raw).split('\n').map(line=>{ if(/\|/.test(line) && /[A-G][#b]?/.test(line)) return line; return line.replace(/\|/g,''); }).join('\n');
  }
  function parseMetadataFromText(text){
    const meta={title:'',key:'',content:text};
    const blockMatch = text.match(/```json[\s\S]*?({[\s\S]*?})\s*```/i);
    if(blockMatch){ try { const obj=JSON.parse(blockMatch[1]); meta.title=obj.title||''; meta.key=obj.key||''; meta.content=obj.content||text; return meta; } catch{ } }
    const titleLine = text.split(/\n/).find(l=>/title\s*[:：]/i.test(l))||''; const mTitle=titleLine.match(/title\s*[:：]\s*(.+)/i); if(mTitle) meta.title=mTitle[1].trim();
    const keyLine = text.split(/\n/).find(l=>/key\s*[:：]/i.test(l))||''; const mKey=keyLine.match(/key\s*[:：]\s*([A-G][#b]?)/i); if(mKey) meta.key=mKey[1].toUpperCase();
    return meta;
  }
  async function fileToBase64Mime(file){
    return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onerror=()=>reject(new Error('讀取檔案失敗')); r.onload=()=>{ const res=r.result; const m=String(res).match(/^data:([^;]+);base64,(.*)$/); if(!m) return reject(new Error('無法解析 base64')); resolve({mimeType:m[1],base64:m[2]}); }; r.readAsDataURL(file); });
  }
  function buildPrompt(){
    return '你是一個樂譜 OCR 專家。請從圖像偵測並輸出:\n1) 樂曲標題 (Title)\n2) 樂曲主調 (Key) 若無明示推測單一調性\n3) 主要內容 (和弦 + 歌詞)\n輸出使用 JSON 置於 ```json 區塊。';
  }
  async function callGeminiAPIFromFile(file, apiKey){
    const {mimeType,base64}= await fileToBase64Mime(file);
    const body={contents:[{parts:[{text:buildPrompt()},{inlineData:{mimeType,data:base64}}]}],generationConfig:{temperature:0.1,maxOutputTokens:2048}};
    const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp= await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!resp.ok){ const t=await resp.text(); throw new Error('Gemini API 錯誤 '+resp.status+': '+t.slice(0,200)); }
    const json= await resp.json();
    const text=json?.candidates?.[0]?.content?.parts?.map(p=>p.text).filter(Boolean).join('\n')||'';
    return text;
  }
  async function handleRecognize(){
    const file = fi?.files?.[0];
    const apiKey = apiKeyInput?.value.trim();
    const statusEl = d.getElementById('gemini-status');
    const out = d.getElementById('recognize-output');
    if(!file){ statusEl.textContent='請先選擇檔案'; return; }
    if(!apiKey){ statusEl.textContent='請輸入 API Key'; return; }
    statusEl.textContent='辨識中...'; out.style.display='none'; out.textContent='';
    try { const text = await callGeminiAPIFromFile(file, apiKey); const meta=parseMetadataFromText(text); let display=formatDisplay(meta.content); const headerLines=[]; if(meta.title) headerLines.push(meta.title); if(meta.key) headerLines.push('Key: '+meta.key); if(headerLines.length) display=headerLines.join('\n')+'\n\n'+display; out.textContent=display||'(無內容)'; out.style.display='block'; statusEl.textContent='完成'; g.__LAST_AI_RESULT__=display; if(meta.title){ const ti=d.getElementById('song-title'); ti && (ti.value=meta.title); } if(meta.key){ const dk=d.getElementById('from-key'); dk && (dk.value=meta.key); const dk2=d.getElementById('detected-key'); dk2 && (dk2.value=meta.key); }
      const editor = d.getElementById('text-editor'); if(editor){ editor.value=display; d.getElementById('go-to-transpose')?.removeAttribute('disabled'); }
      if(origImgBox){ if(file.type==='application/pdf') origImgBox.innerHTML='<div style="padding:40px;text-align:center;font-size:13px;color:var(--color-text-secondary);">PDF 已上傳</div>'; else { const url = URL.createObjectURL(file); origImgBox.innerHTML = `<img src="${url}" style="max-width:100%;height:auto;display:block;">`; } }
      g.switchView && g.switchView('recognition'); }
    catch(err){ statusEl.textContent='錯誤: '+err.message; }
  }
  ['recognize-btn','recognize-btn-secondary','recognize-ai-btn'].forEach(id=>{ const btn=d.getElementById(id); if(btn && !btn.__wired){ btn.addEventListener('click',handleRecognize); btn.__wired=true; }});

  // zoom controls
  (function(){
    const container = d.getElementById('recognition-original');
    const controlsBox = d.getElementById('zoom-controls'); if(!container || !controlsBox) return;
    function applyZoom(mode){ container.classList.remove('zoom-fit','zoom-actual'); if(mode==='actual') container.classList.add('zoom-actual'); else container.classList.add('zoom-fit'); try{ localStorage.setItem('chordapp.zoomMode', mode);}catch(_){ } controlsBox.querySelectorAll('button').forEach(b=>{ const active=b.getAttribute('data-zoom')===mode; b.style.background=active?'var(--color-accent)':'#fff'; b.style.color=active?'#fff':'var(--color-text)'; b.style.borderColor=active?'var(--color-accent)':'var(--color-border)'; }); }
    controlsBox.addEventListener('click',e=>{ const btn=e.target.closest('button[data-zoom]'); if(!btn) return; applyZoom(btn.getAttribute('data-zoom')); });
    let start='fit'; try{ const saved=localStorage.getItem('chordapp.zoomMode'); if(saved) start=saved; }catch(_){ }
    applyZoom(start); g.__applyRecognitionZoom=applyZoom;
  })();
}