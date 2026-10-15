const config = require('./utils/config.js');
const cloud = require('./utils/cloud.js');

App({
  globalData: {
    openid: '',
    elder: false,
    discRead: false,
    targetSku: null,     // 方案卡/识别/处方「去购买」携带的 SKU（R7）
    targetUse: '',
    currentLandId: null
  },
  onLaunch() {
    // 云开发初始化（仅当已配置真实环境）
    if (config.USE_CLOUD && config.CLOUD_ENV && typeof wx !== 'undefined' && wx.cloud) {
      wx.cloud.init({ env: config.CLOUD_ENV, traceUser: true });
    }
    try {
      this.globalData.elder = !!wx.getStorageSync('mc_elder');
      this.globalData.discRead = !!wx.getStorageSync('mc_disc_read');
    } catch (e) {}

    // 登录：wx.login →（真实环境）云函数换 openid，否则本地兜底
    wx.login({
      success: () => {
        if (config.USE_CLOUD && config.CLOUD_ENV && typeof wx !== 'undefined' && wx.cloud) {
          wx.cloud.callFunction({ name: 'login' })
            .then(res => { this.globalData.openid = (res.result && res.result.openid) || cloud.getUid(); })
            .catch(() => { this.globalData.openid = cloud.getUid(); });
        } else {
          this.globalData.openid = cloud.getUid();
        }
      }
    });
  },
  // 根据地块待办数刷新首页 TabBar 角标（0 则移除）
  refreshBadge() {
    if (typeof wx === 'undefined' || !wx.setTabBarBadge) return;
    cloud.getLands(list => {
      const n = (list || []).filter(l => l.curStage && l.curStage !== '—').length;
      try {
        if (n > 0) wx.setTabBarBadge({ index: 0, text: String(n) });
        else wx.removeTabBarBadge({ index: 0 });
      } catch (e) {}
    });
  }
});
