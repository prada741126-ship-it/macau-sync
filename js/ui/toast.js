// js/ui/toast.js - v11.0
// Non-overlapping extraction

function lockBody() { document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden"; }
function unlockBody() { document.documentElement.style.overflow = ""; document.body.style.overflow = ""; }

// ===== Toast 通知系統 =====
function showToast(msg, type) {
  type = type || "info";
  var icons = { success: "✅ ", warning: "⚠️ ", error: "❌ ", info: "ℹ️ " };
  var icon = icons[type] || "ℹ️ ";
  var container = document.getElementById("toast-container");
  var el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.textContent = icon + msg;
  el.onclick = function() { el.remove(); };
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, 3500);
}

// v10.26 增強：帶操作按鈕的 Toast
function showToastAction(msg, type, actionLabel, actionFn) {
  type = type || "info";
  var icons = { success: "✅ ", warning: "⚠️ ", error: "❌ ", info: "ℹ️ " };
  var container = document.getElementById("toast-container");
  var el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.style.display = "flex"; el.style.alignItems = "center"; el.style.justifyContent = "space-between"; el.style.gap = "8px";
  el.innerHTML = '<span>' + (icons[type]||"ℹ️ ") + msg + '</span><button style="padding:3px 10px;border:1px solid currentColor;border-radius:6px;background:rgba(255,255,255,0.1);color:inherit;font-size:12px;cursor:pointer;font-weight:600;">' + actionLabel + '</button>';
  el.querySelector("button").onclick = function(e) { e.stopPropagation(); el.remove(); if (typeof actionFn === "function") actionFn(); };
  el.onclick = function() { el.remove(); };
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, 5000);
}

// v10.26 全局錯誤邊界：帶重試按鈕的錯誤提示
function showErrorRecovery(elOrId, title, desc, retryFn) {
  var el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.innerHTML = '<div class="error-recovery"><div class="err-icon">⚠️</div><div class="err-title">' + (title||"發生錯誤") + '</div><div class="err-desc">' + (desc||"請檢查網路連線後重新整理") + '</div><button class="err-retry" onclick="(' + retryFn.toString() + ')()">🔄 重試</button></div>';
}

// ===== 排序功能 =====