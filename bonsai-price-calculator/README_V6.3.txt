Kalkulator Harga Bonsai V6.3

V6.3 本次修复：
- 产品编号输入提示由「PZ / 产品」改为「BX / 产品」。
- 当前编号支持 BX、BB、PD、SK、JL、AS、SC、BV、MR、IX、HK、PZ 与花盆 PS；搜索忽略英文字母大小写及空格。
- 保留一般旧 PZ 四位编号兼容，并新增 PS0001→BX0001、PS0002→AS0002、PZ0006→BX0006 历史别名。
- 当前真实编号优先于历史别名；历史别名若同时匹配多个产品则不自动选择，避免错误关联真正的 PS 花盆或其他产品。
- 只读取 Import V16.4 的 id、name、minimumPrice；报价、直播价、TikTok、木架、运输、折扣及汇率逻辑不变。
- GitHub Pages 需完整覆盖 V6.3 文件；Import V16.4 无需再次修改或重新部署。

V6.3 产品编号兼容：旧 PZxxxx 与 Import V16.4 新前缀编号可查询同一产品；匹配同时核对产品名称和原四位数字，最低售价仍使用当前产品资料。

V6.3 重点：
- 以上一版为基准，只修正产品编号模式的低价反推逻辑。
- Product ID 下拉只显示 产品编号 + 产品名称；不会显示成本、库存成本、平均成本、进口资料或利润。
- 从 Import V16.4 的 publicProductPricing 只读接口取得 id / name / minimumPrice。
- Product ID 搜索忽略大小写与空格，但保持字母顺序；例如 pz 0072 可匹配 PZ0072，zp 不会匹配 PZ。
- 无产品编号：继续手动门市价格模式。
- 手动门市 <= RM500：直播 = 门市，不再扣直播价。
- 手动门市 > RM500：直播 = 门市 x92%，再向下取 RM100。
- TikTok：门市 x82%，再四舍五入到最接近 RM10。
- 无产品编号的最低售价：直播 x80%，四舍五入到最接近 RM10。
- 有产品编号：页面最低售价保持 Import 原始最低售价，不重新覆盖。
- 产品低价反推：Import 最低 /80% -> 直播取最接近 RM10；若直播 <=RM500，门市取“严格高于直播”的下一个尾数80价格。
  例：最低210 -> 直播260 -> 门市280；最低300 -> 直播380 -> 门市480；最低380 -> 直播480 -> 门市580。
- 产品高价反推继续安全逻辑：寻找第一个尾数80门市价，使直播 x80% 不低于 Import 最低售价。
  例：最低480 -> 直播600 -> 门市680；最低3800 -> 直播4800 -> 门市5280。

部署：
- Calculator: GitHub Pages 覆盖全部 V6.3 文件。
- Import: V16.1 不需要再次修改；继续使用已部署的 publicProductPricing 只读接口。


V6.3 新增/调整：
- Product ID 输入框同时搜索产品编号或产品名称；点击结果后框内只回填产品编号。
- 搜索保持正常字序，不做乱序模糊匹配；大小写和空格兼容。
- 下拉与确认行显示「PZ编号 · 产品名称」，编号字体略小。
- 缩窄产品输入区，扩大直播售价区域，避免高金额显示空间不足。
- 已选产品后，只要用户点击门市价格准备手动输入，立即清空已选产品编号/名称并恢复手动门市模式。
- Import V16.4 不需修改。

V6.3 修正：
- 修复直接输入完整有效 PZ 编号时，部分产品只更新编号/名称但价格沿用上一产品的问题。
- 完整 PZ 编号现在与点击下拉结果使用同一选中流程：重新读取 minimumPrice，并刷新门市、直播、TikTok、最低售价。
- 切换/搜索另一个产品期间会立即清除上一产品生成的价格，避免旧数值残留。
- 若新产品 minimumPrice 为 0 或空值，显示 RM0.00，门市/直播不继承上一产品价格。
- 再缩小产品编号区域并扩大直播售价区域；高金额（如 RM11,700.00、RM24,600.00）完整显示。
- Import V16.4 无需修改或重新部署。

V6.3 修正：MYR/TWD 大金额不重复货币符号；配合 Import V16.4 有效最低售价接口。

V6.3 调整：
- 仅移除顶部 TikTok 参考价括号内重复的 RM；计算公式与其他逻辑不变。
- 例如：RM 112,000.00 (91,840.00)。

V6.3 修正：
- 恢复顶部 Harga TikTok 数值显示，仅移除括号内重复的 RM。
- 修复缺少 formatMoney 导致计算中断、MYR/TWD 显示为 0 的问题。
- 产品资料读取失败时自动重试一次，减少 Apps Script 暂时冷启动/网络波动造成的 Product data unavailable。
- Import V16.4 不需要修改。

V6.3 product search speed optimization:
- Based strictly on V6.1 layout and pricing/freight logic.
- Saves the last successful safe publicProductPricing response (id/name/minimumPrice only) to localStorage.
- On next open, hydrates the cached list immediately so Product ID/name search can respond without waiting for Apps Script.
- Refreshes the latest Import product pricing silently in the background and updates the selected product if its name/minimumPrice changed.
- If the cloud refresh temporarily fails, the last successful local list remains searchable instead of blocking input.
- Import system and Code.gs are unchanged.
