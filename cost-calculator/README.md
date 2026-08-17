# 成本与售价计算器 V7.4

新增单向最低售价映射：

`Import Cost System Products.minimumPrice -> 实际售价 actualPrice`

规则：
- 选择产品时自动带入。
- 0 -> 0.00。
- 实际售价可以继续手动修改。
- 不提供任何 minimumPrice 写回动作。
- 其他计算逻辑保持不变。
