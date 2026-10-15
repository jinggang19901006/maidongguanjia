// 全局配置。切换真实云开发：把 USE_CLOUD 改为 true 并填 CLOUD_ENV（见 README）。
module.exports = {
  USE_CLOUD: false,                 // false=本地 Mock 兜底（开发者工具直接预览）；true=真实云开发
  CLOUD_ENV: '',                    // 你的微信云开发环境 ID

  // 合规数据源版本化（PRD §9 / §15②）。真实上线后由县麦冬办/协会通过 getCompliance 云函数下发更新。
  COMPLIANCE_VERSION: '2025-10-01',
  COMPLIANCE_META: {
    version: '2025-10-01',
    source: '县麦冬办 / 县农业农村局（待接入权威名录）',
    sourceUrl: '',
    updatedAt: '2025-10-01',
    muXiaoZuoLimit: 0.1,
    safeIntervalDays: 30,
    note: '依据 2025 版《中国药典》麦冬多效唑残留限量 ≤0.1mg/kg 及农业农村部禁限用农药名录整理，最终以属地主管部门发布为准。'
  },

  SAFE_INTERVAL_DAYS: 30,          // 采收前 30 天停售化学药（R6）
  MU_XIAO_ZUO_LIMIT: 0.1,          // mg/kg 多效唑残留红线（2025 药典）
  TOTAL_DAYS: 305,                 // 川麦冬标准周期约 305 天 / 12 个月（R1）
  APP_NAME: '川麦冬管家'
};
