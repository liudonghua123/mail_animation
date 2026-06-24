# SMTP 邮件服务器通讯动画页面 — 设计文档

## 概述

一个教学性单页 Web 应用，以节点流图 + 信封动画的形式演示邮件在 MUA / MSA / MTA / MDA 之间的传递过程，并附带 SMTP 命令对话和名词解释。支持多场景切换（本地投递 / 跨服务器 / 中继转发）与自动播放控制。

## 技术栈

- Vue 3 + Vite + TypeScript
- 纯组件 + SVG 动画，无重型动画库
- 包管理：pnpm（或 npm）

## 整体架构

应用由三个主要区域组成：

1. **舞台区 (Stage)** — SVG 渲染的节点流图。节点为 MUA / MSA / MTA / MDA 等角色，信封图标沿连线移动，节点上方/下方浮现当前 SMTP 命令对话气泡。
2. **控制面板 (Controls)** — 播放 / 暂停 / 重播 / 速度调节 / 进度条 / 步骤跳转。
3. **侧栏 (Sidebar)** — 场景切换 + 名词解释卡片。点击节点时高亮对应名词解释；名词解释常驻显示，可折叠。

## 场景定义

每个场景是一组**步骤序列 (step list)**，每步定义：

- `from` / `to`：起点节点、终点节点 id
- `command`：SMTP 命令文本（如 `MAIL FROM:<alice@a.com>`）或方向标记
- `direction`：`client→server` / `server→client` / `transfer`
- `description`：步骤说明文字
- `duration`：毫秒

### 场景 1：本地投递
发件人 MUA → MSA → MTA → MDA → 收件人 MUA（同一服务器内）。

### 场景 2：跨服务器传递
发件人 MUA → MSA → 发件方 MTA → DNS MX 查询 → 收件方 MTA → MDA → 收件人 MUA。

### 场景 3：中继转发
发件方 MTA → 中继 MTA → 收件方 MTA（多跳中继）。

## 组件划分

```
src/
  App.vue                  # 布局：Stage + Controls + Sidebar
  components/
    MailStage.vue          # SVG 舞台：节点 + 连线 + 信封 + 命令气泡
    MailNode.vue           # 单个节点（图标 + 标签 + 高亮态）
    Controls.vue           # 播放控制
    ScenarioTabs.vue       # 场景切换
    Glossary.vue           # 名词解释列表
  composables/
    useAnimation.ts        # 动画引擎：步骤调度、进度、播放控制
  data/
    scenarios.ts           # 三种场景的步骤序列定义
    glossary.ts            # 名词解释数据
  types.ts                 # Step / Node / Scenario / GlossaryItem 类型
```

### 职责边界

- `MailStage`：纯渲染，接收 `currentStep` + `progress`，输出当前帧。
- `useAnimation`：状态机 + 定时器，持有 `currentStepIndex` / `isPlaying` / `progress`，按 step.duration 推进，emit 事件。
- `scenarios.ts`：纯数据，新增场景无需改动组件。
- `Glossary`：独立数据源，与节点通过 `id` 关联。

## 关键交互与数据流

- `useAnimation(scenario)` 持有 `currentStepIndex`、`isPlaying`、`progress`，用 `requestAnimationFrame` 推进，到 duration 后切下一步并 emit。
- `MailStage` 接收 `currentStep`，按 step 内时间 0→1 在 path 上插值信封位置，渲染节点高亮和命令气泡。
- 点击节点 → 高亮 `Glossary` 对应条目（通过 `selectedNode` ref 联动并滚动到视图）。
- 切换场景 → 重置到第 0 步并暂停，等待用户播放。

## 名词解释（Glossary）

每条术语包含：名称、英文全称、一句话定义、在本动画中的职责。覆盖：

- **MUA** — Mail User Agent，用户代理（邮件客户端）
- **MSA** — Mail Submission Agent，提交代理
- **MTA** — Mail Transfer Agent，传输代理
- **MDA** — Mail Delivery Agent，投递代理
- **SMTP** — Simple Mail Transfer Protocol
- **MX 记录** — Mail Exchange DNS 记录
- **Envelope** — 信封（RCPT/MAIL FROM 携带的路由信息）
- **Header / Body** — 邮件头与正文
- **Relay** — 中继转发
- **Queue** — 邮件队列

## 视觉与风格

- 浅色背景；节点用圆角矩形 + 图标（信封 / 服务器 / 人）。
- 连线为带箭头虚线；信封移动时留下淡色尾迹。
- SMTP 命令气泡用等宽字体，`>` 前缀表示客户端发送，`<` 前缀表示服务端响应。
- 响应式：宽屏三栏；窄屏堆叠。

## 错误处理与边界

- 动画在最后一步后自动暂停（不循环），显示 "完成" 状态。
- 切换场景时取消进行中的 `requestAnimationFrame`。
- 步骤 duration 为 0 时立即跳过（防御性）。

## 测试

- 单元测试 `useAnimation` 的步骤调度逻辑（vitest）。
- 数据校验：`scenarios.ts` 中每个 step 的 `from`/`to` 必须存在于节点列表。
- 手动验证三种场景的动画时序与命令文本。

## 非目标 (YAGNI)

- 不实现真实 SMTP 通信。
- 不支持用户自定义邮件内容或收件人。
- 不做邮件加密 (TLS/SSL) 流程演示。
- 不做移动端原生适配（仅响应式 Web）。
