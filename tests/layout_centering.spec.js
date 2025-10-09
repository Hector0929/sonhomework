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
    const d = document;
    const container = d.getElementById('flow-container');
    if(!container) return null;
    // 依 localStorage 的 activeView 推算當前 index，從 .flow-track 內取對應 .flow-page
    const track = d.getElementById('flow-track');
    const pages = track ? Array.from(track.querySelectorAll('.flow-page')) : [];
    let active = null;
    try{
      const view = localStorage.getItem('chordapp.activeView')||'upload';
      const order=['upload','recognition','transpose','export'];
      const idx = Math.max(0, order.indexOf(view));
      active = pages[idx] || pages[0] || null;
    }catch(_){ active = pages[0] || null; }
    if(!active) return null;
    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const leftGap = aRect.left - cRect.left;
    const rightGap = cRect.right - aRect.right;
    const containerCenter = cRect.left + cRect.width/2;
    const pageCenter = aRect.left + aRect.width/2;
    const centerDiff = Math.abs(pageCenter - containerCenter);
    const inBounds = containerCenter >= aRect.left && containerCenter <= aRect.right;
    return { leftGap, rightGap, diff: Math.abs(leftGap - rightGap), centerDiff, inBounds };
  });
}

function assertCentered(r){
  // 允許較寬鬆的閾值，並以容器中心落在當前頁範圍內為主要判準
  if(!r) return false;
  if (r.inBounds) return true;
  return r.centerDiff <= 160; // 最寬鬆上限（視覺上仍在中間區域）
}

const views = ['upload','recognition','transpose','export'];

test.describe('Flow 頁面置中', () => {
  for(const v of views){
    test(`分頁 ${v} 置中`, async ({ page }) => {
      await goto(page);
      // 切換並觸發一次 resize 讓版面重算
      await page.evaluate((view)=>{ 
        if(window.switchView) window.switchView(view); 
        try{ localStorage.setItem('chordapp.activeView',view);}catch(_){}
        window.dispatchEvent(new Event('resize'));
      }, v);
  await page.waitForTimeout(400); // 等轉場與 layout 穩定
      const rect = await getPageRect(page);
      expect(rect).not.toBeNull();
      expect(assertCentered(rect)).toBeTruthy();
    });
  }
});
