# Lover Legend Pricing Suite V9.0

- 上半部：成本与售价计算器 V9.0。
- 下半部：盆景价格计算器 V3.3（保持原版计算与汇率逻辑）。
- V9.0：移除 iframe 的 JavaScript 人工 scrollBy / scrollTo / 惯性滚动桥。
- 手机上下滑动交回浏览器原生滚动处理。
- 只有整页位于最顶部继续向下拉时，才触发 Refresh。
- 未修改成本、售价、Import 产品搜索、利润、最低售价等计算公式。

- V9.0：修复从下方 V3.4 返回上方时误触 Refresh；iframe 内滑动只负责页面滚动，Refresh 只允许从整页顶部外层区域触发。
