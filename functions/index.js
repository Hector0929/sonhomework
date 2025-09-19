/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("firebase-functions/logger");

// 建立一個可重複使用的 Google AI 客戶端執行個體
let genAI;

// 第一代 onCall 函式，避免第二代專屬資源設定衝突
exports.getWordDefinition = functions
  .region("asia-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      logger.warn("函式被未驗證的使用者呼叫。");
      throw new functions.https.HttpsError(
        "unauthenticated",
        "此函式必須在已驗證狀態下呼叫。"
      );
    }

    const word = data?.word;
    if (!word || typeof word !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "函式必須使用一個字串型態的 'word' 參數來呼叫。"
      );
    }

    try {
      if (!genAI) {
        const apiKey = functions.config().google?.apikey;
        if (!apiKey) {
          logger.error(
            "Google API 金鑰未設定。請執行：firebase functions:config:set google.apikey=\"YOUR_KEY\""
          );
          throw new functions.https.HttpsError("internal", "API 金鑰未設定。");
        }
        genAI = new GoogleGenerativeAI(apiKey);
      }

      const model = genAI.getGenerativeModel({
        // *** 修正：使用穩定版的模型名稱 ***
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              translation: { type: "STRING" },
              sentence: { type: "STRING" }
            },
            required: ["translation", "sentence"]
          }
        }
      });

      const prompt = `請提供英文單字 "${word}" 的中文翻譯和一個適合初學者的英文例句。請用 JSON 格式回傳，包含 "translation" (字串) 和 "sentence" (字串) 兩個鍵。`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // onCall 函式直接回傳物件
      return JSON.parse(text);
    } catch (error) {
      logger.error("處理請求時發生錯誤:", error);
      throw new functions.https.HttpsError(
        "internal",
        "無法從 Google AI 取得定義。",
        error?.message || error
      );
    }
  });
