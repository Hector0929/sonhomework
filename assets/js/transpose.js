// Transpose logic
export function initTranspose(win, doc){
  const d=doc,g=win;
  function transposeNote(note, diff){
    const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const flats={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
    const m = String(note||'').trim().match(/^([A-Ga-g])([b#]?)/);
    if(!m) return note;
    const base = m[1].toUpperCase() + (m[2]==='#'?'#':(m[2]==='b'?'b':''));
    const n=flats[base]||base; const i=notes.indexOf(n); if(i<0) return base; return notes[(i+diff+12)%12];
  }
  function transposeChord(ch, diff){
    // 解析 root 與剩餘，並偵測 slash 低音
    const m = ch.match(/^([A-G][b#]?)(.*)$/);
    if(!m) return ch;
    const root = transposeNote(m[1], diff);
    let rest = m[2]||'';
  // 允許半形/全形斜線與低音之間的空白，並保留原空白
  rest = rest.replace(/[\/／](\s*)([A-G][b#]?)/g, (s, sp, bass)=> '/' + sp + transposeNote(bass,diff));
    return root+rest;
  }
  // 僅允許斜線周圍的空白，且允許沒有擴展也帶 slash（例如 "A/C#"）
  function detectChordToken(tok){
    return /^[A-G][#b]?(?:[a-zA-Z0-9()#]*)?(?:\s*[\/／]\s*[A-G][#b]?)?$/.test(tok);
  }
  function transposeText(txt, fromKey, toKey){
    const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const flatToSharp={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
    const norm=k=>flatToSharp[k]||k;
    const diff=(notes.indexOf(norm(toKey)) - notes.indexOf(norm(fromKey)) + 12) % 12;
    return txt.split(/\n/).map(line=>{
      if(/^Key:\s*/i.test(line) || line.trim()==='' || line.length<2) return line;
  const slashChord=/[A-G][#b]?\s*[\/／]\s*[A-G][#b]?/.test(line);
    const chordLike=/\|/.test(line) || slashChord || (line.match(/[A-G][#b]?/g)||[]).length>2;
      if(!chordLike) return line;
  // 僅比對單一和弦（含可選的 slash 低音），不再允許任意空白導致黏到下一個和弦
  return line.replace(/([A-G][#b]?(?:[a-zA-Z0-9()#]*)?(?:\s*[\/／]\s*[A-G][#b]?)?)/g,(m)=>{
    if(!detectChordToken(m)) return m;
    return transposeChord(m, diff);
  });
    }).join('\n');
  }
  const goTrans=d.getElementById('go-to-transpose');
  const backUpload=d.getElementById('back-to-upload');
  const doTrans=d.getElementById('do-transpose');
  const backEdit=d.getElementById('transpose-back');
  const finishBtn=d.getElementById('transpose-finish');
  const outArea=d.getElementById('transpose-output');
  backUpload && backUpload.addEventListener('click',()=> g.switchView && g.switchView('upload'));
  backEdit && backEdit.addEventListener('click',()=> g.switchView && g.switchView('recognition'));
  goTrans && goTrans.addEventListener('click',()=>{ doTrans && (doTrans.disabled=false); g.switchView && g.switchView('transpose'); const shared=g.getSharedText?g.getSharedText():''; const src=shared || d.getElementById('text-editor')?.value||''; outArea.value=src; finishBtn && (finishBtn.disabled=false); const ti=d.getElementById('song-title')?.value; if(ti) document.title=ti+' - 移調'; });
  doTrans && doTrans.addEventListener('click',()=>{ const base=(outArea?.value||d.getElementById('text-editor')?.value||''); const fk=d.getElementById('from-key').value; const tk=d.getElementById('to-key').value; let transposed=transposeText(base,fk,tk); let lines=transposed.split(/\n/); const keyLineIndex=lines.findIndex(l=>/^Key:\s*/i.test(l)); const newKeyLine='Key: '+tk; if(keyLineIndex>=0) lines[keyLineIndex]=newKeyLine; else lines.splice(lines[0].trim()?1:0,0,newKeyLine); const out=lines.join('\n'); outArea.value=out; try{ g.setSharedText && g.setSharedText(out,'transpose'); }catch(_){ } });
  // 手動編輯同步 shared text
  if(outArea && !outArea.__wired){ outArea.addEventListener('input',()=>{ try{ g.setSharedText && g.setSharedText(outArea.value,'transpose-edit'); }catch(_){ } }); outArea.__wired=true; }
  finishBtn && finishBtn.addEventListener('click',()=>{ try{ g.setSharedText && g.setSharedText(outArea?.value||'','transpose-finish'); }catch(_){ } g.switchView && g.switchView('export'); try { typeof g.refreshExportPreview==='function' && g.refreshExportPreview(); } catch(_){ } });

  // 註冊分頁進入鉤子：當切到 transpose 時回填共享內容
  try{
    if(g.__onEnterView){
      g.__onEnterView.transpose = function(){
        const text = g.getSharedText ? g.getSharedText() : '';
        if(outArea && text && outArea.value !== text) outArea.value = text;
      };
    }
  }catch(_){ }

  // 將移調函式暴露到全域，提供頁面直接呼叫以統一來源
  try {
    g.__transpose__ = {
      transposeText,
      transposeChord,
      transposeNote,
      detectChordToken
    };
  } catch(_){ }
}