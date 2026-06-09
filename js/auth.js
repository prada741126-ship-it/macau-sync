// js/auth.js - v12.0.6
// Non-overlapping extraction

document.addEventListener("keydown", function(e) {
  // Ctrl+N 新增
  if (e.ctrlKey && e.key === "n") { e.preventDefault(); if (!isModalOpen()) openModal(); return; }
  // Ctrl+S 儲存
  if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveData(true); showToast("已儲存 " + txs.length + " 筆","success"); return; }
  // Ctrl+1~5 切換頁面
  if (e.ctrlKey && e.key >= "1" && e.key <= "5") {
    e.preventDefault();
    var pages = ["overview","all","query","summary","room"];
    var idx = parseInt(e.key) - 1;
    var navItems = document.querySelectorAll(".sb-item[data-page]");
    if (navItems[idx]) showPage(pages[idx], navItems[idx]);
    return;
  }
  // ? 鍵顯示快捷鍵幫助（v10.26 統一使用 shortcut-help-modal）
  if (e.key === "?" && !isModalOpen()) {
    e.preventDefault();
    openShortcutHelp();
    return;
  }
  // Escape 關閉彈窗
  if (e.key === "Escape") {
    var scHelp = document.getElementById("shortcut-help-modal");
    if (scHelp && scHelp.classList.contains("show")) { closeShortcutHelp(); return; }
    if (document.getElementById("modal").classList.contains("show")) closeModal();
    else if (document.getElementById("fund-modal").classList.contains("show")) closeFundModal();
    else if (document.getElementById("agent-wallet-modal").classList.contains("show")) closeAgentWalletModal();
    else if (document.getElementById("agent-mgr-modal").classList.contains("show")) closeAgentMgr();
  }
});
function isModalOpen() {
  return document.getElementById("modal").classList.contains("show") ||
    document.getElementById("fund-modal").classList.contains("show") ||
    document.getElementById("agent-wallet-modal").classList.contains("show") ||
    document.getElementById("agent-mgr-modal").classList.contains("show");
}

// ===== 刪除交易 =====
// v10.0 B方案：使用 _fbKey 精準刪除（修復舊資料相容）
function deleteTx(fbKey) {
  try {
  if (!confirm("確定刪除此筆交易？")) return;
  showLoading("刪除中…");
  var found = false;
  var targetFbKey = fbKey;
  for (var i = 0; i < txs.length; i++) {
    var t = txs[i];
    if (!t) continue;
    if (t._fbKey === fbKey || String(t.id) === String(fbKey) || t.id === parseInt(fbKey) || String(t._fbKey) === String(fbKey)) {
      targetFbKey = t._fbKey || fbKey;
      found = true;
      break;
    }
  }
  if (!found) {
    hideLoading();
    showToast("找不到該筆交易，可能已被刪除", "warning");
    return;
  }
  // v10.26 使用重試封裝刪除 Firebase 記錄
  if (db && targetFbKey && String(targetFbKey) !== "undefined") {
    _syncSet(db.ref('macau_data/txs/' + targetFbKey), null);
  }
  // 本地移除（精準比對）
  var newTxs = [];
  for (var i = 0; i < txs.length; i++) {
    var t = txs[i];
    if (!t) continue;
    var isMatch = (t._fbKey === targetFbKey) || (String(t.id) === String(targetFbKey)) || (t.id === parseInt(targetFbKey));
    if (!isMatch) newTxs.push(t);
  }
  txs = newTxs;
  saveData(true);
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  showToast("已刪除 1 筆交易", "success");
  setTimeout(function(){ showToast("同步中…", "info"); }, 350);
  setTimeout(function(){ showToast("同步成功", "success"); }, 950);
  setTimeout(hideLoading, 300);
  } catch(e) {
    hideLoading();
    console.error('[deleteTx] 錯誤:', e);
    showToast("刪除失敗：" + (e.message||e), "error");
  }
}

// ===== 月度管理 =====
