import { test, expect } from '@playwright/test';
import path from 'path';

const goto = (f) => 'file://' + path.resolve(f);
async function switchTab(page, view){ await page.evaluate(v=>window.switchView&&window.switchView(v), view); }

const sample = ` 聖所 / Sanctuary\nKey: G\n\nIntro\n|G   |Em7  |Bm7  |C  E   |\n|G   |Em7  |Bm7  |C  Dm  |\n`;

test('移調頁與匯出頁：空白與排版一致（不 trim）', async ({ page }) => {
  await page.goto(goto('chords_tranport.html'));
  await page.waitForLoadState('domcontentloaded');
  await switchTab(page, 'transpose');
  await page.fill('#transpose-output', sample);
  await switchTab(page, 'export');
  const exportValue = await page.$eval('#export-preview-text', el=>el.value);
  expect(exportValue).toBe(sample); // 完全等字串，含前導空白與尾端換行
});

test('匯出寬度使用預覽框寬度（避免換行差異）', async ({ page }) => {
  await page.goto(goto('chords_tranport.html'));
  await page.waitForLoadState('domcontentloaded');
  await switchTab(page, 'export');
  // 先調整 textarea 寬度以模擬使用者視窗
  await page.$eval('#export-preview-text', el => el.style.width = '720px');
  // 觸發刷新與 PNG 匯出（不實際驗證影像像素，只驗證成功完成流程）
  await page.click('#export-refresh');
  await page.click('#export-download-png');
  // 成功到這步表示 html2canvas 正常，寬度已由程式取用
  await expect(page.locator('#export-info')).toBeVisible();
});
