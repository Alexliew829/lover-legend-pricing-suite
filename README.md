# Lover Legend Pricing Suite V8.0

## V8.0 Stable Frame Resize

- 修正第一次从「从进口系统选择产品」选产品后，第一次按「计算」时成本与售价计算器会瞬间收起的问题。
- 根因是外层 iframe ResizeObserver 每次重算高度前先把 iframe 强制设为 1px。
- V8.0 取消 1px 重置。
- 第一次载入正常设定高度；之后内容增加时即时扩展，不会因进口资料同步/计算结果重绘而瞬间缩小。
- 手动输入盆栽进口成本的原有行为保持不变。
- 保留 V7.9 的 minimumPrice、Direct Local Sync、实际售价保护、成本/利润率/运费/汇率等全部逻辑。
- Apps Script 与 Google Sheet 不需要修改。
- 页面、VERSION、manifest、iframe cache、Service Worker cache 全部更新为 V8.0。
