export type ScenarioId =
  | 'normal'
  | 'noplan'
  | 'dynamic'
  | 'input'
  | 'fail'

export type TaskStatus =
  | 'pending'
  | 'active'
  | 'done'
  | 'wait'
  | 'failed'
  | 'removed'
  | 'cancelled'

export type PlanTask = {
  id: string
  text: string
  status: TaskStatus
  isNew?: boolean
}

export type FeedKind = 'ok' | 'warn' | 'bad' | 'run' | 'pending'

export type FeedItem = {
  id: string
  key: string
  text: string
  detail?: string
  kind: FeedKind
  divider?: boolean
}

export type AskPrompt = {
  id: string
  label: string
  buttons: { id: string; label: string; primary?: boolean }[]
}

export type ScenarioOption = {
  id: ScenarioId
  label: string
}

export const SCENARIOS: ScenarioOption[] = [
  { id: 'normal', label: 'Happy path (parallel)' },
  { id: 'noplan', label: 'No plan (tools only)' },
  { id: 'dynamic', label: 'Plan changes mid-run' },
  { id: 'input', label: 'Plan waits on user (tools keep running)' },
  { id: 'fail', label: 'Plan task fails (tools unaffected)' },
]

export const PLAN_COPY = [
  'Understand your business & site',
  'Draft the Services page content',
  'Design layout and add images',
  'Add the page to your navigation',
] as const

export const SUMMARY_COPY =
  'I added a Services page with 4 services, images, and a link in your main navigation.'

export const INTRO_COPY =
  "Got it. I'll build a Services page that matches your site."

export const USER_SEED = 'Add a Services page to my site'

/** Happy-path completions use Undo; fail uses Retry. */
export function isHappyPathScenario(scenario: ScenarioId): boolean {
  return scenario !== 'fail'
}
