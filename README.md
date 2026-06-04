# 🐱 meow-catch · 喵喵接接乐 (Vue 3)

一个无厘头的接物小游戏，主角是一只小猫，开始界面可**切换三个主题**：

- **🍗 打工人接鸡腿**：接鸡腿、躲需求/BUG、喝红牛无敌。
- **🧋 接奶茶躲减肥餐**：接奶茶、躲沙拉/西兰花、穿跑鞋无敌。
- **☕ 程序员接咖啡躲会议**：接咖啡、躲会议/提醒、戴耳机无敌。

### 特性

- **🐱 小猫助攻**：接到 🐱 召唤一只小猫，磁吸好东西并放大接取范围，持续几秒（全主题通用）。
- **🔥 连击系统**：连续接好东西累积连击，分数翻倍（最高 x4）；踩雷或漏接断连击。
- **📈 难度可选**：休闲 / 普通 / 地狱三档，分别影响生成速度、下落速度和初始生命。
- **🐈 猫咪图鉴**：7 款猫咪皮肤，按「历史最高分」逐个解锁，选中的皮肤即主角形象。
- **👔 Boss 乱入**：每个主题有专属 Boss（老板 / 减肥教练 / 产品经理），定时横穿屏幕并疯狂砸落扣血物，附预警横幅。
- **🎬 打击感**：受击 / Boss 来袭触发震屏 + 红屏反馈。
- **🏆 最高分存档**：每个主题各自记录最高分，破纪录时弹「🎉 新纪录！」（localStorage 持久化）。
- **🔊 音效**：WebAudio 现场合成，零音频文件；右下角可静音，状态记忆。
- **记忆**：自动记住上次选择的主题、难度与皮肤。

## 技术栈

- Vue 3（`<script setup>` 组合式 API）
- Vite 6
- Canvas 2D 渲染 + requestAnimationFrame 游戏循环

## 快速开始

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:5180
npm run build    # 打包到 dist/
npm run preview  # 预览打包结果
```

## 目录结构

```
src/
├─ main.js                  # 应用入口
├─ App.vue                  # 根组件，组合各 UI 层 + 游戏状态 + 静音按钮
├─ config/
│  └─ gameConfig.js         # SHARED 玩法参数 + THEMES 多主题内容 + COMBO 连击规则
├─ composables/
│  ├─ useGame.js            # 核心游戏逻辑（状态/循环/渲染/碰撞/主题/连击/存档），与 UI 解耦
│  └─ useSound.js           # WebAudio 音效合成 + 静音记忆
├─ components/
│  ├─ GameCanvas.vue        # 画布 + 鼠标/触摸输入转发
│  ├─ HudBar.vue            # 分数 / 生命 / 等级 / 最高分 / 连击
│  ├─ DanmuLayer.vue        # 吐槽弹幕层
│  ├─ StartScreen.vue       # 开始界面 + 主题切换 + 本主题最高分
│  └─ GameOverScreen.vue    # 结算界面 + 破纪录庆祝
├─ utils/
│  └─ storage.js            # localStorage 容错封装
└─ styles/
   ├─ global.css            # 全局变量与基础样式
   └─ overlay.css           # 开始/结算共用的遮罩样式
```

## 道具行为类型（逻辑只认 type）

| type | 行为 |
| --- | --- |
| `good` | 命中加分 |
| `bad` | 命中扣 1 血 |
| `invincible` | 命中进入无敌（鸡腿主题=🐂红牛，奶茶主题=🏃跑鞋） |
| `cat` | 命中召唤 🐱 小猫助攻：磁吸好东西 + 放大接取范围 |

## 玩法

- 开始界面点按钮切换主题。
- 电脑：`←` `→` 移动；空格 开始 / 重来。
- 手机：手指拖动。

## 如何扩展（维护友好）

- **加新主题**：在 `gameConfig.js` 的 `THEMES` 里复制一份对象、改 emoji 与文案即可，逻辑零改动（第三个「程序员接咖啡」主题就是这么加的）。
- **加新道具**：在某主题的 `items` 加一项；若是全新行为，新增一个 `type` 并在 `useGame.js` 的 `handleCatch` 补一个分支。
- **加难度档位**：往 `DIFFICULTIES` 加一项（`spawnMul` / `speedMul` / `lives`）。
- **加猫咪皮肤**：往 `CAT_SKINS` 加一项（`emoji` / `name` / `unlock` 解锁分数）。
- **调 Boss**：改 `BOSS`（出现时间、间隔、横穿速度、砸落频率）；每主题的 Boss 形象在 `theme.boss`。
- **调手感 / 道具时长 / 连击**：改 `PLAYER` / `POWER` / `COMBO`。
- **加 / 改音效**：改 `useSound.js` 里的 `sounds` 表（纯 WebAudio 合成）。
