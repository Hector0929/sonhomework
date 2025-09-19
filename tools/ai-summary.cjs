import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html', open: 'never' }],
    ['json', { outputFile: 'tests/.ai/ai-latest.json' }],
  ],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});



// filepath: package.json
{
  // ...existing code...
  "scripts": {
    // ...existing code...
    "ai:test": "npx playwright test --config=playwright.ai.config.ts || true && node tools/ai-summary.cjs tests/.ai/ai-latest.json",
    "ai:test:ui": "npx playwright show-report test-results/html"
  }
  // ...existing code...
}



// filepath: tools/ai-summary.cjs
// 簡易失敗摘要器：解析 Playwright json 報告並列印精華
const fs = require('fs');
const path = require('path');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('[ai-summary] 無法讀取或解析', p, e.message);
    process.exit(1);
  }
}

function main() {
  const input = process.argv[2] || 'tests/.ai/ai-latest.json';
  const abs = path.resolve(process.cwd(), input);
  if (!fs.existsSync(abs)) {
    console.error('[ai-summary] 找不到結果檔：', abs);
    process.exit(1);
  }
  const report = readJson(abs);
  const suites = report.suites || [];
  let failed = 0;
  let total = 0;

  const lines = [];
  for (const s of suites) {
    for (const suite of (s.suites || [])) {
      for (const spec of (suite.specs || [])) {
        for (const t of (spec.tests || [])) {
          total++;
          const res = (t.results || [])[0] || {};
          const status = res.status || 'unknown';
          if (status !== 'passed') {
            failed++;
            const err = ((res.errors || [])[0]) || {};
            const msg = (err.message || res.error?.message || '').trim();
            const stack = (err.stack || res.error?.stack || '').split('\n').slice(0, 6).join('\n');
            lines.push([
              `✖ ${spec.title}`,
              `  file: ${suite.location?.file}:${spec.location?.line || 0}`,
              `  status: ${status}`,
              msg ? `  message: ${msg}` : '',
              stack ? `  stack:\n${stack}` : '',
            ].filter(Boolean).join('\n'));
          }
        }
      }
    }
  }

  if (failed === 0) {
    console.log(`✅ All tests passed (${total})`);
    console.log('報告：test-results/html');
    process.exit(0);
  } else {
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(lines.join('\n\n'));
    console.log('\n報告：test-results/html');
    process.exit(0); // 保持 0 讓腳本繼續（利於你持續 執行 與回饋）
  }
}

main();



// filepath: .github/workflows/ai-test.yml
name: AI Test Loop
on:
  workflow_dispatch:
  pull_request:
    branches: [ main, master ]
    paths:
      - 'tests/**'
      - 'public/**'
      - 'playwright.*'
      - 'package.json'
      - 'package-lock.json'
      - '.github/workflows/ai-test.yml'

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install deps
        run: |
          npm ci
          npx playwright install --with-deps

      - name: Build (如果需要)
        run: |
          if [ -f package.json ] && cat package.json | jq -e '.scripts.build' >/dev/null 2>&1; then
            npm run build
          else
            echo "skip build"
          fi

      - name: Run tests (AI config)
        run: npx playwright test --config=playwright.ai.config.ts || true

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: test-results/html

      - name: Upload JSON summary
        uses: actions/upload-artifact@v4
        with:
          name: ai-latest-json
          path: tests/.ai/ai-latest.json

      - name: Summarize to PR
        if: ${{ github.event_name == 'pull_request' }}
        run: |
          node tools/ai-summary.cjs tests/.ai/ai-latest.json > ai-summary.txt
          echo "AI Test Summary generated."

      - name: Comment summary
        if: ${{ github.event_name == 'pull_request' }}
        uses: thollander/actions-comment-pull-request@v2
        with:
          filePath: ai-summary.txt