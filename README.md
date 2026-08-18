# Lover Legend Pricing Suite V7.9

## V7.9 Keep Minimum Price

- 修正选择产品后，minimumPrice 已自动带入「实际售价」，但输入花盆成本、苔藓成本、本地运费、汇率、内地杂费或海外运费时，实际售价被重置为 0 的问题。
- 现在修改这些成本字段，只清除旧计算结果，不会清除实际售价。
- 例如产品最低售价 RM680.00：输入花盆 RM50、苔藓 RM20 后，实际售价仍保持 RM680.00。
- 除非用户自己修改实际售价，系统不会改变这个值。
- 保留 V7.8 Direct Local Sync 和 minimumPrice 单向映射逻辑。
- Apps Script / Google Sheet 不需要修改。
- 所有版本及缓存标识更新为 V7.9。
