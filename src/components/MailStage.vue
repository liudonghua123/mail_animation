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
