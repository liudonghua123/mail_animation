# SMTP 动画多页面 Light 重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有单页暗色霓虹应用重构为多页面 Light 风格应用：引入 Vue Router 拆分四页，按真实 SMTP 协议重写场景数据，整体柔和渐变 Light 风格 + 响应式。

**Architecture:** 引入 Vue Router 管理 `/`、`/animate/:scenarioId`、`/glossary`、`/about` 四路由；新增 `views/` 目录承载页面级组件，`components/` 保留可复用组件并改造为 light 配色；`scenarios.ts` 重写为真实 SMTP 请求/响应交换模型；`useAnimation` 内核不变，扩展支持 `response` 字段；移除 ParticleBackground / ScenarioTabs / usePerspective（与 light 平面风格冲突）。

**Tech Stack:** Vue 3 + Vue Router 4 + Vite + TypeScript + Vitest + Tailwind v4 + @vueuse/motion

---

## File Structure

```
mail_animation/
├── package.json                       # 改：加 vue-router
├── src/
│   ├── main.ts                        # 改：注册 router
│   ├── main.css                       # 改：light 主题 tokens
│   ├── App.vue                        # 改：AppNav + router-view
│   ├── types.ts                       # 改：Step 加 response?/session?
│   ├── router/
│   │   └── index.ts                   # 新
│   ├── views/                         # 新
│   │   ├── HomeView.vue
│   │   ├── AnimateView.vue
│   │   ├── GlossaryView.vue
│   │   └── AboutView.vue
│   ├── components/
│   │   ├── AppNav.vue                 # 新
│   │   ├── ScenarioCard.vue           # 新
│   │   ├── ScenarioView.vue           # 改造
│   │   ├── MailStage.vue              # 改造 light
│   │   ├── MailNode.vue               # 改造 light
│   │   ├── SmtpTrace.vue              # 改造 light + session 分组
│   │   ├── StepTimeline.vue           # 改造 light
│   │   ├── Controls.vue               # 改造 light
│   │   └── Glossary.vue               # 改造 light + 搜索
│   ├── composables/
│   │   └── useAnimation.ts            # 内核不变（已支持 response，pastCommands 仍可用）
│   └── data/
│       ├── scenarios.ts               # 重写：真实 SMTP
│       └── glossary.ts                # 微调
└── test/
    ├── useAnimation.test.ts           # 已有 7 测试保持通过
    └── scenarios.test.ts              # 新：数据校验测试
```

**删除的文件**：`src/components/ParticleBackground.vue`、`src/components/ScenarioTabs.vue`、`src/composables/usePerspective.ts`。

---

### Task 1: 安装 Vue Router 与 light 主题 CSS

**Files:**
- Modify: `package.json`
- Modify: `src/main.css`
- Modify: `src/main.ts`

- [ ] **Step 1: 安装 vue-router**

Run: `npm install vue-router@4`

- [ ] **Step 2: 完整替换 src/main.css**

```css
@import "tailwindcss";

@theme {
  --color-brand-indigo: #4f46e5;
  --color-brand-purple: #8b5cf6;
  --color-brand-blue: #3b82f6;
  --color-brand-cyan: #06b6d4;
  --color-brand-amber: #f59e0b;
  --color-ink-900: #0f172a;
  --color-ink-700: #334155;
  --color-ink-500: #64748b;
  --color-ink-300: #cbd5e1;
  --color-ink-100: #f1f5f9;
  --color-canvas: #fafbfc;
  --color-canvas-grad: #eef2ff;
}

@keyframes flow {
  to { stroke-dashoffset: -20; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

html, body, #app {
  height: 100%;
  margin: 0;
}

body {
  background: radial-gradient(ellipse at top, var(--color-canvas-grad) 0%, var(--color-canvas) 55%);
  color: var(--color-ink-900);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
}

.terminal-font {
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
}

a { color: inherit; text-decoration: none; }
```

- [ ] **Step 3: 完整替换 src/main.ts**

```ts
import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import router from './router'
import './main.css'

createApp(App).use(MotionPlugin).use(router).mount('#app')
```

注意：`./router` 尚未创建，下一步会创建。此步 `npm run build` 会因缺 router 模块失败，属预期，Task 2 创建后即恢复。

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.css src/main.ts
git commit -m "chore: add vue-router + light theme tokens"
```

---

### Task 2: 类型与路由配置

**Files:**
- Modify: `src/types.ts`
- Create: `src/router/index.ts`

- [ ] **Step 1: 修改 src/types.ts，给 Step 加 response 和 session 字段**

在 `Step` interface 中，`duration: number` 之后、`mailContent?: string` 之前，插入两行。完整修改后 `Step` 应为：

```ts
export interface Step {
  from: string
  to: string
  command: string
  response?: string
  direction: StepDirection
  description: string
  duration: number
  mailContent?: string
  session?: string
}
```

- [ ] **Step 2: 创建 src/router/index.ts**

```ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AnimateView from '../views/AnimateView.vue'
import GlossaryView from '../views/GlossaryView.vue'
import AboutView from '../views/AboutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/animate/:scenarioId', name: 'animate', component: AnimateView, props: true },
    { path: '/glossary', name: 'glossary', component: GlossaryView },
    { path: '/about', name: 'about', component: AboutView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
```

注意：引用的四个 view 尚未创建，后续 Task 创建。此步 `npx vue-tsc --noEmit` 会因缺 view 模块报错，属预期。

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/router/index.ts
git commit -m "feat: add Step.response/session + router config"
```

---

### Task 3: 重写场景数据为真实 SMTP（含 TDD 数据校验）

**Files:**
- Modify: `src/data/scenarios.ts`
- Create: `test/scenarios.test.ts`

- [ ] **Step 1: 先写数据校验测试 test/scenarios.test.ts**

```ts
import { describe, it, expect } from 'vitest'
import { scenarios } from '../src/data/scenarios'

describe('scenarios data integrity', () => {
  for (const sc of scenarios) {
    describe(`scenario ${sc.id}`, () => {
      it('every step references existing node ids', () => {
        const ids = new Set(sc.nodes.map((n) => n.id))
        for (const step of sc.steps) {
          expect(ids.has(step.from), `from=${step.from} not in nodes`).toBe(true)
          expect(ids.has(step.to), `to=${step.to} not in nodes`).toBe(true)
        }
      })

      it('non-transfer steps have a response', () => {
        for (const step of sc.steps) {
          if (step.direction !== 'transfer') {
            expect(step.response, `step "${step.command}" missing response`).toBeTruthy()
          }
        }
      })

      it('response direction is server->client with swapped from/to', () => {
        const reqBySession: Record<string, { from: string; to: string }> = {}
        for (const step of sc.steps) {
          if (step.direction === 'client->server') {
            reqBySession[step.session ?? ''] = { from: step.from, to: step.to }
          }
          if (step.direction === 'server->client') {
            const req = reqBySession[step.session ?? '']
            expect(req, `response step "${step.command}" has no preceding request in session`).toBeDefined()
            if (req) {
              expect(step.from, `response from should be request's to`).toBe(req.to)
              expect(step.to, `response to should be request's from`).toBe(req.from)
            }
          }
        }
      })

      it('transfer steps have no response', () => {
        for (const step of sc.steps) {
          if (step.direction === 'transfer') {
            expect(step.response, `transfer step "${step.command}" should not have response`).toBeUndefined()
          }
        }
      })
    })
  }
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/scenarios.test.ts`
Expected: FAIL — 当前 scenarios.ts 是旧数据（response 字段不存在、方向有误）。

- [ ] **Step 3: 完整重写 src/data/scenarios.ts**

```ts
import type { Scenario } from '../types'

const localDelivery: Scenario = {
  id: 'local',
  name: '本地投递',
  description: '同一服务器内：MUA → MSA → MTA → MDA → 邮箱',
  nodes: [
    { id: 'mua-sender', role: 'MUA', label: '发件人 MUA', x: 80, y: 130 },
    { id: 'msa', role: 'MSA', label: 'MSA', x: 280, y: 130 },
    { id: 'mta-sender', role: 'MTA', label: 'MTA', x: 480, y: 130 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 680, y: 130 },
    { id: 'mailbox', role: 'MUA', label: '收件人邮箱', x: 880, y: 130 },
  ],
  steps: [
    // Session 1: MUA ↔ MSA
    { from: 'mua-sender', to: 'msa', command: 'EHLO client.local', response: '250-mail.local', direction: 'client->server', description: 'MUA 向 MSA 发起 SMTP 会话', duration: 1000, session: 'MUA↔MSA' },
    { from: 'msa', to: 'mua-sender', command: 'MAIL FROM:<alice@local>', response: '250 OK', direction: 'server->client', description: '声明发件人（响应）', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'RCPT TO:<bob@local>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'DATA', response: '354 End data with <CRLF>.<CRLF>', direction: 'client->server', description: '请求传输正文', duration: 800, session: 'MUA↔MSA', mailContent: 'Subject: Hello Bob\nFrom: alice@local\nTo: bob@local\n\nHi Bob, this is a test mail.' },
    { from: 'mua-sender', to: 'msa', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MUA↔MSA' },
    // Session 2: MSA ↔ MTA (独立 SMTP 会话)
    { from: 'msa', to: 'mta-sender', command: 'EHLO msa.local', response: '250-mail.local', direction: 'client->server', description: 'MSA 向 MTA 发起 SMTP 会话', duration: 1000, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'MAIL FROM:<alice@local>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'RCPT TO:<bob@local>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'DATA', response: '354 End data with <CRLF>.<CRLF>', direction: 'client->server', description: '请求传输正文', duration: 800, session: 'MSA↔MTA' },
    { from: 'msa', to: 'mta-sender', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MSA↔MTA' },
    // MTA → MDA (本地投递)
    { from: 'mta-sender', to: 'mda', command: '本地投递', direction: 'transfer', description: 'MTA 识别为本地用户，交给 MDA', duration: 1000 },
    // MDA → 邮箱
    { from: 'mda', to: 'mailbox', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入收件人邮箱存储', duration: 1000 },
  ],
}

const crossServer: Scenario = {
  id: 'cross',
  name: '跨服务器传递',
  description: 'MUA → MSA → MTA(a) → DNS MX → MTA(b) → MDA → 邮箱',
  nodes: [
    { id: 'mua-sender', role: 'MUA', label: '发件人 MUA', x: 60, y: 180 },
    { id: 'msa', role: 'MSA', label: 'MSA', x: 220, y: 180 },
    { id: 'mta-sender', role: 'MTA', label: '发件方 MTA', x: 400, y: 180 },
    { id: 'dns', role: 'DNS', label: 'DNS (MX)', x: 560, y: 60 },
    { id: 'mta-receiver', role: 'MTA', label: '收件方 MTA', x: 720, y: 180 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 880, y: 180 },
    { id: 'mailbox', role: 'MUA', label: '收件人邮箱', x: 1040, y: 180 },
  ],
  steps: [
    // Session 1: MUA ↔ MSA
    { from: 'mua-sender', to: 'msa', command: 'EHLO client.a.com', response: '250-msa.a.com', direction: 'client->server', description: 'MUA 提交邮件到 MSA', duration: 1000, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MUA↔MSA' },
    { from: 'mua-sender', to: 'msa', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MUA↔MSA', mailContent: 'Subject: Hello from a.com\nFrom: alice@a.com\nTo: bob@b.com\n\nCross-server delivery test.' },
    { from: 'mua-sender', to: 'msa', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MUA↔MSA' },
    // Session 2: MSA ↔ MTA(a)
    { from: 'msa', to: 'mta-sender', command: 'EHLO msa.a.com', response: '250-mta.a.com', direction: 'client->server', description: 'MSA 向发件方 MTA 发起会话', duration: 1000, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MSA↔MTA(a)' },
    { from: 'msa', to: 'mta-sender', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MSA↔MTA(a)' },
    // DNS MX 查询
    { from: 'mta-sender', to: 'dns', command: 'QUERY MX for b.com', response: 'ANSWER: mx.b.com', direction: 'client->server', description: '查询收件域名 MX 记录', duration: 1000, session: 'MTA(a)↔DNS' },
    // Session 3: MTA(a) ↔ MTA(b)
    { from: 'mta-sender', to: 'mta-receiver', command: 'EHLO mta.a.com', response: '250-mta.b.com', direction: 'client->server', description: '发件方 MTA 连接收件方 MTA', duration: 1000, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: 'SMTP 信封发件人', duration: 700, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: 'SMTP 信封收件人', duration: 700, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MTA(a)↔MTA(b)' },
    { from: 'mta-sender', to: 'mta-receiver', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MTA(a)↔MTA(b)' },
    // MTA(b) → MDA
    { from: 'mta-receiver', to: 'mda', command: '本地投递', direction: 'transfer', description: '收件方 MTA 交给 MDA', duration: 1000 },
    // MDA → 邮箱
    { from: 'mda', to: 'mailbox', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入收件人邮箱', duration: 1000 },
  ],
}

const relay: Scenario = {
  id: 'relay',
  name: '中继转发',
  description: 'MTA(a) → 中继 MTA → MTA(b) → MDA → 邮箱',
  nodes: [
    { id: 'mta-sender', role: 'MTA', label: '发件方 MTA', x: 80, y: 160 },
    { id: 'mta-relay', role: 'MTA', label: '中继 MTA', x: 380, y: 160 },
    { id: 'mta-receiver', role: 'MTA', label: '收件方 MTA', x: 680, y: 160 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 880, y: 160 },
    { id: 'mailbox', role: 'MUA', label: '收件人邮箱', x: 1080, y: 160 },
  ],
  steps: [
    // Session 1: MTA(a) ↔ MTA(relay)
    { from: 'mta-sender', to: 'mta-relay', command: 'EHLO mta.a.com', response: '250-relay.net', direction: 'client->server', description: '发件方 MTA 连接中继', duration: 1000, session: 'MTA(a)↔MTA(relay)' },
    { from: 'mta-sender', to: 'mta-relay', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MTA(a)↔MTA(relay)' },
    { from: 'mta-sender', to: 'mta-relay', command: 'RCPT TO:<bob@b.com>', response: '250 OK (relayed)', direction: 'client->server', description: '中继接受转发', duration: 700, session: 'MTA(a)↔MTA(relay)' },
    { from: 'mta-sender', to: 'mta-relay', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MTA(a)↔MTA(relay)', mailContent: 'Subject: Relayed mail\nFrom: alice@a.com\nTo: bob@b.com\n\nThis mail was relayed.' },
    { from: 'mta-sender', to: 'mta-relay', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MTA(a)↔MTA(relay)' },
    // Session 2: MTA(relay) ↔ MTA(b)
    { from: 'mta-relay', to: 'mta-receiver', command: 'EHLO relay.net', response: '250-mta.b.com', direction: 'client->server', description: '中继连接收件方 MTA', duration: 1000, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'MAIL FROM:<alice@a.com>', response: '250 OK', direction: 'client->server', description: '声明发件人', duration: 700, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'RCPT TO:<bob@b.com>', response: '250 OK', direction: 'client->server', description: '声明收件人', duration: 700, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'DATA', response: '354 End data', direction: 'client->server', description: '传输正文', duration: 800, session: 'MTA(relay)↔MTA(b)' },
    { from: 'mta-relay', to: 'mta-receiver', command: 'QUIT', response: '221 Bye', direction: 'client->server', description: '结束会话', duration: 700, session: 'MTA(relay)↔MTA(b)' },
    // MTA(b) → MDA → 邮箱
    { from: 'mta-receiver', to: 'mda', command: '本地投递', direction: 'transfer', description: '收件方 MTA 交给 MDA', duration: 1000 },
    { from: 'mda', to: 'mailbox', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入邮箱', duration: 1000 },
  ],
}

export const scenarios: Scenario[] = [localDelivery, crossServer, relay]
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/scenarios.test.ts`
Expected: PASS — 所有场景数据校验通过。

- [ ] **Step 5: 运行全部测试确认未破坏 useAnimation**

Run: `npx vitest run`
Expected: useAnimation 7 + scenarios 16（每场景 4 用例 × 4 = 16）全部 PASS。

- [ ] **Step 6: Commit**

```bash
git add src/data/scenarios.ts test/scenarios.test.ts
git commit -m "feat: rewrite scenarios with real SMTP sessions"
```

---

### Task 4: glossary 微调

**Files:**
- Modify: `src/data/glossary.ts`

- [ ] **Step 1: 给 glossary 中的 MUA 条目补充 POP3/IMAP 说明，并修正 nodeId 联动**

在 `glossary.ts` 中，找到 `term: 'MUA'` 的条目，将其 `definition` 字段替换为：

```ts
    definition: '用户代理，即邮件客户端（如 Outlook、Thunderbird）。发送时通过 SMTP 提交邮件；接收时通过 POP3/IMAP 从邮箱拉取邮件。',
```

并新增一条 POP3/IMAP 条目，插入到 `term: 'SMTP'` 条目之前：

```ts
  {
    term: 'POP3 / IMAP',
    full: 'Post Office Protocol v3 / Internet Message Access Protocol',
    definition: '邮件拉取协议，MUA 通过它们从 MDA/邮箱存储读取邮件（本动画不演示拉取过程，仅在关于页说明）。',
    roleInAnimation: '动画中作为收件侧的概念性说明。',
  },
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误（router/views 仍未创建，可能报缺模块——忽略 router 相关，仅确认 glossary.ts 本身无类型错误）

注意：此步 `vue-tsc` 可能因 Task 2 的 router 引用了不存在的 views 而报错。这是预期的，Task 5+ 创建 views 后即恢复。仅检查 glossary.ts 本身无语法错误即可（可用 `npx tsc --noEmit src/data/glossary.ts` 单文件检查，若 tsconfig 限制则跳过）。

- [ ] **Step 3: Commit**

```bash
git add src/data/glossary.ts
git commit -m "docs: refine glossary with POP3/IMAP note"
```

---

### Task 5: 删除过时文件 + useAnimation 确认

**Files:**
- Delete: `src/components/ParticleBackground.vue`
- Delete: `src/components/ScenarioTabs.vue`
- Delete: `src/composables/usePerspective.ts`

- [ ] **Step 1: 删除三个文件**

Run:
```bash
rm src/components/ParticleBackground.vue
rm src/components/ScenarioTabs.vue
rm src/composables/usePerspective.ts
```

- [ ] **Step 2: 确认 useAnimation 测试仍通过**

Run: `npx vitest run test/useAnimation.test.ts`
Expected: 7/7 PASS（useAnimation 未被本次改动触及）

注意：`npx vue-tsc --noEmit` 此刻会因 MailStage.vue 仍 import 已删除的 usePerspective 而报错——属预期，Task 7 改造 MailStage 后即恢复。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove ParticleBackground, ScenarioTabs, usePerspective"
```

---

### Task 6: AppNav 导航栏

**Files:**
- Create: `src/components/AppNav.vue`

- [ ] **Step 1: 创建 src/components/AppNav.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileOpen = ref(false)

const links = [
  { to: '/', label: '首页' },
  { to: '/glossary', label: '名词解释' },
  { to: '/about', label: '关于' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
    <div class="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
      <router-link to="/" class="flex items-center gap-2 font-semibold text-indigo-600">
        <span class="text-lg">✉</span>
        <span>SMTP 动画</span>
      </router-link>

      <!-- desktop -->
      <div class="hidden md:flex items-center gap-1">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="px-3 py-1.5 rounded-md text-sm transition-colors"
          :class="isActive(l.to) ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-100'"
        >{{ l.label }}</router-link>
      </div>

      <!-- mobile toggle -->
      <button class="md:hidden p-2 text-slate-600" @click="mobileOpen = !mobileOpen">
        <span class="text-xl">{{ mobileOpen ? '✕' : '☰' }}</span>
      </button>
    </div>

    <!-- mobile menu -->
    <div v-if="mobileOpen" class="md:hidden border-t border-slate-200 bg-white">
      <router-link
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="block px-4 py-2.5 text-sm border-b border-slate-100"
        :class="isActive(l.to) ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-slate-600'"
        @click="mobileOpen = false"
      >{{ l.label }}</router-link>
    </div>
  </nav>
</template>
```

- [ ] **Step 2: 类型检查（此步可能因 views 未建报错，忽略 router/views 相关）**

Run: `npx vue-tsc --noEmit 2>&1 | grep -v "views/" | grep -v "router/" || echo "only views/router errors remain (expected)"`

- [ ] **Step 3: Commit**

```bash
git add src/components/AppNav.vue
git commit -m "feat: add AppNav responsive navigation"
```

---

### Task 7: MailNode light 改造

**Files:**
- Modify: `src/components/MailNode.vue`

- [ ] **Step 1: 完整替换 src/components/MailNode.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { MailNode, NodeRole } from '../types'

const props = defineProps<{
  node: MailNode
  active: boolean
  selected: boolean
}>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const hovered = ref(false)

const roleColor: Record<NodeRole, string> = {
  MUA: '#4f46e5',
  MSA: '#8b5cf6',
  MTA: '#3b82f6',
  MDA: '#06b6d4',
  DNS: '#f59e0b',
}

const roleFull: Record<NodeRole, string> = {
  MUA: 'Mail User Agent',
  MSA: 'Mail Submission Agent',
  MTA: 'Mail Transfer Agent',
  MDA: 'Mail Delivery Agent',
  DNS: 'Domain Name System',
}

const roleIcon: Record<NodeRole, string> = {
  MUA: '👤',
  MSA: '📤',
  MTA: '🖥',
  MDA: '📥',
  DNS: '🌐',
}

const color = () => roleColor[props.node.role]
</script>

<template>
  <g
    :transform="`translate(${node.x}, ${node.y})`"
    class="cursor-pointer"
    @click="emit('select', node.id)"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- 激活光晕（淡色） -->
    <circle v-if="active" r="32" :fill="color()" opacity="0.12" />
    <!-- 主圆 -->
    <circle
      r="26"
      fill="#ffffff"
      :stroke="color()"
      :stroke-width="selected ? 3 : active ? 2.5 : 1.5"
    />
    <text x="0" y="5" text-anchor="middle" font-size="18">{{ roleIcon[node.role] }}</text>
    <text x="0" y="50" text-anchor="middle" font-size="11" fill="#475569">{{ node.label }}</text>

    <!-- hover tooltip -->
    <g v-if="hovered" :transform="`translate(0, -50)`">
      <rect x="-80" y="-24" width="160" height="30" rx="4" fill="#0f172a" opacity="0.92" />
      <text x="0" y="-10" text-anchor="middle" font-size="9" :fill="color()" font-weight="600">{{ roleFull[node.role] }}</text>
      <text x="0" y="0" text-anchor="middle" font-size="8" fill="#cbd5e1">{{ node.label }}</text>
    </g>
  </g>
</template>
```

- [ ] **Step 2: 类型检查（忽略 views/router 相关错误）**

Run: `npx vue-tsc --noEmit 2>&1 | grep -E "(MailNode|usePerspective)" || echo "no MailNode/usePerspective errors"`

Expected: 无 MailNode 错误；usePerspective 错误在 Task 8 MailStage 改造后消失。

- [ ] **Step 3: Commit**

```bash
git add src/components/MailNode.vue
git commit -m "feat: redesign MailNode with light theme"
```

---

### Task 8: MailStage light 改造（移除 3D 透视）

**Files:**
- Modify: `src/components/MailStage.vue`

- [ ] **Step 1: 完整替换 src/components/MailStage.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Scenario, Step } from '../types'
import MailNode from './MailNode.vue'

const props = defineProps<{
  scenario: Scenario
  currentStep: Step
  progress: number
  selectedNodeId: string | null
}>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const nodeById = computed(() => {
  const m: Record<string, Scenario['nodes'][number]> = {}
  for (const n of props.scenario.nodes) m[n.id] = n
  return m
})

const activeIds = computed(() => new Set([props.currentStep.from, props.currentStep.to]))

const envelopePos = computed(() => {
  const from = nodeById.value[props.currentStep.from]
  const to = nodeById.value[props.currentStep.to]
  if (!from || !to) return { x: 0, y: 0 }
  return {
    x: from.x + (to.x - from.x) * props.progress,
    y: from.y + (to.y - from.y) * props.progress,
  }
})

const commandPrefix = computed(() =>
  props.currentStep.direction === 'server->client' ? '<' : '>',
)

const links = computed(() => {
  const ns = props.scenario.nodes
  const out: { id: string; x1: number; y1: number; x2: number; y2: number; active: boolean }[] = []
  for (let i = 1; i < ns.length; i++) {
    const a = ns[i - 1]
    const b = ns[i]
    out.push({
      id: `line-${b.id}`,
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      active: (props.currentStep.from === a.id && props.currentStep.to === b.id) ||
              (props.currentStep.from === b.id && props.currentStep.to === a.id),
    })
  }
  return out
})
</script>

<template>
  <svg viewBox="0 0 1200 260" class="w-full h-[260px]">
    <defs>
      <linearGradient id="link-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#4f46e5" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
    </defs>

    <!-- 连线 -->
    <line
      v-for="l in links"
      :key="l.id"
      :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
      stroke="url(#link-grad)"
      :stroke-width="l.active ? 2.5 : 1.2"
      :stroke-dasharray="l.active ? '6 6' : '3 5'"
      :opacity="l.active ? 1 : 0.5"
      :style="l.active ? 'animation: flow 1s linear infinite;' : ''"
    />

    <!-- 节点 -->
    <MailNode
      v-for="n in scenario.nodes"
      :key="n.id"
      :node="n"
      :active="activeIds.has(n.id)"
      :selected="selectedNodeId === n.id"
      @select="emit('select', $event)"
    />

    <!-- 命令气泡 -->
    <g :transform="`translate(${envelopePos.x}, ${envelopePos.y - 50})`">
      <rect x="-110" y="-18" width="220" height="36" rx="6" fill="#0f172a" opacity="0.92" />
      <text x="0" y="5" text-anchor="middle" class="terminal-font" font-size="11" :fill="currentStep.direction === 'server->client' ? '#06b6d4' : '#818cf8'">
        {{ commandPrefix }} {{ currentStep.command }}
      </text>
    </g>

    <!-- 信封 -->
    <g :transform="`translate(${envelopePos.x}, ${envelopePos.y})`">
      <circle r="14" fill="#4f46e5" opacity="0.15" />
      <rect x="-11" y="-8" width="22" height="16" rx="2" fill="#4f46e5" stroke="#3730a3" stroke-width="1" />
      <path d="M-11,-8 L0,1 L11,-8" fill="none" stroke="#3730a3" stroke-width="1" />
    </g>
  </svg>
</template>
```

- [ ] **Step 2: 类型检查（忽略 views 相关错误）**

Run: `npx vue-tsc --noEmit 2>&1 | grep -v "views/" | grep -v "router/" | grep -v "App.vue" || echo "only views/router/App errors remain (expected)"`

Expected: 无 MailStage/usePerspective 错误。

- [ ] **Step 3: Commit**

```bash
git add src/components/MailStage.vue
git commit -m "feat: redesign MailStage light, remove 3D perspective"
```

---

### Task 9: SmtpTrace light + session 分组

**Files:**
- Modify: `src/components/SmtpTrace.vue`

- [ ] **Step 1: 完整替换 src/components/SmtpTrace.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Step } from '../types'

const props = defineProps<{
  pastCommands: Step[]
  currentIndex: number
}>()

interface Line {
  idx: number
  prefix: string
  color: string
  text: string
  isLast: boolean
  mailContent?: string
  sessionHeader?: string
}

const lines = computed<Line[]>(() => {
  const out: Line[] = []
  let lastSession: string | undefined
  let lineIdx = 0
  for (let i = 0; i < props.pastCommands.length; i++) {
    const s = props.pastCommands[i]
    if (s.session && s.session !== lastSession) {
      out.push({
        idx: lineIdx++,
        prefix: '',
        color: 'text-slate-400',
        text: `--- Session: ${s.session} ---`,
        isLast: false,
        sessionHeader: s.session,
      })
      lastSession = s.session
    }
    const isLast = i === props.currentIndex
    out.push({
      idx: lineIdx++,
      prefix: s.direction === 'server->client' ? '<' : '>',
      color: s.direction === 'server->client' ? 'text-cyan-600' : 'text-indigo-600',
      text: s.command,
      isLast,
      mailContent: s.mailContent,
    })
    if (s.response) {
      out.push({
        idx: lineIdx++,
        prefix: '<',
        color: 'text-cyan-600',
        text: s.response,
        isLast,
      })
    }
  }
  return out
})
</script>

<template>
  <div class="card p-3 h-[200px] overflow-y-auto terminal-font text-xs bg-slate-50">
    <div class="text-slate-400 mb-2 text-[10px] uppercase tracking-wider">SMTP Session Trace</div>
    <div v-if="lines.length === 0" class="text-slate-400 italic">等待会话开始...</div>
    <div
      v-for="l in lines"
      :key="l.idx"
      v-motion
      :initial="{ opacity: 0, y: 6 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 250 } }"
      class="mb-0.5"
      :class="l.sessionHeader ? 'mt-2 text-slate-400 font-semibold' : ''"
    >
      <span v-if="!l.sessionHeader" class="text-slate-400 mr-1">{{ l.prefix }}</span>
      <span :class="l.color" :class="l.sessionHeader ? '' : 'font-semibold'">{{ l.text }}</span>
      <pre v-if="l.mailContent && l.isLast" class="mt-1 ml-4 text-slate-500 whitespace-pre-wrap text-[10px]">{{ l.mailContent }}</pre>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 类型检查（忽略 views 相关错误）**

Run: `npx vue-tsc --noEmit 2>&1 | grep "SmtpTrace" || echo "no SmtpTrace errors"`

Expected: 无 SmtpTrace 错误。

- [ ] **Step 3: Commit**

```bash
git add src/components/SmtpTrace.vue
git commit -m "feat: SmtpTrace light + session grouping + response lines"
```

---

### Task 10: StepTimeline light 改造

**Files:**
- Modify: `src/components/StepTimeline.vue`

- [ ] **Step 1: 完整替换 src/components/StepTimeline.vue**

```vue
<script setup lang="ts">
defineProps<{
  total: number
  current: number
}>()
const emit = defineEmits<{ (e: 'goto', index: number): void }>()
</script>

<template>
  <div class="card p-3">
    <div class="flex items-center gap-1 overflow-x-auto">
      <template v-for="i in total" :key="i">
        <button
          class="shrink-0 w-6 h-6 rounded-full border transition-all cursor-pointer"
          :class="[
            i - 1 < current ? 'bg-indigo-500 border-indigo-400' :
            i - 1 === current ? 'bg-purple-500 border-purple-400 scale-125' :
            'bg-white border-slate-300 hover:border-indigo-400'
          ]"
          @click="emit('goto', i - 1)"
        />
        <span v-if="i < total" class="text-slate-300 text-xs">—</span>
      </template>
    </div>
    <div class="text-slate-500 text-[10px] mt-2 text-center">步骤 {{ current + 1 }} / {{ total }}</div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StepTimeline.vue
git commit -m "feat: StepTimeline light theme"
```

---

### Task 11: Controls light 改造

**Files:**
- Modify: `src/components/Controls.vue`

- [ ] **Step 1: 完整替换 src/components/Controls.vue**

```vue
<script setup lang="ts">
defineProps<{
  isPlaying: boolean
  currentStepIndex: number
  totalSteps: number
  progress: number
  speed: number
}>()
const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'reset'): void
  (e: 'goto', index: number): void
  (e: 'set-speed', s: number): void
}>()

const speeds = [0.5, 1, 1.5, 2]
</script>

<template>
  <div class="card p-3 space-y-2">
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-if="!isPlaying"
        @click="emit('play')"
        class="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm"
      >▶ 播放</button>
      <button
        v-else
        @click="emit('pause')"
        class="px-3 py-1.5 rounded-md bg-indigo-100 border border-indigo-300 text-indigo-700 transition-colors text-sm"
      >⏸ 暂停</button>
      <button
        @click="emit('reset')"
        class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
      >⏮ 重置</button>
      <div class="flex items-center gap-1 ml-auto">
        <span class="text-slate-500 text-xs">速度</span>
        <button
          v-for="s in speeds"
          :key="s"
          @click="emit('set-speed', s)"
          class="px-2 py-1 rounded text-xs border transition-colors"
          :class="speed === s
            ? 'bg-purple-100 border-purple-300 text-purple-700'
            : 'border-slate-200 text-slate-500 hover:border-slate-300'"
        >{{ s }}x</button>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <input
        type="range"
        :min="0"
        :max="totalSteps - 1"
        :value="currentStepIndex"
        @input="emit('goto', Number(($event.target as HTMLInputElement).value))"
        class="flex-1 accent-indigo-500"
      />
      <span class="text-slate-500 text-xs w-16 text-right terminal-font">{{ currentStepIndex + 1 }} / {{ totalSteps }}</span>
    </div>
    <div class="h-1.5 bg-slate-100 rounded overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-100"
        :style="{ width: `${(currentStepIndex + progress) / totalSteps * 100}%` }"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Controls.vue
git commit -m "feat: Controls light theme"
```

---

### Task 12: Glossary light + 搜索

**Files:**
- Modify: `src/components/Glossary.vue`

- [ ] **Step 1: 完整替换 src/components/Glossary.vue**

```vue
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { GlossaryItem } from '../types'

const props = defineProps<{
  items: GlossaryItem[]
  selectedNodeId: string | null
}>()

const query = ref('')
const containerRef = ref<HTMLElement | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter(
    (it) =>
      it.term.toLowerCase().includes(q) ||
      it.full.toLowerCase().includes(q) ||
      it.definition.toLowerCase().includes(q),
  )
})

watch(
  () => props.selectedNodeId,
  async (id) => {
    if (!id) return
    await nextTick()
    const el = containerRef.value?.querySelector(`[data-node-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  },
)
</script>

<template>
  <div class="space-y-2">
    <input
      v-model="query"
      placeholder="搜索术语..."
      class="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
    <div ref="containerRef" class="space-y-2 max-h-[600px] overflow-y-auto pr-1">
      <div
        v-for="item in filtered"
        :key="item.term"
        :data-node-id="item.nodeId"
        class="p-3 rounded-lg border transition-all bg-white"
        :class="item.nodeId && item.nodeId === selectedNodeId
          ? 'border-indigo-400 ring-2 ring-indigo-100'
          : 'border-slate-200 hover:border-slate-300'"
      >
        <div class="font-semibold text-sm text-indigo-600">
          {{ item.term }}
          <span class="font-normal text-slate-400 text-[11px]">{{ item.full }}</span>
        </div>
        <div class="text-[12px] text-slate-700 mt-1">{{ item.definition }}</div>
        <div class="text-[11px] text-slate-500 mt-0.5">本动画中：{{ item.roleInAnimation }}</div>
      </div>
      <div v-if="filtered.length === 0" class="text-center text-slate-400 text-sm py-4">
        无匹配术语
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Glossary.vue
git commit -m "feat: Glossary light + search filter"
```

---

### Task 13: ScenarioView 改造（移除 ParticleBackground 引用不存在问题，因已删除）

**Files:**
- Modify: `src/components/ScenarioView.vue`

- [ ] **Step 1: 完整替换 src/components/ScenarioView.vue**

```vue
<script setup lang="ts">
import { useAnimation } from '../composables/useAnimation'
import MailStage from './MailStage.vue'
import Controls from './Controls.vue'
import SmtpTrace from './SmtpTrace.vue'
import StepTimeline from './StepTimeline.vue'
import type { Scenario } from '../types'

const props = defineProps<{
  scenario: Scenario
  selectedNodeId: string | null
}>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const {
  currentStep,
  currentStepIndex,
  isPlaying,
  progress,
  speed,
  totalSteps,
  pastCommands,
  play,
  pause,
  reset,
  goto,
  setSpeed,
} = useAnimation(props.scenario)
</script>

<template>
  <div
    :key="scenario.id"
    v-motion
    :initial="{ opacity: 0, scale: 0.98 }"
    :enter="{ opacity: 1, scale: 1, transition: { duration: 350 } }"
    class="space-y-3"
  >
    <div class="card p-3">
      <MailStage
        :scenario="scenario"
        :current-step="currentStep"
        :progress="progress"
        :selected-node-id="selectedNodeId"
        @select="emit('select', $event)"
      />
    </div>
    <div class="card px-4 py-2.5 text-slate-700 text-sm">
      {{ currentStep?.description ?? '' }}
    </div>
    <SmtpTrace :past-commands="pastCommands" :current-index="currentStepIndex" />
    <StepTimeline :total="totalSteps" :current="currentStepIndex" @goto="goto($event)" />
    <Controls
      :is-playing="isPlaying"
      :current-step-index="currentStepIndex"
      :total-steps="totalSteps"
      :progress="progress"
      :speed="speed"
      @play="play()"
      @pause="pause()"
      @reset="reset()"
      @goto="goto($event)"
      @set-speed="setSpeed($event)"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScenarioView.vue
git commit -m "feat: ScenarioView light orchestration"
```

---

### Task 14: ScenarioCard 首页场景入口

**Files:**
- Create: `src/components/ScenarioCard.vue`

- [ ] **Step 1: 创建 src/components/ScenarioCard.vue**

```vue
<script setup lang="ts">
import type { Scenario } from '../types'

defineProps<{
  scenario: Scenario
}>()
</script>

<template>
  <router-link
    :to="`/animate/${scenario.id}`"
    class="card p-5 block transition-all hover:shadow-md hover:-translate-y-0.5"
  >
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-semibold text-indigo-600">{{ scenario.name }}</h3>
      <span class="text-slate-300">→</span>
    </div>
    <p class="text-sm text-slate-600">{{ scenario.description }}</p>
    <div class="mt-3 flex items-center gap-2 text-xs text-slate-400">
      <span>{{ scenario.steps.length }} 步</span>
      <span>·</span>
      <span>{{ scenario.nodes.length }} 个节点</span>
    </div>
  </router-link>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScenarioCard.vue
git commit -m "feat: add ScenarioCard home entry"
```

---

### Task 15: 四个 View 页面

**Files:**
- Create: `src/views/HomeView.vue`
- Create: `src/views/AnimateView.vue`
- Create: `src/views/GlossaryView.vue`
- Create: `src/views/AboutView.vue`

- [ ] **Step 1: 创建 src/views/HomeView.vue**

```vue
<script setup lang="ts">
import { scenarios } from '../data/scenarios'
import ScenarioCard from '../components/ScenarioCard.vue'

const flow = [
  { role: 'MUA', desc: '用户撰写并发送邮件' },
  { role: 'MSA', desc: '接受提交，初步校验' },
  { role: 'MTA', desc: '查询 MX，SMTP 转发' },
  { role: 'MDA', desc: '写入收件人邮箱' },
]
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 py-8">
    <section class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-900 mb-3">
        SMTP 邮件传递动画
      </h1>
      <p class="text-slate-600 max-w-2xl mx-auto">
        可视化邮件在 MUA、MSA、MTA、MDA 之间通过 SMTP 协议传递的完整过程。
        支持本地投递、跨服务器传递、中继转发三种场景。
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-lg font-semibold text-slate-800 mb-4">邮件流转总览</h2>
      <div class="card p-5">
        <div class="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-1">
          <div
            v-for="(n, i) in flow"
            :key="n.role"
            class="flex items-center gap-2 md:gap-1"
          >
            <div class="flex-1 md:flex-none md:w-32 text-center px-3 py-3 rounded-lg border border-slate-200 bg-slate-50">
              <div class="font-semibold text-indigo-600">{{ n.role }}</div>
              <div class="text-[11px] text-slate-500 mt-0.5">{{ n.desc }}</div>
            </div>
            <span v-if="i < flow.length - 1" class="text-slate-300 text-lg md:px-1">→</span>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-lg font-semibold text-slate-800 mb-4">选择场景开始</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <ScenarioCard
          v-for="s in scenarios"
          :key="s.id"
          :scenario="s"
        />
      </div>
    </section>
  </div>
</template>
```

- [ ] **Step 2: 创建 src/views/AnimateView.vue**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { scenarios } from '../data/scenarios'
import ScenarioView from '../components/ScenarioView.vue'

const props = defineProps<{
  scenarioId: string
}>()

const currentScenario = computed(
  () => scenarios.find((s) => s.id === props.scenarioId) ?? scenarios[0],
)
const selectedNodeId = ref<string | null>(null)
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 py-6">
    <div class="mb-4 flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-bold text-slate-900">{{ currentScenario.name }}</h1>
        <p class="text-sm text-slate-500">{{ currentScenario.description }}</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-500">切换场景</label>
        <select
          :value="scenarioId"
          @change="$router.push(`/animate/${($event.target as HTMLSelectElement).value}`)"
          class="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:border-indigo-400"
        >
          <option v-for="s in scenarios" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>
    <ScenarioView
      :key="currentScenario.id"
      :scenario="currentScenario"
      :selected-node-id="selectedNodeId"
      @select="selectedNodeId = $event"
    />
  </div>
</template>
```

- [ ] **Step 3: 创建 src/views/GlossaryView.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { glossary } from '../data/glossary'
import Glossary from '../components/Glossary.vue'

const selectedNodeId = ref<string | null>(null)
</script>

<template>
  <div class="max-w-[900px] mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold text-slate-900 mb-1">名词解释</h1>
    <p class="text-sm text-slate-500 mb-5">邮件系统中各角色与协议术语的说明</p>
    <Glossary :items="glossary" :selected-node-id="selectedNodeId" />
  </div>
</template>
```

- [ ] **Step 4: 创建 src/views/AboutView.vue**

```vue
<script setup lang="ts">
</script>

<template>
  <div class="max-w-[800px] mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold text-slate-900 mb-4">关于</h1>

    <section class="card p-5 mb-4">
      <h2 class="font-semibold text-slate-800 mb-2">SMTP 协议背景</h2>
      <p class="text-sm text-slate-600 leading-relaxed">
        SMTP（Simple Mail Transfer Protocol）是互联网邮件传输的核心协议，
        定义了 MUA、MSA、MTA 之间用 EHLO、MAIL FROM、RCPT TO、DATA、QUIT 等命令
        以及 250、354、221 等响应码交换邮件的会话流程。一次完整的 SMTP 会话
        包含握手、信封声明、正文传输、关闭四个阶段。
      </p>
    </section>

    <section class="card p-5 mb-4">
      <h2 class="font-semibold text-slate-800 mb-2">本动画的准确性说明</h2>
      <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
        <li>每个 SMTP 会话（MUA↔MSA、MSA↔MTA、MTA↔MTA）均完整展示 EHLO/MAIL FROM/RCPT TO/DATA/QUIT 及对应响应。</li>
        <li>MSA 与 MTA 之间是独立的 SMTP 会话，而非内部"转交"。</li>
        <li>所有响应（250 OK、354、221 等）方向均为 server→client，from/to 与请求相反。</li>
        <li>跨服务器场景中，MTA 先通过 DNS 查询收件域名的 MX 记录，再连接目标 MTA。</li>
      </ul>
    </section>

    <section class="card p-5">
      <h2 class="font-semibold text-slate-800 mb-2">未演示的部分</h2>
      <ul class="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
        <li>收件人 MUA 通过 POP3 / IMAP 从邮箱拉取邮件的过程不在 SMTP 范畴，本动画不演示。</li>
        <li>TLS/SSL 加密（STARTTLS）的握手过程未展示。</li>
        <li>邮件队列（Queue）的重试机制作为概念提及，未动画化。</li>
      </ul>
    </section>
  </div>
</template>
```

- [ ] **Step 5: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误（views 已全部创建，router 可解析）

- [ ] **Step 6: Commit**

```bash
git add src/views/
git commit -m "feat: add Home/Animate/Glossary/About views"
```

---

### Task 16: App.vue 整合

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 完整替换 src/App.vue**

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNav from './components/AppNav.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNav />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <footer class="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
      SMTP 邮件传递动画 · 仅供教学演示
    </footer>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
```

- [ ] **Step 2: 类型检查 + 构建**

Run: `npx vue-tsc --noEmit && npm run build`
Expected: 全部成功

- [ ] **Step 3: 运行全部测试**

Run: `npx vitest run`
Expected: useAnimation 7 + scenarios 校验全部 PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: App with router-view + AppNav + page transitions"
```

---

### Task 17: 最终验证 + README 更新

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 全量测试 + 类型检查 + 构建**

Run: `npx vitest run`
Run: `npx vue-tsc --noEmit`
Run: `npm run build`
Expected: 全部成功

- [ ] **Step 2: dev 服务器人工核验**

Run: `npm run dev`
访问浏览器，核验：
- 首页 `/`：介绍 + 流程总览 + 三场景入口卡片
- 点击场景卡片跳转到 `/animate/:scenarioId`，动画播放，SMTP 会话终端显示完整 command/response + session 分隔
- 导航栏四入口（首页/名词/关于），移动端汉堡菜单
- `/glossary`：术语表可搜索
- `/about`：协议背景 + 准确性说明
- 响应式：宽屏 / 平板 / 手机三档布局正常
- 浏览器前进后退、URL 直接访问可用

- [ ] **Step 3: 更新 README.md**

将 `## 启动` 之后的"## 场景"到文件末尾的内容替换为：

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README for multipage light redesign"
```

---

## Self-Review

**Spec coverage:**
- Vue Router 四页面 → Task 2 (router) + Task 15 (views) + Task 16 (App) ✓
- 真实 SMTP 数据 + response/session + 方向修复 → Task 3 ✓
- TDD 数据校验 → Task 3 测试 ✓
- Light 柔和渐变主题 → Task 1 (CSS) ✓
- 节点角色 light 配色 → Task 7 (MailNode) ✓
- 流动连线 + 激活高亮 → Task 8 (MailStage) ✓
- 信封 spring → Task 8（progress 插值 + 发光，与之前一致）✓
- 命令气泡 light → Task 8 ✓
- SmtpTrace 终端 + session 分组 + response 两行 → Task 9 ✓
- 玻璃态卡片 → Task 10/11/12/13 (card class) ✓
- 移除 3D 透视 → Task 5 (删 usePerspective) + Task 8 (MailStage 不再用) ✓
- 移除粒子背景 → Task 5 (删 ParticleBackground) ✓
- 移除 ScenarioTabs → Task 5 + Task 15 (AnimateView 用 select 下拉) ✓
- 名词解释搜索 → Task 12 (Glossary) ✓
- 响应式导航 + 汉堡菜单 → Task 6 (AppNav) ✓
- 首页场景入口卡片 → Task 14 (ScenarioCard) + Task 15 (HomeView) ✓
- 关于页准确性说明 → Task 15 (AboutView) ✓
- 页面切换过渡 → Task 16 (App transition) ✓
- 测试保持 + 新增 → Task 3 ✓
- README 更新 → Task 17 ✓

**Placeholder scan:** 无 TBD/TODO，所有步骤含完整代码与命令。

**Type consistency:** `Step.response?` / `Step.session?` 在 Task 2 定义，Task 3 数据使用、Task 9 SmtpTrace 使用一致；`pastCommands` 已存在于 useAnimation（前次重构），Task 9/13 使用一致；路由 `/animate/:scenarioId` 在 Task 2 定义，Task 15 AnimateView props `scenarioId` 一致；`ScenarioCard` props `scenario` 与 HomeView 传递一致。

**已知点：**
- Task 1-2 期间 `npm run build` / `vue-tsc` 会因 router/views 未创建而失败，属预期，Task 15 后恢复。各任务的类型检查命令已用 grep 过滤预期错误。
- 信封移动仍用 progress 线性插值（与前次重构一致，原因：useAnimation 用 fake-timers 测试，spring 物理会破坏测试）。
