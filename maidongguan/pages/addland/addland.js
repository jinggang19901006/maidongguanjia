const cloud = require('../../utils/cloud.js');
const track = require('../../utils/track.js');

function todayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

Page({
  data: { name: '', area: '', variety: '川麦1号', plantDate: todayStr() },
  onName(e) { this.setData({ name: e.detail.value }); },
  onArea(e) { this.setData({ area: e.detail.value }); },
  onVar(e) { this.setData({ variety: e.detail.value }); },
  onDate(e) { this.setData({ plantDate: e.detail.value }); },
  save() {
    const { name, area, variety, plantDate } = this.data;
    if (!name || !area || !plantDate) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    cloud.addLand({ name, area, variety, plantDate }, () => {
      track('land_create', { variety });
      wx.showToast({ title: '已添加地块', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    });
  }
});
