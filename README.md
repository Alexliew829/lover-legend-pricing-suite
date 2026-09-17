# Lover Legend Pricing Suite V11.2

- 成本与售价计算器：V11.2。
- 内置盆景价格计算器：V6.9（直接采用独立 V6.9 文件与逻辑）。
- V11.2 整合层继续使用单一、被动式手机下拉刷新；内嵌页面自身刷新会关闭，避免重复刷新与滑动卡顿。
- 不改变 V6.9 的产品搜索、价格、最低售价、运费、汇率等逻辑。


V11.2: Embedded bonsai calculator remains V6.9. Added one-way Import product identity sync (left to right only); V6.9 keeps authority over minimum/live pricing. Mobile pull-to-refresh remains single-controller/passive to avoid duplicate refresh and scroll jank.

V11.2: Existing Import products use Import averageCost as the authority. VND pot, wood-rack/local delivery and commission follow Import V20.6 current settings; promotion commission/freight behavior is aligned. Manual/new-product estimation remains available.

V11.2: Cost summary display is simplified to show the all-in unit cost and x3 total directly. For VND Import products, unit cost already includes Import averageCost + VND pot fee. Calculation rules remain unchanged from V10.8.
