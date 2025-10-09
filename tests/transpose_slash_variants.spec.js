import { test, expect } from '@playwright/test';
import path from 'path';

const goto = (f) => 'file://' + path.resolve(f);
async function switchTab(page, view){ await page.evaluate(v=>window.switchView&&window.switchView(v), view); }

// 涵蓋：半形/全形/有空白/單一 token 行
const cases = [
  { from:'A', to:'G', in:'A/C#', out:'G/B' },
  { from:'A', to:'G', in:'A／C#', out:'G／B' },
  { from:'A', to:'G', in:'A / C#', out:'G / B' },
  { from:'A', to:'G', in:'|Bm7   |E     |Am7  A/C# |C   D  |', out:'|Am7   |D     |Gm7  G/B |A#   C  |' },
];

test.describe('複合和弦（slash）變體皆可正確移調', ()=>{
  for(const c of cases){
    test(`${c.in} -> ${c.out} (${c.from}→${c.to})`, async ({ page }) => {
      await page.goto(goto('chords_tranport.html'));
      await page.waitForLoadState('domcontentloaded');
      await switchTab(page, 'transpose');
      await page.waitForSelector('#transpose-output');
  await page.fill('#transpose-output', `Key: ${c.from}\n${c.in}`);
      await page.selectOption('#from-key', c.from);
      await page.selectOption('#to-key', c.to);
  // 單頁版按鈕預設 disabled，測試中直接啟用以覆蓋邏輯
  await page.evaluate(()=>{ const b=document.getElementById('do-transpose'); if(b) b.disabled=false; });
  await page.click('#do-transpose');
  const got = await page.$eval('#transpose-output', el=>el.value);
  expect(got.trim()).toContain(`Key: ${c.to}`); // 有 Key 行時應更新為目標調
      expect(got).toContain(c.out);
    });
  }
});
