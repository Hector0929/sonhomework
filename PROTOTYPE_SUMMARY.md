# 第一階段 Prototype 歷程總結

> 本檔案整理 2025-10-01 ~ 2025-10-02 期間主要里程、遇到的困難與解法。格式：日期 / 做了什麼事 / 怎麼解決。

## 2025-10-01

### 1. 打通核心流程：上傳 → 辨識 → 移調 → 匯出
- 問題：缺乏一致頁面切換與 fallback，易出現使用者迷路或初始化失敗。
- 解法：建立 `switchView` 以陣列順序管理四頁；使用 `transform:translateX` 實現水平切換並加上 `scrollLeft` 後備；監聽 `error` 事件輸出提示，避免靜默錯誤。

### 2. AI 金鑰與啟用開關
- 問題：Gemini API Key 欄位與測試腳本期望的 ID 不一致；使用者忘記是否啟用 AI。
- 解法：提供主/副兩個輸入 (`#api-key`, `#gemini-api-key`) 互為 alias；加入 `#use-gemini-ai` checkbox 控制啟用；未載入檔案時辨識按鈕 disabled。

### 3. 辨識文字格式走樣 / 空白對齊
- 問題：OCR 輸出行距與空白消失導致和弦列錯位。
- 解法：使用 `<textarea>` + `white-space: pre` 保留原樣；封裝 `gatherCurrentContent()` 決定匯出優先來源（移調結果 > 編輯器 > 原始）。

### 4. 和弦移調需排除歌詞
- 問題：歌詞與和弦混雜，若全部替換會破壞歌詞。
- 解法：利用正規或字元規則判斷「像和弦」 token 才轉；建立 12 半音索引表做位移；保留非和弦部分原樣。

### 5. 匯出 PNG/PDF 內容過長分頁與清晰度
- 問題：長譜面截圖模糊、PDF 斷行不對齊。
- 解法：離線固定寬度隱藏容器（寬 860px, padding 32px）→ html2canvas(scale=2) 截圖；PDF 依頁高切片逐頁 addImage。

### 6. Tab 切換狀態記憶
- 問題：重新整理後回到第一頁造成流程斷裂。
- 解法：localStorage 保存 `activeView`；初始化讀取後自動還原。

### 7. 預覽同步
- 問題：Hero 區與上傳區顯示不一致造成混淆。
- 解法：`syncPreview(file)` 同步兩個區塊；當檔案移除/更換時即時更新。

### 8. 初版視覺不一致
- 問題：多種臨時樣式與不規則間距。
- 解法：建立設計 Token（色彩、間距、圓角、字級、陰影變數）；抽出 `panel-modern`, `paper-surface`, `subtle-label` 等樣式結構化。

## 2025-10-02

### 9. Tab 造型與上方間距調整
- 問題：預設膠囊形與需求不符；與頂邊距離不足。
- 解法：改為 `border-radius:14px` 長方圓角；加 `margin-top:20px`；調整 padding 為 `10px 22px`。

### 10. 各頁差異高度 / 底部留白
- 問題：頁面高度不齊，空白不一致。
- 解法：`.flow-page` 設定 `min-height:calc(100vh - 160px)`；保持底部 padding；內部採統一 panel 結構。

### 11. 面板垂直間距統一
- 問題：第一面板 inline `margin-top:8px` 與其他不一致。
- 解法：移除 inline；全域 `#flow-container .panel-modern{margin-top:32px;}` 統一控制。

### 12. 水平頁面間隙 (gap) 與對齊偏移
- 問題：加入 gap 後 `translateX(-index*100%)` 導致視覺不置中。
- 解法：`.flow-track` 加 `gap:40px`；`.flow-page` 改寬 `calc(100% - 40px)`；`switchView` 計算 `(pageWidth + gap)*index - centerAdjust` 精準 transform；resize 重新計算。

### 13. 加 gap 後仍需保留過渡動畫
- 問題：僅用 scrollLeft 不夠平滑。
- 解法：保留 transform 過渡並輔助像素位移；若取不到寬度 fallback 百分比方案。

### 14. 置中上方四個按鈕
- 問題：按鈕列初始靠左。
- 解法：`#app-tabs` 改 `justify-content:center`。

### 15. 首頁新增捷徑
- 問題：使用者無法快速回到和弦工具。
- 解法：於首頁音樂工具區新增指向 `chords_tranport.html` 的按鈕。

### 16. 匯出適時刷新
- 問題：匯出內容有時為過期版本。
- 解法：`refreshExportPreview()` 在切換至匯出頁或按下重新載入 / 匯出前執行。

### 17. 測試期望的元素 ID 不齊
- 問題：自動化測試找不到指定 ID。
- 解法：加入 `#recognize-ai-btn`, `#gemini-api-key` 等 alias 隱藏節點保留 API 相容性。

### 18. PDF 長內容切割安全性
- 問題：大段內容超出單頁。
- 解法：用 while 依剩餘高度切 canvas 片段再逐頁塞入 jsPDF。

### 19. 樣式重複與維護負擔
- 問題：多段重複 CSS 造成難以後續擴充。
- 解法：規劃抽離外部 `assets/app.css`（後續已開始執行）。

## 下一階段建議 (已啟動部分)
1. 抽離所有 inline style → 完整外部 CSS。  
2. 變數化所有尺寸 (gap, radius, 動畫時間) 與主題可切換。  
3. Scroll-Snap 支援 + 慣性滑動。  
4. 方向鍵 / PageUpDown 快捷切頁。  
5. 匯出前預檢：字元數 / 預估頁數 / 和弦數。  
6. 模組化 JS：upload.js / recognition.js / transpose.js / export.js / nav.js。  
7. 加入基本單元測試 (token 分析 / 移調函式)。  

---
若需更細日誌 (每 commit / issue 追蹤) 可再擴充。歡迎指定要深化的條目。
