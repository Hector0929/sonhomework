import { test, expect } from '@playwright/test';
import path from 'path';

const fileURL = 'file://' + path.resolve('chords_tranport.html');

test('TransposeModule 基本移調 applyTranspose', async ({ page }) => {
  await page.goto(fileURL);
  await page.waitForLoadState('domcontentloaded');
  const ok = await page.evaluate(() => !!window.TransposeModule);
  test.skip(!ok, 'TransposeModule 尚未載入');

  const result = await page.evaluate(() => {
    const tokens = [
      { kind: 'chord', text: 'C', x:0,y:0,w:10,h:10 },
      { kind: 'chord', text: 'G/B', x:20,y:0,w:10,h:10 },
      { kind: 'lyric', text: 'Hello', x:40,y:0,w:10,h:10 },
    ];
    return window.TransposeModule.applyTranspose(tokens, 'C', 'D');
  });
  expect(result.map(t=>t.text)).toEqual(['D','A/C#','Hello']);
});

test('TransposeModule 零差距與負向差距', async ({ page }) => {
  await page.goto(fileURL);
  await page.waitForLoadState('domcontentloaded');
  const ok = await page.evaluate(() => !!window.TransposeModule);
  test.skip(!ok, 'TransposeModule 尚未載入');

  const same = await page.evaluate(() => window.TransposeModule.applyTranspose([{kind:'chord',text:'F'}], 'C','C')[0].text);
  expect(same).toBe('F');
  const down = await page.evaluate(() => window.TransposeModule.applyTranspose([{kind:'chord',text:'F#'}], 'F#','F')[0].text);
  // F# 往下半音 → F
  expect(down).toBe('F');
});
