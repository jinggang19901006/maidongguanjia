// 合规配置下发云函数（PRD §9 / §15②）。
// 用途：禁用农药名录、安全间隔期、多效唑红线等合规数据，可由主管部门更新而无需重新发版小程序。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  // TODO(真实接入): 从数据库 config 集合或外部权威接口读取最新合规配置，而非写死。
  // const db = cloud.database();
  // const cfg = await db.collection('config').doc('compliance').get();
  // return cfg.data;

  return {
    code: 0,
    data: {
      version: '2025-10-01',
      source: '县麦冬办 / 县农业农村局（待接入权威名录）',
      sourceUrl: '',
      updatedAt: '2025-10-01',
      safeIntervalDays: 30,
      muXiaoZuoLimit: 0.1,
      note: '依据 2025 版《中国药典》麦冬多效唑残留限量 ≤0.1mg/kg 及农业农村部禁限用农药名录整理，最终以属地主管部门发布为准。'
    }
  };
};
