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
