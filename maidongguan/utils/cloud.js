// 数据层：优先云开发（wx.cloud.database），未配置时回退本地缓存 Mock，保证开发者工具直接可跑。
// 切换真实云：config.USE_CLOUD=true 且填 CLOUD_ENV（见 README）。
const config = require('./config.js');
const mockData = require('./mockData.js');

const LS = {
  lands: 'mc_lands',
  orders: 'mc_orders',
  tickets: 'mc_tickets',
  cart: 'mc_cart',
  uid: 'mc_uid'
};

function cloudReady() {
  return !!(config.USE_CLOUD && config.CLOUD_ENV && typeof wx !== 'undefined' && wx.cloud);
}

function getUid() {
  try {
    let uid = wx.getStorageSync(LS.uid);
    if (!uid) { uid = 'u_' + Date.now(); wx.setStorageSync(LS.uid, uid); }
    return uid;
  } catch (e) { return 'local_demo'; }
}

function readLS(key, def) {
  try { return wx.getStorageSync(key) || def; } catch (e) { return def; }
}
function writeLS(key, val) {
  try { wx.setStorageSync(key, val); } catch (e) {}
}

/* ---------------- 地块 ---------------- */
function getLands(cb) {
  if (cloudReady()) {
    wx.cloud.database().collection('lands').where({ openid: getUid() }).get()
      .then(r => cb(r.data)).catch(() => cb(readLS(LS.lands, [])));
  } else {
    cb(readLS(LS.lands, []));
  }
}

function addLand(land, cb) {
  const doc = Object.assign({ openid: getUid(), createdAt: new Date().toISOString() }, land);
  if (cloudReady()) {
    wx.cloud.database().collection('lands').add({ data: doc })
      .then(r => { doc._id = r._id; cb({ ok: true, data: doc }); })
      .catch(() => localAddLand(doc, cb));
  } else {
    localAddLand(doc, cb);
  }
}
function localAddLand(doc, cb) {
  const list = readLS(LS.lands, []);
  doc._id = 'l_' + Date.now();
  list.push(doc);
  writeLS(LS.lands, list);
  cb({ ok: true, data: doc });
}

/* ---------------- 商品 ---------------- */
function getProducts(cb) {
  if (cloudReady()) {
    wx.cloud.database().collection('products').get()
      .then(r => cb(r.data)).catch(() => cb(mockData.PRODUCTS));
  } else {
    cb(mockData.PRODUCTS);
  }
}
function getProductById(id, cb) {
  getProducts(list => {
    const p = list.find(x => x.id === id || x._id === id);
    cb(p || null);
  });
}

/* ---------------- 订单 ---------------- */
function createOrder(order, cb) {
  const doc = Object.assign({ openid: getUid(), status: '待配送', createdAt: new Date().toISOString() }, order);
  if (cloudReady()) {
    wx.cloud.callFunction({ name: 'createOrder', data: doc })
      .then(r => cb(r.result || { ok: true, data: doc }))
      .catch(() => localCreateOrder(doc, cb));
  } else {
    localCreateOrder(doc, cb);
  }
}
function localCreateOrder(doc, cb) {
  const list = readLS(LS.orders, []);
  doc._id = 'o_' + Date.now();
  list.unshift(doc);
  writeLS(LS.orders, list);
  cb({ ok: true, data: doc });
}
function getOrders(cb) {
  if (cloudReady()) {
    wx.cloud.database().collection('orders').where({ openid: getUid() }).get()
      .then(r => cb(r.data)).catch(() => cb(readLS(LS.orders, [])));
  } else {
    cb(readLS(LS.orders, []));
  }
}

/* ---------------- 合规配置（版本化） ---------------- */
function getCompliance(cb) {
  const local = { ok: true, data: config.COMPLIANCE_META };
  if (cloudReady()) {
    wx.cloud.callFunction({ name: 'getCompliance' })
      .then(r => cb(r.result || local))
      .catch(() => cb(local));
  } else {
    cb(local);
  }
}

/* ---------------- 购物车 ---------------- */
function getCart(cb) {
  if (cloudReady()) {
    wx.cloud.database().collection('cart').where({ openid: getUid() }).get()
      .then(r => cb(joinCart(r.data))).catch(() => cb(joinCart(readLS(LS.cart, []))));
  } else {
    cb(joinCart(readLS(LS.cart, [])));
  }
}
function joinCart(list) {
  return (list || []).map(it => {
    const p = mockData.PRODUCTS.find(x => x.id === it.id);
    return Object.assign({}, p, { qty: it.qty || 1 });
  }).filter(x => x.id);
}
function addCart(item, cb) {
  const list = readLS(LS.cart, []);
  const found = list.find(x => x.id === item.id);
  if (found) found.qty = (found.qty || 1) + (item.qty || 1);
  else list.push({ id: item.id, qty: item.qty || 1 });
  writeLS(LS.cart, list);
  if (cloudReady()) {
    wx.cloud.database().collection('cart').where({ openid: getUid(), id: item.id }).get()
      .then(r => { /* TODO: 同步到云 cart 集合 */ });
  }
  cb && cb(list.length);
}
function setCartQty(id, qty, cb) {
  const list = readLS(LS.cart, []);
  const f = list.find(x => x.id === id);
  if (f) f.qty = Math.max(1, qty);
  writeLS(LS.cart, list); cb && cb();
}
function removeCart(id, cb) {
  writeLS(LS.cart, readLS(LS.cart, []).filter(x => x.id !== id)); cb && cb();
}
function cartCount(cb) {
  const list = readLS(LS.cart, []);
  cb(list.reduce((a, x) => a + (x.qty || 1), 0));
}
function checkout(order, cb) {
  createOrder(order, res => {
    writeLS(LS.cart, []);
    cb(res);
  });
}
function getExpertTickets(cb) {
  if (cloudReady()) {
    wx.cloud.database().collection('expertTickets').where({ openid: getUid() }).orderBy('createdAt', 'desc').get()
      .then(r => cb(r.data)).catch(() => cb(readLS(LS.tickets, [])));
  } else {
    cb(readLS(LS.tickets, []));
  }
}

/* ---------------- 专家问诊工单 ---------------- */
function submitExpert(ticket, cb) {
  const doc = Object.assign({ openid: getUid(), status: '待复核', createdAt: new Date().toISOString() }, ticket);
  if (cloudReady()) {
    wx.cloud.callFunction({ name: 'submitExpert', data: doc })
      .then(r => cb(r.result || { ok: true, data: doc }))
      .catch(() => localSubmitExpert(doc, cb));
  } else {
    localSubmitExpert(doc, cb);
  }
}
function localSubmitExpert(doc, cb) {
  const list = readLS(LS.tickets, []);
  doc._id = 't_' + Date.now();
  list.unshift(doc);
  writeLS(LS.tickets, list);
  cb({ ok: true, data: doc });
}

module.exports = {
  getLands, addLand, getProducts, getProductById,
  createOrder, getOrders, submitExpert, getCompliance, getUid,
  getCart, addCart, setCartQty, removeCart, cartCount, checkout, getExpertTickets
};
