#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v9.2 B方案: transaction 合并数组，彻底消除覆盖"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# 1. 替换 syncUpload() 函数
# ============================================================
old_syncUpload = """function syncUpload() {
  if (!db) { console.log('[Sync ↑] Firebase 未初始化'); return; }
  _ssotLastWrite = Date.now();
  // v9.1 分路徑 update：只更新有變化的數據類型，消除覆蓋風險
  var updates = {};
  updates['txs'] = txs;
  updates['agentList'] = agentList;
  updates['agentWallets'] = agentWallets;
  updates['fundWithdrawals'] = fundWithdrawals;
  updates['workingMonth'] = workingMonth;
  updates['rmBookings'] = (typeof RM !== 'undefined' && RM.bookings) ? RM.bookings : [];
  updates['rmHotelConfig'] = (typeof HOTEL_CONFIG !== 'undefined' && HOTEL_CONFIG) ? HOTEL_CONFIG : [];
  updates['archives'] = (function(){ try { return JSON.parse(localStorage.getItem('macau_archives'))||{}; } catch(e) { return {}; } })();
  updates['_ts'] = _ssotLastWrite;
  db.ref('macau_data').update(updates)
    .then(function() { console.log('[Sync ↑] Firebase 上傳成功 (ts:' + _ssotLastWrite + ')'); })
    .catch(function(err) { console.error('[Sync ↑] Firebase 上傳失敗', err); });
}"""

new_syncUpload = """function syncUpload() {
  if (!db) { console.log('[Sync ↑] Firebase 未初始化'); return; }
  
  // v9.2 B方案: 使用 transaction 合併 txs（消除覆蓋風險）
  var localTxsSnapshot = JSON.parse(JSON.stringify(txs));
  
  db.ref('macau_data/txs').transaction(function(current) {
    var fbArray = current || [];
    var localArray = localTxsSnapshot;
    
    // 合併策略：本地為主，補充 Firebase 中不在本地的記錄
    var merged = [];
    var seenIds = {};
    
    // 先加入所有本地記錄（本地變更優先）
    for (var i = 0; i < localArray.length; i++) {
      merged.push(localArray[i]);
      seenIds[localArray[i].id] = true;
    }
    
    // 再加入 Firebase 中不在本地的記錄（其他設備新增的）
    for (var i = 0; i < fbArray.length; i++) {
      if (fbArray[i] && !seenIds[fbArray[i].id]) {
        merged.push(fbArray[i]);
        seenIds[fbArray[i].id] = true;
      }
    }
    
    return merged;
  }, function(error, committed, snapshot) {
    if (error) {
      console.error('[Sync ↑] txs transaction 失敗:', error);
    } else if (committed && snapshot) {
      console.log('[Sync ↑] txs transaction 成功');
      txs = snapshot.val() || [];
      try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
      
      // 重渲染可見頁面
      var pageAll = document.getElementById("page-all");
      if (pageAll && pageAll.style.display === "block") { renderAll(); }
      var pageOverview = document.getElementById("page-overview");
      if (pageOverview && pageOverview.style.display === "block") { renderOverview(); }
      var pageSummary = document.getElementById("page-summary");
      if (pageSummary && pageSummary.style.display === "block") { renderSummary(); }
    }
  });
  
  // fundWithdrawals 同理
  var localFundSnapshot = JSON.parse(JSON.stringify(fundWithdrawals));
  db.ref('macau_data/fundWithdrawals').transaction(function(current) {
    var fbArray = current || [];
    var localArray = localFundSnapshot;
    
    var merged = [];
    var seenIds = {};
    
    for (var i = 0; i < localArray.length; i++) {
      merged.push(localArray[i]);
      seenIds[localArray[i].id] = true;
    }
    
    for (var i = 0; i < fbArray.length; i++) {
      if (fbArray[i] && !seenIds[fbArray[i].id]) {
        merged.push(fbArray[i]);
        seenIds[fbArray[i].id] = true;
      }
    }
    
    return merged;
  }, function(error, committed, snapshot) {
    if (error) {
      console.error('[Sync ↑] fundWithdrawals transaction 失敗:', error);
    } else if (committed && snapshot) {
      console.log('[Sync ↑] fundWithdrawals transaction 成功');
      fundWithdrawals = snapshot.val() || [];
      try { localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals)); } catch(e) {}
      try { updateTotalWalletUI(); } catch(e) {}
    }
  });
  
  // 其他低衝突風險的數據：使用 update()
  var updates = {};
  updates['agentList'] = agentList;
  updates['agentWallets'] = agentWallets;
  updates['workingMonth'] = workingMonth;
  updates['rmBookings'] = (typeof RM !== 'undefined' && RM.bookings) ? RM.bookings : [];
  updates['rmHotelConfig'] = (typeof HOTEL_CONFIG !== 'undefined' && HOTEL_CONFIG) ? HOTEL_CONFIG : [];
  updates['archives'] = (function(){ try { return JSON.parse(localStorage.getItem('macau_archives'))||{}; } catch(e) { return {}; } })();
  updates['_ts'] = Date.now();
  db.ref('macau_data').update(updates);
}"""

if old_syncUpload in content:
    content = content.replace(old_syncUpload, new_syncUpload)
    print("✅ syncUpload() 已改为 transaction 合并")
else:
    print("❌ 未找到 syncUpload() 函数")
    # 尝试模糊匹配
    idx = content.find('function syncUpload()')
    if idx >= 0:
        print(f"   找到函数开头于位置 {idx}")
        # 找函数结尾
        brace_count = 0
        in_func = False
        end_idx = idx
        for i in range(idx, len(content)):
            if content[i] == '{':
                brace_count += 1
                in_func = True
            elif content[i] == '}':
                brace_count -= 1
                if in_func and brace_count == 0:
                    end_idx = i + 1
                    break
        print(f"   函数结束于位置 {end_idx}")
        print(f"   函数内容预览: {content[idx:idx+150]}")
    else:
        print("   未找到 syncUpload 函数")

# ============================================================
# 2. 删除 _ssotLastWrite 相关代码
# ============================================================
# 删除变量声明
old_var = "var _ssotLastWrite = 0;"
new_var = ""  # 删除
if old_var in content:
    content = content.replace(old_var, new_var)
    print("✅ 已删除 _ssotLastWrite 变量声明")

# 删除所有 _ssotLastWrite 引用
content = content.replace('_ssotLastWrite = Date.now();', '')
content = content.replace('_ssotLastWrite', '')
print("✅ 已清理 _ssotLastWrite 引用")

# ============================================================
# 3. 修改 initSync() 中的 txs 监听器
#    当前: db.ref('macau_data/txs').on('value', ...)
#    改为: 分别监听，但保持兼容（transaction 会自动处理）
#    实际上不需要改，因为 transaction 在函数内部处理
# ============================================================
# 注意：transaction 方式下，Firebase 会自动重试直到成功
# 这比之前的 update() 更安全，因为会合并而不是覆盖

# ============================================================
# 4. 写回文件
# ============================================================
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ v9.2 B方案 修改完成")
print("   改动: syncUpload() 改为 transaction 合并")
print("   效果: 两台设备同时写入时，数据会合并而不是覆盖")
