const app = getApp();
const { OPP, PRODUCTS } = require('../../utils/mockData.js');
const track = require('../../utils/track.js');

Page({
  data: { key: '', title: '', intro: '', tag: '', items: [], risk: '', buys: [] },
  onLoad(q) {
    const key = q.key;
    const o = OPP[key];
    if (!o) { wx.showToast({ title: '方案不存在', icon: 'none' }); return; }
    const buys = o.buy.map(id => {
      const p = PRODUCTS.find(x => x.id === id);
      return { id, name: p ? p.name : ('商品' + id) };
    });
    this.setData({
      key, title: o.title, intro: o.intro, tag: o.tag,
      items: o.items, risk: o.risk, buys
    });
    track('opp_view', { key });
  },
  goBuy(e) {
    const id = e.currentTarget.dataset.id;
    app.globalData.targetSku = id;
    app.globalData.targetUse = '政策方案';
    track('opp_buy', { id });
    wx.switchTab({ url: '/pages/mall/mall' });
  },
  goMall() {
    if (this.data.buys.length) app.globalData.targetSku = this.data.buys[0].id;
    app.globalData.targetUse = '政策方案';
    wx.switchTab({ url: '/pages/mall/mall' });
  }
});
