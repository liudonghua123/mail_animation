# SMTP 动画页面 UI 重构 — 设计文档

## 概述

对现有 SMTP 邮件传递动画页面进行 UI 重构：引入 Tailwind v4 + @vueuse/motion，升级为暗色霓虹科技风，并增加内容增强（SMTP 会话历史终端、步骤时间线、节点 hover tooltip、3D 透视舞台）。保留现有 useAnimation 引擎逻辑与三种场景结构不变。

## 技术栈与依赖

**新增：**
- `tailwindcss@4` + `@tailwindcss/vite` — v4 零配置 Vite 插件，CSS-first 配置
- `@vueuse/motion` — Vue 动画库，spring 物理、v-motion 指令
- `@vueuse/core` — `useMouse` 等，驱动 3D 透视倾斜

**保留：** Vue 3 + Vite + TypeScript + Vitest；现有 `useAnimation` 引擎、`scenarios.ts`、`glossary.ts` 数据结构不变

**移除：** 所有组件内手写 `<style>` 块由 Tailwind 工具类替代

## 视觉设计语言（暗色霓虹科技风）

### 背景
- 深空黑 `#0a0e1a` → 深紫 `#1a103a` 径向渐变
- 叠加 `<canvas>` 粒子层：缓慢漂浮光点 + 偶发流星，低性能开销（约 60 颗粒子，requestAnimationFrame）

### 节点（角色配色）
| 角色 | 颜色 | Hex |
|---|---|---|
| MUA | 青色 | `#22d3ee` |
| MSA | 紫色 | `#a855f7` |
| MTA | 蓝色 | `#3b82f6` |
| MDA | 绿色 | `#22c55e` |
| DNS | 金色 | `#fbbf24` |

节点为发光圆形 + 图标 + 标签，外圈呼吸光晕（CSS keyframes）。

### 连线
SVG path，渐变描边 + `stroke-dasharray` 流动动画（电流感）。当前步骤激活的连线高亮加粗。

### 信封
发光胶囊形 + 拖尾粒子，由 `@vueuse/motion` spring 物理驱动移动（替代原线性插值）。

### 命令气泡
终端样式深色卡片，等宽字体，`>` / `<` 前缀带霓虹色；`v-motion` 入场（slide + fade + spring）。

### 卡片（控制面板 / Glossary / Trace）
Glassmorphism：半透明 + `backdrop-blur` + 1px 霓虹边框。

### 整体
主舞台带轻微 3D 透视倾斜：鼠标移动驱动 `rotateX` / `rotateY`（`useMouse` + transform），倾斜幅度 ±5°。

## 内容增强

在原三个场景基础上新增：

1. **SmtpTrace 实时会话窗口** — 舞台下方新增终端样式窗口，逐步打印已发生的命令（打字机效果），显示完整 SMTP 对话历史而不只是当前一步
2. **StepTimeline 步骤时间线** — 舞台底部水平时间线，每个步骤一个圆点：已完成填色、当前脉冲、未来空心；点击可跳转
3. **节点 hover tooltip** — 鼠标悬停节点显示该角色英文全称 + 一句话职责（与 Glossary 联动）
4. **场景切换过渡** — 切换场景时舞台 fade + scale 重入场

## 组件结构

```
src/
  components/
    ParticleBackground.vue   # 新增：canvas 粒子背景
    MailStage.vue             # 改造：3D 透视容器 + 发光节点 + 流动连线
    MailNode.vue              # 改造：霓虹圆形节点 + 呼吸光晕 + hover tooltip
    SmtpTrace.vue             # 新增：终端样式 SMTP 会话历史
    StepTimeline.vue          # 新增：步骤时间线
    Controls.vue              # 改造：玻璃态卡片 + 霓虹按钮
    ScenarioTabs.vue          # 改造：玻璃态场景切换
    Glossary.vue              # 改造：玻璃态名词解释 + 高亮联动
    ScenarioView.vue          # 改造：编排上述子组件
  composables/
    useAnimation.ts           # 扩展：新增 pastCommands computed
    usePerspective.ts         # 新增：基于鼠标位置的 3D 透视
  styles/
    main.css                  # 新增：Tailwind v4 入口 + 自定义霓虹工具类
  main.ts                     # 改造：注册 MotionPlugin
```

### useAnimation 扩展（非破坏性）

内核逻辑不动，新增：
- `pastCommands` computed — 返回 `steps.slice(0, currentStepIndex + 1)` 的命令列表，供 SmtpTrace 使用
- 现有 6 个测试保持通过；新增 1 个测试覆盖 `pastCommands`

### usePerspective（新）

基于 `useMouse` 返回归一化坐标 `[-1, 1]`，组件据此计算 `rotateX` / `rotateY`（±5°）并应用 `transform`。

## 数据增强

`src/types.ts` 的 `Step` 接口新增可选字段：
```ts
mailContent?: string  // DATA 步骤时显示的邮件正文片段
```

`scenarios.ts` 为每个场景的 DATA 类步骤补充 `mailContent`（From/To/Subject/Body 片段）。其他字段不变。非破坏性扩展。

## 测试与验证

- 现有 6 个 useAnimation 测试保持通过
- 新增 1 个测试：`pastCommands` 返回正确切片
- `npx vue-tsc --noEmit` 通过
- `npm run build` 通过
- 视觉人工核验：暗色霓虹、粒子背景、3D 倾斜、信封 spring 动画、终端 trace 打字机、时间线交互
- 响应式断点：宽屏三栏 (≥1024px) / 中屏两栏 (≥768px) / 窄屏单栏堆叠 (<768px)

## 非目标 (YAGNI)

- 不改变三种场景的节点拓扑和步骤序列结构
- 不引入真实 SMTP 通信
- 不做用户自定义邮件内容
- 不做邮件加密 (TLS/SSL) 流程
- 不做移动端原生适配（仅响应式 Web）
- 不引入 GSAP / Lottie 等其他动画库
