// 埋点（§10）。当前占位：console 输出；真实环境替换为上报服务端接口。
function track(event, payload) {
  // eslint-disable-next-line no-console
  console.log('[track]', event, payload || '');
}

module.exports = { track };
