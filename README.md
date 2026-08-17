# Lover Legend Pricing Suite V7.7

## V7.7 Fast Sync

- 产品点击后立即选择，不再等待整批云端资料下载。
- 页面打开时后台只进行一次 Import System 云端同步。
- 如果第一次选择时云端尚未完成，先使用缓存资料立即进入计算器。
- 云端完成后，只更新当前产品最新 `minimumPrice`。
- 如果用户已经手动修改「实际售价」，后台同步完成后绝不会覆盖手动价格。
- 同一页面内切换焦点、返回页面、切换标签，不再重复下载整批进口产品资料。
- `minimumPrice -> 实际售价` 保持单向，不反写 Import System。
- 不修改成本、利润率、运费、汇率和其他计算逻辑。
- Apps Script 与 Google Sheet 不需要修改。
- 所有版本与缓存标识更新为 V7.7。
