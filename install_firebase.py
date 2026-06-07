#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Firebase 集成脚本 - 一次性修改 index.html
"""

filepath = r'C:\Users\monkey888\WorkBuddy\Claw\render-deploy\index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'原始行数: {len(lines)}')

# ============================================================
# 1. 在 </head> 前插入 Firebase SDK (第1553行之前)
# ============================================================
firebase_sdk = """\n<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>
<script>
  const firebaseConfig = {
    apiKey: "AIzaSyDPLDEr5QnMQ_AD-z7Wppt2fylxWoBuxj0U",
    authDomain: "macau-sync.firebaseapp.com",
    databaseURL: "https://macau-sync-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "macau-sync",
    storageBucket: "macau-sync.appspot.com",
    messagingSenderId: "5394959664910",
    appId: "1:5394959664910:web:f445ede79937711fdd65f",
    measurementId: "G-8BFD758YCF"
  };
  firebase.initializeApp(firebaseConfig);
  var db = firebase.database();
  console.log('[Firebase] 初始化完成');
</script>
"""

# 找到 </head> 的位置（行号从1开始，列表索引从0开始）
head_idx = None
for i, line in enumerate(lines):
    if '</head>' in line.lower():
        head_idx = i
        print(f'找到 </head> 在第 {i+1} 行')
        break

if head_idx is None:
    print('ERROR: 未找到 </head>')
    exit(1)

# 在 </head> 前插入 Firebase SDK
lines.insert(head_idx, firebase_sdk)
print(f'已插入 Firebase SDK')

# ============================================================
# 2. 替换 syncUpload() 函数
# ============================================================
# 找到 function syncUpload() 的起始行
sync_upload_start = None
for i, line in enumerate(lines):
    if 'function syncUpload()' in line:
        sync_upload_start = i
        print(f'找到 syncUpload() 在第 {i+1} 行')
        break

if sync_upload_start is None:
    print('ERROR: 未找到 syncUpload()')
    exit(1)

# 找到 syncUpload() 的结束行（下一个空行+函数定义）
sync_upload_end = None
for i in range(sync_upload_start + 1, len(lines)):
    if lines[i].strip() == '' and i + 1 < len(lines) and ('function ' in lines[i+1] or lines[i+1].strip().startswith('function ')):
        sync_upload_end = i
        print(f'syncUpload() 结束于第 {i+1} 行')
        break

if sync_upload_end is None:
    # 如果没找到，假设到 syncDownload 之前
    for i, line in enumerate(lines):
        if 'function syncDownload()' in line:
            sync_upload_end = i - 1
            print(f'syncUpload() 结束于第 {i} 行 (syncDownload 之前)')
            break

new_sync_upload = """function syncUpload() {
  if (!db) { console.log('[Sync ↑] Firebase 未初始化'); return; }
  var payload = {
    txs: txs,
    agentList: agentList,
    agentWallets: agentWallets,
    fundWithdrawals: fundWithdrawals,
    workingMonth: workingMonth,
    rmBookings: (typeof RM !== 'undefined' && RM.bookings) ? RM.bookings : [],
    archives: (function(){ try { return JSON.parse(localStorage.getItem('macau_archives'))||{}; } catch(e) { return {}; } })(),
    timestamp: Date.now()
  };
  db.ref('macau_data').set(payload)
    .then(function() { console.log('[Sync ↑] Firebase 上傳成功'); })
    .catch(function(err) { console.error('[Sync ↑] Firebase 上傳失敗', err); });
}
"""

# 替换 syncUpload 函数
if sync_upload_start is not None and sync_upload_end is not None:
    lines = lines[:sync_upload_start] + [new_sync_upload] + lines[sync_upload_end:]
    print(f'已替换 syncUpload()')

# ============================================================
# 3. 替换 syncDownload() 函数
# ============================================================
# 重新查找 syncDownload() 的位置
sync_download_start = None
for i, line in enumerate(lines):
    if 'function syncDownload()' in line:
        sync_download_start = i
        print(f'找到 syncDownload() 在第 {i+1} 行')
        break

if sync_download_start is None:
    print('ERROR: 未找到 syncDownload()')
    exit(1)

# 找到 syncDownload() 的结束行
sync_download_end = None
for i in range(sync_download_start + 1, len(lines)):
    if lines[i].strip() == '' and i + 1 < len(lines) and ('function ' in lines[i+1]):
        sync_download_end = i
        print(f'syncDownload() 结束于第 {i+1} 行')
        break

new_sync_download = """function syncDownload() {
  // Firebase 使用即時監聽，無需手動下載
  console.log('[Sync ↓] Firebase 使用即時監聽');
}
"""

if sync_download_start is not None and sync_download_end is not None:
    lines = lines[:sync_download_start] + [new_sync_download] + lines[sync_download_end:]
    print(f'已替换 syncDownload()')

# ============================================================
# 4. 替换 manualSync() 函数
# ============================================================
manual_sync_start = None
for i, line in enumerate(lines):
    if 'function manualSync()' in line:
        manual_sync_start = i
        print(f'找到 manualSync() 在第 {i+1} 行')
        break

if manual_sync_start is None:
    print('ERROR: 未找到 manualSync()')
    exit(1)

manual_sync_end = None
for i in range(manual_sync_start + 1, len(lines)):
    if lines[i].strip() == '' and i + 1 < len(lines) and ('function ' in lines[i+1]):
        manual_sync_end = i
        print(f'manualSync() 结束于第 {i+1} 行')
        break

new_manual_sync = """function manualSync() {
  showLoading('正在同步…');
  syncUpload();
  setTimeout(function() { hideLoading(); showToast('同步完成', 'success'); }, 800);
}
"""

if manual_sync_start is not None and manual_sync_end is not None:
    lines = lines[:manual_sync_start] + [new_manual_sync] + lines[manual_sync_end:]
    print(f'已替换 manualSync()')

# ============================================================
# 5. 替换 initSync() 函数
# ============================================================
init_sync_start = None
for i, line in enumerate(lines):
    if 'function initSync()' in line:
        init_sync_start = i
        print(f'找到 initSync() 在第 {i+1} 行')
        break

if init_sync_start is None:
    print('ERROR: 未找到 initSync()')
    exit(1)

init_sync_end = None
for i in range(init_sync_start + 1, len(lines)):
    if lines[i].strip() == '' and i + 1 < len(lines) and ('function ' in lines[i+1]):
        init_sync_end = i
        print(f'initSync() 结束于第 {i+1} 行')
        break

new_init_sync = """function initSync() {
  if (!db) { console.log('[Sync] Firebase 未初始化'); return; }
  console.log('[Sync] Firebase 即時同步已啟動');
  
  // 監聽 Firebase 資料變化（即時推送）
  db.ref('macau_data').on('value', function(snapshot) {
    var data = snapshot.val();
    if (!data) { console.log('[Sync ↓] Firebase 無資料'); return; }
    
    console.log('[Sync ↓] Firebase 收到資料更新');
    
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
    
    // 同時保存到 localStorage（加密備份）
    if (hasChanges) {
      try {
        var encrypted = encryptData(txs);
        localStorage.setItem("macau_data", encrypted);
      } catch(e) { console.error('localStorage save error:', e); }
      
      // 渲染所有頁面
      renderAll();
      renderOverview();
      renderSummary();
      if (typeof renderRoom === 'function') renderRoom();
      if (typeof renderAgentWallets === 'function') renderAgentWallets();
      if (typeof updateAllAgentBalances === 'function') updateAllAgentBalances();
      
      console.log('[Sync ↓] Firebase 資料已合併並渲染');
    }
  });
}
"""

if init_sync_start is not None and init_sync_end is not None:
    lines = lines[:init_sync_start] + [new_init_sync] + lines[init_sync_end:]
    print(f'已替换 initSync()')

# ============================================================
# 写入文件
# ============================================================
with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f'修改后行数: {len(lines)}')
print('Firebase 集成完成！')
