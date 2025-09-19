const path = require('path');
const axios = require('axios').default;
const FormData = require('form-data');

let supertest = null;

function getEnv(name, defaultValue) {
  const v = process.env[name];
  return v == null || v === '' ? defaultValue : v;
}

function resolveTarget() {
  const appModulePath = process.env.APP_MODULE_PATH;
  const baseUrl = process.env.UPLOAD_BASE_URL;

  const route = getEnv('UPLOAD_ROUTE', '/api/upload/image');
  const fieldName = getEnv('UPLOAD_FIELD', 'file');

  const authHeaderName = process.env.AUTH_HEADER_NAME;
  const authHeaderValue = process.env.AUTH_HEADER_VALUE;

  if (appModulePath) {
    const abs = path.isAbsolute(appModulePath)
      ? appModulePath
      : path.join(process.cwd(), appModulePath);
    const app = require(abs);
    supertest = require('supertest');
    return { mode: 'app', app, route, fieldName, authHeaderName, authHeaderValue };
  }

  if (baseUrl) {
    return { mode: 'http', baseUrl: baseUrl.replace(/\/+$/, ''), route, fieldName, authHeaderName, authHeaderValue };
  }

  return { mode: 'none', route, fieldName, authHeaderName, authHeaderValue };
}

async function sendUpload(target, { fileBuffer, filename, contentType, fields = {} }) {
  if (target.mode === 'app') {
    let req = supertest(target.app).post(target.route);
    if (target.authHeaderName && target.authHeaderValue) {
      req = req.set(target.authHeaderName, target.authHeaderValue);
    }
    Object.entries(fields).forEach(([k, v]) => {
      req = req.field(k, String(v));
    });
    req = req.attach(target.fieldName, fileBuffer, { filename, contentType });
    return req;
  }

  if (target.mode === 'http') {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, String(v)));
    form.append(target.fieldName, fileBuffer, { filename, contentType });
    const headers = { ...form.getHeaders() };
    if (target.authHeaderName && target.authHeaderValue) {
      headers[target.authHeaderName] = target.authHeaderValue;
    }
    const url = `${target.baseUrl}${target.route}`;
    try {
      const res = await axios.post(url, form, { headers, maxBodyLength: Infinity, validateStatus: () => true });
      return { status: res.status, body: res.data, headers: res.headers };
    } catch (err) {
      if (err.response) {
        return { status: err.response.status, body: err.response.data, headers: err.response.headers };
      }
      throw err;
    }
  }

  throw new Error('未設定目標，請提供 APP_MODULE_PATH 或 UPLOAD_BASE_URL');
}

module.exports = { resolveTarget, sendUpload };
