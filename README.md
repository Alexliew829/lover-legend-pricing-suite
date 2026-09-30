# Lover Legend Pricing Suite V11.4

- 成本与售价计算器：V11.4。
- 内置盆景价格计算器：V7.1（直接采用独立 V7.1 文件与逻辑）。
- V11.4 整合层继续使用单一、被动式手机下拉刷新；内嵌页面自身刷新会关闭，避免重复刷新与滑动卡顿。
- 不改变 V7.1 的产品搜索、价格、最低售价、运费、汇率等逻辑。


V11.4: Embedded bonsai calculator remains V7.1. Added one-way Import product identity sync (left to right only); V7.1 keeps authority over minimum/live pricing. Mobile pull-to-refresh remains single-controller/passive to avoid duplicate refresh and scroll jank.

V11.4: Existing Import products use Import averageCost as the locked base. Currency, exchange rate, inland-misc and overseas-freight are locked; only pot, moss and local-delivery remain editable and are added to averageCost. Manual/new-product estimation remains available.

V11.4: Cost summary display is simplified to show the all-in unit cost and x3 total directly. For selected Import products, unit cost is Import averageCost + current pot + moss + local-delivery. Other pricing logic remains unchanged.
