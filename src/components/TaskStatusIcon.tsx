import { AiroSpinner } from './AiroSpinner'
import type { FeedKind, TaskStatus } from '../lib/agentTypes'

type TaskStatusIconProps = {
  status: TaskStatus | FeedKind
  size?: number
}

export function TaskStatusIcon({ status, size = 24 }: TaskStatusIconProps) {
  // In-progress — Airo spinner (plan active step or activity running row)
  if (status === 'run' || status === 'active') {
    return <AiroSpinner size={size} />
  }

  if (status === 'done' || status === 'ok') {
    return (
      <img
        src="/assets/indicator-done.svg"
        alt=""
        width={size}
        height={size}
        className="task-status-icon"
        aria-hidden
      />
    )
  }

  // Not yet started (plan or activity) — Figma empty ring, node 4499:2706
  if (status === 'pending' || status === 'removed' || status === 'cancelled') {
    return (
      <img
        src="/assets/indicator-pending.svg"
        alt=""
        width={size}
        height={size}
        className="task-status-icon"
        style={{
          opacity: status === 'pending' ? 1 : 0.5,
        }}
        aria-hidden
      />
    )
  }

  if (status === 'wait' || status === 'warn') {
    return (
      <span
        className="task-status-glyph task-status-glyph--warn"
        style={{ width: size, height: size }}
        aria-hidden
      >
        ⚠
      </span>
    )
  }

  if (status === 'failed' || status === 'bad') {
    return (
      <span
        className="task-status-glyph task-status-glyph--bad"
        style={{ width: size, height: size }}
        aria-hidden
      >
        ✕
      </span>
    )
  }

  return (
    <img
      src="/assets/indicator-active.svg"
      alt=""
      width={size}
      height={size}
      className="task-status-icon"
      aria-hidden
    />
  )
}
