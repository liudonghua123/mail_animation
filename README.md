# SMTP 邮件传递动画

演示邮件在 MUA / MSA / MTA / MDA 之间通过 SMTP 传递的过程。

## 启动

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。

## 场景

- **本地投递** — 同一服务器内：MUA → MSA → MTA → MDA → 邮箱
- **跨服务器传递** — MUA → MSA → 发件方 MTA → DNS MX 查询 → 收件方 MTA → MDA → 邮箱
- **中继转发** — 发件方 MTA → 中继 MTA → 收件方 MTA（多跳）

## 页面

- `/` 首页 — 介绍 + 流程总览 + 场景入口
- `/animate/:scenarioId` 动画页 — SMTP 动画 + 会话终端 + 时间线
- `/glossary` 名词解释 — 可搜索术语表
- `/about` 关于 — SMTP 协议背景与准确性说明

## 交互

- 播放 / 暂停 / 重置 / 速度调节（0.5x–2x）/ 进度条拖动 / 时间线跳转
- 点击舞台节点 → 高亮名词解释对应条目
- 场景下拉切换 / 场景入口卡片跳转
- 响应式布局：桌面 / 平板 / 手机

## 名词解释

详见 `/glossary` 页面，覆盖 MUA、MSA、MTA、MDA、SMTP、MX 记录、Envelope、Header/Body、Relay、Queue、POP3/IMAP。

## 测试与构建

```bash
npm run test      # vitest 单测（useAnimation 引擎 + 场景数据校验）
npm run build     # vue-tsc 类型检查 + vite 生产构建
```

## 技术栈

Vue 3 + Vue Router 4 + Vite + TypeScript + Vitest + Tailwind v4 + @vueuse/motion

## 视觉特性

- 柔和渐变 Light 现代风
- 真实 SMTP 会话终端（command/response + session 分组）
- 步骤时间线交互
- 节点 hover tooltip + 名词解释联动
- 响应式多页面布局
