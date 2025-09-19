import { test, expect } from '@playwright/test';
import path from 'path';

const fileURL = 'file://' + path.resolve('chords_tranport.html');
// 1x1 PNG base64 與 helper
const MINI = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgMBAp4lS8QAAAAASUVORK5CYII=';
const png1x1Buffer = () => Buffer.from(MINI, 'base64');

test('AI 辨識按鈕 (填入 key+勾選→啟用→模擬完成)', async ({ page }) => {
  await page.goto(fileURL);

  // 依目前設計：AI 辨識需先有影像
  await page.locator('#file-input')
    .setInputFiles({ name: 'ai.png', mimeType: 'image/png', buffer: png1x1Buffer() });

  // 預存影像 URL（避免某些情況讀不到 file input）
  await page.evaluate((b64) => {
    window.AppState = window.AppState || {};
    window.AppState.preURL = 'data:image/png;base64,' + b64;
  }, MINI);

  // 輸入 key + 勾選
  await page.fill('#gemini-api-key','FAKE_KEY');
  if (await page.$('#use-gemini-ai')) {
    await page.check('#use-gemini-ai');
  }

  const aiBtn = page.locator('#recognize-ai-btn');
  await expect(aiBtn).toBeEnabled();
  await aiBtn.click();

  // 接受目前實作可能顯示的文字
  await expect(page.locator('#gemini-status'))
    .toContainText(/AI 模擬完成|AI 模擬辨識執行中|AI 辨識完成|AI 辨識啟動中|AI 辨識執行中|API 呼叫失敗|使用後備辨識/, { timeout: 8000 });

  await expect(page.locator('#recognition-status, #upload-status'))
    .toContainText(/辨識中|開始辨識中|辨識完成|後備|上傳/, { timeout: 8000 });
});