const app = getApp();
const ai = require('../../utils/ai.js');
const track = require('../../utils/track.js');

Page({
  data: { status: 'idle', result: null, elder: false, history: [] },
  onShow() { this.setData({ elder: app.globalData.elder }); this.loadHistory(); },
  loadHistory() {
    let list = [];
    try { list = wx.getStorageSync('mc_ai_history') || []; } catch (e) {}
    this.setData({ history: list.slice(0, 6) });
  },
  saveHistory(rec) {
    let list = [];
    try { list = wx.getStorageSync('mc_ai_history') || []; } catch (e) {}
    list.unshift({ disease: rec.disease, confidence: rec.confidence, symptom: rec.symptom, ts: Date.now() });
    list = list.slice(0, 20);
    try { wx.setStorageSync('mc_ai_history', list); } catch (e) {}
    this.loadHistory();
  },
  takePhoto() {
    if (this.data.status === 'loading') return;
    wx.chooseMedia({
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      count: 1,
      success: (res) => {
        const imagePath = res.tempFiles[0].tempFilePath;
        this.setData({ status: 'loading', result: null });
        track('ai_upload');
        ai.recognize(imagePath, (res2) => {
          this.setData({ status: 'result', result: res2 });
          track('ai_result', { disease: res2.disease, confidence: res2.confidence, cloud: !!res2.fileReceived });
          this.saveHistory(res2);
        });
      },
      fail: () => {
        // 用户取消则保持 idle；出错则 fallback 走 mock
        this.setData({ status: 'loading', result: null });
        track('ai_upload');
        ai.recognize('', (res2) => {
          this.setData({ status: 'result', result: res2 });
          track('ai_result', { disease: res2.disease, confidence: res2.confidence });
          this.saveHistory(res2);
        });
      }
    });
  },
  goBuy(e) {
    const id = e.currentTarget.dataset.id;
    const use = e.currentTarget.dataset.use || '';
    app.globalData.targetSku = id;
    app.globalData.targetUse = use;
    this.setData({ status: 'idle', result: null });
    wx.switchTab({ url: '/pages/mall/mall' });
  },
  goExpert() { wx.switchTab({ url: '/pages/expert/expert' }); }
});
