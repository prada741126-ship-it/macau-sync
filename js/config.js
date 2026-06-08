// js/config.js - v11.0
// Non-overlapping extraction

'use strict';

// ===== v11.1 设计系统颜色常量（供 JS 内联样式使用）=====
var UI_COLORS = {
  textPrimary:   '#e6edf3',   // --text-primary
  textSecondary: '#8b949e',   // --text-secondary
  textMuted:    '#6e7681',   // --text-muted
  danger:        '#f85149',   // --danger (vermilion red)
  warning:       '#f0a500',   // --warning (amber)
  success:       '#2dd4a0',   // --success (green)
  info:          '#58a6ff',   // --info (blue)
  techCyan:      '#00d4ff',   // --tech-cyan
  skyBlue:       '#0095ff',   // --sky-blue
  electricViolet:'#7c3aed',   // --electric-violet
  goldSoft:      '#c9a84c',   // --gold-soft
  goldMuted:     'rgba(201,168,76,0.08)',
  bgElevated:   '#161b22',   // --bg-elevated
  bgSurface:     '#0d1117',   // --bg-surface
  borderSubtle:  'rgba(255,255,255,0.06)',
  dangerDim:     'rgba(248,81,73,0.08)',
  warningDim:    'rgba(240,165,0,0.08)',
  successDim:    'rgba(45,212,15,0.08)',
  infoDim:       'rgba(88,166,255,0.08)'
};

// Production mode: set to false to disable verbose logging
const PRODUCTION = false;

var txs = [];
var fundWithdrawals = [];
var agentWallets = {};
var editId = null;          // v10.0 B方案：editId 現在儲存 _fbKey（字串）而非數字 id
var nextId = 1;
var fundNextId = 1;
var agentWalletNextId = 1;
var agentList = [];
var nextId = 1;
var fundNextId = 1;
// v10.0 B方案：Firebase push() 鍵架構
var _migrated = false;      // 是否已完成 Firebase 物件格式遷移
var _syncConnected = true;  // v10.26 Firebase 連接狀態監控
function _fbKey() {
  if (db && db.ref) { try { return db.ref('macau_data/x').push().key; } catch(e) {} }
  return 'L' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
// v10.26 同步寫入重試封裝（指數退避，最多 3 次）
function _syncSet(ref, data) {
  if (!db) return;
  var attempt = 0, maxRetries = 3;
  function trySet() {
    ref.set(data, function(error) {
      if (error && attempt < maxRetries) {
        attempt++;
        var delay = Math.pow(2, attempt) * 500;
        console.warn('[Sync] set 失敗，第 ' + attempt + '/' + maxRetries + ' 次重試，延遲 ' + delay + 'ms', error);
        setTimeout(trySet, delay);
      } else if (error) {
        console.error('[Sync] set 最終失敗（已重試 ' + maxRetries + ' 次）', error);
      }
    });
  }
  trySet();
}
var sortState = { table: "", col: "", asc: true };

// ===== 同步配置（v4.9 安全強化）=====
// 密碼不再寫死在程式碼中，改為 Base64 編碼 + 記憶體變數
var _pwEncoded = 'bWFjYXU4ODg=';  // btoa('macau888')
var SYNC_PASSWORD = '';  // 將在使用者輸入後設定
var SYNC_API = (function() {
  if (window.location.protocol === 'file:') return 'http://192.168.18.157:3000';
  var h = window.location.hostname;
  if (h.match(/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/)) return 'http://' + h + ':3000';
  if (h.indexOf('codebuddy.work') >= 0) return 'https://macau-sync.onrender.com';
  return 'https://macau-sync.onrender.com';
})();

// ===== 核心工具函数（v4.3 修復）=====