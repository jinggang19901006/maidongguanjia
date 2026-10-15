const app = getApp();
const cloud = require('../../utils/cloud.js');
const { buildCalendar } = require('../../utils/stages.js');
const track = require('../../utils/track.js');

const BANNERS = [
  { key: 'kongwang', tag: '政策红利', title: '🌿 不用多效唑，也能控旺', desc: '2025 药典首设多效唑残留红线（≤0.1mg/kg）。生态控旺替代方案，过检更安心、收购价更高。' },
  { key: 'chongcha', tag: '主产区痛点', title: '🪴 重茬地不过检？土壤修复', desc: '连作致土传病害高发、残留超标。轮作 + 生物菌剂 + 土壤改良，从根上解决问题。' }
];

Page({
  data: {
    lands: [],
    summary: { count: 0, area: '0.0', todos: 0 },
    banners: BANNERS,
    discVisible: false,
    elder: false
  },
  onLoad() {
    this.setData({ discVisible: !app.globalData.discRead });
  },
  onShow() {
    this.setData({ elder: app.globalData.elder });
    this.loadLands();
  },
  onPullDownRefresh() {
    this.loadLands();
    cloud.getCompliance(res => {
      if (res && res.data) this.setData({ /* 合规版本刷新 */ });
      wx.stopPullDownRefresh();
    });
  },
  loadLands() {
    cloud.getLands(list => {
      const lands = (list || []).map(l => {
        const cal = buildCalendar(l.plantDate) || { currentStage: { name: '—', next: '' }, progress: 0 };
        return Object.assign({}, l, {
          curStage: cal.currentStage ? cal.currentStage.name : '—',
          next: cal.currentStage ? cal.currentStage.next : '',
          progress: Math.round((cal.progress || 0) * 100)
        });
      });
      const area = lands.reduce((a, l) => a + (parseFloat(l.area) || 0), 0);
      const todos = lands.reduce((a, l) => a + (l.curStage && l.curStage !== '—' ? 1 : 0), 0);
      this.setData({
        lands,
        summary: { count: lands.length, area: area.toFixed(1), todos }
      });
    });
  },
  onBannerSelect(e) {
    const key = e.detail.key;
    track('banner_click', { key });
    wx.navigateTo({ url: '/pages/opp/opp?key=' + key });
  },
  goCalendar() { wx.switchTab({ url: '/pages/calendar/calendar' }); },
  goLand(e) {
    const id = e.currentTarget.dataset.id;
    app.globalData.currentLandId = id;
    track('land_click', { id });
    wx.switchTab({ url: '/pages/calendar/calendar' });
  },
  goAddLand() { wx.navigateTo({ url: '/pages/addland/addland' }); },
  goMine() { wx.navigateTo({ url: '/pages/mine/mine' }); },
  openDisc() { this.setData({ discVisible: true }); },
  onDiscConfirm() {
    app.globalData.discRead = true;
    try { wx.setStorageSync('mc_disc_read', true); } catch (e) {}
    this.setData({ discVisible: false });
    track('disc_confirm');
  }
});
