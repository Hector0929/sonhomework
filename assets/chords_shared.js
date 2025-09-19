/* 共用工具與 AppState（sessionStorage） */
(function(){
  // 預設處理器設定（若測試有 localStorage 覆蓋，這裡仍支援）
  window.PREPROC = window.PREPROC || { enabled:true, scale:1.8, contrastClip:0.01, binarize:true, dilateH:true };
  window.POSTFILTER = window.POSTFILTER || { minConfidence:70, minRootOnlyHeightRatio:0.7 };

  (function applySelftestSettings(){
    try{
      const raw = localStorage.getItem('selftest.settings'); if(!raw) return;
      const cfg = JSON.parse(raw)||{}; const pre = cfg.preproc||{}, post = cfg.postfilter||{};
      if(pre.scale!=null) PREPROC.scale = Number(pre.scale);
      if(pre.contrastClip!=null) PREPROC.contrastClip = Number(pre.contrastClip);
      if(pre.binarize!=null) PREPROC.binarize = !!pre.binarize;
      if(pre.dilateH!=null) PREPROC.dilateH = !!pre.dilateH;
      if(post.minConfidence!=null) POSTFILTER.minConfidence = Number(post.minConfidence);
      if(post.minRootOnlyHeightRatio!=null) POSTFILTER.minRootOnlyHeightRatio = Number(post.minRootOnlyHeightRatio);
    }catch(e){ console.warn('[settings] 套用失敗', e); }
  })();

  // AppState in sessionStorage
  function loadAppState(){
    try{ return JSON.parse(sessionStorage.getItem('app.state')||'{}'); }catch{ return {}; }
  }
  function saveAppState(patch){
    const cur = loadAppState(); const next = { ...cur, ...patch };
    sessionStorage.setItem('app.state', JSON.stringify(next));
    return next;
  }
  window.App = { loadAppState, saveAppState };

  // 和弦工具
  const NOTE_INDEX={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'Fb':4,'E#':5,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11,'Cb':11,'B#':0};
  const INDEX_NOTE_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const INDEX_NOTE_FLAT =['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

  function toHalfWidth(s){return (s||'').replace(/[\uFF01-\uFF5E]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).replace(/\u3000/g,' ');}
  function normalizeSuperscripts(s){const m={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};return (s||'').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,x=>m[x]||x);}
  function normalizeToken(raw){
    let s = toHalfWidth(raw||'').trim();
    s = s.replace(/^[\|\‖∥\[\(\{]+/,'').replace(/[\]\)\}\.,]+$/,'');
    const primes = "[\\u2032\\u2033\\u02BA\\u02B9\\uFF02\"'\\^\\u02C6`´ˇ˘]";
    s = s.replace(new RegExp(`([A-G])${primes}+`,'g'),'$1#');
    s = s.replace(/[♯＃﹟]/g,'#').replace(/[♭ｂＢ]/g,'b');
    s = s.replace(/[Δ△]/g,'maj').replace(/ø/g,'m7b5').replace(/[°º]/g,'dim').replace(/\+/g,'aug');
    s = normalizeSuperscripts(s).replace(/M(?=(7|9|11|13)\b)/g,'maj').replace(/\s+/g,'');
    return s;
  }
  function canonicalizeChordText(input){
    const hasSuffixOnlyHint = /[ø°º]/.test(input||'');
    let s = normalizeToken(input||''); if(!s) return '';
    s = s.replace(/^([a-g])(?=[#b]?)/, m=>m.toUpperCase()).replace(/\/([a-g])(?=[#b]?)/g, (_,p)=>'/'+p.toUpperCase());
    if(hasSuffixOnlyHint && /^[A-G][#b]?(m7b5|dim7?|aug)$/.test(s)) return s.replace(/^[A-G][#b]?/, '');
    return s;
  }
  function isChordToken(t){
    const s = canonicalizeChordText(t); if(!s) return false;
    const SUFFIX='(?:maj7|maj9|maj11|maj13|m7b5|dim7|dim|aug|m(?!aj)(?:7|9|11|13)?|7|9|11|13|6|4|2|5|sus(?:2|4)?|add(?:2|4|9|11|13)?)?';
    const ALTER='(?:[#b](?:5|9|11|13))?';
    const SLASH='(?:\\/[A-G][#b]?)?';
    return new RegExp(`^[A-G][#b]?${SUFFIX}${ALTER}${SLASH}$`).test(s);
  }
  function parseChord(s){
    const t = canonicalizeChordText(s);
    const m = t.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
    if(!m) return null; return { root:m[1], suffix:m[2]||'', bass:m[3]||'' };
  }
  function transposeNote(n, off, preferFlat=false){
    if(!n) return n; const idx = NOTE_INDEX[n] ?? NOTE_INDEX[n?.toUpperCase()]; if(idx==null) return n;
    const out = (idx + ((off%12)+12)%12) % 12; return (preferFlat?INDEX_NOTE_FLAT[out]:INDEX_NOTE_SHARP[out]);
  }
  function transposeChordText(s, off){
    const c = parseChord(s); if(!c) return s;
    const preferFlat = /b/.test(c.root) || /b/.test(c.bass);
    const r = transposeNote(c.root, off, preferFlat);
    const b = c.bass ? '/'+transposeNote(c.bass, off, preferFlat || /b/.test(c.bass)) : '';
    return r + c.suffix + b;
  }
  function currentOffset(oKey, tKey){
    const oi=NOTE_INDEX[oKey], ti=NOTE_INDEX[tKey]; if(oi==null||ti==null) return 0; return (ti-oi+12)%12;
  }

  function renderStage(container, imgURL, tokens){
    container.innerHTML = '';
    const stage = document.createElement('div'); stage.className='overlay-stage';
    const img = document.createElement('img'); img.src = imgURL; stage.appendChild(img);
    img.onload = ()=>{
      (tokens||[]).forEach(t=>{
        const el=document.createElement('div'); el.className='tag '+(t.kind==='lyric'?'lyric':'chord');
        const text = (t.kind==='lyric') ? String(t.text||'') : canonicalizeChordText(t.text||'');
        if(el.classList.contains('chord')) el.dataset.original = text;
        el.textContent=text;
        el.style.left=`${t.x}px`; el.style.top=`${t.y}px`; el.style.width=`${t.w}px`; el.style.height=`${t.h}px`;
        el.style.fontSize=`${Math.max(10,Math.floor((t.h||16)*0.8))}px`;
        stage.appendChild(el);
      });
    };
    container.appendChild(stage);
    return stage;
  }

  function applyTransposeInPlace(stageRoot, off){
    const stage = stageRoot.querySelector('.overlay-stage'); if(!stage) return;
    stage.querySelectorAll('.tag.chord').forEach(tag=>{
      const src=tag.dataset.original||tag.textContent||''; tag.textContent=transposeChordText(src, off);
    });
  }

  // 對外
  window.Chords = {
    canonicalizeChordText, isChordToken, transposeChordText, currentOffset,
    renderStage, applyTransposeInPlace
  };
})();