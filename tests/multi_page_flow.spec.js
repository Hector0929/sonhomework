import { test, expect } from '@playwright/test';
import path from 'path';

test('Scan→Recognize→Transpose 多頁流程（sessionStorage 傳遞）', async ({ page }) => {
  // 先到 scan.html 寫入 sessionStorage，再前往 recognize.html，確保初始化腳本能讀取
  await page.goto('file://' + path.resolve('pages/scan.html'));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    sessionStorage.setItem('app.state', JSON.stringify({
      rawURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAuMB+NvN1QEAAAAASUVORK5CYII=',
      preURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAuMB+NvN1QEAAAAASUVORK5CYII=',
      tokens: [
        { kind: 'chord', x: 10, y: 10, w: 30, h: 18, text: 'C' },
        { kind: 'chord', x: 60, y: 10, w: 40, h: 18, text: 'G/B' },
      ],
    }));
  });

  await page.goto('file://' + path.resolve('pages/recognize.html'));
  await page.waitForLoadState('domcontentloaded');

  // 預期辨識結果可見且有兩個和弦 tag
  await expect(page.locator('#recognition-result .tag.chord')).toHaveCount(2);

  // 進入移調頁
  await page.click('#to-transpose');
  await page.waitForURL(/transpose\.html$/);

  // 移調頁會從 sessionStorage 讀取 tokens
  await expect(page.locator('#transposed-result .tag.chord')).toHaveCount(2);
  await page.selectOption('#original-key', 'C');
  await page.selectOption('#target-key', 'D');
  // 正確按鈕 ID 為 #apply
  await page.waitForSelector('#apply', { state: 'visible' });
  await page.click('#apply');

  const chords = await page.$$eval('#transposed-result .tag.chord', els => els.map(e => e.textContent));
  const normalizeEnharm = (s) => s.replace('/D#', '/Eb').replace('/G#', '/Ab');
  expect(chords.map(normalizeEnharm)).toEqual(['D', 'A/C#']);
});
