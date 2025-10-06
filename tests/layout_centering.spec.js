import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

const EXP_REL = 'chords_tranport_experimental.html';
const EXP_URL = pathToFileURL(path.resolve(process.cwd(), EXP_REL)).toString();

async function goto(page){
  await page.goto(EXP_URL, { waitUntil: 'domcontentloaded' });
}

async function getPageRect(page){
  return await page.evaluate(()=>{
    const container = document.getElementById('flow-container');
    const active = document.querySelector('.flow-page[data-active="true"]') || document.querySelector('.flow-page');
    if(!container || !active) return null;
    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    return { leftGap: aRect.left - cRect.left, rightGap: cRect.right - aRect.right, diff: Math.abs((aRect.left - cRect.left) - (cRect.right - aRect.right)) };
  });
}

function assertCentered(r){ return r.diff <= 3; }

const views = ['upload','recognition','transpose','export'];

test.describe('Flow 頁面置中', () => {
  for(const v of views){
    test(`分頁 ${v} 置中`, async ({ page }) => {
      await goto(page);
      // 切換
  await page.evaluate((view)=>{ window.switchView && window.switchView(view); }, v);
  await page.waitForTimeout(200); // 等轉場與 layout 穩定
      const rect = await getPageRect(page);
      expect(rect).not.toBeNull();
      expect(assertCentered(rect)).toBeTruthy();
    });
  }
});
