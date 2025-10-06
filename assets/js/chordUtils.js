// 和弦工具函式 (初版)
// 提供：isChordToken, normalizeChordToken, isChordLine, isSectionHeader, restructureChordLyricsBlock

const SECTION_HEADER_RE = /^(?:Intro|Verse|Chorus|Pre[- ]?Chorus|Bridge|Outro|Inst|Interlude|Solo|Tag|Ending|Break)\b/i;

// 和弦 Token 正規表示式：根音 + 品質/延伸 + slash 貝斯
const CHORD_TOKEN_RE = /^\(?[A-G](?:#|b)?(?:mMaj7|maj7|Maj7|M7|m7|m6|m9|m|maj|Maj|M|dim7|dim|aug|\+|sus2|sus4|sus|add\d+|7|9|11|13|6|2|4)?(?:\/[A-G](?:#|b)?(?:m)?)?\)?$/;

export function isChordToken(tok){
  if(!tok) return false;
  const t = tok.trim();
  if(!t) return false;
  if(/^[IVX]+$/i.test(t)) return false; // 羅馬數字分析排除
  return CHORD_TOKEN_RE.test(t);
}

export function normalizeChordToken(tok){
  return tok.replace(/^\(|\)$/g,'').replace(/\s+/g,'');
}

export function isSectionHeader(line){
  return SECTION_HEADER_RE.test(line.trim());
}

export function tokenizeChordLine(line){
  return line.split(/\s*\|\s*|\s+/).map(s=>s.trim()).filter(Boolean);
}

export function isChordLine(line){
  const raw = line.trim();
  if(!raw) return false;
  if(isSectionHeader(raw)) return false;
  if(/[\u4e00-\u9fff]/.test(raw)) return false; // 含中文則視為歌詞
  const tokens = tokenizeChordLine(raw.replace(/^\|+|\|+$/g,''));
  if(!tokens.length) return false;
  const chordCnt = tokens.filter(isChordToken).length;
  if(!chordCnt) return false;
  return (chordCnt / tokens.length) >= 0.6; // 至少 60% 是和弦
}

export function restructureChordLyricsBlock(text){
  const lines = String(text).replace(/\r/g,'').split('\n');
  const out = [];
  let buffer = [];

  function flush(){
    if(!buffer.length) return;
    const allTokens = buffer.flatMap(line=>{
      const cleaned = line.trim().replace(/^\|+|\|+$/g,'');
      return tokenizeChordLine(cleaned).filter(isChordToken).map(normalizeChordToken);
    });
    if(!allTokens.length){ buffer=[]; return; }
    // 一律輸出小節線，包含單一和弦時亦包裹，避免 | 遺失
    out.push('|' + allTokens.join('|') + ' |');
    buffer = [];
  }

  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    const trimmed = line.trim();
    if(isSectionHeader(trimmed)){
      flush();
      out.push(trimmed);
      continue;
    }
    if(isChordLine(trimmed)){
      buffer.push(trimmed);
      continue;
    }
    if(buffer.length){ flush(); }
    out.push(line);
  }
  flush();
  return out.join('\n');
}

// 便利：掛到全域（給非 module 內嵌腳本使用）
try { if(typeof window!=='undefined'){ window.restructureChordLyricsBlock = restructureChordLyricsBlock; } } catch(_){ }

export default {
  isChordToken,
  normalizeChordToken,
  isChordLine,
  isSectionHeader,
  restructureChordLyricsBlock
};
