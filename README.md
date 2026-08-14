# Lover Legend Pricing Suite V7.1

## V7.1 Import System V4.4 Mapping Fix

- 不修改 Import Cost System V4.4。
- 成本与售价计算器改为读取 Import Cost System V4.4 实际正在使用的 Apps Script Web App。
- V7.0 仍连接旧 Import System endpoint，所以会继续收到旧版/错位字段。
- 保留 importNumber → Batch 的映射逻辑。
- 更新页面版本、VERSION、manifest 与 Service Worker cache 至 V7.1。
