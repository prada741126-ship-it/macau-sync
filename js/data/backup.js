// js/data/backup.js - v11.0
// Non-overlapping extraction

function _autoBackupCheck() {
  var today = nowStr();
  var lastBackup = localStorage.getItem("macau_last_backup_date");
  if (lastBackup === today) return; // 今天已備份
  doBackup();
  localStorage.setItem("macau_last_backup_date", today);
  _cleanOldBackups();
}

function doBackup() {
  var backupData = {};
  var keys = ["macau_data","macau_fund_data","macau_agent_wallets","macau_agent_list","macau_config","macau_archives","macau_fundNextId","macau_working_month"];
  for (var i = 0; i < keys.length; i++) {
    var val = localStorage.getItem(keys[i]);
    if (val !== null) backupData[keys[i]] = val;
  }
  var dateStr = nowStr();
  localStorage.setItem("macau_backup_" + dateStr, JSON.stringify(backupData));
  // 加入備份列表
  var list = [];
  try { list = JSON.parse(localStorage.getItem("macau_backup_list") || "[]"); } catch(e) {}
  if (list.indexOf(dateStr) === -1) {
    list.push(dateStr);
    list.sort(); // 升序排列
    localStorage.setItem("macau_backup_list", JSON.stringify(list));
  }
}

function _cleanOldBackups() {
  var list = [];
  try { list = JSON.parse(localStorage.getItem("macau_backup_list") || "[]"); } catch(e) {}
  var cutoff = new Date(new Date().getTime() + 480*60000 - 7*86400000).toISOString().slice(0,10);
  var keep = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] >= cutoff) {
      keep.push(list[i]);
    } else {
      localStorage.removeItem("macau_backup_" + list[i]);
    }
  }
  localStorage.setItem("macau_backup_list", JSON.stringify(keep));
}

function getBackupList() {
  try { return JSON.parse(localStorage.getItem("macau_backup_list") || "[]"); } catch(e) { return []; }
}

function restoreFromBackup(dateStr) {
  var raw = localStorage.getItem("macau_backup_" + dateStr);
  if (!raw) { showToast('找不到備份：' + dateStr, 'error'); return false; }
  try {
    var data = JSON.parse(raw);
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      localStorage.setItem(keys[i], data[keys[i]]);
    }
    showToast("已從 " + dateStr + " 還原資料！重新整理中…", "success");
    setTimeout(function() { location.reload(); }, 1500);
    return true;
  } catch(e) {
    showToast("備份資料損壞，無法還原", "error");
    return false;
  }
}

function showBackupModal() {
  var list = getBackupList();
  if (list.length === 0) {
    showToast("尚無備份紀錄，首次備份將在今日自動建立", "info");
    return;
  }
  // 反序顯示（最新在上）
  list.reverse();
  // 計算備份總大小
  var totalSize = 0;
  for (var s = 0; s < list.length; s++) {
    var b = localStorage.getItem("macau_backup_" + list[s]);
    if (b) totalSize += b.length;
  }
  var sizeKB = (totalSize / 1024).toFixed(1);
  var lastBackup = localStorage.getItem("macau_last_backup_date") || "無";

  // 建立備份對話框（v10.26 增強版）
  var bg = document.createElement("div");
  bg.className = "modal-bg show";
  bg.id = "backup-modal";
  bg.onclick = function(e) { if (e.target === bg) { document.body.removeChild(bg); unlockBody(); } };
  var inner = '<div class="modal" style="max-width:520px;"><h3>📦 備份管理</h3>';
  inner += '<div style="display:flex;gap:12px;margin-bottom:10px;font-size:11px;color:var(--text-muted);flex-wrap:wrap;">';
  inner += '<span>📊 ' + list.length + ' 份備份</span><span>💾 ' + sizeKB + ' KB</span><span>🕐 上次備份：' + lastBackup + '</span>';
  inner += '</div>';
  inner += '<p style="font-size:11px;color:var(--text-muted);margin:0 0 12px;">自動保留最近 7 天備份，點擊日期可還原該日資料</p>';
  inner += '<div style="max-height:280px;overflow-y:auto;">';
  for (var i = 0; i < list.length; i++) {
    var d = list[i];
    var txCount = 0;
    var bkSize = 0;
    try {
      var bd = JSON.parse(localStorage.getItem("macau_backup_" + d) || "{}");
      bkSize = (JSON.stringify(bd).length / 1024).toFixed(1);
      if (bd.macau_data) {
        var decrypted = decryptData(bd.macau_data);
        if (Array.isArray(decrypted)) txCount = decrypted.length;
      }
    } catch(e) {}
    var isLatest = (i === 0) ? ' <span style="font-size:10px;color:var(--success);">最新</span>' : '';
    inner += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin:4px 0;background:rgba(255,255,255,0.025);border-radius:var(--radius-sm);border:1px solid rgba(255,255,255,0.04);transition:all var(--trans-base);cursor:default;" onmouseenter="this.style.background=\'rgba(212,175,55,0.06)\';this.style.borderColor=\'rgba(212,175,55,0.15)\';" onmouseleave="this.style.background=\'rgba(255,255,255,0.025)\';this.style.borderColor=\'rgba(255,255,255,0.04)\';">';
    inner += '<div><span style="font-size:13px;font-weight:500;">📅 ' + d + '</span>' + isLatest + '<br><span style="font-size:10px;color:var(--text-muted);">' + txCount + ' 筆交易 · ' + bkSize + ' KB</span></div>';
    inner += '<button onclick="event.stopPropagation();if(confirm(\'⚠️ 確定要從 ' + d + ' 的備份還原嗎？\\n\\n📋 包含 ' + txCount + ' 筆交易\\n📦 目前資料將被覆蓋！\\n🔄 還原後會自動重新整理\\n\\n確定繼續？\')){closeBackupModal();restoreFromBackup(\'' + d + '\');}" style="padding:6px 14px;border:1px solid var(--gold-border-strong);border-radius:var(--radius-sm);background:rgba(212,175,55,0.08);color:var(--gold-light);font-size:12px;cursor:pointer;font-weight:600;transition:all var(--trans-base);">🔄 還原</button>';
    inner += '</div>';
  }
  inner += '</div>';
  inner += '<div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;flex-wrap:wrap;">';
  inner += '<button class="btn" onclick="closeBackupModal()" style="min-height:32px;">關閉</button>';
  inner += '<button class="btn btn-sm" onclick="exportBackupJSON()" style="min-height:32px;background:rgba(52,152,219,0.15);border:1px solid rgba(52,152,219,0.3);color:var(--blue);">📥 匯出備份</button>';
  inner += '<button class="btn btn-green" onclick="closeBackupModal();doBackup();_cleanOldBackups();showToast(\'手動備份完成！\',\'success\');" style="min-height:32px;">🔄 立即備份</button>';
  inner += '</div>';
  inner += '</div>';
  bg.innerHTML = inner;
  document.body.appendChild(bg);
  lockBody();
}

// v10.26 匯出所有備份為 JSON 檔案
function exportBackupJSON() {
  var list = getBackupList();
  if (list.length === 0) { showToast("尚無備份紀錄", "info"); return; }
  var exportData = {};
  for (var i = 0; i < list.length; i++) {
    var raw = localStorage.getItem("macau_backup_" + list[i]);
    if (raw) {
      try { exportData[list[i]] = JSON.parse(raw); } catch(e) {}
    }
  }
  var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "macau_backups_" + nowStr() + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("備份已匯出（" + list.length + " 份）", "success");
}

function closeBackupModal() {
  var bg = document.getElementById("backup-modal");
  if (bg && bg.parentNode) { bg.parentNode.removeChild(bg); }
  unlockBody();
}

// ===== 全域載入動畫 =====