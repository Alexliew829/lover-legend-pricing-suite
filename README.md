# Lover Legend Pricing Suite V8.1

## V8.1 Keep Previous Calculation Result

- 修正修改花盆成本、苔藓成本、本地运费、汇率、内地杂费、海外运费时，
  下方「实际成本 / x3 / 各利润售价」结果会被清空的问题。
- V8.1 修改这些成本字段时，不再调用 `clearCalculationResult()`。
- 上一次计算结果会继续显示，直到用户再次按「计算」后才用新成本覆盖。
- minimumPrice / 实际售价继续保持，不会被清零。
- 用户仍可手动修改实际售价。
- 保留 V8.0 的 iframe 稳定高度、Direct Local Sync、minimumPrice 单向映射及所有现有计算逻辑。
- Apps Script / Google Sheet 不需要修改。
- 所有版本和缓存标识更新到 V8.1。
