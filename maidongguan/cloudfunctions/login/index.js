// 登录云函数：用 wx.login 的 code 换取 openid（标准做法）。
// 真实上线：前端 wx.login 拿 code → 调本函数 → cloud.getWXContext().OPENID。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.APPID || '';
  return { code: 0, openid, appid: wxContext.APPID };
};
