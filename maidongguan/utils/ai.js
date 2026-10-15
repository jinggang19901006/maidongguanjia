// AI 病虫害/苗情识别（F6）。
// 策略：USE_CLOUD=true 时，先把图片上传到云存储，再调用 recognize 云函数；否则本地 mock 兜底。
const config = require('./config.js');
const mockData = require('./mockData.js');

function localMock(cb) {
  const list = mockData.AI_RESULTS;
  const r = list[Math.floor(Math.random() * list.length)];
  setTimeout(() => cb(r), 1400);
}

// imagePath: 拍照/相册返回的临时文件路径；cb(result)
function recognize(imagePath, cb) {
  // 未接入云或云环境不可用时，本地 mock
  if (!config.USE_CLOUD || typeof wx === 'undefined' || !wx.cloud) {
    return localMock(cb);
  }

  // 真云链路：上传图片 → 得到 fileID → 调用 recognize 云函数
  const ext = (imagePath && imagePath.match(/\.([a-zA-Z0-9]+)$/) && RegExp.$1) || 'jpg';
  const cloudPath = `recognize/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  wx.cloud.uploadFile({
    cloudPath,
    filePath: imagePath
  }).then(uploadRes => {
    return wx.cloud.callFunction({
      name: 'recognize',
      data: { fileID: uploadRes.fileID, meta: { ts: Date.now() } }
    });
  }).then(res => {
    const data = res.result && res.result.data;
    if (data) cb(data);
    else localMock(cb);
  }).catch(err => {
    console.error('[ai.recognize] cloud fail, fallback to mock', err);
    localMock(cb);
  });
}

module.exports = { recognize };
