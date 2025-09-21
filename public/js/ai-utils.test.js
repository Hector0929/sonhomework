// filepath: tests/ai-utils.test.js
import {
  buildPrompt,
  processGeminiText,
  CHORD_LINE_RE,
  isChordLineForClassification,
  formatGeminiResponse,
  tryParseGeminiJSON,
  cleanChords,
  cleanLyrics
} from "../public/js/ai-utils.js";

describe("AI Utils", () => {
  test("buildPrompt should mention keep spaces and |", () => {
    const p = buildPrompt();
    expect(p).toContain("空格");
    expect(p).toContain("|");
  });

  test("isChordLineForClassification detects chords", () => {
    expect(isChordLineForClassification("|F2   |Csus   |Dm7 /C |Bb2|")).toBe(true);
    expect(isChordLineForClassification("F   Gm7  Bb2 F")).toBe(true);
    expect(isChordLineForClassification("我 要 永 遠 住 在")).toBe(false);
  });

  test("processGeminiText keeps spaces", () => {
    const raw = [
      "|F2      |Csus       |Dm7  /C     |Bb2      |",
      " 奔 向 祢 的 殿 中 讓 讚 美   湧 流 在 我 心 頭"
    ].join("\n");
    const tokens = processGeminiText(raw);
    expect(tokens.length).toBe(2);
    expect(tokens[0].kind).toBe("chords");
    expect(tokens[0].text).toBe("|F2      |Csus       |Dm7  /C     |Bb2      |");
    expect(tokens[1].text.startsWith(" 奔 向 祢")).toBe(true);
  });

  test("render target textarea exists in DOM and receives value", () => {
    document.body.innerHTML = `
      <div id="recognition-result"><textarea id="recognition-text"></textarea></div>
    `;
    const ta = document.getElementById("recognition-text");
    const raw = "家 / Home (F) 146\n|F|Gm7|Bb2|";
    ta.value = raw;
    expect(ta.value.includes("Home")).toBe(true);
    expect(ta.value.includes("|Gm7|")).toBe(true);
  });
});

describe("Gemini JSON → 純文字", () => {
  test("array of {chords, lyrics} 轉換，lyrics 不含豎線", () => {
    const raw = JSON.stringify([
      { chords: "|F2      |Csus       |Dm7  /C     |Bb2      |", lyrics: " 家 | 是 天 堂" },
      { chords: "|C|Dm7|Bb2|", lyrics: " 我 要 永 遠 住 在 | 祢 的 同 在 裡" }
    ]);
    const txt = formatGeminiResponse(raw);
    const lines = txt.split("\n").filter(Boolean);
    expect(lines[0]).toContain('|');      // chords 仍保留豎線
    expect(lines[1]).not.toContain('|');  // lyrics 移除豎線
    expect(lines[3]).not.toContain('|');  // lyrics 移除豎線
  });

  test("```json 區塊可解析且 lyrics 清理", () => {
    const raw = "```json\n{\"lines\":[{\"chords\":\"[F]|[Gm7]|\",\"lyrics\":\" 家 | 是 天 堂 [F]\"}]}\n```";
    const txt = formatGeminiResponse(raw);
    const arr = txt.split("\n").filter(Boolean);
    expect(arr[0]).toBe("F|Gm7|");        // cleanChords 移除方括號
    expect(arr[1]).toBe(" 家  是 天 堂 "); // cleanLyrics 去掉 | 與 [F]
  });

  test("cleanLyrics 僅移除 | 與括號和弦，不壓縮空白", () => {
    const src = " 我 | 要  [Gm7]  回 家 ";
    const out = cleanLyrics(src);
    expect(out).toBe(" 我   要    回 家 "); // 多個空白保留
  });
});

describe("安全 regex 與格式化", () => {
  test("CHORD_LINE_RE 應可正確匹配和弦行且不拋錯", () => {
    const ok = CHORD_LINE_RE.test(" |F2  | Csus | Dm7 /C | Bb2 | ");
    expect(ok).toBe(true);
  });

  test("isChordLineForClassification 對歌詞應為 false", () => {
    expect(isChordLineForClassification(" 我 要 永 遠 住 在 祢 的 同 在 裡 ")).toBe(false);
  });

  test("formatGeminiResponse 將 JSON 轉為純文字（歌詞無豎線）", () => {
    const raw = JSON.stringify([
      { chords: "|F|Gm7|Bb2|", lyrics: " 家 | 是 天 堂 [F]" }
    ]);
    const out = formatGeminiResponse(raw).split("\n").filter(Boolean);
    expect(out[0]).toBe("|F|Gm7|Bb2|");
    expect(out[1]).toBe(" 家  是 天 堂 ");
  });
});
