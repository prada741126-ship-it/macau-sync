// js/auth-navigation.js - v11.0
// Non-overlapping extraction

var workingMonth = ""; // 當前工作日誌月份，如 "2026-06"

// ==== 密碼保護 ====
var PASSWORD = 'macau888'; // 同步密碼，需要與 server.js 中的 SYNC_PASSWORD 一致

// 檢查是否從外部網路訪問（非本地）
function isRemoteAccess() {
  var h = window.location.hostname;
  return !h.match(/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/) && h !== '' && window.location.protocol !== 'file:';
}

function showPasswordOverlay() {
  document.getElementById('pw-overlay').style.display = 'flex';
}


// ===== 安全防護 =====
var pwAttempts = 0;
var pwLockTimer = 0;
var sessionTimer = 0;
var SESSION_TIMEOUT = 30 * 60 * 1000;

function togglePw() {
  var inp = document.getElementById("pw-input");
  var btn = document.querySelector(".pw-toggle");
  if (inp.type === "password") { inp.type = "text"; btn.innerHTML = "&#128064;"; }
  else { inp.type = "password"; btn.innerHTML = "&#128065;"; }
}

function resetSession() {
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(function() {
    sessionStorage.removeItem("macau_auth");
    document.getElementById("pw-overlay").style.display = "flex";
    showToast("會話已逾時，請重新登入", "warning");
  }, SESSION_TIMEOUT);
}

function checkPw() {
  if (pwLockTimer > 0) return;
  var v = document.getElementById("pw-input").value;
  // 從 Base64 解碼正確密碼（不再明文出現在程式碼中）
  var correct = atob(_pwEncoded);
  if (v === correct) {
    pwAttempts = 0;
    document.getElementById("pw-error").style.display = "none";
    document.getElementById("pw-attempts").style.display = "none";
    // ✅ 安全強化：密碼存在 sessionStorage（記憶體，關閉瀏覽器後清除）
    setSessionPw(v);
    sessionStorage.setItem("macau_auth", "1");
    _stopLoginParticles();
    document.getElementById("pw-overlay").style.display = "none";
    resetSession();
    showToast("登入成功", "success");
  } else {
    pwAttempts++;
    document.getElementById("pw-error").style.display = "block";
    if (pwAttempts >= 5) {
      var sec = 60;
      document.getElementById("pw-lock").style.display = "block";
      document.getElementById("pw-error").style.display = "none";
      document.getElementById("pw-attempts").style.display = "none";
      pwLockTimer = setInterval(function() {
        sec--;
        document.getElementById("pw-countdown").textContent = sec;
        if (sec <= 0) {
          clearInterval(pwLockTimer);
          pwLockTimer = 0;
          pwAttempts = 0;
          document.getElementById("pw-lock").style.display = "none";
          document.getElementById("pw-error").style.display = "none";
        }
      }, 1000);
    } else {
      document.getElementById("pw-attempts").style.display = "block";
      document.getElementById("pw-attempts").textContent = "剩餘嘗試次數：" + (5 - pwAttempts);
    }
  }
}

// 監聽用戶操作重置會話計時
document.addEventListener("mousemove", resetSession);
document.addEventListener("keydown", resetSession);
document.addEventListener("touchstart", resetSession);
// ===== 安全防護結束 =====

function showPage(name, sidebarEl) {
  // 強制關閉手機版側邊欄（放在最前面，確保一定執行）
  var sb = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  if (sb) {
    sb.classList.add("mobile-hidden");
    // 不直接操作 style.transform，讓 CSS 控制
  }
  if (overlay) {
    overlay.classList.remove("active");
    overlay.style.display = "none";
    overlay.style.opacity = "0";
  }

  var pages = document.querySelectorAll(".page");
  for (var i = 0; i < pages.length; i++) {
    pages[i].style.display = "none";
  }
  // 更新 sidebar active 狀態
  var items = document.querySelectorAll(".sb-item");
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove("active");
  }
  if (sidebarEl) sidebarEl.classList.add("active");
  // 顯示目標頁面
  var tp = document.getElementById("page-" + name);
  if (tp) tp.style.display = "block";
  // 更新 topbar 標題
  var tt = document.getElementById("topbar-title");
  if (tt) {
    var titles = { overview:"總覽", all: "全部交易", query: "查詢", summary: "統計", room: "房務系統" };
    tt.textContent = titles[name] || name;
  }
  // 觸發各頁面更新（加 try-catch 避免單一頁面錯誤導致頁面卡住）
  if (name === "overview") { setTimeout(function(){ var tp=document.getElementById("page-overview"); if(tp&&tp.style.display==="block"){ try{ renderOverview(); }catch(e){ console.error("renderOverview error:",e); } } }, 50); }
  if (name === "all") { try { renderAll(); } catch(e) { console.error("renderAll error:", e); } }
  if (name === "summary") { try { renderSummary(); } catch(e) { console.error("renderSummary error:", e); } }
  if (name === "query") { try { fillAgent(); populateMonthDropdown(); doQuery(); updateTotalWalletUI(); } catch(e) { console.error("query page error:", e); } }
  if (name === "room") { try { if (typeof RM !== "undefined") { RM.updateQuota(); RM.render(); RM.populateAgentFilter(); } switchRoomTab("booking", document.querySelector('.room-tab')); } catch(e) { console.error("room page error:", e); } }
  // v10.26 檢查表格滾動狀態
  setTimeout(checkTableScroll, 200);
}

// ===== Sidebar toggle =====