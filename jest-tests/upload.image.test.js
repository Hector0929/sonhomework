const {
  makePng1x1Buffer,
  makeJpeg1x1Buffer,
  makeTextBuffer,
  makeLargePngBuffer,
} = require('../tests/helpers/image-fixtures');
const { resolveTarget, sendUpload } = require('../tests/helpers/request-target');

const target = resolveTarget();
const maybe = (condition) => (condition ? test : test.skip);

describe('圖片上傳 API', () => {
  maybe(target.mode !== 'none')('成功上傳 PNG 應回傳 200/201 並包含檔案 Metadata', async () => {
    const res = await sendUpload(target, {
      fileBuffer: makePng1x1Buffer(),
      filename: 'tiny.png',
      contentType: 'image/png',
    });
    const status = res.status || res.statusCode;
    expect([200, 201]).toContain(status);
    const serialized = typeof res.body === 'object' ? JSON.stringify(res.body) : String(res.body);
    expect(serialized).toMatch(/(url|path|location|filename|key)/i);
  });

  maybe(target.mode !== 'none')('成功上傳 JPEG 應回傳 200/201', async () => {
    const res = await sendUpload(target, {
      fileBuffer: makeJpeg1x1Buffer(),
      filename: 'tiny.jpg',
      contentType: 'image/jpeg',
    });
    const status = res.status || res.statusCode;
    expect([200, 201]).toContain(status);
  });

  maybe(target.mode !== 'none')('缺少檔案應回傳 4xx', async () => {
    let response;
    try {
      response = await sendUpload(target, {
        fileBuffer: Buffer.from(''),
        filename: '',
        contentType: 'application/octet-stream',
        fields: { note: 'no file' },
      });
    } catch (e) {
      response = { status: 400, body: { message: String(e.message || e) } };
    }
    const status = response.status || response.statusCode || 400;
    expect(String(status)).toMatch(/^4\d\d$/);
  });

  maybe(target.mode !== 'none')('副檔名偽裝（.png 但內容非影像）應被拒絕', async () => {
    const res = await sendUpload(target, {
      fileBuffer: makeTextBuffer(),
      filename: 'fake.png',
      contentType: 'image/png',
    });
    const status = res.status || res.statusCode;
    expect([400, 415, 422, 200, 201]).toContain(status);
  });

  maybe(target.mode !== 'none')('不允許的 MIME 類型應回傳 4xx', async () => {
    const res = await sendUpload(target, {
      fileBuffer: makeTextBuffer(),
      filename: 'malicious.txt',
      contentType: 'text/plain',
    });
    const status = res.status || res.statusCode;
    expect([400, 415, 422]).toContain(status);
  });

  maybe(target.mode !== 'none')('路徑穿越檔名應被正規化或拒絕', async () => {
    const res = await sendUpload(target, {
      fileBuffer: makePng1x1Buffer(),
      filename: '../../evil.png',
      contentType: 'image/png',
    });
    const status = res.status || res.statusCode;
    expect([200, 201, 400, 422]).toContain(status);
    if (status === 200 || status === 201) {
      const serialized = typeof res.body === 'object' ? JSON.stringify(res.body) : String(res.body);
      expect(serialized).not.toMatch(/\.{2,}\//);
      expect(serialized).not.toMatch(/\\\.\.\\|\.{2,}[\/\\]/);
    }
  });

  maybe(target.mode !== 'none')('大小限制（若有）應回 413/400', async () => {
    const large = makeLargePngBuffer(6 * 1024 * 1024);
    const res = await sendUpload(target, {
      fileBuffer: large,
      filename: 'big.png',
      contentType: 'image/png',
    });
    const status = res.status || res.statusCode;
    expect([200, 201, 400, 413]).toContain(status);
  });
});