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
      <span :class="[l.color, l.sessionHeader ? '' : 'font-semibold']">{{ l.text }}</span>
      <pre v-if="l.mailContent && l.isLast" class="mt-1 ml-4 text-slate-500 whitespace-pre-wrap text-[10px]">{{ l.mailContent }}</pre>
    </div>
  </div>
</template>
