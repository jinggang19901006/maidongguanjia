const cloud = require('../../utils/cloud.js');
const { buildCalendar } = require('../../utils/stages.js');
const app = getApp();

function shortHash(s) {
  let h = 0;
  s = String(s || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase().slice(0, 6);
}

Page({
  data: { lands: [], currentId: '', land: null, cal: null, traceCode: '', loading: true, elder: false },
  onShow() {
    this.setData({ elder: app.globalData.elder });
    this.load();
  },
  onPullDownRefresh() { this.load(() => wx.stopPullDownRefresh()); },
  load(done) {
    this.setData({ loading: true });
    cloud.getLands(list => {
      const lands = list || [];
      let id = app.globalData.currentLandId || (lands[0] && lands[0]._id);
      this.render(lands, id);
      done && done();
    });
  },
  render(lands, id) {
    const land = lands.find(l => l._id === id) || lands[0];
    if (!land) { this.setData({ lands, land: null, cal: null, loading: false }); return; }
    const cal = buildCalendar(land.plantDate);
    const traceCode = 'MC' + String(land.plantDate || '').replace(/-/g, '') + shortHash(land._id);
    this.setData({ lands, currentId: land._id, land, cal, traceCode, loading: false });
  },
  selectLand(e) {
    const id = e.currentTarget.dataset.id;
    app.globalData.currentLandId = id;
    this.render(this.data.lands, id);
  },
  goCalendar() { wx.switchTab({ url: '/pages/calendar/calendar' }); }
});
