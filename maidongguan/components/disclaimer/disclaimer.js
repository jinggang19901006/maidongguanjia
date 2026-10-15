Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    visible: { type: Boolean, value: false }
  },
  data: { checked: false },
  methods: {
    toggle() {
      this.setData({ checked: !this.data.checked });
    },
    confirm() {
      if (!this.data.checked) {
        wx.showToast({ title: '请先勾选已阅读', icon: 'none' });
        return;
      }
      this.triggerEvent('confirm');
    }
  }
});
