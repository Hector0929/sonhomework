import { test, expect } from '@playwright/test';
import path from 'path';

const fileURL = 'file://' + path.resolve('chords_tranport.html');

test('localStorage 自測設定會套用到 PREPROC/POSTFILTER', async ({ page }) => {
  // 事先寫入設定
  await page.addInitScript(() => {
    localStorage.setItem('selftest.settings', JSON.stringify({
      preproc: { scale: 2.2, contrastClip: 0.02, binarize: true, dilateH: false },
      postfilter: { minConfidence: 65, minRootOnlyHeightRatio: 0.6 }
    }));
  });
  await page.goto(fileURL);
  await page.waitForLoadState('domcontentloaded');
  // 等待套用完成
  await page.waitForFunction(() => window.PREPROC?.scale && Math.abs(window.PREPROC.scale - 2.2) < 1e-6);
  const applied = await page.evaluate(() => ({ PREPROC, POSTFILTER }));
  expect(applied.PREPROC.scale).toBeCloseTo(2.2, 5);
  expect(applied.PREPROC.contrastClip).toBeCloseTo(0.02, 5);
  expect(applied.PREPROC.binarize).toBe(true);
  expect(applied.PREPROC.dilateH).toBe(false);
  expect(applied.POSTFILTER.minConfidence).toBe(65);
  expect(applied.POSTFILTER.minRootOnlyHeightRatio).toBeCloseTo(0.6, 5);
});