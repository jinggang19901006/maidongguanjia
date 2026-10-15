const cloud = require('../../utils/cloud.js');
const track = require('../../utils/track.js');
const app = getApp();

function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const p = n => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

Page({
  data: { orders: [], loading: true, elder: false },
  onShow() { this.setData({ elder: app.globalData.elder }); this.load(); },
  onPullDownRefresh() { this.load(() => wx.stopPullDownRefresh()); },
  load(done) {
    this.setData({ loading: true });
    cloud.getOrders(list => {
      const orders = (list || []).map(o => ({
        id: o._id || o.id,
        status: o.status || '待配送',
        total: o.total || (o.items || []).reduce((a, i) => a + (parseFloat(i.price) || 0) * (i.qty || 1), 0),
        createdAt: fmt(o.createdAt),
        items: (o.items || []).map(i => ({ name: i.name, qty: i.qty || 1, price: i.price })),
        cover: (o.items && o.items[0] && o.items[0].name) || ''
      }));
      this.setData({ orders, loading: false });
      track('orders_view', { n: orders.length });
      done && done();
    });
  },
  rebuy(e) {
    const items = e.currentTarget.dataset.items;
    items.forEach(it => cloud.addCart({ id: it.id, qty: it.qty }, () => {}));
    wx.switchTab({ url: '/pages/mall/mall' });
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },
  goMall() { wx.switchTab({ url: '/pages/mall/mall' }); }
});
