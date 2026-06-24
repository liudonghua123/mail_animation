# SMTP 动画多页面 Light 重构 — 设计文档

## 概述

将现有单页暗色霓虹应用重构为多页面 Light 风格应用：引入 Vue Router 拆分首页/动画/名词/关于四页，按真实 SMTP 协议重写场景数据以确保动画准确性，整体采用柔和渐变现代 Light 风格 + 响应式设计。

## 页面结构与路由

引入 Vue Router，四页面 + 顶部常驻导航栏：

- **`/` 首页 (HomeView)** — 项目介绍、SMTP 流程总览、三个场景入口卡片（点击跳转 `/animate/:scenarioId`）
- **`/animate/:scenarioId` 动画页 (AnimateView)** — 选中场景的 SMTP 动画（舞台 + 控制台 + 时间线 + 会话终端）
- **`/glossary` 名词解释 (GlossaryView)** — 完整术语表，可搜索筛选
- **`/about` 关于 (AboutView)** — SMTP 协议背景、本动画准确性说明

导航栏顶部常驻，移动端折叠为汉堡菜单。响应式断点：≥1024px 桌面、≥768px 平板、<768px 手机。

## SMTP 准确性重构（核心内容变更）

### 数据模型变更

`Step` 重构为"一次请求/响应交换"模型，贴近真实 SMTP：

```ts
export interface Step {
  from: string              // 起点节点 id
  to: string                // 终点节点 id
  command: string           // 客户端发送的命令（如 MAIL FROM:<alice@a.com>）
  response?: string         // 服务端响应（如 250 OK）；transfer 类型无此字段
  direction: 'client->server' | 'server->client' | 'transfer'
  description: string
  duration: number
  mailContent?: string      // DATA 步骤的邮件正文片段
  session?: string          // 会话标识，如 "MUA↔MSA"，用于终端分组
}
```

每个 step 代表一次请求/响应交换（command + response），而非单行。SmtpTrace 终端将每步展开为两行（command 行、response 行），保持日志保真度；动画步数适中。

### 三场景的真实 SMTP 步骤

**场景 1 本地投递**（alice@local → bob@local，同服务器）：
- 会话 1 `MUA↔MSA`：EHLO/250、MAIL FROM/250、RCPT TO/250、DATA/354、(正文+`.`)/250、QUIT/221（6 步）
- 会话 2 `MSA↔MTA`：EHLO/250、MAIL FROM/250、RCPT TO/250、DATA/354、(正文+`.`)/250、QUIT/221（6 步）—— **修复：原 MSA→MTA 是"转交"，现改为独立 SMTP 会话**
- `MTA→MDA`：本地投递（transfer，MTA 识别本地用户后交给 MDA）（1 步）
- `MDA→邮箱`：写入邮箱存储（transfer）（1 步）；收件人 MUA 节点保留作为终点视觉，但不动画化 POP3/IMAP 拉取（关于页说明）

**场景 2 跨服务器**（alice@a.com → bob@b.com）：
- 会话 1 `MUA↔MSA`：6 步 SMTP
- 会话 2 `MSA↔MTA(a.com)`：6 步 SMTP
- `MTA(a)→DNS`：QUERY MX for b.com / ANSWER mx.b.com（2 步，DNS 非 SMTP 但属路由解析）
- 会话 3 `MTA(a)↔MTA(b)`：EHLO/250、MAIL FROM/250、RCPT TO/250、DATA/354、(正文+`.`)/250、QUIT/221（6 步）—— **修复：原 RCPT TO 方向与 250 响应方向有误**
- `MTA(b)→MDA`：本地投递（1 步）
- `MDA→邮箱`：写入邮箱（1 步）

**场景 3 中继转发**（alice@a.com → bob@b.com，经 relay）：
- 会话 1 `MTA(a)↔MTA(relay)`：6 步 SMTP（含 RELAY 接受）
- 会话 2 `MTA(relay)↔MTA(b)`：6 步 SMTP
- `MTA(b)→MDA→邮箱`：2 步

**响应方向修复**：所有 `250 OK` / `354` / `221` 响应的 `direction` 必须为 `server->client`，且 `from`/`to` 与同会话请求相反。原数据中部分响应方向错误，本次全部修正。

## 视觉设计（柔和渐变现代 Light 风格）

- **背景**：浅灰白 `#fafbfc` → 淡蓝 `#eef2ff` 顶部径向渐变；移除暗色粒子 canvas，改为极淡几何点缀或纯净背景
- **卡片**：纯白 `#ffffff` + 1px `#e5e7eb` 边框 + 柔和阴影 `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`，圆角 12px
- **主色**：靛蓝 `#4f46e5`（按钮、激活态、链接）；辅色青 `#06b6d4`、紫 `#8b5cf6` 用于节点角色区分
- **节点角色配色（light 版）**：MUA 靛蓝 `#4f46e5`、MSA 紫 `#8b5cf6`、MTA 蓝 `#3b82f6`、MDA 青 `#06b6d4`、DNS 琥珀 `#f59e0b`。节点为白底圆 + 彩色描边 + 角色图标，激活时填充淡色
- **连线**：浅灰 `#cbd5e1` 虚线，激活时彩色实线 + 流动动画
- **信封**：靛蓝胶囊 + 拖尾，spring 移动（保留 @vueuse/motion）
- **命令气泡**：浅色卡片 + 等宽字体，`>` 客户端用靛蓝、`<` 服务端用青色
- **终端 SmtpTrace**：浅灰底 `#f9fafb` + 等宽字体，深色文字，会话分隔线标注 `--- Session: MUA↔MSA ---`
- **导航栏**：白底 + 底部细边框 + 模糊背景，活跃路由高亮
- **整体**：移除 3D 透视倾斜（light 风格偏平面整洁），保留响应式

## 组件结构变更

```
src/
  router/
    index.ts                 # 新：路由配置
  views/                     # 新（页面级组件）
    HomeView.vue             # 首页：介绍 + 场景入口卡片
    AnimateView.vue          # 动画页：场景动画
    GlossaryView.vue         # 名词解释页：可搜索术语表
    AboutView.vue            # 关于页：协议背景 + 准确性说明
  components/
    AppNav.vue               # 新：顶部导航栏（响应式汉堡菜单）
    MailStage.vue            # 改造：light 配色
    MailNode.vue             # 改造：light 节点
    SmtpTrace.vue            # 改造：light 终端 + 会话分组
    StepTimeline.vue         # 改造：light 时间线
    Controls.vue             # 改造：light 控制台
    ScenarioCard.vue         # 新：首页场景入口卡片
    ScenarioView.vue         # 保留：动画页内编排
    Glossary.vue             # 改造：light 术语卡片（GlossaryView 复用）
  composables/
    useAnimation.ts          # 扩展：支持 response 字段、session 分组（内核不变）
    usePerspective.ts         # 删除（不再用 3D 透视）
  data/
    scenarios.ts             # 重写：真实 SMTP 步骤
    glossary.ts              # 微调：补充 protocol 相关术语
  App.vue                    # 改造：router-view + AppNav
  main.ts                    # 改造：注册 router
  main.css                   # 改造：light 主题 tokens
```

**删除的文件**：`ParticleBackground.vue`（light 风格不需要）、`ScenarioTabs.vue`（场景选择移到首页卡片 + 动画页下拉切换）、`usePerspective.ts`（不再用 3D 透视）。

`useAnimation` 内核逻辑不变（step 调度、play/pause/reset/goto/pastCommands 保留），`pastCommands` 已返回完整 step 列表，SmtpTrace 据此渲染 command/response 两行 + session 分隔。

## 测试与验证

- 现有 7 个 useAnimation 测试保持通过（逻辑不变）
- 新增数据校验测试：每个 step 若 `direction !== 'transfer'` 则必须有 `response`；响应方向必须为 `server->client` 且 `from`/`to` 与同会话请求相反
- `npx vue-tsc --noEmit` 通过、`npm run build` 通过
- 四个页面路由可访问、响应式三档断点人工核验
- 动画准确性人工核验：对照真实 SMTP 会话，每个命令/响应方向正确

## 非目标 (YAGNI)

- 不引入状态管理库（Pinia 等），路由参数 + props 足够
- 不做国际化（i18n）
- 不做邮件加密 (TLS/SSL) 流程演示
- 不做用户自定义邮件内容
- 不动画化 POP3/IMAP 拉取（关于页说明）
- 不保留暗色模式切换（专注 light 单一风格）
- 不保留粒子背景与 3D 透视（与 light 平面风格冲突）
