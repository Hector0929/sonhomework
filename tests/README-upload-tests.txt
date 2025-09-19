使用 指南（簡要）
1) 安裝相依套件：
   npm i -D jest axios form-data supertest
2) 選擇其一方式 執行 測試：
   - 程式方式（匯入 app 物件）：
     APP_MODULE_PATH=dist/app.js npx jest --config tests/jest.config.js tests/upload.image.test.js
   - HTTP 方式（呼叫已啟動伺服器）：
     UPLOAD_BASE_URL=http://localhost:3000 npx jest --config tests/jest.config.js tests/upload.image.test.js
3) 可選環境參數：
   UPLOAD_ROUTE=/api/upload/image
   UPLOAD_FIELD=file
   AUTH_HEADER_NAME=Authorization
   AUTH_HEADER_VALUE=Bearer <token>
備註：若路由/欄位名不同，請用環境參數覆寫，以維持測試與實作的相容性。
