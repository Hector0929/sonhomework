// 控制「開始辨識」與「AI 辨識」按鈕啟用狀態（最小侵入補強）
(function (g) {
  if (g.RecognizeModule) return;
  const M = {};

  function qs(sel) { return document.querySelector(sel); }

  function ensureBtnEnabledOnFile() {
    const fileInput = qs('#file-input');
    const btn = qs('#recognize-btn');
    if (!fileInput || !btn) return;
    const enable = fileInput.files && fileInput.files.length > 0;
    if (enable) btn.disabled = false;
  }

  function wireFile() {
    const fileInput = qs('#file-input');
    if (fileInput && !fileInput.__recognizeBound) {
      fileInput.__recognizeBound = true;
      fileInput.addEventListener('change', ensureBtnEnabledOnFile);
    }
  }

  function init() {
    wireFile();
    ensureBtnEnabledOnFile();
  }

  M.init = init;
  g.RecognizeModule = M;
})(window);

// 影像 fixture（若之前直接貼在 HTML 內造成重複宣告 -> 以守衛避免 SyntaxError）
(function (g) {
  if (g.__ImageFixturesLoaded) return;
  g.__ImageFixturesLoaded = true;

  const ONE_BY_ONE_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgMBAp4lS8QAAAAASUVORK5CYII=';

  function makePng1x1Buffer() {
    return Uint8Array.from(atob(ONE_BY_ONE_PNG_BASE64), c => c.charCodeAt(0));
  }

  // 只在需要（例如上傳測試時）才掛載
  g.makePng1x1Buffer = g.makePng1x1Buffer || makePng1x1Buffer;
})(window || globalThis);