// Transpose logic
export function initTranspose(win, doc){
  const d=doc,g=win;
  function transposeChord(ch, diff){
    const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const mapFlat={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
    return ch.replace(/^[A-G][b#]?/,m=>{ const norm=mapFlat[m]||m; const i=notes.indexOf(norm); if(i<0) return m; return notes[(i+diff+12)%12]; });
  }
  function detectChordToken(tok){ return /^[A-G][#b]?[a-zA-Z0-9()/]*$/.test(tok); }
  function transposeText(txt, fromKey, toKey){
    const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const flatToSharp={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
    const norm=k=>flatToSharp[k]||k;
    const diff=(notes.indexOf(norm(toKey)) - notes.indexOf(norm(fromKey)) + 12) % 12;
    return txt.split(/\n/).map(line=>{
      if(/^Key:\s*/i.test(line) || line.trim()==='' || line.length<2) return line;
      const chordLike=/\|/.test(line) || (line.match(/[A-G][#b]?/g)||[]).length>2;
      if(!chordLike) return line;
      return line.replace(/([A-G][#b]?)([a-zA-Z0-9()/#]*)/g,(m,root,rest)=>{ const token=root+rest; if(!detectChordToken(token)) return m; return transposeChord(token,diff); });
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
  goTrans && goTrans.addEventListener('click',()=>{ doTrans && (doTrans.disabled=false); g.switchView && g.switchView('transpose'); const src=d.getElementById('text-editor')?.value||''; outArea.value=src; finishBtn && (finishBtn.disabled=false); const ti=d.getElementById('song-title')?.value; if(ti) document.title=ti+' - 移調'; });
  doTrans && doTrans.addEventListener('click',()=>{ const src=d.getElementById('text-editor')?.value||''; const fk=d.getElementById('from-key').value; const tk=d.getElementById('to-key').value; let transposed=transposeText(src,fk,tk); let lines=transposed.split(/\n/); const keyLineIndex=lines.findIndex(l=>/^Key:\s*/i.test(l)); const newKeyLine='Key: '+tk; if(keyLineIndex>=0) lines[keyLineIndex]=newKeyLine; else lines.splice(lines[0].trim()?1:0,0,newKeyLine); outArea.value=lines.join('\n'); });
  finishBtn && finishBtn.addEventListener('click',()=>{ g.switchView && g.switchView('export'); try { typeof g.refreshExportPreview==='function' && g.refreshExportPreview(); } catch(_){ } });
}