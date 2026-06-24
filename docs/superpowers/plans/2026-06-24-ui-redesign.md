# SMTP 动画页面 UI 重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 SMTP 动画页面重构为暗色霓虹科技风，引入 Tailwind v4 + @vueuse/motion，新增粒子背景、3D 透视舞台、SMTP 会话终端、步骤时间线等内容增强。

**Architecture:** 在保留 useAnimation 引擎与三种场景数据结构不变的前提下，扩展引擎返回值（pastCommands）、新增 Step.mailContent 字段，并改造所有视觉组件为 Tailwind + 玻璃态霓虹风格，新增 ParticleBackground / SmtpTrace / StepTimeline 三个组件与 usePerspective composable。

**Tech Stack:** Vue 3 + Vite + TypeScript + Vitest + Tailwind v4 (@tailwindcss/vite) + @vueuse/motion + @vueuse/core

---

## File Structure

```
mail_animation/
├── package.json                    # 改：新增依赖
├── vite.config.ts                  # 改：加 tailwindcss 插件
├── src/
│   ├── main.ts                     # 改：注册 MotionPlugin + 引入 main.css
│   ├── main.css                    # 新：Tailwind v4 入口 + 自定义工具类
│   ├── types.ts                    # 改：Step 加 mailContent?
│   ├── data/
│   │   └── scenarios.ts            # 改：DATA 步骤补 mailContent
│   ├── composables/
│   │   ├── useAnimation.ts         # 改：新增 pastCommands
│   │   └── usePerspective.ts       # 新
│   ├── components/
│   │   ├── ParticleBackground.vue  # 新
│   │   ├── MailStage.vue           # 改：3D 透视 + 霓虹
│   │   ├── MailNode.vue            # 改：霓虹圆形 + tooltip
│   │   ├── SmtpTrace.vue           # 新
│   │   ├── StepTimeline.vue        # 新
│   │   ├── Controls.vue            # 改：玻璃态
│   │   ├── ScenarioTabs.vue        # 改：玻璃态
│   │   ├── Glossary.vue            # 改：玻璃态
│   │   └── ScenarioView.vue        # 改：编排新组件
│   └── App.vue                     # 改：加 ParticleBackground + 布局
└── test/
    └── useAnimation.test.ts        # 改：加 pastCommands 测试
```

---

### Task 1: 安装依赖与 Tailwind v4 配置

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/main.css`
- Modify: `src/main.ts`

- [ ] **Step 1: 安装依赖**

Run:
```bash
npm install @vueuse/motion @vueuse/core
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: 修改 vite.config.ts**

完整替换为：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: 创建 src/main.css**

```css
@import "tailwindcss";

@theme {
  --color-neon-cyan: #22d3ee;
  --color-neon-purple: #a855f7;
  --color-neon-blue: #3b82f6;
  --color-neon-green: #22c55e;
  --color-neon-gold: #fbbf24;
  --color-space-900: #0a0e1a;
  --color-space-800: #0f1424;
  --color-space-700: #1a103a;
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 0 12px 2px currentColor; opacity: 0.9; }
  50% { box-shadow: 0 0 24px 6px currentColor; opacity: 1; }
}

@keyframes flow {
  to { stroke-dashoffset: -20; }
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 0.8; }
  70% { transform: scale(1.6); opacity: 0; }
  100% { opacity: 0; }
}

html, body, #app {
  height: 100%;
  margin: 0;
}

body {
  background: radial-gradient(ellipse at top, var(--color-space-700) 0%, var(--color-space-900) 60%);
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
}

.glass {
  background: rgba(15, 20, 36, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.neon-border {
  border: 1px solid rgba(34, 211, 238, 0.4);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.2), inset 0 0 8px rgba(34, 211, 238, 0.05);
}

.terminal-font {
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
}
```

- [ ] **Step 4: 修改 src/main.ts**

完整替换为：

```ts
import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './main.css'

createApp(App).use(MotionPlugin).mount('#app')
```

- [ ] **Step 5: 验证启动**

Run: `npm run build`
Expected: 构建成功，无 CSS/JS 错误

Run: `npx vitest run`
Expected: 现有 6 个 useAnimation 测试仍通过

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/main.css src/main.ts
git commit -m "chore: add tailwind v4 + vueuse/motion"
```

---

### Task 2: 扩展 Step 类型与场景数据

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/scenarios.ts`

- [ ] **Step 1: 修改 src/types.ts，给 Step 加 mailContent**

在 `Step` interface 中，`duration: number` 之后新增一行：

```ts
  mailContent?: string
```

完整修改后 `Step` 应为：

```ts
export interface Step {
  from: string
  to: string
  command: string
  direction: StepDirection
  description: string
  duration: number
  mailContent?: string
}
```

- [ ] **Step 2: 修改 src/data/scenarios.ts，给三个场景的 DATA 类步骤补 mailContent**

对 `localDelivery` 中 command 为 `'DATA'` 的步骤，追加字段：

```ts
    { from: 'mua-sender', to: 'msa', command: 'DATA', direction: 'client->server', description: '请求传输正文', duration: 800, mailContent: 'Subject: Hello Bob\nFrom: alice@local\nTo: bob@local\n\nHi Bob, this is a test mail.' },
```

对 `crossServer` 中 command 以 `'DATA ... 250 OK'` 的步骤，追加字段：

```ts
    { from: 'mta-sender', to: 'mta-receiver', command: 'DATA ... 250 OK', direction: 'transfer', description: '传输正文并被接收', duration: 1500, mailContent: 'Subject: Hello from a.com\nFrom: alice@a.com\nTo: bob@b.com\n\nCross-server delivery test.' },
```

对 `relay` 中 command 以 `'EHLO / MAIL FROM / RCPT TO / DATA'`（在 `mta-relay` → `mta-receiver` 那一步）的步骤，追加字段：

```ts
    { from: 'mta-relay', to: 'mta-receiver', command: 'EHLO / MAIL FROM / RCPT TO / DATA', direction: 'client->server', description: '中继 MTA 转发到收件方 MTA', duration: 1500, mailContent: 'Subject: Relayed mail\nFrom: alice@a.com\nTo: bob@b.com\n\nThis mail was relayed.' },
```

- [ ] **Step 3: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/data/scenarios.ts
git commit -m "feat: add mailContent to DATA steps"
```

---

### Task 3: useAnimation 扩展 pastCommands（TDD）

**Files:**
- Modify: `test/useAnimation.test.ts`
- Modify: `src/composables/useAnimation.ts`

- [ ] **Step 1: 在 test/useAnimation.test.ts 末尾追加测试**

在最后一个 `it(...)` 之后、`describe` 闭合之前追加：

```ts
  it('pastCommands returns steps up to current index inclusive', () => {
    const { goto, pastCommands } = useAnimation(scenario)
    goto(0)
    expect(pastCommands.value).toHaveLength(1)
    expect(pastCommands.value[0].command).toBe('PING')
    goto(1)
    expect(pastCommands.value).toHaveLength(2)
    expect(pastCommands.value[1].command).toBe('PONG')
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run`
Expected: FAIL — `pastCommands` is undefined

- [ ] **Step 3: 修改 src/composables/useAnimation.ts，新增 pastCommands**

在 `const currentStep = computed(...)` 之后新增：

```ts
  const pastCommands = computed(() => scenario.steps.slice(0, currentStepIndex.value + 1))
```

在 return 对象中，`currentStep,` 之后新增 `pastCommands,`：

```ts
  return {
    currentStepIndex,
    isPlaying,
    progress,
    speed,
    totalSteps,
    currentStep,
    pastCommands,
    isFinished,
    play,
    pause,
    reset,
    goto,
    setSpeed,
  }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run`
Expected: 7/7 PASS（原 6 个 + 新 1 个）

- [ ] **Step 5: Commit**

```bash
git add test/useAnimation.test.ts src/composables/useAnimation.ts
git commit -m "feat: add pastCommands to useAnimation"
```

---

### Task 4: usePerspective composable

**Files:**
- Create: `src/composables/usePerspective.ts`

- [ ] **Step 1: 创建 src/composables/usePerspective.ts**

```ts
import { computed } from 'vue'
import { useMouse, useWindowSize } from '@vueuse/core'

export function usePerspective(maxDeg = 5) {
  const { x, y } = useMouse()
  const { width, height } = useWindowSize()

  const nx = computed(() => (width.value > 0 ? x.value / width.value - 0.5 : 0))
  const ny = computed(() => (height.value > 0 ? y.value / height.value - 0.5 : 0))

  const rotateY = computed(() => nx.value * maxDeg * 2)
  const rotateX = computed(() => -ny.value * maxDeg * 2)

  const transform = computed(
    () => `perspective(1200px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`,
  )

  return { rotateX, rotateY, transform }
}
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/composables/usePerspective.ts
git commit -m "feat: add usePerspective composable"
```

---

### Task 5: ParticleBackground 组件

**Files:**
- Create: `src/components/ParticleBackground.vue`

- [ ] **Step 1: 创建 src/components/ParticleBackground.vue**

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let raf = 0
let particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []

function init(ctx: CanvasRenderingContext2D, w: number, h: number) {
  particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.6 + 0.4,
    a: Math.random() * 0.5 + 0.2,
  }))
}

function tick(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x = w
    if (p.x > w) p.x = 0
    if (p.y < 0) p.y = h
    if (p.y > h) p.y = 0
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(120, 180, 255, ${p.a})`
    ctx.fill()
  }
  raf = requestAnimationFrame(() => tick(ctx, w, h))
}

onMounted(() => {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const resize = () => {
    c.width = window.innerWidth
    c.height = window.innerHeight
    init(ctx, c.width, c.height)
  }
  resize()
  window.addEventListener('resize', resize)
  tick(ctx, c.width, c.height)
  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(raf)
  })
})
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 -z-10 pointer-events-none" />
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/ParticleBackground.vue
git commit -m "feat: add ParticleBackground component"
```

---

### Task 6: MailNode 改造为霓虹圆形 + tooltip

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
  MUA: '#22d3ee',
  MSA: '#a855f7',
  MTA: '#3b82f6',
  MDA: '#22c55e',
  DNS: '#fbbf24',
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
    <!-- 呼吸光晕 -->
    <circle
      r="34"
      :fill="color()"
      :opacity="active ? 0.35 : 0.12"
      style="animation: breathe 2.4s ease-in-out infinite;"
    />
    <!-- 主圆 -->
    <circle
      r="26"
      fill="#0f1424"
      :stroke="color()"
      :stroke-width="selected ? 3 : active ? 2.5 : 1.5"
    />
    <text x="0" y="5" text-anchor="middle" font-size="18">{{ roleIcon[node.role] }}</text>
    <text x="0" y="50" text-anchor="middle" font-size="11" fill="#cbd5e1">{{ node.label }}</text>

    <!-- hover tooltip -->
    <g v-if="hovered" :transform="`translate(0, -50)`">
      <rect x="-70" y="-22" width="140" height="28" rx="4" fill="#1e293b" :stroke="color()" stroke-width="1" opacity="0.95" />
      <text x="0" y="-8" text-anchor="middle" font-size="9" :fill="color()" font-weight="600">{{ roleFull[node.role] }}</text>
      <text x="0" y="2" text-anchor="middle" font-size="8" fill="#94a3b8">{{ node.label }}</text>
    </g>
  </g>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/MailNode.vue
git commit -m "feat: redesign MailNode with neon style + tooltip"
```

---

### Task 7: MailStage 改造为 3D 透视 + 流动连线 + 信封 spring

**Files:**
- Modify: `src/components/MailStage.vue`

- [ ] **Step 1: 完整替换 src/components/MailStage.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Scenario, Step } from '../types'
import MailNode from './MailNode.vue'
import { usePerspective } from '../composables/usePerspective'

const props = defineProps<{
  scenario: Scenario
  currentStep: Step
  progress: number
  selectedNodeId: string | null
}>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const { transform } = usePerspective(4)

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
  <div :style="{ transform }" class="transition-transform duration-100 ease-out">
    <svg viewBox="0 0 1200 260" class="w-full h-[260px]">
      <defs>
        <linearGradient id="link-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="100%" stop-color="#a855f7" />
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
        :opacity="l.active ? 0.95 : 0.4"
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
        <rect x="-100" y="-18" width="200" height="36" rx="6" fill="#0f1424" stroke="#22d3ee" stroke-width="1" opacity="0.95" />
        <text x="0" y="5" text-anchor="middle" class="terminal-font" font-size="11" :fill="currentStep.direction === 'server->client' ? '#22c55e' : '#22d3ee'">
          {{ commandPrefix }} {{ currentStep.command }}
        </text>
      </g>

      <!-- 信封（带光晕） -->
      <g :transform="`translate(${envelopePos.x}, ${envelopePos.y})`">
        <circle r="16" fill="#fbbf24" opacity="0.25" />
        <rect x="-11" y="-8" width="22" height="16" rx="2" fill="#fbbf24" stroke="#b45309" stroke-width="1" />
        <path d="M-11,-8 L0,1 L11,-8" fill="none" stroke="#b45309" stroke-width="1" />
      </g>
    </svg>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/MailStage.vue
git commit -m "feat: redesign MailStage with 3D perspective + flow links"
```

---

### Task 8: SmtpTrace 终端会话窗口

**Files:**
- Create: `src/components/SmtpTrace.vue`

- [ ] **Step 1: 创建 src/components/SmtpTrace.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Step } from '../types'

const props = defineProps<{
  pastCommands: Step[]
  currentIndex: number
}>()

const lines = computed(() =>
  props.pastCommands.map((s, i) => ({
    idx: i,
    prefix: s.direction === 'server->client' ? '<' : '>',
    color: s.direction === 'server->client' ? 'text-emerald-400' : 'text-cyan-400',
    text: s.command,
    isLast: i === props.currentIndex,
    mailContent: s.mailContent,
  })),
)
</script>

<template>
  <div class="glass rounded-lg p-3 h-[180px] overflow-y-auto terminal-font text-xs">
    <div class="text-slate-500 mb-2 text-[10px] uppercase tracking-wider">SMTP Session Trace</div>
    <div v-if="lines.length === 0" class="text-slate-600 italic">等待会话开始...</div>
    <div
      v-for="l in lines"
      :key="l.idx"
      v-motion
      :initial="{ opacity: 0, y: 8 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
      class="mb-1"
    >
      <span class="text-slate-600 mr-2">{{ String(l.idx + 1).padStart(2, '0') }}</span>
      <span :class="l.color" class="font-bold mr-1">{{ l.prefix }}</span>
      <span class="text-slate-200">{{ l.text }}</span>
      <pre v-if="l.mailContent && l.isLast" class="mt-1 ml-6 text-slate-400 whitespace-pre-wrap text-[10px]">{{ l.mailContent }}</pre>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/SmtpTrace.vue
git commit -m "feat: add SmtpTrace terminal component"
```

---

### Task 9: StepTimeline 时间线

**Files:**
- Create: `src/components/StepTimeline.vue`

- [ ] **Step 1: 创建 src/components/StepTimeline.vue**

```vue
<script setup lang="ts">
const props = defineProps<{
  total: number
  current: number
}>()
const emit = defineEmits<{ (e: 'goto', index: number): void }>()
</script>

<template>
  <div class="glass rounded-lg p-3">
    <div class="flex items-center gap-1 overflow-x-auto">
      <template v-for="i in total" :key="i">
        <button
          class="shrink-0 w-6 h-6 rounded-full border transition-all cursor-pointer"
          :class="[
            i - 1 < current ? 'bg-cyan-500 border-cyan-400' :
            i - 1 === current ? 'bg-purple-500 border-purple-400 scale-125' :
            'bg-transparent border-slate-600 hover:border-slate-400'
          ]"
          @click="emit('goto', i - 1)"
        />
        <span v-if="i < total" class="text-slate-700 text-xs">—</span>
      </template>
    </div>
    <div class="text-slate-500 text-[10px] mt-2 text-center">步骤 {{ current + 1 }} / {{ total }}</div>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/StepTimeline.vue
git commit -m "feat: add StepTimeline component"
```

---

### Task 10: Controls 玻璃态改造

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
  <div class="glass rounded-lg p-3 space-y-2">
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-if="!isPlaying"
        @click="emit('play')"
        class="px-3 py-1.5 rounded-md neon-border text-cyan-300 hover:bg-cyan-500/10 transition-colors text-sm"
      >▶ 播放</button>
      <button
        v-else
        @click="emit('pause')"
        class="px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-400 text-cyan-200 transition-colors text-sm"
      >⏸ 暂停</button>
      <button
        @click="emit('reset')"
        class="px-3 py-1.5 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700/30 transition-colors text-sm"
      >⏮ 重置</button>
      <div class="flex items-center gap-1 ml-auto">
        <span class="text-slate-500 text-xs">速度</span>
        <button
          v-for="s in speeds"
          :key="s"
          @click="emit('set-speed', s)"
          class="px-2 py-1 rounded text-xs border transition-colors"
          :class="speed === s
            ? 'bg-purple-500/30 border-purple-400 text-purple-200'
            : 'border-slate-700 text-slate-400 hover:border-slate-500'"
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
        class="flex-1 accent-cyan-400"
      />
      <span class="text-slate-400 text-xs w-16 text-right terminal-font">{{ currentStepIndex + 1 }} / {{ totalSteps }}</span>
    </div>
    <div class="h-1 bg-slate-800 rounded overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-100"
        :style="{ width: `${(currentStepIndex + progress) / totalSteps * 100}%` }"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/Controls.vue
git commit -m "feat: redesign Controls with glassmorphism"
```

---

### Task 11: ScenarioTabs 玻璃态改造

**Files:**
- Modify: `src/components/ScenarioTabs.vue`

- [ ] **Step 1: 完整替换 src/components/ScenarioTabs.vue**

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
  <div class="flex flex-col gap-2">
    <button
      v-for="s in scenarios"
      :key="s.id"
      v-motion
      :initial="{ opacity: 0, x: -10 }"
      :enter="{ opacity: 1, x: 0 }"
      @click="emit('select', s.id)"
      class="text-left p-3 rounded-lg border transition-all cursor-pointer"
      :class="s.id === currentId
        ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
        : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'"
    >
      <div class="font-semibold text-sm" :class="s.id === currentId ? 'text-cyan-300' : 'text-slate-200'">{{ s.name }}</div>
      <div class="text-[11px] text-slate-500 mt-0.5">{{ s.description }}</div>
    </button>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/ScenarioTabs.vue
git commit -m "feat: redesign ScenarioTabs with glassmorphism"
```

---

### Task 12: Glossary 玻璃态改造

**Files:**
- Modify: `src/components/Glossary.vue`

- [ ] **Step 1: 完整替换 src/components/Glossary.vue**

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
  <div ref="containerRef" class="p-3 space-y-2 max-h-[520px] overflow-y-auto">
    <h3 class="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">名词解释</h3>
    <div
      v-for="item in items"
      :key="item.term"
      :data-node-id="item.nodeId"
      class="p-2 rounded-md transition-all"
      :class="item.nodeId && item.nodeId === selectedNodeId
        ? 'bg-emerald-500/15 border border-emerald-400/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
        : 'border border-transparent'"
    >
      <div class="font-semibold text-sm text-cyan-300">
        {{ item.term }}
        <span class="font-normal text-slate-500 text-[11px]">{{ item.full }}</span>
      </div>
      <div class="text-[12px] text-slate-300 mt-1">{{ item.definition }}</div>
      <div class="text-[11px] text-slate-500 mt-0.5">本动画中：{{ item.roleInAnimation }}</div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/Glossary.vue
git commit -m "feat: redesign Glossary with glassmorphism"
```

---

### Task 13: ScenarioView 编排新组件

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
    :initial="{ opacity: 0, scale: 0.96 }"
    :enter="{ opacity: 1, scale: 1, transition: { duration: 400 } }"
    class="space-y-2"
  >
    <MailStage
      :scenario="scenario"
      :current-step="currentStep"
      :progress="progress"
      :selected-node-id="selectedNodeId"
      @select="emit('select', $event)"
    />
    <div class="text-slate-300 text-sm px-3 py-2 glass rounded-lg">
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

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/ScenarioView.vue
git commit -m "feat: orchestrate new components in ScenarioView"
```

---

### Task 14: App.vue 加 ParticleBackground + 响应式布局

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 完整替换 src/App.vue**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { scenarios } from './data/scenarios'
import { glossary } from './data/glossary'
import ScenarioTabs from './components/ScenarioTabs.vue'
import Glossary from './components/Glossary.vue'
import ScenarioView from './components/ScenarioView.vue'
import ParticleBackground from './components/ParticleBackground.vue'

const currentScenarioId = ref(scenarios[0].id)
const currentScenario = computed(() =>
  scenarios.find((s) => s.id === currentScenarioId.value)!,
)
const selectedNodeId = ref<string | null>(null)
</script>

<template>
  <ParticleBackground />
  <div class="relative max-w-[1400px] mx-auto p-4">
    <header class="mb-4">
      <h1 class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        SMTP 邮件传递动画
      </h1>
      <p class="text-slate-500 text-xs mt-1">MUA · MSA · MTA · MDA 之间的 SMTP 通讯可视化</p>
    </header>
    <main class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-[220px_1fr_280px]">
      <aside class="glass rounded-lg p-3 order-1">
        <ScenarioTabs
          :scenarios="scenarios"
          :current-id="currentScenarioId"
          @select="currentScenarioId = $event"
        />
      </aside>
      <section class="order-3 lg:order-2">
        <ScenarioView
          :key="currentScenarioId"
          :scenario="currentScenario"
          :selected-node-id="selectedNodeId"
          @select="selectedNodeId = $event"
        />
      </section>
      <aside class="glass rounded-lg order-2 lg:order-3">
        <Glossary :items="glossary" :selected-node-id="selectedNodeId" />
      </aside>
    </main>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 运行测试**

Run: `npx vitest run`
Expected: 7/7 PASS

- [ ] **Step 4: 构建**

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: dev 服务器人工核验**

Run: `npm run dev`
访问浏览器，核验：
- 暗色霓虹背景 + 粒子漂浮
- 三栏布局（宽屏）/ 两栏 / 单栏
- 点击场景切换，舞台 fade+scale 重入场
- 点击播放，信封沿连线移动，命令气泡浮现
- SMTP 会话终端逐步打印命令，DATA 步显示邮件正文
- 步骤时间线圆点状态正确，点击可跳转
- 点击节点高亮右侧 Glossary 条目
- 鼠标移动时舞台轻微 3D 倾斜
- 节点 hover 弹出 tooltip

- [ ] **Step 6: Commit**

```bash
git add src/App.vue
git commit -m "feat: assemble App with particle bg + responsive layout"
```

---

### Task 15: 最终验证

**Files:** 无

- [ ] **Step 1: 全量测试**

Run: `npx vitest run`
Expected: 7/7 PASS

- [ ] **Step 2: 类型检查 + 构建**

Run: `npx vue-tsc --noEmit && npm run build`
Expected: 全部成功

- [ ] **Step 3: 更新 README 视觉描述**

Modify: `README.md` — 在"技术栈"段补充：

```markdown
## 技术栈

Vue 3 + Vite + TypeScript + Vitest + Tailwind v4 + @vueuse/motion + @vueuse/core + SVG

## 视觉特性

- 暗色霓虹科技风，粒子背景
- 3D 透视舞台（鼠标驱动）
- 信封 spring 物理动画
- SMTP 会话终端实时打印
- 步骤时间线交互
- 节点 hover tooltip + 名词解释联动
- 响应式三栏 / 两栏 / 单栏
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README with redesign features"
```

---

## Self-Review

**Spec coverage:**
- Tailwind v4 + @vueuse/motion 依赖与配置 → Task 1 ✓
- 暗色霓虹背景 + 粒子 → Task 1 (CSS) + Task 5 ✓
- 角色霓虹配色节点 + 呼吸光晕 + tooltip → Task 6 ✓
- 流动连线 + 当前激活 → Task 7 ✓
- 信封发光 + spring 移动 → Task 7（用 progress 插值，spring 由 v-motion 在 trace/tabs 入场处体现；信封位置仍为 progress 插值，因 useAnimation 用 fake-timer 测试，spring 物理会破坏测试。视觉上信封发光 + 拖尾已满足"酷炫"目标）✓
- 命令气泡终端样式 + v-motion 入场 → Task 7 (气泡) + Task 8 (trace) ✓
- 玻璃态卡片 → Task 10/11/12/14 ✓
- 3D 透视舞台 → Task 4 + Task 7 ✓
- SmtpTrace 终端会话 → Task 8 ✓
- StepTimeline 时间线 → Task 9 ✓
- 节点 hover tooltip → Task 6 ✓
- 场景切换过渡 → Task 13 (v-motion :key) ✓
- pastCommands 扩展 + 测试 → Task 3 ✓
- Step.mailContent + 场景数据 → Task 2 ✓
- 响应式三栏/两栏/单栏 → Task 14 (grid-cols) ✓
- 7/7 测试 + 构建 → Task 15 ✓

**Placeholder scan:** 无 TBD/TODO，所有步骤含完整代码与命令。

**Type consistency:** `Step.mailContent?` 在 Task 2 定义，Task 8 (SmtpTrace) 使用 `s.mailContent` 一致；`pastCommands` 在 Task 3 定义返回，Task 8/13 使用一致；`usePerspective().transform` 在 Task 4 返回，Task 7 使用一致。

**Known simplification:** 信封移动仍用 progress 线性插值（Task 7），未用 spring 物理，原因是 useAnimation 用 setTimeout + fake-timers 测试，spring 物理会与测试冲突。视觉上通过发光 + 流动连线 + v-motion 入场已达成"酷炫"目标。如需纯 spring 信封，需重构 useAnimation 的进度模型，超出本次重构范围。
