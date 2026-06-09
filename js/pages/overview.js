// overview.js — 总览页面渲染（基于正式版 v10.21 移植）
// v11.2.19 修复：使用正式版逻辑，按 workingMonth 过滤

var _renderingOverview = false;

function renderOverview() {
  if (_renderingOverview) return;
  _renderingOverview = true;
  try {
    // --- KPI 卡片 ---
    var now = window.workingMonth || window.nowStr().slice(0,7);
    var totalVol=0, totalBonus=0, totalDrawn=0, totalFund=0, totalCash=0, undrawnCount=0;
    var agentSet = {};
    for (var i=0;i<window.txs.length;i++){
      var t=window.txs[i];
      if (!t.date||t.date.slice(0,7)!==now) continue;
      if (t.type==="cash"){ totalCash+=(t.cash||0); }
      else { totalVol+=(t.volume||0); }
      totalBonus+=(t.bonus||0);
      totalDrawn+=(t.drawn||0);
      totalFund+=(t.fund||0);
      if (t.agent){ agentSet[t.agent]=true; }
      if ((t.bonus||0)>(t.drawn||0)&&t.type==="rolling") undrawnCount++;
    }
    // 公基金异动
    var fDep=0,fCD=0,fWit=0;
    for (var j=0;j<window.fundWithdrawals.length;j++){
      var f=window.fundWithdrawals[j];
      if (!f.date||f.date.slice(0,7)!==now) continue;
      if (f.type==="deposit") fDep+=f.amount; else if (f.type==="cash_deposit") fCD+=f.amount; else fWit+=f.amount;
    }
    var fundNet = totalFund+fDep+fCD-fWit;
    // 公基金累计余额（所有时间）
    var totalFundAll=0, fDepAll=0, fCDAll=0, fWitAll=0;
    for (var ii=0;ii<window.txs.length;ii++) totalFundAll+=(window.txs[ii].fund||0);
    for (var jj=0;jj<window.fundWithdrawals.length;jj++){
      var ff=window.fundWithdrawals[jj];
      if (ff.type==="deposit") fDepAll+=ff.amount;
      else if (ff.type==="cash_deposit") fCDAll+=ff.amount;
      else fWitAll+=ff.amount;
    }
    var fundBalance = Math.max(0, totalFundAll+fDepAll+fCDAll-fWitAll);
    var undrawnTotal = Math.max(0,totalBonus-totalDrawn);

    var grid=document.getElementById("ov-kpi-grid");
    // 计算已使用转码数
    var rmUsedRolling=0;
    var roomMonth=now.slice(0,7);
    var agentsWithRolling = {};
    for (var kk=0;kk<window.txs.length;kk++){ var tr=window.txs[kk]; if (tr.date&&tr.date.slice(0,7)===roomMonth&&tr.type!=="cash"&&tr.agent){ agentsWithRolling[tr.agent]=true; } }
    if (typeof RM!=="undefined"&&RM.bookings){
      for (var k=0;k<RM.bookings.length;k++){
        var b=RM.bookings[k];
        if (!b.date||b.date.slice(0,7)!==roomMonth) continue;
        if (b.status==="免费") rmUsedRolling += (b.nights||0) * (b.threshold||70);
      }
    }
    var rmFreeCount = typeof RM!=="undefined" ? RM.bookings.filter(function(x){return x.date&&x.date.slice(0,7)===roomMonth&&x.status==="免费"&&agentsWithRolling[x.agent];}).length : 0;
    grid.innerHTML=''+
      '<div class="kpi-card-new gold"><div class="kpi-label">本月洗码量</div><div class="kpi-value">'+fmt(totalVol)+'<span style="font-size:12px;color:var(--text-muted);margin-left:2px;">万</span></div><div class="kpi-delta">'+Object.keys(agentSet).length+' 位代理</div></div>'+
      '<div class="kpi-card-new green"><div class="kpi-label">剩余转码</div><div class="kpi-value">'+fmt(totalVol-rmUsedRolling)+'<span style="font-size:12px;color:var(--text-muted);margin-left:2px;">万</span></div></div>'+
      '<div class="kpi-card-new red"><div class="kpi-label">未提领</div><div class="kpi-value">'+fmt(undrawnTotal)+'</div><div class="kpi-delta down">'+undrawnCount+' 笔待提</div></div>'+
      '<div class="kpi-card-new blue"><div class="kpi-label">公基金</div><div class="kpi-value">'+fmt(fundBalance)+'</div><div class="kpi-delta">本月入帐 '+fmt(totalFund)+'</div></div>'+
      '<div class="kpi-card-new orange"><div class="kpi-label">现金寄放</div><div class="kpi-value">'+fmt(totalCash)+'</div><div class="kpi-delta">'+Object.keys(agentSet).length+' 位代理</div></div>';

    // --- 每日洗码量 Sparkline ---
    var spark=document.getElementById("ov-sparkline");
    var slbl=document.getElementById("ov-sparklabels");
    var daysInMonth=new Date(parseInt(now.slice(0,4)),parseInt(now.slice(5,7)),0).getDate();
    var daily=[], daily100=[];
    for (var d=1;d<=daysInMonth;d++) daily.push(0);
    for (var i=0;i<window.txs.length;i++){
      var t=window.txs[i];
      if (!t.date||t.date.slice(0,7)!==now||t.type==="cash") continue;
      var day=parseInt(t.date.slice(8,10))-1;
      if (day>=0&&day<daysInMonth) daily[day]+=(t.volume||0);
    }
    for (var d=0;d<daysInMonth;d++) daily100.push(daily[d]/100);
    var maxV=Math.max.apply(null,daily)||1;
    var maxH=60;
    var sparkHTML='',lblHTML='';
    for (var d=0;d<daysInMonth;d++){
      var v=daily[d];
      var h=v>0?Math.max(2,Math.round(v/maxV*maxH)):2;
      sparkHTML+='<div class="spark-bar'+(v===0?' empty':'')+'" style="height:'+h+'px" title="'+(d+1)+'日: '+fmt(daily100[d])+' (100万)"><span>'+fmt(daily100[d])+'</span></div>';
      lblHTML+='<span>'+(d%3===0||d===0||d===daysInMonth-1?(d+1)+'日':'')+'</span>';
    }
    spark.innerHTML=sparkHTML;
    slbl.innerHTML=lblHTML;

    // --- Chart.js 趋势图 ---
    if (typeof renderTrendChart === 'function') renderTrendChart(daily100, now);

    // --- 代理洗码排行 Top 10 ---
    var agtVol={};
    for (var i=0;i<window.txs.length;i++){
      var t=window.txs[i];
      if (!t.date||t.date.slice(0,7)!==now||t.type==="cash"||!t.agent) continue;
      if (!agtVol[t.agent]) agtVol[t.agent]=0;
      agtVol[t.agent]+=(t.volume||0);
    }
    var agtArr=[];
    for (var a in agtVol) agtArr.push({name:a,vol:agtVol[a]});
    agtArr.sort(function(a,b){return b.vol-a.vol;});
    agtArr=agtArr.slice(0,10);
    if (typeof renderRankChart === 'function') renderRankChart(agtArr);

    // --- 场地洗码分布 ---
    var venueColors = ['#d4af37','#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22','#1abc9c','#f39c12'];
    var venVol={};
    for (var i=0;i<window.txs.length;i++){
      var t=window.txs[i];
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
      venHTML+='<div class="venue-row"><div class="venue-name" title="'+vn.name+'">'+shortName+'</div><div class="venue-bar-wrap"><div class="venue-bar-track"><div class="venue-bar-fill" style="width:'+vpct+'%;background:linear-gradient(90deg,'+vcol+',rgba(255,255,255,0.1));"></div></div><div class="venue-val">'+fmt(vn.vol)+'万</div></div></div>';
    }
    if (!venArr.length) venHTML='<div class="venue-empty">本月尚无数据</div>';
    document.getElementById("ov-venue-dist").innerHTML=venHTML;

    // --- 近期动态 Timeline ---
    var timeline=document.getElementById("ov-timeline");
    var entries=[];
    for (var i=0;i<window.txs.length;i++){
      var t=window.txs[i];
      if (!t.date||t.date.slice(0,7)!==now) continue;
      entries.push({date:t.date,type:t.type||"rolling",desc:(t.type==="cash"?t.agent+" 现金寄放":t.agent+" — "+t.client+(t.venue?" @ "+t.venue:"")),amount:t.type==="cash"?(t.cash||0):(t.bonus||0),extra:t.type==="cash"?"dep":"pos"});
    }
    for (var j=0;j<window.fundWithdrawals.length;j++){
      var f=window.fundWithdrawals[j];
      if (!f.date||f.date.slice(0,7)!==now) continue;
      var ftype=f.type==="withdraw"?"提领":(f.type==="cash_deposit"?"自存现金":"存入");
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
    timeline.innerHTML=tlHTML||'<div class="timeline-empty">尚无本月动态</div>';
  } catch(e) {
    console.error('[renderOverview] fatal error:', e);
  } finally {
    _renderingOverview = false;
  }
}
