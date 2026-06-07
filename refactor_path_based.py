#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v9.1: 分路径写入重构 - 消除数据类型间的覆盖风险"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# 1. 替换 syncUpload() 函数（改为分路径 update）
# ============================================================
old_syncUpload = """function syncUpload() {
  if (!db) { console.log('[Sync ↑] Firebase 未初始化'); return; }
  _ssotLastWrite = Date.now();
  var payload = {
    txs: txs,
    agentList: agentList,
    agentWallets: agentWallets,
    fundWithdrawals: fundWithdrawals,
    workingMonth: workingMonth,
    rmBookings: (typeof RM !== 'undefined' && RM.bookings) ? RM.bookings : [],
    rmHotelConfig: (typeof HOTEL_CONFIG !== 'undefined' && HOTEL_CONFIG) ? HOTEL_CONFIG : [],
    archives: (function(){ try { return JSON.parse(localStorage.getItem('macau_archives'))||{}; } catch(e) { return {}; } })(),
    _ts: _ssotLastWrite
  };
  db.ref('macau_data').set(payload)
    .then(function() { console.log('[Sync ↑] Firebase 上傳成功 (ts:' + _ssotLastWrite + ')'); })
    .catch(function(err) { console.error('[Sync ↑] Firebase 上傳失敗', err); });
}"""

new_syncUpload = """function syncUpload() {
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

if old_syncUpload in content:
    content = content.replace(old_syncUpload, new_syncUpload)
    print("✅ syncUpload() 已改为 update() 分路径写入")
else:
    print("❌ 未找到 syncUpload() 函数，尝试模糊匹配...")
    # 尝试找到函数开头和结尾
    idx = content.find("function syncUpload()");
    if idx >= 0:
        print(f"   找到 syncUpload 开头于位置 {idx}")
        # 找到函数结尾
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
        print(f"   函数内容预览: {content[idx:idx+200]}")
    else:
        print("   未找到 syncUpload 函数")

# ============================================================
# 2. 替换 initSync() 中的单一监听器为独立监听器
# ============================================================
# 找到 initSync 函数并替换其内部的 on('value') 监听器
old_initSync_body = """  // v9.0 SSOT: 監聽 Firebase 資料變化，直接合併（無過濾、無鎖、無延後）
  db.ref('macau_data').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) { console.log('[Sync ↓] Firebase 無資料'); return; }

      var incomingTs = data._ts || 0;

      // v9.0 SSOT: 僅過濾本機回音（精確時間戳比對），其他所有資料直接合併
      if (_ssotLastWrite > 0 && incomingTs === _ssotLastWrite) {
        console.log('[Sync ↓] 本機回音 (ts:' + incomingTs + ')，跳過');
        return;
      }

      console.log('[Sync ↓] Firebase 資料更新 (ts:' + incomingTs + ')，直接合併...');
      var hasChanges = false;

      if (data.txs && Array.isArray(data.txs)) {
        txs = data.txs;
        var maxId = 0;
        for (var i = 0; i < txs.length; i++) { if (txs[i].id > maxId) maxId = txs[i].id; }
        nextId = maxId + 1;
        hasChanges = true;
      }
      if (data.agentList && Array.isArray(data.agentList)) {
        agentList = data.agentList;
        hasChanges = true;
      }
      if (data.agentWallets && typeof data.agentWallets === 'object') {
        agentWallets = data.agentWallets;
        hasChanges = true;
      }
      if (data.fundWithdrawals && Array.isArray(data.fundWithdrawals)) {
        fundWithdrawals = data.fundWithdrawals;
        var maxFwId = 0;
        for (var i = 0; i < fundWithdrawals.length; i++) { if (fundWithdrawals[i].id > maxFwId) maxFwId = fundWithdrawals[i].id; }
        fundNextId = maxFwId + 1;
        hasChanges = true;
      }
      if (data.workingMonth) {
        workingMonth = data.workingMonth;
        hasChanges = true;
      }
      if (data.archives) {
        localStorage.setItem('macau_archives', JSON.stringify(data.archives));
      }
      if (data.rmBookings && typeof RM !== 'undefined') {
        RM.bookings = data.rmBookings;
        hasChanges = true;
      }
      if (data.rmHotelConfig && Array.isArray(data.rmHotelConfig)) {
        HOTEL_CONFIG = data.rmHotelConfig;
        saveHCConfig();
        hasChanges = true;
      }

      // 同時保存到 localStorage（加密備份）
      if (hasChanges) {
        try {
          var encrypted = encryptData(txs);
          localStorage.setItem("macau_data", encrypted);
          // 同時保存公基金和代理錢包到 localStorage
          localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals));
          localStorage.setItem("macau_agent_wallets", encryptWallets(agentWallets));
        } catch(e) { console.error('localStorage save error:', e); }

        // v8.2 僅在對應頁面可見時才渲染，避免干擾用戶操作
        var pageOverview = document.getElementById("page-overview");
        if (pageOverview && pageOverview.style.display === "block") { renderOverview(); }
        var pageAll = document.getElementById("page-all");
        if (pageAll && pageAll.style.display === "block") { renderAll(); }
        var pageSummary = document.getElementById("page-summary");
        if (pageSummary && pageSummary.style.display === "block") { renderSummary(); }
        if (typeof RM !== 'undefined') { RM.updateQuota(); RM.render(); }
        if (typeof renderAgentWallets === 'function') renderAgentWallets();
        if (typeof updateAllAgentBalances === 'function') updateAllAgentBalances();
        var pageQuery = document.getElementById("page-query");
        if (pageQuery && pageQuery.style.display === "block") { try { doQuery(); } catch(e) {} }
        try { updateTotalWalletUI(); } catch(e) {}
        // 代理錢包餘額更新
        try {
          var awAgents = Object.keys(agentWallets);
          for (var wi = 0; wi < awAgents.length; wi++) {
            syncAgentDrawn(awAgents[wi]);
          }
        } catch(e) {}

        console.log('[Sync ↓] Firebase 資料已合併並渲染');
      }
    } catch(e) { console.error('[Sync ↓] SSOT 合併錯誤:', e); }
  });"""

new_initSync_body = """  // v9.1 分路徑監聽：每個數據類型獨立監聽，互不干擾
  // 1. txs 監聽
  db.ref('macau_data/txs').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) return;
      txs = data;
      var maxId = 0;
      for (var i = 0; i < txs.length; i++) { if (txs[i].id > maxId) maxId = txs[i].id; }
      nextId = maxId + 1;
      try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
      var pageAll = document.getElementById("page-all");
      if (pageAll && pageAll.style.display === "block") { renderAll(); }
      var pageOverview = document.getElementById("page-overview");
      if (pageOverview && pageOverview.style.display === "block") { renderOverview(); }
      var pageSummary = document.getElementById("page-summary");
      if (pageSummary && pageSummary.style.display === "block") { renderSummary(); }
      console.log('[Sync ↓] txs 已同步');
    } catch(e) { console.error('[Sync ↓] txs 監聽錯誤:', e); }
  });

  // 2. fundWithdrawals 監聽
  db.ref('macau_data/fundWithdrawals').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) return;
      fundWithdrawals = data;
      var maxFwId = 0;
      for (var i = 0; i < fundWithdrawals.length; i++) { if (fundWithdrawals[i].id > maxFwId) maxFwId = fundWithdrawals[i].id; }
      fundNextId = maxFwId + 1;
      try { localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals)); } catch(e) {}
      try { updateTotalWalletUI(); } catch(e) {}
      var pageQuery = document.getElementById("page-query");
      if (pageQuery && pageQuery.style.display === "block") { try { doQuery(); } catch(e) {} }
      console.log('[Sync ↓] fundWithdrawals 已同步');
    } catch(e) { console.error('[Sync ↓] fundWithdrawals 監聽錯誤:', e); }
  });

  // 3. agentList 監聽
  db.ref('macau_data/agentList').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) return;
      agentList = data;
      fillAgent();
      console.log('[Sync ↓] agentList 已同步');
    } catch(e) { console.error('[Sync ↓] agentList 監聽錯誤:', e); }
  });

  // 4. agentWallets 監聽
  db.ref('macau_data/agentWallets').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) return;
      agentWallets = data;
      try { localStorage.setItem("macau_agent_wallets", encryptWallets(agentWallets)); } catch(e) {}
      if (typeof renderAgentWallets === 'function') renderAgentWallets();
      if (typeof updateAllAgentBalances === 'function') updateAllAgentBalances();
      console.log('[Sync ↓] agentWallets 已同步');
    } catch(e) { console.error('[Sync ↓] agentWallets 監聽錯誤:', e); }
  });

  // 5. workingMonth 監聽
  db.ref('macau_data/workingMonth').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) return;
      workingMonth = data;
      console.log('[Sync ↓] workingMonth 已同步');
    } catch(e) { console.error('[Sync ↓] workingMonth 監聽錯誤:', e); }
  });

  // 6. rmBookings 監聽
  db.ref('macau_data/rmBookings').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) return;
      if (typeof RM !== 'undefined') { RM.bookings = data; RM.updateQuota(); RM.render(); }
      console.log('[Sync ↓] rmBookings 已同步');
    } catch(e) { console.error('[Sync ↓] rmBookings 監聽錯誤:', e); }
  });

  // 7. rmHotelConfig 監聽
  db.ref('macau_data/rmHotelConfig').on('value', function(snapshot) {
    try {
      var data = snapshot.val();
      if (!data) return;
      HOTEL_CONFIG = data;
      saveHCConfig();
      console.log('[Sync ↓] rmHotelConfig 已同步');
    } catch(e) { console.error('[Sync ↓] rmHotelConfig 監聽錯誤:', e); }
  });

  console.log('[Sync] v9.1 分路徑監聽已啟動（各數據類型獨立同步）');"""

if old_initSync_body in content:
    content = content.replace(old_initSync_body, new_initSync_body)
    print("✅ initSync() 监听器已改为分路径独立监听")
else:
    print("⚠️  未找到完整的 initSync 监听器代码，尝试查找特征字符串...")
    if "v9.0 SSOT: 監聽 Firebase 資料變化" in content:
        print("   找到 initSync 监听器特征字符串")
        # 尝试用正则表达式替换
        import re
        # 匹配从 "db.ref('macau_data').on('value'" 到 "});" 的大段代码
        pattern = r"db\.ref\('macau_data'\)\.on\('value', function\(snapshot\) \{[\s\S]*?\}\);"
        match = re.search(pattern, content)
        if match:
            print(f"   找到监听器代码，长度: {len(match.group())}")
            content = content[:match.start()] + new_initSync_body + content[match.end():]
            print("✅ 使用正则替换 initSync 监听器")
        else:
            print("   未找到可替换的监听器代码段")
    else:
        print("   未找到 initSync 监听器特征字符串")

# ============================================================
# 3. 写回文件
# ============================================================
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ v9.1 分路径写入重构完成")
print("   改动: syncUpload() 改为 update() + initSync() 改为分路径监听")
