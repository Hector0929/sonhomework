// Quick check using the same logic from assets/js/transpose.js
function transposeNote(note, diff){
  const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const flats={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
  const m = String(note||'').trim().match(/^([A-Ga-g])([b#]?)/);
  if(!m) return note;
  const base = m[1].toUpperCase() + (m[2]==='#'?'#':(m[2]==='b'?'b':''));
  const n=flats[base]||base; const i=notes.indexOf(n); if(i<0) return base; return notes[(i+diff+12)%12];
}
function transposeChord(ch, diff){
  const m = ch.match(/^([A-G][b#]?)(.*)$/);
  if(!m) return ch;
  const root = transposeNote(m[1], diff);
  let rest = m[2]||'';
  rest = rest.replace(/[\/／](\s*)([A-G][b#]?)/g, (s, sp, bass)=> '/' + sp + transposeNote(bass,diff));
  return root+rest;
}
// 與 assets/js/transpose.js 一致的 token 偵測：允許可選擴展與可選 slash 低音
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
  // 僅比對單一和弦（含可選的 slash 低音），避免吃到後面的和弦
  return line.replace(/([A-G][#b]?(?:[a-zA-Z0-9()#]*)?(?:\s*[\/／]\s*[A-G][#b]?)?)/g,(m)=>{ if(!detectChordToken(m)) return m; return transposeChord(m,diff); });
  }).join('\n');
}

const input = `Chorus
 |G         |Em7         |C              |D
 我要  敬  拜你  主        你恢  復我  生 命   獻上我心
 |Bm7       |Em7         |Am7            |D          (|G)
    成為你的  聖所         唯有你耶穌     能得著  我(的)心

inst
 |G     |Em7   |C         |D      |
 |Bm7   |E     |Am7  A/C# |C   D  |

Bridge
 |C           |G/B         |C            |Em7 D
  你  是信實真神      榮耀君王         我一生尊崇你 我的主
 |Am7         |G/B         |F            |D      |D`;

const out = transposeText(input, 'A', 'G');
console.log(out);
