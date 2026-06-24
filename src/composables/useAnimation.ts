import { ref, computed, onUnmounted } from 'vue'
import type { Scenario } from '../types'

export function useAnimation(scenario: Scenario) {
  const currentStepIndex = ref(0)
  const isPlaying = ref(false)
  const progress = ref(0)
  const speed = ref(1)

  let timer: number | null = null
  let raf: number | null = null
  let stepStart = 0
  let stepDuration = 0

  const totalSteps = computed(() => scenario.steps.length)
  const currentStep = computed(() => scenario.steps[currentStepIndex.value])
  const pastCommands = computed(() => scenario.steps.slice(0, currentStepIndex.value + 1))
  const isFinished = computed(
    () => currentStepIndex.value >= totalSteps.value - 1 && !isPlaying.value,
  )

  function clearTimers() {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
    if (raf != null) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  function tick(now: number) {
    if (!isPlaying.value) return
    const elapsed = now - stepStart
    const ratio = Math.min(1, elapsed / stepDuration)
    progress.value = ratio
    if (ratio < 1) {
      raf = requestAnimationFrame(tick)
    }
  }

  function advance() {
    clearTimers()
    const next = currentStepIndex.value + 1
    if (next >= totalSteps.value) {
      isPlaying.value = false
      progress.value = 1
      return
    }
    currentStepIndex.value = next
    startStep()
  }

  function startStep() {
    const step = scenario.steps[currentStepIndex.value]
    stepDuration = step.duration / speed.value
    stepStart = performance.now()
    progress.value = 0
    if (stepDuration <= 0) {
      advance()
      return
    }
    raf = requestAnimationFrame(tick)
    timer = window.setTimeout(advance, stepDuration)
  }

  function play() {
    if (isPlaying.value) return
    if (currentStepIndex.value >= totalSteps.value - 1) {
      currentStepIndex.value = 0
    }
    isPlaying.value = true
    startStep()
  }

  function pause() {
    isPlaying.value = false
    clearTimers()
  }

  function reset() {
    clearTimers()
    currentStepIndex.value = 0
    isPlaying.value = false
    progress.value = 0
  }

  function goto(index: number) {
    clearTimers()
    const clamped = Math.max(0, Math.min(index, totalSteps.value - 1))
    currentStepIndex.value = clamped
    progress.value = 0
    if (isPlaying.value) startStep()
  }

  function setSpeed(s: number) {
    speed.value = s
  }

  onUnmounted(clearTimers)

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
}
