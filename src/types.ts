export type NodeRole = 'MUA' | 'MSA' | 'MTA' | 'MDA' | 'DNS'

export interface MailNode {
  id: string
  role: NodeRole
  label: string
  x: number
  y: number
}

export type StepDirection = 'client->server' | 'server->client' | 'transfer'

export interface Step {
  from: string
  to: string
  command: string
  response?: string
  direction: StepDirection
  description: string
  duration: number
  mailContent?: string
  session?: string
}

export interface Scenario {
  id: string
  name: string
  description: string
  nodes: MailNode[]
  steps: Step[]
}

export interface GlossaryItem {
  term: string
  full: string
  definition: string
  roleInAnimation: string
  nodeId?: string
}
