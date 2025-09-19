import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// 單頁 demo
const fileURL = 'file://' + path.resolve('chords_tranport.html');
const ONE_PX_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axhCpgAAAAASUVORK5CYII=';

test('UploadModule 上傳後應顯示 AI 辨識區域並更新 AppState', async ({ page }) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upl-'));
  const imgPath = path.join(dir, 'one.png');
  fs.writeFileSync(imgPath, Buffer.from(ONE_PX_PNG, 'base64'));
  try {
    await page.goto(fileURL);
    await page.waitForLoadState('domcontentloaded');

    // 確認 module 已注入（若還未在 HTML 引入可以暫時 skip）
    const hasModule = await page.evaluate(() => !!window.UploadModule);
    test.skip(!hasModule, 'UploadModule 尚未載入到頁面');

    const input = page.locator('#file-input');
    await input.setInputFiles(imgPath);
    // 輪詢等待 AppState.rawURL 出現
    await page.waitForFunction(() => window.AppState && /^data:image\//.test(window.AppState.rawURL||''), null, { timeout: 7000 });

    await expect(page.locator('#file-preview-area')).toBeVisible();
    
    // 檢查 AI 辨識區域是否可見
    await expect(page.locator('#gemini-card')).toBeVisible();
    
    // 檢查 AI 辨識按鈕存在
    await expect(page.locator('#recognize-ai-btn')).toBeVisible();

    const rawURL = await page.evaluate(() => window.AppState && window.AppState.rawURL);
    expect(rawURL).toMatch(/^data:image\/png;base64,/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
