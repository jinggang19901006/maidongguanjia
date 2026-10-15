// 川麦冬 10 阶段标准周期模型（相对「栽种日」的天偏移）。
// 注意：节点为综合多份规范的合成版，须经属地农艺师与植保专家终审（PRD §15①）。
// start/end 为相对栽种日的天数；status 由 today 与窗口对比得到。

const STAGES = [
  { id: 1, name: '选地整地',    start: -10, end: -7, time: '栽前 7–10 天',
    farm: '深翻 20–30cm、清除杂草/香附子；选沙壤土 pH 7–8',
    next: '完成深翻整地，备好底肥',
    fert: [{ n: '商品有机肥', s: '800–1500 kg/亩', buy: 0 }, { n: '平衡复合肥 15-15-15', s: '30–40 kg/亩', buy: 1 }],
    med: [] },

  { id: 2, name: '种苗处理',    start: -7, end: 0, time: '4 月（随采收选种）',
    farm: '选健壮单蘖苗（≥15 叶、株高≥10cm），剪净老根',
    next: '选好种苗，浸苗杀菌待栽',
    fert: [],
    med: [{ n: '多菌灵 / 甲基硫菌灵', s: '浸苗杀菌', buy: 8 }] },

  { id: 3, name: '栽种',        start: 0, end: 3, time: '4 中下–5 中（阴天）',
    farm: '株行距 10×8cm、深 3–4cm、栽后灌水淹没 5cm',
    next: '及时栽种并灌水保墒',
    fert: [],
    med: [] },

  { id: 4, name: '返青期',      start: 3, end: 30, time: '栽后 1 月内',
    farm: '查缺补苗、降雨后浅锄保墒；AI 评估出苗率',
    next: '查缺补苗，AI 评估出苗率',
    fert: [],
    med: [] },

  { id: 5, name: '提苗生根期',  start: 30, end: 80, time: '6 月中旬',
    farm: '中耕、水分保持 60–70%；提苗追肥（氮肥前移）',
    next: '25-6-9 提苗肥 30–40kg/亩',
    fert: [{ n: '高氮提苗肥 25-6-9', s: '30–40 kg/亩', buy: 2 }],
    med: [{ n: '噁霉灵·吡唑醚菌酯', s: '预防根腐，灌根', buy: 9 }] },

  { id: 6, name: '分蘖期',      start: 80, end: 140, time: '7 下–8 上',
    farm: '排水防涝、间作玉米管理；平衡追肥',
    next: '平衡复合肥 30–40kg/亩，防涝',
    fert: [{ n: '平衡复合肥 15-15-15', s: '30–40 kg/亩', buy: 1 }],
    med: [{ n: '苯醚甲环唑 10%', s: '叶斑病预防 1500 倍液', buy: 10 }] },

  { id: 7, name: '壮苗期',      start: 140, end: 200, time: '9 月（玉米收后）',
    farm: '植株调控、红蜘蛛/蚜虫监测',
    next: '监测红蜘蛛，必要时喷药',
    fert: [{ n: '平衡复合肥 15-15-15', s: '30–40 kg/亩', buy: 1 }],
    med: [{ n: '阿维菌素 1.8%', s: '红蜘蛛 3000 倍液', buy: 11 }] },

  { id: 8, name: '果根生长期',  start: 200, end: 250, time: '10 中下',
    farm: '控水（湿度<30%、干湿交替）；叶面调控——生态控旺关键期',
    next: '叶面调控（生态控旺），控水',
    fert: [{ n: '黄腐酸钾 + 磷酸二氢钾', s: '叶面 3–4 次/15天', buy: 3 }, { n: '磷酸二氢钾', s: '500–1000 倍液', buy: 4 }],
    med: [] },

  { id: 9, name: '块根膨大期',  start: 250, end: 300, time: '次年 2 中下',
    farm: '保温防冻；叶面肥 2–3 次/10天',
    next: '叶面肥 2–3 次/10天',
    fert: [{ n: '黄腐酸钾 + 磷酸二氢钾', s: '同配方 2–3 次', buy: 3 }],
    med: [] },

  { id: 10, name: '采收',       start: 300, end: 320, time: '次年 3 底–4 中（清明后）',
    farm: '采挖、清洗、分级、烘干；产量录入',
    next: '适时采挖，分级烘干',
    fert: [],
    med: [] }
];

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 依据栽种日生成农事日历（R1），并标注三态（done/cur/todo）。
function buildCalendar(plantDateStr) {
  if (!plantDateStr) return null;
  // 兼容 iOS：将 'YYYY-MM-DD' 转为 'YYYY/MM/DD'
  const plant = new Date(String(plantDateStr).replace(/-/g, '/'));
  if (isNaN(plant.getTime())) return null;
  const today = new Date();

  const stages = STAGES.map(s => {
    const start = addDays(plant, s.start);
    const end = addDays(plant, s.end);
    let status;
    if (today < start) status = 'todo';
    else if (today > end) status = 'done';
    else status = 'cur';
    return Object.assign({}, s, { start: fmt(start), end: fmt(end), status });
  });

  const harvestDate = fmt(addDays(plant, 305));
  const elapsed = Math.max(0, Math.round((today - plant) / 86400000));
  const progress = Math.min(1, elapsed / 305);
  const currentStage = stages.find(s => s.status === 'cur') || stages[stages.length - 1];

  return {
    stages,
    harvestDate,
    progress,
    plantDate: fmt(plant),
    currentStage
  };
}

module.exports = { STAGES, buildCalendar, addDays, fmt };
