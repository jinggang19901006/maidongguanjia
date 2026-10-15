const app = getApp();
const track = require('../../utils/track.js');

const FAQS = [
  { q: '平台方案与 AI 识别结果能直接用于打药吗？', a: '不能。平台所有方案、识别与处方均仅供种植参考，不构成最终用药/种植依据。实际用药请严格按农药标签剂量、安全间隔期与当地规定执行，必要时咨询属地农技人员。' },
  { q: '为什么临近采收有些农资买不了？', a: '为保障合规过检，采收前 30 天自动停售化学农药（R6）。请提前规划用药窗口；生物菌剂类产品不受影响。' },
  { q: '多效唑还能用吗？', a: '2025 版药典首设麦冬多效唑残留限量（≤0.1mg/kg），常规多效唑控旺已不适用。建议使用生态控旺方案（施肥/叶面/物理调控）。' },
  { q: '专家问诊多久能回复？', a: 'AI 初诊即时给出；人工复核一般 5 分钟内，复杂病害会优先转专家，并通过 App 推送电子处方。' },
  { q: '农资多久能送到地头？', a: '主产区合作农资点就近配送，通常 1 小时内送达；偏远地块以实际物流为准。' }
];

Page({
  data: { faqs: FAQS, open: -1, phone: '0826-XXXXXXX', elder: false },
  onShow() { this.setData({ elder: app.globalData.elder }); },
  call() { track('contact_call'); wx.makePhoneCall({ phoneNumber: '0826-0000000', fail: () => {} }); },
  goExpert() { wx.switchTab({ url: '/pages/expert/expert' }); },
  toggle(e) {
    const i = e.currentTarget.dataset.i;
    this.setData({ open: this.data.open === i ? -1 : i });
  }
});
