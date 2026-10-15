// AI 病虫害 / 苗情 / 缺素 识别云函数（生产版）
// ---------------------------------------------------------------
// 链路：客户端上传图片 → wx.cloud.uploadFile 得到 fileID → 调本函数
//  1) cloud.getTempFileURL 换取图片临时 URL
//  2) 下载图片（Buffer）
//  3) 调用可配置的识别服务（自建模型 / 云厂商植物识别），传入图片 base64
//  4) 将模型返回归一化后，匹配平台病害知识库 → 产出带合规防治方案与购买 SKU 的统一结构
//  5) 任意环节失败（未配置 / 网络异常 / 解析失败 / 低置信）一律优雅降级，不影响小程序使用
// ---------------------------------------------------------------
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const { matchDisease, normalize, buildResult, localFallback } = require('./catalog.js');

// ---- 识别服务配置（控制台环境变量优先，其次云库 config 集合）----
async function getRecognitionConfig() {
  const ep = process.env.MC_RECOGNITION_ENDPOINT;
  if (ep) {
    return {
      endpoint: ep,
      apiKey: process.env.MC_RECOGNITION_APIKEY || '',
      headers: process.env.MC_RECOGNITION_HEADERS ? safeParse(process.env.MC_RECOGNITION_HEADERS) : {}
    };
  }
  try {
    const r = await db.collection('config').doc('recognition').get();
    const d = (r && r.data) || null;
    if (d && d.endpoint) return d;
  } catch (e) { /* 集合/文档不存在，忽略 */ }
  return null;
}
function safeParse(str) { try { return JSON.parse(str); } catch (e) { return {}; } }

// ---- HTTP 工具（仅用内置模块，无额外依赖）----
function httpsGet(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    const req = mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpsGet(res.headers.location, timeout));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => req.destroy(new Error('download timeout')));
  });
}

function httpsPostJson(url, payload, headers = {}, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const u = require('url').parse(url);
    const body = JSON.stringify(payload);
    const mod = u.protocol === 'https:' ? require('https') : require('http');
    const req = mod.request({
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.path, method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers)
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(new Error('bad json from recognition service')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => req.destroy(new Error('recognition timeout')));
    req.write(body);
    req.end();
  });
}

// 调用识别服务
async function callRecognition(b64, cfg) {
  const payload = {
    image_base64: b64,
    api_key: cfg.apiKey || undefined,
    domain: 'maidong_conventional'
  };
  return httpsPostJson(cfg.endpoint, payload, cfg.headers || {});
}

// ---- 主流程 ----
exports.main = async (event) => {
  const { fileID, meta = {} } = event;
  console.log('[recognize] receive fileID:', fileID, 'meta:', meta);

  if (!fileID) {
    const data = buildResult(null, 0, { mock: true, forceComplex: true });
    return { code: 0, message: 'ok (no image, local fallback)', data };
  }

  try {
    const cfg = await getRecognitionConfig();
    if (!cfg || !cfg.endpoint) {
      console.warn('[recognize] 未配置识别服务（MC_RECOGNITION_ENDPOINT / config.recognition），使用本地兜底');
      return { code: 0, message: 'ok (local fallback)', data: localFallback(fileID) };
    }

    // 1) 下载图片
    const tmp = await cloud.getTempFileURL({ fileList: [fileID] });
    const url = tmp.fileList && tmp.fileList[0] && (tmp.fileList[0].tempFileURL || tmp.fileList[0].download_url);
    if (!url) throw new Error('no temp file url');
    const buffer = await httpsGet(url);
    const b64 = buffer.toString('base64');

    // 2) 调用识别服务
    const raw = await callRecognition(b64, cfg);
    const { label, confidence } = normalize(raw);
    console.log('[recognize] model label:', label, 'confidence:', confidence);

    // 3) 低置信度(<50)或未知 → 引导转专家，不强行开方
    if (confidence < 50 || !matchDisease(label)) {
      return { code: 0, message: 'ok', data: buildResult(matchDisease(label), confidence, { forceComplex: true }) };
    }
    // 4) 命中知识库 → 产出统一结构
    return { code: 0, message: 'ok', data: buildResult(matchDisease(label), confidence, {}) };
  } catch (e) {
    console.error('[recognize] error, fallback:', e && e.message);
    // 兜底：绝不抛错卡死前端
    return { code: 0, message: 'ok (error fallback)', data: localFallback(fileID) };
  }
};
