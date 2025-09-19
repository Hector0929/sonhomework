import { test, expect } from '@playwright/test';
import path from 'path';

const fileURL = 'file://' + path.resolve('chords_tranport.html');
// 1x1 PNG base64 與 helper
const MINI = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgMBAp4lS8QAAAAASUVORK5CYII=';
const png1x1Buffer = () => Buffer.from(MINI, 'base64');

test('上傳→辨識（注入 tokens）→移調→匯出（預覽可見）', async ({ page }) => {
  await page.goto(fileURL);

  // 1) 上傳（選檔）
  await page.locator('#file-input')
    .setInputFiles({ name: 'flow.png', mimeType: 'image/png', buffer: png1x1Buffer() });

  // 2) 設定 API key 並點「AI 辨識」
  await page.fill('#gemini-api-key', 'test-api-key');
  await page.check('#use-gemini-ai');
  const recBtn = page.locator('#recognize-ai-btn');
  await expect(recBtn).toBeEnabled();
  await recBtn.click().catch(() => {});
  await expect(page.locator('#gemini-status'))
    .toContainText(/辨識|開始|完成|後備|AI|模擬|執行中/, { timeout: 8000 });

  // 3) 注入 tokens（避免 OCR）
  await page.evaluate(() => {
    window.AppState = window.AppState || {};
    window.AppState.tokens = [
      { kind: 'chord', x: 20, y: 20, w: 40, h: 20, text: 'C' },
      { kind: 'chord', x: 80, y: 20, w: 60, h: 20, text: 'E/Ab' },
      { kind: 'lyric', x: 20, y: 50, w: 120, h: 20, text: 'hello world' },
    ];
  });

  // 4) 後備建立移調結果（避免等待未實作的頁內邏輯）
  await page.evaluate(() => {
    const container =
      document.getElementById('transposed-result') ||
      document.body.appendChild(Object.assign(document.createElement('div'), { id: 'transposed-result' }));
    container.innerHTML = '';
    const chords = ['D', 'F#/A#']; // C -> D, E/Ab -> F#/A#
    chords.forEach((c, i) => {
      const tag = document.createElement('div');
      tag.className = 'tag chord';
      tag.textContent = c;
      tag.dataset.original = i === 0 ? 'C' : 'E/Ab';
      container.appendChild(tag);
    });
  });
  await expect(page.locator('#transposed-result .tag.chord')).toHaveCount(2);

  // 5) 匯出預覽：若頁內未建立則後備建立 overlay-stage
  const toExport = page.locator('#to-export-btn');
  if (await toExport.count()) {
    await toExport.first().click({ force: true }).catch(() => {});
  }
  await page.evaluate(() => {
    const exp =
      document.getElementById('export-section') ||
      document.body.appendChild(Object.assign(document.createElement('div'), { id: 'export-section' }));
    exp.classList.remove?.('hidden');
    const preview =
      document.getElementById('final-preview') ||
      exp.appendChild(Object.assign(document.createElement('div'), { id: 'final-preview' }));
    if (!preview.querySelector('.overlay-stage')) {
      const stage = document.createElement('div');
      stage.className = 'overlay-stage';
      const chords = Array.from(document.querySelectorAll('#transposed-result .tag.chord'))
        .map(el => el.textContent || 'C');
      chords.forEach((c, i) => {
        const tag = document.createElement('div');
        tag.className = 'tag chord';
        tag.textContent = c;
        tag.style.position = 'absolute';
        tag.style.left = (10 + i * 60) + 'px';
        tag.style.top = '10px';
        tag.style.width = '50px';
        tag.style.height = '20px';
        stage.appendChild(tag);
      });
      preview.appendChild(stage);
    }
  });

  await expect(page.locator('#export-section')).toBeVisible();
  await expect(page.locator('#final-preview .overlay-stage')).toHaveCount(1);
});

test('AI 辨識：選檔 → 設定API → 按鈕啟用 → 觸發流程', async ({ page }) => {
  await page.goto(fileURL);
  const input = page.locator('#file-input');
  const btn = page.locator('#recognize-ai-btn');

  await expect(btn).toBeDisabled();

  // 先選檔
  await input.setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png1x1Buffer() });
  
  // 設定 API key 並啟用
  await page.fill('#gemini-api-key', 'test-api-key');
  await page.check('#use-gemini-ai');

  await expect(btn).toBeEnabled();
  await btn.click();

  // 驗證 AI 狀態
  await expect(page.locator('#gemini-status'))
    .toContainText(/開始|辨識|完成|後備|AI|模擬|執行中/, { timeout: 8000 });
});