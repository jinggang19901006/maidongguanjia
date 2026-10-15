const app = getApp();
const cloud = require('../../utils/cloud.js');
const track = require('../../utils/track.js');

Page({
  data: { elder: false, discVisible: false, points: 320, level: '会员 L1', landCount: 0, orderCount: 0 },
  onShow() {
    this.setData({ elder: app.globalData.elder });
    cloud.getLands(list => this.setData({ landCount: (list || []).length }));
    cloud.getOrders(list => this.setData({ orderCount: (list || []).length }));
  },
  toggleElder() {
    const on = !app.globalData.elder;
    app.globalData.elder = on;
    try { wx.setStorageSync('mc_elder', on); } catch (e) {}
    this.setData({ elder: on });
    wx.showToast({ title: on ? '已开启长辈模式' : '已关闭长辈模式', icon: 'none' });
    track('elder_toggle', { on });
  },
  openDisc() { this.setData({ discVisible: true }); },
  onDiscConfirm() { this.setData({ discVisible: false }); },
  go(e) {
    const t = e.currentTarget.dataset.t;
    const tabs = { home: '/pages/home/home', calendar: '/pages/calendar/calendar' };
    if (tabs[t]) wx.switchTab({ url: tabs[t] });
    else if (t === 'order') wx.navigateTo({ url: '/pages/orders/orders' });
    else if (t === 'archive') wx.navigateTo({ url: '/pages/archive/archive' });
    else if (t === 'school') wx.navigateTo({ url: '/pages/school/school' });
    else if (t === 'contact' || t === 'kefu') wx.navigateTo({ url: '/pages/contact/contact' });
    else if (t === 'cart') wx.navigateTo({ url: '/pages/cart/cart' });
    else console.warn('[mine] 未匹配的服务入口:', t);
  }
});
