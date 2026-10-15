const app = getApp();
const cloud = require('../../utils/cloud.js');
const { buildCalendar } = require('../../utils/stages.js');
const track = require('../../utils/track.js');

Page({
  data: {
    landName: '', curStage: '', progress: 0,
    plantDate: '', harvestDate: '', stages: [],
    sheetVisible: false, sheet: null, elder: false, empty: false
  },
  onShow() {
    this.setData({ elder: app.globalData.elder });
    this.load();
  },
  load() {
    const uid = app.globalData.currentLandId;
    cloud.getLands(list => {
      const lands = list || [];
      if (lands.length === 0) { this.setData({ empty: true }); return; }
      const land = lands.find(l => l._id === uid) || lands[0];
      const cal = buildCalendar(land.plantDate);
      if (!cal) { this.setData({ empty: true }); return; }
      this.setData({
        empty: false,
        landName: land.name,
        curStage: cal.currentStage.name,
        progress: Math.round(cal.progress * 100),
        plantDate: cal.plantDate,
        harvestDate: cal.harvestDate,
        stages: cal.stages
      });
    });
  },
  openStage(e) {
    const id = e.currentTarget.dataset.id;
    const s = this.data.stages.find(x => x.id === id);
    if (!s) return;
    track('stage_open', { id });
    this.setData({ sheetVisible: true, sheet: s });
  },
  closeSheet() { this.setData({ sheetVisible: false }); },
  goBuy(e) {
    const id = e.currentTarget.dataset.id;
    const use = e.currentTarget.dataset.use || '';
    app.globalData.targetSku = id;
    app.globalData.targetUse = use;
    track('solution_buy', { sku: id });
    this.closeSheet();
    wx.switchTab({ url: '/pages/mall/mall' });
  },
  joinTodo() {
    wx.showToast({ title: '已加入农事待办' });
    this.closeSheet();
  },
  goAdd() { wx.navigateTo({ url: '/pages/addland/addland' }); }
});
