const app = getApp();
const cloud = require('../../utils/cloud.js');
const { EXPERT_RX } = require('../../utils/mockData.js');
const { buildCalendar } = require('../../utils/stages.js');
const track = require('../../utils/track.js');

Page({
  data: {
    landName: '', curStage: '',
    symptom: '叶片发黄、植株萎蔫，湿度大时根部有白色菌丝',
    photos: 0, submitting: false, rx: null, elder: false,
    tickets: []
  },
  onShow() {
    this.setData({ elder: app.globalData.elder, rx: null, submitting: false });
    cloud.getLands(list => {
      const lands = list || [];
      if (lands.length) {
        const cal = buildCalendar(lands[0].plantDate);
        this.setData({ landName: lands[0].name, curStage: cal ? cal.currentStage.name : '' });
      } else {
        this.setData({ landName: '未建档', curStage: '' });
      }
    });
    this.loadTickets();
  },
  loadTickets() {
    cloud.getExpertTickets(list => {
      const tickets = (list || []).slice(0, 5).map(t => ({
        id: t._id || t.id,
        status: t.status || '待复核',
        land: t.land || '',
        symptom: t.symptom || '',
        createdAt: (t.createdAt || '').slice(0, 16).replace('T', ' '),
        rx: t.rx || null
      }));
      this.setData({ tickets });
    });
  },
  onSymptom(e) { this.setData({ symptom: e.detail.value }); },
  addPhoto() { this.setData({ photos: this.data.photos + 1 }); wx.showToast({ title: '已添加照片', icon: 'none' }); },
  onMic() { wx.showToast({ title: '正在聆听…（演示）请口述症状', icon: 'none' }); },
  call() { wx.showToast({ title: '正在接通县麦冬办农技热线 0816-2822078', icon: 'none' }); },
  submit() {
    if (this.data.symptom.length < 10) { wx.showToast({ title: '请补充症状描述（至少10字）', icon: 'none' }); return; }
    this.setData({ submitting: true });
    track('expert_submit');
    cloud.submitExpert({ land: this.data.landName, symptom: this.data.symptom, photos: this.data.photos, rx: EXPERT_RX }, () => {
      setTimeout(() => {
        this.setData({ rx: EXPERT_RX, submitting: false });
        this.loadTickets();
      }, 1600);
    });
  },
  goBuy(e) {
    const id = e.currentTarget.dataset.id;
    const use = e.currentTarget.dataset.use || '';
    app.globalData.targetSku = id;
    app.globalData.targetUse = use;
    wx.switchTab({ url: '/pages/mall/mall' });
  }
});
