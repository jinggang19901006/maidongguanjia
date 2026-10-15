const cloud = require('../../utils/cloud.js');
const track = require('../../utils/track.js');
const app = getApp();

Page({
  data: { items: [], total: 0, loading: true, elder: false },
  onShow() { this.setData({ elder: app.globalData.elder }); this.load(); },
  load() {
    this.setData({ loading: true });
    cloud.getCart(list => {
      const items = list || [];
      const total = items.reduce((a, i) => a + (parseFloat(i.price) || 0) * (i.qty || 1), 0);
      this.setData({ items, total: total.toFixed(2), loading: false });
    });
  },
  changeQty(e) {
    const { id, delta } = e.currentTarget.dataset;
    const it = this.data.items.find(x => x.id === id);
    if (!it) return;
    cloud.setCartQty(id, (it.qty || 1) + delta, () => this.load());
  },
  removeItem(e) {
    cloud.removeCart(e.currentTarget.dataset.id, () => this.load());
  },
  goMall() { wx.switchTab({ url: '/pages/mall/mall' }); },
  checkout() {
    if (!this.data.items.length) return;
    const items = this.data.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
    const total = this.data.items.reduce((a, i) => a + (parseFloat(i.price) || 0) * (i.qty || 1), 0);
    cloud.checkout({ items, total: total.toFixed(2), from: 'cart' }, () => {
      track('order_create', { from: 'cart', n: items.length });
      wx.showToast({ title: '已下单，1 小时送达地头' });
      setTimeout(() => wx.redirectTo({ url: '/pages/orders/orders' }), 900);
    });
  }
});
