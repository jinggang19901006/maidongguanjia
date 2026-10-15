const app = getApp();
const track = require('../../utils/track.js');

const ARTICLES = [
  { id: 1, cat: '政策', hot: true, title: '2025 药典麦冬多效唑红线解读', read: 1820,
    summary: '多效唑残留限量首次纳入药典（≤0.1mg/kg），传统控旺受限。本文讲解红线含义与替代路径。',
    body: '2025 版《中国药典》首次对麦冬设定多效唑残留限量（≤0.1mg/kg）。这意味着以往依赖多效唑控旺的种植方式面临过检风险。\n\n生态控旺替代方案：① 施肥调控——"123"施肥法，氮肥前移、后期控氮；② 叶面调控——磷酸二氢钾 + 黄腐酸钾；③ 物理调控——控水、控密；④ 合规调节剂（须确认非多效唑类）。\n\n案例：不用多效唑的麦冬收购价较常规高出约 40%（105 vs 75 元/kg），且顺利过检。' },
  { id: 2, cat: '病害', hot: false, title: '麦冬根腐病识别与绿色防治', read: 980,
    summary: '连作重茬致根腐高发（约占病害 35%）。生物菌剂 + 种苗消毒 + 土壤改良综合控防。',
    body: '根腐病是主产区首要土传病害，连作地块尤为严重。\n\n防治要点：\n· 种苗消毒：移栽前用枯草芽孢杆菌 / 多菌灵浸苗；\n· 土壤改良：增施有机肥、生物菌剂（淡紫拟青霉、枯草芽孢杆菌）；\n· 水旱轮作：与水稻轮作可显著降低土传病原基数；\n· 发病初期：井冈霉素、枯草芽孢杆菌灌根，避免大水漫灌。' },
  { id: 3, cat: '施肥', hot: false, title: '川麦冬"123"施肥法详解', read: 1260,
    summary: '底肥 + 提苗肥 + 平衡追肥 + 叶面肥的配比与窗口期，附合规农资清单。',
    body: '"123"施肥法：\n1 次底肥——商品有机肥 800–1500kg/亩 + 平衡复合肥；\n2 次关键追肥——提苗期高氮、分蘖/壮苗期平衡；\n3 次叶面调控——膨大期磷酸二氢钾 + 黄腐酸钾。\n\n关键：氮肥前移、后期控氮，配合控水实现生态控旺。' },
  { id: 4, cat: '视频', hot: true, title: '【视频】麦冬采收与分级烘干', read: 640,
    summary: '清明前后适时采挖，清洗、分级、烘干要点，影响商品等级与价格。',
    body: '视频内容：\n· 适时采挖：次年 3 月底–4 月中（清明后）；\n· 清洗分级：去除须根泥沙，按规格分级；\n· 烘干：控温烘干保留有效成分；\n· 溯源：录入产量与用药记录，生成溯源码。' },
  { id: 5, cat: '政策', hot: false, title: '主产区重茬残留超标怎么办', read: 1110,
    summary: '重茬地残留积累、过检困难。轮作 + 生物菌剂 + 土壤改良，从根上解决。',
    body: '长期连作导致土壤中病原与残留积累，麦冬易残留超标、过检困难。\n\n系统化治理：\n· 水旱轮作（与水稻 1–2 年），降低病原基数；\n· 生物菌剂：淡紫拟青霉（线虫）、枯草芽孢杆菌、绿僵菌/白僵菌；\n· 土壤改良：增施有机质、调节 pH；\n· 种苗消毒与抗病品种选用。' }
];

Page({
  data: { articles: ARTICLES, sheetVisible: false, cur: null, elder: false },
  onShow() { this.setData({ elder: app.globalData.elder }); },
  openArticle(e) {
    const a = this.data.articles.find(x => x.id === e.currentTarget.dataset.id);
    track('school_open', { id: a.id });
    this.setData({ sheetVisible: true, cur: a });
  },
  closeSheet() { this.setData({ sheetVisible: false }); }
});
