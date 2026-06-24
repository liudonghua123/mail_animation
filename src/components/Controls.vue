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
