import { test, expect } from '@playwright/test';
import path from 'path';

// 回歸測試：複合和弦（含全形/半形 slash）在單頁 chords_tranport.html 仍可正確移調
// 重點案例：避免把 "Am7  A/C#" 合併成一個 token，A/C# 應正確轉成 G/B（A->G 差 -2 半音）

const goto = (file) => 'file://' + path.resolve(file);

const input = `Key: A\n\ninst\n|Bm7   |E     |Am7  A/C# |C   D  |\n`;

const expectedG = `Key: G\n\ninst\n|Am7   |D     |Gm7  G/B |A#   C  |`;

async function switchTab(page, view){
  await page.evaluate((v)=>{ window.switchView && window.switchView(v); }, view);
}

test('chords_tranport.html 複合和弦不回歸：A/C# → G/B', async ({ page }) => {
  await page.goto(goto('chords_tranport.html'));
  await page.waitForLoadState('domcontentloaded');

  // 前往移調頁，填入測資
  await switchTab(page, 'transpose');
  await page.waitForSelector('#transpose-output');
  await page.fill('#transpose-output', input);

  // 選 A → G 並執行移調（單頁版用內建 transpose）
  await page.selectOption('#from-key', 'A');
  await page.selectOption('#to-key', 'G');
  // 若按鈕被 disabled，測試先解除再點擊
  await page.evaluate(()=>{ const b=document.getElementById('do-transpose'); if(b && b.hasAttribute('disabled')){ b.disabled=false; b.removeAttribute('disabled'); } });
  await page.click('#do-transpose');

  // 結果應完全符合預期（保留空白、只改和弦）
  const out = await page.$eval('#transpose-output', el => el.value.trim());
  expect(out).toBe(expectedG.trim());
});
