// 測試用 DOM 輔助：顯示區塊、等待渲染、注入 AppState

export async function showById(page, id) {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  }, id);
}

export async function waitVisible(page, selector) {
  await page.waitForSelector(selector, { state: 'visible' });
}

export async function injectTokens(page, tokens) {
  await page.evaluate((tokens) => {
    window.AppState = window.AppState || {};
    window.AppState.tokens = tokens;
  }, tokens);
}

export async function ensureRenderStage(page, stageId, tokens) {
  await page.evaluate(({ stageId, tokens }) => {
    if (!window.Chords || !window.Chords.renderStage) return;
    // 若沒有 tokens，嘗試從 AppState 拿
    const data = tokens || (window.AppState && window.AppState.tokens) || [];
    try {
      window.Chords.renderStage(stageId, data);
    } catch (e) {
      console.warn('renderStage failed in test helper', e);
    }
  }, { stageId, tokens });
}
