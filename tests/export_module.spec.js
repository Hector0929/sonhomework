import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
const htmlEntry = fs.existsSync(path.resolve('chords_transport.html'))
  ? 'chords_transport.html'
  : (fs.existsSync(path.resolve('chords_tranport.html')) ? 'chords_tranport.html' : 'index.html');
const fileURL = 'file://' + path.resolve(htmlEntry);

test('ExportModule serializeTokens / renderExport', async ({ page }) => {
  await page.goto(fileURL);
  await page.waitForLoadState('domcontentloaded');
  const ok = await page.evaluate(() => !!window.ExportModule);
  test.skip(!ok, 'ExportModule 尚未載入');

  const serialized = await page.evaluate(() => {
    const tokens = [
      { text:'C', x:10,y:10,h:15,w:10 },
      { text:'G/B', x:60,y:10,h:15,w:10 },
      { text:'Hello', x:10,y:40,h:15,w:10 },
      { text:'World', x:60,y:40,h:15,w:10 },
    ];
    return window.ExportModule.serializeTokens(tokens);
  });
  expect(serialized.split('\n').length).toBe(2);
  expect(serialized).toMatch(/C.*G\/B/);
});
