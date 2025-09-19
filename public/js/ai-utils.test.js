// filepath: tests/ai-utils.test.js
import { buildPrompt, processGeminiText, isChordLineForClassification } from "../public/js/ai-utils.js";

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
