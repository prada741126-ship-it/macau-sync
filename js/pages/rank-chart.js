// js/pages/rank-chart.js - v11.0
// Non-overlapping extraction

var _rankChartInst = null;
function renderRankChart(agtArr) {
  var canvas = document.getElementById("ov-rank-chart");
  if (!canvas) return;
  if (typeof Chart === "undefined") {
    var panel = document.getElementById("ov-agent-rank");
    if (!agtArr.length) { if (panel) panel.innerHTML = '<div class="rank-empty">本月尚無交易</div>'; return; }
    var html = '';
    var rankColors = ['#d4af37','#a0a0a0','#cd7f32','rgba(255,255,255,0.4)','rgba(255,255,255,0.3)'];
    var maxV = agtArr[0].vol;
    for (var r = 0; r < agtArr.length; r++) {
      var ag = agtArr[r];
      var pct = Math.round(ag.vol / maxV * 100);
      html += '<div class="rank-row"><div class="rank-num">'+(r+1)+'</div><div class="rank-name">'+ag.name+'</div><div class="rank-bar-wrap"><div class="rank-bar-track"><div class="rank-bar-fill" style="width:'+pct+'%;background:linear-gradient(90deg,'+(rankColors[r]||rankColors[4])+',rgba(212,175,55,0.3));"></div></div><div class="rank-val">'+fmt(ag.vol)+'萬</div></div></div>';
    }
    if (panel) panel.innerHTML = html;
    return;
  }
  // 雙重銷毀：Chart.getChart(canvas) 確保 Canvas 被完全釋放
  var existingChart = Chart.getChart ? Chart.getChart(canvas) : null;
  if (existingChart) { existingChart.destroy(); }
  if (_rankChartInst) { _rankChartInst.destroy(); _rankChartInst = null; }
  // 重置 canvas 確保完全釋放
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var labels = [], data = [];
  for (var i = agtArr.length - 1; i >= 0; i--) {
    labels.push(agtArr[i].name);
    data.push(agtArr[i].vol);
  }
  _rankChartInst = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "洗碼量（萬）",
        data: data,
        backgroundColor: data.map(function(v, idx) {
          var colors = ["rgba(212,175,55,0.6)","rgba(160,160,160,0.5)","rgba(205,127,50,0.5)","rgba(255,255,255,0.25)","rgba(255,255,255,0.2)"];
          var i = data.length - 1 - idx;
          return colors[i] || "rgba(255,255,255,0.15)";
        }),
        borderColor: data.map(function(v, idx) {
          var colors = ["#d4af37","#a0a0a0","#cd7f32","rgba(255,255,255,0.4)","rgba(255,255,255,0.3)"];
          var i = data.length - 1 - idx;
          return colors[i] || "rgba(255,255,255,0.2)";
        }),
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(20,20,30,0.95)",
          bodyColor: "#e0d0a0",
          borderColor: "rgba(212,175,55,0.3)",
          borderWidth: 1,
          callbacks: { label: function(item) { return "洗碼量: " + fmt(item.raw) + " 萬"; } }
        }
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#887755", font: { size: 9 } }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: "#e0d0a0", font: { size: 11 } } }
      }
    }
  });


}

// ===== 房務系統 JS =====