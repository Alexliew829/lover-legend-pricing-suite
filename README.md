# Lover Legend Pricing Suite V7.8

## V7.8 Direct Local Sync

- 直接读取同一浏览器中进口系统的 `importSystemProducts`、
  `importSystemImports`、`importSystemBatches`。
- 进口系统修改 minimumPrice 后，成本与售价计算器第一次选择产品
  即可读取本机最新值，无需等待 Apps Script。
- 选择产品不等待网络，保持即时响应。
- Apps Script 云端同步只在后台作为 fallback。
- 同一浏览器另一个标签页保存进口系统资料时，成本计算器通过
  storage event 即时更新。
- 用户手动修改「实际售价」后，后台不会覆盖。
- minimumPrice -> 实际售价保持单向，不反写进口系统。
- 不修改成本、利润率、运费、汇率和其他计算逻辑。
- Apps Script 与 Google Sheet 不需要修改。
- 所有版本及缓存标识更新为 V7.8。
