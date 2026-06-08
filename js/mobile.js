// js/mobile.js - v11.0
// Non-overlapping extraction

document.addEventListener('DOMContentLoaded', function() {
  function initMobileSidebar() {
    var sb = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    if (sb) {
      if (window.innerWidth <= 700) {
        sb.classList.add('mobile-hidden');
      } else {
        sb.classList.remove('mobile-hidden');
      }
    }
    // 初始化遮罩層狀態，防止手機版遮罩層阻擋按鈕點擊
    if (overlay) {
      if (window.innerWidth <= 700) {
        overlay.style.display = 'none';
        overlay.classList.remove('active');
      } else {
        overlay.style.display = '';
      }
    }
  }
  initMobileSidebar();
  window.addEventListener('resize', initMobileSidebar);
});

// ===== 側邊欄事件委派（確保手機觸控正常） =====
(function() {
  var sbNav = document.getElementById('sb-nav');
  if (sbNav) {
    sbNav.addEventListener('click', function(e) {
      var item = e.target.closest('.sb-item[data-page]');
      if (!item) return;
      var page = item.getAttribute('data-page');
      if (page) showPage(page, item);
    });
    // 同時支援 touchstart（手機觸控更即時）
    sbNav.addEventListener('touchstart', function(e) {
      var item = e.target.closest('.sb-item[data-page]');
      if (!item) return;
      var page = item.getAttribute('data-page');
      if (page) showPage(page, item);
    }, { passive: false });
  }
})();



// ═══════════════════════════════════════════════
// v6.0 功能优化
// ═══════════════════════════════════════════════

// ── KPI 数字动画 ──
function animateKPIValue(el, targetValue) {
  if (!el) return;
  var startValue = parseFloat(el.textContent.replace(/,/g,'')) || 0;
  targetValue = parseFloat(targetValue) || 0;
  if (startValue === targetValue) return;
  var duration = 600;
  var startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    var ease = 1 - Math.pow(2, -10 * progress);
    var current = startValue + (targetValue - startValue) * ease;
    el.textContent = Math.round(current).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = targetValue.toLocaleString();
  }
  requestAnimationFrame(step);
}

// ── 多级撤销系统 ──
var _undoStack = [];
var _MAX_UNDO = 10;

// 重写 deleteTx 以支持多级撤销
(function() {
  var _origDeleteTx = deleteTx;
  deleteTx = function(id) {
    console.log('[deleteTx] 函數被調用，ID:', id);
    if (!confirm("確定刪除此筆交易？")) { console.log('[deleteTx] 使用者取消刪除'); return; }
    showLoading("刪除中…");
    try {
      console.log('[deleteTx] 開始刪除，交易數量（刪除前）:', txs.length);
      var key = String(id);
      var deleted = null, delIndex = -1, targetFbKey = null;
      for (var i = 0; i < txs.length; i++) {
        var t = txs[i];
        if (!t) continue;
        if (t._fbKey === key || String(t.id) === key || t.id === parseInt(id)) {
          deleted = t; delIndex = i; targetFbKey = t._fbKey || key; break;
        }
      }
      if (deleted) {
        _undoStack.push({ tx: JSON.parse(JSON.stringify(deleted)), index: delIndex });
        if (_undoStack.length > _MAX_UNDO) _undoStack.shift();
      }
      // v10.0 直接從 Firebase 刪除該筆記錄
      if (db && targetFbKey && targetFbKey !== "undefined") {
        db.ref('macau_data/txs/' + targetFbKey).set(null, function(error) {
          if (error) console.error('[deleteTx] Firebase 刪除失敗:', error);
        });
      }
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
      if (deleted) showUndoToast();
    } catch(e) {
      console.error("[deleteTx] error:", e);
      showToast("删除失败：" + e.message, "error");
    } finally {
      setTimeout(hideLoading, 300);
    }
  };

  // 增强撤销Toast
  var _origShowUndoToast = showUndoToast;
  showUndoToast = function() {
    var container = document.getElementById("toast-container");
    var el = document.createElement("div");
    el.className = "toast toast-warning";
    el.style.cssText = "cursor:pointer;flex-direction:column;gap:6px;";
    el.innerHTML = "<span>已删除 1 笔交易（" + _undoStack.length + " 笔可撤销历史）</span>" +
      "<button style='padding:4px 12px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:#fff;cursor:pointer;font-size:12px;margin-right:4px;'>↩ 撤销</button>" +
      "<button style='padding:4px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#ccc;cursor:pointer;font-size:12px;' onclick='event.stopPropagation();_undoStack=[];this.parentElement.remove();'>清空历史</button>";
    el.querySelector("button").onclick = function(e) {
      e.stopPropagation();
      undoLastDelete();
      el.remove();
    };
    el.onclick = function() { el.remove(); };
    container.appendChild(el);
    setTimeout(function() { if (el.parentNode) el.remove(); }, 5000);
  };
})();

// 撤销最近删除
function undoLastDelete() {
  if (_undoStack.length === 0) { showToast("无可撤销操作", "warning"); return; }
  var item = _undoStack.pop();
  txs.splice(item.index, 0, item.tx);
  saveData(true);
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  showToast("已恢复交易！（剩余 " + _undoStack.length + " 笔可撤销）", "success");
}

// ── 键盘快捷键帮助面板 ──
function openShortcutHelp() {
  document.getElementById("shortcut-help-modal").classList.add("show");
  if (typeof lockBody === 'function') lockBody();
}
function closeShortcutHelp() {
  document.getElementById("shortcut-help-modal").classList.remove("show");
  if (typeof unlockBody === 'function') unlockBody();
}

// ── 增强键盘快捷键 ──
(function() {
  var _enhanced = false;
  if (!_enhanced) {
    _enhanced = true;
    document.addEventListener("keydown", function(e) {
      // ? 键显示帮助（不在输入框中）
      if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        var active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
        e.preventDefault();
        openShortcutHelp();
        return;
      }
      // Ctrl+1-5 切换页面
      if (e.ctrlKey && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        var pages = ["overview", "all", "query", "summary", "room"];
        var idx = parseInt(e.key) - 1;
        if (idx < pages.length) {
          var sidebarEl = document.querySelector('[data-page="' + pages[idx] + '"]');
          if (typeof showPage === 'function') showPage(pages[idx], sidebarEl);
        }
        return;
      }
      // Ctrl+F 快速搜索
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        var searchEl = document.getElementById("search-all");
        if (searchEl) { searchEl.focus(); searchEl.select(); }
        return;
      }
      // Escape 关闭弹窗（增强）
      if (e.key === "Escape") {
        var scHelp = document.getElementById("shortcut-help-modal");
        if (scHelp && scHelp.classList.contains("show")) { closeShortcutHelp(); return; }
      }
    });
  }
})();

// ── 防抖动工具函数 ──
function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() { func.apply(context, args); }, wait);
  };
}

// ── 节流工具函数 ──
function throttle(func, limit) {
  var lastTime = 0;
  return function() {
    var now = Date.now();
    if (now - lastTime >= limit) {
      func.apply(this, arguments);
      lastTime = now;
    }
  };
}

// ── 增强页面切换动画 ──
(function() {
  var _origShowPage = showPage;
  if (typeof showPage === 'function') {
    showPage = function(name, sidebarEl) {
      // 添加过渡类
      var pages = document.querySelectorAll(".page");
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].style.display !== "none") {
          pages[i].style.opacity = "0";
          pages[i].style.transform = "translateY(10px)";
        }
      }
      // 调用原始函数
      _origShowPage(name, sidebarEl);
      // 显示新页面并动画
      var tp = document.getElementById("page-" + name);
      if (tp) {
        tp.style.opacity = "0";
        tp.style.transform = "translateY(10px)";
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            tp.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            tp.style.opacity = "1";
            tp.style.transform = "translateY(0)";
          });
        });
      }
    };
  }
})();

console.log("[v6.0] 功能优化已加载：KPI动画、多级撤销、快捷键帮助");

  // 回到顶部按钮
  var btt = document.getElementById("back-to-top");
  if (btt) {
    window.addEventListener("scroll", function() {
      if (window.scrollY > 300) btt.style.display = "flex";
      else btt.style.display = "none";
    });
  }

  // v10.22 手機版底部導航
  function mobileNavigate(page, el) {
    // 切換頁面
    showPage(page);
    // 滾動到頂部
    var scrollEl = document.getElementById('page-scroll');
    if (scrollEl) { scrollEl.scrollTop = 0; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 更新導航 active 狀態
    var items = document.querySelectorAll('#mobile-bottom-nav .nav-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('active');
    }
    if (el) el.classList.add('active');
    // v10.26 延遲檢查表格滾動狀態
    setTimeout(checkTableScroll, 200);
  }

  // v10.26 檢測表格橫向滾動狀態，添加 scrollable/scrolled-end 類
  function checkTableScroll() {
    var scrolls = document.querySelectorAll('.table-scroll');
    for (var i = 0; i < scrolls.length; i++) {
      var el = scrolls[i];
      var hasScroll = el.scrollWidth > el.clientWidth + 2;
      if (hasScroll) {
        el.classList.add('scrollable');
        // 監聽滾動更新邊界狀態
        el.addEventListener('scroll', function updateEnd(e) {
          var tgt = e.target;
          var atEnd = tgt.scrollLeft + tgt.clientWidth >= tgt.scrollWidth - 5;
          if (atEnd) tgt.classList.add('scrolled-end');
          else tgt.classList.remove('scrolled-end');
        });
      }
    }
  }

// v10.23 時間篩選器
window.__currentTimeFilter = null;

function setMonth(offset, page, el) {
  var now = new Date();
  now.setMonth(now.getMonth() + offset);
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, '0');
  window.__currentTimeFilter = { type: 'month', value: y + '-' + m };
  
  // 更新按鈕 active 狀態
  var container = document.getElementById(page + '-time-filter');
  if (container) {
    var btns = container.querySelectorAll('.tf-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    if (el) el.classList.add('active');
  }
  
  // 重新渲染該頁面
  if (page === 'overview') renderOverview();
  else if (page === 'query') doQuery();
}

function setYear(page, el) {
  var now = new Date();
  window.__currentTimeFilter = { type: 'year', value: String(now.getFullYear()) };
  
  // 更新按鈕 active 狀態
  var container = document.getElementById(page + '-time-filter');
  if (container) {
    var btns = container.querySelectorAll('.tf-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    if (el) el.classList.add('active');
  }
  
  // 重新渲染該頁面
  if (page === 'overview') renderOverview();
  else if (page === 'query') doQuery();
}

function setAll(page, el) {
  window.__currentTimeFilter = null;
  
  // 更新按鈕 active 狀態
  var container = document.getElementById(page + '-time-filter');
  if (container) {
    var btns = container.querySelectorAll('.tf-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    if (el) el.classList.add('active');
  }
  
  // 重新渲染該頁面
  if (page === 'overview') renderOverview();
  else if (page === 'query') doQuery();
}

function filterTxsByTime(txs) {
  if (!window.__currentTimeFilter) return txs;
  var filter = window.__currentTimeFilter;
  return txs.filter(function(tx) {
    if (!tx.date) return true;
    if (filter.type === 'month') return tx.date.substring(0, 7) === filter.value;
    if (filter.type === 'year') return tx.date.substring(0, 4) === filter.value;
    return true;
  });
}