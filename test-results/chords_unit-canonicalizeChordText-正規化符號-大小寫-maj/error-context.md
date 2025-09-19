# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - heading "簡譜和弦轉換" [level=1] [ref=e3]
    - tablist [ref=e4]:
      - tab "讀取" [selected] [ref=e5] [cursor=pointer]
      - tab "辨識編輯" [ref=e6] [cursor=pointer]
      - tab "移調" [ref=e7] [cursor=pointer]
      - tab "匯出" [ref=e8] [cursor=pointer]
  - main [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11] [cursor=pointer]:
        - img [ref=e13] [cursor=pointer]
        - paragraph [ref=e16] [cursor=pointer]: 拖曱檔案到這裡或點擊上傳
        - paragraph [ref=e17] [cursor=pointer]:
          - generic [ref=e18] [cursor=pointer]: 支援格式：JPG, PNG, PDF
      - generic [ref=e19]:
        - heading "AI 辨識（Google Gemini）" [level=3] [ref=e20]
        - generic [ref=e21]:
          - textbox "輸入你的 Gemini API key（僅存於本機）" [ref=e22]
          - button "儲存金鑰" [ref=e23] [cursor=pointer]
          - button "清除" [ref=e24] [cursor=pointer]
        - generic [ref=e25]:
          - generic [ref=e26]:
            - checkbox "啟用 AI 辨識" [ref=e27]
            - text: 啟用 AI 辨識
          - button "使用 AI 辨識" [disabled] [ref=e28] [cursor=pointer]
```