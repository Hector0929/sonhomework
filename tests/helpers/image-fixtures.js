// 測試用影像/檔案緩衝資料 工具（Node 環境）

const ONE_BY_ONE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgMBAp4lS8QAAAAASUVORK5CYII=';

function makePng1x1Buffer() {
  return Buffer.from(ONE_BY_ONE_PNG_BASE64, 'base64');
}

// 簡單 1x1 JPEG（JFIF header）
const ONE_BY_ONE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfAA//2Q==';

function makeJpeg1x1Buffer() {
  return Buffer.from(ONE_BY_ONE_JPEG_BASE64, 'base64');
}

// 純文字檔（模擬副檔名偽裝但內容不是影像）
function makeTextBuffer() {
  return Buffer.from('THIS_IS_NOT_AN_IMAGE');
}

// 產生近似指定大小的 PNG 緩衝資料（以有效 PNG 為基底，重複填充資料段）
// 注意：非嚴格有效影像，但通常可觸發伺服器的大小檢查
function makeLargePngBuffer(targetBytes = 5 * 1024 * 1024) {
  const base = makePng1x1Buffer();
  if (base.length >= targetBytes) return base;
  const pad = Buffer.alloc(Math.max(0, targetBytes - base.length), 0);
  return Buffer.concat([base, pad]);
}

module.exports = {
  makePng1x1Buffer,
  makeJpeg1x1Buffer,
  makeTextBuffer,
  makeLargePngBuffer,
};
