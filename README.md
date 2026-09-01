# Lover Legend Pricing Suite V8.7

## V8.7 Product Code Prefix Search

- 修正 V8.2 产品编号必须输入完整编号才会显示的问题。
- 现在支持即时前缀搜索：
  - `BX5` → 显示所有以 BX5 开头的型号
  - `BX58` → 可以找到 BX580
  - `BX580` → 精确找到 BX580
- 大小写不敏感：`bx58` 与 `BX58` 相同。
- 不会因为输入 `BX58` 而误配 `BX1680`，因为采用型号前缀匹配，不是任意包含匹配。
- 中文产品名称和原有中文关键词搜索逻辑保持不变。
- minimumPrice、Direct Local Sync、成本/汇率/运费/利润计算等现有逻辑全部保持不变。
- Apps Script / Google Sheet 不需要修改。
- 页面、VERSION、manifest、iframe cache、Service Worker cache 全部更新为 V8.7。
