// js/auth.js - v11.0
// Non-overlapping extraction

document.addEventListener("keydown", function(e) {
  // Ctrl+N 新增
  if (e.ctrlKey && e.key === "n") { e.preventDefault(); if (!isModalOpen()) openModal(); return; }
  // Ctrl+S 儲存
  if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveData(true); showToast("已儲存 " + txs.length + " 筆","success"); return; }
  // Ctrl+Z 復原
  if (e.ctrlKey && e.key === "z") { e.preventDefault(); undoDelete(); return; }
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

// ===== 刪除撤銷 =====
var lastDeleted = null;
// v10.0 B方案：使用 _fbKey 精準刪除（修復舊資料相容）
function deleteTx(fbKey) {
  try {
  if (!confirm("確定刪除此筆交易？")) return;
  showLoading("刪除中…");
  // 保存副本供撤銷
  var found = false;
  var targetFbKey = fbKey;
  for (var i = 0; i < txs.length; i++) {
    var t = txs[i];
    if (!t) continue;
    if (t._fbKey === fbKey || String(t.id) === String(fbKey) || t.id === parseInt(fbKey) || String(t._fbKey) === String(fbKey)) {
      lastDeleted = t;
      lastDeleted.fbKey = t._fbKey || fbKey;
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
  if (lastDeleted) showUndoToast();
  setTimeout(hideLoading, 300);
  } catch(e) {
    hideLoading();
    console.error('[deleteTx] 錯誤:', e);
    showToast("刪除失敗：" + (e.message||e), "error");
  }
}
function showUndoToast() {
  var container = document.getElementById("toast-container");
  var el = document.createElement("div");
  el.className = "toast toast-warning";
  el.style.cssText = "cursor:pointer;flex-direction:column;gap:6px;";
  el.innerHTML = "<span>已刪除 1 筆交易</span><button style='padding:4px 12px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:#fff;cursor:pointer;font-size:12px;'>↩ 撤銷</button>";
  el.querySelector("button").onclick = function(e) {
    e.stopPropagation();
    undoDelete();
    el.remove();
  };
  el.onclick = function() { el.remove(); };
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, 5000);
}
// v10.0 B方案：撤銷時寫入 Firebase
function undoDelete() {
  if (!lastDeleted) return;
  txs.push(lastDeleted);
  // v10.26 重試封裝寫入 Firebase
  if (db && lastDeleted.fbKey) _syncSet(db.ref('macau_data/txs/' + lastDeleted.fbKey), lastDeleted);
  saveData(true);
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  showToast("已恢復交易！","success");
  lastDeleted = null;
}

// ===== 月度管理 =====