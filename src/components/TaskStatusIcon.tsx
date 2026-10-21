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

  // Not yet started — Figma empty ring, node 4499:2706
  if (status === 'pending' || status === 'removed') {
    return (
      <img
        src="/assets/indicator-pending.svg"
        alt=""
        width={size}
        height={size}
        className="task-status-icon"
        style={{ opacity: status === 'pending' ? 1 : 0.5 }}
        aria-hidden
      />
    )
  }

  if (status === 'cancelled') {
    return (
      <span
        className="task-status-glyph task-status-glyph--cancelled"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="11.5"
            stroke="currentColor"
            strokeOpacity="0.35"
          />
          <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" />
        </svg>
      </span>
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
