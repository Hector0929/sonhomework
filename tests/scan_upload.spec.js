import { test, expect } from '@playwright/test';
import os from 'os';
import fs from 'fs';
import path from 'path';

const fileURL = 'file://' + path.resolve('pages/scan.html');
const ONE_PX_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axhCpgAAAAASUVORK5CYII=';

test('Scan 上傳後應顯示預覽並啟用下一步', async ({ page }) => {
  // 準備臨時圖片檔
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'));
  const imgPath = path.join(dir, 'onepx.png');
  fs.writeFileSync(imgPath, Buffer.from(ONE_PX_PNG, 'base64'));

  try {
    await page.goto(fileURL);
    await page.waitForLoadState('domcontentloaded');

    // 上傳檔案
    const input = page.locator('#file-input');
    await input.setInputFiles(imgPath);

    // 應顯示預覽，並啟用下一步
    await expect(page.locator('#preview-pane')).toBeVisible();
    await expect(page.locator('#go-recognize')).toBeEnabled();

    // 點擊導頁到 recognize.html
    await page.click('#go-recognize');
    await page.waitForURL(/recognize\.html$/);
    await expect(page).toHaveTitle(/辨識結果|Chord Pages/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
