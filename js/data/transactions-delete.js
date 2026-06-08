// js/data/transactions-delete.js - v11.0
// Non-overlapping extraction

function sortTable(tableId, thEl) {
  var col = thEl.getAttribute("data-sort");
  if (!col) return;
  if (sortState.table === tableId && sortState.col === col) {
    sortState.asc = !sortState.asc;
  } else {
    sortState.table = tableId;
    sortState.col = col;
    sortState.asc = true;
  }
  // Clear all sort indicators in this table group
  var table = document.getElementById(tableId === "all" ? "all-table" : tableId);
  var headers = table.querySelectorAll("th.sortable");
  for (var i = 0; i < headers.length; i++) {
    headers[i].classList.remove("sort-asc", "sort-desc");
  }
  thEl.classList.add(sortState.asc ? "sort-asc" : "sort-desc");
  if (tableId === "all") renderAll();
}

function sortTxs(arr) {
  if (sortState.table !== "all" || !sortState.col) return arr;
  var col = sortState.col;
  var asc = sortState.asc ? 1 : -1;
  return arr.sort(function(a, b) {
    var va, vb;
    if (col === "volume") { va = toNum(a.volume) || 0; vb = toNum(b.volume) || 0; }
    else if (col === "comm") { va = a.comm || 0; vb = b.comm || 0; }
    else if (col === "bonus") { va = a.bonus || 0; vb = b.bonus || 0; }
    else if (col === "date") { va = a.date || ""; vb = b.date || ""; }
    else { va = String(a[col] || "").toLowerCase(); vb = String(b[col] || "").toLowerCase(); }
    if (va < vb) return -1 * asc;
    if (va > vb) return 1 * asc;
    return 0;
  });
}

// ===== 鍵盤快捷鍵 (v6.0 強化版) =====