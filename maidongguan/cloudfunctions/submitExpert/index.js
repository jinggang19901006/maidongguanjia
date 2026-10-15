const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const data = Object.assign({}, event, {
    openid: OPENID,
    status: '待复核',
    createdAt: new Date().toISOString()
  });
  delete data.action;
  const res = await db.collection('expertTickets').add({ data });
  return { ok: true, _id: res._id };
};
