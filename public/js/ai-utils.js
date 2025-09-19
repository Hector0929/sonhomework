// filepath: public/js/ai-utils.js
// 提供可測的輔助函式（瀏覽器與 Jest 共用）
export function buildPrompt() {
  // 要求保留空格與豎線，接近原譜
  return [
    '你是樂譜辨識專家，請將圖片中的和弦與歌詞轉為純文字，務必保留所有空格與豎線 |，保持對齊。',
    '規則：',
    '1) 直接輸出純文字，不要加入任何解說或 markdown 標記。',
    '2) 和弦行可使用 | 分隔；遇到斜線分數和弦例如 Dm7 /C 也請原樣保留空格。',
    '3) 歌詞置於對應和弦行下一行；若圖片中為區段（Verse/Chorus 等），請保留標題行。',
    '4) 儘量貼近原譜排版。',
  ].join('\n');
}

export function isChordLineForClassification(lineTrimmed) {
  if (!lineTrimmed) return false;
  if (lineTrimmed.includes('|')) return true;
  const CH = /([A-G][#b]?)(maj7|maj9|maj|add9|sus2|sus4|sus|dim7|dim|aug|m7b5|m7|m9|m6|m|7|6|9|11|13)?(\/[A-G][#b]?)?/;
  const re = new RegExp(`^(${CH.source})(\\s+${CH.source})*$`);
  return re.test(lineTrimmed);
}

export function processGeminiText(raw) {
  // 不裁剪尾端空白，維持原字距
  const lines = String(raw).replace(/\r/g, '').split('\n');
  const tokens = [];
  for (let i = 0; i < lines.length; i++) {
    const original = lines[i]?.replace(/\t/g, '    ');
    if (original === undefined) continue;
    if (original === '') { continue; } // 空行可略過或轉 blank
    const trimmed = original.trim();
    if (!trimmed) continue;

    if (isChordLineForClassification(trimmed)) {
      tokens.push({ kind: 'chords', text: original });
      const next = lines[i + 1];
      if (next !== undefined && next.trim() && !isChordLineForClassification(next.trim())) {
        tokens.push({ kind: 'lyric', text: next.replace(/\t/g, '    ') });
        i++;
      }
    } else {
      tokens.push({ kind: 'lyric', text: original });
    }
  }
  return tokens;
}
