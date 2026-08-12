# V7.0 Import Mapping Rewrite

- 重写「从进口系统选择产品」资料映射。
- 以 importNumber 为主键找 Batch；产品名称只用于 Batch 内 Item 辅助匹配。
- Batch 固定提供汇率、内地杂费比例、海外运费比例。
- Imports 只提供产品名称、原购买单价等产品行资料，旧资料仅作 fallback。
- 删除以单价作为 Batch 必须匹配条件的逻辑。
- Debug 改为跟随实际选中的产品，不再显示建立资料库时最后一笔产品。
- 找不到 Batch 时明确显示 Batch 未匹配，不再假装是正确的固定成本资料。
- 版本与 Service Worker cache 全面更新至 V7.0。


# 成本与售价计算器 V7.0

- 产品 Item 固定海外运费比例优先于 Batch。
- 产品 Item 历史海外运费比例作为第二优先。
- 内地杂费比例同样采用 Item 优先。
- 自动忽略被 Google Sheet 转成日期格式的错误数值。
- CNY290520261 应读取产品记录的 17.8574%，显示 17.86%。
- 不修改成本、售价、利润、折扣及库存逻辑。

# Lover Legend Pricing Suite

Combined GitHub Pages application containing:

- Cost & Sales Price Calculator
- Bonsai Price Calculator

The two calculator folders are preserved from the supplied original ZIP files. The root page only controls desktop/mobile layout and iframe height.

Version 2.3 — All versions synchronized
