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
