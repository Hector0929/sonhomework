import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('assets/chords_shared.js 純函式', () => {
  test.beforeEach(async ({ page }) => {
    const sharedJs = fs.readFileSync(path.resolve('assets/chords_shared.js'), 'utf8');
    await page.addInitScript(sharedJs);
    await page.goto('about:blank');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => !!window.Chords);
  });

  test('canonicalizeChordText 正規化', async ({ page }) => {
    const out = await page.evaluate(() => {
      const { canonicalizeChordText } = window.Chords;
      return [
        canonicalizeChordText('cΔ7/gb'),
        canonicalizeChordText('Bbmaj7'),
        canonicalizeChordText('Fø'),
        canonicalizeChordText('A°7'),
        canonicalizeChordText("C''m7"),
        canonicalizeChordText('g#'),
      ];
    });
    expect(out).toEqual(['Cmaj7/Gb', 'Bbmaj7', 'm7b5', 'dim7', 'C#m7', 'G#']);
  });

  test('isChordToken 識別', async ({ page }) => {
    const out = await page.evaluate(() => {
      const { isChordToken } = window.Chords;
      return [
        isChordToken('C'), isChordToken('C#m7'), isChordToken('Bbmaj7'),
        isChordToken('G7b9/E'), isChordToken('Fø'), isChordToken('H'), isChordToken('Z9'),
      ];
    });
    // Fø 會被正規化為 m7b5（無根音），非完整和弦 token
    expect(out).toEqual([true, true, true, true, false, false, false]);
  });

  test('transposeChordText / currentOffset', async ({ page }) => {
    const out = await page.evaluate(() => {
      const { transposeChordText, currentOffset } = window.Chords;
      return {
        t1: transposeChordText('Emaj7/C#', -1),
        t2: transposeChordText('Dm7/Bb', -2),
        t3: transposeChordText('Fdim7', 3),
        t4: transposeChordText('A7b9/C#', 1),
        off: currentOffset('C', 'D'),
      };
    });
    const norm = (s) => s.replace('/D#', '/Eb').replace('A#', 'Bb').replace('/C#', '/Db');
    expect({ ...out, t1: norm(out.t1), t2: norm(out.t2), t3: norm(out.t3), t4: norm(out.t4) })
      .toEqual({ t1: 'D#maj7/C', t2: 'Cm7/Ab', t3: 'G#dim7', t4: 'Bb7b9/D', off: 2 });
  });
});
