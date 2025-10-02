// 基礎 e2e：驗證 experimental 頁面核心 UI 元件可載入與切換
import { test, expect } from '@playwright/test';

import path from 'path';
import { pathToFileURL } from 'url';
const EXP_REL = 'chords_tranport_experimental.html';
const EXP_FILE_URL = pathToFileURL(path.resolve(process.cwd(), EXP_REL)).toString();

async function openExperimental(page) {
  await page.goto(EXP_FILE_URL, { waitUntil: 'domcontentloaded' });
}

// 避免 magic string：標籤 data-view
const views = ['upload','recognition','transpose','export'];

// 幫助函式：切換分頁並確認 aria-selected
async function clickTab(page, view) {
  const btn = page.locator(`button.tab-btn-modern[data-view="${view}"]`);
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-selected','true');
}

test.describe('Experimental 基礎流程', () => {
  test('載入後預設為 upload 分頁，且四個按鈕存在', async ({ page }) => {
    await openExperimental(page);
    for (const v of views) {
      await expect(page.locator(`button.tab-btn-modern[data-view="${v}"]`)).toBeVisible();
    }
    await expect(page.locator('button.tab-btn-modern[data-view="upload"]').first()).toHaveAttribute('aria-selected','true');
  });

  test('可依序切換到辨識/移調/匯出並保持 aria-selected 正確', async ({ page }) => {
    await openExperimental(page);
    for (const v of ['recognition','transpose','export']) {
      await clickTab(page, v);
    }
  });

  test('切換分頁會記錄 localStorage chordapp.activeView', async ({ page }) => {
    await openExperimental(page);
    await clickTab(page, 'transpose');
    const stored = await page.evaluate(() => localStorage.getItem('chordapp.activeView'));
    expect(stored).toBe('transpose');
  });

  test('重新載入後應保持上次 chordapp.activeView (e.g. export)', async ({ page }) => {
    await openExperimental(page);
    await clickTab(page, 'export');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('button.tab-btn-modern[data-view="export"]').first()).toHaveAttribute('aria-selected','true');
  });
});
