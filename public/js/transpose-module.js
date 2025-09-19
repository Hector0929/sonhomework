(function(){
  if(window.TransposeModule) return;

  const NOTE_INDEX={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'Fb':4,'E#':5,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11,'Cb':11,'B#':0};
  const INDEX_NOTE_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const INDEX_NOTE_FLAT =['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

  function canonicalizeChordText(input){
    let s = (input||'').trim();
    if(!s) return '';
    s = s.replace(/^([a-g])(?=[#b]?)/, m=>m.toUpperCase());
    s = s.replace(/\/(?:([a-g])(?=[#b]?))/g, (_,p)=>'/'+p.toUpperCase());
    return s;
  }

  function parseChord(s){
    const t = canonicalizeChordText(s);
    const m = t.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
    if(!m) return null;
    return { root:m[1], suffix:m[2]||'', bass:m[3]||'' };
  }
  function transposeNote(n, offset, preferFlat=false){
    if(!n) return n;
    const idx = NOTE_INDEX[n];
    if(idx==null) return n;
    const out = (idx + ((offset%12)+12)%12)%12;
    return (preferFlat?INDEX_NOTE_FLAT:INDEX_NOTE_SHARP)[out];
  }
  function semitoneDiff(fromKey,toKey){
    if(!(fromKey in NOTE_INDEX) || !(toKey in NOTE_INDEX)) return 0;
    return NOTE_INDEX[toKey]-NOTE_INDEX[fromKey];
  }
  function transposeChord(chord, fromKey, toKey){
    if(!chord) return chord;
    const diff = semitoneDiff(fromKey,toKey);
    if(diff===0) return canonicalizeChordText(chord);
    const c = parseChord(chord); if(!c) return chord;
    const preferFlat = /b/.test(c.root) || /b/.test(c.bass);
    const root = transposeNote(c.root,diff,preferFlat);
    const bass = c.bass?'/'+transposeNote(c.bass,diff,preferFlat):'';
    return root + c.suffix + bass;
  }
  function applyTranspose(tokens, fromKey, toKey){
    if(!Array.isArray(tokens)) return [];
    return tokens.map(t=>{
      if(t.kind==='chord' || /[A-G]/.test(t.text||'')){
        return { ...t, text: transposeChord(t.text, fromKey, toKey) };
      }
      return { ...t };
    });
  }

  window.TransposeModule = { transposeChord, applyTranspose, semitoneDiff };
})();
