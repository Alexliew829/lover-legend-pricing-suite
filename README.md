# Lover Legend Pricing Suite V7.6

## V7.6 Product Selection Fix

- 修正 V7.5 搜索结果出现但点击后像“不能选择”的问题。
- 点击产品后立即关闭下拉并显示已选产品，先给出明确响应。
- 随后读取最新云端资料，再应用同一产品的最新 minimumPrice。
- 云端刷新失败时会回退当前缓存，不会让选择动作卡住。
- minimumPrice -> 实际售价仍为单向，不会反写库存系统。
- 不改变成本、利润率、运费、汇率及其他计算逻辑。
- 页面版本、VERSION、manifest、iframe cache、Service Worker cache 全部更新至 V7.6。
