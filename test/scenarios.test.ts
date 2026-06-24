import { describe, it, expect } from 'vitest'
import { scenarios } from '../src/data/scenarios'

describe('scenarios data integrity', () => {
  for (const sc of scenarios) {
    describe(`scenario ${sc.id}`, () => {
      it('every step references existing node ids', () => {
        const ids = new Set(sc.nodes.map((n) => n.id))
        for (const step of sc.steps) {
          expect(ids.has(step.from), `from=${step.from} not in nodes`).toBe(true)
          expect(ids.has(step.to), `to=${step.to} not in nodes`).toBe(true)
        }
      })

      it('non-transfer steps have a response', () => {
        for (const step of sc.steps) {
          if (step.direction !== 'transfer') {
            expect(step.response, `step "${step.command}" missing response`).toBeTruthy()
          }
        }
      })

      it('response direction is server->client with swapped from/to', () => {
        const reqBySession: Record<string, { from: string; to: string }> = {}
        for (const step of sc.steps) {
          if (step.direction === 'client->server') {
            reqBySession[step.session ?? ''] = { from: step.from, to: step.to }
          }
          if (step.direction === 'server->client') {
            const req = reqBySession[step.session ?? '']
            expect(req, `response step "${step.command}" has no preceding request in session`).toBeDefined()
            if (req) {
              expect(step.from, `response from should be request's to`).toBe(req.to)
              expect(step.to, `response to should be request's from`).toBe(req.from)
            }
          }
        }
      })

      it('transfer steps have no response', () => {
        for (const step of sc.steps) {
          if (step.direction === 'transfer') {
            expect(step.response, `transfer step "${step.command}" should not have response`).toBeUndefined()
          }
        }
      })
    })
  }
})
