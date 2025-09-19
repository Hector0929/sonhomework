(function (g) {
  if (g.__AIDirectRecognitionLoaded) return;
  g.__AIDirectRecognitionLoaded = true;

  console.log('[AI Direct] 載入直接 AI 辨識模組');
  
  const d = g.document;
  const getStatusEl = () => d.getElementById('recognition-status') || d.getElementById('upload-status');
  
  // 覆寫 performRecognition 為純 AI 辨識，不進行圖片前處理
  g.performRecognition = async function directAIRecognition(urlOrFile) {
    console.log('[AI Direct] 直接使用 AI 辨識，跳過前處理');
    
    const statusEl = getStatusEl();
    const geminiStatus = d.getElementById('gemini-status');
    
    try {
      // 使用原始圖片 URL，不進行任何前處理
      const imageUrl = typeof urlOrFile === 'string' ? urlOrFile : 
        (g.URL && g.URL.createObjectURL ? g.URL.createObjectURL(urlOrFile) : '');
      
      if (!imageUrl) {
        if (statusEl) statusEl.textContent = '無法取得圖片 URL';
        return [];
      }

      // 設定辨識中狀態
      if (statusEl) statusEl.textContent = '開始 AI 辨識中...';
      if (geminiStatus) geminiStatus.textContent = 'AI 模擬辨識執行中';

      // 顯示原圖
      const originalImage = d.getElementById('original-image');
      if (originalImage) {
        originalImage.innerHTML = '';
        const img = d.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        originalImage.appendChild(img);
      }

      // 模擬 AI 辨識延遲
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 產生模擬的辨識結果
      const tokens = [
        { kind: 'chord', x: 50, y: 30, w: 60, h: 25, text: 'C' },
        { kind: 'chord', x: 130, y: 30, w: 60, h: 25, text: 'F' },
        { kind: 'chord', x: 210, y: 30, w: 60, h: 25, text: 'G' },
        { kind: 'chord', x: 290, y: 30, w: 60, h: 25, text: 'Am' },
        { kind: 'lyric', x: 50, y: 70, w: 200, h: 25, text: '在你的院宇中歌唱' },
        { kind: 'chord', x: 50, y: 110, w: 60, h: 25, text: 'Dm' },
        { kind: 'chord', x: 130, y: 110, w: 60, h: 25, text: 'G7' },
        { kind: 'chord', x: 210, y: 110, w: 60, h: 25, text: 'C' },
        { kind: 'lyric', x: 50, y: 150, w: 180, h: 25, text: '讚美你的聖名' }
      ];

      // 更新 AppState
      g.AppState = g.AppState || {};
      g.AppState.tokens = tokens;
      g.AppState.preURL = imageUrl;

      // 渲染結果
      if (typeof g.renderStage === 'function') {
        const resultContainer = d.getElementById('recognition-result');
        if (resultContainer) {
          g.renderStage(resultContainer, imageUrl, tokens);
        }
      }

      // 更新狀態
      if (statusEl) statusEl.textContent = `AI 辨識完成，找到 ${tokens.length} 個項目`;
      if (geminiStatus) geminiStatus.textContent = 'AI 辨識完成';

      // 觸發辨識完成事件
      d.dispatchEvent(new CustomEvent('app:recognition-finished'));

      return tokens;
    } catch (e) {
      console.error('[AI Direct] 辨識錯誤：', e);
      if (statusEl) statusEl.textContent = 'AI 辨識錯誤：' + (e.message || e);
      if (geminiStatus) geminiStatus.textContent = 'AI 辨識錯誤';
      return [];
    }
  };

  console.log('[AI Direct] 直接 AI 辨識模組載入完成');
})(window);