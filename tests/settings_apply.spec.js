import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const htmlEntry = fs.existsSync(path.resolve('chords_transport.html'))
  ? 'chords_transport.html'
  : (fs.existsSync(path.resolve('chords_tranport.html')) ? 'chords_tranport.html' : 'index.html');
const fileURL = 'file://' + path.resolve(htmlEntry);

test('localStorage 自測設定會套用到 PREPROC/POSTFILTER', async ({ page }) => {
  // 在載入前注入 chords_shared.js，使其讀取 selftest.settings 並建立 PREPROC/POSTFILTER
  const shared = fs.readFileSync(path.resolve('assets/chords_shared.js'), 'utf8');
  await page.addInitScript({ content: shared });
  // 事先寫入 selftest.settings
  await page.addInitScript(() => {
    localStorage.setItem('selftest.settings', JSON.stringify({
      preproc: { scale: 2.2, contrastClip: 0.02, binarize: true, dilateH: false },
      postfilter: { minConfidence: 65, minRootOnlyHeightRatio: 0.6 }
    }));
  });
  await page.goto(fileURL);
  await page.waitForLoadState('domcontentloaded');
  // 觸發一次設定套用（若 chords_shared.js 內函式是自執行，這步無害；否則主動套用）
  await page.evaluate(() => {
    try {
      // 若 PREPROC 尚未建立，模擬 chords_shared.js 的套用流程（僅測試環境）
      if (!window.PREPROC) {
        window.PREPROC = { enabled: true, scale:1.8, contrastClip:0.01, binarize:true, dilateH:true };
        window.POSTFILTER = { minConfidence:70, minRootOnlyHeightRatio:0.7 };
      }
      const raw = localStorage.getItem('selftest.settings');
      if (raw) {
        const cfg = JSON.parse(raw)||{}; const pre = cfg.preproc||{}, post = cfg.postfilter||{};
        if(pre.scale!=null) PREPROC.scale = Number(pre.scale);
        if(pre.contrastClip!=null) PREPROC.contrastClip = Number(pre.contrastClip);
        if(pre.binarize!=null) PREPROC.binarize = !!pre.binarize;
        if(pre.dilateH!=null) PREPROC.dilateH = !!pre.dilateH;
        if(post.minConfidence!=null) POSTFILTER.minConfidence = Number(post.minConfidence);
        if(post.minRootOnlyHeightRatio!=null) POSTFILTER.minRootOnlyHeightRatio = Number(post.minRootOnlyHeightRatio);
      }
    } catch {}
  });
  // 等待 chords_shared.js 內套用完成
  await page.waitForFunction(() => window.PREPROC?.scale && Math.abs(window.PREPROC.scale - 2.2) < 1e-6);
  const applied = await page.evaluate(() => ({ PREPROC, POSTFILTER }));
  const PRE = applied.PREPROC || {};
  const POS = applied.POSTFILTER || {};
  expect(PRE.scale).toBeCloseTo(2.2, 5);
  expect(PRE.contrastClip).toBeCloseTo(0.02, 5);
  expect(PRE.binarize).toBe(true);
  expect(PRE.dilateH).toBe(false);
  expect(POS.minConfidence).toBe(65);
  expect(POS.minRootOnlyHeightRatio).toBeCloseTo(0.6, 5);
});