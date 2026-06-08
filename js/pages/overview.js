// js/pages/overview.js - v11.0
// Non-overlapping extraction

var _renderingOverview = false;
function renderOverview() {
  // 防止並發渲染（Firebase 同步可能快速觸發多次調用）
  if (_renderingOverview) return;
  _renderingOverview = true;
  try {
  // v10.23 時間篩選
  var filteredTxs = window.__currentTimeFilter ? filterTxsByTime(txs) : txs;
  // --- KPI 卡片 ---
  var now = workingMonth || nowStr().slice(0,7);
  var totalVol=0, totalBonus=0, totalDrawn=0, totalFund=0, totalCash=0, undrawnCount=0;
  var agentSet = {};
  for (var i=0;i<filteredTxs.length;i++){
    var t=filteredTxs[i];
    if (!t.date||t.date.slice(0,7)!==now) continue;
    if (t.type==="cash"){ totalCash+=(t.cash||0); }
    else { totalVol+=(t.volume||0); }
    totalBonus+=(t.bonus||0);
    totalDrawn+=(t.drawn||0);
    totalFund+=(t.fund||0);
    if (t.agent){ agentSet[t.agent]=true; }
    if ((t.bonus||0)>(t.drawn||0)&&t.type==="rolling") undrawnCount++;
  }
  // 公基金異動
  var fDep=0,fCD=0,fWit=0;
  for (var j=0;j<fundWithdrawals.length;j++){
    var f=fundWithdrawals[j];
    if (!f.date||f.date.slice(0,7)!==now) continue;
    if (f.type==="deposit") fDep+=f.amount; else if (f.type==="cash_deposit") fCD+=f.amount; else fWit+=f.amount;
  }
  var fundNet = totalFund+fDep+fCD-fWit;
  // 公基金累计馀额（所有时间）
  var totalFundAll=0, fDepAll=0, fCDAll=0, fWitAll=0;
  for (var ii=0;ii<txs.length;ii++) totalFundAll+=(txs[ii].fund||0);
  for (var jj=0;jj<fundWithdrawals.length;jj++){
    var ff=fundWithdrawals[jj];
    if (ff.type==="deposit") fDepAll+=ff.amount;
    else if (ff.type==="cash_deposit") fCDAll+=ff.amount;
    else fWitAll+=ff.amount;
  }
  var fundBalance = Math.max(0, totalFundAll+fDepAll+fCDAll-fWitAll);
  var undrawnTotal = Math.max(0,totalBonus-totalDrawn);

  var grid=document.getElementById("ov-kpi-grid");
  // 計算已使用轉碼數（所有免費房晚 × 門檻，不限是否有洗碼記錄）
  var rmUsedRolling=0;
  var roomMonth=now.slice(0,7);
  var agentsWithRolling = {};
  for (var kk=0;kk<txs.length;kk++){ var tr=txs[kk]; if (tr.date&&tr.date.slice(0,7)===roomMonth&&tr.type!=="cash"&&tr.agent){ agentsWithRolling[tr.agent]=true; } }
  if (typeof RM!=="undefined"&&RM.bookings){
    for (var k=0;k<RM.bookings.length;k++){
      var b=RM.bookings[k];
      if (!b.date||b.date.slice(0,7)!==roomMonth) continue;
      if (b.status==="免費") rmUsedRolling += (b.nights||0) * (b.threshold||70);
    }
  }
  // 免費一晚計數：只計有洗碼記錄的代理
  var rmFreeCount = typeof RM!=="undefined" ? RM.bookings.filter(function(x){return x.date&&x.date.slice(0,7)===roomMonth&&x.status==="免費"&&agentsWithRolling[x.agent];}).length : 0;
  grid.innerHTML=''+
    '<div class="kpi-card-new gold"><div class="kpi-label">本月洗碼量</div><div class="kpi-value">'+fmt(totalVol)+'<span style="font-size:12px;color:var(--text-muted);margin-left:2px;">萬</span></div><div class="kpi-delta">'+Object.keys(agentSet).length+' 位代理</div></div>'+
    '<div class="kpi-card-new green"><div class="kpi-label">剩餘轉碼</div><div class="kpi-value">'+fmt(totalVol-rmUsedRolling)+'<span style="font-size:12px;color:var(--text-muted);margin-left:2px;">萬</span></div></div>'+
    '<div class="kpi-card-new red"><div class="kpi-label">未提領</div><div class="kpi-value">'+fmt(undrawnTotal)+'</div><div class="kpi-delta down">'+undrawnCount+' 筆待提</div></div>'+
    '<div class="kpi-card-new blue"><div class="kpi-label">公基金</div><div class="kpi-value">'+fmt(fundBalance)+'</div><div class="kpi-delta">本月入帳 '+fmt(totalFund)+'</div></div>'+
    '<div class="kpi-card-new orange"><div class="kpi-label">現金寄放</div><div class="kpi-value">'+fmt(totalCash)+'</div><div class="kpi-delta">'+Object.keys(agentSet).length+' 位代理</div></div>';

  // --- 每日洗碼量 Sparkline（滿寬，顯示全部天數）---
  var spark=document.getElementById("ov-sparkline");
  var slbl=document.getElementById("ov-sparklabels");
  var daysInMonth=new Date(parseInt(now.slice(0,4)),parseInt(now.slice(5,7)),0).getDate();
  var daily=[], daily100=[];
  for (var d=1;d<=daysInMonth;d++) daily.push(0);
  for (var i=0;i<filteredTxs.length;i++){
    var t=filteredTxs[i];
    if (!t.date||t.date.slice(0,7)!==now||t.type==="cash") continue;
    var day=parseInt(t.date.slice(8,10))-1;
    if (day>=0&&day<daysInMonth) daily[day]+=(t.volume||0);
  }
  for (var d=0;d<daysInMonth;d++) daily100.push(daily[d]/100);
  var maxV=Math.max.apply(null,daily)||1;
  var maxH=60;
  var sparkHTML='',lblHTML='';
  // show every 3rd label to save space, but render all bars
  for (var d=0;d<daysInMonth;d++){
    var v=daily[d];
    var h=v>0?Math.max(2,Math.round(v/maxV*maxH)):2;
    sparkHTML+='<div class="spark-bar'+(v===0?' empty':'')+'" style="height:'+h+'px" title="'+(d+1)+'日: '+fmt(daily100[d])+' (100萬)"><span>'+fmt(daily100[d])+'</span></div>';
    lblHTML+='<span>'+(d%3===0||d===0||d===daysInMonth-1?(d+1)+'日':'')+'</span>';
  }
  spark.innerHTML=sparkHTML;
  slbl.innerHTML=lblHTML;

  // --- Chart.js 趨勢圖（優先使用，失敗則降級到 sparkline）---
  renderTrendChart(daily100, now);

  // --- 代理洗碼排行 Top 10（Chart.js 長條圖）---
  var agtVol={};
  for (var i=0;i<txs.length;i++){
    var t=txs[i];
    if (!t.date||t.date.slice(0,7)!==now||t.type==="cash"||!t.agent) continue;
    if (!agtVol[t.agent]) agtVol[t.agent]=0;
    agtVol[t.agent]+=(t.volume||0);
  }
  var agtArr=[];
  for (var a in agtVol) agtArr.push({name:a,vol:agtVol[a]});
  agtArr.sort(function(a,b){return b.vol-a.vol;});
  agtArr=agtArr.slice(0,10);
  renderRankChart(agtArr);

  // --- 場地洗碼分佈 ---
  var venueColors = ['#00d4ff','#58a6ff','#7c3aed','#2dd4a0','#f85149','#f0a500','#c9a84c'];
  var venVol={};
  for (var i=0;i<txs.length;i++){
    var t=txs[i];
    if (!t.date||t.date.slice(0,7)!==now||t.type==="cash"||!t.venue) continue;
    if (!venVol[t.venue]) venVol[t.venue]=0;
    venVol[t.venue]+=(t.volume||0);
  }
  var venArr=[];
  for (var vv in venVol) venArr.push({name:vv,vol:venVol[vv]});
  venArr.sort(function(a,b){return b.vol-a.vol;});
  var maxVV=venArr.length>0?venArr[0].vol:1;
  var venHTML='';
  for (var vi=0;vi<venArr.length;vi++){
    var vn=venArr[vi];
    var vpct=Math.round(vn.vol/maxVV*100);
    var vcol=venueColors[vi%venueColors.length];
    var shortName=vn.name.length>8?vn.name.slice(0,8)+'..':vn.name;
    venHTML+='<div class="venue-row"><div class="venue-name" title="'+vn.name+'">'+shortName+'</div><div class="venue-bar-wrap"><div class="venue-bar-track"><div class="venue-bar-fill" style="width:'+vpct+'%;background:linear-gradient(90deg,'+vcol+',rgba(255,255,255,0.1));"></div></div><div class="venue-val">'+fmt(vn.vol)+'萬</div></div></div>';
  }
  if (!venArr.length) venHTML='<div class="venue-empty">本月尚無數據</div>';
  document.getElementById("ov-venue-dist").innerHTML=venHTML;

  // --- 近期動態 Timeline ---
  var timeline=document.getElementById("ov-timeline");
  var entries=[];
  // 交易紀錄
  for (var i=0;i<txs.length;i++){
    var t=txs[i];
    if (!t.date||t.date.slice(0,7)!==now) continue;
    entries.push({date:t.date,type:t.type||"rolling",desc:(t.type==="cash"?t.agent+" 現金寄放":t.agent+" — "+t.client+(t.venue?" @ "+t.venue:"")),amount:t.type==="cash"?(t.cash||0):(t.bonus||0),extra:t.type==="cash"?"dep":"pos"});
  }
  // 公基金異動
  for (var j=0;j<fundWithdrawals.length;j++){
    var f=fundWithdrawals[j];
    if (!f.date||f.date.slice(0,7)!==now) continue;
    var ftype=f.type==="withdraw"?"提領":(f.type==="cash_deposit"?"自存現金":"存入");
    entries.push({date:f.date,type:"fund",desc:"公基金 "+ftype+(f.note?" — "+f.note:""),amount:f.amount||0,extra:f.type==="withdraw"?"neg":"dep"});
  }
  entries.sort(function(a,b){return b.date.localeCompare(a.date);});
  entries=entries.slice(0,15);
  var tlHTML='';
  for (var e=0;e<entries.length;e++){
    var en=entries[e];
    var dotClass=en.type==="cash"?"cash":(en.type==="fund"?"fund":"rolling");
    var amtClass=en.extra==="dep"?"dep":(en.extra==="neg"?"":"pos");
    var color=amtClass==="dep"?"var(--blue)":(en.extra==="neg"?"":"var(--gold)");
    var prefix=en.extra==="neg"?"-":"";
    tlHTML+='<div class="timeline-item"><div class="timeline-dot '+dotClass+'"></div><div class="timeline-content"><div class="timeline-desc">'+en.desc+'</div><div class="timeline-meta">'+en.date.slice(5)+'</div></div><div class="timeline-amount '+amtClass+'" style="color:'+color+'">'+prefix+fmt(en.amount)+'</div></div>';
  }
  timeline.innerHTML=tlHTML||'<div class="timeline-empty">尚無本月動態</div>';
  } catch(e) {
    console.error('[renderOverview] fatal error:', e);
  } finally {
    _renderingOverview = false;
  }
}

// ===== Chart.js 趨勢圖 =====