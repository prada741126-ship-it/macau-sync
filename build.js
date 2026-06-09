#!/usr/bin/env node
/**
 * v11.0 零依賴構建工具
 * 合併 CSS + JS 模組 → dist/index.html
 * 用法: node build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ===== 讀取版本信息 =====
const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
const buildStamp = `v${version.version} (${version.buildDate} #${String(version.buildNumber).padStart(3, '0')})`;

console.log(`[build] 版本: ${version.version}`);
console.log(`[build] 構建: ${buildStamp}`);

// ===== CSS 模組合併順序 =====
const CSS_FILES = [
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/china-theme.css',
  'css/mobile.css',
];

// ===== JS 模組合併順序（非重疊，依原始檔順序）=====
const JS_FILES = [
  'js/config.js',
  'js/storage.js',
  'js/utils.js',
  'js/crypto.js',
  'js/ui/toast.js',
  'js/data/transactions.js',
  'js/auth.js',
  'js/auth-navigation.js',
  'js/navigation.js',
  'js/data/backup.js',
  'js/data/fund.js',
  'js/data/agent-wallets.js',
  'js/sync.js',
  'js/pages/query.js',
  'js/pages/all.js',
  'js/data/agent-list.js',
  'js/pages/overview.js',
  'js/pages/overview-charts.js',
  'js/pages/rank-chart.js',
  'js/pages/room.js',
  'js/pages/room-misc.js',
  'js/hotel-config-presets.js',
  'js/hotel-config-logic.js',
  'js/mobile.js',
];

// ===== 讀取並合併文件 =====
function readAndMerge(fileList, label) {
  let output = '';
  let count = 0;

  for (const file of fileList) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) {
      console.log(`[build] ${label} 跳過（不存在）: ${file}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8').trim();
    output += `\n/* === ${path.basename(file)} === */\n${content}\n`;
    count++;
    console.log(`[build] ${label} 已合併: ${file} (${(content.length / 1024).toFixed(1)} KB)`);
  }

  return { output, count };
}

// ===== 讀取 HTML 模板 =====
const templatePath = path.join(ROOT, 'template.html');
if (!fs.existsSync(templatePath)) {
  console.error('[build] 錯誤: 找不到 template.html');
  process.exit(1);
}
let template = fs.readFileSync(templatePath, 'utf8');

// ===== 合併 CSS =====
const cssResult = readAndMerge(CSS_FILES, 'CSS');
if (cssResult.count > 0) {
  template = template.replace('<!-- CSS_PLACEHOLDER -->', `<style>\n${cssResult.output}\n</style>`);
  console.log(`[build] CSS: ${cssResult.count} 個文件已合併`);
} else {
  template = template.replace('<!-- CSS_PLACEHOLDER -->', '');
  console.log('[build] CSS: 無文件，跳過');
}

// ===== 合併 JS =====
const jsResult = readAndMerge(JS_FILES, 'JS');
if (jsResult.count > 0) {
  template = template.replace('<!-- JS_PLACEHOLDER -->', `<script>\n${jsResult.output}\n</script>`);
  console.log(`[build] JS: ${jsResult.count} 個文件已合併`);
} else {
  template = template.replace('<!-- JS_PLACEHOLDER -->', '');
  console.log('[build] JS: 無文件，跳過');
}

// ===== 注入構建信息 =====
template = template.replace('<!-- BUILD_INFO -->', `<!-- BUILD: ${buildStamp} -->`);
template = template.replace(/v\d+\.\d+(\.\d+)?/g, (match) => {
  // 只替換標題中的版本號
  return `v${version.version}`;
});
// Replace version badge text
template = template.replace(/id="version-badge"[^>]*>v[\d.]+/, `id="version-badge" style="position:fixed;bottom:4px;left:8px;font-size:10px;color:rgba(255,255,255,0.18);z-index:1;pointer-events:none;">v${version.version}`);

// ===== 輸出到 dist/ =====
const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

const outputPath = path.join(distDir, 'index.html');
fs.writeFileSync(outputPath, template, 'utf8');

const outputSize = Buffer.byteLength(template, 'utf8');
console.log(`\n[build] ✅ 構建完成: dist/index.html (${(outputSize / 1024).toFixed(1)} KB)`);
console.log(`[build] 部署就緒: ${distDir}/`);

// ===== 自動執行回歸測試（僅在本地開發環境執行，Railway 生產環境跳過）=====
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  const { execSync } = require('child_process');
  try {
    const testPath = path.join(ROOT, 'test.js');
    if (fs.existsSync(testPath)) {
      console.log('[build] 執行回歸測試...');
      execSync('"' + process.execPath + '" "' + testPath + '"', {
        cwd: ROOT,
        stdio: 'inherit',
        timeout: 30000,
        env: { ...process.env, NODE_PATH: require('path').resolve(require('os').homedir(), '.workbuddy/binaries/node/workspace/node_modules') }
      });
    } else {
      console.log('[build] 跳過測試（無 test.js）');
    }
  } catch(e) {
    if (e.status !== 0) {
      console.error('[build] ❌ 回歸測試失敗，請修復後重新構建');
      process.exit(1);
    }
  }
} else {
  console.log('[build] 跳過回歸測試（生產環境）');
}
