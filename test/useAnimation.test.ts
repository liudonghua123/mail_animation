import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAnimation } from '../src/composables/useAnimation'
import type { Scenario } from '../src/types'

const scenario: Scenario = {
  id: 't',
  name: 't',
  description: '',
  nodes: [
    { id: 'a', role: 'MUA', label: 'A', x: 0, y: 0 },
    { id: 'b', role: 'MSA', label: 'B', x: 10, y: 0 },
  ],
  steps: [
    { from: 'a', to: 'b', command: 'PING', direction: 'client->server', description: 'd1', duration: 100 },
    { from: 'b', to: 'a', command: 'PONG', direction: 'server->client', description: 'd2', duration: 100 },
  ],
}

describe('useAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts paused at step 0', () => {
    const { currentStepIndex, isPlaying, progress } = useAnimation(scenario)
    expect(currentStepIndex.value).toBe(0)
    expect(isPlaying.value).toBe(false)
    expect(progress.value).toBe(0)
  })

  it('play advances step index after duration', () => {
    const { play, currentStepIndex } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(100)
    expect(currentStepIndex.value).toBe(1)
  })

  it('pause stops advancing', () => {
    const { play, pause, currentStepIndex } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(50)
    pause()
    vi.advanceTimersByTime(1000)
    expect(currentStepIndex.value).toBe(0)
  })

  it('reset returns to step 0 paused', () => {
    const { play, reset, currentStepIndex, isPlaying } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(150)
    reset()
    expect(currentStepIndex.value).toBe(0)
    expect(isPlaying.value).toBe(false)
  })

  it('stops at last step without looping', () => {
    const { play, currentStepIndex, isPlaying } = useAnimation(scenario)
    play()
    vi.advanceTimersByTime(500)
    expect(currentStepIndex.value).toBe(1)
    expect(isPlaying.value).toBe(false)
  })

  it('goto jumps to specific step', () => {
    const { goto, currentStepIndex } = useAnimation(scenario)
    goto(1)
    expect(currentStepIndex.value).toBe(1)
  })

  it('pastCommands returns steps up to current index inclusive', () => {
    const { goto, pastCommands } = useAnimation(scenario)
    goto(0)
    expect(pastCommands.value).toHaveLength(1)
    expect(pastCommands.value[0].command).toBe('PING')
    goto(1)
    expect(pastCommands.value).toHaveLength(2)
    expect(pastCommands.value[1].command).toBe('PONG')
  })
})
