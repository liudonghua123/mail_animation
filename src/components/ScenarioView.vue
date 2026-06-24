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
    :initial="{ opacity: 0, scale: 0.98 }"
    :enter="{ opacity: 1, scale: 1, transition: { duration: 350 } }"
    class="space-y-3"
  >
    <div class="card p-3">
      <MailStage
        :scenario="scenario"
        :current-step="currentStep"
        :progress="progress"
        :selected-node-id="selectedNodeId"
        @select="emit('select', $event)"
      />
    </div>
    <div class="card px-4 py-2.5 text-slate-700 text-sm">
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
