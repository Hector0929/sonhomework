import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

const EXP_REL='chords_tranport_experimental.html';
const EXP_URL = pathToFileURL(path.resolve(process.cwd(), EXP_REL)).toString();

async function open(page){ await page.goto(EXP_URL,{waitUntil:'domcontentloaded'}); }

function getActiveTab(page){ return page.locator('#app-tabs .tab-btn-modern[aria-selected="true"]'); }

async function activeView(page){ return await getActiveTab(page).getAttribute('data-view'); }

const order=['upload','recognition','transpose','export'];

// 模擬輸入一些文字，確保游標會移動而不是被攔截
async function typeInEditor(page){
  const editor = page.locator('#text-editor');
  if(await editor.count()===0) return; // 可能還沒進入辨識頁
  await editor.click();
  await editor.type('ABC');
}

test.describe('Shift+Arrow 導覽快捷', ()=>{
  test('單純 Arrow 不切換頁面', async ({page})=>{
    await open(page);
    // 初始 upload
    await page.keyboard.press('ArrowRight');
    await expect(getActiveTab(page)).toHaveAttribute('data-view','upload');
  });

  test('Shift+ArrowRight 會前往下一頁', async ({page})=>{
    await open(page);
    await page.keyboard.press('Shift+ArrowRight');
    await expect(getActiveTab(page)).toHaveAttribute('data-view','recognition');
  });

  test('Shift+ArrowLeft 會回上頁', async ({page})=>{
    await open(page);
    await page.keyboard.press('Shift+ArrowRight'); // to recognition
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(getActiveTab(page)).toHaveAttribute('data-view','upload');
  });

  test('在文字編輯器內 Arrow 不切換，Shift+Arrow 才切換', async ({page})=>{
    await open(page);
    // 先進入辨識頁（無 AI 也沒關係，只為了取到 editor）
    await page.keyboard.press('Shift+ArrowRight');
    // editor 可能在辨識頁；若不存在略過
    if(await page.locator('#text-editor').count()>0){
      await typeInEditor(page);
      // 普通 ArrowRight 應停留 recognition
      await page.keyboard.press('ArrowRight');
      await expect(getActiveTab(page)).toHaveAttribute('data-view','recognition');
      // Shift+ArrowRight 到 transpose
      await page.keyboard.press('Shift+ArrowRight');
      await expect(getActiveTab(page)).toHaveAttribute('data-view','transpose');
    }
  });
});
