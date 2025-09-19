(function (g) {
  if (g.__SkipOCRWhenTokensLoaded) return;
  g.__SkipOCRWhenTokensLoaded = true;

  const d = g.document;
  const getStatusEl = () => d.getElementById('recognition-status') || d.getElementById('upload-status');
  const finish = (text) => {
    const el = getStatusEl();
    if (el) el.textContent = text || '辨識完成';
    d.dispatchEvent(new CustomEvent('app:recognition-finished'));
  };

  const orig = g.performRecognition;

  g.performRecognition = async function wrappedPerformRecognition(urlOrFile) {
    const hasTokens = !!(g.AppState && Array.isArray(g.AppState.tokens) && g.AppState.tokens.length > 0);
    
    if (hasTokens) {
      console.log('[SkipOCR] 使用既有 tokens，跳過 OCR');
      finish('辨識完成 (使用快取)');
      return g.AppState.tokens;
    }

    if (typeof orig !== 'function') {
      finish('(後備) 辨識完成');
      return [];
    }

    try {
      const result = await orig(urlOrFile);
      const el = getStatusEl();
      if (el && !/完成|錯誤/.test(el.textContent || '')) {
        finish('辨識完成');
      }
      return result;
    } catch (e) {
      finish('辨識錯誤：' + (e && e.message || e));
      return [];
    }
  };
})(window);