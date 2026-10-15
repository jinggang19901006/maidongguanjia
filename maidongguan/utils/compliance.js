// 合规护栏（R5/R6，验收⑥）：禁用农药、多效唑红线、采收前安全间隔期强制校验。
// 禁用清单已按类别结构化，并支持版本化来源（PRD §9 / §15②）。
const config = require('./config.js');

// 禁用农药结构化清单（name 用于命中，category 用于展示，reason 为可选补充说明）
const BANNED_LIST = [
  { name: '多效唑', category: '禁用植物生长调节剂', reason: '2025 药典首设麦冬多效唑残留限量 ≤0.1mg/kg，常规控旺已不适用' },
  { name: '百草枯', category: '禁限用除草剂' },
  { name: '六六六', category: '高毒有机氯' },
  { name: '滴滴涕', category: '高毒有机氯' },
  { name: '毒死蜱', category: '禁限用有机磷' },
  { name: '克百威', category: '高毒氨基甲酸酯' },
  { name: '甲胺磷', category: '高毒有机磷' },
  { name: '对硫磷', category: '高毒有机磷' },
  { name: '甲基对硫磷', category: '高毒有机磷' },
  { name: '久效磷', category: '高毒有机磷' },
  { name: '磷胺', category: '高毒有机磷' },
  { name: '涕灭威', category: '高毒氨基甲酸酯' },
  { name: '灭线磷', category: '高毒有机磷' },
  { name: '硫丹', category: '高毒有机氯' },
  { name: '氟虫腈', category: '禁限用杀虫剂' },
  { name: '三氯杀螨醇', category: '高毒有机氯' },
  { name: '林丹', category: '高毒有机氯' },
  { name: '五氯酚', category: '高毒除草剂' },
  { name: '二溴乙烷', category: '剧毒熏蒸剂' },
  { name: '二溴氯丙烷', category: '剧毒熏蒸剂' },
  { name: '狄氏剂', category: '高毒有机氯' },
  { name: '艾氏剂', category: '高毒有机氯' },
  { name: '异狄氏剂', category: '高毒有机氯' },
  { name: '汞制剂', category: '重金属制剂' },
  { name: '砷制剂', category: '重金属制剂' },
  { name: '铅制剂', category: '重金属制剂' },
  { name: '胺苯磺隆', category: '禁用长残效除草剂' },
  { name: '甲磺隆', category: '禁用长残效除草剂' },
  { name: '福美胂', category: '重金属砷制剂' },
  { name: '福美甲胂', category: '重金属砷制剂' },
  { name: '丁酰肼', category: '禁用植物生长调节剂' },
  { name: '溴甲烷', category: '剧毒熏蒸剂' },
  { name: '内吸磷', category: '高毒有机磷' },
  { name: '硫环磷', category: '高毒有机磷' },
  { name: '氯唑磷', category: '高毒有机磷' },
  { name: '苯线磷', category: '高毒有机磷' },
  { name: '地虫硫磷', category: '高毒有机磷' },
  { name: '杀扑磷', category: '高毒有机磷' },
  { name: '特丁硫磷', category: '高毒有机磷' },
  { name: '甲拌磷', category: '高毒有机磷' },
  { name: '甲基异柳磷', category: '高毒有机磷' },
  { name: '治螟磷', category: '高毒有机磷' },
  { name: '蝇毒磷', category: '高毒有机磷' },
  { name: '敌枯双', category: '禁限用杀菌剂' },
  { name: '氟乙酰胺', category: '剧毒杀鼠剂' },
  { name: '甘氟', category: '剧毒杀鼠剂' },
  { name: '毒鼠强', category: '剧毒杀鼠剂' },
  { name: '毒鼠硅', category: '剧毒杀鼠剂' },
  { name: '杀鼠灵', category: '剧毒杀鼠剂' },
  { name: '杀鼠醚', category: '剧毒杀鼠剂' },
  { name: '溴敌隆', category: '剧毒杀鼠剂' },
  { name: '溴鼠灵', category: '剧毒杀鼠剂' }
];

// 化学药判定：用于安全停药期（采收前 N 天）拦截
function isChemical(tag, name) {
  if (tag === '合规农药') return true;
  return /(吡唑|醚菌|菌素|磷|肼|唑|菊酯|胺|膦|畏|硫磷|死蜱)/.test(name || '');
}

function findBanned(name) {
  return BANNED_LIST.find(b => (name || '').indexOf(b.name) >= 0) || null;
}
function isBanned(name) {
  return !!findBanned(name);
}

function getComplianceMeta() {
  return config.COMPLIANCE_META;
}

// 校验单个商品在当前日期/采收日下的可售状态
// 返回 { status: '在售' | '合规下架' | '安全期停售', reason }
function checkProduct(p, harvestDateStr) {
  if (!p) return { status: '在售', reason: '' };
  const banned = findBanned(p.name);
  if (banned) {
    const meta = getComplianceMeta();
    return {
      status: '合规下架',
      reason: `命中${banned.category}：${banned.name}（合规数据 ${meta.version}）${banned.reason ? '；' + banned.reason : ''}`
    };
  }
  if (harvestDateStr) {
    const harvest = new Date(String(harvestDateStr).replace(/-/g, '/'));
    if (!isNaN(harvest.getTime())) {
      const today = new Date();
      const daysLeft = Math.round((harvest - today) / 86400000);
      if (daysLeft <= config.SAFE_INTERVAL_DAYS && isChemical(p.tag, p.name)) {
        return { status: '安全期停售', reason: `距采收不足 ${config.SAFE_INTERVAL_DAYS} 天，化学药安全停药期未到` };
      }
    }
  }
  return { status: '在售', reason: '' };
}

module.exports = {
  BANNED_LIST,
  findBanned,
  isBanned,
  isChemical,
  checkProduct,
  getComplianceMeta,
  MU_XIAO_ZUO_LIMIT: config.MU_XIAO_ZUO_LIMIT,
  SAFE_INTERVAL_DAYS: config.SAFE_INTERVAL_DAYS,
  COMPLIANCE_VERSION: config.COMPLIANCE_VERSION,
  COMPLIANCE_META: config.COMPLIANCE_META
};
