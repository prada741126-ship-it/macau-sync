# 澳门洗码报表 — 项目源码交付文档

## 传给其他 AI 的说明

这是一个「澳门博彩洗码报表」后台仪表板系统（单页应用 SPA）。
请阅读本文件 + `index.html`（v11.1.1 单文件源码）+ `index_v10.26_GOLDEN.html`（稳定参考）后开始工作。

---

## 项目基本信息

| 项目 | 说明 |
|------|------|
| 名称 | 澳门洗码报表 / 博盈国际会 |
| 当前版本 | v11.1.1 |
| 线上地址 | https://macau-sync-production-4a7b.up.railway.app |
| 登入密码 | `macau888`（Base64: `bWFjYXU4ODg=`） |
| 工作目录 | `C:\Users\monkey888\WorkBuddy\Claw\render-deploy\` |
| 部署平台 | Railway（git push 自动部署） |
| 服务器 | Express (Node.js) — `server.js` |
| Figma | **无**，所有设计直接在 CSS 中实现 |

---

## 文件结构（v11.1.1 模块化架构）

```
render-deploy/
├── server.js                     # Express 服务器（优先加载 dist/index.html）
├── build.js                      # 零依赖构建脚本（合并 CSS/JS 到 index.html）
├── template.html                 # HTML 骨架（含占位符 {{CSS}} {{JS}}）
├── version.json                  # 版本号 v11.1.1
├── index.html                    # 根目录索引（dist/index.html 的副本）
│
├── dist/
│   └── index.html              # ★ 构建输出 — 单文件自包含，直接可部署
│
├── css/                          # 5 个 CSS 模块
│   ├── base.css                # 设计令牌 (:root 变量) + 全局重置 + 动画关键帧
│   ├── components.css          # 按钮 / 卡片 / 表格 / 表单 / Toast / Modal / 房务样式
│   ├── layout.css              # sidebar / topbar / main-content / page-scroll
│   ├── china-theme.css         # 中国风主题（极隐逸克制，<1% 透明度纹理）
│   └── mobile.css              # 移动端响应式 (≤700px)
│
├── js/                           # 23 个 JS 模块
│   ├── config.js               # PRODUCTION 配置 + UI_COLORS 颜色常量
│   ├── storage.js              # localStorage keys 常量
│   ├── utils.js                # 工具函数 (getDow, fmt, animateKPI 等)
│   ├── crypto.js               # simpleCrypt() AES 加解密
│   ├── auth.js                 # 密码验证 / 会話超时 / 远程访问检测
│   ├── auth-navigation.js      # 登入成功后初始化导航
│   ├── navigation.js           # showPage() / 快捷鍵 / 侧边栏
│   ├── sync.js                 # Firebase 实时同步
│   ├── mobile.js               # 移动端底部导航 / 手势
│   ├── hotel-config-logic.js   # 酒店设定逻辑 (增删改查)
│   ├── hotel-config-presets.js # 酒店预设数据
│   ├── ui/
│   │   └── toast.js            # showToast() 通知
│   ├── data/
│   │   ├── transactions.js     # 交易 CRUD / CSV 导入导出
│   │   ├── fund.js             # 公基金管理
│   │   ├── agent-wallets.js    # 代理钱包管理
│   │   ├── agent-list.js       # 代理名单管理
│   │   └── backup.js           # 自动备份 / 月度存档
│   └── pages/
│       ├── overview.js         # 总览页 (KPI 卡片 / 近期动态)
│       ├── overview-charts.js  # 总览趋势图 (Chart.js)
│       ├── rank-chart.js       # 排行榜图 (Chart.js)
│       ├── query.js            # 查询页 (doQuery / 代理对帐单 / 图表)
│       ├── room.js             # 房务系统 (订房 CRUD / KPI 仪表板)
│       └── room-misc.js        # 房务杂项
│
├── index_v10.26_GOLDEN.html    # ★ GOLDEN 稳定参考（v10.26 正常工作版本）
├── index_v6.3_GOLDEN.html      # 历史基准
├── index_v6.3_enhanced_GOLDEN.html
└── index_v6.3_fix3_GOLDEN.html
```

---

## 构建与部署

### 构建
```bash
cd render-deploy
node build.js
# 输出: dist/index.html (自包含单文件)
```

### 本地运行
```bash
node server.js
# 监听 http://0.0.0.0:3000
```

### 部署到 Railway
```bash
git add . && git commit -m "..." && git push origin master
# Railway 自动检测并部署
```

---

## v11.1 设计系统（70% 现代科技 + 30% 隐逸中国风）

### 色彩（CSS :root 变量，定义在 base.css）

```
深色体系:
  --bg-base:       #0a0a0f  (石墨黑 · 主背景)
  --bg-surface:    #0d1117  (午夜蓝黑 · 表面)
  --bg-elevated:   #161b22  (深石板 · 卡片)

文字:
  --text-primary:  #e6edf3  (主文字)
  --text-secondary:#8b949e  (次要文字)
  --text-muted:    #6e7681  (弱化文字)

科技点缀:
  --tech-cyan:     #00d4ff  (科技青 · hover/active)
  --sky-blue:      #0095ff  (天蓝 · 图表)
  --electric-violet: #7c3aed (电紫 · accent)

中式点缀 (5-10%):
  --gold-subtle:   #8B6914  (黛金)
  --gold-soft:     #c9a84c  (柔金)
  --vermilion:     #c0392b  (朱砂红)

功能色:
  --danger:        #f85149  (危险/提领)
  --warning:       #f0a500  (警告/现金)
  --success:       #2dd4a0  (成功)
  --info:          #58a6ff  (信息/存入)
```

### JS 颜色常量（config.js — UI_COLORS 对象）
供 JS 动态生成 HTML 时引用，与 CSS 变量保持一致。

---

## 五个页面

| 页面 | ID | 快捷键 | 功能 |
|------|-----|--------|------|
| 总览 | #page-overview | Ctrl+1 | KPI 卡片 / 趋势图 / 排名图 / 近期动态 |
| 全部交易 | #page-all | Ctrl+2 | 交易 CRUD / CSV 导入导出 |
| 查询 | #page-query | Ctrl+3 | 代理+月份筛选 / 图表 / 代理钱包 / 公基金 |
| 统计 | #page-summary | Ctrl+4 | 代理×地点矩阵汇总 |
| 房务 | #page-room | Ctrl+5 | 订房管理 / KPI 仪表板 |

---

## 核心计算公式

```
佣金(comm)  = 洗码量(volume) × 10000 × 码佣率(rate)% → Math.ceil()
码粮(bonus) = 佣金 - 公基金(fund)
未提领      = max(0, 码粮 - 已提领)
```

---

## 已知问题（给下一个 AI）

### v11.1.1 已修复
- ✅ `#rm-modal-bg { display: none }` — v11.0 模块化拆分时遗漏，导致登入后房务模态框遮挡全页面

### 可能残留问题
1. 部分 JS 文件仍有硬编码颜色（query.js 等），虽已做批量替换但未 100% 覆盖
2. `index.html` 根目录副本可能需要同步更新

### 稳定回退
- `index_v10.26_GOLDEN.html` — 最后稳定版本（v10.26），所有功能正常
- 如果 v11.x 出问题，直接用这个文件部署即可恢复

---

## localStorage 数据结构

| Key | 内容 | 加密 |
|-----|------|------|
| macau_data | 交易数组 | AES |
| macau_fund_data | 公基金纪录 | AES |
| macau_agent_wallets | 代理钱包 | AES |
| macau_agent_list | 代理名单 | 无 |
| macau_config | workingMonth | 无 |
| macau_archives | 月度存档 | 无 |
| rm_bookings | 订房资料 | 无 |
| macau_auth | 认证旗标 | 无 |

---

## 地点选项（7 个）

1. 新濠(励盈1) / 2. 新濠(励盈2) / 3. 银何(金门1) / 4. 银何(金门8) / 5. 金沙(御匾会) / 6. 永利(永利会) / 7. 上葡京

---

*文档生成时间: 2026-06-08 20:50 GMT+8*
