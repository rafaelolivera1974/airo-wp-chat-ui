import { useCallback, useEffect, useRef, useState } from 'react'
import {
  INTRO_COPY,
  PLAN_COPY,
  SUMMARY_COPY,
  type AskPrompt,
  type FeedItem,
  type PlanTask,
  type ScenarioId,
} from '../lib/agentTypes'

export type AgentPhase = 'idle' | 'running' | 'complete'

export type AgentRunState = {
  phase: AgentPhase
  intro: string | null
  plan: PlanTask[] | null
  planOpen: boolean
  planNote: string | null
  planFinal: string | null
  activityOpen: boolean
  feed: FeedItem[]
  steps: number
  ask: AskPrompt | null
  summary: string | null
  scenario: ScenarioId
}

const emptyState = (scenario: ScenarioId): AgentRunState => ({
  phase: 'idle',
  intro: null,
  plan: null,
  planOpen: false,
  planNote: null,
  planFinal: null,
  activityOpen: true,
  feed: [],
  steps: 0,
  ask: null,
  summary: null,
  scenario,
})

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

type ToolRow = [
  offset: number,
  duration: number,
  running: string,
  done: string,
  detail?: string,
  kind?: 'ok' | 'warn' | 'bad',
]

export function useAgentRun(speed: number, scenario: ScenarioId) {
  const [state, setState] = useState<AgentRunState>(() => emptyState(scenario))
  const runRef = useRef(0)
  const speedRef = useRef(speed)
  const askResolver = useRef<(() => void) | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    return () => {
      if (noteTimer.current) clearTimeout(noteTimer.current)
    }
  }, [])

  const sleep = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms / speedRef.current)
    })
  }, [])

  const still = useCallback(async (ms: number, my: number) => {
    await sleep(ms)
    return my === runRef.current
  }, [sleep])

  const answerAsk = useCallback(() => {
    setState((s) => ({ ...s, ask: null }))
    askResolver.current?.()
    askResolver.current = null
  }, [])

  const togglePlan = useCallback(() => {
    setState((s) => ({ ...s, planOpen: !s.planOpen }))
  }, [])

  const toggleActivity = useCallback(() => {
    setState((s) => ({ ...s, activityOpen: !s.activityOpen }))
  }, [])

  const play = useCallback(async () => {
    const my = ++runRef.current
    const sc = scenario
    askResolver.current?.()
    askResolver.current = null
    if (noteTimer.current) clearTimeout(noteTimer.current)

    setState({
      ...emptyState(sc),
      phase: 'running',
      intro: INTRO_COPY,
      activityOpen: true,
    })

    const setPlan = (updater: (plan: PlanTask[]) => PlanTask[]) => {
      setState((s) => {
        if (!s.plan || my !== runRef.current) return s
        return { ...s, plan: updater(s.plan) }
      })
    }

    const setTask = (index: number, status: PlanTask['status']) => {
      setPlan((plan) =>
        plan.map((t, i) => (i === index ? { ...t, status } : t)),
      )
    }

    const showOrch = (tasks: string[], activateFirst = false) => {
      setState((s) => ({
        ...s,
        plan: tasks.map((text, i) => ({
          id: makeId('task'),
          text,
          status:
            activateFirst && i === 0
              ? ('active' as const)
              : ('pending' as const),
        })),
        planOpen: false,
      }))
    }

    const orchNote = (text: string) => {
      setState((s) => ({ ...s, planNote: text }))
      if (noteTimer.current) clearTimeout(noteTimer.current)
      noteTimer.current = setTimeout(() => {
        setState((s) =>
          my === runRef.current ? { ...s, planNote: null } : s,
        )
      }, 3000)
    }

    const ask = (label: string, buttons: AskPrompt['buttons']) => {
      return new Promise<void>((resolve) => {
        askResolver.current = resolve
        // Keep progress expanded until the user answers
        setState((s) => ({
          ...s,
          ask: { id: makeId('ask'), label, buttons },
          planOpen: true,
        }))
      })
    }

    const seedTools = (labels: string[]) => {
      setState((s) => {
        if (my !== runRef.current) return s
        return {
          ...s,
          feed: labels.map((text) => ({
            id: makeId('feed'),
            key: text,
            text,
            kind: 'pending' as const,
          })),
          steps: 0,
        }
      })
    }

    const startTool = (key: string) => {
      setState((s) => {
        if (my !== runRef.current) return s
        const exists = s.feed.some((row) => row.key === key)
        return {
          ...s,
          feed: exists
            ? s.feed.map((row) =>
                row.key === key ? { ...row, kind: 'run' as const } : row,
              )
            : [
                ...s.feed,
                {
                  id: makeId('feed'),
                  key,
                  text: key,
                  kind: 'run' as const,
                },
              ],
          steps: s.steps + 1,
        }
      })
    }

    const finishTool = (
      key: string,
      text: string,
      detail?: string,
      kind: 'ok' | 'warn' | 'bad' = 'ok',
    ) => {
      setState((s) => {
        if (my !== runRef.current) return s
        return {
          ...s,
          feed: s.feed.map((row) =>
            row.key === key
              ? { ...row, text, detail, kind, divider: false }
              : row,
          ),
        }
      })
    }

    const toolRow = async (
      at: number,
      dur: number,
      running: string,
      done: string,
      detail?: string,
      kind: 'ok' | 'warn' | 'bad' = 'ok',
    ) => {
      if (!(await still(at, my))) return
      startTool(running)
      if (!(await still(dur, my))) return
      finishTool(running, done, detail, kind)
    }

    const toolStream = async () => {
      if (sc === 'noplan') {
        // First value is absolute start offset (not a delta).
        const noplanRows: ToolRow[] = [
          [0, 1200, 'Reading your site…', 'Read your site'],
          [
            1400,
            1500,
            'Creating page "Services"…',
            'Created page "Services"',
          ],
          [
            3200,
            900,
            'Adding to main navigation…',
            'Added to navigation',
          ],
        ]
        seedTools(noplanRows.map((r) => r[2]))
        await Promise.all(
          noplanRows.map((r) =>
            toolRow(r[0], r[1], r[2], r[3], r[4], r[5] ?? 'ok'),
          ),
        )
        return
      }

      const rows: ToolRow[] = [
        [0, 1400, 'Reading your site…', 'Read homepage and About page'],
        [
          900,
          1200,
          'Finding your services…',
          'Found 4 services',
          'Web Design, SEO, Branding, Hosting',
        ],
        [
          1000,
          1700,
          'Writing descriptions for 4 services…',
          'Wrote descriptions for 4 services',
        ],
        [
          300,
          1500,
          'Finding images for "Web Design"…',
          'Found 3 images for "Web Design"',
        ],
        [
          200,
          1900,
          'Finding images for "SEO"…',
          'Found 3 images for "SEO"',
        ],
        [
          200,
          1300,
          'Finding images for "Branding"…',
          'Found 3 images for "Branding"',
        ],
        [
          600,
          1500,
          'Looking up team photos…',
          'Using placeholder photos',
          '',
          'warn',
        ],
        [
          900,
          1100,
          'Creating page "Services"…',
          'Created page "Services"',
        ],
        [
          700,
          900,
          'Adding to main navigation…',
          'Added to main navigation',
        ],
      ]

      if (sc === 'fail') {
        rows[4] = [
          200,
          1500,
          'Finding images for "SEO"…',
          'Image service unavailable',
          'using placeholders',
          'warn',
        ]
      }

      seedTools(rows.map((r) => r[2]))

      let acc = 0
      await Promise.all(
        rows.map((r) => {
          acc += r[0]
          return toolRow(acc, r[1], r[2], r[3], r[4], r[5] ?? 'ok')
        }),
      )
    }

    const orchStream = async () => {
      const o = async (ms: number, fn: () => void) => {
        if (!(await still(ms, my))) return false
        fn()
        return true
      }

      if (!(await o(2200, () => showOrch([...PLAN_COPY], true)))) return

      if (
        !(await o(2000, () => {
          setTask(0, 'done')
          setTask(1, 'active')
        }))
      )
        return

      if (sc === 'input') {
        if (!(await o(900, () => setTask(1, 'wait')))) return
        await ask('How should I show pricing?', [
          { id: 'prices', label: 'Show prices' },
          { id: 'contact', label: '"Contact us" instead' },
        ])
        if (my !== runRef.current) return
        setTask(1, 'active')
      }

      if (
        !(await o(2000, () => {
          if (sc === 'dynamic') {
            setPlan((plan) => {
              const next = [...plan]
              next.splice(2, 0, {
                id: makeId('task'),
                text: 'Add a pricing section',
                status: 'pending',
                isNew: true,
              })
              return next
            })
            orchNote('Plan updated · 1 task added')
            setState((s) => ({ ...s, planOpen: true }))
          }
          setTask(1, 'done')
          setTask(2, 'active')
        }))
      )
        return

      if (
        sc === 'dynamic' &&
        !(await o(2000, () => {
          setState((s) => ({ ...s, planOpen: false }))
          setTask(2, 'done')
          setTask(3, 'active')
        }))
      )
        return

      // Read latest plan length via a microtask snapshot
      let planLen = PLAN_COPY.length + (sc === 'dynamic' ? 1 : 0)
      const last = planLen - 1
      const mid = last - 1

      if (sc === 'fail') {
        if (!(await o(1800, () => setTask(mid, 'failed')))) return
        await ask("Couldn't finish the layout.", [
          { id: 'retry', label: 'Retry', primary: true },
          { id: 'skip', label: 'Skip' },
        ])
        if (my !== runRef.current) return
        setTask(mid, 'active')
      }

      if (
        !(await o(2200, () => {
          setTask(mid, 'done')
          setTask(last, 'active')
        }))
      )
        return

      await o(1800, () => setTask(last, 'done'))
    }

    const toolsPromise = toolStream().then(() => {
      // Collapse Activity as soon as the tool stream finishes
      if (my !== runRef.current) return
      setState((s) => ({ ...s, activityOpen: false }))
    })

    await Promise.all([
      toolsPromise,
      sc === 'noplan' ? Promise.resolve() : orchStream(),
    ])

    if (my !== runRef.current) return

    setState((s) => ({
      ...s,
      phase: 'complete',
      planFinal: sc !== 'noplan' ? 'Services page added' : null,
      planOpen: false,
      activityOpen: false,
      ask: null,
      summary: SUMMARY_COPY,
      plan:
        s.plan?.map((t) =>
          t.status === 'active' || t.status === 'wait' || t.status === 'failed'
            ? { ...t, status: 'done' as const }
            : t,
        ) ?? s.plan,
    }))
  }, [scenario, still])

  return {
    state,
    play,
    answerAsk,
    togglePlan,
    toggleActivity,
  }
}
