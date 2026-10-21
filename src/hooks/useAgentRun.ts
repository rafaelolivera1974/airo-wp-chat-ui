import { useCallback, useEffect, useRef, useState } from 'react'
import {
  INTRO_COPY,
  PLAN_COPY,
  RESUME_COPY,
  STOPPED_COPY,
  SUMMARY_COPY,
  isContinueMessage,
  type AskPrompt,
  type ChatMessage,
  type FeedItem,
  type PlanTask,
  type ScenarioId,
} from '../lib/agentTypes'

export type AgentPhase = 'idle' | 'running' | 'complete' | 'stopped'

/** Frozen plan/activity cards from a prior segment. */
export type CardArchive = {
  id: string
  plan: PlanTask[] | null
  planFinal: string | null
  planOpen: boolean
  feed: FeedItem[]
  steps: number
  activityOpen: boolean
}

export type TimelineEntry =
  | { id: string; type: 'archive'; archive: CardArchive }
  | { id: string; type: 'message'; role: ChatMessage['role']; body: string }

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
  /** Interleaved frozen cards + chat (stop notices, Continue, etc.). */
  timeline: TimelineEntry[]
  /**
   * After the first Continue, live cards render below the timeline.
   * Before that, they render above it (right after intro).
   */
  cardsAfterMessages: boolean
  /** Live segment is active (running/complete cards for this segment). */
  liveCards: boolean
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
  timeline: [],
  cardsAfterMessages: false,
  liveCards: false,
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

function toolRowsFor(sc: ScenarioId): ToolRow[] {
  if (sc === 'noplan') {
    return [
      [0, 1200, 'Reading your site…', 'Read your site'],
      [1400, 1500, 'Creating page "Services"…', 'Created page "Services"'],
      [3200, 900, 'Adding to main navigation…', 'Added to navigation'],
    ]
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
    [900, 1100, 'Creating page "Services"…', 'Created page "Services"'],
    [700, 900, 'Adding to main navigation…', 'Added to main navigation'],
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

  return rows
}

function feedFromRows(rows: ToolRow[]): FeedItem[] {
  return rows.map((r) => ({
    id: makeId('feed'),
    key: r[2],
    text: r[2],
    doneText: r[3],
    doneDetail: r[4],
    doneKind: r[5] ?? 'ok',
    kind: 'pending' as const,
  }))
}

export function useAgentRun(speed: number, scenario: ScenarioId) {
  const [state, setState] = useState<AgentRunState>(() => emptyState(scenario))
  const runRef = useRef(0)
  const speedRef = useRef(speed)
  const askResolver = useRef<(() => void) | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef(state)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    stateRef.current = state
  }, [state])

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

  const still = useCallback(
    async (ms: number, my: number) => {
      await sleep(ms)
      return my === runRef.current
    },
    [sleep],
  )

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

  const toggleArchivePlan = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      timeline: s.timeline.map((entry) =>
        entry.type === 'archive' && entry.archive.id === id
          ? {
              ...entry,
              archive: { ...entry.archive, planOpen: !entry.archive.planOpen },
            }
          : entry,
      ),
    }))
  }, [])

  const toggleArchiveActivity = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      timeline: s.timeline.map((entry) =>
        entry.type === 'archive' && entry.archive.id === id
          ? {
              ...entry,
              archive: {
                ...entry.archive,
                activityOpen: !entry.archive.activityOpen,
              },
            }
          : entry,
      ),
    }))
  }, [])

  const stop = useCallback(() => {
    runRef.current += 1
    askResolver.current?.()
    askResolver.current = null
    if (noteTimer.current) clearTimeout(noteTimer.current)

    setState((s) => {
      if (s.phase !== 'running' || !s.liveCards) return s

      const frozenPlan =
        s.plan?.map((t) => {
          if (t.status === 'done') return t
          if (
            t.status === 'active' ||
            t.status === 'wait' ||
            t.status === 'failed' ||
            t.status === 'pending'
          ) {
            return { ...t, status: 'cancelled' as const }
          }
          return t
        }) ?? null

      const frozenFeed = s.feed.map((row) => {
        if (row.kind === 'run' || row.kind === 'pending') {
          return { ...row, kind: 'cancelled' as const }
        }
        return row
      })

      const archive: CardArchive = {
        id: makeId('archive'),
        plan: frozenPlan,
        planFinal: 'Stopped',
        planOpen: false,
        feed: frozenFeed,
        steps: s.steps,
        activityOpen: false,
      }

      return {
        ...s,
        phase: 'stopped',
        ask: null,
        planNote: null,
        planFinal: null,
        planOpen: false,
        activityOpen: false,
        summary: null,
        liveCards: false,
        plan: null,
        feed: [],
        steps: 0,
        timeline: [
          ...s.timeline,
          { id: makeId('tl'), type: 'archive', archive },
          {
            id: makeId('tl'),
            type: 'message',
            role: 'ai',
            body: STOPPED_COPY,
          },
        ],
      }
    })
  }, [])

  const appendMessage = useCallback((role: ChatMessage['role'], body: string) => {
    setState((s) => ({
      ...s,
      timeline: [
        ...s.timeline,
        { id: makeId('tl'), type: 'message', role, body },
      ],
    }))
  }, [])

  const finishRun = useCallback((my: number, sc: ScenarioId) => {
    if (my !== runRef.current) return
    setState((s) => ({
      ...s,
      phase: 'complete',
      planFinal: sc !== 'noplan' && s.plan ? 'Services page added' : null,
      planOpen: false,
      activityOpen: false,
      ask: null,
      summary: SUMMARY_COPY,
      plan:
        s.plan?.map((t) =>
          t.status === 'active' ||
          t.status === 'wait' ||
          t.status === 'failed' ||
          t.status === 'cancelled' ||
          t.status === 'pending'
            ? { ...t, status: 'done' as const }
            : t,
        ) ?? s.plan,
      feed: s.feed.map((row) =>
        row.kind === 'run' || row.kind === 'pending' || row.kind === 'cancelled'
          ? {
              ...row,
              text: row.doneText ?? row.text,
              detail: row.doneDetail,
              kind: (row.doneKind ?? 'ok') as FeedItem['kind'],
            }
          : row,
      ),
    }))
  }, [])

  const runRemaining = useCallback(
    async (
      my: number,
      sc: ScenarioId,
      pendingFeedKeys: string[],
      planCount: number,
    ) => {
      const startTool = (key: string) => {
        setState((s) => {
          if (my !== runRef.current) return s
          return {
            ...s,
            feed: s.feed.map((row) =>
              row.key === key ? { ...row, kind: 'run' as const, text: key } : row,
            ),
            steps: s.steps + 1,
          }
        })
      }

      const finishTool = (key: string) => {
        setState((s) => {
          if (my !== runRef.current) return s
          return {
            ...s,
            feed: s.feed.map((row) =>
              row.key === key
                ? {
                    ...row,
                    text: row.doneText ?? row.text,
                    detail: row.doneDetail,
                    kind: (row.doneKind ?? 'ok') as FeedItem['kind'],
                  }
                : row,
            ),
          }
        })
      }

      await Promise.all(
        pendingFeedKeys.map(async (key, i) => {
          if (!(await still(i * 450, my))) return
          startTool(key)
          if (!(await still(1100, my))) return
          finishTool(key)
        }),
      )

      if (my !== runRef.current) return

      setState((s) => ({ ...s, activityOpen: false }))

      for (let idx = 0; idx < planCount; idx++) {
        if (!(await still(idx === 0 ? 400 : 1400, my))) return
        setState((s) => {
          if (!s.plan || my !== runRef.current) return s
          return {
            ...s,
            plan: s.plan.map((t, i) => {
              if (i === idx) return { ...t, status: 'active' as const }
              if (i < idx) return { ...t, status: 'done' as const }
              return t
            }),
          }
        })
        if (!(await still(1200, my))) return
        setState((s) => {
          if (!s.plan || my !== runRef.current) return s
          return {
            ...s,
            plan: s.plan.map((t, i) =>
              i === idx ? { ...t, status: 'done' as const } : t,
            ),
          }
        })
      }

      finishRun(my, sc)
    },
    [finishRun, still],
  )

  const resume = useCallback(async () => {
    const snap = stateRef.current
    if (snap.phase !== 'stopped') return

    const my = ++runRef.current
    const sc = snap.scenario
    askResolver.current?.()
    askResolver.current = null
    if (noteTimer.current) clearTimeout(noteTimer.current)

    // Remaining work lives on the latest archived (stopped) segment
    const archives = snap.timeline
      .filter((e): e is Extract<TimelineEntry, { type: 'archive' }> => e.type === 'archive')
      .map((e) => e.archive)
    const last = archives[archives.length - 1]
    const cancelledFeed = last?.feed.filter((row) => row.kind === 'cancelled') ?? []
    const cancelledPlan =
      last?.plan?.filter((t) => t.status === 'cancelled') ?? []

    const pendingFeedKeys = cancelledFeed.map((row) => row.key)
    const newFeed: FeedItem[] = cancelledFeed.map((row) => ({
      ...row,
      id: makeId('feed'),
      kind: 'pending' as const,
      text: row.key,
      detail: undefined,
    }))

    let newPlan: PlanTask[] | null =
      cancelledPlan.length > 0
        ? cancelledPlan.map((t, i) => ({
            ...t,
            id: makeId('task'),
            status: (i === 0 ? 'active' : 'pending') as PlanTask['status'],
          }))
        : null

    if (sc === 'noplan') newPlan = null

    setState((s) => ({
      ...s,
      phase: 'running',
      planFinal: null,
      summary: null,
      ask: null,
      planNote: null,
      planOpen: false,
      activityOpen: true,
      cardsAfterMessages: true,
      liveCards: true,
      plan: newPlan,
      feed: newFeed,
      steps: 0,
    }))

    if (!(await still(80, my))) return
    await runRemaining(my, sc, pendingFeedKeys, newPlan?.length ?? 0)
  }, [runRemaining, still])

  const sendMessage = useCallback(
    async (text: string) => {
      const body = text.trim()
      if (!body) return

      appendMessage('user', body)

      const snap = stateRef.current
      if (snap.phase === 'stopped' && isContinueMessage(body)) {
        appendMessage('ai', RESUME_COPY)
        await resume()
        return
      }

      if (snap.phase === 'running') return

      // Idle / complete: acknowledge non-continue messages lightly
      if (!isContinueMessage(body)) {
        appendMessage(
          'ai',
          "Got it — use the scenario controls' Play to start a fresh run, or send Continue after stopping to pick up where you left off.",
        )
      } else if (snap.phase === 'complete' || snap.phase === 'idle') {
        appendMessage('ai', 'Nothing left to continue — hit Play for a fresh run.')
      }
    },
    [appendMessage, resume],
  )

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
      liveCards: true,
      cardsAfterMessages: false,
      timeline: [],
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
        setState((s) => ({
          ...s,
          ask: { id: makeId('ask'), label, buttons },
          planOpen: true,
        }))
      })
    }

    const seedTools = (rows: ToolRow[]) => {
      setState((s) => {
        if (my !== runRef.current) return s
        return {
          ...s,
          feed: feedFromRows(rows),
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
      const rows = toolRowsFor(sc)
      seedTools(rows)

      if (sc === 'noplan') {
        await Promise.all(
          rows.map((r) =>
            toolRow(r[0], r[1], r[2], r[3], r[4], r[5] ?? 'ok'),
          ),
        )
        return
      }

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

      const planLen = PLAN_COPY.length + (sc === 'dynamic' ? 1 : 0)
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
      if (my !== runRef.current) return
      setState((s) => ({ ...s, activityOpen: false }))
    })

    await Promise.all([
      toolsPromise,
      sc === 'noplan' ? Promise.resolve() : orchStream(),
    ])

    finishRun(my, sc)
  }, [finishRun, scenario, still])

  return {
    state,
    play,
    stop,
    resume,
    sendMessage,
    answerAsk,
    togglePlan,
    toggleActivity,
    toggleArchivePlan,
    toggleArchiveActivity,
  }
}
