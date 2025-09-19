(function(){
  if(window.ExportModule) return;

  function clusterLines(tokens){
    if(!Array.isArray(tokens) || !tokens.length) return [];
    const sorted = [...tokens].sort((a,b)=> (a.y+a.h/2)-(b.y+b.h/2) || a.x-b.x);
    const lines=[]; let cur=[]; let cy=null; const medH = sorted.map(t=>t.h||16).sort((a,b)=>a-b)[Math.floor(sorted.length/2)]||16;
    for(const t of sorted){
      const my = (t.y||0)+(t.h||0)/2;
      if(cy==null || Math.abs(my-cy)>medH*0.7){ if(cur.length) lines.push(cur); cur=[t]; cy=my; }
      else { cur.push(t); cy=(cy*(cur.length-1)+my)/cur.length; }
    }
    if(cur.length) lines.push(cur);
    return lines.map(line=> line.sort((a,b)=>a.x-b.x));
  }

  function serializeTokens(tokens){
    const lines = clusterLines(tokens||[]);
    return lines.map(line=> line.map(t=> (t.text||'').trim()).join(' ')).join('\n');
  }

  function renderExport({ tokens, target }){
    if(!target) return;
    target.textContent = serializeTokens(tokens||[]);
  }

  window.ExportModule = { serializeTokens, renderExport };
})();
