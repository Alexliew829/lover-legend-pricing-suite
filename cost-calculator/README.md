# 成本与售价计算器 V7.5

修正 minimumPrice 第一次选择读取旧缓存的问题。

流程：
1. 页面先显示缓存列表，保持进入速度。
2. 用户点击产品时，等待最新云端同步完成。
3. 从最新记录找回同一产品。
4. 再把最新 minimumPrice 填入 actualPrice。
5. actualPrice 仍可手动修改，且不会写回 Import System。
