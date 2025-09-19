import { test, expect } from '@playwright/test';
const MINI='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgMBAp4lS8QAAAAASUVORK5CYII=';

test('開始辨識流程', async ({ page }) => {
  await page.goto('/chords_tranport.html');
  const input = page.locator('#file-input');
  const btn = page.locator('#recognize-btn');
  await expect(btn).toBeDisabled();

  const buffer = Buffer.from(MINI,'base64');
  await input.setInputFiles({ name:'demo.png', mimeType:'image/png', buffer });
  await expect(btn).toBeEnabled();

  await btn.click();
  await expect(page.locator('#upload-status')).toHaveText(/上傳(中|成功|錯誤)/, { timeout: 5000 });
  // 若無真正 API 仍會有模擬成功文字
});