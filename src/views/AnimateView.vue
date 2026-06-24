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
