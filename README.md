# Lover Legend Pricing Suite V8.2

## V8.2 Stable First Calculation

正确行为：
- 从进口系统选择产品 → 按「计算」→ 结果保持显示，不会被后台同步清掉。
- 用户手动修改花盆、苔藓、本地运费、汇率、内地杂费、海外运费 → 旧计算结果清空。
- 再按「计算」→ 按新数据重新显示结果。
- 修改成本数据时保留 minimumPrice / 实际售价。
- 后台 minimumPrice 同步只更新实际售价，不再调用 clearCalculationResult()。
- 保留 Direct Local Sync、minimumPrice 单向映射、iframe 稳定高度和其他计算逻辑。
- Apps Script / Google Sheet 不需要修改。
- 版本保持 V8.2，但 iframe / Service Worker cache token 已重新更新，确保 GitHub Pages 取得本次修正版。
