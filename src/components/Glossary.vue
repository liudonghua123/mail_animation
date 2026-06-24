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
