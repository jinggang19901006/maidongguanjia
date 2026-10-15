const app = getApp();
const cloud = require('../../utils/cloud.js');
const { STAGE_NAMES } = require('../../utils/mockData.js');
const comp = require('../../utils/compliance.js');
const { buildCalendar } = require('../../utils/stages.js');
const track = require('../../utils/track.js');

function tagClass(tag) {
  if (tag === '生物农药') return 'green';
  if (tag === '合规农药') return 'amber';
  if (tag === '禁用') return 'red';
  return 'gray';
}

Page({
  data: {
    tabs: STAGE_NAMES, active: 0,
    products: [], all: [], sheetVisible: false, cur: null,
    elder: false, harvestDate: '', targetUse: '', keyword: '', noResult: false,
    complianceMeta: comp.getComplianceMeta(), bannedCount: comp.BANNED_LIST.length
  },
  onShow() {
    this.setData({ elder: app.globalData.elder });
    cloud.getCompliance(res => {
      if (res && res.data) this.setData({ complianceMeta: res.data });
    });
    cloud.getLands(list => {
      const lands = list || [];
      let harvest = '';
      if (lands.length) {
        const cal = buildCalendar(lands[0].plantDate);
        harvest = cal ? cal.harvestDate : '';
      }
      this.setData({ harvestDate: harvest });
      this.loadProducts();
    });
  },
  onPullDownRefresh() {
    this.loadProducts();
    wx.stopPullDownRefresh();
  },
  loadProducts() {
    cloud.getProducts(all => {
      const products = all.map(p => {
        const r = comp.checkProduct(p, this.data.harvestDate);
        return Object.assign({}, p, { status: r.status, reason: r.reason, tagClass: tagClass(p.tag) });
      });
      let active = 0;
      const tgt = app.globalData.targetSku;
      if (tgt != null) {
        const tp = products.find(p => p.id === tgt);
        if (tp) active = tp.stage;
        app.globalData.targetSku = null; // 消费定位
        app.globalData.targetUse = '';
      }
      this.setData({ all: products, active });
      this.applyFilter();
    });
  },
  // 阶段货架 + 关键词 叠加过滤
  applyFilter() {
    const { all, active, keyword } = this.data;
    const kw = keyword.trim().toLowerCase();
    let list = active === 0 ? all : all.filter(p => p.stage === active);
    if (kw) {
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(kw)) ||
        (p.tag && p.tag.toLowerCase().includes(kw)) ||
        (p.use && p.use.toLowerCase().includes(kw))
      );
    }
    this.setData({ products: list, noResult: list.length === 0 });
  },
  onSearch(e) {
    this.setData({ keyword: e.detail.value });
    this.applyFilter();
  },
  clearSearch() {
    this.setData({ keyword: '' });
    this.applyFilter();
  },
  filterShelf(e) {
    const st = +e.currentTarget.dataset.st;
    this.setData({ active: st });
    this.applyFilter();
  },
  openProduct(e) {
    const id = e.currentTarget.dataset.id;
    const p = this.data.all.find(x => x.id === id);
    if (!p) return;
    track('product_open', { id });
    this.setData({ sheetVisible: true, cur: p });
  },
  closeSheet() { this.setData({ sheetVisible: false }); },
  addCart() {
    const p = this.data.cur;
    cloud.addCart({ id: p.id, qty: 1 }, () => {});
    track('cart_add', { id: p.id });
    wx.showToast({ title: '已加入购物车' });
  },
  buyNow() {
    const p = this.data.cur;
    if (p.status !== '在售') { wx.showToast({ title: p.reason || '当前不可购买', icon: 'none' }); return; }
    cloud.createOrder({
      items: [{ id: p.id, name: p.name, price: p.price, qty: 1 }],
      total: p.price, from: app.globalData.targetUse || 'mall'
    }, () => {
      track('order_create', { id: p.id });
      wx.showToast({ title: '已下单，1 小时送达地头' });
      this.closeSheet();
    });
  }
});
