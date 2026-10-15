// 识别逻辑纯函数模块（无 wx-server-sdk 依赖，可独立单测）。
// 由 index.js 引用；平台侧把"模型定性"映射为"带合规方案与购买 SKU 的统一结构"。

// 病害知识库：模型原始标签 → 平台结构化结果（buy 对应 products 集合 id）
const DISEASE_CATALOG = {
  leaf_spot: {
    disease: '叶斑病', complex: false,
    symptom: '叶片出现黄褐色不规则病斑、边缘紫褐色，湿度大时病斑背面生灰黑色霉层，严重时叶片枯死。',
    items: [
      { n: '苯醚甲环唑 10%', s: '预防期 1500 倍液喷雾', buy: 10 },
      { n: '井冈霉素 5%', s: '治疗期 1000 倍液喷雾', buy: 18 }
    ]
  },
  root_rot: {
    disease: '根腐病', complex: true,
    symptom: '根系变褐腐烂、须根减少，地上部叶片发黄萎蔫，拔起可见主根软腐、湿度大时有白色菌丝。',
    items: [
      { n: '噁霉灵·吡唑醚菌酯', s: '发病初期灌根', buy: 9 },
      { n: '枯草芽孢杆菌', s: '生物防控，沟施 5kg/亩', buy: 12 },
      { n: '哈茨木霉菌（重茬专用）', s: '预防土传病害', buy: 15 }
    ]
  },
  aphid: {
    disease: '蚜虫危害', complex: false,
    symptom: '嫩叶、新梢卷曲皱缩，可见绿色/黑色小虫群集，分泌蜜露诱发煤污病。',
    items: [
      { n: '阿维菌素 1.8%', s: '1500–2000 倍液喷雾', buy: 11 }
    ]
  },
  red_spider: {
    disease: '红蜘蛛（叶螨）', complex: false,
    symptom: '叶背出现白色小点、逐渐失绿黄化，严重时叶面结网，多在干旱高温时发生。',
    items: [
      { n: '阿维菌素 1.8%', s: '叶背喷雾，重点喷叶背', buy: 11 }
    ]
  },
  snail: {
    disease: '蛞蝓 / 蜗牛', complex: false,
    symptom: '夜间取食嫩叶造成缺刻，清晨可见黏液痕迹与粪便，阴雨天高发。',
    items: [
      { n: '四聚乙醛颗粒剂', s: '傍晚撒施于行间', buy: 14 }
    ]
  },
  nematode: {
    disease: '根结线虫', complex: true,
    symptom: '根部形成瘤状根结，植株矮小黄化、生长停滞，重茬地尤为严重。',
    items: [
      { n: '淡紫拟青霉颗粒剂', s: '沟施防线结线虫', buy: 13 },
      { n: '枯草芽孢杆菌', s: '生物防控沟施', buy: 12 }
    ]
  },
  potassium_def: {
    disease: '缺钾（块根膨大受抑）', complex: false,
    symptom: '老叶叶尖、叶缘焦枯发黄，块根膨大缓慢，抗逆性下降。',
    items: [
      { n: '磷酸二氢钾', s: '叶面 500–1000 倍液', buy: 4 },
      { n: '黄腐酸钾叶面肥', s: '块根期喷 3–4 次', buy: 3 }
    ]
  },
  nitrogen_def: {
    disease: '缺氮 / 脱肥', complex: false,
    symptom: '老叶均匀黄化、叶脉仍绿，植株生长缓慢、分蘖少，多因基肥不足。',
    items: [
      { n: '高氮提苗肥 25-6-9', s: '追施促分蘖提苗', buy: 2 },
      { n: '黄腐酸钾叶面肥', s: '叶面补肥', buy: 3 }
    ]
  },
  virus: {
    disease: '病毒病', complex: true,
    symptom: '叶片花叶、皱缩、黄绿相间，植株矮化，多经蚜虫等刺吸式口器传播。',
    items: []
  },
  healthy: {
    disease: '苗情正常', complex: false,
    symptom: '植株健壮、叶色正常、无明显病斑或虫害，继续保持当前管理。',
    items: []
  }
};

// 模型标签模糊匹配（兼容中文/英文/别名）
function matchDisease(label) {
  if (!label) return null;
  const l = String(label).toLowerCase();
  const rules = [
    [/叶斑|leaf.?spot|斑点|褐斑|灰霉/, 'leaf_spot'],
    [/根腐|root.?rot|烂根|腐根|白绢/, 'root_rot'],
    [/蚜|aphid|腻虫|蜜露/, 'aphid'],
    [/红蜘蛛|叶螨|rust.?mite|spider.?mite/, 'red_spider'],
    [/蛞蝓|蜗牛|slug|snail|蜒蚰/, 'snail'],
    [/线(虫|虫)|nematode|根结/, 'nematode'],
    [/病毒|virus|花叶|皱缩/, 'virus'],
    [/缺钾|钾缺|钾不足|potassium/, 'potassium_def'],
    [/缺氮|氮缺|氮不足|脱肥|nitrogen/, 'nitrogen_def'],
    [/健康|正常|healthy|无病|good/, 'healthy']
  ];
  for (const [re, key] of rules) { if (re.test(l)) return key; }
  return null;
}

function toPct(v) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (typeof n !== 'number' || isNaN(n)) return 0;
  return n > 1 ? Math.round(n) : Math.round(n * 100);
}

// 归一化多种模型返回形态 → { label, confidence(0-100) }
function normalize(raw) {
  if (!raw || typeof raw !== 'object') return { label: '', confidence: 0 };
  const arr = Array.isArray(raw.predictions) ? raw.predictions
    : Array.isArray(raw.results) ? raw.results
    : Array.isArray(raw.classes) ? raw.classes : null;
  if (arr && arr.length) {
    const top = arr[0];
    return {
      label: top.label || top.name || top.class || top.disease || '',
      confidence: toPct(top.score || top.prob || top.confidence || top.probability || 0)
    };
  }
  const label = raw.label || raw.name || raw.disease || raw.class || '';
  const conf = raw.confidence || raw.score || raw.prob || raw.probability || 0;
  return { label, confidence: toPct(conf) };
}

function buildResult(key, confidence, opts = {}) {
  const cat = key ? DISEASE_CATALOG[key] : null;
  if (!cat) {
    return {
      disease: '暂无法识别',
      confidence: confidence || 0,
      complex: true,
      symptom: '图像清晰度或角度可能不足，建议转人工专家进一步诊断。',
      items: [],
      needExpert: true,
      mock: opts.mock || false
    };
  }
  return {
    disease: cat.disease,
    confidence: Math.max(0, Math.min(100, Math.round(confidence || 0))),
    complex: opts.forceComplex ? true : cat.complex,
    symptom: cat.symptom,
    items: cat.items || [],
    needExpert: opts.forceComplex ? true : (cat.items || []).length === 0,
    mock: opts.mock || false
  };
}

// 本地兜底：基于 fileID 稳定哈希选症，保证体验不中断
function localFallback(fileID) {
  const pool = ['leaf_spot', 'root_rot', 'aphid', 'potassium_def', 'healthy'];
  let h = 0; const s = String(fileID || Date.now());
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const key = pool[h % pool.length];
  return buildResult(key, 78 + (h % 18), { mock: true });
}

module.exports = { DISEASE_CATALOG, matchDisease, normalize, buildResult, localFallback, toPct };
