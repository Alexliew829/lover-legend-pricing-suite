# Lover Legend Pricing Suite V7.4

## V7.4 Minimum Price Mapping

- 从进口成本与库存系统 Products 读取 `minimumPrice`。
- 选择产品后，把 `minimumPrice` 单向填入「实际售价」。
- `minimumPrice = 0` 时，实际售价自动显示 `0.00`。
- 自动带出的实际售价仍可手动修改。
- 手动修改实际售价不会写回进口成本与库存系统。
- 不改变现有成本、利润率、售价、运费、汇率及其他计算逻辑。
- Import Mapping / Debug 面板继续保持移除。
- 页面版本、VERSION、manifest、iframe cache 与 Service Worker cache 全部更新为 V7.4。
