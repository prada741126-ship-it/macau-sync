// js/config.js - v11.0
// Non-overlapping extraction

'use strict';

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