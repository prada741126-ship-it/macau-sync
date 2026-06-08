// js/pages/overview-charts.js - v11.0
// Non-overlapping extraction

var _trendChartInst = null;
function renderTrendChart(daily, monthLabel) {
  var canvas = document.getElementById("ov-trend-chart");
  var spark = document.getElementById("ov-sparkline");
  var slbl = document.getElementById("ov-sparklabels");
  if (!canvas) return;
  // 檢查 Chart.js 是否可用
  if (typeof Chart === "undefined") {
    if (spark) spark.style.display = "";
    if (slbl) slbl.style.display = "";
    return;
  }
  // 隱藏舊版 sparkline
  if (spark) spark.style.display = "none";
  if (slbl) slbl.style.display = "none";

  // 生成標籤（每 3 天顯示一次）
  var labels = [];
  for (var d = 0; d < daily.length; d++) {
    labels.push((d + 1) % 3 === 0 || d === 0 || d === daily.length - 1 ? (d + 1) + "日" : "");
  }
  // 銷毀舊圖表（使用 Chart.getChart 確保正確釋放 canvas）
  var existingChart = Chart.getChart ? Chart.getChart(canvas) : null;
  if (existingChart) { existingChart.destroy(); }
  if (_trendChartInst) { _trendChartInst.destroy(); _trendChartInst = null; }
  // 重置 canvas 以確保完全釋放
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(0,212,255,0.3)");
  gradient.addColorStop(1, "rgba(0,212,255,0.02)");
  _trendChartInst = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "洗碼量（100萬）",
        data: daily,
        borderColor: "#00d4ff",
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: daily.map(function(v) { return v > 0 ? 3 : 0; }),
        pointBackgroundColor: "#00d4ff",
        pointBorderColor: "#161b22",
        pointBorderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(13,17,23,0.95)",
          titleColor: "#00d4ff",
          bodyColor: "#e6edf3",
          borderColor: "rgba(0,212,255,0.3)",
          borderWidth: 1,
          callbacks: {
            title: function(items) { return items[0].label || (items[0].dataIndex + 1) + "日"; },
            label: function(item) { return "洗碼量: " + fmt(item.raw) + " 萬"; }
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#6e7681", font: { size: 10 }, maxRotation: 0 }
        },
        y: {
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: {
            color: "#6e7681", font: { size: 10 },
            callback: function(v) { return v >= 10000 ? (v/10000).toFixed(1) + "萬" : v; }
          },
          beginAtZero: true
        }
      },
      interaction: { mode: "index", intersect: false }
    }
  });


}

// ===== Chart.js 代理排行圖 =====