import { useEffect, useState, type RefObject } from 'react'
import { TaskStatusIcon } from './TaskStatusIcon'
import type { FeedItem, PlanTask } from '../lib/agentTypes'
import './AgentCards.css'

const BAR_FADE_MS = 450

type ProgressCardProps = {
  plan: PlanTask[]
  open: boolean
  note: string | null
  finalTitle: string | null
  onToggle: () => void
}

function getProgressMeta(plan: PlanTask[], finalTitle: string | null) {
  const live = plan.filter((t) => t.status !== 'removed')
  const done = live.filter((t) => t.status === 'done').length
  const current =
    live.find((t) => t.status === 'active') ||
    live.find((t) => t.status === 'wait') ||
    live.find((t) => t.status === 'failed')
  const title = current?.text ?? finalTitle ?? 'Done'
  const shown = Math.min(done + (current ? 1 : 0), live.length)
  const pct = live.length === 0 ? 0 : (done / live.length) * 100
  const cancelled = live.filter((t) => t.status === 'cancelled').length
  const headStatus =
    current?.status ??
    (cancelled > 0 && done + cancelled === live.length ? 'cancelled' : 'done')
  const complete =
    !!finalTitle ||
    (live.length > 0 && !current && (done === live.length || cancelled > 0))

  return { title, count: `${shown} of ${live.length}`, pct, headStatus, complete }
}

export function ProgressCard({
  plan,
  open,
  note,
  finalTitle,
  onToggle,
}: ProgressCardProps) {
  const { title, count, pct, headStatus, complete } = getProgressMeta(
    plan,
    finalTitle,
  )
  const [showBar, setShowBar] = useState(true)

  useEffect(() => {
    if (!complete) {
      setShowBar(true)
      return
    }
    const timer = setTimeout(() => setShowBar(false), BAR_FADE_MS)
    return () => clearTimeout(timer)
  }, [complete])

  return (
    <section
      className={`agent-card agent-card--progress${open ? ' is-open' : ''}${complete ? ' is-complete' : ''}`}
      aria-label="Progress"
    >
      <button
        type="button"
        className="agent-card__head agent-card__head--progress"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="agent-card__icon">
          <TaskStatusIcon status={headStatus} size={24} />
        </span>
        <span className="agent-card__title agent-card__title--step" key={title}>
          {title}
        </span>
        <span className="agent-card__count">{count}</span>
        <span className={`agent-card__chev${open ? ' is-open' : ''}`} aria-hidden>
          ▾
        </span>
      </button>

      {showBar ? (
        <div
          className={`agent-card__bar${complete ? ' is-complete' : ''}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label="Plan progress"
          aria-hidden={complete}
        >
          <i style={{ width: `${pct}%` }} />
        </div>
      ) : null}

      {note ? <p className="agent-card__note">{note}</p> : null}

      {open ? (
        <ul className="agent-card__list">
          {plan.map((task) => (
            <li
              key={task.id}
              className={`agent-card__item is-${task.status}${task.isNew ? ' is-new' : ''}`}
            >
              <span className="agent-card__icon">
                <TaskStatusIcon status={task.status} size={24} />
              </span>
              <span className="agent-card__text">
                {task.text}
                {task.status === 'wait' ? ' — waiting for you' : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

type ActivityCardProps = {
  feed: FeedItem[]
  steps: number
  open: boolean
  onToggle: () => void
  feedRef?: RefObject<HTMLUListElement | null>
}

export function ActivityCard({
  feed,
  steps,
  open,
  onToggle,
  feedRef,
}: ActivityCardProps) {
  return (
    <section
      className={`agent-card${open ? ' is-open' : ''}`}
      aria-label="Activity"
    >
      <button
        type="button"
        className="agent-card__head"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="agent-card__title">
          Activity
          {steps > 0 ? (
            <span className="agent-card__count"> · {steps} steps</span>
          ) : null}
        </span>
        <span className={`agent-card__chev${open ? ' is-open' : ''}`} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul className="agent-card__list agent-card__feed" ref={feedRef}>
          {feed.map((row) =>
            row.divider ? (
              <li key={row.id} className="agent-card__divider">
                — {row.text} —
              </li>
            ) : (
              <li
                key={row.id}
                className={`agent-card__item is-${row.kind}`}
              >
                <span className="agent-card__icon">
                  <TaskStatusIcon status={row.kind} size={24} />
                </span>
                <span className="agent-card__text">
                  {row.text}
                  {row.detail ? (
                    <span className="agent-card__detail"> {row.detail}</span>
                  ) : null}
                </span>
              </li>
            ),
          )}
        </ul>
      ) : null}
    </section>
  )
}
