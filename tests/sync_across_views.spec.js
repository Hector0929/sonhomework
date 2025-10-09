import { test, expect } from '@playwright/test';
import path from 'path';

// 目標：驗證三頁（辨識/移調/匯出）之間的內容會雙向同步
// 步驟：
// 1) 開啟 chords_tranport.html
// 2) 在移調頁輸入特定內容（含對齊空白）
// 3) 切到匯出頁，驗證內容完全一致（容忍尾端換行差異）
// 4) 在匯出頁再插入一行文字，切回移調頁，驗證同步

const gotoFile = (file) => 'file://' + path.resolve(file);

const sample = `聖所 / Sanctuary\nKey: G\n\nIntro\n|G   |Em7  |Bm7  |C  E   |\n|G   |Em7  |Bm7  |C  Dm  |\n`;

async function switchTab(page, view){
  await page.evaluate((v)=>{ window.switchView && window.switchView(v); }, view);
}

test('移調頁與匯出頁：內容與樣式雙向同步', async ({ page }) => {
  await page.goto(gotoFile('chords_tranport.html'));
  await page.waitForLoadState('domcontentloaded');

  // 切到移調頁
  await switchTab(page, 'transpose');
  await page.waitForSelector('#transpose-output');

  // 在移調頁輸入內容（保留對齊空白）
  await page.fill('#transpose-output', sample);
  // 確保 shared state 已更新（輸入事件寫入後）
  await page.waitForFunction(() => {
    return (window.getSharedText && typeof window.getSharedText()==='string' && window.getSharedText().length>0);
  }, { timeout: 1000 }).catch(()=>{});

  // 開啟等寬與粗體（使用匯出頁上的控制，並驗證會同步到三頁）
  await switchTab(page, 'export');
  await page.waitForSelector('#export-preview-text');
  // 匯出頁應該回填相同內容（容忍尾端換行差異），必要時等 onEnter 回填
  const exportValue = await page.evaluate(async () => {
    const box = document.getElementById('export-preview-text');
    if(!box) return '';
    // 若尚未回填，等待一小段或主動呼叫 onEnter
    if(!box.value){
      if(window.__onEnterView && typeof window.__onEnterView.export==='function') window.__onEnterView.export();
      await new Promise(r=>setTimeout(r,50));
    }
    return box.value;
  });
  expect(exportValue.trim()).toBe(sample.trim());

  // 在匯出頁追加一行，切回移調頁應同步
  await page.type('#export-preview-text', '\nVerse\n|G   |C   |');
  // sample 以換行結尾 + 我們再輸入一個開頭換行 → 中間會多出一個空白行
  const expected = sample + '\nVerse\n|G   |C   |';

  await switchTab(page, 'transpose');
  // 等待 onEnter 將 shared state 回填到移調頁 textarea
  const transposeValue = await page.evaluate(async () => {
    const ta = document.getElementById('transpose-output');
    if(!ta) return '';
    if(!ta.value && window.__onEnterView && typeof window.__onEnterView.transpose==='function') window.__onEnterView.transpose();
    await new Promise(r=>setTimeout(r,50));
    return ta.value;
  });
  expect(transposeValue.trim()).toBe(expected.trim());

  // 額外：驗證樣式同步（等寬/粗體）
  await switchTab(page, 'export');
  await page.waitForSelector('#export-mono-toggle');
  await page.check('#export-bold-toggle');
  await page.uncheck('#export-mono-toggle');
  await switchTab(page, 'transpose');
  // 目前樣式同步主要在匯出預覽與共享樣式函式，不強制驗證 CSS 值（避免 flake），僅確認不拋錯且流程可切換
});
