# SMTP 邮件服务器通讯动画页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个 Vue 3 + Vite + TypeScript 单页应用，以节点流图 + 信封动画形式演示 SMTP 邮件在 MUA/MSA/MTA/MDA 之间的传递，支持三种场景切换、自动播放控制和名词解释。

**Architecture:** 单页应用由舞台区 (SVG 节点流图) + 控制面板 + 侧栏 (场景切换 + 名词解释) 组成。动画引擎以 `useAnimation` composable 为核心，按步骤序列调度；场景与名词解释为纯数据文件，组件单一职责。

**Tech Stack:** Vue 3 (script setup) + Vite + TypeScript + Vitest + SVG

---

## File Structure

```
mail_animation/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                    # 应用入口
│   ├── App.vue                    # 三栏布局
│   ├── types.ts                   # 类型定义
│   ├── data/
│   │   ├── scenarios.ts           # 三种场景步骤序列
│   │   └── glossary.ts            # 名词解释数据
│   ├── composables/
│   │   └── useAnimation.ts        # 动画引擎
│   └── components/
│       ├── MailStage.vue          # SVG 舞台
│       ├── MailNode.vue           # 单节点
│       ├── Controls.vue           # 播放控制
│       ├── ScenarioTabs.vue       # 场景切换
│       └── Glossary.vue           # 名词解释
└── test/
    └── useAnimation.test.ts       # 动画引擎单测
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 package.json**

```json
{
  "name": "mail-animation",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.6.0",
    "vue-tsc": "^2.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "test/**/*.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SMTP 邮件传递动画</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 .gitignore**

```
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 7: 创建 src/main.ts**

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 8: 创建占位 src/App.vue**

```vue
<script setup lang="ts">
</script>

<template>
  <div class="placeholder">SMTP Animation (scaffold)</div>
</template>

<style>
.placeholder { padding: 2rem; font-family: sans-serif; }
</style>
```

- [ ] **Step 9: 创建 src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 10: 安装依赖并启动验证**

Run: `npm install`
Run: `npm run dev`
Expected: Vite 启动，浏览器访问 `http://localhost:5173` 显示 "SMTP Animation (scaffold)"

- [ ] **Step 11: Commit**

```bash
git init && git add -A
git commit -m "chore: scaffold vue+vite+ts project"
```

---

### Task 2: 类型定义

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 编写类型定义**

```ts
export type NodeRole = 'MUA' | 'MSA' | 'MTA' | 'MDA' | 'DNS'

export interface MailNode {
  id: string
  role: NodeRole
  label: string
  x: number
  y: number
}

export type StepDirection = 'client->server' | 'server->client' | 'transfer'

export interface Step {
  from: string
  to: string
  command: string
  direction: StepDirection
  description: string
  duration: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  nodes: MailNode[]
  steps: Step[]
}

export interface GlossaryItem {
  term: string
  full: string
  definition: string
  roleInAnimation: string
  nodeId?: string
}
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add type definitions"
```

---

### Task 3: 名词解释数据

**Files:**
- Create: `src/data/glossary.ts`

- [ ] **Step 1: 编写 glossary 数据**

```ts
import type { GlossaryItem } from '../types'

export const glossary: GlossaryItem[] = [
  {
    term: 'MUA',
    full: 'Mail User Agent',
    definition: '用户代理，即邮件客户端（如 Outlook、Thunderbird），用户在此撰写并发送邮件。',
    roleInAnimation: '动画中作为发件人和收件人节点出现。',
    nodeId: 'mua-sender',
  },
  {
    term: 'MSA',
    full: 'Mail Submission Agent',
    definition: '提交代理，接收 MUA 提交的邮件，做初步校验后交给 MTA。',
    roleInAnimation: '动画中位于 MUA 与 MTA 之间，负责接受提交。',
    nodeId: 'msa',
  },
  {
    term: 'MTA',
    full: 'Mail Transfer Agent',
    definition: '传输代理，根据收件人域名查询 MX 记录并通过 SMTP 将邮件转发到下一跳 MTA。',
    roleInAnimation: '动画中作为服务器间传递的核心节点。',
    nodeId: 'mta-sender',
  },
  {
    term: 'MDA',
    full: 'Mail Delivery Agent',
    definition: '投递代理，将收到的邮件写入收件人邮箱存储。',
    roleInAnimation: '动画中位于接收侧，将邮件交给收件人 MUA。',
    nodeId: 'mda',
  },
  {
    term: 'SMTP',
    full: 'Simple Mail Transfer Protocol',
    definition: '简单邮件传输协议，定义 MUA/MSA/MTA 之间用命令（HELO/MAIL FROM/RCPT TO/DATA 等）交换邮件。',
    roleInAnimation: '动画中命令气泡展示的对话内容。',
  },
  {
    term: 'MX 记录',
    full: 'Mail Exchange Record',
    definition: 'DNS 中指定某域名接收邮件的 MTA 主机记录。',
    roleInAnimation: '动画中跨服务器场景下，发件方 MTA 先查询 MX 记录。',
    nodeId: 'dns',
  },
  {
    term: 'Envelope',
    full: 'Envelope',
    definition: '信封，即 SMTP 会话中 MAIL FROM / RCPT TO 携带的路由信息，与邮件正文头部分离。',
    roleInAnimation: '动画中信封图标在节点间移动。',
  },
  {
    term: 'Header / Body',
    full: 'Header / Body',
    definition: '邮件头（From/To/Subject 等）与正文，DATA 命令后传输。',
    roleInAnimation: '动画中 DATA 步骤时体现。',
  },
  {
    term: 'Relay',
    full: 'Relay',
    definition: '中继转发，MTA 将邮件转发给下一跳 MTA 的过程，可能多跳。',
    roleInAnimation: '动画中中继转发场景展示多跳 MTA。',
  },
  {
    term: 'Queue',
    full: 'Queue',
    definition: '邮件队列，MTA 暂存待发邮件，失败时重试。',
    roleInAnimation: '动画中作为说明性概念提及。',
  },
]
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/data/glossary.ts
git commit -m "feat: add glossary data"
```

---

### Task 4: 场景数据

**Files:**
- Create: `src/data/scenarios.ts`

- [ ] **Step 1: 编写 scenarios 数据**

```ts
import type { Scenario } from '../types'

const localDelivery: Scenario = {
  id: 'local',
  name: '本地投递',
  description: '同一服务器内：MUA → MSA → MTA → MDA → MUA',
  nodes: [
    { id: 'mua-sender', role: 'MUA', label: '发件人 MUA', x: 80, y: 120 },
    { id: 'msa', role: 'MSA', label: 'MSA', x: 280, y: 120 },
    { id: 'mta-sender', role: 'MTA', label: 'MTA', x: 480, y: 120 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 680, y: 120 },
    { id: 'mua-receiver', role: 'MUA', label: '收件人 MUA', x: 880, y: 120 },
  ],
  steps: [
    { from: 'mua-sender', to: 'msa', command: 'HELO client.local', direction: 'client->server', description: 'MUA 向 MSA 发起 SMTP 会话', duration: 1200 },
    { from: 'mua-sender', to: 'msa', command: 'MAIL FROM:<alice@local>', direction: 'client->server', description: '声明发件人', duration: 1000 },
    { from: 'mua-sender', to: 'msa', command: 'RCPT TO:<bob@local>', direction: 'client->server', description: '声明收件人', duration: 1000 },
    { from: 'mua-sender', to: 'msa', command: 'DATA', direction: 'client->server', description: '请求传输正文', duration: 800 },
    { from: 'mua-sender', to: 'msa', command: '354 End data with <CRLF>.<CRLF>', direction: 'server->client', description: 'MSA 准备接收正文', duration: 800 },
    { from: 'mua-sender', to: 'msa', command: '250 OK', direction: 'server->client', description: 'MSA 接收完成，交给 MTA', duration: 800 },
    { from: 'msa', to: 'mta-sender', command: '转发至本地 MTA', direction: 'transfer', description: 'MSA 提交给本机 MTA', duration: 1200 },
    { from: 'mta-sender', to: 'mda', command: '本地投递', direction: 'transfer', description: 'MTA 识别为本地用户，交给 MDA', duration: 1200 },
    { from: 'mda', to: 'mua-receiver', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入收件人邮箱', duration: 1200 },
  ],
}

const crossServer: Scenario = {
  id: 'cross',
  name: '跨服务器传递',
  description: 'MUA → MSA → 发件方 MTA → DNS MX → 收件方 MTA → MDA → MUA',
  nodes: [
    { id: 'mua-sender', role: 'MUA', label: '发件人 MUA', x: 60, y: 180 },
    { id: 'msa', role: 'MSA', label: 'MSA', x: 220, y: 180 },
    { id: 'mta-sender', role: 'MTA', label: '发件方 MTA', x: 400, y: 180 },
    { id: 'dns', role: 'DNS', label: 'DNS (MX)', x: 560, y: 60 },
    { id: 'mta-receiver', role: 'MTA', label: '收件方 MTA', x: 720, y: 180 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 880, y: 180 },
    { id: 'mua-receiver', role: 'MUA', label: '收件人 MUA', x: 1040, y: 180 },
  ],
  steps: [
    { from: 'mua-sender', to: 'msa', command: 'EHLO / MAIL FROM / RCPT TO / DATA', direction: 'client->server', description: 'MUA 提交邮件到 MSA', duration: 1500 },
    { from: 'msa', to: 'mta-sender', command: '转发至发件方 MTA', direction: 'transfer', description: 'MSA 交给本域 MTA', duration: 1200 },
    { from: 'mta-sender', to: 'dns', command: 'QUERY MX for b.com', direction: 'client->server', description: '查询收件域名的 MX 记录', duration: 1200 },
    { from: 'dns', to: 'mta-sender', command: 'ANSWER: mx.b.com', direction: 'server->client', description: 'DNS 返回 MX 主机', duration: 1000 },
    { from: 'mta-sender', to: 'mta-receiver', command: 'EHLO mx.a.com', direction: 'client->server', description: '发件方 MTA 连接收件方 MTA', duration: 1200 },
    { from: 'mta-sender', to: 'mta-receiver', command: 'MAIL FROM:<alice@a.com>', direction: 'client->server', description: 'SMTP 信封发件人', duration: 1000 },
    { from: 'mta-sender', to: 'mta-receiver', command: 'RCPT TO:<bob@b.com>', direction: 'client->server', description: 'SMTP 信封收件人', duration: 1000 },
    { from: 'mta-sender', to: 'mta-receiver', command: 'DATA ... 250 OK', direction: 'transfer', description: '传输正文并被接收', duration: 1500 },
    { from: 'mta-receiver', to: 'mda', command: '本地投递', direction: 'transfer', description: '收件方 MTA 交给 MDA', duration: 1200 },
    { from: 'mda', to: 'mua-receiver', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入收件人邮箱', duration: 1200 },
  ],
}

const relay: Scenario = {
  id: 'relay',
  name: '中继转发',
  description: '发件方 MTA → 中继 MTA → 收件方 MTA',
  nodes: [
    { id: 'mta-sender', role: 'MTA', label: '发件方 MTA', x: 80, y: 160 },
    { id: 'mta-relay', role: 'MTA', label: '中继 MTA', x: 440, y: 160 },
    { id: 'mta-receiver', role: 'MTA', label: '收件方 MTA', x: 800, y: 160 },
    { id: 'mda', role: 'MDA', label: 'MDA', x: 1000, y: 160 },
    { id: 'mua-receiver', role: 'MUA', label: '收件人 MUA', x: 1180, y: 160 },
  ],
  steps: [
    { from: 'mta-sender', to: 'mta-relay', command: 'RELAY: RCPT TO:<bob@b.com>', direction: 'client->server', description: '发件方 MTA 中继到中继 MTA', duration: 1500 },
    { from: 'mta-sender', to: 'mta-relay', command: '250 OK (queued)', direction: 'server->client', description: '中继 MTA 入队', duration: 1000 },
    { from: 'mta-relay', to: 'mta-receiver', command: 'EHLO / MAIL FROM / RCPT TO / DATA', direction: 'client->server', description: '中继 MTA 转发到收件方 MTA', duration: 1500 },
    { from: 'mta-relay', to: 'mta-receiver', command: '250 OK', direction: 'server->client', description: '收件方 MTA 接收', duration: 1000 },
    { from: 'mta-receiver', to: 'mda', command: '本地投递', direction: 'transfer', description: '收件方 MTA 交给 MDA', duration: 1200 },
    { from: 'mda', to: 'mua-receiver', command: '写入邮箱', direction: 'transfer', description: 'MDA 写入邮箱', duration: 1200 },
  ],
}

export const scenarios: Scenario[] = [localDelivery, crossServer, relay]
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/data/scenarios.ts
git commit -m "feat: add scenario data"
```

---

### Task 5: 动画引擎 useAnimation（TDD）

**Files:**
- Create: `src/composables/useAnimation.ts`
- Create: `test/useAnimation.test.ts`

- [ ] **Step 1: 编写失败测试**

```ts
// test/useAnimation.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAnimation } from '../src/composables/useAnimation'
import type { Scenario } from '../src/types'

const scenario: Scenario = {
  id: 't',
  name: 't',
  description: '',
  nodes: [
    { id: 'a', role: 'MUA', label: 'A', x: 0, y: 0 },
    { id: 'b', role: 'MSA', label: 'B', x: 10, y: 0 },
  ],
  steps: [
    { from: 'a', to: 'b', command: 'PING', direction: 'client->server', description: 'd1', duration: 100 },
    { from: 'b', to: 'a', command: 'PONG', direction: 'server->client', description: 'd2', duration: 100 },
  ],
}

describe('useAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts paused at step 0', () => {
    const { currentStepIndex, isPlaying, progress } = useAnimation(scenario)
    expect(currentStepIndex.value).toBe(0)
    expect(isPlaying.value).toBe(false)
    expect(progress.value).toBe(0)
  })

  it('play advances step index after duration', () => {
    const { play, currentStepIndex } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(100)
    expect(currentStepIndex.value).toBe(1)
  })

  it('pause stops advancing', () => {
    const { play, pause, currentStepIndex } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(50)
    pause()
    vi.advanceTimersByTime(1000)
    expect(currentStepIndex.value).toBe(0)
  })

  it('reset returns to step 0 paused', () => {
    const { play, reset, currentStepIndex, isPlaying } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(150)
    reset()
    expect(currentStepIndex.value).toBe(0)
    expect(isPlaying.value).toBe(false)
  })

  it('stops at last step without looping', () => {
    const { play, currentStepIndex, isPlaying } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(500)
    expect(currentStepIndex.value).toBe(1)
    expect(isPlaying.value).toBe(false)
  })

  it('goto jumps to specific step', () => {
    const { goto, currentStepIndex } = useAnimation(scenario)
    goto(1)
    expect(currentStepIndex.value).toBe(1)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run`
Expected: FAIL — 模块 `../src/composables/useAnimation` 不存在

- [ ] **Step 3: 编写实现**

```ts
// src/composables/useAnimation.ts
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Scenario } from '../types'

export function useAnimation(scenario: Scenario) {
  const currentStepIndex = ref(0)
  const isPlaying = ref(false)
  const progress = ref(0)
  const speed = ref(1)

  let timer: number | null = null
  let raf: number | null = null
  let stepStart = 0
  let stepDuration = 0

  const totalSteps = computed(() => scenario.steps.length)
  const currentStep = computed(() => scenario.steps[currentStepIndex.value])
  const isFinished = computed(() => currentStepIndex.value >= totalSteps.value - 1 && !isPlaying.value)

  function clearTimers() {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
    if (raf != null) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  function tick(now: number) {
    if (!isPlaying.value) return
    const elapsed = now - stepStart
    const ratio = Math.min(1, elapsed / stepDuration)
    progress.value = ratio
    if (ratio >= 1) {
      advance()
    } else {
      raf = requestAnimationFrame(tick)
    }
  }

  function advance() {
    clearTimers()
    const next = currentStepIndex.value + 1
    if (next >= totalSteps.value) {
      isPlaying.value = false
      progress.value = 1
      return
    }
    currentStepIndex.value = next
    startStep()
  }

  function startStep() {
    const step = scenario.steps[currentStepIndex.value]
    stepDuration = step.duration / speed.value
    stepStart = performance.now()
    progress.value = 0
    if (stepDuration <= 0) {
      advance()
      return
    }
    raf = requestAnimationFrame(tick)
    timer = window.setTimeout(advance, stepDuration)
  }

  function play() {
    if (isPlaying.value) return
    if (currentStepIndex.value >= totalSteps.value - 1) {
      currentStepIndex.value = 0
    }
    isPlaying.value = true
    startStep()
  }

  function pause() {
    isPlaying.value = false
    clearTimers()
  }

  function reset() {
    clearTimers()
    currentStepIndex.value = 0
    isPlaying.value = false
    progress.value = 0
  }

  function goto(index: number) {
    clearTimers()
    const clamped = Math.max(0, Math.min(index, totalSteps.value - 1))
    currentStepIndex.value = clamped
    progress.value = 0
    if (isPlaying.value) startStep()
  }

  function setSpeed(s: number) {
    speed.value = s
  }

  onUnmounted(clearTimers)

  return {
    currentStepIndex,
    isPlaying,
    progress,
    speed,
    totalSteps,
    currentStep,
    isFinished,
    play,
    pause,
    reset,
    goto,
    setSpeed,
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run`
Expected: PASS 全部用例

- [ ] **Step 5: Commit**

```bash
git add src/composables/useAnimation.ts test/useAnimation.test.ts
git commit -m "feat: add useAnimation engine with tests"
```

---

### Task 6: MailNode 组件

**Files:**
- Create: `src/components/MailNode.vue`

- [ ] **Step 1: 编写组件**

```vue
<script setup lang="ts">
import type { MailNode } from '../types'

const props = defineProps<{
  node: MailNode
  active: boolean
  selected: boolean
}>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const roleIcon: Record<string, string> = {
  MUA: '👤',
  MSA: '📤',
  MTA: '🖥',
  MDA: '📥',
  DNS: '🌐',
}
</script>

<template>
  <g
    :transform="`translate(${node.x}, ${node.y})`"
    class="node"
    :class="{ active, selected }"
    @click="emit('select', node.id)"
  >
    <rect x="-50" y="-30" width="100" height="60" rx="8" />
    <text x="0" y="-6" text-anchor="middle" class="icon">{{ roleIcon[node.role] }}</text>
    <text x="0" y="14" text-anchor="middle" class="label">{{ node.label }}</text>
  </g>
</template>

<style scoped>
.node rect {
  fill: #fff;
  stroke: #cbd5e1;
  stroke-width: 1.5;
  cursor: pointer;
  transition: all 0.2s;
}
.node.active rect {
  stroke: #2563eb;
  stroke-width: 2.5;
  fill: #eff6ff;
}
.node.selected rect {
  stroke: #16a34a;
  stroke-width: 2.5;
  fill: #f0fdf4;
}
.icon { font-size: 18px; }
.label { font-size: 10px; fill: #334155; }
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/MailNode.vue
git commit -m "feat: add MailNode component"
```

---

### Task 7: MailStage 组件

**Files:**
- Create: `src/components/MailStage.vue`

- [ ] **Step 1: 编写组件**

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
</script>

<template>
  <svg viewBox="0 0 1200 260" class="stage">
    <!-- 连线 -->
    <line
      v-for="n in scenario.nodes.slice(1)"
      :key="`line-${n.id}`"
      :x1="nodeById[scenario.nodes[scenario.nodes.indexOf(n) - 1].id].x"
      :y1="nodeById[scenario.nodes[scenario.nodes.indexOf(n) - 1].id].y"
      :x2="n.x"
      :y2="n.y"
      class="link"
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
    <g :transform="`translate(${envelopePos.x}, ${envelopePos.y - 50})`" class="bubble">
      <rect x="-90" y="-18" width="180" height="36" rx="6" />
      <text x="0" y="5" text-anchor="middle" class="cmd-text">
        {{ commandPrefix }} {{ currentStep.command }}
      </text>
    </g>

    <!-- 信封 -->
    <g :transform="`translate(${envelopePos.x}, ${envelopePos.y})`" class="envelope">
      <rect x="-10" y="-7" width="20" height="14" rx="1" />
      <path d="M-10,-7 L0,0 L10,-7" class="flap" />
    </g>
  </svg>
</template>

<style scoped>
.stage { width: 100%; height: 260px; background: #f8fafc; border-radius: 8px; }
.link { stroke: #94a3b8; stroke-width: 1.5; stroke-dasharray: 4 4; }
.bubble rect { fill: #1e293b; opacity: 0.92; }
.cmd-text { fill: #f1f5f9; font-family: monospace; font-size: 11px; }
.envelope rect { fill: #fbbf24; stroke: #b45309; stroke-width: 1; }
.envelope .flap { fill: none; stroke: #b45309; stroke-width: 1; }
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/MailStage.vue
git commit -m "feat: add MailStage component"
```

---

### Task 8: Controls 组件

**Files:**
- Create: `src/components/Controls.vue`

- [ ] **Step 1: 编写组件**

```vue
<script setup lang="ts">
const props = defineProps<{
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
  <div class="controls">
    <div class="row">
      <button v-if="!isPlaying" @click="emit('play')">▶ 播放</button>
      <button v-else @click="emit('pause')">⏸ 暂停</button>
      <button @click="emit('reset')">⏮ 重置</button>
      <div class="speed">
        <span>速度</span>
        <button
          v-for="s in speeds"
          :key="s"
          :class="{ active: speed === s }"
          @click="emit('set-speed', s)"
        >{{ s }}x</button>
      </div>
    </div>
    <div class="row">
      <input
        type="range"
        :min="0"
        :max="totalSteps - 1"
        :value="currentStepIndex"
        @input="emit('goto', Number(($event.target as HTMLInputElement).value))"
      />
      <span class="step-info">{{ currentStepIndex + 1 }} / {{ totalSteps }}</span>
    </div>
    <div class="progress">
      <div class="bar" :style="{ width: `${(currentStepIndex + progress) / totalSteps * 100}%` }" />
    </div>
  </div>
</template>

<style scoped>
.controls { padding: 0.75rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
.row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
button { padding: 0.35rem 0.75rem; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; cursor: pointer; }
button:hover { background: #f1f5f9; }
button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.speed { display: flex; gap: 0.25rem; align-items: center; margin-left: auto; }
.speed span { font-size: 0.85rem; color: #64748b; }
input[type=range] { flex: 1; }
.step-info { font-size: 0.85rem; color: #64748b; min-width: 60px; text-align: right; }
.progress { height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
.bar { height: 100%; background: #2563eb; transition: width 0.1s linear; }
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/Controls.vue
git commit -m "feat: add Controls component"
```

---

### Task 9: ScenarioTabs 组件

**Files:**
- Create: `src/components/ScenarioTabs.vue`

- [ ] **Step 1: 编写组件**

```vue
<script setup lang="ts">
import type { Scenario } from '../types'

defineProps<{
  scenarios: Scenario[]
  currentId: string
}>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()
</script>

<template>
  <div class="tabs">
    <button
      v-for="s in scenarios"
      :key="s.id"
      :class="{ active: s.id === currentId }"
      @click="emit('select', s.id)"
    >
      <div class="name">{{ s.name }}</div>
      <div class="desc">{{ s.description }}</div>
    </button>
  </div>
</template>

<style scoped>
.tabs { display: flex; flex-direction: column; gap: 0.5rem; }
button { text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; cursor: pointer; }
button:hover { background: #f8fafc; }
button.active { border-color: #2563eb; background: #eff6ff; }
.name { font-weight: 600; font-size: 0.95rem; }
.desc { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/ScenarioTabs.vue
git commit -m "feat: add ScenarioTabs component"
```

---

### Task 10: Glossary 组件

**Files:**
- Create: `src/components/Glossary.vue`

- [ ] **Step 1: 编写组件**

```vue
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { GlossaryItem } from '../types'

const props = defineProps<{
  items: GlossaryItem[]
  selectedNodeId: string | null
}>()

const containerRef = ref<HTMLElement | null>(null)

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
  <div class="glossary" ref="containerRef">
    <h3>名词解释</h3>
    <div
      v-for="item in items"
      :key="item.term"
      class="item"
      :class="{ highlight: item.nodeId && item.nodeId === selectedNodeId }"
      :data-node-id="item.nodeId"
    >
      <div class="term">{{ item.term }} <span class="full">{{ item.full }}</span></div>
      <div class="definition">{{ item.definition }}</div>
      <div class="role">本动画中：{{ item.roleInAnimation }}</div>
    </div>
  </div>
</template>

<style scoped>
.glossary { padding: 0.75rem; }
h3 { margin: 0 0 0.5rem; font-size: 1rem; }
.item { padding: 0.5rem; border-radius: 6px; margin-bottom: 0.5rem; transition: background 0.2s; }
.item.highlight { background: #f0fdf4; }
.term { font-weight: 600; font-size: 0.9rem; }
.full { font-weight: 400; color: #64748b; font-size: 0.8rem; }
.definition { font-size: 0.82rem; margin-top: 2px; color: #334155; }
.role { font-size: 0.78rem; margin-top: 2px; color: #64748b; }
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/Glossary.vue
git commit -m "feat: add Glossary component"
```

---

### Task 11: App.vue 组装

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 替换 App.vue 内容**

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { scenarios } from './data/scenarios'
import { glossary } from './data/glossary'
import { useAnimation } from './composables/useAnimation'
import MailStage from './components/MailStage.vue'
import Controls from './components/Controls.vue'
import ScenarioTabs from './components/ScenarioTabs.vue'
import Glossary from './components/Glossary.vue'

const currentScenarioId = ref(scenarios[0].id)
const currentScenario = computed(() =>
  scenarios.find((s) => s.id === currentScenarioId.value)!,
)

const selectedNodeId = ref<string | null>(null)

const anim = useAnimation(scenarios[0])

watch(currentScenarioId, (id) => {
  const sc = scenarios.find((s) => s.id === id)!
  // 重置动画到新场景（useAnimation 内部状态在场景切换时需重建）
  resetAnimation(sc)
})

function resetAnimation(sc: typeof scenarios[number]) {
  anim.reset()
  // 由于 useAnimation 绑定的是初始 scenario，这里用 key 强制重建
  scenarioKey.value++
}

const scenarioKey = ref(0)
</script>

<template>
  <div class="app">
    <header>
      <h1>SMTP 邮件传递动画</h1>
    </header>
    <main>
      <aside class="left">
        <ScenarioTabs
          :scenarios="scenarios"
          :current-id="currentScenarioId"
          @select="currentScenarioId = $event"
        />
      </aside>
      <section class="center">
        <!-- 使用 key 在切换场景时强制重建动画引擎 -->
        <div :key="`scenario-${currentScenarioId}-${scenarioKey}`">
          <MailStageWithAnimation
            :scenario="currentScenario"
            :selected-node-id="selectedNodeId"
            @select="selectedNodeId = $event"
          />
        </div>
      </section>
      <aside class="right">
        <Glossary :items="glossary" :selected-node-id="selectedNodeId" />
      </aside>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'
import MailStage from './components/MailStage.vue'
import Controls from './components/Controls.vue'
import { useAnimation } from './composables/useAnimation'
import type { Scenario } from './types'

// 局部子组件：在场景内绑定动画引擎
const MailStageWithAnimation = defineComponent({
  components: { MailStage, Controls },
  props: {
    scenario: { type: Object as () => Scenario, required: true },
    selectedNodeId: { type: String as () => string | null, default: null },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const anim = useAnimation(props.scenario)
    return () => [
      h(MailStage, {
        scenario: props.scenario,
        currentStep: anim.currentStep.value,
        progress: anim.progress.value,
        selectedNodeId: props.selectedNodeId,
        onSelect: (id: string) => emit('select', id),
      }),
      h('div', { class: 'step-desc' }, anim.currentStep.value?.description ?? ''),
      h(Controls, {
        isPlaying: anim.isPlaying.value,
        currentStepIndex: anim.currentStepIndex.value,
        totalSteps: anim.totalSteps.value,
        progress: anim.progress.value,
        speed: anim.speed.value,
        onPlay: () => anim.play(),
        onPause: () => anim.pause(),
        onReset: () => anim.reset(),
        onGoto: (i: number) => anim.goto(i),
        onSetSpeed: (s: number) => anim.setSpeed(s),
      }),
    ]
  },
})

export default defineComponent({
  name: 'App',
  components: { ScenarioTabs, Glossary, MailStageWithAnimation },
})
</script>

<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; }
.app { max-width: 1400px; margin: 0 auto; padding: 1rem; }
header h1 { font-size: 1.25rem; margin: 0 0 1rem; }
main { display: grid; grid-template-columns: 220px 1fr 280px; gap: 1rem; }
.center { display: flex; flex-direction: column; gap: 0.5rem; }
.step-desc { padding: 0.5rem; background: #fff; border-radius: 6px; font-size: 0.85rem; color: #334155; border: 1px solid #e2e8f0; }
aside { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
@media (max-width: 900px) {
  main { grid-template-columns: 1fr; }
}
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 运行 dev 验证**

Run: `npm run dev`
Expected: 浏览器访问 `http://localhost:5173`，三栏布局，可切换场景、播放/暂停、拖动进度条、点击节点高亮名词解释

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: assemble App with stage, controls, tabs, glossary"
```

---

### Task 12: 最终验证与文档

**Files:**
- Create: `README.md`

- [ ] **Step 1: 运行测试与类型检查**

Run: `npm run test`
Run: `npx vue-tsc --noEmit`
Run: `npm run build`
Expected: 全部通过

- [ ] **Step 2: 创建 README**

````markdown
# SMTP 邮件传递动画

演示邮件在 MUA / MSA / MTA / MDA 之间通过 SMTP 传递的过程。

## 启动

```bash
npm install
npm run dev
```

## 场景

- 本地投递
- 跨服务器传递（含 DNS MX 查询）
- 中继转发（多跳 MTA）

## 名词解释

详见页面右侧 Glossary，点击舞台节点可高亮对应条目。

## 测试

```bash
npm run test
```
````

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Self-Review

**Spec coverage:**
- 节点流图 + 信封动画 → Task 6/7 ✓
- MUA/MSA/MTA/MDA 节点 → Task 4 (nodes 数据) ✓
- SMTP 命令对话气泡 → Task 7 ✓
- 多场景切换 → Task 4 + Task 9 + Task 11 ✓
- 自动播放/暂停/重播/速度/进度 → Task 5 + Task 8 ✓
- 名词解释 + 点击节点联动 → Task 3 + Task 10 + Task 11 ✓
- 三栏响应式 → Task 11 (CSS) ✓

**Placeholder scan:** 无 TBD/TODO，所有步骤含完整代码。

**Type consistency:** `Step.from/to` (string) 与 `MailNode.id` (string) 一致；`useAnimation` 返回的 `currentStep`/`progress`/`isPlaying` 等在 MailStageWithAnimation 与 Controls props 中名称一致。

**Known simplification:** Task 11 中使用 `scenarioKey` + `:key` 强制重建动画引擎以处理场景切换，因 `useAnimation` 初始绑定的 scenario 不可变。此为实现细节，不影响功能。
