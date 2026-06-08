// js/data/transactions-close.js - v11.0
// Non-overlapping extraction

function closeCurrentMonth() {
  var now = nowStr().slice(0, 7);
  if (workingMonth === now) { showToast('本月已結算過了', 'warning'); return; }
  if (!confirm('確定執行 ' + now + ' 月末結算？\n\n結算後將鎖定本月資料，無法再登錄新交易。')) return;
  workingMonth = now;
  localStorage.setItem('macau_working_month', now);
  if (typeof syncUpload === 'function') syncUpload();
  document.getElementById('month-badge').textContent = now;
  document.getElementById('month-status').textContent = '已鎖定';
  document.getElementById('month-status').style.color = '#e74c3c';
  document.getElementById('btn-close-month').disabled = true;
  showToast('月末結算完成，' + now + ' 已鎖定', 'success');
}

// ===== v10.0 B方案：Firebase push() 鍵架構，個別路徑寫入 =====