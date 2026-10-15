Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    items: { type: Array, value: [] }
  },
  data: { idx: 0 },
  methods: {
    goBanner(e) {
      const i = e.currentTarget.dataset.i;
      this.setData({ idx: i });
    },
    onTap(e) {
      const key = e.currentTarget.dataset.key;
      this.triggerEvent('select', { key });
    }
  },
  lifetimes: {
    attached() {
      const len = (this.data.items && this.data.items.length) || 1;
      if (len > 1) {
        this.timer = setInterval(() => {
          this.setData({ idx: (this.data.idx + 1) % len });
        }, 4500);
      }
    },
    detached() {
      if (this.timer) clearInterval(this.timer);
    }
  }
});
