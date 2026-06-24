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
